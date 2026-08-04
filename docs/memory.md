# Project Memory & Chat History

## The Great Native Crash (July 2026)
**The Issue:** The user wanted to build an APK rather than using EAS preview. We initiated an EAS build, but the resulting APK would crash instantly on the phone (screen flicker). 

**The Investigation:**
1. A local Gradle build was attempted but failed because the user had JDK 23 installed (React Native requires JDK 17).
2. We requested screenshots of the crash on the device via a debug build. The screenshot revealed: `java.lang.NoSuchMethodError: No static method getDirectConverter` in `FontLoaderModule`.
3. We realized that an earlier manual `npm install expo-system-ui expo-splash-screen` pulled in SDK 57 versions of those packages.
4. These packages pulled in `expo-font@56.x` as a transitive dependency, which conflicted with the project's core Expo SDK 54 environment (`expo-modules-core@3.x`).

**The Fix:**
1. Ran `npx expo install --fix` to downgrade the packages.
2. Ran `npx expo-doctor` which revealed `expo-font@56` was still secretly cached as a duplicate.
3. Explicitly installed `expo-font` and ran `npm dedupe` to clean the tree.
4. **CRITICAL STEP:** Wiped the stale `/android` folder and ran `npx expo prebuild --clean` to freshly regenerate the Java/Kotlin files with the correct SDK 54 bindings.
5. Committed the fresh `/android` folder and triggered a final EAS build, resolving the crash permanently.

**Networking Note:**
Expo Go failed with "Refused to connect" on the user's Windows machine. We identified this as a Windows Firewall/Network Adapter issue (common with WSL/Hotspots) and bypassed it using `npx expo start --tunnel`.

## Auth Enhancements & OTA Updates (July 2026)
**Auth Features Added:**
- **Remember Me**: Added a toggle on the `LoginScreen`. When checked, authentication tokens are saved in `SecureStore` (persisted). When unchecked, tokens are only stored in memory (wiped when the app is fully closed).
- **Forgot Password**: Added a new `ForgotPasswordScreen` and connected it to the `/auth/forgot-password` API endpoint. Updated the navigation stack to include this flow.
- **Auth Feature Complete:** Implemented "Remember Me" toggle in the frontend using Expo `SecureStore`. Implemented "Forgot Password" screen in the mobile app.
- **OTA Updates:** Configured and pushed OTA updates using `eas update`, demonstrating how to push non-native changes without rebuilding the APK.
- **Backend Email Integration:** Implemented a complete password reset flow using `nodemailer`. Added `resetToken` and `resetTokenExp` to the Prisma schema, and created `GET /reset-password` and `POST /reset-password` endpoints on the Express server to serve an HTML form for secure password updates. Integrated Gmail SMTP for actual email delivery via Render Environment Variables.

## Current Project State
- Because a native package was added, we successfully ran `npx expo prebuild --clean -p android` to inject the listener into the Android native code.
- Queued a final "Golden APK" build on EAS. From this point forward, JS/UI changes can be deployed instantly using `eas update`.

## Security Audit & Hardening (July–August 2026)
A full-stack audit (`archive/audit_report.md`) identified 5 critical vulnerabilities. All were resolved:

1. **Plaintext Security Answers** (`auth.service.ts`): Security answers were stored as lowercased plaintext. Fixed by hashing them with bcrypt using the existing `hashPassword` / `comparePassword` utilities — same treatment as passwords.
2. **Exposed DB Credentials** (`backend/.env`): Live Neon connection string was in `.env`. Replaced with a placeholder. User was advised to rotate credentials in the Neon console.
3. **Non-Atomic Settlements** (`settlements.service.ts`): `recalculate()` did a delete-then-create in two separate calls. Added `replacePendingForGroup()` in the repository that wraps both operations in `prisma.$transaction`.
4. **Privilege Escalation** (`recurring.router.ts`): `/recurring/process` ran `processAll()` for every user. Renamed to `processForUser(userId)` and scoped `findDueToday(userId)` to the authenticated user.
5. **Floating Promise** (`expenses.service.ts`): `checkBudgetAlerts()` was called without `await` or `void`. Added `void` prefix to explicitly mark fire-and-forget intent.

## Website Creation (August 2026)
Built a public-facing landing page and APK distribution hub at `website/`.

- **Stack:** React + TypeScript, built with Vite.
- **Design:** Dark theme (`#080a0f` bg), neon green primary (`#00e676`), glassmorphism panels, fade-in animations. Uses the "Outfit" Google Font.
- **Sections:** Navbar, Hero (CTA to download), Features (4 glass cards), Download (APK link + install instructions), Footer.
- **APK Hosting:** Latest APK goes to `website/public/smart-expense-latest.apk`. The Download button links to it.
- **Deployment:** Added as a Render Static Site in `render.yaml` alongside the existing backend service. Build command: `npm install && npm run build`, publish: `dist/`.
- **Uptime:** Recommended UptimeRobot (free) to monitor both the website and backend API with 5-minute ping intervals, which also keeps Render free-tier services awake.
