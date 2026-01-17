-- Step 4: Create Influencers
-- Prerequisites: Profiles and Brands must exist
-- brand_id should match an existing brand ID
-- profile_id should match an existing profile ID (influencer user)

INSERT INTO public.influencers (id, brand_id, profile_id, name, social_handle, commission_rate, created_at)
VALUES (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440000', NULL, NULL, NULL, 10.00, NOW())
ON CONFLICT DO NOTHING;

INSERT INTO public.influencers (id, brand_id, profile_id, name, social_handle, commission_rate, created_at)
VALUES (gen_random_uuid(), '550e8400-e29b-41d4-a716-446655440001', NULL, NULL, NULL, 10.00, NOW())
ON CONFLICT DO NOTHING;

