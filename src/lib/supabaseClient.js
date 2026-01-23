import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Helper function to format dates for queries without timezone conversion
const formatDateForQuery = (date, isEndDate = false) => {
  if (!date) return null;
  const d = new Date(date);
  if (isEndDate) {
    d.setDate(d.getDate() + 1);
  }
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// ============================================
// AUTHENTICATION FUNCTIONS
// ============================================

export const authFunctions = {
  // Sign up new user
  signUp: async (email, password, fullName, userRole = 'user') => {
    if (!supabase) throw new Error('Supabase not configured');
    
    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Failed to create user');

      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          email,
          full_name: fullName,
          role: userRole,
        });

      if (profileError) throw profileError;

      return { user: authData.user, error: null };
    } catch (error) {
      return { user: null, error: error.message };
    }
  },

  // Log in user
  logIn: async (email, password) => {
    if (!supabase) throw new Error('Supabase not configured');
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      if (!data.user) throw new Error('Login failed');

      return { user: data.user, session: data.session, error: null };
    } catch (error) {
      return { user: null, session: null, error: error.message };
    }
  },

  // Log out user
  logOut: async () => {
    if (!supabase) throw new Error('Supabase not configured');
    
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error: error.message };
    }
  },

  // Get current session
  getSession: async () => {
    if (!supabase) throw new Error('Supabase not configured');
    
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      return { session, error: null };
    } catch (error) {
      return { session: null, error: error.message };
    }
  },

  // Get current user profile
  getCurrentProfile: async () => {
    if (!supabase) throw new Error('Supabase not configured');
    
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!user) return { profile: null, error: null };

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle(); // Use maybeSingle instead of single to handle no results

      if (error && error.code !== 'PGRST116') throw error; // Ignore "no rows" error

      // If no profile exists, create one
      if (!profile) {
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || 'User',
            role: 'user',
          })
          .select()
          .single();

        if (createError) throw createError;
        return { profile: newProfile, error: null };
      }

      return { profile, error: null };
    } catch (error) {
      return { profile: null, error: error.message };
    }
  },

  // On auth state change listener
  onAuthStateChange: (callback) => {
    if (!supabase) return null;
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => callback(event, session)
    );

    return subscription;
  },
};

// ============================================
// DATA FETCHING FUNCTIONS
// ============================================

