'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { TrendingDown, DollarSign, Wallet, FolderOpen, PieChart, BarChart3, Calendar, LineChart, Radar, Activity } from 'lucide-react';

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

// Helper function to format amounts
const formatAmount = (amount: number, currency?: string) => {
  const curr = currency || 'BTC';
  return curr === 'BTC' ? amount.toFixed(8) : amount.toFixed(2);
};

interface AnalyticsData {
  totalProjects: number;
  activeProjects: number;
  totalWallets: number;
  totalBudget: number;
  totalExpenses: number;
  totalRemaining: number;
  expensesByType: { type: string; total: number; count: number }[];
  expensesByProject: { projectName: string; total: number; count: number }[];
  expensesByMonth: { month: string; total: number; count: number }[];
  topWallets: { name: string; amount: number; remaining: number; currency: string }[];
  recentExpenses: { name: string; amount: number; currency: string; date: string; projectName: string }[];
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'today' | 'yesterday' | '7d' | '30d' | 'currentMonth' | 'lastMonth' | 'all'>('30d');
  const [expenseChartType, setExpenseChartType] = useState<'bar' | 'donut'>('donut');
  const [projectChartType, setProjectChartType] = useState<'bar' | 'radar'>('bar');
  const [showMonthlyTrend, setShowMonthlyTrend] = useState(true);

  useEffect(() => {
    fetchAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period]);

  const fetchAnalytics = async () => {
    try {
      const res = await fetch(`/api/finance/analytics?period=${period}`);
      if (res.ok) {
        const analytics = await res.json();
        setData(analytics);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
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
      'MATERIAL': 'bg-blue-500',
      'LICENSE': 'bg-purple-500',
      'OTHER': 'bg-gray-500'
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

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-600 dark:text-gray-400">Erreur de chargement</p>
        </div>
      </div>
    );
  }

  const budgetUsagePercent = data.totalBudget > 0 ? (data.totalExpenses / data.totalBudget) * 100 : 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Analytics & Statistics
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Vue d&apos;ensemble des finances et statistiques détaillées
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setPeriod('today')}
                className={`px-4 py-2 rounded-lg text-sm ${period === 'today' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white'}`}
              >
                Aujourd&apos;hui
              </button>
              <button
                onClick={() => setPeriod('yesterday')}
                className={`px-4 py-2 rounded-lg text-sm ${period === 'yesterday' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white'}`}
              >
                Hier
              </button>
              <button
                onClick={() => setPeriod('7d')}
                className={`px-4 py-2 rounded-lg text-sm ${period === '7d' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white'}`}
              >
                7 jours
              </button>
              <button
                onClick={() => setPeriod('30d')}
                className={`px-4 py-2 rounded-lg text-sm ${period === '30d' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white'}`}
              >
                30 jours
              </button>
              <button
                onClick={() => setPeriod('currentMonth')}
                className={`px-4 py-2 rounded-lg text-sm ${period === 'currentMonth' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white'}`}
              >
                Mois actuel
              </button>
              <button
                onClick={() => setPeriod('lastMonth')}
                className={`px-4 py-2 rounded-lg text-sm ${period === 'lastMonth' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white'}`}
              >
                Mois dernier
              </button>
              <button
                onClick={() => setPeriod('all')}
                className={`px-4 py-2 rounded-lg text-sm ${period === 'all' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white'}`}
              >
                Tout
              </button>
            </div>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Projets Actifs</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {data.activeProjects}
                </p>
                <p className="text-xs text-gray-500 mt-1">sur {data.totalProjects} total</p>
              </div>
              <FolderOpen className="w-12 h-12 text-blue-600" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Portefeuilles</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {data.totalWallets}
                </p>
                <p className="text-xs text-gray-500 mt-1">actifs</p>
              </div>
              <Wallet className="w-12 h-12 text-green-600" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Budget Total</p>
                <p className="text-3xl font-bold text-green-600">
                  ₿ {formatAmount(data.totalBudget, 'BTC')}
                </p>
                <p className="text-xs text-gray-500 mt-1">disponible</p>
              </div>
              <DollarSign className="w-12 h-12 text-green-600" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Dépenses Totales</p>
                <p className="text-3xl font-bold text-red-600">
                  ₿ {formatAmount(data.totalExpenses, 'BTC')}
                </p>
                <p className="text-xs text-gray-500 mt-1">{budgetUsagePercent.toFixed(1)}% utilisé</p>
              </div>
              <TrendingDown className="w-12 h-12 text-red-600" />
            </div>
          </Card>
        </div>

