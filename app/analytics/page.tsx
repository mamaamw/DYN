'use client';

import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Users, CheckSquare, Calendar, Search, AlertCircle, Clock, Target, Activity, RefreshCw } from 'lucide-react';

interface AnalyticsData {
  overview: {
    totalClients: number;
    totalUsers: number;
    totalTodos: number;
    totalTasks: number;
    totalEvents: number;
    totalSearches: number;
    successRate: string;
    failureRate: string;
  };
  timeSeries: Array<{
    date: string;
    clients: number;
    todos: number;
    tasks: number;
    events: number;
  }>;
  clientsByPriority: Array<{ priority: string; count: number }>;
  todosByStatus: Array<{ status: string; count: number }>;
  todosByTool: Array<{ tool: string; count: number }>;
  todosByAction: Array<{ action: string; count: number }>;
  tasksByStatus: Array<{ status: string; count: number }>;
  tasksByPriority: Array<{ priority: string; count: number }>;
  logsByLevel: Array<{ level: string; count: number }>;
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month');

  useEffect(() => {
    loadAnalytics();
  }, [period]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/analytics?period=${period}`);
      if (response.ok) {
        const analyticsData = await response.json();
        setData(analyticsData);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    if (period === 'year') {
      return date.toLocaleDateString('fr-FR', { month: 'short' });
    } else if (period === 'month') {
      return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    }
    return date.toLocaleDateString('fr-FR', { weekday: 'short' });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Immédiate': return 'bg-red-500';
      case 'Haute': return 'bg-orange-500';
      case 'Moyenne': return 'bg-yellow-500';
      case 'Faible': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusColor = (status: string) => {
    if (status.includes('succes')) return 'bg-green-500';
    if (status === 'failed') return 'bg-red-500';
    if (status === 'cooldown') return 'bg-yellow-500';
    return 'bg-blue-500';
  };

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-500 text-lg flex items-center gap-2">
          <RefreshCw className="w-5 h-5 animate-spin" />
          Chargement des analytics...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytiques</h1>
          <p className="text-gray-600 mt-1">
            Vue d'ensemble complète de vos métriques d'activité
          </p>
        </div>
        
        {/* Period Selector */}
        <div className="flex gap-2 bg-white rounded-lg shadow p-1">
          <button
            onClick={() => setPeriod('week')}
            className={`px-4 py-2 rounded font-medium text-sm transition ${
              period === 'week'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Semaine
          </button>
          <button
            onClick={() => setPeriod('month')}
            className={`px-4 py-2 rounded font-medium text-sm transition ${
              period === 'month'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Mois
          </button>
          <button
            onClick={() => setPeriod('year')}
            className={`px-4 py-2 rounded font-medium text-sm transition ${
              period === 'year'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Année
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Clients</p>
              <h3 className="text-3xl font-bold text-gray-900 mt-2">
                {data.overview.totalClients}
              </h3>
              <p className="text-gray-500 text-sm mt-2">Enregistrés</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users size={24} className="text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Tâches</p>
              <h3 className="text-3xl font-bold text-gray-900 mt-2">{data.overview.totalTodos + data.overview.totalTasks}</h3>
              <p className="text-gray-500 text-sm mt-2">Todos + Tasks</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckSquare size={24} className="text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Taux de Succès</p>
              <h3 className="text-3xl font-bold text-gray-900 mt-2">{data.overview.successRate}%</h3>
              <p className="text-green-600 text-sm mt-2">Todos réussis</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <Target size={24} className="text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Taux d'Échec</p>
              <h3 className="text-3xl font-bold text-gray-900 mt-2">{data.overview.failureRate}%</h3>
              <p className="text-red-600 text-sm mt-2">Todos échoués</p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <AlertCircle size={24} className="text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Time Series Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">
          Évolution Temporelle - {period === 'week' ? 'Dernière Semaine' : period === 'month' ? 'Dernier Mois' : 'Dernière Année'}
        </h3>
        <div className="h-80 flex items-end justify-between gap-2 border-b border-l border-gray-200 pb-4 pl-4">
          {data.timeSeries.map((item, idx) => {
            const maxValue = Math.max(
              ...data.timeSeries.map(d => Math.max(d.clients, d.todos, d.tasks, d.events))
            );
            const clientsHeight = (item.clients / maxValue) * 100;
            const todosHeight = (item.todos / maxValue) * 100;
            const tasksHeight = (item.tasks / maxValue) * 100;
            
            return (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full flex flex-col items-center gap-1">
                  <div className="w-full flex justify-center items-end gap-0.5" style={{ height: '250px' }}>
                    <div
                      className="flex-1 bg-blue-500 rounded-t hover:bg-blue-600 transition cursor-pointer group relative"
                      style={{ height: `${clientsHeight}%` }}
                      title={`Clients: ${item.clients}`}
                    >
                      <span className="absolute -top-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
                        Clients: {item.clients}
                      </span>
                    </div>
                    <div
                      className="flex-1 bg-green-500 rounded-t hover:bg-green-600 transition cursor-pointer group relative"
                      style={{ height: `${todosHeight}%` }}
                      title={`Todos: ${item.todos}`}
                    >
                      <span className="absolute -top-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
                        Todos: {item.todos}
                      </span>
                    </div>
                    <div
                      className="flex-1 bg-purple-500 rounded-t hover:bg-purple-600 transition cursor-pointer group relative"
                      style={{ height: `${tasksHeight}%` }}
                      title={`Tasks: ${item.tasks}`}
                    >
                      <span className="absolute -top-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
                        Tasks: {item.tasks}
                      </span>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-gray-600 text-center">{formatDate(item.date)}</p>
              </div>
            );
          })}
        </div>
        <div className="flex justify-center gap-6 mt-6">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded"></div>
            <span className="text-sm text-gray-600">Clients</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span className="text-sm text-gray-600">Todos</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-purple-500 rounded"></div>
            <span className="text-sm text-gray-600">Tasks</span>
          </div>
        </div>
      </div>

      {/* Statistics Grids */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Clients par Priorité */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Clients par Priorité</h3>
          <div className="space-y-3">
            {data.clientsByPriority.map((item) => {
              const total = data.clientsByPriority.reduce((sum, i) => sum + i.count, 0);
              const percentage = ((item.count / total) * 100).toFixed(1);
              return (
                <div key={item.priority}>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">{item.priority}</span>
                    <span className="text-sm text-gray-600">{item.count} ({percentage}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className={`h-2.5 rounded-full ${getPriorityColor(item.priority)}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Todos par Statut */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Todos par Statut</h3>
          <div className="space-y-3">
            {data.todosByStatus.map((item) => {
              const total = data.todosByStatus.reduce((sum, i) => sum + i.count, 0);
              const percentage = ((item.count / total) * 100).toFixed(1);
              return (
                <div key={item.status}>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700 capitalize">{item.status}</span>
                    <span className="text-sm text-gray-600">{item.count} ({percentage}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className={`h-2.5 rounded-full ${getStatusColor(item.status)}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Todos par Outil */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Todos par Outil</h3>
          {data.todosByTool.length > 0 ? (
            <div className="space-y-3">
              {data.todosByTool.map((item) => {
                const total = data.todosByTool.reduce((sum, i) => sum + i.count, 0);
                const percentage = ((item.count / total) * 100).toFixed(1);
                return (
                  <div key={item.tool}>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Outil {item.tool}</span>
                      <span className="text-sm text-gray-600">{item.count} ({percentage}%)</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className="h-2.5 rounded-full bg-blue-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-500 text-sm text-center py-8">Aucune donnée disponible</p>
          )}
        </div>

        {/* Todos par Action */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Todos par Type d'Action</h3>
          {data.todosByAction.length > 0 ? (
            <div className="space-y-3">
              {data.todosByAction.map((item) => {
                const total = data.todosByAction.reduce((sum, i) => sum + i.count, 0);
                const percentage = ((item.count / total) * 100).toFixed(1);
                return (
                  <div key={item.action}>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700 capitalize">{item.action}</span>
                      <span className="text-sm text-gray-600">{item.count} ({percentage}%)</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className="h-2.5 rounded-full bg-purple-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-500 text-sm text-center py-8">Aucune donnée disponible</p>
          )}
        </div>

        {/* Tasks par Statut */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Tasks par Statut</h3>
          <div className="space-y-3">
            {data.tasksByStatus.map((item) => {
              const total = data.tasksByStatus.reduce((sum, i) => sum + i.count, 0);
              const percentage = ((item.count / total) * 100).toFixed(1);
              return (
                <div key={item.status}>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">{item.status}</span>
                    <span className="text-sm text-gray-600">{item.count} ({percentage}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="h-2.5 rounded-full bg-green-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tasks par Priorité */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Tasks par Priorité</h3>
          <div className="space-y-3">
            {data.tasksByPriority.map((item) => {
              const total = data.tasksByPriority.reduce((sum, i) => sum + i.count, 0);
              const percentage = ((item.count / total) * 100).toFixed(1);
              return (
                <div key={item.priority}>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">{item.priority}</span>
                    <span className="text-sm text-gray-600">{item.count} ({percentage}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="h-2.5 rounded-full bg-orange-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Logs System */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Logs Système (30 derniers jours)</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {data.logsByLevel.map((item) => {
            const colors: any = {
              INFO: 'bg-blue-100 text-blue-700 border-blue-200',
              WARNING: 'bg-yellow-100 text-yellow-700 border-yellow-200',
              ERROR: 'bg-orange-100 text-orange-700 border-orange-200',
              CRITICAL: 'bg-red-100 text-red-700 border-red-200',
            };
            return (
              <div key={item.level} className={`p-4 rounded-lg border ${colors[item.level] || 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                <p className="text-2xl font-bold">{item.count}</p>
                <p className="text-sm font-medium mt-1">{item.level}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg shadow p-6 border border-blue-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistiques Globales</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="text-center">
            <div className="w-12 h-12 mx-auto bg-blue-500 rounded-full flex items-center justify-center mb-2">
              <Users className="w-6 h-6 text-white" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{data.overview.totalClients}</p>
            <p className="text-sm text-gray-600 mt-1">Clients</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 mx-auto bg-green-500 rounded-full flex items-center justify-center mb-2">
              <CheckSquare className="w-6 h-6 text-white" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{data.overview.totalTodos}</p>
            <p className="text-sm text-gray-600 mt-1">Todos</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 mx-auto bg-purple-500 rounded-full flex items-center justify-center mb-2">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{data.overview.totalTasks}</p>
            <p className="text-sm text-gray-600 mt-1">Tasks</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 mx-auto bg-orange-500 rounded-full flex items-center justify-center mb-2">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{data.overview.totalEvents}</p>
            <p className="text-sm text-gray-600 mt-1">Événements</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 mx-auto bg-teal-500 rounded-full flex items-center justify-center mb-2">
              <Search className="w-6 h-6 text-white" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{data.overview.totalSearches}</p>
            <p className="text-sm text-gray-600 mt-1">Recherches</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 mx-auto bg-pink-500 rounded-full flex items-center justify-center mb-2">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{data.overview.totalUsers}</p>
            <p className="text-sm text-gray-600 mt-1">Utilisateurs</p>
          </div>
        </div>
      </div>
    </div>
  );
}
