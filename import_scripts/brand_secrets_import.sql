-- Step 3: Create Brand Secrets
-- Prerequisites: Brands must exist
-- brand_id should match an existing brand ID

INSERT INTO public.brand_secrets (id, brand_id, access_token, created_at)
VALUES (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440000', 'nuvem_access_token_12345', NOW())
ON CONFLICT (brand_id) DO UPDATE SET access_token = 'nuvem_access_token_12345';

INSERT INTO public.brand_secrets (id, brand_id, access_token, created_at)
VALUES (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440001', 'nuvem_access_token_67890', NOW())
ON CONFLICT (brand_id) DO UPDATE SET access_token = 'nuvem_access_token_67890';