        {/* Budget Usage with Circular Progress */}
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <Activity className="w-5 h-5 mr-2" />
            Utilisation du Budget
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Circular Progress */}
            <div className="flex items-center justify-center">
              <div className="relative w-64 h-64">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="128"
                    cy="128"
                    r="100"
                    stroke="currentColor"
                    strokeWidth="16"
                    fill="none"
                    className="text-gray-200 dark:text-gray-700"
                  />
                  <circle
                    cx="128"
                    cy="128"
                    r="100"
                    stroke="currentColor"
                    strokeWidth="16"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 100}`}
                    strokeDashoffset={`${2 * Math.PI * 100 * (1 - budgetUsagePercent / 100)}`}
                    className={`transition-all ${
                      budgetUsagePercent > 90 ? 'text-red-600' : 
                      budgetUsagePercent > 70 ? 'text-orange-500' : 
                      'text-green-600'
                    }`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-bold text-gray-900 dark:text-white">
                    {budgetUsagePercent.toFixed(1)}%
                  </span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">utilisé</span>
                </div>
              </div>
            </div>
            
            {/* Stats */}
            <div className="flex flex-col justify-center space-y-6">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Budget Total</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  ₿ {formatAmount(data.totalBudget, 'BTC')}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Dépensé</p>
                <p className="text-3xl font-bold text-red-600">
                  ₿ {formatAmount(data.totalExpenses, 'BTC')}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Restant</p>
                <p className="text-3xl font-bold text-green-600">
                  ₿ {formatAmount(data.totalRemaining, 'BTC')}
                </p>
              </div>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Expenses by Type - with chart type toggle */}
          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
                <PieChart className="w-5 h-5 mr-2" />
                Dépenses par Type
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setExpenseChartType('donut')}
                  className={`p-2 rounded ${expenseChartType === 'donut' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
                  title="Donut Chart"
                >
                  <PieChart className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setExpenseChartType('bar')}
                  className={`p-2 rounded ${expenseChartType === 'bar' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
                  title="Bar Chart"
                >
                  <BarChart3 className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            {expenseChartType === 'donut' ? (
              <div className="flex items-center justify-center py-8">
                <div className="relative w-64 h-64">
                  {data.expensesByType.length > 0 ? (
                    <>
                      <svg className="w-full h-full transform -rotate-90">
                        {(() => {
                          const total = data.expensesByType.reduce((sum, i) => sum + i.total, 0);
                          let currentAngle = 0;
                          const colors = ['#3b82f6', '#8b5cf6', '#6b7280']; // blue, purple, gray
                          
                          return data.expensesByType.map((item, index) => {
                            const percentage = total > 0 ? (item.total / total) * 100 : 0;
                            const angle = (percentage / 100) * 360;
                            const radius = 100;
                            const circumference = 2 * Math.PI * radius;
                            const strokeDasharray = `${(angle / 360) * circumference} ${circumference}`;
                            const rotation = currentAngle;
                            currentAngle += angle;
                            
                            return (
                              <circle
                                key={index}
                                cx="128"
                                cy="128"
                                r={radius}
                                stroke={colors[index % colors.length]}
                                strokeWidth="40"
                                fill="none"
                                strokeDasharray={strokeDasharray}
                                style={{ transform: `rotate(${rotation}deg)`, transformOrigin: '128px 128px' }}
                              />
                            );
                          });
                        })()}
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-3xl font-bold text-gray-900 dark:text-white">
                          {data.expensesByType.length}
                        </span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">types</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      Aucune donnée
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {data.expensesByType.map((item, index) => {
                  const total = data.expensesByType.reduce((sum, i) => sum + i.total, 0);
                  const percentage = total > 0 ? (item.total / total) * 100 : 0;
                  return (
                    <div key={index}>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {getExpenseTypeLabel(item.type)} ({item.count})
                        </span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          ₿ {formatAmount(item.total, 'BTC')}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${getExpenseTypeColor(item.type)}`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            
            {/* Legend */}
            <div className="mt-6 flex flex-wrap gap-4 justify-center">
              {data.expensesByType.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${getExpenseTypeColor(item.type)}`} />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {getExpenseTypeLabel(item.type)}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          {/* Top Wallets */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <Wallet className="w-5 h-5 mr-2" />
              Top Portefeuilles
            </h2>
            <div className="space-y-3">
              {data.topWallets.map((wallet, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white">{wallet.name}</p>
                    <p className="text-xs text-gray-500">
                      {getCurrencySymbol(wallet.currency)} {formatAmount(wallet.remaining, wallet.currency)} restant
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-green-600">
                      {getCurrencySymbol(wallet.currency)} {formatAmount(wallet.amount, wallet.currency)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Expenses by Project - with chart type toggle */}
        <Card className="p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
              <BarChart3 className="w-5 h-5 mr-2" />
              Dépenses par Projet
            </h2>
            <div className="flex gap-2">
              <button
                onClick={() => setProjectChartType('bar')}
                className={`p-2 rounded ${projectChartType === 'bar' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
                title="Bar Chart"
              >
                <BarChart3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setProjectChartType('radar')}
                className={`p-2 rounded ${projectChartType === 'radar' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
                title="Radar Chart"
              >
                <Radar className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          {projectChartType === 'bar' ? (
            <div className="space-y-4">
              {data.expensesByProject.map((item, index) => {
                const maxExpense = Math.max(...data.expensesByProject.map(p => p.total));
                const barWidth = maxExpense > 0 ? (item.total / maxExpense) * 100 : 0;
                return (
                  <div key={index}>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {item.projectName} ({item.count} dépenses)
                      </span>
                      <span className="text-sm font-medium text-red-600">
                        ₿ {formatAmount(item.total, 'BTC')}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                      <div
                        className="bg-red-600 h-3 rounded-full"
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center justify-center py-8">
              <div className="relative w-96 h-96">
                {data.expensesByProject.length > 0 ? (
                  <svg className="w-full h-full" viewBox="0 0 400 400">
                    {/* Grid circles */}
                    {[0.2, 0.4, 0.6, 0.8, 1.0].map((scale, i) => (
                      <circle
                        key={i}
                        cx="200"
                        cy="200"
                        r={scale * 150}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1"
                        className="text-gray-300 dark:text-gray-600"
                      />
                    ))}
                    
                    {/* Axes */}
                    {data.expensesByProject.map((_, index) => {
                      const angle = (index / data.expensesByProject.length) * 2 * Math.PI - Math.PI / 2;
                      const x = 200 + Math.cos(angle) * 150;
                      const y = 200 + Math.sin(angle) * 150;
                      return (
                        <line
                          key={index}
                          x1="200"
                          y1="200"
                          x2={x}
                          y2={y}
                          stroke="currentColor"
                          strokeWidth="1"
                          className="text-gray-300 dark:text-gray-600"
                        />
                      );
                    })}
                    
                    {/* Data polygon */}
                    <polygon
                      points={data.expensesByProject.map((item, index) => {
                        const maxExpense = Math.max(...data.expensesByProject.map(p => p.total));
                        const normalized = maxExpense > 0 ? item.total / maxExpense : 0;
                        const angle = (index / data.expensesByProject.length) * 2 * Math.PI - Math.PI / 2;
                        const x = 200 + Math.cos(angle) * normalized * 150;
                        const y = 200 + Math.sin(angle) * normalized * 150;
                        return `${x},${y}`;
                      }).join(' ')}
                      fill="rgb(239, 68, 68)"
                      fillOpacity="0.3"
                      stroke="rgb(239, 68, 68)"
                      strokeWidth="2"
                    />
                    
                    {/* Data points */}
                    {data.expensesByProject.map((item, index) => {
                      const maxExpense = Math.max(...data.expensesByProject.map(p => p.total));
                      const normalized = maxExpense > 0 ? item.total / maxExpense : 0;
                      const angle = (index / data.expensesByProject.length) * 2 * Math.PI - Math.PI / 2;
                      const x = 200 + Math.cos(angle) * normalized * 150;
                      const y = 200 + Math.sin(angle) * normalized * 150;
                      return (
                        <circle
                          key={index}
                          cx={x}
                          cy={y}
                          r="4"
                          fill="rgb(239, 68, 68)"
                        />
                      );
                    })}
                    
                    {/* Labels */}
                    {data.expensesByProject.map((item, index) => {
                      const angle = (index / data.expensesByProject.length) * 2 * Math.PI - Math.PI / 2;
                      const x = 200 + Math.cos(angle) * 180;
                      const y = 200 + Math.sin(angle) * 180;
                      return (
                        <text
                          key={index}
                          x={x}
                          y={y}
                          textAnchor="middle"
                          className="text-xs fill-current text-gray-700 dark:text-gray-300"
                          dominantBaseline="middle"
                        >
                          {item.projectName.length > 15 ? item.projectName.substring(0, 12) + '...' : item.projectName}
                        </text>
                      );
                    })}
                  </svg>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    Aucune donnée
                  </div>
                )}
              </div>
            </div>
          )}
        </Card>

        {/* Expenses by Month - with toggle for line/bar */}
        <Card className="p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              Dépenses par Mois
            </h2>
            <div className="flex gap-2">
              <button
                onClick={() => setShowMonthlyTrend(false)}
                className={`p-2 rounded ${!showMonthlyTrend ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
                title="Bar Chart"
              >
                <BarChart3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setShowMonthlyTrend(true)}
                className={`p-2 rounded ${showMonthlyTrend ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
                title="Line Chart"
              >
                <LineChart className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          {showMonthlyTrend && data.expensesByMonth.length > 1 ? (
            <div className="relative h-64">
              <svg className="w-full h-full" viewBox="0 0 800 300">
                {/* Y-axis grid lines */}
                {[0, 0.25, 0.5, 0.75, 1].map((scale, i) => (
                  <g key={i}>
                    <line
                      x1="60"
                      y1={250 - scale * 200}
                      x2="780"
                      y2={250 - scale * 200}
                      stroke="currentColor"
                      strokeWidth="1"
                      strokeDasharray="5,5"
                      className="text-gray-300 dark:text-gray-600"
                    />
                  </g>
                ))}
                
                {/* Line chart */}
                {(() => {
                  const maxExpense = Math.max(...data.expensesByMonth.map(m => m.total), 1);
                  const points = data.expensesByMonth.map((item, index) => {
                    const x = 60 + (index / (data.expensesByMonth.length - 1)) * 720;
                    const y = 250 - (item.total / maxExpense) * 200;
                    return { x, y, item };
                  });
                  
                  const pathData = points.map((p, i) => 
                    `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`
                  ).join(' ');
                  
                  return (
                    <>
                      {/* Area fill */}
                      <path
                        d={`${pathData} L ${points[points.length - 1].x} 250 L 60 250 Z`}
                        fill="rgb(59, 130, 246)"
                        fillOpacity="0.2"
                      />
                      
                      {/* Line */}
                      <path
                        d={pathData}
                        fill="none"
                        stroke="rgb(59, 130, 246)"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      
                      {/* Points */}
                      {points.map((p, i) => (
                        <g key={i}>
                          <circle
                            cx={p.x}
                            cy={p.y}
                            r="5"
                            fill="rgb(59, 130, 246)"
                            stroke="white"
                            strokeWidth="2"
                          />
                          
                          {/* X-axis labels */}
                          <text
                            x={p.x}
                            y="270"
                            textAnchor="middle"
                            className="text-xs fill-current text-gray-600 dark:text-gray-400"
                          >
                            {p.item.month}
                          </text>
                          
                          {/* Value labels */}
                          <text
                            x={p.x}
                            y={p.y - 10}
                            textAnchor="middle"
                            className="text-xs fill-current text-gray-900 dark:text-white font-medium"
                          >
                            ₿ {formatAmount(p.item.total, 'BTC')}
                          </text>
                        </g>
                      ))}
                    </>
                  );
                })()}
              </svg>
            </div>
          ) : (
            <div className="space-y-4">
              {data.expensesByMonth.map((item, index) => {
                const maxExpense = Math.max(...data.expensesByMonth.map(m => m.total));
                const barHeight = maxExpense > 0 ? (item.total / maxExpense) * 100 : 0;
                return (
                  <div key={index} className="flex items-end gap-3">
                    <div className="w-24 text-sm text-gray-600 dark:text-gray-400">
                      {item.month}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                        <span className="text-xs text-gray-500">{item.count} dépenses</span>
                        <span className="text-sm font-medium text-red-600">
                          ₿ {formatAmount(item.total, 'BTC')}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${barHeight}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Recent Expenses */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Dépenses Récentes
          </h2>
          <div className="space-y-3">
            {data.recentExpenses.map((expense, index) => (
              <div key={index} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-white">{expense.name}</p>
                  <p className="text-xs text-gray-500">
                    {expense.projectName} • {new Date(expense.date).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-red-600">
                    {getCurrencySymbol(expense.currency)} {formatAmount(expense.amount, expense.currency)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
