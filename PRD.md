# Copilot Value Explorer

A dashboard application that visualizes GitHub Copilot business value and adoption metrics for the Octodemo GitHub enterprise, providing executive-friendly insights into usage patterns and ROI with comprehensive drill-down capabilities.

**Experience Qualities**:
1. **Professional** - Clean, corporate aesthetic that instills confidence in data accuracy
2. **Insightful** - Clear visual hierarchy that surfaces key metrics immediately with deep drill-down exploration
3. **Actionable** - Adoption assessment and detailed breakdowns provide clear guidance on Copilot utilization

**Complexity Level**: Complex Application (advanced functionality with multiple views)
- Dashboard with metric tiles, trend charts, feature adoption, and comprehensive drill-down modals for exploring data at multiple levels

## Essential Features

### Metric Tiles with Drill-Down
- Functionality: Display four key Copilot metrics (Total Seats, Active Users, Engaged Users, Adoption Rate) - each clickable for detailed breakdown
- Purpose: Provide at-a-glance executive summary with ability to explore deeper
- Trigger: Page load / Click on any tile
- Progression: App loads → Tiles display → Click opens modal → Detailed charts and data shown
- Success criteria: All tiles clickable, modals display relevant breakdowns (team, editor, activity distributions)

### User Activity Trend Chart
- Functionality: Area chart showing 14-day trend of active and engaged users - clickable data points for daily details
- Purpose: Visualize adoption momentum with ability to drill into any specific day
- Trigger: Page load / Click on chart data point
- Progression: Data loaded → Chart renders → Click data point → Day-specific metrics modal opens
- Success criteria: Chart interactive, clicking any point shows that day's complete breakdown

### Feature Adoption Panel
- Functionality: Display usage of each Copilot feature (Code Completions, IDE Chat, PR Summaries, GitHub Chat) - each clickable for trend analysis
- Purpose: Understand which features drive engagement with historical trends
- Trigger: Page load / Click on feature
- Progression: Features listed → Click feature → Modal shows 14-day trend, editor breakdown, engagement rate
- Success criteria: Each feature drillable, showing usage trends and detailed metrics

### User Seats List with Details
- Functionality: Grid of assigned seats showing user, editor, team, and activity status - clickable for full user profile
- Purpose: Explore individual user engagement and identify inactive seats
- Trigger: Page load / Click on user
- Progression: Users listed → Click user → Modal shows last activity, editor preference, assignment date, 7-day activity heatmap
- Success criteria: Each user drillable with complete engagement profile

### Adoption Rate Analysis
- Functionality: Click adoption tile for detailed threshold visualization and seat utilization breakdown
- Purpose: Understand adoption health with clear threshold guidance
- Trigger: Click adoption tile
- Progression: Click tile → Modal shows large percentage, progress bar, threshold explanations
- Success criteria: Clear visualization of current rate vs thresholds (Strong ≥70%, Moderate 40-69%, Underutilized <40%)

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
