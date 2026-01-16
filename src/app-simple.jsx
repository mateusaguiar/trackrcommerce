import React, { useState } from 'react';
import { TrendingUp, Ticket, DollarSign, BarChart3, ShoppingBag, Users } from 'lucide-react';
import { Button } from './components/Button.jsx';
import { Modal } from './components/Modal.jsx';
import { AuthForm } from './components/AuthForm.jsx';

export default function App() {
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-black text-white">
      {/* Header */}
      <header className="fixed w-full top-0 z-40 bg-black/80 backdrop-blur-md border-b border-zinc-800">
        <div className="h-20 flex items-center justify-between px-8 max-w-7xl mx-auto w-full">
          <div className="flex items-center gap-2 font-bold text-2xl">
            <TrendingUp className="text-indigo-500" size={28} /> TrackrCommerce
          </div>
          <Button variant="outline" onClick={() => setIsLoginOpen(true)}>
            Entrar
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="pt-40">
        <div className="max-w-6xl mx-auto px-8 text-center pb-24">
          <div className="inline-block mb-6 px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full">
            <p className="text-sm text-indigo-400 font-semibold">🚀 Plataforma Completa para Gestão do seu e-Commerce</p>
          </div>
          <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight">
            Acompanhe as métricas do seu <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500">e-Commerce</span> e dos seus <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500">influenciadores</span> em tempo real.
          </h1>
          <p className="text-xl text-zinc-400 mb-12 max-w-3xl mx-auto leading-relaxed">
            TrackrCommerce é a solução definitiva para e-commerce que vendem através de influenciadores. Gerencie seus dados, rastreie ROI e otimize sua estratégia.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-20">
            <Button className="py-4 px-10 text-lg" onClick={() => setIsLoginOpen(true)}>
              Testar Agora
            </Button>
            <Button variant="secondary" className="py-4 px-10 text-lg">
              Saber Mais
            </Button>
          </div>
        </div>

        {/* Features Section */}
        <div className="max-w-6xl mx-auto px-8 py-20 border-t border-zinc-800">
          <h2 className="text-4xl font-bold text-center mb-16">Por que escolher TrackrCommerce?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: <Ticket size={24} />, title: 'Rastreamento', desc: 'Saiba qual influenciador gera mais vendas.' },
              { icon: <DollarSign size={24} />, title: 'ROI Real', desc: 'Visualize retorno de investimento em segundos.' },
              { icon: <BarChart3 size={24} />, title: 'Análise', desc: 'Relatórios completos sobre performance.' },
              { icon: <ShoppingBag size={24} />, title: 'Integração', desc: 'Conecte com Nuvemshop automaticamente.' },
              { icon: <Users size={24} />, title: 'Equipe', desc: 'Convide colaboradores para gerenciar.' },
              { icon: <TrendingUp size={24} />, title: 'Tendências', desc: 'IA-powered insights para campanhas.' }
            ].map((feature, i) => (
              <div key={i} className="p-6 bg-zinc-900/50 border border-zinc-800 hover:border-indigo-500/50 rounded-2xl transition-all">
                <div className="text-indigo-500 mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                <p className="text-zinc-400 text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Pricing Section */}
        <div className="max-w-6xl mx-auto px-8 py-20 border-t border-zinc-800">
          <h2 className="text-4xl font-bold text-center mb-16">Planos Simples e Transparentes</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { name: 'Starter', price: '29', highlighted: false },
              { name: 'Pro', price: '79', highlighted: true },
              { name: 'Enterprise', price: 'Custom', highlighted: false }
            ].map((plan, i) => (
              <div key={i} className={`p-8 rounded-2xl border transition-all ${
                plan.highlighted 
                  ? 'bg-gradient-to-b from-indigo-600/20 to-indigo-900/10 border-indigo-500/50 shadow-lg shadow-indigo-500/20 transform md:scale-105'
                  : 'bg-zinc-900/30 border-zinc-800'
              }`}>
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <div className="mb-6"><span className="text-4xl font-black">R$ {plan.price}</span><span className="text-zinc-400 text-sm">/mês</span></div>
                <Button variant={plan.highlighted ? 'primary' : 'secondary'} className="w-full">
                  Começar
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="max-w-4xl mx-auto px-8 py-20 border-t border-zinc-800 text-center">
          <h2 className="text-4xl font-bold mb-6">Pronto para escalar seu e-commerce?</h2>
          <p className="text-xl text-zinc-400 mb-10">Junte-se a centenas de lojas usando TrackrCommerce.</p>
          <Button className="py-4 px-10 text-lg" onClick={() => setIsLoginOpen(true)}>
            Começar Teste Gratuito
          </Button>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800 py-12 px-8 text-center text-zinc-500 text-sm">
        <p>© 2025 TrackrCommerce. Todos os direitos reservados.</p>
      </footer>

      {/* Auth Modal */}
      <Modal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} title="Acessar Painel">
        <AuthForm onSuccess={() => {
          setIsLoginOpen(false);
          alert('Login bem-sucedido! (Demo mode - sem Supabase por enquanto)');
        }} />
      </Modal>
    </div>
  );
}
