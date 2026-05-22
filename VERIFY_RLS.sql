-- VERIFY_RLS.sql
-- Use this script in Supabase SQL Editor to verify RLS enforcement

-- 1. SETUP TEST DATA
-- Switch to postgres to bypass RLS for setup
SET ROLE postgres;

-- Ensure the restaurants table has a unique name constraint for this script's upsert logic
-- This handles cases where 'Vinetelligence Enterprise' already exists with a different ID
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'restaurants_name_key') THEN
        ALTER TABLE public.restaurants ADD CONSTRAINT restaurants_name_key UNIQUE (name);
    END IF;
END $$;

-- Dynamic Setup Block
DO $$
DECLARE
  ent_id UUID;
  bistro_id UUID;
BEGIN
  -- Upsert "Vinetelligence Enterprise" (Master Node)
  INSERT INTO public.restaurants (name, slug, edition, mrr, billing_status) 
  VALUES ('Vinetelligence Enterprise', 'vinetelligence-enterprise', 'enterprise', 0, 'N/A')
  ON CONFLICT (name) DO UPDATE SET slug = EXCLUDED.slug, edition = EXCLUDED.edition, mrr = EXCLUDED.mrr, billing_status = EXCLUDED.billing_status
  RETURNING id INTO ent_id;

  -- Upsert "Local Bistro" (Regular Node)
  INSERT INTO public.restaurants (name, slug, edition, mrr, billing_status) 
  VALUES ('Local Bistro', 'local-bistro', 'standard', 199, 'Current')
  ON CONFLICT (name) DO UPDATE SET slug = EXCLUDED.slug, edition = EXCLUDED.edition, mrr = EXCLUDED.mrr, billing_status = EXCLUDED.billing_status
  RETURNING id INTO bistro_id;

  -- Setup test data for isolation
  INSERT INTO public.inventory (id, restaurant_id, name, category, unit)
  VALUES 
    ('inv-ent', ent_id, 'Enterprise Reserve', 'Wine', 'bottle'),
    ('inv-bistro', bistro_id, 'Bistro House Red', 'Wine', 'bottle')
  ON CONFLICT (id) DO UPDATE SET restaurant_id = EXCLUDED.restaurant_id, name = EXCLUDED.name;

  -- Setup ledger data
  INSERT INTO public.saas_ledger (restaurant_id, amount, description)
  VALUES (bistro_id, 199, 'Bistro March Subscription')
  ON CONFLICT DO NOTHING;
END $$;

-- 2. TEST CASE: @vinetelligence.live user (Master Admin)
-- Switch to authenticated role
SET ROLE authenticated;

-- Mock a JWT for a vinetelligence.live user with Developer role
SELECT set_config('request.jwt.claims', '{"sub": "10000000-0000-0000-0000-000000000001", "email": "admin@vinetelligence.live", "user_metadata": {"role": "Developer"}}', true);

-- Verify Registry access: @vinetelligence.live SHOULD see ALL restaurants
SELECT 'TEST @vinetelligence.live registry (Should see ALL restaurants)' as test_step;
SELECT name, edition, mrr FROM public.restaurants; 

-- Verify Ledger access: @vinetelligence.live SHOULD see global SaaS ledger
SELECT 'TEST @vinetelligence.live ledger (Should see SaaS payments)' as test_step;
SELECT amount, description FROM public.saas_ledger;

-- Verify Operational Isolation: @vinetelligence.live SHOULD ONLY see Vinetelligence Enterprise inventory
SELECT 'TEST @vinetelligence.live inventory (Should ONLY see Enterprise Reserve)' as test_step;
SELECT name FROM public.inventory;

-- 3. TEST CASE: Regular user (Bistro Manager)
RESET ROLE;
SET ROLE authenticated;

-- Mock a JWT for a regular user assigned to 'Local Bistro'
-- Requires finding the bistro_id again for the mock JWT
DO $$
DECLARE
  target_id UUID;
BEGIN
  SELECT id INTO target_id FROM public.restaurants WHERE name = 'Local Bistro' LIMIT 1;
  PERFORM set_config('request.jwt.claims', format('{"sub": "20000000-0000-0000-0000-000000000002", "email": "chef@bistro.com", "user_metadata": {"restaurant_id": "%s", "role": "Manager"}}', target_id), true);
END $$;

-- Verify isolation for regular user: Should ONLY see Local Bistro in registry
SELECT 'TEST regular user registry isolation (Should ONLY see Local Bistro)' as test_step;
SELECT name FROM public.restaurants;

-- Verify ledger isolation: Regular user SHOULD see NOTHING in SaaS ledger
SELECT 'TEST regular user ledger isolation (Should see EMPTY)' as test_step;
SELECT count(*) FROM public.saas_ledger;

-- Verify inventory isolation for regular user
SELECT 'TEST regular user inventory isolation (Should ONLY see Bistro House Red)' as test_step;
SELECT name FROM public.inventory;

RESET ROLE;
SET ROLE postgres;
SELECT 'RLS VERIFICATION COMPLETE' as status;
