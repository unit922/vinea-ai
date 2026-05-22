# Vinetelligence System Architecture

```mermaid
graph TD
    subgraph Client_Layer [Client Application - React/Vite]
        UI[User Interface - Tailwind CSS]
        Store[Zustand Store - State Management]
        Local[Local Storage - Persistence Fallback]
    end

    subgraph Intelligence_Layer [AI Engine]
        Gemini[Google Gemini API]
        Voice[Gemini Live - Audio Streaming]
        Analysis[Predictive Analytics & Synthesis]
    end

    subgraph Data_Layer [Backend & Persistence]
        Supabase[Supabase PostgreSQL]
        Auth[Supabase Auth - Identity]
        Realtime[Supabase Real-time Sync]
    end

    subgraph Integration_Layer [External Ecosystem]
        Stripe[Payment Gateway - Stripe/PayPal]
        Crypto[Web3 Payments - Crypto]
    end

    %% Relationships
    UI <--> Store
    Store <--> Local
    UI <--> Gemini
    UI <--> Voice
    Store <--> Supabase
    Supabase <--> Auth
    UI <--> Stripe
    UI <--> Crypto
    Gemini <--> Analysis
```

## Data Flow Descriptions

1. **User Interaction**: Staff or Guests interact with the React frontend.
2. **State Management**: Zustand orchestrates local state, ensuring UI responsiveness.
3. **Intelligence Loop**: 
   - Non-blocking calls to Gemini API for menu synthesis and inventory prediction.
   - Low-latency WebSocket connections for the AI Avatar (Gemini Live).
4. **Synchronization**: 
   - `supabaseSync.ts` handles background persistence to the cloud silo.
   - LocalStorage provides immediate recovery for offline-first resilience.
5. **Fiscal Processing**:
   - `FinancialEngine` routes settlement requests to Stripe, PayPal, or Crypto gateways.
   - Transactions are recorded in Supabase and verified via RLS (Row Level Security).
