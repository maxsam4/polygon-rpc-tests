import { Router } from 'express';
import { loadConfig } from '../services/storage.js';

const router = Router();

// GET /api/benchmark/endpoints - Get all endpoints with page settings (unmasked URLs needed for polling and display)
router.get('/endpoints', async (req, res) => {
  try {
    const config = await loadConfig();
    // Return all endpoints - let the frontend filter by showInBenchmark or showInProviders as needed
    // URLs are NOT masked because the frontend needs them to make RPC calls and display
    // The UI handles hiding sensitive URLs based on the sensitive flag
    res.json({
      endpoints: config.endpoints,
      pageSettings: config.pageSettings
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load endpoints' });
  }
});

export default router;
