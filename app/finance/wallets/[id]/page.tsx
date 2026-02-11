'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Wallet, TrendingDown, Calendar, DollarSign, FolderOpen, Plus, Edit2, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

// Helper function to get currency symbol
const getCurrencySymbol = (currency?: string) => {
  const curr = currency || 'BTC';
  const symbols: { [key: string]: string } = {
    'BTC': '₿',
    'EUR': '€',
    'USD': '$',
    'GBP': '£',
    'CHF': 'CHF'
  };
  return symbols[curr] || curr;
};

// Helper function to format amounts based on currency
const formatAmount = (amount: number, currency?: string) => {
  const curr = currency || 'BTC';
  return curr === 'BTC' ? amount.toFixed(8) : amount.toFixed(2);
};

interface WalletDetail {
  id: number;
  name: string;
  description: string | null;
  amount: number;
  currency: string;
  projectId: number | null;
  createdAt: string;
  updatedAt: string;
  project: {
    id: number;
    name: string;
    status: string;
  } | null;
  expenses: Expense[];
  _count: {
    expenses: number;
  };
}

interface Expense {
  id: number;
  name: string;
  description: string | null;
  amount: number;
  currency: string;
  type: 'MATERIAL' | 'LICENSE' | 'OTHER';
  date: string;
  project: {
    id: number;
    name: string;
  };
}

