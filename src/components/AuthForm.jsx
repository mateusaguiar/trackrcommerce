import React, { useState } from 'react';
import { Button } from './Button';

export const AuthForm = ({ onSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError('Por favor, preencha todos os campos');
      return;
    }

    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      // Mock successful login
      console.log('Login attempt:', { email, password });
      setLoading(false);
      setEmail('');
      setPassword('');
      onSuccess();
    }, 1000);
  };

  return (
    <form onSubmit={handleLogin} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-2">E-mail</label>
        <input 
          type="email" 
          placeholder="seu@email.com" 
          className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white placeholder-zinc-500 outline-none focus:border-indigo-500 transition-colors" 
          value={email} 
          onChange={e => setEmail(e.target.value)}
          disabled={loading}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-2">Senha</label>
        <input 
          type="password" 
          placeholder="••••••••" 
          className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white placeholder-zinc-500 outline-none focus:border-indigo-500 transition-colors" 
          value={password} 
          onChange={e => setPassword(e.target.value)}
          disabled={loading}
        />
      </div>
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? 'Entrando...' : 'Entrar'}
      </Button>
      <p className="text-center text-sm text-zinc-400">
        Não tem conta? <a href="#signup" className="text-indigo-400 hover:text-indigo-300">Criar conta</a>
      </p>
    </form>
  );
};

export default AuthForm;
