-- TrackrCommerce Database Schema
-- Current database structure as of January 2026
-- This reflects the actual Supabase database schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. PROFILES TABLE
-- ============================================
-- Extends auth.users with application-specific profile data
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid NOT NULL,
  email text UNIQUE,
  full_name text,
  role user_role NOT NULL DEFAULT 'user'::user_role,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);

-- ============================================
-- 2. BRANDS TABLE
-- ============================================
-- Stores brand/store information
CREATE TABLE IF NOT EXISTS public.brands (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  nuvemshop_store_id text UNIQUE,
  owner_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  is_real boolean NOT NULL DEFAULT true,
  CONSTRAINT brands_pkey PRIMARY KEY (id),
  CONSTRAINT brands_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.profiles(id)
);

-- ============================================
-- 3. BRAND_SECRETS TABLE
-- ============================================
-- Stores sensitive brand credentials (Nuvemshop access tokens)
CREATE TABLE IF NOT EXISTS public.brand_secrets (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL UNIQUE,
  access_token text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT brand_secrets_pkey PRIMARY KEY (id),
  CONSTRAINT brand_secrets_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brands(id)
);

-- ============================================
-- 4. INFLUENCERS TABLE
-- ============================================
-- Stores influencer information linked to brands
CREATE TABLE IF NOT EXISTS public.influencers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  brand_id uuid,
  profile_id uuid,
  name text,
  social_handle text,
  commission_rate numeric DEFAULT '0'::numeric,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT influencers_pkey PRIMARY KEY (id),
  CONSTRAINT influencers_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brands(id),
  CONSTRAINT influencers_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id)
);

-- ============================================
-- 5. COUPON_CLASSIFICATIONS TABLE
-- ============================================
-- Stores coupon classification categories for organizing coupons
CREATE TABLE IF NOT EXISTS public.coupon_classifications (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  brand_id uuid NOT NULL,
  name character varying NOT NULL,
  description text,
  color character varying DEFAULT '#6366f1'::character varying,
  is_active boolean DEFAULT true,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  CONSTRAINT coupon_classifications_pkey PRIMARY KEY (id),
  CONSTRAINT coupon_classifications_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brands(id)
);

-- ============================================
-- 6. COUPONS TABLE
-- ============================================
-- Stores coupon codes linked to influencers and brands
CREATE TABLE IF NOT EXISTS public.coupons (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  code text NOT NULL,
  influencer_id uuid,
  brand_id uuid,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  discount_value numeric,
  discount_type text,
  classification uuid,
  classification_updated_at timestamp without time zone,
  CONSTRAINT coupons_pkey PRIMARY KEY (id),
  CONSTRAINT coupons_influencer_id_fkey FOREIGN KEY (influencer_id) REFERENCES public.influencers(id),
  CONSTRAINT coupons_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brands(id)
);

-- ============================================
-- 7. CONVERSIONS TABLE
-- ============================================
-- Stores order/sale conversion data from Nuvemshop
CREATE TABLE IF NOT EXISTS public.conversions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  order_id text NOT NULL,
  brand_id uuid,
  coupon_id uuid,
  order_amount numeric NOT NULL,
  commission_amount numeric NOT NULL,
  status text,
  sale_date timestamp with time zone DEFAULT now(),
    sale_date_br_tmz timestamp with time zone,
  metadata jsonb,
  order_is_real boolean NOT NULL DEFAULT true,
  customer_id text,
  customer_email text,
  order_number text,
  CONSTRAINT conversions_pkey PRIMARY KEY (id),
  CONSTRAINT conversions_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brands(id),
  CONSTRAINT conversions_coupon_id_fkey FOREIGN KEY (coupon_id) REFERENCES public.coupons(id)
);

