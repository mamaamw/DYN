// Types partagés pour les statistiques du dashboard
export interface DashboardStats {
  newClients: number;
  activeUsers: number;
  totalSearches: number;
  todayTasks: number;
  recentEvents: number;
  conversations: number;
  todoStats: {
    total: number;
    todo: number;
    failed: number;
    succes: number;
  };
  clientsByPriority: {
    immediate: number;
    haute: number;
    moyenne: number;
    faible: number;
  };
}

// Types pour les activités récentes
export interface RecentActivity {
  id: number;
  action: string;
  description: string;
  createdAt: string;
  level: 'info' | 'warning' | 'error' | 'success';
}

// Types pour les clients
export interface Client {
  id: number;
  firstName: string;
  lastName: string;
  nickname: string;
  priority: string;
  createdAt: string;
}

export interface RecentClient extends Pick<Client, 'id' | 'firstName' | 'nickname' | 'priority' | 'createdAt'> {}

// Types pour la navigation
export interface NavItem {
  label: string;
  href: string;
  icon: string;
  visible: boolean;
  pageTitle?: string;
}

export interface NavSection {
  section: string;
  adminOnly?: boolean;
  items: NavItem[];
  visible: boolean;
}

// Types pour les rôles utilisateur
export type UserRole = 'ADMIN' | 'USER' | 'GUEST';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
}

// Types pour les API responses
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Types pour les toasts/notifications
export interface Toast {
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}
