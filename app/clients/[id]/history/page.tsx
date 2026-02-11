'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import AppLayout from '@/components/AppLayout';

interface HistoryEntry {
  id: number;
  action: string;
  changes: string | null;
  fieldName: string | null;
  oldValue: string | null;
  newValue: string | null;
  createdAt: string;
  user: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export default function ClientHistory() {
  const params = useParams();
  const id = params.id as string;
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await fetch(`/api/newclients/${id}/history`);
        if (!response.ok) {
          throw new Error('Erreur lors de la récupération de l\'historique');
        }
        const data = await response.json();
        setHistory(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [id]);

  const getActionBadge = (action: string) => {
    const badges = {
      CREATE: 'bg-green-500 text-white',
      UPDATE: 'bg-blue-500 text-white',
      DELETE: 'bg-red-500 text-white',
    };
    return badges[action as keyof typeof badges] || 'bg-gray-500 text-white';
  };

  const getActionLabel = (action: string) => {
    const labels = {
      CREATE: 'Création',
      UPDATE: 'Modification',
      DELETE: 'Suppression',
    };
    return labels[action as keyof typeof labels] || action;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(date);
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

  const renderChanges = (entry: HistoryEntry) => {
    if (!entry.changes) return null;

    try {
      const changes = JSON.parse(entry.changes);

      if (entry.action === 'CREATE') {
        return (
          <div className="mt-2 text-sm text-gray-300">
            <p className="font-semibold mb-1">Données initiales :</p>
            <ul className="list-disc list-inside space-y-1">
              {Object.entries(changes).map(([key, value]) => {
                if (key === 'contactIdentifiers' && Array.isArray(value)) {
                  return (
                    <li key={key} className="mb-2">
                      <span className="font-medium">Identifiants de contact:</span>
                      <ul className="ml-6 mt-1 space-y-2">
                        {value.map((contact: any, idx: number) => (
                          <li key={idx} className="text-green-400">
                            <div>{getContactIcon(contact.accountType)} {contact.accountType}: {contact.accountNumber}</div>
                            {contact.info && (
                              <div className="text-gray-400 text-xs ml-5 mt-0.5 whitespace-pre-wrap">
                                Info: {contact.info}
                              </div>
                            )}
                          </li>
                        ))}
                      </ul>
                    </li>
                  );
                }
                return (
                  <li key={key}>
                    <span className="font-medium">{key}:</span> {String(value)}
                  </li>
                );
              })}
            </ul>
          </div>
        );
      }

      if (entry.action === 'UPDATE') {
        const hasChanges = Object.keys(changes).length > 0;
        if (!hasChanges) {
          return <p className="mt-2 text-sm text-gray-400">Aucune modification détectée</p>;
        }

        return (
          <div className="mt-2 text-sm text-gray-300">
            <p className="font-semibold mb-1">Champs modifiés :</p>
            <ul className="space-y-2">
              {Object.entries(changes).map(([key, value]: [string, any]) => {
                if (key === 'contactIdentifiers') {
                  return (
                    <li key={key} className="border-l-2 border-blue-500 pl-3">
                      <span className="font-medium">Identifiants de contact :</span>
                      <div className="ml-4 mt-1 space-y-2">
                        {value.old && value.old.length > 0 && (
                          <div>
                            <p className="text-orange-400 font-medium mb-1">Anciens ({value.old.length}):</p>
                            <ul className="ml-4 space-y-2">
                              {value.old.map((contact: any, idx: number) => (
                                <li key={idx} className="text-orange-300">
                                  <div>{getContactIcon(contact.accountType)} {contact.accountType}: {contact.accountNumber}</div>
                                  {contact.info && (
                                    <div className="text-gray-400 text-xs ml-5 mt-0.5 whitespace-pre-wrap">
                                      Info: {contact.info}
                                    </div>
                                  )}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {value.new && value.new.length > 0 && (
                          <div>
                            <p className="text-green-400 font-medium mb-1">Nouveaux ({value.new.length}):</p>
                            <ul className="ml-4 space-y-2">
                              {value.new.map((contact: any, idx: number) => (
                                <li key={idx} className="text-green-300">
                                  <div>{getContactIcon(contact.accountType)} {contact.accountType}: {contact.accountNumber}</div>
                                  {contact.info && (
                                    <div className="text-gray-400 text-xs ml-5 mt-0.5 whitespace-pre-wrap">
                                      Info: {contact.info}
                                    </div>
                                  )}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </li>
                  );
                }
                
                return (
                  <li key={key} className="border-l-2 border-blue-500 pl-3">
                    <span className="font-medium">{key}:</span>
                    <div className="ml-4">
                      <p className="text-orange-400">Ancien: {String(value.old || 'vide')}</p>
                      <p className="text-green-400">Nouveau: {String(value.new || 'vide')}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      }

      if (entry.action === 'DELETE') {
        return (
          <div className="mt-2 text-sm text-gray-300">
            <p className="font-semibold mb-1">Client supprimé :</p>
            <p className="text-red-400">
              {changes.nickname || changes.surname || changes.firstName || 'Client sans nom'}
            </p>
          </div>
        );
      }
    } catch (e) {
      return <p className="mt-2 text-sm text-red-400">Erreur lors du parsing des changements</p>;
    }

    return null;
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-400">Chargement de l'historique...</div>
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <div className="flex justify-center items-center h-64">
          <div className="text-red-500">{error}</div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6">
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">Historique des modifications</h1>
          <a
            href={`/clients/${id}`}
            className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded transition-colors"
          >
            ← Retour au client
          </a>
        </div>

        {history.length === 0 ? (
          <div className="bg-[#0f172a] border border-[#1b2436] rounded-lg p-8 text-center">
            <p className="text-gray-400">Aucun historique disponible pour ce client</p>
          </div>
        ) : (
          <div className="space-y-4">
            {history.map((entry) => (
              <div
                key={entry.id}
                className="bg-[#0f172a] border border-[#1b2436] rounded-lg p-6 hover:border-blue-500/50 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`px-3 py-1 rounded text-sm font-medium ${getActionBadge(entry.action)}`}>
                        {getActionLabel(entry.action)}
                      </span>
                      <span className="text-gray-400 text-sm">
                        {formatDate(entry.createdAt)}
                      </span>
                    </div>
                    <div className="text-sm text-gray-300 mb-2">
                      Par: <span className="font-medium">{entry.user.firstName} {entry.user.lastName}</span>
                      {' '}({entry.user.email})
                    </div>
                    {renderChanges(entry)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
