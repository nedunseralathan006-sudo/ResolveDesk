import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDb, saveDb } from '../db/database.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'complaint-mgmt-jwt-secret-key-2024';

router.post('/register', (req, res) => {
  const { username, full_name, email, password } = req.body;
  if (!username || !full_name || !email || !password) {
    return res.status(400).json({ error: 'Username, full name, email, and password are required.' });
  }
  if (username.trim().length < 3) {
    return res.status(400).json({ error: 'Username must be at least 3 characters.' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters.' });
  }
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  }

  try {
    const db = getDb();
    const existing = db.prepare('SELECT id FROM users WHERE lower(username) = lower(?) OR lower(email) = lower(?)').get(username.trim(), email.trim());
    if (existing) return res.status(409).json({ error: 'That username or email is already registered.' });

    const passwordHash = bcrypt.hashSync(password, 10);
    const result = db.prepare(
      'INSERT INTO users (username, password, full_name, email, phone, role) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(username.trim(), passwordHash, full_name.trim(), email.trim().toLowerCase(), '', 'customer');
    saveDb();
    res.status(201).json({ user: { id: result.lastInsertRowid, username: username.trim(), full_name: full_name.trim(), email: email.trim().toLowerCase(), role: 'customer' } });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { identifier, username, email, password } = req.body;
  const loginIdentifier = identifier || email || username;
  if (!loginIdentifier || !password) {
    return res.status(400).json({ error: 'Email or username and password are required.' });
  }

  try {
    const db = getDb();
    const user = db.prepare('SELECT * FROM users WHERE username = ? OR lower(email) = lower(?)').get(loginIdentifier, loginIdentifier);

    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    const payload = { id: user.id, username: user.username, full_name: user.full_name, role: user.role };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });

    res.json({
      token,
      user: { id: user.id, username: user.username, full_name: user.full_name, email: user.email, role: user.role }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

// GET /api/auth/me
router.get('/me', authenticate, (req, res) => {
  try {
    const db = getDb();
    const user = db.prepare(
      'SELECT id, username, full_name, email, phone, role, created_at FROM users WHERE id = ?'
    ).get(req.user.id);

    if (!user) return res.status(404).json({ error: 'User not found.' });
    res.json(user);
  } catch (error) {
    console.error('GET /me error:', error);
    res.status(500).json({ error: 'Failed to retrieve user information.' });
  }
});

export default router;
