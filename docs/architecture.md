# Architecture & Process Flows

## System Architecture
The application is built using a Hybrid/Bare Expo workflow. 
- **Core Engine:** React Native (0.81.5)
- **Tooling:** Expo SDK 54
- **Native Directories:** The `/android` directory is explicitly generated and committed to the repository.

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
