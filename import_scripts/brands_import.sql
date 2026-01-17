-- Step 2: Create Brands
-- Prerequisites: Profiles must exist
-- owner_id should match a profile ID

INSERT INTO public.brands (id, name, nuvemshop_store_id, owner_id, is_real, created_at)
VALUES (gen_random_uuid(), NULL, NULL, NULL, true, NOW())
ON CONFLICT DO NOTHING;

INSERT INTO public.brands (id, name, nuvemshop_store_id, owner_id, is_real, created_at)
VALUES (gen_random_uuid(), NULL, NULL, NULL, true, NOW())
ON CONFLICT DO NOTHING;

