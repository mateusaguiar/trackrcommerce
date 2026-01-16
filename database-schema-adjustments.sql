-- TrackrCommerce Database Schema - ADJUSTED FOR EXISTING DATABASE
-- This file shows the additions/modifications needed for your existing schema
-- Your existing tables (profiles, brands, influencers, coupons, conversions, brand_secrets) are perfect!

-- ============================================
-- EXISTING TABLES (Keep as-is)
-- ============================================
-- ✅ profiles - with role enum (influencer, brand_admin, master, user)
-- ✅ brands - with nuvemshop_store_id and is_real
-- ✅ brand_secrets - for Nuvemshop access tokens
-- ✅ influencers - linked to brand and profile
-- ✅ coupons - with discount_pct
-- ✅ conversions - comprehensive sales tracking with metadata

-- ============================================
-- VERIFY ENUMS EXIST
-- ============================================

-- Check if user_role enum exists, if not create it
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('influencer', 'brand_admin', 'master', 'user');
  END IF;
END $$;

-- Check if conversion_status enum exists, if not create it
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'conversion_status') THEN
    CREATE TYPE conversion_status AS ENUM ('pending', 'completed', 'cancelled', 'refunded');
  END IF;
END $$;

-- ============================================
-- ADD MISSING INDEXES FOR PERFORMANCE
-- ============================================

-- Profile indexes
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- Brand indexes
CREATE INDEX IF NOT EXISTS idx_brands_owner_id ON public.brands(owner_id);
CREATE INDEX IF NOT EXISTS idx_brands_nuvemshop_store_id ON public.brands(nuvemshop_store_id);
CREATE INDEX IF NOT EXISTS idx_brands_is_real ON public.brands(is_real);

-- Influencer indexes
CREATE INDEX IF NOT EXISTS idx_influencers_brand_id ON public.influencers(brand_id);
CREATE INDEX IF NOT EXISTS idx_influencers_profile_id ON public.influencers(profile_id);
CREATE INDEX IF NOT EXISTS idx_influencers_brand_profile ON public.influencers(brand_id, profile_id);

-- Coupon indexes
CREATE INDEX IF NOT EXISTS idx_coupons_code ON public.coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_brand_id ON public.coupons(brand_id);
CREATE INDEX IF NOT EXISTS idx_coupons_influencer_id ON public.coupons(influencer_id);
CREATE INDEX IF NOT EXISTS idx_coupons_brand_influencer ON public.coupons(brand_id, influencer_id);
CREATE INDEX IF NOT EXISTS idx_coupons_is_active ON public.coupons(is_active);

-- Conversion indexes
CREATE INDEX IF NOT EXISTS idx_conversions_order_id ON public.conversions(order_id);
CREATE INDEX IF NOT EXISTS idx_conversions_brand_id ON public.conversions(brand_id);
CREATE INDEX IF NOT EXISTS idx_conversions_coupon_id ON public.conversions(coupon_id);
CREATE INDEX IF NOT EXISTS idx_conversions_status ON public.conversions(status);
CREATE INDEX IF NOT EXISTS idx_conversions_sale_date ON public.conversions(sale_date);
CREATE INDEX IF NOT EXISTS idx_conversions_order_is_real ON public.conversions(order_is_real);

-- Brand secrets indexes
CREATE INDEX IF NOT EXISTS idx_brand_secrets_brand_id ON public.brand_secrets(brand_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.influencers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_secrets ENABLE ROW LEVEL SECURITY;

-- DROP existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own brand" ON public.brands;
DROP POLICY IF EXISTS "Users can view own brand coupons" ON public.coupons;
DROP POLICY IF EXISTS "Users can view own brand sales" ON public.conversions;
DROP POLICY IF EXISTS "Masters can view all" ON public.brands;

-- Profiles: Users can see their own profile
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- Brands: Users can see their own brand and brands they're admin of
CREATE POLICY "brands_select_own" ON public.brands
  FOR SELECT USING (
    owner_id = auth.uid() OR
    id IN (
      SELECT DISTINCT brand_id FROM public.influencers
      WHERE profile_id = auth.uid()
    )
  );

-- Brands: Masters can see all brands
CREATE POLICY "brands_select_masters" ON public.brands
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'master')
  );

