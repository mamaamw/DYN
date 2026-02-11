'use client';

import { useState, useEffect } from 'react';
import { RotateCcw, Trash2, Users, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import Toast, { ToastType } from '@/components/ui/Toast';

interface ContactIdentifier {
  id: number;
  accountNumber: string;
  accountType: string;
  info: string | null;
}

interface Search {
  id: number;
  generalReference: string | null;
  detailedReference: string | null;
  startDate: string | null;
  endDate: string | null;
}

interface DeletedClient {
  id: number;
  nickname: string | null;
  surname: string | null;
  firstName: string | null;
  description: string | null;
  requestor: string | null;
  priority: string;
  externalHelp: boolean;
  createdAt: string;
  deletedAt: string;
  contactIdentifiers: ContactIdentifier[];
  searches: Search[];
  user: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface DeletedUser {
  id: number;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
  emailVerified: boolean;
  lastLogin: string | null;
  createdAt: string;
  deletedAt: string;
}

type TabType = 'clients' | 'users' | 'other';

export default function TrashPage() {
  const [activeTab, setActiveTab] = useState<TabType>('clients');
  const [deletedClients, setDeletedClients] = useState<DeletedClient[]>([]);
  const [deletedUsers, setDeletedUsers] = useState<DeletedUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<number | null>(null);
  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const [selectedClients, setSelectedClients] = useState<number[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [showBulkRestoreModal, setShowBulkRestoreModal] = useState(false);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);

  useEffect(() => {
    // Charger les deux listes au montage initial
    fetchDeletedClients();
    fetchDeletedUsers();
  }, []);

  useEffect(() => {
    // Recharger la liste active quand on change de tab
    if (activeTab === 'clients') {
      fetchDeletedClients();
    } else if (activeTab === 'users') {
      fetchDeletedUsers();
    }
  }, [activeTab]);

  const fetchDeletedClients = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/newclients/deleted');
      const data = await res.json();
      setDeletedClients(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching deleted clients:', error);
      setDeletedClients([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchDeletedUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/users/deleted');
      const data = await res.json();
      setDeletedUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching deleted users:', error);
      setDeletedUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const restoreClient = (id: number) => {
    setSelectedClient(id);
    setShowRestoreModal(true);
  };

  const confirmRestore = async () => {
    if (!selectedClient) return;
    try {
      const res = await fetch(`/api/newclients/${selectedClient}/restore`, {
        method: 'PATCH',
      });
      
      if (res.ok) {
        setDeletedClients(deletedClients.filter((c) => c.id !== selectedClient));
        setShowRestoreModal(false);
        setSelectedClient(null);
        setToast({ message: 'Client restauré avec succès', type: 'success' });
      } else {
        setToast({ message: 'Erreur lors de la restauration', type: 'error' });
      }
    } catch (error) {
      setToast({ message: 'Erreur lors de la restauration', type: 'error' });
    }
  };

  const deleteClientPermanently = (id: number) => {
    setSelectedClient(id);
    setShowDeleteModal(true);
  };

  const confirmPermanentDelete = async () => {
    if (!selectedClient) return;
    try {
      const res = await fetch(`/api/newclients/${selectedClient}?permanent=true`, {
        method: 'DELETE',
      });
      
      if (res.ok) {
        setDeletedClients(deletedClients.filter((c) => c.id !== selectedClient));
        setShowDeleteModal(false);
        setSelectedClient(null);
        setToast({ message: 'Client supprimé définitivement', type: 'success' });
      } else {
        setToast({ message: 'Erreur lors de la suppression', type: 'error' });
      }
    } catch (error) {
      setToast({ message: 'Erreur lors de la suppression', type: 'error' });
    }
  };

  const restoreUser = (id: number) => {
    setSelectedUser(id);
    setShowRestoreModal(true);
  };

  const confirmRestoreUser = async () => {
    if (!selectedUser) return;
    try {
      const res = await fetch(`/api/users/${selectedUser}/restore`, {
        method: 'PATCH',
      });
      
      if (res.ok) {
        setDeletedUsers(deletedUsers.filter((u) => u.id !== selectedUser));
        setShowRestoreModal(false);
        setSelectedUser(null);
        setToast({ message: 'Utilisateur restauré avec succès', type: 'success' });
      } else {
        setToast({ message: 'Erreur lors de la restauration', type: 'error' });
      }
    } catch (error) {
      setToast({ message: 'Erreur lors de la restauration', type: 'error' });
    }
  };

  const deleteUserPermanently = (id: number) => {
    setSelectedUser(id);
    setShowDeleteModal(true);
  };

  const confirmPermanentDeleteUser = async () => {
    if (!selectedUser) return;
    try {
      const res = await fetch(`/api/users/${selectedUser}?permanent=true`, {
        method: 'DELETE',
      });
      
      if (res.ok) {
        setDeletedUsers(deletedUsers.filter((u) => u.id !== selectedUser));
        setShowDeleteModal(false);
        setSelectedUser(null);
        setToast({ message: 'Utilisateur supprimé définitivement', type: 'success' });
      } else {
        setToast({ message: 'Erreur lors de la suppression', type: 'error' });
      }
    } catch (error) {
      setToast({ message: 'Erreur lors de la suppression', type: 'error' });
    }
  };

  // Fonctions de sélection multiple pour clients
  const toggleSelectClient = (clientId: number) => {
    setSelectedClients(prev => 
      prev.includes(clientId) 
        ? prev.filter(id => id !== clientId)
        : [...prev, clientId]
    );
  };

  const toggleSelectAllClients = () => {
    if (selectedClients.length === deletedClients.length) {
      setSelectedClients([]);
    } else {
      setSelectedClients(deletedClients.map(c => c.id));
    }
  };

  const confirmBulkRestoreClients = async () => {
    if (selectedClients.length === 0) return;
    
    try {
      const restorePromises = selectedClients.map(id => 
        fetch(`/api/newclients/${id}/restore`, { method: 'PATCH' })
      );
      
      const results = await Promise.all(restorePromises);
      const successCount = results.filter(r => r.ok).length;
      
      if (successCount > 0) {
        setDeletedClients(deletedClients.filter(c => !selectedClients.includes(c.id)));
        setSelectedClients([]);
        setShowBulkRestoreModal(false);
        setToast({ 
          message: `${successCount} client(s) restauré(s) avec succès`, 
          type: 'success' 
        });
      } else {
        setToast({ message: 'Erreur lors de la restauration', type: 'error' });
      }
    } catch (error) {
      setToast({ message: 'Erreur lors de la restauration', type: 'error' });
    }
  };

  const confirmBulkDeleteClients = async () => {
    if (selectedClients.length === 0) return;
    
    try {
      const deletePromises = selectedClients.map(id => 
        fetch(`/api/newclients/${id}?permanent=true`, { method: 'DELETE' })
      );
      
      const results = await Promise.all(deletePromises);
      const successCount = results.filter(r => r.ok).length;
      
      if (successCount > 0) {
        setDeletedClients(deletedClients.filter(c => !selectedClients.includes(c.id)));
        setSelectedClients([]);
        setShowBulkDeleteModal(false);
        setToast({ 
          message: `${successCount} client(s) supprimé(s) définitivement`, 
          type: 'success' 
        });
      } else {
        setToast({ message: 'Erreur lors de la suppression', type: 'error' });
      }
    } catch (error) {
      setToast({ message: 'Erreur lors de la suppression', type: 'error' });
    }
  };

  // Fonctions de sélection multiple pour utilisateurs
  const toggleSelectUser = (userId: number) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const toggleSelectAllUsers = () => {
    if (selectedUsers.length === deletedUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(deletedUsers.map(u => u.id));
    }
  };

  const confirmBulkRestoreUsers = async () => {
    if (selectedUsers.length === 0) return;
    
    try {
      const restorePromises = selectedUsers.map(id => 
        fetch(`/api/users/${id}/restore`, { method: 'PATCH' })
      );
      
      const results = await Promise.all(restorePromises);
      const successCount = results.filter(r => r.ok).length;
      
      if (successCount > 0) {
        setDeletedUsers(deletedUsers.filter(u => !selectedUsers.includes(u.id)));
        setSelectedUsers([]);
        setShowBulkRestoreModal(false);
        setToast({ 
          message: `${successCount} utilisateur(s) restauré(s) avec succès`, 
          type: 'success' 
        });
      } else {
        setToast({ message: 'Erreur lors de la restauration', type: 'error' });
      }
    } catch (error) {
      setToast({ message: 'Erreur lors de la restauration', type: 'error' });
    }
  };

  const confirmBulkDeleteUsers = async () => {
    if (selectedUsers.length === 0) return;
    
    try {
      const deletePromises = selectedUsers.map(id => 
        fetch(`/api/users/${id}?permanent=true`, { method: 'DELETE' })
      );
      
      const results = await Promise.all(deletePromises);
      const successCount = results.filter(r => r.ok).length;
      
      if (successCount > 0) {
        setDeletedUsers(deletedUsers.filter(u => !selectedUsers.includes(u.id)));
        setSelectedUsers([]);
        setShowBulkDeleteModal(false);
        setToast({ 
          message: `${successCount} utilisateur(s) supprimé(s) définitivement`, 
          type: 'success' 
        });
      } else {
        setToast({ message: 'Erreur lors de la suppression', type: 'error' });
      }
    } catch (error) {
      setToast({ message: 'Erreur lors de la suppression', type: 'error' });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Immédiate': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      case 'Haute': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
      case 'Moyenne': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'Faible': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  return (
    <div>
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Corbeille</h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Gérez les éléments supprimés - Restaurez ou supprimez définitivement
          </p>
        </div>
        {((activeTab === 'clients' && selectedClients.length > 0) || 
          (activeTab === 'users' && selectedUsers.length > 0)) && (
          <div className="flex gap-3">
            <button
              onClick={() => setShowBulkRestoreModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg transition-colors"
            >
              <RotateCcw size={18} />
              Restaurer ({activeTab === 'clients' ? selectedClients.length : selectedUsers.length})
            </button>
            <button
              onClick={() => setShowBulkDeleteModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors"
            >
              <Trash2 size={18} />
              Supprimer ({activeTab === 'clients' ? selectedClients.length : selectedUsers.length})
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <nav className="flex gap-4">
          <button
            onClick={() => setActiveTab('clients')}
            className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'clients'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Users size={18} />
              Clients ({deletedClients.length})
            </div>
          </button>
          
          <button
            onClick={() => setActiveTab('users')}
            className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'users'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Users size={18} />
              Utilisateurs ({deletedUsers.length})
            </div>
          </button>
        </nav>
      </div>

      {/* Alert Info */}
      <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
        <div className="flex gap-3">
          <AlertTriangle className="text-amber-600 dark:text-amber-400 flex-shrink-0" size={20} />
          <div className="text-sm text-amber-800 dark:text-amber-200">
            <p className="font-semibold mb-1">Attention</p>
            <p>
              Les éléments restaurés redeviendront visibles pour tous les utilisateurs. 
              Les suppressions définitives sont irréversibles et supprimeront toutes les données associées.
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      {activeTab === 'clients' && (
        <div>
          {loading ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              Chargement...
            </div>
          ) : deletedClients.length === 0 ? (
            <div className="text-center py-12">
              <Users size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
              <p className="text-gray-500 dark:text-gray-400">Aucun client supprimé</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-[#0f172a] rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-[#1e293b]">
                  <tr>
                    <th className="px-4 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={deletedClients.length > 0 && selectedClients.length === deletedClients.length}
                        onChange={toggleSelectAllClients}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 cursor-pointer"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Client
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Priorité
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Supprimé le
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-[#0f172a] divide-y divide-gray-200 dark:divide-gray-700">
                  {deletedClients.map((client) => (
                    <tr key={client.id} className="hover:bg-gray-50 dark:hover:bg-[#1e293b] transition-colors">
                      <td className="px-4 py-4 text-center">
                        <input
                          type="checkbox"
                          checked={selectedClients.includes(client.id)}
                          onChange={() => toggleSelectClient(client.id)}
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 cursor-pointer"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {client.nickname || `${client.firstName || ''} ${client.surname || ''}`.trim() || 'Sans nom'}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {client.contactIdentifiers[0]?.accountNumber || 'Pas de contact'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(client.priority)}`}>
                          {client.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(client.deletedAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          <button
                            onClick={() => restoreClient(client.id)}
                            className="flex items-center gap-1 text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                            title="Restaurer"
                          >
                            <RotateCcw size={16} />
                            Restaurer
                          </button>
                          <button
                            onClick={() => deleteClientPermanently(client.id)}
                            className="flex items-center gap-1 text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                            title="Supprimer définitivement"
                          >
                            <Trash2 size={16} />
                            Supprimer
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'users' && (
        <div>
          {loading ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              Chargement...
            </div>
          ) : deletedUsers.length === 0 ? (
            <div className="text-center py-12">
              <Users size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
              <p className="text-gray-500 dark:text-gray-400">Aucun utilisateur supprimé</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-[#0f172a] rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-[#1e293b]">
                  <tr>
                    <th className="px-4 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={deletedUsers.length > 0 && selectedUsers.length === deletedUsers.length}
                        onChange={toggleSelectAllUsers}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 cursor-pointer"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Utilisateur
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Rôle
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Supprimé le
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-[#0f172a] divide-y divide-gray-200 dark:divide-gray-700">
                  {deletedUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-[#1e293b] transition-colors">
                      <td className="px-4 py-4 text-center">
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(user.id)}
                          onChange={() => toggleSelectUser(user.id)}
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 cursor-pointer"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {user.firstName} {user.lastName}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {user.email} (@{user.username})
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          user.role === 'ADMIN' 
                            ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                            : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(user.deletedAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          <button
                            onClick={() => restoreUser(user.id)}
                            className="flex items-center gap-1 text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                            title="Restaurer"
                          >
                            <RotateCcw size={16} />
                            Restaurer
                          </button>
                          <button
                            onClick={() => deleteUserPermanently(user.id)}
                            className="flex items-center gap-1 text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                            title="Supprimer définitivement"
                          >
                            <Trash2 size={16} />
                            Supprimer
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal Restauration */}
      {showRestoreModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-[#0f172a] rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Confirmer la restauration
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Êtes-vous sûr de vouloir restaurer {selectedClient ? 'ce client' : 'cet utilisateur'} ? Il redeviendra visible pour tous les utilisateurs.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowRestoreModal(false);
                  setSelectedClient(null);
                  setSelectedUser(null);
                }}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1b2436] rounded-lg transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={selectedClient ? confirmRestore : confirmRestoreUser}
                className="px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg transition-colors"
              >
                Restaurer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Suppression Définitive */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-[#0f172a] rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Confirmer la suppression définitive
            </h3>
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-800 dark:text-red-200 font-semibold">
                ⚠️ Cette action est irréversible !
              </p>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {selectedClient 
                ? 'Ce client et toutes ses données associées (contacts, recherches, historique) seront définitivement supprimés de la base de données.'
                : 'Cet utilisateur et toutes ses données associées (clients, historique) seront définitivement supprimés de la base de données.'
              }
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedClient(null);
                  setSelectedUser(null);
                }}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1b2436] rounded-lg transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={selectedClient ? confirmPermanentDelete : confirmPermanentDeleteUser}
                className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors"
              >
                Supprimer définitivement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Restauration en Masse */}
      {showBulkRestoreModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-[#0f172a] rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Restaurer {activeTab === 'clients' ? selectedClients.length : selectedUsers.length} {activeTab === 'clients' ? 'client(s)' : 'utilisateur(s)'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Êtes-vous sûr de vouloir restaurer ces {activeTab === 'clients' ? selectedClients.length : selectedUsers.length} {activeTab === 'clients' ? 'clients' : 'utilisateurs'} ? Ils redeviendront visibles pour tous les utilisateurs.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowBulkRestoreModal(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1b2436] rounded-lg transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={activeTab === 'clients' ? confirmBulkRestoreClients : confirmBulkRestoreUsers}
                className="px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg transition-colors"
              >
                Restaurer tout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Suppression en Masse */}
      {showBulkDeleteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-[#0f172a] rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Supprimer définitivement {activeTab === 'clients' ? selectedClients.length : selectedUsers.length} {activeTab === 'clients' ? 'client(s)' : 'utilisateur(s)'}
            </h3>
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-800 dark:text-red-200 font-semibold">
                ⚠️ Cette action est irréversible !
              </p>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {activeTab === 'clients'
                ? `Ces ${selectedClients.length} clients et toutes leurs données associées (contacts, recherches, historique) seront définitivement supprimés de la base de données.`
                : `Ces ${selectedUsers.length} utilisateurs et toutes leurs données associées (clients, historique) seront définitivement supprimés de la base de données.`
              }
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowBulkDeleteModal(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1b2436] rounded-lg transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={activeTab === 'clients' ? confirmBulkDeleteClients : confirmBulkDeleteUsers}
                className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors"
              >
                Supprimer définitivement
              </button>
            </div>
          </div>
        </div>
      )}

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