export const dataFunctions = {
  // Get user's brands (excludes test/demo brands by default)
  getBrands: async (userId, includeTestBrands = false) => {
    if (!supabase) throw new Error('Supabase not configured');
    
    try {
      let query = supabase
        .from('brands')
        .select('*')
        .eq('owner_id', userId);

      // Filter out test brands by default
      if (!includeTestBrands) {
        query = query.eq('is_real', true);
      }

      const { data, error } = await query;

      if (error) throw error;
      return { brands: data || [], error: null };
    } catch (error) {
      return { brands: [], error: error.message };
    }
  },

  // Get coupons for a brand with influencer details
  // brand_admin can only view coupons from their brand (filtered by brand_id)
  getBrandCoupons: async (brandId, filters = {}) => {
    if (!supabase) throw new Error('Supabase not configured');
    
    try {
      let query = supabase
        .from('coupons')
        .select(`
          id,
          code,
          discount_value,
          discount_type,
          is_active,
          created_at,
          influencer_id,
          brand_id,
          influencers(id, name, social_handle, commission_rate)
        `)
        .eq('brand_id', brandId);

      // Apply date range filter if provided
      if (filters.startDate) {
        query = query.gte('created_at', filters.startDate.toISOString());
      }
      if (filters.endDate) {
        query = query.lte('created_at', filters.endDate.toISOString());
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      // Transform data to flatten influencer name for easier access
      const transformedData = (data || []).map(coupon => ({
        ...coupon,
        influencer_name: coupon.influencers?.name || 'Sem influenciador',
      }));

      return { coupons: transformedData, error: null };
    } catch (error) {
      return { coupons: [], error: error.message };
    }
  },

  // Get conversions (sales) for a brand with coupon details
  // By default, filters out test orders (order_is_real = true)
  getBrandConversions: async (brandId, filters = {}) => {
    if (!supabase) throw new Error('Supabase not configured');
    
    try {
      const { 
        page = 1, 
        limit = 20, 
        sortBy = 'sale_date_br_tmz', 
        sortDirection = 'desc',
        orderId,
        couponCode,
        status,
        startDate,
        endDate,
        includeTestOrders = false
      } = filters;

      let query = supabase
        .from('conversions')
        .select(`
          id,
          order_id,
          order_number,
          order_amount,
          commission_amount,
          status,
          sale_date_br_tmz,
          order_is_real,
          customer_id,
          customer_email,
          metadata,
          coupon_id,
          coupons(id, code)
        `, { count: 'exact' })
        .eq('brand_id', brandId);

      // Filter out test orders by default
      if (!includeTestOrders) {
        try {
          const startDateStr = filters.startDate ? formatDateForQuery(filters.startDate, false) : '1970-01-01';
          const endDateStr = filters.endDate ? formatDateForQuery(filters.endDate, true) : formatDateForQuery(new Date(), true);

          const { data, error } = await supabase.rpc('get_pending_orders', {
            p_brand_id: brandId,
            p_start_date: startDateStr,
            p_end_date: endDateStr,
          });
          if (error) throw error;

          // Rows: { sale_date, valor, quant_pedidos }
          let totalValue = 0;
          let totalOrders = 0;

          const chart = (data || []).map(r => {
            const [y, m, d] = (r.sale_date || '').toString().split('-');
            const displayDate = `${d}/${m}/${y}`;
            const value = parseFloat((r.valor || 0).toString());
            const orders = parseInt(r.quant_pedidos || 0, 10);
            totalValue += value;
            totalOrders += orders;
            return { date: displayDate, value, orders };
          }).sort((a, b) => {
            const toKey = s => s.date.split('/').reverse().join('');
            return toKey(a) < toKey(b) ? -1 : toKey(a) > toKey(b) ? 1 : 0;
          });

          return { data: { totalValue: parseFloat(totalValue.toFixed(2)), totalOrders, chart }, error: null };
        } catch (err) {
          console.error('Error in getPendingOrders (RPC):', err);
          return { data: { totalValue: 0, totalOrders: 0, chart: [] }, error: err.message || String(err) };
        }
      const { 
        orderId,
        couponCode,
        status,
        startDate,
        endDate,
        includeTestOrders = false
      } = filters;

      let query = supabase
        .from('conversions')
        .select(`
          order_amount,
          commission_amount,
          order_id,
          order_number,
          status,
          coupon_id,
          coupons(code)
        `)
        .eq('brand_id', brandId);

      // Filter out test orders by default
      if (!includeTestOrders) {
        query = query.eq('order_is_real', true);
      }

      // Apply filters
      if (status) {
        query = query.eq('status', status);
      }

      if (startDate) {
        query = query.gte('sale_date_br_tmz', startDate.toISOString());
      }
      if (endDate) {
        query = query.lte('sale_date_br_tmz', endDate.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;

      // Apply client-side filters and calculate totals
      let filteredData = (data || []).map(c => ({
        ...c,
        coupon_code: c.coupons?.code || 'N/A'
      }));

      if (orderId) {
        filteredData = filteredData.filter(c => 
          (c.order_number || c.order_id) === orderId
        );
      }
      if (couponCode) {
        filteredData = filteredData.filter(c => c.coupon_code === couponCode);
      }

      const totalRevenue = filteredData.reduce((sum, c) => sum + parseFloat(c.order_amount || 0), 0);
      const totalCommission = filteredData.reduce((sum, c) => sum + parseFloat(c.commission_amount || 0), 0);

      return { 
        totalRevenue,
        totalCommission,
        error: null 
      };
    } catch (error) {
      return { totalRevenue: 0, totalCommission: 0, error: error.message };
    }
  },

  // Get influencer conversions
  getInfluencerConversions: async (influencerId, brandId = null) => {
    if (!supabase) throw new Error('Supabase not configured');
    
    try {
      let query = supabase
        .from('conversions')
        .select(`
          id,
          order_id,
          order_amount,
          commission_amount,
          status,
          sale_date_br_tmz,
          coupon_id,
          brand_id,
          coupons(id, code, influencer_id),
          brands(id, name)
        `)
        .eq('coupons.influencer_id', influencerId);

      if (brandId) {
        query = query.eq('brand_id', brandId);
      }

      const { data, error } = await query.order('sale_date_br_tmz', { ascending: false });

      if (error) throw error;

      // Transform data to flatten coupon and brand info
      const transformedData = (data || []).map(conversion => ({
        ...conversion,
        coupon_code: conversion.coupons?.code || 'N/A',
        brand_name: conversion.brands?.name || 'N/A',
      }));

      return { conversions: transformedData, error: null };
    } catch (error) {
      return { conversions: [], error: error.message };
    }
  },

  // Get brand influencers
  getBrandInfluencers: async (brandId) => {
    if (!supabase) throw new Error('Supabase not configured');
    
    try {
      const { data, error } = await supabase
        .from('influencers')
        .select('*')
        .eq('brand_id', brandId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { influencers: data || [], error: null };
    } catch (error) {
      return { influencers: [], error: error.message };
    }
  },

  // Create coupon (only for brand_admin or master)
  createCoupon: async (brandId, influencerId, code, discountValue, discountType = 'percentage') => {
    if (!supabase) throw new Error('Supabase not configured');
    
    try {
      const { data, error } = await supabase
        .from('coupons')
        .insert({
          brand_id: brandId,
          influencer_id: influencerId,
          code,
          discount_value: discountValue,
          discount_type: discountType,
          is_active: true,
        })
        .select();

      if (error) throw error;
      return { coupon: data?.[0], error: null };
    } catch (error) {
      return { coupon: null, error: error.message };
    }
  },

  // Log conversion/sale (from Nuvemshop webhook or manual)
  logConversion: async (
    brandId,
    couponId,
    orderId,
    orderAmount,
    commissionAmount,
    options = {}
  ) => {
    if (!supabase) throw new Error('Supabase not configured');
    
    try {
      const {
        metadata = {},
        status = 'completed',
        orderIsReal = true,
        orderNumber = null,
        customerId = null,
        customerEmail = null,
      } = options;

      const { data, error } = await supabase
        .from('conversions')
        .insert({
          brand_id: brandId,
          coupon_id: couponId,
          order_id: orderId,
          order_number: orderNumber,
          order_amount: orderAmount,
          commission_amount: commissionAmount,
          customer_id: customerId,
          customer_email: customerEmail,
          metadata,
          status,
          order_is_real: orderIsReal,
        })
        .select();

      if (error) throw error;
      return { conversion: data?.[0], error: null };
    } catch (error) {
      return { conversion: null, error: error.message };
    }
  },

  // Get brand metrics (computed from actual tables)
  getBrandMetrics: async (brandId, filters = {}) => {
    if (!supabase) throw new Error('Supabase not configured');
    
    try {
      // Get all real conversions for this brand (excludes test orders)
      let convQuery = supabase
        .from('conversions')
        .select('order_amount, commission_amount, status, order_is_real')
        .eq('brand_id', brandId)
        .eq('order_is_real', true);

      // Apply date range filter if provided
      if (filters.startDate) {
        convQuery = convQuery.gte('sale_date_br_tmz', filters.startDate.toISOString());
      }
      if (filters.endDate) {
        convQuery = convQuery.lte('sale_date_br_tmz', filters.endDate.toISOString());
      }

      const { data: conversions, error: convError } = await convQuery;

      if (convError) throw convError;

      // Get all coupons for this brand
      let couponQuery = supabase
        .from('coupons')
        .select('id, is_active')
        .eq('brand_id', brandId);

      // Apply date range filter if provided
      if (filters.startDate) {
        couponQuery = couponQuery.gte('created_at', filters.startDate.toISOString());
      }
      if (filters.endDate) {
        couponQuery = couponQuery.lte('created_at', filters.endDate.toISOString());
      }

      const { data: coupons, error: couponError } = await couponQuery;

      if (couponError) throw couponError;

      // Get all influencers for this brand
      const { data: influencers, error: influencerError } = await supabase
        .from('influencers')
        .select('id')
        .eq('brand_id', brandId);

      if (influencerError) throw influencerError;

      // Calculate metrics from actual data
      // Include all successful statuses: 'paid', 'confirmed', 'completed', 'authorized'
      const confirmedConversions = (conversions || []).filter(
        conv => conv.status === 'paid' || conv.status === 'confirmed' || conv.status === 'completed' || conv.status === 'authorized'
      );

      const total_revenue = confirmedConversions.reduce(
        (sum, conv) => sum + parseFloat(conv.order_amount || 0),
        0
      );

      const total_commissions = confirmedConversions.reduce(
        (sum, conv) => sum + parseFloat(conv.commission_amount || 0),
        0
      );

      const active_coupons = (coupons || []).filter(c => c.is_active === true).length;
      const total_coupons = coupons?.length || 0;
      const total_influencers = influencers?.length || 0;
      const total_orders = confirmedConversions.length;

      const metrics = {
        id: brandId,
        total_revenue,
        total_commissions,
        active_coupons,
        total_coupons,
        total_influencers,
        total_orders,
        commission_rate: total_revenue > 0 ? total_commissions / total_revenue : 0,
        influencers_with_sales: new Set(
          confirmedConversions.map(c => c.coupon_id).filter(Boolean)
        ).size,
      };

      return { metrics, error: null };
    } catch (error) {
      return { metrics: null, error: error.message };
    }
  },

  // Get conversion with UTM data
  getConversionUTM: async (orderId) => {
    if (!supabase) throw new Error('Supabase not configured');
    
    try {
      // Get conversion by order_id
      const { data: conversion, error: convError } = await supabase
        .from('conversions')
        .select(`
          id,
          order_id,
          order_number,
          order_amount,
          commission_amount,
          status,
          sale_date_br_tmz,
          order_is_real,
          customer_id,
          customer_email,
          brand_id,
          coupon_id,
          metadata
        `)
        .eq('order_id', orderId)
        .maybeSingle();

      if (convError) throw convError;
      if (!conversion) return { conversion: null, utm: null, error: null };

      // Get UTM data linked by order_id
      const { data: utm, error: utmError } = await supabase
        .from('utm_data')
        .select('*')
        .eq('order_id', orderId)
        .maybeSingle();

      if (utmError) throw utmError;

      return { conversion, utm: utm || null, error: null };
    } catch (error) {
      return { conversion: null, utm: null, error: error.message };
    }
  },

  // Get coupons with detailed metrics (usage count, total sales, last usage)
  getCouponsWithMetrics: async (brandId, filters = {}) => {
    if (!supabase) throw new Error('Supabase not configured');
    
    try {
      const { 
        page = 1, 
        limit = 20, 
        sortBy = 'created_at', 
        sortDirection = 'desc',
        couponCode,
        influencerName,
        startDate,
        endDate
      } = filters;

      // Get ALL coupons with influencer details (no date filter on coupons)
      let couponQuery = supabase
        .from('coupons')
        .select(`
          id,
          code,
          discount_value,
          discount_type,
          is_active,
          created_at,
          influencer_id,
          brand_id,
          classification,
          classification_updated_at,
          influencers(id, name, social_handle, commission_rate)
        `)
        .eq('brand_id', brandId);

      // Apply coupon code filter server-side
      if (couponCode) {
        couponQuery = couponQuery.eq('code', couponCode);
      }

      const { data: allCoupons, error: couponError } = await couponQuery;

      if (couponError) throw couponError;

      // Filter by influencer name before calculating metrics
      let filteredCoupons = (allCoupons || []).map(c => ({
        ...c,
        influencer_name: c.influencers?.name || 'Sem influenciador'
      }));

      if (influencerName) {
        filteredCoupons = filteredCoupons.filter(c => c.influencer_name === influencerName);
      }

      // Get metrics for filtered coupons
      const couponsWithMetrics = await Promise.all(
        filteredCoupons.map(async (coupon) => {
          // Get conversions for this coupon in the date range
          let convQuery = supabase
            .from('conversions')
            .select('order_amount, status, sale_date_br_tmz, order_is_real')
            .eq('coupon_id', coupon.id)
            .eq('order_is_real', true);

          // Apply date filters for conversions
          if (startDate) {
            convQuery = convQuery.gte('sale_date_br_tmz', startDate.toISOString());
          }
          if (endDate) {
            convQuery = convQuery.lte('sale_date_br_tmz', endDate.toISOString());
          }

          const { data: conversions, error: convError } = await convQuery;

          if (convError) throw convError;

          // Calculate metrics
          const realConversions = (conversions || []).filter(
            c => c.status === 'paid' || c.status === 'confirmed' || c.status === 'completed'
          );

          const usage_count = realConversions.length;
          const total_sales = realConversions.reduce(
            (sum, conv) => sum + parseFloat(conv.order_amount || 0),
            0
          );
          const last_usage = realConversions.length > 0
            ? new Date(Math.max(...realConversions.map(c => new Date(c.sale_date_br_tmz).getTime())))
            : null;

          return {
            ...coupon,
            influencer_name: coupon.influencer_name,
            usage_count,
            total_sales,
            last_usage,
          };
        })
      );

      // Apply sorting
      const ascending = sortDirection === 'asc';
      couponsWithMetrics.sort((a, b) => {
        let aVal = a[sortBy];
        let bVal = b[sortBy];
        
        if (aVal === null || aVal === undefined) return 1;
        if (bVal === null || bVal === undefined) return -1;
        
        if (typeof aVal === 'string') {
          return ascending ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
        }
        
        return ascending ? aVal - bVal : bVal - aVal;
      });

      // Apply pagination
      const totalCount = couponsWithMetrics.length;
      const from = (page - 1) * limit;
      const to = from + limit;
      const paginatedCoupons = couponsWithMetrics.slice(from, to);

      return { 
        coupons: paginatedCoupons, 
        totalCount,
        error: null 
      };
    } catch (error) {
      return { coupons: [], totalCount: 0, error: error.message };
    }
  },

  // Get coupon totals for subtotals row
  getCouponTotals: async (brandId, filters = {}) => {
    if (!supabase) throw new Error('Supabase not configured');
    
    try {
      const { 
        couponCode,
        influencerName,
        startDate,
        endDate
      } = filters;

      // Get all coupons with influencer details (no date filter on coupons)
      let couponQuery = supabase
        .from('coupons')
        .select(`
          id,
          code,
          influencers(name)
        `)
        .eq('brand_id', brandId);

      // Apply coupon code filter server-side
      if (couponCode) {
        couponQuery = couponQuery.eq('code', couponCode);
      }

      const { data: coupons, error: couponError } = await couponQuery;

      if (couponError) throw couponError;

      // Apply influencer name filter
      let filteredCoupons = (coupons || []).map(c => ({
        ...c,
        influencer_name: c.influencers?.name || 'Sem influenciador'
      }));

      if (influencerName) {
        filteredCoupons = filteredCoupons.filter(c => c.influencer_name === influencerName);
      }

      const couponIds = filteredCoupons.map(c => c.id);

      if (couponIds.length === 0) {
        return { totalUsage: 0, totalSales: 0, error: null };
      }

      // Get conversions for these coupons
      let convQuery = supabase
        .from('conversions')
        .select('order_amount, status, coupon_id')
        .in('coupon_id', couponIds)
        .eq('order_is_real', true);

      // Apply date filters for conversions
      if (startDate) {
        convQuery = convQuery.gte('sale_date_br_tmz', startDate.toISOString());
      }
      if (endDate) {
        convQuery = convQuery.lte('sale_date_br_tmz', endDate.toISOString());
      }

      const { data: conversions, error: convError } = await convQuery;

      if (convError) throw convError;

      // Calculate totals
      const realConversions = (conversions || []).filter(
        c => c.status === 'paid' || c.status === 'confirmed' || c.status === 'completed'
      );

      const totalUsage = realConversions.length;
      const totalSales = realConversions.reduce(
        (sum, conv) => sum + parseFloat(conv.order_amount || 0),
        0
      );

      return { 
        totalUsage,
        totalSales,
        error: null 
      };
    } catch (error) {
      return { totalUsage: 0, totalSales: 0, error: error.message };
    }
  },

  // Get influencer performance
  getInfluencerPerformance: async (influencerId) => {
    if (!supabase) throw new Error('Supabase not configured');
    
    try {
      const { data, error } = await supabase
        .from('v_influencer_performance')
        .select('*')
        .eq('id', influencerId)
        .single();

      if (error) throw error;
      return { performance: data, error: null };
    } catch (error) {
      return { performance: null, error: error.message };
    }
  },

  // Get coupon performance
  getCouponPerformance: async (couponId) => {
    if (!supabase) throw new Error('Supabase not configured');
    
    try {
      const { data, error } = await supabase
        .from('v_coupon_performance')
        .select('*')
        .eq('id', couponId)
        .single();

      if (error) throw error;
      return { performance: data, error: null };
    } catch (error) {
      return { performance: null, error: error.message };
    }
  },

  // Store Nuvemshop access token
  storeBrandSecret: async (brandId, accessToken) => {
    if (!supabase) throw new Error('Supabase not configured');
    
    try {
      const { data, error } = await supabase
        .from('brand_secrets')
        .upsert({
          brand_id: brandId,
          access_token: accessToken,
        })
        .select();

      if (error) throw error;
      return { secret: data?.[0], error: null };
    } catch (error) {
      return { secret: null, error: error.message };
    }
  },

  // Get distinct filter values for coupons
  getCouponFilterValues: async (brandId, filters = {}) => {
    if (!supabase) throw new Error('Supabase not configured');
    
    try {
      const { startDate, endDate } = filters;
      
      // Fetch all coupons for the brand
      let couponQuery = supabase
        .from('coupons')
        .select('id, code, influencer_id, influencers(name)')
        .eq('brand_id', brandId);
      
      const { data: coupons, error: couponError } = await couponQuery;
      if (couponError) throw couponError;
      
      if (!coupons || coupons.length === 0) {
        return { couponCodes: [], influencerNames: [], error: null };
      }
      
      const couponIds = coupons.map(c => c.id);
      
      // Fetch conversions for these coupons to filter by date range
      let convQuery = supabase
        .from('conversions')
        .select('coupon_id')
        .in('coupon_id', couponIds)
        .eq('order_is_real', true);
      
      if (startDate) {
        convQuery = convQuery.gte('sale_date_br_tmz', startDate.toISOString());
      }
      if (endDate) {
        convQuery = convQuery.lte('sale_date_br_tmz', endDate.toISOString());
      }
      
      const { data: conversions, error: convError } = await convQuery;
      if (convError) throw convError;
      
      // Get coupon IDs that have conversions in the date range
      const couponsWithConversions = new Set((conversions || []).map(c => c.coupon_id));
      
      // Filter coupons and get distinct values
      const filteredCoupons = coupons.filter(c => couponsWithConversions.has(c.id));
      
      const couponCodes = [...new Set(
        filteredCoupons.map(c => c.code).filter(Boolean)
      )].sort();
      
      const influencerNames = [...new Set(
        filteredCoupons
          .filter(c => c.influencers?.name)
          .map(c => c.influencers.name)
      )].sort();
      
      return { couponCodes, influencerNames, error: null };
    } catch (error) {
      console.error('Error in getCouponFilterValues:', error);
      return { couponCodes: [], influencerNames: [], error: error.message };
    }
  },

  // Get distinct filter values for conversions
  getConversionFilterValues: async (brandId, filters = {}) => {
    if (!supabase) throw new Error('Supabase not configured');
    
    try {
      const { startDate, endDate } = filters;
      
      // Fetch all conversions matching date filter with coupon info (no pagination)
      let query = supabase
        .from('conversions')
        .select('order_number, status, coupon_id, coupons(code)')
        .eq('brand_id', brandId)
        .eq('order_is_real', true);
      
      if (startDate) {
        query = query.gte('sale_date_br_tmz', startDate.toISOString());
      }
      if (endDate) {
        query = query.lte('sale_date_br_tmz', endDate.toISOString());
      }
      
      const { data: conversions, error } = await query;
      if (error) throw error;
      
      // Get distinct order numbers
      const orderIds = [...new Set(
        (conversions || [])
          .map(c => c.order_number)
          .filter(Boolean)
      )].sort();
      
      // Get distinct coupon codes
      const couponCodes = [...new Set(
        (conversions || [])
          .map(c => c.coupons?.code)
          .filter(Boolean)
      )].sort();
      
      // Get distinct statuses
      const statuses = [...new Set(
        (conversions || [])
          .map(c => c.status)
          .filter(Boolean)
      )].sort();
      
      return { orderIds, couponCodes, statuses, error: null };
    } catch (error) {
      console.error('Error in getConversionFilterValues:', error);
      return { orderIds: [], couponCodes: [], statuses: [], error: error.message };
    }
  },

  // Get daily revenue for chart
  getDailyRevenue: async (brandId, filters = {}) => {
    try {
      // Prepare date range parameters (use wide defaults if not provided)
      const startDateStr = filters.startDate ? formatDateForQuery(filters.startDate, false) : '1970-01-01';
      const endDateStr = filters.endDate ? formatDateForQuery(filters.endDate, true) : formatDateForQuery(new Date(), true);

      // Call Postgres RPC to aggregate on the server (no row-limit issues)
      const { data, error } = await supabase.rpc('get_daily_revenue', {
        p_brand_id: brandId,
        p_start_date: startDateStr,
        p_end_date: endDateStr,
      });
      if (error) throw error;

      // Data rows: { sale_date: 'YYYY-MM-DD', valor, quant_pedidos }
      const sorted = (data || [])
        .map(r => ({
          date: (() => {
            const [y, m, d] = (r.sale_date || '').toString().split('-');
            return `${d}/${m}/${y}`;
          })(),
          receita: parseFloat((r.valor || 0).toString()),
          pedidos: parseInt(r.quant_pedidos || 0, 10)
        }))
        .sort((a, b) => {
          // sort by date ascending (DD/MM/YYYY -> compare YYYYMMDD)
          const toKey = s => s.date.split('/').reverse().join('');
          return toKey(a) < toKey(b) ? -1 : toKey(a) > toKey(b) ? 1 : 0;
        });

      return { data: sorted, error: null };
    } catch (err) {
      console.error('Error in getDailyRevenue (RPC):', err);
      return { data: [], error: err.message || String(err) };
    }
  },

  // Get top 5 coupon classifications by revenue
  getTopClassifications: async (brandId, filters = {}) => {
    try {
      // First, get conversions with coupon classification IDs
      let convQuery = supabase
        .from('conversions')
        .select('order_amount, sale_date_br_tmz, status, coupon_id, coupons(classification)')
        .eq('brand_id', brandId)
        .eq('order_is_real', true)
        .in('status', ['authorized', 'paid']); // Only count authorized and paid orders

      if (filters.startDate) {
        const startDateStr = formatDateForQuery(filters.startDate, false);
        convQuery = convQuery.gte('sale_date_br_tmz', startDateStr);
      }
      if (filters.endDate) {
        const endDateStr = formatDateForQuery(filters.endDate, true);
        convQuery = convQuery.lt('sale_date_br_tmz', endDateStr);
      }

      const { data: conversions, error: convError } = await convQuery;
      if (convError) throw convError;

      // Get all classifications for this brand
      const { data: classifications, error: classError } = await supabase
        .from('coupon_classifications')
        .select('id, name, color')
        .eq('brand_id', brandId)
        .eq('is_active', true);

      if (classError) throw classError;

      // Create a map for quick lookup
      const classMap = {};
      (classifications || []).forEach(c => {
        classMap[c.id] = { name: c.name, color: c.color };
      });

      // Group by classification and sum revenue
      const classData = {};
      (conversions || []).forEach(conv => {
        const classId = conv.coupons?.classification;
        
        if (classId && classMap[classId]) {
          const className = classMap[classId].name;
          const classColor = classMap[classId].color;
          const key = `${classId}`;
          
          if (!classData[key]) {
            classData[key] = { name: className, color: classColor, revenue: 0 };
          }
          classData[key].revenue += parseFloat(conv.order_amount || 0);
        } else {
          // Handle uncategorized coupons
            const key = 'uncategorized';
            if (!classData[key]) {
              classData[key] = { name: 'Sem classificação', color: '#6366f1', revenue: 0 };
            }
            classData[key].revenue += parseFloat(conv.order_amount || 0);
          }
      });

      // Sort by revenue descending and take top 5
      const sorted = Object.values(classData)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5)
        .map(item => ({
          ...item,
          revenue: parseFloat(item.revenue.toFixed(2))
        }));

      return { data: sorted, error: null };
    } catch (err) {
      console.error('Error in getTopClassifications:', err);
      return { data: [], error: err.message || String(err) };
    }
  },

  // Get top 10 coupons by revenue
  getTopCoupons: async (brandId, filters = {}) => {
    try {
      let query = supabase
        .from('conversions')
        .select('order_amount, sale_date_br_tmz, status, coupons(code)')
        .eq('brand_id', brandId)
        .eq('order_is_real', true)
        .in('status', ['authorized', 'paid']); // Only count authorized and paid orders

      if (filters.startDate) {
        const startDateStr = formatDateForQuery(filters.startDate, false);
        query = query.gte('sale_date_br_tmz', startDateStr);
      }
      if (filters.endDate) {
        const endDateStr = formatDateForQuery(filters.endDate, true);
        query = query.lt('sale_date_br_tmz', endDateStr);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Group by coupon code and sum revenue
      const couponData = {};
      (data || []).forEach(conv => {
        const code = conv.coupons?.code;
        // Skip orders without coupons
        if (code && code !== 'N/A') {
          couponData[code] = (couponData[code] || 0) + parseFloat(conv.order_amount || 0);
        }
      });

      // Sort by revenue descending and take top 10
      const sorted = Object.entries(couponData)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([code, revenue]) => ({
          code,
          revenue: parseFloat(revenue.toFixed(2))
        }));

      return { data: sorted, error: null };
    } catch (err) {
      console.error('Error in getTopCoupons:', err);
      return { data: [], error: err.message || String(err) };
    }
  },

  // Get pending orders revenue and count with daily breakdown
  getPendingOrders: async (brandId, filters = {}) => {
    try {
      let query = supabase
        .from('conversions')
        .select('order_amount, status, sale_date_br_tmz')
        .eq('brand_id', brandId)
        .eq('status', 'pending')
        .eq('order_is_real', true);

      if (filters.startDate) {
        const startDateStr = formatDateForQuery(filters.startDate, false);
        query = query.gte('sale_date_br_tmz', startDateStr);
      }
      if (filters.endDate) {
        const endDateStr = formatDateForQuery(filters.endDate, true);
        query = query.lt('sale_date_br_tmz', endDateStr);
      }

      const { data, error } = await query;
      if (error) throw error;

      const pendingOrders = data || [];
      const totalRevenue = pendingOrders.reduce(
        (sum, order) => sum + parseFloat(order.order_amount || 0),
        0
      );

      // Group pending orders by date for chart
      const dailyPending = {};
      pendingOrders.forEach(order => {
        // Extract date from sale_date_br_tmz (already in GMT-03)
        const dateString = order.sale_date_br_tmz.split('T')[0]; // Extract YYYY-MM-DD
        const [year, month, day] = dateString.split('-');
        const displayDate = `${day}/${month}/${year}`; // Format as DD/MM/YYYY
        
        dailyPending[dateString] = dailyPending[dateString] || { display: displayDate, count: 0, revenue: 0 };
        dailyPending[dateString].count += 1;
        dailyPending[dateString].revenue += parseFloat(order.order_amount || 0);
      });

      // Sort by date and format
      const dailyChart = Object.keys(dailyPending)
        .sort()
        .map(dateKey => ({
          date: dailyPending[dateKey].display,
          receita: parseFloat(dailyPending[dateKey].revenue.toFixed(2)),
          pedidos: dailyPending[dateKey].count
        }));

      return {
        data: {
          revenue: parseFloat(totalRevenue.toFixed(2)),
          count: pendingOrders.length,
          dailyChart
        },
        error: null
      };
    } catch (err) {
      console.error('Error in getPendingOrders:', err);
      return { data: { revenue: 0, count: 0, dailyChart: [] }, error: err.message || String(err) };
    }
  },

  // Get all classifications for a brand
  async getCouponClassifications(brandId) {
    try {
      const { data, error } = await supabase
        .from('coupon_classifications')
        .select('*')
        .eq('brand_id', brandId)
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) throw error;
      return { classifications: data || [], error: null };
    } catch (err) {
      return { classifications: [], error: getErrorMessage(err) };
    }
  },

  // Create a new classification
  async createCouponClassification(brandId, { name, description, color }) {
    try {
      const { data, error } = await supabase
        .from('coupon_classifications')
        .insert([
          {
            brand_id: brandId,
            name,
            description,
            color,
            is_active: true,
          },
        ])
        .select();

      if (error) throw error;
      return { classification: data?.[0], error: null };
    } catch (err) {
      return { classification: null, error: getErrorMessage(err) };
    }
  },

  // Update a classification
  async updateCouponClassificationItem(classificationId, { name, description, color, is_active }) {
    try {
      const { data, error } = await supabase
        .from('coupon_classifications')
        .update({
          name,
          description,
          color,
          is_active,
          updated_at: new Date().toISOString(),
        })
        .eq('id', classificationId)
        .select();

      if (error) throw error;
      return { classification: data?.[0], error: null };
    } catch (err) {
      return { classification: null, error: getErrorMessage(err) };
    }
  },

  // Soft delete a classification
  async deleteCouponClassification(classificationId) {
    try {
      const { error } = await supabase
        .from('coupon_classifications')
        .update({ is_active: false })
        .eq('id', classificationId);

      if (error) throw error;
      return { error: null };
    } catch (err) {
      return { error: getErrorMessage(err) };
    }
  },

  // Assign classification to a coupon
  async assignCouponClassification(couponId, classificationId) {
    try {
      const { data, error } = await supabase
        .from('coupons')
        .update({
          classification: classificationId,
          classification_updated_at: new Date().toISOString(),
        })
        .eq('id', couponId)
        .select();

      if (error) throw error;
      return { coupon: data?.[0], error: null };
    } catch (err) {
      return { coupon: null, error: getErrorMessage(err) };
    }
  },
};

// ============================================
// ERROR MESSAGES
// ============================================

export const getErrorMessage = (error) => {
  // Handle error objects
  const errorString = typeof error === 'string' ? error : (error?.message || error?.error_description || String(error));
  
  const errorMap = {
    'Invalid login credentials': 'E-mail ou senha incorretos',
    'Email not confirmed': 'Por favor, confirme seu e-mail antes de fazer login',
    'User already registered': 'Este e-mail já está cadastrado',
    'Password should be at least 6 characters': 'A senha deve ter pelo menos 6 caracteres',
    'Invalid email': 'E-mail inválido',
    'Supabase not configured': 'Supabase não está configurado',
  };

  return errorMap[errorString] || errorString || 'Erro desconhecido. Por favor, tente novamente.';
};

export default supabase;