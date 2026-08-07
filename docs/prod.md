# Smart Expense - Project Requirements

## Overview
Smart Expense is a mobile application designed to help users track personal expenses and easily split bills among groups or roommates.

## Current State
- **Framework:** React Native + Expo (SDK 54)
- **Language:** TypeScript
- **Target Platform:** Android (APK via EAS Build)
- **Design System:** "Luminous Ledger" (Glassmorphism + Neon Accents)
- **Backend:** Node.js, Express, Prisma ORM, PostgreSQL (Neon serverless)
- **Core Features Implemented:** Push Notifications, Split Percentages, Glassmorphism Theming, OTA Updates, Duplicate Group Expense Detection, JWT Authentication, Custom Categories, Budget Alerts.

## Completed Roadmap Milestones
1. **Push Notifications:** fully integrated using `expo-notifications` (Friend Requests, Join Approvals, Group Expense Additions, Settlements).
2. **Split by custom percentage/exact input**: Advanced bill splitting logic handles MIN_CASH_FLOW debt simplifications perfectly.
3. **Over-The-Air (OTA) Updates:** Configured via `expo-updates` to allow instant UI/Logic pushes without new APK builds.
4. **Git LFS Android APK distribution:** APK is hosted directly via the project website on Render.

## Pending Features (Future)
1. **Export to PDF**: Generate and export expense reports for sharing or record-keeping.
2. **Receipt photo attachment**: Allow users to upload or snap images of receipts for specific expenses.
3. **Group invite via QR code**: Generate a QR code to quickly add members to a shared expense group.

*(Note: Multi-currency support and Voice Entry have been explicitly removed from scope).*
