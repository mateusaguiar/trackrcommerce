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
  // Get user's brands
  getBrands: async (userId) => {
    if (!supabase) throw new Error('Supabase not configured');
    
    try {
      const { data, error } = await supabase
        .from('brands')
        .select('*')
        .eq('owner_id', userId);

      if (error) throw error;
      return { brands: data || [], error: null };
    } catch (error) {
      return { brands: [], error: error.message };
    }
  },

  // Get coupons for a brand with influencer details
  getBrandCoupons: async (brandId) => {
    if (!supabase) throw new Error('Supabase not configured');
    
    try {
      const { data, error } = await supabase
        .from('coupons')
        .select(`
          id,
          code,
          discount_pct,
          is_active,
          created_at,
          influencer_id,
          influencers(id, name, social_handle, commission_rate)
        `)
        .eq('brand_id', brandId)
        .order('created_at', { ascending: false });

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
  getBrandConversions: async (brandId, filters = {}) => {
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
          order_is_real,
          coupon_id,
          coupons(id, code)
        `)
        .eq('brand_id', brandId);

      // Apply filters
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.onlyReal) {
        query = query.eq('order_is_real', true);
      }

      const { data, error } = await query.order('sale_date', { ascending: false });

      if (error) throw error;

      // Transform data to flatten coupon code for easier access
      const transformedData = (data || []).map(conversion => ({
        ...conversion,
        coupon_code: conversion.coupons?.code || 'N/A',
      }));

      return { conversions: transformedData, error: null };
    } catch (error) {
      return { conversions: [], error: error.message };
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
  createCoupon: async (brandId, influencerId, code, discountPct) => {
    if (!supabase) throw new Error('Supabase not configured');
    
    try {
      const { data, error } = await supabase
        .from('coupons')
        .insert({
          brand_id: brandId,
          influencer_id: influencerId,
          code,
          discount_pct: discountPct,
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
  logConversion: async (brandId, couponId, orderId, orderAmount, commissionAmount, metadata = {}) => {
    if (!supabase) throw new Error('Supabase not configured');
    
    try {
      const { data, error } = await supabase
        .from('conversions')
        .insert({
          brand_id: brandId,
          coupon_id: couponId,
          order_id: orderId,
          order_amount: orderAmount,
          commission_amount: commissionAmount,
          metadata,
          status: 'completed',
          order_is_real: true,
        })
        .select();

      if (error) throw error;
      return { conversion: data?.[0], error: null };
    } catch (error) {
      return { conversion: null, error: error.message };
    }
  },

  // Get brand metrics (computed from actual tables)
  getBrandMetrics: async (brandId) => {
    if (!supabase) throw new Error('Supabase not configured');
    
    try {
      // Get all conversions for this brand
      const { data: conversions, error: convError } = await supabase
        .from('conversions')
        .select('order_amount, commission_amount, status, order_is_real')
        .eq('brand_id', brandId);

      if (convError) throw convError;

      // Get all coupons for this brand
      const { data: coupons, error: couponError } = await supabase
        .from('coupons')
        .select('id, is_active')
        .eq('brand_id', brandId);

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