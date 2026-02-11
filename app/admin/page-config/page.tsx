'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Settings, Eye, Filter, Download, Search, Table, Columns, RotateCcw, GripVertical } from 'lucide-react';

interface PageConfig {
  pageId: string;
  pageName: string;
  tableHeaders: { key: string; label: string; visible: boolean }[];
  filterableFields: { key: string; label: string; type: string; enabled: boolean }[];
  searchableFields: { key: string; label: string; enabled: boolean }[];
  displayOptions: {
    itemsPerPage: number;
    showPagination: boolean;
    showItemCount: boolean;
  };
  exportOptions: {
    enabled: boolean;
    formats: { format: string; label: string; enabled: boolean }[];
    exportableColumns: { key: string; label: string; selected: boolean }[];
    allowPartialExport: boolean;
  };
}

const AVAILABLE_PAGES = [
  { id: 'clients', name: 'Clients', path: '/clients' },
  { id: 'searches', name: 'Recherches', path: '/searches' },
  { id: 'panda', name: 'Panda (Identifiants)', path: '/panda' },
  { id: 'users', name: 'Utilisateurs', path: '/admin/users' },
  { id: 'logs', name: 'Logs Système', path: '/admin/logs' },
  { id: 'tasks', name: 'Tâches', path: '/tasks' },
  { id: 'todo', name: 'Todo', path: '/todo' },
];

const DEFAULT_EXPORT_FORMATS = [
  { format: 'csv', label: 'CSV', enabled: true },
  { format: 'xlsx', label: 'Excel', enabled: true },
  { format: 'json', label: 'JSON', enabled: false },
  { format: 'pdf', label: 'PDF', enabled: false },
];

