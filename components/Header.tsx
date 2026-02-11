'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Search, Maximize, Moon, Bell, Menu, Plus, ChevronRight, LogOut, User, Settings, Shield, Tag, X } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [language, setLanguage] = useState('fr');
  const [currentUser, setCurrentUser] = useState<{ id: string; firstName: string; lastName: string; email: string; role: string; username: string } | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [breadcrumbLabels, setBreadcrumbLabels] = useState<Record<string, string>>({});

  const isAuthPage = pathname?.includes('/auth');

  // Charger la dernière recherche au montage
  useEffect(() => {
    const lastSearch = localStorage.getItem('lastSearch');
    if (lastSearch) {
      setSearchQuery(lastSearch);
    }
  }, []);

  // Récupérer les labels personnalisés pour le breadcrumb
  useEffect(() => {
    const fetchBreadcrumbData = async () => {
      if (!pathname) return;

      const paths = pathname.split('/').filter(Boolean);
      const newLabels: Record<string, string> = {};

      for (let i = 0; i < paths.length; i++) {
        const segment = paths[i];
        const prevSegment = i > 0 ? paths[i - 1] : null;

        // Si le segment est un nombre et qu'il suit "clients"
        if (prevSegment === 'clients' && /^\d+$/.test(segment)) {
          try {
            const res = await fetch(`/api/newclients/${segment}`);
            if (res.ok) {
              const client = await res.json();
              newLabels[segment] = client.nickname || `${client.surname || ''} ${client.firstName || ''}`.trim() || `Client #${segment}`;
            }
          } catch (err) {
            console.error('Error fetching client:', err);
          }
        }

        // Si le segment est un nombre et qu'il suit "searches"
        if (prevSegment === 'searches' && /^\d+$/.test(segment)) {
          try {
            const res = await fetch(`/api/searches/${segment}`);
            if (res.ok) {
              const search = await res.json();
              newLabels[segment] = search.generalReference || `Recherche #${segment}`;
            }
          } catch (err) {
            console.error('Error fetching search:', err);
          }
        }

        // Si le segment est un nombre et qu'il suit "tasks"
        if (prevSegment === 'tasks' && /^\d+$/.test(segment)) {
          try {
            const res = await fetch(`/api/tasks/${segment}`);
            if (res.ok) {
              const task = await res.json();
              newLabels[segment] = task.title || `Tâche #${segment}`;
            }
          } catch (err) {
            console.error('Error fetching task:', err);
          }
        }
      }

      setBreadcrumbLabels(newLabels);
    };

    fetchBreadcrumbData();
  }, [pathname]);

  const updateUserInfo = () => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        setCurrentUser(JSON.parse(userStr));
      } catch (err) {
        console.error('Error parsing user data:', err);
        setCurrentUser(null);
      }
    } else {
      setCurrentUser(null);
    }
  };

  useEffect(() => {
    // Récupérer les infos utilisateur initiales
    updateUserInfo();
    
    // Charger le mode sombre depuis localStorage
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(savedDarkMode);
    if (savedDarkMode) {
      document.documentElement.classList.add('dark');
    }

    // Écouter les changements d'utilisateur (connexion/déconnexion/changement de compte)
    const handleUserChange = () => {
      updateUserInfo();
      setShowUserMenu(false); // Fermer le menu utilisateur lors du changement
    };

    window.addEventListener('userChanged', handleUserChange);
    window.addEventListener('storage', (e) => {
      if (e.key === 'user' || e.key === null) {
        updateUserInfo();
      }
    });

    return () => {
      window.removeEventListener('userChanged', handleUserChange);
    };
  }, []);

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('darkMode', String(newDarkMode));
    
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      localStorage.removeItem('user');
      
      // Déclencher un événement pour notifier les autres composants
      window.dispatchEvent(new Event('userChanged'));
      
      router.push('/auth/login');
    } catch (err) {
      console.error('Logout error:', err);
      localStorage.removeItem('user');
      
      // Déclencher un événement même en cas d'erreur
      window.dispatchEvent(new Event('userChanged'));
      
      router.push('/auth/login');
    }
  };

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const [clientsRes, searchesRes, tasksRes] = await Promise.all([
        fetch(`/api/newclients?search=${encodeURIComponent(query)}`),
        fetch(`/api/searches?search=${encodeURIComponent(query)}`),
        fetch(`/api/tasks?search=${encodeURIComponent(query)}`)
      ]);

      const [clients, searches, tasks] = await Promise.all([
        clientsRes.ok ? clientsRes.json() : [],
        searchesRes.ok ? searchesRes.json() : [],
        tasksRes.ok ? tasksRes.json() : []
      ]);

      // S'assurer que ce sont des tableaux
      const clientsArray = Array.isArray(clients) ? clients : [];
      const searchesArray = Array.isArray(searches) ? searches : [];
      const tasksArray = Array.isArray(tasks) ? tasks : [];

      const results = [
        ...clientsArray.slice(0, 5).map((c: any) => ({ 
          type: 'client', 
          id: c.id, 
          title: c.nickname || `${c.surname} ${c.firstName}`, 
          subtitle: c.requestor,
          href: `/clients/${c.slug || c.id}` 
        })),
        ...searchesArray.slice(0, 5).map((s: any) => ({ 
          type: 'search', 
          id: s.id, 
          title: s.generalReference, 
          subtitle: s.detailedReference,
          href: `/searches/${s.id}` 
        })),
        ...tasksArray.slice(0, 5).map((t: any) => ({ 
          type: 'task', 
          id: t.id, 
          title: t.title, 
          subtitle: t.description,
          href: `/tasks/${t.id}` 
        }))
      ];

      setSearchResults(results);
    } catch (err) {
      console.error('Search error:', err);
      setSearchResults([]);
    }
  };

  useEffect(() => {
    if (searchQuery) {
      // Sauvegarder la recherche
      localStorage.setItem('lastSearch', searchQuery);
      
      const timer = setTimeout(() => {
        handleSearch(searchQuery);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'Administrateur';
      case 'MANAGER': return 'Manager';
      case 'USER': return 'Utilisateur';
      case 'VIEWER': return 'Lecteur';
      default: return role;
    }
  };

  const getInitials = () => {
    const username = currentUser?.username || '';
    return username.substring(0, 3).toUpperCase() || 'USR';
  };

  const generateBreadcrumb = () => {
    if (!pathname || pathname === '/') return [{ label: 'Home', href: '/' }];

    const paths = pathname.split('/').filter(Boolean);
    const breadcrumbs = [{ label: 'Home', href: '/' }];

    let currentPath = '';
    paths.forEach((path) => {
      currentPath += `/${path}`;
      // Utiliser le label personnalisé si disponible, sinon formater le path
      const label = breadcrumbLabels[path] || path.charAt(0).toUpperCase() + path.slice(1);
      breadcrumbs.push({ label, href: currentPath });
    });

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumb();
  const pageTitle = breadcrumbs[breadcrumbs.length - 1]?.label || 'Dashboard';

  if (isAuthPage) return null;

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-50">
      <div className="px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <div className="w-6 h-6 bg-blue-500 rounded-full"></div>
                <div className="w-6 h-6 bg-blue-400 rounded-full -ml-2"></div>
              </div>
              <span className="text-slate-800 dark:text-white font-bold text-xl">DYN</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowSearch(!showSearch)}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
            >
              <Search size={20} className="text-slate-600 dark:text-slate-300" />
            </button>

            <button 
              onClick={toggleDarkMode}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
              title={darkMode ? "Mode clair" : "Mode sombre"}
            >
              <Moon size={20} className="text-slate-600 dark:text-slate-300" />
            </button>

            <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition relative">
              <Bell size={20} className="text-slate-600 dark:text-slate-300" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full"></span>
            </button>

            <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition relative">
              <Bell size={20} className="text-slate-600 dark:text-slate-300" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
              >
                <div className="w-10 h-10 rounded-full border-2 border-slate-200 dark:border-slate-700 bg-blue-500 flex items-center justify-center">
                  <span className="text-sm font-bold text-white">
                    {getInitials()}
                  </span>
                </div>
                {currentUser && (
                  <div className="text-left hidden md:block">
                    <div className="text-sm font-medium text-slate-800 dark:text-white">
                      @{currentUser.username}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {getRoleLabel(currentUser.role)}
                    </div>
                  </div>
                )}
              </button>

              {showUserMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowUserMenu(false)}
                  />
                  <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 py-2 z-20">
                    <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700">
                      <div className="font-medium text-slate-800 dark:text-white">
                        @{currentUser?.username}
                      </div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">{currentUser?.email}</div>
                      <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                        {getRoleLabel(currentUser?.role || '')}
                      </div>
                    </div>

                    <Link
                      href="/profile"
                      className="flex items-center gap-3 px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <User size={18} />
                      <span>Mon profil</span>
                    </Link>

                    {currentUser?.role === 'ADMIN' && (
                      <>
                        <Link
                          href="/admin/users"
                          className="flex items-center gap-3 px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <Settings size={18} />
                          <span>Gestion des utilisateurs</span>
                        </Link>
                        <Link
                          href="/admin/roles"
                          className="flex items-center gap-3 px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <Shield size={18} />
                          <span>Gestion des rôles</span>
                        </Link>
                        <Link
                          href="/admin/categories"
                          className="flex items-center gap-3 px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <Tag size={18} />
                          <span>Gestion des catégories</span>
                        </Link>
                      </>
                    )}

                    <div className="border-t border-slate-100 dark:border-slate-700 my-2" />

                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 px-4 py-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 w-full text-left"
                    >
                      <LogOut size={18} />
                      <span>Deconnexion</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <h1 className="text-slate-800 dark:text-white font-bold text-lg">{pageTitle}</h1>
            <span className="text-slate-400 dark:text-slate-500">|</span>
            <nav className="flex items-center gap-1">
              {breadcrumbs.map((crumb, index) => (
                <div key={crumb.href} className="flex items-center gap-1">
                  {index > 0 && <ChevronRight size={16} className="text-slate-400 dark:text-slate-500" />}
                  <Link
                    href={crumb.href}
                    className={`text-sm ${
                      index === breadcrumbs.length - 1
                        ? 'text-slate-800 dark:text-white font-medium'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                    }`}
                  >
                    {crumb.label}
                  </Link>
                </div>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* Modal de recherche */}
      {showSearch && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center pt-20">
          <div 
            className="fixed inset-0" 
            onClick={() => {
              setShowSearch(false);
              setSearchQuery('');
              setSearchResults([]);
            }}
          />
          <div className="relative bg-white dark:bg-slate-800 rounded-lg shadow-2xl w-full max-w-2xl mx-4">
            <div className="flex items-center gap-3 p-4 border-b border-slate-200 dark:border-slate-700">
              <Search size={20} className="text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher des clients, recherches, tâches..."
                autoFocus
                className="flex-1 bg-transparent outline-none text-slate-900 dark:text-white placeholder-slate-400"
              />
              <button
                onClick={() => {
                  setShowSearch(false);
                  setSearchQuery('');
                  setSearchResults([]);
                }}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
              >
                <X size={20} className="text-slate-400" />
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {searchQuery && searchResults.length === 0 ? (
                <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                  Aucun résultat trouvé
                </div>
              ) : searchResults.length > 0 ? (
                <div className="py-2">
                  {searchResults.map((result) => (
                    <Link
                      key={`${result.type}-${result.id}`}
                      href={result.href}
                      onClick={() => {
                        setShowSearch(false);
                        setSearchQuery('');
                        setSearchResults([]);
                      }}
                      className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition"
                    >
                      <div className={`mt-1 px-2 py-1 rounded text-xs font-medium ${
                        result.type === 'client' 
                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                          : result.type === 'search'
                          ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                          : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                      }`}>
                        {result.type === 'client' ? 'Client' : result.type === 'search' ? 'Recherche' : 'Tâche'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-slate-900 dark:text-white truncate">
                          {result.title}
                        </div>
                        {result.subtitle && (
                          <div className="text-sm text-slate-500 dark:text-slate-400 truncate">
                            {result.subtitle}
                          </div>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                  <Search size={48} className="mx-auto mb-3 opacity-20" />
                  <div className="text-sm">
                    Commencez à taper pour rechercher
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
