import { Hono, type Context, type ErrorHandler } from 'hono';
import { cors } from 'hono/cors';
import { serveStatic } from 'hono/bun';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { initDatabase } from './db';
import productsRouter from './products';

dotenv.config();

// Initialize database schema
initDatabase();

const app = new Hono();
const PORT = Number(process.env.PORT) || 3005;
const uploadsRoot = path.resolve(process.cwd(), 'uploads');

// Ensure uploads directories exist
fs.mkdirSync(path.join(uploadsRoot, 'products'), { recursive: true });

// CORS middleware
app.use(
  '/*',
  cors({
    origin: ['http://localhost:5173'], // Vite frontend
    credentials: true,
  })
);

// Static files for uploads
app.use(
  '/uploads/*',
  serveStatic({
    root: uploadsRoot,
    rewriteRequestPath: (pathStr) =>
      pathStr
        .replace(/^\/uploads\//, '')
        .replace(/^\/+/, ''),
  })
);

app.get('/health', (c: Context) => {
  return c.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
  });
});

// Register products router
app.route('/api', productsRouter);

// Error handler
const errorHandler: ErrorHandler = (err: Error, c: Context) => {
  console.error(err.stack);
  return c.json(
    {
      error: 'Something went wrong!',
      message: err.message,
    },
    500
  );
};

app.onError(errorHandler);

// Export the app for Bun's watch mode to handle server lifecycle
export default {
  fetch: app.fetch,
  port: PORT,
};
