import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB } from './config/db.js';
import { dbService } from './services/dbService.js';
import { demoPeople } from './data/demoData.js';

import personRoutes from './routes/personRoutes.js';
import analyzeRoutes from './routes/analyzeRoutes.js';
import analysisRoutes from './routes/analysisRoutes.js';
import rulesRoutes from './routes/rulesRoutes.js';
import statusRoutes from './routes/statusRoutes.js';
import authRoutes from './routes/authRoutes.js';
import queueRoutes from './routes/queueRoutes.js';
import queueEntryRoutes from './routes/queueEntryRoutes.js';
import auditRoutes from './routes/auditRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import organizationRoutes from './routes/organizationRoutes.js';
import { seedDemoEnvironment } from './data/demoSeed.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware - Enable CORS with Credentials for SaaS Cookie/Token Persistence
app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[HTTP] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// Root API Status Endpoint
app.get('/api', (req, res) => {
  res.json({
    project: 'FAIRQUEUE',
    title: 'Intelligent Queue Fairness Analyzer',
    paradigms: 'Logic Programming / Declarative Rule-Based Expert System',
    status: 'online',
    version: '2.0.0-enterprise',
    endpoints: [
      '/api/auth',
      '/api/organizations',
      '/api/queues',
      '/api/queues/:queueId/entries',
      '/api/audit',
      '/api/reports',
      '/api/people',
      '/api/analyze',
      '/api/analyses',
      '/api/rules',
      '/api/status',
    ],
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/organizations', organizationRoutes);
app.use('/api/queues', queueRoutes);
app.use('/api/queues/:queueId/entries', queueEntryRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/people', personRoutes);
app.use('/api/analyze', analyzeRoutes);
app.use('/api/analyses', analysisRoutes);
app.use('/api/rules', rulesRoutes);
app.use('/api/status', statusRoutes);

// Serve static frontend build from server/public or client/dist
const distInServer = path.resolve(__dirname, 'public');
const distInClient = path.resolve(__dirname, '..', 'client', 'dist');

if (fs.existsSync(distInServer)) {
  app.use(express.static(distInServer));
}
if (fs.existsSync(distInClient)) {
  app.use(express.static(distInClient));
}

// SPA fallback for all frontend routes (e.g. /, /login, /register, /dashboard)
app.get('*', (req, res, next) => {
  if (req.originalUrl.startsWith('/api')) {
    return res.status(404).json({
      success: false,
      error: `API route '${req.method} ${req.originalUrl}' not found.`,
    });
  }

  const indexPath = fs.existsSync(path.join(distInServer, 'index.html'))
    ? path.join(distInServer, 'index.html')
    : path.join(distInClient, 'index.html');

  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath, (err) => {
      if (err) {
        console.error('[Static Error] Failed to serve index.html:', err.message);
        if (!res.headersSent) {
          res.status(500).send('Error loading FAIRQUEUE application.');
        }
      }
    });
  }

  res.status(404).send('FAIRQUEUE client build not found. Please run `npm run build` in the client directory.');
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Unhandled Error]', err);
  res.status(500).json({
    success: false,
    error: 'An internal server error occurred.',
    message: err.message || 'Unknown error',
  });
});

// Start Server
async function startServer() {
  await connectDB();

  // Pre-seed demo environment (CityCare Service Centre)
  try {
    await seedDemoEnvironment();
  } catch (err) {
    console.warn('[Seed] Notice during demo environment initialization:', err.message);
  }

  app.listen(PORT, () => {
    console.log(`================================================================`);
    console.log(` FAIRQUEUE Backend & Prolog Inference Server running!`);
    console.log(` Server URL : http://localhost:${PORT}`);
    console.log(` Status API : http://localhost:${PORT}/api/status`);
    console.log(`================================================================`);
  });
}

startServer();
