'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, CheckSquare } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { 
  FaWhatsapp, 
  FaTelegram, 
  FaSkype,
} from 'react-icons/fa';
import { SiSignal } from 'react-icons/si';
import { Phone } from 'lucide-react';

interface ContactIdentifierData {
  id: number;
  accountNumber: string;
  accountType: string;
  createdAt: string;
  newClient: {
    id: number;
    firstName: string | null;
    surname: string | null;
    nickname: string | null;
    requestor: string | null;
    priority: string;
    createdAt: string;
    searches: Array<{
      generalReference: string | null;
      detailedReference: string | null;
      startDate: string | null;
      endDate: string | null;
    }>;
  };
}

const TASK_NAMES: Record<string, string> = {
  'verification-identite': 'Vérification identité',
  'collecte-donnees': 'Collecte données',
  'analyse-reseau': 'Analyse réseau',
  'rapport-preliminaire': 'Rapport préliminaire',
  'rapport-final': 'Rapport final',
  'suivi-client': 'Suivi client',
  'archivage': 'Archivage',
};

export default function TaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const taskSlug = params.slug as string;
  const taskName = TASK_NAMES[taskSlug] || taskSlug;

  const [contacts, setContacts] = useState<ContactIdentifierData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchContacts();
  }, [taskSlug]);

  const fetchContacts = async () => {
    try {
      const response = await fetch('/api/panda');
      if (!response.ok) throw new Error('Erreur de chargement');
      
      const data = await response.json();
      const allContacts = data.contacts || [];
      
      // Filtrer les contacts qui ont cette tâche
      const filteredContacts = allContacts.filter((contact: any) => {
        const tasks = contact.tasks ? JSON.parse(contact.tasks) : [];
        return tasks.includes(taskName);
      });
      
      setContacts(filteredContacts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  const generateCustomId = (contact: ContactIdentifierData, allContacts: ContactIdentifierData[]) => {
    const clientCreationYear = new Date(contact.newClient.createdAt).getFullYear();
    const lastTwoDigits = clientCreationYear.toString().slice(-2);
    
    const clientContacts = allContacts
      .filter(c => c.newClient.id === contact.newClient.id)
      .sort((a, b) => a.id - b.id);
    
    const contactPosition = clientContacts.findIndex(c => c.id === contact.id) + 1;
    
    return `${lastTwoDigits}-${contact.newClient.id}-${contactPosition}`;
  };

  const getClientName = (client: ContactIdentifierData['newClient']) => {
    if (client.nickname) return client.nickname;
    if (client.firstName && client.surname) return `${client.firstName} ${client.surname}`;
    if (client.firstName) return client.firstName;
    if (client.surname) return client.surname;
    return 'Sans nom';
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Immédiate':
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400';
      case 'Haute':
        return 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-400';
      case 'Moyenne':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400';
      case 'Faible':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400';
      default:
        return 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-400';
    }
  };

  const getAccountTypeIcon = (type: string) => {
    const lowerType = type.toLowerCase();
    
    if (lowerType.includes('whatsapp')) {
      return <FaWhatsapp size={14} className="text-white" />;
    } else if (lowerType.includes('telegram')) {
      return <FaTelegram size={14} className="text-white" />;
    } else if (lowerType.includes('signal')) {
      return <SiSignal size={14} className="text-white" />;
    } else if (lowerType.includes('skype')) {
      return <FaSkype size={14} className="text-white" />;
    } else {
      return <Phone size={14} className="text-green-600 dark:text-green-400" />;
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push('/tasks')}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
        >
          <ArrowLeft size={20} className="text-slate-600 dark:text-slate-400" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <CheckSquare size={28} />
            {taskName}
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            {contacts.length} contact{contacts.length > 1 ? 's' : ''} avec cette tâche
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Priorité</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Demandeur</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Réf. Générale</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Réf. Détaillée</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Date Début</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Date Fin</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Client</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Account Number</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-700">
              {contacts.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                    Aucun contact trouvé pour cette tâche
                  </td>
                </tr>
              ) : (
                contacts.map((contact) => {
                  const search = contact.newClient.searches[0];
                  
                  return (
                    <tr key={contact.id} className="hover:bg-slate-50 dark:hover:bg-slate-800">
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className="text-sm font-mono font-semibold text-blue-600 dark:text-blue-400">
                          {generateCustomId(contact, contacts)}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(contact.newClient.priority)}`}>
                          {contact.newClient.priority}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-300">
                        {contact.newClient.requestor || '-'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-300">
                        {search?.generalReference || '-'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-300">
                        {search?.detailedReference || '-'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-300">
                        {formatDate(search?.startDate || null)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-300">
                        {formatDate(search?.endDate || null)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-white">
                        {getClientName(contact.newClient)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className="flex items-center gap-2 text-sm text-slate-900 dark:text-slate-300">
                          {getAccountTypeIcon(contact.accountType)}
                          {contact.accountType}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-300">
                        {contact.accountNumber}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
