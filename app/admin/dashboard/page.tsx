'use client';

import { useEffect, useState } from 'react';
import {
  Shield,
  Users,
  Briefcase,
  FileText,
  TrendingUp,
  AlertTriangle,
  Activity,
  RefreshCw,
  ArrowUp,
  ArrowDown,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Tag,
  Phone
} from 'lucide-react';
import Toast, { ToastType } from '@/components/ui/Toast';

interface DashboardData {
  users: {
    total: number;
    active: number;
    newToday: number;
    new7Days: number;
    new30Days: number;
    deleted: number;
    byRole: Array<{ role: string; count: number }>;
  };
  clients: {
    totalOld: number;
    totalNew: number;
    total: number;
    newToday: number;
    new7Days: number;
    new30Days: number;
    deleted: number;
    byPriority: Array<{ priority: string; count: number }>;
  };
  logs: {
    total: number;
    today: number;
    last7Days: number;
    last30Days: number;
    errors: number;
    warnings: number;
    critical: number;
    activityByDay: Array<{ date: string; count: number }>;
  };
  stats: {
    categories: number;
    searches: number;
    searchesLast7Days: number;
    contactIdentifiers: number;
  };
  recentActivity: Array<{
    id: number;
    action: string;
    entity: string;
    description: string;
    level: string;
    createdAt: string;
    user?: {
      username: string;
      firstName: string;
      lastName: string;
    };
  }>;
  recentErrors: Array<{
    id: number;
    action: string;
    description: string;
    level: string;
    createdAt: string;
  }>;
  topUsers: Array<{
    id: number;
    username: string;
    firstName: string;
    lastName: string;
    role: string;
    actionCount: number;
  }>;
  alerts: Array<{
    level: string;
    title: string;
    message: string;
    count: number;
  }>;
  timestamp: string;
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/dashboard');
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Erreur lors du chargement');
      }

      const result = await res.json();
      setData(result);
    } catch (error: any) {
      console.error('Erreur fetchData:', error);
      setToast({
        message: error.message || 'Erreur lors du chargement des données',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getAlertColor = (level: string) => {
    switch (level) {
      case 'critical':
        return 'bg-red-900/30 border-red-600/50 text-red-200';
      case 'error':
        return 'bg-red-900/20 border-red-600/30 text-red-300';
      case 'warning':
        return 'bg-orange-900/20 border-orange-600/30 text-orange-300';
      default:
        return 'bg-blue-900/20 border-blue-600/30 text-blue-300';
    }
  };

  const getLevelBadge = (level: string) => {
    const colors: Record<string, string> = {
      CRITICAL: 'bg-red-700 text-white',
      ERROR: 'bg-red-600 text-white',
      WARNING: 'bg-orange-600 text-white',
      INFO: 'bg-blue-600 text-white'
    };
    return colors[level] || 'bg-gray-600 text-white';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Immédiate':
        return 'text-red-400';
      case 'Haute':
        return 'text-orange-400';
      case 'Moyenne':
        return 'text-yellow-400';
      case 'Faible':
        return 'text-green-400';
      default:
        return 'text-gray-400';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-purple-600';
      case 'MANAGER':
        return 'bg-blue-600';
      case 'USER':
        return 'bg-green-600';
      default:
        return 'bg-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-blue-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Chargement du tableau de bord...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6 flex items-center justify-center">
        <p className="text-gray-400">Aucune donnée disponible</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-purple-400" />
            <div>
              <h1 className="text-3xl font-bold">Vue d'ensemble Administration</h1>
              <p className="text-gray-400 text-sm mt-1">Tableau de bord complet du système</p>
            </div>
          </div>
          
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </button>
        </div>

        {/* Alertes */}
        {data.alerts.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {data.alerts.map((alert, idx) => (
              <div
                key={idx}
                className={`p-4 border rounded-lg ${getAlertColor(alert.level)}`}
              >
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm mb-1">{alert.title}</h3>
                    <p className="text-xs opacity-90">{alert.message}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Statistiques principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {/* Utilisateurs */}
          <div className="bg-slate-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <Users className="w-6 h-6 text-blue-400" />
              <div className="flex items-center gap-1 text-xs">
                <ArrowUp className="w-3 h-3 text-green-400" />
                <span className="text-green-400">+{data.users.new7Days}</span>
                <span className="text-gray-500">7j</span>
              </div>
            </div>
            <h3 className="text-gray-400 text-sm mb-1">Utilisateurs</h3>
            <p className="text-3xl font-bold">{data.users.total}</p>
            <p className="text-xs text-gray-500 mt-2">
              {data.users.active} actifs · {data.users.deleted} supprimés
            </p>
          </div>

          {/* Clients */}
          <div className="bg-slate-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <Briefcase className="w-6 h-6 text-green-400" />
              <div className="flex items-center gap-1 text-xs">
                <ArrowUp className="w-3 h-3 text-green-400" />
                <span className="text-green-400">+{data.clients.new7Days}</span>
                <span className="text-gray-500">7j</span>
              </div>
            </div>
            <h3 className="text-gray-400 text-sm mb-1">Clients</h3>
            <p className="text-3xl font-bold">{data.clients.total}</p>
            <p className="text-xs text-gray-500 mt-2">
              {data.clients.totalNew} nouveaux · {data.clients.totalOld} anciens
            </p>
          </div>

          {/* Logs système */}
          <div className="bg-slate-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <FileText className="w-6 h-6 text-orange-400" />
              <div className="flex items-center gap-1 text-xs">
                <Activity className="w-3 h-3 text-orange-400" />
                <span className="text-orange-400">{data.logs.today}</span>
                <span className="text-gray-500">24h</span>
              </div>
            </div>
            <h3 className="text-gray-400 text-sm mb-1">Logs Système</h3>
            <p className="text-3xl font-bold">{data.logs.total.toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-2">
              {data.logs.errors} erreurs · {data.logs.warnings} avertissements
            </p>
          </div>

          {/* Recherches */}
          <div className="bg-slate-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <Search className="w-6 h-6 text-purple-400" />
              <div className="flex items-center gap-1 text-xs">
                <TrendingUp className="w-3 h-3 text-purple-400" />
                <span className="text-purple-400">{data.stats.searchesLast7Days}</span>
                <span className="text-gray-500">7j</span>
              </div>
            </div>
            <h3 className="text-gray-400 text-sm mb-1">Recherches</h3>
            <p className="text-3xl font-bold">{data.stats.searches}</p>
            <p className="text-xs text-gray-500 mt-2">
              {data.stats.contactIdentifiers} identifiants · {data.stats.categories} catégories
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Utilisateurs par rôle */}
          <div className="bg-slate-800 rounded-lg border border-gray-700">
            <div className="p-6 border-b border-gray-700">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-400" />
                Distribution par Rôle
              </h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {data.users.byRole.map((role) => (
                  <div key={role.role} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 text-xs font-semibold rounded ${getRoleColor(role.role)}`}>
                        {role.role}
                      </span>
                      <span className="text-sm text-gray-300">{role.count} utilisateur(s)</span>
                    </div>
                    <div className="flex-1 mx-4 bg-gray-700 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full ${getRoleColor(role.role)}`}
                        style={{ width: `${(role.count / data.users.total) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-gray-400">
                      {((role.count / data.users.total) * 100).toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Clients par priorité */}
          <div className="bg-slate-800 rounded-lg border border-gray-700">
            <div className="p-6 border-b border-gray-700">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-green-400" />
                Clients par Priorité
              </h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {data.clients.byPriority.map((priority) => (
                  <div key={priority.priority} className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <span className={`font-semibold ${getPriorityColor(priority.priority)}`}>
                        {priority.priority}
                      </span>
                      <span className="text-sm text-gray-400">{priority.count} client(s)</span>
                    </div>
                    <span className={`text-2xl font-bold ${getPriorityColor(priority.priority)}`}>
                      {priority.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Utilisateurs les plus actifs */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-slate-800 rounded-lg border border-gray-700">
            <div className="p-6 border-b border-gray-700">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-purple-400" />
                Utilisateurs les Plus Actifs (7j)
              </h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {data.topUsers.map((user, idx) => (
                  <div key={user.id} className="flex items-center gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-sm font-bold">
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-xs text-gray-400">
                        {user.username} · <span className={`${getRoleColor(user.role)} px-1.5 py-0.5 rounded text-xs`}>{user.role}</span>
                      </p>
                    </div>
                    <span className="text-sm font-semibold px-3 py-1 bg-purple-600/20 text-purple-400 rounded">
                      {user.actionCount} actions
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Erreurs récentes */}
          <div className="bg-slate-800 rounded-lg border border-gray-700">
            <div className="p-6 border-b border-gray-700">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-400" />
                Erreurs Récentes (7j)
              </h2>
            </div>
            <div className="p-6">
              {data.recentErrors.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                  <CheckCircle className="w-12 h-12 text-green-500 mb-3" />
                  <p className="text-sm">Aucune erreur récente</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {data.recentErrors.map((error) => (
                    <div key={error.id} className="p-3 bg-red-900/20 border border-red-600/30 rounded">
                      <div className="flex items-start gap-3">
                        <span className={`px-2 py-0.5 text-xs rounded flex-shrink-0 ${getLevelBadge(error.level)}`}>
                          {error.level}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-mono text-red-300 mb-1">{error.action}</p>
                          <p className="text-xs text-gray-400 truncate">{error.description}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(error.createdAt).toLocaleString('fr-FR')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Activité récente */}
        <div className="bg-slate-800 rounded-lg border border-gray-700">
          <div className="p-6 border-b border-gray-700">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-400" />
              Activité Récente
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-700/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Utilisateur</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Action</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Description</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase">Niveau</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {data.recentActivity.map((activity) => (
                  <tr key={activity.id} className="hover:bg-slate-700/30">
                    <td className="px-4 py-3 text-sm whitespace-nowrap">
                      {new Date(activity.createdAt).toLocaleString('fr-FR', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {activity.user 
                        ? `${activity.user.firstName} ${activity.user.lastName}` 
                        : 'Système'}
                    </td>
                    <td className="px-4 py-3 text-sm font-mono text-blue-400">{activity.action}</td>
                    <td className="px-4 py-3 text-sm text-gray-300 truncate max-w-md">
                      {activity.description}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 text-xs rounded ${getLevelBadge(activity.level)}`}>
                        {activity.level}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <p className="text-xs text-gray-500 text-center mt-6">
          Dernière mise à jour: {new Date(data.timestamp).toLocaleString('fr-FR')}
        </p>
      </div>

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
