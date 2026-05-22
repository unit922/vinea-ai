# Vinetelligence AI Technical Manual

## 1. System Architecture
Vinetelligence AI is a full-stack application built with React, Vite, and Supabase. It leverages the Google Gemini API for multimodal intelligence and real-time voice interactions.
For a visual representation, see [SYSTEM_DIAGRAM.md](./SYSTEM_DIAGRAM.md).

## 2. Tech Stack
- **Frontend**: React 18, Vite, Tailwind CSS, Framer Motion (motion/react).
- **Backend**: Supabase (PostgreSQL, Auth, Real-time).
- **AI Engine**: Google Gemini API (gemini-3.1-flash-live-preview for voice, gemini-3-flash-preview for text).
- **Data Persistence**: LocalStorage (fallback/demo), Supabase (cloud-sync).

## 3. AI Avatar Implementation
The AI Avatar (`AIAvatarChat.tsx`) uses the Gemini Live API for low-latency voice interactions.
- **Persona Switching**: The component accepts an `isIntroMode` prop.
  - `isIntroMode={true}`: Sets the system instruction to "Vinetelligence Product Specialist" for onboarding.
  - `isIntroMode={false}`: Sets the system instruction to "Vinetelligence Beverage Intelligence" for in-app assistance.
- **Interruption Handling**: Implements manual PCM encoding/decoding for real-time audio streaming.

## 4. Onboarding & Demo Modes
- **Demo as Operator**: Launches the app in a sandbox mode with `edition="demo"` and `demoMode="operator"`.
- **Removal of Guest Demo**: The "Demo as Guest" option has been removed from the onboarding flow to streamline the user experience for establishment owners and staff.

## 5. Data Synchronization
- **Supabase Sync**: The `supabaseSync.ts` service handles bidirectional data flow between local state and the Supabase backend.
- **Manual Overrides**: `RestaurantProfile` includes fields for `manualPortalUrl` and `manualMenuUrl` to allow for custom documentation and portal links.

## 6. Security & Permissions
- **Firestore Rules**: Implements strict ownership-based access control.
- **Environment Variables**: Requires `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and `GEMINI_API_KEY`.

## 7. Deployment
The application is designed for deployment on Cloud Run or Vercel, with environment variables managed via the platform's settings.
