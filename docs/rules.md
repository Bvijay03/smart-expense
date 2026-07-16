# Rules for AI Agents

**CRITICAL INSTRUCTIONS FOR ANY AI AGENT WORKING ON THIS PROJECT:**

## 1. Expo Package Installation
- **NEVER** use `npm install <expo-package>` directly without checking compatibility. It will fetch the latest version (e.g., SDK 57) which will crash this SDK 54 project natively.
- **ALWAYS** use `npx expo install <package>` which automatically locks the version to the current Expo SDK.
- If dependency warnings arise, use `npx expo install --fix` to resolve them safely.

## 2. Managing the `/android` Folder
- This project commits the `/android` folder to git.
- If you add, remove, or modify a native Expo package or React Native module, **you MUST regenerate the android folder**.
- **Command:** `npx expo prebuild --clean -p android`
- If you fail to do this, the EAS build will use the stale native code and the app will crash instantly on the user's device.

## 3. Debugging Native Crashes
- If the app builds successfully but "flickers" or crashes instantly on launch, it is a Native mismatch, not a JS error.
- Run `npx expo-doctor` immediately.
- Look for duplicate packages (especially `expo-font` or `expo-modules-core`). 
- Fix duplicates by locking the version in `package.json` and running `npm dedupe`.
