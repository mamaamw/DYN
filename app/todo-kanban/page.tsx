'use client';

import { useState, useEffect } from 'react';
import { CheckSquare, Plus, Edit2, Trash2, Calendar } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import ConfirmModal from '@/components/ui/ConfirmModal';

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
  userId: number;
  createdAt: string;
  updatedAt: string;
}

export default function TodoKanbanPage() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTodo, setSelectedTodo] = useState<Todo | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    executionDate: '',
    log: '',
    status: 'todo'
  });

  const columns = [
    { id: 'todo', title: 'TODO', color: 'bg-yellow-100 dark:bg-yellow-900/30', textColor: 'text-yellow-800 dark:text-yellow-400' },
    { id: 'failed', title: 'Failed', color: 'bg-red-100 dark:bg-red-900/30', textColor: 'text-red-800 dark:text-red-400' },
    { id: 'cooldown', title: 'Cooldown', color: 'bg-blue-100 dark:bg-blue-900/30', textColor: 'text-blue-800 dark:text-blue-400' },
    { id: 'succes-court', title: 'Succès court', color: 'bg-green-100 dark:bg-green-900/30', textColor: 'text-green-800 dark:text-green-400' },
    { id: 'succes-long', title: 'Succès long', color: 'bg-emerald-100 dark:bg-emerald-900/30', textColor: 'text-emerald-800 dark:text-emerald-400' },
  ];

  useEffect(() => {
    loadTodos();
  }, []);

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

  const handleEdit = (todo: Todo) => {
    setSelectedTodo(todo);
    setFormData({
      executionDate: todo.executionDate ? new Date(todo.executionDate).toISOString().split('T')[0] : '',
      log: todo.log || '',
      status: todo.status
    });
    setShowModal(true);
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

  const handleDragStart = (e: React.DragEvent, todo: Todo) => {
    e.dataTransfer.setData('todoId', todo.id.toString());
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    const todoId = e.dataTransfer.getData('todoId');
    
    if (!todoId) return;

    try {
      const res = await fetch(`/api/todos/${todoId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (res.ok) {
        await loadTodos();
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const getCompositeId = (todo: Todo) => {
    return todo.customId || `${todo.contactId}-${todo.id}-1`;
  };

  const getTodosByStatus = (status: string) => {
    return todos.filter(todo => todo.status === status);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">TODO Kanban</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Gestion visuelle des tâches
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {columns.map((column) => (
          <Card key={column.id}>
            <div className={`p-4 rounded-lg ${column.color}`}>
              <p className={`text-sm font-medium ${column.textColor}`}>{column.title}</p>
              <p className={`text-2xl font-bold ${column.textColor}`}>
                {getTodosByStatus(column.id).length}
              </p>
            </div>
          </Card>
        ))}
      </div>

      {/* Kanban Board */}
      {loading ? (
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {columns.map((column) => (
            <div
              key={column.id}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.id)}
              className="bg-slate-100 dark:bg-slate-800 rounded-lg p-4 min-h-[600px]"
            >
              <div className={`flex items-center gap-2 mb-4 p-2 rounded-lg ${column.color}`}>
                <CheckSquare className={`w-5 h-5 ${column.textColor}`} />
                <h2 className={`font-semibold ${column.textColor}`}>{column.title}</h2>
                <span className={`ml-auto px-2 py-1 rounded-full text-xs font-bold ${column.color} ${column.textColor}`}>
                  {getTodosByStatus(column.id).length}
                </span>
              </div>

              <div className="space-y-3">
                {getTodosByStatus(column.id).map((todo) => (
                  <div
                    key={todo.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, todo)}
                    className="bg-white dark:bg-slate-900 rounded-lg p-4 shadow hover:shadow-md transition-shadow cursor-move border border-slate-200 dark:border-slate-700"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-900 dark:text-white">
                          {getCompositeId(todo)}
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {todo.taskName}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleEdit(todo)}
                          className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
                          title="Modifier"
                        >
                          <Edit2 className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(todo.id)}
                          className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                        </button>
                      </div>
                    </div>

                    {todo.demandeur && (
                      <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">
                        <span className="font-medium">Demandeur:</span> {todo.demandeur}
                      </p>
                    )}

                    {todo.tool && (
                      <div className="flex gap-2 text-xs mb-2">
                        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 rounded">
                          {todo.tool}
                        </span>
                        {todo.actionType && (
                          <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400 rounded">
                            {todo.actionType}
                          </span>
                        )}
                      </div>
                    )}

                    {todo.accountNumber && (
                      <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">
                        <span className="font-medium">{todo.accountType}:</span> {todo.accountNumber}
                      </p>
                    )}

                    {todo.executionDate && (
                      <div className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400 mt-2">
                        <Calendar className="w-3 h-3" />
                        <span>{formatDate(todo.executionDate)}</span>
                      </div>
                    )}

                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {showModal && selectedTodo && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4 text-slate-900 dark:text-white">
              Modifier TODO
            </h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-slate-700 dark:text-slate-300">Contact:</span>
                  <p className="text-slate-900 dark:text-white">{selectedTodo.codename || `#${selectedTodo.contactId}`}</p>
                </div>
                <div>
                  <span className="font-medium text-slate-700 dark:text-slate-300">Tâche:</span>
                  <p className="text-slate-900 dark:text-white">{selectedTodo.taskName}</p>
                </div>
                {selectedTodo.demandeur && (
                  <div>
                    <span className="font-medium text-slate-700 dark:text-slate-300">Demandeur:</span>
                    <p className="text-slate-900 dark:text-white">{selectedTodo.demandeur}</p>
                  </div>
                )}
                {selectedTodo.tool && (
                  <div>
                    <span className="font-medium text-slate-700 dark:text-slate-300">Outil:</span>
                    <p className="text-slate-900 dark:text-white">{selectedTodo.tool} - {selectedTodo.actionType}</p>
                  </div>
                )}
              </div>

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
