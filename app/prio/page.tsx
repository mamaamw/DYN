'use client';

import React, { useEffect, useState } from 'react';
import { AlertCircle, User, X, Save, Settings } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { GENERAL_REFERENCES } from '@/lib/constants';

interface ContactIdentifier {
  id?: number;
  accountNumber: string;
  accountType: string;
  info: string | null;
}

interface NewClient {
  id: number;
  firstName: string | null;
  surname: string | null;
  nickname: string | null;
  requestor: string | null;
  priority: string;
  description: string | null;
  externalHelp: boolean;
  contactIdentifiers?: ContactIdentifier[];
  searches?: Array<{
    id: number;
    generalReference: string | null;
    detailedReference: string | null;
    startDate: string | null;
    endDate: string | null;
  }>;
}

interface Category {
  id: number;
  name: string;
  label: string;
  color: string;
  icon?: string;
}

interface DisplayPreferences {
  showNickname: boolean;
  showFullName: boolean;
  showRequestor: boolean;
  showDescription: boolean;
  showExternalHelp: boolean;
  showReferences: boolean;
  showStartDate: boolean;
  showEndDate: boolean;
  showContactCount: boolean;
}

const PRIORITIES = [
  { key: 'Immédiate', label: 'Immédiate', color: 'bg-red-500', textColor: 'text-red-700', bgLight: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-200 dark:border-red-800' },
  { key: 'Haute', label: 'Haute', color: 'bg-orange-500', textColor: 'text-orange-700', bgLight: 'bg-orange-50 dark:bg-orange-900/20', border: 'border-orange-200 dark:border-orange-800' },
  { key: 'Moyenne', label: 'Moyenne', color: 'bg-yellow-500', textColor: 'text-yellow-700', bgLight: 'bg-yellow-50 dark:bg-yellow-900/20', border: 'border-yellow-200 dark:border-yellow-800' },
  { key: 'Faible', label: 'Faible', color: 'bg-green-500', textColor: 'text-green-700', bgLight: 'bg-green-50 dark:bg-green-900/20', border: 'border-green-200 dark:border-green-800' },
];

export default function PrioPage() {
  const [clients, setClients] = useState<NewClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [draggedClient, setDraggedClient] = useState<NewClient | null>(null);
  const [selectedClient, setSelectedClient] = useState<NewClient | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPreferencesModal, setShowPreferencesModal] = useState(false);
  const [userCategories, setUserCategories] = useState<Category[]>([]);
  const [displayPreferences, setDisplayPreferences] = useState<DisplayPreferences>({
    showNickname: true,
    showFullName: false,
    showRequestor: true,
    showDescription: false,
    showExternalHelp: false,
    showReferences: true,
    showStartDate: false,
    showEndDate: true,
    showContactCount: false,
  });
  const [editFormData, setEditFormData] = useState({
    nickname: '',
    surname: '',
    firstName: '',
    description: '',
    requestor: '',
    priority: 'Moyenne',
    externalHelp: false,
    generalReference: '',
    detailedReference: '',
    searchStartDate: '',
    searchEndDate: '',
  });
  const [editContacts, setEditContacts] = useState<ContactIdentifier[]>([]);

  useEffect(() => {
    fetchClients();
    fetchUserCategories();
    // Charger les préférences depuis localStorage avec valeurs par défaut
    const savedPrefs = localStorage.getItem('prioDisplayPreferences');
    if (savedPrefs) {
      const parsed = JSON.parse(savedPrefs);
      // Fusionner avec les valeurs par défaut pour s'assurer que toutes les propriétés existent
      setDisplayPreferences({
        showNickname: parsed.showNickname ?? true,
        showFullName: parsed.showFullName ?? false,
        showRequestor: parsed.showRequestor ?? true,
        showDescription: parsed.showDescription ?? false,
        showExternalHelp: parsed.showExternalHelp ?? false,
        showReferences: parsed.showReferences ?? true,
        showStartDate: parsed.showStartDate ?? false,
        showEndDate: parsed.showEndDate ?? true,
        showContactCount: parsed.showContactCount ?? false,
      });
    }
  }, []);

  const saveDisplayPreferences = (prefs: DisplayPreferences) => {
    setDisplayPreferences(prefs);
    localStorage.setItem('prioDisplayPreferences', JSON.stringify(prefs));
  };

  const fetchUserCategories = async () => {
    try {
      const profileResponse = await fetch('/api/user/profile');
      if (!profileResponse.ok) return;
      
      const profileData = await profileResponse.json();
      const userId = profileData.user?.id;
      if (!userId) return;

      const categoriesResponse = await fetch(`/api/users/${userId}/categories`);
      if (!categoriesResponse.ok) return;
      
      const categoriesData = await categoriesResponse.json();
      setUserCategories(categoriesData.categories || []);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  const fetchClients = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/newclients');
      
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des clients');
      }

      const data = await response.json();
      // L'API retourne directement un tableau
      setClients(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  };

  const updateClientPriority = async (clientId: number, newPriority: string) => {
    try {
      // Trouver le client à mettre à jour
      const clientToUpdate = clients.find(c => c.id === clientId);
      if (!clientToUpdate) return;

      // Récupérer les données de recherche existantes
      const search = clientToUpdate.searches?.[0];
      
      // Préparer les données complètes pour l'API
      const updateData = {
        nickname: clientToUpdate.nickname,
        surname: clientToUpdate.surname,
        firstName: clientToUpdate.firstName,
        description: clientToUpdate.description,
        requestor: clientToUpdate.requestor,
        priority: newPriority,
        externalHelp: clientToUpdate.externalHelp,
        contactIdentifiers: clientToUpdate.contactIdentifiers || [],
        // Préserver les champs de recherche existants
        generalReference: search?.generalReference || null,
        detailedReference: search?.detailedReference || null,
        searchStartDate: search?.startDate || null,
        searchEndDate: search?.endDate || null,
      };

      const response = await fetch(`/api/newclients/${clientId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la mise à jour');
      }

      const updatedClient = await response.json();

      // Mettre à jour localement avec les données retournées par l'API
      setClients(prev => prev.map(client => 
        client.id === clientId ? { ...client, ...updatedClient } : client
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la mise à jour');
      // En cas d'erreur, recharger tous les clients pour avoir l'état correct
      fetchClients();
    }
  };

  const handleDragStart = (client: NewClient) => {
    setDraggedClient(client);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (targetPriority: string) => {
    if (!draggedClient) return;
    
    if (draggedClient.priority !== targetPriority) {
      updateClientPriority(draggedClient.id, targetPriority);
    }
    
    setDraggedClient(null);
  };

  const openEditModal = (client: NewClient) => {
    setSelectedClient(client);
    const search = client.searches?.[0];
    setEditFormData({
      nickname: client.nickname || '',
      surname: client.surname || '',
      firstName: client.firstName || '',
      description: client.description || '',
      requestor: client.requestor || '',
      priority: client.priority,
      externalHelp: client.externalHelp,
      generalReference: search?.generalReference || '',
      detailedReference: search?.detailedReference || '',
      searchStartDate: search?.startDate ? new Date(search.startDate).toISOString().split('T')[0] : '',
      searchEndDate: search?.endDate ? new Date(search.endDate).toISOString().split('T')[0] : '',
    });
    setEditContacts(client.contactIdentifiers || []);
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setSelectedClient(null);
    setError('');
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setEditFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const saveClientChanges = async () => {
    if (!selectedClient) return;

    // Validation: nickname obligatoire
    if (!editFormData.nickname.trim()) {
      setError('Le surnom est obligatoire');
      return;
    }

    // Validation: requestor obligatoire si catégories disponibles
    if (userCategories.length > 0 && !editFormData.requestor) {
      setError('Le demandeur est obligatoire');
      return;
    }

    // Validation: au moins un contact
    const validContacts = editContacts.filter(c => c.accountNumber.trim() !== '');
    if (validContacts.length === 0) {
      setError('Au moins un identifiant de contact est requis');
      return;
    }

    // Validation: priorité obligatoire
    if (!editFormData.priority) {
      setError('La priorité est obligatoire');
      return;
    }

    // Validation: référence générale obligatoire
    if (!editFormData.generalReference) {
      setError('La référence générale est obligatoire');
      return;
    }

    // Validation: référence détaillée obligatoire
    if (!editFormData.detailedReference.trim()) {
      setError('La référence détaillée est obligatoire');
      return;
    }

    // Validation: dates de recherche obligatoires
    if (!editFormData.searchStartDate) {
      setError('La date de début de recherche est obligatoire');
      return;
    }

    if (!editFormData.searchEndDate) {
      setError('La date de fin de recherche est obligatoire');
      return;
    }

    // Validation: vérifier que la date de début n'est pas après la date de fin
    const startDate = new Date(editFormData.searchStartDate);
    const endDate = new Date(editFormData.searchEndDate);
    if (startDate > endDate) {
      setError('La date de début ne peut pas être après la date de fin');
      return;
    }

    try {
      const response = await fetch(`/api/newclients/${selectedClient.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editFormData,
          searchStartDate: editFormData.searchStartDate || null,
          searchEndDate: editFormData.searchEndDate || null,
          contactIdentifiers: validContacts,
        }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la mise à jour');
      }

      const updatedClient = await response.json();

      // Mettre à jour localement avec les données complètes retournées par l'API
      setClients(prev => prev.map(client =>
        client.id === selectedClient.id ? updatedClient : client
      ));

      closeEditModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la mise à jour');
    }
  };

  const getClientName = (client: NewClient) => {
    if (client.nickname) return client.nickname;
    if (client.firstName && client.surname) return `${client.firstName} ${client.surname}`;
    if (client.firstName) return client.firstName;
    if (client.surname) return client.surname;
    return 'Sans nom';
  };

  const getClientsByPriority = (priority: string) => {
    return clients.filter(client => client.priority === priority);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Gestion des Priorités
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Organisez vos clients par priorité avec le glisser-déposer
          </p>
        </div>
        <button
          onClick={() => setShowPreferencesModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
          title="Configurer l'affichage"
        >
          <Settings size={20} />
          <span className="hidden sm:inline">Affichage</span>
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {PRIORITIES.map(priority => {
          const priorityClients = getClientsByPriority(priority.key);
          
          return (
            <div
              key={priority.key}
              className="flex flex-col"
            >
              {/* Column Header */}
              <div className={`${priority.color} text-white px-4 py-3 rounded-t-lg`}>
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{priority.label}</h3>
                  <span className="bg-white/20 px-2 py-1 rounded text-sm">
                    {priorityClients.length}
                  </span>
                </div>
              </div>

              {/* Drop Zone */}
              <div
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(priority.key)}
                className={`flex-1 ${priority.bgLight} ${priority.border} border border-t-0 rounded-b-lg p-3 min-h-[500px] space-y-2`}
              >
                {priorityClients.length === 0 ? (
                  <div className="flex items-center justify-center h-32 text-slate-400 dark:text-slate-500 text-sm">
                    Aucun client
                  </div>
                ) : (
                  priorityClients.map(client => (
                    <div
                      key={client.id}
                      draggable
                      onDragStart={() => handleDragStart(client)}
                      onClick={(e) => {
                        // Ne pas ouvrir le modal si on est en train de drag
                        if (!draggedClient) {
                          openEditModal(client);
                        }
                      }}
                      className={`bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 cursor-pointer shadow-sm hover:shadow-md transition ${
                        draggedClient?.id === client.id ? 'opacity-50' : ''
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-full">
                          <User size={16} className="text-slate-600 dark:text-slate-400" />
                        </div>
                        <div className="flex-1 min-w-0 space-y-1">
                          {displayPreferences.showNickname && (
                            <h4 className="font-semibold text-slate-900 dark:text-white text-sm truncate">
                              {client.nickname || getClientName(client)}
                            </h4>
                          )}
                          {displayPreferences.showFullName && (client.firstName || client.surname) && (
                            <p className="text-xs text-slate-600 dark:text-slate-300">
                              {[client.firstName, client.surname].filter(Boolean).join(' ')}
                            </p>
                          )}
                          {displayPreferences.showReferences && client.searches && client.searches.length > 0 && (
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {client.searches[0].generalReference && (
                                <span className="inline-block px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded mr-1">
                                  {client.searches[0].generalReference}
                                </span>
                              )}
                              {client.searches[0].detailedReference && (
                                <span className="text-slate-600 dark:text-slate-400">
                                  {client.searches[0].detailedReference}
                                </span>
                              )}
                            </p>
                          )}
                          {displayPreferences.showStartDate && client.searches && client.searches.length > 0 && client.searches[0].startDate && (
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              Début: {new Date(client.searches[0].startDate).toLocaleDateString('fr-FR')}
                            </p>
                          )}
                          {displayPreferences.showEndDate && client.searches && client.searches.length > 0 && client.searches[0].endDate && (
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              Fin: {new Date(client.searches[0].endDate).toLocaleDateString('fr-FR')}
                            </p>
                          )}
                          {displayPreferences.showRequestor && client.requestor && (
                            <p className="text-xs text-slate-600 dark:text-slate-300">
                              👤 {client.requestor}
                            </p>
                          )}
                          {displayPreferences.showDescription && client.description && (
                            <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                              {client.description}
                            </p>
                          )}
                          {displayPreferences.showContactCount && client.contactIdentifiers && client.contactIdentifiers.length > 0 && (
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              📞 {client.contactIdentifiers.length} contact{client.contactIdentifiers.length > 1 ? 's' : ''}
                            </p>
                          )}
                          {displayPreferences.showExternalHelp && client.externalHelp && (
                            <span className="inline-block px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs rounded">
                              Aide externe
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Modal */}
      {showEditModal && selectedClient && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={closeEditModal}>
          <div className="bg-white dark:bg-[#0f172a] rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border dark:border-[#1b2436]" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white dark:bg-[#0f172a] border-b dark:border-[#1b2436] z-10">
              <div className="px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Modifier le client
                </h2>
                <button
                  onClick={closeEditModal}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-[#1b2436] rounded-lg transition-colors"
                >
                  <X size={20} className="text-gray-600 dark:text-gray-400" />
                </button>
              </div>

              {error && (
                <div className="mx-6 mb-4 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded">
                  {error}
                </div>
              )}
            </div>

            <div className="p-6 space-y-6">
              {/* Informations de base */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b dark:border-[#1b2436] pb-2">
                  Informations de base
                </h3>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Surnom (Nickname) *
                  </label>
                  <input
                    type="text"
                    name="nickname"
                    value={editFormData.nickname}
                    onChange={handleEditChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-[#1b2436] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-transparent dark:text-white"
                    placeholder="Surnom"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Nom de famille (Surname)
                    </label>
                    <input
                      type="text"
                      name="surname"
                      value={editFormData.surname}
                      onChange={handleEditChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-[#1b2436] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-transparent dark:text-white"
                      placeholder="Dupont"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Prénom (First name)
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={editFormData.firstName}
                      onChange={handleEditChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-[#1b2436] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-transparent dark:text-white"
                      placeholder="Jean"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={editFormData.description}
                    onChange={handleEditChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-[#1b2436] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-transparent dark:text-white"
                    placeholder="Description du client..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Demandeur (Requestor)
                  </label>
                  {userCategories.length > 0 ? (
                    <select
                      name="requestor"
                      value={editFormData.requestor}
                      onChange={handleEditChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-[#1b2436] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-transparent dark:text-white"
                    >
                      <option value="">Sélectionner une catégorie</option>
                      {userCategories.map(cat => (
                        <option key={cat.id} value={cat.label}>
                          {cat.icon} {cat.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      name="requestor"
                      value={editFormData.requestor}
                      onChange={handleEditChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-[#1b2436] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-transparent dark:text-white"
                      placeholder="Nom du demandeur"
                    />
                  )}
                </div>
              </div>

              {/* Identifiants de contact */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b dark:border-[#1b2436] pb-2">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Identifiants de contact
                  </h3>
                  <div className="flex gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setEditContacts([...editContacts, { accountNumber: '', accountType: 'Téléphone', info: null }])}
                      className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 text-sm"
                    >
                      + Téléphone
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditContacts([...editContacts, { accountNumber: '', accountType: 'WhatsApp', info: null }])}
                      className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 text-sm"
                    >
                      + WhatsApp
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditContacts([...editContacts, { accountNumber: '', accountType: 'Telegram', info: null }])}
                      className="px-3 py-1 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 rounded-lg hover:bg-cyan-200 dark:hover:bg-cyan-900/50 text-sm"
                    >
                      + Telegram
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditContacts([...editContacts, { accountNumber: '', accountType: 'Signal', info: null }])}
                      className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/50 text-sm"
                    >
                      + Signal
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditContacts([...editContacts, { accountNumber: '', accountType: 'Threema', info: null }])}
                      className="px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-lg hover:bg-orange-200 dark:hover:bg-orange-900/50 text-sm"
                    >
                      + Threema
                    </button>
                  </div>
                </div>

                {editContacts.length === 0 && (
                  <div className="p-4 bg-gray-50 dark:bg-[#121a2d] rounded-lg text-center text-gray-500 dark:text-gray-400">
                    Aucun contact ajouté. Cliquez sur les boutons ci-dessus pour ajouter des numéros de téléphone ou des comptes.
                  </div>
                )}

                {editContacts.map((contact, i) => (
                  <div key={i} className="grid grid-cols-12 gap-4 p-4 bg-gray-50 dark:bg-[#121a2d] rounded-lg">
                    <div className="col-span-3">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Type
                      </label>
                      <select
                        value={contact.accountType}
                        onChange={(e) => {
                          const updated = [...editContacts];
                          updated[i].accountType = e.target.value;
                          setEditContacts(updated);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-[#1b2436] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-transparent dark:text-white"
                      >
                        <option value="Téléphone">Téléphone</option>
                        <option value="WhatsApp">WhatsApp</option>
                        <option value="Telegram">Telegram</option>
                        <option value="Signal">Signal</option>
                        <option value="Threema">Threema</option>
                      </select>
                    </div>
                    <div className="col-span-4">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Numéro / Compte
                      </label>
                      <input
                        type="text"
                        value={contact.accountNumber}
                        onChange={(e) => {
                          const updated = [...editContacts];
                          updated[i].accountNumber = e.target.value;
                          setEditContacts(updated);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-[#1b2436] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-transparent dark:text-white"
                        placeholder="+33 6 12 34 56 78"
                      />
                    </div>
                    <div className="col-span-4">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Information
                      </label>
                      <textarea
                        value={contact.info || ''}
                        onChange={(e) => {
                          const updated = [...editContacts];
                          updated[i].info = e.target.value;
                          setEditContacts(updated);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-[#1b2436] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-transparent dark:text-white resize-y"
                        placeholder="Personnel, Bureau..."
                        rows={3}
                      />
                    </div>
                    <div className="col-span-1 flex items-end">
                      <button
                        type="button"
                        onClick={() => setEditContacts(editContacts.filter((_, idx) => idx !== i))}
                        className="w-full px-3 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50"
                        title="Supprimer"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Priorité et Options */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b dark:border-[#1b2436] pb-2">
                  Priorité et Options
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Priorité *
                    </label>
                    <select
                      name="priority"
                      value={editFormData.priority}
                      onChange={handleEditChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 dark:border-[#1b2436] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-transparent dark:text-white"
                    >
                      <option value="Faible">Faible</option>
                      <option value="Moyenne">Moyenne</option>
                      <option value="Haute">Haute</option>
                      <option value="Immédiate">Immédiate</option>
                    </select>
                  </div>

                  <div className="flex items-center pt-7">
                    <input
                      type="checkbox"
                      name="externalHelp"
                      checked={editFormData.externalHelp}
                      onChange={handleEditChange}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <label className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Peut demander de l'aide à l'externe
                    </label>
                  </div>
                </div>
              </div>

              {/* Références */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b dark:border-[#1b2436] pb-2">
                  Références
                </h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Référence Générale *
                  </label>
                  <select
                    name="generalReference"
                    value={editFormData.generalReference}
                    onChange={handleEditChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-[#1b2436] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-transparent dark:text-white"
                  >
                    <option value="">Sélectionner une référence</option>
                    <option value="Article">Article</option>
                    <option value="BD">BD</option>
                    <option value="Film">Film</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Référence Détaillée *
                  </label>
                  <input
                    type="text"
                    name="detailedReference"
                    value={editFormData.detailedReference}
                    onChange={handleEditChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-[#1b2436] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-transparent dark:text-white"
                    placeholder="Référence détaillée..."
                  />
                </div>
              </div>

              {/* Période de recherche */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white border-b dark:border-[#1b2436] pb-2">
                  Période de recherche
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Début de la recherche *
                    </label>
                    <input
                      type="date"
                      name="searchStartDate"
                      value={editFormData.searchStartDate}
                      max={editFormData.searchEndDate || undefined}
                      onChange={handleEditChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 dark:border-[#1b2436] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-transparent dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Fin de la recherche *
                    </label>
                    <input
                      type="date"
                      name="searchEndDate"
                      value={editFormData.searchEndDate}
                      min={editFormData.searchStartDate || undefined}
                      onChange={handleEditChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 dark:border-[#1b2436] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-transparent dark:text-white"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-white dark:bg-[#0f172a] border-t dark:border-[#1b2436] px-6 py-4 flex gap-4">
              <button
                type="button"
                onClick={saveClientChanges}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Enregistrer les modifications
              </button>
              <button
                type="button"
                onClick={closeEditModal}
                className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {PRIORITIES.map(priority => {
          const count = getClientsByPriority(priority.key).length;
          const percentage = clients.length > 0 ? (count / clients.length * 100).toFixed(1) : 0;
          
          return (
            <Card key={priority.key}>
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{priority.label}</p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                      {count}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {percentage}% du total
                    </p>
                  </div>
                  <div className={`w-12 h-12 ${priority.color} rounded-lg`}></div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Preferences Modal */}
      {showPreferencesModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowPreferencesModal(false)}>
          <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b dark:border-slate-700">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Préférences d'affichage
                </h2>
                <button
                  onClick={() => setShowPreferencesModal(false)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <X size={20} className="text-slate-600 dark:text-slate-400" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                Choisissez les informations à afficher sur les cartes kanban
              </p>
              
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={displayPreferences.showNickname}
                  onChange={(e) => saveDisplayPreferences({ ...displayPreferences, showNickname: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-slate-700 dark:text-slate-300">Surnom / Nom</span>
              </label>
              
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={displayPreferences.showFullName}
                  onChange={(e) => saveDisplayPreferences({ ...displayPreferences, showFullName: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-slate-700 dark:text-slate-300">Nom complet (Prénom + Nom de famille)</span>
              </label>
              
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={displayPreferences.showReferences}
                  onChange={(e) => saveDisplayPreferences({ ...displayPreferences, showReferences: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-slate-700 dark:text-slate-300">Références (Article, BD, Film + référence détaillée)</span>
              </label>
              
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={displayPreferences.showStartDate}
                  onChange={(e) => saveDisplayPreferences({ ...displayPreferences, showStartDate: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-slate-700 dark:text-slate-300">Date de début de recherche</span>
              </label>
              
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={displayPreferences.showEndDate}
                  onChange={(e) => saveDisplayPreferences({ ...displayPreferences, showEndDate: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-slate-700 dark:text-slate-300">Date de fin de recherche</span>
              </label>
              
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={displayPreferences.showRequestor}
                  onChange={(e) => saveDisplayPreferences({ ...displayPreferences, showRequestor: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-slate-700 dark:text-slate-300">Demandeur</span>
              </label>
              
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={displayPreferences.showDescription}
                  onChange={(e) => saveDisplayPreferences({ ...displayPreferences, showDescription: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-slate-700 dark:text-slate-300">Description</span>
              </label>
              
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={displayPreferences.showContactCount}
                  onChange={(e) => saveDisplayPreferences({ ...displayPreferences, showContactCount: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-slate-700 dark:text-slate-300">Nombre de contacts</span>
              </label>
              
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={displayPreferences.showExternalHelp}
                  onChange={(e) => saveDisplayPreferences({ ...displayPreferences, showExternalHelp: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-slate-700 dark:text-slate-300">Badge aide externe</span>
              </label>
            </div>
            
            <div className="p-6 border-t dark:border-slate-700 flex justify-end">
              <button
                onClick={() => setShowPreferencesModal(false)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
