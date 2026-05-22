# Vinetelligence Silo Deployment Guide
## Enterprise Intelligence Architecture (EIA) v3.1.0

This guide is intended for Enterprise IT Departments deploying their own **Cloud Silo** (Supabase/PostgreSQL instance) for Vinetelligence. This architecture ensures complete data residency and isolation.

---

### 1. Provisioning Requirements
- **PostgreSQL 15.1+** (Enabled with `uuid-ossp` and `pgcrypto` extensions).
- **Supabase Stack** (Recommended) or high-availability PostgreSQL with a REST API layer.
- **SSL Enforcement**: All connections must reside behind HTTPS/TLS.

### 2. Deployment Protocol
1. Create a new Supabase Project.
2. Initialize the schema using the **Golden Source SQL**:
   - Execute `SUPABASE_SETUP.sql` (found in the root directory).
   - This script is idempotent and handles table creation, RLS cleanup, and indexing.
3. Configure **Row-Level Security (RLS)**:
   - Ensure `get_user_restaurant_id()` is stable.
   - Verify that policy isolation prevents cross-establishment data leaks.

### 3. Identity Synthesis (Authentication)
Vinetelligence uses standard Supabase Auth.
- **Provider**: Google OAuth (Standard) or Email/Secret.
- **Redirect URIs**: Must include `https://vinetelligence.live`.
- **Claims**: The system expects a `restaurant_id` in the `user_metadata` for seamless session restoration.

### 4. Integration Hub (API Keys)
To link the Vinetelligence Frontend to your Silo:
- Obtain `SUPABASE_URL` and `SUPABASE_ANON_KEY`.
- In the Vinetelligence portal, navigate to **Onboarding > Security Node** or **Settings > Cloud Silo**.
- Input the credentials to establish a dedicated bridge.

### 5. High-Availability Scaling
For enterprise-grade throughput:
- **Index Optimization**: Ensure `idx_inventory_restaurant_id` and `idx_orders_restaurant_id` are maintained.
- **Rate Limiting**: Align your Supabase plan with the expected volume of concurrent "Vision Audits" and "Pulse Checks".

---
**Confidentiality Notice:** This protocol is part of the Vinetelligence Enterprise Intellectual Property. Handle according to your Master Service Agreement (MSA).
