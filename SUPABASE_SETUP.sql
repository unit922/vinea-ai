-- Vinetelligence AI Beverage Intelligence & Training
-- Consolidated Idempotent Supabase Schema Setup
-- Run this in your Supabase SQL Editor

-- 1. EXTENSIONS & CORE BOOTSTRAP
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. RESTAURANTS (Establishment Silo)
CREATE TABLE IF NOT EXISTS public.restaurants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4()
);

ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;
-- Backfill slugs for existing restaurants
UPDATE public.restaurants 
SET slug = trim(both '-' from lower(regexp_replace(name, '[^a-zA-Z0-9]+', '-', 'g')))
WHERE slug IS NULL AND name IS NOT NULL;

-- Ensure uniqueness by name as well
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'restaurants_name_key') THEN
        ALTER TABLE public.restaurants ADD CONSTRAINT restaurants_name_key UNIQUE (name);
    END IF;
END $$;

ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS type TEXT;
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS tier TEXT DEFAULT 'Explorer';
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS edition TEXT DEFAULT 'standard';
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS tagline TEXT;
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS owner_email TEXT;
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS focus TEXT DEFAULT 'General';
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS ai_persona TEXT DEFAULT 'technical';
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS user_limit INTEGER DEFAULT 5;
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Active';
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS last_pulse TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS usage_metric INTEGER DEFAULT 0;
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS billing_status TEXT DEFAULT 'N/A';
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS mrr INTEGER DEFAULT 0;
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());
ALTER TABLE public.restaurants ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

-- 2. PROFILES (Staff Roster)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE
);

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id AND p.email IS NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE SET NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'Server';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS performance_score NUMERIC DEFAULT 100;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS availability_status TEXT DEFAULT 'Available';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS burnout_index INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

-- 3. GUEST JOURNEY (Palate Mapping)
-- PURGE ZOMBIE ASSETS: Forcefully remove any DB artifact referencing legacy columns (user_id, owner_id)
DO $$ 
DECLARE
    item RECORD;
BEGIN
    -- 1. Drop ALL policies on ALL public tables to clear "zombie" logic
    FOR item IN (
        SELECT policyname, tablename 
        FROM pg_policies 
        WHERE schemaname = 'public'
    )
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', item.policyname, item.tablename);
    END LOOP;

    -- 2. Drop ALL triggers on ALL public tables to clear "zombie" behavior
    FOR item IN (
        SELECT trigger_name, event_object_table 
        FROM information_schema.triggers 
        WHERE trigger_schema = 'public'
    )
    LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.%I', item.trigger_name, item.event_object_table);
    END LOOP;

    -- 3. Drop any constraints that might be tied to owner_id or user_id (STRICT PUBLIC ONLY)
    FOR item IN (
        SELECT conname, relname 
        FROM pg_constraint c 
        JOIN pg_class r ON c.conrelid = r.oid 
        JOIN pg_namespace n ON r.relnamespace = n.oid
        WHERE n.nspname = 'public' 
        AND (conname ILIKE '%owner_id%' OR conname ILIKE '%user_id%')
    )
    LOOP
        -- Extra check to ensure the table actually exists before trying to ALTER it
        IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public' AND c.relname = item.relname) THEN
            EXECUTE format('ALTER TABLE public.%I DROP CONSTRAINT IF EXISTS %I CASCADE', item.relname, item.conname);
        END IF;
    END LOOP;

    -- 4. Drop legacy columns with extreme prejudice from ALL public tables
    FOR item IN (
        SELECT table_name, column_name 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND column_name IN ('user_id', 'owner_id')
        -- Protect legitimate columns if any, but in this architecture, we use 'id' or 'staff_id'
        AND table_name NOT IN ('auth_users_dont_touch') 
    )
    LOOP
        EXECUTE format('ALTER TABLE public.%I DROP COLUMN IF EXISTS %I CASCADE', item.table_name, item.column_name);
    END LOOP;
END $$;

CREATE TABLE IF NOT EXISTS public.guest_journeys (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text
);

-- PRE-MIGRATION TEARDOWN: Drop policies that block type changes
DROP POLICY IF EXISTS "Staff can manage order items" ON public.order_items;
DROP POLICY IF EXISTS "Staff can manage orders" ON public.orders;
DROP POLICY IF EXISTS "Staff can manage inventory" ON public.inventory;
DROP POLICY IF EXISTS "Staff can manage guest journeys" ON public.guest_journeys;
DROP POLICY IF EXISTS "Staff can manage tables" ON public.tables;

-- Ensure id is TEXT if it was created as UUID previously and set default
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'guest_journeys' AND column_name = 'id') THEN
        IF (SELECT data_type FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'guest_journeys' AND column_name = 'id') = 'uuid' THEN
            ALTER TABLE public.guest_journeys ALTER COLUMN id TYPE TEXT;
        END IF;
    END IF;
    ALTER TABLE public.guest_journeys ALTER COLUMN id SET DEFAULT uuid_generate_v4()::text;
END $$;

