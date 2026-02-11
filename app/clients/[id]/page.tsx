'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Edit2, Calendar, User, Phone, AlertCircle, Clock, RefreshCw, Plus, History } from 'lucide-react';
import { getCountryByDialCode } from '@/lib/countries';
import { CountryFlag } from '@/components/ui/CountryFlag';
import { GENERAL_REFERENCES } from '@/lib/constants';

interface ContactIdentifier {
  id: number;
  accountNumber: string;
  accountType: string;
  info: string | null;
}

interface Search {
  id: number;
  generalReference: string | null;
  detailedReference: string | null;
  startDate: string | null;
  endDate: string | null;
  createdAt?: string;
  updatedAt?: string;
}

interface NewClient {
  id: number;
  nickname: string | null;
  surname: string | null;
  firstName: string | null;
  description: string | null;
  requestor: string | null;
  priority: string;
  externalHelp: boolean;
  createdAt: string;
  updatedAt: string;
  contactIdentifiers: ContactIdentifier[];
  searches: Search[];
  user: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export default function ClientDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [client, setClient] = useState<NewClient | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [showNewSearchModal, setShowNewSearchModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showLinkValidationModal, setShowLinkValidationModal] = useState(false);
  const [existingSearchInfo, setExistingSearchInfo] = useState<any>(null);
  const [extending, setExtending] = useState(false);
  const [newEndDate, setNewEndDate] = useState('');
  const [newSearchData, setNewSearchData] = useState({
    generalReference: '',
    detailedReference: '',
    startDate: '',
    endDate: ''
  });
  const [allSearches, setAllSearches] = useState<Search[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchClient();
    fetchSearchHistory();
  }, [id]);

  const fetchClient = async () => {
    try {
      const response = await fetch(`/api/newclients/${id}`);
      if (!response.ok) throw new Error('Client non trouvé');
      const data = await response.json();
      setClient(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Immédiate': return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300';
      case 'Haute': return 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300';
      case 'Moyenne': return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300';
      case 'Faible': return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300';
      default: return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300';
    }
  };

  const getContactIcon = (type: string) => {
    switch (type) {
      case 'Téléphone': return '📞';
      case 'WhatsApp': return '💬';
      case 'Telegram': return '✈️';
      case 'Signal': return '🔒';
      case 'Threema': return '🔐';
      default: return '📱';
    }
  };

  const isSearchExpired = () => {
    if (!client?.searches[0]?.endDate) return false;
    const endDate = new Date(client.searches[0].endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return endDate < today;
  };

  const getDaysUntilExpiry = () => {
    if (!client?.searches[0]?.endDate) return null;
    const endDate = new Date(client.searches[0].endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleExtendDate = async () => {
    if (!newEndDate || !client) return;
    
    setExtending(true);
    try {
      const response = await fetch(`/api/newclients/${client.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nickname: client.nickname,
          surname: client.surname,
          firstName: client.firstName,
          description: client.description,
          requestor: client.requestor,
          priority: client.priority,
          externalHelp: client.externalHelp,
          contactIdentifiers: client.contactIdentifiers,
          generalReference: client.searches[0]?.generalReference,
          detailedReference: client.searches[0]?.detailedReference,
          searchStartDate: client.searches[0]?.startDate,
          searchEndDate: newEndDate,
        }),
      });

      if (!response.ok) throw new Error('Erreur lors de la prolongation');
      
      await fetchClient();
      setShowExtendModal(false);
      setNewEndDate('');
      setSuccessMessage('Date de fin prolongée avec succès');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setExtending(false);
    }
  };

  const handleNewSearch = async (linkToExisting = false) => {
    if (!newSearchData.generalReference || !newSearchData.startDate || !newSearchData.endDate || !client) return;
    
    setExtending(true);
    try {
      const response = await fetch(`/api/newclients/${client.id}/searches`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          generalReference: newSearchData.generalReference,
          detailedReference: newSearchData.detailedReference,
          startDate: newSearchData.startDate,
          endDate: newSearchData.endDate,
          linkToExisting,
        }),
      });

      const data = await response.json();

      // Si l'API retourne requiresValidation, afficher la modal de confirmation
      if (data.requiresValidation) {
        setExistingSearchInfo(data.existingSearch);
        setShowLinkValidationModal(true);
        setExtending(false);
        return;
      }

      if (!response.ok) throw new Error(data.error || 'Erreur lors de la création de la nouvelle recherche');
      
      await fetchClient();
      await fetchSearchHistory();
      setShowNewSearchModal(false);
      setNewSearchData({ generalReference: '', detailedReference: '', startDate: '', endDate: '' });
      setSuccessMessage(linkToExisting ? 'Client lié à la recherche existante avec succès' : 'Nouvelle recherche créée avec succès');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setExtending(false);
    }
  };

  const fetchSearchHistory = async () => {
    try {
      const response = await fetch(`/api/newclients/${id}/searches`);
      if (!response.ok) throw new Error('Erreur lors du chargement de l\'historique');
      const data = await response.json();
      setAllSearches(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching search history:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#121a2d] flex items-center justify-center">
        <div className="text-gray-600 dark:text-gray-400">Chargement...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#121a2d] flex items-center justify-center">
        <div className="text-red-600 dark:text-red-400">Erreur: {error}</div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#121a2d] flex items-center justify-center">
        <div className="text-gray-600 dark:text-gray-400">Client non trouvé</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#121a2d]">
      <header className="bg-white dark:bg-[#0f172a] shadow-sm border-b dark:border-[#1b2436]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Link href="/clients">
                <button className="p-2 hover:bg-gray-100 dark:hover:bg-[#1b2436] rounded-lg">
                  <ArrowLeft size={20} className="text-gray-600 dark:text-gray-400" />
                </button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {client.nickname || 'Client sans surnom'}
                </h1>
                {(client.surname || client.firstName) && (
                  <p className="text-gray-600 dark:text-gray-400">
                    {client.surname} {client.firstName}
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Link href={`/clients/${client.id}/history`}>
                <button className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">
                  <Calendar size={18} />
                  Historique
                </button>
              </Link>
              <Link href={`/clients/${client.id}/edit`}>
                <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  <Edit2 size={18} />
                  Éditer
                </button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Colonne principale */}
          <div className="lg:col-span-2 space-y-6">
            {/* Informations générales */}
            <div className="bg-white dark:bg-[#0f172a] rounded-lg shadow border dark:border-[#1b2436] p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <User size={20} />
                Informations générales
              </h2>
              <dl className="space-y-3">
                <div className="flex justify-between">
                  <dt className="text-sm font-medium text-gray-600 dark:text-gray-400">Surnom</dt>
                  <dd className="text-sm text-gray-900 dark:text-white font-medium">{client.nickname || '-'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm font-medium text-gray-600 dark:text-gray-400">Nom</dt>
                  <dd className="text-sm text-gray-900 dark:text-white">{client.surname || '-'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm font-medium text-gray-600 dark:text-gray-400">Prénom</dt>
                  <dd className="text-sm text-gray-900 dark:text-white">{client.firstName || '-'}</dd>
                </div>
                {client.description && (
                  <div className="pt-2 border-t dark:border-[#1b2436]">
                    <dt className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Description</dt>
                    <dd className="text-sm text-gray-900 dark:text-white">{client.description}</dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Contacts */}
            <div className="bg-white dark:bg-[#0f172a] rounded-lg shadow border dark:border-[#1b2436] p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Phone size={20} />
                Identifiants de contact
              </h2>
              {client.contactIdentifiers.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-sm">Aucun contact enregistré</p>
              ) : (
                <div className="space-y-3">
                  {client.contactIdentifiers.map((contact) => {
                    // Parser le numéro pour extraire le code du pays
                    const match = contact.accountNumber.match(/^(\+\d+)\s*(.*)$/);
                    const country = match ? getCountryByDialCode(match[1]) : null;
                    
                    return (
                      <div 
                        key={contact.id} 
                        className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-[#121a2d] rounded-lg"
                      >
                        <span className="text-2xl">{getContactIcon(contact.accountType)}</span>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            {country && (contact.accountType === 'Téléphone' || contact.accountType === 'WhatsApp' || contact.accountType === 'Telegram' || contact.accountType === 'Signal') && (
                              <CountryFlag 
                                emoji={country.flag}
                                colors={country.flagColors}
                                type={country.flagType}
                                size="md"
                              />
                            )}
                            <span className="font-medium text-gray-900 dark:text-white">
                              {contact.accountNumber}
                            </span>
                            <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
                              {contact.accountType}
                            </span>
                            {country && (contact.accountType === 'Téléphone' || contact.accountType === 'WhatsApp' || contact.accountType === 'Telegram' || contact.accountType === 'Signal') && (
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {country.name}
                              </span>
                            )}
                          </div>
                          {contact.info && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{contact.info}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Références */}
            <div className="bg-white dark:bg-[#0f172a] rounded-lg shadow border dark:border-[#1b2436] p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Références</h2>
                {allSearches.length > 1 && (
                  <button
                    onClick={() => setShowHistoryModal(true)}
                    className="text-xs flex items-center gap-1 px-2 py-1 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                  >
                    <History size={14} />
                    Historique ({allSearches.length})
                  </button>
                )}
              </div>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Référence Générale</dt>
                  <dd className="text-sm text-gray-900 dark:text-white">{client.searches[0]?.generalReference || '-'}</dd>
                </div>
                <div className="pt-2 border-t dark:border-[#1b2436]">
                  <dt className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Référence Détaillée</dt>
                  <dd className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">{client.searches[0]?.detailedReference || '-'}</dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Colonne latérale */}
          <div className="space-y-6">
            {/* Statut et priorité */}
            <div className="bg-white dark:bg-[#0f172a] rounded-lg shadow border dark:border-[#1b2436] p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <AlertCircle size={20} />
                Statut
              </h2>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Priorité</dt>
                  <dd>
                    <span className={`inline-block px-3 py-1 rounded text-sm font-medium ${getPriorityColor(client.priority)}`}>
                      {client.priority}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Demandeur</dt>
                  <dd className="text-sm text-gray-900 dark:text-white">{client.requestor || '-'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Aide externe</dt>
                  <dd className="text-sm">
                    {client.externalHelp ? (
                      <span className="text-green-600 dark:text-green-400">✓ Autorisée</span>
                    ) : (
                      <span className="text-gray-500 dark:text-gray-400">✗ Non autorisée</span>
                    )}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Période de recherche */}
            <div className="bg-white dark:bg-[#0f172a] rounded-lg shadow border dark:border-[#1b2436] p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Calendar size={20} />
                Période de recherche
              </h2>
              
              {/* Alerte si date périmée */}
              {isSearchExpired() && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border-2 border-red-500 dark:border-red-400 rounded-lg">
                  <div className="flex items-center gap-2 text-red-700 dark:text-red-300 font-semibold mb-2">
                    <Clock className="animate-pulse" size={20} />
                    RECHERCHE PÉRIMÉE
                  </div>
                  <p className="text-sm text-red-600 dark:text-red-400">
                    La date de fin est dépassée depuis {Math.abs(getDaysUntilExpiry() || 0)} jour(s)
                  </p>
                </div>
              )}
              
              {/* Alerte si bientôt périmée */}
              {!isSearchExpired() && getDaysUntilExpiry() !== null && getDaysUntilExpiry()! <= 7 && getDaysUntilExpiry()! > 0 && (
                <div className="mb-4 p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-300 dark:border-orange-700 rounded-lg">
                  <div className="flex items-center gap-2 text-orange-700 dark:text-orange-300 font-semibold mb-1">
                    <AlertCircle size={18} />
                    Expiration proche
                  </div>
                  <p className="text-sm text-orange-600 dark:text-orange-400">
                    Plus que {getDaysUntilExpiry()} jour(s) avant expiration
                  </p>
                </div>
              )}
              
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Début</dt>
                  <dd className="text-sm text-gray-900 dark:text-white">
                    {client.searches[0]?.startDate 
                      ? new Date(client.searches[0].startDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
                      : '-'
                    }
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Fin</dt>
                  <dd className={`text-sm font-medium ${
                    isSearchExpired() 
                      ? 'text-red-600 dark:text-red-400' 
                      : 'text-gray-900 dark:text-white'
                  }`}>
                    {client.searches[0]?.endDate 
                      ? new Date(client.searches[0].endDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
                      : '-'
                    }
                    {isSearchExpired() && (
                      <span className="ml-2 text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 px-2 py-0.5 rounded">
                        PÉRIMÉE
                      </span>
                    )}
                  </dd>
                </div>
              </dl>
              
              {/* Boutons d'action */}
              {client.searches[0]?.endDate && (
                <div className="mt-4 pt-4 border-t dark:border-[#1b2436] space-y-2">
                  <button
                    onClick={() => {
                      setNewEndDate(client.searches[0]?.endDate || '');
                      setShowExtendModal(true);
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors"
                  >
                    <RefreshCw size={16} />
                    Prolonger la date
                  </button>
                  <button
                    onClick={() => setShowNewSearchModal(true)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white hover:bg-purple-700 rounded-lg transition-colors"
                  >
                    <Plus size={16} />
                    Nouvelle recherche
                  </button>
                </div>
              )}
            </div>

            {/* Métadonnées */}
            <div className="bg-white dark:bg-[#0f172a] rounded-lg shadow border dark:border-[#1b2436] p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Métadonnées</h2>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Créé le</dt>
                  <dd className="text-sm text-gray-900 dark:text-white">
                    {new Date(client.createdAt).toLocaleDateString('fr-FR', { 
                      day: 'numeric', 
                      month: 'long', 
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Modifié le</dt>
                  <dd className="text-sm text-gray-900 dark:text-white">
                    {new Date(client.updatedAt).toLocaleDateString('fr-FR', { 
                      day: 'numeric', 
                      month: 'long', 
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Créé par</dt>
                  <dd className="text-sm text-gray-900 dark:text-white">
                    {client.user ? `${client.user.firstName} ${client.user.lastName}` : 'Utilisateur inconnu'}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </main>

      {/* Message de succès */}
      {successMessage && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          {successMessage}
        </div>
      )}

      {/* Modal Prolonger la date */}
      {showExtendModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#0f172a] rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <RefreshCw size={20} />
              Prolonger la date de fin
            </h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nouvelle date de fin
              </label>
              <input
                type="date"
                value={newEndDate}
                onChange={(e) => setNewEndDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 border border-gray-300 dark:border-[#1b2436] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-transparent dark:text-white"
              />
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Les références générales et détaillées restent inchangées
              </p>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowExtendModal(false);
                  setNewEndDate('');
                }}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1b2436] rounded-lg transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleExtendDate}
                disabled={extending || !newEndDate}
                className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {extending ? 'Enregistrement...' : 'Prolonger'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Historique des recherches */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#0f172a] rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <History size={20} />
              Historique des recherches ({allSearches.length})
            </h3>
            <div className="space-y-4">
              {allSearches.map((search, index) => {
                const isExpired = search.endDate && new Date(search.endDate) < new Date();
                const isCurrent = index === 0;
                return (
                  <div
                    key={search.id}
                    className={`p-4 rounded-lg border-2 ${
                      isCurrent
                        ? 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                        : isExpired
                        ? 'border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 opacity-75'
                        : 'border-green-500 dark:border-green-400 bg-green-50 dark:bg-green-900/20'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-gray-900 dark:text-white">
                          {search.generalReference || 'Sans référence'}
                        </h4>
                        {isCurrent && (
                          <span className="px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full">
                            ACTUELLE
                          </span>
                        )}
                        {isExpired && !isCurrent && (
                          <span className="px-2 py-0.5 bg-red-600 text-white text-xs rounded-full">
                            PÉRIMÉE
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Créée le {new Date(search.createdAt!).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                    {search.detailedReference && (
                      <p className="text-sm text-gray-700 dark:text-gray-300 mb-3 whitespace-pre-wrap">
                        {search.detailedReference}
                      </p>
                    )}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Début:</span>
                        <span className="ml-2 text-gray-900 dark:text-white font-medium">
                          {search.startDate
                            ? new Date(search.startDate).toLocaleDateString('fr-FR')
                            : '-'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Fin:</span>
                        <span className={`ml-2 font-medium ${
                          isExpired ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'
                        }`}>
                          {search.endDate
                            ? new Date(search.endDate).toLocaleDateString('fr-FR')
                            : '-'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowHistoryModal(false)}
                className="px-4 py-2 bg-gray-600 text-white hover:bg-gray-700 rounded-lg transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Nouvelle recherche */}
      {showNewSearchModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#0f172a] rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Plus size={20} />
              Nouvelle recherche
            </h3>
            <div className="space-y-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Référence Générale *
                </label>
                <select
                  value={newSearchData.generalReference}
                  onChange={(e) => setNewSearchData(prev => ({ ...prev, generalReference: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-[#1b2436] rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-transparent dark:text-white"
                >
                  <option value="">Sélectionnez une référence</option>
                  {GENERAL_REFERENCES.map((ref) => (
                    <option key={ref} value={ref}>
                      {ref}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Référence Détaillée
                </label>
                <textarea
                  value={newSearchData.detailedReference}
                  onChange={(e) => setNewSearchData(prev => ({ ...prev, detailedReference: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-[#1b2436] rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-transparent dark:text-white"
                  placeholder="Détails de la recherche..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Date de début *
                </label>
                <input
                  type="date"
                  value={newSearchData.startDate}
                  onChange={(e) => setNewSearchData(prev => ({ ...prev, startDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-[#1b2436] rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-transparent dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Date de fin *
                </label>
                <input
                  type="date"
                  value={newSearchData.endDate}
                  onChange={(e) => setNewSearchData(prev => ({ ...prev, endDate: e.target.value }))}
                  min={newSearchData.startDate || undefined}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-[#1b2436] rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-transparent dark:text-white"
                />
              </div>
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  ℹ️ Cette nouvelle recherche sera ajoutée à l'historique. La précédente restera accessible.
                </p>
              </div>
              {allSearches.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setShowNewSearchModal(false);
                    setShowHistoryModal(true);
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors border border-blue-300 dark:border-blue-700"
                >
                  <History size={16} />
                  Voir l'historique ({allSearches.length} recherche{allSearches.length > 1 ? 's' : ''})
                </button>
              )}
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowNewSearchModal(false);
                  setNewSearchData({ generalReference: '', detailedReference: '', startDate: '', endDate: '' });
                }}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1b2436] rounded-lg transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={() => handleNewSearch(false)}
                disabled={extending || !newSearchData.generalReference || !newSearchData.startDate || !newSearchData.endDate}
                className="px-4 py-2 bg-purple-600 text-white hover:bg-purple-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {extending ? 'Enregistrement...' : 'Créer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de validation de lien avec recherche existante */}
      {showLinkValidationModal && existingSearchInfo && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#0f1729] rounded-lg p-6 w-full max-w-lg shadow-xl">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <AlertCircle size={20} className="text-orange-500" />
              Recherche existante détectée
            </h3>
            
            <div className="mb-4 p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                Une recherche avec les mêmes références existe déjà :
              </p>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <span className="font-semibold text-gray-600 dark:text-gray-400 min-w-[140px]">Référence Générale:</span>
                  <span className="text-gray-900 dark:text-white">{existingSearchInfo.generalReference || '-'}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-semibold text-gray-600 dark:text-gray-400 min-w-[140px]">Référence Détaillée:</span>
                  <span className="text-gray-900 dark:text-white">{existingSearchInfo.detailedReference || '-'}</span>
                </div>
                {existingSearchInfo.linkedClients && existingSearchInfo.linkedClients.length > 0 && (
                  <div className="flex items-start gap-2">
                    <span className="font-semibold text-gray-600 dark:text-gray-400 min-w-[140px]">Clients liés:</span>
                    <div className="flex flex-col gap-1">
                      {existingSearchInfo.linkedClients.map((client: any) => (
                        <span key={client.id} className="text-gray-900 dark:text-white">
                          • {client.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Voulez-vous lier ce client à la recherche existante ou créer une nouvelle recherche distincte ?
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowLinkValidationModal(false);
                  setExistingSearchInfo(null);
                  setShowNewSearchModal(false);
                  setNewSearchData({ generalReference: '', detailedReference: '', startDate: '', endDate: '' });
                }}
                className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1b2436] rounded-lg transition-colors border border-gray-300 dark:border-gray-600"
              >
                Annuler
              </button>
              <button
                onClick={async () => {
                  setShowLinkValidationModal(false);
                  setExistingSearchInfo(null);
                  // Créer une nouvelle recherche distincte en forçant
                  setExtending(true);
                  try {
                    const response = await fetch(`/api/newclients/${client?.id}/searches`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        generalReference: newSearchData.generalReference + ' (nouvelle)',
                        detailedReference: newSearchData.detailedReference,
                        startDate: newSearchData.startDate,
                        endDate: newSearchData.endDate,
                        linkToExisting: false,
                      }),
                    });
                    
                    if (!response.ok) throw new Error('Erreur');
                    
                    await fetchClient();
                    await fetchSearchHistory();
                    setShowNewSearchModal(false);
                    setNewSearchData({ generalReference: '', detailedReference: '', startDate: '', endDate: '' });
                    setSuccessMessage('Nouvelle recherche créée avec succès');
                    setTimeout(() => setSuccessMessage(null), 3000);
                  } catch (err) {
                    setError('Erreur lors de la création');
                  } finally {
                    setExtending(false);
                  }
                }}
                className="flex-1 px-4 py-2 bg-gray-600 text-white hover:bg-gray-700 rounded-lg transition-colors"
              >
                Créer nouvelle
              </button>
              <button
                onClick={() => {
                  setShowLinkValidationModal(false);
                  setExistingSearchInfo(null);
                  handleNewSearch(true);
                }}
                className="flex-1 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors"
              >
                Lier à l'existante
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
