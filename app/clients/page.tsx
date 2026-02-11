'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Eye, Search, Filter, X, Save, Bookmark } from 'lucide-react';
import Link from 'next/link';
import Toast, { ToastType } from '@/components/ui/Toast';
import ExportButton from '@/components/ExportButton';
import { apiClient } from '@/lib/api-client';
import { formatRelativeTime, getPriorityColor } from '@/lib/utils';
import { useToast } from '@/hooks';
import type { ApiResponse } from '@/types';
import { getCountryByDialCode } from '@/lib/countries';
import { CountryFlag } from '@/components/ui/CountryFlag';

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

interface NewClient {
  id: number;
  slug: string | null;
  nickname: string | null;
  surname: string | null;
  firstName: string | null;
  description: string | null;
  requestor: string | null;
  priority: string;
  externalHelp: boolean;
  createdAt: string;
  updatedAt: string;
  contactIdentifiers: ContactIdentifier[];
  searches: Search[];
  user: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface SavedFilter {
  id: number;
  name: string;
  filters: string;
  userId: number;
  createdAt: string;
  updatedAt: string;
}

export default function ClientsPage() {
  const [clients, setClients] = useState<NewClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDeleteClientModal, setShowDeleteClientModal] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<number | null>(null);
  const [filterToDelete, setFilterToDelete] = useState<number | null>(null);
  const [filterName, setFilterName] = useState('');
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);
  const [activeFilterId, setActiveFilterId] = useState<number | null>(null);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const [currentUser, setCurrentUser] = useState<{ role: string } | null>(null);
  const [selectedClients, setSelectedClients] = useState<number[]>([]);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [pageConfig, setPageConfig] = useState<any>(null);
  
  // Filtres
  const [filters, setFilters] = useState({
    priority: '',
    requestor: '',
    externalHelp: '',
    generalReference: '',
    createdFrom: '',
    createdTo: '',
    searchEndFrom: '',
    searchEndTo: '',
  });

  useEffect(() => {
    fetchClients();
    loadSavedFilters();
    loadPageConfig();
    // Charger l'utilisateur actuel depuis localStorage
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        setCurrentUser(JSON.parse(userStr));
      } catch (err) {
        console.error('Error parsing user data:', err);
      }
    }
  }, []);

  const loadPageConfig = async () => {
    try {
      const response = await fetch('/api/admin/page-config/clients');
      if (response.ok) {
        const config = await response.json();
        console.log('Config chargée:', config);
        if (config) {
          setPageConfig(config);
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement de la config:', error);
    }
  };

  const isColumnVisible = (columnKey: string) => {
    if (!pageConfig?.tableHeaders) return true;
    const header = pageConfig.tableHeaders.find((h: any) => h.key === columnKey);
    const visible = header ? header.visible : true;
    console.log(`Column ${columnKey}: visible=${visible}`, header);
    return visible;
  };

  const getVisibleColumns = () => {
    if (!pageConfig?.tableHeaders) {
      return ['client', 'contacts', 'requestor', 'priority', 'date', 'actions'];
    }
    return pageConfig.tableHeaders.filter((h: any) => h.visible).map((h: any) => h.key);
  };

  const renderColumnHeader = (columnKey: string) => {
    const headers: Record<string, string> = {
      client: 'Client',
      contacts: 'Contacts',
      requestor: 'Demandeur',
      priority: 'Priorité',
      date: 'Date',
      nickname: 'Surnom',
      fullName: 'Nom complet',
      description: 'Description',
      externalHelp: 'Aide externe',
      searches: 'Recherches',
      createdBy: 'Créé par',
      createdAt: 'Date de création',
      updatedAt: 'Dernière modif.',
      actions: 'Actions',
    };
    return headers[columnKey] || columnKey;
  };

  const renderColumnCell = (columnKey: string, client: NewClient) => {
    switch (columnKey) {
      case 'client':
        return (
          <td key={columnKey} className="px-6 py-4">
            <p className="font-medium text-gray-900 dark:text-white">
              {client.nickname || '-'}
            </p>
            {(client.surname || client.firstName) && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {client.surname} {client.firstName}
              </p>
            )}
          </td>
        );
      case 'contacts':
        return (
          <td key={columnKey} className="px-6 py-4">
            <div className="flex flex-wrap gap-1">
              {client.contactIdentifiers.slice(0, 3).map((contact, i) => {
                const match = contact.accountNumber.match(/^(\+\d+)\s*(.*)$/);
                const country = match ? getCountryByDialCode(match[1]) : null;
                const isPhone = contact.accountType === 'Téléphone' || contact.accountType === 'WhatsApp' || contact.accountType === 'Telegram' || contact.accountType === 'Signal';
                
                return (
                  <span 
                    key={i}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded"
                  >
                    {country && isPhone && (
                      <CountryFlag 
                        emoji={country.flag}
                        colors={country.flagColors}
                        type={country.flagType}
                        size="sm"
                        className="inline-block"
                      />
                    )}
                    {!country && contact.accountType === 'Téléphone' && '📞'}
                    {contact.accountType === 'WhatsApp' && '💬'}
                    {contact.accountType === 'Telegram' && '✈️'}
                    {contact.accountType === 'Signal' && '🔒'}
                    {contact.accountType === 'Threema' && '🔐'}
                    {' '}{contact.accountNumber}
                  </span>
                );
              })}
              {client.contactIdentifiers.length > 3 && (
                <span className="inline-block px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs rounded">
                  +{client.contactIdentifiers.length - 3}
                </span>
              )}
            </div>
          </td>
        );
      case 'requestor':
        return (
          <td key={columnKey} className="px-6 py-4">
            <span className="text-gray-900 dark:text-white">{client.requestor || '-'}</span>
          </td>
        );
      case 'priority':
        return (
          <td key={columnKey} className="px-6 py-4">
            <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(client.priority)}`}>
              {client.priority}
            </span>
          </td>
        );
      case 'date':
        return (
          <td key={columnKey} className="px-6 py-4 text-gray-600 dark:text-gray-400 text-sm">
            {new Date(client.createdAt).toLocaleDateString('fr-FR')}
          </td>
        );
      case 'nickname':
        return (
          <td key={columnKey} className="px-6 py-4 text-gray-900 dark:text-white">
            {client.nickname || '-'}
          </td>
        );
      case 'fullName':
        return (
          <td key={columnKey} className="px-6 py-4 text-gray-900 dark:text-white">
            {[client.surname, client.firstName].filter(Boolean).join(' ') || '-'}
          </td>
        );
      case 'description':
        return (
          <td key={columnKey} className="px-6 py-4 text-gray-600 dark:text-gray-400 text-sm max-w-xs truncate">
            {client.description || '-'}
          </td>
        );
      case 'externalHelp':
        return (
          <td key={columnKey} className="px-6 py-4 text-center">
            {client.externalHelp ? (
              <span className="text-green-600 dark:text-green-400">✓</span>
            ) : (
              <span className="text-gray-400">-</span>
            )}
          </td>
        );
      case 'searches':
        return (
          <td key={columnKey} className="px-6 py-4 text-gray-900 dark:text-white">
            {client.searches.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {client.searches.map((search, i) => (
                  <span key={i} className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs rounded">
                    {search.generalReference}
                  </span>
                ))}
              </div>
            ) : '-'}
          </td>
        );
      case 'createdBy':
        return (
          <td key={columnKey} className="px-6 py-4 text-gray-600 dark:text-gray-400 text-sm">
            {client.user ? `${client.user.firstName} ${client.user.lastName}` : '-'}
          </td>
        );
      case 'createdAt':
        return (
          <td key={columnKey} className="px-6 py-4 text-gray-600 dark:text-gray-400 text-sm">
            {new Date(client.createdAt).toLocaleString('fr-FR')}
          </td>
        );
      case 'updatedAt':
        return (
          <td key={columnKey} className="px-6 py-4 text-gray-600 dark:text-gray-400 text-sm">
            {new Date(client.updatedAt).toLocaleString('fr-FR')}
          </td>
        );
      case 'actions':
        return (
          <td key={columnKey} className="px-6 py-4">
            <div className="flex gap-2">
              <Link href={`/clients/${client.slug || client.id}`}>
                <button className="p-2 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded">
                  <Eye size={16} />
                </button>
              </Link>
              <Link href={`/clients/${client.slug || client.id}/edit`}>
                <button className="p-2 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 rounded">
                  <Edit2 size={16} />
                </button>
              </Link>
              <button
                onClick={() => deleteClient(client.id)}
                className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </td>
        );
      default:
        return <td key={columnKey} className="px-6 py-4">-</td>;
    }
  };

  const fetchClients = async () => {
    try {
      const response = await apiClient.get<NewClient[]>('/newclients');
      if (response.success && response.data) {
        setClients(Array.isArray(response.data) ? response.data : []);
      } else {
        setClients([]);
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
      setClients([]);
    } finally {
      setLoading(false);
    }
  };

  const loadSavedFilters = async () => {
    try {
      const response = await fetch('/api/saved-filters');
      if (response.ok) {
        const data = await response.json();
        setSavedFilters(data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des filtres:', error);
    }
  };

  const saveFilter = async () => {
    if (!filterName.trim()) {
      setToast({ message: 'Veuillez entrer un nom pour ce filtre', type: 'warning' });
      return;
    }

    try {
      const response = await fetch('/api/saved-filters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: filterName,
          filters: filters
        })
      });

      if (response.ok) {
        const newFilter = await response.json();
        setSavedFilters([...savedFilters, newFilter]);
        setFilterName('');
        setShowSaveModal(false);
        setToast({ message: 'Filtre sauvegardé avec succès', type: 'success' });
      } else {
        const error = await response.json();
        setToast({ message: error.error || 'Erreur lors de la sauvegarde', type: 'error' });
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du filtre:', error);
      setToast({ message: 'Erreur lors de la sauvegarde du filtre', type: 'error' });
    }
  };

  const loadFilter = (savedFilter: SavedFilter) => {
    const parsedFilters = JSON.parse(savedFilter.filters);
    setFilters(parsedFilters);
    setActiveFilterId(savedFilter.id);
  };

  const deleteSavedFilter = (id: number) => {
    setFilterToDelete(id);
    setShowDeleteModal(true);
  };

  const confirmDeleteFilter = async () => {
    if (!filterToDelete) return;

    try {
      const response = await fetch(`/api/saved-filters/${filterToDelete}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        const updated = savedFilters.filter(f => f.id !== filterToDelete);
        setSavedFilters(updated);
        if (activeFilterId === filterToDelete) {
          setActiveFilterId(null);
        }
        setToast({ message: 'Filtre supprimé avec succès', type: 'success' });
      } else {
        const error = await response.json();
        setToast({ message: error.error || 'Erreur lors de la suppression', type: 'error' });
      }
    } catch (error) {
      console.error('Erreur lors de la suppression du filtre:', error);
      setToast({ message: 'Erreur lors de la suppression du filtre', type: 'error' });
    }

    setShowDeleteModal(false);
    setFilterToDelete(null);
  };

  const hasActiveFilters = () => {
    return Object.values(filters).some(v => v !== '');
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setActiveFilterId(null);
  };

  const clearFilters = () => {
    setFilters({
      priority: '',
      requestor: '',
      externalHelp: '',
      generalReference: '',
      createdFrom: '',
      createdTo: '',
      searchEndFrom: '',
      searchEndTo: '',
    });
    setActiveFilterId(null);
  };

  const getUniqueRequestors = () => {
    const requestors = clients
      .map(c => c.requestor)
      .filter((r): r is string => r !== null && r !== '');
    return [...new Set(requestors)].sort();
  };

  const filteredClients = clients.filter((client) => {
    // Recherche texte (surnom et identifiants de contact uniquement)
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = !searchTerm || (
      (client.nickname && client.nickname.toLowerCase().includes(searchLower)) ||
      client.contactIdentifiers.some(c => c.accountNumber.toLowerCase().includes(searchLower))
    );

    // Filtre priorité
    const matchesPriority = !filters.priority || client.priority === filters.priority;

    // Filtre demandeur
    const matchesRequestor = !filters.requestor || client.requestor === filters.requestor;

    // Filtre aide externe
    const matchesExternalHelp = !filters.externalHelp || 
      (filters.externalHelp === 'yes' && client.externalHelp) ||
      (filters.externalHelp === 'no' && !client.externalHelp);

    // Filtre référence générale
    const matchesReference = !filters.generalReference || 
      client.searches[0]?.generalReference === filters.generalReference;

    // Filtre date de création
    const clientDate = new Date(client.createdAt);
    const matchesCreatedFrom = !filters.createdFrom || 
      clientDate >= new Date(filters.createdFrom);
    const matchesCreatedTo = !filters.createdTo || 
      clientDate <= new Date(filters.createdTo + 'T23:59:59');

    // Filtre date de fin de recherche
    const searchEndDate = client.searches[0]?.endDate ? new Date(client.searches[0].endDate) : null;
    const matchesSearchEndFrom = !filters.searchEndFrom || 
      (searchEndDate && searchEndDate >= new Date(filters.searchEndFrom));
    const matchesSearchEndTo = !filters.searchEndTo || 
      (searchEndDate && searchEndDate <= new Date(filters.searchEndTo + 'T23:59:59'));

    return matchesSearch && matchesPriority && matchesRequestor && matchesExternalHelp && 
           matchesReference && matchesCreatedFrom && matchesCreatedTo && 
           matchesSearchEndFrom && matchesSearchEndTo;
  });

  const deleteClient = (id: number) => {
    setClientToDelete(id);
    setShowDeleteClientModal(true);
  };

  const confirmDeleteClient = async (permanent: boolean = false) => {
    if (!clientToDelete) return;
    try {
      const endpoint = `/newclients/${clientToDelete}${permanent ? '?permanent=true' : ''}`;
      
      const response = await apiClient.delete(endpoint);
      if (response.success) {
        setClients(clients.filter((c) => c.id !== clientToDelete));
        setShowDeleteClientModal(false);
        setClientToDelete(null);
        setToast({ message: 'Client supprimé avec succès', type: 'success' });
      } else {
        setToast({ message: response.error || 'Erreur lors de la suppression', type: 'error' });
      }
    } catch (error) {
      setToast({ message: 'Erreur lors de la suppression', type: 'error' });
    }
  };

  const toggleSelectClient = (clientId: number) => {
    setSelectedClients(prev => 
      prev.includes(clientId) 
        ? prev.filter(id => id !== clientId)
        : [...prev, clientId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedClients.length === filteredClients.length) {
      setSelectedClients([]);
    } else {
      setSelectedClients(filteredClients.map(c => c.id));
    }
  };

  const confirmBulkDelete = async (permanent: boolean = false) => {
    if (selectedClients.length === 0) return;
    
    try {
      const endpoint = permanent ? '?permanent=true' : '';
      const deletePromises = selectedClients.map(id => 
        apiClient.delete(`/newclients/${id}${endpoint}`)
      );
      
      const results = await Promise.all(deletePromises);
      const successCount = results.filter(r => r.success).length;
      
      if (successCount > 0) {
        setClients(clients.filter(c => !selectedClients.includes(c.id)));
        setSelectedClients([]);
        setShowBulkDeleteModal(false);
        setToast({ 
          message: `${successCount} client(s) supprimé(s) avec succès`, 
          type: 'success' 
        });
      } else {
        setToast({ message: 'Erreur lors de la suppression', type: 'error' });
      }
    } catch (error) {
      setToast({ message: 'Erreur lors de la suppression', type: 'error' });
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Clients</h2>
          <p className="text-gray-600 text-sm">Gérez tous vos clients</p>
        </div>
        <div className="flex gap-3">
          {selectedClients.length > 0 && (
            <button
              onClick={() => setShowBulkDeleteModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors"
            >
              <Trash2 size={18} />
              Supprimer ({selectedClients.length})
            </button>
          )}
          <ExportButton 
            data={filteredClients} 
            filename="clients" 
            title="Liste des Clients"
            excludeFields={['user']}
          />
          <Link href="/clients/new">
            <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
              <Plus size={18} />
              Nouveau Client
            </button>
          </Link>
        </div>
      </div>

      {/* Search Bar and Filters */}
      <div className="bg-white dark:bg-[#0f172a] rounded-lg shadow p-4 mb-6">
        {/* Filtres sauvegardés */}
        {savedFilters.length > 0 && (
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center mr-2">
              <Bookmark size={16} className="mr-1" />
              Filtres sauvegardés:
            </span>
            {savedFilters.map(savedFilter => (
              <div key={savedFilter.id} className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm transition-colors ${
                activeFilterId === savedFilter.id 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
              }`}>
                <button
                  onClick={() => loadFilter(savedFilter)}
                  className="hover:underline"
                >
                  {savedFilter.name}
                </button>
                <button
                  onClick={() => deleteSavedFilter(savedFilter.id)}
                  className={`ml-1 rounded-full p-0.5 ${
                    activeFilterId === savedFilter.id
                      ? 'hover:bg-purple-700'
                      : 'hover:bg-purple-200 dark:hover:bg-purple-800'
                  }`}
                >
                  <X size={14} />
                </button>
              </div>
            ))}
            {activeFilterId && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                <X size={14} />
                Réinitialiser
              </button>
            )}
          </div>
        )}

        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Rechercher par surnom ou identifiant de contact..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-[#1b2436] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-transparent dark:text-white"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
              showFilters 
                ? 'bg-blue-600 text-white border-blue-600' 
                : 'bg-white dark:bg-[#0f172a] text-gray-700 dark:text-gray-300 border-gray-300 dark:border-[#1b2436] hover:bg-gray-50 dark:hover:bg-[#1b2436]'
            }`}
          >
            <Filter size={18} />
            Filtres
          </button>
        </div>

        {/* Filtres avancés */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t dark:border-[#1b2436] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Priorité
              </label>
              <select
                value={filters.priority}
                onChange={(e) => handleFilterChange('priority', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-[#1b2436] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-transparent dark:text-white text-sm"
              >
                <option value="">Toutes</option>
                <option value="Faible">Faible</option>
                <option value="Moyenne">Moyenne</option>
                <option value="Haute">Haute</option>
                <option value="Immédiate">Immédiate</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Demandeur
              </label>
              <select
                value={filters.requestor}
                onChange={(e) => handleFilterChange('requestor', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-[#1b2436] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-transparent dark:text-white text-sm"
              >
                <option value="">Tous</option>
                {getUniqueRequestors().map(req => (
                  <option key={req} value={req}>{req}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Référence
              </label>
              <select
                value={filters.generalReference}
                onChange={(e) => handleFilterChange('generalReference', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-[#1b2436] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-transparent dark:text-white text-sm"
              >
                <option value="">Toutes</option>
                <option value="Article">Article</option>
                <option value="BD">BD</option>
                <option value="Film">Film</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Aide externe
              </label>
              <select
                value={filters.externalHelp}
                onChange={(e) => handleFilterChange('externalHelp', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-[#1b2436] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-transparent dark:text-white text-sm"
              >
                <option value="">Tous</option>
                <option value="yes">Oui</option>
                <option value="no">Non</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Créé du
              </label>
              <input
                type="date"
                value={filters.createdFrom}
                max={filters.createdTo || undefined}
                onChange={(e) => handleFilterChange('createdFrom', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-[#1b2436] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-transparent dark:text-white text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Créé au
              </label>
              <input
                type="date"
                value={filters.createdTo}
                min={filters.createdFrom || undefined}
                onChange={(e) => handleFilterChange('createdTo', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-[#1b2436] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-transparent dark:text-white text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Fin recherche du
              </label>
              <input
                type="date"
                value={filters.searchEndFrom}
                max={filters.searchEndTo || undefined}
                onChange={(e) => handleFilterChange('searchEndFrom', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-[#1b2436] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-transparent dark:text-white text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Fin recherche au
              </label>
              <input
                type="date"
                value={filters.searchEndTo}
                min={filters.searchEndFrom || undefined}
                onChange={(e) => handleFilterChange('searchEndTo', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-[#1b2436] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-transparent dark:text-white text-sm"
              />
            </div>

            <div className="md:col-span-2 lg:col-span-4 flex justify-end gap-3">
              {hasActiveFilters() && (
                <button
                  onClick={() => setShowSaveModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white hover:bg-purple-700 rounded-lg transition-colors"
                >
                  <Save size={18} />
                  Sauvegarder ce filtre
                </button>
              )}
              <button
                onClick={clearFilters}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1b2436] rounded-lg transition-colors"
              >
                <X size={18} />
                Réinitialiser les filtres
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-[#0f172a] rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-600 dark:text-gray-400">Chargement...</div>
        ) : filteredClients.length === 0 ? (
          <div className="p-8 text-center text-gray-600 dark:text-gray-400">Aucun client trouvé</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-[#121a2d] border-b dark:border-[#1b2436]">
              <tr>
                <th className="px-4 py-3 text-center">
                  <input
                    type="checkbox"
                    checked={filteredClients.length > 0 && selectedClients.length === filteredClients.length}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 cursor-pointer"
                  />
                </th>
                {getVisibleColumns().map((columnKey: string) => (
                  <th 
                    key={columnKey} 
                    className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase"
                  >
                    {renderColumnHeader(columnKey)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-[#1b2436]">
              {filteredClients.map((client) => (
                <tr key={client.id} className="hover:bg-gray-50 dark:hover:bg-[#121a2d]">
                  <td className="px-4 py-4 text-center">
                    <input
                      type="checkbox"
                      checked={selectedClients.includes(client.id)}
                      onChange={() => toggleSelectClient(client.id)}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 cursor-pointer"
                    />
                  </td>
                  {getVisibleColumns().map((columnKey: string) =>
                    renderColumnCell(columnKey, client)
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Stats Footer */}
      <div className="mt-6 flex justify-between items-center text-sm text-gray-600">
        <p>Total: {filteredClients.length} clients</p>
      </div>

      {/* Modal Sauvegarde Filtre */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-[#0f172a] rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Sauvegarder le filtre
            </h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nom du filtre
              </label>
              <input
                type="text"
                value={filterName}
                onChange={(e) => setFilterName(e.target.value)}
                placeholder="Ex: Priorité haute en janvier"
                className="w-full px-3 py-2 border border-gray-300 dark:border-[#1b2436] rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-transparent dark:text-white"
                onKeyPress={(e) => e.key === 'Enter' && saveFilter()}
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowSaveModal(false);
                  setFilterName('');
                }}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1b2436] rounded-lg transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={saveFilter}
                className="px-4 py-2 bg-purple-600 text-white hover:bg-purple-700 rounded-lg transition-colors"
              >
                Sauvegarder
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmation Suppression */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-[#0f172a] rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Confirmer la suppression
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Êtes-vous sûr de vouloir supprimer ce filtre sauvegardé ? Cette action est irréversible.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setFilterToDelete(null);
                }}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1b2436] rounded-lg transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={confirmDeleteFilter}
                className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmation Suppression Client */}
      {showDeleteClientModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-[#0f172a] rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Confirmer la suppression
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {currentUser?.role === 'ADMIN' 
                ? 'Souhaitez-vous supprimer temporairement ou définitivement ce client ?'
                : 'Êtes-vous sûr de vouloir supprimer ce client ?'}
            </p>
            {currentUser?.role === 'ADMIN' && (
              <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  <strong>Suppression temporaire :</strong> Le client sera masqué mais pourra être restauré.<br/>
                  <strong>Suppression définitive :</strong> Le client sera définitivement supprimé de la base de données.
                </p>
              </div>
            )}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeleteClientModal(false);
                  setClientToDelete(null);
                }}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1b2436] rounded-lg transition-colors"
              >
                Annuler
              </button>
              {currentUser?.role === 'ADMIN' ? (
                <>
                  <button
                    onClick={() => confirmDeleteClient(false)}
                    className="px-4 py-2 bg-orange-600 text-white hover:bg-orange-700 rounded-lg transition-colors"
                  >
                    Supprimer temporairement
                  </button>
                  <button
                    onClick={() => confirmDeleteClient(true)}
                    className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors"
                  >
                    Supprimer définitivement
                  </button>
                </>
              ) : (
                <button
                  onClick={() => confirmDeleteClient(false)}
                  className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors"
                >
                  Supprimer
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Confirmation Suppression Multiple */}
      {showBulkDeleteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-[#0f172a] rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Supprimer {selectedClients.length} client(s)
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {currentUser?.role === 'ADMIN'
                ? `Souhaitez-vous supprimer temporairement ou définitivement ces ${selectedClients.length} clients ?`
                : `Êtes-vous sûr de vouloir supprimer ces ${selectedClients.length} clients ? Cette action est irréversible.`}
            </p>
            {currentUser?.role === 'ADMIN' && (
              <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  <strong>Suppression temporaire :</strong> Les clients seront masqués mais pourront être restaurés.<br/>
                  <strong>Suppression définitive :</strong> Les clients seront définitivement supprimés de la base de données.
                </p>
              </div>
            )}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowBulkDeleteModal(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1b2436] rounded-lg transition-colors"
              >
                Annuler
              </button>
              {currentUser?.role === 'ADMIN' ? (
                <>
                  <button
                    onClick={() => confirmBulkDelete(false)}
                    className="px-4 py-2 bg-orange-600 text-white hover:bg-orange-700 rounded-lg transition-colors"
                  >
                    Supprimer temporairement
                  </button>
                  <button
                    onClick={() => confirmBulkDelete(true)}
                    className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors"
                  >
                    Supprimer définitivement
                  </button>
                </>
              ) : (
                <button
                  onClick={() => confirmBulkDelete(false)}
                  className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors"
                >
                  Supprimer
                </button>
              )}
            </div>
          </div>
        </div>
      )}

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
