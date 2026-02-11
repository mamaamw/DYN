'use client';

import { useState, useEffect, DragEvent } from 'react';
import { GripVertical, Edit2, Save, RotateCcw, Trash2, Eye, EyeOff, ChevronDown, ChevronUp, Plus, FolderPlus, Link, X } from 'lucide-react';
import Toast from '@/components/ui/Toast';
import ConfirmModal from '@/components/ui/ConfirmModal';

interface NavItem {
  label: string;
  href: string;
  icon: string;
  visible: boolean;
  pageTitle?: string;
}

interface NavSection {
  section: string;
  adminOnly?: boolean;
  items: NavItem[];
  visible: boolean;
}

const defaultNavigationConfig: NavSection[] = [
  {
    section: 'DASHBOARDS',
    visible: true,
    items: [
      { label: 'Dashboard', href: '/dashboard', icon: 'LayoutDashboard', visible: true },
      { label: 'Analytiques', href: '/analytics', icon: 'BarChart3', visible: true },
    ],
  },
  {
    section: 'JELLY',
    visible: true,
    items: [
      { label: 'Clients', href: '/clients', icon: 'Users', visible: true },
      { label: 'Recherches', href: '/searches', icon: 'Search', visible: true },
      { label: 'Prio', href: '/prio', icon: 'LayoutDashboard', visible: true },
    ],
  },
  {
    section: 'SHARK',
    visible: true,
    items: [
      { label: 'Gestion Panda', href: '/panda', icon: 'LayoutDashboard', visible: true },
      { label: 'Vue d\'ensemble', href: '/tasks', icon: 'CheckSquare', visible: true },
      { label: 'Planning', href: '/planning', icon: 'Calendar', visible: true },
      { label: 'TODO', href: '/todo', icon: 'CheckSquare', visible: true },
      { label: 'Kanban', href: '/todo-kanban', icon: 'LayoutDashboard', visible: true },
    ],
  },
  {
    section: 'FINANCE & RAPPORTS',
    visible: true,
    items: [
      { label: 'Vue d\'ensemble', href: '/finance', icon: 'DollarSign', visible: true },
      { label: 'Projets', href: '/projects', icon: 'Briefcase', visible: true },
      { label: 'Factures', href: '/invoices', icon: 'DollarSign', visible: true },
      { label: 'Devis', href: '/proposals', icon: 'DollarSign', visible: true },
    ],
  },
  {
    section: 'APPLICATIONS',
    visible: true,
    items: [
      { label: 'Chat', href: '/apps/chat', icon: 'LayoutDashboard', visible: true },
      { label: 'Email', href: '/apps/email', icon: 'LayoutDashboard', visible: true },
      { label: 'Taches', href: '/apps/tasks', icon: 'LayoutDashboard', visible: true },
      { label: 'Notes', href: '/apps/notes', icon: 'LayoutDashboard', visible: true },
      { label: 'Stockage', href: '/apps/storage', icon: 'LayoutDashboard', visible: true },
      { label: 'Calendrier', href: '/apps/calendar', icon: 'LayoutDashboard', visible: true },
    ],
  },
  {
    section: 'GESTION DU SITE',
    adminOnly: true,
    visible: true,
    items: [
      { label: 'Corbeille', href: '/admin/trash', icon: 'Trash2', visible: true },
      { label: 'Logs Système', href: '/admin/logs', icon: 'FileText', visible: true },
      { label: 'Base de Données', href: '/admin/database', icon: 'Database', visible: true },
      { label: 'Gestion Données', href: '/admin/data', icon: 'Table', visible: true },
      { label: 'Surveillance', href: '/admin/monitoring', icon: 'Activity', visible: true },
    ],
  },
  {
    section: 'GESTION DES ACCÈS',
    adminOnly: true,
    visible: true,
    items: [
      { label: 'Gestion Utilisateurs', href: '/admin/users', icon: 'UserCog', visible: true },
      { label: 'Gestion Rôles', href: '/admin/roles', icon: 'Lock', visible: true },
      { label: 'Navigation', href: '/admin/navigation', icon: 'Menu', visible: true },
      { label: 'Contrôle d\'Accès', href: '/admin/access-control', icon: 'Shield', visible: true },
    ],
  },
  {
    section: 'SYSTÈME',
    adminOnly: true,
    visible: true,
    items: [
      { label: 'Paramètres', href: '/settings', icon: 'Settings', visible: true },
      { label: 'Aide', href: '/help', icon: 'HelpCircle', visible: true },
    ],
  },
  {
    section: 'MARGINAL',
    adminOnly: false,
    visible: false,
    items: [
      { label: 'Nouveau Client', href: '/clients/new', icon: 'UserPlus', visible: false },
      { label: 'Détail Client', href: '/clients/[id]', icon: 'User', visible: false },
      { label: 'Éditer Client', href: '/clients/[id]/edit', icon: 'Edit', visible: false },
      { label: 'Historique Client', href: '/clients/[id]/history', icon: 'History', visible: false },
      { label: 'Nouveau Devis', href: '/proposals/new', icon: 'FilePlus', visible: false },
      { label: 'Détail Devis', href: '/proposals/[id]', icon: 'FileText', visible: false },
      { label: 'Éditer Devis', href: '/proposals/[id]/edit', icon: 'Edit', visible: false },
      { label: 'Détail Tâche', href: '/tasks/[slug]', icon: 'CheckSquare', visible: false },
      { label: 'Dashboard Admin', href: '/admin/dashboard', icon: 'LayoutDashboard', visible: false },
      { label: 'Notifications Admin', href: '/admin/notifications', icon: 'Bell', visible: false },
      { label: 'Catégories Admin', href: '/admin/categories', icon: 'Tag', visible: false },
      { label: 'Types de Comptes', href: '/admin/account-types-tasks', icon: 'UserCog', visible: false },
    ],
  },
];

