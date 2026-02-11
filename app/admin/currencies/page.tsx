'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Plus, Edit2, Trash2, DollarSign, Save, X, Check, Search, CheckSquare, Square } from 'lucide-react';

interface Currency {
  id: number;
  code: string;
  name: string;
  symbol: string;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function CurrenciesPage() {
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive' | 'default'>('all');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{ message: string; onConfirm: () => void } | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Currency | null>(null);
  const [form, setForm] = useState({
    code: '',
    name: '',
    symbol: '',
    isDefault: false,
    isActive: true
  });

  useEffect(() => {
    fetchCurrencies();
  }, []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const showToast = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
    setToast({ message, type });
  };

  const showConfirm = (message: string, onConfirm: () => void) => {
    setConfirmDialog({ message, onConfirm });
  };

  const fetchCurrencies = async () => {
    try {
      const res = await fetch('/api/admin/currencies');
      if (res.ok) {
        const data = await res.json();
        setCurrencies(data);
      }
    } catch (error) {
      console.error('Error fetching currencies:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const res = await fetch('/api/admin/currencies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });

      if (res.ok) {
        await fetchCurrencies();
        setShowModal(false);
        setForm({ code: '', name: '', symbol: '', isDefault: false, isActive: true });
      } else {
        const error = await res.json();
        alert(error.error || 'Erreur lors de la sauvegarde');
      }
    } catch (error) {
      console.error('Error saving currency:', error);
      alert('Erreur lors de la sauvegarde');
    }
  };

  const handleStartEdit = (currency: Currency) => {
    setEditingId(currency.id);
    setEditForm({ ...currency });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm(null);
  };

