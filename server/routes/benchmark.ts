import { Router } from 'express';
import { loadConfig, maskSensitiveConfig } from '../services/storage.js';

const router = Router();

// GET /api/benchmark/endpoints - Get endpoints for benchmark (public, masked)
router.get('/endpoints', async (req, res) => {
  try {
    const config = await loadConfig();
    const maskedConfig = maskSensitiveConfig(config);
    // Return only endpoints that have showInBenchmark enabled (or not explicitly disabled)
    const benchmarkEndpoints = maskedConfig.endpoints.filter(
      (ep) => ep.showInBenchmark !== false
    );
    res.json({ endpoints: benchmarkEndpoints });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load endpoints' });
  }
});

export default router;