ALTER TABLE public.guest_journeys ADD COLUMN IF NOT EXISTS restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE;
ALTER TABLE public.guest_journeys ADD COLUMN IF NOT EXISTS arrival_time TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.guest_journeys ADD COLUMN IF NOT EXISTS guest_name TEXT;
ALTER TABLE public.guest_journeys ADD COLUMN IF NOT EXISTS guest_email TEXT;
ALTER TABLE public.guest_journeys ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE public.guest_journeys ADD COLUMN IF NOT EXISTS preferences TEXT;
ALTER TABLE public.guest_journeys ADD COLUMN IF NOT EXISTS dietary_restrictions TEXT;
ALTER TABLE public.guest_journeys ADD COLUMN IF NOT EXISTS past_orders TEXT;
ALTER TABLE public.guest_journeys ADD COLUMN IF NOT EXISTS pairing_style TEXT DEFAULT 'Classic';
ALTER TABLE public.guest_journeys ADD COLUMN IF NOT EXISTS special_occasion TEXT;
ALTER TABLE public.guest_journeys ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Confirmed';
ALTER TABLE public.guest_journeys ADD COLUMN IF NOT EXISTS table_number TEXT;
ALTER TABLE public.guest_journeys ADD COLUMN IF NOT EXISTS party_size INTEGER DEFAULT 2;
ALTER TABLE public.guest_journeys ADD COLUMN IF NOT EXISTS pacing_mode TEXT DEFAULT 'Standard';
ALTER TABLE public.guest_journeys ADD COLUMN IF NOT EXISTS facial_id TEXT;

-- Fix profile_id NOT NULL constraint if it exists (legacy or manual schema mismatch)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'guest_journeys' AND column_name = 'profile_id') THEN
        ALTER TABLE public.guest_journeys ALTER COLUMN profile_id DROP NOT NULL;
    END IF;
END $$;

ALTER TABLE public.guest_journeys ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());
ALTER TABLE public.guest_journeys ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

-- Add unique constraint for upsert support
DO $$ 
BEGIN
    -- Deduplicate before adding constraint to prevent 42P16 error
    DELETE FROM public.guest_journeys a USING (
      SELECT MIN(ctid) as keep_ctid, restaurant_id, guest_name
      FROM public.guest_journeys
      GROUP BY restaurant_id, guest_name
      HAVING COUNT(*) > 1
    ) b
    WHERE a.restaurant_id = b.restaurant_id 
    AND a.guest_name = b.guest_name 
    AND a.ctid <> b.keep_ctid;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'guest_journeys_restaurant_name_key') THEN
        ALTER TABLE public.guest_journeys ADD CONSTRAINT guest_journeys_restaurant_name_key UNIQUE (restaurant_id, guest_name);
    END IF;
END $$;

-- 4. INVENTORY (Supply Chain Silo)
CREATE TABLE IF NOT EXISTS public.inventory (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text
);

DO $$ 
BEGIN
    IF (SELECT data_type FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'inventory' AND column_name = 'id') = 'uuid' THEN
        ALTER TABLE public.inventory ALTER COLUMN id TYPE TEXT;
    END IF;
    ALTER TABLE public.inventory ALTER COLUMN id SET DEFAULT uuid_generate_v4()::text;
END $$;

-- 5. ORDERS (Service Ledger)
CREATE TABLE IF NOT EXISTS public.orders (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    table_number TEXT,
    server_name TEXT,
    status TEXT DEFAULT 'Pending',
    priority TEXT DEFAULT 'Normal',
    total NUMERIC DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

DO $$ 
DECLARE
    cons_name TEXT;
BEGIN
    -- 1. Drop foreign keys from order_items to orders before changing orders.id type
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'order_items') AND
       EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'orders') THEN
        FOR cons_name IN (
            SELECT conname 
            FROM pg_constraint 
            WHERE conrelid = 'public.order_items'::regclass 
            AND confrelid = 'public.orders'::regclass
        ) LOOP
            EXECUTE 'ALTER TABLE public.order_items DROP CONSTRAINT ' || quote_ident(cons_name);
        END LOOP;
    END IF;

    -- 2. Change order_items.order_id to TEXT if it exists and is UUID
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'order_items' AND column_name = 'order_id') THEN
        IF (SELECT data_type FROM information_schema.columns WHERE table_name = 'order_items' AND column_name = 'order_id') = 'uuid' THEN
            ALTER TABLE public.order_items ALTER COLUMN order_id TYPE TEXT;
        END IF;
    END IF;

    -- 3. Change orders.id to TEXT if it's still UUID
    IF (SELECT data_type FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'id') = 'uuid' THEN
        ALTER TABLE public.orders ALTER COLUMN id TYPE TEXT;
    END IF;
    ALTER TABLE public.orders ALTER COLUMN id SET DEFAULT uuid_generate_v4()::text;
END $$;

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'Normal';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS total NUMERIC DEFAULT 0;

-- 6. ORDER ITEMS (Relational Service Ledger)
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    inventory_id UUID REFERENCES public.inventory(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    quantity INTEGER DEFAULT 1,
    price_at_order NUMERIC DEFAULT 0,
    status TEXT DEFAULT 'Pending',
    notes TEXT,
    prep_type TEXT,
    style TEXT,
    modifier TEXT,
    seat INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS prep_type TEXT;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS style TEXT;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS modifier TEXT;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS seat INTEGER;

-- Add unique constraint for upsert support
DO $$ 
BEGIN
    -- Deduplicate
    DELETE FROM public.order_items a USING (
      SELECT MIN(ctid) as keep_ctid, order_id, name
      FROM public.order_items
      GROUP BY order_id, name
      HAVING COUNT(*) > 1
    ) b
    WHERE a.order_id = b.order_id 
    AND a.name = b.name 
    AND a.ctid <> b.keep_ctid;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'order_items_order_id_name_key') THEN
        ALTER TABLE public.order_items ADD CONSTRAINT order_items_order_id_name_key UNIQUE (order_id, name);
    END IF;
