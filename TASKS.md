# TASKS

## Main Dashboard

**What currently exists:**
A basic dashboard showing a greeting, total spending card, a single overall budget progress bar, a total splits summary, and quick action links.

**Issues found, categorized:**
- MISMATCH: Top App Bar shows "Hello, [Name]" instead of "Smart Expense" and is missing the wallet icon on the left (Minor).
- MISMATCH: Overview Card shows only total spending, missing the "Remaining Budget" and trend indicator (Major).
- MISMATCH: "Budget Progress" shows a single overall progress bar, instead of a detailed "Budget Breakdown" category list (Food, Transport, etc.) (Major).
- MISMATCH: "Split with Friends" shows aggregate totals instead of the "Quick Settlements" horizontal scroll of individual friends (Major).
- MISSING UI: "Recent Activity" list of transactions with category icons is entirely missing (Blocker).
- EXTRA: "Quick Actions" list (Add Expense, View Budgets, Profile) exists but is not in the spec (Minor).

**Next actions:**
- Update `ScreenHeader` or create a custom header for the Dashboard matching the "Smart Expense" title, wallet icon, and bell icon.
- Refactor the "This Month" card into the "Overview Card" to include total spend, remaining budget, and trend.
- Replace the overall "Budget Progress" with a "Budget Breakdown" list showing categories with progress bars.
- Replace "Split with Friends" with a "Quick Settlements" horizontally scrolling list of friends (requires fetching friend/settlement data).
- Implement the "Recent Activity" section fetching recent transactions and displaying them as a list.
- Remove the "Quick Actions" section to align with the design spec.

## Add Expense

**What currently exists:**
A form with a generic text input for amount, a grid of generic chips for categories, a date input (text), a notes text input, and a save button at the bottom. The UI is built using the app's generic components.

**Issues found, categorized:**
- MISMATCH: The screen layout does not match the modal-like stylized spec with a large custom numpad (Blocker).
- MISSING UI: Type Toggle for "Personal" vs "Group Split" is missing (Major).
- MISMATCH: Amount input is a standard text field instead of the large neon text display that updates via a custom on-screen numpad (Major).
- MISMATCH: Categories are shown as standard text chips rather than horizontally scrollable stylized circles with icons (Minor).
- MISMATCH: Date input is a standard text field instead of a stylized dropdown/button (Minor).
- MISMATCH: Notes input is a standard input rather than a larger text area with a leading edit icon (Minor).

**Next actions:**
- Replace the entire `AddExpenseScreen` layout with the custom UI matching the spec.
- Implement the "Personal / Group Split" toggle at the top.
- Build the custom on-screen Numpad component for amount entry.
- Implement horizontal scrollable category icons.
- Update the Date and Notes fields to match the design (larger text area, custom styling).
- Add the sticky, glowing "Add Expense" button at the bottom.

## Group Details

**What currently exists:**
A single vertically scrollable screen containing group header, admin actions (invite code, join requests), a detailed list of all members with their balances, quick add member input, generic "Add Expense" / "Calculate" action buttons, and a preview list of 2 expenses.

**Issues found, categorized:**
- MISSING UI: The "Group Summary Hero" showing "Total Group Balance" and "Your Balance" with a decorative glowing orb is missing (Blocker).
- MISMATCH: Tab Navigation ("Expenses" vs "Settlements") is completely absent. Everything is currently dumped into one long scrollable page (Major).
- MISMATCH: The design calls for a Bento Grid layout where "Group Members" is just a small preview card with overlapping avatars, rather than the current massive list of detailed member cards (Major).
- EXTRA: Admin controls (Invite Code, Join Requests) are not in the spec. They should either be moved to "Group Settings" or kept hidden unless the user is an admin (Major).
- MISMATCH: "Calculate" button exists instead of showing the "Settlement Logic" inline under the Settlements tab (Minor).

