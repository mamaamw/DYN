'use client';

import { useState, useEffect } from 'react';
import { Tag, Plus, Edit2, Trash2, Save, X, AlertCircle, CheckCircle } from 'lucide-react';

interface Category {
  name: string;
  label: string;
  description: string;
  color: string;
  icon?: string;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ show: boolean; categoryName: string; categoryLabel: string } | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState<'new' | 'edit' | null>(null);
  
  const [newCategory, setNewCategory] = useState({
    name: '',
    label: '',
    description: '',
    color: 'blue',
    icon: '',
  });

  const [editedCategory, setEditedCategory] = useState({
    label: '',
    description: '',
    color: '',
    icon: '',
  });

  const emojiOptions = [
    '🎬', '🎥', '📽️', '🎞️', '🎭', '🎪', '🎨', '🎯', '🎲', '🎰',
    '👻', '🧟', '🧛', '💀', '☠️', '👽', '👾', '🤖', '🛸', '🚀',
    '😂', '😆', '🤣', '😄', '😃', '😁', '😊', '🥰', '😍', '🤩',
    '😢', '😭', '😔', '😞', '😓', '😩', '😫', '🥺', '😤', '😠',
    '💪', '🔥', '⚡', '💥', '💫', '⭐', '🌟', '✨', '🎇', '🎆',
    '❤️', '💔', '💕', '💖', '💗', '💘', '💝', '💞', '💓', '💌',
    '🌍', '🌎', '🌏', '🗺️', '🧭', '⛰️', '🏔️', '🏕️', '🏖️', '🏝️',
    '🦸', '🦹', '🧙', '🧚', '🧜', '🧝', '🧞', '🧟', '🦖', '🦕',
    '⚔️', '🗡️', '🔫', '🏹', '🛡️', '🔱', '⚓', '🧨', '💣', '🔪',
    '🏆', '🥇', '🥈', '🥉', '🏅', '🎖️', '🎗️', '🏵️', '🎀', '🎁',
  ];

  useEffect(() => {
    fetchCategories();
  }, []);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      if (!response.ok) throw new Error('Erreur');
      const data = await response.json();
      setCategories(data.categories);
      setLoading(false);
    } catch (err) {
      showNotification('error', 'Erreur lors du chargement des catégories');
      setLoading(false);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategory.name || !newCategory.label) {
      showNotification('error', 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCategory),
      });

      if (!response.ok) {
        const data = await response.json();
        showNotification('error', data.error || 'Erreur lors de la création');
        return;
      }

      const data = await response.json();
      setCategories(data.categories);
      setIsAddingCategory(false);
      setNewCategory({ name: '', label: '', description: '', color: 'blue', icon: '' });
      showNotification('success', 'Catégorie créée avec succès');
    } catch (err) {
      showNotification('error', 'Erreur lors de la création de la catégorie');
    }
  };

  const startEditCategory = (category: Category) => {
    setEditingCategory(category.name);
    setEditedCategory({
      label: category.label,
      description: category.description,
      color: category.color,
      icon: category.icon || '',
    });
  };

  const saveEditCategory = async () => {
    if (!editingCategory) return;

    try {
      const response = await fetch('/api/categories', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editingCategory, ...editedCategory }),
      });

      if (!response.ok) {
        const data = await response.json();
        showNotification('error', data.error || 'Erreur lors de la mise à jour');
        return;
      }

      const data = await response.json();
      setCategories(data.categories);
      setEditingCategory(null);
      showNotification('success', 'Catégorie mise à jour avec succès');
    } catch (err) {
      showNotification('error', 'Erreur lors de la mise à jour de la catégorie');
    }
  };

  const confirmDeleteCategory = (category: Category) => {
    setConfirmModal({ show: true, categoryName: category.name, categoryLabel: category.label });
  };

  const handleDeleteCategory = async () => {
    if (!confirmModal) return;

    const name = confirmModal.categoryName;

    try {
      const response = await fetch(`/api/categories?name=${name}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        showNotification('error', data.error || 'Erreur lors de la suppression');
        setConfirmModal(null);
        return;
      }

      const data = await response.json();
      setCategories(data.categories);
      setConfirmModal(null);
      showNotification('success', 'Catégorie supprimée avec succès');
    } catch (err) {
      showNotification('error', 'Erreur lors de la suppression de la catégorie');
      setConfirmModal(null);
    }
  };

  const colorOptions = [
    { value: 'red', label: 'Rouge' },
    { value: 'orange', label: 'Orange' },
    { value: 'yellow', label: 'Jaune' },
    { value: 'green', label: 'Vert' },
    { value: 'blue', label: 'Bleu' },
    { value: 'purple', label: 'Violet' },
    { value: 'pink', label: 'Rose' },
    { value: 'slate', label: 'Gris' },
  ];

  const getColorClass = (color: string) => {
    const colors: Record<string, string> = {
      red: 'bg-red-100 text-red-700 border-red-200',
      orange: 'bg-orange-100 text-orange-700 border-orange-200',
      yellow: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      green: 'bg-green-100 text-green-700 border-green-200',
      blue: 'bg-blue-100 text-blue-700 border-blue-200',
      purple: 'bg-purple-100 text-purple-700 border-purple-200',
      pink: 'bg-pink-100 text-pink-700 border-pink-200',
      slate: 'bg-slate-100 text-slate-700 border-slate-200',
    };
    return colors[color] || colors.blue;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Notification Toast */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in">
          <div
            className={`flex items-center gap-3 px-6 py-4 rounded-lg shadow-lg border ${
              notification.type === 'success'
                ? 'bg-green-50 border-green-200 text-green-800'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}
          >
            {notification.type === 'success' ? (
              <CheckCircle size={24} className="flex-shrink-0" />
            ) : (
              <AlertCircle size={24} className="flex-shrink-0" />
            )}
            <span className="font-medium">{notification.message}</span>
            <button
              onClick={() => setNotification(null)}
              className="ml-4 text-slate-500 hover:text-slate-700"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModal?.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-red-100 rounded-full">
                  <AlertCircle className="text-red-600" size={24} />
                </div>
                <h3 className="text-xl font-bold text-slate-800">Confirmer la suppression</h3>
              </div>
              <p className="text-slate-600 mb-6">
                Êtes-vous sûr de vouloir supprimer la catégorie <strong>{confirmModal.categoryLabel}</strong> ({confirmModal.categoryName}) ?
                <br />
                <span className="text-sm text-red-600 mt-2 block">Cette action est irréversible.</span>
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setConfirmModal(null)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-medium"
                >
                  Annuler
                </button>
                <button
                  onClick={handleDeleteCategory}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium"
                >
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Emoji Picker Modal */}
      {showEmojiPicker && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-slate-800">Choisir un emoji</h3>
                <button
                  onClick={() => setShowEmojiPicker(null)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X size={24} />
                </button>
              </div>
              <div className="grid grid-cols-10 gap-2 max-h-96 overflow-y-auto">
                {emojiOptions.map((emoji, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      if (showEmojiPicker === 'new') {
                        setNewCategory({ ...newCategory, icon: emoji });
                      } else {
                        setEditedCategory({ ...editedCategory, icon: emoji });
                      }
                      setShowEmojiPicker(null);
                    }}
                    className="text-2xl hover:bg-slate-100 rounded-lg p-2 transition-colors"
                    title={emoji}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <Tag className="text-blue-600" size={32} />
            <h1 className="text-3xl font-bold text-slate-800">Gestion des Catégories</h1>
          </div>
          <button
            onClick={() => setIsAddingCategory(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            <Plus size={20} />
            Nouvelle catégorie
          </button>
        </div>
        <p className="text-slate-600">Créer, modifier et supprimer les catégories de films</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Icône</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Nom</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Label</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Description</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Couleur</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isAddingCategory && (
              <tr className="border-b border-slate-200 bg-blue-50">
                <td className="px-6 py-4">
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker('new')}
                    className="w-16 h-12 px-3 py-2 border border-slate-300 rounded-lg hover:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-2xl flex items-center justify-center"
                    title="Choisir un emoji"
                  >
                    {newCategory.icon || '➕'}
                  </button>
                </td>
                <td className="px-6 py-4">
                  <input
                    type="text"
                    placeholder="NOM_CATEGORIE"
                    value={newCategory.name}
                    onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value.toUpperCase().replace(/\s+/g, '_') })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  />
                </td>
                <td className="px-6 py-4">
                  <input
                    type="text"
                    placeholder="Libellé"
                    value={newCategory.label}
                    onChange={(e) => setNewCategory({ ...newCategory, label: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  />
                </td>
                <td className="px-6 py-4">
                  <input
                    type="text"
                    placeholder="Description"
                    value={newCategory.description}
                    onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  />
                </td>
                <td className="px-6 py-4">
                  <select
                    value={newCategory.color}
                    onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
                    className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  >
                    {colorOptions.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleAddCategory}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                      title="Enregistrer"
                    >
                      <Save size={18} />
                    </button>
                    <button
                      onClick={() => setIsAddingCategory(false)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      title="Annuler"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            )}
            {categories.map((category) => {
              const isEditing = editingCategory === category.name;
              return (
                <tr key={category.name} className={`border-b border-slate-100 ${isEditing ? 'bg-yellow-50' : 'hover:bg-slate-50'}`}>
                  <td className="px-6 py-4">
                    {isEditing ? (
                      <button
                        type="button"
                        onClick={() => setShowEmojiPicker('edit')}
                        className="w-16 h-12 px-3 py-2 border border-slate-300 rounded-lg hover:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-2xl flex items-center justify-center"
                        title="Choisir un emoji"
                      >
                        {editedCategory.icon || '📁'}
                      </button>
                    ) : (
                      <span className="text-2xl">{category.icon || '📁'}</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-mono text-sm font-semibold text-slate-800">{category.name}</span>
                  </td>
                  <td className="px-6 py-4">
                    {isEditing ? (
                      <input
                        type="text"
                        value={editedCategory.label}
                        onChange={(e) => setEditedCategory({ ...editedCategory, label: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                      />
                    ) : (
                      <span className="text-slate-700">{category.label}</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {isEditing ? (
                      <input
                        type="text"
                        value={editedCategory.description}
                        onChange={(e) => setEditedCategory({ ...editedCategory, description: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                      />
                    ) : (
                      <span className="text-slate-600 text-sm">{category.description}</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {isEditing ? (
                      <select
                        value={editedCategory.color}
                        onChange={(e) => setEditedCategory({ ...editedCategory, color: e.target.value })}
                        className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
                      >
                        {colorOptions.map(option => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    ) : (
                      <span className={`px-3 py-1 rounded-md text-xs font-medium border ${getColorClass(category.color)}`}>
                        {category.color}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {isEditing ? (
                        <>
                          <button
                            onClick={saveEditCategory}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                            title="Enregistrer"
                          >
                            <Save size={18} />
                          </button>
                          <button
                            onClick={() => setEditingCategory(null)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                            title="Annuler"
                          >
                            <X size={18} />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => startEditCategory(category)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                            title="Modifier"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            onClick={() => confirmDeleteCategory(category)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                            title="Supprimer"
                          >
                            <Trash2 size={18} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">ℹ️ Information</h3>
        <ul className="space-y-1 text-sm text-blue-800">
          <li>• Les utilisateurs peuvent avoir plusieurs catégories</li>
          <li>• Les catégories peuvent être assignées depuis la gestion des utilisateurs</li>
          <li>• Vous ne pouvez pas supprimer une catégorie utilisée par des utilisateurs</li>
        </ul>
      </div>
    </div>
  );
}
