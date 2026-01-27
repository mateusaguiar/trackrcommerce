import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Ticket } from 'lucide-react';

export function TopUTMSourcesCard({ data, loading, error }) {
  if (loading) {
    return (
      <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-zinc-400">Top 10 UTM_Source</h3>
          <div className="p-2 bg-blue-500/10 rounded-lg">
            <Ticket className="text-blue-500" size={20} />
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
      <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-zinc-400">Top 10 UTM_Source</h3>
          <div className="p-2 bg-blue-500/10 rounded-lg">
            <Ticket className="text-blue-500" size={20} />
          </div>
        </div>
        <div className="h-64 flex items-center justify-center">
          <p className="text-zinc-500">{error || 'Sem dados disponíveis'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-zinc-400">Top 10 UTM_Source</h3>
        <div className="p-2 bg-blue-500/10 rounded-lg">
          <Ticket className="text-blue-500" size={20} />
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart 
          data={data}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 70, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
          <XAxis type="number" stroke="#a1a1aa" style={{ fontSize: '12px' }} />
          <YAxis 
            dataKey="code" 
            type="category" 
            stroke="#a1a1aa"
            style={{ fontSize: '12px' }}
            width={65}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#27272a',
              border: '1px solid #52525b',
              borderRadius: '8px',
            }}
            formatter={(value) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          />
          <Bar dataKey="revenue" fill="#10b981" radius={[0, 8, 8, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
