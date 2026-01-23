-- ============================================
-- Add sale_date_br_tmz column to conversions table
-- This column stores sale dates in GMT-03 (Brazil/São Paulo timezone)
-- ============================================

-- Step 1: Add the new column
ALTER TABLE public.conversions
ADD COLUMN IF NOT EXISTS sale_date_br_tmz timestamp with time zone;

-- Step 2: Populate the column with existing data converted to GMT-03
-- This converts UTC timestamps to America/Sao_Paulo timezone
UPDATE public.conversions
SET sale_date_br_tmz = sale_date AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo'
WHERE sale_date_br_tmz IS NULL;

-- Step 3: Create an index for performance
CREATE INDEX IF NOT EXISTS idx_conversions_sale_date_br_tmz 
ON public.conversions(sale_date_br_tmz);

-- Step 4: Add a trigger to automatically populate sale_date_br_tmz when new records are inserted/updated
CREATE OR REPLACE FUNCTION set_sale_date_br_tmz()
RETURNS TRIGGER AS $$
BEGIN
  -- Automatically set sale_date_br_tmz from sale_date
  NEW.sale_date_br_tmz := NEW.sale_date AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS trg_set_sale_date_br_tmz ON public.conversions;
CREATE TRIGGER trg_set_sale_date_br_tmz
  BEFORE INSERT OR UPDATE OF sale_date ON public.conversions
  FOR EACH ROW
  EXECUTE FUNCTION set_sale_date_br_tmz();

-- ============================================
-- Verification queries
-- ============================================

-- Verify the column was added and populated
SELECT 
  COUNT(*) as total_records,
  COUNT(sale_date_br_tmz) as records_with_br_tmz,
  MIN(sale_date_br_tmz::date) as earliest_date_br,
  MAX(sale_date_br_tmz::date) as latest_date_br
FROM public.conversions;

-- Compare a few records to verify timezone conversion
SELECT 
  order_id,
  sale_date as utc_timestamp,
  sale_date_br_tmz as brazil_timestamp,
  (sale_date_br_tmz AT TIME ZONE 'America/Sao_Paulo')::date as brazil_date,
  status,
  order_amount
FROM public.conversions
ORDER BY sale_date DESC
LIMIT 10;

-- Test query matching the application logic
SELECT 
  (sale_date_br_tmz AT TIME ZONE 'America/Sao_Paulo')::date as sale_date,
  SUM(order_amount) as valor,
  COUNT(DISTINCT order_id) as quant_pedidos
FROM public.conversions
WHERE 
  status IN ('paid', 'authorized')
  AND brand_id = (SELECT id FROM public.brands LIMIT 1) -- Replace with actual brand_id
  AND order_is_real = true
GROUP BY 1
ORDER BY 1 DESC
LIMIT 30;
