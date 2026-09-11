# Customer Complaint Management System

A full-stack complaint tracking application with role-based access for administrators, agents, and customers.

## Features

- Customer JWT login
- Administrator dashboard, reports, assignment, reassignment, and escalation monitoring
- Agent assignment queue, status updates, resolution notes, and SLA visibility
- Customer complaint creation, tracking, resolution viewing, and feedback
- SQLite database initialization with foreign keys, history, resolutions, escalations, and feedback
- Automatic ticket IDs, SLA deadlines, near-breach status, and breach escalation
- Search and filters by ticket, status, priority, category, SLA, and date
- Responsive React interface served by Express in production

## Technology

- React and Vite frontend
- Node.js and Express REST API
- `sql.js` SQLite database stored at `server/db/complaints.db`
- bcrypt password hashing and JWT authentication

## Project Structure

```text
customer-complaint-management-system/
├── server/
│   ├── db/              Database initialization and SQLite file
│   ├── middleware/      Authentication and validation
│   ├── routes/          REST API routes
│   └── services/        Ticket and SLA logic
├── src/
│   ├── components/      Shared UI components
│   ├── context/         Authentication state
│   ├── pages/           Dashboard, tickets, login, reports
│   └── services/        API client
├── public/
├── package.json
└── server/index.js
```

## Installation and Run

Requirements: Node.js 20 or newer.

```powershell
cd customer-complaint-management-system
npm install
npm run build
npm start
```

Open `http://localhost:3001`.

For frontend development with hot reload:

```powershell
npm run dev
```

Open `http://localhost:5173`.

The SQLite database and initial lookup/demo accounts are created automatically on first server start. Copy `.env.example` to `.env` and set a private `JWT_SECRET` before deployment.

## Demo Accounts

| Role | Username | Password |
| --- | --- | --- |
| Administrator | `admin` | `admin123` |
| Agent | `agent1` | `agent123` |
| Agent | `agent2` | `agent123` |
| Customer | `customer1` | `customer123` |

Demo passwords are for local development only. Change them before any shared deployment.

## Main Workflow

1. A customer signs in and creates a complaint.
2. The API generates a ticket ID and SLA deadline and records the initial activity.
3. An administrator assigns the ticket to an agent.
4. The agent moves the ticket through valid states and records the resolution.
5. SLA checks mark near-deadline and breached tickets; overdue active tickets are escalated automatically.
6. The customer views the resolution and submits one rating and comment.
7. Feedback closes the resolved ticket and updates dashboard and report data.

## API Health Check

`GET /api/health` returns the server status. Protected endpoints require `Authorization: Bearer <token>`.
