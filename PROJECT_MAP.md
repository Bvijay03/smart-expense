# Smart Expense — Project File Map

> What every file does, what it is for, and what it can handle.
> No code. Plain English only.

---

## PROJECT ROOT

| File | What it does |
|------|-------------|
| `README.md` | Full project documentation — setup steps, API reference, environment variables, feature list, future roadmap |
| `docker-compose.yml` | Starts a local PostgreSQL database container for development |
| `render.yaml` | Tells Render.com how to deploy the backend — Docker build, environment variable declarations, health check path |
| `to implement` | Running task tracker — what features are done, in progress, or planned |

---

## BACKEND (`backend/`)

### Entry & Config

| File | What it does |
|------|-------------|
| `src/index.ts` | **App entry point.** Loads environment, connects to the database, then starts the HTTP server on port 3000 |
| `src/app.ts` | **Express app factory.** Wires up all middleware (security headers, CORS, request logging, JSON parsing), mounts all API routes at `/api/v1`, registers the error handler, and exposes the `/health` endpoint |
| `src/config/env.ts` | **Environment variable validator.** Reads and validates all required env vars (database URL, JWT secrets, port, etc.) at startup — crashes early if anything is missing or invalid |
| `Dockerfile` | **Production container definition.** Installs dependencies, compiles TypeScript to JavaScript, generates the Prisma database client, then runs migrations and starts the server |
| `.env.example` | Template showing all required environment variables with dummy values |

### Database

| File | What it does |
|------|-------------|
| `src/database/prisma.ts` | **Database client singleton.** Creates a single shared Prisma (ORM) client connected to PostgreSQL. Reuses it across hot-reloads in development |
| `prisma/schema.prisma` | **Database schema.** Defines all tables: users, expenses, groups, group members, shared expenses, expense splits, settlements, budgets, notifications, categories, recurring expenses, join requests, refresh tokens |
| `prisma/migrations/` | SQL migration files — the actual table creation/alteration scripts applied to the database in order |

### Middleware

| File | What it does |
|------|-------------|
| `src/middlewares/auth.middleware.ts` | **JWT authentication guard.** Reads the `Authorization: Bearer <token>` header, verifies it, and attaches the logged-in user's ID and email to the request. Rejects with 401 if token is missing or invalid |
| `src/middlewares/error.middleware.ts` | **Global error handler.** Catches any error thrown in a route. If it's an `AppError`, returns structured JSON with the right status code. Otherwise returns a generic 500 response |
| `src/middlewares/validate.middleware.ts` | **Request validator.** Validates request body or URL params against a Zod schema before the handler runs. Returns 400 with field-level errors if validation fails |
| `src/utils/app-error.ts` | **Custom error class.** A typed error with statusCode, code, and message — used throughout the app for predictable error responses |
| `src/utils/jwt.ts` | **JWT utilities.** Signs access tokens (short-lived), signs refresh tokens, verifies both. Also generates a random raw refresh token value |
| `src/utils/password.ts` | **Password utilities.** Hashes passwords with bcrypt, compares passwords, hashes a refresh token value for safe storage, compares stored token hashes |
| `src/utils/helpers.ts` | **Shared helpers.** Rounds money to 2 decimal places, converts Prisma Decimal type to a JavaScript number |

### Routes

| File | What it does |
|------|-------------|
| `src/routes/index.ts` | **Central router registry.** Mounts every module router at its path: /auth, /expenses, /groups, /budgets, /analytics, /notifications, /categories, /settlements, /recurring |

---

### Module: Auth

| File | Purpose | What it can do |
|------|---------|----------------|
| `auth.router.ts` | Route definitions | POST register, POST login, POST refresh token, GET me, POST logout. Rate-limited to prevent brute force |
| `auth.controller.ts` | HTTP layer | Reads request body, calls service, sends response |
| `auth.service.ts` | Business logic | Register new user (checks duplicate email, hashes password), login (verify credentials), refresh tokens (rotate refresh token securely), get current user profile, logout (invalidate all sessions) |
| `auth.repository.ts` | Database queries | Find user by email or ID, create user, create/find/delete refresh tokens |
| `auth.schema.ts` | Input validation rules | Validates email format, password min length, name required, refresh token format |