export default function WalletDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [wallet, setWallet] = useState<WalletDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [projects, setProjects] = useState<Array<{id: number, name: string}>>([]);
  const [currencies, setCurrencies] = useState<Array<{id: number, code: string, symbol: string}>>([]);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  const [expenseForm, setExpenseForm] = useState({
    name: '',
    description: '',
    amount: '',
    currency: 'BTC',
    type: 'MATERIAL' as 'MATERIAL' | 'LICENSE' | 'OTHER',
    date: new Date().toISOString().split('T')[0],
    projectId: '',
  });

  const fetchWallet = async () => {
    if (!params.id) return;
    
    try {
      const res = await fetch(`/api/finance/wallets/${params.id}`);
      if (res.ok) {
        const data = await res.json();
        setWallet(data);
        // Initialize expense form with wallet's currency
        setExpenseForm(prev => ({ ...prev, currency: data.currency }));
      } else {
        router.push('/finance');
      }
    } catch (error) {
      console.error('Error fetching wallet:', error);
      router.push('/finance');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWallet();
    fetchProjects();
    fetchCurrencies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/finance/projects');
      if (res.ok) {
        const data = await res.json();
        setProjects(data);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const fetchCurrencies = async () => {
    try {
      const res = await fetch('/api/admin/currencies');
      if (res.ok) {
        const data = await res.json();
        setCurrencies(data.filter((c: {isActive: boolean}) => c.isActive));
      }
    } catch (error) {
      console.error('Error fetching currencies:', error);
    }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!expenseForm.name || !expenseForm.amount || !expenseForm.projectId) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      const url = editingExpense 
        ? `/api/finance/expenses/${editingExpense.id}`
        : '/api/finance/expenses';
      
      const method = editingExpense ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...expenseForm,
          amount: parseFloat(expenseForm.amount),
          walletId: wallet?.id,
        }),
      });

      if (res.ok) {
        setShowExpenseModal(false);
        setEditingExpense(null);
        setExpenseForm({
          name: '',
          description: '',
          amount: '',
          currency: wallet?.currency || 'BTC',
          type: 'MATERIAL',
          date: new Date().toISOString().split('T')[0],
          projectId: '',
        });
        fetchWallet();
      } else {
        const error = await res.json();
        alert(error.error || 'Erreur lors de la création de la dépense');
      }
    } catch (error) {
      console.error('Error adding expense:', error);
      alert('Erreur lors de la création de la dépense');
    }
  };

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setExpenseForm({
      name: expense.name,
      description: expense.description || '',
      amount: expense.amount.toString(),
      currency: expense.currency,
      type: expense.type,
      date: new Date(expense.date).toISOString().split('T')[0],
      projectId: expense.project.id.toString(),
    });
    setShowExpenseModal(true);
  };

  const handleDeleteExpense = async (expenseId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette dépense ?')) {
      return;
    }

    try {
      const res = await fetch(`/api/finance/expenses/${expenseId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        fetchWallet();
      } else {
        alert('Erreur lors de la suppression de la dépense');
      }
    } catch (error) {
      console.error('Error deleting expense:', error);
      alert('Erreur lors de la suppression de la dépense');
    }
  };

  const getTotalExpenses = () => {
    if (!wallet?.expenses) return 0;
    return wallet.expenses.reduce((sum, e) => sum + e.amount, 0);
  };

  const getRemaining = () => {
    if (!wallet) return 0;
    return wallet.amount - getTotalExpenses();
  };

  const getExpenseTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      'MATERIAL': 'Matériel',
      'LICENSE': 'Licence',
      'OTHER': 'Autre'
    };
    return labels[type] || type;
  };

  const getExpenseTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      'MATERIAL': 'bg-blue-100 text-blue-800',
      'LICENSE': 'bg-purple-100 text-purple-800',
      'OTHER': 'bg-gray-100 text-gray-800'
    };
    return colors[type] || colors['OTHER'];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-600 dark:text-gray-400">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!wallet) {
    return null;
  }

  const totalExpenses = getTotalExpenses();
  const remaining = getRemaining();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="secondary"
            onClick={() => router.push('/finance?tab=wallets')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour aux Finances
          </Button>
          
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {wallet.name}
              </h1>
              {wallet.description && (
                <p className="text-gray-600 dark:text-gray-400">
                  {wallet.description}
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500 dark:text-gray-400">Devise</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {getCurrencySymbol(wallet.currency)} {wallet.currency}
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Montant Initial</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {getCurrencySymbol(wallet.currency)} {formatAmount(wallet.amount, wallet.currency)}
                </p>
              </div>
              <Wallet className="w-8 h-8 text-blue-600" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Dépenses Totales</p>
                <p className="text-2xl font-bold text-red-600">
                  {getCurrencySymbol(wallet.currency)} {formatAmount(totalExpenses, wallet.currency)}
                </p>
              </div>
              <TrendingDown className="w-8 h-8 text-red-600" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Restant</p>
                <p className="text-2xl font-bold text-green-600">
                  {getCurrencySymbol(wallet.currency)} {formatAmount(remaining, wallet.currency)}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Nombre de dépenses</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {wallet._count.expenses}
                </p>
              </div>
              <Calendar className="w-8 h-8 text-purple-600" />
            </div>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mb-6">
          <Button
            onClick={() => setShowExpenseModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Ajouter une dépense
          </Button>
          <Button
            onClick={() => router.push(`/finance?tab=wallets&edit=${wallet.id}`)}
            variant="secondary"
          >
            <Edit2 className="w-4 h-4 mr-2" />
            Modifier le portefeuille
          </Button>
        </div>

        {/* Project Info */}
        {wallet.project && (
          <Card className="p-4 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Projet Associé</h2>
            <div 
              className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              onClick={() => router.push(`/finance/projects/${wallet.project!.id}`)}
            >
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <FolderOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{wallet.project.name}</p>
                  <span className={`text-xs px-2 py-1 rounded ${
                    wallet.project.status === 'active' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                  }`}>
                    {wallet.project.status}
                  </span>
                </div>
              </div>
              <ArrowLeft className="w-5 h-5 text-gray-400 rotate-180" />
            </div>
          </Card>
        )}

        {/* Dates */}
        <Card className="p-4 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Informations</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Date de création</p>
              <p className="text-gray-900 dark:text-white font-medium">
                {new Date(wallet.createdAt).toLocaleDateString('fr-FR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Dernière modification</p>
              <p className="text-gray-900 dark:text-white font-medium">
                {new Date(wallet.updatedAt).toLocaleDateString('fr-FR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </div>
        </Card>

        {/* Expenses */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Dépenses ({wallet.expenses.length})
          </h2>
          
          {wallet.expenses.length === 0 ? (
            <p className="text-gray-600 dark:text-gray-400 text-center py-8">
              Aucune dépense pour ce portefeuille
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Nom
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Projet
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Montant
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {wallet.expenses.map((expense) => (
                    <tr key={expense.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {expense.name}
                          </p>
                          {expense.description && (
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {expense.description}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {new Date(expense.date).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${getExpenseTypeColor(expense.type)}`}>
                          {getExpenseTypeLabel(expense.type)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        <button
                          onClick={() => router.push(`/finance/projects/${expense.project.id}`)}
                          className="text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          {expense.project.name}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-red-600">
                        {getCurrencySymbol(expense.currency)} {formatAmount(expense.amount, expense.currency)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleEditExpense(expense)}
                            className="text-blue-600 hover:text-blue-800"
                            title="Modifier"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteExpense(expense.id)}
                            className="text-red-600 hover:text-red-800"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {/* Expense Modal */}
      {showExpenseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                {editingExpense ? 'Modifier la Dépense' : 'Ajouter une Dépense'}
              </h2>
              <form onSubmit={handleAddExpense} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Nom de la dépense *
                    </label>
                    <input
                      type="text"
                      value={expenseForm.name}
                      onChange={(e) => setExpenseForm({ ...expenseForm, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      required
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Description
                    </label>
                    <textarea
                      value={expenseForm.description}
                      onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Montant *
                    </label>
                    <input
                      type="number"
                      step="0.00000001"
                      value={expenseForm.amount}
                      onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Devise *
                    </label>
                    <select
                      value={expenseForm.currency}
                      onChange={(e) => setExpenseForm({ ...expenseForm, currency: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      {currencies.map((currency) => (
                        <option key={currency.id} value={currency.code}>
                          {currency.symbol} {currency.code}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Type *
                    </label>
                    <select
                      value={expenseForm.type}
                      onChange={(e) => setExpenseForm({ ...expenseForm, type: e.target.value as 'MATERIAL' | 'LICENSE' | 'OTHER' })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="MATERIAL">Matériel</option>
                      <option value="LICENSE">Licence</option>
                      <option value="OTHER">Autre</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Date *
                    </label>
                    <input
                      type="date"
                      value={expenseForm.date}
                      onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      required
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Projet *
                    </label>
                    <select
                      value={expenseForm.projectId}
                      onChange={(e) => setExpenseForm({ ...expenseForm, projectId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      required
                    >
                      <option value="">Sélectionner un projet</option>
                      {projects.map((project) => (
                        <option key={project.id} value={project.id}>
                          {project.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-span-2">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      <strong>Portefeuille sélectionné :</strong> {wallet.name} ({getCurrencySymbol(wallet.currency)} {formatAmount(wallet.amount, wallet.currency)})
                    </p>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setShowExpenseModal(false);
                      setEditingExpense(null);
                      setExpenseForm({
                        name: '',
                        description: '',
                        amount: '',
                        currency: wallet?.currency || 'BTC',
                        type: 'MATERIAL',
                        date: new Date().toISOString().split('T')[0],
                        projectId: '',
                      });
                    }}
                  >
                    Annuler
                  </Button>
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
                    {editingExpense ? 'Modifier la dépense' : 'Créer la dépense'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