**Next actions:**
- [x] Refactor `GroupDetailScreen` to use a tabbed interface (Expenses / Settlements state).
- [x] Implement the "Group Summary Hero" glass card at the top.
- [x] For the "Expenses" tab: Implement the bento grid with "Add Expense" button, "Group Members" avatar preview card, and "Recent Transactions" list.
- [x] For the "Settlements" tab: Implement the "Settlement Logic" list (e.g., "Alice pays You") with a "Mark Settled" button.
- [x] Extract or hide the detailed Member list / Admin controls (perhaps moving them to a dedicated "Group Settings" or separate section).

## Profile Screen

**What currently exists:**
A vertically scrollable screen with standard header, functional avatar upload, inline editable Display Name and Security Question, and functional action links (Categories, Recurring, Theme toggle, Logout).

**Issues found, categorized:**
- MISSING UI: The entire Bento Stats Grid (Total Spent, Total Owed, Total Saved) is missing (Blocker).
- MISSING UI: "Connected Accounts" section is missing (Major).
- MISMATCH: The visual style of the avatar and personal details is basic. The spec demands a glowing neon avatar border, a dedicated "Personal Details" card with Phone and Member Since (Major).
- EXTRA: The current app has functional links to "Categories", "Recurring", and "Theme" toggle. The spec has generic placeholders ("Security & Privacy"). We should retain the functional links but style them like the spec (Minor).

