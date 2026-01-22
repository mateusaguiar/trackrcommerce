import React from 'react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp } from 'lucide-react';

export function DailyRevenueCard({ data, loading, error }) {
  if (loading) {
    return (
      <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700 rounded-lg p-6 col-span-1 md:col-span-2 lg:col-span-2">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-zinc-400">Vendas Totais</h3>
          <div className="p-2 bg-indigo-500/10 rounded-lg">
            <TrendingUp className="text-indigo-500" size={20} />
          </div>
        </div>
        <div className="h-64 flex items-center justify-center">
          <p className="text-zinc-500">Carregando...</p>
        </div>
      </div>
    );
  }

  if (error || !data || data.length === 0) {
    return (
      <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700 rounded-lg p-6 col-span-1 md:col-span-2 lg:col-span-2">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-zinc-400">Vendas Totais</h3>
          <div className="p-2 bg-indigo-500/10 rounded-lg">
            <TrendingUp className="text-indigo-500" size={20} />
          </div>
        </div>
        <div className="h-64 flex items-center justify-center">
          <p className="text-zinc-500">{error || 'Sem dados disponíveis'}</p>
        </div>
      </div>
    );
  }

  // Calculate total revenue and orders
  const totalRevenue = data.reduce((sum, item) => sum + item.receita, 0);
  const totalOrders = data.reduce((sum, item) => sum + item.pedidos, 0);

  return (
    <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700 rounded-lg p-6 col-span-1 md:col-span-2 lg:col-span-2">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-zinc-400">Vendas Totais</h3>
        <div className="p-2 bg-indigo-500/10 rounded-lg">
          <TrendingUp className="text-indigo-500" size={20} />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-xs text-zinc-500 mb-1">Receita</p>
          <p className="text-2xl font-bold text-indigo-400">
            R$ {totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div>
          <p className="text-xs text-zinc-500 mb-1">Total de Pedidos</p>
          <p className="text-2xl font-bold text-zinc-300">
            {totalOrders}
          </p>
        </div>
      </div>
      
      <ResponsiveContainer width="100%" height={260}>
        <ComposedChart data={data} margin={{ top: 20, right: 80, left: 0, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
          <XAxis 
            dataKey="date" 
            stroke="#a1a1aa"
            style={{ fontSize: '12px' }}
          />
          <YAxis
            yAxisId="left"
            stroke="#a1a1aa"
            style={{ fontSize: '12px' }}
            tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            stroke="#a1a1aa"
            style={{ fontSize: '12px' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#27272a',
              border: '1px solid #52525b',
              borderRadius: '8px',
            }}
            formatter={(value, name) => {
              if (name === 'receita') return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
              if (name === 'pedidos') return `${value} pedido${value !== 1 ? 's' : ''}`;
              return value;
            }}
            labelFormatter={(label) => `${label}`}
          />
          <Bar yAxisId="left" dataKey="receita" fill="#4f46e5" radius={[8, 8, 0, 0]} />
          <Line yAxisId="right" type="monotone" dataKey="pedidos" stroke="#7d79d1" strokeWidth={2} dot={{ fill: '#7d79d1', r: 4 }} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
