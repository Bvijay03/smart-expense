# Smart Expense

Personal & Group Finance Manager — React Native (Expo) + Node.js + PostgreSQL.

## Architecture

- **mobile/** — Expo managed React Native app (TypeScript)
- **backend/** — Express REST API (TypeScript, Prisma)
- **docker-compose.yml** — Local PostgreSQL

## Prerequisites

- Node.js 18+
- Docker Desktop (for PostgreSQL)
- Android Studio / emulator or Expo Go on device

## Setup

### 1. Database

```bash
docker compose up -d
```

### 2. Backend

```bash
cd backend
cp .env.example .env
npm install
npx prisma migrate dev --name init
npm run dev
```

API runs at `http://localhost:3000`  
Health check: `GET /health`

### 3. Mobile

```bash
cd mobile
cp .env.example .env
npm install
npm run android
```

**API URL for emulator:** `http://10.0.2.2:3000/api/v1` (default in `.env.example`)  
**Physical device:** use your machine's LAN IP instead of `10.0.2.2`.

## API Overview (`/api/v1`)

| Module | Endpoints |
|--------|-----------|
| auth | register, login, refresh, me, logout |
| expenses | CRUD personal expenses |
| groups | CRUD groups, add/remove members |
| shared-expenses | CRUD under `/groups/:id/expenses` |
| settlements | balances, list, mark settled |
| budgets | CRUD with spend comparison |
| analytics | summary, by-category, trends |
| notifications | list, mark read |

## Environment Variables

### Backend (`backend/.env`)

- `DATABASE_URL` — PostgreSQL connection string
- `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` — min 32 chars each
- `PORT` — default 3000

### Mobile (`mobile/.env`)

- `EXPO_PUBLIC_API_URL` — backend base URL

## Project Structure

Feature-based modules in both `mobile/src/modules/` and `backend/src/modules/`.

## Version 1 Scope

- Authentication (JWT)
- Personal expenses
- Groups & shared expenses with splits
- Settlement engine (min-cash-flow)
- Monthly budgets
- Analytics charts
- In-app notifications

## Future (V2)

Receipt attachments, OCR, AI categorization, push notifications, voice entry.

## DB export fallback (fast CSV dump)

If you need a quick, full export of group-related CSVs from the local Postgres container, use `psql`'s `COPY` command inside the container and then copy the file to the host.

Example (from project root):

```bash
# run a COPY query inside the postgres container to write CSV to /tmp
docker compose exec -T postgres psql -U smartexpense -d smart_expense -c "COPY (SELECT g.id AS group_id, g.name AS group_name, se.id AS shared_expense_id, se.description, se.amount, se.category, se.expense_date, se.split_type, payer.id AS paid_by_user_id, payer.name AS paid_by_name, payer.email AS paid_by_email, member.id AS split_user_id, member.name AS split_user_name, member.email AS split_user_email, es.amount_owed AS split_amount_owed, se.created_at FROM shared_expenses se JOIN groups g ON g.id = se.group_id JOIN users payer ON payer.id = se.paid_by JOIN expense_splits es ON es.shared_expense_id = se.id JOIN users member ON member.id = es.user_id WHERE se.deleted_at IS NULL ORDER BY g.name, se.expense_date DESC, member.name) TO '/tmp/group-expenses-details.csv' WITH CSV HEADER;"

# copy file from container to host CWD
docker compose cp postgres:/tmp/group-expenses-details.csv ./group-expenses-details.csv
```

Notes:
- Adjust database user, database name or container service name if you changed them in `docker-compose.yml` or `backend/.env`.
- The SQL above flattens shared expenses to one row per split (includes payer and per-split user). You can modify the `SELECT` to add/remove columns.
- If you prefer a Node script, see `backend/data/export-groups-csv.mjs` which also produces `groups.csv`, `group_members.csv`, `shared_expenses.csv`, and `settlements.csv`.
