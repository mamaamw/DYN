'use client';

import { useEffect, useState } from 'react';
import { CheckSquare, Phone, LayoutGrid, Check, ChevronDown, ChevronUp, ArrowUpDown, Eye, EyeOff } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { 
  FaWhatsapp, 
  FaTelegram, 
  FaSkype,
} from 'react-icons/fa';
import { SiSignal } from 'react-icons/si';
import { apiClient } from '@/lib/api-client';
import type { ApiResponse } from '@/types';

interface TaskSchedule {
  contactId: number;
  taskName: string;
  actions: string[];
  tools: string[];
}

interface ContactIdentifierData {
  id: number;
  accountNumber: string;
  accountType: string;
  createdAt: string;
  tasks: string | null;
  position?: number; // Position permanente stockée
  newClient: {
    id: number;
    firstName: string | null;
    surname: string | null;
    nickname: string | null;
    requestor: string | null;
    priority: string;
    createdAt: string;
    searches: Array<{
      generalReference: string | null;
      detailedReference: string | null;
      startDate: string | null;
      endDate: string | null;
    }>;
  };
}

const AVAILABLE_TASKS = [
  'Vérification identité',
  'Collecte données',
  'Analyse réseau',
  'Rapport préliminaire',
  'Rapport final',
  'Suivi client',
  'Archivage',
];

type SortField = 'customId' | 'accountNumber' | 'accountType' | 'client' | 'requestor' | 'priority' | 'generalRef' | 'detailedRef' | 'startDate' | 'endDate';

