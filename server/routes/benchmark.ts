import { Router } from 'express';
import { loadConfig } from '../services/storage.js';

const router = Router();

// GET /api/benchmark/endpoints - Get endpoints for benchmark (unmasked URLs needed for polling)
router.get('/endpoints', async (req, res) => {
  try {
    const config = await loadConfig();
    // Return only endpoints that have showInBenchmark enabled (or not explicitly disabled)
    // URLs are NOT masked because the frontend needs them to make RPC calls
    // The UI handles hiding sensitive URLs based on the sensitive flag
    const benchmarkEndpoints = config.endpoints.filter(
      (ep) => ep.showInBenchmark !== false
    );
    res.json({ endpoints: benchmarkEndpoints });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load endpoints' });
  }
});

export default router;
