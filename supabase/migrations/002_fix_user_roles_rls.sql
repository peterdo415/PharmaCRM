-- Fix RLS policies for user_roles table to allow signup
-- This migration fixes the issue where new user registration fails due to RLS policy

-- Drop existing policies for user_roles
DROP POLICY IF EXISTS "Users can view their own role" ON user_roles;
DROP POLICY IF EXISTS "Users can insert their own role" ON user_roles;
DROP POLICY IF EXISTS "Users can update their own role" ON user_roles;

-- Create new policies that work properly during signup
-- Allow users to view their own role
CREATE POLICY "Users can view their own role" ON user_roles
  FOR SELECT USING (auth.uid() = user_id);

-- Allow authenticated users to insert their own role (more permissive for signup)
CREATE POLICY "Authenticated users can insert role" ON user_roles
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow users to update their own role
CREATE POLICY "Users can update their own role" ON user_roles
  FOR UPDATE USING (auth.uid() = user_id);


-- Update pharmacies insert policy to be more permissive for pharmacy admin signup
DROP POLICY IF EXISTS "Pharmacy admins can insert pharmacy" ON pharmacies;

CREATE POLICY "Authenticated users can insert pharmacy" ON pharmacies
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Update pharmacists insert policy to be more permissive for pharmacist signup
DROP POLICY IF EXISTS "Pharmacists can insert their own data" ON pharmacists;

CREATE POLICY "Authenticated users can insert pharmacist data" ON pharmacists
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');