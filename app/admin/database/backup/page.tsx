'use client';

import { useState, useEffect } from 'react';
import { Database, Download, RefreshCw, AlertTriangle, CheckCircle, Clock, Trash2, X } from 'lucide-react';

interface Backup {
  filename: string;
  size: number;
  created: string;
  compressed: boolean;
}

export default function DatabaseBackupPage() {
  const [backups, setBackups] = useState<Backup[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [compress, setCompress] = useState(true);
  const [deleteModal, setDeleteModal] = useState<{ show: boolean; filename: string | null }>({ show: false, filename: null });

  useEffect(() => {
    loadBackups();
  }, []);

  const loadBackups = async () => {
    try {
      const response = await fetch('/api/admin/database/backup');
      if (response.ok) {
        const data = await response.json();
        setBackups(data.backups || []);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des sauvegardes:', error);
    }
  };

  const deleteBackup = async (filename: string) => {
    try {
      const response = await fetch(`/api/admin/database/backup/${filename}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Sauvegarde supprimée avec succès!' });
        await loadBackups();
      } else {
        const data = await response.json();
        setMessage({ type: 'error', text: data.error || 'Erreur lors de la suppression' });
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      setMessage({ type: 'error', text: 'Erreur lors de la suppression de la sauvegarde' });
    } finally {
      setDeleteModal({ show: false, filename: null });
    }
  };

  const confirmDelete = (filename: string) => {
    setDeleteModal({ show: true, filename });
  };

  const createBackup = async () => {
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/admin/database/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ compress })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: 'Sauvegarde créée avec succès!' });
        await loadBackups();
      } else {
        setMessage({ type: 'error', text: data.error || 'Erreur lors de la sauvegarde' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erreur lors de la création de la sauvegarde' });
    } finally {
      setLoading(false);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(date);
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
          Sauvegarde de la base de données
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Créez et gérez les sauvegardes de votre base de données PostgreSQL
        </p>
      </div>

      {/* Message */}
      {message && (
        <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
          message.type === 'success'
            ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800'
            : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle size={20} />
          ) : (
            <AlertTriangle size={20} />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Créer une sauvegarde */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Database size={24} className="text-blue-600 dark:text-blue-400" />
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
              Créer une nouvelle sauvegarde
            </h2>
          </div>
        </div>

        <div className="mb-4">
          <label className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={compress}
              onChange={(e) => setCompress(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
            <span>Compresser la sauvegarde (recommandé)</span>
          </label>
        </div>

        <button
          onClick={createBackup}
          disabled={loading}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white rounded-lg transition-colors font-medium"
        >
          {loading ? (
            <>
              <RefreshCw size={20} className="animate-spin" />
              <span>Création en cours...</span>
            </>
          ) : (
            <>
              <Download size={20} />
              <span>Créer une sauvegarde</span>
            </>
          )}
        </button>

        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-800 dark:text-blue-300">
            <strong>Note:</strong> Les sauvegardes sont stockées localement dans le dossier <code className="px-1 py-0.5 bg-blue-100 dark:bg-blue-900/50 rounded">backups/</code>. 
            Les 10 sauvegardes les plus récentes sont conservées automatiquement.
          </p>
        </div>
      </div>

      {/* Liste des sauvegardes */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
            Sauvegardes disponibles
          </h2>
          <button
            onClick={loadBackups}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            title="Actualiser"
          >
            <RefreshCw size={20} className="text-slate-600 dark:text-slate-300" />
          </button>
        </div>

        {backups.length === 0 ? (
          <div className="text-center py-12 text-slate-500 dark:text-slate-400">
            <Database size={48} className="mx-auto mb-3 opacity-20" />
            <p>Aucune sauvegarde disponible</p>
          </div>
        ) : (
          <div className="space-y-2">
            {backups.map((backup) => (
              <div
                key={backup.filename}
                className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Database size={20} className="text-slate-400" />
                  <div>
                    <div className="font-medium text-slate-900 dark:text-white">
                      {backup.filename}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1">
                        <Clock size={14} />
                        {formatDate(backup.created)}
                      </span>
                      <span>•</span>
                      <span>{formatSize(backup.size)}</span>
                      {backup.compressed && (
                        <>
                          <span>•</span>
                          <span className="text-green-600 dark:text-green-400">Compressé</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={`/api/admin/database/backup/${backup.filename}`}
                    download
                    className="p-2 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg transition-colors"
                    title="Télécharger"
                  >
                    <Download size={18} />
                  </a>
                  <button
                    onClick={() => confirmDelete(backup.filename)}
                    className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg transition-colors"
                    title="Supprimer"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Avertissement */}
      <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
        <div className="flex gap-3">
          <AlertTriangle size={20} className="text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-yellow-800 dark:text-yellow-300">
            <p className="font-medium mb-1">Important:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Testez régulièrement la restauration de vos sauvegardes</li>
              <li>Stockez également les sauvegardes dans un emplacement externe sécurisé</li>
              <li>Les sauvegardes contiennent des données sensibles - protégez-les en conséquence</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Modal de confirmation de suppression */}
      {deleteModal.show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <AlertTriangle className="text-red-600" size={24} />
                Confirmer la suppression
              </h3>
              <button
                onClick={() => setDeleteModal({ show: false, filename: null })}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mb-6">
              <p className="text-slate-700 dark:text-slate-300 mb-2">
                Êtes-vous sûr de vouloir supprimer la sauvegarde suivante ?
              </p>
              <p className="font-mono text-sm bg-slate-100 dark:bg-slate-700 p-2 rounded text-slate-900 dark:text-white break-all">
                {deleteModal.filename}
              </p>
              <p className="text-red-600 dark:text-red-400 text-sm mt-3 font-medium">
                ⚠️ Cette action est irréversible
              </p>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteModal({ show: false, filename: null })}
                className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={() => deleteModal.filename && deleteBackup(deleteModal.filename)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                <Trash2 size={18} />
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
