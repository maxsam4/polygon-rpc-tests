import { Router } from 'express';
import { loadConfig, saveConfig, maskSensitiveConfig } from '../services/storage.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/', requireAuth, async (req, res) => {
  try {
    const config = await loadConfig();
    // Mask sensitive URLs even for authenticated users
    res.json(maskSensitiveConfig(config));
  } catch (error) {
    res.status(500).json({ error: 'Failed to load config' });
  }
});

router.put('/', requireAuth, async (req, res) => {
  try {
    await saveConfig(req.body);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save config' });
  }
});

export default router;
