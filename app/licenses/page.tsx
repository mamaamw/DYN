'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, AlertTriangle, Calendar, CheckCircle, XCircle } from 'lucide-react';

interface License {
  id: number;
  name: string;
  softwareName: string;
  licenseKey: string;
  startDate: string;
  endDate: string;
  renewalDate: string | null;
  cost: number;
  currency: string;
  status: 'active' | 'expired' | 'expiring-soon';
  projectId: number | null;
  project?: { id: number; name: string };
  notes: string | null;
  createdAt: string;
}

interface Project {
  id: number;
  name: string;
}

export default function LicensesPage() {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingLicense, setEditingLicense] = useState<License | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    softwareName: '',
    licenseKey: '',
    startDate: '',
    endDate: '',
    renewalDate: '',
    cost: '',
    currency: 'BTC',
    status: 'active',
    projectId: '',
    notes: '',
  });

  useEffect(() => {
    loadLicenses();
    loadProjects();
  }, []);

  const loadLicenses = async () => {
    try {
      const response = await fetch('/api/licenses');
      const data = await response.json();
      if (data.success) {
        // Calculate status based on dates
        const now = new Date();
        const licensesWithStatus = data.licenses.map((license: License) => {
          const endDate = new Date(license.endDate);
          const daysUntilExpiry = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          
          let status = 'active';
          if (daysUntilExpiry < 0) {
            status = 'expired';
          } else if (daysUntilExpiry <= 30) {
            status = 'expiring-soon';
          }
          
          return { ...license, status };
        });
        setLicenses(licensesWithStatus);
      }
    } catch (error) {
      console.error('Error loading licenses:', error);
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
      const url = editingLicense ? `/api/licenses/${editingLicense.id}` : '/api/licenses';
      const method = editingLicense ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          cost: parseFloat(formData.cost) || 0,
          projectId: formData.projectId ? parseInt(formData.projectId) : null,
        }),
      });

      const data = await response.json();
      if (data.success) {
        await loadLicenses();
        setShowModal(false);
        resetForm();
      }
    } catch (error) {
      console.error('Error saving license:', error);
    }
  };

  const handleEdit = (license: License) => {
    setEditingLicense(license);
    setFormData({
      name: license.name,
      softwareName: license.softwareName,
      licenseKey: license.licenseKey,
      startDate: license.startDate ? license.startDate.split('T')[0] : '',
      endDate: license.endDate ? license.endDate.split('T')[0] : '',
      renewalDate: license.renewalDate ? license.renewalDate.split('T')[0] : '',
      cost: license.cost.toString(),
      currency: license.currency,
      status: license.status,
      projectId: license.projectId?.toString() || '',
      notes: license.notes || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette licence ?')) return;
    try {
      const response = await fetch(`/api/licenses/${id}`, { method: 'DELETE' });
      const data = await response.json();
      if (data.success) {
        await loadLicenses();
      }
    } catch (error) {
      console.error('Error deleting license:', error);
    }
  };

  const resetForm = () => {
    setEditingLicense(null);
    setFormData({
      name: '',
      softwareName: '',
      licenseKey: '',
      startDate: '',
      endDate: '',
      renewalDate: '',
      cost: '',
      currency: 'BTC',
      status: 'active',
      projectId: '',
      notes: '',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'expiring-soon':
        return 'bg-orange-100 text-orange-800';
      case 'expired':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle size={16} className="text-green-600" />;
      case 'expiring-soon':
        return <AlertTriangle size={16} className="text-orange-600" />;
      case 'expired':
        return <XCircle size={16} className="text-red-600" />;
      default:
        return null;
    }
  };

  const getDaysUntilExpiry = (endDate: string) => {
    const now = new Date();
    const end = new Date(endDate);
    const days = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return days;
  };

  const filteredLicenses = licenses.filter((license) => {
    const matchesSearch = license.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         license.softwareName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || license.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Licences Logiciels</h2>
          <p className="text-gray-600 text-sm">Gérez vos licences et leurs dates d'expiration</p>
        </div>
        <button 
          onClick={() => { resetForm(); setShowModal(true); }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Plus size={18} />
          Nouvelle Licence
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total</p>
              <p className="text-2xl font-bold text-gray-900">{licenses.length}</p>
            </div>
            <Calendar className="text-blue-600" size={32} />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Actives</p>
              <p className="text-2xl font-bold text-green-600">{licenses.filter(l => l.status === 'active').length}</p>
            </div>
            <CheckCircle className="text-green-600" size={32} />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Expirent bientôt</p>
              <p className="text-2xl font-bold text-orange-600">{licenses.filter(l => l.status === 'expiring-soon').length}</p>
            </div>
            <AlertTriangle className="text-orange-600" size={32} />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Expirées</p>
              <p className="text-2xl font-bold text-red-600">{licenses.filter(l => l.status === 'expired').length}</p>
            </div>
            <XCircle className="text-red-600" size={32} />
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
              placeholder="Rechercher des licences..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Tous les statuts</option>
            <option value="active">Actives</option>
            <option value="expiring-soon">Expirent bientôt</option>
            <option value="expired">Expirées</option>
          </select>
        </div>
      </div>

      {/* Licenses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredLicenses.map((license) => {
          const daysUntilExpiry = getDaysUntilExpiry(license.endDate);
          
          return (
            <div key={license.id} className="bg-white rounded-lg shadow hover:shadow-lg transition p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{license.name}</h3>
                  <p className="text-sm text-gray-600 mb-2">{license.softwareName}</p>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(license.status)}
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(license.status)}`}>
                      {license.status === 'active' ? 'Active' : license.status === 'expiring-soon' ? 'Expire bientôt' : 'Expirée'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Date Info */}
              <div className="mb-4 pb-4 border-b border-gray-200 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Début</span>
                  <span className="text-gray-900">{new Date(license.startDate).toLocaleDateString('fr-FR')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Expiration</span>
                  <span className={`font-medium ${license.status === 'expired' ? 'text-red-600' : license.status === 'expiring-soon' ? 'text-orange-600' : 'text-gray-900'}`}>
                    {new Date(license.endDate).toLocaleDateString('fr-FR')}
                  </span>
                </div>
                {daysUntilExpiry > 0 && license.status !== 'expired' && (
                  <div className="text-xs text-gray-600">
                    {daysUntilExpiry} jours restants
                  </div>
                )}
                {license.status === 'expired' && (
                  <div className="text-xs text-red-600 font-medium">
                    Expirée depuis {Math.abs(daysUntilExpiry)} jours
                  </div>
                )}
              </div>

              {/* Cost */}
              <div className="mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Coût</span>
                  <span className="font-medium text-gray-900">{license.cost.toFixed(2)} {license.currency}</span>
                </div>
              </div>

              {/* Project Link */}
              {license.project && (
                <div className="mb-4 px-3 py-2 bg-blue-50 rounded text-sm">
                  <span className="text-gray-600">Projet: </span>
                  <span className="text-blue-600 font-medium">{license.project.name}</span>
                </div>
              )}

              <div className="flex gap-2">
                <button 
                  onClick={() => handleEdit(license)}
                  className="flex-1 text-blue-600 hover:text-blue-700 text-sm font-medium border border-blue-600 rounded px-3 py-2 hover:bg-blue-50"
                >
                  Modifier
                </button>
                <button 
                  onClick={() => handleDelete(license.id)}
                  className="flex-1 text-red-600 hover:text-red-700 text-sm font-medium border border-red-600 rounded px-3 py-2 hover:bg-red-50"
                >
                  Supprimer
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredLicenses.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-600">Aucune licence trouvée</p>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                {editingLicense ? 'Modifier la licence' : 'Nouvelle licence'}
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

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Logiciel *</label>
                    <input
                      type="text"
                      required
                      value={formData.softwareName}
                      onChange={(e) => setFormData({...formData, softwareName: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Clé de licence</label>
                    <input
                      type="text"
                      value={formData.licenseKey}
                      onChange={(e) => setFormData({...formData, licenseKey: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date de début *</label>
                    <input
                      type="date"
                      required
                      value={formData.startDate}
                      onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date d'expiration *</label>
                    <input
                      type="date"
                      required
                      value={formData.endDate}
                      onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date de renouvellement</label>
                    <input
                      type="date"
                      value={formData.renewalDate}
                      onChange={(e) => setFormData({...formData, renewalDate: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Coût</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.cost}
                      onChange={(e) => setFormData({...formData, cost: e.target.value})}
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
                    {editingLicense ? 'Mettre à jour' : 'Créer'}
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
