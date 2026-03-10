-- ============================================================
-- CRITICAL MIGRATION: Run this in your Supabase SQL Editor
-- This adds missing columns to the leads table so leads are captured
-- ============================================================

-- 1. Add missing columns to leads table
ALTER TABLE leads ADD COLUMN IF NOT EXISTS name text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS status text DEFAULT 'new';

-- 2. Add source_type and other missing columns to knowledge_base
ALTER TABLE knowledge_base ADD COLUMN IF NOT EXISTS source_type text DEFAULT 'manual';
ALTER TABLE knowledge_base ADD COLUMN IF NOT EXISTS source_group text;
ALTER TABLE knowledge_base ADD COLUMN IF NOT EXISTS page_title text;

-- 3. Add chat_logs table if it doesn't exist
CREATE TABLE IF NOT EXISTS chat_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    bot_id text NOT NULL,
    session_id text,
    user_message text,
    bot_reply text,
    lead_score int DEFAULT 0,
    lead_type text DEFAULT 'none',
    confidence_score text,
    gap_topic text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Add confidence and gap columns to chat_logs (in case table exists without them)
ALTER TABLE chat_logs ADD COLUMN IF NOT EXISTS confidence_score text;
ALTER TABLE chat_logs ADD COLUMN IF NOT EXISTS gap_topic text;

-- 5. Create customers table for AI Memory
CREATE TABLE IF NOT EXISTS customers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    phone text UNIQUE NOT NULL,
    name text,
    email text,
    preferences text,
    last_seen timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Create bookings table 
CREATE TABLE IF NOT EXISTS bookings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    bot_id text NOT NULL,
    customer_phone text,
    booking_date date,
    booking_time text,
    party_size int DEFAULT 1,
    status text DEFAULT 'confirmed',
    service_type text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Create contacts table (for Contact Us form — stored in Supabase, not Firebase)
CREATE TABLE IF NOT EXISTS contacts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    email text NOT NULL,
    subject text NOT NULL,
    message text NOT NULL,
    is_read boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS: Allow public INSERT (contact form is public-facing)
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public insert on contacts" ON contacts;
CREATE POLICY "Allow public insert on contacts"
ON contacts FOR INSERT
TO anon, authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon to read contacts" ON contacts;
CREATE POLICY "Allow anon to read contacts"
ON contacts FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Allow anon to update contacts" ON contacts;
CREATE POLICY "Allow anon to update contacts"
ON contacts FOR UPDATE
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Allow anon to delete contacts" ON contacts;
CREATE POLICY "Allow anon to delete contacts"
ON contacts FOR DELETE
TO anon, authenticated
USING (true);

-- Also fix RLS on leads table so backend can insert leads
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anon all on leads" ON leads;
CREATE POLICY "Allow anon all on leads"
ON leads FOR ALL
TO anon, authenticated
USING (true) WITH CHECK (true);

-- Fix RLS on chat_logs
ALTER TABLE chat_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anon all on chat_logs" ON chat_logs;
CREATE POLICY "Allow anon all on chat_logs"
ON chat_logs FOR ALL
TO anon, authenticated
USING (true) WITH CHECK (true);

-- Fix RLS on customers
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anon all on customers" ON customers;
CREATE POLICY "Allow anon all on customers"
ON customers FOR ALL
TO anon, authenticated
USING (true) WITH CHECK (true);

-- Fix RLS on bookings
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anon all on bookings" ON bookings;
CREATE POLICY "Allow anon all on bookings"
ON bookings FOR ALL
TO anon, authenticated
USING (true) WITH CHECK (true);

-- Done! All required tables, columns, and RLS policies now exist.
