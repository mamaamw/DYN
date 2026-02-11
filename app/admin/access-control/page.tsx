'use client';

import { useState, useEffect } from 'react';
import { Shield, Save, RotateCcw, Search, Lock, Unlock, Edit, Eye, X } from 'lucide-react';
import Toast from '@/components/ui/Toast';
import ConfirmModal from '@/components/ui/ConfirmModal';

type AccessLevel = 'write' | 'read' | 'none';

interface RoleData {
  name: string;
  label: string;
  color: string;
}

interface PageAccess {
  path: string;
  name: string;
  category: string;
}

const allPages: Omit<PageAccess, 'allowedRoles'>[] = [
  // Dashboards
  { path: '/dashboard', name: 'Dashboard Principal', category: 'Dashboards' },
  { path: '/analytics', name: 'Analytiques', category: 'Dashboards' },
  
  // Jelly
  { path: '/clients', name: 'Clients', category: 'Jelly' },
  { path: '/searches', name: 'Recherches', category: 'Jelly' },
  { path: '/prio', name: 'Prio', category: 'Jelly' },
  
  // Shark
  { path: '/panda', name: 'Gestion Panda', category: 'Shark' },
  { path: '/tasks', name: 'Vue d\'ensemble', category: 'Shark' },
  { path: '/planning', name: 'Planning', category: 'Shark' },
  { path: '/todo', name: 'TODO', category: 'Shark' },
  { path: '/todo-kanban', name: 'Kanban', category: 'Shark' },
  
  // Finance & Rapports
  { path: '/finance', name: 'Vue d\'ensemble Finance', category: 'Finance & Rapports' },
  { path: '/projects', name: 'Projets', category: 'Finance & Rapports' },
  { path: '/invoices', name: 'Factures', category: 'Finance & Rapports' },
  { path: '/proposals', name: 'Devis', category: 'Finance & Rapports' },
  
  // Applications
  { path: '/apps/chat', name: 'Chat', category: 'Applications' },
  { path: '/apps/email', name: 'Email', category: 'Applications' },
  { path: '/apps/tasks', name: 'Tâches', category: 'Applications' },
  { path: '/apps/notes', name: 'Notes', category: 'Applications' },
  { path: '/apps/storage', name: 'Stockage', category: 'Applications' },
  { path: '/apps/calendar', name: 'Calendrier', category: 'Applications' },
  
  // Admin - Gestion du Site
  { path: '/admin/trash', name: 'Corbeille', category: 'Administration' },
  { path: '/admin/logs', name: 'Logs Système', category: 'Administration' },
  { path: '/admin/database', name: 'Base de Données', category: 'Administration' },
  { path: '/admin/data', name: 'Gestion Données', category: 'Administration' },
  { path: '/admin/monitoring', name: 'Surveillance', category: 'Administration' },
  
  // Admin - Accès
  { path: '/admin/users', name: 'Gestion Utilisateurs', category: 'Administration' },
  { path: '/admin/roles', name: 'Gestion Rôles', category: 'Administration' },
  { path: '/admin/navigation', name: 'Gestion Navigation', category: 'Administration' },
  { path: '/admin/access-control', name: 'Contrôle d\'Accès', category: 'Administration' },
  
  // Système
  { path: '/settings', name: 'Paramètres', category: 'Système' },
  { path: '/help', name: 'Aide', category: 'Système' },
  { path: '/profile', name: 'Profil', category: 'Système' },
  
  // Marginal (pages non affichées dans la navigation principale)
  { path: '/clients/new', name: 'Nouveau Client', category: 'Marginal' },
  { path: '/clients/[id]', name: 'Détail Client', category: 'Marginal' },
  { path: '/clients/[id]/edit', name: 'Éditer Client', category: 'Marginal' },
  { path: '/clients/[id]/history', name: 'Historique Client', category: 'Marginal' },
  { path: '/assets', name: 'Gestion des Actifs', category: 'Finance' },
  { path: '/licenses', name: 'Gestion des Licences', category: 'Finance' },
  { path: '/proposals/new', name: 'Nouveau Devis', category: 'Marginal' },
  { path: '/proposals/[id]', name: 'Détail Devis', category: 'Marginal' },
  { path: '/proposals/[id]/edit', name: 'Éditer Devis', category: 'Marginal' },
  { path: '/tasks/[slug]', name: 'Détail Tâche', category: 'Marginal' },
  { path: '/admin/dashboard', name: 'Dashboard Admin', category: 'Marginal' },
  { path: '/admin/notifications', name: 'Notifications Admin', category: 'Marginal' },
  { path: '/admin/categories', name: 'Catégories Admin', category: 'Marginal' },
  { path: '/admin/account-types-tasks', name: 'Types de Comptes', category: 'Marginal' },
];

