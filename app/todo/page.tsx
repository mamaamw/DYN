'use client';

import { useState, useEffect } from 'react';
import { CheckSquare, Calendar, Edit2, Trash2, Eye, FileText, Download, ChevronDown } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { exportData, prepareDataForExport, ExportFormat } from '@/lib/exportUtils';

interface Todo {
  id: number;
  contactId: number;
  customId: string | null;
  taskName: string;
  demandeur: string | null;
  generalReference: string | null;
  detailedReference: string | null;
  codename: string | null;
  accountType: string | null;
  accountNumber: string | null;
  tool: string | null;
  actionType: string | null;
  executionDate: string | null;
  result: string | null;
  log: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export default function TodoPage() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [filteredTodos, setFilteredTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showModal, setShowModal] = useState(false);
  const [selectedTodo, setSelectedTodo] = useState<Todo | null>(null);
  const [editingLogId, setEditingLogId] = useState<number | null>(null);
  const [editingLogValue, setEditingLogValue] = useState('');
  const [editingDateId, setEditingDateId] = useState<number | null>(null);
  const [editingDateValue, setEditingDateValue] = useState('');
  const [editingStatusId, setEditingStatusId] = useState<number | null>(null);
  const [editingStatusValue, setEditingStatusValue] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'grouped'>('grouped');
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    executionDate: '',
    log: '',
    status: 'pending'
  });

  useEffect(() => {
    loadTodos();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [todos, statusFilter]);

  const loadTodos = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/todos');
      if (res.ok) {
        const data = await res.json();
        setTodos(data.todos);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des todos:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...todos];

    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(todo => todo.status === statusFilter);
    }

    setFilteredTodos(filtered);
  };

  const handleEdit = (todo: Todo) => {
    setSelectedTodo(todo);
    setFormData({
      executionDate: todo.executionDate ? new Date(todo.executionDate).toISOString().split('T')[0] : '',
      log: todo.log || '',
      status: todo.status
    });
    setShowModal(true);
  };

  const handleInlineUpdate = async (todoId: number, field: string, value: string) => {
    try {
      const res = await fetch(`/api/todos/${todoId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value })
      });

      if (res.ok) {
        await loadTodos();
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
    }
  };

  const startEditingLog = (todoId: number, currentValue: string | null) => {
    setEditingLogId(todoId);
    setEditingLogValue(currentValue || '');
  };

  const saveLog = async (todoId: number) => {
    await handleInlineUpdate(todoId, 'log', editingLogValue);
    setEditingLogId(null);
    setEditingLogValue('');
  };

  const cancelEditingLog = () => {
    setEditingLogId(null);
    setEditingLogValue('');
  };

  const startEditingDate = (todoId: number, currentValue: string | null) => {
    setEditingDateId(todoId);
    setEditingDateValue(currentValue ? new Date(currentValue).toISOString().split('T')[0] : '');
  };

  const saveDate = async (todoId: number) => {
    await handleInlineUpdate(todoId, 'executionDate', editingDateValue);
    setEditingDateId(null);
    setEditingDateValue('');
  };

  const cancelEditingDate = () => {
    setEditingDateId(null);
    setEditingDateValue('');
  };

  const startEditingStatus = (todoId: number, currentValue: string) => {
    setEditingStatusId(todoId);
    setEditingStatusValue(currentValue);
  };

  const saveStatus = async (todoId: number) => {
    await handleInlineUpdate(todoId, 'status', editingStatusValue);
    setEditingStatusId(null);
    setEditingStatusValue('');
  };

  const cancelEditingStatus = () => {
    setEditingStatusId(null);
    setEditingStatusValue('');
  };

  const handleUpdate = async () => {
    if (!selectedTodo) return;

    try {
      const res = await fetch(`/api/todos/${selectedTodo.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        await loadTodos();
        setShowModal(false);
        setSelectedTodo(null);
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/todos/${id}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        await loadTodos();
        setDeleteConfirm(null);
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const getCompositeId = (todo: Todo) => {
    return todo.customId || `${todo.contactId}-${todo.id}-1`;
  };

  const groupedTodos = () => {
    const groups: { [taskName: string]: Todo[] } = {};
    filteredTodos.forEach(todo => {
      const taskName = todo.taskName || 'Sans tâche';
      if (!groups[taskName]) {
        groups[taskName] = [];
      }
      groups[taskName].push(todo);
    });
    return groups;
  };

  const handleExportAll = (format: ExportFormat) => {
    const cleanedData = prepareDataForExport(filteredTodos, ['userId', 'deletedAt']);
    exportData(cleanedData, format, 'todos-complet', { title: 'Liste complète des TODOs' });
    setShowExportMenu(false);
  };

  const handleExportGrouped = (format: ExportFormat) => {
    const groups = groupedTodos();
    const groupedData: any[] = [];
    
    Object.entries(groups).forEach(([taskName, todos]) => {
      // Ajouter un en-tête de groupe
      groupedData.push({
        id: '',
        taskName: `=== ${taskName} (${todos.length} éléments) ===`,
        demandeur: '',
        generalReference: '',
        detailedReference: '',
        codename: '',
        accountType: '',
        accountNumber: '',
        tool: '',
        actionType: '',
        executionDate: '',
        status: '',
        log: '',
        createdAt: '',
        updatedAt: ''
      });
      
      // Ajouter les todos du groupe
      todos.forEach(todo => {
        const { contactId, ...cleanTodo } = todo;
        groupedData.push(cleanTodo);
      });
      
      // Ajouter une ligne vide entre les groupes
      if (Object.keys(groups).indexOf(taskName) < Object.keys(groups).length - 1) {
        groupedData.push({
          id: '',
          taskName: '',
          demandeur: '',
          generalReference: '',
          detailedReference: '',
          codename: '',
          accountType: '',
          accountNumber: '',
          tool: '',
          actionType: '',
          executionDate: '',
          status: '',
          log: '',
          createdAt: '',
          updatedAt: ''
        });
      }
    });
    
    exportData(groupedData, format, 'todos-par-tache', { title: 'TODOs groupés par tâche' });
    setShowExportMenu(false);
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      todo: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400',
      failed: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400',
      cooldown: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400',
      'succes-court': 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400',
      'succes-long': 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400'
    };
    const labels = {
      todo: 'TODO',
      failed: 'Failed',
      cooldown: 'Cooldown',
      'succes-court': 'Succès court',
      'succes-long': 'Succès long'
    };
    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">TODOs</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Gestion des tâches validées
          </p>
        </div>
        <div className="relative">
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            disabled={filteredTodos.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            Exporter
            <ChevronDown className={`w-4 h-4 transition-transform ${showExportMenu ? 'rotate-180' : ''}`} />
          </button>

          {showExportMenu && (
            <>
              {/* Overlay pour fermer le menu */}
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setShowExportMenu(false)}
              />
              
              {/* Menu déroulant */}
              <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-gray-200 dark:border-slate-600 z-20 overflow-hidden">
                <div className="p-3 bg-gray-50 dark:bg-slate-700 border-b border-gray-200 dark:border-slate-600">
                  <p className="text-sm font-semibold text-gray-700 dark:text-slate-300">Options d'export</p>
                  <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                    {filteredTodos.length} enregistrement(s) • Vue: {viewMode === 'table' ? 'Tableau' : 'Groupée'}
                  </p>
                </div>
                
                <div className="py-2">
                  <div className="px-4 py-2 text-xs font-medium text-gray-500 dark:text-slate-400 uppercase border-b border-gray-100 dark:border-slate-600">
                    Export complet
                  </div>
                  
                  <button
                    onClick={() => handleExportAll('excel')}
                    className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    <Download className="w-4 h-4 text-green-600" />
                    <div className="text-left">
                      <p className="text-sm font-medium text-gray-900 dark:text-slate-200">Excel - Tous les TODOs</p>
                      <p className="text-xs text-gray-500 dark:text-slate-400">Liste complète dans l'ordre affiché</p>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => handleExportAll('csv')}
                    className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    <Download className="w-4 h-4 text-blue-600" />
                    <div className="text-left">
                      <p className="text-sm font-medium text-gray-900 dark:text-slate-200">CSV - Tous les TODOs</p>
                      <p className="text-xs text-gray-500 dark:text-slate-400">Format CSV standard</p>
                    </div>
                  </button>
                  
                  <div className="px-4 py-2 text-xs font-medium text-gray-500 dark:text-slate-400 uppercase border-b border-gray-100 dark:border-slate-600 mt-2">
                    Export groupé par tâche
                  </div>
                  
                  <button
                    onClick={() => handleExportGrouped('excel')}
                    className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    <CheckSquare className="w-4 h-4 text-purple-600" />
                    <div className="text-left">
                      <p className="text-sm font-medium text-gray-900 dark:text-slate-200">Excel - Groupé par tâches</p>
                      <p className="text-xs text-gray-500 dark:text-slate-400">Avec en-têtes de groupes et séparateurs</p>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => handleExportGrouped('csv')}
                    className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    <CheckSquare className="w-4 h-4 text-orange-600" />
                    <div className="text-left">
                      <p className="text-sm font-medium text-gray-900 dark:text-slate-200">CSV - Groupé par tâches</p>
                      <p className="text-xs text-gray-500 dark:text-slate-400">Organisé par sections de tâches</p>
                    </div>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 bg-slate-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
        >
          <option value="ALL">Tous les statuts</option>
          <option value="todo">TODO</option>
          <option value="failed">Failed</option>
          <option value="cooldown">Cooldown</option>
          <option value="succes-court">Succès court</option>
          <option value="succes-long">Succès long</option>
        </select>
        
        <select
          value={viewMode}
          onChange={(e) => setViewMode(e.target.value as 'table' | 'grouped')}
          className="px-4 py-2 bg-slate-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
        >
          <option value="table">Vue tableau</option>
          <option value="grouped">Vue groupée par tâches</option>
        </select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <CheckSquare className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Total</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{todos.length}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
              <Calendar className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">TODO</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {todos.filter(t => t.status === 'todo').length}
              </p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <FileText className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Failed</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {todos.filter(t => t.status === 'failed').length}
              </p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <CheckSquare className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-slate-600 dark:text-slate-400">Succès</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {todos.filter(t => t.status === 'succes-court' || t.status === 'succes-long').length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Content */}
      {loading ? (
        <Card>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </Card>
      ) : viewMode === 'table' ? (
        /* Table View */
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Tâche</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Demandeur</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Réf. Générale</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Codename</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Account</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Outil</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Action</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Date Exec.</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Statut</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Log</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-700">
                {filteredTodos.length === 0 ? (
                  <tr>
                    <td colSpan={13} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                      Aucun TODO trouvé
                    </td>
                  </tr>
                ) : (
                  filteredTodos.map((todo) => (
                    <tr key={todo.id} className="hover:bg-slate-50 dark:hover:bg-slate-800">
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-300">
                        {getCompositeId(todo)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-300">
                        {todo.taskName}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-300">
                        {todo.demandeur || '-'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-300">
                        {todo.generalReference || '-'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-300">
                        {todo.codename || '-'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-300">
                        {todo.accountType || '-'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-300">
                        {todo.accountNumber || '-'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-300">
                        {todo.tool || '-'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-300">
                        {todo.actionType || '-'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm">
                        {editingDateId === todo.id ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="date"
                              value={editingDateValue}
                              onChange={(e) => setEditingDateValue(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') saveDate(todo.id);
                                if (e.key === 'Escape') cancelEditingDate();
                              }}
                              className="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded text-slate-900 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              autoFocus
                            />
                            <button
                              onClick={() => saveDate(todo.id)}
                              className="p-1 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded"
                              title="Valider"
                            >
                              ✓
                            </button>
                            <button
                              onClick={cancelEditingDate}
                              className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"
                              title="Annuler"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <span
                            onClick={() => startEditingDate(todo.id, todo.executionDate)}
                            className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 px-2 py-1 rounded text-slate-900 dark:text-slate-300"
                            title="Cliquer pour modifier"
                          >
                            {todo.executionDate ? new Date(todo.executionDate).toLocaleDateString('fr-FR') : '-'}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        {editingStatusId === todo.id ? (
                          <div className="flex items-center gap-1">
                            <select
                              value={editingStatusValue}
                              onChange={(e) => setEditingStatusValue(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') saveStatus(todo.id);
                                if (e.key === 'Escape') cancelEditingStatus();
                              }}
                              className="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded text-slate-900 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              autoFocus
                            >
                              <option value="todo">TODO</option>
                              <option value="failed">Failed</option>
                              <option value="cooldown">Cooldown</option>
                              <option value="succes-court">Succès court</option>
                              <option value="succes-long">Succès long</option>
                            </select>
                            <button
                              onClick={() => saveStatus(todo.id)}
                              className="p-1 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded"
                              title="Valider"
                            >
                              ✓
                            </button>
                            <button
                              onClick={cancelEditingStatus}
                              className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"
                              title="Annuler"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <span
                            onClick={() => startEditingStatus(todo.id, todo.status)}
                            className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 px-2 py-1 rounded text-slate-900 dark:text-slate-300"
                            title="Cliquer pour modifier"
                          >
                            {todo.status.toUpperCase()}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm">
                        {editingLogId === todo.id ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="text"
                              value={editingLogValue}
                              onChange={(e) => setEditingLogValue(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') saveLog(todo.id);
                                if (e.key === 'Escape') cancelEditingLog();
                              }}
                              className="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded text-slate-900 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 w-40"
                              autoFocus
                            />
                            <button
                              onClick={() => saveLog(todo.id)}
                              className="p-1 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded"
                              title="Valider"
                            >
                              ✓
                            </button>
                            <button
                              onClick={cancelEditingLog}
                              className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"
                              title="Annuler"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <span
                            onClick={() => startEditingLog(todo.id, todo.log)}
                            className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 px-2 py-1 rounded text-slate-900 dark:text-slate-300"
                            title="Cliquer pour modifier"
                          >
                            {todo.log || '-'}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(todo)}
                            className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition"
                            title="Modifier"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(todo.id)}
                            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition"
                            title="Supprimer"
                          >
                            <Trash2 size={18} />
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
      ) : (
        /* Grouped View */
        <div className="space-y-6">
          {Object.entries(groupedTodos()).map(([taskName, todos]) => (
            <Card key={taskName}>
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <CheckSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  {taskName}
                  <span className="text-sm text-slate-500 dark:text-slate-400">
                    ({todos.length} élément{todos.length > 1 ? 's' : ''})
                  </span>
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">ID</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Demandeur</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Réf. Générale</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Codename</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Account</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Outil</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Action</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Date Exec.</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Statut</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Log</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-700">
                    {todos.map((todo) => (
                      <tr key={todo.id} className="hover:bg-slate-50 dark:hover:bg-slate-800">
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-300">
                          {getCompositeId(todo)}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-300">
                          {todo.demandeur || '-'}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-300">
                          {todo.generalReference || '-'}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-300">
                          {todo.codename || '-'}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-300">
                          {todo.accountType || '-'}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-300">
                          {todo.accountNumber || '-'}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-300">
                          {todo.tool || '-'}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-300">
                          {todo.actionType || '-'}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm">
                          {editingDateId === todo.id ? (
                            <div className="flex items-center gap-1">
                              <input
                                type="date"
                                value={editingDateValue}
                                onChange={(e) => setEditingDateValue(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') saveDate(todo.id);
                                  if (e.key === 'Escape') cancelEditingDate();
                                }}
                                className="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded text-slate-900 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                autoFocus
                              />
                              <button
                                onClick={() => saveDate(todo.id)}
                                className="p-1 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded"
                                title="Valider"
                              >
                                ✓
                              </button>
                              <button
                                onClick={cancelEditingDate}
                                className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"
                                title="Annuler"
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <span
                              onClick={() => startEditingDate(todo.id, todo.executionDate)}
                              className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 px-2 py-1 rounded text-slate-900 dark:text-slate-300"
                              title="Cliquer pour modifier"
                            >
                              {todo.executionDate ? new Date(todo.executionDate).toLocaleDateString('fr-FR') : '-'}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          {editingStatusId === todo.id ? (
                            <div className="flex items-center gap-1">
                              <select
                                value={editingStatusValue}
                                onChange={(e) => setEditingStatusValue(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') saveStatus(todo.id);
                                  if (e.key === 'Escape') cancelEditingStatus();
                                }}
                                className="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded text-slate-900 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                autoFocus
                              >
                                <option value="todo">TODO</option>
                                <option value="failed">Failed</option>
                                <option value="cooldown">Cooldown</option>
                                <option value="succes-court">Succès court</option>
                                <option value="succes-long">Succès long</option>
                              </select>
                              <button
                                onClick={() => saveStatus(todo.id)}
                                className="p-1 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded"
                                title="Valider"
                              >
                                ✓
                              </button>
                              <button
                                onClick={cancelEditingStatus}
                                className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"
                                title="Annuler"
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <span
                              onClick={() => startEditingStatus(todo.id, todo.status)}
                              className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 px-2 py-1 rounded text-slate-900 dark:text-slate-300"
                              title="Cliquer pour modifier"
                            >
                              {todo.status.toUpperCase()}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm">
                          {editingLogId === todo.id ? (
                            <div className="flex items-center gap-1">
                              <input
                                type="text"
                                value={editingLogValue}
                                onChange={(e) => setEditingLogValue(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') saveLog(todo.id);
                                  if (e.key === 'Escape') cancelEditingLog();
                                }}
                                className="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded text-slate-900 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 w-40"
                                autoFocus
                              />
                              <button
                                onClick={() => saveLog(todo.id)}
                                className="p-1 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded"
                                title="Valider"
                              >
                                ✓
                              </button>
                              <button
                                onClick={cancelEditingLog}
                                className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"
                                title="Annuler"
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <span
                              onClick={() => startEditingLog(todo.id, todo.log)}
                              className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 px-2 py-1 rounded text-slate-900 dark:text-slate-300"
                              title="Cliquer pour modifier"
                            >
                              {todo.log || '-'}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEdit(todo)}
                              className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition"
                              title="Modifier"
                            >
                              <Edit2 size={18} />
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(todo.id)}
                              className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition"
                              title="Supprimer"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          ))}
          {filteredTodos.length === 0 && (
            <Card>
              <div className="text-center py-8">
                <p className="text-slate-500 dark:text-slate-400">Aucun TODO trouvé</p>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Modal */}
      {showModal && selectedTodo && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 w-full max-w-2xl">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
              Modifier TODO - {selectedTodo.taskName}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Date d'exécution
                </label>
                <input
                  type="date"
                  value={formData.executionDate}
                  onChange={(e) => setFormData({ ...formData, executionDate: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Statut
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                >
                  <option value="todo">TODO</option>
                  <option value="failed">Failed</option>
                  <option value="cooldown">Cooldown</option>
                  <option value="succes-court">Succès court</option>
                  <option value="succes-long">Succès long</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Log
                </label>
                <textarea
                  value={formData.log}
                  onChange={(e) => setFormData({ ...formData, log: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600"
              >
                Annuler
              </button>
              <button
                onClick={handleUpdate}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      {deleteConfirm !== null && (
        <ConfirmModal
          isOpen={deleteConfirm !== null}
          onClose={() => setDeleteConfirm(null)}
          title="Supprimer le todo"
          message="Êtes-vous sûr de vouloir supprimer ce todo ?"
          onConfirm={() => handleDelete(deleteConfirm)}
        />
      )}
    </div>
  );
}