**Next actions:**
- [x] Refactor `ProfileScreen` layout to match the bento-grid heavy design.
- [x] Implement the Hero Avatar section with neon glowing effects.
- [x] Implement the Stats Grid (mock the data for Total Spent/Owed/Saved if backend endpoints don't exist yet, or compute them).
- [x] Restyle the Personal Details section to match the spec's read-only look, potentially keeping the inline edit functionality behind the "Edit Profile" button.
- [x] Add the Connected Accounts mock UI.
- [x] Update the Preferences list to retain Categories/Recurring/Theme toggle but styled like the spec.

## Transaction History (Expenses Screen)

**What currently exists:**
A screen (`ExpensesScreen.tsx`) displaying a list of personal expenses, a search bar, scrollable category filter chips, and a modal to move an expense to a group. It has a basic list layout without date-grouping.

**Issues found, categorized:**
- MISSING UI: The "Total Monthly Spend" hero card with horizontal "Personal/Group/Friends" breakdown is missing (Blocker).
- MISMATCH: The search and filter controls are different. Spec uses a search bar with "Date" and "Filter" buttons instead of horizontal category chips (Major).
- MISMATCH: The transaction list in the spec is grouped by date (TODAY, YESTERDAY) and has a more complex item layout (icons, category tag, time, amount, context tag like "Personal") (Major).
- EXTRA: Floating action button (+ Add) exists in the current screen but is missing in the spec (the spec relies on a bottom nav bar for Add). We should probably keep the ability to add expenses, but adjust its placement (Minor).

**Next actions:**
- [x] Implement the "Total Monthly Spend" hero card at the top.
- [x] Refactor the search and filter UI to match the spec's layout (Search bar + Date/Filter buttons).
- [x] Group the expenses list by relative date ("TODAY", "YESTERDAY") in the UI render logic.
- [x] Update the transaction item layout to include the category badge, time, context tag, and stylized icon.

## Category Manager (Categories Screen)

**What currently exists:**
A screen (`CategoriesScreen.tsx`) displaying a vertically scrollable list of Default and Custom categories. The "Add Custom Category" functionality is implemented via an inline input and color picker at the top of the screen.

**Issues found, categorized:**
- MISMATCH: The current layout is a simple flat list. The spec requires a 2-4 column grid layout (Bento grid style) for categories (Blocker).
- MISMATCH: The category cards in the spec feature large circular glowing icon containers, bolder typography, and a pill-shaped badge showing the count of expenses (e.g., "42"). The current app just has simple rows (Major).
- MISMATCH: The "Create New Category" action in the spec is a large, full-width, glowing button at the bottom of the screen, rather than the current inline text input card at the top. We will need to move the inline creation to a modal or a separate screen triggered by this new button (Major).

**Next actions:**
- [x] Refactor the list into a multi-column grid layout.
- [x] Update the category card styling to match the spec (glowing icon, expense count badge). (Will need to mock or compute the expense count per category).
- [x] Move the inline "Add Category" form into a modal and replace it with the large "Create New Category" glowing button at the bottom.

## Recurring Expenses (RecurringScreen)

**What currently exists:**
A screen (`RecurringScreen.tsx`) displaying an inline form at the top to create a recurring expense, followed by a simple text summary of active/total counts, and a basic flat list of recurring expenses with simple text and toggle/delete buttons.

**Issues found, categorized:**
- MISMATCH: The current screen uses a large inline form to add recurring expenses. The spec requires a clean list view with a Floating Action Button (+ Add) to add new recurring expenses (Blocker).
- MISMATCH: The summary section currently just displays raw counts (Active/Total). The spec requires a hero card displaying "Total Monthly" (e.g. $2,450.00) with a comparative trend line (Blocker).
- MISMATCH: The item cards are simple text rows. The spec requires stylized cards featuring circular glowing icons matching the category, the amount, the frequency, and all-caps status labels (e.g. "Paid", "In 5 Days") (Major).

**Next actions:**
- [x] Remove the inline "Add recurring expense" form and replace it with a styled Floating Action Button (+ Add) that opens a modal for creation.
- [x] Replace the simple text summary with the "Total Monthly" hero card. Calculate the sum of active recurring expenses.
- [x] Update the layout and styling of the recurring expense cards to match the spec (icons, layout, text styles).

## Analytics & Budgets (AnalyticsScreen)

**What currently exists:**
A screen (`AnalyticsScreen.tsx`) displaying four square summary metrics at the top, followed by a PieChart for categories, a text breakdown of categories, and a LineChart for monthly trends.

**Issues found, categorized:**
- MISMATCH: The current layout uses generic summary cards and standard charting libraries (PieChart, LineChart). The spec requires a custom Bento Grid layout containing a "Spending Trend" custom bar visualization and a "Category Breakdown" custom donut chart (Blocker).
- MISSING LOGIC/UI: The "Budget Management" list section is completely missing. The spec requires a list of budget categories with spent/total text and a glowing progress bar for each (Blocker).
- EXTRA: The 4 square summary cards (Total Spent, Avg/Day, Top Category, vs Last Month) and the complex LineChart are not present in this specific spec and should be replaced by the custom bento-grid charts (Major).

**Next actions:**
- [x] Replace the current summary grid and charts with the specified Bento Grid layout.
- [x] Implement the custom "Spending Trend" visualization (mocking "Last" and "This" month bars).
- [x] Implement the "Category Breakdown" custom donut chart (using a simulated conic-gradient or SVG) with a legend.
- [x] Add the "Budget Management" section at the bottom, mapping over mocked or actual budget limits to display the progress bars and spent/total amounts.

## Search & Filter (SearchScreen)

**What currently exists:**
The screen does not exist at all in the codebase (`MISSING_FEATURES.md` notes that Granular Filtering & Pagination are missing).

**Issues found, categorized:**
- MISSING UI: The entire Search & Filter screen from the spec is missing. The spec requires a search bar, horizontal scrollable date range pills, category selection grid with colored dot icons, amount range inputs, a transaction type toggle, and a "Recent Matches" list, topped off with a fixed "Apply Filters" button at the bottom (Blocker).

**Next actions:**
- [x] Create a new `SearchScreen.tsx` inside `mobile/src/modules/expenses/screens`.
- [x] Implement the UI based on the spec (Search input, Date Range pills, Category grid, Amount inputs, Transaction Type segment control, and a mock "Recent Matches" list).
- [x] Implement the fixed "Apply Filters" bottom action area.
- [x] Add navigation hooks so that it can eventually be accessed from the Transaction History (ExpensesScreen).

## Help & Support (HelpScreen)

**What currently exists:**
The screen does not exist at all in the codebase.

**Issues found, categorized:**
- MISSING UI: The entire Help & Support screen from the spec is missing. The spec requires a search bar, a Bento Grid of help categories (Account, Payments, Groups, Security), a list of recently viewed articles, and a prominent "Contact Support" card with a glowing action button (Blocker).

**Next actions:**
- [x] Create a new `HelpScreen.tsx` inside `mobile/src/modules/profile/screens` (or a dedicated support module).
- [x] Implement the UI based on the spec (Search bar, Categories Bento Grid, Recently Viewed articles, Contact Support card).

## Account Settings (SettingsScreen)

**What currently exists:**
The codebase has a `ProfileScreen` which covers basic profile stats and connected accounts, but the detailed "Account Settings" (Data Management, active devices, biometrics, password change) does not exist as a dedicated screen.

**Issues found, categorized:**
- MISSING UI: Detailed Account Settings screen (Data Management, Export CSV, Delete Account, Biometric Lock, Active Devices) is missing (Blocker).
- MISSING LOGIC: Biometric integration and device management not implemented (Major).

**Next actions:**
- [x] Create a new `SettingsScreen.tsx` in `mobile/src/modules/profile/screens`.
- [x] Implement Personal Information edit form to match the spec.
- [x] Implement Data Management section (Export CSV, Delete Account).
- [x] Implement Security section (Password change, Biometric toggle, Active Devices list).

## Notifications (NotificationsScreen)

**What currently exists:**
The codebase has a `NotificationsScreen.tsx` in `mobile/src/modules/notifications/screens/`. It uses a generic `Card` layout and does not implement the spec's neon glow indicators, categorized "Recent"/"Earlier" groupings, or type-specific icons.

**Issues found, categorized:**
- MISMATCH: The layout and visual styling are completely generic (missing glassmorphism, neon glows, specific icon colors for errors/success). The spec uses a unified "Recent" and "Earlier" segmented list instead of a flat list, and requires specific `error` and `secondary-container` glows (Major).

**Next actions:**
- [x] Refactor `NotificationsScreen.tsx` to match the Luminous Ledger spec.
- [x] Implement the `glass-panel` layout with `neon-glow` side borders based on notification type.
- [x] Structure the mocked data into "Recent" (unread) and "Earlier" (read) to display the divider properly.
- [x] Ensure the "Mark all read" and "View All History" buttons match the spec.

## Export Reports (ExportReportsScreen)

**What currently exists:**
The screen does not exist at all in the codebase.

**Issues found, categorized:**
- MISSING UI: The entire Export Reports screen is missing. The spec requires Date Range radio selections (This Month, Last Quarter, Custom), Format selections (PDF, CSV, EXCEL), Include Charts/Itemized Receipts toggles, a "Live Preview" document card with a mini CSS bar chart, and a prominent "Export Report" button (Blocker).

**Next actions:**
- [x] Create a new `ExportReportsScreen.tsx` in `mobile/src/modules/profile/screens` (or analytics module).
- [x] Implement the Date Range and Format selection grids.
- [x] Implement the toggles with custom Switch components.
- [x] Build the "Live Preview" card with mock data and mini bar charts.
- [x] Implement the large "Export Report" button.

## Group Settings (`EditGroupScreen.tsx`)

**What currently exists:**
`EditGroupScreen.tsx` exists and handles group detail edits (name/desc) and member removal/adding inline. It uses generic generic UI components.

**Issues found, categorized:**
- MISMATCH: Visual styling completely lacks the glassmorphism aesthetic.
- MISMATCH: The "Add Member" flow is inline instead of a dedicated "Invite Member" flow as per the spec.
- MISSING UI: Split Preferences (Default Split, Group Currency) and Settlement History link are missing (Major).
- MISMATCH: The "Delete Group" action is missing the prominent glowing danger zone styling.

**Next actions:**
- [x] Refactor `EditGroupScreen.tsx` to match the Group Settings spec (glass panels, proper member list with avatars).
- [x] Remove the inline "Add Member" form and replace it with a button that navigates to the new Invite Member screen.
- [x] Add mocked rows for Split Preferences and Settlement History.
- [x] Add the glowing "Delete Group" danger zone button.

## Invite Member (`InviteMemberScreen.tsx`)

**What currently exists:**
The screen does not exist. Member adding is currently done inline via `EditGroupScreen.tsx`.

**Issues found, categorized:**
- MISSING UI: The entire Invite Member screen is missing. The spec requires a "Share Invite Link" card, a "Find Contacts" search bar, and a "Suggested" members Bento Grid (Blocker).

**Next actions:**
- [x] Create a new `InviteMemberScreen.tsx` in `mobile/src/modules/groups/screens`.
- [x] Implement the "Share Invite Link" card with a glowing copy button.
- [x] Implement the "Find Contacts" glass search input.
- [x] Build the "Suggested" members Bento Grid with mock contacts and "Invite"/"Sent" states.

## Group Settlement (`SettlementsScreen.tsx`)

**What currently exists:**
`SettlementsScreen.tsx` exists and shows group balances, a summary, per-person breakdowns, and a "Record Payment" modal for partial settlements. It uses generic generic UI components (cards, standard buttons).

**Issues found, categorized:**
- MISMATCH: Visual styling completely lacks the Luminous Ledger glassmorphism aesthetic.
- MISMATCH: The "Total Balance" header is missing the large neon-pink/green typography and glowing "Settle All Debts" button.
- MISMATCH: The per-person list is heavily nested (cards inside cards) instead of clean, flat glass panels.
- MISSING UI: The "You Owe" vs "Owes You" vs "Settled Up" specific badge states (Pay button, Remind button, Check circle) match the data logically but need significant UI reskinning to match the spec.

**Next actions:**
- [x] Refactor `SettlementsScreen.tsx` to match the "Settle Up" spec.
- [x] Build the "Total Balance" summary header with gradient and glowing button.
- [x] Build the glass-panel list items for debts, mapping positive/negative balances to the "You owe" and "Owes you" layouts with neon typography.
- [x] Wire the existing `openSettleModal` logic to the new "Pay" button.

## Budget Goal Setting (`BudgetGoalsScreen.tsx`)

**What currently exists:**
The screen does not exist. There is a `BudgetsScreen.tsx` for spending limits, but no dedicated "Budget Goals" screen for savings targets.

**Issues found, categorized:**
- MISSING UI: The entire screen is missing (Blocker). Needs a "Monthly Target" summary card, a horizontal scroll of Goal Categories, a list of "Active Goals" with progress bars, and an "Add New Goal" bento block.

**Next actions:**
- [x] Create a new `BudgetGoalsScreen.tsx` in `mobile/src/modules/budgets/screens`.
- [x] Implement the "Monthly Target" card with glowing background and neon text.
- [x] Implement the Goal Categories horizontal scroll with active/inactive glass chips.
- [x] Implement the "Active Goals" list with animated neon progress bars.
- [x] Add the dashed "Start a New Goal" bento block.

## Transaction Details (`SharedExpenseDetailScreen.tsx`)

**What currently exists:**
`SharedExpenseDetailScreen.tsx` exists and shows the details of an expense, including total amount, paid by, split type, and a breakdown of who owes what.

**Issues found, categorized:**
- MISMATCH: Visuals are completely generic, missing the receipt-style edge and neon typography.
- MISMATCH: The header layout and "Action Header" (Edit button) are missing or non-compliant.
- MISMATCH: The "Paid By" section misses the avatar and credit card mock info.
- MISMATCH: The "Category" section uses text instead of the required glass-panel pill UI with colored dots.
- MISMATCH: The "Split Breakdown" list items don't have the required avatars, left-borders, or specific "Paid you"/"Owes you" layout formatting.
- MISSING UI: The "Delete Transaction" action button with the dashed/error style is missing entirely (Minor/Major).

**Next actions:**
- [x] Refactor `SharedExpenseDetailScreen.tsx` to match the "Transaction Details" spec.
- [x] Implement the "Receipt Card" with the decorative jagged SVG edge (or a mock style if SVG is tricky, but preferably SVG edge as defined).
- [x] Add the "Paid By" and "Category & Tags" sections with proper flex layout and styling.
- [x] Refactor the "Split Breakdown" list to match the spec's neon-bordered items and specific copy ("Paid you", "Owes you").
- [x] Add the "Delete Transaction" error button at the bottom.

## Splash Screen / Welcome Screen

**What currently exists:**
`SplashScreen.tsx` exists but acts purely as a loading indicator while checking auth session. The requested spec represents a "Welcome" or landing screen for unauthenticated users with a "Get Started" call-to-action.

**Issues found, categorized:**
- ARCHITECTURE: The app lacks a dedicated landing/welcome screen in the auth flow before login/register.
- MISMATCH: The current `SplashScreen` lacks the "glowing logo", "ambient background glow", and the "Get Started" CTA from the spec.

**Next actions:**
- [x] Create a new `WelcomeScreen.tsx` in `mobile/src/modules/authentication/screens` based on the Splash Screen spec.
- [x] Add `WelcomeScreen` as the initial route in `AuthNavigator`.
- [x] Update `SplashScreen.tsx` (the loading state) to match the visual style of the `WelcomeScreen` (minus the buttons) so the transition is seamless.

## Login / Sign Up

**What currently exists:**
`LoginScreen.tsx` and `RegisterScreen.tsx` exist but use generic components.

**Issues found, categorized:**
- MISMATCH: The background is missing the mesh pulse and ambient blur blobs.
- MISMATCH: The header is generic; needs the glass rounded-square logo and brand title.
- MISMATCH: The login card is generic. Needs glass-panel styling.
- MISMATCH: Inputs are generic. Needs glass-input styling with icons (mail, lock) and bottom borders.
- MISMATCH: The "Remember Me" and "Forgot Password" row doesn't match the design.
- MISMATCH: The submit button lacks the neon glow (`glow-button`) and arrow icon.

**Next actions:**
- [x] Refactor `LoginScreen.tsx` to match the "Login" spec.
- [x] Implement ambient mesh background and logo header.
- [x] Implement glass inputs with icons.
- [x] Implement the glowing submit button.

## Groups Screen (Main Tab)

**What currently exists:**
`GroupsScreen.tsx` uses generic components and lacks the Luminous Ledger specific UI treatments (glassmorphism, typography, neon glows).

**Issues found, categorized:**
- MISMATCH: Generic `Card` doesn't match the glass-panel design.
- MISMATCH: Join group and Create group buttons lack the glowing neon style.
- MISMATCH: The Join modal does not have the glassmorphism and glowing effects.
- MISMATCH: Typography does not use Hanken Grotesk and JetBrains Mono explicitly.

**Next actions:**
- [x] Refactor `GroupsScreen.tsx` to apply Luminous Ledger design system tokens.
- [x] Add glass-panel styling (`rgba(255,255,255,0.05)` background, `0.12` border) to group cards.
- [x] Update header and button styles.
- [x] Upgrade the Join Modal to use glassmorphism and neon aesthetics.

## Expenses Screen (Main Tab)

**What currently exists:**
`ExpensesScreen.tsx` uses generic backgrounds and basic font styling without the Luminous Ledger specific treatments.

**Issues found, categorized:**
- MISMATCH: The summary card lacks the dark glass aesthetic and proper typography.
- MISMATCH: The search and filter controls use basic solid colors instead of translucent borders.
- MISMATCH: The list items (transactions) lack the glassmorphism card wrapper.
- MISMATCH: The "Add to Group" modal uses a basic solid background and generic text.
- MISMATCH: Typography does not explicitly use `Hanken Grotesk` and `JetBrains Mono`.

**Next actions:**
- [x] Refactor `ExpensesScreen.tsx` to apply Luminous Ledger design tokens.
- [x] Add mesh background blobs (optional, but consistent with groups).
- [x] Refactor the "Add to Group" modal to use the dark glass aesthetic.
