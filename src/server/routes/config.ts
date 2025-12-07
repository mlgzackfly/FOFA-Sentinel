import { Router } from 'express';
import { getDatabase } from '../db/index.js';

export const configRoutes = Router();

configRoutes.get('/key', (req, res) => {
  try {
    const db = getDatabase();
    const config = db
      .prepare(
        'SELECT email, api_key, created_at, updated_at FROM api_config ORDER BY updated_at DESC LIMIT 1'
      )
      .get() as
      | { email: string | null; api_key: string; created_at: string; updated_at: string }
      | undefined;

    if (!config) {
      return res.json({ api_key: null, has_key: false });
    }

    const maskedKey =
      config.api_key.length > 4
        ? '*'.repeat(config.api_key.length - 4) + config.api_key.slice(-4)
        : '****';

    res.json({
      api_key: maskedKey,
      has_key: true,
      created_at: config.created_at,
      updated_at: config.updated_at,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    console.error('Get config error:', error);
    res.status(500).json({ error: errorMessage });
  }
});

configRoutes.post('/key', (req, res) => {
  try {
    const db = getDatabase();
    const { api_key } = req.body;

    if (!api_key) {
      return res.status(400).json({ error: 'api_key is required' });
    }

    const existing = db.prepare('SELECT id FROM api_config ORDER BY updated_at DESC LIMIT 1').get();

    if (existing) {
      const existingConfig = existing as { id: number };
      db.prepare(
        'UPDATE api_config SET api_key = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
      ).run(api_key, existingConfig.id);
    } else {
      db.prepare('INSERT INTO api_config (api_key) VALUES (?)').run(api_key);
    }

    res.json({ success: true });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    console.error('Save config error:', error);
    res.status(500).json({ error: errorMessage });
  }
});
