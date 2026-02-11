'use client';

import { useEffect, useState } from 'react';
import { Search, Calendar, User, FileText, Trash2, Eye, Edit, X, AlertCircle, RefreshCw, Plus, Clock } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { GENERAL_REFERENCES } from '@/lib/constants';

interface SearchData {
  id: number;
  newClientId: number;
  generalReference: string | null;
  detailedReference: string | null;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
  newClient: {
    firstName: string | null;
    surname: string | null;
    nickname: string | null;
  };
}

export default function SearchesPage() {
  const [searches, setSearches] = useState<SearchData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('');
  const [viewMode, setViewMode] = useState<'client' | 'mandat'>('mandat');
  const [viewSearch, setViewSearch] = useState<SearchData | null>(null);
  const [editSearch, setEditSearch] = useState<SearchData | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [modalError, setModalError] = useState('');
  const [showExtendModal, setShowExtendModal] = useState<SearchData | null>(null);
  const [showNewSearchModal, setShowNewSearchModal] = useState<SearchData | null>(null);
  const [extending, setExtending] = useState(false);
  const [newEndDate, setNewEndDate] = useState('');
  const [newSearchData, setNewSearchData] = useState({
    generalReference: '',
    detailedReference: '',
    startDate: '',
    endDate: ''
  });
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [linkConfirmation, setLinkConfirmation] = useState<{
    existingSearch: {
      id: number;
      generalReference: string;
      detailedReference: string;
      startDate: string;
      endDate: string;
      linkedClients: { id: number; name: string }[];
    };
    clientId: number;
  } | null>(null);

  useEffect(() => {
    fetchSearches();
  }, []);

  const fetchSearches = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/searches');
      
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des recherches');
      }

      const data = await response.json();
      setSearches(data.searches || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredSearches = searches.filter(search => {
    if (!search.newClient) return false;
    
    const searchTerm = filter.toLowerCase();
    const clientName = `${search.newClient.firstName || ''} ${search.newClient.surname || ''} ${search.newClient.nickname || ''}`.toLowerCase();
    const generalRef = (search.generalReference || '').toLowerCase();
    const detailedRef = (search.detailedReference || '').toLowerCase();
    
    return clientName.includes(searchTerm) || 
           generalRef.includes(searchTerm) || 
           detailedRef.includes(searchTerm);
  });

  // Grouper les recherches par mandat (search.id)
  const groupedByMandat = filteredSearches.reduce((acc, search) => {
    if (!acc[search.id]) {
      acc[search.id] = {
        ...search,
        clients: []
      };
    }
    acc[search.id].clients.push({
      id: search.newClientId,
      ...search.newClient
    });
    return acc;
  }, {} as Record<number, SearchData & { clients: Array<{ id: number; firstName: string | null; surname: string | null; nickname: string | null }> }>);

  const mandatSearches = Object.values(groupedByMandat);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getClientName = (client: SearchData['newClient']) => {
    if (!client) return 'Client inconnu';
    if (client.nickname) return client.nickname;
    if (client.firstName && client.surname) return `${client.firstName} ${client.surname}`;
    if (client.firstName) return client.firstName;
    if (client.surname) return client.surname;
    return 'Client anonyme';
  };

  const getSearchStatus = (search: SearchData) => {
    const now = new Date();
    const startDate = search.startDate ? new Date(search.startDate) : null;
    const endDate = search.endDate ? new Date(search.endDate) : null;

    if (endDate && now > endDate) {
      return { label: 'Périmé', color: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400', expired: true };
    }
    
    if (startDate && now < startDate) {
      return { label: 'Prévu', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400', expired: false };
    }
    
    return { label: 'En cours', color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400', expired: false };
  };

  const isSearchExpired = (search: SearchData) => {
    if (!search.endDate) return false;
    const endDate = new Date(search.endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return endDate < today;
  };

  const handleExtendDate = async () => {
    if (!newEndDate || !showExtendModal) return;
    
    setExtending(true);
    try {
      const response = await fetch(`/api/searches/${showExtendModal.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endDate: newEndDate,
          newClientId: showExtendModal.newClientId,
        }),
      });

      if (!response.ok) throw new Error('Erreur lors de la prolongation');
      
      await fetchSearches();
      setShowExtendModal(null);
      setNewEndDate('');
      setSuccessMessage('Date de fin prolongée avec succès');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setModalError(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setExtending(false);
    }
  };

  const handleNewSearch = async (linkToExisting = false) => {
    if (!newSearchData.generalReference || !newSearchData.startDate || !newSearchData.endDate || !showNewSearchModal) return;
    
    setExtending(true);
    try {
      const response = await fetch(`/api/newclients/${showNewSearchModal.newClientId}/searches`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          generalReference: newSearchData.generalReference,
          detailedReference: newSearchData.detailedReference,
          startDate: newSearchData.startDate,
          endDate: newSearchData.endDate,
          linkToExisting,
        }),
      });

      const data = await response.json();

      // Si validation requise, afficher la modal de confirmation
      if (data.requiresValidation) {
        setLinkConfirmation({
          existingSearch: data.existingSearch,
          clientId: showNewSearchModal.newClientId
        });
        setExtending(false);
        return;
      }

      if (!response.ok) throw new Error(data.error || 'Erreur lors de la création de la nouvelle recherche');
      
      await fetchSearches();
      setShowNewSearchModal(null);
      setNewSearchData({ generalReference: '', detailedReference: '', startDate: '', endDate: '' });
      setSuccessMessage(linkToExisting ? 'Client lié à la recherche existante' : 'Nouvelle recherche créée avec succès');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setModalError(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setExtending(false);
    }
  };

  const handleConfirmLink = async () => {
    if (!linkConfirmation) return;
    
    // Fermer la modal de confirmation et relancer avec linkToExisting=true
    setLinkConfirmation(null);
    await handleNewSearch(true);
  };

  const handleDeleteSearch = async (id: number) => {
    try {
      const response = await fetch(`/api/searches?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la suppression');
      }

      setSearches(searches.filter(s => s.id !== id));
      setDeleteConfirm(null);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleUpdateSearch = async () => {
    if (!editSearch) return;

    // Validation: vérifier que la date de début n'est pas après la date de fin
    if (editSearch.startDate && editSearch.endDate) {
      const start = new Date(editSearch.startDate);
      const end = new Date(editSearch.endDate);
      if (start > end) {
        setModalError('La date de début ne peut pas être après la date de fin');
        return;
      }
    }

    try {
      const response = await fetch('/api/searches', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editSearch),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la mise à jour');
      }

      const data = await response.json();
      setSearches(searches.map(s => s.id === data.search.id ? data.search : s));
      setEditSearch(null);
      setModalError('');
    } catch (err: any) {
      setModalError(err.message);
    }
  };

  const closeEditModal = () => {
    setEditSearch(null);
    setModalError('');
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
            Recherches
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Gestion des recherches client
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Total</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {searches.length}
                </p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Search size={24} className="text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Ce mois</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {searches.filter(s => {
                    const date = new Date(s.createdAt);
                    const now = new Date();
                    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
                  }).length}
                </p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <Calendar size={24} className="text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Prévues</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {searches.filter(s => {
                    const now = new Date();
                    const startDate = s.startDate ? new Date(s.startDate) : null;
                    return startDate && now < startDate;
                  }).length}
                </p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Calendar size={24} className="text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">En cours</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {searches.filter(s => {
                    const now = new Date();
                    const startDate = s.startDate ? new Date(s.startDate) : null;
                    const endDate = s.endDate ? new Date(s.endDate) : null;
                    return (!endDate || now <= endDate) && (!startDate || now >= startDate);
                  }).length}
                </p>
              </div>
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Eye size={24} className="text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Terminées</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {searches.filter(s => {
                    const now = new Date();
                    const endDate = s.endDate ? new Date(s.endDate) : null;
                    return endDate && now > endDate;
                  }).length}
                </p>
              </div>
              <div className="p-3 bg-slate-100 dark:bg-slate-700 rounded-lg">
                <FileText size={24} className="text-slate-600 dark:text-slate-400" />
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Filter */}
      <Card>
        <div className="p-4">
          <div className="flex gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="text"
                placeholder="Rechercher par client ou référence..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('client')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  viewMode === 'client'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
                }`}
              >
                Par client
              </button>
              <button
                onClick={() => setViewMode('mandat')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  viewMode === 'mandat'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
                }`}
              >
                Par mandat
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* Error */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  {viewMode === 'client' ? 'Client' : 'Clients liés'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Référence générale
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Référence détaillée
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Date début
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Date fin
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-700">
              {(viewMode === 'client' ? filteredSearches : mandatSearches).length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                    Aucune recherche trouvée
                  </td>
                </tr>
              ) : viewMode === 'client' ? (
                filteredSearches.map((search) => (
                  <tr key={`${search.id}-${search.newClientId}`} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full mr-3">
                          <User size={16} className="text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="text-sm font-medium text-slate-900 dark:text-white">
                          {getClientName(search.newClient)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-300">
                      {search.generalReference || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-900 dark:text-slate-300">
                      <div className="max-w-xs truncate">
                        {search.detailedReference || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-300">
                      {formatDate(search.startDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-300">
                      {formatDate(search.endDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {(() => {
                        const status = getSearchStatus(search);
                        return (
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${status.color}`}>
                            {status.label}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex gap-1">
                        <button 
                          onClick={() => setViewSearch(search)}
                          className="p-1 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded transition"
                          title="Voir les détails"
                        >
                          <Eye size={16} className="text-blue-600 dark:text-blue-400" />
                        </button>
                        <button 
                          onClick={() => {
                            setShowExtendModal(search);
                            setNewEndDate(search.endDate || '');
                          }}
                          className="p-1 hover:bg-orange-100 dark:hover:bg-orange-900/30 rounded transition"
                          title="Prolonger la date"
                        >
                          <RefreshCw size={16} className="text-orange-600 dark:text-orange-400" />
                        </button>
                        <button 
                          onClick={() => setShowNewSearchModal(search)}
                          className="p-1 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded transition"
                          title="Nouvelle recherche"
                        >
                          <Plus size={16} className="text-purple-600 dark:text-purple-400" />
                        </button>
                        <button 
                          onClick={() => setEditSearch(search)}
                          className="p-1 hover:bg-green-100 dark:hover:bg-green-900/30 rounded transition"
                          title="Modifier"
                        >
                          <Edit size={16} className="text-green-600 dark:text-green-400" />
                        </button>
                        <button 
                          onClick={() => setDeleteConfirm(search.id)}
                          className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition"
                          title="Supprimer"
                        >
                          <Trash2 size={16} className="text-red-600 dark:text-red-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                mandatSearches.map((mandat) => (
                  <tr key={mandat.id} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition">
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        {mandat.clients.map((client, idx) => (
                          <div key={client.id} className="flex items-center bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded">
                            <User size={14} className="text-blue-600 dark:text-blue-400 mr-1" />
                            <span className="text-sm text-slate-900 dark:text-white">
                              {client.nickname || `${client.firstName || ''} ${client.surname || ''}`.trim() || 'Client anonyme'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-300">
                      {mandat.generalReference || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-900 dark:text-slate-300">
                      <div className="max-w-xs truncate">
                        {mandat.detailedReference || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-300">
                      {formatDate(mandat.startDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-300">
                      {formatDate(mandat.endDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {(() => {
                        const status = getSearchStatus(mandat);
                        return (
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${status.color}`}>
                            {status.label}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex gap-1">
                        <button
                          onClick={() => setViewSearch(mandat)}
                          className="p-1 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded transition"
                          title="Voir les détails"
                        >
                          <Eye size={16} className="text-blue-600 dark:text-blue-400" />
                        </button>
                        <button 
                          onClick={() => {
                            setShowExtendModal(mandat);
                            setNewEndDate(mandat.endDate || '');
                          }}
                          className="p-1 hover:bg-orange-100 dark:hover:bg-orange-900/30 rounded transition"
                          title="Prolonger la date"
                        >
                          <RefreshCw size={16} className="text-orange-600 dark:text-orange-400" />
                        </button>
                        <button 
                          onClick={() => setShowNewSearchModal(mandat)}
                          className="p-1 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded transition"
                          title="Nouvelle recherche"
                        >
                          <Plus size={16} className="text-purple-600 dark:text-purple-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal de visualisation */}
      {viewSearch && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Détails de la recherche</h2>
                <button onClick={() => setViewSearch(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">
                  <X size={20} />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Client</label>
                  <p className="text-slate-900 dark:text-white mt-1">{getClientName(viewSearch.newClient)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Référence générale</label>
                  <p className="text-slate-900 dark:text-white mt-1">{viewSearch.generalReference || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Référence détaillée</label>
                  <p className="text-slate-900 dark:text-white mt-1">{viewSearch.detailedReference || '-'}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Date de début</label>
                    <p className="text-slate-900 dark:text-white mt-1">{formatDate(viewSearch.startDate)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Date de fin</label>
                    <p className="text-slate-900 dark:text-white mt-1">{formatDate(viewSearch.endDate)}</p>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600 dark:text-slate-400">Statut</label>
                  <div className="mt-1">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getSearchStatus(viewSearch).color}`}>
                      {getSearchStatus(viewSearch).label}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal d'édition */}
      {editSearch && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Modifier la recherche</h2>
                <button onClick={closeEditModal} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">
                  <X size={20} />
                </button>
              </div>
              {modalError && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg flex items-start gap-2">
                  <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
                  <span>{modalError}</span>
                </div>
              )}
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Référence générale</label>
                  <input
                    type="text"
                    value={editSearch.generalReference || ''}
                    onChange={(e) => setEditSearch({ ...editSearch, generalReference: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Référence détaillée</label>
                  <textarea
                    value={editSearch.detailedReference || ''}
                    onChange={(e) => setEditSearch({ ...editSearch, detailedReference: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Date de début</label>
                    <input
                      type="date"
                      value={editSearch.startDate ? editSearch.startDate.split('T')[0] : ''}
                      max={editSearch.endDate ? editSearch.endDate.split('T')[0] : undefined}
                      onChange={(e) => setEditSearch({ ...editSearch, startDate: e.target.value ? new Date(e.target.value).toISOString() : null })}
                      className="w-full mt-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Date de fin</label>
                    <input
                      type="date"
                      value={editSearch.endDate ? editSearch.endDate.split('T')[0] : ''}
                      min={editSearch.startDate ? editSearch.startDate.split('T')[0] : undefined}
                      onChange={(e) => setEditSearch({ ...editSearch, endDate: e.target.value ? new Date(e.target.value).toISOString() : null })}
                      className="w-full mt-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
                <div className="flex gap-3 justify-end pt-4">
                  <button
                    onClick={closeEditModal}
                    className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleUpdateSearch}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                  >
                    Enregistrer
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmation de suppression */}
      {deleteConfirm !== null && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full">
                <AlertCircle className="text-red-600 dark:text-red-400" size={24} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Confirmer la suppression</h3>
            </div>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              Êtes-vous sûr de vouloir supprimer cette recherche ? Cette action est irréversible.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
              >
                Annuler
              </button>
              <button
                onClick={() => handleDeleteSearch(deleteConfirm)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Message de succès */}
      {successMessage && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          {successMessage}
        </div>
      )}

      {/* Modal Prolonger la date */}
      {showExtendModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <RefreshCw size={20} />
              Prolonger la date de fin
            </h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Nouvelle date de fin
              </label>
              <input
                type="date"
                value={newEndDate}
                onChange={(e) => setNewEndDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Les références générales et détaillées restent inchangées
              </p>
            </div>
            {modalError && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg text-sm">
                {modalError}
              </div>
            )}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowExtendModal(null);
                  setNewEndDate('');
                  setModalError('');
                }}
                className="px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleExtendDate}
                disabled={extending || !newEndDate}
                className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {extending ? 'Enregistrement...' : 'Prolonger'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Nouvelle recherche */}
      {showNewSearchModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Plus size={20} />
              Nouvelle recherche
            </h3>
            <div className="space-y-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Référence Générale *
                </label>
                <select
                  value={newSearchData.generalReference}
                  onChange={(e) => setNewSearchData(prev => ({ ...prev, generalReference: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                >
                  <option value="">Sélectionnez une référence</option>
                  {GENERAL_REFERENCES.map((ref) => (
                    <option key={ref} value={ref}>
                      {ref}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Référence Détaillée
                </label>
                <textarea
                  value={newSearchData.detailedReference}
                  onChange={(e) => setNewSearchData(prev => ({ ...prev, detailedReference: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  placeholder="Détails de la recherche..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Date de début *
                </label>
                <input
                  type="date"
                  value={newSearchData.startDate}
                  onChange={(e) => setNewSearchData(prev => ({ ...prev, startDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Date de fin *
                </label>
                <input
                  type="date"
                  value={newSearchData.endDate}
                  onChange={(e) => setNewSearchData(prev => ({ ...prev, endDate: e.target.value }))}
                  min={newSearchData.startDate || undefined}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  ℹ️ Cette nouvelle recherche sera ajoutée à l'historique du client
                </p>
              </div>
            </div>
            {modalError && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg text-sm">
                {modalError}
              </div>
            )}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowNewSearchModal(null);
                  setNewSearchData({ generalReference: '', detailedReference: '', startDate: '', endDate: '' });
                  setModalError('');
                }}
                className="px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={() => handleNewSearch()}
                disabled={extending || !newSearchData.generalReference || !newSearchData.startDate || !newSearchData.endDate}
                className="px-4 py-2 bg-purple-600 text-white hover:bg-purple-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {extending ? 'Enregistrement...' : 'Créer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmation de lien à une recherche existante */}
      {linkConfirmation && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <AlertCircle size={20} className="text-orange-500" />
              Recherche existante détectée
            </h3>
            <div className="space-y-4 mb-6">
              <div className="p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                <p className="text-sm text-orange-800 dark:text-orange-200 mb-2">
                  ⚠️ Une recherche avec les mêmes références existe déjà et est liée à d'autres clients.
                </p>
                <p className="text-sm text-orange-800 dark:text-orange-200">
                  Souhaitez-vous lier ce client à cette recherche existante ?
                </p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                <h4 className="font-semibold text-slate-900 dark:text-white mb-3">Informations de la recherche existante :</h4>
                <div className="space-y-2 text-sm">
                  <div className="grid grid-cols-2 gap-2">
                    <span className="text-slate-600 dark:text-slate-400">Référence Générale:</span>
                    <span className="font-medium text-slate-900 dark:text-white">{linkConfirmation.existingSearch.generalReference}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <span className="text-slate-600 dark:text-slate-400">Référence Détaillée:</span>
                    <span className="font-medium text-slate-900 dark:text-white">{linkConfirmation.existingSearch.detailedReference || '-'}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <span className="text-slate-600 dark:text-slate-400">Date de début:</span>
                    <span className="font-medium text-slate-900 dark:text-white">
                      {linkConfirmation.existingSearch.startDate ? new Date(linkConfirmation.existingSearch.startDate).toLocaleDateString('fr-FR') : '-'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <span className="text-slate-600 dark:text-slate-400">Date de fin:</span>
                    <span className="font-medium text-slate-900 dark:text-white">
                      {linkConfirmation.existingSearch.endDate ? new Date(linkConfirmation.existingSearch.endDate).toLocaleDateString('fr-FR') : '-'}
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                  <h5 className="font-medium text-slate-900 dark:text-white mb-2">Clients déjà liés à cette recherche :</h5>
                  <ul className="space-y-1">
                    {linkConfirmation.existingSearch.linkedClients.map((client) => (
                      <li key={client.id} className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-2">
                        <User size={14} />
                        {client.name}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  💡 Si vous confirmez, le client sera lié à cette recherche et partagera son historique avec les autres clients.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setLinkConfirmation(null);
                  setShowNewSearchModal(null);
                  setNewSearchData({ generalReference: '', detailedReference: '', startDate: '', endDate: '' });
                }}
                className="px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmLink}
                className="px-4 py-2 bg-orange-600 text-white hover:bg-orange-700 rounded-lg transition-colors"
              >
                Confirmer le lien
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
