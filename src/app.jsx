import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Users, 
  Ticket, 
  DollarSign, 
  LayoutDashboard, 
  BarChart3, 
  ChevronRight, 
  X, 
  LogOut,
  AlertCircle
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
 * IMPORTANTE: Para o ambiente do Canvas/Preview, carregamos o Supabase via CDN.
 * No seu ambiente local (GitHub/Vercel), você pode usar:
 * import { createClient } from '@supabase/supabase-js';
 */

export default function App() {
  const [supabase, setSupabase] = useState(null);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [brand, setBrand] = useState(null);
  const [loading, setLoading] = useState(true);
  const [configError, setConfigError] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [view, setView] = useState('landing');
  const [activeTab, setActiveTab] = useState('overview');

  // Variáveis de ambiente com detecção segura
  const SUPABASE_URL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) || window.VITE_SUPABASE_URL || "";
  const SUPABASE_ANON_KEY = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) || window.VITE_SUPABASE_ANON_KEY || "";

  // 1. Inicialização do Cliente e Dependência
  useEffect(() => {
    const loadSupabase = async () => {
      // Se já houver um script de CDN, não adiciona outro
      if (window.supabase) {
        initializeClient();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
      script.async = true;
      script.onload = () => initializeClient();
      document.body.appendChild(script);
    };

    const initializeClient = () => {
      if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        setConfigError(true);
        setLoading(false);
        return;
      }

      try {
        const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        setSupabase(client);
      } catch (err) {
        console.error("Falha ao inicializar Supabase:", err);
        setConfigError(true);
        setLoading(false);
      }
    };

    loadSupabase();
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
      try {
        const { data: prof } = await supabase.from('profiles').select('*').eq('id', authUser.id).single();
        setProfile(prof);

        const { data: bnd } = await supabase.from('brands').select('*').eq('owner_id', authUser.id).limit(1).maybeSingle();
        setBrand(bnd);
        setView('dashboard');
      } catch (e) {
        console.error("Erro ao carregar dados do usuário:", e);
      }
    } else {
      setUser(null);
      setProfile(null);
      setBrand(null);
      setView('landing');
    }
    setLoading(false);
  };

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-indigo-500"></div>
    </div>
  );

  if (configError && !user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6 text-center">
        <div className="max-w-md p-8 bg-zinc-900 border border-zinc-800 rounded-3xl">
          <AlertCircle className="text-amber-500 mx-auto mb-4" size={48} />
          <h2 className="text-xl font-bold text-white mb-2">Configuração do Supabase</h2>
          <p className="text-zinc-400 text-sm mb-6">
            Certifique-se de definir <code className="text-indigo-400">VITE_SUPABASE_URL</code> e <code className="text-indigo-400">VITE_SUPABASE_ANON_KEY</code> no seu arquivo .env ou no painel da Vercel.
          </p>
          <button onClick={() => window.location.reload()} className="w-full bg-indigo-600 p-3 rounded-xl font-bold">Recarregar</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans">
      {view === 'landing' ? (
        <LandingPage onOpenLogin={() => setIsLoginOpen(true)} />
      ) : (
        <Dashboard 
          supabase={supabase}
          profile={profile}
          brand={brand}
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          onLogout={() => supabase.auth.signOut()}
        />
      )}

      <Modal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} title="Acesso TrackrCommerce">
        <AuthForm supabase={supabase} onSuccess={() => setIsLoginOpen(false)} />
      </Modal>
    </div>
  );
}

// --- COMPONENTES AUXILIARES ---

function AuthForm({ supabase, onSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [load, setLoad] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoad(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setErr(error.message); setLoad(false); }
    else onSuccess();
  };

  return (
    <form onSubmit={handleLogin} className="space-y-4">
      {err && <div className="p-3 bg-red-500/10 border border-red-500/50 text-red-500 text-xs rounded-lg">{err}</div>}
      <input type="email" placeholder="E-mail" className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500" value={email} onChange={(e) => setEmail(e.target.value)} required />
      <input type="password" placeholder="Senha" className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500" value={password} onChange={(e) => setPassword(e.target.value)} required />
      <button type="submit" disabled={load} className="w-full bg-indigo-600 p-3 rounded-xl font-bold disabled:opacity-50">{load ? 'Entrando...' : 'Entrar'}</button>
    </form>
  );
}

