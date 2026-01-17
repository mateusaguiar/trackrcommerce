-- Step 1: Create Profiles
-- Prerequisites: Users must be created in Supabase Auth first
-- ID column should contain the UUID from Supabase Auth Users

INSERT INTO public.profiles (id, email, full_name, role, created_at)
VALUES (NULL, NULL, NULL, NULL, NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.profiles (id, email, full_name, role, created_at)
VALUES (NULL, NULL, NULL, NULL, NOW())
ON CONFLICT (id) DO NOTHING;

