-- ============================================
-- RLS ARCHITECTURE RECOMMENDATION
-- ============================================
-- Current Issue: The PROFILES table is causing circular reference errors

-- ============================================
-- PROBLEM ANALYSIS
-- ============================================
-- The circular reference happens when:
-- 1. Query tries to SELECT from profiles
-- 2. RLS policy checks if user can see this row
-- 3. Policy tries to reference another table (brands, etc.)
-- 4. That table's policy might reference profiles again
-- 5. Infinite loop detected

-- SOLUTION: Keep profiles RLS SIMPLE and NON-RECURSIVE
-- ============================================

-- ============================================
-- RECOMMENDED RLS STRATEGY
-- ============================================

-- TABLE: profiles
-- ├─ SELECT: auth.uid() = id (users see own profile only)
-- ├─ UPDATE: auth.uid() = id (users update own profile only)
-- └─ No subqueries, no table references

-- TABLE: brands
-- ├─ SELECT: owner_id = auth.uid() (users see own brands only)
-- └─ No reference to profiles table

-- TABLE: influencers
-- ├─ SELECT: true (public read - optional, can restrict by brand later)
-- └─ No validation against profiles

-- TABLE: coupons
-- ├─ SELECT: true (public read)
-- └─ No validation against profiles

-- TABLE: conversions (sales)
-- ├─ SELECT: true (public read)
-- └─ No validation against profiles

-- ============================================
-- WHY THIS WORKS
-- ============================================
-- ✓ No table references in policies = no circular recursion
-- ✓ All policies check auth.uid() which is computed, not from data
-- ✓ Each policy is independently executable
-- ✓ No chaining of RLS checks between tables

-- ============================================
-- TESTING THE POLICIES
-- ============================================

-- As admin (with service_role key from Supabase):
-- 1. You can see all profiles (no RLS applied to service_role)

-- As logged-in user:
-- 1. SELECT * FROM profiles → Only returns your own record
-- 2. SELECT * FROM profiles WHERE id != auth.uid() → Returns 0 rows
-- 3. Try to UPDATE someone else's profile → Fails silently (no error, 0 rows updated)

-- ============================================
-- ALTERNATIVE: NO RLS ON PROFILES
-- ============================================
-- If you want to allow:
-- - Each user to see their own profile
-- - Admins/masters to see all profiles
-- - Different permissions by role
--
-- Then DON'T use RLS on profiles table. Instead:
-- 1. Keep RLS disabled on profiles
-- 2. Handle access control in your application code
-- 3. Query the profiles table only when authenticated
-- 4. Check user.role in JavaScript before displaying data
--
-- This is SAFER for profiles because:
-- - Profiles are essential to the app (users must see their own)
-- - Application layer can make better decisions about role-based access
-- - No risk of locking yourself out with bad RLS policies
-- - You control when/how profiles are fetched

-- ============================================
-- DATABASE SCHEMA CHANGE SUGGESTION
-- ============================================
-- If you want proper RLS on profiles with role-based access:

-- ADD a column to track which roles can see which profiles:
-- ALTER TABLE profiles ADD COLUMN IF NOT EXISTS visibility VARCHAR(50) DEFAULT 'private';
-- -- 'private' = only user sees own profile
-- -- 'friends' = shared with other users (implement via separate table)
-- -- 'public' = anyone can see profile

-- But this adds complexity. For most SaaS:
-- - Users see only their own profile (current approach)
-- - Admins use service role key to query profiles (backend only)
-- - No need for RLS on profiles table

-- ============================================
-- IMPLEMENTATION STEPS
-- ============================================

-- Step 1: Run RLS_PROFILES_FINAL.sql to apply simple RLS
-- Step 2: Test with authenticated user queries
-- Step 3: Verify your app still works
-- Step 4: If you want role-based profile access, move to application layer

-- ============================================
-- DO NOT DO THIS (causes circular references)
-- ============================================

-- ❌ BAD - References another table:
-- CREATE POLICY "profiles_select_by_role"
--   ON public.profiles
--   FOR SELECT
--   USING (
--     EXISTS (
--       SELECT 1 FROM brands WHERE owner_id = auth.uid() AND brand_id = profiles.brand_id
--     )
--   );
--
-- This will cause recursion if brands table also has RLS that references profiles

-- ❌ BAD - Subquery on same table:
-- CREATE POLICY "profiles_select_admins"
--   ON public.profiles
--   FOR SELECT
--   USING (
--     (SELECT role FROM profiles WHERE id = auth.uid()) IN ('master', 'brand_admin')
--   );
--
-- This queries profiles while already checking profiles policy = infinite recursion

-- ✓ GOOD - Only checks auth.uid():
-- CREATE POLICY "profiles_select_own"
--   ON public.profiles
--   FOR SELECT
--   USING (auth.uid() = id);
--
-- This doesn't reference any tables, just the built-in auth.uid() function
