# Smart Expense

Personal & Group Finance Manager — React Native (Expo) + Node.js + PostgreSQL.

## Architecture

```
smart-expense/
├── mobile/          # Expo managed React Native app (TypeScript)
├── backend/         # Express REST API (TypeScript, Prisma ORM)
└── docker-compose.yml  # Local PostgreSQL database
```

## Prerequisites

- Node.js 18+
- Docker Desktop (for PostgreSQL)
- Expo Go app on physical Android/iOS device, **or** Android emulator

## Setup

### 1. Database

```bash
docker compose up -d
```

### 2. Backend

```bash
cd backend
cp .env.example .env        # fill in JWT secrets
npm install
npx prisma migrate dev      # apply all migrations
npm run dev                 # runs on http://0.0.0.0:3000
```

Health check: `GET /health`

### 3. Mobile

```bash
cd mobile
cp .env.example .env        # set EXPO_PUBLIC_API_URL
npm install
npx expo start --clear      # scan QR with Expo Go
```

**API URL — emulator:** `http://10.0.2.2:3000/api/v1`  
**API URL — physical device:** use your machine's LAN IP, e.g. `http://192.168.x.x:3000/api/v1`

## API Reference (`/api/v1`)

| Module | Routes |
|--------|--------|
| `auth` | POST register, login, refresh · GET me · POST logout |
| `expenses` | CRUD personal expenses · POST `/:id/move-to-group` |
| `groups` | CRUD groups · add/remove members · POST `/:id/invite-code` · POST `/join` |
| `groups/:id/join-requests` | GET list · PATCH `/:requestId` (approve/reject) |
| `groups/:id/expenses` | CRUD shared expenses |
| `groups/:id/settlements` | GET balances · list · mark settled |
| `settlements` | GET all settlements across groups |
| `budgets` | CRUD budgets with spend comparison & alerts |
| `analytics` | GET summary, by-category, trends |
| `notifications` | GET list · PATCH mark-read · PATCH read-all |
| `categories` | CRUD custom expense categories |
| `recurring` | CRUD recurring expenses · POST `/process` (trigger daily creation) |

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_ACCESS_SECRET` | Min 32 chars |
| `JWT_REFRESH_SECRET` | Min 32 chars |
| `PORT` | Default `3000` |

### Mobile (`mobile/.env`)

| Variable | Description |
|----------|-------------|
| `EXPO_PUBLIC_API_URL` | Backend base URL (e.g. `http://192.168.x.x:3000/api/v1`) |

## Feature Set

### Authentication
- JWT access + refresh token flow
- Secure token storage (expo-secure-store)
- Session restore on app launch

### Personal Expenses
- Create / edit / delete with date picker
- Custom categories (user-defined, per-account)
- Search & filter by category, date, notes
- Move personal expense → group expense

### Recurring Expenses
- Set day-of-month + amount + category
- Toggle active/inactive
- Daily auto-creation via `/recurring/process` endpoint

### Groups & Shared Expenses
- Create groups, edit name/description, delete
- Add members by name (email optional) or via **invite code**
- Join group by 6-char invite code → admin approval workflow
- CRUD shared expenses with equal split
- Per-member balance: paid / owed / net
- Detailed "who owes whom" breakdown on member cards

### Settlements
- Min-cash-flow settlement engine (minimises transactions)
- Mark individual settlements as paid
- Per-group settlement history

### Budgets
- Set monthly budget per category
- Real-time spend vs budget comparison
- Color-coded progress bars (green → yellow → red)
- In-app notification alert when near/over budget

### Analytics
- Monthly total spend
- Avg spend per day
- Top spending category
- Month-over-month comparison
- Category breakdown list

### Notifications
- **Bottom tab** with live unread badge (polls every 30s)
- Bell icon with badge on Dashboard header
- Mark individual or all as read
- Types: budget alerts, group join requests, settlement updates, general

### Custom Categories
- Add / delete categories per user
- Icon + color picker
- Used in both personal and shared expense forms

## DB Export (CSV)

Quick full export from the local Postgres container:

```bash
# Export group expenses to CSV
docker compose exec -T postgres psql -U smartexpense -d smart_expense \
  -c "COPY (SELECT g.name AS group_name, se.description, se.amount, se.category, \
             se.expense_date, payer.name AS paid_by, member.name AS split_user, \
             es.amount_owed \
             FROM shared_expenses se \
             JOIN groups g ON g.id = se.group_id \
             JOIN users payer ON payer.id = se.paid_by \
             JOIN expense_splits es ON es.shared_expense_id = se.id \
             JOIN users member ON member.id = es.user_id \
             WHERE se.deleted_at IS NULL \
             ORDER BY g.name, se.expense_date DESC) \
  TO '/tmp/group-expenses.csv' WITH CSV HEADER;"

docker compose cp postgres:/tmp/group-expenses.csv ./group-expenses.csv
```

## Future Roadmap

- [ ] Export to PDF
- [ ] Receipt photo attachment
- [ ] Split by custom % or exact amount per member
- [ ] Local push notifications / reminders
- [ ] Multi-currency support
- [ ] Voice entry — "spent 200 on food" (NLP integration)
- [ ] QR code group invites
