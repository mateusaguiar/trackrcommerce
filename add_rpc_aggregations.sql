-- SQL RPC functions for aggregations to avoid client-side row limits
-- 1) get_daily_revenue(brand_id uuid, start_date date, end_date date)
CREATE OR REPLACE FUNCTION public.get_daily_revenue(
  p_brand_id uuid,
  p_start_date date,
  p_end_date date
) RETURNS TABLE(sale_date date, valor numeric, quant_pedidos bigint) AS $$
  SELECT
    (sale_date_br_tmz::date) AS sale_date,
    SUM(order_amount)::numeric AS valor,
    COUNT(DISTINCT order_id) AS quant_pedidos
  FROM public.conversions
  WHERE order_is_real = true
    AND status IN ('paid','authorized')
    AND brand_id = p_brand_id
    AND (sale_date_br_tmz::date) >= p_start_date
    AND (sale_date_br_tmz::date) < p_end_date
  GROUP BY 1
  ORDER BY 1;
$$ LANGUAGE sql STABLE;

-- 2) get_pending_orders(brand_id uuid, start_date date, end_date date)
CREATE OR REPLACE FUNCTION public.get_pending_orders(
  p_brand_id uuid,
  p_start_date date,
  p_end_date date
) RETURNS TABLE(sale_date date, valor numeric, quant_pedidos bigint) AS $$
  SELECT
    (sale_date_br_tmz::date) AS sale_date,
    SUM(order_amount)::numeric AS valor,
    COUNT(DISTINCT order_id) AS quant_pedidos
  FROM public.conversions
  WHERE order_is_real = true
    AND status = 'pending'
    AND brand_id = p_brand_id
    AND (sale_date_br_tmz::date) >= p_start_date
    AND (sale_date_br_tmz::date) < p_end_date
  GROUP BY 1
  ORDER BY 1;
$$ LANGUAGE sql STABLE;

-- Notes: execute this in Supabase SQL editor. These RPCs return full aggregated results directly from Postgres
