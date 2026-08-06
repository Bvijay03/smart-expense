# Full-Stack Project Architecture: Smart Expense

Based on my analysis of the project structure and previous chat history, here is a comprehensive breakdown of the "Smart Expense" application architecture.

## Overview

"Smart Expense" is a personal and group finance manager. The project is divided into three main components:
1. **Backend**: A robust REST API built with Node.js, Express, and Prisma ORM.
2. **Mobile**: A cross-platform mobile application built with React Native and Expo.
3. **Website**: A React-based web application bundled with Vite (likely a landing page or a web dashboard).

The infrastructure relies on Docker for running a local PostgreSQL database.

---

## 1. Backend (`/backend`)
The backend is responsible for data persistence, business logic, and serving the REST API.

**Tech Stack**: Node.js, Express, TypeScript, Prisma ORM, PostgreSQL, JWT for Auth.

### Directory Structure
- `src/config/`: Configuration files (e.g., environment variables, constants).
- `src/database/`: Database connection setup and Prisma client instances.
- `src/middlewares/`: Express middlewares for authentication, error handling, rate limiting, etc.
- `src/modules/`: Domain-specific business logic and services (e.g., auth, expenses, groups, budgets).
- `src/routes/`: API route definitions mapping endpoints to their respective controllers.
- `src/utils/`: Helper functions and utilities.
- `prisma/`: Prisma schema definition (`schema.prisma`) and database migration files.

### Key Features
- **Authentication**: JWT-based access and refresh token flow.
- **Core Entities**: Personal expenses, recurring expenses, budgets, custom categories.
- **Group Features**: Shared expenses, min-cash-flow settlement engine, invite codes.
- **Analytics & Notifications**: Endpoints to fetch summary data, trends, and handle user alerts.

---

## 2. Mobile (`/mobile`)
The mobile application provides the primary user interface for users on iOS and Android devices.

**Tech Stack**: React Native (Expo), TypeScript, React Navigation, React Query, Zustand, React Hook Form (with Zod).

### Directory Structure
- `src/modules/`: Feature-based modules grouping related UI components, hooks, and API calls (e.g., Auth screens, Dashboard, Groups).
- `src/shared/`: Shared components (buttons, inputs), utilities, types, and theme definitions.

### Key Features
- **Navigation**: Uses `@react-navigation/bottom-tabs` and native stacks for seamless routing.
- **State Management & Data Fetching**: Utilizes `zustand` for global state and `@tanstack/react-query` for server state caching and synchronization.
- **Forms & Validation**: Relies on `react-hook-form` paired with `zod` for robust client-side validation.
- **Secure Storage**: Uses `expo-secure-store` to keep JWT tokens safe.

---

## 3. Website (`/website`)
A frontend web application. Given the dependencies, it appears to be a lightweight landing page or a simple web dashboard.

**Tech Stack**: React 19, TypeScript, Vite, `lucide-react` for icons.

### Directory Structure
- `src/`: Contains standard Vite React boilerplate (`App.tsx`, `main.tsx`, `index.css`, `App.css`).
- `public/`: Static assets.

*Note: The website is less complex than the mobile app, lacking advanced routing or state management libraries in its `package.json`, suggesting it might be primarily informational at this stage.*

---

## 4. Infrastructure
- **Database**: The project uses PostgreSQL. A `docker-compose.yml` file in the root directory easily spins up the database for local development.
- **Render**: There is a `render.yaml` file in the root, indicating the project is configured for deployment on [Render](https://render.com/), likely for hosting the Node.js backend and potentially the PostgreSQL database.

## How It Works Together
1. The **PostgreSQL** database stores all persistent data (users, expenses, groups).
2. The **Backend** exposes RESTful endpoints (`/api/v1/...`) and interacts with the database via Prisma ORM.
3. The **Mobile App** (and potentially the **Website**) acts as the client, sending HTTP requests to the backend API to authenticate users, fetch analytics, and manage expenses.
4. The system incorporates complex logic like a **Settlement Engine** (to minimize group transactions) and **Recurring Expenses processing**, handled efficiently on the backend.
