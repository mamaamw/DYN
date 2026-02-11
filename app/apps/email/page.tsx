'use client';

import { 
  Mail, Archive, Trash2, Reply, ReplyAll, Forward, Star, 
  Inbox, Send, FileText, FolderArchive, AlertCircle, 
  Search, Plus, Paperclip, X, MoreVertical, RefreshCw,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import { useState, useEffect } from 'react';

interface EmailAttachment {
  id: number;
  filename: string;
  filesize: number;
  mimetype: string;
  url: string;
}

interface Email {
  id: number;
  from: string;
  to: string;
  cc?: string;
  bcc?: string;
  subject: string;
  body: string;
  folder: string;
  isRead: boolean;
  isStarred: boolean;
  isImportant: boolean;
  sentAt?: string;
  createdAt: string;
  attachments: EmailAttachment[];
}

const FOLDERS = [
  { id: 'inbox', name: 'Boîte de réception', icon: Inbox, color: 'text-blue-600' },
  { id: 'sent', name: 'Envoyés', icon: Send, color: 'text-green-600' },
  { id: 'drafts', name: 'Brouillons', icon: FileText, color: 'text-gray-600' },
  { id: 'archived', name: 'Archivés', icon: FolderArchive, color: 'text-purple-600' },
  { id: 'spam', name: 'Spam', icon: AlertCircle, color: 'text-orange-600' },
  { id: 'trash', name: 'Corbeille', icon: Trash2, color: 'text-red-600' },
];

export default function EmailPage() {
  const [emails, setEmails] = useState<Email[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [currentFolder, setCurrentFolder] = useState('inbox');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCompose, setShowCompose] = useState(false);
  const [loading, setLoading] = useState(false);
  const [composeData, setComposeData] = useState({
    from: 'user@dyn.com',
    to: '',
    cc: '',
    bcc: '',
    subject: '',
    body: '',
  });
  const [showStarredOnly, setShowStarredOnly] = useState(false);
  const [isReply, setIsReply] = useState(false);
  const [replyType, setReplyType] = useState<'reply' | 'replyAll' | 'forward'>('reply');

  const selectedEmail = emails.find((e) => e.id === selectedId);

  useEffect(() => {
    fetchEmails();
  }, [currentFolder, searchQuery, showStarredOnly]);

  async function fetchEmails() {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        folder: currentFolder,
        ...(searchQuery && { search: searchQuery }),
        ...(showStarredOnly && { starred: 'true' }),
      });

      const response = await fetch(`/api/emails?${params}`);
      if (response.ok) {
        const data = await response.json();
        setEmails(data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des emails:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSendEmail(isDraft = false) {
    try {
      const response = await fetch('/api/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...composeData,
          folder: isDraft ? 'drafts' : 'sent',
        }),
      });

      if (response.ok) {
        setShowCompose(false);
        setComposeData({
          from: 'user@dyn.com',
          to: '',
          cc: '',
          bcc: '',
          subject: '',
          body: '',
        });
        fetchEmails();
      }
    } catch (error) {
      console.error('Erreur lors de l\'envoi:', error);
    }
  }

  async function handleUpdateEmail(id: number, updates: Partial<Email>) {
    try {
      const response = await fetch(`/api/emails/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        fetchEmails();
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
    }
  }

  async function handleDeleteEmail(id: number) {
    try {
      const response = await fetch(`/api/emails/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setSelectedId(null);
        fetchEmails();
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
    }
  }

  function handleReply(type: 'reply' | 'replyAll' | 'forward') {
    if (!selectedEmail) return;

    setReplyType(type);
    setIsReply(true);
    
    let to = '';
    let cc = '';
    let subject = '';
    let body = '';

    if (type === 'reply') {
      to = selectedEmail.from;
      subject = `Re: ${selectedEmail.subject}`;
      body = `\n\n--- Message original ---\nDe: ${selectedEmail.from}\nSujet: ${selectedEmail.subject}\n\n${selectedEmail.body}`;
    } else if (type === 'replyAll') {
      to = selectedEmail.from;
      cc = selectedEmail.cc || '';
      subject = `Re: ${selectedEmail.subject}`;
      body = `\n\n--- Message original ---\nDe: ${selectedEmail.from}\nÀ: ${selectedEmail.to}\nSujet: ${selectedEmail.subject}\n\n${selectedEmail.body}`;
    } else if (type === 'forward') {
      subject = `Fwd: ${selectedEmail.subject}`;
      body = `\n\n--- Message transféré ---\nDe: ${selectedEmail.from}\nÀ: ${selectedEmail.to}\nSujet: ${selectedEmail.subject}\n\n${selectedEmail.body}`;
    }

    setComposeData({
      from: 'user@dyn.com',
      to,
      cc,
      bcc: '',
      subject,
      body,
    });
    setShowCompose(true);
  }

  function handleMoveToFolder(id: number, folder: string) {
    const email = emails.find(e => e.id === id);
    if (email) {
      handleUpdateEmail(id, { ...email, folder });
    }
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (hours < 24) {
      return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    } else if (hours < 48) {
      return 'Hier';
    } else {
      return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    }
  }

  function formatFileSize(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  const unreadCount = emails.filter(e => !e.isRead).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Email</h1>
          <p className="text-gray-600 mt-1">
            {unreadCount > 0 ? `${unreadCount} message(s) non lu(s)` : 'Aucun message non lu'}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchEmails}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center gap-2"
          >
            <RefreshCw size={18} />
            <span>Actualiser</span>
          </button>
          <button
            onClick={() => {
              setShowCompose(true);
              setIsReply(false);
              setComposeData({
                from: 'user@dyn.com',
                to: '',
                cc: '',
                bcc: '',
                subject: '',
                body: '',
              });
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
          >
            <Plus size={18} />
            <span>Nouveau message</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher dans les emails..."
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
        </div>
      </div>

      {/* Email Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[700px]">
        {/* Folders */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm p-4 overflow-y-auto">
          <h3 className="font-semibold text-gray-900 mb-4">Dossiers</h3>
          <div className="space-y-1">
            {FOLDERS.map((folder) => {
              const Icon = folder.icon;
              const count = emails.filter(e => e.folder === folder.id).length;
              return (
                <div
                  key={folder.id}
                  onClick={() => {
                    setCurrentFolder(folder.id);
                    setSelectedId(null);
                  }}
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

        {/* Email List */}
        <div className="lg:col-span-4 bg-white rounded-lg shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b">
            <h3 className="font-semibold text-gray-900">
              {FOLDERS.find(f => f.id === currentFolder)?.name}
            </h3>
            <p className="text-sm text-gray-500 mt-1">{emails.length} message(s)</p>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <RefreshCw className="animate-spin text-gray-400" size={24} />
              </div>
            ) : emails.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-gray-500">
                <Mail size={48} className="mb-2 opacity-50" />
                <p>Aucun email</p>
              </div>
            ) : (
              emails.map((email) => (
                <div
                  key={email.id}
                  onClick={() => setSelectedId(email.id)}
                  className={`p-4 border-b cursor-pointer transition ${
                    selectedId === email.id
                      ? 'bg-blue-50 border-l-4 border-l-blue-500'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex gap-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUpdateEmail(email.id, { ...email, isStarred: !email.isStarred });
                      }}
                      className="flex-shrink-0 mt-1"
                    >
                      <Star
                        size={16}
                        className={email.isStarred ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
                      />
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p
                          className={`text-sm truncate ${
                            email.isRead ? 'font-normal text-gray-700' : 'font-bold text-gray-900'
                          }`}
                        >
                          {currentFolder === 'sent' ? `À: ${email.to}` : email.from}
                        </p>
                        <span className="text-xs text-gray-500 whitespace-nowrap">
                          {formatDate(email.sentAt || email.createdAt)}
                        </span>
                      </div>
                      <p className={`text-sm mt-1 truncate ${email.isRead ? 'text-gray-600' : 'font-semibold text-gray-900'}`}>
                        {email.subject}
                      </p>
                      <p className="text-xs text-gray-500 mt-1 truncate">
                        {email.body.substring(0, 80)}...
                      </p>
                      {email.attachments.length > 0 && (
                        <div className="flex items-center gap-1 mt-2">
                          <Paperclip size={14} className="text-gray-400" />
                          <span className="text-xs text-gray-500">
                            {email.attachments.length} pièce(s) jointe(s)
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Email Detail */}
        <div className="lg:col-span-6 bg-white rounded-lg shadow-sm flex flex-col overflow-hidden">
          {selectedEmail ? (
            <>
              {/* Email Header */}
              <div className="p-6 border-b">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-xl font-semibold text-gray-900 flex-1">
                    {selectedEmail.subject}
                  </h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUpdateEmail(selectedEmail.id, { ...selectedEmail, isStarred: !selectedEmail.isStarred })}
                      className="p-2 hover:bg-gray-100 rounded-lg transition"
                    >
                      <Star
                        size={20}
                        className={selectedEmail.isStarred ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'}
                      />
                    </button>
                    <button
                      onClick={() => handleUpdateEmail(selectedEmail.id, { ...selectedEmail, isImportant: !selectedEmail.isImportant })}
                      className={`p-2 hover:bg-gray-100 rounded-lg transition ${
                        selectedEmail.isImportant ? 'text-red-500' : 'text-gray-400'
                      }`}
                    >
                      <AlertCircle size={20} />
                    </button>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-600">De:</span>
                    <span className="text-gray-900">{selectedEmail.from}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-600">À:</span>
                    <span className="text-gray-900">{selectedEmail.to}</span>
                  </div>
                  {selectedEmail.cc && (
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-600">Cc:</span>
                      <span className="text-gray-900">{selectedEmail.cc}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-600">Date:</span>
                    <span className="text-gray-900">
                      {new Date(selectedEmail.sentAt || selectedEmail.createdAt).toLocaleString('fr-FR')}
                    </span>
                  </div>
                </div>

                {selectedEmail.attachments.length > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm font-medium text-gray-600 mb-2">
                      Pièces jointes ({selectedEmail.attachments.length})
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {selectedEmail.attachments.map((att) => (
                        <div
                          key={att.id}
                          className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200"
                        >
                          <Paperclip size={16} className="text-gray-400" />
                          <span className="text-sm text-gray-700">{att.filename}</span>
                          <span className="text-xs text-gray-500">({formatFileSize(att.filesize)})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Email Body */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="prose max-w-none">
                  <p className="text-gray-700 whitespace-pre-wrap">{selectedEmail.body}</p>
                </div>
              </div>

              {/* Email Actions */}
              <div className="p-4 border-t bg-gray-50">
                <div className="flex gap-2">
                  <button
                    onClick={() => handleReply('reply')}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    <Reply size={18} />
                    <span>Répondre</span>
                  </button>
                  <button
                    onClick={() => handleReply('replyAll')}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                  >
                    <ReplyAll size={18} />
                    <span>Répondre à tous</span>
                  </button>
                  <button
                    onClick={() => handleReply('forward')}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                  >
                    <Forward size={18} />
                    <span>Transférer</span>
                  </button>
                  <button
                    onClick={() => handleMoveToFolder(selectedEmail.id, 'archived')}
                    className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                  >
                    <Archive size={18} className="text-gray-600" />
                  </button>
                  <button
                    onClick={() => handleDeleteEmail(selectedEmail.id)}
                    className="p-2 border border-red-300 rounded-lg hover:bg-red-50 transition"
                  >
                    <Trash2 size={18} className="text-red-600" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <Mail size={64} className="mx-auto mb-4 opacity-30" />
                <p className="text-lg">Sélectionnez un email pour le lire</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Compose Modal */}
      {showCompose && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                {isReply ? `${replyType === 'forward' ? 'Transférer' : 'Répondre'}: ${composeData.subject}` : 'Nouveau message'}
              </h3>
              <button
                onClick={() => setShowCompose(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">De</label>
                <input
                  type="email"
                  value={composeData.from}
                  onChange={(e) => setComposeData({ ...composeData, from: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  readOnly
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">À</label>
                <input
                  type="email"
                  value={composeData.to}
                  onChange={(e) => setComposeData({ ...composeData, to: e.target.value })}
                  placeholder="destinataire@exemple.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cc</label>
                  <input
                    type="email"
                    value={composeData.cc}
                    onChange={(e) => setComposeData({ ...composeData, cc: e.target.value })}
                    placeholder="copie@exemple.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cci</label>
                  <input
                    type="email"
                    value={composeData.bcc}
                    onChange={(e) => setComposeData({ ...composeData, bcc: e.target.value })}
                    placeholder="copiecachee@exemple.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sujet</label>
                <input
                  type="text"
                  value={composeData.subject}
                  onChange={(e) => setComposeData({ ...composeData, subject: e.target.value })}
                  placeholder="Sujet du message"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                <textarea
                  value={composeData.body}
                  onChange={(e) => setComposeData({ ...composeData, body: e.target.value })}
                  placeholder="Écrivez votre message ici..."
                  rows={12}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="p-4 border-t bg-gray-50 flex items-center justify-between">
              <button
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition"
              >
                <Paperclip size={18} />
                <span>Joindre un fichier</span>
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => handleSendEmail(true)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  Enregistrer comme brouillon
                </button>
                <button
                  onClick={() => handleSendEmail(false)}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
                >
                  <Send size={18} />
                  <span>Envoyer</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}