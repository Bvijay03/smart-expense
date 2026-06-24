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