export default function PageConfigPage() {
  const [selectedPage, setSelectedPage] = useState<string>('');
  const [config, setConfig] = useState<PageConfig | null>(null);
  const [defaultConfig, setDefaultConfig] = useState<PageConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showSaveDefaultModal, setShowSaveDefaultModal] = useState(false);
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialLoadRef = useRef(true);

  useEffect(() => {
    if (selectedPage) {
      loadPageConfig(selectedPage);
    }
  }, [selectedPage]);

  const loadPageConfig = async (pageId: string) => {
    setLoading(true);
    isInitialLoadRef.current = true;
    try {
      // Charger la config actuelle
      const response = await fetch(`/api/admin/page-config/${pageId}`);
      
      // Charger la config par défaut sauvegardée
      const defaultResponse = await fetch(`/api/admin/page-config/${pageId}_default`);
      let defConfig: PageConfig;
      
      if (defaultResponse.ok) {
        const savedDefault = await defaultResponse.json();
        if (savedDefault) {
          defConfig = savedDefault;
        } else {
          defConfig = createDefaultConfig(pageId);
        }
      } else {
        defConfig = createDefaultConfig(pageId);
      }
      
      setDefaultConfig(defConfig);
      
      if (response.ok) {
        const data = await response.json();
        if (data) {
          setConfig(data);
        } else {
          // Pas de config existante, utiliser la config par défaut
          setConfig(defConfig);
        }
      } else {
        // Utiliser la configuration par défaut
        setConfig(defConfig);
      }
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
      const defConfig = createDefaultConfig(pageId);
      setDefaultConfig(defConfig);
      setConfig(defConfig);
    } finally {
      setLoading(false);
      setTimeout(() => {
        isInitialLoadRef.current = false;
      }, 100);
    }
  };

  const createDefaultConfig = (pageId: string): PageConfig => {
    const page = AVAILABLE_PAGES.find(p => p.id === pageId);
    return {
      pageId,
      pageName: page?.name || pageId,
      tableHeaders: getDefaultHeaders(pageId),
      filterableFields: getDefaultFilters(pageId),
      searchableFields: getDefaultSearchFields(pageId),
      displayOptions: {
        itemsPerPage: 50,
        showPagination: true,
        showItemCount: true,
      },
      exportOptions: {
        enabled: true,
        formats: [...DEFAULT_EXPORT_FORMATS],
        exportableColumns: getDefaultHeaders(pageId).map(h => ({ key: h.key, label: h.label, selected: h.visible })),
        allowPartialExport: true,
      },
    };
  };

  const getDefaultHeaders = (pageId: string) => {
    const headers: Record<string, { key: string; label: string; visible: boolean }[]> = {
      clients: [
        { key: 'client', label: 'Client', visible: true },
        { key: 'contacts', label: 'Contacts', visible: true },
        { key: 'requestor', label: 'Demandeur', visible: true },
        { key: 'priority', label: 'Priorité', visible: true },
        { key: 'date', label: 'Date', visible: true },
        { key: 'actions', label: 'Actions', visible: true },
        { key: 'nickname', label: 'Surnom', visible: false },
        { key: 'fullName', label: 'Nom complet', visible: false },
        { key: 'description', label: 'Description', visible: false },
        { key: 'externalHelp', label: 'Aide externe', visible: false },
        { key: 'searches', label: 'Recherches actives', visible: false },
        { key: 'createdBy', label: 'Créé par', visible: false },
        { key: 'createdAt', label: 'Date de création', visible: false },
        { key: 'updatedAt', label: 'Dernière modification', visible: false },
      ],
      searches: [
        { key: 'generalReference', label: 'Référence générale', visible: true },
        { key: 'detailedReference', label: 'Référence détaillée', visible: true },
        { key: 'clients', label: 'Clients', visible: true },
        { key: 'startDate', label: 'Date de début', visible: true },
        { key: 'endDate', label: 'Date de fin', visible: true },
        { key: 'status', label: 'Statut', visible: true },
        { key: 'duration', label: 'Durée', visible: false },
        { key: 'daysRemaining', label: 'Jours restants', visible: false },
        { key: 'clientCount', label: 'Nombre de clients', visible: false },
        { key: 'createdAt', label: 'Date de création', visible: false },
        { key: 'actions', label: 'Actions', visible: false },
      ],
      panda: [
        { key: 'accountNumber', label: 'Numéro de compte', visible: true },
        { key: 'accountType', label: 'Type', visible: true },
        { key: 'client', label: 'Client', visible: true },
        { key: 'info', label: 'Information', visible: true },
        { key: 'tasks', label: 'Tâches', visible: false },
        { key: 'clientNickname', label: 'Surnom du client', visible: false },
        { key: 'clientFullName', label: 'Nom complet du client', visible: false },
        { key: 'priority', label: 'Priorité', visible: false },
        { key: 'createdAt', label: 'Date de création', visible: false },
        { key: 'actions', label: 'Actions', visible: false },
      ],
    };
    return headers[pageId] || [];
  };

  const getDefaultFilters = (pageId: string) => {
    const filters: Record<string, { key: string; label: string; type: string; enabled: boolean }[]> = {
      clients: [
        { key: 'priority', label: 'Priorité', type: 'select', enabled: true },
        { key: 'externalHelp', label: 'Aide externe', type: 'boolean', enabled: true },
        { key: 'createdAt', label: 'Date de création', type: 'dateRange', enabled: true },
        { key: 'requestor', label: 'Demandeur', type: 'text', enabled: false },
        { key: 'nickname', label: 'Surnom', type: 'text', enabled: false },
        { key: 'fullName', label: 'Nom complet', type: 'text', enabled: false },
        { key: 'updatedAt', label: 'Dernière modification', type: 'dateRange', enabled: false },
        { key: 'createdBy', label: 'Créé par', type: 'select', enabled: false },
        { key: 'hasSearches', label: 'A des recherches', type: 'boolean', enabled: false },
        { key: 'contactType', label: 'Type de contact', type: 'select', enabled: false },
      ],
      searches: [
        { key: 'generalReference', label: 'Référence générale', type: 'select', enabled: true },
        { key: 'status', label: 'Statut', type: 'select', enabled: true },
        { key: 'dateRange', label: 'Période', type: 'dateRange', enabled: true },
        { key: 'clientCount', label: 'Nombre de clients', type: 'number', enabled: false },
        { key: 'daysRemaining', label: 'Jours restants', type: 'number', enabled: false },
        { key: 'isActive', label: 'Recherche active', type: 'boolean', enabled: false },
        { key: 'createdAt', label: 'Date de création', type: 'dateRange', enabled: false },
      ],
    };
    return filters[pageId] || [];
  };

  const getDefaultSearchFields = (pageId: string) => {
    const searchFields: Record<string, { key: string; label: string; enabled: boolean }[]> = {
      clients: [
        { key: 'nickname', label: 'Surnom', enabled: true },
        { key: 'fullName', label: 'Nom complet', enabled: true },
        { key: 'requestor', label: 'Demandeur', enabled: true },
        { key: 'description', label: 'Description', enabled: false },
        { key: 'contactNumber', label: 'Numéro de contact', enabled: false },
        { key: 'createdBy', label: 'Créé par', enabled: false },
      ],
      searches: [
        { key: 'generalReference', label: 'Référence générale', enabled: true },
        { key: 'detailedReference', label: 'Référence détaillée', enabled: true },
        { key: 'clientName', label: 'Nom du client', enabled: true },
        { key: 'clientNickname', label: 'Surnom du client', enabled: false },
      ],
    };
    return searchFields[pageId] || [];
  };

  // Auto-save avec debounce
  useEffect(() => {
    if (!config || isInitialLoadRef.current) return;

    // Annuler le timer précédent
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    // Créer un nouveau timer
    saveTimerRef.current = setTimeout(async () => {
      setSaving(true);
      try {
        const response = await fetch('/api/admin/page-config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(config),
        });

        if (response.ok) {
          setMessage({ type: 'success', text: 'Configuration enregistrée automatiquement' });
          setTimeout(() => setMessage(null), 2000);
        } else {
          throw new Error('Erreur lors de la sauvegarde');
        }
      } catch (error) {
        setMessage({ type: 'error', text: 'Erreur lors de l\'enregistrement' });
        setTimeout(() => setMessage(null), 3000);
      } finally {
        setSaving(false);
      }
    }, 1000); // Debounce de 1 seconde

    // Cleanup
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, [config]);

  const handleResetToDefault = () => {
    if (defaultConfig) {
      setConfig({ ...defaultConfig });
      setShowResetModal(false);
      setMessage({ type: 'success', text: 'Configuration réinitialisée aux valeurs par défaut' });
      setTimeout(() => setMessage(null), 2000);
    }
  };

  const handleSaveAsDefault = async () => {
    if (!config) return;
    
    try {
      const response = await fetch('/api/admin/page-config/default', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      if (response.ok) {
        setDefaultConfig({ ...config });
        setShowSaveDefaultModal(false);
        setMessage({ type: 'success', text: 'Configuration enregistrée comme valeur par défaut' });
        setTimeout(() => setMessage(null), 2000);
      } else {
        const errorData = await response.json();
        console.error('Erreur serveur:', errorData);
        throw new Error(errorData.error || 'Erreur lors de la sauvegarde');
      }
    } catch (error) {
      console.error('Erreur:', error);
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Erreur lors de l\'enregistrement' });
      setTimeout(() => setMessage(null), 3000);
    }
    setShowSaveDefaultModal(false);
  };

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number, type: 'headers' | 'filters' | 'search' | 'export') => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', index.toString());
    e.dataTransfer.setData('dragType', type);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, dropIndex: number, type: 'headers' | 'filters' | 'search' | 'export') => {
    e.preventDefault();
    const dragIndex = parseInt(e.dataTransfer.getData('text/html'));
    const dragType = e.dataTransfer.getData('dragType');
    
    if (dragType !== type || dragIndex === dropIndex || !config) return;

    if (type === 'headers') {
      const newHeaders = [...config.tableHeaders];
      const [removed] = newHeaders.splice(dragIndex, 1);
      newHeaders.splice(dropIndex, 0, removed);
      setConfig({ ...config, tableHeaders: newHeaders });
    } else if (type === 'filters') {
      const newFilters = [...config.filterableFields];
      const [removed] = newFilters.splice(dragIndex, 1);
      newFilters.splice(dropIndex, 0, removed);
      setConfig({ ...config, filterableFields: newFilters });
    } else if (type === 'search') {
      const newSearch = [...config.searchableFields];
      const [removed] = newSearch.splice(dragIndex, 1);
      newSearch.splice(dropIndex, 0, removed);
      setConfig({ ...config, searchableFields: newSearch });
    } else if (type === 'export') {
      const newColumns = [...config.exportOptions.exportableColumns];
      const [removed] = newColumns.splice(dragIndex, 1);
      newColumns.splice(dropIndex, 0, removed);
      setConfig({ ...config, exportOptions: { ...config.exportOptions, exportableColumns: newColumns } });
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          Configuration des Pages
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">
          Personnalisez l'affichage, les filtres et les exports pour chaque page
        </p>
      </div>

      {/* Message */}
      {message && (
        <div className={`fixed top-20 right-4 z-50 p-4 rounded-lg shadow-lg ${
          message.type === 'success' 
            ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800' 
            : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
        }`}>
          {message.text}
        </div>
      )}

      {/* Sélection de la page */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Sélectionner une page à configurer
        </label>
        <select
          value={selectedPage}
          onChange={(e) => setSelectedPage(e.target.value)}
          className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-900 dark:text-white"
        >
          <option value="">-- Choisir une page --</option>
          {AVAILABLE_PAGES.map(page => (
            <option key={page.id} value={page.id}>
              {page.name} ({page.path})
            </option>
          ))}
        </select>
      </div>

      {/* Configuration */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : config && (
        <div className="space-y-6">
          {/* En-têtes de tableau */}
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Columns className="text-blue-600 dark:text-blue-400" />
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                Colonnes du tableau
              </h2>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              Choisissez les colonnes à afficher dans le tableau
            </p>
            <div className="space-y-2">
              {config.tableHeaders.map((header, index) => (
                <div
                  key={header.key}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index, 'headers')}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, index, 'headers')}
                  className="flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-lg cursor-move border border-transparent hover:border-slate-300 dark:hover:border-slate-600"
                >
                  <GripVertical size={16} className="text-slate-400" />
                  <label className="flex items-center gap-3 flex-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={header.visible}
                    onChange={(e) => {
                      const newHeaders = [...config.tableHeaders];
                      newHeaders[index].visible = e.target.checked;
                      setConfig({ ...config, tableHeaders: newHeaders });
                    }}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <span className="text-slate-700 dark:text-slate-300 font-medium">{header.label}</span>
                    <span className="text-slate-500 dark:text-slate-400 text-sm ml-2">({header.key})</span>
                  </div>
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Champs filtrables */}
          {config.filterableFields.length > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Filter className="text-purple-600 dark:text-purple-400" />
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                  Filtres disponibles
                </h2>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                Activez les filtres que les utilisateurs peuvent utiliser
              </p>
              <div className="space-y-2">
                {config.filterableFields.map((field, index) => (
                <div
                  key={field.key}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index, 'filters')}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, index, 'filters')}
                  className="flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-lg cursor-move border border-transparent hover:border-slate-300 dark:hover:border-slate-600"
                >
                  <GripVertical size={16} className="text-slate-400" />
                  <label className="flex items-center gap-3 flex-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={field.enabled}
                      onChange={(e) => {
                        const newFields = [...config.filterableFields];
                        newFields[index].enabled = e.target.checked;
                        setConfig({ ...config, filterableFields: newFields });
                      }}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <span className="text-slate-700 dark:text-slate-300 font-medium">{field.label}</span>
                      <span className="text-slate-500 dark:text-slate-400 text-sm ml-2">
                        ({field.type})
                      </span>
                    </div>
                  </label>
                </div>
                ))}
              </div>
            </div>
          )}

          {/* Champs recherchables */}
          {config.searchableFields.length > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Search className="text-green-600 dark:text-green-400" />
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                  Recherche
                </h2>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                Choisissez les champs dans lesquels la recherche s'effectue
              </p>
              <div className="space-y-2">
                {config.searchableFields.map((field, index) => (
                <div
                  key={field.key}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index, 'search')}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, index, 'search')}
                  className="flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-lg cursor-move border border-transparent hover:border-slate-300 dark:hover:border-slate-600"
                >
                  <GripVertical size={16} className="text-slate-400" />
                  <label className="flex items-center gap-3 flex-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={field.enabled}
                      onChange={(e) => {
                        const newFields = [...config.searchableFields];
                        newFields[index].enabled = e.target.checked;
                        setConfig({ ...config, searchableFields: newFields });
                      }}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-slate-700 dark:text-slate-300 font-medium">{field.label}</span>
                  </label>
                </div>
                ))}
              </div>
            </div>
          )}

          {/* Options d'affichage */}
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Eye className="text-orange-600 dark:text-orange-400" />
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                Options d'affichage
              </h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Nombre d'éléments par page
                </label>
                <input
                  type="number"
                  min="10"
                  max="500"
                  value={config.displayOptions.itemsPerPage}
                  onChange={(e) => setConfig({
                    ...config,
                    displayOptions: { ...config.displayOptions, itemsPerPage: parseInt(e.target.value) }
                  })}
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-900 dark:text-white"
                />
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.displayOptions.showPagination}
                  onChange={(e) => setConfig({
                    ...config,
                    displayOptions: { ...config.displayOptions, showPagination: e.target.checked }
                  })}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-slate-700 dark:text-slate-300">Afficher la pagination</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.displayOptions.showItemCount}
                  onChange={(e) => setConfig({
                    ...config,
                    displayOptions: { ...config.displayOptions, showItemCount: e.target.checked }
                  })}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-slate-700 dark:text-slate-300">Afficher le nombre total d'éléments</span>
              </label>
            </div>
          </div>

          {/* Options d'export */}
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Download className="text-red-600 dark:text-red-400" />
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                Export de données
              </h2>
            </div>
            <div className="space-y-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.exportOptions.enabled}
                  onChange={(e) => setConfig({
                    ...config,
                    exportOptions: { ...config.exportOptions, enabled: e.target.checked }
                  })}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-slate-700 dark:text-slate-300 font-medium">Activer l'export</span>
              </label>

              {config.exportOptions.enabled && (
                <>
                  <div>
                    <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Formats d'export disponibles
                    </h3>
                    <div className="space-y-2">
                      {config.exportOptions.formats.map((format, index) => (
                        <label key={format.format} className="flex items-center gap-3 p-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded cursor-pointer">
                          <input
                            type="checkbox"
                            checked={format.enabled}
                            onChange={(e) => {
                              const newFormats = [...config.exportOptions.formats];
                              newFormats[index].enabled = e.target.checked;
                              setConfig({
                                ...config,
                                exportOptions: { ...config.exportOptions, formats: newFormats }
                              });
                            }}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="text-slate-700 dark:text-slate-300">{format.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.exportOptions.allowPartialExport}
                      onChange={(e) => setConfig({
                        ...config,
                        exportOptions: { ...config.exportOptions, allowPartialExport: e.target.checked }
                      })}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-slate-700 dark:text-slate-300">Permettre l'export partiel (éléments sélectionnés)</span>
                  </label>

                  <div>
                    <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Colonnes exportables
                    </h3>
                    <div className="space-y-2">
                      {config.exportOptions.exportableColumns.map((column, index) => (
                        <div
                          key={column.key}
                          draggable
                          onDragStart={(e) => handleDragStart(e, index, 'export')}
                          onDragOver={handleDragOver}
                          onDrop={(e) => handleDrop(e, index, 'export')}
                          className="flex items-center gap-3 p-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded cursor-move border border-transparent hover:border-slate-300 dark:hover:border-slate-600"
                        >
                          <GripVertical size={16} className="text-slate-400" />
                          <label className="flex items-center gap-3 flex-1 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={column.selected}
                            onChange={(e) => {
                              const newColumns = [...config.exportOptions.exportableColumns];
                              newColumns[index].selected = e.target.checked;
                              setConfig({
                                ...config,
                                exportOptions: { ...config.exportOptions, exportableColumns: newColumns }
                              });
                            }}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="text-slate-700 dark:text-slate-300">{column.label}</span>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              {saving && (
                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span className="text-sm">Enregistrement...</span>
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowSaveDefaultModal(true)}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg transition-colors font-medium"
              >
                <Download size={20} />
                Définir comme défaut
              </button>
              <button
                onClick={() => setShowResetModal(true)}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-3 bg-slate-600 hover:bg-slate-700 disabled:bg-slate-400 text-white rounded-lg transition-colors font-medium"
              >
                <RotateCcw size={20} />
                Réinitialiser
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmation - Réinitialisation */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
              Confirmer la réinitialisation
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              Êtes-vous sûr de vouloir réinitialiser cette page aux valeurs par défaut ? 
              Toutes vos modifications seront perdues.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowResetModal(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-900 dark:text-white rounded-lg transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleResetToDefault}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                Réinitialiser
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmation - Définir comme défaut */}
      {showSaveDefaultModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
              Définir comme configuration par défaut
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              Voulez-vous enregistrer cette configuration comme valeur par défaut pour la page {config?.pageName} ?
              Cette configuration sera utilisée lors de la réinitialisation.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowSaveDefaultModal(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-900 dark:text-white rounded-lg transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleSaveAsDefault}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
