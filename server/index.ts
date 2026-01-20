import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import resultsRouter from './routes/results.js';
import configRouter from './routes/config.js';
import testsRouter from './routes/tests.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// API routes
app.use('/api/results', resultsRouter);
app.use('/api/config', configRouter);
app.use('/api/tests', testsRouter);

// Serve static files in production
const staticPath = path.join(__dirname, '../web/dist');
app.use(express.static(staticPath));

// SPA fallback - use named wildcard for path-to-regexp v8+ compatibility
app.get('/{*path}', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(staticPath, 'index.html'));
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