export default function NavigationEditorPage() {
  const [navConfig, setNavConfig] = useState<NavSection[]>(defaultNavigationConfig);
  const [editingItem, setEditingItem] = useState<{ sectionIndex: number; itemIndex: number } | null>(null);
  const [editingSection, setEditingSection] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  const [editHref, setEditHref] = useState('');
  const [editPageTitle, setEditPageTitle] = useState('');
  const [draggedSection, setDraggedSection] = useState<number | null>(null);
  const [draggedItem, setDraggedItem] = useState<{ sectionIndex: number; itemIndex: number } | null>(null);
  const [saving, setSaving] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set(navConfig.map((_, i) => i)));
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [showAddSection, setShowAddSection] = useState(false);
  const [showAddItem, setShowAddItem] = useState<number | null>(null);
  const [newSectionName, setNewSectionName] = useState('');
  const [newItemLabel, setNewItemLabel] = useState('');
  const [newItemHref, setNewItemHref] = useState('');
  const [newItemPageTitle, setNewItemPageTitle] = useState('');
  const [confirmModal, setConfirmModal] = useState<{ type: 'reset' | 'deleteSection' | 'deleteItem'; data?: any } | null>(null);

  useEffect(() => {
    loadNavigation();
  }, []);

  const loadNavigation = async () => {
    try {
      const response = await fetch('/api/admin/navigation');
      if (response.ok) {
        const data = await response.json();
        if (data.config) {
          setNavConfig(data.config);
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
    }
  };

  const saveNavigation = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/admin/navigation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: navConfig })
      });
      
      if (response.ok) {
        setToast({ message: 'Navigation sauvegardée avec succès !', type: 'success' });
        // Notifier AppLayout de recharger la navigation
        window.dispatchEvent(new Event('navigationConfigUpdated'));
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

  const resetNavigation = async () => {
    
    try {
      const response = await fetch('/api/admin/navigation', {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setNavConfig(defaultNavigationConfig);
        setToast({ message: 'Navigation réinitialisée avec succès !', type: 'success' });
        setConfirmModal(null);
        // Notifier AppLayout de recharger la navigation
        window.dispatchEvent(new Event('navigationConfigUpdated'));
      } else {
        setToast({ message: 'Erreur lors de la réinitialisation', type: 'error' });
      }
    } catch (error) {
      console.error('Erreur:', error);
      setToast({ message: 'Erreur lors de la réinitialisation', type: 'error' });
    }
  };

  const toggleSectionExpanded = (index: number) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedSections(newExpanded);
  };

  const handleSectionDragStart = (e: DragEvent, index: number) => {
    setDraggedSection(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleSectionDragOver = (e: DragEvent, index: number) => {
    e.preventDefault();
    if (draggedSection === null || draggedSection === index) return;
    
    const newConfig = [...navConfig];
    const draggedItem = newConfig[draggedSection];
    newConfig.splice(draggedSection, 1);
    newConfig.splice(index, 0, draggedItem);
    
    setNavConfig(newConfig);
    setDraggedSection(index);
  };

  const handleItemDragStart = (e: DragEvent, sectionIndex: number, itemIndex: number) => {
    setDraggedItem({ sectionIndex, itemIndex });
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleItemDragOver = (e: DragEvent, sectionIndex: number, itemIndex: number) => {
    e.preventDefault();
    if (!draggedItem || 
        (draggedItem.sectionIndex === sectionIndex && draggedItem.itemIndex === itemIndex)) return;
    
    const newConfig = [...navConfig];
    const sourceSection = newConfig[draggedItem.sectionIndex];
    const targetSection = newConfig[sectionIndex];
    
    const [movedItem] = sourceSection.items.splice(draggedItem.itemIndex, 1);
    targetSection.items.splice(itemIndex, 0, movedItem);
    
    setNavConfig(newConfig);
    setDraggedItem({ sectionIndex, itemIndex });
  };

  const startEditingSection = (index: number, currentName: string) => {
    setEditingSection(index);
    setEditValue(currentName);
  };

  const saveSection = (index: number) => {
    const newConfig = [...navConfig];
    newConfig[index].section = editValue;
    setNavConfig(newConfig);
    setEditingSection(null);
  };

  const startEditingItem = (sectionIndex: number, itemIndex: number, currentLabel: string, currentHref: string) => {
    const item = navConfig[sectionIndex].items[itemIndex];
    setEditingItem({ sectionIndex, itemIndex });
    setEditValue(currentLabel);
    setEditHref(currentHref);
    setEditPageTitle(item.pageTitle || '');
  };

  const saveItem = (sectionIndex: number, itemIndex: number) => {
    if (!editValue.trim() || !editHref.trim()) {
      setToast({ message: 'Le nom et l\'URL sont requis', type: 'error' });
      return;
    }

    const newConfig = [...navConfig];
    newConfig[sectionIndex].items[itemIndex].label = editValue;
    newConfig[sectionIndex].items[itemIndex].href = editHref;
    newConfig[sectionIndex].items[itemIndex].pageTitle = editPageTitle;
    setNavConfig(newConfig);
    setEditingItem(null);
    setToast({ message: 'Lien modifié !', type: 'success' });
  };

  const toggleSectionVisibility = (index: number) => {
    const newConfig = [...navConfig];
    newConfig[index].visible = !newConfig[index].visible;
    setNavConfig(newConfig);
  };

  const toggleSectionAdminOnly = (index: number) => {
    const newConfig = [...navConfig];
    newConfig[index].adminOnly = !newConfig[index].adminOnly;
    setNavConfig(newConfig);
  };

  const toggleItemVisibility = (sectionIndex: number, itemIndex: number) => {
    const newConfig = [...navConfig];
    newConfig[sectionIndex].items[itemIndex].visible = !newConfig[sectionIndex].items[itemIndex].visible;
    setNavConfig(newConfig);
  };

  const addSection = () => {
    if (!newSectionName.trim()) {
      setToast({ message: 'Veuillez entrer un nom de section', type: 'error' });
      return;
    }

    const newSection: NavSection = {
      section: newSectionName,
      visible: true,
      items: [
      { label: '/page.tsx', href: '/page.tsx', icon: 'File', visible: true },
      { label: '/profile', href: '/profile', icon: 'File', visible: true },
      { label: '/assets', href: '/assets', icon: 'File', visible: true },
      { label: '/licenses', href: '/licenses', icon: 'File', visible: true },]
    };

    setNavConfig([...navConfig, newSection]);
    setNewSectionName('');
    setShowAddSection(false);
    setToast({ message: 'Section ajoutée !', type: 'success' });
  };

  const addItem = (sectionIndex: number) => {
    if (!newItemLabel.trim() || !newItemHref.trim()) {
      setToast({ message: 'Veuillez remplir tous les champs', type: 'error' });
      return;
    }

    const newConfig = [...navConfig];
    newConfig[sectionIndex].items.push({
      label: newItemLabel,
      href: newItemHref,
      icon: 'LayoutDashboard',
      visible: true,
      pageTitle: newItemPageTitle
    });

    setNavConfig(newConfig);
    setNewItemLabel('');
    setNewItemHref('');
    setNewItemPageTitle('');
    setShowAddItem(null);
    setToast({ message: 'Lien ajouté !', type: 'success' });
  };

  const deleteSection = (sectionIndex: number) => {

    const newConfig = [...navConfig];
    newConfig.splice(sectionIndex, 1);
    setNavConfig(newConfig);
    setToast({ message: 'Section supprimée', type: 'info' });
    setConfirmModal(null);
  };

  const deleteItem = (sectionIndex: number, itemIndex: number) => {

    const newConfig = [...navConfig];
    newConfig[sectionIndex].items.splice(itemIndex, 1);
    setNavConfig(newConfig);
    setToast({ message: 'Lien supprimé', type: 'info' });
    setConfirmModal(null);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Éditeur de Navigation
        </h1>
        <p className="text-gray-600">
          Organisez et personnalisez la navigation du site avec drag & drop
        </p>
      </div>

      <div className="mb-6 flex gap-3">
        <button
          onClick={saveNavigation}
          disabled={saving}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Sauvegarde...' : 'Sauvegarder'}
        </button>
        <button
          onClick={() => setConfirmModal({ type: 'reset' })}
          className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 flex items-center gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          Réinitialiser
        </button>
        <button
          onClick={() => setShowAddSection(!showAddSection)}
          className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2 ml-auto"
        >
          <FolderPlus className="w-4 h-4" />
          Ajouter une Section
        </button>
      </div>

      {/* Formulaire d'ajout de section */}
      {showAddSection && (
        <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
          <h3 className="font-medium text-green-900 mb-3">Nouvelle Section</h3>
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Nom de la section (ex: MES OUTILS)"
              value={newSectionName}
              onChange={(e) => setNewSectionName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addSection()}
              className="flex-1 px-4 py-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              autoFocus
            />
            <button
              onClick={addSection}
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Ajouter
            </button>
            <button
              onClick={() => {
                setShowAddSection(false);
                setNewSectionName('');
              }}
              className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400"
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {navConfig.map((section, sectionIndex) => (
          <div
            key={sectionIndex}
            draggable
            onDragStart={(e) => handleSectionDragStart(e, sectionIndex)}
            onDragOver={(e) => handleSectionDragOver(e, sectionIndex)}
            onDragEnd={() => setDraggedSection(null)}
            className="bg-white rounded-lg shadow border border-gray-200"
          >
            {/* Section Header */}
            <div className="p-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between cursor-move">
              <div className="flex items-center gap-3 flex-1">
                <GripVertical className="w-5 h-5 text-gray-400" />
                
                {editingSection === sectionIndex ? (
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && saveSection(sectionIndex)}
                      className="flex-1 px-3 py-1 border border-gray-300 rounded"
                      autoFocus
                    />
                    <button
                      onClick={() => saveSection(sectionIndex)}
                      className="text-green-600 hover:text-green-700"
                    >
                      <Save className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <h2 className="text-lg font-semibold text-gray-900 flex-1">
                      {section.section}
                      {section.adminOnly && (
                        <span className="ml-2 px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded font-semibold">
                          ADMIN
                        </span>
                      )}
                    </h2>
                    <button
                      onClick={() => startEditingSection(sectionIndex, section.section)}
                      className="text-gray-600 hover:text-gray-900"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleSectionAdminOnly(sectionIndex)}
                  className={`px-3 py-1 rounded text-xs font-semibold ${
                    section.adminOnly 
                      ? 'bg-purple-100 text-purple-700 hover:bg-purple-200' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  title={section.adminOnly ? 'Retirer le badge ADMIN' : 'Marquer comme ADMIN uniquement'}
                >
                  {section.adminOnly ? 'ADMIN' : 'Tous'}
                </button>
                <button
                  onClick={() => toggleSectionVisibility(sectionIndex)}
                  className={`p-2 rounded ${section.visible ? 'text-green-600 hover:bg-green-50' : 'text-red-600 hover:bg-red-50'}`}
                  title={section.visible ? 'Section visible' : 'Section masquée'}
                >
                  {section.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => setConfirmModal({ type: 'deleteSection', data: sectionIndex })}
                  className="p-2 rounded text-red-600 hover:bg-red-50"
                  title="Supprimer la section"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => toggleSectionExpanded(sectionIndex)}
                  className="text-gray-600 hover:text-gray-900 p-2"
                >
                  {expandedSections.has(sectionIndex) ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Items */}
            {expandedSections.has(sectionIndex) && (
              <div className="p-2">
                {section.items.map((item, itemIndex) => (
                  <div
                    key={itemIndex}
                    draggable
                    onDragStart={(e) => handleItemDragStart(e, sectionIndex, itemIndex)}
                    onDragOver={(e) => handleItemDragOver(e, sectionIndex, itemIndex)}
                    onDragEnd={() => setDraggedItem(null)}
                    className="p-3 mb-2 bg-gray-50 rounded-lg flex items-center justify-between cursor-move hover:bg-gray-100"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <GripVertical className="w-4 h-4 text-gray-400" />
                      
                      {editingItem?.sectionIndex === sectionIndex && editingItem?.itemIndex === itemIndex ? (
                        <div className="flex flex-col gap-2 flex-1">
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              placeholder="Nom du lien"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              className="flex-1 px-3 py-1.5 border border-gray-300 rounded text-sm"
                              autoFocus
                            />
                            <button
                              onClick={() => saveItem(sectionIndex, itemIndex)}
                              className="text-green-600 hover:text-green-700"
                              title="Sauvegarder"
                            >
                              <Save className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setEditingItem(null);
                                setEditValue('');
                                setEditHref('');
                                setEditPageTitle('');
                              }}
                              className="text-gray-600 hover:text-gray-700"
                              title="Annuler"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          <input
                            type="text"
                            placeholder="URL (ex: /documents)"
                            value={editHref}
                            onChange={(e) => setEditHref(e.target.value)}
                            className="px-3 py-1.5 border border-gray-300 rounded text-sm"
                          />
                          <input
                            type="text"
                            placeholder="Titre de page (ex: Documents) - optionnel"
                            value={editPageTitle}
                            onChange={(e) => setEditPageTitle(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && saveItem(sectionIndex, itemIndex)}
                            className="px-3 py-1.5 border border-gray-300 rounded text-sm"
                          />
                        </div>
                      ) : (
                        <>
                          <span className="flex-1 text-gray-900">{item.label}</span>
                          <span className="text-xs text-gray-500">{item.href}</span>
                          <button
                            onClick={() => startEditingItem(sectionIndex, itemIndex, item.label, item.href)}
                            className="text-gray-600 hover:text-gray-900"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-1 ml-3">
                      <button
                        onClick={() => toggleItemVisibility(sectionIndex, itemIndex)}
                        className={`p-2 rounded ${item.visible ? 'text-green-600 hover:bg-green-50' : 'text-red-600 hover:bg-red-50'}`}
                        title={item.visible ? 'Item visible' : 'Item masqué'}
                      >
                        {item.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => setConfirmModal({ type: 'deleteItem', data: { sectionIndex, itemIndex } })}
                        className="p-2 rounded text-red-600 hover:bg-red-50"
                        title="Supprimer l'item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}

                {/* Bouton pour ajouter un item */}
                {showAddItem === sectionIndex ? (
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="font-medium text-blue-900 mb-2 text-sm">Nouveau Lien</h4>
                    <div className="space-y-2">
                      <input
                        type="text"
                        placeholder="Nom du lien (ex: Mes Documents)"
                        value={newItemLabel}
                        onChange={(e) => setNewItemLabel(e.target.value)}
                        className="w-full px-3 py-2 border border-blue-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        autoFocus
                      />
                      <input
                        type="text"
                        placeholder="URL (ex: /documents)"
                        value={newItemHref}
                        onChange={(e) => setNewItemHref(e.target.value)}
                        className="w-full px-3 py-2 border border-blue-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      />
                      <input
                        type="text"
                        placeholder="Titre de page (ex: Documents) - optionnel"
                        value={newItemPageTitle}
                        onChange={(e) => setNewItemPageTitle(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addItem(sectionIndex)}
                        className="w-full px-3 py-2 border border-blue-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => addItem(sectionIndex)}
                          className="bg-blue-600 text-white px-4 py-1.5 rounded hover:bg-blue-700 text-sm flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" />
                          Ajouter
                        </button>
                        <button
                          onClick={() => {
                            setShowAddItem(null);
                            setNewItemLabel('');
                            setNewItemHref('');
                          }}
                          className="bg-gray-300 text-gray-700 px-4 py-1.5 rounded hover:bg-gray-400 text-sm"
                        >
                          Annuler
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowAddItem(sectionIndex)}
                    className="w-full mt-2 p-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition flex items-center justify-center gap-2"
                  >
                    <Link className="w-4 h-4" />
                    Ajouter un lien
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-medium text-blue-900 mb-2">💡 Instructions</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Glissez-déposez les sections pour les réorganiser</li>
          <li>• Glissez-déposez les items entre les sections ou au sein d'une section</li>
          <li>• Cliquez sur l'icône crayon pour renommer une section ou un item</li>
          <li>• Utilisez l'icône œil pour masquer/afficher des éléments</li>
          <li>• Ajoutez de nouvelles sections avec le bouton "Ajouter une Section"</li>
          <li>• Ajoutez des liens dans chaque section avec "Ajouter un lien"</li>
          <li>• Supprimez des éléments avec l'icône corbeille</li>
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
      {confirmModal && (
        <ConfirmModal
          isOpen={!!confirmModal}
          onClose={() => setConfirmModal(null)}
          title={
            confirmModal.type === 'reset' ? 'Réinitialiser la navigation' :
            confirmModal.type === 'deleteSection' ? 'Supprimer la section' :
            'Supprimer le lien'
          }
          message={
            confirmModal.type === 'reset' ? 'Réinitialiser la navigation aux valeurs par défaut ?' :
            confirmModal.type === 'deleteSection' ? 'Supprimer cette section et tous ses éléments ?' :
            'Supprimer ce lien ?'
          }
          onConfirm={() => {
            if (confirmModal.type === 'reset') {
              resetNavigation();
            } else if (confirmModal.type === 'deleteSection') {
              deleteSection(confirmModal.data);
            } else if (confirmModal.type === 'deleteItem') {
              deleteItem(confirmModal.data.sectionIndex, confirmModal.data.itemIndex);
            }
          }}
        />
      )}
    </div>
  );
}