import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Users, 
  Ticket, 
  DollarSign, 
  LayoutDashboard, 
  BarChart3, 
  ChevronRight, 
  Check, 
  X, 
  LogOut,
  ShoppingBag,
  Instagram,
  Wallet,
  ArrowUpRight
} from 'lucide-react';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area 
} from 'recharts';

/**
 * NOTA PARA O GITHUB:
 * Para o seu ambiente local com Vite, você pode voltar a usar:
 * import { createClient } from '@supabase/supabase-js';
 * const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY);
 * * Abaixo, usamos um carregamento via CDN para garantir que o preview funcione sem erros de dependência.
 */

// --- CONFIGURAÇÃO ---
const SUPABASE_CONFIG = {
  url: typeof window !== 'undefined' ? (window.VITE_SUPABASE_URL || "") : "",
  anonKey: typeof window !== 'undefined' ? (window.VITE_SUPABASE_ANON_KEY || "") : ""
};

// --- COMPONENTES DE UI ---

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center p-6 border-b border-zinc-800">
          <h3 className="text-xl font-bold text-white">{title}</h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};

const Button = ({ children, variant = 'primary', className = '', ...props }) => {
  const variants = {
    primary: 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20',
    secondary: 'bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700',
    outline: 'bg-transparent border border-zinc-700 hover:border-indigo-500 text-zinc-300 hover:text-white',
    ghost: 'hover:bg-zinc-800 text-zinc-400 hover:text-white'
  };
  return (
    <button 
      className={`px-5 py-2.5 rounded-xl font-medium transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

// --- APP PRINCIPAL ---

export default function App() {
  const [supabase, setSupabase] = useState(null);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [brand, setBrand] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [view, setView] = useState('landing');
  const [activeTab, setActiveTab] = useState('overview');

  // 1. Carregar Supabase via CDN para evitar erros de compilação no preview
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
    script.async = true;
    script.onload = () => {
      if (window.supabase) {
        const client = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
        setSupabase(client);
      }
    };
    document.body.appendChild(script);
    return () => document.body.removeChild(script);
  }, []);

  // 2. Gestão de Sessão
  useEffect(() => {
    if (!supabase) return;

    const initSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      handleAuthChange(session?.user ?? null);
      
      const { data: { subscription } } = supabase.auth.onAuthStateChanged((_event, session) => {
        handleAuthChange(session?.user ?? null);
      });

      return () => subscription.unsubscribe();
    };
    initSession();
  }, [supabase]);

  const handleAuthChange = async (authUser) => {
    if (authUser && supabase) {
      setUser(authUser);
      
      const { data: prof } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();
      
      setProfile(prof);

      const { data: bnd } = await supabase
        .from('brands')
        .select('*')
        .eq('owner_id', authUser.id)
        .limit(1)
        .maybeSingle();
      
      setBrand(bnd);
      setView('dashboard');
    } else {
      setUser(null);
      setProfile(null);
      setBrand(null);
      setView('landing');
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    if (supabase) await supabase.auth.signOut();
  };

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-indigo-500"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans selection:bg-indigo-500/30">
      {view === 'landing' ? (
        <LandingPage onOpenLogin={() => setIsLoginOpen(true)} />
      ) : (
        <Dashboard 
          supabase={supabase}
          profile={profile}
          brand={brand}
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          onLogout={handleLogout}
        />
      )}

      <Modal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} title="Login TrackrCommerce">
        <AuthForm supabase={supabase} onSuccess={() => setIsLoginOpen(false)} />
      </Modal>
    </div>
  );
}

// --- FORMULÁRIO DE AUTH ---
function AuthForm({ supabase, onSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!supabase) return;
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setErr(error.message);
    else onSuccess();
  };

  return (
    <form onSubmit={handleLogin} className="space-y-4">
      {err && <div className="p-3 bg-red-500/10 border border-red-500/50 text-red-500 text-xs rounded-lg">{err}</div>}
      <input 
        type="email" 
        placeholder="E-mail" 
        className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input 
        type="password" 
        placeholder="Senha" 
        className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <Button type="submit" className="w-full">Entrar na Conta</Button>
    </form>
  );
}

// --- LANDING PAGE ---
function LandingPage({ onOpenLogin }) {
  return (
    <div className="relative min-h-screen">
      <header className="h-20 flex items-center justify-between px-8 max-w-7xl mx-auto">
        <div className="flex items-center gap-2 font-bold text-xl">
          <div className="p-1.5 bg-indigo-600 rounded-lg"><TrendingUp size={20}/></div>
          TrackrCommerce
        </div>
        <Button onClick={onOpenLogin} variant="secondary">Acessar Painel</Button>
      </header>
      
      <main className="max-w-5xl mx-auto px-8 pt-32 text-center">
        <h1 className="text-6xl md:text-7xl font-black mb-8 leading-tight tracking-tight">
          Sua Nuvemshop sob <span className="text-indigo-500">nova ótica.</span>
        </h1>
        <p className="text-xl text-zinc-500 mb-12 max-w-2xl mx-auto">
          Gerencie influenciadores, cupons e métricas de conversão em tempo real. Orquestrado por n8n e alimentado por Supabase.
        </p>
        <div className="flex gap-4 justify-center">
          <Button className="px-12 py-4 text-lg" onClick={onOpenLogin}>Começar Teste Agora</Button>
        </div>
      </main>
    </div>
  );
}

// --- DASHBOARD ---
function Dashboard({ supabase, profile, brand, activeTab, setActiveTab, onLogout }) {
  const sidebarItems = [
    { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'influencers', label: 'Influenciadores', icon: Users },
    { id: 'coupons', label: 'Cupons', icon: Ticket },
    { id: 'conversions', label: 'Conversões', icon: DollarSign },
  ];

  return (
    <div className="flex h-screen bg-black">
      <aside className="w-64 border-r border-zinc-800 flex flex-col p-6">
        <div className="flex items-center gap-2 mb-10 font-bold">
          <TrendingUp size={24} className="text-indigo-500" />
          TrackrCommerce
        </div>
        <nav className="space-y-2 flex-1">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                activeTab === item.id 
                  ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.1)]' 
                  : 'text-zinc-500 hover:text-white'
              }`}
            >
              <item.icon size={18} />
              <span className="text-sm font-semibold">{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="border-t border-zinc-800 pt-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-xs">
              {profile?.full_name?.[0] || "?"}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-xs font-bold truncate">{profile?.full_name || "Usuário"}</p>
              <p className="text-[10px] text-zinc-500 uppercase">{profile?.role || "Indefinido"}</p>
            </div>
          </div>
          <button onClick={onLogout} className="flex items-center gap-2 text-zinc-600 hover:text-red-400 text-sm transition-colors">
            <LogOut size={16}/> Sair
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-10 bg-zinc-950/30">
        <header className="flex justify-between items-start mb-10">
          <div>
            <h2 className="text-3xl font-bold text-white mb-1">{brand?.name || "Minha Marca"}</h2>
            <p className="text-zinc-500 text-sm">Monitorando vendas e performance Nuvemshop</p>
          </div>
          <div className="flex items-center gap-3 bg-zinc-900/50 border border-zinc-800 px-4 py-2 rounded-xl text-xs font-bold">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            Sincronizado com Nuvemshop
          </div>
        </header>

        {activeTab === 'overview' && <Overview supabase={supabase} brandId={brand?.id} />}
        {activeTab === 'influencers' && <Influencers supabase={supabase} brandId={brand?.id} />}
        {activeTab === 'conversions' && <Conversions supabase={supabase} brandId={brand?.id} />}
        {activeTab === 'coupons' && <Coupons brandId={brand?.id} />}
      </main>
    </div>
  );
}

// --- SUB-VIEWS ---

function Overview({ supabase, brandId }) {
  const [metrics, setMetrics] = useState({ revenue: 0, comm: 0, count: 0 });

  const fetchMetrics = async () => {
    if (!supabase || !brandId) return;
    const { data } = await supabase
      .from('conversions')
      .select('order_amount, commission_amount')
      .eq('brand_id', brandId);

    if (data) {
      setMetrics({
        revenue: data.reduce((acc, c) => acc + (Number(c.order_amount) || 0), 0),
        comm: data.reduce((acc, c) => acc + (Number(c.commission_amount) || 0), 0),
        count: data.length
      });
    }
  };

  useEffect(() => {
    fetchMetrics();
    if (!supabase || !brandId) return;

    const sub = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'conversions', 
        filter: `brand_id=eq.${brandId}` 
      }, fetchMetrics)
      .subscribe();

    return () => supabase.removeChannel(sub);
  }, [supabase, brandId]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl">
          <p className="text-zinc-500 text-xs font-bold uppercase mb-2">Faturamento via Influencers</p>
          <h3 className="text-4xl font-black text-white">R$ {metrics.revenue.toLocaleString()}</h3>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl">
          <p className="text-zinc-500 text-xs font-bold uppercase mb-2">Comissões Acumuladas</p>
          <h3 className="text-4xl font-black text-indigo-400">R$ {metrics.comm.toLocaleString()}</h3>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl">
          <p className="text-zinc-500 text-xs font-bold uppercase mb-2">Total de Pedidos</p>
          <h3 className="text-4xl font-black text-white">{metrics.count}</h3>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl h-[350px]">
        <h4 className="font-bold mb-6 text-zinc-400">Performance Semanal (Atividade Recente)</h4>
        <ResponsiveContainer width="100%" height="90%">
          <AreaChart data={[{n:'Seg',v:100},{n:'Ter',v:300},{n:'Qua',v:200},{n:'Qui',v:500},{n:'Sex',v:400}]}>
            <defs><linearGradient id="c" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/><stop offset="95%" stopColor="#6366f1" stopOpacity={0}/></linearGradient></defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
            <XAxis dataKey="n" stroke="#52525b" fontSize={12} axisLine={false} tickLine={false} />
            <Area type="monotone" dataKey="v" stroke="#6366f1" fill="url(#c)" strokeWidth={3} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function Influencers({ supabase, brandId }) {
  const [list, setList] = useState([]);

  useEffect(() => {
    if (!supabase || !brandId) return;
    const fetch = async () => {
      const { data } = await supabase
        .from('influencers')
        .select('*, conversions(count)')
        .eq('brand_id', brandId);
      setList(data || []);
    };
    fetch();
  }, [supabase, brandId]);

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden animate-in fade-in duration-500">
      <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-800/20">
        <h3 className="font-bold">Influenciadores Conectados</h3>
        <Button variant="outline" className="text-xs px-4 py-1.5">Novo Cadastro</Button>
      </div>
      <table className="w-full text-left">
        <thead>
          <tr className="text-[10px] text-zinc-500 font-black uppercase tracking-widest border-b border-zinc-800">
            <th className="p-6 text-center w-20">Avatar</th>
            <th className="p-6">Criador</th>
            <th className="p-6">Taxa</th>
            <th className="p-6 text-right">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800">
          {list.length > 0 ? list.map((inf) => (
            <tr key={inf.id} className="hover:bg-white/5 group transition-colors">
              <td className="p-6 flex justify-center">
                <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-indigo-500 border border-zinc-700">{inf.name?.[0] || "?"}</div>
              </td>
              <td className="p-6">
                <p className="font-bold text-white">{inf.name}</p>
                <p className="text-xs text-zinc-500 font-mono">{inf.social_handle}</p>
              </td>
              <td className="p-6 text-zinc-300 font-bold">{inf.commission_rate}%</td>
              <td className="p-6 text-right">
                <button className="text-zinc-600 group-hover:text-white transition-colors"><ChevronRight/></button>
              </td>
            </tr>
          )) : (
            <tr><td colSpan="4" className="p-10 text-center text-zinc-600">Nenhum influenciador encontrado</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function Conversions({ supabase, brandId }) {
  const [list, setList] = useState([]);

  useEffect(() => {
    if (!supabase || !brandId) return;
    const fetch = async () => {
      const { data } = await supabase
        .from('conversions')
        .select('*')
        .eq('brand_id', brandId)
        .order('sale_date', { ascending: false });
      setList(data || []);
    };
    fetch();
  }, [supabase, brandId]);

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden animate-in fade-in duration-500">
      <table className="w-full text-left">
        <thead className="bg-zinc-950 text-[10px] text-zinc-500 font-black uppercase tracking-widest border-b border-zinc-800">
          <tr>
            <th className="p-6">Order ID</th>
            <th className="p-6">Valor Venda</th>
            <th className="p-6">Comissão</th>
            <th className="p-6">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800">
          {list.length > 0 ? list.map((conv) => (
            <tr key={conv.id} className="text-zinc-400">
              <td className="p-6 font-mono text-xs">#{conv.order_id}</td>
              <td className="p-6 text-white font-bold">R$ {conv.order_amount?.toLocaleString() || "0"}</td>
              <td className="p-6 text-indigo-400 font-bold">R$ {conv.commission_amount?.toLocaleString() || "0"}</td>
              <td className="p-6">
                 <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${conv.status === 'paid' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                   {conv.status || 'Pendente'}
                 </span>
              </td>
            </tr>
          )) : (
            <tr><td colSpan="4" className="p-10 text-center text-zinc-600">Nenhuma conversão registrada</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function Coupons({ brandId }) {
  return (
    <div className="p-20 bg-zinc-900/50 border border-dashed border-zinc-800 rounded-3xl text-center animate-in fade-in duration-500">
      <Ticket size={40} className="text-zinc-700 mx-auto mb-4" />
      <h3 className="font-bold text-white mb-2 text-xl">Gestão de Cupons Ativos</h3>
      <p className="text-zinc-500 text-sm max-w-sm mx-auto">
        Os cupons são sincronizados da Nuvemshop via n8n e atribuídos aos criadores na tabela <code className="text-indigo-400">public.coupons</code>.
      </p>
    </div>
  );
}