---

### Module: Expenses (Personal)

| File | Purpose | What it can do |
|------|---------|----------------|
| `expenses.router.ts` | Route definitions | List, create, update, delete personal expenses. Move an expense to a group |
| `expenses.controller.ts` | HTTP layer | Handles requests, parses query params for filters |
| `expenses.service.ts` | Business logic | List expenses with search/filter (by category, date, notes). Create, edit, soft-delete. Move a personal expense into a group as a shared expense |
| `expenses.repository.ts` | Database queries | CRUD for personal expenses with filter support |
| `expenses.schema.ts` | Input rules | Validates amount (positive), category, date, optional notes |

---

### Module: Groups

| File | Purpose | What it can do |
|------|---------|----------------|
| `groups.router.ts` | Route definitions | Create group, list my groups, get group detail, update, delete. Add/remove members. Generate invite code. Join by code. List/handle join requests |
| `groups.controller.ts` | HTTP layer | Extracts group ID, user ID, member ID, request ID from URLs and body |
| `groups.service.ts` | Business logic | Create groups (auto-add creator as admin). List all groups for a user with net balance in each. Get full group detail with per-member balances and "who owes whom". Add member by email or create a guest. Remove member. Generate a 6-character invite code (24hr expiry). Join by code → creates join request → notifies admins. Approve/reject join requests → notifies requester |
| `groups.repository.ts` | Database queries | All group CRUD, member management, invite code storage, join request management, admin/member checks |
| `groups.schema.ts` | Input rules | Validates group name, description, member name/email, invite code format, join request action (approve/reject) |

---

### Module: Shared Expenses

| File | Purpose | What it can do |
|------|---------|----------------|
| `shared-expenses.router.ts` | Route definitions | List, create, delete shared expenses within a group |
| `shared-expenses.service.ts` | Business logic | Create a shared expense split equally among all selected members. Records who paid. Auto-creates expense splits for each member. Deletes expense and splits together |
| `shared-expenses.repository.ts` | Database queries | CRUD for shared expenses and their splits |

---

### Module: Settlements

| File | Purpose | What it can do |
|------|---------|----------------|
| `settlements.router.ts` | Route definitions | Get balances for a group, list settlements, mark a settlement as paid |
| `settlements.service.ts` | Business logic | Computes who owes whom using the min-cash-flow algorithm (minimizes number of transactions). Lists all pending and paid settlements. Marks a settlement as PAID. Lists all settlements across all groups for a user |
| `settlements.repository.ts` | Database queries | Aggregate balances from expense splits, CRUD for settlement records |

---

### Module: Budgets

| File | Purpose | What it can do |
|------|---------|----------------|
| `budgets.router.ts` | Route definitions | List budgets with actual spend, create, update amount, delete |
| `budgets.service.ts` | Business logic | Sets a monthly spending limit per category. Compares the limit against actual spending from expenses that month. Returns budget with spent and percentage fields. Sends in-app notification when spending exceeds 80% or 100% of budget |
| `budgets.repository.ts` | Database queries | CRUD for budgets, aggregates actual spend from expenses |

---

### Module: Analytics

| File | Purpose | What it can do |
|------|---------|----------------|
| `analytics.router.ts` | Route definitions | Summary stats, by-category breakdown, monthly trends |
| `analytics.service.ts` | Business logic | **Summary:** total spent, avg per day, top category, count, comparison to previous month. **By-category:** total per category with percentage of overall. **Trends:** month-by-month totals for the past N months |

---

### Module: Notifications

