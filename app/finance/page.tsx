'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Plus, Wallet, FolderOpen, TrendingUp, TrendingDown, Calendar, DollarSign, Edit2, Trash2 } from 'lucide-react';
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

// Helper to get project currency (returns currency if all wallets use the same, otherwise 'Mixte')
const getProjectCurrency = (project: Project) => {
  if (!project.wallets || project.wallets.length === 0) return 'BTC';
  const currencies = [...new Set(project.wallets.map((w: any) => w.currency || 'BTC'))];
  return currencies.length === 1 ? currencies[0] : 'Mixte';
};

// Component to handle URL search params with Suspense
function TabHandler({ onTabChange }: { onTabChange: (tab: 'overview' | 'wallets' | 'projects' | 'expenses') => void }) {
  const searchParams = useSearchParams();
  
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['overview', 'wallets', 'projects', 'expenses'].includes(tab)) {
      onTabChange(tab as 'overview' | 'wallets' | 'projects' | 'expenses');
    }
  }, [searchParams, onTabChange]);

  return null;
}

interface Project {
  id: number;
  name: string;
  description: string | null;
  startDate: string;
  endDate: string;
  status: string;
  totalBudget: number;
  totalExpenses: number;
  remaining: number;
  wallets?: Array<{ currency?: string }>;
  _count: {
    expenses: number;
    wallets: number;
  };
}

interface WalletData {
  id: number;
  name: string;
  description: string | null;
  amount: number;
  currency?: string;
  remaining: number;
  totalExpenses: number;
  projectId: number | null;
  project: Project | null;
}

interface Expense {
  id: number;
  name: string;
  description: string | null;
  amount: number;
  currency?: string;
  type: 'MATERIAL' | 'LICENSE' | 'OTHER';
  date: string;
  project: {
    id: number;
    name: string;
  };
  wallet: {
    id: number;
    name: string;
    currency?: string;
  };
}

