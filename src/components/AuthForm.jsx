import React, { useState } from 'react';
import { Button } from './Button.jsx';
import { authFunctions, getErrorMessage, supabase } from '../lib/supabaseClient.js';
import { AlertCircle } from 'lucide-react';

export const AuthForm = ({ onSuccess }) => {
  const [mode, setMode] = useState('login'); // login or signup
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!email || !password) {
      setError('Por favor, preencha todos os campos');
      return;
    }

    if (!supabase) {
      setError('Supabase não está configurado. Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no Vercel.');
      return;
    }

    setLoading(true);
    
    const { user, session, error: authError } = await authFunctions.logIn(email, password);
    
    if (authError) {
      setError(getErrorMessage(authError));
      setLoading(false);
      return;
    }

    setSuccess('Login bem-sucedido! Redirecionando...');
    setEmail('');
    setPassword('');
    
    setTimeout(() => {
      onSuccess();
      setLoading(false);
    }, 1500);
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!email || !password || !fullName) {
      setError('Por favor, preencha todos os campos');
      return;
    }

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    if (!supabase) {
      setError('Supabase não está configurado. Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no Vercel.');
      return;
    }

    setLoading(true);
    
    const { user, error: authError } = await authFunctions.signUp(
      email,
      password,
      fullName,
      'user'
    );
    
    if (authError) {
      setError(getErrorMessage(authError));
      setLoading(false);
      return;
    }

    setSuccess('Conta criada com sucesso! Faça login com suas credenciais.');
    setEmail('');
    setPassword('');
    setFullName('');
    
    setTimeout(() => {
      setMode('login');
      setSuccess('');
      setLoading(false);
    }, 2000);
  };

  return (
    <form onSubmit={mode === 'login' ? handleLogin : handleSignUp} className="space-y-4">
      {/* Mode Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          type="button"
          onClick={() => { setMode('login'); setError(''); setSuccess(''); }}
          className={`flex-1 py-2 rounded-lg font-medium transition-all ${
            mode === 'login'
              ? 'bg-indigo-600 text-white'
              : 'bg-zinc-800 text-zinc-400 hover:text-white'
          }`}
        >
          Entrar
        </button>
        <button
          type="button"
          onClick={() => { setMode('signup'); setError(''); setSuccess(''); }}
          className={`flex-1 py-2 rounded-lg font-medium transition-all ${
            mode === 'signup'
              ? 'bg-indigo-600 text-white'
              : 'bg-zinc-800 text-zinc-400 hover:text-white'
          }`}
        >
          Criar Conta
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm flex items-start gap-2">
          <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 text-sm">
          {success}
        </div>
      )}

      {/* Demo Warning if Supabase not configured */}
      {!supabase && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-400 text-sm flex items-start gap-2">
          <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
          <span>Modo Demo: Configure Supabase no Vercel para usar autenticação real.</span>
        </div>
      )}

      {/* Full Name (Sign Up only) */}
      {mode === 'signup' && (
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">Nome Completo</label>
          <input 
            type="text" 
            placeholder="Seu nome" 
            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white placeholder-zinc-500 outline-none focus:border-indigo-500 transition-colors" 
            value={fullName} 
            onChange={e => setFullName(e.target.value)}
            disabled={loading}
          />
        </div>
      )}

      {/* Email */}
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-2">E-mail</label>
        <input 
          type="email" 
          placeholder="seu@email.com" 
          className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white placeholder-zinc-500 outline-none focus:border-indigo-500 transition-colors" 
          value={email} 
          onChange={e => setEmail(e.target.value)}
          disabled={loading || !supabase}
        />
      </div>

      {/* Password */}
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-2">Senha</label>
        <input 
          type="password" 
          placeholder="••••••••" 
          className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white placeholder-zinc-500 outline-none focus:border-indigo-500 transition-colors" 
          value={password} 
          onChange={e => setPassword(e.target.value)}
          disabled={loading || !supabase}
        />
        {mode === 'signup' && (
          <p className="text-xs text-zinc-500 mt-1">Mínimo 6 caracteres</p>
        )}
      </div>

      {/* Submit Button */}
      <Button 
        type="submit" 
        disabled={loading || !supabase} 
        className="w-full"
      >
        {loading ? 'Processando...' : (mode === 'login' ? 'Entrar' : 'Criar Conta')}
      </Button>

      {/* Demo Login Button (when Supabase not configured) */}
      {!supabase && (
        <Button 
          type="button" 
          variant="secondary"
          onClick={() => {
            setSuccess('Demo login simulado!');
            setTimeout(() => {
              onSuccess();
            }, 1000);
          }}
          className="w-full"
        >
          Demo Login (sem Supabase)
        </Button>
      )}

      {/* Footer Links */}
      {mode === 'login' && (
        <p className="text-center text-sm text-zinc-400">
          Não tem conta? <button type="button" onClick={() => setMode('signup')} className="text-indigo-400 hover:text-indigo-300 font-medium">Criar uma</button>
        </p>
      )}
      {mode === 'signup' && (
        <p className="text-center text-sm text-zinc-400">
          Já tem conta? <button type="button" onClick={() => setMode('login')} className="text-indigo-400 hover:text-indigo-300 font-medium">Fazer login</button>
        </p>
      )}
    </form>
  );
};

export default AuthForm;