export default function AccessControlPage() {
  const [accessControl, setAccessControl] = useState<{ [path: string]: { [role: string]: AccessLevel } }>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [roles, setRoles] = useState<string[]>([]);
  const [roleColors, setRoleColors] = useState<Record<string, string>>({});
  const [adminOnlyPaths, setAdminOnlyPaths] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadRoles();
    loadNavigationConfig();
  }, []);

  useEffect(() => {
    if (roles.length > 0) {
      loadAccessControl();
    }
  }, [roles]);

  const loadNavigationConfig = async () => {
    try {
      const response = await fetch('/api/admin/navigation');
      if (response.ok) {
        const data = await response.json();
        if (data.config) {
          // Extraire tous les paths des sections marquées adminOnly
          const adminPaths = new Set<string>();
          data.config.forEach((section: any) => {
            if (section.adminOnly) {
              section.items.forEach((item: any) => {
                adminPaths.add(item.href);
              });
            }
          });
          setAdminOnlyPaths(adminPaths);
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement de la navigation:', error);
    }
  };

  const loadRoles = async () => {
    try {
      const response = await fetch('/api/roles');
      if (response.ok) {
        const data = await response.json();
        const roleNames = data.roles.map((r: RoleData) => r.name);
        setRoles(roleNames);
        
        // Créer un mapping des couleurs
        const colors: Record<string, string> = {};
        data.roles.forEach((r: RoleData) => {
          colors[r.name] = `bg-${r.color}-100 text-${r.color}-700 border-${r.color}-300`;
        });
        setRoleColors(colors);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des rôles:', error);
      // Fallback sur les rôles par défaut
      setRoles(['ADMIN', 'MANAGER', 'SHARK', 'JELLY', 'USER']);
      setRoleColors({
        ADMIN: 'bg-purple-100 text-purple-700 border-purple-300',
        MANAGER: 'bg-blue-100 text-blue-700 border-blue-300',
        SHARK: 'bg-orange-100 text-orange-700 border-orange-300',
        JELLY: 'bg-green-100 text-green-700 border-green-300',
        USER: 'bg-gray-100 text-gray-700 border-gray-300',
      });
    }
  };

  const loadAccessControl = async () => {
    try {
      const response = await fetch('/api/admin/access-control');
      if (response.ok) {
        const data = await response.json();
        // Par défaut, toutes les pages sont en écriture pour tous les rôles
        const defaultAccess: { [path: string]: { [role: string]: AccessLevel } } = {};
        allPages.forEach(page => {
          if (data.accessControl[page.path]) {
            defaultAccess[page.path] = {
              ...data.accessControl[page.path],
              ADMIN: 'write' // ADMIN a toujours accès en écriture
            };
          } else {
            const roleAccess: { [role: string]: AccessLevel } = {};
            roles.forEach(role => {
              roleAccess[role] = role === 'ADMIN' ? 'write' : 'write';
            });
            defaultAccess[page.path] = roleAccess;
          }
        });
        setAccessControl(defaultAccess);
      }
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
      setToast({ message: 'Erreur lors du chargement', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const saveAccessControl = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/admin/access-control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessControl })
      });
      
      if (response.ok) {
        setToast({ message: 'Configuration sauvegardée avec succès !', type: 'success' });
      } else {
        setToast({ message: 'Erreur lors de la sauvegarde', type: 'error' });
      }
    } catch (error) {
      console.error('Erreur:', error);
      setToast({ message: 'Erreur lors de la sauvegarde', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const resetAccessControl = async () => {
    
    try {
      const response = await fetch('/api/admin/access-control', {
        method: 'DELETE'
      });
      
      if (response.ok) {
        // Réinitialiser à tous les rôles avec accès en écriture
        const defaultAccess: { [path: string]: { [role: string]: AccessLevel } } = {};
        allPages.forEach(page => {
          const roleAccess: { [role: string]: AccessLevel } = {};
          roles.forEach(role => {
            roleAccess[role] = 'write';
          });
          defaultAccess[page.path] = roleAccess;
        });
        setAccessControl(defaultAccess);
        setToast({ message: 'Configuration réinitialisée !', type: 'success' });
        setConfirmReset(false);
      }
    } catch (error) {
      console.error('Erreur:', error);
      setToast({ message: 'Erreur lors de la réinitialisation', type: 'error' });
    }
  };

  const setAccessLevel = (path: string, role: string, level: AccessLevel) => {
    // ADMIN a toujours accès en écriture, pas de modification possible
    if (role === 'ADMIN') return;
    
    setAccessControl(prev => ({
      ...prev,
      [path]: {
        ...prev[path],
        [role]: level
      }
    }));
  };

  const setAllRolesAccess = (path: string, level: AccessLevel) => {
    setAccessControl(prev => {
      const roleAccess: { [role: string]: AccessLevel } = {};
      roles.forEach(role => {
        roleAccess[role] = role === 'ADMIN' ? 'write' : level;
      });
      return { 
        ...prev, 
        [path]: roleAccess
      };
    });
  };

  const setCategoryAccess = (category: string, level: AccessLevel) => {
    setAccessControl(prev => {
      const newAccess = { ...prev };
      allPages
        .filter(page => category === 'all' || page.category === category)
        .forEach(page => {
          const roleAccess: { [role: string]: AccessLevel } = {};
          roles.forEach(role => {
            roleAccess[role] = role === 'ADMIN' ? 'write' : level;
          });
          newAccess[page.path] = roleAccess;
        });
      return newAccess;
    });
  };

  const setRoleAccessForCategory = (category: string, role: string, level: AccessLevel) => {
    // ADMIN a toujours accès en écriture, pas de modification possible
    if (role === 'ADMIN') return;
    
    setAccessControl(prev => {
      const newAccess = { ...prev };
      allPages
        .filter(page => category === 'all' || page.category === category)
        .forEach(page => {
          newAccess[page.path] = {
            ...newAccess[page.path],
            [role]: level
          };
        });
      return newAccess;
    });
  };

  const categories = ['all', ...Array.from(new Set(allPages.map(p => p.category)))];

  const filteredPages = allPages.filter(page => {
    const matchesSearch = page.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         page.path.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || page.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const groupedPages = filteredPages.reduce((acc, page) => {
    if (!acc[page.category]) acc[page.category] = [];
    acc[page.category].push(page);
    return acc;
  }, {} as { [category: string]: typeof allPages });

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <div className="text-gray-500">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="w-8 h-8 text-purple-600" />
          <h1 className="text-3xl font-bold text-gray-900">
            Contrôle d'Accès
          </h1>
        </div>
        <p className="text-gray-600">
          Gérez les permissions d'accès pour chaque page du site selon les rôles
        </p>
      </div>

      {/* Actions */}
      <div className="mb-6 flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-3">
          <button
            onClick={saveAccessControl}
            disabled={saving}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Sauvegarde...' : 'Sauvegarder'}
          </button>
          <button
            onClick={() => setConfirmReset(true)}
            className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Réinitialiser
          </button>
        </div>

        {/* Recherche */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher une page..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Filtres par catégorie */}
      <div className="mb-6 flex gap-2 flex-wrap">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              selectedCategory === cat
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {cat === 'all' ? 'Toutes' : cat}
          </button>
        ))}
      </div>

      {/* Actions rapides par catégorie */}
      {selectedCategory !== 'all' && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="font-medium text-blue-900 mb-3">Actions rapides pour "{selectedCategory}"</h3>
          
          {/* Actions globales */}
          <div className="mb-4">
            <h4 className="text-sm font-medium text-blue-800 mb-2">Appliquer à tous les rôles :</h4>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setCategoryAccess(selectedCategory, 'write')}
                className="px-3 py-1.5 bg-green-600 text-white rounded text-sm hover:bg-green-700 flex items-center gap-1"
              >
                <Edit className="w-3 h-3" />
                Tous en écriture
              </button>
              <button
                onClick={() => setCategoryAccess(selectedCategory, 'read')}
                className="px-3 py-1.5 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700 flex items-center gap-1"
              >
                <Eye className="w-3 h-3" />
                Tous en lecture
              </button>
              <button
                onClick={() => setCategoryAccess(selectedCategory, 'none')}
                className="px-3 py-1.5 bg-red-600 text-white rounded text-sm hover:bg-red-700 flex items-center gap-1"
              >
                <X className="w-3 h-3" />
                Tout bloquer
              </button>
            </div>
          </div>

          {/* Actions par rôle */}
          <div className="border-t border-blue-200 pt-4">
            <h4 className="text-sm font-medium text-blue-800 mb-3">Appliquer par rôle :</h4>
            <div className="space-y-2">
              {roles.filter(role => role !== 'ADMIN').map(role => (
                <div key={role} className="flex items-center gap-2 flex-wrap">
                  <span className={`px-3 py-1.5 rounded font-semibold text-sm min-w-[100px] text-center ${roleColors[role]}`}>
                    {role}
                  </span>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => setRoleAccessForCategory(selectedCategory, role, 'write')}
                      className="px-2.5 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 flex items-center gap-1"
                      title={`${role} en écriture pour toute la catégorie`}
                    >
                      <Edit className="w-3 h-3" />
                      Écriture
                    </button>
                    <button
                      onClick={() => setRoleAccessForCategory(selectedCategory, role, 'read')}
                      className="px-2.5 py-1 bg-yellow-600 text-white rounded text-xs hover:bg-yellow-700 flex items-center gap-1"
                      title={`${role} en lecture pour toute la catégorie`}
                    >
                      <Eye className="w-3 h-3" />
                      Lecture
                    </button>
                    <button
                      onClick={() => setRoleAccessForCategory(selectedCategory, role, 'none')}
                      className="px-2.5 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700 flex items-center gap-1"
                      title={`Bloquer ${role} pour toute la catégorie`}
                    >
                      <X className="w-3 h-3" />
                      Bloquer
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Légende */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-medium text-gray-900 mb-3">Légende des rôles</h3>
        <div className="flex gap-3 flex-wrap">
          {roles.map(role => (
            <div key={role} className={`px-3 py-1.5 rounded border ${roleColors[role]} font-medium text-sm`}>
              {role}
            </div>
          ))}
        </div>
      </div>

      {/* Liste des pages */}
      <div className="space-y-6">
        {Object.entries(groupedPages).map(([category, pages]) => (
          <div key={category} className="bg-white rounded-lg shadow border border-gray-200">
            <div className="p-4 bg-gray-50 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">{category}</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {pages.map(page => {
                const pageAccess = accessControl[page.path] || {};
                
                return (
                  <div key={page.path} className="p-4 hover:bg-gray-50 transition">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-gray-900">{page.name}</h3>
                            {adminOnlyPaths.has(page.path) && (
                              <span className="ml-2 px-2 py-0.5 rounded bg-purple-100 text-purple-700 text-xs font-semibold border border-purple-200">
                                Admin par défaut
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 mt-1">{page.path}</p>
                        </div>
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => setAllRolesAccess(page.path, 'write')}
                            className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200 flex items-center gap-1"
                            title="Tout en écriture"
                          >
                            <Edit className="w-3 h-3" />
                            Tous
                          </button>
                          <button
                            onClick={() => setAllRolesAccess(page.path, 'read')}
                            className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs hover:bg-yellow-200 flex items-center gap-1"
                            title="Tout en lecture"
                          >
                            <Eye className="w-3 h-3" />
                            Tous
                          </button>
                          <button
                            onClick={() => setAllRolesAccess(page.path, 'none')}
                            className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200 flex items-center gap-1"
                            title="Bloquer tous"
                          >
                            <X className="w-3 h-3" />
                            Tous
                          </button>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-3">
                        {roles.map(role => {
                          const currentAccess = pageAccess[role] || 'none';
                          const isAdmin = role === 'ADMIN';
                          
                          return (
                            <div key={role} className={`flex items-center gap-1 bg-gray-50 rounded-lg p-2 border border-gray-200 ${
                              isAdmin ? 'opacity-60' : ''
                            }`}>
                              <span className={`text-xs font-semibold px-2 py-1 rounded ${roleColors[role]}`}>
                                {role}
                              </span>
                              <div className="flex gap-1 ml-1">
                                <button
                                  onClick={() => setAccessLevel(page.path, role, 'write')}
                                  disabled={isAdmin}
                                  className={`p-1.5 rounded transition ${
                                    currentAccess === 'write'
                                      ? 'bg-green-600 text-white shadow-sm'
                                      : 'bg-white text-gray-400 border border-gray-300 hover:bg-green-50 hover:text-green-600'
                                  } ${isAdmin ? 'cursor-not-allowed opacity-70' : ''}`}
                                  title={isAdmin ? 'ADMIN a toujours accès en écriture' : 'Accès en écriture'}
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setAccessLevel(page.path, role, 'read')}
                                  disabled={isAdmin}
                                  className={`p-1.5 rounded transition ${
                                    currentAccess === 'read'
                                      ? 'bg-yellow-600 text-white shadow-sm'
                                      : 'bg-white text-gray-400 border border-gray-300 hover:bg-yellow-50 hover:text-yellow-600'
                                  } ${isAdmin ? 'cursor-not-allowed opacity-70' : ''}`}
                                  title={isAdmin ? 'ADMIN a toujours accès en écriture' : 'Accès en lecture seule'}
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setAccessLevel(page.path, role, 'none')}
                                  disabled={isAdmin}
                                  className={`p-1.5 rounded transition ${
                                    currentAccess === 'none'
                                      ? 'bg-red-600 text-white shadow-sm'
                                      : 'bg-white text-gray-400 border border-gray-300 hover:bg-red-50 hover:text-red-600'
                                  } ${isAdmin ? 'cursor-not-allowed opacity-70' : ''}`}
                                  title={isAdmin ? 'ADMIN a toujours accès en écriture' : 'Aucun accès'}
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {filteredPages.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          Aucune page trouvée
        </div>
      )}

      {/* Instructions */}
      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-medium text-blue-900 mb-3">💡 Instructions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-blue-900 font-medium">
              <Edit className="w-4 h-4 text-green-600" />
              <span>Accès en écriture</span>
            </div>
            <p className="text-xs text-blue-700 ml-6">Lecture + Modification + Suppression</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-blue-900 font-medium">
              <Eye className="w-4 h-4 text-yellow-600" />
              <span>Accès en lecture</span>
            </div>
            <p className="text-xs text-blue-700 ml-6">Consultation uniquement (lecture seule)</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-blue-900 font-medium">
              <X className="w-4 h-4 text-red-600" />
              <span>Aucun accès</span>
            </div>
            <p className="text-xs text-blue-700 ml-6">Page bloquée pour ce rôle</p>
          </div>
        </div>
        <ul className="text-sm text-blue-800 space-y-1 border-t border-blue-200 pt-3">
          <li>• Cliquez sur les icônes pour définir le niveau d'accès de chaque rôle</li>
          <li>• Utilisez les boutons "Tous" pour appliquer un niveau à tous les rôles d'une page</li>
          <li>• Les actions rapides permettent de configurer toute une catégorie en un clic</li>
          <li>• Par défaut, toutes les pages ont un accès en écriture pour tous les rôles</li>
          <li>• N'oubliez pas de sauvegarder vos modifications !</li>
        </ul>
      </div>

      {/* Toast Notifications */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Confirm Modal */}
      {confirmReset && (
        <ConfirmModal
          isOpen={confirmReset}
          onClose={() => setConfirmReset(false)}
          title="Réinitialiser les accès"
          message="Réinitialiser tous les accès aux valeurs par défaut (tous les rôles) ?"
          onConfirm={resetAccessControl}
        />
      )}
    </div>
  );
}