export default function FinancePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'overview' | 'wallets' | 'projects' | 'expenses'>('overview');
  const [projects, setProjects] = useState<Project[]>([]);
  const [wallets, setWallets] = useState<WalletData[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [currencies, setCurrencies] = useState<Array<{id: number, code: string, symbol: string, name: string, isActive: boolean}>>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editingWallet, setEditingWallet] = useState<WalletData | null>(null);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  // Forms
  const [projectForm, setProjectForm] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
  });

  const [walletForm, setWalletForm] = useState({
    name: '',
    description: '',
    amount: '',
    currency: 'BTC',
    projectId: '',
  });

  const [expenseForm, setExpenseForm] = useState({
    name: '',
    description: '',
    amount: '',
    currency: 'BTC',
    type: 'MATERIAL' as 'MATERIAL' | 'LICENSE' | 'OTHER',
    date: new Date().toISOString().split('T')[0],
    projectId: '',
    walletId: '',
  });

  useEffect(() => {
    fetchData();
    fetchCurrencies();
  }, []);

  const fetchCurrencies = async () => {
    try {
      const res = await fetch('/api/admin/currencies');
      if (res.ok) {
        const data = await res.json();
        setCurrencies(data.filter((c: any) => c.isActive));
      }
    } catch (error) {
      console.error('Error fetching currencies:', error);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [projectsRes, walletsRes, expensesRes] = await Promise.all([
        fetch('/api/finance/projects'),
        fetch('/api/finance/wallets'),
        fetch('/api/finance/expenses'),
      ]);

      if (projectsRes.ok) setProjects(await projectsRes.json());
      if (walletsRes.ok) setWallets(await walletsRes.json());
      if (expensesRes.ok) setExpenses(await expensesRes.json());
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const createProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const method = editingProject ? 'PUT' : 'POST';
      const body = editingProject 
        ? { ...projectForm, id: editingProject.id }
        : projectForm;

      const res = await fetch('/api/finance/projects', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setShowProjectModal(false);
        setProjectForm({ name: '', description: '', startDate: '', endDate: '' });
        setEditingProject(null);
        fetchData();
      }
    } catch (error) {
      console.error('Error saving project:', error);
    }
  };

  const deleteProject = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce projet ?')) return;
    
    try {
      const res = await fetch(`/api/finance/projects?id=${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        fetchData();
      }
    } catch (error) {
      console.error('Error deleting project:', error);
    }
  };

  const editProject = (project: Project) => {
    setEditingProject(project);
    setProjectForm({
      name: project.name,
      description: project.description || '',
      startDate: project.startDate ? new Date(project.startDate).toISOString().split('T')[0] : '',
      endDate: project.endDate ? new Date(project.endDate).toISOString().split('T')[0] : '',
    });
    setShowProjectModal(true);
  };

  const createWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const method = editingWallet ? 'PUT' : 'POST';
      const body = editingWallet 
        ? { ...walletForm, id: editingWallet.id }
        : walletForm;

      const res = await fetch('/api/finance/wallets', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setShowWalletModal(false);
        setWalletForm({ name: '', description: '', amount: '', currency: 'BTC', projectId: '' });
        setEditingWallet(null);
        fetchData();
      }
    } catch (error) {
      console.error('Error saving wallet:', error);
    }
  };

  const deleteWallet = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce portefeuille ?')) return;
    
    try {
      const res = await fetch(`/api/finance/wallets?id=${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        fetchData();
      } else {
        const error = await res.json();
        alert(error.error || 'Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Error deleting wallet:', error);
    }
  };

  const editWallet = (wallet: WalletData) => {
    setEditingWallet(wallet);
    setWalletForm({
      name: wallet.name,
      description: wallet.description || '',
      amount: wallet.amount.toString(),
      currency: wallet.currency || 'BTC',
      projectId: wallet.projectId?.toString() || '',
    });
    setShowWalletModal(true);
  };

  const createExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const method = editingExpense ? 'PUT' : 'POST';
      const body = editingExpense 
        ? { ...expenseForm, id: editingExpense.id }
        : expenseForm;

      const res = await fetch('/api/finance/expenses', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setShowExpenseModal(false);
        setExpenseForm({
          name: '',
          description: '',
          amount: '',
          currency: 'BTC',
          type: 'MATERIAL',
          date: new Date().toISOString().split('T')[0],
          projectId: '',
          walletId: '',
        });
        setEditingExpense(null);
        fetchData();
      } else {
        const error = await res.json();
        alert(error.error || 'Erreur lors de la sauvegarde');
      }
    } catch (error) {
      console.error('Error saving expense:', error);
    }
  };

  const deleteExpense = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette dépense ?')) return;
    
    try {
      const res = await fetch(`/api/finance/expenses?id=${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        fetchData();
      }
    } catch (error) {
      console.error('Error deleting expense:', error);
    }
  };

  const editExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setExpenseForm({
      name: expense.name,
      description: expense.description || '',
      amount: expense.amount.toString(),
      currency: expense.currency || 'BTC',
      type: expense.type,
      date: new Date(expense.date).toISOString().split('T')[0],
      projectId: expense.project.id.toString(),
      walletId: expense.wallet.id.toString(),
    });
    setShowExpenseModal(true);
  };

  const totalBudget = wallets.reduce((sum, w) => sum + w.amount, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalRemaining = totalBudget - totalExpenses;

  // Déterminer la devise globale
  const globalCurrency = (() => {
    if (wallets.length === 0) return 'BTC';
    const currencies = [...new Set(wallets.map(w => w.currency || 'BTC'))];
    return currencies.length === 1 ? currencies[0] : 'Mixte';
  })();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <Suspense fallback={null}>
        <TabHandler onTabChange={setActiveTab} />
      </Suspense>
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Finance & Rapports</h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'overview'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            Vue d'ensemble
          </button>
          <button
            onClick={() => setActiveTab('projects')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'projects'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            Projets
          </button>
          <button
            onClick={() => setActiveTab('wallets')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'wallets'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            Portefeuilles
          </button>
          <button
            onClick={() => setActiveTab('expenses')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'expenses'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            Dépenses
          </button>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Budget Total</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">
                      {getCurrencySymbol(globalCurrency)} {formatAmount(totalBudget, globalCurrency)}
                    </p>
                  </div>
                  <DollarSign className="w-12 h-12 text-blue-500" />
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Dépenses Totales</p>
                    <p className="text-3xl font-bold text-red-600">
                      {getCurrencySymbol(globalCurrency)} {formatAmount(totalExpenses, globalCurrency)}
                    </p>
                  </div>
                  <TrendingDown className="w-12 h-12 text-red-500" />
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Restant</p>
                    <p className="text-3xl font-bold text-green-600">
                      {getCurrencySymbol(globalCurrency)} {formatAmount(totalRemaining, globalCurrency)}
                    </p>
                  </div>
                  <TrendingUp className="w-12 h-12 text-green-500" />
                </div>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-6">
                <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Projets Actifs</h2>
                <div className="space-y-3">
                  {projects.filter(p => p.status === 'active').slice(0, 5).map(project => (
                    <div key={project.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{project.name}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {project._count.wallets} portefeuilles • {project._count.expenses} dépenses
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-green-600">{formatAmount(project.remaining, getProjectCurrency(project))} {getProjectCurrency(project)}</p>
                        <p className="text-xs text-gray-500">restant</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-6">
                <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Dernières Dépenses</h2>
                <div className="space-y-3">
                  {expenses.slice(0, 5).map(expense => (
                    <div key={expense.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{expense.name}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {expense.project.name} • {expense.type}
                        </p>
                      </div>
                      <p className="text-sm font-medium text-red-600">-{getCurrencySymbol(expense.currency || 'BTC')} {formatAmount(expense.amount, expense.currency)}</p>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* Projects Tab */}
        {activeTab === 'projects' && (
          <div>
            <div className="flex justify-end mb-4">
              <Button onClick={() => setShowProjectModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Nouveau Projet
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map(project => (
                <Link 
                  key={project.id}
                  href={`/finance/projects/${project.id}`}
                  className="block"
                >
                  <Card 
                    className="p-6 cursor-pointer hover:shadow-lg transition-shadow h-full"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                          <FolderOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900 dark:text-white">{project.name}</h3>
                          <span className={`text-xs px-2 py-1 rounded ${
                            project.status === 'active' 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                          }`}>
                            {project.status}
                          </span>
                        </div>
                      </div>
                    </div>

                    {project.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{project.description}</p>
                    )}

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Budget:</span>
                        <span className="font-medium text-gray-900 dark:text-white">{getCurrencySymbol(getProjectCurrency(project))} {formatAmount(project.totalBudget, getProjectCurrency(project))}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Dépenses:</span>
                        <span className="font-medium text-red-600">{getCurrencySymbol(getProjectCurrency(project))} {formatAmount(project.totalExpenses, getProjectCurrency(project))}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Restant:</span>
                        <span className="font-medium text-green-600">{getCurrencySymbol(getProjectCurrency(project))} {formatAmount(project.remaining, getProjectCurrency(project))}</span>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <Calendar className="w-4 h-4" />
                          {new Date(project.startDate).toLocaleDateString()} - {project.endDate ? new Date(project.endDate).toLocaleDateString() : 'En cours'}
                        </div>
                        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              editProject(project);
                            }}
                            className="p-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900 rounded"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              deleteProject(project.id);
                            }}
                            className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Wallets Tab */}
        {activeTab === 'wallets' && (
          <div>
            <div className="flex justify-end mb-4">
              <Button onClick={() => setShowWalletModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Nouveau Portefeuille
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {wallets.map(wallet => (
                <Link
                  key={wallet.id}
                  href={`/finance/wallets/${wallet.id}`}
                  className="block"
                >
                  <Card className="p-6 cursor-pointer hover:shadow-lg transition-shadow h-full">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                          <Wallet className="w-6 h-6 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900 dark:text-white">{wallet.name}</h3>
                          {wallet.project && (
                            <p className="text-xs text-gray-600 dark:text-gray-400">{wallet.project.name}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {wallet.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{wallet.description}</p>
                    )}

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Montant initial:</span>
                        <span className="font-medium text-gray-900 dark:text-white">{getCurrencySymbol(wallet.currency || 'BTC')} {formatAmount(wallet.amount, wallet.currency)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Dépensé:</span>
                        <span className="font-medium text-red-600">{getCurrencySymbol(wallet.currency || 'BTC')} {formatAmount(wallet.totalExpenses, wallet.currency)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Restant:</span>
                        <span className="font-medium text-green-600">{getCurrencySymbol(wallet.currency || 'BTC')} {formatAmount(wallet.remaining, wallet.currency)} ({((wallet.remaining / wallet.amount) * 100).toFixed(1)}%)</span>
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full"
                          style={{ width: `${(wallet.remaining / wallet.amount) * 100}%` }}
                        />
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          editWallet(wallet);
                        }}
                        className="p-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900 rounded"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          deleteWallet(wallet.id);
                        }}
                        className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Expenses Tab */}
        {activeTab === 'expenses' && (
          <div>
            <div className="flex justify-end mb-4">
              <Button onClick={() => setShowExpenseModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Nouvelle Dépense
              </Button>
            </div>

            <Card>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Nom</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Projet</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Portefeuille</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Montant</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {expenses.map(expense => (
                      <tr key={expense.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {new Date(expense.date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{expense.name}</p>
                            {expense.description && (
                              <p className="text-gray-600 dark:text-gray-400">{expense.description}</p>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs rounded ${
                            expense.type === 'MATERIAL' 
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                              : expense.type === 'LICENSE'
                              ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                          }`}>
                            {expense.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {expense.project.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {expense.wallet.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-red-600">
                          {getCurrencySymbol(expense.currency || 'BTC')} {formatAmount(expense.amount, expense.currency)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => editExpense(expense)}
                              className="p-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900 rounded"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => deleteExpense(expense.id)}
                              className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900 rounded"
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
            </Card>
          </div>
        )}

        {/* Project Modal */}
        {showProjectModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md p-6">
              <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
                {editingProject ? 'Modifier le Projet' : 'Nouveau Projet'}
              </h2>
              <form onSubmit={createProject} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nom *
                  </label>
                  <input
                    type="text"
                    required
                    value={projectForm.name}
                    onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <textarea
                    value={projectForm.description}
                    onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Date de début
                  </label>
                  <input
                    type="date"
                    value={projectForm.startDate}
                    onChange={(e) => setProjectForm({ ...projectForm, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Date de fin (optionnel)
                  </label>
                  <input
                    type="date"
                    value={projectForm.endDate}
                    onChange={(e) => setProjectForm({ ...projectForm, endDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                  <p className="text-xs text-gray-500 mt-1">Laisser vide si la date n'est pas encore connue</p>
                </div>

                <div className="flex gap-2">
                  <Button type="submit" className="flex-1">
                    {editingProject ? 'Modifier' : 'Créer'}
                  </Button>
                  <Button type="button" variant="secondary" onClick={() => {
                    setShowProjectModal(false);
                    setEditingProject(null);
                    setProjectForm({ name: '', description: '', startDate: '', endDate: '' });
                  }} className="flex-1">
                    Annuler
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        )}

        {/* Wallet Modal */}
        {showWalletModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md p-6">
              <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
                {editingWallet ? 'Modifier le Portefeuille' : 'Nouveau Portefeuille'}
              </h2>
              <form onSubmit={createWallet} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nom *
                  </label>
                  <input
                    type="text"
                    required
                    value={walletForm.name}
                    onChange={(e) => setWalletForm({ ...walletForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <textarea
                    value={walletForm.description}
                    onChange={(e) => setWalletForm({ ...walletForm, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Montant *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={walletForm.amount}
                    onChange={(e) => setWalletForm({ ...walletForm, amount: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Devise *
                  </label>
                  <select
                    required
                    value={walletForm.currency}
                    onChange={(e) => setWalletForm({ ...walletForm, currency: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    {currencies.map(currency => (
                      <option key={currency.id} value={currency.code}>
                        {currency.code} ({currency.symbol})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Projet (optionnel)
                  </label>
                  <select
                    value={walletForm.projectId}
                    onChange={(e) => setWalletForm({ ...walletForm, projectId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    <option value="">Aucun projet</option>
                    {projects.map(project => (
                      <option key={project.id} value={project.id}>{project.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-2">
                  <Button type="submit" className="flex-1">
                    {editingWallet ? 'Modifier' : 'Créer'}
                  </Button>
                  <Button type="button" variant="secondary" onClick={() => {
                    setShowWalletModal(false);
                    setEditingWallet(null);
                    setWalletForm({ name: '', description: '', amount: '', currency: 'BTC', projectId: '' });
                  }} className="flex-1">
                    Annuler
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        )}

        {/* Expense Modal */}
        {showExpenseModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md p-6">
              <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
                {editingExpense ? 'Modifier la Dépense' : 'Nouvelle Dépense'}
              </h2>
              <form onSubmit={createExpense} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nom *
                  </label>
                  <input
                    type="text"
                    required
                    value={expenseForm.name}
                    onChange={(e) => setExpenseForm({ ...expenseForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <textarea
                    value={expenseForm.description}
                    onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    rows={2}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Montant *
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={expenseForm.amount}
                      onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                    <select
                      required
                      value={expenseForm.currency}
                      onChange={(e) => setExpenseForm({ ...expenseForm, currency: e.target.value })}
                      className="w-32 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    >
                      {currencies.map(curr => (
                        <option key={curr.code} value={curr.code}>
                          {curr.symbol} {curr.code}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Type *
                  </label>
                  <select
                    required
                    value={expenseForm.type}
                    onChange={(e) => setExpenseForm({ ...expenseForm, type: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
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
                    required
                    value={expenseForm.date}
                    onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Projet *
                  </label>
                  <select
                    required
                    value={expenseForm.projectId}
                    onChange={(e) => setExpenseForm({ ...expenseForm, projectId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    <option value="">Sélectionner un projet</option>
                    {projects.map(project => (
                      <option key={project.id} value={project.id}>{project.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Portefeuille *
                  </label>
                  <select
                    required
                    value={expenseForm.walletId}
                    onChange={(e) => setExpenseForm({ ...expenseForm, walletId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    <option value="">Sélectionner un portefeuille</option>
                    {wallets.map(wallet => (
                      <option key={wallet.id} value={wallet.id}>
                        {wallet.name} (Restant: {getCurrencySymbol(wallet.currency || 'BTC')} {formatAmount(wallet.remaining, wallet.currency)})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-2">
                  <Button type="submit" className="flex-1">
                    {editingExpense ? 'Modifier' : 'Créer'}
                  </Button>
                  <Button type="button" variant="secondary" onClick={() => {
                    setShowExpenseModal(false);
                    setEditingExpense(null);
                    setExpenseForm({
                      name: '',
                      description: '',
                      amount: '',
                      currency: 'BTC',
                      type: 'MATERIAL',
                      date: new Date().toISOString().split('T')[0],
                      projectId: '',
                      walletId: '',
                    });
                  }} className="flex-1">
                    Annuler
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
