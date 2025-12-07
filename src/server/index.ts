import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';
import { initDatabase } from './db/index.js';
import { fofaRoutes } from './routes/fofa.js';
import { historyRoutes } from './routes/history.js';
import { configRoutes } from './routes/config.js';
import { pocRoutes } from './routes/poc.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(express.json());

initDatabase();

// API routes
app.use('/api/fofa', fofaRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/config', configRoutes);
app.use('/api/poc', pocRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve static files from React app (in production)
const clientDistPath = path.join(__dirname, '../../client');

// Check if client dist exists (for production builds)
if (existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));

  // Serve React app for all non-API routes
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  // Server started
});
