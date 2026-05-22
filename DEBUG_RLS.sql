-- Vinetelligence Diagnostic Script: List all RLS Policies and their logic
-- Run this in the Supabase SQL Editor to find ghost "user_id" references.

SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd as operation, 
    qual as using_expression, 
    with_check as check_expression
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Also check for triggers which might refer to "user_id" during DELETE
SELECT 
    event_object_table AS table_name, 
    trigger_name, 
    event_manipulation AS event, 
    action_statement AS action
FROM information_schema.triggers
WHERE event_object_schema = 'public'
AND event_object_table = 'restaurants';

-- Check actual columns in restaurants table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'restaurants';
