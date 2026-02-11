'use client';

import { useEffect, useState } from 'react';
import { Database, Table, Edit, Trash2, X, RefreshCw, AlertCircle, Search as SearchIcon, Trash } from 'lucide-react';
import Toast, { ToastType } from '@/components/ui/Toast';
import ConfirmModal from '@/components/ui/ConfirmModal';

// Types
interface TableData {
  data: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  columns: string[];
  tableName: string;
}

interface EditModalData {
  isOpen: boolean;
  record: any;
  tableName: string;
  columns: string[];
}

const AVAILABLE_TABLES = [
  { value: 'User', label: 'Utilisateurs', icon: '👤' },
  { value: 'Client', label: 'Clients (Ancien)', icon: '🏢' },
  { value: 'NewClient', label: 'Clients (Nouveau)', icon: '🏢' },
  { value: 'Category', label: 'Catégories', icon: '📁' },
  { value: 'UserCategory', label: 'Catégories Utilisateurs', icon: '🏷️' },
  { value: 'ContactIdentifier', label: 'Identifiants Contact', icon: '📧' },
  { value: 'Search', label: 'Recherches', icon: '🔍' },
  { value: 'SystemLog', label: 'Logs Système (lecture seule)', icon: '📜' }
];

const READ_ONLY_TABLES = ['SystemLog'];
const READ_ONLY_FIELDS = ['id', 'createdAt', 'updatedAt', 'password'];
const PROTECTED_TABLES = ['User', 'SystemLog']; // Tables protégées contre suppression complète

