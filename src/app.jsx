import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, Users, Ticket, DollarSign, LayoutDashboard, 
  BarChart3, ChevronRight, Check, X, LogOut, ShoppingBag, 
  Instagram, Wallet, AlertCircle 
} from 'lucide-react';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area 
} from 'recharts';
import { createClient } from '@supabase/supabase-js';

// --- CONFIGURAÇÃO ---
// No Vite/Vercel, as variáveis DEVEM começar com VITE_
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Inicializa o cliente fora do componente para evitar múltiplas instâncias
const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

// --- COMPONENTES AUXILIARES ---

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        <div className="flex justify-between items-center p-6 border-b border-zinc-800">
          <h3 className="text-xl font-bold text-white">{title}</h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-white"><X size={20} /></button>
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
  };
  return (
    <button className={`px-5 py-2.5 rounded-xl font-medium transition-all active:scale-95 flex items-center justify-center gap-2 ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

// --- APP ---

export default function App() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [brand, setBrand] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [view, setView] = useState('landing');
  const [activeTab, setActiveTab] = useState('overview');
  const [accessError, setAccessError] = useState(null);

  // ============================================
  // ROLE-BASED ACCESS CONTROL
  // ============================================
  const ALLOWED_DASHBOARD_ROLES = ['master', 'brand_admin', 'influencer'];

  const checkUserRole = (profile) => {
    if (!profile) {
      return {
        hasAccess: false,
        error: 'Perfil não encontrado. Por favor, entre em contato com o suporte.',
      };
    }

    if (!profile.role) {
      return {
        hasAccess: false,
        error: 'Função de usuário não definida. Por favor, entre em contato com o suporte.',
      };
    }

    if (!ALLOWED_DASHBOARD_ROLES.includes(profile.role)) {
      return {
        hasAccess: false,
        error: `Acesso negado. Sua função (${profile.role}) não tem permissão para acessar o dashboard.`,
      };
    }

    return { hasAccess: true, error: null };
  };

  useEffect(() => {
    // Timeout de segurança: se o Supabase demorar muito, mostra a landing page
    const timer = setTimeout(() => setLoading(false), 3000);

    if (!supabase) {
      setLoading(false);
      return;
    }

    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await fetchUserData(session.user);
      }
      setLoading(false);
      clearTimeout(timer);
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChanged((_event, session) => {
      if (session?.user) fetchUserData(session.user);
      else {
        setUser(null);
        setView('landing');
      }
    });

    return () => {
      subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  const fetchUserData = async (authUser) => {
    setUser(authUser);
    const { data: prof } = await supabase.from('profiles').select('*').eq('id', authUser.id).maybeSingle();
    setProfile(prof);

    // ============================================
    // CHECK ROLE BEFORE ALLOWING DASHBOARD ACCESS
    // ============================================
    const roleCheck = checkUserRole(prof);

    if (!roleCheck.hasAccess) {
      setAccessError(roleCheck.error);
      setView('access-denied');
      return;
    }

    // Only fetch brands if user has access
    const { data: bnd } = await supabase.from('brands').select('*').eq('owner_id', authUser.id).maybeSingle();
    setBrand(bnd);
    setAccessError(null);
    setView('dashboard');
  };

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-indigo-500"></div>
        <p className="text-zinc-500 text-sm font-medium animate-pulse">Iniciando TrackrCommerce...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans">
      {!supabase && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 p-2 text-center text-xs text-amber-500 font-bold">
          Modo Demo: Variáveis do Supabase não configuradas no Vercel/GitHub.
        </div>
      )}

      {view === 'landing' ? (
        <LandingPage onOpenLogin={() => setIsLoginOpen(true)} />
      ) : view === 'access-denied' ? (
        <AccessDenied message={accessError} onLogout={() => {
          supabase.auth.signOut();
          setView('landing');
          setAccessError(null);
        }} />
      ) : (
        <Dashboard 
          profile={profile}
          brand={brand}
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          onLogout={() => supabase.auth.signOut()}
        />
      )}

      <Modal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} title="Acessar Painel">
        <AuthForm onSuccess={() => setIsLoginOpen(false)} />
      </Modal>
    </div>
  );
}

// --- SUB-COMPONENTES (RESUMIDOS PARA FOCO NA LÓGICA) ---

function AccessDenied({ message, onLogout }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-black flex items-center justify-center p-4">
      <div className="max-w-md text-center">
        <div className="mb-6 flex justify-center">
          <AlertCircle size={64} className="text-red-500" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-4">Acesso Negado</h1>
        <p className="text-zinc-400 mb-8 text-lg">{message}</p>
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 mb-8">
          <p className="text-sm text-zinc-300">
            <strong>Funções permitidas:</strong>
            <br />
            • Master Admin
            <br />
            • Brand Admin
            <br />
            • Influencer
          </p>
        </div>
        <Button onClick={onLogout} variant="secondary" className="w-full">
          <LogOut size={18} /> Sair e Voltar
        </Button>
      </div>
    </div>
  );
}

function LandingPage({ onOpenLogin }) {
  return (
    <div className="relative min-h-screen bg-gradient-to-br from-black via-zinc-900 to-black">
      {/* Navigation */}
      <header className="fixed w-full top-0 z-40 bg-black/80 backdrop-blur-md border-b border-zinc-800">
        <div className="h-20 flex items-center justify-between px-8 max-w-7xl mx-auto w-full">
          <div className="flex items-center gap-2 font-bold text-2xl text-white">
            <TrendingUp className="text-indigo-500" size={28} /> TrackrCommerce
          </div>
          <Button onClick={onOpenLogin} variant="outline">Entrar</Button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="pt-40">
        <div className="max-w-6xl mx-auto px-8 text-center pb-24">
          <div className="inline-block mb-6 px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full">
            <p className="text-sm text-indigo-400 font-semibold">🚀 Plataforma Completa de Gestão</p>
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-white mb-6 leading-tight">
            Gerencie suas métricas e <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500">influenciadores</span> em tempo real.
          </h1>
          <p className="text-xl text-zinc-400 mb-12 max-w-3xl mx-auto leading-relaxed">
            TrackrCommerce é a solução definitiva para e-commerce que vendem através de influenciadores. Gerencie seus dados de Nuvemshop, rastreie ROI de influenciadores e otimize sua estratégia de marketing.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-20">
            <Button className="py-4 px-10 text-lg" onClick={onOpenLogin}>Testar Agora</Button>
            <Button variant="secondary" className="py-4 px-10 text-lg">Saber Mais</Button>
          </div>
        </div>

        {/* Features Section */}
        <div className="max-w-6xl mx-auto px-8 py-20 border-t border-zinc-800">
          <h2 className="text-4xl font-bold text-white text-center mb-16">Por que escolher TrackrCommerce?</h2>
          <div className="grid md:grid-cols-3 gap-8 mb-20">
            {[
              {
                icon: <Ticket size={24} />,
                title: 'Rastreamento de Influenciadores',
                desc: 'Saiba exatamente qual influenciador está gerando mais vendas com nosso sistema de tracking inteligente.'
              },
              {
                icon: <DollarSign size={24} />,
                title: 'ROI em Tempo Real',
                desc: 'Visualize o retorno sobre investimento de cada campanha com influenciadores em segundos.'
              },
              {
                icon: <BarChart3 size={24} />,
                title: 'Análise Detalhada',
                desc: 'Gráficos e relatórios completos sobre performance, conversões e métricas de engajamento.'
              },
              {
                icon: <ShoppingBag size={24} />,
                title: 'Integração Nuvemshop',
                desc: 'Conecte diretamente com sua loja na Nuvemshop para sincronização automática de dados.'
              },
              {
                icon: <Users size={24} />,
                title: 'Gestão de Equipe',
                desc: 'Convide colaboradores para gerenciar campanhas e ter visibilidade compartilhada.'
              },
              {
                icon: <TrendingUp size={24} />,
                title: 'Previsões e Tendências',
                desc: 'IA-powered insights para prever tendências e otimizar suas campanhas futuras.'
              }
            ].map((feature, i) => (
              <div key={i} className="p-6 bg-zinc-900/50 border border-zinc-800 hover:border-indigo-500/50 rounded-2xl transition-all hover:shadow-lg hover:shadow-indigo-500/10">
                <div className="text-indigo-500 mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-zinc-400 text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Pricing Section */}
        <div className="max-w-6xl mx-auto px-8 py-20 border-t border-zinc-800">
          <h2 className="text-4xl font-bold text-white text-center mb-16">Planos Simples e Transparentes</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { name: 'Starter', price: '29', features: ['Até 5 influenciadores', 'Dashboard básico', 'Suporte por email', 'Integração Nuvemshop'] },
              { name: 'Pro', price: '79', features: ['Influenciadores ilimitados', 'Analytics avançada', 'Suporte prioritário', 'API access', 'Relatórios personalizados'], highlighted: true },
              { name: 'Enterprise', price: 'Custom', features: ['Solução customizada', 'Suporte dedicado', 'Integração n8n', 'SSO/SAML', 'SLA garantido'] }
            ].map((plan, i) => (
              <div key={i} className={`p-8 rounded-2xl border transition-all ${
                plan.highlighted 
                  ? 'bg-gradient-to-b from-indigo-600/20 to-indigo-900/10 border-indigo-500/50 shadow-lg shadow-indigo-500/20 transform md:scale-105'
                  : 'bg-zinc-900/30 border-zinc-800 hover:border-zinc-700'
              }`}>
                <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                <div className="mb-6"><span className="text-4xl font-black text-white">R$ {plan.price}</span><span className="text-zinc-400 text-sm">/mês</span></div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, j) => (
                    <li key={j} className="flex items-center gap-2 text-zinc-300">
                      <Check size={18} className="text-indigo-500" /> {feature}
                    </li>
                  ))}
                </ul>
                <Button className="w-full" variant={plan.highlighted ? 'primary' : 'secondary'}>Começar Agora</Button>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="max-w-4xl mx-auto px-8 py-20 border-t border-zinc-800 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">Pronto para escalar seu e-commerce?</h2>
          <p className="text-xl text-zinc-400 mb-10">Junte-se a centenas de lojas que já estão usando TrackrCommerce para maximizar seu ROI.</p>
          <Button className="py-4 px-10 text-lg" onClick={onOpenLogin}>Começar Teste Gratuito</Button>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800 py-12 px-8 text-center text-zinc-500 text-sm">
        <p>© 2025 TrackrCommerce. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}

function AuthForm({ onSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!supabase) return;
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { alert(error.message); setLoading(false); }
    else onSuccess();
  };

  return (
    <form onSubmit={handleLogin} className="space-y-4">
      <input type="email" placeholder="E-mail" className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 outline-none" value={email} onChange={e => setEmail(e.target.value)} />
      <input type="password" placeholder="Senha" className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 outline-none" value={password} onChange={e => setPassword(e.target.value)} />
      <Button type="submit" disabled={loading} className="w-full">{loading ? 'Entrando...' : 'Entrar'}</Button>
    </form>
  );
}

function Dashboard({ profile, brand, activeTab, setActiveTab, onLogout }) {
  return (
    <div className="flex h-screen bg-black">
      <aside className="w-64 border-r border-zinc-800 p-6 flex flex-col">
        <div className="font-bold text-xl mb-10 text-white flex items-center gap-2"><TrendingUp size={20}/> Trackr</div>
        <nav className="space-y-2 flex-1">
          {['overview', 'influencers', 'conversions'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`w-full text-left px-4 py-2 rounded-lg capitalize ${activeTab === tab ? 'bg-indigo-600 text-white' : 'text-zinc-500 hover:text-white'}`}>
              {tab}
            </button>
          ))}
        </nav>
        <div className="pt-6 border-t border-zinc-800">
           <p className="text-xs font-bold text-white mb-4">{profile?.full_name || 'Usuário'}</p>
           <button onClick={onLogout} className="text-xs text-zinc-500 hover:text-red-400 flex items-center gap-2"><LogOut size={14}/> Sair</button>
        </div>
      </aside>
      <main className="flex-1 p-10 overflow-y-auto">
        <h2 className="text-2xl font-bold text-white mb-2">{brand?.name || 'Visão Geral'}</h2>
        <div className="bg-zinc-900 border border-zinc-800 p-10 rounded-3xl text-center">
          <p className="text-zinc-500">Dados do Supabase serão renderizados aqui.</p>
        </div>
      </main>
    </div>
  );
}