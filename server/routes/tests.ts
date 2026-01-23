import { Router } from 'express';
import { loadConfig } from '../services/storage.js';
import { runTests, isTestRunning, getCurrentProgress } from '../services/testRunner.js';
import { requireAuth } from '../middleware/auth.js';
import type { ProgressEvent } from '../../shared/types.js';

const router = Router();

// Store SSE clients
const clients: Set<{
  id: number;
  res: any;
}> = new Set();

let clientIdCounter = 0;

// Store last test run times per IP for rate limiting (IP -> timestamp)
const publicTestRunTimes: Map<string, number> = new Map();
const PUBLIC_TEST_COOLDOWN_MS = 60 * 60 * 1000; // 1 hour

function broadcastProgress(event: ProgressEvent): void {
  const data = `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`;
  for (const client of clients) {
    client.res.write(data);
  }
}

router.get('/status', (req, res) => {
  res.json({
    running: isTestRunning(),
    progress: getCurrentProgress(),
  });
});

router.get('/progress', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const clientId = ++clientIdCounter;
  const client = { id: clientId, res };
  clients.add(client);

  // Send initial status
  res.write(`event: status\ndata: ${JSON.stringify({ running: isTestRunning() })}\n\n`);

  req.on('close', () => {
    clients.delete(client);
  });
});

router.post('/run', requireAuth, async (req, res) => {
  if (isTestRunning()) {
    res.status(409).json({ error: 'Tests are already running' });
    return;
  }

  try {
    const config = await loadConfig();

    // Start tests in background
    runTests(config, broadcastProgress).catch(err => {
      console.error('Test run failed:', err);
    });

    res.json({ success: true, message: 'Test run started' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to start tests' });
  }
});

router.post('/run-public', async (req, res) => {
  // Get client IP
  const clientIp = req.ip || req.socket.remoteAddress || 'unknown';

  // Check if tests are already running
  if (isTestRunning()) {
    res.status(409).json({ error: 'Tests are already running. Please wait for the current test sequence to complete.' });
    return;
  }

  // Check rate limit
  const lastRunTime = publicTestRunTimes.get(clientIp);
  const now = Date.now();

  if (lastRunTime) {
    const timeSinceLastRun = now - lastRunTime;
    if (timeSinceLastRun < PUBLIC_TEST_COOLDOWN_MS) {
      const remainingMs = PUBLIC_TEST_COOLDOWN_MS - timeSinceLastRun;
      const remainingMinutes = Math.ceil(remainingMs / (60 * 1000));
      res.status(429).json({
        error: 'Rate limit exceeded',
        message: `You can run tests once per hour. Please wait ${remainingMinutes} more minute${remainingMinutes !== 1 ? 's' : ''}.`,
        remainingMs
      });
      return;
    }
  }

  try {
    const config = await loadConfig();

    // Update last run time for this IP
    publicTestRunTimes.set(clientIp, now);

    // Clean up old entries (older than cooldown period)
    for (const [ip, timestamp] of publicTestRunTimes.entries()) {
      if (now - timestamp > PUBLIC_TEST_COOLDOWN_MS) {
        publicTestRunTimes.delete(ip);
      }
    }

    // Start tests in background
    runTests(config, broadcastProgress).catch(err => {
      console.error('Test run failed:', err);
    });

    res.json({ success: true, message: 'Test sequence launched successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to start tests' });
  }
});

export default router;