  const handleSaveEdit = async () => {
    if (!editForm) return;

    try {
      const res = await fetch('/api/admin/currencies', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });

      if (res.ok) {
        await fetchCurrencies();
        setEditingId(null);
        setEditForm(null);
      } else {
        const error = await res.json();
        alert(error.error || 'Erreur lors de la sauvegarde');
      }
    } catch (error) {
      console.error('Error saving currency:', error);
      alert('Erreur lors de la sauvegarde');
    }
  };

  const handleDelete = async (currency: Currency) => {
    // Empêcher la suppression du Bitcoin
    if (currency.code === 'BTC') {
      showToast('Le Bitcoin ne peut pas être supprimé', 'warning');
      return;
    }

    showConfirm(`Êtes-vous sûr de vouloir supprimer ${currency.name} ?`, async () => {
      try {
        const res = await fetch(`/api/admin/currencies?id=${currency.id}`, {
          method: 'DELETE'
        });

        if (res.ok) {
          await fetchCurrencies();
          showToast('Devise supprimée avec succès', 'success');
        } else {
          const error = await res.json();
          showToast(error.error || 'Erreur lors de la suppression', 'error');
        }
      } catch (error) {
        console.error('Error deleting currency:', error);
        showToast('Erreur lors de la suppression', 'error');
      }
      setConfirmDialog(null);
    });
  };

  const handleSelectAll = () => {
    const filtered = getFilteredCurrencies();
    if (selectedIds.length === filtered.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filtered.map(c => c.id));
    }
  };

  const handleSelectCurrency = (id: number) => {
    setSelectedIds(prev => 
      prev.includes(id) 
        ? prev.filter(i => i !== id)
        : [...prev, id]
    );
  };

  const handleBulkUpdateStatus = async (isActive: boolean) => {
    if (selectedIds.length === 0) {
      showToast('Veuillez sélectionner au moins une devise', 'warning');
      return;
    }

    try {
      const updates = selectedIds.map(id => 
        fetch('/api/admin/currencies', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id,
            isActive
          })
        })
      );

      await Promise.all(updates);
      await fetchCurrencies();
      setSelectedIds([]);
      showToast(`${selectedIds.length} devise(s) ${isActive ? 'activée(s)' : 'désactivée(s)'} avec succès`, 'success');
    } catch (error) {
      console.error('Error updating currencies:', error);
      showToast('Erreur lors de la mise à jour', 'error');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) {
      showToast('Veuillez sélectionner au moins une devise', 'warning');
      return;
    }

    // Vérifier si Bitcoin est dans la sélection
    const selectedCurrencies = currencies.filter(c => selectedIds.includes(c.id));
    const hasBitcoin = selectedCurrencies.some(c => c.code === 'BTC');
    
    if (hasBitcoin) {
      showToast('Le Bitcoin ne peut pas être supprimé', 'warning');
      return;
    }

    showConfirm(`Êtes-vous sûr de vouloir supprimer ${selectedIds.length} devise(s) ?`, async () => {
      try {
        const deletes = selectedIds.map(id => 
          fetch(`/api/admin/currencies?id=${id}`, {
            method: 'DELETE'
          })
        );

        await Promise.all(deletes);
        await fetchCurrencies();
        setSelectedIds([]);
        showToast(`${selectedIds.length} devise(s) supprimée(s) avec succès`, 'success');
      } catch (error) {
        console.error('Error deleting currencies:', error);
        showToast('Erreur lors de la suppression', 'error');
      }
      setConfirmDialog(null);
    });
  };

  const getFilteredCurrencies = () => {
    return currencies.filter((currency) => {
      // Apply status filter
      if (filterStatus === 'active' && !currency.isActive) return false;
      if (filterStatus === 'inactive' && currency.isActive) return false;
      if (filterStatus === 'default' && !currency.isDefault) return false;
      
      // Apply search filter
      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase();
      return (
        currency.code.toLowerCase().includes(query) ||
        currency.name.toLowerCase().includes(query) ||
        currency.symbol.toLowerCase().includes(query)
      );
    });
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <DollarSign className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Gestion des Devises
          </h1>
        </div>
        <Button
          onClick={() => {
            setForm({ code: '', name: '', symbol: '', isDefault: false, isActive: true });
            setShowModal(true);
          }}
          className="flex items-center gap-2"
        >
          <Plus className="h-5 w-5" />
          Nouvelle Devise
        </Button>
      </div>

      {/* Selection and Bulk Actions */}
      {selectedIds.length > 0 && (
        <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckSquare className="h-5 w-5 text-blue-600" />
            <span className="font-medium text-gray-900 dark:text-white">
              {selectedIds.length} devise(s) sélectionnée(s)
            </span>
          </div>
          <div className="flex gap-2">
            <Button
              variant="primary"
              onClick={() => handleBulkUpdateStatus(true)}
              className="flex items-center gap-2"
            >
              <Check className="h-4 w-4" />
              Activer
            </Button>
            <Button
              variant="secondary"
              onClick={() => handleBulkUpdateStatus(false)}
              className="flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              Désactiver
            </Button>
            <Button
              variant="danger"
              onClick={handleBulkDelete}
              className="flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Supprimer
            </Button>
            <Button
              variant="secondary"
              onClick={() => setSelectedIds([])}
            >
              Annuler
            </Button>
          </div>
        </div>
      )}

      {/* Filter Buttons */}
      <div className="mb-4 flex flex-wrap gap-2">
        <Button
          variant={filterStatus === 'all' ? 'primary' : 'secondary'}
          onClick={() => setFilterStatus('all')}
          className="flex items-center gap-2"
        >
          Toutes ({currencies.length})
        </Button>
        <Button
          variant={filterStatus === 'active' ? 'primary' : 'secondary'}
          onClick={() => setFilterStatus('active')}
          className="flex items-center gap-2"
        >
          Actives ({currencies.filter(c => c.isActive).length})
        </Button>
        <Button
          variant={filterStatus === 'inactive' ? 'primary' : 'secondary'}
          onClick={() => setFilterStatus('inactive')}
          className="flex items-center gap-2"
        >
          Inactives ({currencies.filter(c => !c.isActive).length})
        </Button>
        <Button
          variant={filterStatus === 'default' ? 'primary' : 'secondary'}
          onClick={() => setFilterStatus('default')}
          className="flex items-center gap-2"
        >
          Par défaut ({currencies.filter(c => c.isDefault).length})
        </Button>
      </div>

      {/* Search Bar with Select All */}
      <div className="mb-6 flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher par code, nom ou symbole..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <Button
          variant="secondary"
          onClick={handleSelectAll}
          className="flex items-center gap-2"
        >
          {selectedIds.length === getFilteredCurrencies().length && getFilteredCurrencies().length > 0 ? (
            <>
              <CheckSquare className="h-5 w-5" />
              Tout désélectionner
            </>
          ) : (
            <>
              <Square className="h-5 w-5" />
              Tout sélectionner
            </>
          )}
        </Button>
      </div>

      {/* Currencies Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {getFilteredCurrencies().map((currency) => {
          const isEditing = editingId === currency.id;
          const displayCurrency = isEditing && editForm ? editForm : currency;
          const isSelected = selectedIds.includes(currency.id);

          return (
            <Card key={currency.id} className={`p-6 ${isSelected ? 'ring-2 ring-blue-500 dark:ring-blue-400' : ''}`}>
              <div className="flex items-start justify-between mb-4">
                {/* Checkbox for selection */}
                <div 
                  className="flex items-center mr-3 cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectCurrency(currency.id);
                  }}
                >
                  {isSelected ? (
                    <CheckSquare className="h-5 w-5 text-blue-600" />
                  ) : (
                    <Square className="h-5 w-5 text-gray-400" />
                  )}
                </div>
                <div 
                  className="flex-1 cursor-pointer" 
                  onClick={() => !isEditing && handleStartEdit(currency)}
                >
                  {isEditing ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={displayCurrency.symbol}
                        onChange={(e) => setEditForm({ ...editForm!, symbol: e.target.value })}
                        onClick={(e) => e.stopPropagation()}
                        className="w-20 px-2 py-1 text-2xl border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        maxLength={10}
                      />
                      <input
                        type="text"
                        value={displayCurrency.code}
                        onChange={(e) => setEditForm({ ...editForm!, code: e.target.value.toUpperCase() })}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full px-2 py-1 text-lg font-bold border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        maxLength={10}
                      />
                      <input
                        type="text"
                        value={displayCurrency.name}
                        onChange={(e) => setEditForm({ ...editForm!, name: e.target.value })}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                      />
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 mb-1 hover:bg-gray-50 dark:hover:bg-gray-800/50 p-1 rounded transition-colors">
                        <span className="text-3xl">{displayCurrency.symbol}</span>
                        <span className="text-xl font-bold text-gray-900 dark:text-white">
                          {displayCurrency.code}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 p-1 rounded transition-colors">
                        {displayCurrency.name}
                      </p>
                    </>
                  )}
                </div>
                <div className="flex gap-2">
                  {isEditing ? (
                    <>
                      <button
                        onClick={handleSaveEdit}
                        className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                        title="Sauvegarder"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="p-2 text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        title="Annuler"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => handleStartEdit(currency)}
                        className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                        title="Modifier"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      {currency.code !== 'BTC' && (
                        <button
                          onClick={() => handleDelete(currency)}
                          className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                {isEditing ? (
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={displayCurrency.isDefault}
                        onChange={(e) => setEditForm({ ...editForm!, isDefault: e.target.checked })}
                        onClick={(e) => e.stopPropagation()}
                        className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Par défaut</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={displayCurrency.isActive}
                        onChange={(e) => setEditForm({ ...editForm!, isActive: e.target.checked })}
                        onClick={(e) => e.stopPropagation()}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Active</span>
                    </label>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    {displayCurrency.isDefault && (
                      <span 
                        className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 rounded-full cursor-pointer hover:bg-green-200 dark:hover:bg-green-900/40 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartEdit(currency);
                        }}
                      >
                        Par défaut
                      </span>
                    )}
                    <span 
                      className={`px-2 py-1 text-xs font-medium rounded-full cursor-pointer transition-colors ${
                        displayCurrency.isActive
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/40'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStartEdit(currency);
                      }}
                    >
                      {displayCurrency.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* No results message */}
      {getFilteredCurrencies().length === 0 && (
        <div className="text-center py-12">
          <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Aucune devise trouvée
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {searchQuery.trim() 
              ? "Essayez avec un autre terme de recherche ou changez de filtre"
              : "Aucune devise ne correspond au filtre sélectionné"
            }
          </p>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md p-6">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
              Nouvelle Devise
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Code *
                </label>
                <input
                  type="text"
                  required
                  maxLength={10}
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  placeholder="BTC, EUR, USD..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nom *
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  placeholder="Bitcoin, Euro..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Symbole *
                </label>
                <input
                  type="text"
                  required
                  maxLength={10}
                  value={form.symbol}
                  onChange={(e) => setForm({ ...form, symbol: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  placeholder="₿, €, $..."
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isDefault"
                  checked={form.isDefault}
                  onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="isDefault" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Devise par défaut
                </label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Devise active
                </label>
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  Créer
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setShowModal(false);
                    setForm({ code: '', name: '', symbol: '', isDefault: false, isActive: true });
                  }}
                  className="flex-1"
                >
                  Annuler
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-4 right-4 z-50 animate-slide-up">
          <div className={`px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 ${
            toast.type === 'success' ? 'bg-green-500 text-white' :
            toast.type === 'error' ? 'bg-red-500 text-white' :
            'bg-yellow-500 text-white'
          }`}>
            {toast.type === 'success' && <Check className="h-5 w-5" />}
            {toast.type === 'error' && <X className="h-5 w-5" />}
            {toast.type === 'warning' && <span className="text-lg">⚠️</span>}
            <span className="font-medium">{toast.message}</span>
          </div>
        </div>
      )}

      {/* Confirm Dialog */}
      {confirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md p-6">
            <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
              Confirmation
            </h3>
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              {confirmDialog.message}
            </p>
            <div className="flex gap-3">
              <Button
                variant="danger"
                onClick={confirmDialog.onConfirm}
                className="flex-1"
              >
                Confirmer
              </Button>
              <Button
                variant="secondary"
                onClick={() => setConfirmDialog(null)}
                className="flex-1"
              >
                Annuler
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