END $$;

-- Robust Migration for Inventory ID and References
DO $$ 
DECLARE
    cons_name TEXT;
BEGIN
    -- 1. Drop any foreign keys from order_items to inventory
    FOR cons_name IN (
        SELECT conname 
        FROM pg_constraint 
        WHERE conrelid = 'public.order_items'::regclass 
        AND confrelid = 'public.inventory'::regclass
    ) LOOP
        EXECUTE 'ALTER TABLE public.order_items DROP CONSTRAINT ' || quote_ident(cons_name);
    END LOOP;

    -- 2. Change order_items.inventory_id to TEXT if it exists and is UUID
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'order_items' AND column_name = 'inventory_id') THEN
        IF (SELECT data_type FROM information_schema.columns WHERE table_name = 'order_items' AND column_name = 'inventory_id') = 'uuid' THEN
            ALTER TABLE public.order_items ALTER COLUMN inventory_id TYPE TEXT;
        END IF;
    END IF;

    -- 3. Change order_items.inventory_item_id to TEXT if it exists and is UUID (legacy support)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'order_items' AND column_name = 'inventory_item_id') THEN
        IF (SELECT data_type FROM information_schema.columns WHERE table_name = 'order_items' AND column_name = 'inventory_item_id') = 'uuid' THEN
            ALTER TABLE public.order_items ALTER COLUMN inventory_item_id TYPE TEXT;
        END IF;
    END IF;

    -- 4. Change inventory.id to TEXT if it's still UUID
    IF (SELECT data_type FROM information_schema.columns WHERE table_name = 'inventory' AND column_name = 'id') = 'uuid' THEN
        ALTER TABLE public.inventory ALTER COLUMN id TYPE TEXT;
    END IF;

    -- Ensure orders.timestamp is TIMESTAMP WITH TIME ZONE if it exists
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'timestamp') THEN
        IF (SELECT data_type FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'timestamp') = 'time without time zone' THEN
            ALTER TABLE public.orders ALTER COLUMN timestamp TYPE TIMESTAMP WITH TIME ZONE USING (CURRENT_DATE + timestamp);
        ELSIF (SELECT data_type FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'timestamp') = 'timestamp without time zone' THEN
            ALTER TABLE public.orders ALTER COLUMN timestamp TYPE TIMESTAMP WITH TIME ZONE USING timestamp AT TIME ZONE 'UTC';
        END IF;
    END IF;

    -- Ensure transactions.timestamp is TIMESTAMP WITH TIME ZONE if it exists
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'transactions' AND column_name = 'timestamp') THEN
        IF (SELECT data_type FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'transactions' AND column_name = 'timestamp') = 'time without time zone' THEN
            ALTER TABLE public.transactions ALTER COLUMN timestamp TYPE TIMESTAMP WITH TIME ZONE USING (CURRENT_DATE + timestamp);
        ELSIF (SELECT data_type FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'transactions' AND column_name = 'timestamp') = 'timestamp without time zone' THEN
            ALTER TABLE public.transactions ALTER COLUMN timestamp TYPE TIMESTAMP WITH TIME ZONE USING timestamp AT TIME ZONE 'UTC';
        END IF;
    END IF;

    -- Ensure guest_journeys.arrival_time is TIMESTAMP WITH TIME ZONE if it exists
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'guest_journeys' AND column_name = 'arrival_time') THEN
        IF (SELECT data_type FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'guest_journeys' AND column_name = 'arrival_time') = 'time without time zone' THEN
            ALTER TABLE public.guest_journeys ALTER COLUMN arrival_time TYPE TIMESTAMP WITH TIME ZONE USING (CURRENT_DATE + arrival_time);
        ELSIF (SELECT data_type FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'guest_journeys' AND column_name = 'arrival_time') = 'timestamp without time zone' THEN
            ALTER TABLE public.guest_journeys ALTER COLUMN arrival_time TYPE TIMESTAMP WITH TIME ZONE USING arrival_time AT TIME ZONE 'UTC';
        END IF;
    END IF;

    -- Ensure updated_at columns are TIMESTAMP WITH TIME ZONE
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'updated_at') THEN
        IF (SELECT data_type FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'updated_at') = 'time without time zone' THEN
            ALTER TABLE public.orders ALTER COLUMN updated_at TYPE TIMESTAMP WITH TIME ZONE USING (CURRENT_DATE + updated_at);
        ELSIF (SELECT data_type FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'updated_at') = 'timestamp without time zone' THEN
            ALTER TABLE public.orders ALTER COLUMN updated_at TYPE TIMESTAMP WITH TIME ZONE USING updated_at AT TIME ZONE 'UTC';
        END IF;
    END IF;

    -- Re-add foreign key constraints
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'order_items' AND column_name = 'inventory_id') THEN
        ALTER TABLE public.order_items ADD CONSTRAINT order_items_inventory_id_fkey FOREIGN KEY (inventory_id) REFERENCES public.inventory(id) ON DELETE SET NULL;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'order_items' AND column_name = 'order_id') THEN
        ALTER TABLE public.order_items ADD CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;
    END IF;
END $$;

ALTER TABLE public.inventory ADD COLUMN IF NOT EXISTS restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE;
ALTER TABLE public.inventory ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.inventory ADD COLUMN IF NOT EXISTS category TEXT;