export default function TasksPage() {
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [contacts, setContacts] = useState<ContactIdentifierData[]>([]);
  const [allContacts, setAllContacts] = useState<ContactIdentifierData[]>([]);
  const [validatedRows, setValidatedRows] = useState<Set<string>>(new Set());
  const [taskActions, setTaskActions] = useState<Map<string, string[]>>(new Map());
  const [taskTools, setTaskTools] = useState<Map<string, string[]>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sortField, setSortField] = useState<SortField | null>('priority');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | null>('asc');
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
  const [showValidatedRows, setShowValidatedRows] = useState(false);

  useEffect(() => {
    const savedValidated = localStorage.getItem('tasks_validated_rows');
    if (savedValidated) {
      try {
        const parsed = JSON.parse(savedValidated);
        setValidatedRows(new Set(parsed));
      } catch (e) {
        console.error('Erreur lecture validated rows:', e);
      }
    }
    
    const savedActions = localStorage.getItem('task_actions');
    if (savedActions) {
      try {
        const parsed = JSON.parse(savedActions);
        setTaskActions(new Map(Object.entries(parsed)));
      } catch (e) {
        console.error('Erreur lecture actions:', e);
      }
    }
    
    const savedTools = localStorage.getItem('task_tools');
    if (savedTools) {
      try {
        const parsed = JSON.parse(savedTools);
        setTaskTools(new Map(Object.entries(parsed)));
      } catch (e) {
        console.error('Erreur lecture tools:', e);
      }
    }
    
    // Charger les contacts validés dans panda
    fetchAllContacts();
  }, []);

  const fetchAllContacts = async () => {
    try {
      const response = await apiClient.get<{ success: boolean; contacts: ContactIdentifierData[] }>('/panda');
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Erreur de chargement');
      }
      
      // Charger les contacts validés dans panda (pas dans tasks)
      const savedPandaValidated = localStorage.getItem('panda_validated_rows');
      if (savedPandaValidated) {
        const pandaValidatedIds = new Set(JSON.parse(savedPandaValidated));
        const validated = (response.data.contacts || []).filter((contact: ContactIdentifierData) => 
          pandaValidatedIds.has(contact.id)
        );
        setAllContacts(validated);
      } else {
        setAllContacts([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
    }
  };

  useEffect(() => {
    if (selectedTask) {
      filterContactsByTask(selectedTask);
    }
  }, [selectedTask, allContacts]);

  const filterContactsByTask = (taskName: string) => {
    setLoading(true);
    const filteredContacts = allContacts.filter((contact) => {
      const tasks = contact.tasks ? JSON.parse(contact.tasks) : [];
      return tasks.includes(taskName);
    });
    setContacts(filteredContacts);
    setLoading(false);
  };

  const getTaskColor = (task: string, index: number) => {
    const isSelected = selectedTask === task;
    const colors = [
      isSelected ? 'bg-blue-600 text-white' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50',
      isSelected ? 'bg-green-600 text-white' : 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50',
      isSelected ? 'bg-purple-600 text-white' : 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400 hover:bg-purple-200 dark:hover:bg-purple-900/50',
      isSelected ? 'bg-orange-600 text-white' : 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-400 hover:bg-orange-200 dark:hover:bg-orange-900/50',
      isSelected ? 'bg-pink-600 text-white' : 'bg-pink-100 dark:bg-pink-900/30 text-pink-800 dark:text-pink-400 hover:bg-pink-200 dark:hover:bg-pink-900/50',
      isSelected ? 'bg-cyan-600 text-white' : 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-800 dark:text-cyan-400 hover:bg-cyan-200 dark:hover:bg-cyan-900/50',
      isSelected ? 'bg-yellow-600 text-white' : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 hover:bg-yellow-200 dark:hover:bg-yellow-900/50',
    ];
    return colors[index % colors.length];
  };

  const generateCustomId = (contact: ContactIdentifierData, allContacts: ContactIdentifierData[]) => {
    const clientCreationYear = new Date(contact.newClient.createdAt).getFullYear();
    const lastTwoDigits = clientCreationYear.toString().slice(-2);
    
    // Utiliser la position stockée dans la base de données au lieu de la calculer
    const contactPosition = contact.position || 1;
    
    return `${lastTwoDigits}-${contact.newClient.id}-${contactPosition}`;
  };

  const handleActionToggle = (contactId: number, taskName: string, action: string) => {
    const key = `${contactId}-${taskName}`;
    const newActions = new Map(taskActions);
    const currentActions = newActions.get(key) || [];
    
    if (currentActions.includes(action)) {
      // Retirer l'action
      const updated = currentActions.filter(a => a !== action);
      if (updated.length === 0) {
        newActions.delete(key);
      } else {
        newActions.set(key, updated);
      }
    } else {
      // Ajouter l'action
      newActions.set(key, [...currentActions, action]);
    }
    
    setTaskActions(newActions);
    const actionsObj: any = {};
    newActions.forEach((value, k) => {
      actionsObj[k] = value;
    });
    localStorage.setItem('task_actions', JSON.stringify(actionsObj));
  };

  const handleToolToggle = (contactId: number, taskName: string, tool: string) => {
    const key = `${contactId}-${taskName}`;
    const newTools = new Map(taskTools);
    const currentTools = newTools.get(key) || [];
    
    if (currentTools.includes(tool)) {
      // Retirer l'outil
      const updated = currentTools.filter(t => t !== tool);
      if (updated.length === 0) {
        newTools.delete(key);
      } else {
        newTools.set(key, updated);
      }
    } else {
      // Ajouter l'outil
      newTools.set(key, [...currentTools, tool]);
    }
    
    setTaskTools(newTools);
    const toolsObj: any = {};
    newTools.forEach((value, k) => {
      toolsObj[k] = value;
    });
    localStorage.setItem('task_tools', JSON.stringify(toolsObj));
  };

  const getScheduleKey = (contactId: number, taskName: string) => {
    return `${contactId}-${taskName}`;
  };

  const validateRow = async (contactId: number) => {
    if (!selectedTask) return;
    
    const key = `${contactId}-${selectedTask}`;
    const newValidated = new Set(validatedRows);
    const isValidating = !newValidated.has(key);
    
    if (newValidated.has(key)) {
      newValidated.delete(key);
    } else {
      newValidated.add(key);
    }
    setValidatedRows(newValidated);
    
    // Sauvegarder dans localStorage
    localStorage.setItem('tasks_validated_rows', JSON.stringify(Array.from(newValidated)));
    
    // Si on valide (pas dévalide), créer les TODOs
    if (isValidating) {
      const contact = allContacts.find(c => c.id === contactId);
      if (!contact) return;
      
      const search = contact.newClient.searches[0];
      const clientName = getClientName(contact.newClient);
      const customId = generateCustomId(contact, allContacts);
      
      // Récupérer les outils et actions sélectionnés pour cette tâche
      const toolsToCreate = [];
      for (let i = 1; i <= 3; i++) {
        const toolKey = `${contactId}-${selectedTask}-Outil ${i}`;
        const actions = taskActions.get(toolKey) || [];
        
        if (actions.length > 0) {
          actions.forEach(action => {
            toolsToCreate.push({
              tool: `Outil ${i}`,
              actionType: action
            });
          });
        }
      }
      
      // Si aucun outil/action sélectionné, créer un TODO par défaut
      if (toolsToCreate.length === 0) {
        toolsToCreate.push({
          tool: null,
          actionType: null
        });
      }
      
      // Créer un TODO pour chaque combinaison outil/action
      for (const { tool, actionType } of toolsToCreate) {
        try {
          await apiClient.post('/todos', {
            contactId: contact.id,
            customId: customId,
            taskName: selectedTask,
            demandeur: contact.newClient.requestor,
            generalReference: search?.generalReference,
            detailedReference: search?.detailedReference,
            searchStartDate: search?.startDate,
            searchEndDate: search?.endDate,
            codename: clientName,
            accountType: contact.accountType,
            accountNumber: contact.accountNumber,
            tool: tool,
            actionType: actionType,
            status: 'todo'
          });
        } catch (error) {
          console.error('Erreur création TODO:', error);
        }
      }
    }
  };

  const handleColumnFilter = (field: string, value: string) => {
    setColumnFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const applyFilters = (contactsList: ContactIdentifierData[]) => {
    return contactsList.filter(contact => {
      const search = contact.newClient.searches[0];
      
      // Filtre des lignes validées
      const validationKey = selectedTask ? `${contact.id}-${selectedTask}` : `${contact.id}-overview`;
      const matchesValidation = showValidatedRows || !validatedRows.has(validationKey);
      if (!matchesValidation) return false;
      
      for (const [field, value] of Object.entries(columnFilters)) {
        if (!value) continue;
        
        const lowerValue = value.toLowerCase();
        
        switch (field) {
          case 'customId':
            if (!generateCustomId(contact, allContacts).toLowerCase().includes(lowerValue)) return false;
            break;
          case 'priority':
            if (!contact.newClient.priority.toLowerCase().includes(lowerValue)) return false;
            break;
          case 'requestor':
            if (!(contact.newClient.requestor || '').toLowerCase().includes(lowerValue)) return false;
            break;
          case 'generalRef':
            if (!(search?.generalReference || '').toLowerCase().includes(lowerValue)) return false;
            break;
          case 'detailedRef':
            if (!(search?.detailedReference || '').toLowerCase().includes(lowerValue)) return false;
            break;
          case 'startDate':
            if (!(search?.startDate || '').toLowerCase().includes(lowerValue)) return false;
            break;
          case 'endDate':
            if (!(search?.endDate || '').toLowerCase().includes(lowerValue)) return false;
            break;
          case 'client':
            if (!getClientName(contact.newClient).toLowerCase().includes(lowerValue)) return false;
            break;
          case 'accountType':
            if (!contact.accountType.toLowerCase().includes(lowerValue)) return false;
            break;
          case 'accountNumber':
            if (!contact.accountNumber.toLowerCase().includes(lowerValue)) return false;
            break;
        }
      }
      return true;
    });
  };

  const sortContacts = (contactsList: ContactIdentifierData[]) => {
    if (!sortField || !sortOrder) return contactsList;

    return [...contactsList].sort((a, b) => {
      let aValue: any;
      let bValue: any;
      
      const searchA = a.newClient.searches[0];
      const searchB = b.newClient.searches[0];

      switch (sortField) {
        case 'customId':
          aValue = generateCustomId(a, allContacts);
          bValue = generateCustomId(b, allContacts);
          break;
        case 'priority':
          // Ordre de priorité : Immédiate, Haute, Moyenne, Faible
          const priorityOrder: Record<string, number> = {
            'Immédiate': 1,
            'Haute': 2,
            'Moyenne': 3,
            'Faible': 4
          };
          aValue = priorityOrder[a.newClient.priority] || 999;
          bValue = priorityOrder[b.newClient.priority] || 999;
          break;
        case 'requestor':
          aValue = a.newClient.requestor || '';
          bValue = b.newClient.requestor || '';
          break;
        case 'generalRef':
          aValue = searchA?.generalReference || '';
          bValue = searchB?.generalReference || '';
          break;
        case 'detailedRef':
          aValue = searchA?.detailedReference || '';
          bValue = searchB?.detailedReference || '';
          break;
        case 'startDate':
          aValue = searchA?.startDate || '';
          bValue = searchB?.startDate || '';
          break;
        case 'endDate':
          aValue = searchA?.endDate || '';
          bValue = searchB?.endDate || '';
          break;
        case 'client':
          aValue = getClientName(a.newClient);
          bValue = getClientName(b.newClient);
          break;
        case 'accountType':
          aValue = a.accountType;
          bValue = b.accountType;
          break;
        case 'accountNumber':
          aValue = a.accountNumber;
          bValue = b.accountNumber;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const SortableHeader = ({ field, label }: { field: SortField; label: string }) => {
    const [showMenu, setShowMenu] = useState(false);
    const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);
    
    const handleMenuToggle = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (showMenu) {
        setShowMenu(false);
        setMenuPosition(null);
      } else {
        const rect = e.currentTarget.getBoundingClientRect();
        setMenuPosition({
          top: rect.bottom + window.scrollY,
          left: rect.left + window.scrollX
        });
        setShowMenu(true);
      }
    };
    
    return (
      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
        <div className="flex items-center gap-2">
          <span>{label}</span>
          <div className="relative">
            <button
              onClick={handleMenuToggle}
              className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition"
            >
              {sortField === field ? (
                sortOrder === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
              ) : (
                <ArrowUpDown size={14} />
              )}
            </button>
            
            {showMenu && menuPosition && (
              <div 
                className="fixed bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl z-[100] min-w-[200px]"
                style={{
                  top: `${menuPosition.top}px`,
                  left: `${menuPosition.left}px`
                }}
              >
                <div className="py-1">
                  <button
                    onClick={() => {
                      setSortField(field);
                      setSortOrder('asc');
                      setShowMenu(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
                  >
                    <ChevronUp size={14} />
                    Tri croissant
                  </button>
                  <button
                    onClick={() => {
                      setSortField(field);
                      setSortOrder('desc');
                      setShowMenu(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
                  >
                    <ChevronDown size={14} />
                    Tri décroissant
                  </button>
                  <button
                    onClick={() => {
                      setSortField(null);
                      setSortOrder(null);
                      setShowMenu(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-700"
                  >
                    Réinitialiser
                  </button>
                  <div className="border-t border-slate-200 dark:border-slate-700 my-1"></div>
                  <div className="px-4 py-2">
                    <input
                      type="text"
                      placeholder="Filtrer..."
                      value={columnFilters[field] || ''}
                      onChange={(e) => handleColumnFilter(field, e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-full px-2 py-1 text-sm border border-slate-300 dark:border-slate-600 rounded focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </th>
    );
  };

  const getClientName = (client: ContactIdentifierData['newClient']) => {
    if (client.nickname) return client.nickname;
    if (client.firstName && client.surname) return `${client.firstName} ${client.surname}`;
    if (client.firstName) return client.firstName;
    if (client.surname) return client.surname;
    return 'Sans nom';
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Immédiate':
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400';
      case 'Haute':
        return 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-400';
      case 'Moyenne':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400';
      case 'Faible':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400';
      default:
        return 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-400';
    }
  };

  const getAccountTypeIcon = (type: string) => {
    const lowerType = type.toLowerCase();
    
    if (lowerType.includes('whatsapp')) {
      return <FaWhatsapp size={14} className="text-white" />;
    } else if (lowerType.includes('telegram')) {
      return <FaTelegram size={14} className="text-white" />;
    } else if (lowerType.includes('signal')) {
      return <SiSignal size={14} className="text-white" />;
    } else if (lowerType.includes('skype')) {
      return <FaSkype size={14} className="text-white" />;
    } else {
      return <Phone size={14} className="text-green-600 dark:text-green-400" />;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Liste des Tâches</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Sélectionnez une tâche pour voir les contacts associés
          </p>
        </div>
      </div>

      {/* Boutons de tâches */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedTask(null)}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-2 ${
            selectedTask === null
              ? 'bg-slate-600 text-white'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          <LayoutGrid size={16} />
          Vue d'ensemble
          <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-semibold ${
            selectedTask === null
              ? 'bg-white/20'
              : 'bg-slate-300 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
          }`}>
            {allContacts.filter(c => !validatedRows.has(`${c.id}-overview`)).length}
          </span>
        </button>
        {AVAILABLE_TASKS.map((task, index) => {
          const taskContacts = allContacts.filter((contact) => {
            const tasks = contact.tasks ? JSON.parse(contact.tasks) : [];
            return tasks.includes(task);
          });
          const nonValidatedCount = taskContacts.filter(c => !validatedRows.has(`${c.id}-${task}`)).length;
          
          return (
            <button
              key={task}
              onClick={() => setSelectedTask(task)}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-2 ${getTaskColor(task, index)}`}
            >
              <CheckSquare size={16} />
              {task}
              {nonValidatedCount > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-white/90 dark:bg-black/30 rounded-full text-xs font-semibold text-slate-900 dark:text-white">
                  {nonValidatedCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tableau des contacts */}
      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            {selectedTask || 'Vue d\'ensemble'}
          </h2>
          <span className="text-sm text-slate-600 dark:text-slate-400">
            {selectedTask ? contacts.length : allContacts.length} contact{(selectedTask ? contacts.length : allContacts.length) > 1 ? 's' : ''}
          </span>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <SortableHeader field="customId" label="ID" />
                  <SortableHeader field="priority" label="Priorité" />
                  <SortableHeader field="requestor" label="Demandeur" />
                  <SortableHeader field="generalRef" label="Réf. Générale" />
                  <SortableHeader field="detailedRef" label="Réf. Détaillée" />
                  <SortableHeader field="startDate" label="Date Début" />
                  <SortableHeader field="endDate" label="Date Fin" />
                  <SortableHeader field="client" label="Client" />
                  <SortableHeader field="accountType" label="Type" />
                  <SortableHeader field="accountNumber" label="Account Number" />
                  {selectedTask && (
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Outils / Actions</th>
                  )}
                  {selectedTask && (
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      <div className="flex items-center justify-between gap-2">
                        <span>Action</span>
                        <button
                          onClick={() => setShowValidatedRows(!showValidatedRows)}
                          className={`p-1.5 rounded transition-colors ${
                            showValidatedRows
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                              : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                          }`}
                          title={showValidatedRows ? 'Cacher les validées' : 'Afficher les validées'}
                        >
                          {showValidatedRows ? <Eye size={16} /> : <EyeOff size={16} />}
                        </button>
                      </div>
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-700">
                {(() => {
                  const baseContacts = selectedTask ? contacts : allContacts;
                  const filteredContacts = applyFilters(baseContacts);
                  const sortedContacts = sortContacts(filteredContacts);
                  
                  if (sortedContacts.length === 0) {
                    return (
                      <tr>
                        <td colSpan={selectedTask ? 12 : 10} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                          {selectedTask ? 'Aucun contact trouvé pour cette tâche' : 'Aucun contact'}
                        </td>
                      </tr>
                    );
                  }
                  
                  return sortedContacts.map((contact) => {
                      const search = contact.newClient.searches[0];
                      const validationKey = selectedTask ? `${contact.id}-${selectedTask}` : `${contact.id}-overview`;
                      
                      return (
                        <tr key={contact.id} className={`hover:bg-slate-50 dark:hover:bg-slate-800 transition ${validatedRows.has(validationKey) ? 'bg-green-50 dark:bg-green-900/20' : ''}`}>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className="text-sm font-mono font-semibold text-blue-600 dark:text-blue-400">
                              {generateCustomId(contact, allContacts)}
                            </span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(contact.newClient.priority)}`}>
                              {contact.newClient.priority}
                            </span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-300">
                            {contact.newClient.requestor || '-'}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-300">
                            {search?.generalReference || '-'}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-300">
                            {search?.detailedReference || '-'}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-300">
                            {formatDate(search?.startDate || null)}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-300">
                            {formatDate(search?.endDate || null)}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-white">
                            {getClientName(contact.newClient)}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className="flex items-center gap-2 text-sm text-slate-900 dark:text-slate-300">
                              {getAccountTypeIcon(contact.accountType)}
                              {contact.accountType}
                            </span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-300">
                            {contact.accountNumber}
                          </td>
                          {selectedTask && (
                            <td className="px-4 py-4">
                              <div className="space-y-3">
                                {['Outil 1', 'Outil 2', 'Outil 3'].map((outil, idx) => (
                                  <div key={outil} className="border-b border-slate-200 dark:border-slate-700 pb-2 last:border-0">
                                    <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">{outil}</div>
                                    <div className="flex gap-3">
                                      <label className="flex items-center gap-1.5 cursor-pointer">
                                        <input
                                          type="checkbox"
                                          checked={(taskActions.get(getScheduleKey(contact.id, `${selectedTask}-${outil}`)) || []).includes('tester')}
                                          onChange={() => handleActionToggle(contact.id, `${selectedTask}-${outil}`, 'tester')}
                                          className="w-3.5 h-3.5 text-blue-600 border-slate-300 rounded focus:ring-2 focus:ring-blue-500"
                                        />
                                        <span className="text-xs text-slate-700 dark:text-slate-300">Tester</span>
                                      </label>
                                      <label className="flex items-center gap-1.5 cursor-pointer">
                                        <input
                                          type="checkbox"
                                          checked={(taskActions.get(getScheduleKey(contact.id, `${selectedTask}-${outil}`)) || []).includes('faire')}
                                          onChange={() => handleActionToggle(contact.id, `${selectedTask}-${outil}`, 'faire')}
                                          className="w-3.5 h-3.5 text-green-600 border-slate-300 rounded focus:ring-2 focus:ring-green-500"
                                        />
                                        <span className="text-xs text-slate-700 dark:text-slate-300">Faire</span>
                                      </label>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </td>
                          )}
                          {selectedTask && (
                            <td className="px-4 py-4 whitespace-nowrap">
                              <button
                                onClick={() => validateRow(contact.id)}
                                className={`p-2 rounded-lg transition ${
                                  validatedRows.has(validationKey)
                                    ? 'bg-green-500 hover:bg-green-600 text-white'
                                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                                }`}
                                title={validatedRows.has(validationKey) ? 'Cliquer pour annuler la validation' : 'Valider'}
                              >
                                <Check size={18} />
                              </button>
                            </td>
                          )}
                        </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>
            </div>
          )}
        </Card>
    </div>
  );
}
