-- Step 6: Create Conversions (Sales)
-- Prerequisites: Brands and Coupons must exist
-- brand_id should match an existing brand ID
-- coupon_id should match an existing coupon ID (can be NULL if no coupon)

INSERT INTO public.conversions (id, order_id, brand_id, coupon_id, order_amount, commission_amount, status, order_is_real, sale_date, metadata, created_at)
VALUES (gen_random_uuid(), NULL, '550e8400-e29b-41d4-a716-446655440000', NULL, 0.00, 0.00, 'paid', true, NOW(), NULL::jsonb, NOW())
ON CONFLICT DO NOTHING;

INSERT INTO public.conversions (id, order_id, brand_id, coupon_id, order_amount, commission_amount, status, order_is_real, sale_date, metadata, created_at)
VALUES (gen_random_uuid(), NULL, '550e8400-e29b-41d4-a716-446655440001', NULL, 0.00, 0.00, 'paid', true, NOW(), NULL::jsonb, NOW())
ON CONFLICT DO NOTHING;