-- Ensure the category check constraint is up to date with the application's type system
-- This resolves the "inventory_category_check" violation by aligning DB constraints with types.ts
ALTER TABLE public.inventory DROP CONSTRAINT IF EXISTS inventory_category_check;
ALTER TABLE public.inventory ADD CONSTRAINT inventory_category_check CHECK (category IN ('Wine', 'Spirit', 'Mixer', 'Beer', 'Garnish', 'Snack', 'Lunch', 'Dinner', 'Cocktail'));

-- Add unique constraint for upsert support
DO $$ 
BEGIN
    -- Deduplicate inventory
    DELETE FROM public.inventory a USING (
      SELECT MIN(ctid) as keep_ctid, restaurant_id, name
      FROM public.inventory
      GROUP BY restaurant_id, name
      HAVING COUNT(*) > 1
    ) b
    WHERE a.restaurant_id = b.restaurant_id 
    AND a.name = b.name 
    AND a.ctid <> b.keep_ctid;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'inventory_restaurant_name_key') THEN
        ALTER TABLE public.inventory ADD CONSTRAINT inventory_restaurant_name_key UNIQUE (restaurant_id, name);
    END IF;
END $$;

ALTER TABLE public.inventory ADD COLUMN IF NOT EXISTS stock NUMERIC DEFAULT 0;
ALTER TABLE public.inventory ADD COLUMN IF NOT EXISTS unit TEXT DEFAULT 'units';
ALTER TABLE public.inventory ADD COLUMN IF NOT EXISTS min_stock NUMERIC DEFAULT 0;
ALTER TABLE public.inventory ADD COLUMN IF NOT EXISTS price NUMERIC DEFAULT 0;
ALTER TABLE public.inventory ADD COLUMN IF NOT EXISTS original_price NUMERIC DEFAULT 0;
ALTER TABLE public.inventory ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.inventory ADD COLUMN IF NOT EXISTS volume_per_unit NUMERIC DEFAULT 750;
ALTER TABLE public.inventory ADD COLUMN IF NOT EXISTS sustainability_score NUMERIC;
ALTER TABLE public.inventory ADD COLUMN IF NOT EXISTS predicted_demand NUMERIC;
ALTER TABLE public.inventory ADD COLUMN IF NOT EXISTS consumed NUMERIC DEFAULT 0;
ALTER TABLE public.inventory ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

-- 7. TABLES (Physical Layout Silo)
CREATE TABLE IF NOT EXISTS public.tables (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
    number TEXT,
    capacity INTEGER,
    status TEXT DEFAULT 'Available',
    occupant_name TEXT,
    occupant_count INTEGER DEFAULT 0,
    zone_id TEXT,
    x INTEGER,
    y INTEGER,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

DO $$ 
BEGIN
    IF (SELECT data_type FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'tables' AND column_name = 'id') = 'uuid' THEN
        ALTER TABLE public.tables ALTER COLUMN id TYPE TEXT;
    END IF;
    ALTER TABLE public.tables ALTER COLUMN id SET DEFAULT uuid_generate_v4()::text;
END $$;

-- Add unique constraint for upsert support
DO $$ 
BEGIN
    -- Deduplicate
    DELETE FROM public.tables a USING (
      SELECT MIN(ctid) as keep_ctid, restaurant_id, number
      FROM public.tables
      GROUP BY restaurant_id, number
      HAVING COUNT(*) > 1
    ) b
    WHERE a.restaurant_id = b.restaurant_id 
    AND a.number = b.number 
    AND a.ctid <> b.keep_ctid;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tables_restaurant_number_key') THEN
        ALTER TABLE public.tables ADD CONSTRAINT tables_restaurant_number_key UNIQUE (restaurant_id, number);
    END IF;
END $$;

-- Ensure occupant_count column exists if table was created previously without it
ALTER TABLE public.tables ADD COLUMN IF NOT EXISTS occupant_count INTEGER DEFAULT 0;

-- 8. EQUIPMENT (Telemetry Silo)
CREATE TABLE IF NOT EXISTS public.equipment (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4()
);

ALTER TABLE public.equipment ADD COLUMN IF NOT EXISTS restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE;
ALTER TABLE public.equipment ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.equipment ADD COLUMN IF NOT EXISTS type TEXT;
ALTER TABLE public.equipment ADD COLUMN IF NOT EXISTS health_score INTEGER DEFAULT 100;
ALTER TABLE public.equipment ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Optimal';
ALTER TABLE public.equipment ADD COLUMN IF NOT EXISTS last_service TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.equipment ADD COLUMN IF NOT EXISTS telemetry JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.equipment ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());
ALTER TABLE public.equipment ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

-- 8. STAFF ROSTER (Pre-authorization for registration)
CREATE TABLE IF NOT EXISTS public.staff_roster (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE NOT NULL,
    email TEXT NOT NULL,
    role TEXT DEFAULT 'Server',
    status TEXT DEFAULT 'Pending', -- Pending, Registered
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(restaurant_id, email)
);

-- 9. STAFF ASSIGNMENTS (Operational Deployment)
CREATE TABLE IF NOT EXISTS public.staff_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE NOT NULL,
    staff_id TEXT NOT NULL,
    zone_id TEXT NOT NULL,
    priority TEXT DEFAULT 'Primary',
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 10. HELPER FUNCTIONS
CREATE OR REPLACE FUNCTION public.get_user_restaurant_id()
RETURNS UUID AS $$
DECLARE
  v_jwt_rid TEXT;
  v_rid UUID;
