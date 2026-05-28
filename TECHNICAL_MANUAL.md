# Vinetelligence AI Technical Manual

## 1. System Architecture & Component Mapping
Vinetelligence AI is a full-stack system built using React 18, Vite, and Express (Node.js backend proxy), backed by a Supabase Postgres layer.
For a visualization of core modules, refer to [SYSTEM_DIAGRAM.md](./SYSTEM_DIAGRAM.md).

## 2. Tech Stack Overview
- **Frontend Core**: React 18, Vite, Tailwind CSS, Framer Motion (`motion/react`).
- **Backend API**: Express (running on port `3000` under Cloud Run or standard local setups).
- **Core Database**: Supabase (Postgres, Row Level Security, Real-time streams).
- **AI Integrations**: Gemini API (with server-side token management), leveraging the native `@google/genai` TypeScript SDK.

## 3. Key Technical Implementations & Architectural Decisions

### A. Non-Technical Terminology Re-framing
To maximize owner, operator, and manager adoption, the user-facing marketing language has been simplified.
- **Neural Operating System** is re-termed to **AI-Powered Operating System** or **AI-powered system for restaurant and beverage operations**.
- This change was recursively applied inside code templates, public layout components, comparison widgets, and the conversational AI system avatars (`AIAvatarChat.tsx` system persona instructions).

### B. Prevention of Production Multi-Tenant App Crossover
An issue where `vinea.live` (the guest sommelier layout) overlapped with `vinetelligence.live` (the core SaaS platform) has been resolved.
- Implemented a strict hostname-bound evaluation protocol during early boot inside `main.tsx`:
  ```typescript
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname.includes('vinea.live')) {
      return 'vinea';
    }
    if (hostname.includes('vinetelligence.live')) {
      return 'marketing';
    }
  }
  ```
- This ensures that production DNS resolution directly guides the app experience to the correct interface, preventing user state collisions while preserving the interactive developer sandbox switching inside local dev variables.

### C. Admin Privilege Escalation on Resource Modifying / Purging
Operators frequently faced issues deleting nodes or editing statuses due to strict database Row Level Security (RLS) policies on the client level, resulting in:
`Sync Error: Update failed. You may not have permission to modify this node.`
- **Backend Resolvers**: Created secure full-stack backend endpoints in `server.ts` to execute privileged administrative operations using the Supabase Service Role client:
  - `/api/ops/update-restaurant-status`: Updates the target node status with elevated permission.
  - `/api/ops/delete-restaurant`: Safe recursive cascading purge that wipes dependent tables (`order_items`, `orders`, `guest_journeys`, `tables`, `staff_assignments`, `inventory`, `transactions`, `equipment`, `staff_roster`, `saas_ledger`, `profiles`) before cleanly removing the parent corporate record.
- **Service Fallback**: `supabaseSync.ts` uses these API endpoints with seamless client-side fallbacks using standard user tokens should the service proxy be unreachable.

### D. UI Layout & Dock Prevention Clipping
The "App Switcher & Comparison" utility was previously overlapping the sidebar/footer logout elements on various displays.
- **Coordinate Adjustment**: Repositioned the floating dock in `main.tsx` using responsive classes:
  - Mobile viewports: `bottom-24 left-4 z-[9999]` (places the button above the mobile standard footer navigation bar).
  - Tablet & Desktop viewports: `md:bottom-4 md:left-[280px]` (offsets the utility past the 260px wide static side menu, safeguarding full visibility for primary controls and account sign-out actions).

### E. Explicit Integration of Operational Workspaces
To bridge previously inaccessible standalone tools into the core user experience, we mapped additional custom workspaces to the `AppView` enum and updated `Layout.tsx` and `AppViewManager.tsx`:
- `AppView.DISPATCH` -> Renders `OmnichannelDispatchDesk` (Guest Outreach Desk)
- `AppView.INTEGRATION_HUB` -> Renders `IntegrationHubView` (Connected Software Systems)
- `AppView.TREND_INTELLIGENCE` -> Renders `TrendIntelligenceNode` (Industry Trends Hub)
- Applied dynamic multilingual translation mapping via `getBrandedTerm` to provide either high-intelligence "Elite" descriptions or simple "Light" user titles for each view.
