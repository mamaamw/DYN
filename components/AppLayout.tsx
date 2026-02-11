'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Menu,
  X,
  LayoutDashboard,
  Users,
  Briefcase,
  DollarSign,
  BarChart3,
  Settings,
  HelpCircle,
  Plus,
  ChevronDown,
  Trash2,
  Shield,
  UserCog,
  Database,
  Activity,
  Lock,
  FileText,
  Table,
  Search,
  CheckSquare,
  Calendar,
  Download,
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: any;
  visible?: boolean;
}

interface NavSection {
  section: string;
  adminOnly?: boolean;
  items: NavItem[];
  visible?: boolean;
}

const navigationItems: NavSection[] = [
  {
    section: 'DASHBOARDS',
    items: [
      { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { label: 'Analytiques', href: '/analytics', icon: BarChart3 },
    ],
  },
  {
    section: 'JELLY',
    items: [
      { label: 'Clients', href: '/clients', icon: Users },
      { label: 'Recherches', href: '/searches', icon: Search },
      { label: 'Prio', href: '/prio', icon: LayoutDashboard },
    ],
  },
  {
    section: 'SHARK',
    items: [
      { label: 'Gestion Panda', href: '/panda', icon: LayoutDashboard },
      { label: 'Vue d\'ensemble', href: '/tasks', icon: CheckSquare },
      { label: 'Planning', href: '/planning', icon: Calendar },
      { label: 'TODO', href: '/todo', icon: CheckSquare },
      { label: 'Kanban', href: '/todo-kanban', icon: LayoutDashboard },
    ],
  },
  {
    section: 'FINANCE & RAPPORTS',
    items: [
      { label: 'Vue d\'ensemble', href: '/finance', icon: DollarSign },
      { label: 'Analytics & Stats', href: '/finance/analytics', icon: BarChart3 },
    ],
  },
  {
    section: 'APPLICATIONS',
    items: [
      { label: 'Chat', href: '/apps/chat', icon: LayoutDashboard },
      { label: 'Email', href: '/apps/email', icon: LayoutDashboard },
      { label: 'Taches', href: '/apps/tasks', icon: LayoutDashboard },
      { label: 'Notes', href: '/apps/notes', icon: LayoutDashboard },
      { label: 'Stockage', href: '/apps/storage', icon: LayoutDashboard },
      { label: 'Calendrier', href: '/apps/calendar', icon: LayoutDashboard },
    ],
  },
];

const adminNavigationItems: NavSection[] = [
  {
    section: 'GESTION DU SITE',
    adminOnly: true,
    items: [
      { label: 'Corbeille', href: '/admin/trash', icon: Trash2 },
      { label: 'Logs Système', href: '/admin/logs', icon: FileText },
      { label: 'Base de Données', href: '/admin/database', icon: Database },
      { label: 'Sauvegarde BDD', href: '/admin/database/backup', icon: Download },
      { label: 'Gestion Données', href: '/admin/data', icon: Table },
      { label: 'Surveillance', href: '/admin/monitoring', icon: Activity },
    ],
  },
  {
    section: 'GESTION DES OUTILS',
    adminOnly: true,
    items: [
      // Feuilles à décrire plus tard
    ],
  },
  {
    section: 'MODIFICATION SITE',
    adminOnly: true,
    items: [
      { label: 'Configuration des Pages', href: '/admin/page-config', icon: Settings },
    ],
  },
  {
    section: 'GESTION DES ACCÈS',
    adminOnly: true,
    items: [
      { label: 'Gestion Utilisateurs', href: '/admin/users', icon: UserCog },
      { label: 'Gestion Rôles', href: '/admin/roles', icon: Lock },
      { label: 'Gestion Devises', href: '/admin/currencies', icon: DollarSign },
      { label: 'Navigation', href: '/admin/navigation', icon: Menu },
      { label: 'Contrôle d\'Accès', href: '/admin/access-control', icon: Shield },
    ],
  },
  {
    section: 'SYSTÈME',
    adminOnly: true,
    items: [
      { label: 'Paramètres', href: '/settings', icon: Settings },
      { label: 'Aide', href: '/help', icon: HelpCircle },
    ],
  },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [expandedSection, setExpandedSection] = useState<string | null>('DASHBOARDS');
  const [userRole, setUserRole] = useState<string | null>(null);
  const [customNavConfig, setCustomNavConfig] = useState<NavSection[] | null>(null);
  const pathname = usePathname();

  const updateUserRole = () => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setUserRole(user.role);
      } catch (e) {
        console.error('Error parsing user data:', e);
        setUserRole(null);
      }
    } else {
      setUserRole(null);
    }
  };

  const loadNavigationConfig = async () => {
    try {
      const response = await fetch('/api/admin/navigation');
      if (response.ok) {
        const data = await response.json();
        if (data.config) {
          // Mapper les icônes depuis les noms vers les composants
          const iconMap: {[key: string]: any} = {
            LayoutDashboard,
            Users,
            Briefcase,
            DollarSign,
            BarChart3,
            Settings,
            HelpCircle,
            Trash2,
            Shield,
            UserCog,
            Database,
            Activity,
            Lock,
            FileText,
            Table,
            Search,
            CheckSquare,
            Calendar,
          };
          
          const mappedConfig = data.config.map((section: any) => ({
            ...section,
            items: section.items.map((item: any) => ({
              ...item,
              icon: iconMap[item.icon] || LayoutDashboard
            }))
          }));
          
          setCustomNavConfig(mappedConfig);
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement de la configuration de navigation:', error);
    }
  };



  useEffect(() => {
    // Récupérer le rôle initial
    updateUserRole();
    
    // Charger la configuration de navigation personnalisée
    loadNavigationConfig();

    // Écouter les changements de localStorage (par exemple lors de la connexion/déconnexion)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'user' || e.key === null) {
        updateUserRole();
      }
    };

    // Écouter les événements custom pour les changements dans le même onglet
    const handleUserChange = () => {
      updateUserRole();
    };

    // Écouter les mises à jour de la configuration de navigation
    const handleNavigationConfigUpdate = () => {
      loadNavigationConfig();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('userChanged', handleUserChange);
    window.addEventListener('navigationConfigUpdated', handleNavigationConfigUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('userChanged', handleUserChange);
      window.removeEventListener('navigationConfigUpdated', handleNavigationConfigUpdate);
    };
  }, []);

  const isAdmin = userRole === 'ADMIN';
  
  // Utiliser la configuration personnalisée si disponible, sinon utiliser la configuration par défaut
  const baseNavItems = customNavConfig || [...navigationItems, ...adminNavigationItems];
  
  // Filtrer les éléments de navigation selon la visibilité et le rôle
  const getFilteredNavItems = () => {
    // Filtrer d'abord selon le rôle (adminOnly)
    let filteredByRole = baseNavItems;
    if (!isAdmin) {
      filteredByRole = baseNavItems.filter(section => !(section as any).adminOnly);
    }
    
    // Filtrer ensuite selon la configuration de visibilité personnalisée
    const filteredByVisibility = filteredByRole
      .filter(section => section.visible !== false)
      .map(section => ({
        ...section,
        items: section.items.filter(item => item.visible !== false)
      }))
      .filter(section => section.items.length > 0);
    
    return filteredByVisibility;
  };

  const displayNavItems = getFilteredNavItems();

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const isActive = (href: string) => pathname === href;

  if (pathname?.includes('/auth')) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 transition-all duration-300 flex flex-col overflow-y-auto fixed h-screen z-30`}
      >
        {/* Sidebar Logo - Hidden since we have header */}
        <div className="h-0"></div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {displayNavItems.map((group) => (
            <div key={group.section}>
              <button
                onClick={() => toggleSection(group.section)}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs font-bold ${
                  sidebarOpen ? '' : 'justify-center'
                } ${
                  (group as any).adminOnly
                    ? 'text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                } transition uppercase tracking-wider`}
              >
                {sidebarOpen && (
                  <span className="flex items-center gap-2">
                    {group.section}
                    {(group as any).adminOnly && (
                      <span className="px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-[10px] rounded font-semibold">
                        ADMIN
                      </span>
                    )}
                  </span>
                )}
                {sidebarOpen && (
                  <ChevronDown
                    size={14}
                    className={`transition-transform ${
                      expandedSection === group.section ? 'rotate-180' : ''
                    }`}
                  />
                )}
              </button>

              {(expandedSection === group.section || !sidebarOpen) && (
                <div className="space-y-0.5 mt-1">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.href);
                    const isAdminSection = (group as any).adminOnly;
                    
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${
                          active
                            ? isAdminSection
                              ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-900 dark:text-purple-100 font-medium'
                              : 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white font-medium'
                            : isAdminSection
                            ? 'text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:text-purple-900 dark:hover:text-purple-100'
                            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white'
                        }`}
                        title={item.label}
                      >
                        <Icon size={18} className={active 
                          ? isAdminSection ? 'text-purple-700 dark:text-purple-300' : 'text-slate-700 dark:text-slate-200'
                          : isAdminSection ? 'text-purple-500 dark:text-purple-400' : 'text-slate-500 dark:text-slate-400'
                        } />
                        {sidebarOpen && (
                          <span className="flex items-center justify-between flex-1">
                            <span>{item.label}</span>
                            {(item as any).badge && (
                              <span className="px-1.5 py-0.5 bg-purple-600 text-white text-[10px] rounded font-semibold">
                                {(item as any).badge}
                              </span>
                            )}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* Create Button */}
        <div className="border-t border-slate-200 dark:border-slate-700 p-3">
          <button className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg font-medium transition shadow-sm">
            <Plus size={18} />
            {sidebarOpen && <span>Creer</span>}
          </button>
        </div>

        {/* Toggle Button */}
        <div className="border-t border-slate-200 dark:border-slate-700 p-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-full flex items-center justify-center py-2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Main Content with spacing */}
      <main
        className={`flex-1 transition-all duration-300 ${
          sidebarOpen ? 'ml-64' : 'ml-20'
        } p-6 bg-slate-50 dark:bg-slate-900`}
      >
        {children}
      </main>
    </div>
  );
}