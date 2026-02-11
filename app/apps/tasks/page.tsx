'use client';

import { useState, useEffect } from 'react';
import { CheckSquare, Plus, X, Calendar, Tag, Search, Filter, Trash2, Edit2 } from 'lucide-react';
import ExportButton from '@/components/ExportButton';

interface Task {
  id: number;
  title: string;
  description: string | null;
  status: string;
  action?: string;
  toolsActions?: string; // JSON: { actions: string[], tools: string[] }
  priority: string;
  dueDate: string | null;
  tags: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ToolsActions {
  actions: string[]; // ['tester', 'faire']
  tools: string[];   // ['obtu', 'aigu', 'both']
}

type ToastType = 'success' | 'error' | 'info';

function Toast({ message, type, onClose }: { message: string; type: ToastType; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = type === 'success' ? 'bg-green-600' : type === 'error' ? 'bg-red-600' : 'bg-blue-600';

  return (
    <div className={`fixed top-4 right-4 ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-3`}>
      <span>{message}</span>
      <button onClick={onClose} className="hover:bg-white/20 rounded p-1">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<number | null>(null);
  const [draggedTask, setDraggedTask] = useState<number | null>(null);
  
  // Form
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'OBTU',
    action: 'TESTER',
    priority: 'MEDIUM',
    dueDate: '',
    tags: [] as string[],
    toolsActions: {
      actions: [] as string[],
      tools: [] as string[],
    } as ToolsActions,
  });
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    loadTasks();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [tasks, statusFilter, priorityFilter, searchQuery]);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/tasks');
      if (res.ok) {
        const data = await res.json();
        setTasks(data.tasks);
      } else {
        setToast({ message: 'Erreur lors du chargement des tâches', type: 'error' });
      }
    } catch (error) {
      setToast({ message: 'Erreur réseau', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...tasks];

    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(task => task.status === statusFilter);
    }

    if (priorityFilter !== 'ALL') {
      filtered = filtered.filter(task => task.priority === priorityFilter);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(task =>
        task.title.toLowerCase().includes(query) ||
        task.description?.toLowerCase().includes(query)
      );
    }

    setFilteredTasks(filtered);
  };

  const handleCreateTask = async () => {
    if (!formData.title.trim()) {
      setToast({ message: 'Le titre est requis', type: 'error' });
      return;
    }

    try {
      const taskData = {
        ...formData,
        toolsActions: JSON.stringify(formData.toolsActions),
        tags: JSON.stringify(formData.tags),
      };

      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData)
      });

      if (res.ok) {
        setToast({ message: 'Tâche créée avec succès', type: 'success' });
        setShowModal(false);
        resetForm();
        await loadTasks();
      } else {
        setToast({ message: 'Erreur lors de la création', type: 'error' });
      }
    } catch (error) {
      setToast({ message: 'Erreur réseau', type: 'error' });
    }
  };

  const handleUpdateTask = async () => {
    if (!editingTask) return;
    
    try {
      const taskData = {
        ...formData,
        toolsActions: JSON.stringify(formData.toolsActions),
        tags: JSON.stringify(formData.tags),
      };

      const res = await fetch(`/api/tasks/${editingTask.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData)
      });

      if (res.ok) {
        setToast({ message: 'Tâche mise à jour', type: 'success' });
        setShowModal(false);
        setEditingTask(null);
        resetForm();
        await loadTasks();
      } else {
        setToast({ message: 'Erreur lors de la mise à jour', type: 'error' });
      }
    } catch (error) {
      setToast({ message: 'Erreur réseau', type: 'error' });
    }
  };

  const handleDeleteTask = (taskId: number) => {
    setTaskToDelete(taskId);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!taskToDelete) return;

    try {
      const res = await fetch(`/api/tasks/${taskToDelete}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        setToast({ message: 'Tâche supprimée', type: 'success' });
        await loadTasks();
      } else {
        setToast({ message: 'Erreur lors de la suppression', type: 'error' });
      }
    } catch (error) {
      setToast({ message: 'Erreur réseau', type: 'error' });
    } finally {
      setShowDeleteModal(false);
      setTaskToDelete(null);
    }
  };

  const handleQuickStatusChange = async (taskId: number, newStatus: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (res.ok) {
        await loadTasks();
      }
    } catch (error) {
      setToast({ message: 'Erreur lors de la mise à jour', type: 'error' });
    }
  };

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    const taskToolsActions = task.toolsActions ? JSON.parse(task.toolsActions) : {
      actions: [],
      tools: [],
    };
    setFormData({
      title: task.title,
      description: task.description || '',
      status: task.status,
      action: task.action || 'TESTER',
      priority: task.priority,
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
      tags: task.tags ? JSON.parse(task.tags) : [],
      toolsActions: taskToolsActions,
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      status: 'OBTU',
      action: 'TESTER',
      priority: 'MEDIUM',
      dueDate: '',
      tags: [],
      toolsActions: {
        actions: [],
        tools: [],
      },
    });
    setTagInput('');
    setEditingTask(null);
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({ ...formData, tags: [...formData.tags, tagInput.trim()] });
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(tag => tag !== tagToRemove)
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'text-red-400 bg-red-600/20';
      case 'HIGH': return 'text-orange-400 bg-orange-600/20';
      case 'MEDIUM': return 'text-yellow-400 bg-yellow-600/20';
      case 'LOW': return 'text-green-400 bg-green-600/20';
      default: return 'text-gray-400 bg-gray-600/20';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OBTU': return 'bg-purple-600';
      case 'AIGU': return 'bg-blue-600';
      case 'BOTH': return 'bg-green-600';
      default: return 'bg-gray-600';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'OBTU': return 'Obtu';
      case 'AIGU': return 'Aigu';
      case 'BOTH': return 'Les deux';
      default: return status;
    }
  };

  const getActionLabel = (action?: string) => {
    switch (action) {
      case 'TESTER': return 'Tester';
      case 'FAIRE': return 'Faire';
      case 'BOTH': return 'Les deux';
      default: return action || 'Non défini';
    }
  };

  const getActionColor = (action?: string) => {
    switch (action) {
      case 'TESTER': return 'text-purple-400 bg-purple-600/20';
      case 'FAIRE': return 'text-blue-400 bg-blue-600/20';
      case 'BOTH': return 'text-green-400 bg-green-600/20';
      default: return 'text-gray-400 bg-gray-600/20';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'Urgent';
      case 'HIGH': return 'Haute';
      case 'MEDIUM': return 'Moyenne';
      case 'LOW': return 'Basse';
      default: return priority;
    }
  };

  const handleDragStart = (taskId: number) => {
    setDraggedTask(taskId);
  };

  const handleDragEnd = () => {
    setDraggedTask(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (newStatus: string) => {
    if (!draggedTask) return;

    try {
      const res = await fetch(`/api/tasks/${draggedTask}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (res.ok) {
        await loadTasks();
      }
    } catch (error) {
      setToast({ message: 'Erreur lors de la mise à jour', type: 'error' });
    } finally {
      setDraggedTask(null);
    }
  };

  const groupedTasks: Record<string, Task[]> = {
    'none-none': filteredTasks.filter(t => 
      (!t.toolsActions || !JSON.parse(t.toolsActions || '{"tools":[],"actions":[]}').tools.length) &&
      (!t.toolsActions || !JSON.parse(t.toolsActions || '{"tools":[],"actions":[]}').actions.length)
    ),
    'none-tester': filteredTasks.filter(t => {
      const ta = JSON.parse(t.toolsActions || '{"tools":[],"actions":[]}');
      return !ta.tools.length && ta.actions.includes('tester') && !ta.actions.includes('faire');
    }),
    'none-faire': filteredTasks.filter(t => {
      const ta = JSON.parse(t.toolsActions || '{"tools":[],"actions":[]}');
      return !ta.tools.length && ta.actions.includes('faire') && !ta.actions.includes('tester');
    }),
    'none-both': filteredTasks.filter(t => {
      const ta = JSON.parse(t.toolsActions || '{"tools":[],"actions":[]}');
      return !ta.tools.length && ta.actions.includes('tester') && ta.actions.includes('faire');
    }),
    'obtu-none': filteredTasks.filter(t => {
      const ta = JSON.parse(t.toolsActions || '{"tools":[],"actions":[]}');
      return ta.tools.includes('obtu') && !ta.tools.includes('aigu') && !ta.tools.includes('both') && !ta.actions.length;
    }),
    'obtu-tester': filteredTasks.filter(t => {
      const ta = JSON.parse(t.toolsActions || '{"tools":[],"actions":[]}');
      return ta.tools.includes('obtu') && !ta.tools.includes('aigu') && !ta.tools.includes('both') && 
             ta.actions.includes('tester') && !ta.actions.includes('faire');
    }),
    'obtu-faire': filteredTasks.filter(t => {
      const ta = JSON.parse(t.toolsActions || '{"tools":[],"actions":[]}');
      return ta.tools.includes('obtu') && !ta.tools.includes('aigu') && !ta.tools.includes('both') && 
             ta.actions.includes('faire') && !ta.actions.includes('tester');
    }),
    'obtu-both': filteredTasks.filter(t => {
      const ta = JSON.parse(t.toolsActions || '{"tools":[],"actions":[]}');
      return ta.tools.includes('obtu') && !ta.tools.includes('aigu') && !ta.tools.includes('both') && 
             ta.actions.includes('tester') && ta.actions.includes('faire');
    }),
    'aigu-none': filteredTasks.filter(t => {
      const ta = JSON.parse(t.toolsActions || '{"tools":[],"actions":[]}');
      return ta.tools.includes('aigu') && !ta.tools.includes('obtu') && !ta.tools.includes('both') && !ta.actions.length;
    }),
    'aigu-tester': filteredTasks.filter(t => {
      const ta = JSON.parse(t.toolsActions || '{"tools":[],"actions":[]}');
      return ta.tools.includes('aigu') && !ta.tools.includes('obtu') && !ta.tools.includes('both') && 
             ta.actions.includes('tester') && !ta.actions.includes('faire');
    }),
    'aigu-faire': filteredTasks.filter(t => {
      const ta = JSON.parse(t.toolsActions || '{"tools":[],"actions":[]}');
      return ta.tools.includes('aigu') && !ta.tools.includes('obtu') && !ta.tools.includes('both') && 
             ta.actions.includes('faire') && !ta.actions.includes('tester');
    }),
    'aigu-both': filteredTasks.filter(t => {
      const ta = JSON.parse(t.toolsActions || '{"tools":[],"actions":[]}');
      return ta.tools.includes('aigu') && !ta.tools.includes('obtu') && !ta.tools.includes('both') && 
             ta.actions.includes('tester') && ta.actions.includes('faire');
    }),
    'both-none': filteredTasks.filter(t => {
      const ta = JSON.parse(t.toolsActions || '{"tools":[],"actions":[]}');
      return (ta.tools.includes('obtu') && ta.tools.includes('aigu')) || ta.tools.includes('both') && !ta.actions.length;
    }),
    'both-tester': filteredTasks.filter(t => {
      const ta = JSON.parse(t.toolsActions || '{"tools":[],"actions":[]}');
      return ((ta.tools.includes('obtu') && ta.tools.includes('aigu')) || ta.tools.includes('both')) && 
             ta.actions.includes('tester') && !ta.actions.includes('faire');
    }),
    'both-faire': filteredTasks.filter(t => {
      const ta = JSON.parse(t.toolsActions || '{"tools":[],"actions":[]}');
      return ((ta.tools.includes('obtu') && ta.tools.includes('aigu')) || ta.tools.includes('both')) && 
             ta.actions.includes('faire') && !ta.actions.includes('tester');
    }),
    'both-both': filteredTasks.filter(t => {
      const ta = JSON.parse(t.toolsActions || '{"tools":[],"actions":[]}');
      return ((ta.tools.includes('obtu') && ta.tools.includes('aigu')) || ta.tools.includes('both')) && 
             ta.actions.includes('tester') && ta.actions.includes('faire');
    })
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <CheckSquare className="w-8 h-8 text-blue-400" />
            <h1 className="text-3xl font-bold">Tâches</h1>
          </div>

          <div className="flex items-center gap-3">
            <ExportButton 
              data={filteredTasks} 
              filename="taches" 
              title="Liste des Tâches"
              excludeFields={['userId']}
            />
            <button
              onClick={() => { setShowModal(true); resetForm(); }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Nouvelle tâche
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher..."
              className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 bg-slate-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">Tous les outils</option>
            <option value="OBTU">Obtu</option>
            <option value="AIGU">Aigu</option>
            <option value="BOTH">Les deux</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-4 py-2 bg-slate-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">Toutes les priorités</option>
            <option value="URGENT">Urgent</option>
            <option value="HIGH">Haute</option>
            <option value="MEDIUM">Moyenne</option>
            <option value="LOW">Basse</option>
          </select>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-slate-800 rounded-lg p-4 border border-gray-700">
            <p className="text-sm text-gray-400 mb-1">Total</p>
            <p className="text-2xl font-bold text-white">{filteredTasks.length}</p>
          </div>
          <div className="bg-slate-800 rounded-lg p-4 border border-gray-700">
            <p className="text-sm text-gray-400 mb-1">Outil 1</p>
            <p className="text-2xl font-bold text-purple-400">
              {(groupedTasks['obtu-none']?.length || 0) + (groupedTasks['obtu-tester']?.length || 0) + (groupedTasks['obtu-faire']?.length || 0) + (groupedTasks['obtu-both']?.length || 0)}
            </p>
          </div>
          <div className="bg-slate-800 rounded-lg p-4 border border-gray-700">
            <p className="text-sm text-gray-400 mb-1">Outil 2</p>
            <p className="text-2xl font-bold text-blue-400">
              {(groupedTasks['aigu-none']?.length || 0) + (groupedTasks['aigu-tester']?.length || 0) + (groupedTasks['aigu-faire']?.length || 0) + (groupedTasks['aigu-both']?.length || 0)}
            </p>
          </div>
          <div className="bg-slate-800 rounded-lg p-4 border border-gray-700">
            <p className="text-sm text-gray-400 mb-1">Les deux</p>
            <p className="text-2xl font-bold text-green-400">
              {(groupedTasks['both-none']?.length || 0) + (groupedTasks['both-tester']?.length || 0) + (groupedTasks['both-faire']?.length || 0) + (groupedTasks['both-both']?.length || 0)}
            </p>
          </div>
        </div>

        {/* Tasks Grid - Vue classique 3 colonnes */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-400">Chargement...</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Outil 1 */}
            <div className="bg-slate-800 rounded-lg border border-gray-700 p-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-purple-600"></div>
                <h2 className="font-semibold">Outil 1</h2>
                <span className="ml-auto text-sm text-gray-400">
                  {(groupedTasks['obtu-none']?.length || 0) + (groupedTasks['obtu-tester']?.length || 0) + (groupedTasks['obtu-faire']?.length || 0) + (groupedTasks['obtu-both']?.length || 0)}
                </span>
              </div>
              
              <div className="space-y-3 min-h-[200px]">
                {[...groupedTasks['obtu-none'], ...groupedTasks['obtu-tester'], ...groupedTasks['obtu-faire'], ...groupedTasks['obtu-both']].map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onEdit={openEditModal}
                    onDelete={handleDeleteTask}
                    onStatusChange={handleQuickStatusChange}
                    getPriorityColor={getPriorityColor}
                    getPriorityLabel={getPriorityLabel}
                    getActionColor={getActionColor}
                    getActionLabel={getActionLabel}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    isDragging={draggedTask === task.id}
                  />
                ))}
                {((groupedTasks['obtu-none']?.length || 0) + (groupedTasks['obtu-tester']?.length || 0) + (groupedTasks['obtu-faire']?.length || 0) + (groupedTasks['obtu-both']?.length || 0)) === 0 && (
                  <p className="text-sm text-gray-500 text-center py-8">Aucune tâche</p>
                )}
              </div>
            </div>

            {/* Outil 2 */}
            <div className="bg-slate-800 rounded-lg border border-gray-700 p-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-blue-600"></div>
                <h2 className="font-semibold">Outil 2</h2>
                <span className="ml-auto text-sm text-gray-400">
                  {(groupedTasks['aigu-none']?.length || 0) + (groupedTasks['aigu-tester']?.length || 0) + (groupedTasks['aigu-faire']?.length || 0) + (groupedTasks['aigu-both']?.length || 0)}
                </span>
              </div>
              
              <div className="space-y-3 min-h-[200px]">
                {[...groupedTasks['aigu-none'], ...groupedTasks['aigu-tester'], ...groupedTasks['aigu-faire'], ...groupedTasks['aigu-both']].map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onEdit={openEditModal}
                    onDelete={handleDeleteTask}
                    onStatusChange={handleQuickStatusChange}
                    getPriorityColor={getPriorityColor}
                    getPriorityLabel={getPriorityLabel}
                    getActionColor={getActionColor}
                    getActionLabel={getActionLabel}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    isDragging={draggedTask === task.id}
                  />
                ))}
                {((groupedTasks['aigu-none']?.length || 0) + (groupedTasks['aigu-tester']?.length || 0) + (groupedTasks['aigu-faire']?.length || 0) + (groupedTasks['aigu-both']?.length || 0)) === 0 && (
                  <p className="text-sm text-gray-500 text-center py-8">Aucune tâche</p>
                )}
              </div>
            </div>

            {/* Les deux */}
            <div className="bg-slate-800 rounded-lg border border-gray-700 p-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-green-600"></div>
                <h2 className="font-semibold">Les deux</h2>
                <span className="ml-auto text-sm text-gray-400">
                  {(groupedTasks['both-none']?.length || 0) + (groupedTasks['both-tester']?.length || 0) + (groupedTasks['both-faire']?.length || 0) + (groupedTasks['both-both']?.length || 0)}
                </span>
              </div>
              
              <div className="space-y-3 min-h-[200px]">
                {[...groupedTasks['both-none'], ...groupedTasks['both-tester'], ...groupedTasks['both-faire'], ...groupedTasks['both-both']].map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onEdit={openEditModal}
                    onDelete={handleDeleteTask}
                    onStatusChange={handleQuickStatusChange}
                    getPriorityColor={getPriorityColor}
                    getPriorityLabel={getPriorityLabel}
                    getActionColor={getActionColor}
                    getActionLabel={getActionLabel}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    isDragging={draggedTask === task.id}
                  />
                ))}
                {((groupedTasks['both-none']?.length || 0) + (groupedTasks['both-tester']?.length || 0) + (groupedTasks['both-faire']?.length || 0) + (groupedTasks['both-both']?.length || 0)) === 0 && (
                  <p className="text-sm text-gray-500 text-center py-8">Aucune tâche</p>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Kanban Matrix 4x4 */}
        {!loading && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold mb-4">Matrice Kanban</h2>
            <div className="overflow-x-auto">
              <div className="inline-block min-w-full">
                <div className="grid grid-cols-5 gap-2">
                  {/* Header Row */}
                  <div className="bg-slate-800/50 p-2"></div>
                  <div className="bg-slate-800/50 rounded-t-lg p-3 text-center font-semibold text-gray-400">Aucun</div>
                  <div className="bg-slate-800/50 rounded-t-lg p-3 text-center font-semibold text-purple-400">Outil 1</div>
                  <div className="bg-slate-800/50 rounded-t-lg p-3 text-center font-semibold text-blue-400">Outil 2</div>
                  <div className="bg-slate-800/50 rounded-t-lg p-3 text-center font-semibold text-green-400">Les deux</div>

                  {/* Row: Aucun */}
                  <div className="bg-slate-800/50 rounded-l-lg p-3 flex items-center justify-center font-semibold text-gray-400">Aucun</div>
                  {['none-none', 'obtu-none', 'aigu-none', 'both-none'].map(key => (
                    <div key={key} className="bg-slate-800 rounded-lg border border-gray-700 p-3 min-h-[150px]">
                      <div className="text-xs text-gray-500 mb-2">{groupedTasks[key]?.length || 0}</div>
                      <div className="space-y-2">
                        {(groupedTasks[key] || []).slice(0, 3).map(task => (
                          <div key={task.id} className="bg-slate-700/50 p-2 rounded text-xs cursor-pointer hover:bg-slate-700" onClick={() => openEditModal(task)}>
                            <div className="font-medium truncate">{task.title}</div>
                          </div>
                        ))}
                        {(groupedTasks[key]?.length || 0) > 3 && (
                          <div className="text-xs text-gray-500 text-center">+{(groupedTasks[key]?.length || 0) - 3} plus</div>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Row: Tester */}
                  <div className="bg-slate-800/50 rounded-l-lg p-3 flex items-center justify-center font-semibold text-cyan-400">Tester</div>
                  {['none-tester', 'obtu-tester', 'aigu-tester', 'both-tester'].map(key => (
                    <div key={key} className="bg-slate-800 rounded-lg border border-gray-700 p-3 min-h-[150px]">
                      <div className="text-xs text-gray-500 mb-2">{groupedTasks[key]?.length || 0}</div>
                      <div className="space-y-2">
                        {(groupedTasks[key] || []).slice(0, 3).map(task => (
                          <div key={task.id} className="bg-slate-700/50 p-2 rounded text-xs cursor-pointer hover:bg-slate-700" onClick={() => openEditModal(task)}>
                            <div className="font-medium truncate">{task.title}</div>
                          </div>
                        ))}
                        {(groupedTasks[key]?.length || 0) > 3 && (
                          <div className="text-xs text-gray-500 text-center">+{(groupedTasks[key]?.length || 0) - 3} plus</div>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Row: Faire */}
                  <div className="bg-slate-800/50 rounded-l-lg p-3 flex items-center justify-center font-semibold text-amber-400">Faire</div>
                  {['none-faire', 'obtu-faire', 'aigu-faire', 'both-faire'].map(key => (
                    <div key={key} className="bg-slate-800 rounded-lg border border-gray-700 p-3 min-h-[150px]">
                      <div className="text-xs text-gray-500 mb-2">{groupedTasks[key]?.length || 0}</div>
                      <div className="space-y-2">
                        {(groupedTasks[key] || []).slice(0, 3).map(task => (
                          <div key={task.id} className="bg-slate-700/50 p-2 rounded text-xs cursor-pointer hover:bg-slate-700" onClick={() => openEditModal(task)}>
                            <div className="font-medium truncate">{task.title}</div>
                          </div>
                        ))}
                        {(groupedTasks[key]?.length || 0) > 3 && (
                          <div className="text-xs text-gray-500 text-center">+{(groupedTasks[key]?.length || 0) - 3} plus</div>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Row: Les deux */}
                  <div className="bg-slate-800/50 rounded-l-lg p-3 flex items-center justify-center font-semibold text-emerald-400">Les deux</div>
                  {['none-both', 'obtu-both', 'aigu-both', 'both-both'].map(key => (
                    <div key={key} className="bg-slate-800 rounded-lg border border-gray-700 p-3 min-h-[150px]">
                      <div className="text-xs text-gray-500 mb-2">{groupedTasks[key]?.length || 0}</div>
                      <div className="space-y-2">
                        {(groupedTasks[key] || []).slice(0, 3).map(task => (
                          <div key={task.id} className="bg-slate-700/50 p-2 rounded text-xs cursor-pointer hover:bg-slate-700" onClick={() => openEditModal(task)}>
                            <div className="font-medium truncate">{task.title}</div>
                          </div>
                        ))}
                        {(groupedTasks[key]?.length || 0) > 3 && (
                          <div className="text-xs text-gray-500 text-center">+{(groupedTasks[key]?.length || 0) - 3} plus</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal Create/Edit */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
          <div className="bg-slate-800 rounded-lg max-w-2xl w-full border border-gray-700 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-700 flex items-center justify-between sticky top-0 bg-slate-800">
              <h2 className="text-xl font-semibold">
                {editingTask ? 'Modifier la tâche' : 'Nouvelle tâche'}
              </h2>
              <button
                onClick={() => { setShowModal(false); resetForm(); }}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium mb-2">Titre *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Titre de la tâche..."
                  className="w-full px-4 py-2 bg-slate-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Description de la tâche..."
                  rows={4}
                  className="w-full px-4 py-2 bg-slate-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Outils & Actions */}
              <div>
                <label className="block text-sm font-medium mb-3">Outils & Actions</label>
                <div className="bg-slate-700/50 rounded-lg p-4 overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr>
                        <th className="border border-gray-600 px-4 py-2 text-center font-semibold" colSpan={6}>Outil</th>
                      </tr>
                      <tr>
                        <th className="border border-gray-600 px-4 py-2 text-center text-purple-400 font-medium" colSpan={2}>Outil 1</th>
                        <th className="border border-gray-600 px-4 py-2 text-center text-blue-400 font-medium" colSpan={2}>Outil 2</th>
                        <th className="border border-gray-600 px-4 py-2 text-center text-green-400 font-medium" colSpan={2}>Outil 3</th>
                      </tr>
                      <tr>
                        <th className="border border-gray-600 px-3 py-2 text-center text-sm">Tester</th>
                        <th className="border border-gray-600 px-3 py-2 text-center text-sm">Faire</th>
                        <th className="border border-gray-600 px-3 py-2 text-center text-sm">Tester</th>
                        <th className="border border-gray-600 px-3 py-2 text-center text-sm">Faire</th>
                        <th className="border border-gray-600 px-3 py-2 text-center text-sm">Tester</th>
                        <th className="border border-gray-600 px-3 py-2 text-center text-sm">Faire</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-gray-600 px-3 py-3 text-center">
                          <input
                            type="checkbox"
                            checked={formData.toolsActions.actions.includes('tester') && formData.toolsActions.tools.includes('obtu')}
                            onChange={(e) => {
                              const newActions = [...formData.toolsActions.actions];
                              const newTools = [...formData.toolsActions.tools];
                              
                              if (e.target.checked) {
                                if (!newActions.includes('tester')) newActions.push('tester');
                                if (!newTools.includes('obtu')) newTools.push('obtu');
                              } else {
                                const obtuFaire = formData.toolsActions.actions.includes('faire') && formData.toolsActions.tools.includes('obtu');
                                if (!obtuFaire) {
                                  const index = newTools.indexOf('obtu');
                                  if (index > -1) newTools.splice(index, 1);
                                }
                                const obtuTester = newActions.filter((a, i) => {
                                  return (a === 'tester' && newTools.some(t => t !== 'obtu'));
                                }).length > 0;
                                if (!obtuTester && !newTools.includes('aigu') && !newTools.includes('both')) {
                                  const index = newActions.indexOf('tester');
                                  if (index > -1) newActions.splice(index, 1);
                                }
                              }
                              
                              setFormData({
                                ...formData,
                                toolsActions: { actions: newActions, tools: newTools }
                              });
                            }}
                            className="w-5 h-5 rounded border-gray-600 text-blue-600 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                          />
                        </td>
                        <td className="border border-gray-600 px-3 py-3 text-center">
                          <input
                            type="checkbox"
                            checked={formData.toolsActions.actions.includes('faire') && formData.toolsActions.tools.includes('obtu')}
                            onChange={(e) => {
                              const newActions = [...formData.toolsActions.actions];
                              const newTools = [...formData.toolsActions.tools];
                              
                              if (e.target.checked) {
                                if (!newActions.includes('faire')) newActions.push('faire');
                                if (!newTools.includes('obtu')) newTools.push('obtu');
                              }
                              
                              setFormData({
                                ...formData,
                                toolsActions: { actions: newActions, tools: newTools }
                              });
                            }}
                            className="w-5 h-5 rounded border-gray-600 text-blue-600 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                          />
                        </td>
                        <td className="border border-gray-600 px-3 py-3 text-center">
                          <input
                            type="checkbox"
                            checked={formData.toolsActions.actions.includes('tester') && formData.toolsActions.tools.includes('aigu')}
                            onChange={(e) => {
                              const newActions = [...formData.toolsActions.actions];
                              const newTools = [...formData.toolsActions.tools];
                              
                              if (e.target.checked) {
                                if (!newActions.includes('tester')) newActions.push('tester');
                                if (!newTools.includes('aigu')) newTools.push('aigu');
                              }
                              
                              setFormData({
                                ...formData,
                                toolsActions: { actions: newActions, tools: newTools }
                              });
                            }}
                            className="w-5 h-5 rounded border-gray-600 text-blue-600 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                          />
                        </td>
                        <td className="border border-gray-600 px-3 py-3 text-center">
                          <input
                            type="checkbox"
                            checked={formData.toolsActions.actions.includes('faire') && formData.toolsActions.tools.includes('aigu')}
                            onChange={(e) => {
                              const newActions = [...formData.toolsActions.actions];
                              const newTools = [...formData.toolsActions.tools];
                              
                              if (e.target.checked) {
                                if (!newActions.includes('faire')) newActions.push('faire');
                                if (!newTools.includes('aigu')) newTools.push('aigu');
                              }
                              
                              setFormData({
                                ...formData,
                                toolsActions: { actions: newActions, tools: newTools }
                              });
                            }}
                            className="w-5 h-5 rounded border-gray-600 text-blue-600 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                          />
                        </td>
                        <td className="border border-gray-600 px-3 py-3 text-center">
                          <input
                            type="checkbox"
                            checked={formData.toolsActions.actions.includes('tester') && formData.toolsActions.tools.includes('both')}
                            onChange={(e) => {
                              const newActions = [...formData.toolsActions.actions];
                              const newTools = [...formData.toolsActions.tools];
                              
                              if (e.target.checked) {
                                if (!newActions.includes('tester')) newActions.push('tester');
                                if (!newTools.includes('both')) newTools.push('both');
                              }
                              
                              setFormData({
                                ...formData,
                                toolsActions: { actions: newActions, tools: newTools }
                              });
                            }}
                            className="w-5 h-5 rounded border-gray-600 text-blue-600 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                          />
                        </td>
                        <td className="border border-gray-600 px-3 py-3 text-center">
                          <input
                            type="checkbox"
                            checked={formData.toolsActions.actions.includes('faire') && formData.toolsActions.tools.includes('both')}
                            onChange={(e) => {
                              const newActions = [...formData.toolsActions.actions];
                              const newTools = [...formData.toolsActions.tools];
                              
                              if (e.target.checked) {
                                if (!newActions.includes('faire')) newActions.push('faire');
                                if (!newTools.includes('both')) newTools.push('both');
                              }
                              
                              setFormData({
                                ...formData,
                                toolsActions: { actions: newActions, tools: newTools }
                              });
                            }}
                            className="w-5 h-5 rounded border-gray-600 text-blue-600 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                          />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Outil & Action & Priority */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Outil (colonne)</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="OBTU">Obtu</option>
                    <option value="AIGU">Aigu</option>
                    <option value="BOTH">Les deux</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Priorité</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="LOW">Basse</option>
                    <option value="MEDIUM">Moyenne</option>
                    <option value="HIGH">Haute</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
              </div>

              {/* Due Date */}
              <div>
                <label className="block text-sm font-medium mb-2">Date d&apos;échéance</label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium mb-2">Tags</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    placeholder="Ajouter un tag..."
                    className="flex-1 px-4 py-2 bg-slate-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={addTag}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 bg-blue-600/20 text-blue-400 rounded-full text-sm flex items-center gap-2"
                    >
                      {tag}
                      <button onClick={() => removeTag(tag)}>
                        <X className="w-3 h-3 hover:text-blue-300" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-700 flex gap-3 justify-end sticky bottom-0 bg-slate-800">
              <button
                onClick={() => { setShowModal(false); resetForm(); }}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={editingTask ? handleUpdateTask : handleCreateTask}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                {editingTask ? 'Mettre à jour' : 'Créer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Delete Confirmation */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-6">
          <div className="bg-slate-800 rounded-lg max-w-md w-full border border-gray-700">
            <div className="p-6 border-b border-gray-700">
              <h2 className="text-xl font-semibold text-red-400">Confirmer la suppression</h2>
            </div>

            <div className="p-6">
              <p className="text-gray-300">Êtes-vous sûr de vouloir supprimer cette tâche ?</p>
              <p className="text-sm text-gray-500 mt-2">Cette action est irréversible.</p>
            </div>

            <div className="p-6 border-t border-gray-700 flex gap-3 justify-end">
              <button
                onClick={() => { setShowDeleteModal(false); setTaskToDelete(null); }}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
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

function TaskCard({
  task,
  onEdit,
  onDelete,
  onStatusChange,
  getPriorityColor,
  getPriorityLabel,
  getActionColor,
  getActionLabel,
  onDragStart,
  onDragEnd,
  isDragging
}: {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (id: number) => void;
  onStatusChange: (id: number, status: string) => void;
  getPriorityColor: (priority: string) => string;
  getPriorityLabel: (priority: string) => string;
  getActionColor: (action?: string) => string;
  getActionLabel: (action?: string) => string;
  onDragStart: (taskId: number) => void;
  onDragEnd: () => void;
  isDragging: boolean;
}) {
  const tags = task.tags ? JSON.parse(task.tags) : [];
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date();
  const toolsActions = task.toolsActions ? JSON.parse(task.toolsActions) : null;

  return (
    <div 
      draggable
      onDragStart={() => onDragStart(task.id)}
      onDragEnd={onDragEnd}
      className={`bg-slate-700/50 rounded-lg p-4 border border-gray-600 hover:border-gray-500 transition-colors cursor-move ${isDragging ? 'opacity-50' : ''}`}
    >
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-semibold flex-1">{task.title}</h3>
        <div className="flex gap-1">
          <button
            onClick={() => onEdit(task)}
            className="p-1 hover:bg-slate-600 rounded text-gray-400 hover:text-white"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(task.id)}
            className="p-1 hover:bg-red-600/20 rounded text-gray-400 hover:text-red-400"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {task.description && (
        <p className="text-sm text-gray-400 mb-3 line-clamp-2">{task.description}</p>
      )}

      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <span className={`px-2 py-1 text-xs rounded ${getPriorityColor(task.priority)}`}>
          {getPriorityLabel(task.priority)}
        </span>

        {task.dueDate && (
          <span className={`flex items-center gap-1 text-xs ${isOverdue ? 'text-red-400' : 'text-gray-400'}`}>
            <Calendar className="w-3 h-3" />
            {new Date(task.dueDate).toLocaleDateString('fr-FR')}
          </span>
        )}
      </div>

      {/* Tools & Actions */}
      {toolsActions && toolsActions.tools && toolsActions.tools.length > 0 && (
        <div className="mb-3 space-y-1">
          {toolsActions.tools.includes('obtu') && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-purple-400 font-medium">Obtu:</span>
              <span className="text-gray-300">
                {toolsActions.actions.filter((a: string) => a === 'tester' || a === 'faire')
                  .map((a: string) => a === 'tester' ? 'Tester' : 'Faire')
                  .join(', ')}
              </span>
            </div>
          )}
          {toolsActions.tools.includes('aigu') && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-blue-400 font-medium">Aigu:</span>
              <span className="text-gray-300">
                {toolsActions.actions.filter((a: string) => a === 'tester' || a === 'faire')
                  .map((a: string) => a === 'tester' ? 'Tester' : 'Faire')
                  .join(', ')}
              </span>
            </div>
          )}
          {toolsActions.tools.includes('both') && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-green-400 font-medium">Les deux:</span>
              <span className="text-gray-300">
                {toolsActions.actions.filter((a: string) => a === 'tester' || a === 'faire')
                  .map((a: string) => a === 'tester' ? 'Tester' : 'Faire')
                  .join(', ')}
              </span>
            </div>
          )}
        </div>
      )}

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {tags.map((tag: string) => (
            <span key={tag} className="px-2 py-0.5 bg-slate-600 text-xs rounded text-gray-300">
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
