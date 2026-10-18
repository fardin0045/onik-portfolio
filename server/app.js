
import express from 'express';
import { createApp } from './src/app.js';
import { connectDB } from './src/config/db.js';

// Vercel Express entry point.
// Keep the original Render/local server unchanged.
const app = express();

let dbPromise = null;

// Initialize MongoDB once per warm function instance.
// Retry the connection if initialization fails.
app.use(async (_req, _res, next) => {
  try {
    if (!dbPromise) {
      dbPromise = connectDB().catch((error) => {
        dbPromise = null;
        throw error;
      });
    }

    await dbPromise;
    next();
  } catch (error) {
    next(error);
  }
});

// Preserve your existing routes, auth, CSRF,
// Helmet, CORS and application error handlers.
app.use(createApp());

// Catch errors from database initialization.
app.use((error, _req, res, next) => {
  console.error('Backend initialization failed:', error);

  if (res.headersSent) return next(error);

  res.status(503).json({
    error: 'Service temporarily unavailable',
  });
});

export default app;
