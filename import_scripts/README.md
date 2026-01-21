# TrackrCommerce Data Import Guide

## ⚠️ SECURITY WARNING

**NEVER commit CSV files with real data or generated SQL files to version control!**

All `sample_*.csv` files contain FAKE data for testing only. Generated `*_import.sql` files are automatically excluded from git.

Read [SECURITY.md](../SECURITY.md) before proceeding with data imports.

---

## Overview

This guide explains how to import historical data from CSV spreadsheets into your TrackrCommerce database. The import process is divided into 6 steps, following database table dependencies.

## Prerequisites

1. Node.js installed on your system
2. CSV files with your historical data
3. Access to Supabase SQL Editor
4. Users already created in Supabase Authentication

## Database Dependency Order

```
auth.users (Supabase Auth) ← MUST create manually first
    ↓
profiles
    ├→ brands
    │   ├→ brand_secrets
    │   ├→ influencers
    │   │   └→ coupons
    │   │       └→ conversions
```

## Step-by-Step Import Process

### Step 0: Create Users in Supabase Auth (REQUIRED)

**IMPORTANT:** Users must be created in Supabase Authentication FIRST before running any import scripts.

1. Go to your Supabase Dashboard
2. Click on "Authentication" in the left sidebar
3. Click "Users"
4. Click "Add user" button
5. Enter email and password
6. Click "Save"
7. Copy the generated User ID (UUID)

Example user creation:
- Email: `brand@example.com`
- Password: `securepassword123`
- Auto-generated User ID: `d7310054-2a0c-46f1-a017-c0184d3aaac4` ← Copy this!

---

### Step 1: Import Profiles

**Prerequisite:** Users created in Supabase Auth

**Command:**
```bash
cd import_scripts
node 1_profiles.js sample_profiles.csv
```

**CSV Format:**
```
id,email,full_name,role
d7310054-2a0c-46f1-a017-c0184d3aaac4,brand@example.com,Brand Owner,brand_admin
330586c8-aab0-4438-9505-941577a71470,influencer@example.com,Maria Influencer,influencer
```

**Fields:**
- `id` - UUID from Supabase Auth Users (REQUIRED)
- `email` - Email address
- `full_name` - User's full name
- `role` - One of: `master`, `brand_admin`, `influencer`, `user`

**Instructions:**
1. Create CSV file with user data
2. Run the script: `node 1_profiles.js your_file.csv`
3. Review the generated `profiles_import.sql`
4. Open Supabase SQL Editor
5. Copy and paste the SQL
6. Execute it
7. Proceed to Step 2

---

### Step 2: Import Brands

**Prerequisite:** Profiles created

**Command:**
```bash
node 2_brands.js sample_brands.csv
```

**CSV Format:**
```
name,nuvemshop_store_id,owner_id,is_real
My Store,123456,d7310054-2a0c-46f1-a017-c0184d3aaac4,true
Another Store,789012,d7310054-2a0c-46f1-a017-c0184d3aaac4,false
```

**Fields:**
- `name` - Brand/store name (REQUIRED)
- `nuvemshop_store_id` - Nuvemshop store ID (optional)
- `owner_id` - UUID from profiles table (REQUIRED, must be brand_admin or master)
- `is_real` - `true` or `false` (optional, defaults to true)

**Instructions:**
1. Note the profile UUIDs from Step 1
2. Create CSV with brand data using those profile UUIDs
3. Run: `node 2_brands.js your_file.csv`
4. Review `brands_import.sql`
5. Execute in Supabase SQL Editor
6. Note down the generated brand IDs for next step

---

### Step 3: Import Brand Secrets

**Prerequisite:** Brands created

**Command:**
```bash
node 3_brand_secrets.js sample_brand_secrets.csv
```

**CSV Format:**
```
brand_id,access_token
550e8400-e29b-41d4-a716-446655440000,nuvem_token_abc123xyz
550e8400-e29b-41d4-a716-446655440001,nuvem_token_def456uvw
```

**Fields:**
- `brand_id` - UUID from brands table (REQUIRED)
- `access_token` - Nuvemshop API access token (REQUIRED)

**Instructions:**
1. Get brand IDs from Step 2
2. Create CSV with brand ID and Nuvemshop API tokens
3. Run: `node 3_brand_secrets.js your_file.csv`
4. Review `brand_secrets_import.sql`
5. Execute in Supabase SQL Editor

---

### Step 4: Import Influencers

**Prerequisite:** Profiles and Brands created

**Command:**
```bash
node 4_influencers.js sample_influencers.csv
```

**CSV Format:**
```
brand_id,profile_id,name,social_handle,commission_rate
550e8400-e29b-41d4-a716-446655440000,766b69a1-f475-4d3a-8d11-9faced8dec59,Maria Influencer,@maria.influencer,15.00
550e8400-e29b-41d4-a716-446655440000,330586c8-aab0-4438-9505-941577a71470,João Influencer,@joao.influencer,12.50
```

**Fields:**
- `brand_id` - UUID from brands table (REQUIRED)
- `profile_id` - UUID from profiles table (influencer user) (REQUIRED)
- `name` - Influencer display name (REQUIRED)
- `social_handle` - Social media handle, e.g., @username (optional)
- `commission_rate` - Commission percentage, e.g., 15.00 for 15% (optional, defaults to 10)

