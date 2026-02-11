'use client';

import { useState, useEffect } from 'react';
import { Shield, Check, X, RefreshCw, Key, Trash2, Copy, Mail, MailCheck, UserPlus, Save, XCircle, AlertCircle, CheckCircle, Tag } from 'lucide-react';
import ExportButton from '@/components/ExportButton';

interface User {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
  emailVerified: boolean;
  lastLogin: string | null;
  createdAt: string;
  categories?: UserCategory[];
}

interface UserCategory {
  category: Category;
}

interface NewUser {
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  password: string;
  role: string;
}

interface Role {
  name: string;
  label: string;
  description: string;
  color: string;
  isSystem: boolean;
}

interface Category {
  id: number;
  name: string;
  label: string;
  description: string | null;
  color: string;
  icon: string | null;
  createdAt?: string;
}

export default function UsersAdminPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [userCategories, setUserCategories] = useState<Record<string, Category[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState<{ id: string; role: string } | null>(null);  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editedUser, setEditedUser] = useState<Partial<User>>({});
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ show: boolean; title: string; message: string; onConfirm: () => void } | null>(null);
  const [showDeleteUserModal, setShowDeleteUserModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [passwordResetModal, setPasswordResetModal] = useState<{ show: boolean; userId: string } | null>(null);
  const [passwordOption, setPasswordOption] = useState<'auto' | 'default' | 'custom'>('auto');
  const [customPassword, setCustomPassword] = useState('');
  const [categoryModal, setCategoryModal] = useState<{ show: boolean; userId: string; userCategories: string[] } | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [filterRole, setFilterRole] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [newUser, setNewUser] = useState<NewUser>({
    email: '',
    username: '',
    firstName: '',
    lastName: '',
    password: '',
    role: 'USER',
  });

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };
  
  useEffect(() => {
    // Check if user is admin
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      setCurrentUser(user);
      if (user.role !== 'ADMIN') {
        setError('Accès refusé - Administrateur requis');
        setLoading(false);
        return;
      }
    }

    fetchRoles();
    fetchCategories();
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchRoles = async () => {
    try {
      const response = await fetch('/api/roles', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setRoles(data.roles || []);
      }
    } catch (err) {
      console.error('Erreur lors du chargement des rôles:', err);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories || []);
      }
    } catch (err) {
      console.error('Erreur lors du chargement des catégories:', err);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users', {
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${getToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error('Erreur lors du chargement des utilisateurs');
      }

      const data = await response.json();
      setUsers(data.users || []);
      
      // Charger les catégories de chaque utilisateur
      const categoriesMap: Record<string, Category[]> = {};
      for (const user of data.users || []) {
        const catResponse = await fetch(`/api/users/${user.id}/categories`, {
          credentials: 'include',
        });
        if (catResponse.ok) {
          const catData = await catResponse.json();
          categoriesMap[user.id] = catData.categories || [];
        }
      }
      setUserCategories(categoriesMap);
      setLoading(false);
    } catch (err) {
      setError('Erreur lors du chargement des utilisateurs');
      setLoading(false);
    }
  };

  const getToken = () => {
    const cookies = document.cookie.split(';');
    const tokenCookie = cookies.find(c => c.trim().startsWith('token='));
    return tokenCookie ? tokenCookie.split('=')[1] : '';
  };

  const updateUserRole = async (userId: string, role: string) => {
    try {
      const response = await fetch('/api/users', {
        credentials: 'include',
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ userId, role }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la mise à jour');
      }

      await fetchUsers();
      showNotification('success', 'Rôle mis à jour avec succès');
    } catch (err) {
      showNotification('error', 'Erreur lors de la mise à jour du rôle');
    }
  };

  const toggleUserStatus = async (userId: string, isActive: boolean) => {
    try {
      const response = await fetch('/api/users', {
        credentials: 'include',
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ userId, isActive: !isActive }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la mise à jour');
      }

      await fetchUsers();
      showNotification('success', 'Statut mis à jour avec succès');
    } catch (err) {
      showNotification('error', 'Erreur lors de la mise à jour du statut');
    }
  };
  const handleDeleteUser = async (userId: string) => {
    if (userId.toString() === currentUser?.id) {
      showNotification('error', 'Vous ne pouvez pas supprimer votre propre compte');
      return;
    }
    
    setUserToDelete(userId);
    setShowDeleteUserModal(true);
  };

  const handleDuplicateUser = (user: User) => {
    setIsAddingUser(true);
    setNewUser({
      email: `${user.email.split('@')[0]}_copy@${user.email.split('@')[1]}`,
      username: `${user.username}_copy`,
      firstName: user.firstName,
      lastName: user.lastName,
      password: '',
      role: user.role,
    });
  };

  const confirmDeleteUser = async (permanent: boolean = false) => {
    if (!userToDelete) return;
    
    try {
      const url = permanent 
        ? `/api/users/${userToDelete}?permanent=true`
        : `/api/users/${userToDelete}`;
      
      const response = await fetch(url, { 
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('Erreur');
      
      await fetchUsers();
      showNotification('success', permanent ? 'Utilisateur supprimé définitivement' : 'Utilisateur supprimé temporairement');
      setShowDeleteUserModal(false);
      setUserToDelete(null);
    } catch (err) {
      showNotification('error', 'Erreur lors de la suppression');
    }
  };

  const toggleEmailVerified = async (userId: string, emailVerified: boolean) => {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ emailVerified: !emailVerified }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la mise a jour');
      }

      await fetchUsers();
      showNotification('success', 'Statut de vérification email mis à jour');
    } catch (err) {
      showNotification('error', 'Erreur lors de la validation de l\'email');
    }
  };

  const handleResetPassword = async (userId: string) => {
    setPasswordOption('auto');
    setCustomPassword('');
    setPasswordResetModal({ show: true, userId });
  };

  const confirmPasswordReset = async () => {
    if (!passwordResetModal) return;
    
    const userId = passwordResetModal.userId;
    let passwordToSet = '';

    if (passwordOption === 'auto') {
      // Générer via l'API
      try {
        const response = await fetch(`/api/users/${userId}/reset-password`, { 
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${getToken()}`,
          },
        });
        
        const data = await response.json();
        if (!response.ok) {
          showNotification('error', data.error || 'Erreur lors de la réinitialisation');
          setPasswordResetModal(null);
          return;
        }
        
        setGeneratedPassword(data.password);
        setShowPasswordModal(true);
        setPasswordResetModal(null);
        return;
      } catch (err) {
        showNotification('error', 'Erreur lors de la réinitialisation du mot de passe');
        setPasswordResetModal(null);
        return;
      }
    } else if (passwordOption === 'default') {
      passwordToSet = 'P@ssword01!';
    } else {
      if (!customPassword || customPassword.length < 8) {
        showNotification('error', 'Le mot de passe doit contenir au moins 8 caractères');
        return;
      }
      passwordToSet = customPassword;
    }

    // Définir le mot de passe manuellement
    try {
      const response = await fetch(`/api/users/${userId}/set-password`, { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ password: passwordToSet }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        showNotification('error', data.error || 'Erreur lors de la réinitialisation');
        setPasswordResetModal(null);
        return;
      }
      
      setGeneratedPassword(passwordToSet);
      setShowPasswordModal(true);
      setPasswordResetModal(null);
      showNotification('success', 'Mot de passe réinitialisé avec succès');
    } catch (err) {
      showNotification('error', 'Erreur lors de la réinitialisation du mot de passe');
      setPasswordResetModal(null);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedPassword);
    showNotification('success', 'Mot de passe copié dans le presse-papiers');
  };

  const handleAddUser = async () => {
    if (!newUser.email || !newUser.username || !newUser.firstName || !newUser.lastName) {
      showNotification('error', 'Veuillez remplir tous les champs');
      return;
    }

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          ...newUser,
          password: 'P@ssword1!'
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        showNotification('error', data.error || 'Erreur lors de la création');
        return;
      }

      setIsAddingUser(false);
      setNewUser({
        email: '',
        username: '',
        firstName: '',
        lastName: '',
        password: '',
        role: 'USER',
      });
      await fetchUsers();
      showNotification('success', 'Utilisateur créé avec succès');
    } catch (err) {
      showNotification('error', 'Erreur lors de la création de l\'utilisateur');
    }
  };

  const cancelAddUser = () => {
    setIsAddingUser(false);
    setNewUser({
      email: '',
      username: '',
      firstName: '',
      lastName: '',
      password: '',
      role: 'USER',
    });
  };

  const startEditUser = (user: User) => {
    setEditingUserId(user.id);
    setEditedUser({
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
    });
  };

  const cancelEditUser = () => {
    setEditingUserId(null);
    setEditedUser({});
  };

  const openCategoryModal = async (userId: string) => {
    try {
      const response = await fetch(`/api/users/${userId}/categories`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        const userCategoryNames = data.categories.map((c: Category) => c.name);
        setSelectedCategories(userCategoryNames);
        setCategoryModal({ show: true, userId, userCategories: userCategoryNames });
      }
    } catch (err) {
      showNotification('error', 'Erreur lors du chargement des catégories');
    }
  };

  const saveCategoriesForUser = async () => {
    if (!categoryModal) return;

    try {
      const response = await fetch(`/api/users/${categoryModal.userId}/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ categoryNames: selectedCategories }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la mise à jour');
      }

      const data = await response.json();
      
      // Mettre à jour le cache des catégories de l'utilisateur
      setUserCategories(prev => ({
        ...prev,
        [categoryModal.userId]: data.categories || []
      }));

      setCategoryModal(null);
      showNotification('success', 'Catégories mises à jour avec succès');
    } catch (err) {
      showNotification('error', 'Erreur lors de la mise à jour des catégories');
    }
  };

  const toggleCategory = (categoryName: string) => {
    setSelectedCategories(prev => 
      prev.includes(categoryName)
        ? prev.filter(c => c !== categoryName)
        : [...prev, categoryName]
    );
  };

  const toggleSelectAllCategories = () => {
    if (selectedCategories.length === categories.length) {
      setSelectedCategories([]);
    } else {
      setSelectedCategories(categories.map(c => c.name));
    }
  };

  const getCategoryColor = (color: string) => {
    const colors: Record<string, string> = {
      red: 'bg-red-100 text-red-700 border-red-200',
      orange: 'bg-orange-100 text-orange-700 border-orange-200',
      yellow: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      green: 'bg-green-100 text-green-700 border-green-200',
      blue: 'bg-blue-100 text-blue-700 border-blue-200',
      purple: 'bg-purple-100 text-purple-700 border-purple-200',
      pink: 'bg-pink-100 text-pink-700 border-pink-200',
      teal: 'bg-teal-100 text-teal-700 border-teal-200',
      slate: 'bg-slate-100 text-slate-700 border-slate-200',
    };
    return colors[color] || colors.blue;
  };

  const getFilteredUsers = () => {
    const filtered = users.filter(user => {
      const matchesRole = filterRole === '' || user.role === filterRole;
      const matchesStatus = filterStatus === '' || 
        (filterStatus === 'active' && user.isActive) ||
        (filterStatus === 'inactive' && !user.isActive) ||
        (filterStatus === 'verified' && user.emailVerified) ||
        (filterStatus === 'unverified' && !user.emailVerified);
      const matchesSearch = searchQuery === '' || 
        user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.username.toLowerCase().includes(searchQuery.toLowerCase());
      
      return matchesRole && matchesStatus && matchesSearch;
    });

    // Trier selon l'ordre des rôles
    const sortedByRole = [...filtered].sort((a, b) => {
      const roleAIndex = roles.findIndex(r => r.name === a.role);
      const roleBIndex = roles.findIndex(r => r.name === b.role);
      
      // Si les deux rôles sont trouvés, les trier selon leur ordre
      if (roleAIndex !== -1 && roleBIndex !== -1) {
        return roleAIndex - roleBIndex;
      }
      
      // Si un rôle n'est pas trouvé, le mettre à la fin
      if (roleAIndex === -1) return 1;
      if (roleBIndex === -1) return -1;
      
      return 0;
    });

    return sortedByRole;
  };

  const saveEditUser = async () => {
    if (!editingUserId) return;

    try {
      const response = await fetch(`/api/users/${editingUserId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`,
        },
        body: JSON.stringify(editedUser),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erreur lors de la mise à jour');
      }

      await fetchUsers();
      setEditingUserId(null);
      setEditedUser({});
      showNotification('success', 'Utilisateur mis à jour avec succès');
    } catch (err: any) {
      showNotification('error', err.message || 'Erreur lors de la mise à jour');
    }
  };
  const getRoleBadgeColor = (roleName: string) => {
    const role = roles.find(r => r.name === roleName);
    if (!role) return 'bg-slate-100 text-slate-700 border-slate-200';
    
    const colors: Record<string, string> = {
      red: 'bg-red-100 text-red-700 border-red-200',
      orange: 'bg-orange-100 text-orange-700 border-orange-200',
      yellow: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      green: 'bg-green-100 text-green-700 border-green-200',
      blue: 'bg-blue-100 text-blue-700 border-blue-200',
      purple: 'bg-purple-100 text-purple-700 border-purple-200',
      pink: 'bg-pink-100 text-pink-700 border-pink-200',
      slate: 'bg-slate-100 text-slate-700 border-slate-200',
    };
    return colors[role.color] || colors.slate;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 dark:bg-slate-900">
      {/* Notification Toast */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in">
          <div
            className={`flex items-center gap-3 px-6 py-4 rounded-lg shadow-lg border ${
              notification.type === 'success'
                ? 'bg-green-50 dark:bg-green-900 border-green-200 dark:border-green-700 text-green-800 dark:text-green-100'
                : 'bg-red-50 dark:bg-red-900 border-red-200 dark:border-red-700 text-red-800 dark:text-red-100'
            }`}
          >
            {notification.type === 'success' ? (
              <CheckCircle size={24} className="flex-shrink-0" />
            ) : (
              <AlertCircle size={24} className="flex-shrink-0" />
            )}
            <span className="font-medium">{notification.message}</span>
            <button
              onClick={() => setNotification(null)}
              className="ml-4 text-slate-500 hover:text-slate-700"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}

      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <Shield className="text-blue-600 dark:text-blue-400" size={32} />
            <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Gestion des Utilisateurs</h1>
          </div>
          <div className="flex items-center gap-3">
            <ExportButton 
              data={users} 
              filename="utilisateurs" 
              title="Liste des Utilisateurs"
              excludeFields={['password', 'categories']}
            />
            <button
              onClick={() => setIsAddingUser(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              <UserPlus size={20} />
              Nouvel utilisateur
            </button>
          </div>
        </div>
        <p className="text-slate-600 dark:text-slate-400">Gérer les rôles et permissions des utilisateurs</p>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Recherche</label>
            <input
              type="text"
              placeholder="Nom, email, username..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Rôle</label>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            >
              <option value="">Tous les rôles</option>
              {roles.map(role => (
                <option key={role.name} value={role.name}>{role.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Statut</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            >
              <option value="">Tous les statuts</option>
              <option value="active">Actif</option>
              <option value="inactive">Inactif</option>
              <option value="verified">Email vérifié</option>
              <option value="unverified">Email non vérifié</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchQuery('');
                setFilterRole('');
                setFilterStatus('');
              }}
              className="w-full px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg font-medium transition-colors"
            >
              Réinitialiser
            </button>
          </div>
        </div>
        <div className="mt-3 text-sm text-slate-600 dark:text-slate-400">
          {getFilteredUsers().length} utilisateur(s) trouvé(s)
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">Utilisateur</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">Username</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">Email</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">Rôle</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">Catégories</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">Statut</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">Dernière connexion</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700 dark:text-slate-300">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isAddingUser && (
                <tr className="border-b border-slate-200 dark:border-slate-700 bg-blue-50 dark:bg-blue-900/20">
                  <td className="px-6 py-4">
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Prénom"
                        value={newUser.firstName}
                        onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })}
                        className="px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                      />
                      <input
                        type="text"
                        placeholder="Nom"
                        value={newUser.lastName}
                        onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })}
                        className="px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                      />
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <input
                      type="text"
                      placeholder="username"
                      value={newUser.username}
                      onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <input
                      type="email"
                      placeholder="email@example.com"
                      value={newUser.email}
                      onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={newUser.role}
                      onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                      className="px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm font-medium"
                    >
                      {roles.map(role => (
                        <option key={role.name} value={role.name}>{role.label}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs text-slate-500">À définir</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs text-slate-500">P@ssword1!</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs text-slate-500">Nouveau</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleAddUser}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                        title="Enregistrer"
                      >
                        <Save size={18} />
                      </button>
                      <button
                        onClick={cancelAddUser}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        title="Annuler"
                      >
                        <XCircle size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              )}
              {getFilteredUsers().map((user) => {
                const isEditing = editingUserId === user.id;
                return (
                <tr key={user.id} className={`border-b border-slate-100 ${isEditing ? 'bg-yellow-50' : 'hover:bg-slate-50'}`}>
                  <td className="px-6 py-4">
                    {isEditing ? (
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={editedUser.firstName || ''}
                          onChange={(e) => setEditedUser({ ...editedUser, firstName: e.target.value })}
                          className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                          placeholder="Prénom"
                        />
                        <input
                          type="text"
                          value={editedUser.lastName || ''}
                          onChange={(e) => setEditedUser({ ...editedUser, lastName: e.target.value })}
                          className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                          placeholder="Nom"
                        />
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold">
                          {user.username?.substring(0, 3).toUpperCase() || user.firstName?.[0]?.toUpperCase() + user.lastName?.[0]?.toUpperCase() || 'USR'}
                        </div>
                        <div>
                          <div className="font-medium text-slate-800">
                            {user.firstName} {user.lastName}
                          </div>
                          <div className="text-xs text-slate-500">
                            {user.emailVerified ? (
                              <span className="flex items-center gap-1">
                                <Check size={12} className="text-green-600" />
                                Email vérifié
                              </span>
                            ) : (
                              <span className="flex items-center gap-1">
                                <X size={12} className="text-slate-400" />
                                Email non vérifié
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {isEditing ? (
                      <input
                        type="text"
                        value={editedUser.username || ''}
                        onChange={(e) => setEditedUser({ ...editedUser, username: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                        placeholder="username"
                      />
                    ) : (
                      `@${user.username}`
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {isEditing ? (
                      <input
                        type="email"
                        value={editedUser.email || ''}
                        onChange={(e) => setEditedUser({ ...editedUser, email: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                        placeholder="email@example.com"
                      />
                    ) : (
                      user.email
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={user.role}
                      onChange={(e) => updateUserRole(user.id, e.target.value)}
                      disabled={user.id === currentUser?.id}
                      className={`px-3 py-1.5 rounded-md border text-sm font-medium ${getRoleBadgeColor(user.role)} disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {roles.map(role => (
                        <option key={role.name} value={role.name}>{role.label}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-6 py-4">
                    <div 
                      onClick={() => openCategoryModal(user.id)}
                      className="flex flex-wrap gap-1 cursor-pointer hover:opacity-80"
                    >
                      {userCategories[user.id]?.length > 0 ? (
                        userCategories[user.id].map((cat) => (
                          <span
                            key={cat.name}
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border ${getCategoryColor(cat.color)}`}
                            title={cat.description || undefined}
                          >
                            {cat.icon && <span>{cat.icon}</span>}
                            <span>{cat.label}</span>
                          </span>
                        ))
                      ) : (
                        <button
                          onClick={() => openCategoryModal(user.id)}
                          className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1"
                        >
                          <Tag size={14} />
                          <span>Ajouter</span>
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => toggleUserStatus(user.id, user.isActive)}
                      disabled={user.id === currentUser?.id}
                      className={`px-3 py-1.5 rounded-md text-sm font-medium border ${
                        user.isActive
                          ? 'bg-green-100 text-green-700 border-green-200'
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      } disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-80`}
                    >
                      {user.isActive ? 'Actif' : 'Inactif'}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {user.lastLogin
                      ? new Date(user.lastLogin).toLocaleString('fr-FR')
                      : 'Jamais'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {isEditing ? (
                        <>
                          <button
                            onClick={saveEditUser}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                            title="Enregistrer"
                          >
                            <Save size={18} />
                          </button>
                          <button
                            onClick={cancelEditUser}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                            title="Annuler"
                          >
                            <XCircle size={18} />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => startEditUser(user)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                            title="Modifier les informations"
                          >
                            <RefreshCw size={18} />
                          </button>
                          <button
                            onClick={() => toggleEmailVerified(user.id, user.emailVerified)}
                            className={`p-2 rounded-lg ${
                              user.emailVerified
                                ? 'text-green-600 hover:bg-green-50'
                                : 'text-slate-400 hover:bg-slate-50'
                            }`}
                            title={user.emailVerified ? "Marquer l'email comme non vérifié" : "Vérifier l'email"}
                          >
                            {user.emailVerified ? <MailCheck size={18} /> : <Mail size={18} />}
                          </button>
                          <button
                            onClick={() => handleResetPassword(user.id)}
                            disabled={user.id === currentUser?.id}
                            className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Réinitialiser le mot de passe"
                          >
                            <Key size={18} />
                          </button>
                          <button
                            onClick={() => handleDuplicateUser(user)}
                            className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg"
                            title="Dupliquer l'utilisateur"
                          >
                            <Copy size={18} />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            disabled={user.id === currentUser?.id}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Supprimer l'utilisateur"
                          >
                            <Trash2 size={18} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">Rôles et Permissions</h3>
        <ul className="space-y-2 text-sm text-blue-800">
          {roles.length > 0 ? (
            roles.map((role) => (
              <li key={role.name}>
                <strong>{role.label} :</strong> {role.description || 'Pas de description'}
              </li>
            ))
          ) : (
            <li className="text-blue-600 italic">Chargement des rôles...</li>
          )}
        </ul>
      </div>

      {/* Modale de confirmation */}
      {confirmModal && (
        <>
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" onClick={() => setConfirmModal(null)} />
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle size={32} className="text-orange-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">{confirmModal.title}</h3>
                <p className="text-slate-600">{confirmModal.message}</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmModal(null)}
                  className="flex-1 px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg font-medium transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={confirmModal.onConfirm}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                >
                  Confirmer
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Modale de choix du mot de passe */}
      {passwordResetModal && (
        <>
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" onClick={() => setPasswordResetModal(null)} />
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <div className="mb-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Key size={32} className="text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 text-center mb-2">Réinitialiser le mot de passe</h3>
                <p className="text-slate-600 text-center text-sm">Choisissez le type de mot de passe</p>
              </div>

              <div className="space-y-3 mb-6">
                <label className="flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                  <input
                    type="radio"
                    name="passwordOption"
                    value="auto"
                    checked={passwordOption === 'auto'}
                    onChange={() => setPasswordOption('auto')}
                    className="w-4 h-4 text-blue-600"
                  />
                  <div>
                    <div className="font-medium text-slate-800">Mot de passe généré automatiquement</div>
                    <div className="text-xs text-slate-500">Un mot de passe sécurisé sera créé</div>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                  <input
                    type="radio"
                    name="passwordOption"
                    value="default"
                    checked={passwordOption === 'default'}
                    onChange={() => setPasswordOption('default')}
                    className="w-4 h-4 text-blue-600"
                  />
                  <div>
                    <div className="font-medium text-slate-800">P@ssword01!</div>
                    <div className="text-xs text-slate-500">Mot de passe par défaut</div>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                  <input
                    type="radio"
                    name="passwordOption"
                    value="custom"
                    checked={passwordOption === 'custom'}
                    onChange={() => setPasswordOption('custom')}
                    className="w-4 h-4 text-blue-600 mt-1"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-slate-800 mb-2">Mot de passe personnalisé</div>
                    {passwordOption === 'custom' && (
                      <input
                        type="text"
                        value={customPassword}
                        onChange={(e) => setCustomPassword(e.target.value)}
                        placeholder="Entrez le mot de passe"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                        minLength={8}
                      />
                    )}
                    <div className="text-xs text-slate-500 mt-1">Minimum 8 caractères</div>
                  </div>
                </label>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setPasswordResetModal(null)}
                  className="flex-1 px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg font-medium transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={confirmPasswordReset}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  Réinitialiser
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {showPasswordModal && (
        <>
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" onClick={() => setShowPasswordModal(false)} />
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <div className="text-center mb-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Key size={32} className="text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-800">Mot de passe réinitialisé</h3>
                <p className="text-sm text-slate-600 mt-2">Copiez ce mot de passe et donnez-le à l'utilisateur</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between gap-3">
                  <code className="text-lg font-mono font-bold text-slate-800 break-all">{generatedPassword}</code>
                  <button onClick={copyToClipboard} className="flex-shrink-0 p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
                    <Copy size={18} />
                  </button>
                </div>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                <p className="text-xs text-yellow-800">⚠️ Ce mot de passe ne sera affiché qu'une seule fois. Assurez-vous de le copier maintenant.</p>
              </div>
              <button onClick={() => setShowPasswordModal(false)} className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">Fermer</button>
            </div>
          </div>
        </>
      )}

      {/* Modale de gestion des catégories */}
      {categoryModal?.show && (
        <>
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" onClick={() => setCategoryModal(null)} />
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6">
              <div className="mb-6">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Tag size={32} className="text-purple-600" />
                </div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xl font-bold text-slate-800">Gérer les catégories</h3>
                  {categories.length > 0 && (
                    <button
                      onClick={toggleSelectAllCategories}
                      className="text-sm px-3 py-1 bg-purple-100 text-purple-700 hover:bg-purple-200 rounded-lg font-medium"
                    >
                      {selectedCategories.length === categories.length ? 'Désélectionner tout' : 'Sélectionner tout'}
                    </button>
                  )}
                </div>
                <p className="text-slate-600 text-center text-sm">Sélectionnez les catégories pour cet utilisateur</p>
              </div>

              <div className="max-h-96 overflow-y-auto mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {categories.map((category) => (
                    <label
                      key={category.name}
                      className={`flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors ${
                        selectedCategories.includes(category.name)
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-slate-200'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(category.name)}
                        onChange={() => toggleCategory(category.name)}
                        className="w-5 h-5 text-purple-600 rounded mt-0.5"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {category.icon && <span className="text-xl">{category.icon}</span>}
                          <span className="font-medium text-slate-800">{category.label}</span>
                        </div>
                        {category.description && (
                          <p className="text-xs text-slate-500">{category.description}</p>
                        )}
                        <div className={`inline-block mt-2 px-2 py-1 rounded text-xs font-medium border ${getCategoryColor(category.color)}`}>
                          {category.name}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setCategoryModal(null)}
                  className="flex-1 px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg font-medium transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={saveCategoriesForUser}
                  className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
                >
                  Enregistrer
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Modal de suppression utilisateur */}
      {showDeleteUserModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-[#0f172a] rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Supprimer l'utilisateur
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Comment souhaitez-vous supprimer cet utilisateur ?
            </p>
            
            {currentUser?.role === 'ADMIN' ? (
              <div className="space-y-3">
                <button
                  onClick={() => confirmDeleteUser(false)}
                  className="w-full px-4 py-3 bg-orange-100 text-orange-700 hover:bg-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:hover:bg-orange-900/50 rounded-lg transition-colors text-left"
                >
                  <div className="font-semibold">Supprimer temporairement</div>
                  <div className="text-sm opacity-80">L'utilisateur pourra être restauré depuis la corbeille</div>
                </button>
                
                <button
                  onClick={() => confirmDeleteUser(true)}
                  className="w-full px-4 py-3 bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50 rounded-lg transition-colors text-left"
                >
                  <div className="font-semibold">⚠️ Supprimer définitivement</div>
                  <div className="text-sm opacity-80">Cette action est irréversible</div>
                </button>
                
                <button
                  onClick={() => {
                    setShowDeleteUserModal(false);
                    setUserToDelete(null);
                  }}
                  className="w-full px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg transition-colors"
                >
                  Annuler
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <button
                  onClick={() => confirmDeleteUser(false)}
                  className="w-full px-4 py-3 bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors"
                >
                  Supprimer
                </button>
                
                <button
                  onClick={() => {
                    setShowDeleteUserModal(false);
                    setUserToDelete(null);
                  }}
                  className="w-full px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg transition-colors"
                >
                  Annuler
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}















