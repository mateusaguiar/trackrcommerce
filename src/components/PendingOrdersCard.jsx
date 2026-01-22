import React from 'react';
import { AlertCircle } from 'lucide-react';
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

  const { revenue = 0, count = 0, dailyChart = [] } = data || {};

  return (
    <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-zinc-400">Pedidos Pendentes</h3>
        <div className="p-2 bg-orange-500/10 rounded-lg">
          <AlertCircle className="text-orange-500" size={20} />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <p className="text-xs text-zinc-500 mb-1">Receita Pendente</p>
          <p className="text-2xl font-bold text-orange-400">
            R$ {revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
        
        <div>
          <p className="text-xs text-zinc-500 mb-1">Quantidade de Pedidos</p>
          <p className="text-2xl font-bold text-zinc-300">
            {count}
          </p>
        </div>
      </div>

      {dailyChart && dailyChart.length > 0 ? (
        <ResponsiveContainer width="100%" height={200}>
          <ComposedChart data={dailyChart} margin={{ top: 10, right: 80, left: -20, bottom: 15 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
            <XAxis 
              dataKey="date" 
              stroke="#a1a1aa"
              style={{ fontSize: '11px' }}
            />
            <YAxis
              yAxisId="left"
              stroke="#a1a1aa"
              style={{ fontSize: '11px' }}
              tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              stroke="#a1a1aa"
              style={{ fontSize: '11px' }}
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
            />
            <Bar yAxisId="left" dataKey="receita" fill="#f97316" radius={[8, 8, 0, 0]} />
            <Line yAxisId="right" type="monotone" dataKey="pedidos" stroke="#ec4899" strokeWidth={2} dot={{ fill: '#ec4899', r: 3 }} />
          </ComposedChart>
        </ResponsiveContainer>
      ) : null}
    </div>
  );
}
