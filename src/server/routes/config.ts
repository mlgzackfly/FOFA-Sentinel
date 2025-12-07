import { Router } from 'express';
import { getDatabase } from '../db/index.js';

export const configRoutes = Router();

configRoutes.get('/key', (req, res) => {
  try {
    const db = getDatabase();
    const config = db
      .prepare('SELECT email, api_key, created_at, updated_at FROM api_config ORDER BY updated_at DESC LIMIT 1')
      .get() as { email: string | null; api_key: string; created_at: string; updated_at: string } | undefined;

    if (!config) {
      return res.json({ email: null, api_key: null, has_key: false });
    }

    const maskedKey = config.api_key.length > 4
      ? '*'.repeat(config.api_key.length - 4) + config.api_key.slice(-4)
      : '****';

    res.json({
      email: config.email,
      api_key: maskedKey,
      has_key: true,
      created_at: config.created_at,
      updated_at: config.updated_at,
    });
  } catch (error: any) {
    console.error('Get config error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

configRoutes.post('/key', (req, res) => {
  try {
    const db = getDatabase();
    const { api_key, email } = req.body;

    if (!api_key) {
      return res.status(400).json({ error: 'api_key is required' });
    }

    const existing = db.prepare('SELECT id FROM api_config ORDER BY updated_at DESC LIMIT 1').get();

    if (existing) {
      db.prepare('UPDATE api_config SET api_key = ?, email = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
        .run(api_key, email || null, (existing as any).id);
    } else {
      db.prepare('INSERT INTO api_config (api_key, email) VALUES (?, ?)')
        .run(api_key, email || null);
    }

    res.json({ success: true });
  } catch (error: any) {
    console.error('Save config error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

