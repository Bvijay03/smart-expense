# Smart Expense UML Diagrams

These diagrams provide a high-level visual overview of the system architecture, build process, and core application flows. You can copy the code blocks below and paste them into [PlantText.com](https://www.planttext.com/) or [PlantUML.com](https://plantuml.com/plantuml/) to instantly generate the visual diagrams.

## 1. System Architecture Diagram

This diagram illustrates how the different layers of the React Native and Expo ecosystem interact with the native device OS.

```plantuml
@startuml
package "UI Layer" {
  [React Native Components] as RNC
  (Context / Hooks) as State
  [Navigation (Expo Router)] as Nav
}

package "Expo Managed Environment" {
  [Expo Modules Core] as Core
  [expo-font] as Font
  [expo-splash-screen] as Splash
  [expo-system-ui] as SysUI
}

package "Native OS Layer" {
  [Android OS Font Rendering] as OSFont
  [Android Activity / Window] as OSWindow
}

RNC --> State : State Management
State --> Nav
Nav --> Core : Bridge / JSI

Core --> Font
Core --> Splash
Core --> SysUI

Font ..> OSFont
Splash ..> OSWindow
SysUI ..> OSWindow
@enduml
```

## 2. EAS Build Flow (Prebuild Process)

This sequence diagram explains the exact process of how the standalone APK is built in the cloud and how Native Mismatches (like the one we fixed) occur.

```plantuml
@startuml
actor "GitHub Repository" as Git
participant "Expo Application Services" as EAS
participant "Node Package Manager" as NPM
participant "Expo Prebuild" as PB
participant "Android Gradle" as Gradle

Git -> EAS: Trigger Build (main branch)
EAS -> NPM: npm ci (Install JS dependencies)
note right: Uses package-lock.json\n(SDK 54 versions)

EAS -> PB: npx expo prebuild
note right: If /android folder exists in Git,\nEAS skips regenerating it!
PB -> Gradle: Inject Native Modules (Java/Kotlin)

Gradle -> Gradle: Compile APK
alt Native Modules Match SDK
    Gradle -->> EAS: Build Successful
    EAS -->> Git: APK Available for Download
else Native Modules Mismatch
    Gradle -->> EAS: Build Successful (Code Compiles)
    EAS -->> Git: APK Available
    note right: App crashes on runtime due to\nmissing Kotlin methods!
end
@enduml
```

## 3. Application Boot & Error Boundary Flow

This diagram shows what happens when the user opens the application, and how the `ErrorBoundary` catches JavaScript errors versus how Native crashes bypass it.

```plantuml
@startuml
start
:Initialize Native Android Activity;
:Show Splash Screen;

if (Are Native Modules Compatible?) then (No)
  #red:FATAL NATIVE CRASH\nApp Flickers & Dies;
  stop
else (Yes)
  :Load JavaScript Bundle;
  :Mount App.tsx;
  
  if (JS Exception Occurs?) then (Yes)
    :Caught by ErrorBoundary;
    :Show Fallback Error Screen;
  else (No)
    :Render Main Navigation Screen;
  endif
endif
stop
@enduml
```

## 4. User Interaction (Use Case) - Planned Features

This use case diagram maps out the core actions a user can take inside the application, including the upcoming roadmap features.

```plantuml
@startuml
left to right direction
actor User

package "Smart Expense" {
  usecase "Add Personal Expense" as UC1
  usecase "View Expense History" as UC2
  usecase "Create Group" as UC3
  usecase "Group Invite via QR Code" as UC4
  usecase "Split Group Bill" as UC5
  usecase "Split by Custom Percentage" as UC6
  usecase "Split by Exact Amount" as UC7
  usecase "Export to PDF" as UC8
  usecase "Attach Receipt Photo" as UC9
}

User --> UC1
User --> UC2
User --> UC3
User --> UC5
User --> UC8
User --> UC9

UC3 .> UC4 : <<include>>
UC5 <. UC6 : <<extend>>
UC5 <. UC7 : <<extend>>
UC1 <. UC9 : <<extend>>
@enduml
```
