# Supabase Integration - Adjusted for Your Existing Database

## ✅ Database Reconciliation

Your existing database schema is perfect! Here's what I've done:

### **Kept Your Existing Tables (No Changes Needed)**
- ✅ `profiles` - user accounts with `role` enum (influencer, brand_admin, master, user)
- ✅ `brands` - e-commerce stores with Nuvemshop integration
- ✅ `brand_secrets` - secure storage for Nuvemshop access tokens
- ✅ `influencers` - influencer profiles linked to brands
- ✅ `coupons` - discount codes with `discount_pct`
- ✅ `conversions` - sales tracking with comprehensive data

### **Added (Optional Enhancements)**

**File: `database-schema-adjustments.sql`** - Run this in Supabase to add:
1. **Missing Indexes** - For better query performance
2. **Row Level Security (RLS) Policies** - Data access control
3. **Helpful Views** for analytics:
   - `v_coupon_performance` - Coupon metrics
   - `v_influencer_performance` - Influencer metrics
   - `v_brand_metrics` - Overall brand performance

## 🔄 Updated API Functions

All functions now use your actual schema column names:

```javascript
import { authFunctions, dataFunctions } from './lib/supabaseClient';

// ============================================
// AUTHENTICATION
// ============================================

// Sign up (uses your profile.role, not user_role)
const { user, error } = await authFunctions.signUp(
  email,
  password,
  fullName,
  role // 'user' | 'influencer' | 'brand_admin' | 'master'
);

// Login
const { user, session, error } = await authFunctions.logIn(email, password);

// Get current profile
const { profile, error } = await authFunctions.getCurrentProfile();
// Returns: { id, email, full_name, role, created_at }

// ============================================
// BRANDS
// ============================================

// Get user's brands
const { brands, error } = await dataFunctions.getBrands(userId);
// Returns brands owned by user

// ============================================
// COUPONS
// ============================================

// Get coupons for a brand (with influencer info)
const { coupons, error } = await dataFunctions.getBrandCoupons(brandId);
// Returns: code, discount_pct, is_active, influencer details

// Create new coupon
const { coupon, error } = await dataFunctions.createCoupon(
  brandId,
  influencerId,
  code,           // e.g., "INFLUENCER20"
  discountPct     // e.g., 20
);

// ============================================
// CONVERSIONS (SALES)
// ============================================

// Get all conversions for a brand
const { conversions, error } = await dataFunctions.getBrandConversions(
  brandId,
  {
    status: 'completed',  // optional: filter by status
    onlyReal: true        // optional: only real orders
  }
);
// Returns: order_id, order_amount, commission_amount, status, coupon info

// Get influencer conversions
const { conversions, error } = await dataFunctions.getInfluencerConversions(
  influencerId,
  brandId // optional
);

// Log a new conversion (from Nuvemshop webhook)
const { conversion, error } = await dataFunctions.logConversion(
  brandId,
  couponId,
  orderId,           // from Nuvemshop
  orderAmount,       // total order value
  commissionAmount,  // calculated commission
  {                  // optional metadata
    customer_id: '...',
    product_count: 5
  }
);

// ============================================
// INFLUENCERS
// ============================================

// Get brand influencers
const { influencers, error } = await dataFunctions.getBrandInfluencers(brandId);
// Returns: name, social_handle, commission_rate, profile_id

// ============================================
// ANALYTICS VIEWS
// ============================================

// Get brand metrics (total conversions, revenue, commission)
const { metrics, error } = await dataFunctions.getBrandMetrics(brandId);
// Returns: total_influencers, total_coupons, total_conversions, etc.

// Get influencer performance
const { performance, error } = await dataFunctions.getInfluencerPerformance(influencerId);
// Returns: total_coupons, total_conversions, total_commission, avg_real_commission

// Get coupon performance
const { performance, error } = await dataFunctions.getCouponPerformance(couponId);
// Returns: total_conversions, real_conversions, total_commission, etc.

// ============================================
// BRAND SECRETS (Nuvemshop Tokens)
// ============================================

// Store Nuvemshop access token
const { secret, error } = await dataFunctions.storeBrandSecret(
  brandId,
  accessToken // from Nuvemshop OAuth
);
```

## 📊 Key Schema Differences vs. Original Proposal

| My Proposal | Your Schema | Used In |
|------------|-----------|---------|
| `user_role` | `role` | `profiles` table |
| `sales` + `sales_attribution` | `conversions` | Single table with better structure |
| `discount_type` + `discount_value` | `discount_pct` | `coupons` table |
| `display_name` | `name` | `influencers` table |
| N/A | `nuvemshop_store_id` | `brands` table |
| N/A | `order_is_real` | `conversions` table |
| N/A | `metadata` (jsonb) | `conversions` table |
| N/A | `brand_secrets` | Secure token storage |

## 🚀 Setup Steps

### Step 1: Apply Database Enhancements (Optional but Recommended)
```sql
-- Run this in Supabase SQL Editor
-- File: database-schema-adjustments.sql
-- Adds: indexes, RLS policies, analytics views
```

### Step 2: Configure Environment Variables
Create `.env.local`:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Step 3: Test Authentication
```bash
npm run dev
# Visit http://localhost:3000
# Click "Entrar" and test Sign Up / Login
```

### Step 4: Deploy to Vercel
- Add env vars to Vercel settings
- Deploy

## 🔒 User Roles & Permissions

Your schema uses `role` enum with these values:

### **master**
- View all brands & metrics
- Manage users & roles
- Create brands, users, influencers
- Create/edit coupons

### **brand_admin**
- Manage own brand
- View brand metrics
- Create/edit coupons
- Manage influencers

### **influencer**
- View own conversions
- See assigned coupons
- Track earnings

### **user**
- Limited read-only access
- View assigned data

## 🔐 Row Level Security (RLS)

The adjustments file includes RLS policies:
- Users see only their own profile
- Brand owners see their brand's data
- Masters see all data
- Influencers see assigned coupons & conversions

## 📈 Analytics Views

Three helpful views for dashboards:

### `v_brand_metrics`
```
- total_influencers
- total_coupons
- total_conversions
- real_conversions (order_is_real = true)
- total_order_amount
- total_commission
```

### `v_influencer_performance`
```
- total_coupons
- total_conversions
- total_commission
- avg_real_commission
- total_order_amount
```

### `v_coupon_performance`
```
- total_conversions
- real_conversions
- total_commission
- coupon performance metrics
```

## ⚡ Performance Optimizations

Indexes added for these queries:
- Find profiles by role
- Find brands by owner
- Find influencers by brand
- Find coupons by code, brand, influencer
- Find conversions by status, date, brand

## 🎯 Next Steps

Ready to build:
1. ✅ Authentication (done)
2. ✅ Database functions (done)
3. ⬜ Brand dashboard UI
4. ⬜ Coupon management UI
5. ⬜ Sales/conversions dashboard
6. ⬜ Influencer performance page
7. ⬜ n8n webhook integration for Nuvemshop

Need help with any of these? 🚀
