'use client';

import React, { useEffect, useState } from 'react';
import { Search, Phone, User, Calendar, AlertCircle, FileText, Download, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, ArrowUpDown, CheckSquare, Eye, EyeOff, Save, Check, X, Star } from 'lucide-react';
import { 
  FaWhatsapp, 
  FaTelegram, 
  FaSignal,
  FaSkype,
  FaSnapchat,
  FaWeixin,
  FaLine,
  FaViber,
  FaFacebookMessenger,
  FaDiscord,
  FaVideo
} from 'react-icons/fa';
import { SiSignal, SiElement, SiWire, SiProtonmail, SiTutanota, SiZoom } from 'react-icons/si';
import { MdEmail } from 'react-icons/md';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface ContactIdentifierData {
  id: number;
  accountNumber: string;
  accountType: string;
  info: string | null;
  tasks: string | null;
  position?: number;
  createdAt: string;
  newClient: {
    id: number;
    firstName: string | null;
    surname: string | null;
    nickname: string | null;
    requestor: string | null;
    priority: string;
    createdAt: string;
    searches: Array<{
      id: number;
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

type ColumnKey = 'customId' | 'accountNumber' | 'accountType' | 'client' | 'requestor' | 'priority' | 'generalRef' | 'detailedRef' | 'startDate' | 'endDate' | 'tasks';

const ALL_COLUMNS: { key: ColumnKey; label: string }[] = [
  { key: 'customId', label: 'ID' },
  { key: 'accountNumber', label: 'Account Number' },
  { key: 'accountType', label: 'Account Type' },
  { key: 'client', label: 'Client' },
  { key: 'requestor', label: 'Demandeur' },
  { key: 'priority', label: 'Priorité' },
  { key: 'generalRef', label: 'Réf. Générale' },
  { key: 'detailedRef', label: 'Réf. Détaillée' },
  { key: 'startDate', label: 'Date Début' },
  { key: 'endDate', label: 'Date Fin' },
  { key: 'tasks', label: 'Tâches' },
];

interface SavedView {
  name: string;
  columns: ColumnKey[];
  columnOrder: ColumnKey[];
  validatedRows?: number[];
  isDefault?: boolean;
}

type SortField = 'customId' | 'accountNumber' | 'accountType' | 'client' | 'requestor' | 'priority' | 'generalRef' | 'detailedRef' | 'startDate' | 'endDate' | 'tasks';
type SortOrder = 'asc' | 'desc' | null;

export default function PandaPage() {
  const [contacts, setContacts] = useState<ContactIdentifierData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('Immédiate');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>(null);
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
  const [selectedTasks, setSelectedTasks] = useState<Record<number, string[]>>({});
  const [visibleColumns, setVisibleColumns] = useState<ColumnKey[]>(
    ALL_COLUMNS.map(c => c.key).filter(key => key !== 'priority' && key !== 'accountType')
  );
  const [columnOrder, setColumnOrder] = useState<ColumnKey[]>(ALL_COLUMNS.map(c => c.key));
  const [savedViews, setSavedViews] = useState<SavedView[]>([]);
  const [showColumnMenu, setShowColumnMenu] = useState(false);
  const [showSaveViewModal, setShowSaveViewModal] = useState(false);
  const [newViewName, setNewViewName] = useState('');
  const [viewNameError, setViewNameError] = useState('');
  const [validatedRows, setValidatedRows] = useState<Set<number>>(new Set());
  const [showValidatedRows, setShowValidatedRows] = useState(false);
  const [draggedColumn, setDraggedColumn] = useState<ColumnKey | null>(null);
  const [openTaskDropdown, setOpenTaskDropdown] = useState<number | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    fetchContacts();
    loadSavedViews();
    loadDefaultView();
  }, []);

  // Fermer le dropdown quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (openTaskDropdown !== null) {
        const target = e.target as HTMLElement;
        if (!target.closest('button') && !target.closest('[data-dropdown]')) {
          setOpenTaskDropdown(null);
          setDropdownPosition(null);
        }
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [openTaskDropdown]);

  const loadSavedViews = () => {
    const saved = localStorage.getItem('panda_saved_views');
    if (saved) {
      setSavedViews(JSON.parse(saved));
    }
  };

  const loadDefaultView = () => {
    const saved = localStorage.getItem('panda_saved_views');
    if (saved) {
      const views: SavedView[] = JSON.parse(saved);
      const defaultView = views.find(v => v.isDefault);
      if (defaultView) {
        loadView(defaultView);
      } else {
        // Si aucune vue par défaut, charger les paramètres individuels
        loadVisibleColumns();
        loadColumnOrder();
        loadValidatedRows();
      }
    } else {
      loadVisibleColumns();
      loadColumnOrder();
      loadValidatedRows();
    }
  };

  const loadVisibleColumns = () => {
    const saved = localStorage.getItem('panda_visible_columns');
    if (saved) {
      const savedColumns: ColumnKey[] = JSON.parse(saved);
      // Ajouter 'customId' si elle n'existe pas déjà (migration)
      if (!savedColumns.includes('customId')) {
        savedColumns.unshift('customId');
        localStorage.setItem('panda_visible_columns', JSON.stringify(savedColumns));
      }
      setVisibleColumns(savedColumns);
    }
  };

  const loadColumnOrder = () => {
    const saved = localStorage.getItem('panda_column_order');
    if (saved) {
      const savedOrder: ColumnKey[] = JSON.parse(saved);
      // Ajouter 'customId' si elle n'existe pas déjà (migration)
      if (!savedOrder.includes('customId')) {
        savedOrder.unshift('customId');
        localStorage.setItem('panda_column_order', JSON.stringify(savedOrder));
      }
      setColumnOrder(savedOrder);
    }
  };

  const loadValidatedRows = () => {
    const saved = localStorage.getItem('panda_validated_rows');
    if (saved) {
      setValidatedRows(new Set(JSON.parse(saved)));
    }
  };

  const saveView = () => {
    const trimmedName = newViewName.trim();
    
    if (!trimmedName) {
      setViewNameError('Le nom de la vue ne peut pas être vide');
      return;
    }
    
    // Récupérer les vues actuelles depuis localStorage pour être sûr d'avoir la liste à jour
    const currentViews = localStorage.getItem('panda_saved_views');
    const existingViews: SavedView[] = currentViews ? JSON.parse(currentViews) : [];
    
    // Vérifier si le nom existe déjà (insensible à la casse)
    const nameExists = existingViews.some(view => 
      view.name.toLowerCase() === trimmedName.toLowerCase()
    );
    
    if (nameExists) {
      setViewNameError('Une vue avec ce nom existe déjà');
      return;
    }
    
    const newView: SavedView = {
      name: trimmedName,
      columns: visibleColumns,
      columnOrder: columnOrder,
      validatedRows: Array.from(validatedRows)
    };
    const updated = [...existingViews, newView];
    setSavedViews(updated);
    localStorage.setItem('panda_saved_views', JSON.stringify(updated));
    setNewViewName('');
    setViewNameError('');
    setShowSaveViewModal(false);
  };

  const loadView = (view: SavedView) => {
    setVisibleColumns(view.columns);
    localStorage.setItem('panda_visible_columns', JSON.stringify(view.columns));
    if (view.columnOrder) {
      setColumnOrder(view.columnOrder);
      localStorage.setItem('panda_column_order', JSON.stringify(view.columnOrder));
    }
    if (view.validatedRows) {
      setValidatedRows(new Set(view.validatedRows));
    } else {
      setValidatedRows(new Set());
    }
  };

  const deleteView = (index: number) => {
    const updated = savedViews.filter((_, i) => i !== index);
    setSavedViews(updated);
    localStorage.setItem('panda_saved_views', JSON.stringify(updated));
  };

  const toggleDefaultView = (index: number) => {
    const updated = savedViews.map((view, i) => ({
      ...view,
      isDefault: i === index ? !view.isDefault : false
    }));
    setSavedViews(updated);
    localStorage.setItem('panda_saved_views', JSON.stringify(updated));
  };

  const toggleColumn = (column: ColumnKey) => {
    const updated = visibleColumns.includes(column)
      ? visibleColumns.filter(c => c !== column)
      : [...visibleColumns, column];
    setVisibleColumns(updated);
    localStorage.setItem('panda_visible_columns', JSON.stringify(updated));
  };

  const moveColumn = (column: ColumnKey, direction: 'up' | 'down') => {
    const currentIndex = columnOrder.indexOf(column);
    if (
      (direction === 'up' && currentIndex === 0) ||
      (direction === 'down' && currentIndex === columnOrder.length - 1)
    ) {
      return;
    }
    const newOrder = [...columnOrder];
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    [newOrder[currentIndex], newOrder[targetIndex]] = [newOrder[targetIndex], newOrder[currentIndex]];
    setColumnOrder(newOrder);
    localStorage.setItem('panda_column_order', JSON.stringify(newOrder));
  };

  const validateRow = async (contactId: number) => {
    const newValidated = new Set(validatedRows);
    if (newValidated.has(contactId)) {
      newValidated.delete(contactId);
    } else {
      newValidated.add(contactId);
    }
    setValidatedRows(newValidated);
    
    // Sauvegarder dans localStorage
    localStorage.setItem('panda_validated_rows', JSON.stringify(Array.from(newValidated)));
    
    // Si une vue par défaut est active, la mettre à jour également
    const saved = localStorage.getItem('panda_saved_views');
    if (saved) {
      const views: SavedView[] = JSON.parse(saved);
      const defaultViewIndex = views.findIndex(v => v.isDefault);
      if (defaultViewIndex !== -1) {
        views[defaultViewIndex].validatedRows = Array.from(newValidated);
        localStorage.setItem('panda_saved_views', JSON.stringify(views));
        setSavedViews(views);
      }
    }
  };

  const handleDragStart = (column: ColumnKey) => {
    setDraggedColumn(column);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (targetColumn: ColumnKey) => {
    if (!draggedColumn || draggedColumn === targetColumn) {
      setDraggedColumn(null);
      return;
    }

    const draggedIndex = columnOrder.indexOf(draggedColumn);
    const targetIndex = columnOrder.indexOf(targetColumn);
    const newOrder = [...columnOrder];
    newOrder.splice(draggedIndex, 1);
    newOrder.splice(targetIndex, 0, draggedColumn);
    
    setColumnOrder(newOrder);
    localStorage.setItem('panda_column_order', JSON.stringify(newOrder));
    setDraggedColumn(null);
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/panda');
      
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des contacts');
      }

      const data = await response.json();
      setContacts(data.contacts || []);
      
      // Initialiser les tâches sélectionnées depuis les données
      const initialTasks: Record<number, string[]> = {};
      data.contacts.forEach((contact: ContactIdentifierData) => {
        if (contact.tasks) {
          try {
            initialTasks[contact.id] = JSON.parse(contact.tasks);
          } catch {
            initialTasks[contact.id] = [];
          }
        } else {
          initialTasks[contact.id] = [];
        }
      });
      setSelectedTasks(initialTasks);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getClientName = (client: ContactIdentifierData['newClient']) => {
    if (client.nickname) return client.nickname;
    if (client.firstName && client.surname) return `${client.firstName} ${client.surname}`;
    if (client.firstName) return client.firstName;
    if (client.surname) return client.surname;
    return 'Client anonyme';
  };

  const handleTaskToggle = async (contactId: number, task: string) => {
    const currentTasks = selectedTasks[contactId] || [];
    const newTasks = currentTasks.includes(task)
      ? currentTasks.filter(t => t !== task)
      : [...currentTasks, task];
    
    setSelectedTasks(prev => ({
      ...prev,
      [contactId]: newTasks
    }));

    // Sauvegarder dans la base de données
    try {
      await fetch(`/api/panda/${contactId}/tasks`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tasks: newTasks })
      });
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des tâches:', error);
    }
  };

  const getAccountTypeIcon = (accountType: string) => {
    const type = accountType.toLowerCase();
    
    // WhatsApp - Vert
    if (type.includes('whatsapp')) {
      return { 
        icon: <FaWhatsapp size={14} className="text-white" />, 
        bg: 'bg-[#25D366]',
        badgeBg: 'bg-[#25D366]/20',
        badgeText: 'text-[#25D366]'
      };
    }
    // Telegram - Bleu clair
    else if (type.includes('telegram') || type.includes('télégramme')) {
      return { 
        icon: <FaTelegram size={14} className="text-white" />, 
        bg: 'bg-[#229ED9]',
        badgeBg: 'bg-[#229ED9]/20',
        badgeText: 'text-[#229ED9]'
      };
    }
    // Signal - Bleu
    else if (type.includes('signal')) {
      return { 
        icon: <SiSignal size={14} className="text-white" />, 
        bg: 'bg-[#3A76F0]',
        badgeBg: 'bg-[#3A76F0]/20',
        badgeText: 'text-[#3A76F0]'
      };
    }
    // Skype - Bleu
    else if (type.includes('skype')) {
      return { 
        icon: <FaSkype size={14} className="text-white" />, 
        bg: 'bg-[#00AFF0]',
        badgeBg: 'bg-[#00AFF0]/20',
        badgeText: 'text-[#00AFF0]'
      };
    }
    // Snapchat - Jaune
    else if (type.includes('snapchat')) {
      return { 
        icon: <FaSnapchat size={14} className="text-black" />, 
        bg: 'bg-[#FFFC00]',
        badgeBg: 'bg-[#FFFC00]/30',
        badgeText: 'text-[#FFFC00]'
      };
    }
    // WeChat - Vert
    else if (type.includes('wechat')) {
      return { 
        icon: <FaWeixin size={14} className="text-white" />, 
        bg: 'bg-[#07C160]',
        badgeBg: 'bg-[#07C160]/20',
        badgeText: 'text-[#07C160]'
      };
    }
    // LINE - Vert
    else if (type.includes('line')) {
      return { 
        icon: <FaLine size={14} className="text-white" />, 
        bg: 'bg-[#00B900]',
        badgeBg: 'bg-[#00B900]/20',
        badgeText: 'text-[#00B900]'
      };
    }
    // Viber - Violet
    else if (type.includes('viber')) {
      return { 
        icon: <FaViber size={14} className="text-white" />, 
        bg: 'bg-[#7360F2]',
        badgeBg: 'bg-[#7360F2]/20',
        badgeText: 'text-[#7360F2]'
      };
    }
    // Threema - Noir/Vert
    else if (type.includes('threema')) {
      return { 
        icon: <div className="w-3.5 h-3.5 bg-white rounded-full flex items-center justify-center"><span className="text-[10px] font-bold text-[#2D2D2D]">T</span></div>, 
        bg: 'bg-[#2D2D2D]',
        badgeBg: 'bg-slate-800/20',
        badgeText: 'text-slate-800 dark:text-slate-300'
      };
    }
    // Messenger (Facebook) - Bleu
    else if (type.includes('messenger')) {
      return { 
        icon: <FaFacebookMessenger size={14} className="text-white" />, 
        bg: 'bg-[#0084FF]',
        badgeBg: 'bg-[#0084FF]/20',
        badgeText: 'text-[#0084FF]'
      };
    }
    // Discord - Bleu/Violet
    else if (type.includes('discord')) {
      return { 
        icon: <FaDiscord size={14} className="text-white" />, 
        bg: 'bg-[#5865F2]',
        badgeBg: 'bg-[#5865F2]/20',
        badgeText: 'text-[#5865F2]'
      };
    }
    // Zoom - Bleu
    else if (type.includes('zoom')) {
      return { 
        icon: <SiZoom size={14} className="text-white" />, 
        bg: 'bg-[#2D8CFF]',
        badgeBg: 'bg-[#2D8CFF]/20',
        badgeText: 'text-[#2D8CFF]'
      };
    }
    // Element - Vert
    else if (type.includes('element')) {
      return { 
        icon: <SiElement size={14} className="text-white" />, 
        bg: 'bg-[#0DBD8B]',
        badgeBg: 'bg-[#0DBD8B]/20',
        badgeText: 'text-[#0DBD8B]'
      };
    }
    // Wire - Noir
    else if (type.includes('wire')) {
      return { 
        icon: <SiWire size={14} className="text-white" />, 
        bg: 'bg-[#000000]',
        badgeBg: 'bg-slate-800/20',
        badgeText: 'text-slate-800 dark:text-slate-300'
      };
    }
    // Protonmail - Violet
    else if (type.includes('protonmail') || type.includes('proton')) {
      return { 
        icon: <SiProtonmail size={14} className="text-white" />, 
        bg: 'bg-[#6D4AFF]',
        badgeBg: 'bg-[#6D4AFF]/20',
        badgeText: 'text-[#6D4AFF]'
      };
    }
    // Tutanota - Rouge
    else if (type.includes('tutanota')) {
      return { 
        icon: <SiTutanota size={14} className="text-white" />, 
        bg: 'bg-[#840010]',
        badgeBg: 'bg-[#840010]/20',
        badgeText: 'text-[#840010]'
      };
    }
    // Email générique
    else if (type.includes('mail') || type.includes('email') || type.includes('@')) {
      return { 
        icon: <MdEmail size={14} className="text-red-600 dark:text-red-400" />, 
        bg: 'bg-red-100 dark:bg-red-900/30',
        badgeBg: 'bg-red-100 dark:bg-red-900/30',
        badgeText: 'text-red-800 dark:text-red-400'
      };
    }
    // Téléphone
    else if (type.includes('phone') || type.includes('téléphone') || type.includes('telephone')) {
      return { 
        icon: <Phone size={14} className="text-green-600 dark:text-green-400" />, 
        bg: 'bg-green-100 dark:bg-green-900/30',
        badgeBg: 'bg-green-100 dark:bg-green-900/30',
        badgeText: 'text-green-800 dark:text-green-400'
      };
    }
    
    // Par défaut - Téléphone
    return { 
      icon: <Phone size={14} className="text-slate-600 dark:text-slate-400" />, 
      bg: 'bg-slate-100 dark:bg-slate-800',
      badgeBg: 'bg-slate-100 dark:bg-slate-800',
      badgeText: 'text-slate-800 dark:text-slate-400'
    };
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

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const generateCustomId = (contact: ContactIdentifierData, allContacts: ContactIdentifierData[]) => {
    // Récupérer l'année de création du client (target)
    const clientCreationYear = new Date(contact.newClient.createdAt).getFullYear();
    const lastTwoDigits = clientCreationYear.toString().slice(-2);
    
    // Utiliser la position stockée dans la base de données au lieu de la calculer
    const contactPosition = contact.position || 1;
    
    // Format: YY-ClientID-ContactPosition
    return `${lastTwoDigits}-${contact.newClient.id}-${contactPosition}`;
  };

  const uniqueTypes = [...new Set(contacts.map(c => c.accountType))];

  const getTypeIcon = (type: string) => {
    const iconMap: Record<string, { icon: React.ReactElement; color: string; bgColor: string; hoverBg: string; activeBg: string }> = {
      'WhatsApp': { 
        icon: <FaWhatsapp size={18} />, 
        color: 'text-green-700 dark:text-green-400',
        bgColor: 'bg-green-100 dark:bg-green-900/30',
        hoverBg: 'hover:bg-green-200 dark:hover:bg-green-900/50',
        activeBg: 'bg-green-600'
      },
      'Telegram': { 
        icon: <FaTelegram size={18} />, 
        color: 'text-blue-700 dark:text-blue-400',
        bgColor: 'bg-blue-100 dark:bg-blue-900/30',
        hoverBg: 'hover:bg-blue-200 dark:hover:bg-blue-900/50',
        activeBg: 'bg-blue-600'
      },
      'Signal': { 
        icon: <SiSignal size={18} />, 
        color: 'text-indigo-700 dark:text-indigo-400',
        bgColor: 'bg-indigo-100 dark:bg-indigo-900/30',
        hoverBg: 'hover:bg-indigo-200 dark:hover:bg-indigo-900/50',
        activeBg: 'bg-indigo-600'
      },
      'Skype': { 
        icon: <FaSkype size={18} />, 
        color: 'text-sky-700 dark:text-sky-400',
        bgColor: 'bg-sky-100 dark:bg-sky-900/30',
        hoverBg: 'hover:bg-sky-200 dark:hover:bg-sky-900/50',
        activeBg: 'bg-sky-600'
      },
      'Snapchat': { 
        icon: <FaSnapchat size={18} />, 
        color: 'text-yellow-700 dark:text-yellow-400',
        bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
        hoverBg: 'hover:bg-yellow-200 dark:hover:bg-yellow-900/50',
        activeBg: 'bg-yellow-600'
      },
      'WeChat': { 
        icon: <FaWeixin size={18} />, 
        color: 'text-emerald-700 dark:text-emerald-400',
        bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
        hoverBg: 'hover:bg-emerald-200 dark:hover:bg-emerald-900/50',
        activeBg: 'bg-emerald-600'
      },
      'Line': { 
        icon: <FaLine size={18} />, 
        color: 'text-lime-700 dark:text-lime-400',
        bgColor: 'bg-lime-100 dark:bg-lime-900/30',
        hoverBg: 'hover:bg-lime-200 dark:hover:bg-lime-900/50',
        activeBg: 'bg-lime-600'
      },
      'Viber': { 
        icon: <FaViber size={18} />, 
        color: 'text-purple-700 dark:text-purple-400',
        bgColor: 'bg-purple-100 dark:bg-purple-900/30',
        hoverBg: 'hover:bg-purple-200 dark:hover:bg-purple-900/50',
        activeBg: 'bg-purple-600'
      },
      'Messenger': { 
        icon: <FaFacebookMessenger size={18} />, 
        color: 'text-blue-700 dark:text-blue-400',
        bgColor: 'bg-blue-100 dark:bg-blue-900/30',
        hoverBg: 'hover:bg-blue-200 dark:hover:bg-blue-900/50',
        activeBg: 'bg-blue-600'
      },
      'Discord': { 
        icon: <FaDiscord size={18} />, 
        color: 'text-violet-700 dark:text-violet-400',
        bgColor: 'bg-violet-100 dark:bg-violet-900/30',
        hoverBg: 'hover:bg-violet-200 dark:hover:bg-violet-900/50',
        activeBg: 'bg-violet-600'
      },
      'Element': { 
        icon: <SiElement size={18} />, 
        color: 'text-teal-700 dark:text-teal-400',
        bgColor: 'bg-teal-100 dark:bg-teal-900/30',
        hoverBg: 'hover:bg-teal-200 dark:hover:bg-teal-900/50',
        activeBg: 'bg-teal-600'
      },
      'Wire': { 
        icon: <SiWire size={18} />, 
        color: 'text-cyan-700 dark:text-cyan-400',
        bgColor: 'bg-cyan-100 dark:bg-cyan-900/30',
        hoverBg: 'hover:bg-cyan-200 dark:hover:bg-cyan-900/50',
        activeBg: 'bg-cyan-600'
      },
      'ProtonMail': { 
        icon: <SiProtonmail size={18} />, 
        color: 'text-purple-700 dark:text-purple-400',
        bgColor: 'bg-purple-100 dark:bg-purple-900/30',
        hoverBg: 'hover:bg-purple-200 dark:hover:bg-purple-900/50',
        activeBg: 'bg-purple-600'
      },
      'Tutanota': { 
        icon: <SiTutanota size={18} />, 
        color: 'text-red-700 dark:text-red-400',
        bgColor: 'bg-red-100 dark:bg-red-900/30',
        hoverBg: 'hover:bg-red-200 dark:hover:bg-red-900/50',
        activeBg: 'bg-red-600'
      },
      'Zoom': { 
        icon: <SiZoom size={18} />, 
        color: 'text-blue-700 dark:text-blue-400',
        bgColor: 'bg-blue-100 dark:bg-blue-900/30',
        hoverBg: 'hover:bg-blue-200 dark:hover:bg-blue-900/50',
        activeBg: 'bg-blue-600'
      },
      'Email': { 
        icon: <MdEmail size={18} />, 
        color: 'text-gray-700 dark:text-gray-400',
        bgColor: 'bg-gray-100 dark:bg-gray-900/30',
        hoverBg: 'hover:bg-gray-200 dark:hover:bg-gray-900/50',
        activeBg: 'bg-gray-600'
      },
      'Phone': { 
        icon: <Phone size={18} />, 
        color: 'text-slate-700 dark:text-slate-400',
        bgColor: 'bg-slate-100 dark:bg-slate-900/30',
        hoverBg: 'hover:bg-slate-200 dark:hover:bg-slate-900/50',
        activeBg: 'bg-slate-600'
      },
    };
    
    return iconMap[type] || { 
      icon: <Phone size={18} />, 
      color: 'text-slate-700 dark:text-slate-400',
      bgColor: 'bg-slate-100 dark:bg-slate-900/30',
      hoverBg: 'hover:bg-slate-200 dark:hover:bg-slate-900/50',
      activeBg: 'bg-slate-600'
    };
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Cycle through: asc -> desc -> null
      if (sortOrder === 'asc') {
        setSortOrder('desc');
      } else if (sortOrder === 'desc') {
        setSortField(null);
        setSortOrder(null);
      }
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleColumnFilter = (column: string, value: string) => {
    setColumnFilters(prev => ({
      ...prev,
      [column]: value
    }));
  };

  const filteredContacts = contacts.filter(contact => {
    const searchTerm = filter.toLowerCase();
    const clientName = getClientName(contact.newClient).toLowerCase();
    const accountNumber = contact.accountNumber.toLowerCase();
    const accountType = contact.accountType.toLowerCase();
    const requestor = (contact.newClient.requestor || '').toLowerCase();
    const customId = generateCustomId(contact, contacts).toLowerCase();
    const search = contact.newClient.searches[0];
    
    const matchesSearch = 
      customId.includes(searchTerm) ||
      clientName.includes(searchTerm) || 
      accountNumber.includes(searchTerm) || 
      accountType.includes(searchTerm) ||
      requestor.includes(searchTerm);
    
    const matchesPriority = priorityFilter === 'all' || contact.newClient.priority === priorityFilter;
    const matchesType = typeFilter === 'all' || contact.accountType === typeFilter;
    
    // Column filters
    const matchesColumnFilters = Object.entries(columnFilters).every(([column, filterValue]) => {
      if (!filterValue) return true;
      const lowerFilter = filterValue.toLowerCase();
      
      switch (column) {
        case 'accountNumber':
          return accountNumber.includes(lowerFilter);
        case 'accountType':
          return accountType.includes(lowerFilter);
        case 'client':
          return clientName.includes(lowerFilter);
        case 'requestor':
          return requestor.includes(lowerFilter);
        case 'priority':
          return contact.newClient.priority.toLowerCase().includes(lowerFilter);
        case 'generalRef':
          return (search?.generalReference || '').toLowerCase().includes(lowerFilter);
        case 'detailedRef':
          return (search?.detailedReference || '').toLowerCase().includes(lowerFilter);
        default:
          return true;
      }
    });
    
    // Filter validated rows
    const matchesValidation = showValidatedRows || !validatedRows.has(contact.id);
    
    return matchesSearch && matchesPriority && matchesType && matchesColumnFilters && matchesValidation;
  });

  // Sort contacts
  const sortedContacts = [...filteredContacts].sort((a, b) => {
    if (!sortField || !sortOrder) return 0;

    let aValue: any;
    let bValue: any;
    const searchA = a.newClient.searches[0];
    const searchB = b.newClient.searches[0];

    switch (sortField) {
      case 'customId':
        aValue = generateCustomId(a, contacts);
        bValue = generateCustomId(b, contacts);
        break;
      case 'accountNumber':
        aValue = a.accountNumber;
        bValue = b.accountNumber;
        break;
      case 'accountType':
        aValue = a.accountType;
        bValue = b.accountType;
        break;
      case 'client':
        aValue = getClientName(a.newClient);
        bValue = getClientName(b.newClient);
        break;
      case 'requestor':
        aValue = a.newClient.requestor || '';
        bValue = b.newClient.requestor || '';
        break;
      case 'priority':
        const priorityOrder = { 'Immédiate': 4, 'Haute': 3, 'Moyenne': 2, 'Faible': 1 };
        aValue = priorityOrder[a.newClient.priority as keyof typeof priorityOrder] || 0;
        bValue = priorityOrder[b.newClient.priority as keyof typeof priorityOrder] || 0;
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
        aValue = searchA?.startDate ? new Date(searchA.startDate).getTime() : 0;
        bValue = searchB?.startDate ? new Date(searchB.startDate).getTime() : 0;
        break;
      case 'endDate':
        aValue = searchA?.endDate ? new Date(searchA.endDate).getTime() : 0;
        bValue = searchB?.endDate ? new Date(searchB.endDate).getTime() : 0;
        break;
      case 'tasks':
        aValue = (selectedTasks[a.id] || []).length;
        bValue = (selectedTasks[b.id] || []).length;
        break;
      default:
        return 0;
    }

    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const exportToCSV = () => {
    const headers = ['ID', 'Account Number', 'Account Type', 'Client', 'Demandeur', 'Priorité', 'Référence Générale', 'Référence Détaillée', 'Date Début', 'Date Fin'];
    const rows = sortedContacts.map(contact => {
      const search = contact.newClient.searches[0];
      return [
        contact.id,
        contact.accountNumber,
        contact.accountType,
        getClientName(contact.newClient),
        contact.newClient.requestor || '-',
        contact.newClient.priority,
        search?.generalReference || '-',
        search?.detailedReference || '-',
        formatDate(search?.startDate || null),
        formatDate(search?.endDate || null)
      ];
    });

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `panda_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const SortableHeader = ({ field, label, columnKey }: { field: SortField; label: string; columnKey: ColumnKey }) => {
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
      <th 
        className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider relative cursor-move select-none"
        draggable
        onDragStart={() => handleDragStart(columnKey)}
        onDragOver={handleDragOver}
        onDrop={() => handleDrop(columnKey)}
        style={{ opacity: draggedColumn === columnKey ? 0.5 : 1 }}
      >
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
              >                <div className="py-1">
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
            Gestion Panda
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Liste des identifiants de contact et recherches associées
          </p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Button variant="secondary" onClick={() => setShowColumnMenu(!showColumnMenu)}>
              <Eye size={18} />
              <span>Colonnes</span>
            </Button>
            {showColumnMenu && (
              <div className="absolute top-full right-0 mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-50 min-w-[250px]">
                <div className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-slate-900 dark:text-white">Colonnes visibles</span>
                    <button
                      onClick={() => setShowSaveViewModal(true)}
                      className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
                      title="Sauvegarder vue"
                    >
                      <Save size={16} className="text-blue-600 dark:text-blue-400" />
                    </button>
                  </div>
                  <div className="space-y-1 max-h-[300px] overflow-y-auto">
                    {columnOrder.map((key, index) => {
                      const col = ALL_COLUMNS.find(c => c.key === key)!;
                      return (
                        <div key={col.key} className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded">
                          <div className="flex gap-0.5">
                            <button
                              onClick={() => moveColumn(col.key, 'up')}
                              disabled={index === 0}
                              className="p-0.5 hover:bg-slate-200 dark:hover:bg-slate-600 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                              title="Monter"
                            >
                              <ChevronUp size={14} />
                            </button>
                            <button
                              onClick={() => moveColumn(col.key, 'down')}
                              disabled={index === columnOrder.length - 1}
                              className="p-0.5 hover:bg-slate-200 dark:hover:bg-slate-600 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                              title="Descendre"
                            >
                              <ChevronDown size={14} />
                            </button>
                          </div>
                          <label className="flex items-center gap-2 cursor-pointer flex-1">
                            <input
                              type="checkbox"
                              checked={visibleColumns.includes(col.key)}
                              onChange={() => toggleColumn(col.key)}
                              className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                            />
                            <span className="text-sm text-slate-900 dark:text-white">{col.label}</span>
                          </label>
                        </div>
                      );
                    })}
                  </div>
                  {savedViews.length > 0 && (
                    <>
                      <div className="border-t border-slate-200 dark:border-slate-700 my-2"></div>
                      <div className="space-y-1">
                        <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">VUES SAUVEGARDÉES</span>
                        {savedViews.map((view, index) => (
                          <div key={index} className="flex items-center justify-between px-2 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded">
                            <button
                              onClick={() => loadView(view)}
                              className="flex-1 text-left text-sm text-slate-900 dark:text-white flex items-center gap-2"
                            >
                              {view.isDefault && <Star size={14} className="text-yellow-500 fill-yellow-500" />}
                              {view.name}
                            </button>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => toggleDefaultView(index)}
                                className="p-1 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 rounded"
                                title={view.isDefault ? "Retirer par défaut" : "Définir par défaut"}
                              >
                                <Star size={14} className={view.isDefault ? "text-yellow-500 fill-yellow-500" : "text-slate-400"} />
                              </button>
                              <button
                                onClick={() => deleteView(index)}
                                className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
                              >
                                <X size={14} className="text-red-600 dark:text-red-400" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
          <Button variant="secondary" onClick={exportToCSV}>
            <Download size={18} />
            <span>Exporter CSV</span>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Total Contacts</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {contacts.length}
                </p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Phone size={24} className="text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Haute Priorité</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {contacts.filter(c => c.newClient.priority === 'Haute' || c.newClient.priority === 'Immédiate').length}
                </p>
              </div>
              <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <AlertCircle size={24} className="text-red-600 dark:text-red-400" />
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Clients Uniques</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {new Set(contacts.map(c => c.newClient.id)).size}
                </p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <User size={24} className="text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Avec Recherches</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {contacts.filter(c => c.newClient.searches.length > 0).length}
                </p>
              </div>
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <FileText size={24} className="text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <div className="p-4 space-y-4">
          {/* Priority Buttons */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setPriorityFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                priorityFilter === 'all'
                  ? 'bg-slate-700 text-white shadow-lg scale-105'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              Toutes les priorités
            </button>
            <button
              onClick={() => setPriorityFilter('Immédiate')}
              className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                priorityFilter === 'Immédiate'
                  ? 'bg-red-600 text-white shadow-lg scale-105'
                  : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50'
              }`}
            >
              <AlertCircle size={18} />
              Immédiate
            </button>
            <button
              onClick={() => setPriorityFilter('Haute')}
              className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                priorityFilter === 'Haute'
                  ? 'bg-orange-600 text-white shadow-lg scale-105'
                  : 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 hover:bg-orange-200 dark:hover:bg-orange-900/50'
              }`}
            >
              <AlertCircle size={18} />
              Haute
            </button>
            <button
              onClick={() => setPriorityFilter('Moyenne')}
              className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                priorityFilter === 'Moyenne'
                  ? 'bg-yellow-600 text-white shadow-lg scale-105'
                  : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 hover:bg-yellow-200 dark:hover:bg-yellow-900/50'
              }`}
            >
              <AlertCircle size={18} />
              Moyenne
            </button>
            <button
              onClick={() => setPriorityFilter('Faible')}
              className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                priorityFilter === 'Faible'
                  ? 'bg-green-600 text-white shadow-lg scale-105'
                  : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50'
              }`}
            >
              <AlertCircle size={18} />
              Faible
            </button>
          </div>

          {/* Account Type Buttons */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setTypeFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                typeFilter === 'all'
                  ? 'bg-slate-700 text-white shadow-lg scale-105'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              Tous les types
            </button>
            {uniqueTypes.map(type => {
              const typeInfo = getTypeIcon(type);
              return (
                <button
                  key={type}
                  onClick={() => setTypeFilter(type)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                    typeFilter === type
                      ? `${typeInfo.activeBg} text-white shadow-lg scale-105`
                      : `${typeInfo.bgColor} ${typeInfo.color} ${typeInfo.hoverBg}`
                  }`}
                >
                  {typeInfo.icon}
                  {type}
                </button>
              );
            })}
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Rechercher..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>
        </div>
      </Card>

      {/* Error */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Save View Modal */}
      {showSaveViewModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowSaveViewModal(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 w-96" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4 text-slate-900 dark:text-white">Enregistrer la vue</h3>
            <input
              type="text"
              placeholder="Nom de la vue..."
              value={newViewName}
              onChange={(e) => {
                setNewViewName(e.target.value);
                setViewNameError('');
              }}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-white mb-4"
              autoFocus
            />
            {viewNameError && (
              <p className="text-sm text-red-600 dark:text-red-400 mb-4 -mt-2">{viewNameError}</p>
            )}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowSaveViewModal(false);
                  setNewViewName('');
                  setViewNameError('');
                }}
                className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-900 dark:text-white"
              >
                Annuler
              </button>
              <button
                onClick={saveView}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2"
              >
                <Save size={16} />
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <Card className="overflow-visible">
        <div className="overflow-x-auto overflow-y-visible">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
              <tr>
                {columnOrder.filter(key => visibleColumns.includes(key)).map(key => {
                  return <SortableHeader key={key} field={key as SortField} label={ALL_COLUMNS.find(c => c.key === key)!.label} columnKey={key} />;
                })}
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <div className="flex items-center justify-between gap-2">
                    <span>Actions</span>
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
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-700">
              {sortedContacts.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                    Aucun contact trouvé
                  </td>
                </tr>
              ) : (
                sortedContacts.map((contact) => {
                  const search = contact.newClient.searches[0]; // Première recherche associée
                  
                  const renderCell = (key: ColumnKey) => {
                    switch (key) {
                      case 'customId':
                        return (
                          <td className="px-4 py-4 min-w-[120px]">
                            <span className="text-sm font-mono font-semibold text-blue-600 dark:text-blue-400 whitespace-nowrap">
                              {generateCustomId(contact, contacts)}
                            </span>
                          </td>
                        );
                      case 'accountNumber':
                        return (
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className={`p-2 ${getAccountTypeIcon(contact.accountType).bg} rounded-full mr-2`}>
                                {getAccountTypeIcon(contact.accountType).icon}
                              </div>
                              <span className="text-sm font-medium text-slate-900 dark:text-white">
                                {contact.accountNumber}
                              </span>
                            </div>
                          </td>
                        );
                      case 'accountType':
                        return (
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getAccountTypeIcon(contact.accountType).badgeBg} ${getAccountTypeIcon(contact.accountType).badgeText}`}>
                              {contact.accountType}
                            </span>
                          </td>
                        );
                      case 'client':
                        return (
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-300">
                            {getClientName(contact.newClient)}
                          </td>
                        );
                      case 'requestor':
                        return (
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-300">
                            {contact.newClient.requestor || '-'}
                          </td>
                        );
                      case 'priority':
                        return (
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(contact.newClient.priority)}`}>
                              {contact.newClient.priority}
                            </span>
                          </td>
                        );
                      case 'generalRef':
                        return (
                          <td className="px-4 py-4 text-sm text-slate-900 dark:text-slate-300">
                            <div className="max-w-xs truncate">
                              {search?.generalReference || '-'}
                            </div>
                          </td>
                        );
                      case 'detailedRef':
                        return (
                          <td className="px-4 py-4 text-sm text-slate-900 dark:text-slate-300">
                            <div className="max-w-xs truncate">
                              {search?.detailedReference || '-'}
                            </div>
                          </td>
                        );
                      case 'startDate':
                        return (
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-300">
                            {formatDate(search?.startDate || null)}
                          </td>
                        );
                      case 'endDate':
                        return (
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-300">
                            {formatDate(search?.endDate || null)}
                          </td>
                        );
                      case 'tasks':
                        return (
                          <td className="px-4 py-4 relative">
                            <div className="relative">
                              <button
                                className="flex items-center gap-2 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition text-sm"
                                onClick={(e) => {
                                  if (openTaskDropdown === contact.id) {
                                    setOpenTaskDropdown(null);
                                    setDropdownPosition(null);
                                  } else {
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    setDropdownPosition({
                                      top: rect.bottom + window.scrollY + 4,
                                      left: rect.left + window.scrollX
                                    });
                                    setOpenTaskDropdown(contact.id);
                                  }
                                }}
                              >
                                <CheckSquare size={16} className="text-blue-600 dark:text-blue-400" />
                                <span className="text-slate-900 dark:text-white">
                                  {(selectedTasks[contact.id] || []).length} / {AVAILABLE_TASKS.length}
                                </span>
                                <ChevronDown size={14} />
                              </button>
                              {openTaskDropdown === contact.id && dropdownPosition && (
                                <div 
                                  data-dropdown
                                  className="fixed bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl z-[100] min-w-[250px] max-h-[300px] overflow-y-auto"
                                  style={{
                                    top: `${dropdownPosition.top}px`,
                                    left: `${dropdownPosition.left}px`
                                  }}
                                >
                                  <div className="p-2">
                                    {AVAILABLE_TASKS.map(task => (
                                      <label
                                        key={task}
                                        className="flex items-center gap-2 px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded cursor-pointer transition"
                                      >
                                        <input
                                          type="checkbox"
                                          checked={(selectedTasks[contact.id] || []).includes(task)}
                                          onChange={() => handleTaskToggle(contact.id, task)}
                                          className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                                        />
                                        <span className="text-sm text-slate-900 dark:text-white">
                                          {task}
                                        </span>
                                      </label>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                        );
                      default:
                        return null;
                    }
                  };
                  
                  return (
                    <tr key={contact.id} className={`hover:bg-slate-50 dark:hover:bg-slate-800 transition ${validatedRows.has(contact.id) ? 'bg-green-50 dark:bg-green-900/20' : ''}`}>
                      {columnOrder.filter(key => visibleColumns.includes(key)).map(key => (
                        <React.Fragment key={key}>{renderCell(key)}</React.Fragment>
                      ))}
                      <td className="px-4 py-4 whitespace-nowrap">
                        <button
                          onClick={() => validateRow(contact.id)}
                          className={`p-2 rounded-lg transition ${
                            validatedRows.has(contact.id)
                              ? 'bg-green-500 hover:bg-green-600 text-white'
                              : 'bg-blue-500 hover:bg-blue-600 text-white'
                          }`}
                          title={validatedRows.has(contact.id) ? 'Cliquer pour annuler la validation' : 'Valider'}
                        >
                          <Check size={18} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Footer Summary */}
      <div className="text-sm text-slate-600 dark:text-slate-400">
        Affichage de {sortedContacts.length} contact{sortedContacts.length > 1 ? 's' : ''} sur {contacts.length} au total
      </div>
    </div>
  );
}
