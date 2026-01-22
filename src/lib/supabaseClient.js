import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

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
        sortBy = 'sale_date', 
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
          sale_date,
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
        query = query.eq('order_is_real', true);
      }

      // Apply filters
      if (status) {
        query = query.eq('status', status);
      }

      if (startDate) {
        query = query.gte('sale_date', startDate.toISOString());
      }
      if (endDate) {
        query = query.lte('sale_date', endDate.toISOString());
      }

      // Client-side filters (after fetching) for order_id and coupon_code
      // We'll apply these after getting the data since they involve joined tables

      // Apply sorting
      const ascending = sortDirection === 'asc';
      query = query.order(sortBy, { ascending });

      // Apply pagination
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      
      const { data, error, count } = await query.range(from, to);

      if (error) throw error;

      // Transform data to flatten coupon code
      let transformedData = (data || []).map(conversion => ({
        ...conversion,
        coupon_code: conversion.coupons?.code || 'N/A',
      }));

      // Apply client-side filters for orderId and couponCode
      if (orderId) {
        transformedData = transformedData.filter(c => 
          (c.order_number || c.order_id) === orderId
        );
      }
      if (couponCode) {
        transformedData = transformedData.filter(c => c.coupon_code === couponCode);
      }

      return { 
        conversions: transformedData, 
        totalCount: count || 0,
        error: null 
      };
    } catch (error) {
      return { conversions: [], totalCount: 0, error: error.message };
    }
  },

  // Get conversion totals for subtotals row
  getBrandConversionTotals: async (brandId, filters = {}) => {
    if (!supabase) throw new Error('Supabase not configured');
    
    try {
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
        query = query.gte('sale_date', startDate.toISOString());
      }
      if (endDate) {
        query = query.lte('sale_date', endDate.toISOString());
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
          sale_date,
          coupon_id,
          brand_id,
          coupons(id, code, influencer_id),
          brands(id, name)
        `)
        .eq('coupons.influencer_id', influencerId);

      if (brandId) {
        query = query.eq('brand_id', brandId);
      }

      const { data, error } = await query.order('sale_date', { ascending: false });

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
        convQuery = convQuery.gte('sale_date', filters.startDate.toISOString());
      }
      if (filters.endDate) {
        convQuery = convQuery.lte('sale_date', filters.endDate.toISOString());
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
      // Include all successful statuses: 'paid', 'confirmed', 'completed'
      const confirmedConversions = (conversions || []).filter(
        conv => conv.status === 'paid' || conv.status === 'confirmed' || conv.status === 'completed'
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
          sale_date,
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
            .select('order_amount, status, sale_date, order_is_real')
            .eq('coupon_id', coupon.id)
            .eq('order_is_real', true);

          // Apply date filters for conversions
          if (startDate) {
            convQuery = convQuery.gte('sale_date', startDate.toISOString());
          }
          if (endDate) {
            convQuery = convQuery.lte('sale_date', endDate.toISOString());
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
            ? new Date(Math.max(...realConversions.map(c => new Date(c.sale_date).getTime())))
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
        convQuery = convQuery.gte('sale_date', startDate.toISOString());
      }
      if (endDate) {
        convQuery = convQuery.lte('sale_date', endDate.toISOString());
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
      
      // Fetch all coupons (no pagination)
      let couponQuery = supabase
        .from('coupons')
        .select('code, influencer_id, influencers(name)')
        .eq('brand_id', brandId)
        .eq('is_real', true);
      
      const { data: coupons, error: couponError } = await couponQuery;
      if (couponError) throw couponError;
      
      // Get distinct coupon codes
      const couponCodes = [...new Set(coupons.map(c => c.code))].sort();
      
      // Get distinct influencer names
      const influencerNames = [...new Set(
        coupons
          .filter(c => c.influencers?.name)
          .map(c => c.influencers.name)
      )].sort();
      
      return { couponCodes, influencerNames, error: null };
    } catch (error) {
      return { couponCodes: [], influencerNames: [], error: error.message };
    }
  },

  // Get distinct filter values for conversions
  getConversionFilterValues: async (brandId, filters = {}) => {
    if (!supabase) throw new Error('Supabase not configured');
    
    try {
      const { startDate, endDate } = filters;
      
      // Fetch all conversions matching date filter (no pagination)
      let query = supabase
        .from('conversions')
        .select('order_number, coupon_code, status')
        .eq('brand_id', brandId)
        .eq('order_is_real', true);
      
      if (startDate) {
        query = query.gte('sale_date', startDate.toISOString());
      }
      if (endDate) {
        query = query.lte('sale_date', endDate.toISOString());
      }
      
      const { data: conversions, error } = await query;
      if (error) throw error;
      
      // Get distinct order numbers
      const orderIds = [...new Set(
        conversions
          .map(c => c.order_number)
          .filter(Boolean)
      )].sort();
      
      // Get distinct coupon codes
      const couponCodes = [...new Set(
        conversions
          .map(c => c.coupon_code)
          .filter(Boolean)
      )].sort();
      
      // Get distinct statuses
      const statuses = [...new Set(
        conversions
          .map(c => c.status)
          .filter(Boolean)
      )].sort();
      
      return { orderIds, couponCodes, statuses, error: null };
    } catch (error) {
      return { orderIds: [], couponCodes: [], statuses: [], error: error.message };
    }
  },
};

// ============================================
// ERROR MESSAGES
// ============================================

export const getErrorMessage = (error) => {
  const errorMap = {
    'Invalid login credentials': 'E-mail ou senha incorretos',
    'Email not confirmed': 'Por favor, confirme seu e-mail antes de fazer login',
    'User already registered': 'Este e-mail já está cadastrado',
    'Password should be at least 6 characters': 'A senha deve ter pelo menos 6 caracteres',
    'Invalid email': 'E-mail inválido',
    'Supabase not configured': 'Supabase não está configurado',
  };

  return errorMap[error] || error || 'Erro desconhecido. Por favor, tente novamente.';
};

export default supabase;