-- ============================================
-- 8. UTM_DATA TABLE
-- ============================================
-- Stores UTM tracking parameters for conversions
CREATE TABLE IF NOT EXISTS public.utm_data (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  order_id text,
  utm_campaign text,
  utm_content text,
  utm_medium text,
  utm_source text,
  utm_term text
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Profiles indexes
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- Brands indexes
CREATE INDEX IF NOT EXISTS idx_brands_owner_id ON public.brands(owner_id);
CREATE INDEX IF NOT EXISTS idx_brands_nuvemshop_store_id ON public.brands(nuvemshop_store_id);
CREATE INDEX IF NOT EXISTS idx_brands_is_real ON public.brands(is_real);

-- Brand secrets indexes
CREATE INDEX IF NOT EXISTS idx_brand_secrets_brand_id ON public.brand_secrets(brand_id);

-- Influencers indexes
CREATE INDEX IF NOT EXISTS idx_influencers_brand_id ON public.influencers(brand_id);
CREATE INDEX IF NOT EXISTS idx_influencers_profile_id ON public.influencers(profile_id);
CREATE INDEX IF NOT EXISTS idx_influencers_brand_profile ON public.influencers(brand_id, profile_id);

-- Coupon classifications indexes
CREATE INDEX IF NOT EXISTS idx_coupon_classifications_brand_id ON public.coupon_classifications(brand_id);
CREATE INDEX IF NOT EXISTS idx_coupon_classifications_is_active ON public.coupon_classifications(is_active);

-- Coupons indexes
CREATE INDEX IF NOT EXISTS idx_coupons_code ON public.coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_brand_id ON public.coupons(brand_id);
CREATE INDEX IF NOT EXISTS idx_coupons_influencer_id ON public.coupons(influencer_id);
CREATE INDEX IF NOT EXISTS idx_coupons_brand_influencer ON public.coupons(brand_id, influencer_id);
CREATE INDEX IF NOT EXISTS idx_coupons_is_active ON public.coupons(is_active);
CREATE INDEX IF NOT EXISTS idx_coupons_classification ON public.coupons(classification);

-- Conversions indexes
CREATE INDEX IF NOT EXISTS idx_conversions_order_id ON public.conversions(order_id);
CREATE INDEX IF NOT EXISTS idx_conversions_brand_id ON public.conversions(brand_id);
CREATE INDEX IF NOT EXISTS idx_conversions_coupon_id ON public.conversions(coupon_id);
CREATE INDEX IF NOT EXISTS idx_conversions_status ON public.conversions(status);
CREATE INDEX IF NOT EXISTS idx_conversions_sale_date ON public.conversions(sale_date);
CREATE INDEX IF NOT EXISTS idx_conversions_sale_date_br_tmz ON public.conversions(sale_date_br_tmz);
CREATE INDEX IF NOT EXISTS idx_conversions_order_is_real ON public.conversions(order_is_real);

-- UTM data indexes
CREATE INDEX IF NOT EXISTS idx_utm_data_order_id ON public.utm_data(order_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_secrets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.influencers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_classifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.utm_data ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Brands policies
CREATE POLICY "brands_select_own" ON public.brands
  FOR SELECT USING (
    owner_id = auth.uid() OR
    id IN (
      SELECT DISTINCT brand_id FROM public.influencers
      WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY "brands_insert_own" ON public.brands
  FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "brands_update_own" ON public.brands
  FOR UPDATE USING (owner_id = auth.uid());

-- Brand secrets policies
CREATE POLICY "brand_secrets_select_own" ON public.brand_secrets
  FOR SELECT USING (
    brand_id IN (
      SELECT id FROM public.brands WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "brand_secrets_insert_own" ON public.brand_secrets
  FOR INSERT WITH CHECK (
    brand_id IN (
      SELECT id FROM public.brands WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "brand_secrets_update_own" ON public.brand_secrets
  FOR UPDATE USING (
    brand_id IN (
      SELECT id FROM public.brands WHERE owner_id = auth.uid()
    )
  );

-- Influencers policies
CREATE POLICY "influencers_select_own_brand" ON public.influencers
  FOR SELECT USING (
    brand_id IN (
      SELECT id FROM public.brands WHERE owner_id = auth.uid()
    ) OR
    profile_id = auth.uid()
  );

CREATE POLICY "influencers_insert_own_brand" ON public.influencers
  FOR INSERT WITH CHECK (
    brand_id IN (
      SELECT id FROM public.brands WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "influencers_update_own_brand" ON public.influencers
  FOR UPDATE USING (
    brand_id IN (
      SELECT id FROM public.brands WHERE owner_id = auth.uid()
    )
  );

-- Coupon classifications policies
CREATE POLICY "coupon_classifications_select_own_brand" ON public.coupon_classifications
  FOR SELECT USING (
    brand_id IN (
      SELECT id FROM public.brands WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "coupon_classifications_insert_own_brand" ON public.coupon_classifications
  FOR INSERT WITH CHECK (
    brand_id IN (
      SELECT id FROM public.brands WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "coupon_classifications_update_own_brand" ON public.coupon_classifications
  FOR UPDATE USING (
    brand_id IN (
      SELECT id FROM public.brands WHERE owner_id = auth.uid()
    )
  );

-- Coupons policies
CREATE POLICY "coupons_select_own_brand" ON public.coupons
  FOR SELECT USING (
    brand_id IN (
      SELECT id FROM public.brands WHERE owner_id = auth.uid()
    ) OR
    influencer_id IN (
      SELECT id FROM public.influencers WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY "coupons_insert_own_brand" ON public.coupons
  FOR INSERT WITH CHECK (
    brand_id IN (
      SELECT id FROM public.brands WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "coupons_update_own_brand" ON public.coupons
  FOR UPDATE USING (
    brand_id IN (
      SELECT id FROM public.brands WHERE owner_id = auth.uid()
    )
  );

-- Conversions policies
CREATE POLICY "conversions_select_own_brand" ON public.conversions
  FOR SELECT USING (
    brand_id IN (
      SELECT id FROM public.brands WHERE owner_id = auth.uid()
    ) OR
    coupon_id IN (
      SELECT id FROM public.coupons
      WHERE influencer_id IN (
        SELECT id FROM public.influencers WHERE profile_id = auth.uid()
      )
    )
  );

CREATE POLICY "conversions_insert_own_brand" ON public.conversions
  FOR INSERT WITH CHECK (
    brand_id IN (
      SELECT id FROM public.brands WHERE owner_id = auth.uid()
    )
  );

-- UTM data policies
CREATE POLICY "utm_data_select_own_brand" ON public.utm_data
  FOR SELECT USING (
    order_id IN (
      SELECT order_id FROM public.conversions
      WHERE brand_id IN (
        SELECT id FROM public.brands WHERE owner_id = auth.uid()
      )
    )
  );

-- ============================================
-- NOTES
-- ============================================
-- 1. The 'role' column in profiles uses a custom enum type 'user_role'
--    This enum should be created separately if it doesn't exist:
--    CREATE TYPE user_role AS ENUM ('user', 'brand_admin', 'influencer', 'master');
--
-- 2. Brand secrets should be handled with care and encrypted at rest
--
-- 3. The classification column in coupons references coupon_classifications(id)
--    but doesn't have a foreign key constraint defined in the current schema
--
-- 4. UTM data table doesn't have a primary key constraint defined
--    Consider adding: CONSTRAINT utm_data_pkey PRIMARY KEY (id)
