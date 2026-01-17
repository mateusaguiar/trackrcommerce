-- Step 5: Create Coupons
-- Prerequisites: Brands and Influencers must exist
-- brand_id should match an existing brand ID
-- influencer_id should match an existing influencer ID

INSERT INTO public.coupons (id, code, brand_id, influencer_id, discount_pct, is_active, created_at)
VALUES (gen_random_uuid(), NULL, '550e8400-e29b-41d4-a716-446655440000', NULL, 10, true, NOW())
ON CONFLICT DO NOTHING;

INSERT INTO public.coupons (id, code, brand_id, influencer_id, discount_pct, is_active, created_at)
VALUES (gen_random_uuid(), NULL, '550e8400-e29b-41d4-a716-446655440001', NULL, 10, true, NOW())
ON CONFLICT DO NOTHING;