| File | Purpose | What it can do |
|------|---------|----------------|
| `notifications.router.ts` | Route definitions | List all notifications, mark one as read, mark all as read |
| `notifications.service.ts` | Business logic | Create notifications (used internally by other modules). List for a user. Mark individual or all as read |
| `notifications.repository.ts` | Database queries | Create, find, update read status |

**Notification types:** Budget alert (near/over limit), group invite, group join request, request approved/declined, general

---

### Module: Categories

| File | Purpose | What it can do |
|------|---------|----------------|
| `categories.router.ts` | Route definitions | List all categories (default + custom), create custom, delete custom |
| `categories.service.ts` | Business logic | Returns default system categories merged with the user's own custom ones. Prevents deleting default categories. Lets users create categories with a name, icon, and color |
| `categories.repository.ts` | Database queries | Find categories by user, create, delete |

---

### Module: Recurring Expenses

| File | Purpose | What it can do |
|------|---------|----------------|
| `recurring.router.ts` | Route definitions | List, create, update, delete recurring expenses. Toggle active/inactive. POST /process to trigger creation for today |
| `recurring.service.ts` | Business logic | CRUD for recurring expense schedules. processAll finds all active recurring expenses due today (not yet created this month), creates a personal expense for each, marks them processed |
| `recurring.repository.ts` | Database queries | Find due-today items (by day of month, not yet created this calendar month), mark created |

---

## MOBILE (`mobile/src/`)

### Shared — Services

| File | What it does |
|------|-------------|
| `shared/services/api.ts` | **Axios HTTP client.** Pre-configured with the backend URL and JSON headers. Automatically attaches the JWT access token to every request. Handles 401 errors by refreshing the token and retrying the failed request. Queues parallel requests during refresh to prevent race conditions |
| `shared/services/modules.ts` | **API service layer.** One service object per backend module (expenses, groups, shared expenses, settlements, budgets, analytics, notifications, categories, recurring). Each method is a typed HTTP call to the correct endpoint |
| `shared/services/tokenStorage.ts` | **Secure token store.** Saves and retrieves access and refresh tokens using expo-secure-store (encrypted, OS-level keychain) |

### Shared — Navigation

| File | What it does |
|------|-------------|
| `shared/navigation/MainTabs.tsx` | **Bottom tab navigator.** Five tabs: Dashboard, Expenses, Groups, Recurring, Alerts. Shows live unread notification badge on Alerts tab (polls every 30 seconds) |
| `shared/navigation/RootNavigator.tsx` | **App-level navigator.** On launch, checks if a valid session exists. Routes to Auth stack (login/register) or Main stack (tabs + detail screens) |
| `shared/navigation/types.ts` | TypeScript type definitions for all navigation routes and their parameters |

### Shared — Components

| File | What it does |
|------|-------------|
| `shared/components/Card.tsx` | Reusable card container + ScreenHeader component (title, subtitle, optional right-side action like a bell icon) |
| `shared/components/Button.tsx` | Styled button with loading spinner state |
| `shared/components/LoadingState.tsx` | Full-screen centered loading spinner |
| `shared/components/EmptyState.tsx` | Centered message for empty lists |
| `shared/components/ErrorState.tsx` | Error message with a Retry button |

### Shared — Hooks & Theme

| File | What it does |
|------|-------------|
| `shared/hooks/useTheme.ts` | Returns the current color palette (light or dark) based on the user's dark mode setting |
| `shared/hooks/useAuth.ts` | Provides auth state (current user, login, logout, register functions) to any component |
| `shared/theme/index.ts` | Design tokens — spacing scale, font sizes, border radii, light and dark color palettes |
| `shared/utils/constants.ts` | API_URL resolver — uses cloud HTTPS URL from .env if set, otherwise auto-detects dev machine's LAN IP for Expo Go. Also contains the default expense category list |

---

### Module: Authentication

| Screen | What it does |
|--------|-------------|
| `LoginScreen.tsx` | Email + password form. On success, stores tokens and navigates to the main app |
| `RegisterScreen.tsx` | Name + email + password form. Creates a new account and logs in automatically |

