-- TrackrCommerce Database Schema
-- Run this in Supabase SQL Editor to set up the database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. BRANDS TABLE
CREATE TABLE IF NOT EXISTS brands (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  subscription_plan VARCHAR(50) DEFAULT 'free', -- free, starter, pro, enterprise
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. PROFILES TABLE (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL UNIQUE,
  full_name VARCHAR(255),
  user_role VARCHAR(50) DEFAULT 'user', -- master, brand_admin, influencer, user
  brand_id UUID REFERENCES brands(id),
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. INFLUENCERS TABLE
CREATE TABLE IF NOT EXISTS influencers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  display_name VARCHAR(255) NOT NULL,
  instagram_handle VARCHAR(255),
  tiktok_handle VARCHAR(255),
  bio TEXT,
  follower_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. BRAND_INFLUENCERS TABLE (Many-to-Many)
CREATE TABLE IF NOT EXISTS brand_influencers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  influencer_id UUID NOT NULL REFERENCES influencers(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(brand_id, influencer_id)
);

-- 5. COUPONS TABLE
CREATE TABLE IF NOT EXISTS coupons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  influencer_id UUID NOT NULL REFERENCES influencers(id) ON DELETE CASCADE,
  code VARCHAR(50) NOT NULL UNIQUE,
  discount_type VARCHAR(20), -- percentage, fixed_amount
  discount_value DECIMAL(10, 2) NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. SALES TABLE
CREATE TABLE IF NOT EXISTS sales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  coupon_id UUID REFERENCES coupons(id) ON DELETE SET NULL,
  amount DECIMAL(10, 2) NOT NULL,
  status VARCHAR(50) DEFAULT 'completed', -- pending, completed, cancelled
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. SALES_ATTRIBUTION TABLE
CREATE TABLE IF NOT EXISTS sales_attribution (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  influencer_id UUID NOT NULL REFERENCES influencers(id) ON DELETE CASCADE,
  coupon_id UUID REFERENCES coupons(id),
  commission DECIMAL(10, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- INDEXES FOR PERFORMANCE
CREATE INDEX idx_profiles_brand_id ON profiles(brand_id);
CREATE INDEX idx_profiles_user_role ON profiles(user_role);
CREATE INDEX idx_influencers_user_id ON influencers(user_id);
CREATE INDEX idx_brand_influencers_brand_id ON brand_influencers(brand_id);
CREATE INDEX idx_brand_influencers_influencer_id ON brand_influencers(influencer_id);
CREATE INDEX idx_coupons_brand_id ON coupons(brand_id);
CREATE INDEX idx_coupons_influencer_id ON coupons(influencer_id);
CREATE INDEX idx_sales_brand_id ON sales(brand_id);
CREATE INDEX idx_sales_coupon_id ON sales(coupon_id);
CREATE INDEX idx_sales_attribution_sale_id ON sales_attribution(sale_id);
CREATE INDEX idx_sales_attribution_influencer_id ON sales_attribution(influencer_id);

-- ROW LEVEL SECURITY (RLS) POLICIES

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE influencers ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_influencers ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_attribution ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can see their own profile, Masters can see all
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Masters can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND user_role = 'master'
    )
  );

-- Brands: Users can see their own brand, Masters can see all
CREATE POLICY "Users can view own brand" ON brands
  FOR SELECT USING (
    id IN (
      SELECT brand_id FROM profiles WHERE id = auth.uid()
    ) OR owner_id = auth.uid()
  );

CREATE POLICY "Masters can view all brands" ON brands
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND user_role = 'master'
    )
  );

-- Influencers: Influencers can see own profile, Admins can see connected influencers
CREATE POLICY "Influencers can view own profile" ON influencers
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Brand admins can view connected influencers" ON influencers
  FOR SELECT USING (
    id IN (
      SELECT influencer_id FROM brand_influencers
      WHERE brand_id IN (
        SELECT brand_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

-- Sales: Brand users can view their brand sales
CREATE POLICY "Users can view own brand sales" ON sales
  FOR SELECT USING (
    brand_id IN (
      SELECT brand_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Coupons: Brand users can view their brand coupons
CREATE POLICY "Users can view own brand coupons" ON coupons
  FOR SELECT USING (
    brand_id IN (
      SELECT brand_id FROM profiles WHERE id = auth.uid()
    )
  );
