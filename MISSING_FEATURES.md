# Missing Features Backlog (Luminous Ledger UI)

The following UI/UX features were included in the Stitch "Luminous Ledger" conceptual designs but are currently unsupported by the application logic and require further implementation:

## 1. Quick Split Action on Individual Transactions
- **Design:** The UI includes a "Quick Split" button next to standard transactions to easily convert a personal expense into a group split.
- **Backend requirement:** We have a `POST /expenses/:id/move-to-group` endpoint, but the frontend needs an intuitive flow to select members and assign splits without navigating away from the dashboard or transactions list.

## 2. Aggregated "Owed to You" / "You Owe" Summary (Cross-Group)
- **Design:** The dashboard features a "Split with Friends" card that shows a singular summarized number for "Owed to you" and "You owe".
- **Backend requirement:** The backend needs an endpoint (likely an aggregation on `/settlements`) to calculate the net total across *all* active groups for the user in real-time, reducing multiple API calls. Currently, settlements are calculated per group.

## 3. Light Mode Variant
- **Design:** The Luminous Ledger design system is exclusively dark-mode optimized (Deep Navy, Glassmorphism, Neon glow). 
- **Requirement:** A light mode equivalent needs to be defined in the Stitch design system (or manually crafted) that maintains the glass/neon aesthetic on a lighter surface without causing eye strain.

## 4. Advanced Micro-Animations
- **Design:** Pressing a GlassCard should cause it to "sink" (scale 0.98) and increase border opacity.
- **Frontend requirement:** Implement `react-native-reanimated` or utilize `Animated` API to wrap the `<GlassCard>` with interactive scaling states.

## 5. Analytics Charts & Data Visualization
- **Design:** The "Analytics & Budgets" screens feature interactive pie charts and spending trend graphs.
- **Frontend requirement:** We currently only render progress bars for budgets. We need to install a charting library (like `react-native-chart-kit` or `victory-native`) and parse the `/analytics/summary` endpoint to render full charts.

## 6. Avatar Upload / Media Handling
- **Design:** The Profile screen design includes a dedicated avatar image circle with an edit overlay.
- **Backend/Frontend requirement:** The `users/me` endpoint currently doesn't accept image uploads. We need to integrate `expo-image-picker`, a cloud storage bucket (e.g., S3 or Cloudinary), and update the database schema to store `avatarUrl`.

## 7. Granular Filtering & Pagination
- **Design:** The "Search & Filter" screen for transactions includes advanced date range pickers and multi-select categories.
- **Backend requirement:** The `/expenses` endpoint currently returns a flat list (which we filter client-side). We need to implement server-side pagination (`limit`, `offset`) and complex query parameters (`startDate`, `endDate`, `categories[]`) to handle large datasets efficiently.
