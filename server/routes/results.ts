import { Router } from 'express';
import { loadResults, maskSensitiveResults } from '../services/storage.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const results = await loadResults();
    if (!results) {
      res.json({ lastRun: null, endpoints: {} });
      return;
    }
    res.json(maskSensitiveResults(results));
  } catch (error) {
    res.status(500).json({ error: 'Failed to load results' });
  }
});

export default router;
