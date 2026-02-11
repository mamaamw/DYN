'use client';

import { useState, useEffect } from 'react';
import {
  Database,
  RefreshCw,
  Activity,
  HardDrive,
  Table,
  Zap,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Users,
  FolderOpen,
  Settings,
} from 'lucide-react';
import Toast, { ToastType } from '@/components/ui/Toast';
import ConfirmModal from '@/components/ui/ConfirmModal';

interface TableStats {
  total: number;
  active?: number;
  deleted?: number;
}

interface DatabaseStats {
  tables: {
    users: TableStats;
    clients: TableStats;
    newClients: TableStats;
    categories: number;
    roles: number;
    userCategories: number;
    contactIdentifiers: number;
    searches: number;
    systemLogs: number;
  };
  database: {
    size: number | null;
    tables: Array<{
      name: string;
      size: number;
      rows: number;
    }>;
  };
  activity: {
    recentLogs: Array<{
      action: string;
      createdAt: string;
    }>;
  };
}

export default function DatabasePage() {
  const [stats, setStats] = useState<DatabaseStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<string>('');
  const [executingTask, setExecutingTask] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/database/stats');
      if (!res.ok) {
        setToast({ message: 'Erreur lors du chargement des statistiques', type: 'error' });
        return;
      }
      
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error('Response is not JSON:', await res.text());
        setToast({ message: 'Erreur: réponse invalide du serveur', type: 'error' });
        return;
      }
      
      const data = await res.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
      setToast({ message: 'Erreur lors du chargement des statistiques', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const executeMaintenance = async (task: string) => {
    setExecutingTask(true);
    try {
      const res = await fetch('/api/database/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task }),
      });

      if (!res.ok) {
        setToast({ message: 'Erreur lors de la maintenance', type: 'error' });
        return;
      }

      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error('Response is not JSON:', await res.text());
        setToast({ message: 'Erreur: réponse invalide du serveur', type: 'error' });
        return;
      }

      const data = await res.json();
      if (data.success) {
        setToast({ message: data.message, type: 'success' });
        fetchStats(); // Refresh stats after maintenance
      } else {
        setToast({ message: data.error || 'Erreur lors de la maintenance', type: 'error' });
      }
    } catch (error) {
      console.error('Error executing maintenance:', error);
      setToast({ message: 'Erreur lors de la maintenance', type: 'error' });
    } finally {
      setExecutingTask(false);
      setShowMaintenanceModal(false);
    }
  };

  const handleMaintenanceClick = (task: string, taskName: string) => {
    setSelectedTask(task);
    setShowMaintenanceModal(true);
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const getTaskInfo = (task: string) => {
    const tasks: Record<string, { description: string; details: string; risk: 'low' | 'medium' | 'high'; riskLabel: string }> = {
      'vacuum': {
        description: 'Nettoyer et optimiser la BDD',
        details: 'Récupère l\'espace disque et met à jour les statistiques PostgreSQL. Peut ralentir temporairement la BDD.',
        risk: 'medium',
        riskLabel: 'Risque Moyen'
      },
      'analyze': {
        description: 'Mettre à jour les statistiques',
        details: 'Optimise les plans de requêtes. Rapide et sans danger.',
        risk: 'low',
        riskLabel: 'Sans Risque'
      },
      'reindex': {
        description: 'Reconstruire les index',
        details: 'Répare les index corrompus. BLOQUE les écritures pendant l\'exécution. À faire en maintenance.',
        risk: 'high',
        riskLabel: 'Risque Élevé'
      },
      'prisma-generate': {
        description: 'Régénérer le client Prisma',
        details: 'Régénère les types TypeScript. Nécessite l\'arrêt du serveur. Sans impact sur la BDD.',
        risk: 'low',
        riskLabel: 'Sans Risque'
      },
      'prisma-db-push': {
        description: 'Synchroniser le schéma',
        details: 'ATTENTION: Peut supprimer des colonnes/tables ! Utiliser uniquement avec backup.',
        risk: 'high',
        riskLabel: 'Dangereux'
      },
      'check-schema': {
        description: 'Valider le schéma Prisma',
        details: 'Vérification en lecture seule. Aucun impact sur la BDD.',
        risk: 'low',
        riskLabel: '100% Sûr'
      }
    };
    return tasks[task] || { description: 'Tâche de maintenance', details: '', risk: 'medium', riskLabel: 'Risque Moyen' };
  };

  const getTaskDescription = (task: string) => {
    return getTaskInfo(task).description;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  const totalRecords =
    (stats?.tables.users.total || 0) +
    (stats?.tables.clients.total || 0) +
    (stats?.tables.newClients.total || 0) +
    (stats?.tables.categories || 0) +
    (stats?.tables.roles || 0) +
    (stats?.tables.systemLogs || 0);

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Administration Base de Données
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Statistiques, maintenance et gestion de la base de données
          </p>
        </div>
        <button
          onClick={fetchStats}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <RefreshCw size={18} />
          Actualiser
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Database className="text-blue-600 dark:text-blue-400" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Taille BDD</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats?.database.size ? formatBytes(stats.database.size) : 'N/A'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <Table className="text-green-600 dark:text-green-400" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Tables</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats?.database.tables.length || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <FolderOpen className="text-purple-600 dark:text-purple-400" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Enregistrements</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {totalRecords.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <Activity className="text-orange-600 dark:text-orange-400" size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Logs Système</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats?.tables.systemLogs.toLocaleString() || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Tables Statistics */}
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Table size={20} />
              Statistiques des Tables
            </h2>
          </div>
          <div className="p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Utilisateurs</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {stats?.tables.users.active} actifs / {stats?.tables.users.deleted} supprimés
                  </p>
                </div>
                <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {stats?.tables.users.total}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Clients (Nouveau)</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {stats?.tables.newClients.active} actifs / {stats?.tables.newClients.deleted} supprimés
                  </p>
                </div>
                <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {stats?.tables.newClients.total}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Clients (Ancien)</p>
                </div>
                <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {stats?.tables.clients.total}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Catégories</p>
                </div>
                <span className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {stats?.tables.categories}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Catégories Utilisateurs</p>
                </div>
                <span className="text-2xl font-bold text-pink-600 dark:text-pink-400">
                  {stats?.tables.userCategories}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Identifiants Contact</p>
                </div>
                <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                  {stats?.tables.contactIdentifiers}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Recherches</p>
                </div>
                <span className="text-2xl font-bold text-teal-600 dark:text-teal-400">
                  {stats?.tables.searches}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Table Sizes */}
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <HardDrive size={20} />
              Taille des Tables
            </h2>
          </div>
          <div className="p-4">
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {stats?.database.tables.map((table) => (
                <div
                  key={table.name}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{table.name}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {table.rows.toLocaleString()} lignes
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                    {formatBytes(table.size)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Maintenance Tasks */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-gray-700 mb-6">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Settings size={20} />
            Tâches de Maintenance
          </h2>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* 1. Vérifier Schéma - 100% Sûr */}
            <button
              onClick={() => handleMaintenanceClick('check-schema', 'Vérifier Schéma')}
              disabled={executingTask}
              className="flex flex-col gap-2 p-4 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-left"
            >
              <div className="flex items-start gap-3">
                <AlertTriangle className="text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-1" size={20} />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-gray-900 dark:text-white">Vérifier Schéma</p>
                    <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded">🛡️ 100% Sûr</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Valider le schéma Prisma
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    Lecture seule. Aucun impact sur la BDD.
                  </p>
                </div>
              </div>
            </button>

            {/* 2. ANALYZE - Sans Risque */}
            <button
              onClick={() => handleMaintenanceClick('analyze', 'ANALYZE')}
              disabled={executingTask}
              className="flex flex-col gap-2 p-4 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-left"
            >
              <div className="flex items-start gap-3">
                <TrendingUp className="text-green-600 dark:text-green-400 flex-shrink-0 mt-1" size={20} />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-gray-900 dark:text-white">ANALYZE</p>
                    <span className="px-2 py-0.5 text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded">✅ Sans Risque</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Mettre à jour les statistiques
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    Optimise les plans de requêtes. Rapide et sûr.
                  </p>
                </div>
              </div>
            </button>

            {/* 3. Prisma Generate - Sans Risque */}
            <button
              onClick={() => handleMaintenanceClick('prisma-generate', 'Prisma Generate')}
              disabled={executingTask}
              className="flex flex-col gap-2 p-4 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-left"
            >
              <div className="flex items-start gap-3">
                <CheckCircle className="text-orange-600 dark:text-orange-400 flex-shrink-0 mt-1" size={20} />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-gray-900 dark:text-white">Prisma Generate</p>
                    <span className="px-2 py-0.5 text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded">✅ Sans Risque</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Régénérer le client Prisma
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    Nécessite l'arrêt du serveur. Sans impact BDD.
                  </p>
                </div>
              </div>
            </button>

            {/* 4. VACUUM ANALYZE - Risque Moyen */}
            <button
              onClick={() => handleMaintenanceClick('vacuum', 'VACUUM ANALYZE')}
              disabled={executingTask}
              className="flex flex-col gap-2 p-4 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-left"
            >
              <div className="flex items-start gap-3">
                <Zap className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-1" size={20} />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-gray-900 dark:text-white">VACUUM ANALYZE</p>
                    <span className="px-2 py-0.5 text-xs font-medium bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded">⚠️ Risque Moyen</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Nettoyer et optimiser la BDD
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    Récupère l'espace disque. Peut ralentir temporairement.
                  </p>
                </div>
              </div>
            </button>

            {/* 5. REINDEX - Risque Élevé */}
            <button
              onClick={() => handleMaintenanceClick('reindex', 'REINDEX')}
              disabled={executingTask}
              className="flex flex-col gap-2 p-4 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-left"
            >
              <div className="flex items-start gap-3">
                <RefreshCw className="text-purple-600 dark:text-purple-400 flex-shrink-0 mt-1" size={20} />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-gray-900 dark:text-white">REINDEX</p>
                    <span className="px-2 py-0.5 text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded">🔴 Risque Élevé</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Reconstruire les index
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    BLOQUE les écritures. Maintenance planifiée requise.
                  </p>
                </div>
              </div>
            </button>

            {/* 6. Prisma DB Push - DANGEREUX */}
            <button
              onClick={() => handleMaintenanceClick('prisma-db-push', 'Prisma DB Push')}
              disabled={executingTask}
              className="flex flex-col gap-2 p-4 border-2 border-red-300 dark:border-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-left"
            >
              <div className="flex items-start gap-3">
                <Database className="text-pink-600 dark:text-pink-400 flex-shrink-0 mt-1" size={20} />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-gray-900 dark:text-white">Prisma DB Push</p>
                    <span className="px-2 py-0.5 text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded font-bold">⚠️ DANGEREUX</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Synchroniser le schéma
                  </p>
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1 font-medium">
                    ⚠️ Peut SUPPRIMER des données ! Backup requis.
                  </p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Activity size={20} />
            Activité Récente
          </h2>
        </div>
        <div className="p-4">
          <div className="space-y-2">
            {stats?.activity.recentLogs.map((log, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg"
              >
                <span className="font-medium text-gray-900 dark:text-white">{log.action}</span>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {new Date(log.createdAt).toLocaleString('fr-FR')}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Maintenance Confirmation Modal */}
      <ConfirmModal
        isOpen={showMaintenanceModal}
        onClose={() => setShowMaintenanceModal(false)}
        onConfirm={() => executeMaintenance(selectedTask)}
        title="Confirmer la maintenance"
        message={getTaskDescription(selectedTask)}
        confirmText="Exécuter"
        cancelText="Annuler"
        type="warning"
      />

      {/* Toast Notification */}
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
