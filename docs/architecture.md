# Architecture & Process Flows

## System Architecture
The project has three main components:

### 1. Mobile App (React Native + Expo)
- **Core Engine:** React Native (0.81.5)
- **Tooling:** Expo SDK 54
- **Native Directories:** The `/android` directory is explicitly generated and committed to the repository.

### 2. Backend API (Express + Prisma)
- **Runtime:** Node.js with Express
- **Database:** PostgreSQL (Neon serverless) via Prisma ORM
- **Auth:** JWT access/refresh tokens with bcrypt-hashed passwords and security answers

### 3. Website (React + Vite)
- **Purpose:** Public-facing landing page and APK distribution hub.
- **Stack:** React + TypeScript, built with Vite.
- **Design:** Dark theme with neon green accents, glassmorphism cards, and micro-animations.
- **APK Hosting:** The latest APK is placed in `website/public/smart-expense-latest.apk` and served directly via the website.
- **Deployment:** Render Static Site (configured in `render.yaml`).

## Build Process (EAS)
We use Expo Application Services (EAS) to compile the native Android APK.
- The build pulls the committed `/android` folder.
- Native modules must be perfectly aligned with SDK 54. 

## Process Flows
### Native Module Resolution
1. JS dependencies are installed via npm.
2. `npx expo prebuild --clean` reads `package.json` and injects the corresponding Native Java/Kotlin code into the `/android` folder.
3. EAS builds the APK using the generated Gradle scripts.

### Crash Handling
- **JS Layer:** Handled by a custom `ErrorBoundary` in `App.tsx`.
- **Native Layer:** Cannot be caught by React. Requires logcat or EAS build logs. Often caused by mismatched `expo-*` package versions attempting to call missing native methods.

## Security Hardening (August 2026)
The following critical fixes were applied based on a full-stack audit:

1. **Hashed Security Answers:** Security answers are now bcrypt-hashed (same as passwords), never stored in plaintext.
2. **Atomic Settlements:** Group settlement recalculation uses `prisma.$transaction` to atomically delete-then-create, preventing data loss on crashes.
3. **Scoped Recurring Processing:** The `/recurring/process` endpoint now only processes expenses belonging to the authenticated user, preventing privilege escalation.
4. **Explicit Fire-and-Forget:** Budget alert checks use `void` to explicitly mark intentionally unwaited promises.
5. **Credential Rotation:** Live database credentials were removed from `.env` and replaced with placeholders.
