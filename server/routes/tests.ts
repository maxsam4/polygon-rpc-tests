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

export default router;
