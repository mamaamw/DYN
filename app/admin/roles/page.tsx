'use client';

import { useState, useEffect } from 'react';
import { Shield, Plus, Edit2, Trash2, Save, X, AlertCircle, CheckCircle, Copy, Tag, GripVertical } from 'lucide-react';

interface Role {
  name: string;
  label: string;
  description: string;
  color: string;
  isSystem: boolean;
}

interface Category {
  id: number;
  name: string;
  label: string;
  description: string | null;
  color: string;
  icon: string | null;
}

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [roleCategories, setRoleCategories] = useState<Record<string, Category[]>>({});
  const [loading, setLoading] = useState(true);
  const [editingRole, setEditingRole] = useState<string | null>(null);
  const [isAddingRole, setIsAddingRole] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ show: boolean; roleName: string; roleLabel: string } | null>(null);
  const [categoryModal, setCategoryModal] = useState<{ show: boolean; roleName: string } | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  
  const [newRole, setNewRole] = useState({
    name: '',
    label: '',
    description: '',
    color: 'blue',
  });

  const [editedRole, setEditedRole] = useState({
    label: '',
    description: '',
    color: '',
  });

  const [draggedRole, setDraggedRole] = useState<string | null>(null);

  useEffect(() => {
    fetchRoles();
    fetchCategories();
  }, []);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const fetchRoles = async () => {
    try {
      const response = await fetch('/api/roles');
      if (!response.ok) throw new Error('Erreur');
      const data = await response.json();
      setRoles(data.roles);
      
      // Charger les catégories de chaque rôle
      const rolesCategoriesMap: Record<string, Category[]> = {};
      for (const role of data.roles) {
        const catResponse = await fetch(`/api/roles/${role.name}/categories`);
        if (catResponse.ok) {
          const catData = await catResponse.json();
          rolesCategoriesMap[role.name] = catData.categories || [];
        }
      }
      setRoleCategories(rolesCategoriesMap);
      setLoading(false);
    } catch (err) {
      showNotification('error', 'Erreur lors du chargement des rôles');
      setLoading(false);
    }
  };

  const handleAddRole = async () => {
    if (!newRole.name || !newRole.label) {
      showNotification('error', 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      const response = await fetch('/api/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRole),
      });

      if (!response.ok) {
        const data = await response.json();
        showNotification('error', data.error || 'Erreur lors de la création');
        return;
      }

      const data = await response.json();
      setRoles(data.roles);
      setIsAddingRole(false);
      setNewRole({ name: '', label: '', description: '', color: 'blue' });
      showNotification('success', 'Rôle créé avec succès');
    } catch (err) {
      showNotification('error', 'Erreur lors de la création du rôle');
    }
  };

  const startEditRole = (role: Role) => {
    setEditingRole(role.name);
    setEditedRole({
      label: role.label,
      description: role.description,
      color: role.color,
    });
  };

  const saveEditRole = async () => {
    if (!editingRole) return;

    try {
      const response = await fetch('/api/roles', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editingRole, ...editedRole }),
      });

      if (!response.ok) {
        const data = await response.json();
        showNotification('error', data.error || 'Erreur lors de la mise à jour');
        return;
      }

      const data = await response.json();
      setRoles(data.roles);
      setEditingRole(null);
      showNotification('success', 'Rôle mis à jour avec succès');
    } catch (err) {
      showNotification('error', 'Erreur lors de la mise à jour du rôle');
    }
  };

  const confirmDeleteRole = (role: Role) => {
    setConfirmModal({ show: true, roleName: role.name, roleLabel: role.label });
  };

  const handleDeleteRole = async () => {
    if (!confirmModal) return;

    const name = confirmModal.roleName;

    try {
      const response = await fetch(`/api/roles?name=${name}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        showNotification('error', data.error || 'Erreur lors de la suppression');
        setConfirmModal(null);
        return;
      }

      const data = await response.json();
      setRoles(data.roles);
      setConfirmModal(null);
      showNotification('success', 'Rôle supprimé avec succès');
    } catch (err) {
      showNotification('error', 'Erreur lors de la suppression du rôle');
      setConfirmModal(null);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories || []);
      }
    } catch (err) {
      console.error('Erreur lors du chargement des catégories:', err);
    }
  };

  const openCategoryModal = (roleName: string) => {
    const currentCategories = roleCategories[roleName] || [];
    setSelectedCategories(currentCategories.map(c => c.name));
    setCategoryModal({ show: true, roleName });
  };

  const toggleCategory = (categoryName: string) => {
    setSelectedCategories(prev =>
      prev.includes(categoryName)
        ? prev.filter(c => c !== categoryName)
        : [...prev, categoryName]
    );
  };

  const toggleSelectAllCategories = () => {
    if (selectedCategories.length === categories.length) {
      setSelectedCategories([]);
    } else {
      setSelectedCategories(categories.map(c => c.name));
    }
  };

  const saveCategoriesForRole = async () => {
    if (!categoryModal) return;

    try {
      const response = await fetch(`/api/roles/${categoryModal.roleName}/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoryNames: selectedCategories }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la mise à jour');
      }

      const data = await response.json();
      setRoleCategories(prev => ({
        ...prev,
        [categoryModal.roleName]: data.categories || []
      }));

      setCategoryModal(null);
      showNotification('success', 'Catégories mises à jour avec succès');
    } catch (err) {
      showNotification('error', 'Erreur lors de la mise à jour des catégories');
    }
  };

  const getCategoryColor = (color: string) => {
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

  const handleDragStart = (e: React.DragEvent<HTMLElement>, roleName: string) => {
    setDraggedRole(roleName);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent<HTMLTableRowElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent<HTMLTableRowElement>, targetRoleName: string) => {
    e.preventDefault();
    if (!draggedRole || draggedRole === targetRoleName) {
      setDraggedRole(null);
      return;
    }

    const newRoles = [...roles];
    const draggedIndex = newRoles.findIndex(r => r.name === draggedRole);
    const targetIndex = newRoles.findIndex(r => r.name === targetRoleName);

    if (draggedIndex !== -1 && targetIndex !== -1) {
      [newRoles[draggedIndex], newRoles[targetIndex]] = [newRoles[targetIndex], newRoles[draggedIndex]];
      setRoles(newRoles);
      saveRolesOrder(newRoles);
    }

    setDraggedRole(null);
  };

  const saveRolesOrder = async (orderedRoles: Role[]) => {
    try {
      await fetch('/api/roles/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order: orderedRoles.map(r => r.name) }),
      });
    } catch (err) {
      console.error('Erreur lors de la sauvegarde de l\'ordre:', err);
    }
  };

  const handleDuplicateRole = (role: Role) => {
    setIsAddingRole(true);
    setNewRole({
      name: `${role.name}_COPY`,
      label: `${role.label} (Copie)`,
      description: role.description,
      color: role.color,
    });
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
                Êtes-vous sûr de vouloir supprimer le rôle <strong>{confirmModal.roleLabel}</strong> ({confirmModal.roleName}) ?
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
                  onClick={handleDeleteRole}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium"
                >
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <Shield className="text-blue-600" size={32} />
            <h1 className="text-3xl font-bold text-slate-800">Gestion des Rôles</h1>
          </div>
          <button
            onClick={() => setIsAddingRole(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            <Plus size={20} />
            Nouveau rôle
          </button>
        </div>
        <p className="text-slate-600">Créer, modifier et supprimer les rôles utilisateur</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Nom</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Label</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Description</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Couleur</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Type</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Catégories</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isAddingRole && (
              <tr className="border-b border-slate-200 bg-blue-50">
                <td className="px-6 py-4">
                  <input
                    type="text"
                    placeholder="NOM_DU_ROLE"
                    value={newRole.name}
                    onChange={(e) => setNewRole({ ...newRole, name: e.target.value.toUpperCase().replace(/\s+/g, '_') })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  />
                </td>
                <td className="px-6 py-4">
                  <input
                    type="text"
                    placeholder="Libellé"
                    value={newRole.label}
                    onChange={(e) => setNewRole({ ...newRole, label: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  />
                </td>
                <td className="px-6 py-4">
                  <input
                    type="text"
                    placeholder="Description"
                    value={newRole.description}
                    onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  />
                </td>
                <td className="px-6 py-4">
                  <select
                    value={newRole.color}
                    onChange={(e) => setNewRole({ ...newRole, color: e.target.value })}
                    className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  >
                    {colorOptions.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </td>
                <td className="px-6 py-4">
                  <span className="text-xs text-slate-500">Nouveau</span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-slate-400 text-sm">-</span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleAddRole}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                      title="Enregistrer"
                    >
                      <Save size={18} />
                    </button>
                    <button
                      onClick={() => setIsAddingRole(false)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      title="Annuler"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            )}
            {roles.map((role) => {
              const isEditing = editingRole === role.name;
              const isDragging = draggedRole === role.name;
              return (
                <tr
                  key={role.name}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, role.name)}
                  className={`border-b border-slate-100 transition-colors ${
                    isDragging
                      ? 'opacity-50 bg-blue-100'
                      : isEditing
                      ? 'bg-yellow-50'
                      : 'hover:bg-slate-50'
                  }`}
                >
                  <td className="px-6 py-4">
                    <div
                      draggable
                      onDragStart={(e) => handleDragStart(e, role.name)}
                      className="flex items-center gap-2 cursor-grab active:cursor-grabbing w-fit"
                    >
                      <GripVertical size={18} className="text-slate-400 hover:text-slate-600" />
                      <span className="font-mono text-sm font-semibold text-slate-800">{role.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {isEditing ? (
                      <input
                        type="text"
                        value={editedRole.label}
                        onChange={(e) => setEditedRole({ ...editedRole, label: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                        disabled={role.isSystem}
                      />
                    ) : (
                      <span className="text-slate-700">{role.label}</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {isEditing ? (
                      <input
                        type="text"
                        value={editedRole.description}
                        onChange={(e) => setEditedRole({ ...editedRole, description: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                      />
                    ) : (
                      <span className="text-slate-600 text-sm">{role.description}</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {isEditing ? (
                      <select
                        value={editedRole.color}
                        onChange={(e) => setEditedRole({ ...editedRole, color: e.target.value })}
                        className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
                        disabled={role.isSystem}
                      >
                        {colorOptions.map(option => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    ) : (
                      <span className={`px-3 py-1 rounded-md text-xs font-medium border ${getColorClass(role.color)}`}>
                        {role.color}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {role.isSystem ? (
                      <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded">Système</span>
                    ) : (
                      <span className="px-2 py-1 bg-blue-100 text-blue-600 text-xs rounded">Personnalisé</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-slate-600 text-sm font-medium">
                      {(roleCategories[role.name] || []).length} / {categories.length}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {isEditing ? (
                        <>
                          <button
                            onClick={saveEditRole}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                            title="Enregistrer"
                          >
                            <Save size={18} />
                          </button>
                          <button
                            onClick={() => setEditingRole(null)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                            title="Annuler"
                          >
                            <X size={18} />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => openCategoryModal(role.name)}
                            className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg"
                            title="Catégories"
                          >
                            <Tag size={18} />
                          </button>
                          <button
                            onClick={() => handleDuplicateRole(role)}
                            className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg"
                            title="Dupliquer"
                          >
                            <Copy size={18} />
                          </button>
                          <button
                            onClick={() => startEditRole(role)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                            title="Modifier"
                          >
                            <Edit2 size={18} />
                          </button>
                          {!role.isSystem && (
                            <button
                              onClick={() => confirmDeleteRole(role)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                              title="Supprimer"
                            >
                              <Trash2 size={18} />
                            </button>
                          )}
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

      <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="font-semibold text-yellow-900 mb-2">⚠️ Important</h3>
        <ul className="space-y-1 text-sm text-yellow-800">
          <li>• Les rôles système (ADMIN) ne peuvent pas être supprimés</li>
          <li>• Vous ne pouvez pas supprimer un rôle utilisé par des utilisateurs</li>
          <li>• Les modifications de description sont possibles pour tous les rôles</li>
        </ul>
      </div>

      {/* Category Modal */}
      {categoryModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 sticky top-0 bg-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Tag className="text-orange-600" size={24} />
                  <h2 className="text-2xl font-bold text-slate-800">
                    Catégories du rôle
                  </h2>
                </div>
                <button
                  onClick={() => setCategoryModal(null)}
                  className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg"
                >
                  <X size={24} />
                </button>
              </div>
              <div className="flex items-center justify-between mt-3">
                <p className="text-sm text-slate-600">
                  Sélectionnez les catégories que les nouveaux utilisateurs avec ce rôle auront par défaut
                </p>
                {categories.length > 0 && (
                  <button
                    onClick={toggleSelectAllCategories}
                    className="text-sm px-3 py-1 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg font-medium"
                  >
                    {selectedCategories.length === categories.length ? 'Désélectionner tout' : 'Sélectionner tout'}
                  </button>
                )}
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-2 gap-3">
                {categories.map(category => (
                  <label key={category.id} className="flex items-start gap-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(category.name)}
                      onChange={() => toggleCategory(category.name)}
                      className="mt-1 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-800">{category.label}</span>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium border ${getCategoryColor(category.color)}`}>
                          {category.name}
                        </span>
                      </div>
                      {category.description && (
                        <p className="text-xs text-slate-600 mt-1">{category.description}</p>
                      )}
                    </div>
                  </label>
                ))}
              </div>

              {categories.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-slate-500">Aucune catégorie disponible</p>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-slate-200 bg-slate-50 sticky bottom-0 flex gap-3 justify-end">
              <button
                onClick={() => setCategoryModal(null)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 font-medium"
              >
                Annuler
              </button>
              <button
                onClick={saveCategoriesForRole}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
              >
                <Save size={18} />
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
