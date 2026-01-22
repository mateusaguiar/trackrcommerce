import React from 'react';
import { AlertCircle } from 'lucide-react';

export function PendingOrdersCard({ data, loading, error }) {
  if (loading) {
    return (
      <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-zinc-400">Pedidos Pendentes</h3>
          <div className="p-2 bg-orange-500/10 rounded-lg">
            <AlertCircle className="text-orange-500" size={20} />
          </div>
        </div>
        <div className="py-12 flex items-center justify-center">
          <p className="text-zinc-500">Carregando...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-zinc-400">Pedidos Pendentes</h3>
          <div className="p-2 bg-orange-500/10 rounded-lg">
            <AlertCircle className="text-orange-500" size={20} />
          </div>
        </div>
        <div className="py-12 flex items-center justify-center">
          <p className="text-zinc-500">{error}</p>
        </div>
      </div>
    );
  }

  const { revenue = 0, count = 0 } = data || {};

  return (
    <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-zinc-400">Pedidos Pendentes</h3>
        <div className="p-2 bg-orange-500/10 rounded-lg">
          <AlertCircle className="text-orange-500" size={20} />
        </div>
      </div>
      
      <div className="space-y-4">
        <div>
          <p className="text-xs text-zinc-500 mb-1">Receita Pendente</p>
          <p className="text-3xl font-bold text-orange-400">
            R$ {revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
        
        <div className="pt-2 border-t border-zinc-700">
          <p className="text-xs text-zinc-500 mb-1">Quantidade de Pedidos</p>
          <p className="text-2xl font-bold text-zinc-300">
            {count} {count === 1 ? 'pedido' : 'pedidos'}
          </p>
        </div>
      </div>
    </div>
  );
}
