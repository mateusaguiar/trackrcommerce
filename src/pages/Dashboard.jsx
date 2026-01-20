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

  // Load brand data when selectedBrand changes
  useEffect(() => {
    if (!selectedBrand) return;

    const loadBrandData = async () => {
      try {
        setLoading(true);
        setError('');

        // Get brand metrics
        const metricsResult = await dataFunctions.getBrandMetrics(selectedBrand.id);
        setMetrics(metricsResult.metrics);

        // Get brand coupons
        const couponsResult = await dataFunctions.getBrandCoupons(selectedBrand.id);
        setCoupons(couponsResult.coupons || []);

        // Get brand conversions with filter for last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const conversionsResult = await dataFunctions.getBrandConversions(
          selectedBrand.id,
          { startDate: thirtyDaysAgo }
        );
        setConversions(conversionsResult.conversions || []);

        setLoading(false);
      } catch (err) {
        setError(getErrorMessage(err));
        setLoading(false);
      }
    };

    loadBrandData();
  }, [selectedBrand]);

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

                  {loading ? (
                    <div className="text-center py-12">
                      <div className="animate-spin mb-4">
                        <RefreshCw size={32} className="mx-auto text-indigo-500" />
                      </div>
                      <p className="text-zinc-400">Carregando cupons...</p>
                    </div>
                  ) : coupons.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-zinc-700">
                            <th className="text-left py-4 px-4 text-sm font-medium text-zinc-400">
                              Código
                            </th>
                            <th className="text-left py-4 px-4 text-sm font-medium text-zinc-400">
                              Influenciador
                            </th>
                            <th className="text-left py-4 px-4 text-sm font-medium text-zinc-400">
                              Desconto
                            </th>
                            <th className="text-left py-4 px-4 text-sm font-medium text-zinc-400">
                              Status
                            </th>
                            <th className="text-left py-4 px-4 text-sm font-medium text-zinc-400">
                              Criado em
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {coupons.map((coupon) => (
                            <tr
                              key={coupon.id}
                              className="border-b border-zinc-800 hover:bg-zinc-900/50 transition"
                            >
                              <td className="py-4 px-4">
                                <span className="font-mono font-bold text-indigo-400">
                                  {coupon.code}
                                </span>
                              </td>
                              <td className="py-4 px-4 text-sm">
                                {coupon.influencer_name || 'N/A'}
                              </td>
                              <td className="py-4 px-4 text-sm">
                                {coupon.discount_pct}%
                              </td>
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
                              <td className="py-4 px-4 text-sm text-zinc-400">
                                {new Date(coupon.created_at).toLocaleDateString('pt-BR')}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
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
                    <h2 className="text-2xl font-bold">Vendas Recentes (30 dias)</h2>
                    <Button variant="outline">
                      <Filter size={18} />
                    </Button>
                  </div>

                  {loading ? (
                    <div className="text-center py-12">
                      <div className="animate-spin mb-4">
                        <RefreshCw size={32} className="mx-auto text-indigo-500" />
                      </div>
                      <p className="text-zinc-400">Carregando vendas...</p>
                    </div>
                  ) : conversions.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-zinc-700">
                            <th className="text-left py-4 px-4 text-sm font-medium text-zinc-400">
                              ID do Pedido
                            </th>
                            <th className="text-left py-4 px-4 text-sm font-medium text-zinc-400">
                              Cupom
                            </th>
                            <th className="text-left py-4 px-4 text-sm font-medium text-zinc-400">
                              Valor
                            </th>
                            <th className="text-left py-4 px-4 text-sm font-medium text-zinc-400">
                              Comissão
                            </th>
                            <th className="text-left py-4 px-4 text-sm font-medium text-zinc-400">
                              Status
                            </th>
                            <th className="text-left py-4 px-4 text-sm font-medium text-zinc-400">
                              Data
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {conversions.map((conversion) => (
                            <tr
                              key={conversion.id}
                              className="border-b border-zinc-800 hover:bg-zinc-900/50 transition"
                            >
                              <td className="py-4 px-4">
                                <span className="font-mono text-sm text-zinc-300">
                                  {conversion.order_number || conversion.order_id}
                                </span>
                              </td>
                              <td className="py-4 px-4 text-sm">
                                <span className="font-mono text-indigo-400">
                                  {conversion.coupon_code || 'N/A'}
                                </span>
                              </td>
                              <td className="py-4 px-4 text-sm font-medium">
                                R$ {conversion.order_amount.toLocaleString('pt-BR', {
                                  minimumFractionDigits: 2,
                                })}
                              </td>
                              <td className="py-4 px-4 text-sm font-medium text-emerald-400">
                                R$ {conversion.commission_amount.toLocaleString('pt-BR', {
                                  minimumFractionDigits: 2,
                                })}
                              </td>
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
                              <td className="py-4 px-4 text-sm text-zinc-400">
                                {new Date(conversion.sale_date).toLocaleDateString('pt-BR')}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
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
