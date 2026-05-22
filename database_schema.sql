
-- ... (Previous tables)

-- 8. EQUIPMENT (Telemetry Silo)
CREATE TABLE IF NOT EXISTS public.equipment (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL, -- HVAC, Refrigeration, Kitchen, Bar
    health_score INTEGER DEFAULT 100,
    status TEXT CHECK (status IN ('Optimal', 'Warning', 'Critical')) DEFAULT 'Optimal',
    last_service TIMESTAMP WITH TIME ZONE,
    telemetry JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. ACADEMY MODULES (Intelligence Academy)
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

-- 10. FLASH DRILLS (Scholar Node)
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

-- 11. AI INSIGHTS (Yield Alpha)
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

-- 12. GUEST FEEDBACK (Experience Sentinel)
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

-- RLS Policies
ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flash_drills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guest_feedback ENABLE ROW LEVEL SECURITY;

-- Helper for Enterprise Isolation
CREATE OR REPLACE FUNCTION public.get_user_restaurant_id()
RETURNS UUID AS $$
BEGIN
  RETURN (SELECT restaurant_id FROM public.profiles WHERE id = auth.uid() LIMIT 1);
END;
$$ LANGUAGE plpgsql STABLE;

-- Generic Security Logic
DO $$
DECLARE
    t TEXT;
BEGIN
    FOR t IN SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' 
    AND table_name IN ('equipment', 'academy_sessions', 'flash_drills', 'ai_insights', 'guest_feedback') LOOP
        EXECUTE format('DROP POLICY IF EXISTS "Staff Access" ON public.%I', t);
        EXECUTE format('CREATE POLICY "Staff Access" ON public.%I FOR ALL USING (restaurant_id = get_user_restaurant_id())', t);
    END LOOP;
END $$;
