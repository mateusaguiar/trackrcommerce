# Supabase Integration & Setup Guide

## 📋 Database Setup

### Step 1: Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Note your **Project URL** and **Anon Key**

### Step 2: Run Database Schema
1. In Supabase Dashboard, go to **SQL Editor**
2. Create new query
3. Copy the entire content from `database-schema.sql` in the root directory
4. Run the SQL script

This will create:
- ✅ `profiles` - User accounts & roles
- ✅ `brands` - E-commerce stores
- ✅ `influencers` - Influencer profiles
- ✅ `brand_influencers` - Many-to-many relationship
- ✅ `coupons` - Coupon codes
- ✅ `sales` - Transaction records
- ✅ `sales_attribution` - Sale-to-influencer mapping

**All with Row Level Security (RLS) policies enabled**

## 🔐 Environment Variables

### Local Development
Create `.env.local` in project root:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Vercel Deployment
1. Go to Vercel Dashboard > Project > Settings > Environment Variables
2. Add:
   - `VITE_SUPABASE_URL` = Your Supabase URL
   - `VITE_SUPABASE_ANON_KEY` = Your Anon Key
3. Redeploy

## 🚀 Features Implemented

### Authentication
- ✅ Sign up with email & password
- ✅ Login with email & password
- ✅ Logout
- ✅ Session management
- ✅ Error handling with translated messages
- ✅ Demo mode (works without Supabase)

**Files:**
- `src/lib/supabaseClient.js` - All auth functions
- `src/components/AuthForm.jsx` - UI component

### Data Fetching
- ✅ Get user brands
- ✅ Get brand coupons
- ✅ Get brand sales
- ✅ Get influencer conversions
- ✅ Create coupons (brand_admin/master only)
- ✅ Log sales

**File:** `src/lib/supabaseClient.js` (dataFunctions export)

## 📦 API Reference

### Authentication Functions

```javascript
import { authFunctions } from './lib/supabaseClient';

// Sign up
const { user, error } = await authFunctions.signUp(
  email, 
  password, 
  fullName, 
  userRole // 'user' | 'influencer' | 'brand_admin' | 'master'
);

// Login
const { user, session, error } = await authFunctions.logIn(email, password);

// Logout
const { error } = await authFunctions.logOut();

// Get current profile
const { profile, error } = await authFunctions.getCurrentProfile();

// Get session
const { session, error } = await authFunctions.getSession();

// Listen to auth changes
const subscription = authFunctions.onAuthStateChange((event, session) => {
  console.log('Auth event:', event);
  console.log('Session:', session);
});
```

### Data Functions

```javascript
import { dataFunctions } from './lib/supabaseClient';

// Get brands for user
const { brands, error } = await dataFunctions.getBrands(userId);

// Get coupons for brand
const { coupons, error } = await dataFunctions.getBrandCoupons(brandId);

// Get sales for brand
const { sales, error } = await dataFunctions.getBrandSales(brandId);

// Get influencer conversions
const { conversions, error } = await dataFunctions.getInfluencerConversions(influencerId);

// Create coupon
const { coupon, error } = await dataFunctions.createCoupon(
  brandId,
  influencerId,
  code,           // e.g., "INFLUENCER20"
  discountType,   // 'percentage' | 'fixed_amount'
  discountValue,  // e.g., 20 for 20% or 50 for R$50
  createdBy       // user ID
);

// Log sale
const { sale, error } = await dataFunctions.logSale(
  brandId,
  couponId,
  amount,
  status // 'completed' | 'pending' | 'cancelled'
);
```

## 🔒 User Roles & Permissions

### Master
- View all brands & metrics
- Manage all users & roles
- Create brands, users, influencers
- Create/edit coupons

### Brand Admin
- View own brand metrics
- Manage brand users
- Create/edit coupons
- View sales & conversions

### Influencer
- View own conversions
- See coupons assigned to them
- Track their sales

### User
- View own brand data
- Limited to read-only access

## ⚠️ Error Handling

All functions return `{ data, error }` format:

```javascript
const { user, error } = await authFunctions.logIn(email, password);

if (error) {
  // Error message is automatically translated
  console.error(getErrorMessage(error));
}
```

Supported error translations:
- Invalid credentials
- Email not confirmed
- User already registered
- Password too short
- Invalid email format

## 🧪 Testing

### Locally
```bash
npm run dev
# Visit http://localhost:3000
# Click "Entrar" to open auth modal
# Try Sign Up or Login (with real Supabase)
```

### Demo Mode (without Supabase)
If `VITE_SUPABASE_URL` is not set, the app shows a demo login button that simulates login without a backend.

## 🐛 Troubleshooting

### "Supabase not configured"
- Check `.env.local` has `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- Restart dev server: `npm run dev`

### Database queries fail
- Verify RLS policies in Supabase
- Check user role in `profiles.user_role`
- Check `profiles.brand_id` is set correctly

### Auth modal shows demo button
- Supabase not configured - add environment variables

## 📊 Data Schema Overview

```
profiles
├── id (UUID) - User ID
├── email (string) - User email
├── full_name (string)
├── user_role (string) - master/brand_admin/influencer/user
├── brand_id (UUID) - Primary brand (can be NULL)
└── created_at (timestamp)

brands
├── id (UUID)
├── owner_id (UUID) - References profiles.id
├── name (string)
├── slug (string) - Unique URL-safe name
├── subscription_plan (string)
└── created_at (timestamp)

influencers
├── id (UUID)
├── user_id (UUID) - References profiles.id
├── display_name (string)
├── instagram_handle (string)
├── tiktok_handle (string)
└── bio (text)

coupons
├── id (UUID)
├── brand_id (UUID)
├── influencer_id (UUID)
├── code (string) - e.g., "INFLUENCER20"
├── discount_type (string) - percentage/fixed_amount
├── discount_value (decimal)
├── active (boolean)
├── created_by (UUID) - User who created
└── created_at (timestamp)

sales
├── id (UUID)
├── brand_id (UUID)
├── coupon_id (UUID) - Can be NULL
├── amount (decimal)
├── status (string)
└── created_at (timestamp)

sales_attribution
├── id (UUID)
├── sale_id (UUID)
├── influencer_id (UUID)
├── coupon_id (UUID)
├── commission (decimal)
└── created_at (timestamp)
```

## 🔄 Next Steps

1. ✅ Database schema ready
2. ✅ Auth implemented
3. ⬜ Create brand view (list user's brands)
4. ⬜ Create coupon management UI
5. ⬜ Create sales tracking dashboard
6. ⬜ Create influencer conversion view
7. ⬜ Add n8n integration for Nuvemshop sync

Need help with any of these? Let me know! 🚀
