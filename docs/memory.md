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
