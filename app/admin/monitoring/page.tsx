'use client';

import { useEffect, useState } from 'react';
import {
  Activity,
  RefreshCw,
  Users,
  Database,
  FileText,
  AlertTriangle,
  CheckCircle,
  Info,
  TrendingUp,
  Clock,
  HardDrive,
  Cpu,
  Server
} from 'lucide-react';
import Toast, { ToastType } from '@/components/ui/Toast';

interface MonitoringData {
  system: {
    nodeVersion: string;
    platform: string;
    uptime: number;
    pid: number;
    memory: {
      used: number;
      total: number;
      percentage: number;
    };
  };
  users: {
    total: number;
    active: number;
    last24h: number;
    last7days: number;
    deleted: number;
    topActive: Array<{
      id: number;
      username: string;
      email: string;
      firstName: string;
      lastName: string;
      actionCount: number;
    }>;
  };
  database: {
    size: number;
    tables: {
      clients: number;
      newClients: number;
      categories: number;
      searches: number;
    };
  };
  logs: {
    total: number;
    last24h: number;
    last7days: number;
    errors: number;
    warnings: number;
    recent: Array<{
      id: number;
      action: string;
      entity: string;
      description: string;
      level: string;
      createdAt: string;
      user?: {
        username: string;
        email: string;
      };
    }>;
    actionStats: Array<{
      action: string;
      count: number;
    }>;
  };
  alerts: Array<{
    level: 'error' | 'warning' | 'info';
    message: string;
    timestamp: string;
  }>;
  timestamp: string;
}