BEGIN
  -- 1. Try JWT metadata (fastest)
  v_jwt_rid := auth.jwt() -> 'user_metadata' ->> 'restaurant_id';
  IF v_jwt_rid IS NOT NULL AND v_jwt_rid <> '' THEN
    BEGIN
      RETURN v_jwt_rid::uuid;
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
  END IF;

  -- 2. Hard-coded Domain Restriction: @vinetelligence.live or @vinea.live users ONLY access "Vinetelligence Enterprise"
  IF (auth.jwt() ->> 'email') LIKE '%@vinetelligence.live' OR (auth.jwt() ->> 'email') LIKE '%@vinea.live' THEN
    RETURN (SELECT id FROM public.restaurants WHERE name = 'Vinetelligence Enterprise' LIMIT 1);
  END IF;

  -- 3. Fallback to profiles table (cached lookup)
  RETURN (SELECT restaurant_id FROM public.profiles WHERE id = auth.uid() LIMIT 1);
EXCEPTION WHEN OTHERS THEN
  RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
BEGIN
  -- 0. Administrative Domain Override
  IF (auth.jwt() ->> 'email') LIKE '%@vinetelligence.live' OR (auth.jwt() ->> 'email') LIKE '%@vinea.live' OR (auth.jwt() ->> 'email') = 'foritglo@gmail.com' THEN
    RETURN 'Admin';
  END IF;

  -- 1. Try JWT metadata
  IF (auth.jwt() -> 'user_metadata' ->> 'role') IS NOT NULL THEN
    RETURN (auth.jwt() -> 'user_metadata' ->> 'role');
  END IF;
  
  -- 2. Fallback to profiles table
  RETURN (SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ROW LEVEL SECURITY (RLS)
-- CLEANUP GHOST POLICIES: This loop nukes all existing policies on our tables to prevent
-- issues with stale/ghost policies from previous iterations or manual edits.
DO $$
DECLARE
    t TEXT;
    pol TEXT;
BEGIN
    FOR t IN SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' 
    AND table_name IN ('restaurants', 'profiles', 'guest_journeys', 'inventory', 'orders', 'order_items', 'tables', 'equipment', 'staff_roster', 'staff_assignments', 'transactions', 'saas_ledger') LOOP
        FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = t AND schemaname = 'public' LOOP
            EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol, t);
        END LOOP;
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    END LOOP;
END $$;

-- 11. TRANSACTIONS (Financial Ledger)
CREATE TABLE IF NOT EXISTS public.transactions (
    id TEXT PRIMARY KEY,
    restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    table_number TEXT,
    guest_name TEXT,
    items JSONB DEFAULT '[]'::jsonb,
    subtotal NUMERIC DEFAULT 0,
    tax NUMERIC DEFAULT 0,
    gratuity NUMERIC DEFAULT 0,
    total NUMERIC DEFAULT 0,
    payment_method TEXT,
    sommelier_note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 12. SAAS LEDGER (Executive Revenue Silo)
CREATE TABLE IF NOT EXISTS public.saas_ledger (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL,
    status TEXT DEFAULT 'Paid',
    method TEXT DEFAULT 'Stripe',
    description TEXT,
    billing_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Recreate policies
-- PROFILE POLICIES: Strict Domain Lock for @vinetelligence.live
DROP POLICY IF EXISTS "Admins can manage staff roster" ON public.staff_roster;
CREATE POLICY "Admins can manage staff roster" ON public.staff_roster FOR ALL USING (
    (restaurant_id = get_user_restaurant_id() AND (get_user_role() IN ('Manager', 'Developer', 'Admin', 'Owner') OR get_user_role() IS NULL)) OR
    (auth.jwt() ->> 'email' LIKE '%@vinetelligence.live' OR auth.jwt() ->> 'email' LIKE '%@vinea.live' OR auth.jwt() ->> 'email' = 'foritglo@gmail.com')
);

DROP POLICY IF EXISTS "Staff can manage transactions" ON public.transactions;
CREATE POLICY "Staff can manage transactions" ON public.transactions FOR ALL USING (
    restaurant_id = get_user_restaurant_id() OR (auth.jwt() ->> 'email' LIKE '%@vinetelligence.live' OR auth.jwt() ->> 'email' LIKE '%@vinea.live' OR auth.jwt() ->> 'email' = 'foritglo@gmail.com')
);

DROP POLICY IF EXISTS "Staff can manage saas_ledger" ON public.saas_ledger;
CREATE POLICY "Staff can manage saas_ledger" ON public.saas_ledger FOR ALL USING (
    restaurant_id = get_user_restaurant_id() OR (auth.jwt() ->> 'email' LIKE '%@vinetelligence.live' OR auth.jwt() ->> 'email' LIKE '%@vinea.live' OR auth.jwt() ->> 'email' = 'foritglo@gmail.com')
);

DROP POLICY IF EXISTS "Owners can delete their restaurant" ON public.restaurants;
CREATE POLICY "Owners can delete their restaurant" ON public.restaurants FOR DELETE USING (
    owner_email = auth.jwt() ->> 'email' OR
    (auth.jwt() ->> 'email' LIKE '%@vinetelligence.live' OR auth.jwt() ->> 'email' LIKE '%@vinea.live' OR auth.jwt() ->> 'email' = 'foritglo@gmail.com')
);

DROP POLICY IF EXISTS "Owners can seed their roster" ON public.staff_roster;
CREATE POLICY "Owners can seed their roster" ON public.staff_roster 
FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.restaurants 
        WHERE id = restaurant_id 
        AND owner_email = auth.jwt() ->> 'email'
    )
);

