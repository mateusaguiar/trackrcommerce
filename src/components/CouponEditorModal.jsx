import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from './Button';
import { dataFunctions, getErrorMessage } from '../lib/supabaseClient';

export function CouponEditorModal({ coupon, classifications, isOpen, onClose, onUpdate }) {
  const [selectedClassification, setSelectedClassification] = useState(coupon?.classification || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    try {
      setLoading(true);
      setError('');

      if (!selectedClassification) {
        setError('Selecione uma classificação');
        setLoading(false);
        return;
      }

      const result = await dataFunctions.assignCouponClassification(coupon.id, selectedClassification);
      if (result.error) throw new Error(result.error);

      onUpdate?.();
      onClose();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !coupon) return null;

  const selectedClassificationData = classifications.find(c => c.id === selectedClassification);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 border border-zinc-700 rounded-lg max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-700">
          <h2 className="text-lg font-bold">Editar Classificação do Cupom</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-800 rounded-lg transition text-zinc-400 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Coupon Info */}
          <div className="p-3 bg-zinc-800/50 border border-zinc-700 rounded-lg">
            <p className="text-xs text-zinc-400">Cupom</p>
            <p className="font-mono font-bold text-indigo-400 text-lg">{coupon.code}</p>
          </div>

          {/* Classification Selector */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Classificação
            </label>
            <select
              value={selectedClassification}
              onChange={(e) => setSelectedClassification(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded text-white focus:border-indigo-500 focus:outline-none"
              disabled={loading}
            >
              <option value="">Selecione uma classificação</option>
              {classifications.map((classification) => (
                <option key={classification.id} value={classification.id}>
                  {classification.name}
                </option>
              ))}
            </select>
          </div>

          {/* Preview */}
          {selectedClassificationData && (
            <div className="p-3 bg-zinc-800/50 border border-zinc-700 rounded-lg">
              <p className="text-xs text-zinc-400 mb-2">Prévia</p>
              <div className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: selectedClassificationData.color }}
                />
                <span className="font-medium">{selectedClassificationData.name}</span>
              </div>
              {selectedClassificationData.description && (
                <p className="text-xs text-zinc-400 mt-2">{selectedClassificationData.description}</p>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button variant="primary" onClick={handleSave} disabled={loading || !selectedClassification}>
              Salvar
            </Button>
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded text-sm font-medium transition disabled:opacity-50"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
