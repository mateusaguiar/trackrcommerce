# Data Import Scripts - Quick Reference

## 6-Step Import Process

```
Step 0: Create users manually in Supabase Auth
Step 1: node 1_profiles.js <csv>        → profiles_import.sql
Step 2: node 2_brands.js <csv>          → brands_import.sql
Step 3: node 3_brand_secrets.js <csv>   → brand_secrets_import.sql
Step 4: node 4_influencers.js <csv>     → influencers_import.sql
Step 5: node 5_coupons.js <csv>         → coupons_import.sql
Step 6: node 6_conversions.js <csv>     → conversions_import.sql
```

## CSV Column Reference

### 1. Profiles
```
id (UUID from Auth), email, full_name, role
```

### 2. Brands
```
name, nuvemshop_store_id (optional), owner_id (UUID), is_real (true/false)
```

### 3. Brand Secrets
```
brand_id (UUID), access_token
```

### 4. Influencers
```
brand_id (UUID), profile_id (UUID), name, social_handle (optional), commission_rate (optional)
```

### 5. Coupons
```
code, brand_id (UUID), influencer_id (UUID), discount_pct (optional), is_active (true/false)
```

### 6. Conversions
```
order_id, brand_id (UUID), coupon_id (optional UUID), order_amount, commission_amount, status (optional), order_is_real (true/false), sale_date (optional)
```

## Status Values (Conversions)
- `paid` - Order has been paid
- `confirmed` - Order confirmed
- `completed` - Order completed
- `pending` - Pending payment
- `cancelled` - Cancelled order

## File Structure
```
import_scripts/
├── README.md                    (Full documentation)
├── QUICK_REFERENCE.md          (This file)
├── 1_profiles.js               (Profile import script)
├── 2_brands.js                 (Brand import script)
├── 3_brand_secrets.js          (Brand secrets import script)
├── 4_influencers.js            (Influencer import script)
├── 5_coupons.js                (Coupon import script)
├── 6_conversions.js            (Conversion import script)
├── sample_profiles.csv         (Example data)
├── sample_brands.csv           (Example data)
├── sample_brand_secrets.csv    (Example data)
├── sample_influencers.csv      (Example data)
├── sample_coupons.csv          (Example data)
└── sample_conversions.csv      (Example data)
```

## Example: Import with Sample Data

```bash
cd import_scripts

# Step 1: Create users in Supabase Auth first!
# Go to Supabase Dashboard → Authentication → Users → Add user
# Copy the generated User ID (UUID)

# Step 2: Update sample_profiles.csv with the UUIDs

# Step 3: Run imports in order
node 1_profiles.js sample_profiles.csv
# Execute profiles_import.sql in Supabase

node 2_brands.js sample_brands.csv
# Execute brands_import.sql in Supabase

node 3_brand_secrets.js sample_brand_secrets.csv
# Execute brand_secrets_import.sql in Supabase

node 4_influencers.js sample_influencers.csv
# Execute influencers_import.sql in Supabase

node 5_coupons.js sample_coupons.csv
# Execute coupons_import.sql in Supabase

node 6_conversions.js sample_conversions.csv
# Execute conversions_import.sql in Supabase
```

## How Each Script Works

1. **Reads CSV file** with your data
2. **Validates columns** match expected format
3. **Generates SQL INSERT statements** with proper escaping
4. **Writes to `.sql` file** (e.g., `profiles_import.sql`)
5. **Shows file location** and next steps

## Output Files

Each script generates a `.sql` file ready to execute:
- `profiles_import.sql`
- `brands_import.sql`
- `brand_secrets_import.sql`
- `influencers_import.sql`
- `coupons_import.sql`
- `conversions_import.sql`

## Key Points

✅ **Run steps in order** - Database dependencies matter
✅ **Create Auth users first** - All profiles need a Supabase Auth user
✅ **Use UUIDs correctly** - Copy exact IDs from previous steps
✅ **Review generated SQL** - Check for any issues before executing
✅ **Test with sample data** - Use provided examples to test first
✅ **One CSV per entity** - Don't mix data in one file

## Common Issues

| Issue | Solution |
|-------|----------|
| "File not found" | Check CSV filename and path |
| "Foreign key violation" | Run steps in order, ensure parent records exist |
| "Duplicate key" | Use ON CONFLICT in SQL to handle duplicates |
| "Invalid UUID" | Copy exact UUID from previous step |
| "Column mismatch" | Ensure CSV columns match expected format |

## Support Files

- `README.md` - Complete documentation
- `sample_*.csv` - Example CSV files
- `*_import.sql` - Generated SQL files (created after running scripts)

## Next Steps After Import

1. Login to app with brand_admin user
2. Check Dashboard → Visão Geral (Overview)
3. Verify metrics show correctly
4. Check Dashboard → Vendas (Sales) tab
5. Confirm all conversions display properly