**Instructions:**
1. Get profile IDs and brand IDs
2. Create CSV with influencer data
3. Run: `node 4_influencers.js your_file.csv`
4. Review `influencers_import.sql`
5. Execute in Supabase SQL Editor
6. Note down influencer IDs for next step

---

### Step 5: Import Coupons

**Prerequisite:** Brands and Influencers created

**Command:**
```bash
node 5_coupons.js sample_coupons.csv
```

**CSV Format:**
```
code,brand_id,influencer_id,discount_pct,is_active
MARIA15,550e8400-e29b-41d4-a716-446655440000,550e8400-e29b-41d4-a716-446655440100,15,true
JOAO20,550e8400-e29b-41d4-a716-446655440000,550e8400-e29b-41d4-a716-446655440101,20,true
```

**Fields:**
- `code` - Coupon code, e.g., MARIA15 (REQUIRED)
- `brand_id` - UUID from brands table (REQUIRED)
- `influencer_id` - UUID from influencers table (REQUIRED)
- `discount_pct` - Discount percentage, e.g., 15 for 15% (optional, defaults to 10)
- `is_active` - `true` or `false` (optional, defaults to true)

**Instructions:**
1. Get influencer IDs and brand IDs
2. Create CSV with coupon data
3. Run: `node 5_coupons.js your_file.csv`
4. Review `coupons_import.sql`
5. Execute in Supabase SQL Editor
6. Note down coupon IDs for next step

---

### Step 6: Import Conversions (Sales)

**Prerequisite:** Brands and Coupons created

**Command:**
```bash
node 6_conversions.js sample_conversions.csv
```

**CSV Format:**
```
order_id,brand_id,coupon_id,order_amount,commission_amount,status,order_is_real,sale_date
ORD001,550e8400-e29b-41d4-a716-446655440000,550e8400-e29b-41d4-a716-446655440200,500.00,75.00,paid,true,2025-01-15 10:30:00
ORD002,550e8400-e29b-41d4-a716-446655440000,,350.00,0.00,pending,false,2025-01-14 14:20:00
```

**Fields:**
- `order_id` - Unique order identifier (REQUIRED)
- `brand_id` - UUID from brands table (REQUIRED)
- `coupon_id` - UUID from coupons table (optional, can be empty if no coupon used)
- `order_amount` - Order total amount (REQUIRED)
- `commission_amount` - Commission earned (REQUIRED)
- `status` - One of: `paid`, `confirmed`, `completed`, `pending`, `cancelled` (optional, defaults to 'paid')
- `order_is_real` - `true` or `false` (optional, defaults to true)
- `sale_date` - Sale date and time, format: `YYYY-MM-DD HH:MM:SS` (optional, defaults to current time)

**Instructions:**
1. Get brand and coupon IDs
2. Create CSV with conversion/sale data
3. Run: `node 6_conversions.js your_file.csv`
4. Review `conversions_import.sql`
5. Execute in Supabase SQL Editor
6. Done! Your data is imported

---

## Complete Example Workflow

```bash
# 1. Create users in Supabase Auth manually (get UUIDs)

# 2. Run all import scripts in order
cd import_scripts

node 1_profiles.js my_profiles.csv
# → Execute profiles_import.sql in Supabase

node 2_brands.js my_brands.csv
# → Execute brands_import.sql in Supabase

node 3_brand_secrets.js my_secrets.csv
# → Execute brand_secrets_import.sql in Supabase

node 4_influencers.js my_influencers.csv
# → Execute influencers_import.sql in Supabase

node 5_coupons.js my_coupons.csv
# → Execute coupons_import.sql in Supabase

node 6_conversions.js my_conversions.csv
# → Execute conversions_import.sql in Supabase

# Done!
```

---

## CSV Best Practices

1. **Use UTF-8 encoding** - Ensure your CSV is in UTF-8 format
2. **No quotes needed** - Script handles escaping automatically
3. **Empty values** - Leave blank for optional fields, e.g., `,,value,`
4. **Date format** - Use ISO format: `YYYY-MM-DD HH:MM:SS`
5. **UUIDs** - Ensure UUIDs are valid (36 characters with hyphens)
6. **Single quotes** - If data contains quotes, they'll be escaped automatically

---

## Troubleshooting

### Error: "File not found"
- Check the CSV filename is correct
- Ensure you're in the `import_scripts` directory
- Example: `node 1_profiles.js ../my_data/profiles.csv`

### Error: "Foreign key violation"
- You skipped a dependency step
- Ensure you're following the steps in order
- Profiles must exist before brands
- Brands must exist before influencers, etc.

### Error: "Duplicate key value violates unique constraint"
- The data already exists in the database
- Check if you're importing twice
- Use `ON CONFLICT ... DO NOTHING` in the generated SQL to skip duplicates

### Generated SQL looks wrong
- Review the generated `.sql` file carefully
- Make sure your CSV data is in the right format
- Check that UUIDs are valid

---

## Next Steps

After importing data:

1. **Login to your app** with the brand admin user
2. **Check the dashboard** to see your brands and conversions
3. **Verify metrics** are calculated correctly
4. **Test the coupons** and sales functionality

---

## Support

For issues with the import scripts, check:
1. CSV format matches the examples
2. All dependencies are created first
3. UUIDs are valid and properly referenced
4. All required fields are filled in
