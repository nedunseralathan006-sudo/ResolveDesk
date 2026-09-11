import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDatabaseAsync } from './db/database.js';
import authRoutes from './routes/auth.js';
import complaintRoutes from './routes/complaints.js';
import assignmentRoutes from './routes/assignments.js';
import escalationRoutes from './routes/escalations.js';
import feedbackRoutes from './routes/feedback.js';
import dashboardRoutes from './routes/dashboard.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env file if available (Node 20.12+)
try { process.loadEnvFile(); } catch (e) { /* .env is optional */ }

const app = express();
const PORT = process.env.PORT || 3001;

// Global middleware
app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'customer-complaint-management-system' });
});

// --- API Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/complaints', assignmentRoutes);
app.use('/api/complaints', escalationRoutes);
app.use('/api/complaints', feedbackRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Simple categories route (no auth required for listing)
app.get('/api/categories', async (req, res) => {
  try {
    const { getDb } = await import('./db/database.js');
    const db = getDb();
    res.json(db.prepare('SELECT * FROM categories ORDER BY name ASC').all());
  } catch (e) {
    res.status(500).json({ error: 'Failed to load categories' });
  }
});


// --- Serve frontend (production build) ---
const distPath = path.join(__dirname, '..', 'dist');
app.use(express.static(distPath));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(distPath, 'index.html'), (err) => {
    if (err) next();
  });
});

// --- Global error handler ---
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ error: 'An unexpected error occurred. Please try again later.' });
});

// --- Initialize database then start server ---
async function start() {
  try {
    await initDatabaseAsync();
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();

export default app;
