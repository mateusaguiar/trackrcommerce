# Data Import System - Index

## 🎯 Start Here

This directory contains a complete **6-step CSV-to-SQL import system** for loading historical data into TrackrCommerce.

## 📚 Documentation

### Start with these files:
1. **[README.md](README.md)** - Complete step-by-step guide
2. **[QUICK_REFERENCE.md](QUICK_REFERENCE.md)** - Fast CSV format lookup
3. **[../DATA_IMPORT_SUMMARY.md](../DATA_IMPORT_SUMMARY.md)** - System overview

## 📁 Import Scripts (6 files)

Run these in order:

| # | Script | Purpose | Input | Output |
|---|--------|---------|-------|--------|
| 1 | `1_profiles.js` | Import user profiles | `profiles.csv` | `profiles_import.sql` |
| 2 | `2_brands.js` | Import brands/stores | `brands.csv` | `brands_import.sql` |
| 3 | `3_brand_secrets.js` | Import API tokens | `brand_secrets.csv` | `brand_secrets_import.sql` |
| 4 | `4_influencers.js` | Import influencers | `influencers.csv` | `influencers_import.sql` |
| 5 | `5_coupons.js` | Import coupon codes | `coupons.csv` | `coupons_import.sql` |
| 6 | `6_conversions.js` | Import sales history | `conversions.csv` | `conversions_import.sql` |

## 📊 Sample Data (6 files)

Test files showing correct CSV format:

| File | Purpose |
|------|---------|
| `sample_profiles.csv` | Example user profiles |
| `sample_brands.csv` | Example stores |
| `sample_brand_secrets.csv` | Example API tokens |
| `sample_influencers.csv` | Example influencers |
| `sample_coupons.csv` | Example coupons |
| `sample_conversions.csv` | Example sales data |

## ⚡ Quick Start

```bash
# Step 1: Create users manually in Supabase Auth first
# Go to: Supabase Dashboard → Authentication → Users → Add user

# Step 2: Run imports in order
node 1_profiles.js your_profiles.csv
# Execute: profiles_import.sql in Supabase

node 2_brands.js your_brands.csv
# Execute: brands_import.sql in Supabase

# ... continue for steps 3-6
```

## 🔄 Dependency Order

```
Supabase Auth (Step 0 - manual)
    ↓
1_profiles.js
    ↓
2_brands.js
    ├→ 3_brand_secrets.js
    ├→ 4_influencers.js
    │   ↓
    │ 5_coupons.js
    │   ↓
    │ 6_conversions.js
```

## 📋 CSV Column Reference

### Profiles
```
id, email, full_name, role
```

### Brands
```
name, nuvemshop_store_id, owner_id, is_real
```

### Brand Secrets
```
brand_id, access_token
```

### Influencers
```
brand_id, profile_id, name, social_handle, commission_rate
```

### Coupons
```
code, brand_id, influencer_id, discount_pct, is_active
```

### Conversions
```
order_id, brand_id, coupon_id, order_amount, commission_amount, status, order_is_real, sale_date
```

## ✅ All Scripts Tested

```
Testing script 1... ✓ Generated SQL: profiles_import.sql
Testing script 2... ✓ Generated SQL: brands_import.sql
Testing script 3... ✓ Generated SQL: brand_secrets_import.sql
Testing script 4... ✓ Generated SQL: influencers_import.sql
Testing script 5... ✓ Generated SQL: coupons_import.sql
Testing script 6... ✓ Generated SQL: conversions_import.sql
```

## 🎯 Next Steps

1. **Read [README.md](README.md)** for complete instructions
2. **Check [QUICK_REFERENCE.md](QUICK_REFERENCE.md)** for CSV format details
3. **Review sample CSV files** for example data
4. **Prepare your CSV files** matching the format
5. **Run scripts in order** to generate SQL
6. **Execute generated SQL** in Supabase
7. **Verify in dashboard** that data imported correctly

## ✨ Key Features

✅ **No code changes** - Works with existing schema
✅ **Automatic escaping** - Handles special characters
✅ **Foreign keys** - Maintains relationships
✅ **Duplicate handling** - ON CONFLICT prevention
✅ **Sample data** - Provided for testing
✅ **Full documentation** - Step-by-step guides

## 📞 Support

For questions:
- 📖 Read [README.md](README.md) - Full step-by-step guide
- ⚡ Check [QUICK_REFERENCE.md](QUICK_REFERENCE.md) - Fast lookup
- 💾 Review sample CSV files - See correct format
- 🔍 Inspect generated `.sql` - Verify SQL before executing

## 🚀 Ready to Go!

All scripts tested and working. Start with [README.md](README.md) for complete guide.