DROP POLICY IF EXISTS "Public can check roster for registration" ON public.staff_roster;
CREATE POLICY "Public can check roster for registration" ON public.staff_roster FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Staff can view profiles in their restaurant" ON public.profiles;
CREATE POLICY "Staff can view profiles in their restaurant" ON public.profiles FOR SELECT USING (
    restaurant_id = get_user_restaurant_id()
);

DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
CREATE POLICY "Users can insert their own profile." ON public.profiles FOR INSERT WITH CHECK (
    auth.uid() = id AND
    (
      (auth.jwt() ->> 'email' NOT LIKE '%@vinetelligence.live') OR
      (restaurant_id IN (SELECT id FROM public.restaurants WHERE name = 'Vinetelligence Enterprise'))
    )
);

DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;
CREATE POLICY "Users can update own profile." ON public.profiles FOR UPDATE USING (
    auth.uid() = id AND
    (
      (auth.jwt() ->> 'email' NOT LIKE '%@vinetelligence.live') OR
      (restaurant_id IN (SELECT id FROM public.restaurants WHERE name = 'Vinetelligence Enterprise'))
    )
);

DROP POLICY IF EXISTS "Admins can purge profiles" ON public.profiles;
CREATE POLICY "Admins can purge profiles" ON public.profiles FOR DELETE USING (
    (auth.jwt() ->> 'email' LIKE '%@vinetelligence.live' OR auth.jwt() ->> 'email' LIKE '%@vinea.live' OR auth.jwt() ->> 'email' = 'foritglo@gmail.com') OR
    (restaurant_id = get_user_restaurant_id() AND get_user_role() IN ('Owner', 'Admin', 'Developer'))
);

-- RESTAURANT POLICIES: Strict isolation based on restaurant_id
DROP POLICY IF EXISTS "Public can view restaurant names" ON public.restaurants;

DROP POLICY IF EXISTS "Authenticated users can register establishments" ON public.restaurants;
CREATE POLICY "Anyone can register establishments" ON public.restaurants 
FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public can insert to roster for registration" ON public.staff_roster;
CREATE POLICY "Public can insert to roster for registration" ON public.staff_roster 
FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Staff can update their restaurant" ON public.restaurants;
CREATE POLICY "Staff can update their restaurant" ON public.restaurants FOR UPDATE USING (
    id = get_user_restaurant_id() OR
    owner_email = auth.jwt() ->> 'email' OR
    (auth.jwt() ->> 'email' LIKE '%@vinetelligence.live' OR auth.jwt() ->> 'email' LIKE '%@vinea.live' OR auth.jwt() ->> 'email' = 'foritglo@gmail.com')
) WITH CHECK (
    id = get_user_restaurant_id() OR
    owner_email = auth.jwt() ->> 'email' OR
    (auth.jwt() ->> 'email' LIKE '%@vinetelligence.live' OR auth.jwt() ->> 'email' LIKE '%@vinea.live' OR auth.jwt() ->> 'email' = 'foritglo@gmail.com')
);

DROP POLICY IF EXISTS "Staff can view their restaurant" ON public.restaurants;
-- Revised: Vinetelligence Executives and Owners can see their nodes without being locked to session metadata
CREATE POLICY "Staff can view their restaurant" ON public.restaurants FOR SELECT USING (
    id = get_user_restaurant_id() OR 
    (auth.jwt() ->> 'email' LIKE '%@vinetelligence.live' OR auth.jwt() ->> 'email' LIKE '%@vinea.live' OR auth.jwt() ->> 'email' = 'foritglo@gmail.com') OR
    owner_email = auth.jwt() ->> 'email'
);

DROP POLICY IF EXISTS "Vinetelligence Executives can manage all restaurants" ON public.restaurants;
CREATE POLICY "Vinetelligence Executives can manage all restaurants" ON public.restaurants FOR ALL USING (
    (auth.jwt() ->> 'email' LIKE '%@vinetelligence.live' OR auth.jwt() ->> 'email' LIKE '%@vinea.live' OR auth.jwt() ->> 'email' = 'foritglo@gmail.com')
);

-- LEDGER POLICIES
DROP POLICY IF EXISTS "Vinetelligence Executive access to global ledger" ON public.saas_ledger;
CREATE POLICY "Vinetelligence Executive access to global ledger" ON public.saas_ledger FOR ALL USING (
    (auth.jwt() ->> 'email' LIKE '%@vinetelligence.live' OR auth.jwt() ->> 'email' LIKE '%@vinea.live' OR auth.jwt() ->> 'email' = 'foritglo@gmail.com')
);

DROP POLICY IF EXISTS "Owners can view their ledger" ON public.saas_ledger;
CREATE POLICY "Owners can view their ledger" ON public.saas_ledger FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.restaurants WHERE id = restaurant_id AND owner_email = auth.jwt() ->> 'email')
);

DROP POLICY IF EXISTS "Public can insert guest journeys" ON public.guest_journeys;
DROP POLICY IF EXISTS "Public can view guest journeys" ON public.guest_journeys;
DROP POLICY IF EXISTS "Public can update guest journeys" ON public.guest_journeys;

