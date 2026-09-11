import bcrypt from 'bcryptjs';
import { initDatabaseAsync, getDb, saveDb } from './database.js';

function hoursAgo(hours) {
  const d = new Date(Date.now() - hours * 3600000);
  return d.toISOString().replace('T', ' ').substring(0, 19);
}

function slaDeadline(createdHoursAgo, slaHours) {
  const createdMs = Date.now() - createdHoursAgo * 3600000;
  const deadlineMs = createdMs + slaHours * 3600000;
  return {
    created: new Date(createdMs).toISOString().replace('T', ' ').substring(0, 19),
    deadline: new Date(deadlineMs).toISOString().replace('T', ' ').substring(0, 19),
  };
}

async function seed() {
  await initDatabaseAsync();
  const db = getDb();

  // Clear existing data (order matters for foreign keys)
  db.exec(`
    DELETE FROM feedback;
    DELETE FROM resolutions;
    DELETE FROM escalations;
    DELETE FROM status_history;
    DELETE FROM assignment_history;
    DELETE FROM complaints;
    DELETE FROM categories;
    DELETE FROM users;
  `);

  // --- Users ---
  const managerHash = bcrypt.hashSync('admin123', 10);
  const agentHash = bcrypt.hashSync('agent123', 10);
  const custHash = bcrypt.hashSync('customer123', 10);

  const insertUser = db.prepare(
    'INSERT INTO users (username, password, full_name, email, phone, role) VALUES (?, ?, ?, ?, ?, ?)'
  );
  insertUser.run('admin', managerHash, 'Admin Manager', 'admin@company.com', '+91-9000000001', 'manager');
  insertUser.run('agent1', agentHash, 'Priya Sharma', 'priya@company.com', '+91-9000000002', 'agent');
  insertUser.run('agent2', agentHash, 'Rahul Verma', 'rahul@company.com', '+91-9000000003', 'agent');
  insertUser.run('customer1', custHash, 'Anita Desai', 'anita@email.com', '+91-9100000001', 'customer');
  insertUser.run('customer2', custHash, 'Vikram Patel', 'vikram@email.com', '+91-9100000002', 'customer');
  insertUser.run('customer3', custHash, 'Meera Joshi', 'meera@email.com', '+91-9100000003', 'customer');

  // --- Categories ---
  const insertCat = db.prepare('INSERT INTO categories (name, description) VALUES (?, ?)');
  insertCat.run('Payment', 'Payment and transaction related issues');
  insertCat.run('Login/Account', 'Login, password, and account access issues');
  insertCat.run('Delivery', 'Shipping and delivery related complaints');
  insertCat.run('Billing', 'Billing, invoice, and charges issues');
  insertCat.run('Technical', 'Technical problems and bugs');
  insertCat.run('Service Quality', 'Service quality and experience complaints');
  insertCat.run('Refund', 'Refund requests and processing issues');
  insertCat.run('Other', 'Other miscellaneous complaints');

  // --- Lookup IDs ---
  const uid = (u) => db.prepare('SELECT id FROM users WHERE username = ?').get(u).id;
  const cid = (c) => db.prepare('SELECT id FROM categories WHERE name = ?').get(c).id;

  const mgr = uid('admin');
  const ag1 = uid('agent1');
  const ag2 = uid('agent2');
  const cu1 = uid('customer1');
  const cu2 = uid('customer2');
  const cu3 = uid('customer3');

  // --- Prepared statements ---
  const insertComplaint = db.prepare(`
    INSERT INTO complaints (ticket_id, customer_id, category_id, subject, description, priority, channel, status,
      assigned_agent_id, assigned_at, sla_hours, sla_deadline, resolved_at, closed_at, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertSH = db.prepare(
    'INSERT INTO status_history (complaint_id, old_status, new_status, changed_by, reason, changed_at) VALUES (?, ?, ?, ?, ?, ?)'
  );
  const insertAH = db.prepare(
    'INSERT INTO assignment_history (complaint_id, agent_id, assigned_by, notes, assigned_at) VALUES (?, ?, ?, ?, ?)'
  );
  const insertEsc = db.prepare(
    'INSERT INTO escalations (complaint_id, escalated_by, reason, escalated_at) VALUES (?, ?, ?, ?)'
  );
  const insertRes = db.prepare(
    'INSERT INTO resolutions (complaint_id, resolved_by, description, resolved_at) VALUES (?, ?, ?, ?)'
  );
  const insertFb = db.prepare(
    'INSERT INTO feedback (complaint_id, customer_id, rating, comment, submitted_at) VALUES (?, ?, ?, ?, ?)'
  );

  // ========================================================
  // CMP-1001 | Critical | Escalated | SLA Breached
  // ========================================================
  let t = slaDeadline(6, 4);
  insertComplaint.run('CMP-1001', cu1, cid('Payment'), 'Payment deducted but order not placed',
    'I made a payment of Rs. 2500 for order #ORD-9821 but the order was not placed. Amount was deducted from my account.',
    'critical', 'website', 'escalated', ag1, hoursAgo(5.5), 4, t.deadline, null, null, t.created, hoursAgo(2));
  insertSH.run(1, null, 'new', cu1, 'Complaint registered', t.created);
  insertSH.run(1, 'new', 'assigned', mgr, 'Assigned to Priya Sharma', hoursAgo(5.5));
  insertSH.run(1, 'assigned', 'in_progress', ag1, 'Started investigation', hoursAgo(5));
  insertSH.run(1, 'in_progress', 'escalated', mgr, 'SLA breached - escalating for priority resolution', hoursAgo(2));
  insertAH.run(1, ag1, mgr, 'Initial assignment', hoursAgo(5.5));
  insertEsc.run(1, mgr, 'SLA breached - payment issue requires immediate attention from senior team', hoursAgo(2));

  // ========================================================
  // CMP-1002 | High | In Progress | SLA At Risk
  // ========================================================
  t = slaDeadline(7, 8);
  insertComplaint.run('CMP-1002', cu2, cid('Login/Account'), 'Unable to login after password reset',
    'I reset my password yesterday but still cannot login. System says invalid credentials even with the new password.',
    'high', 'email', 'in_progress', ag1, hoursAgo(6.5), 8, t.deadline, null, null, t.created, hoursAgo(5));
  insertSH.run(2, null, 'new', cu2, 'Complaint registered', t.created);
  insertSH.run(2, 'new', 'assigned', mgr, 'Assigned to Priya Sharma', hoursAgo(6.5));
  insertSH.run(2, 'assigned', 'in_progress', ag1, 'Investigating account status', hoursAgo(5));
  insertAH.run(2, ag1, mgr, 'Initial assignment', hoursAgo(6.5));

  // ========================================================
  // CMP-1003 | Medium | Assigned | Within SLA
  // ========================================================
  t = slaDeadline(2, 24);
  insertComplaint.run('CMP-1003', cu1, cid('Delivery'), 'Delivery delayed by 5 days',
    'My order #ORD-7744 was supposed to be delivered 5 days ago. Tracking shows it is still in transit.',
    'medium', 'phone', 'assigned', ag2, hoursAgo(1.5), 24, t.deadline, null, null, t.created, hoursAgo(1.5));
  insertSH.run(3, null, 'new', cu1, 'Complaint registered', t.created);
  insertSH.run(3, 'new', 'assigned', mgr, 'Assigned to Rahul Verma', hoursAgo(1.5));
  insertAH.run(3, ag2, mgr, 'Initial assignment', hoursAgo(1.5));

  // ========================================================
  // CMP-1004 | High | New | Within SLA
  // ========================================================
  t = slaDeadline(1, 8);
  insertComplaint.run('CMP-1004', cu3, cid('Billing'), 'Incorrect billing amount',
    'My monthly bill shows Rs. 1500 but my plan is Rs. 999. I have been overcharged for 2 months.',
    'high', 'website', 'new', null, null, 8, t.deadline, null, null, t.created, t.created);
  insertSH.run(4, null, 'new', cu3, 'Complaint registered', t.created);

  // ========================================================
  // CMP-1005 | Critical | In Progress | At Risk
  // ========================================================
  t = slaDeadline(3.5, 4);
  insertComplaint.run('CMP-1005', cu2, cid('Technical'), 'App crashes on checkout',
    'The mobile app crashes every time I try to checkout my cart. This has been happening since the last update.',
    'critical', 'in-person', 'in_progress', ag2, hoursAgo(3), 4, t.deadline, null, null, t.created, hoursAgo(2.5));
  insertSH.run(5, null, 'new', cu2, 'Complaint registered', t.created);
  insertSH.run(5, 'new', 'assigned', mgr, 'Assigned to Rahul Verma', hoursAgo(3));
  insertSH.run(5, 'assigned', 'in_progress', ag2, 'Reproducing the issue', hoursAgo(2.5));
  insertAH.run(5, ag2, mgr, 'Initial assignment - critical priority', hoursAgo(3));

  // ========================================================
  // CMP-1006 | Medium | Resolved | Within SLA (awaiting feedback)
  // ========================================================
  t = slaDeadline(20, 24);
  insertComplaint.run('CMP-1006', cu3, cid('Login/Account'), 'Account locked without reason',
    'My account was suddenly locked and I cannot access any services. No notification was sent.',
    'medium', 'email', 'resolved', ag1, hoursAgo(19.5), 24, t.deadline, hoursAgo(18), null, t.created, hoursAgo(18));
  insertSH.run(6, null, 'new', cu3, 'Complaint registered', t.created);
  insertSH.run(6, 'new', 'assigned', mgr, 'Assigned to Priya Sharma', hoursAgo(19.5));
  insertSH.run(6, 'assigned', 'in_progress', ag1, 'Checking account security logs', hoursAgo(19));
  insertSH.run(6, 'in_progress', 'resolved', ag1, 'Account unlocked, security review completed', hoursAgo(18));
  insertAH.run(6, ag1, mgr, 'Initial assignment', hoursAgo(19.5));
  insertRes.run(6, ag1,
    'Account was locked due to automated security system detecting unusual login patterns. Account has been unlocked and customer has been asked to verify recent activity. No unauthorized access found.',
    hoursAgo(18));

  // ========================================================
  // CMP-1007 | High | New | Within SLA (unassigned)
  // ========================================================
  t = slaDeadline(2, 8);
  insertComplaint.run('CMP-1007', cu1, cid('Refund'), 'Refund not received',
    'I returned my order #ORD-5533 two weeks ago but have not received the refund yet. The return was accepted.',
    'high', 'phone', 'new', null, null, 8, t.deadline, null, null, t.created, t.created);
  insertSH.run(7, null, 'new', cu1, 'Complaint registered', t.created);

  // ========================================================
  // CMP-1008 | Low | Closed | Within SLA (has feedback)
  // ========================================================
  t = slaDeadline(72, 48);
  insertComplaint.run('CMP-1008', cu2, cid('Service Quality'), 'Service quality complaint',
    'The customer support representative was unhelpful and rude during my call regarding billing issues.',
    'low', 'phone', 'closed', ag2, hoursAgo(70), 48, t.deadline, hoursAgo(40), hoursAgo(38), t.created, hoursAgo(38));
  insertSH.run(8, null, 'new', cu2, 'Complaint registered', t.created);
  insertSH.run(8, 'new', 'assigned', mgr, 'Assigned to Rahul Verma', hoursAgo(70));
  insertSH.run(8, 'assigned', 'in_progress', ag2, 'Reviewing call recordings', hoursAgo(65));
  insertSH.run(8, 'in_progress', 'resolved', ag2, 'Investigation complete, corrective action taken', hoursAgo(40));
  insertSH.run(8, 'resolved', 'closed', mgr, 'Customer feedback received, closing ticket', hoursAgo(38));
  insertAH.run(8, ag2, mgr, 'Initial assignment', hoursAgo(70));
  insertRes.run(8, ag2,
    'Call recordings reviewed. The representative has been counseled. A formal apology has been sent to the customer. Service quality training scheduled for the team.',
    hoursAgo(40));
  insertFb.run(8, cu2, 4, 'The issue was handled well after the complaint. Appreciate the follow-up.', hoursAgo(38));

  // ========================================================
  // CMP-1009 | Medium | In Progress | Within SLA
  // ========================================================
  t = slaDeadline(10, 24);
  insertComplaint.run('CMP-1009', cu3, cid('Delivery'), 'Wrong product delivered',
    'I ordered a blue shirt (size M) but received a red shirt (size L). Order #ORD-3322.',
    'medium', 'website', 'in_progress', ag1, hoursAgo(9), 24, t.deadline, null, null, t.created, hoursAgo(8));
  insertSH.run(9, null, 'new', cu3, 'Complaint registered', t.created);
  insertSH.run(9, 'new', 'assigned', mgr, 'Assigned to Priya Sharma', hoursAgo(9));
  insertSH.run(9, 'assigned', 'in_progress', ag1, 'Coordinating with warehouse for replacement', hoursAgo(8));
  insertAH.run(9, ag1, mgr, 'Initial assignment', hoursAgo(9));

  // ========================================================
  // CMP-1010 | Low | Assigned | Within SLA
  // ========================================================
  t = slaDeadline(5, 48);
  insertComplaint.run('CMP-1010', cu1, cid('Payment'), 'Subscription cancellation issue',
    'I cancelled my premium subscription last month but I am still being charged. Need this resolved and refund processed.',
    'low', 'email', 'assigned', ag2, hoursAgo(4), 48, t.deadline, null, null, t.created, hoursAgo(4));
  insertSH.run(10, null, 'new', cu1, 'Complaint registered', t.created);
  insertSH.run(10, 'new', 'assigned', mgr, 'Assigned to Rahul Verma', hoursAgo(4));
  insertAH.run(10, ag2, mgr, 'Initial assignment', hoursAgo(4));

  // Save to disk
  saveDb();

  console.log('');
  console.log('Seed data inserted successfully!');
  console.log('');
  console.log('Test Credentials:');
  console.log('──────────────────────────────────────');
  console.log('  Manager:    admin     / admin123');
  console.log('  Agent 1:    agent1    / agent123');
  console.log('  Agent 2:    agent2    / agent123');
  console.log('  Customer 1: customer1 / customer123');
  console.log('  Customer 2: customer2 / customer123');
  console.log('  Customer 3: customer3 / customer123');
  console.log('──────────────────────────────────────');
}

seed();
