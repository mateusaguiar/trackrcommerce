  // Get daily revenue for chart
  async getDailyRevenue(brandId, filters = {}) {
    try {
      let query = supabase
        .from('conversions')
        .select('order_amount, sale_date, status, order_is_real')
        .eq('brand_id', brandId)
        .eq('order_is_real', true);

      if (filters.startDate) {
        query = query.gte('sale_date', filters.startDate.toISOString());
      }
      if (filters.endDate) {
        query = query.lte('sale_date', filters.endDate.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;

      // Group by date and sum revenue
      const dailyData = {};
      (data || []).forEach(conv => {
        if (conv.status === 'paid' || conv.status === 'confirmed' || conv.status === 'completed') {
          const date = new Date(conv.sale_date).toLocaleDateString('pt-BR');
          dailyData[date] = (dailyData[date] || 0) + parseFloat(conv.order_amount || 0);
        }
      });

      // Sort by date and format
      const sorted = Object.entries(dailyData)
        .sort((a, b) => new Date(a[0]) - new Date(b[0]))
        .map(([date, revenue]) => ({
          date,
          revenue: parseFloat(revenue.toFixed(2))
        }));

      return { data: sorted, error: null };
    } catch (err) {
      return { data: [], error: getErrorMessage(err) };
    }
  },

  // Get top 5 coupon classifications by revenue
  async getTopClassifications(brandId, filters = {}) {
    try {
      let query = supabase
        .from('conversions')
        .select('order_amount, status, coupon_id, coupons(classification, coupon_classifications(name, color))')
        .eq('brand_id', brandId)
        .eq('order_is_real', true);

      if (filters.startDate) {
        query = query.gte('sale_date', filters.startDate.toISOString());
      }
      if (filters.endDate) {
        query = query.lte('sale_date', filters.endDate.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;

      // Group by classification and sum revenue
      const classData = {};
      (data || []).forEach(conv => {
        if (conv.status === 'paid' || conv.status === 'confirmed' || conv.status === 'completed') {
          const classId = conv.coupons?.classification;
          const className = conv.coupons?.coupon_classifications?.name || 'Sem classificação';
          const classColor = conv.coupons?.coupon_classifications?.color || '#6366f1';
          
          const key = classId ? `${className}|${classColor}` : 'Sem classificação|#6366f1';
          
          if (!classData[key]) {
            classData[key] = { name: className, color: classColor, revenue: 0 };
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
      return { data: [], error: getErrorMessage(err) };
    }
  },

  // Get top 10 coupons by revenue
  async getTopCoupons(brandId, filters = {}) {
    try {
      let query = supabase
        .from('conversions')
        .select('order_amount, status, coupon_id, coupons(code)')
        .eq('brand_id', brandId)
        .eq('order_is_real', true);

      if (filters.startDate) {
        query = query.gte('sale_date', filters.startDate.toISOString());
      }
      if (filters.endDate) {
        query = query.lte('sale_date', filters.endDate.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;

      // Group by coupon code and sum revenue
      const couponData = {};
      (data || []).forEach(conv => {
        if (conv.status === 'paid' || conv.status === 'confirmed' || conv.status === 'completed') {
          const code = conv.coupons?.code || 'N/A';
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
      return { data: [], error: getErrorMessage(err) };
    }
  },

  // Get pending orders revenue and count
  async getPendingOrders(brandId, filters = {}) {
    try {
      let query = supabase
        .from('conversions')
        .select('order_amount, status')
        .eq('brand_id', brandId)
        .eq('status', 'pending')
        .eq('order_is_real', true);

      if (filters.startDate) {
        query = query.gte('sale_date', filters.startDate.toISOString());
      }
      if (filters.endDate) {
        query = query.lte('sale_date', filters.endDate.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;

      const pendingOrders = data || [];
      const totalRevenue = pendingOrders.reduce(
        (sum, order) => sum + parseFloat(order.order_amount || 0),
        0
      );

      return {
        data: {
          revenue: parseFloat(totalRevenue.toFixed(2)),
          count: pendingOrders.length
        },
        error: null
      };
    } catch (err) {
      return { data: { revenue: 0, count: 0 }, error: getErrorMessage(err) };
    }
  },