---

### Module: Dashboard

| Screen | What it does |
|--------|-------------|
| `DashboardScreen.tsx` | Home screen. Shows current month's total spend, active budgets with progress bars, recent expenses, unread notification count. Has notification bell in header. Tapping unread count goes to Notifications |

---

### Module: Expenses (Personal)

| Screen | What it does |
|--------|-------------|
| `ExpensesScreen.tsx` | Lists all personal expenses with search bar and category filter chips. Tap to edit. Delete. Has "Move to group" option. Add button opens create form in a modal |

---

### Module: Groups

| Screen | What it does |
|--------|-------------|
| `GroupsScreen.tsx` | Lists all groups the user belongs to with their net balance in each (green = owed money, red = owes money). Create group button. Join by invite code button |
| `GroupDetailScreen.tsx` | Full group view. Member list with balances and "who owes whom". Shared expenses list. Add expense. Generate invite code. Pending join requests with approve/reject (admin only). Remove member option (admin only) |

---

### Module: Shared Expenses

| Screen | What it does |
|--------|-------------|
| `AddSharedExpenseScreen.tsx` | Form to add a group expense — amount, category, date, description, payer selection, member split selection. Splits equally among selected members |
| `SharedExpenseDetailScreen.tsx` | Shows full breakdown of a shared expense — who paid, each member's share amount |

---

### Module: Settlements

| Screen | What it does |
|--------|-------------|
| `SettlementsScreen.tsx` | All pending "who owes whom" settlements for a group. Each card shows from/to person and amount. "Mark Paid" button resolves a settlement |

---

### Module: Budgets

| Screen | What it does |
|--------|-------------|
| `BudgetsScreen.tsx` | Lists monthly budgets per category with a colored progress bar (green to yellow to red). Shows amount spent vs limit. Add/edit/delete budget. Reflects current month's actual spending |

---

### Module: Analytics

| Screen | What it does |
|--------|-------------|
| `AnalyticsScreen.tsx` | Spending report. Summary cards (total, daily average, top category, month comparison). Category breakdown list with percentages. Monthly trend chart (last 6 months) |

---

### Module: Notifications

| Screen | What it does |
|--------|-------------|
| `NotificationsScreen.tsx` | Full list of all notifications. Tap one to mark as read. "Mark all read" button. Shows type icon, title, body, timestamp |

---

### Module: Categories

| Screen | What it does |
|--------|-------------|
| `CategoriesScreen.tsx` | Lists default + custom categories. Add custom category with name, icon picker, color picker. Delete custom categories. Used as category selector in expense forms |

---

### Module: Recurring

| Screen | What it does |
|--------|-------------|
| `RecurringScreen.tsx` | Lists all recurring expense schedules. Add new (amount, category, notes, day of month). Toggle active/inactive. Delete. Shows summary (active count out of total) |

---

### Module: Profile

| Screen | What it does |
|--------|-------------|
| `ProfileScreen.tsx` | Shows logged-in user's name and email. Edit display name. Toggle dark mode. Logout button (clears tokens, goes back to login) |

---

## CONFIGURATION FILES

| File | What it does |
|------|-------------|
| `mobile/app.json` | Expo app configuration — app name, version, icon paths, Android package name (com.smartexpense.app), plugins |
| `mobile/eas.json` | EAS Build profiles — preview builds a direct-install .apk with the Render cloud URL baked in, production for Play Store builds |
| `mobile/.env` | Local environment — sets EXPO_PUBLIC_API_URL to the backend address (local IP for dev, Render HTTPS URL for cloud) |
| `mobile/tsconfig.json` | TypeScript config for the mobile app — enables @/ path alias pointing to src/ |
| `backend/tsconfig.json` | TypeScript config for backend — compiles to dist/, enables @/ path alias pointing to src/ |
| `backend/prisma/schema.prisma` | Single source of truth for the entire database structure |
