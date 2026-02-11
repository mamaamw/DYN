'use client';

import { useState, useEffect } from 'react';
import { Shield, Plus, AlertCircle, CheckCircle, X } from 'lucide-react';

interface AccountTypeTask {
  id: number;
  accountType: string;
  taskName: string;
  createdAt: string;
}

const ACCOUNT_TYPES = [
  'Téléphone',
  'WhatsApp',
  'Telegram',
  'Signal',
  'Threema',
  'Skype',
  'Snapchat',
  'WeChat',
  'Line',
  'Viber',
  'Facebook Messenger',
  'Discord',
  'Vidéo',
];

const AVAILABLE_TASKS = [
  'Vérification identité',
  'Collecte données',
  'Analyse réseau',
  'Rapport préliminaire',
  'Rapport final',
  'Suivi client',
  'Archivage',
];

export default function AccountTypesTasksAdminPage() {
  const [associations, setAssociations] = useState<AccountTypeTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [newAssociation, setNewAssociation] = useState({
    taskName: AVAILABLE_TASKS[0],
    accountTypes: [] as string[],
  });
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  // Check if user is admin
  const isAdmin = (() => {
    if (typeof window === 'undefined') return false;
    const userStr = localStorage.getItem('user');
    if (!userStr) return false;
    const user = JSON.parse(userStr);
    return user.role === 'ADMIN';
  })();

  const fetchAssociations = async () => {
    try {
      const response = await fetch('/api/account-type-tasks');
      if (response.ok) {
        const data = await response.json();
        setAssociations(data.accountTypeTasks || []);
      }
      setLoading(false);
    } catch {
      setLoading(false);
    }
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  useEffect(() => {
    if (isAdmin) {
      fetchAssociations();
    } else {
      setLoading(false);
    }
  }, [isAdmin]);

  // Précocher les types déjà associés quand on change de tâche
  useEffect(() => {
    const existingTypes = associations
      .filter(a => a.taskName === newAssociation.taskName)
      .map(a => a.accountType);
    
    setNewAssociation(prev => ({
      ...prev,
      accountTypes: existingTypes
    }));
  }, [newAssociation.taskName, associations]);

  const handleAddAssociation = async () => {
    if (!newAssociation.taskName || newAssociation.accountTypes.length === 0) {
      showNotification('error', 'Veuillez sélectionner une tâche et au moins un type de compte');
      return;
    }

    try {
      // Créer une association pour chaque type de compte sélectionné
      const promises = newAssociation.accountTypes.map(async (accountType) => {
        // Vérifier si l'association existe déjà
        if (associations.some(a => a.accountType === accountType && a.taskName === newAssociation.taskName)) {
          return null; // Skip if already exists
        }

        const res = await fetch('/api/account-type-tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ accountType, taskName: newAssociation.taskName }),
        });

        if (!res.ok) {
          return null;
        }

        return await res.json();
      });

      const results = await Promise.all(promises);
      const newAssocs = results.filter(r => r !== null);

      if (newAssocs.length > 0) {
        setAssociations([...associations, ...newAssocs]);
        setNewAssociation({
          taskName: AVAILABLE_TASKS[0],
          accountTypes: [],
        });
        showNotification('success', `${newAssocs.length} association(s) créée(s) avec succès`);
      } else {
        showNotification('error', 'Toutes les associations existent déjà');
      }
    } catch {
      showNotification('error', 'Erreur lors de l\'ajout');
    }
  };

  const handleDeleteAssociation = async (id: number) => {
    try {
      const res = await fetch(`/api/account-type-tasks?id=${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        showNotification('error', 'Erreur lors de la suppression');
        return;
      }

      setAssociations(associations.filter(a => a.id !== id));
      setDeleteConfirm(null);
      showNotification('success', 'Association supprimée avec succès');
    } catch {
      showNotification('error', 'Erreur lors de la suppression');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          Accès refusé - Administrateur requis
        </div>
      </div>
    );
  }

  // Grouper les associations par tâche (au lieu de par type de compte)
  const groupedAssociations = AVAILABLE_TASKS.reduce((acc, task) => {
    acc[task] = associations.filter(a => a.taskName === task);
    return acc;
  }, {} as Record<string, AccountTypeTask[]>);

  return (
    <div className="p-6">
      {/* Notification Toast */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in">
          <div
            className={`flex items-center gap-3 px-6 py-4 rounded-lg shadow-lg border ${
              notification.type === 'success'
                ? 'bg-green-50 border-green-200 text-green-800'
                : 'bg-red-50 border-red-200 text-red-800'
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
        <div className="flex items-center gap-3 mb-2">
          <Shield className="text-blue-600" size={32} />
          <h1 className="text-3xl font-bold text-slate-800">Types d&apos;Account &amp; Tâches</h1>
        </div>
        <p className="text-slate-600">Définir quelles tâches doivent être effectuées pour chaque type de compte</p>
      </div>

      {/* Formulaire d'ajout */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 mb-6">
        <h2 className="text-xl font-semibold text-slate-800 mb-4">Nouvelle Association</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Tâche</label>
            <select
              value={newAssociation.taskName}
              onChange={(e) => setNewAssociation({ ...newAssociation, taskName: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            >
              {AVAILABLE_TASKS.map(task => (
                <option key={task} value={task}>{task}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Types de Compte (Sélection multiple)</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 p-4 border border-slate-300 rounded-lg bg-slate-50 max-h-64 overflow-y-auto">
              {ACCOUNT_TYPES.map(type => (
                <label key={type} className="flex items-center gap-2 cursor-pointer hover:bg-slate-100 p-2 rounded">
                  <input
                    type="checkbox"
                    checked={newAssociation.accountTypes.includes(type)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setNewAssociation({ 
                          ...newAssociation, 
                          accountTypes: [...newAssociation.accountTypes, type] 
                        });
                      } else {
                        setNewAssociation({ 
                          ...newAssociation, 
                          accountTypes: newAssociation.accountTypes.filter(t => t !== type) 
                        });
                      }
                    }}
                    className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm text-slate-700">{type}</span>
                </label>
              ))}
            </div>
            {newAssociation.accountTypes.length > 0 && (
              <p className="text-sm text-slate-600 mt-2">
                {newAssociation.accountTypes.length} type(s) sélectionné(s)
              </p>
            )}
          </div>
          <button
            onClick={handleAddAssociation}
            disabled={newAssociation.accountTypes.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed"
          >
            <Plus size={20} />
            Ajouter {newAssociation.accountTypes.length > 0 && `(${newAssociation.accountTypes.length})`}
          </button>
        </div>
      </div>

      {/* Liste des associations groupées par tâche */}
      <div className="space-y-6">
        {AVAILABLE_TASKS.map(task => {
          const taskTypes = groupedAssociations[task];
          if (taskTypes.length === 0) return null;

          return (
            <div key={task} className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-blue-50 border-b border-blue-200 px-6 py-3 flex items-center justify-between">
                <h3 className="font-semibold text-slate-800">{task}</h3>
                <span className="text-sm text-slate-600">{taskTypes.length} type(s) de compte</span>
              </div>
              <div className="p-4">
                <div className="flex flex-wrap gap-2">
                  {taskTypes.map(association => (
                    <div 
                      key={association.id} 
                      className="flex items-center gap-2 px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg hover:bg-slate-200 transition-colors group"
                    >
                      <span className="text-sm font-medium text-slate-700">{association.accountType}</span>
                      <button
                        onClick={() => setDeleteConfirm(association.id)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Supprimer"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-slate-500 mt-3">
                  Ajouté le {new Date(taskTypes[0].createdAt).toLocaleDateString('fr-FR')}
                </p>
              </div>
            </div>
          );
        })}

        {Object.values(groupedAssociations).every(tasks => tasks.length === 0) && (
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-8 text-center">
            <p className="text-slate-600">Aucune association créée pour le moment</p>
          </div>
        )}
      </div>

      {/* Modal de confirmation de suppression */}
      {deleteConfirm !== null && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-100 rounded-full">
                <AlertCircle className="text-red-600" size={24} />
              </div>
              <h3 className="text-xl font-bold text-slate-800">Confirmer la suppression</h3>
            </div>
            <p className="text-slate-600 mb-6">
              Êtes-vous sûr de vouloir supprimer cette association ?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-medium"
              >
                Annuler
              </button>
              <button
                onClick={() => handleDeleteAssociation(deleteConfirm)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