export default function MonitoringPage() {
  const [data, setData] = useState<MonitoringData | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/admin/monitoring');
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Erreur lors du chargement');
      }

      const result = await res.json();
      setData(result);
      setLoading(false);
    } catch (error: any) {
      console.error('Erreur fetchData:', error);
      setToast({
        message: error.message || 'Erreur lors du chargement des données',
        type: 'error'
      });
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Auto-refresh toutes les 30 secondes
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(fetchData, 30000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  const formatUptime = (seconds: number): string => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}j ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const getAlertIcon = (level: string) => {
    switch (level) {
      case 'error':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-orange-500" />;
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getAlertBg = (level: string) => {
    switch (level) {
      case 'error':
        return 'bg-red-900/20 border-red-600/30';
      case 'warning':
        return 'bg-orange-900/20 border-orange-600/30';
      default:
        return 'bg-blue-900/20 border-blue-600/30';
    }
  };

  const getLevelBadge = (level: string) => {
    const colors: Record<string, string> = {
      ERROR: 'bg-red-600',
      WARNING: 'bg-orange-600',
      INFO: 'bg-blue-600',
      CRITICAL: 'bg-red-700'
    };
    return colors[level] || 'bg-gray-600';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-blue-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Chargement des métriques...</p>
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
            <Activity className="w-8 h-8 text-blue-400" />
            <h1 className="text-3xl font-bold">Surveillance Système</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm text-gray-300">Auto-refresh (30s)</span>
            </label>
            
            <button
              onClick={fetchData}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Actualiser
            </button>
          </div>
        </div>

        {/* Alertes */}
        {data.alerts.length > 0 && (
          <div className="mb-6 space-y-3">
            {data.alerts.map((alert, idx) => (
              <div
                key={idx}
                className={`flex items-start gap-3 p-4 border rounded-lg ${getAlertBg(alert.level)}`}
              >
                {getAlertIcon(alert.level)}
                <div className="flex-1">
                  <p className="text-sm">{alert.message}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(alert.timestamp).toLocaleString('fr-FR')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Stats système */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {/* Uptime */}
          <div className="bg-slate-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <Clock className="w-6 h-6 text-green-400" />
              <CheckCircle className="w-5 h-5 text-green-500" />
            </div>
            <h3 className="text-gray-400 text-sm mb-1">Uptime Serveur</h3>
            <p className="text-2xl font-bold">{formatUptime(data.system.uptime)}</p>
            <p className="text-xs text-gray-500 mt-2">Node.js {data.system.nodeVersion}</p>
          </div>

          {/* Mémoire */}
          <div className="bg-slate-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <HardDrive className="w-6 h-6 text-purple-400" />
              <span className={`text-sm px-2 py-1 rounded ${
                data.system.memory.percentage > 80 ? 'bg-red-600' :
                data.system.memory.percentage > 60 ? 'bg-orange-600' :
                'bg-green-600'
              }`}>
                {data.system.memory.percentage.toFixed(1)}%
              </span>
            </div>
            <h3 className="text-gray-400 text-sm mb-1">Mémoire</h3>
            <p className="text-2xl font-bold">{formatBytes(data.system.memory.used)}</p>
            <p className="text-xs text-gray-500 mt-2">sur {formatBytes(data.system.memory.total)}</p>
          </div>

          {/* Utilisateurs actifs */}
          <div className="bg-slate-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <Users className="w-6 h-6 text-blue-400" />
              <TrendingUp className="w-5 h-5 text-blue-500" />
            </div>
            <h3 className="text-gray-400 text-sm mb-1">Utilisateurs (24h)</h3>
            <p className="text-2xl font-bold">{data.users.last24h}</p>
            <p className="text-xs text-gray-500 mt-2">{data.users.active} actifs / {data.users.total} total</p>
          </div>

          {/* Base de données */}
          <div className="bg-slate-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <Database className="w-6 h-6 text-orange-400" />
              <Server className="w-5 h-5 text-orange-500" />
            </div>
            <h3 className="text-gray-400 text-sm mb-1">Taille BDD</h3>
            <p className="text-2xl font-bold">{formatBytes(data.database.size)}</p>
            <p className="text-xs text-gray-500 mt-2">{data.logs.total.toLocaleString()} logs</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Actions récentes (24h) */}
          <div className="bg-slate-800 rounded-lg border border-gray-700">
            <div className="p-6 border-b border-gray-700">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-400" />
                Actions Populaires (24h)
              </h2>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {data.logs.actionStats.slice(0, 8).map((stat, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <span className="text-sm text-gray-300">{stat.action}</span>
                    <span className="text-sm font-semibold px-3 py-1 bg-blue-600/20 text-blue-400 rounded">
                      {stat.count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Utilisateurs les plus actifs */}
          <div className="bg-slate-800 rounded-lg border border-gray-700">
            <div className="p-6 border-b border-gray-700">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Users className="w-5 h-5 text-green-400" />
                Utilisateurs Actifs (24h)
              </h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {data.users.topActive.map((user, idx) => (
                  <div key={user.id} className="flex items-center gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-sm font-bold">
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-xs text-gray-400 truncate">{user.email}</p>
                    </div>
                    <span className="text-sm font-semibold px-3 py-1 bg-green-600/20 text-green-400 rounded">
                      {user.actionCount} actions
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Statistiques des logs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-slate-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center gap-3 mb-2">
              <FileText className="w-5 h-5 text-blue-400" />
              <h3 className="text-sm font-medium text-gray-400">Logs 24h</h3>
            </div>
            <p className="text-3xl font-bold">{data.logs.last24h.toLocaleString()}</p>
          </div>

          <div className="bg-slate-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center gap-3 mb-2">
              <FileText className="w-5 h-5 text-purple-400" />
              <h3 className="text-sm font-medium text-gray-400">Logs 7j</h3>
            </div>
            <p className="text-3xl font-bold">{data.logs.last7days.toLocaleString()}</p>
          </div>

          <div className="bg-slate-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center gap-3 mb-2">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              <h3 className="text-sm font-medium text-gray-400">Erreurs</h3>
            </div>
            <p className="text-3xl font-bold text-red-400">{data.logs.errors}</p>
          </div>

          <div className="bg-slate-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center gap-3 mb-2">
              <AlertTriangle className="w-5 h-5 text-orange-400" />
              <h3 className="text-sm font-medium text-gray-400">Avertissements</h3>
            </div>
            <p className="text-3xl font-bold text-orange-400">{data.logs.warnings}</p>
          </div>
        </div>

        {/* Logs récents */}
        <div className="bg-slate-800 rounded-lg border border-gray-700">
          <div className="p-6 border-b border-gray-700">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-400" />
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
                {data.logs.recent.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-700/30">
                    <td className="px-4 py-3 text-sm whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString('fr-FR')}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {log.user?.username || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm font-mono">{log.action}</td>
                    <td className="px-4 py-3 text-sm">{log.description}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 text-xs rounded ${getLevelBadge(log.level)}`}>
                        {log.level}
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