function Dashboard({ supabase, profile, brand, activeTab, setActiveTab, onLogout }) {
  const menu = [
    { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'influencers', label: 'Influencers', icon: Users },
    { id: 'conversions', label: 'Conversões', icon: DollarSign },
    { id: 'coupons', label: 'Cupons', icon: Ticket },
  ];

  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="w-64 border-r border-zinc-800 p-6 flex flex-col bg-zinc-950/20">
        <div className="flex items-center gap-2 mb-10 font-bold text-lg"><TrendingUp className="text-indigo-500"/> Trackr</div>
        <nav className="flex-1 space-y-2">
          {menu.map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === item.id ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20' : 'text-zinc-500 hover:text-white'}`}>
              <item.icon size={18} /> <span className="text-sm font-semibold">{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="border-t border-zinc-800 pt-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold">{profile?.full_name?.[0]}</div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold truncate">{profile?.full_name || 'Usuário'}</p>
              <p className="text-[10px] text-zinc-500 uppercase">{profile?.role}</p>
            </div>
          </div>
          <button onClick={onLogout} className="flex items-center gap-2 text-zinc-600 hover:text-red-400 text-xs"><LogOut size={14}/> Sair</button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto p-10">
        <header className="mb-10 flex justify-between items-start">
          <div>
            <h2 className="text-3xl font-bold text-white">{brand?.name || 'Marca'}</h2>
            <p className="text-zinc-500 text-sm">Painel de Performance e Conversão</p>
          </div>
          <div className="flex items-center gap-2 bg-emerald-500/10 text-emerald-500 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest"><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div> Sync On</div>
        </header>

        {activeTab === 'overview' && <Overview supabase={supabase} brandId={brand?.id} />}
        {activeTab === 'influencers' && <Influencers supabase={supabase} brandId={brand?.id} />}
        {activeTab === 'conversions' && <Conversions supabase={supabase} brandId={brand?.id} />}
        {activeTab === 'coupons' && <div className="p-20 border border-dashed border-zinc-800 rounded-3xl text-center text-zinc-500">Gestão de Cupons Nuvemshop (Sincronizada via n8n)</div>}
      </main>
    </div>
  );
}

function Overview({ supabase, brandId }) {
  const [data, setData] = useState({ rev: 0, comm: 0, count: 0 });

  const fetch = async () => {
    if (!brandId) return;
    const { data: convs } = await supabase.from('conversions').select('*').eq('brand_id', brandId);
    if (convs) {
      setData({
        rev: convs.reduce((a, b) => a + Number(b.order_amount), 0),
        comm: convs.reduce((a, b) => a + Number(b.commission_amount), 0),
        count: convs.length
      });
    }
  };

  useEffect(() => {
    fetch();
    const sub = supabase.channel('realtime').on('postgres_changes', { event: '*', schema: 'public', table: 'conversions' }, fetch).subscribe();
    return () => supabase.removeChannel(sub);
  }, [brandId]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard label="Faturamento" value={`R$ ${data.rev.toLocaleString()}`} />
        <StatCard label="Comissões" value={`R$ ${data.comm.toLocaleString()}`} color="text-indigo-400" />
        <StatCard label="Vendas" value={data.count.toString()} />
      </div>
      <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl h-[350px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={[{n:'Seg',v:10},{n:'Ter',v:25},{n:'Qua',v:15},{n:'Qui',v:45},{n:'Sex',v:30}]}>
            <defs><linearGradient id="c" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/><stop offset="95%" stopColor="#6366f1" stopOpacity={0}/></linearGradient></defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
            <XAxis dataKey="n" stroke="#52525b" fontSize={10} axisLine={false} tickLine={false} />
            <Area type="monotone" dataKey="v" stroke="#6366f1" fill="url(#c)" strokeWidth={3} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function StatCard({ label, value, color = "text-white" }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl">
      <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-2">{label}</p>
      <h3 className={`text-4xl font-black ${color}`}>{value}</h3>
    </div>
  );
}

function Influencers({ supabase, brandId }) {
  const [list, setList] = useState([]);

  useEffect(() => {
    if (brandId) supabase.from('influencers').select('*').eq('brand_id', brandId).then(({data}) => setList(data || []));
  }, [brandId]);

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden">
      <table className="w-full text-left text-sm">
        <thead className="bg-zinc-950 text-zinc-500 uppercase text-[10px] font-black border-b border-zinc-800">
          <tr><th className="p-6">Nome</th><th className="p-6">Handle</th><th className="p-6">Taxa</th><th className="p-6 text-right">Ações</th></tr>
        </thead>
        <tbody className="divide-y divide-zinc-800">
          {list.map(i => (
            <tr key={i.id} className="hover:bg-white/5 transition-colors">
              <td className="p-6 font-bold text-white">{i.name}</td>
              <td className="p-6 text-indigo-400 font-mono italic">{i.social_handle}</td>
              <td className="p-6 text-zinc-300 font-bold">{i.commission_rate}%</td>
              <td className="p-6 text-right"><ChevronRight size={18} className="text-zinc-700 ml-auto"/></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Conversions({ supabase, brandId }) {
  const [list, setList] = useState([]);

  useEffect(() => {
    if (brandId) supabase.from('conversions').select('*').eq('brand_id', brandId).order('sale_date', {ascending:false}).then(({data}) => setList(data || []));
  }, [brandId]);

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden">
      <table className="w-full text-left text-sm">
        <thead className="bg-zinc-950 text-zinc-500 uppercase text-[10px] font-black border-b border-zinc-800">
          <tr><th className="p-6">Order ID</th><th className="p-6">Valor</th><th className="p-6">Comissão</th><th className="p-6">Status</th></tr>
        </thead>
        <tbody className="divide-y divide-zinc-800">
          {list.map(c => (
            <tr key={c.id} className="text-zinc-400">
              <td className="p-6 font-mono text-white text-xs">#{c.order_id}</td>
              <td className="p-6 font-bold">R$ {Number(c.order_amount).toLocaleString()}</td>
              <td className="p-6 text-indigo-400 font-bold">R$ {Number(c.commission_amount).toLocaleString()}</td>
              <td className="p-6">
                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${c.status === 'paid' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>{c.status}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function LandingPage({ onOpenLogin }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-900 to-black">
      <h1 className="text-7xl font-black mb-8 tracking-tighter">Trackr<span className="text-indigo-600">Commerce.</span></h1>
      <p className="text-xl text-zinc-500 max-w-xl mb-12">Potencialize suas vendas na Nuvemshop com gestão profissional de influenciadores e atribuição real.</p>
      <button onClick={onOpenLogin} className="bg-white text-black px-12 py-4 rounded-2xl font-black text-lg hover:scale-105 transition-transform">Começar Agora</button>
    </div>
  );
}

function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-md p-8 relative shadow-2xl" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-6 right-6 text-zinc-500 hover:text-white"><X size={20}/></button>
        <h3 className="text-2xl font-bold mb-6">{title}</h3>
        {children}
      </div>
    </div>
  );
}