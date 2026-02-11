'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Package, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface Asset {
  id: number;
  name: string;
  type: string;
  description: string | null;
  purchaseDate: string;
  purchaseCost: number;
  currency: string;
  serialNumber: string | null;
  supplier: string | null;
  warranty: string | null;
  status: 'active' | 'maintenance' | 'disposed';
  projectId: number | null;
  project?: { id: number; name: string };
  notes: string | null;
  createdAt: string;
}

interface Project {
  id: number;
  name: string;
}

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    description: '',
    purchaseDate: '',
    purchaseCost: '',
    currency: 'EUR',
    serialNumber: '',
    supplier: '',
    warranty: '',
    status: 'active',
    projectId: '',
    notes: '',
  });

  useEffect(() => {
    loadAssets();
    loadProjects();
  }, []);

  const loadAssets = async () => {
    try {
      const response = await fetch('/api/assets');
      const data = await response.json();
      if (data.success) {
        setAssets(data.assets);
      }
    } catch (error) {
      console.error('Error loading assets:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProjects = async () => {
    try {
      const response = await fetch('/api/projects');
      const data = await response.json();
      if (data.success) {
        setProjects(data.projects);
      }
    } catch (error) {
      console.error('Error loading projects:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingAsset ? `/api/assets/${editingAsset.id}` : '/api/assets';
      const method = editingAsset ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          purchaseCost: parseFloat(formData.purchaseCost) || 0,
          projectId: formData.projectId ? parseInt(formData.projectId) : null,
        }),
      });

      const data = await response.json();
      if (data.success) {
        await loadAssets();
        setShowModal(false);
        resetForm();
      }
    } catch (error) {
      console.error('Error saving asset:', error);
    }
  };

  const handleEdit = (asset: Asset) => {
    setEditingAsset(asset);
    setFormData({
      name: asset.name,
      type: asset.type,
      description: asset.description || '',
      purchaseDate: asset.purchaseDate ? asset.purchaseDate.split('T')[0] : '',
      purchaseCost: asset.purchaseCost.toString(),
      currency: asset.currency,
      serialNumber: asset.serialNumber || '',
      supplier: asset.supplier || '',
      warranty: asset.warranty ? asset.warranty.split('T')[0] : '',
      status: asset.status,
      projectId: asset.projectId?.toString() || '',
      notes: asset.notes || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce matériel ?')) return;
    try {
      const response = await fetch(`/api/assets/${id}`, { method: 'DELETE' });
      const data = await response.json();
      if (data.success) {
        await loadAssets();
      }
    } catch (error) {
      console.error('Error deleting asset:', error);
    }
  };

  const resetForm = () => {
    setEditingAsset(null);
    setFormData({
      name: '',
      type: '',
      description: '',
      purchaseDate: '',
      purchaseCost: '',
      currency: 'BTC',
      serialNumber: '',
      supplier: '',
      warranty: '',
      status: 'active',
      projectId: '',
      notes: '',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'maintenance':
        return 'bg-orange-100 text-orange-800';
      case 'disposed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getWarrantyStatus = (warranty: string | null) => {
    if (!warranty) return null;
    const now = new Date();
    const warrantyDate = new Date(warranty);
    const daysRemaining = Math.ceil((warrantyDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysRemaining < 0) {
      return { text: 'Garantie expirée', color: 'text-red-600', days: daysRemaining };
    } else if (daysRemaining <= 30) {
      return { text: 'Expire bientôt', color: 'text-orange-600', days: daysRemaining };
    } else {
      return { text: 'Sous garantie', color: 'text-green-600', days: daysRemaining };
    }
  };

  const assetTypes = [...new Set(assets.map(a => a.type))];

  const filteredAssets = assets.filter((asset) => {
    const matchesSearch = asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         asset.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         asset.supplier?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || asset.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const totalValue = assets.reduce((sum, asset) => sum + asset.purchaseCost, 0);

  if (loading) {
    return <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Matériel & Équipements</h2>
          <p className="text-gray-600 text-sm">Gérez vos achats de matériel et équipements</p>
        </div>
        <button 
          onClick={() => { resetForm(); setShowModal(true); }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Plus size={18} />
          Nouveau Matériel
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Matériels</p>
              <p className="text-2xl font-bold text-gray-900">{assets.length}</p>
            </div>
            <Package className="text-blue-600" size={32} />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Actifs</p>
              <p className="text-2xl font-bold text-green-600">{assets.filter(a => a.status === 'active').length}</p>
            </div>
            <CheckCircle2 className="text-green-600" size={32} />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">En maintenance</p>
              <p className="text-2xl font-bold text-orange-600">{assets.filter(a => a.status === 'maintenance').length}</p>
            </div>
            <AlertTriangle className="text-orange-600" size={32} />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Valeur totale</p>
              <p className="text-2xl font-bold text-blue-600">{totalValue.toFixed(0)} €</p>
            </div>
            <Package className="text-blue-600" size={32} />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Rechercher du matériel..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Tous les types</option>
            {assetTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Assets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAssets.map((asset) => {
          const warrantyStatus = getWarrantyStatus(asset.warranty);
          
          return (
            <div key={asset.id} className="bg-white rounded-lg shadow hover:shadow-lg transition p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{asset.name}</h3>
                  <p className="text-sm text-gray-600 mb-2">{asset.type}</p>
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(asset.status)}`}>
                    {asset.status === 'active' ? 'Actif' : asset.status === 'maintenance' ? 'Maintenance' : 'Retiré'}
                  </span>
                </div>
              </div>

              {asset.description && (
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">{asset.description}</p>
              )}

              {/* Purchase Info */}
              <div className="mb-4 pb-4 border-b border-gray-200 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Achat</span>
                  <span className="text-gray-900">{new Date(asset.purchaseDate).toLocaleDateString('fr-FR')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Coût</span>
                  <span className="font-medium text-gray-900">{asset.purchaseCost.toFixed(2)} {asset.currency}</span>
                </div>
                {asset.serialNumber && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">N° série</span>
                    <span className="text-gray-900 font-mono text-xs">{asset.serialNumber}</span>
                  </div>
                )}
                {asset.supplier && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Fournisseur</span>
                    <span className="text-gray-900">{asset.supplier}</span>
                  </div>
                )}
              </div>

              {/* Warranty */}
              {warrantyStatus && (
                <div className="mb-4">
                  <div className={`flex items-center gap-2 text-sm ${warrantyStatus.color}`}>
                    <AlertTriangle size={14} />
                    <span className="font-medium">{warrantyStatus.text}</span>
                  </div>
                  {warrantyStatus.days > 0 && (
                    <div className="text-xs text-gray-600 mt-1">
                      {warrantyStatus.days} jours restants
                    </div>
                  )}
                  {warrantyStatus.days < 0 && (
                    <div className="text-xs text-gray-600 mt-1">
                      Expirée depuis {Math.abs(warrantyStatus.days)} jours
                    </div>
                  )}
                </div>
              )}

              {/* Project Link */}
              {asset.project && (
                <div className="mb-4 px-3 py-2 bg-blue-50 rounded text-sm">
                  <span className="text-gray-600">Projet: </span>
                  <span className="text-blue-600 font-medium">{asset.project.name}</span>
                </div>
              )}

              <div className="flex gap-2">
                <button 
                  onClick={() => handleEdit(asset)}
                  className="flex-1 text-blue-600 hover:text-blue-700 text-sm font-medium border border-blue-600 rounded px-3 py-2 hover:bg-blue-50"
                >
                  Modifier
                </button>
                <button 
                  onClick={() => handleDelete(asset.id)}
                  className="flex-1 text-red-600 hover:text-red-700 text-sm font-medium border border-red-600 rounded px-3 py-2 hover:bg-red-50"
                >
                  Supprimer
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredAssets.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-600">Aucun matériel trouvé</p>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                {editingAsset ? 'Modifier le matériel' : 'Nouveau matériel'}
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                    <input
                      type="text"
                      required
                      value={formData.type}
                      onChange={(e) => setFormData({...formData, type: e.target.value})}
                      placeholder="Ex: Ordinateur, Serveur, Mobilier..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Statut</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="active">Actif</option>
                      <option value="maintenance">Maintenance</option>
                      <option value="disposed">Retiré</option>
                    </select>
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      rows={2}
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date d'achat *</label>
                    <input
                      type="date"
                      required
                      value={formData.purchaseDate}
                      onChange={(e) => setFormData({...formData, purchaseDate: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date fin garantie</label>
                    <input
                      type="date"
                      value={formData.warranty}
                      onChange={(e) => setFormData({...formData, warranty: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Coût *</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formData.purchaseCost}
                      onChange={(e) => setFormData({...formData, purchaseCost: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Devise</label>
                    <select
                      value={formData.currency}
                      onChange={(e) => setFormData({...formData, currency: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="BTC">BTC (₿)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="USD">USD ($)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Numéro de série</label>
                    <input
                      type="text"
                      value={formData.serialNumber}
                      onChange={(e) => setFormData({...formData, serialNumber: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fournisseur</label>
                    <input
                      type="text"
                      value={formData.supplier}
                      onChange={(e) => setFormData({...formData, supplier: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Projet associé</label>
                    <select
                      value={formData.projectId}
                      onChange={(e) => setFormData({...formData, projectId: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Aucun projet</option>
                      {projects.map(project => (
                        <option key={project.id} value={project.id}>{project.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                    <textarea
                      rows={2}
                      value={formData.notes}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="flex gap-2 justify-end pt-4">
                  <button
                    type="button"
                    onClick={() => { setShowModal(false); resetForm(); }}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    {editingAsset ? 'Mettre à jour' : 'Créer'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
