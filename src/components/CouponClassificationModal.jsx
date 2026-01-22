import React, { useState, useEffect } from 'react';
import { X, Plus, Edit2, Trash2 } from 'lucide-react';
import { Button } from './Button';
import { dataFunctions, getErrorMessage } from '../lib/supabaseClient';

export function CouponClassificationModal({ brandId, isOpen, onClose, onUpdate }) {
  const [classifications, setClassifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '', color: '#6366f1' });

  useEffect(() => {
    if (isOpen && brandId) {
      loadClassifications();
    }
  }, [isOpen, brandId]);

  const loadClassifications = async () => {
    try {
      setLoading(true);
      setError('');
      const result = await dataFunctions.getCouponClassifications(brandId);
      if (result.error) throw new Error(result.error);
      setClassifications(result.classifications || []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Nome da classificação é obrigatório');
      return;
    }

    try {
      setLoading(true);
      setError('');

      if (editingId) {
        const result = await dataFunctions.updateCouponClassificationItem(editingId, formData);
        if (result.error) throw new Error(result.error);
      } else {
        const result = await dataFunctions.createCouponClassification(brandId, formData);
        if (result.error) throw new Error(result.error);
      }

      resetForm();
      await loadClassifications();
      onUpdate?.();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (classificationId) => {
    if (!window.confirm('Tem certeza que deseja deletar esta classificação?')) return;

    try {
      setLoading(true);
      const result = await dataFunctions.deleteCouponClassification(classificationId);
      if (result.error) throw new Error(result.error);
      await loadClassifications();
      onUpdate?.();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (classification) => {
    setEditingId(classification.id);
    setFormData({
      name: classification.name,
      description: classification.description || '',
      color: classification.color || '#6366f1',
    });
    setIsAddingNew(true);
  };

  const resetForm = () => {
    setFormData({ name: '', description: '', color: '#6366f1' });
    setEditingId(null);
    setIsAddingNew(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 border border-zinc-700 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between p-6 border-b border-zinc-700 bg-zinc-900/95">
          <h2 className="text-xl font-bold">Gerenciar Classificações de Cupons</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-800 rounded-lg transition text-zinc-400 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Form for adding/editing */}
          {isAddingNew && (
            <form onSubmit={handleSubmit} className="p-4 bg-zinc-800/50 border border-zinc-700 rounded-lg space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Nome da Classificação *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Influencer, Embaixador Orgânico"
                  className="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded text-white placeholder-zinc-400 focus:border-indigo-500 focus:outline-none"
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Descrição (opcional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Ex: Cupons de influenciadores pagos"
                  rows={2}
                  className="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded text-white placeholder-zinc-400 focus:border-indigo-500 focus:outline-none"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Cor
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-12 h-10 rounded cursor-pointer"
                    disabled={loading}
                  />
                  <span className="text-sm text-zinc-400 font-mono">{formData.color}</span>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button variant="primary" type="submit" disabled={loading}>
                  {editingId ? 'Atualizar' : 'Criar'} Classificação
                </Button>
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={loading}
                  className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 border border-zinc-600 rounded text-sm font-medium transition disabled:opacity-50"
                >
                  Cancelar
                </button>
              </div>
            </form>
          )}

          {/* Add New Button */}
          {!isAddingNew && (
            <button
              onClick={() => setIsAddingNew(true)}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm font-medium transition disabled:opacity-50"
            >
              <Plus size={18} />
              Nova Classificação
            </button>
          )}

          {/* Classifications List */}
          <div className="space-y-2">
            {loading && !classifications.length ? (
              <p className="text-zinc-400 text-center py-8">Carregando classificações...</p>
            ) : classifications.length === 0 ? (
              <p className="text-zinc-400 text-center py-8">Nenhuma classificação criada</p>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-zinc-500 font-medium">CLASSIFICAÇÕES ATIVAS ({classifications.length})</p>
                {classifications.map((classification) => (
                  <div
                    key={classification.id}
                    className="flex items-center justify-between p-4 bg-zinc-800 border border-zinc-700 rounded-lg hover:bg-zinc-800/80 transition"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div
                        className="w-4 h-4 rounded flex-shrink-0"
                        style={{ backgroundColor: classification.color }}
                        title={classification.color}
                      />
                      <div className="flex-1">
                        <p className="font-medium text-white">{classification.name}</p>
                        {classification.description && (
                          <p className="text-xs text-zinc-400 mt-1">{classification.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => handleEdit(classification)}
                        disabled={loading}
                        className="p-2 hover:bg-zinc-700 rounded transition text-zinc-300 hover:text-white disabled:opacity-50"
                        title="Editar"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(classification.id)}
                        disabled={loading}
                        className="p-2 hover:bg-red-500/20 rounded transition text-zinc-300 hover:text-red-400 disabled:opacity-50"
                        title="Deletar"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
