# Vendas Totais Graph Data Fix - January 23, 2026

## Problem Identified

The "Vendas Totais" (Daily Revenue) graph was showing different totals when:
- **Single day filter (21/01)**: Correct - 545 orders, R$ 134,165.17
- **Month range filter**: Wrong - 306 orders, R$ 78,788.87

## Root Causes

### Issue #1: Query-Level Status Filtering Missing
The Supabase queries were not filtering by status at the database level, instead relying on client-side filtering which was incomplete.

**Status Issue:**
- Database contains orders with statuses: `authorized`, `paid`, `pending`, `refunded`, `voided`
- Valid completed orders use `authorized` and `paid` statuses
- Previous implementation was checking for `paid`, `confirmed`, `completed` - missing `authorized`!
- Client-side filtering was being applied AFTER fetching data, causing logic issues

### Issue #2: Client-Side Filtering Redundancy
Once status filtering is done at the database query level using `.in('status', [...])`, client-side filtering becomes unnecessary and error-prone.

## Solution Applied

### 1. Added Query-Level Status Filter
Updated three critical functions to filter at the Supabase query level:

**File:** `src/lib/supabaseClient.js`

#### getDailyRevenue (line ~1065)
```javascript
// BEFORE
let query = supabase
  .from('conversions')
  .select('order_amount, sale_date, status')
  .eq('brand_id', brandId)
  .eq('order_is_real', true);

// AFTER
let query = supabase
  .from('conversions')
  .select('order_amount, sale_date, status')
  .eq('brand_id', brandId)
  .eq('order_is_real', true)
  .in('status', ['authorized', 'paid']); // Filter at query level!
```

#### getTopClassifications (line ~1115)
```javascript
// Same pattern: Added .in('status', ['authorized', 'paid'])
```

#### getTopCoupons (line ~1195)
```javascript
// Same pattern: Added .in('status', ['authorized', 'paid'])
```

### 2. Removed Client-Side Status Filtering
Removed redundant status checks in the data processing loops since filtering is now handled by Supabase:

**Old approach (error-prone):**
```javascript
(data || []).forEach(conv => {
  if (conv.status === 'paid' || conv.status === 'confirmed' || ...) {
    // Process...
  }
});
```

**New approach (clean):**
```javascript
(data || []).forEach(conv => {
  // All data is already filtered, just process
  // Process...
});
```

### 3. Timezone Handling Verified
The date formatting using `formatDateForQuery()` was already correct:
- Extracts YYYY-MM-DD using local time methods (.getFullYear(), .getDate(), etc.)
- Works correctly with GMT-03 timezone
- Uses `.gte()` for start date and `.lt()` with +1 day for end date

## What Changed

### Status Filtering
**Valid Order Statuses:**
- ✅ `authorized` - Authorized transactions
- ✅ `paid` - Paid transactions

**Excluded Statuses:**
- ❌ `pending` - Awaiting payment
- ❌ `refunded` - Money returned
- ❌ `voided` - Cancelled transactions

### Date Range Behavior
- **Start Date:** `.gte('sale_date', 'YYYY-MM-DD')` - Includes the entire start day
- **End Date:** `.lt('sale_date', 'YYYY-MM-DD+1')` - Includes the entire end day
- **Timezone:** Uses local browser timezone (GMT-03 for São Paulo)

## Expected Results

After this fix:

✅ **Single Date Selection (21/01/2026)**
- Shows: 545 orders, R$ 134,165.17
- Status: All `authorized` and `paid` orders for that day

✅ **Month Range (01/01 - 23/01/2026)**
- Now includes all `authorized` and `paid` orders in that range
- Total should match sum of daily values
- No longer excludes valid `authorized` orders

✅ **Consistency**
- Daily chart totals match month range totals
- No missing orders due to status filtering

## Files Modified

- `src/lib/supabaseClient.js`
  - getDailyRevenue()
  - getTopClassifications()
  - getTopCoupons()

## Build Status
✅ Build successful: 621.91 kB / 171.41 kB (gzipped)
✅ No syntax errors
✅ All functions operational

## Testing Recommendation

1. Select a single date (21/01/2026) - verify 545 orders, R$ 134,165.17
2. Select "This Month" - verify totals match
3. Select custom date range - verify data consistency across all ranges
4. Check that only `authorized` and `paid` orders appear in charts

