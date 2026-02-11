'use client';

import { useState, useEffect } from 'react';
import { BarChart3, Users, FileText, TrendingUp, Search, Calendar, MessageSquare, CheckSquare, UserCheck, Clock, AlertCircle, Activity } from 'lucide-react';
import { formatRelativeTime, getPriorityColor } from '@/lib/utils';
import { apiClient } from '@/lib/api-client';
import type { DashboardStats, RecentActivity, RecentClient } from '@/types';

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    newClients: 0,
    activeUsers: 0,
    totalSearches: 0,
    todayTasks: 0,
    recentEvents: 0,
    conversations: 0,
    todoStats: {
      total: 0,
      todo: 0,
      failed: 0,
      succes: 0,
    },
    clientsByPriority: {
      immediate: 0,
      haute: 0,
      moyenne: 0,
      faible: 0,
    },
  });
  const [recentClients, setRecentClients] = useState<RecentClient[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Charger les statistiques depuis plusieurs APIs avec apiClient
      const [clientsRes, usersRes, logsRes] = await Promise.all([
        apiClient.get<{ clients: any[] }>('/newclients'),
        apiClient.get<{ users: any[] }>('/users'),
        apiClient.get<{ logs: RecentActivity[] }>('/logs?limit=5'),
      ]);

      if (clientsRes.success && clientsRes.data) {
        const clients = clientsRes.data.clients || [];
        
        setStats(prev => ({
          ...prev,
          newClients: clients.length,
          clientsByPriority: {
            immediate: clients.filter((c: any) => c.priority === 'Immédiate').length,
            haute: clients.filter((c: any) => c.priority === 'Haute').length,
            moyenne: clients.filter((c: any) => c.priority === 'Moyenne').length,
            faible: clients.filter((c: any) => c.priority === 'Faible').length,
          },
        }));

        // Les 5 clients les plus récents
        setRecentClients(clients.slice(0, 5));
      }

      if (usersRes.success && usersRes.data) {
        const users = usersRes.data.users || [];
        setStats(prev => ({
          ...prev,
          activeUsers: users.filter((u: any) => u.isActive).length,
        }));
      }

      if (logsRes.success && logsRes.data) {
        setRecentActivity(logsRes.data.logs || []);
      }

      // Charger les tâches
      const todosRes = await apiClient.get<{ tasks: any[] }>('/tasks');
      if (todosRes.success && todosRes.data) {
        const todos = todosRes.data.tasks || [];
        setStats(prev => ({
          ...prev,
          todoStats: {
            total: todos.length,
            todo: todos.filter((t: any) => t.status === 'todo').length,
            failed: todos.filter((t: any) => t.status === 'failed').length,
            succes: todos.filter((t: any) => t.status?.includes('succes')).length,
          },
          todayTasks: todos.filter((t: any) => {
            if (!t.dueDate) return false;
            const today = new Date().toDateString();
            return new Date(t.dueDate).toDateString() === today;
          }).length,
        }));
      }

      // Charger les événements
      const eventsRes = await apiClient.get<{ events: any[] }>('/events');
      if (eventsRes.success && eventsRes.data) {
        const events = eventsRes.data.events || [];
        const today = new Date();
        const todayEvents = events.filter((e: any) => {
          const eventDate = new Date(e.startDate);
          return eventDate.toDateString() === today.toDateString();
        });
        setStats(prev => ({ ...prev, recentEvents: todayEvents.length }));
      }

    } catch (error) {
      console.error('Erreur lors du chargement du dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getLogLevelColor = (level: string) => {
    switch (level) {
      case 'CRITICAL': return 'bg-red-500';
      case 'ERROR': return 'bg-orange-500';
      case 'WARNING': return 'bg-yellow-500';
      case 'INFO': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const statCards = [
    {
      title: 'Nouveaux Clients',
      value: stats.newClients,
      icon: Users,
      color: 'bg-blue-500',
      href: '/newclients',
      description: 'Clients enregistrés',
    },
    {
      title: 'Utilisateurs Actifs',
      value: stats.activeUsers,
      icon: UserCheck,
      color: 'bg-green-500',
      href: '/admin/users',
      description: 'Comptes actifs',
    },
    {
      title: 'Tâches du Jour',
      value: stats.todayTasks,
      icon: Clock,
      color: 'bg-orange-500',
      href: '/apps/tasks',
      description: 'À réaliser aujourd\'hui',
    },
    {
      title: 'Événements Aujourd\'hui',
      value: stats.recentEvents,
      icon: Calendar,
      color: 'bg-purple-500',
      href: '/apps/calendar',
      description: 'Calendrier du jour',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-500 text-lg">Chargement du tableau de bord...</div>
      </div>
    );
  }

  return (
    <div>
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Tableau de Bord</h1>
        <p className="text-gray-600 mt-2">Vue d'ensemble de votre activité</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <a
              key={stat.title}
              href={stat.href}
              className="bg-white rounded-lg shadow hover:shadow-lg transition p-6 cursor-pointer group"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                  <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg text-white group-hover:scale-110 transition`}>
                  <Icon size={24} />
                </div>
              </div>
            </a>
          );
        })}
      </div>

      {/* Priorité des Clients */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <div className="flex items-center gap-2 mb-4">
          <AlertCircle className="w-5 h-5 text-gray-700" />
          <h3 className="text-lg font-semibold text-gray-900">Clients par Priorité</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
            <p className="text-3xl font-bold text-red-700">{stats.clientsByPriority.immediate}</p>
            <p className="text-sm text-red-600 mt-1">Immédiate</p>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-200">
            <p className="text-3xl font-bold text-orange-700">{stats.clientsByPriority.haute}</p>
            <p className="text-sm text-orange-600 mt-1">Haute</p>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <p className="text-3xl font-bold text-yellow-700">{stats.clientsByPriority.moyenne}</p>
            <p className="text-sm text-yellow-600 mt-1">Moyenne</p>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-3xl font-bold text-blue-700">{stats.clientsByPriority.faible}</p>
            <p className="text-sm text-blue-600 mt-1">Faible</p>
          </div>
        </div>
      </div>

      {/* Statistiques des Tâches */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <div className="flex items-center gap-2 mb-4">
          <CheckSquare className="w-5 h-5 text-gray-700" />
          <h3 className="text-lg font-semibold text-gray-900">État des Tâches</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-3xl font-bold text-gray-700">{stats.todoStats.total}</p>
            <p className="text-sm text-gray-600 mt-1">Total</p>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-3xl font-bold text-blue-700">{stats.todoStats.todo}</p>
            <p className="text-sm text-blue-600 mt-1">À faire</p>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
            <p className="text-3xl font-bold text-red-700">{stats.todoStats.failed}</p>
            <p className="text-sm text-red-600 mt-1">Échec</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
            <p className="text-3xl font-bold text-green-700">{stats.todoStats.succes}</p>
            <p className="text-sm text-green-600 mt-1">Succès</p>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Recent Clients */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Clients Récents</h3>
          <div className="space-y-4">
            {recentClients.length > 0 ? (
              recentClients.map((client) => (
                <div key={client.id} className="flex items-center gap-4 pb-4 border-b last:border-b-0">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                    {client.firstName?.[0] || client.nickname?.[0] || '?'}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {client.firstName || client.nickname || 'Client sans nom'}
                    </p>
                    <p className="text-xs text-gray-500">{formatRelativeTime(client.createdAt)}</p>
                  </div>
                  <span className={`text-xs px-3 py-1 rounded-full font-medium ${getPriorityColor(client.priority)}`}>
                    {client.priority}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm text-center py-8">Aucun client récent</p>
            )}
          </div>
          <a href="/newclients" className="text-blue-600 text-sm font-medium mt-4 inline-block hover:underline">
            Voir tous les clients →
          </a>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-gray-700" />
            <h3 className="text-lg font-semibold text-gray-900">Activité Récente</h3>
          </div>
          <div className="space-y-4">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start gap-4 pb-4 border-b last:border-b-0">
                  <div className={`w-2 h-2 mt-2 rounded-full ${getLogLevelColor(activity.level)}`}></div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">
                      <span className="font-medium">{activity.action}</span> - {activity.description}
                    </p>
                    <p className="text-xs text-gray-500">{formatRelativeTime(activity.createdAt)}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm text-center py-8">Aucune activité récente</p>
            )}
          </div>
          <a href="/admin/logs" className="text-blue-600 text-sm font-medium mt-4 inline-block hover:underline">
            Voir tous les logs →
          </a>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg shadow p-6 border border-blue-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions Rapides</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <a
            href="/clients/new"
            className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition text-center group"
          >
            <Users className="w-8 h-8 mx-auto text-blue-600 group-hover:scale-110 transition" />
            <p className="text-sm font-medium text-gray-900 mt-2">Nouveau Client</p>
          </a>
          <a
            href="/apps/tasks"
            className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition text-center group"
          >
            <CheckSquare className="w-8 h-8 mx-auto text-green-600 group-hover:scale-110 transition" />
            <p className="text-sm font-medium text-gray-900 mt-2">Gérer Tâches</p>
          </a>
          <a
            href="/apps/calendar"
            className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition text-center group"
          >
            <Calendar className="w-8 h-8 mx-auto text-purple-600 group-hover:scale-110 transition" />
            <p className="text-sm font-medium text-gray-900 mt-2">Calendrier</p>
          </a>
          <a
            href="/admin/logs"
            className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition text-center group"
          >
            <Activity className="w-8 h-8 mx-auto text-orange-600 group-hover:scale-110 transition" />
            <p className="text-sm font-medium text-gray-900 mt-2">Logs Système</p>
          </a>
        </div>
      </div>
    </div>
  );
}