DROP POLICY IF EXISTS "Staff can manage tables" ON public.tables;
CREATE POLICY "Staff can manage tables" ON public.tables FOR ALL USING (
    restaurant_id = get_user_restaurant_id() OR (auth.jwt() ->> 'email' LIKE '%@vinetelligence.live' OR auth.jwt() ->> 'email' LIKE '%@vinea.live' OR auth.jwt() ->> 'email' = 'foritglo@gmail.com')
);

DROP POLICY IF EXISTS "Public can view tables" ON public.tables;
DROP POLICY IF EXISTS "Public can update tables" ON public.tables;
DROP POLICY IF EXISTS "Public can insert tables" ON public.tables;

DROP POLICY IF EXISTS "Staff can manage guest journeys" ON public.guest_journeys;
CREATE POLICY "Staff can manage guest journeys" ON public.guest_journeys FOR ALL USING (
    restaurant_id = get_user_restaurant_id() OR (auth.jwt() ->> 'email' LIKE '%@vinetelligence.live' OR auth.jwt() ->> 'email' LIKE '%@vinea.live' OR auth.jwt() ->> 'email' = 'foritglo@gmail.com')
);

DROP POLICY IF EXISTS "Staff can manage inventory" ON public.inventory;
CREATE POLICY "Staff can manage inventory" ON public.inventory FOR ALL USING (
    restaurant_id = get_user_restaurant_id() OR (auth.jwt() ->> 'email' LIKE '%@vinetelligence.live' OR auth.jwt() ->> 'email' LIKE '%@vinea.live' OR auth.jwt() ->> 'email' = 'foritglo@gmail.com')
);

DROP POLICY IF EXISTS "Public can view inventory" ON public.inventory;
DROP POLICY IF EXISTS "Public can update inventory" ON public.inventory;
DROP POLICY IF EXISTS "Public can insert inventory" ON public.inventory;

DROP POLICY IF EXISTS "Staff can manage orders" ON public.orders;
CREATE POLICY "Staff can manage orders" ON public.orders FOR ALL USING (
    restaurant_id = get_user_restaurant_id() OR (auth.jwt() ->> 'email' LIKE '%@vinetelligence.live' OR auth.jwt() ->> 'email' LIKE '%@vinea.live' OR auth.jwt() ->> 'email' = 'foritglo@gmail.com')
);

DROP POLICY IF EXISTS "Public can insert orders" ON public.orders;
DROP POLICY IF EXISTS "Public can view orders" ON public.orders;
DROP POLICY IF EXISTS "Public can update orders" ON public.orders;

DROP POLICY IF EXISTS "Staff can manage order items" ON public.order_items;
CREATE POLICY "Staff can manage order items" ON public.order_items FOR ALL USING (
    order_id IN (SELECT id FROM public.orders WHERE restaurant_id = get_user_restaurant_id() OR (auth.jwt() ->> 'email' LIKE '%@vinetelligence.live' OR auth.jwt() ->> 'email' LIKE '%@vinea.live' OR auth.jwt() ->> 'email' = 'foritglo@gmail.com'))
);

DROP POLICY IF EXISTS "Public can insert order items" ON public.order_items;
DROP POLICY IF EXISTS "Public can view order items" ON public.order_items;
DROP POLICY IF EXISTS "Public can update order items" ON public.order_items;

DROP POLICY IF EXISTS "Staff can manage equipment" ON public.equipment;
CREATE POLICY "Staff can manage equipment" ON public.equipment FOR ALL USING (
    restaurant_id = get_user_restaurant_id() OR (auth.jwt() ->> 'email' LIKE '%@vinetelligence.live' OR auth.jwt() ->> 'email' LIKE '%@vinea.live' OR auth.jwt() ->> 'email' = 'foritglo@gmail.com')
);

DROP POLICY IF EXISTS "Staff can manage assignments" ON public.staff_assignments;
CREATE POLICY "Staff can manage assignments" ON public.staff_assignments FOR ALL USING (
    restaurant_id = get_user_restaurant_id() OR (auth.jwt() ->> 'email' LIKE '%@vinetelligence.live' OR auth.jwt() ->> 'email' LIKE '%@vinea.live' OR auth.jwt() ->> 'email' = 'foritglo@gmail.com')
);

DROP POLICY IF EXISTS "Staff can manage transactions" ON public.transactions;
CREATE POLICY "Staff can manage transactions" ON public.transactions FOR ALL USING (
    restaurant_id = get_user_restaurant_id() OR (auth.jwt() ->> 'email' LIKE '%@vinetelligence.live' OR auth.jwt() ->> 'email' LIKE '%@vinea.live' OR auth.jwt() ->> 'email' = 'foritglo@gmail.com')
);

DROP POLICY IF EXISTS "Public can insert transactions" ON public.transactions;
DROP POLICY IF EXISTS "Public can view transactions" ON public.transactions;

-- PUBLIC ACCESS POLICIES (Visitor Nodes)
DROP POLICY IF EXISTS "Public view for intelligence list" ON public.inventory;
CREATE POLICY "Public view for intelligence list" ON public.inventory FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public view for establishment node" ON public.restaurants;
CREATE POLICY "Public view for establishment node" ON public.restaurants FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public view for facility tables" ON public.tables;
CREATE POLICY "Public view for facility tables" ON public.tables FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public entry for facility tables" ON public.tables;
CREATE POLICY "Public entry for facility tables" ON public.tables FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public entry for inventory seeding" ON public.inventory;
CREATE POLICY "Public entry for inventory seeding" ON public.inventory FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public entry for guest journey" ON public.guest_journeys;
CREATE POLICY "Public entry for guest journey" ON public.guest_journeys FOR ALL USING (true);

