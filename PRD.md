# Copilot Value Explorer

A dashboard application that visualizes GitHub Copilot business value and adoption metrics for the Octodemo GitHub enterprise, providing executive-friendly insights into usage patterns and ROI.

**Experience Qualities**:
1. **Professional** - Clean, corporate aesthetic that instills confidence in data accuracy
2. **Insightful** - Clear visual hierarchy that surfaces key metrics immediately
3. **Actionable** - Adoption assessment provides clear guidance on Copilot utilization status

**Complexity Level**: Light Application (multiple features with basic state)
- Dashboard with multiple metric tiles, a trend chart, and adoption assessment logic requires coordinated state management but no complex user flows

## Essential Features

### Metric Tiles
- Functionality: Display four key Copilot metrics (Active Users, Total Seats, Acceptance Rate, 7-day Usage Trend)
- Purpose: Provide at-a-glance executive summary of Copilot adoption
- Trigger: Page load
- Progression: App loads → API fetches Copilot data → Metrics calculated → Tiles populated with values
- Success criteria: All four tiles display accurate, formatted values with clear labels

### Acceptance Rate Trend Chart
- Functionality: Line chart showing daily acceptance rate over last 7 days
- Purpose: Visualize adoption momentum and identify trends
- Trigger: Page load after data fetch
- Progression: Data loaded → Chart renders with 7 data points → Hover shows daily values
- Success criteria: Chart displays smooth line with clear axis labels and data points

### Adoption Assessment
- Functionality: Calculate and display adoption status (Strong/Moderate/Underutilized) based on active users ÷ total seats ratio
- Purpose: Provide actionable insight on Copilot utilization health
- Trigger: After metrics calculation
- Progression: Ratio calculated → Threshold applied → Status badge displayed with explanation
- Success criteria: Correct status displayed with threshold explanation (Strong ≥70%, Moderate 40-69%, Underutilized <40%)

## Edge Case Handling

- **API Errors**: Display error state with retry option and helpful message
- **Loading State**: Show skeleton loaders while data fetches
- **Zero Seats**: Handle division by zero gracefully with "No data" message
- **Missing Data Points**: Chart handles gaps in 7-day data gracefully

## Data Source

Currently using realistic mock data that simulates the GitHub Enterprise Copilot API responses. The mock data generates:
- 28 days of metrics history with realistic usage patterns
- 10 sample user seats with varied activity levels
- Editor distribution across VS Code, JetBrains, and Neovim

Note: The actual GitHub API endpoints (`/enterprises/{enterprise}/copilot/metrics` and `/enterprises/{enterprise}/copilot/billing/seats`) require enterprise admin authentication which is not available in the Spark runtime environment.

## Design Direction

Executive dashboard aesthetic - clean, spacious, data-focused. Conveys trustworthiness and professionalism while remaining visually engaging. Uses GitHub's brand essence without being a GitHub clone.

## Color Selection

- **Primary Color**: `oklch(0.45 0.15 250)` - Deep blue conveying trust and professionalism
- **Secondary Colors**: `oklch(0.96 0.01 250)` - Light blue-gray for card backgrounds
- **Accent Color**: `oklch(0.65 0.18 145)` - Green for positive metrics and success states
- **Foreground/Background Pairings**:
  - Background (`oklch(0.98 0.005 250)`): Foreground (`oklch(0.25 0.02 250)`) - Ratio 10:1 ✓
  - Card (`oklch(1 0 0)`): Card Foreground (`oklch(0.25 0.02 250)`) - Ratio 12:1 ✓
  - Primary (`oklch(0.45 0.15 250)`): Primary Foreground (`oklch(0.99 0 0)`) - Ratio 7:1 ✓

## Font Selection

Modern, clean sans-serif typography that balances professionalism with approachability. Inter for body text ensuring excellent readability, paired with Space Grotesk for headings to add technical sophistication.

- **Typographic Hierarchy**:
  - H1 (Dashboard Title): Space Grotesk Bold/32px/tight letter spacing
  - H2 (Section Headers): Space Grotesk Semibold/20px/normal
  - Metric Values: Space Grotesk Bold/36px/tight
  - Metric Labels: Inter Medium/14px/wide letter spacing
  - Body Text: Inter Regular/16px/normal

## Animations

Subtle, purposeful animations that enhance perceived performance without distraction. Metric tiles fade in sequentially on load. Chart line draws smoothly. Status badge pulses gently once on assessment change.

## Component Selection

- **Components**:
  - Card: Metric tiles with subtle shadow and hover elevation
  - Badge: Adoption status indicator with color variants
  - Skeleton: Loading states for all data elements
  - Separator: Section dividers
- **Customizations**: Custom trend indicator with arrow and percentage
- **States**: Cards have subtle hover state with slight elevation; badges have distinct colors per status level
- **Icon Selection**: TrendUp/TrendDown for trend indicators, Users for active users, Chair for seats, CheckCircle for acceptance
- **Spacing**: 24px section gaps, 16px card padding, 8px element spacing
- **Mobile**: Stack metric tiles 2x2, chart full width, maintain readability at small sizes
