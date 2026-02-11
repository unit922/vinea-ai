
-- 1. EXTENSIONS
create extension if not exists "uuid-ossp";

-- 2. CORE TABLES

-- Restaurant establishment profile
create table public.restaurants (
    id uuid primary key default uuid_generate_v4(),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    name text not null unique,
    type text,
    focus text,
    description text,
    owner_id uuid references auth.users(id)
);

-- User profiles (The link between Auth and Establishments)
create table public.profiles (
    id uuid references auth.users(id) primary key,
    restaurant_id uuid references public.restaurants(id) on delete cascade not null,
    full_name text,
    avatar_url text,
    role text default 'Server' check (role in ('Manager', 'Sommelier', 'Mixologist', 'Server'))
);

-- 3. GUEST JOURNEYS (Reservations)
create table public.guest_journeys (
    id uuid primary key default uuid_generate_v4(),
    restaurant_id uuid references public.restaurants(id) on delete cascade not null,
    arrival_time text not null,
    status text default 'Confirmed',
    table_number text,
    guest_name text not null,
    guest_email text,
    preferences text,
    dietary_restrictions text,
    pairing_style text,
    special_occasion text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. INTELLIGENCE CACHE
create table public.ai_intelligence_cache (
    id uuid primary key default uuid_generate_v4(),
    restaurant_id uuid references public.restaurants(id) on delete cascade not null,
    request_key text not null,
    category text not null,
    response_data jsonb not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    expires_at timestamp with time zone,
    unique(restaurant_id, request_key)
);

-- 5. INVENTORY
create table public.inventory (
    id uuid primary key default uuid_generate_v4(),
    restaurant_id uuid references public.restaurants(id) on delete cascade not null,
    name text not null,
    category text check (category in ('Wine', 'Spirit', 'Mixer', 'Beer', 'Garnish', 'Snack')),
    stock numeric default 0,
    unit text not null,
    min_stock numeric default 0,
    max_stock numeric,
    price numeric(10, 2),
    description text,
    predicted_demand numeric,
    updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- 6. RLS SETTINGS
alter table public.restaurants enable row level security;
alter table public.profiles enable row level security;
alter table public.inventory enable row level security;
alter table public.ai_intelligence_cache enable row level security;
alter table public.guest_journeys enable row level security;

-- Policies for guest_journeys
-- Allow public insertion for the "view=book" portal
create policy "Public: Create reservations"
on public.guest_journeys for insert
with check ( true );

-- Only authenticated staff can view/edit journeys for their restaurant
create policy "Staff: Manage journeys"
on public.guest_journeys for all
using ( restaurant_id = (select restaurant_id from public.profiles where id = auth.uid()) );

-- RESTAURANTS:
create policy "Discovery: Verify existence"
on public.restaurants for select
using ( true );

create policy "Onboarding: Initial registration"
on public.restaurants for insert
with check ( true );
