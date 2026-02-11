'use client';

import { 
  FileUp, File, Download, Trash2, Share2, Star, 
  Folder, Search, Grid, List, MoreVertical, Eye,
  FileText, FileImage, FileVideo, FileAudio, Archive,
  Plus, X, Edit, Tag, Filter, Upload, FolderPlus
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

interface StorageFile {
  id: number;
  filename: string;
  originalName: string;
  filesize: number;
  mimetype: string;
  path: string;
  url?: string;
  folder?: string;
  description?: string;
  isPublic: boolean;
  isStarred: boolean;
  tags?: string;
  downloadCount: number;
  createdAt: string;
  updatedAt: string;
}

const FOLDERS = [
  { id: 'all', name: 'Tous les fichiers', icon: File, color: 'text-gray-600' },
  { id: 'documents', name: 'Documents', icon: FileText, color: 'text-blue-600' },
  { id: 'images', name: 'Images', icon: FileImage, color: 'text-green-600' },
  { id: 'videos', name: 'Vidéos', icon: FileVideo, color: 'text-purple-600' },
  { id: 'audio', name: 'Audio', icon: FileAudio, color: 'text-orange-600' },
  { id: 'archives', name: 'Archives', icon: Archive, color: 'text-yellow-600' },
  { id: 'other', name: 'Autres', icon: File, color: 'text-gray-600' },
];

export default function StoragePage() {
  const [files, setFiles] = useState<StorageFile[]>([]);
  const [currentFolder, setCurrentFolder] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [showStarredOnly, setShowStarredOnly] = useState(false);
  const [totalSize, setTotalSize] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<StorageFile | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [uploadData, setUploadData] = useState({
    folder: 'documents',
    description: '',
    tags: '',
  });

  const [editData, setEditData] = useState({
    originalName: '',
    folder: '',
    description: '',
    tags: '',
    isStarred: false,
  });

  const storageTotal = 10 * 1024 * 1024 * 1024; // 10 GB

  useEffect(() => {
    fetchFiles();
  }, [currentFolder, searchQuery, showStarredOnly]);

  async function fetchFiles() {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        ...(currentFolder !== 'all' && { folder: currentFolder }),
        ...(searchQuery && { search: searchQuery }),
        ...(showStarredOnly && { starred: 'true' }),
      });

      const response = await fetch(`/api/storage?${params}`);
      if (response.ok) {
        const data = await response.json();
        setFiles(data.files);
        setTotalSize(data.totalSize);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des fichiers:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', uploadData.folder);
    formData.append('description', uploadData.description);
    formData.append('tags', uploadData.tags);

    try {
      setUploadProgress(0);
      const response = await fetch('/api/storage', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        setUploadProgress(100);
        setShowUploadModal(false);
        setUploadData({ folder: 'documents', description: '', tags: '' });
        fetchFiles();
        
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    } catch (error) {
      console.error('Erreur lors de l\'upload:', error);
    }
  }

  async function handleUpdateFile() {
    if (!selectedFile) return;

    try {
      const response = await fetch(`/api/storage/${selectedFile.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData),
      });

      if (response.ok) {
        setShowEditModal(false);
        setSelectedFile(null);
        fetchFiles();
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
    }
  }

  async function handleDeleteFile(id: number) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce fichier ?')) return;

    try {
      const response = await fetch(`/api/storage/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchFiles();
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
    }
  }

  async function handleToggleStar(file: StorageFile) {
    try {
      await fetch(`/api/storage/${file.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...file, isStarred: !file.isStarred }),
      });
      fetchFiles();
    } catch (error) {
      console.error('Erreur lors du marquage:', error);
    }
  }

  function openEditModal(file: StorageFile) {
    setSelectedFile(file);
    setEditData({
      originalName: file.originalName,
      folder: file.folder || 'documents',
      description: file.description || '',
      tags: file.tags || '',
      isStarred: file.isStarred,
    });
    setShowEditModal(true);
  }

  function formatFileSize(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  }

  function getFileIcon(mimetype: string) {
    if (mimetype.startsWith('image/')) return FileImage;
    if (mimetype.startsWith('video/')) return FileVideo;
    if (mimetype.startsWith('audio/')) return FileAudio;
    if (mimetype.includes('pdf')) return FileText;
    if (mimetype.includes('zip') || mimetype.includes('rar') || mimetype.includes('tar')) return Archive;
    return File;
  }

  function getFileColor(mimetype: string) {
    if (mimetype.startsWith('image/')) return 'text-green-600 bg-green-50';
    if (mimetype.startsWith('video/')) return 'text-purple-600 bg-purple-50';
    if (mimetype.startsWith('audio/')) return 'text-orange-600 bg-orange-50';
    if (mimetype.includes('pdf')) return 'text-red-600 bg-red-50';
    if (mimetype.includes('zip') || mimetype.includes('rar')) return 'text-yellow-600 bg-yellow-50';
    return 'text-gray-600 bg-gray-50';
  }

  const storageUsedPercent = (totalSize / storageTotal) * 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Stockage</h1>
          <p className="text-gray-600 mt-1">Gérez vos fichiers et documents</p>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          <FileUp size={20} />
          <span>Uploader un fichier</span>
        </button>
      </div>

      {/* Storage Stats */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Espace de stockage</h3>
          <p className="text-sm text-gray-600">
            {formatFileSize(totalSize)} / {formatFileSize(storageTotal)} utilisés
          </p>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all ${
              storageUsedPercent > 90 ? 'bg-red-600' : storageUsedPercent > 70 ? 'bg-orange-600' : 'bg-blue-600'
            }`}
            style={{ width: `${Math.min(storageUsedPercent, 100)}%` }}
          />
        </div>
        <p className="text-xs text-gray-600 mt-2">
          {(100 - storageUsedPercent).toFixed(1)}% disponible
        </p>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher des fichiers..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={() => setShowStarredOnly(!showStarredOnly)}
            className={`px-4 py-2 rounded-lg transition flex items-center gap-2 ${
              showStarredOnly
                ? 'bg-yellow-100 text-yellow-700 border border-yellow-300'
                : 'border border-gray-300 hover:bg-gray-50'
            }`}
          >
            <Star size={18} className={showStarredOnly ? 'fill-yellow-400' : ''} />
            <span>Favoris</span>
          </button>
          <div className="flex gap-1 border border-gray-300 rounded-lg p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded ${viewMode === 'list' ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
            >
              <List size={18} />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded ${viewMode === 'grid' ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
            >
              <Grid size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Folders Sidebar */}
        <div className="lg:col-span-3 bg-white rounded-lg shadow-sm p-4">
          <h3 className="font-semibold text-gray-900 mb-4">Dossiers</h3>
          <div className="space-y-1">
            {FOLDERS.map((folder) => {
              const Icon = folder.icon;
              const count = currentFolder === 'all' 
                ? files.length 
                : files.filter(f => f.folder === folder.id).length;
              
              return (
                <div
                  key={folder.id}
                  onClick={() => setCurrentFolder(folder.id)}
                  className={`flex items-center justify-between gap-2 p-3 rounded-lg cursor-pointer transition ${
                    currentFolder === folder.id
                      ? 'bg-blue-50 border border-blue-200'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon size={18} className={folder.color} />
                    <span className="text-sm font-medium text-gray-700">
                      {folder.name}
                    </span>
                  </div>
                  {count > 0 && (
                    <span className="text-xs font-semibold text-gray-500 bg-gray-200 px-2 py-1 rounded-full">
                      {count}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Files Display */}
        <div className="lg:col-span-9">
          {loading ? (
            <div className="bg-white rounded-lg shadow-sm p-12 flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : files.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <File size={64} className="mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucun fichier</h3>
              <p className="text-gray-600 mb-4">Uploadez votre premier fichier pour commencer</p>
              <button
                onClick={() => setShowUploadModal(true)}
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                <FileUp size={18} />
                <span>Uploader un fichier</span>
              </button>
            </div>
          ) : viewMode === 'list' ? (
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Nom</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Taille</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Date</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {files.map((file) => {
                    const FileIcon = getFileIcon(file.mimetype);
                    return (
                      <tr key={file.id} className="border-b hover:bg-gray-50 transition">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => handleToggleStar(file)}
                              className="flex-shrink-0"
                            >
                              <Star
                                size={16}
                                className={file.isStarred ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
                              />
                            </button>
                            <div className={`p-2 rounded-lg ${getFileColor(file.mimetype)}`}>
                              <FileIcon size={20} />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">{file.originalName}</p>
                              {file.description && (
                                <p className="text-xs text-gray-500 truncate max-w-xs">{file.description}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{formatFileSize(file.filesize)}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {new Date(file.createdAt).toLocaleDateString('fr-FR')}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {file.url && (
                              <a
                                href={file.url}
                                download={file.originalName}
                                className="p-1 text-blue-600 hover:bg-blue-50 rounded transition"
                              >
                                <Download size={18} />
                              </a>
                            )}
                            <button
                              onClick={() => openEditModal(file)}
                              className="p-1 text-green-600 hover:bg-green-50 rounded transition"
                            >
                              <Edit size={18} />
                            </button>
                            <button
                              onClick={() => handleDeleteFile(file.id)}
                              className="p-1 text-red-600 hover:bg-red-50 rounded transition"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {files.map((file) => {
                const FileIcon = getFileIcon(file.mimetype);
                return (
                  <div
                    key={file.id}
                    className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className={`p-3 rounded-lg ${getFileColor(file.mimetype)}`}>
                        <FileIcon size={32} />
                      </div>
                      <button
                        onClick={() => handleToggleStar(file)}
                      >
                        <Star
                          size={18}
                          className={file.isStarred ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
                        />
                      </button>
                    </div>
                    <h4 className="text-sm font-medium text-gray-900 truncate mb-1">
                      {file.originalName}
                    </h4>
                    <p className="text-xs text-gray-500 mb-3">{formatFileSize(file.filesize)}</p>
                    <div className="flex items-center gap-1">
                      {file.url && (
                        <a
                          href={file.url}
                          download={file.originalName}
                          className="flex-1 flex items-center justify-center gap-1 px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50 transition"
                        >
                          <Download size={14} />
                        </a>
                      )}
                      <button
                        onClick={() => openEditModal(file)}
                        className="flex-1 flex items-center justify-center gap-1 px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50 transition"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteFile(file.id)}
                        className="flex-1 flex items-center justify-center gap-1 px-2 py-1 text-xs border border-red-300 rounded hover:bg-red-50 text-red-600 transition"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Uploader un fichier</h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sélectionner un fichier
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileUpload}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dossier</label>
                <select
                  value={uploadData.folder}
                  onChange={(e) => setUploadData({ ...uploadData, folder: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {FOLDERS.filter(f => f.id !== 'all').map(folder => (
                    <option key={folder.id} value={folder.id}>{folder.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description (optionnel)</label>
                <textarea
                  value={uploadData.description}
                  onChange={(e) => setUploadData({ ...uploadData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ajoutez une description..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tags (optionnel)</label>
                <input
                  type="text"
                  value={uploadData.tags}
                  onChange={(e) => setUploadData({ ...uploadData, tags: e.target.value })}
                  placeholder="tag1, tag2, tag3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedFile && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Modifier le fichier</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                <input
                  type="text"
                  value={editData.originalName}
                  onChange={(e) => setEditData({ ...editData, originalName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dossier</label>
                <select
                  value={editData.folder}
                  onChange={(e) => setEditData({ ...editData, folder: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {FOLDERS.filter(f => f.id !== 'all').map(folder => (
                    <option key={folder.id} value={folder.id}>{folder.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={editData.description}
                  onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                <input
                  type="text"
                  value={editData.tags}
                  onChange={(e) => setEditData({ ...editData, tags: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="starred"
                  checked={editData.isStarred}
                  onChange={(e) => setEditData({ ...editData, isStarred: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="starred" className="text-sm font-medium text-gray-700">
                  Marquer comme favori
                </label>
              </div>
            </div>

            <div className="p-4 border-t bg-gray-50 flex gap-2 justify-end">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Annuler
              </button>
              <button
                onClick={handleUpdateFile}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