-- Influencers: Users can see influencers in their brands
CREATE POLICY "influencers_select_own" ON public.influencers
  FOR SELECT USING (
    brand_id IN (
      SELECT id FROM public.brands WHERE owner_id = auth.uid()
    ) OR
    profile_id = auth.uid()
  );

-- Coupons: Users can see coupons in their brands
CREATE POLICY "coupons_select_own" ON public.coupons
  FOR SELECT USING (
    brand_id IN (
      SELECT id FROM public.brands WHERE owner_id = auth.uid()
    ) OR
    influencer_id IN (
      SELECT id FROM public.influencers WHERE profile_id = auth.uid()
    )
  );

-- Conversions: Users can see conversions for their brands
CREATE POLICY "conversions_select_own" ON public.conversions
  FOR SELECT USING (
    brand_id IN (
      SELECT id FROM public.brands WHERE owner_id = auth.uid()
    )
  );

-- Brand Secrets: Only brand owners can access
CREATE POLICY "brand_secrets_select_own" ON public.brand_secrets
  FOR SELECT USING (
    brand_id IN (
      SELECT id FROM public.brands WHERE owner_id = auth.uid()
    )
  );

-- ============================================
-- HELPFUL VIEWS FOR ANALYTICS
-- ============================================

-- Get coupon performance
CREATE OR REPLACE VIEW v_coupon_performance AS
SELECT
  c.id,
  c.code,
  c.brand_id,
  b.name as brand_name,
  c.influencer_id,
  i.name as influencer_name,
  COUNT(DISTINCT conv.id) as total_conversions,
  COUNT(DISTINCT CASE WHEN conv.order_is_real THEN conv.id END) as real_conversions,
  SUM(conv.order_amount) as total_order_amount,
  SUM(conv.commission_amount) as total_commission,
  AVG(c.discount_pct) as discount_percentage,
  c.created_at
FROM public.coupons c
LEFT JOIN public.brands b ON c.brand_id = b.id
LEFT JOIN public.influencers i ON c.influencer_id = i.id
LEFT JOIN public.conversions conv ON c.id = conv.coupon_id
GROUP BY c.id, c.code, c.brand_id, b.name, c.influencer_id, i.name, c.created_at;

-- Get influencer performance
CREATE OR REPLACE VIEW v_influencer_performance AS
SELECT
  i.id,
  i.name,
  i.brand_id,
  b.name as brand_name,
  COUNT(DISTINCT c.id) as total_coupons,
  COUNT(DISTINCT conv.id) as total_conversions,
  SUM(conv.order_amount) as total_order_amount,
  SUM(conv.commission_amount) as total_commission,
  AVG(CASE WHEN conv.order_is_real THEN conv.commission_amount END) as avg_real_commission,
  i.created_at
FROM public.influencers i
LEFT JOIN public.brands b ON i.brand_id = b.id
LEFT JOIN public.coupons c ON i.id = c.influencer_id
LEFT JOIN public.conversions conv ON c.id = conv.coupon_id
GROUP BY i.id, i.name, i.brand_id, b.name, i.created_at;

-- Get brand metrics
CREATE OR REPLACE VIEW v_brand_metrics AS
SELECT
  b.id,
  b.name,
  b.owner_id,
  p.full_name as owner_name,
  COUNT(DISTINCT i.id) as total_influencers,
  COUNT(DISTINCT c.id) as total_coupons,
  COUNT(DISTINCT conv.id) as total_conversions,
  COUNT(DISTINCT CASE WHEN conv.order_is_real THEN conv.id END) as real_conversions,
  SUM(conv.order_amount) as total_order_amount,
  SUM(conv.commission_amount) as total_commission,
  b.created_at
FROM public.brands b
LEFT JOIN public.profiles p ON b.owner_id = p.id
LEFT JOIN public.influencers i ON b.id = i.brand_id
LEFT JOIN public.coupons c ON b.id = c.brand_id
LEFT JOIN public.conversions conv ON b.id = conv.brand_id
GROUP BY b.id, b.name, b.owner_id, p.full_name, b.created_at;