export default function DataManagementPage() {
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [tableData, setTableData] = useState<TableData | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  
  // Modal édition
  const [editModal, setEditModal] = useState<EditModalData>({
    isOpen: false,
    record: null,
    tableName: '',
    columns: []
  });
  const [editFormData, setEditFormData] = useState<any>({});
  
  // Modal suppression
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    recordId: null as number | null,
    tableName: ''
  });

  // Modal suppression complète de table
  const [truncateModal, setTruncateModal] = useState({
    isOpen: false,
    tableName: ''
  });

  // Chargement des données
  const fetchTableData = async (table: string, page: number = 1) => {
    if (!table) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/admin/data/${table}?page=${page}&limit=50`);
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Erreur lors du chargement');
      }

      const data = await res.json();
      setTableData(data);
      setCurrentPage(page);
    } catch (error: any) {
      console.error('Erreur fetchTableData:', error);
      setToast({
        message: error.message || 'Erreur lors du chargement des données',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Charger données quand table sélectionnée
  useEffect(() => {
    if (selectedTable) {
      fetchTableData(selectedTable, 1);
    }
  }, [selectedTable]);

  // Ouvrir modal édition
  const openEditModal = (record: any) => {
    if (!tableData) return;

    setEditModal({
      isOpen: true,
      record,
      tableName: tableData.tableName,
      columns: tableData.columns
    });
    setEditFormData({ ...record });
  };

  // Fermer modal édition
  const closeEditModal = () => {
    setEditModal({
      isOpen: false,
      record: null,
      tableName: '',
      columns: []
    });
    setEditFormData({});
  };

  // Sauvegarder modifications
  const handleSaveEdit = async () => {
    if (!editModal.record) return;

    try {
      const res = await fetch(
        `/api/admin/data/${editModal.tableName}/${editModal.record.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editFormData)
        }
      );

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Erreur lors de la modification');
      }

      setToast({
        message: 'Enregistrement modifié avec succès',
        type: 'success'
      });

      closeEditModal();
      fetchTableData(selectedTable, currentPage);
    } catch (error: any) {
      console.error('Erreur handleSaveEdit:', error);
      setToast({
        message: error.message || 'Erreur lors de la modification',
        type: 'error'
      });
    }
  };

  // Ouvrir modal suppression
  const openDeleteModal = (recordId: number, tableName: string) => {
    setDeleteModal({
      isOpen: true,
      recordId,
      tableName
    });
  };

  // Confirmer suppression
  const handleDelete = async () => {
    if (!deleteModal.recordId) return;

    try {
      const res = await fetch(
        `/api/admin/data/${deleteModal.tableName}/${deleteModal.recordId}`,
        { method: 'DELETE' }
      );

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Erreur lors de la suppression');
      }

      setToast({
        message: 'Enregistrement supprimé avec succès',
        type: 'success'
      });

      setDeleteModal({ isOpen: false, recordId: null, tableName: '' });
      fetchTableData(selectedTable, currentPage);
    } catch (error: any) {
      console.error('Erreur handleDelete:', error);
      setToast({
        message: error.message || 'Erreur lors de la suppression',
        type: 'error'
      });
    }
  };

  // Vider complètement une table
  const handleTruncateTable = async () => {
    if (!truncateModal.tableName) return;

    try {
      const res = await fetch(
        `/api/admin/data/${truncateModal.tableName}/truncate`,
        { method: 'POST' }
      );

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Erreur lors de la suppression');
      }

      const result = await res.json();
      setToast({
        message: result.message || 'Table vidée avec succès',
        type: 'success'
      });

      setTruncateModal({ isOpen: false, tableName: '' });
      fetchTableData(selectedTable, 1);
    } catch (error: any) {
      console.error('Erreur handleTruncateTable:', error);
      setToast({
        message: error.message || 'Erreur lors de la suppression',
        type: 'error'
      });
    }
  };

  // Formater valeur pour affichage
  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'boolean') return value ? '✓' : '✗';
    if (value instanceof Date || (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}T/))) {
      return new Date(value).toLocaleString('fr-FR');
    }
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  // Vérifier si champ est modifiable
  const isFieldEditable = (fieldName: string): boolean => {
    return !READ_ONLY_FIELDS.includes(fieldName);
  };

  // Vérifier si table est modifiable
  const isTableEditable = (tableName: string): boolean => {
    return !READ_ONLY_TABLES.includes(tableName);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Header fixe */}
      <div className="sticky top-0 z-20 bg-slate-900/95 backdrop-blur-sm border-b border-gray-700 p-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Database className="w-8 h-8 text-blue-400" />
            <h1 className="text-3xl font-bold">Gestionnaire de Données</h1>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Sélection de table */}
            <select
              value={selectedTable}
              onChange={(e) => setSelectedTable(e.target.value)}
              className="px-4 py-2 bg-slate-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[300px]"
            >
              <option value="">-- Choisir une table --</option>
              {AVAILABLE_TABLES.map((table) => (
                <option key={table.value} value={table.value}>
                  {table.icon} {table.label}
                </option>
              ))}
            </select>

            {selectedTable && (
              <>
                <button
                  onClick={() => fetchTableData(selectedTable, currentPage)}
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  Actualiser
                </button>

                {!PROTECTED_TABLES.includes(selectedTable) && (
                  <button
                    onClick={() => setTruncateModal({ isOpen: true, tableName: selectedTable })}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50"
                    title="Vider complètement cette table"
                  >
                    <Trash className="w-4 h-4" />
                    Vider la table
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">

        {/* Affichage des données */}
        {tableData && (
          <div className="bg-slate-800 rounded-lg border border-gray-700">
            {/* En-tête */}
            <div className="p-6 border-b border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Table className="w-6 h-6 text-blue-400" />
                  <h2 className="text-xl font-semibold">{tableData.tableName}</h2>
                </div>
                <div className="text-sm text-gray-400">
                  {tableData.pagination.total} enregistrement{tableData.pagination.total > 1 ? 's' : ''}
                </div>
              </div>

              {/* Avertissement lecture seule */}
              {!isTableEditable(tableData.tableName) && (
                <div className="mt-4 flex items-start gap-2 p-3 bg-yellow-900/20 border border-yellow-600/30 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-yellow-200">
                    Cette table est en <strong>lecture seule</strong>. Les modifications et suppressions ne sont pas autorisées.
                  </p>
                </div>
              )}
            </div>

            {/* Tableau */}
            <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
              <table className="w-full">
                <thead className="bg-slate-700/50 sticky top-0 z-10">
                  <tr>
                    {tableData.columns.map((column) => (
                      <th
                        key={column}
                        className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider bg-slate-700/90 backdrop-blur-sm"
                      >
                        {column}
                      </th>
                    ))}
                    {isTableEditable(tableData.tableName) && (
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider bg-slate-700/90 backdrop-blur-sm">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {tableData.data.map((row, rowIndex) => (
                    <tr key={row.id || rowIndex} className="hover:bg-slate-700/30">
                      {tableData.columns.map((column) => (
                        <td key={column} className="px-4 py-3 text-sm">
                          {column === 'password' ? (
                            <span className="text-gray-500">••••••••</span>
                          ) : (
                            <span className={column === 'deleted' && row[column] ? 'text-red-400' : ''}>
                              {formatValue(row[column])}
                            </span>
                          )}
                        </td>
                      ))}
                      {isTableEditable(tableData.tableName) && (
                        <td className="px-4 py-3 text-sm text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openEditModal(row)}
                              className="p-1.5 hover:bg-blue-600/20 rounded transition-colors"
                              title="Éditer"
                            >
                              <Edit className="w-4 h-4 text-blue-400" />
                            </button>
                            <button
                              onClick={() => openDeleteModal(row.id, tableData.tableName)}
                              className="p-1.5 hover:bg-red-600/20 rounded transition-colors"
                              title="Supprimer"
                            >
                              <Trash2 className="w-4 h-4 text-red-400" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {tableData.pagination.totalPages > 1 && (
              <div className="p-4 border-t border-gray-700 flex items-center justify-between">
                <div className="text-sm text-gray-400">
                  Page {tableData.pagination.page} sur {tableData.pagination.totalPages}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => fetchTableData(selectedTable, currentPage - 1)}
                    disabled={currentPage === 1 || loading}
                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Précédent
                  </button>
                  <button
                    onClick={() => fetchTableData(selectedTable, currentPage + 1)}
                    disabled={currentPage === tableData.pagination.totalPages || loading}
                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Suivant
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Message vide */}
        {!tableData && !loading && selectedTable && (
          <div className="bg-slate-800 rounded-lg border border-gray-700 p-12 text-center">
            <SearchIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">Aucune donnée à afficher</p>
          </div>
        )}

        {/* Message initial */}
        {!selectedTable && (
          <div className="bg-slate-800 rounded-lg border border-gray-700 p-12 text-center">
            <Database className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">Sélectionnez une table pour commencer</p>
          </div>
        )}
      </div>

      {/* Modal Édition */}
      {editModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-lg border border-gray-700 max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-gray-700 flex items-center justify-between">
              <h3 className="text-xl font-semibold">Éditer l'enregistrement</h3>
              <button
                onClick={closeEditModal}
                className="p-1 hover:bg-slate-700 rounded transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto flex-1">
              <div className="space-y-4">
                {editModal.columns.map((column) => {
                  const isEditable = isFieldEditable(column);
                  const value = editFormData[column];

                  return (
                    <div key={column}>
                      <label className="block text-sm font-medium mb-1">
                        {column}
                        {!isEditable && (
                          <span className="ml-2 text-xs text-gray-500">(non modifiable)</span>
                        )}
                      </label>
                      
                      {column === 'password' ? (
                        <input
                          type="text"
                          value="********"
                          disabled
                          className="w-full px-3 py-2 bg-slate-900 border border-gray-600 rounded-lg text-gray-500"
                        />
                      ) : typeof value === 'boolean' ? (
                        <select
                          value={String(value)}
                          onChange={(e) => setEditFormData({
                            ...editFormData,
                            [column]: e.target.value === 'true'
                          })}
                          disabled={!isEditable}
                          className="w-full px-3 py-2 bg-slate-900 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                        >
                          <option value="true">Oui (true)</option>
                          <option value="false">Non (false)</option>
                        </select>
                      ) : (
                        <input
                          type="text"
                          value={value || ''}
                          onChange={(e) => setEditFormData({
                            ...editFormData,
                            [column]: e.target.value
                          })}
                          disabled={!isEditable}
                          className="w-full px-3 py-2 bg-slate-900 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-700 flex justify-end gap-3">
              <button
                onClick={closeEditModal}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                Sauvegarder
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Suppression */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, recordId: null, tableName: '' })}
        onConfirm={handleDelete}
        title="Supprimer l'enregistrement"
        message="Êtes-vous sûr de vouloir supprimer cet enregistrement ? Cette action peut être irréversible."
        confirmText="Supprimer"
        type="danger"
      />

      {/* Modal Vider la table */}
      <ConfirmModal
        isOpen={truncateModal.isOpen}
        onClose={() => setTruncateModal({ isOpen: false, tableName: '' })}
        onConfirm={handleTruncateTable}
        title="⚠️ VIDER LA TABLE COMPLÈTE"
        message={`ATTENTION : Vous êtes sur le point de supprimer TOUS les enregistrements de la table "${truncateModal.tableName}". Cette action est IRRÉVERSIBLE et DANGEREUSE. Êtes-vous absolument certain de vouloir continuer ?`}
        confirmText="OUI, TOUT SUPPRIMER"
        type="danger"
      />

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
