import React, { useState, useEffect } from 'react';
import {
  LogOut,
  TrendingUp,
  Ticket,
  ShoppingBag,
  Users,
  ChevronDown,
  Plus,
  Filter,
  RefreshCw,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { Button } from '../components/Button.jsx';
import { authFunctions, dataFunctions, getErrorMessage } from '../lib/supabaseClient.js';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [brands, setBrands] = useState([]);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [showBrandMenu, setShowBrandMenu] = useState(false);
  const [metrics, setMetrics] = useState(null);
  const [coupons, setCoupons] = useState([]);
  const [conversions, setConversions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview'); // overview, coupons, conversions
  
  // Date filter state (timezone: GMT-3 / America/São Paulo)
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(1); // First day of month
    d.setHours(0, 0, 0, 0); // First minute of the day
    return d;
  });
  const [endDate, setEndDate] = useState(new Date());

  // Pagination state for coupons
  const [couponPage, setCouponPage] = useState(1);
  const [couponsPerPage, setCouponsPerPage] = useState(20);
  
  // Pagination state for conversions
  const [conversionPage, setConversionPage] = useState(1);
  const [conversionsPerPage, setConversionsPerPage] = useState(20);

  // Sorting state for coupons
  const [couponSortBy, setCouponSortBy] = useState('created_at');
  const [couponSortDirection, setCouponSortDirection] = useState('desc'); // 'asc' or 'desc'

  // Sorting state for conversions
  const [conversionSortBy, setConversionSortBy] = useState('sale_date');
  const [conversionSortDirection, setConversionSortDirection] = useState('desc'); // 'asc' or 'desc'

  // Column visibility state for coupons
  const couponColumns = [
    { key: 'code', label: 'Código' },
    { key: 'influencer_name', label: 'Influenciador' },
    { key: 'discount', label: 'Desconto' },
    { key: 'usage_count', label: 'Usos' },
    { key: 'total_sales', label: 'Valor Total' },
    { key: 'last_usage', label: 'Último Uso' },
    { key: 'is_active', label: 'Status' },
    { key: 'created_at', label: 'Criado em' },
  ];
  const [visibleCouponColumns, setVisibleCouponColumns] = useState(
    couponColumns.map(col => col.key)
  );

  // Column visibility state for conversions
  const conversionColumns = [
    { key: 'order_id', label: 'ID do Pedido' },
    { key: 'coupon_code', label: 'Cupom' },
    { key: 'order_amount', label: 'Valor' },
    { key: 'commission_amount', label: 'Comissão' },
    { key: 'status', label: 'Status' },
    { key: 'sale_date', label: 'Data' },
  ];
  const [visibleConversionColumns, setVisibleConversionColumns] = useState(
    conversionColumns.map(col => col.key)
  );

  // Toggle coupon column visibility
  const toggleCouponColumn = (columnKey) => {
    setVisibleCouponColumns(prev =>
      prev.includes(columnKey)
        ? prev.filter(key => key !== columnKey)
        : [...prev, columnKey].sort((a, b) => {
            const aIndex = couponColumns.findIndex(col => col.key === a);
            const bIndex = couponColumns.findIndex(col => col.key === b);
            return aIndex - bIndex;
          })
    );
  };

  // Toggle conversion column visibility
  const toggleConversionColumn = (columnKey) => {
    setVisibleConversionColumns(prev =>
      prev.includes(columnKey)
        ? prev.filter(key => key !== columnKey)
        : [...prev, columnKey].sort((a, b) => {
            const aIndex = conversionColumns.findIndex(col => col.key === a);
            const bIndex = conversionColumns.findIndex(col => col.key === b);
            return aIndex - bIndex;
          })
    );
  };

  // Helper function to sort coupons
  const getSortedCoupons = (data) => {
    const sorted = [...data].sort((a, b) => {
      let aVal = a[couponSortBy];
      let bVal = b[couponSortBy];

      // Handle different data types
      if (couponSortBy === 'created_at' || couponSortBy === 'last_usage') {
        aVal = new Date(aVal || 0).getTime();
        bVal = new Date(bVal || 0).getTime();
      } else if (couponSortBy === 'usage_count' || couponSortBy === 'total_sales') {
        aVal = Number(aVal || 0);
        bVal = Number(bVal || 0);
      } else if (couponSortBy === 'discount_value') {
        aVal = Number(aVal || 0);
        bVal = Number(bVal || 0);
      } else {
        aVal = String(aVal || '').toLowerCase();
        bVal = String(bVal || '').toLowerCase();
      }

      if (aVal < bVal) return couponSortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return couponSortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  };

  // Helper function to sort conversions
  const getSortedConversions = (data) => {
    const sorted = [...data].sort((a, b) => {
      let aVal = a[conversionSortBy];
      let bVal = b[conversionSortBy];

      // Handle different data types
      if (conversionSortBy === 'sale_date') {
        aVal = new Date(aVal || 0).getTime();
        bVal = new Date(bVal || 0).getTime();
      } else if (conversionSortBy === 'order_amount' || conversionSortBy === 'commission_amount') {
        aVal = Number(aVal || 0);
        bVal = Number(bVal || 0);
      } else {
        aVal = String(aVal || '').toLowerCase();
        bVal = String(bVal || '').toLowerCase();
      }

      if (aVal < bVal) return conversionSortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return conversionSortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  };

  // Handle coupon column sort
  const handleCouponSort = (columnKey) => {
    if (couponSortBy === columnKey) {
      // Toggle direction if same column
      setCouponSortDirection(couponSortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // New column, default to ascending
      setCouponSortBy(columnKey);
      setCouponSortDirection('asc');
    }
    setCouponPage(1); // Reset to first page
  };

  // Handle conversion column sort
  const handleConversionSort = (columnKey) => {
    if (conversionSortBy === columnKey) {
      // Toggle direction if same column
      setConversionSortDirection(conversionSortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // New column, default to ascending
      setConversionSortBy(columnKey);
      setConversionSortDirection('asc');
    }
    setConversionPage(1); // Reset to first page
  };

  // Helper function to get start and end of day in GMT-3
  const getDateInGMT3 = (date) => {
    const offset = -3 * 60 * 60 * 1000; // GMT-3 in milliseconds
    return new Date(date.getTime() + offset);
  };

  // Helper to format date for input (YYYY-MM-DD)
  const formatDateForInput = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Helper to parse input date string to Date object
  const parseInputDate = (dateString) => {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  // Helper to render sort icon for header
  const renderSortIcon = (columnKey, isCoupon = true) => {
    const isActive = isCoupon ? couponSortBy === columnKey : conversionSortBy === columnKey;
    const direction = isCoupon ? couponSortDirection : conversionSortDirection;
    
    if (!isActive) {
      return <span className="text-zinc-600 text-xs ml-1">↕</span>;
    }
    
    return direction === 'asc' 
      ? <ArrowUp size={14} className="inline ml-1" />
      : <ArrowDown size={14} className="inline ml-1" />;
  };

  // Quick filter: Today
  const handleFilterToday = () => {
    const today = new Date();
    setStartDate(new Date(today.getFullYear(), today.getMonth(), today.getDate()));
    setEndDate(new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59));
  };

  // Quick filter: This Month
  const handleFilterThisMonth = () => {
    const today = new Date();
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    setStartDate(monthStart);
    setEndDate(new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59));
  };

  // Handle start date change
  const handleStartDateChange = (e) => {
    const date = parseInputDate(e.target.value);
    setStartDate(date);
  };

  // Handle end date change
  const handleEndDateChange = (e) => {
    const date = parseInputDate(e.target.value);
    date.setHours(23, 59, 59); // Set to end of day
    setEndDate(date);
  };

  // Pagination helpers for coupons (with sorting)
  const sortedCoupons = getSortedCoupons(coupons);
  const paginatedCoupons = sortedCoupons.slice(
    (couponPage - 1) * couponsPerPage,
    couponPage * couponsPerPage
  );
  const totalCouponPages = Math.ceil(sortedCoupons.length / couponsPerPage);

  // Pagination helpers for conversions (with sorting)
  const sortedConversions = getSortedConversions(conversions);
  const paginatedConversions = sortedConversions.slice(
    (conversionPage - 1) * conversionsPerPage,
    conversionPage * conversionsPerPage
  );
  const totalConversionPages = Math.ceil(sortedConversions.length / conversionsPerPage);

  // Get current user and their brands on mount
  useEffect(() => {
    const initialize = async () => {
      try {
        setLoading(true);
        setError('');

        // Get current session
        const sessionResult = await authFunctions.getSession();
        if (!sessionResult?.session?.user) {
          setError('User session not found');
          return;
        }

        // Get current profile
        const profileResult = await authFunctions.getCurrentProfile();
        if (!profileResult?.profile) {
          setError('Profile not found');
          return;
        }

        const profile = profileResult.profile;

        // Only show dashboard for brand_admin
        if (profile.role !== 'brand_admin') {
          setError('Access denied. This dashboard is for brand administrators only.');
          return;
        }

        setUser(profile);

        // Get user's brands
        const brandsResult = await dataFunctions.getBrands(sessionResult.session.user.id);
        if (brandsResult.brands && brandsResult.brands.length > 0) {
          setBrands(brandsResult.brands);
          setSelectedBrand(brandsResult.brands[0]);
        } else {
          setError('No brands found for this user');
        }

        setLoading(false);
      } catch (err) {
        setError(getErrorMessage(err));
        setLoading(false);
      }
    };

    initialize();
  }, []);

  // Load brand data when selectedBrand or date filters change
  useEffect(() => {
    if (!selectedBrand) return;

    const loadBrandData = async () => {
      try {
        setLoading(true);
        setError('');

        // Get brand metrics with date filter
        const metricsResult = await dataFunctions.getBrandMetrics(selectedBrand.id, {
          startDate,
          endDate,
        });
        setMetrics(metricsResult.metrics);

        // Get brand coupons with metrics and date filter
        const couponsResult = await dataFunctions.getCouponsWithMetrics(selectedBrand.id, {
          startDate,
          endDate,
        });
        setCoupons(couponsResult.coupons || []);

        // Get brand conversions with date filter
        const conversionsResult = await dataFunctions.getBrandConversions(
          selectedBrand.id,
          { startDate, endDate }
        );
        setConversions(conversionsResult.conversions || []);

        setLoading(false);
      } catch (err) {
        setError(getErrorMessage(err));
        setLoading(false);
      }
    };

    loadBrandData();
  }, [selectedBrand, startDate, endDate]);

  const handleLogout = async () => {
    try {
      await authFunctions.logOut();
      window.location.reload();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  if (loading && !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin mb-4">
            <RefreshCw size={40} className="mx-auto text-indigo-500" />
          </div>
          <p className="text-zinc-400">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-black text-white flex items-center justify-center">
        <div className="max-w-md text-center">
          <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-red-400">{error}</p>
          </div>
          <Button variant="primary" onClick={() => window.location.reload()}>
            Tentar novamente
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-black text-white">
      {/* Header */}
      <header className="fixed w-full top-0 z-40 bg-black/80 backdrop-blur-md border-b border-zinc-800">
        <div className="h-20 flex items-center justify-between px-8 max-w-7xl mx-auto w-full">
          <div className="flex items-center gap-2 font-bold text-2xl">
            <TrendingUp className="text-indigo-500" size={28} />
            TrackrCommerce
          </div>

          <div className="flex items-center gap-4">
            {/* Brand Selector */}
            {brands.length > 0 && (
              <div className="relative">
                <button
                  onClick={() => setShowBrandMenu(!showBrandMenu)}
                  className="flex items-center gap-2 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded-lg text-sm font-medium transition"
                >
                  <ShoppingBag size={16} />
                  {selectedBrand?.name || 'Selecionar Brand'}
                  <ChevronDown size={16} />
                </button>

                {showBrandMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl z-50">
                    {brands.map((brand) => (
                      <button
                        key={brand.id}
                        onClick={() => {
                          setSelectedBrand(brand);
                          setShowBrandMenu(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-zinc-800 transition ${
                          selectedBrand?.id === brand.id
                            ? 'bg-indigo-500/20 border-l-2 border-indigo-500'
                            : ''
                        }`}
                      >
                        {brand.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* User Info & Logout */}
            <div className="flex items-center gap-4">
              <div className="text-right text-sm">
                <p className="font-medium">{user?.full_name}</p>
                <p className="text-zinc-400 text-xs">Brand Admin</p>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 hover:bg-zinc-800 rounded-lg transition text-zinc-400 hover:text-white"
                title="Logout"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-8">
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
              {error}
            </div>
          )}

          {selectedBrand && (
            <>
              {/* Brand Title */}
              <div className="mb-8">
                <h1 className="text-4xl font-bold mb-2">{selectedBrand.name}</h1>
                <p className="text-zinc-400">
                  ID da Loja: {selectedBrand.nuvemshop_store_id}
                </p>
              </div>

              {/* Date Filter Section */}
              <div className="mb-8 bg-zinc-900/50 border border-zinc-800 rounded-lg p-6">
                <div className="flex flex-col gap-4">
                  {/* Filter Title and Quick Buttons */}
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-zinc-400">Período (GMT-3)</h3>
                    <div className="flex gap-2">
                      <button
                        onClick={handleFilterToday}
                        className="px-3 py-1 text-xs font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded hover:bg-indigo-500/20 transition"
                      >
                        Hoje
                      </button>
                      <button
                        onClick={handleFilterThisMonth}
                        className="px-3 py-1 text-xs font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded hover:bg-indigo-500/20 transition"
                      >
                        Este Mês
                      </button>
                    </div>
                  </div>

                  {/* Date Inputs */}
                  <div className="flex gap-4 items-end">
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-medium text-zinc-400">Data Inicial</label>
                      <input
                        type="date"
                        value={formatDateForInput(startDate)}
                        onChange={handleStartDateChange}
                        className="px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-sm text-white focus:border-indigo-500 focus:outline-none transition"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-medium text-zinc-400">Data Final</label>
                      <input
                        type="date"
                        value={formatDateForInput(endDate)}
                        onChange={handleEndDateChange}
                        className="px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-sm text-white focus:border-indigo-500 focus:outline-none transition"
                      />
                    </div>
                    <div className="text-xs text-zinc-500">
                      {startDate.toLocaleDateString('pt-BR')} a {endDate.toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex gap-4 mb-8 border-b border-zinc-800">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`px-4 py-3 font-medium transition border-b-2 ${
                    activeTab === 'overview'
                      ? 'border-indigo-500 text-indigo-400'
                      : 'border-transparent text-zinc-400 hover:text-white'
                  }`}
                >
                  Visão Geral
                </button>
                <button
                  onClick={() => setActiveTab('coupons')}
                  className={`px-4 py-3 font-medium transition border-b-2 flex items-center gap-2 ${
                    activeTab === 'coupons'
                      ? 'border-indigo-500 text-indigo-400'
                      : 'border-transparent text-zinc-400 hover:text-white'
                  }`}
                >
                  <Ticket size={18} />
                  Cupons ({coupons.length})
                </button>
                <button
                  onClick={() => setActiveTab('conversions')}
                  className={`px-4 py-3 font-medium transition border-b-2 flex items-center gap-2 ${
                    activeTab === 'conversions'
                      ? 'border-indigo-500 text-indigo-400'
                      : 'border-transparent text-zinc-400 hover:text-white'
                  }`}
                >
                  <ShoppingBag size={18} />
                  Vendas ({conversions.length})
                </button>
              </div>

              {/* TAB: Overview */}
              {activeTab === 'overview' && (
                <div>
                  {loading ? (
                    <div className="text-center py-12">
                      <div className="animate-spin mb-4">
                        <RefreshCw size={32} className="mx-auto text-indigo-500" />
                      </div>
                      <p className="text-zinc-400">Carregando métricas...</p>
                    </div>
                  ) : metrics ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      {/* Total Revenue */}
                      <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700 rounded-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-sm font-medium text-zinc-400">
                            Receita Total
                          </h3>
                          <div className="p-2 bg-indigo-500/10 rounded-lg">
                            <ShoppingBag className="text-indigo-500" size={20} />
                          </div>
                        </div>
                        <p className="text-3xl font-bold">
                          R$ {(metrics.total_revenue || 0).toLocaleString('pt-BR', {
                            minimumFractionDigits: 2,
                          })}
                        </p>
                        <p className="text-xs text-zinc-500 mt-2">
                          {metrics.total_orders || 0} pedidos
                        </p>
                      </div>

                      {/* Active Coupons */}
                      <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700 rounded-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-sm font-medium text-zinc-400">
                            Cupons Ativos
                          </h3>
                          <div className="p-2 bg-emerald-500/10 rounded-lg">
                            <Ticket className="text-emerald-500" size={20} />
                          </div>
                        </div>
                        <p className="text-3xl font-bold">{metrics.active_coupons || 0}</p>
                        <p className="text-xs text-zinc-500 mt-2">
                          {metrics.total_coupons || 0} cupons total
                        </p>
                      </div>

                      {/* Influencers */}
                      <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700 rounded-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-sm font-medium text-zinc-400">
                            Influenciadores
                          </h3>
                          <div className="p-2 bg-blue-500/10 rounded-lg">
                            <Users className="text-blue-500" size={20} />
                          </div>
                        </div>
                        <p className="text-3xl font-bold">{metrics.total_influencers || 0}</p>
                        <p className="text-xs text-zinc-500 mt-2">
                          {metrics.influencers_with_sales || 0} com vendas
                        </p>
                      </div>

                      {/* Average Commission */}
                      <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700 rounded-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-sm font-medium text-zinc-400">
                            Comissão Total
                          </h3>
                          <div className="p-2 bg-purple-500/10 rounded-lg">
                            <TrendingUp className="text-purple-500" size={20} />
                          </div>
                        </div>
                        <p className="text-3xl font-bold">
                          R$ {(metrics.total_commissions || 0).toLocaleString('pt-BR', {
                            minimumFractionDigits: 2,
                          })}
                        </p>
                        <p className="text-xs text-zinc-500 mt-2">
                          {((metrics.commission_rate || 0) * 100).toFixed(1)}% avg
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-zinc-400">
                      Nenhuma métrica disponível
                    </div>
                  )}
                </div>
              )}

              {/* TAB: Coupons */}
              {activeTab === 'coupons' && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold">Cupons</h2>
                    <Button variant="primary">
                      <Plus size={18} className="mr-2" />
                      Novo Cupom
                    </Button>
                  </div>

                  {/* Column Filter and Pagination Controls */}
                  {!loading && coupons.length > 0 && (
                    <div className="mb-4 flex items-center justify-between gap-4">
                      {/* Rows per page */}
                      <div className="flex items-center gap-2">
                        <label className="text-sm text-zinc-400">Linhas por página:</label>
                        <select
                          value={couponsPerPage}
                          onChange={(e) => {
                            setCouponsPerPage(Number(e.target.value));
                            setCouponPage(1);
                          }}
                          className="px-3 py-1 bg-zinc-800 border border-zinc-700 rounded text-sm text-white focus:border-indigo-500 focus:outline-none"
                        >
                          <option value={20}>20</option>
                          <option value={50}>50</option>
                          <option value={100}>100</option>
                        </select>
                      </div>

                      {/* Column Filter Dropdown */}
                      <div className="relative group">
                        <button className="px-3 py-1 bg-zinc-800 border border-zinc-700 rounded text-sm text-white hover:bg-zinc-700 transition">
                          Colunas
                        </button>
                        <div className="absolute right-0 mt-0 w-48 bg-zinc-900 border border-zinc-700 rounded shadow-xl z-50 hidden group-hover:block">
                          <div className="p-3 space-y-2">
                            {couponColumns.map((col) => (
                              <label key={col.key} className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer hover:text-white">
                                <input
                                  type="checkbox"
                                  checked={visibleCouponColumns.includes(col.key)}
                                  onChange={() => toggleCouponColumn(col.key)}
                                  className="rounded"
                                />
                                {col.label}
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {loading ? (
                    <div className="text-center py-12">
                      <div className="animate-spin mb-4">
                        <RefreshCw size={32} className="mx-auto text-indigo-500" />
                      </div>
                      <p className="text-zinc-400">Carregando cupons...</p>
                    </div>
                  ) : coupons.length > 0 ? (
                    <div>
                      {/* Subtotals Row */}
                      <div className="mb-4 bg-zinc-800/40 border border-zinc-700 rounded-lg">
                        <table className="w-full">
                          <tbody>
                            <tr>
                              <td className="py-4 px-4 text-sm font-semibold text-zinc-300">
                                TOTAL
                              </td>
                              <td className="py-4 px-4 text-sm"></td>
                              <td className="py-4 px-4 text-sm"></td>
                              <td className="py-4 px-4 text-sm font-semibold text-zinc-300">
                                {coupons.reduce((sum, coupon) => sum + coupon.usage_count, 0)}
                              </td>
                              <td className="py-4 px-4 text-sm font-semibold text-emerald-400">
                                R$ {coupons.reduce((sum, coupon) => sum + coupon.total_sales, 0).toLocaleString('pt-BR', {
                                  minimumFractionDigits: 2,
                                })}
                              </td>
                              <td className="py-4 px-4 text-sm"></td>
                              <td className="py-4 px-4 text-sm"></td>
                              <td className="py-4 px-4 text-sm"></td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      {/* Data Table */}
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-zinc-700">
                              {visibleCouponColumns.includes('code') && (
                                <th 
                                  onClick={() => handleCouponSort('code')}
                                  className="text-left py-4 px-4 text-sm font-medium text-zinc-400 cursor-pointer hover:text-zinc-200 transition"
                                >
                                  Código {renderSortIcon('code', true)}
                                </th>
                              )}
                              {visibleCouponColumns.includes('influencer_name') && (
                                <th 
                                  onClick={() => handleCouponSort('influencer_name')}
                                  className="text-left py-4 px-4 text-sm font-medium text-zinc-400 cursor-pointer hover:text-zinc-200 transition"
                                >
                                  Influenciador {renderSortIcon('influencer_name', true)}
                                </th>
                              )}
                              {visibleCouponColumns.includes('discount') && (
                                <th 
                                  onClick={() => handleCouponSort('discount_value')}
                                  className="text-left py-4 px-4 text-sm font-medium text-zinc-400 cursor-pointer hover:text-zinc-200 transition"
                                >
                                  Desconto {renderSortIcon('discount_value', true)}
                                </th>
                              )}
                              {visibleCouponColumns.includes('usage_count') && (
                                <th 
                                  onClick={() => handleCouponSort('usage_count')}
                                  className="text-left py-4 px-4 text-sm font-medium text-zinc-400 cursor-pointer hover:text-zinc-200 transition"
                                >
                                  Usos {renderSortIcon('usage_count', true)}
                                </th>
                              )}
                              {visibleCouponColumns.includes('total_sales') && (
                                <th 
                                  onClick={() => handleCouponSort('total_sales')}
                                  className="text-left py-4 px-4 text-sm font-medium text-zinc-400 cursor-pointer hover:text-zinc-200 transition"
                                >
                                  Valor Total {renderSortIcon('total_sales', true)}
                                </th>
                              )}
                              {visibleCouponColumns.includes('last_usage') && (
                                <th 
                                  onClick={() => handleCouponSort('last_usage')}
                                  className="text-left py-4 px-4 text-sm font-medium text-zinc-400 cursor-pointer hover:text-zinc-200 transition"
                                >
                                  Último Uso {renderSortIcon('last_usage', true)}
                                </th>
                              )}
                              {visibleCouponColumns.includes('is_active') && (
                                <th 
                                  onClick={() => handleCouponSort('is_active')}
                                  className="text-left py-4 px-4 text-sm font-medium text-zinc-400 cursor-pointer hover:text-zinc-200 transition"
                                >
                                  Status {renderSortIcon('is_active', true)}
                                </th>
                              )}
                              {visibleCouponColumns.includes('created_at') && (
                                <th 
                                  onClick={() => handleCouponSort('created_at')}
                                  className="text-left py-4 px-4 text-sm font-medium text-zinc-400 cursor-pointer hover:text-zinc-200 transition"
                                >
                                  Criado em {renderSortIcon('created_at', true)}
                                </th>
                              )}
                            </tr>
                          </thead>
                          <tbody>
                            {paginatedCoupons.map((coupon) => (
                              <tr key={coupon.id} className="border-b border-zinc-800 hover:bg-zinc-900/50 transition">
                                {visibleCouponColumns.includes('code') && (
                                  <td className="py-4 px-4">
                                    <span className="font-mono font-bold text-indigo-400">{coupon.code}</span>
                                  </td>
                                )}
                                {visibleCouponColumns.includes('influencer_name') && (
                                  <td className="py-4 px-4 text-sm">{coupon.influencer_name || 'N/A'}</td>
                                )}
                                {visibleCouponColumns.includes('discount') && (
                                  <td className="py-4 px-4 text-sm">
                                    {coupon.discount_type === 'absolute'
                                      ? `R$ ${coupon.discount_value}`
                                      : `${coupon.discount_value}%`}
                                  </td>
                                )}
                                {visibleCouponColumns.includes('usage_count') && (
                                  <td className="py-4 px-4 text-sm font-medium text-zinc-300">{coupon.usage_count}</td>
                                )}
                                {visibleCouponColumns.includes('total_sales') && (
                                  <td className="py-4 px-4 text-sm font-medium text-emerald-400">
                                    R$ {coupon.total_sales.toLocaleString('pt-BR', {
                                      minimumFractionDigits: 2,
                                    })}
                                  </td>
                                )}
                                {visibleCouponColumns.includes('last_usage') && (
                                  <td className="py-4 px-4 text-sm text-zinc-400">
                                    {coupon.last_usage
                                      ? new Date(coupon.last_usage).toLocaleDateString('pt-BR', {
                                          year: 'numeric',
                                          month: '2-digit',
                                          day: '2-digit',
                                          hour: '2-digit',
                                          minute: '2-digit',
                                        })
                                      : '-'}
                                  </td>
                                )}
                                {visibleCouponColumns.includes('is_active') && (
                                  <td className="py-4 px-4 text-sm">
                                    <span
                                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                                        coupon.is_active
                                          ? 'bg-emerald-500/10 text-emerald-400'
                                          : 'bg-zinc-700/50 text-zinc-400'
                                      }`}
                                    >
                                      {coupon.is_active ? 'Ativo' : 'Inativo'}
                                    </span>
                                  </td>
                                )}
                                {visibleCouponColumns.includes('created_at') && (
                                  <td className="py-4 px-4 text-sm text-zinc-400">
                                    {new Date(coupon.created_at).toLocaleDateString('pt-BR')}
                                  </td>
                                )}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Pagination Controls for Coupons */}
                      <div className="mt-4 flex items-center justify-between">
                        <span className="text-sm text-zinc-400">
                          Mostrando {paginatedCoupons.length > 0 ? (couponPage - 1) * couponsPerPage + 1 : 0} a{' '}
                          {Math.min(couponPage * couponsPerPage, coupons.length)} de {coupons.length} cupons
                        </span>
                        <div className="flex gap-2">
                          <button
                            disabled={couponPage === 1}
                            onClick={() => setCouponPage(couponPage - 1)}
                            className="px-3 py-1 bg-zinc-800 border border-zinc-700 rounded text-sm text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-700 transition"
                          >
                            Anterior
                          </button>
                          <span className="px-3 py-1 text-sm text-white">
                            Página {couponPage} de {totalCouponPages}
                          </span>
                          <button
                            disabled={couponPage === totalCouponPages}
                            onClick={() => setCouponPage(couponPage + 1)}
                            className="px-3 py-1 bg-zinc-800 border border-zinc-700 rounded text-sm text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-700 transition"
                          >
                            Próxima
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-zinc-400">
                      Nenhum cupom criado ainda
                    </div>
                  )}
                </div>
              )}

              {/* TAB: Conversions */}
              {activeTab === 'conversions' && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold">Vendas Recentes</h2>
                    <Button variant="outline">
                      <Filter size={18} />
                    </Button>
                  </div>

                  {/* Column Filter and Pagination Controls */}
                  {!loading && conversions.length > 0 && (
                    <div className="mb-4 flex items-center justify-between gap-4">
                      {/* Rows per page */}
                      <div className="flex items-center gap-2">
                        <label className="text-sm text-zinc-400">Linhas por página:</label>
                        <select
                          value={conversionsPerPage}
                          onChange={(e) => {
                            setConversionsPerPage(Number(e.target.value));
                            setConversionPage(1);
                          }}
                          className="px-3 py-1 bg-zinc-800 border border-zinc-700 rounded text-sm text-white focus:border-indigo-500 focus:outline-none"
                        >
                          <option value={20}>20</option>
                          <option value={50}>50</option>
                          <option value={100}>100</option>
                        </select>
                      </div>

                      {/* Column Filter Dropdown */}
                      <div className="relative group">
                        <button className="px-3 py-1 bg-zinc-800 border border-zinc-700 rounded text-sm text-white hover:bg-zinc-700 transition">
                          Colunas
                        </button>
                        <div className="absolute right-0 mt-0 w-48 bg-zinc-900 border border-zinc-700 rounded shadow-xl z-50 hidden group-hover:block">
                          <div className="p-3 space-y-2">
                            {conversionColumns.map((col) => (
                              <label key={col.key} className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer hover:text-white">
                                <input
                                  type="checkbox"
                                  checked={visibleConversionColumns.includes(col.key)}
                                  onChange={() => toggleConversionColumn(col.key)}
                                  className="rounded"
                                />
                                {col.label}
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {loading ? (
                    <div className="text-center py-12">
                      <div className="animate-spin mb-4">
                        <RefreshCw size={32} className="mx-auto text-indigo-500" />
                      </div>
                      <p className="text-zinc-400">Carregando vendas...</p>
                    </div>
                  ) : conversions.length > 0 ? (
                    <div>
                      {/* Subtotals Row */}
                      <div className="mb-4 bg-zinc-800/40 border border-zinc-700 rounded-lg">
                        <table className="w-full">
                          <tbody>
                            <tr>
                              <td className="py-4 px-4 text-sm font-semibold text-zinc-300">
                                TOTAL
                              </td>
                              <td className="py-4 px-4 text-sm"></td>
                              <td className="py-4 px-4 text-sm font-semibold text-emerald-400">
                                R$ {conversions.reduce((sum, conv) => sum + parseFloat(conv.order_amount || 0), 0).toLocaleString('pt-BR', {
                                  minimumFractionDigits: 2,
                                })}
                              </td>
                              <td className="py-4 px-4 text-sm font-semibold text-emerald-400">
                                R$ {conversions.reduce((sum, conv) => sum + parseFloat(conv.commission_amount || 0), 0).toLocaleString('pt-BR', {
                                  minimumFractionDigits: 2,
                                })}
                              </td>
                              <td className="py-4 px-4 text-sm"></td>
                              <td className="py-4 px-4 text-sm"></td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      {/* Data Table */}
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-zinc-700">
                              {visibleConversionColumns.includes('order_id') && (
                                <th 
                                  onClick={() => handleConversionSort('order_id')}
                                  className="text-left py-4 px-4 text-sm font-medium text-zinc-400 cursor-pointer hover:text-zinc-200 transition"
                                >
                                  ID do Pedido {renderSortIcon('order_id', false)}
                                </th>
                              )}
                              {visibleConversionColumns.includes('coupon_code') && (
                                <th 
                                  onClick={() => handleConversionSort('coupon_code')}
                                  className="text-left py-4 px-4 text-sm font-medium text-zinc-400 cursor-pointer hover:text-zinc-200 transition"
                                >
                                  Cupom {renderSortIcon('coupon_code', false)}
                                </th>
                              )}
                              {visibleConversionColumns.includes('order_amount') && (
                                <th 
                                  onClick={() => handleConversionSort('order_amount')}
                                  className="text-left py-4 px-4 text-sm font-medium text-zinc-400 cursor-pointer hover:text-zinc-200 transition"
                                >
                                  Valor {renderSortIcon('order_amount', false)}
                                </th>
                              )}
                              {visibleConversionColumns.includes('commission_amount') && (
                                <th 
                                  onClick={() => handleConversionSort('commission_amount')}
                                  className="text-left py-4 px-4 text-sm font-medium text-zinc-400 cursor-pointer hover:text-zinc-200 transition"
                                >
                                  Comissão {renderSortIcon('commission_amount', false)}
                                </th>
                              )}
                              {visibleConversionColumns.includes('status') && (
                                <th 
                                  onClick={() => handleConversionSort('status')}
                                  className="text-left py-4 px-4 text-sm font-medium text-zinc-400 cursor-pointer hover:text-zinc-200 transition"
                                >
                                  Status {renderSortIcon('status', false)}
                                </th>
                              )}
                              {visibleConversionColumns.includes('sale_date') && (
                                <th 
                                  onClick={() => handleConversionSort('sale_date')}
                                  className="text-left py-4 px-4 text-sm font-medium text-zinc-400 cursor-pointer hover:text-zinc-200 transition"
                                >
                                  Data {renderSortIcon('sale_date', false)}
                                </th>
                              )}
                            </tr>
                          </thead>
                          <tbody>
                            {paginatedConversions.map((conversion) => (
                              <tr key={conversion.id} className="border-b border-zinc-800 hover:bg-zinc-900/50 transition">
                                {visibleConversionColumns.includes('order_id') && (
                                  <td className="py-4 px-4">
                                    <span className="font-mono text-sm text-zinc-300">
                                      {conversion.order_number || conversion.order_id}
                                    </span>
                                  </td>
                                )}
                                {visibleConversionColumns.includes('coupon_code') && (
                                  <td className="py-4 px-4 text-sm">
                                    <span className="font-mono text-indigo-400">{conversion.coupon_code || 'N/A'}</span>
                                  </td>
                                )}
                                {visibleConversionColumns.includes('order_amount') && (
                                  <td className="py-4 px-4 text-sm font-medium">
                                    R$ {conversion.order_amount.toLocaleString('pt-BR', {
                                      minimumFractionDigits: 2,
                                    })}
                                  </td>
                                )}
                                {visibleConversionColumns.includes('commission_amount') && (
                                  <td className="py-4 px-4 text-sm font-medium text-emerald-400">
                                    R$ {conversion.commission_amount.toLocaleString('pt-BR', {
                                      minimumFractionDigits: 2,
                                    })}
                                  </td>
                                )}
                                {visibleConversionColumns.includes('status') && (
                                  <td className="py-4 px-4 text-sm">
                                    <span
                                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                                        conversion.status === 'paid' || conversion.status === 'confirmed'
                                          ? 'bg-emerald-500/10 text-emerald-400'
                                          : conversion.status === 'completed'
                                            ? 'bg-emerald-500/10 text-emerald-400'
                                            : conversion.status === 'pending'
                                              ? 'bg-yellow-500/10 text-yellow-400'
                                              : 'bg-red-500/10 text-red-400'
                                      }`}
                                    >
                                      {conversion.status === 'paid'
                                        ? 'Pago'
                                        : conversion.status === 'confirmed'
                                          ? 'Confirmado'
                                          : conversion.status === 'completed'
                                            ? 'Completo'
                                            : conversion.status === 'pending'
                                              ? 'Pendente'
                                              : 'Cancelado'}
                                    </span>
                                  </td>
                                )}
                                {visibleConversionColumns.includes('sale_date') && (
                                  <td className="py-4 px-4 text-sm text-zinc-400">
                                    {new Date(conversion.sale_date).toLocaleDateString('pt-BR')}
                                  </td>
                                )}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Pagination Controls for Conversions */}
                      <div className="mt-4 flex items-center justify-between">
                        <span className="text-sm text-zinc-400">
                          Mostrando {paginatedConversions.length > 0 ? (conversionPage - 1) * conversionsPerPage + 1 : 0} a{' '}
                          {Math.min(conversionPage * conversionsPerPage, conversions.length)} de {conversions.length} vendas
                        </span>
                        <div className="flex gap-2">
                          <button
                            disabled={conversionPage === 1}
                            onClick={() => setConversionPage(conversionPage - 1)}
                            className="px-3 py-1 bg-zinc-800 border border-zinc-700 rounded text-sm text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-700 transition"
                          >
                            Anterior
                          </button>
                          <span className="px-3 py-1 text-sm text-white">
                            Página {conversionPage} de {totalConversionPages}
                          </span>
                          <button
                            disabled={conversionPage === totalConversionPages}
                            onClick={() => setConversionPage(conversionPage + 1)}
                            className="px-3 py-1 bg-zinc-800 border border-zinc-700 rounded text-sm text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-700 transition"
                          >
                            Próxima
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-zinc-400">
                      Nenhuma venda no período
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
