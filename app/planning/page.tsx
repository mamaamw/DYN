'use client';

import { useEffect, useState } from 'react';
import { Calendar, TestTube, Check } from 'lucide-react';
import { Card } from '@/components/ui/Card';

interface ContactIdentifierData {
  id: number;
  accountNumber: string;
  accountType: string;
  tasks: string | null;
  newClient: {
    id: number;
    nickname: string | null;
    firstName: string | null;
    surname: string | null;
    priority: string;
    createdAt: string;
  };
}

interface TaskEntry {
  contactId: number;
  contact: ContactIdentifierData;
  taskName: string;
  actions: string[];
  tools: string[];
}

export default function PlanningPage() {
  const [taskActions, setTaskActions] = useState<Map<string, string[]>>(new Map());
  const [taskTools, setTaskTools] = useState<Map<string, string[]>>(new Map());
  const [contacts, setContacts] = useState<ContactIdentifierData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    // Charger les actions et outils
    const savedActions = localStorage.getItem('task_actions');
    if (savedActions) {
      try {
        const parsed = JSON.parse(savedActions);
        setTaskActions(new Map(Object.entries(parsed)));
      } catch (e) {
        console.error('Erreur lecture actions:', e);
      }
    }

    const savedTools = localStorage.getItem('task_tools');
    if (savedTools) {
      try {
        const parsed = JSON.parse(savedTools);
        setTaskTools(new Map(Object.entries(parsed)));
      } catch (e) {
        console.error('Erreur lecture tools:', e);
      }
    }

    // Charger les contacts validés
    const savedValidated = localStorage.getItem('panda_validated_rows');
    let validatedIds: number[] = [];
    if (savedValidated) {
      try {
        validatedIds = JSON.parse(savedValidated);
      } catch (e) {
        console.error('Erreur lecture validated rows:', e);
      }
    }

    // Charger tous les contacts depuis l'API
    try {
      const response = await fetch('/api/panda');
      if (!response.ok) throw new Error('Erreur de chargement');
      
      const data = await response.json();
      const validated = (data.contacts || []).filter((contact: ContactIdentifierData) => 
        validatedIds.includes(contact.id)
      );
      setContacts(validated);
    } catch (err) {
      console.error('Erreur:', err);
    } finally {
      setLoading(false);
    }
  };

  const getTasksByAction = (action: string): TaskEntry[] => {
    const entries: TaskEntry[] = [];
    
    taskActions.forEach((actions, key) => {
      if (actions.includes(action)) {
        const [contactIdStr, ...taskParts] = key.split('-');
        const contactId = parseInt(contactIdStr);
        const taskName = taskParts.join('-');
        
        const contact = contacts.find(c => c.id === contactId);
        const tools = taskTools.get(key) || [];
        
        if (contact) {
          entries.push({
            contactId,
            contact,
            taskName,
            actions,
            tools
          });
        }
      }
    });
    
    return entries;
  };

  const getClientName = (client: ContactIdentifierData['newClient']) => {
    if (client.nickname) return client.nickname;
    if (client.firstName && client.surname) return `${client.firstName} ${client.surname}`;
    if (client.firstName) return client.firstName;
    if (client.surname) return client.surname;
    return 'Sans nom';
  };

  const generateCustomId = (contact: ContactIdentifierData) => {
    const clientCreationYear = new Date(contact.newClient.createdAt).getFullYear();
    const lastTwoDigits = clientCreationYear.toString().slice(-2);
    
    const clientContacts = contacts
      .filter(c => c.newClient.id === contact.newClient.id)
      .sort((a, b) => a.id - b.id);
    
    const contactPosition = clientContacts.findIndex(c => c.id === contact.id) + 1;
    
    return `${lastTwoDigits}-${contact.newClient.id}-${contactPosition}`;
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

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  const testerTasks = getTasksByAction('tester');
  const faireTasks = getTasksByAction('faire');

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Calendar size={28} />
            Planning des Tâches
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Vue d'ensemble de toutes les tâches planifiées
          </p>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-800 dark:text-purple-400">À Tester</p>
              <p className="text-3xl font-bold text-purple-900 dark:text-purple-300">{testerTasks.length}</p>
            </div>
            <div className="text-4xl">🧪</div>
          </div>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-800 dark:text-green-400">À Faire</p>
              <p className="text-3xl font-bold text-green-900 dark:text-green-300">{faireTasks.length}</p>
            </div>
            <div className="text-4xl">✅</div>
          </div>
        </Card>
      </div>

      {/* À Tester */}
      <Card>
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            🧪 À Tester
            <span className="text-sm font-normal text-slate-500 dark:text-slate-400">
              ({testerTasks.length} tâche{testerTasks.length > 1 ? 's' : ''})
            </span>
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Client</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Tâche</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Account Number</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Outil</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Priorité</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-700">
              {testerTasks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                    Aucune tâche à tester
                  </td>
                </tr>
              ) : (
                testerTasks.map((entry, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="text-sm font-mono font-semibold text-blue-600 dark:text-blue-400">
                        {generateCustomId(entry.contact)}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-white">
                      {getClientName(entry.contact.newClient)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-300">
                      {entry.taskName}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-300">
                      {entry.contact.accountNumber}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-300">
                      <div className="flex flex-wrap gap-1">
                        {entry.tools.map(tool => (
                          <span key={tool} className="inline-flex items-center px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-xs">
                            {tool === 'obtu' && '🔨 Obtu'}
                            {tool === 'aigu' && '🔪 Aigu'}
                            {tool === 'les-deux' && '⚔️ Les deux'}
                          </span>
                        ))}
                        {entry.tools.length === 0 && <span className="text-slate-400">-</span>}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(entry.contact.newClient.priority)}`}>
                        {entry.contact.newClient.priority}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* À Faire */}
      <Card>
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            ✅ À Faire
            <span className="text-sm font-normal text-slate-500 dark:text-slate-400">
              ({faireTasks.length} tâche{faireTasks.length > 1 ? 's' : ''})
            </span>
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Client</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Tâche</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Account Number</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Outil</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Priorité</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-700">
              {faireTasks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                    Aucune tâche à faire
                  </td>
                </tr>
              ) : (
                faireTasks.map((entry, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="text-sm font-mono font-semibold text-blue-600 dark:text-blue-400">
                        {generateCustomId(entry.contact)}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-white">
                      {getClientName(entry.contact.newClient)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-300">
                      {entry.taskName}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-300">
                      {entry.contact.accountNumber}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-300">
                      <div className="flex flex-wrap gap-1">
                        {entry.tools.map(tool => (
                          <span key={tool} className="inline-flex items-center px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-xs">
                            {tool === 'obtu' && '🔨 Obtu'}
                            {tool === 'aigu' && '🔪 Aigu'}
                            {tool === 'les-deux' && '⚔️ Les deux'}
                          </span>
                        ))}
                        {entry.tools.length === 0 && <span className="text-slate-400">-</span>}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(entry.contact.newClient.priority)}`}>
                        {entry.contact.newClient.priority}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
