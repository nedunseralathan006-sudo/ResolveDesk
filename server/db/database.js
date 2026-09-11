import initSqlJs from 'sql.js';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, 'complaints.db');

let db = null;

/**
 * Wrapper that mimics better-sqlite3 API so route handlers work unchanged.
 * sql.js is synchronous once initialized, so this works naturally.
 */
class DatabaseWrapper {
  constructor(sqlDb) {
    this._db = sqlDb;
  }

  prepare(sql) {
    const self = this;
    return {
      run(...params) {
        self._db.run(sql, params);
        // Mimic better-sqlite3 run() return value
        const lastId = self._db.exec('SELECT last_insert_rowid() as id');
        const changes = self._db.getRowsModified();
        return {
          lastInsertRowid: lastId.length > 0 ? lastId[0].values[0][0] : 0,
          changes
        };
      },
      get(...params) {
        const stmt = self._db.prepare(sql);
        stmt.bind(params);
        if (stmt.step()) {
          const cols = stmt.getColumnNames();
          const vals = stmt.get();
          stmt.free();
          const row = {};
          cols.forEach((col, i) => { row[col] = vals[i]; });
          return row;
        }
        stmt.free();
        return undefined;
      },
      all(...params) {
        const results = [];
        const stmt = self._db.prepare(sql);
        stmt.bind(params);
        while (stmt.step()) {
          const cols = stmt.getColumnNames();
          const vals = stmt.get();
          const row = {};
          cols.forEach((col, i) => { row[col] = vals[i]; });
          results.push(row);
        }
        stmt.free();
        return results;
      }
    };
  }

  exec(sql) {
    this._db.exec(sql);
  }

  transaction(fn) {
    return (...args) => {
      this._db.exec('BEGIN TRANSACTION');
      try {
        const result = fn(...args);
        this._db.exec('COMMIT');
        this._save();
        return result;
      } catch (e) {
        this._db.exec('ROLLBACK');
        throw e;
      }
    };
  }

  _save() {
    try {
      const data = this._db.export();
      fs.writeFileSync(DB_PATH, Buffer.from(data));
    } catch (e) {
      console.error('Failed to save database:', e);
    }
  }

  pragma(str) {
    this._db.exec(`PRAGMA ${str}`);
  }
}

export async function initDatabaseAsync() {
  const SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new DatabaseWrapper(new SQL.Database(buffer));
  } else {
    db = new DatabaseWrapper(new SQL.Database());
  }

  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      full_name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT DEFAULT '',
      role TEXT NOT NULL CHECK(role IN ('customer', 'agent', 'manager')),
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      description TEXT DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS complaints (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticket_id TEXT UNIQUE NOT NULL,
      customer_id INTEGER NOT NULL,
      category_id INTEGER NOT NULL,
      subject TEXT NOT NULL,
      description TEXT NOT NULL,
      priority TEXT NOT NULL CHECK(priority IN ('low', 'medium', 'high', 'critical')),
      channel TEXT NOT NULL CHECK(channel IN ('phone', 'email', 'website', 'in-person', 'other')),
      status TEXT NOT NULL DEFAULT 'new' CHECK(status IN ('new', 'assigned', 'in_progress', 'escalated', 'resolved', 'closed')),
      assigned_agent_id INTEGER,
      assigned_at TEXT,
      sla_hours INTEGER NOT NULL,
      sla_deadline TEXT NOT NULL,
      resolved_at TEXT,
      closed_at TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (customer_id) REFERENCES users(id),
      FOREIGN KEY (category_id) REFERENCES categories(id),
      FOREIGN KEY (assigned_agent_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS assignment_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      complaint_id INTEGER NOT NULL,
      agent_id INTEGER NOT NULL,
      assigned_by INTEGER NOT NULL,
      notes TEXT DEFAULT '',
      assigned_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (complaint_id) REFERENCES complaints(id),
      FOREIGN KEY (agent_id) REFERENCES users(id),
      FOREIGN KEY (assigned_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS status_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      complaint_id INTEGER NOT NULL,
      old_status TEXT,
      new_status TEXT NOT NULL,
      changed_by INTEGER NOT NULL,
      reason TEXT DEFAULT '',
      changed_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (complaint_id) REFERENCES complaints(id),
      FOREIGN KEY (changed_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS escalations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      complaint_id INTEGER NOT NULL,
      escalated_by INTEGER NOT NULL,
      reason TEXT NOT NULL,
      escalated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (complaint_id) REFERENCES complaints(id),
      FOREIGN KEY (escalated_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS resolutions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      complaint_id INTEGER NOT NULL,
      resolved_by INTEGER NOT NULL,
      description TEXT NOT NULL,
      resolved_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (complaint_id) REFERENCES complaints(id),
      FOREIGN KEY (resolved_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS feedback (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      complaint_id INTEGER UNIQUE NOT NULL,
      customer_id INTEGER NOT NULL,
      rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
      comment TEXT DEFAULT '',
      submitted_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (complaint_id) REFERENCES complaints(id),
      FOREIGN KEY (customer_id) REFERENCES users(id)
    );

    CREATE INDEX IF NOT EXISTS idx_complaints_customer ON complaints(customer_id);
    CREATE INDEX IF NOT EXISTS idx_complaints_agent ON complaints(assigned_agent_id);
    CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints(status);
    CREATE INDEX IF NOT EXISTS idx_complaints_priority ON complaints(priority);
    CREATE INDEX IF NOT EXISTS idx_complaints_ticket_id ON complaints(ticket_id);
    CREATE INDEX IF NOT EXISTS idx_status_history_complaint ON status_history(complaint_id);
    CREATE INDEX IF NOT EXISTS idx_assignment_history_complaint ON assignment_history(complaint_id);
    CREATE INDEX IF NOT EXISTS idx_escalations_complaint ON escalations(complaint_id);
  `);

  bootstrapDemoData();

  db._save();
  console.log('Database initialized successfully.');
  return db;
}

function bootstrapDemoData() {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (userCount > 0) return;

  const managerPassword = bcrypt.hashSync('admin123', 10);
  const agentPassword = bcrypt.hashSync('agent123', 10);
  const customerPassword = bcrypt.hashSync('customer123', 10);
  const insertUser = db.prepare(
    'INSERT INTO users (username, password, full_name, email, phone, role) VALUES (?, ?, ?, ?, ?, ?)'
  );

  insertUser.run('admin', managerPassword, 'Admin Manager', 'admin@company.com', '', 'manager');
  insertUser.run('agent1', agentPassword, 'Priya Sharma', 'priya@company.com', '', 'agent');
  insertUser.run('agent2', agentPassword, 'Rahul Verma', 'rahul@company.com', '', 'agent');
  insertUser.run('customer1', customerPassword, 'Anita Desai', 'anita@email.com', '', 'customer');

  const insertCategory = db.prepare('INSERT INTO categories (name, description) VALUES (?, ?)');
  const categories = [
    ['Technical', 'Technical problems and bugs'],
    ['Billing', 'Billing, invoices, and charges'],
    ['Service', 'Service quality and experience'],
    ['Delivery', 'Shipping and delivery issues'],
    ['Account', 'Account access and profile issues'],
    ['Other', 'Other customer complaints']
  ];
  categories.forEach(([name, description]) => insertCategory.run(name, description));
}

/**
 * Synchronous getter — only works after initDatabaseAsync() has been called.
 */
export function getDb() {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabaseAsync() first.');
  }
  return db;
}

/**
 * Save the in-memory database to disk.
 * Call this after any write operations outside of transactions.
 */
export function saveDb() {
  if (db) {
    db._save();
  }
}
