import { Router } from 'express';
import { loadResults } from '../services/storage.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const results = await loadResults();
    if (!results) {
      res.json({ lastRun: null, endpoints: {} });
      return;
    }
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load results' });
  }
});

export default router;