DROP POLICY IF EXISTS "Public order entry" ON public.orders;
CREATE POLICY "Public order entry" ON public.orders FOR ALL USING (true);

DROP POLICY IF EXISTS "Public order item entry" ON public.order_items;
CREATE POLICY "Public order item entry" ON public.order_items FOR ALL USING (true);
-- 12. PERFORMANCE INDEXES (Global Optimization)
CREATE INDEX IF NOT EXISTS idx_restaurants_slug ON public.restaurants(slug);
CREATE INDEX IF NOT EXISTS idx_restaurants_owner_email ON public.restaurants(owner_email);
CREATE INDEX IF NOT EXISTS idx_profiles_restaurant_id ON public.profiles(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_inventory_restaurant_id ON public.inventory(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_inventory_category ON public.inventory(category);
CREATE INDEX IF NOT EXISTS idx_inventory_restaurant_name ON public.inventory(restaurant_id, name);
CREATE INDEX IF NOT EXISTS idx_orders_restaurant_id ON public.orders(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_timestamp ON public.orders(timestamp);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_tables_restaurant_id ON public.tables(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_tables_status ON public.tables(status);
CREATE INDEX IF NOT EXISTS idx_guest_journeys_restaurant_id ON public.guest_journeys(restaurant_id);

-- 13. ACADEMY & INTELLIGENCE EXTENSIONS
CREATE TABLE IF NOT EXISTS public.academy_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
    topic TEXT NOT NULL,
    difficulty TEXT CHECK (difficulty IN ('Beginner', 'Intermediate', 'Advanced')) DEFAULT 'Beginner',
    duration TEXT,
    category TEXT,
    video_url TEXT,
    video_id TEXT,
    completed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.flash_drills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    options TEXT[] NOT NULL,
    correct_index INTEGER NOT NULL,
    explanation TEXT,
    category TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.ai_insights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
    type TEXT CHECK (type IN ('Retention', 'Revenue', 'Efficiency', 'Sustainability')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    impact_score NUMERIC DEFAULT 0,
    actionable BOOLEAN DEFAULT true,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.guest_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
    journey_id TEXT,
    guest_name TEXT,
    staff_id TEXT,
    rating INTEGER CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    sentiment TEXT CHECK (sentiment IN ('Positive', 'Neutral', 'Negative')),
    ai_summary TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- RE-ENABLE RLS FOR EXTENSIONS
ALTER TABLE public.academy_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flash_drills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guest_feedback ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
    t TEXT;
BEGIN
    FOR t IN SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' 
    AND table_name IN ('academy_sessions', 'flash_drills', 'ai_insights', 'guest_feedback') LOOP
        EXECUTE format('DROP POLICY IF EXISTS "Staff manage %I" ON public.%I', t, t);
        EXECUTE format('CREATE POLICY "Staff manage %I" ON public.%I FOR ALL USING (restaurant_id = get_user_restaurant_id() OR (auth.jwt() ->> ''email'' LIKE ''%%@vinetelligence.live''))', t, t);
    END LOOP;
END $$;
CREATE INDEX IF NOT EXISTS idx_guest_journeys_status ON public.guest_journeys(status);
CREATE INDEX IF NOT EXISTS idx_transactions_restaurant_id ON public.transactions(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_transactions_timestamp ON public.transactions(timestamp);
CREATE INDEX IF NOT EXISTS idx_staff_assignments_restaurant_id ON public.staff_assignments(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_saas_ledger_restaurant_id ON public.saas_ledger(restaurant_id);

GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- FUNCTIONS & TRIGGERS
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, restaurant_id, role, email)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    (new.raw_user_meta_data->>'restaurant_id')::uuid,
    COALESCE(new.raw_user_meta_data->>'role', 'Server'),
    new.email
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Helper to update inventory stock
DROP FUNCTION IF EXISTS public.decrement_inventory_stock(TEXT, NUMERIC);
DROP FUNCTION IF EXISTS public.decrement_inventory_stock(TEXT, INTEGER);
CREATE OR REPLACE FUNCTION public.decrement_inventory_stock(item_id TEXT, quantity NUMERIC)
RETURNS VOID AS $$
BEGIN
    UPDATE public.inventory
    SET stock = COALESCE(stock, 0) - quantity,
        consumed = COALESCE(consumed, 0) + quantity
    WHERE id = item_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure consumed is never null for existing items
UPDATE public.inventory SET consumed = 0 WHERE consumed IS NULL;
UPDATE public.inventory SET stock = 0 WHERE stock IS NULL;

-- 13. SEEDING (Core Identity Nodes)
-- Ensure 'Vinetelligence Enterprise' exists for the social promo and master administration
INSERT INTO public.restaurants (name, slug, edition, focus, status, tier) 
VALUES ('Vinetelligence Enterprise', 'vinetelligence-enterprise', 'enterprise', 'Intelligence', 'Active', 'Architect')
ON CONFLICT (name) DO UPDATE SET slug = EXCLUDED.slug, edition = EXCLUDED.edition;
