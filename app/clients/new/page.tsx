'use client';

import { useState, useEffect } from 'react';
import { GENERAL_REFERENCES } from '@/lib/constants';
import { useRouter } from 'next/navigation';
import { AlertCircle, User } from 'lucide-react';

interface ContactIdentifier {
  accountNumber: string;
  accountType: string;
  info: string;
}

interface Category {
  id: number;
  name: string;
  label: string;
  color: string;
  icon?: string;
}

export default function NewClientPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contactErrors, setContactErrors] = useState<string | null>(null);
  const [contactErrorsInternal, setContactErrorsInternal] = useState<string | null>(null);
  const [contactErrorsDatabase, setContactErrorsDatabase] = useState<string | null>(null);
  const [contactWarnings, setContactWarnings] = useState<string | null>(null);
  const [nicknameError, setNicknameError] = useState<string | null>(null);
  const [duplicateIndexes, setDuplicateIndexes] = useState<Set<number>>(new Set());
  const [warningIndexes, setWarningIndexes] = useState<Set<number>>(new Set());
  const [validatingContacts, setValidatingContacts] = useState(false);
  const [userCategories, setUserCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [showLinkValidationModal, setShowLinkValidationModal] = useState(false);
  const [existingSearchInfo, setExistingSearchInfo] = useState<any>(null);
  const [pendingFormData, setPendingFormData] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    nickname: '',
    surname: '',
    firstName: '',
    description: '',
    requestor: '',
    priority: 'Moyenne',
    externalHelp: false,
    generalReference: '',
    detailedReference: '',
    searchStartDate: '',
    searchEndDate: '',
  });

  // Récupération des catégories de l'utilisateur
  useEffect(() => {
    const fetchUserCategories = async () => {
      try {
        // Récupérer le profil utilisateur pour obtenir son ID
        const profileResponse = await fetch('/api/user/profile');
        if (!profileResponse.ok) {
          // Pas d'utilisateur connecté, on continue sans catégories
          console.log('No user profile found, skipping categories');
          setUserCategories([]);
          setLoadingCategories(false);
          return;
        }
        
        const profileData = await profileResponse.json();
        const userId = profileData.user?.id;

        if (!userId) {
          console.error('No user ID found in profile');
          setUserCategories([]);
          return;
        }

        // Récupérer les catégories de l'utilisateur
        const categoriesResponse = await fetch(`/api/users/${userId}/categories`);
        if (!categoriesResponse.ok) {
          const errorData = await categoriesResponse.json();
          console.error('Categories fetch error:', errorData);
          // Ne pas lancer d'erreur si l'utilisateur n'a pas de catégories
          setUserCategories([]);
          return;
        }
        
        const categoriesData = await categoriesResponse.json();
        // L'API retourne { categories: [...] }, on doit extraire le tableau
        const categories = categoriesData.categories || [];
        setUserCategories(Array.isArray(categories) ? categories : []);
      } catch (err) {
        console.error('Error fetching user categories:', err);
        setUserCategories([]);
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchUserCategories();
  }, []);

  // Gestion dynamique des contacts - liste unifiée
  const [contacts, setContacts] = useState<ContactIdentifier[]>([]);

  // Validation en temps réel pour le surnom
  const validateNickname = async (nickname: string) => {
    if (!nickname || nickname.trim() === '') {
      setNicknameError(null);
      return;
    }

    try {
      const response = await fetch('/api/newclients/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          contactIdentifiers: [],
          nickname: nickname.trim()
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.nicknameExists) {
          setNicknameError(`Le surnom "${nickname}" est déjà utilisé par: ${data.existingNicknameClient}`);
        } else {
          setNicknameError(null);
        }
      }
    } catch (err) {
      // Ignorer les erreurs de validation temps réel
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
    
    // Validation en temps réel pour le surnom
    if (name === 'nickname') {
      setTimeout(() => {
        validateNickname(value);
      }, 500);
    }
  };

  const addContact = (type: string) => {
    const newContact: ContactIdentifier = {
      accountNumber: '',
      accountType: type,
      info: ''
    };
    setContacts([...contacts, newContact]);
  };

  const removeContact = (index: number) => {
    setContacts(contacts.filter((_, i) => i !== index));
    // Revérifier après suppression
    validateContactsRealTime(contacts.filter((_, i) => i !== index));
  };

  // Validation en temps réel
  const validateContactsRealTime = async (contactsToValidate: ContactIdentifier[]) => {
    const validContacts = contactsToValidate.filter(c => c.accountNumber.trim() !== '');
    
    if (validContacts.length === 0) {
      setContactErrors(null);
      setContactErrorsInternal(null);
      setContactErrorsDatabase(null);
      setContactWarnings(null);
      setDuplicateIndexes(new Set());
      setWarningIndexes(new Set());
      return;
    }

    // Vérifier les doublons internes d'abord
    const seen = new Map<string, number[]>();
    const duplicates = new Set<number>();
    
    // Parcourir tous les contacts pour identifier les doublons
    contactsToValidate.forEach((contact, index) => {
      if (contact.accountNumber.trim() === '') return;
      
      const key = `${contact.accountNumber}|${contact.accountType}`;
      if (!seen.has(key)) {
        seen.set(key, []);
      }
      seen.get(key)!.push(index);
    });
    
    // Identifier les index des doublons internes
    let hasInternalDuplicates = false;
    seen.forEach((indexes, key) => {
      if (indexes.length > 1) {
        hasInternalDuplicates = true;
        indexes.forEach(idx => duplicates.add(idx));
      }
    });
    
    if (hasInternalDuplicates) {
      const [accountNumber, accountType] = Array.from(seen.entries())
        .find(([_, indexes]) => indexes.length > 1)![0].split('|');
      setContactErrorsInternal(`Le numéro "${accountNumber}" avec le type "${accountType}" apparaît plusieurs fois dans votre formulaire`);
    } else {
      setContactErrorsInternal(null);
    }

    // Vérifier les doublons avec la base de données
    try {
      const accountsToCheck = validContacts.map(c => ({ accountNumber: c.accountNumber, accountType: c.accountType }));
      
      const response = await fetch('/api/newclients/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          contactIdentifiers: accountsToCheck,
          nickname: formData.nickname
        }),
      });

      if (response.ok) {
        const data = await response.json();
        let dbErrorMessage = null;
        let warningsMessage = null;
        
        if (data.duplicates && data.duplicates.length > 0) {
          // Identifier les index des champs qui sont en doublon avec la base de données
          const dbDuplicates = new Set<number>();
          data.duplicates.forEach((duplicate: any) => {
            contactsToValidate.forEach((contact, index) => {
              if (contact.accountNumber === duplicate.accountNumber && contact.accountType === duplicate.accountType) {
                dbDuplicates.add(index);
              }
            });
          });
          
          // Combiner les doublons internes et de base de données
          const allDuplicates = new Set([...duplicates, ...dbDuplicates]);
          setDuplicateIndexes(allDuplicates);
          
          const duplicatesList = data.duplicates.map((d: any) => 
            `${d.accountNumber} (${d.accountType}) - déjà utilisé par: ${d.client}`
          ).join('\n');
          dbErrorMessage = `Certains numéros existent déjà dans la base de données:\n${duplicatesList}`;
          setContactErrorsDatabase(dbErrorMessage);
        } else {
          setContactErrorsDatabase(null);
          // Si pas de doublons DB mais des doublons internes, garder seulement les internes
          setDuplicateIndexes(duplicates);
        }

        // Gérer les avertissements (même numéro, types différents)
        if (data.warnings && data.warnings.length > 0) {
          const warningIndexes = new Set<number>();
          data.warnings.forEach((warning: any) => {
            contactsToValidate.forEach((contact, index) => {
              if (contact.accountNumber === warning.accountNumber) {
                warningIndexes.add(index);
              }
            });
          });
          
          setWarningIndexes(warningIndexes);
          
          const warningsList = data.warnings.map((w: any) => 
            `${w.accountNumber} (${w.accountType}) - utilisé par: ${w.client}`
          ).join('\n');
          warningsMessage = `Attention - Ces numéros sont utilisés avec d'autres types de comptes:\n${warningsList}`;
          setContactWarnings(warningsMessage);
        } else {
          setContactWarnings(null);
          setWarningIndexes(new Set());
        }
        
        // Combiner les erreurs pour l'affichage principal
        const internalError = hasInternalDuplicates ? contactErrorsInternal : null;
        const allErrors = [internalError, dbErrorMessage].filter(Boolean);
        if (allErrors.length > 0) {
          setContactErrors(allErrors.join('\n\n'));
        } else {
          setContactErrors(null);
        }
      }
    } catch (err) {
      // Ignorer les erreurs de validation temps réel
      // Mais garder les doublons internes s'il y en a
      setDuplicateIndexes(duplicates);
      setWarningIndexes(new Set());
      setContactWarnings(null);
      const internalError = hasInternalDuplicates ? contactErrorsInternal : null;
      setContactErrors(internalError);
    }
  };

  const updateContact = (index: number, field: string, value: string) => {
    const newContacts = [...contacts];
    newContacts[index] = { ...newContacts[index], [field]: value };
    setContacts(newContacts);
    
    // Validation en temps réel si c'est le numéro qui change
    if (field === 'accountNumber' || field === 'accountType') {
      // Délai pour éviter trop de requêtes
      setTimeout(() => {
        validateContactsRealTime(newContacts);
      }, 500);
    }
  };

  const handleSubmit = async (e: React.FormEvent, linkToExisting = false) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const validContacts = contacts.filter(c => c.accountNumber.trim() !== '');
      if (validContacts.length === 0) {
        setError('Au moins un identifiant de contact est requis');
        setLoading(false);
        return;
      }

      // Validation: vérifier que la date de début n'est pas après la date de fin
      if (formData.searchStartDate && formData.searchEndDate) {
        const startDate = new Date(formData.searchStartDate);
        const endDate = new Date(formData.searchEndDate);
        if (startDate > endDate) {
          setError('La date de début ne peut pas être après la date de fin');
          setLoading(false);
          return;
        }
      }

      const response = await fetch('/api/newclients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          searchStartDate: formData.searchStartDate || null,
          searchEndDate: formData.searchEndDate || null,
          contactIdentifiers: validContacts,
          linkToExisting,
        }),
      });

      const data = await response.json();

      // Vérifier si une validation est requise
      if (data.requiresValidation) {
        setExistingSearchInfo(data.existingSearch);
        setPendingFormData(data.formData);
        setShowLinkValidationModal(true);
        setLoading(false);
        return;
      }

      if (!response.ok) {
        if (data.duplicates && data.duplicates.length > 0) {
          const duplicatesList = data.duplicates.map((d: any) => 
            `${d.accountNumber} (${d.accountType}) - déjà utilisé par: ${d.client}`
          ).join('\n');
          throw new Error(`${data.error}\n\nDétails:\n${duplicatesList}`);
        }
        throw new Error(data.error || 'Erreur lors de la création');
      }
      
      // Rediriger vers la liste des clients
      router.push('/clients');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      if (errorMessage.includes('apparaît plusieurs fois') || errorMessage.includes('existent déjà')) {
        setContactErrors(errorMessage);
        setError(null);
      } else {
        setError(errorMessage);
        setContactErrors(null);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#121a2d]">
      <header className="bg-white dark:bg-[#0f172a] shadow-sm border-b dark:border-[#1b2436]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Nouveau Client</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-[#0f172a] rounded-lg shadow p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded whitespace-pre-line">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white border-b dark:border-[#1b2436] pb-2">
                Informations de base
              </h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Surnom (Nickname) *
                </label>
                <input
                  type="text"
                  name="nickname"
                  value={formData.nickname}
                  onChange={handleChange}
                  required
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 dark:bg-transparent dark:text-white ${
                    nicknameError
                      ? 'border-red-500 dark:border-red-400 focus:ring-red-500'
                      : 'border-gray-300 dark:border-[#1b2436] focus:ring-blue-500'
                  }`}
                  placeholder="Surnom"
                />
                {nicknameError && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {nicknameError}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nom de famille (Surname)
                  </label>
                  <input
                    type="text"
                    name="surname"
                    value={formData.surname}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-[#1b2436] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-transparent dark:text-white"
                    placeholder="Dupont"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Prénom (First name)
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-[#1b2436] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-transparent dark:text-white"
                    placeholder="Jean"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-[#1b2436] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-transparent dark:text-white"
                  placeholder="Description détaillée..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Demandeur (Requestor) {userCategories.length > 0 && '*'}
                </label>
                {loadingCategories ? (
                  <div className="w-full px-3 py-2 border border-gray-300 dark:border-[#1b2436] rounded-lg bg-gray-50 dark:bg-[#121a2d]">
                    <span className="text-gray-500 dark:text-gray-400">Chargement des catégories...</span>
                  </div>
                ) : userCategories.length > 0 ? (
                  <>
                    <select
                      name="requestor"
                      value={formData.requestor}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 dark:border-[#1b2436] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-transparent dark:text-white"
                    >
                      <option value="">Sélectionnez une catégorie</option>
                      {Array.isArray(userCategories) && userCategories.map((category) => (
                        <option key={category.id} value={category.label}>
                          {category.icon} {category.label}
                        </option>
                      ))}
                    </select>
                    <p className="mt-2 text-sm text-blue-600 dark:text-blue-400">
                      ℹ️ Ce client sera automatiquement assigné à vos catégories: {userCategories.map(c => c.label).join(', ')}
                    </p>
                  </>
                ) : (
                  <div className="w-full px-3 py-2 border border-gray-300 dark:border-[#1b2436] rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
                    <span className="text-yellow-700 dark:text-yellow-400">
                      Aucune catégorie assignée. Veuillez contacter un administrateur pour vous assigner des catégories avant de pouvoir créer des clients.
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between border-b dark:border-[#1b2436] pb-2">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Identifiants de contact
                </h2>
                <div className="flex gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => addContact('Téléphone')}
                    className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 text-sm"
                  >
                    + Téléphone
                  </button>
                  <button
                    type="button"
                    onClick={() => addContact('WhatsApp')}
                    className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 text-sm"
                  >
                    + WhatsApp
                  </button>
                  <button
                    type="button"
                    onClick={() => addContact('Telegram')}
                    className="px-3 py-1 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 rounded-lg hover:bg-cyan-200 dark:hover:bg-cyan-900/50 text-sm"
                  >
                    + Telegram
                  </button>
                  <button
                    type="button"
                    onClick={() => addContact('Signal')}
                    className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/50 text-sm"
                  >
                    + Signal
                  </button>
                  <button
                    type="button"
                    onClick={() => addContact('Threema')}
                    className="px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-lg hover:bg-orange-200 dark:hover:bg-orange-900/50 text-sm"
                  >
                    + Threema
                  </button>
                </div>
              </div>
              
              {/* Messages d'erreur au-dessus des contacts */}
              {contactErrors && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-lg text-sm flex items-start gap-2">
                  <svg className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <div className="flex-1 whitespace-pre-wrap">{contactErrors}</div>
                </div>
              )}

              {/* Messages d'avertissement au-dessus des contacts */}
              {contactWarnings && (
                <div className="p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-300 rounded-lg text-sm flex items-start gap-2">
                  <svg className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <div className="flex-1 whitespace-pre-wrap">{contactWarnings}</div>
                </div>
              )}

              {contacts.length === 0 && (
                <div className="p-4 bg-gray-50 dark:bg-[#121a2d] rounded-lg text-center text-gray-500 dark:text-gray-400">
                  Aucun contact ajouté. Cliquez sur les boutons ci-dessus pour ajouter des numéros de téléphone ou des comptes.
                </div>
              )}

              {contacts.map((contact, i) => (
                <div key={i} className={`grid grid-cols-12 gap-4 p-4 rounded-lg ${
                  duplicateIndexes.has(i) 
                    ? 'bg-red-50 dark:bg-red-900/10 border-2 border-red-300 dark:border-red-700' 
                    : warningIndexes.has(i)
                    ? 'bg-orange-50 dark:bg-orange-900/10 border-2 border-orange-300 dark:border-orange-700'
                    : 'bg-gray-50 dark:bg-[#121a2d]'
                }`}>
                  <div className="col-span-3">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Type
                    </label>
                    <select
                      value={contact.accountType}
                      onChange={(e) => updateContact(i, 'accountType', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 dark:bg-transparent dark:text-white ${
                        duplicateIndexes.has(i)
                          ? 'border-red-500 dark:border-red-400 focus:ring-red-500'
                          : warningIndexes.has(i)
                          ? 'border-orange-500 dark:border-orange-400 focus:ring-orange-500'
                          : 'border-gray-300 dark:border-[#1b2436] focus:ring-blue-500'
                      }`}
                    >
                      <option value="Téléphone">Téléphone</option>
                      <option value="WhatsApp">WhatsApp</option>
                      <option value="Telegram">Telegram</option>
                      <option value="Signal">Signal</option>
                      <option value="Threema">Threema</option>
                    </select>
                  </div>
                  <div className="col-span-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Numéro / Compte
                    </label>
                    <input
                      type="text"
                      value={contact.accountNumber}
                      onChange={(e) => updateContact(i, 'accountNumber', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 dark:bg-transparent dark:text-white ${
                        duplicateIndexes.has(i)
                          ? 'border-red-500 dark:border-red-400 focus:ring-red-500'
                          : warningIndexes.has(i)
                          ? 'border-orange-500 dark:border-orange-400 focus:ring-orange-500'
                          : 'border-gray-300 dark:border-[#1b2436] focus:ring-blue-500'
                      }`}
                      placeholder="+33 6 12 34 56 78"
                    />
                  </div>
                  <div className="col-span-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Information
                    </label>
                    <textarea
                      value={contact.info}
                      onChange={(e) => updateContact(i, 'info', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 dark:bg-transparent dark:text-white resize-y ${
                        duplicateIndexes.has(i)
                          ? 'border-red-500 dark:border-red-400 focus:ring-red-500'
                          : 'border-gray-300 dark:border-[#1b2436] focus:ring-blue-500'
                      }`}
                      placeholder="Personnel, Bureau..."
                      rows={3}
                    />
                  </div>
                  <div className="col-span-1 flex items-end">
                    <button
                      type="button"
                      onClick={() => removeContact(i)}
                      className="w-full px-3 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50"
                      title="Supprimer"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white border-b dark:border-[#1b2436] pb-2">
                Priorité et Options
              </h2>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Priorité *
                  </label>
                  <select
                    name="priority"
                    value={formData.priority}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-[#1b2436] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-transparent dark:text-white"
                  >
                    <option value="Faible">Faible</option>
                    <option value="Moyenne">Moyenne</option>
                    <option value="Haute">Haute</option>
                    <option value="Immédiate">Immédiate</option>
                  </select>
                </div>

                <div className="flex items-center pt-7">
                  <input
                    type="checkbox"
                    name="externalHelp"
                    checked={formData.externalHelp}
                    onChange={handleChange}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <label className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Peut demander de l'aide à l'externe
                  </label>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white border-b dark:border-[#1b2436] pb-2">
                Références
              </h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Référence Générale *
                </label>
                <select
                  name="generalReference"
                  value={formData.generalReference}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-[#1b2436] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-transparent dark:text-white"
                >
                  <option value="">Sélectionner une référence</option>
                  <option value="Article">Article</option>
                  <option value="BD">BD</option>
                  <option value="Film">Film</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Référence Détaillée *
                </label>
                <input
                  type="text"
                  name="detailedReference"
                  value={formData.detailedReference}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-[#1b2436] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-transparent dark:text-white"
                  placeholder="Référence détaillée..."
                />
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white border-b dark:border-[#1b2436] pb-2">
                Période de recherche
              </h2>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Début de la recherche *
                  </label>
                  <input
                    type="date"
                    name="searchStartDate"
                    value={formData.searchStartDate}
                    max={formData.searchEndDate || undefined}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-[#1b2436] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-transparent dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Fin de la recherche *
                  </label>
                  <input
                    type="date"
                    name="searchEndDate"
                    value={formData.searchEndDate}
                    min={formData.searchStartDate || undefined}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-[#1b2436] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-transparent dark:text-white"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-6 border-t dark:border-[#1b2436]">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
              >
                {loading ? 'Création...' : 'Créer le client'}
              </button>
              <a href="/clients">
                <button
                  type="button"
                  className="px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
                >
                  Annuler
                </button>
              </a>
            </div>
          </form>
        </div>
      </main>

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
                <div className="flex items-start gap-2">
                  <span className="font-semibold text-gray-600 dark:text-gray-400 min-w-[140px]">Date de début:</span>
                  <span className="text-gray-900 dark:text-white">
                    {existingSearchInfo.startDate ? new Date(existingSearchInfo.startDate).toLocaleDateString('fr-FR') : '-'}
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-semibold text-gray-600 dark:text-gray-400 min-w-[140px]">Date de fin:</span>
                  <span className="text-gray-900 dark:text-white">
                    {existingSearchInfo.endDate ? new Date(existingSearchInfo.endDate).toLocaleDateString('fr-FR') : '-'}
                  </span>
                </div>
                {existingSearchInfo.linkedClients && existingSearchInfo.linkedClients.length > 0 && (
                  <div className="flex items-start gap-2">
                    <span className="font-semibold text-gray-600 dark:text-gray-400 min-w-[140px]">Clients liés:</span>
                    <div className="flex flex-col gap-1">
                      {existingSearchInfo.linkedClients.map((client: any) => (
                        <span key={client.id} className="text-gray-900 dark:text-white flex items-center gap-1">
                          <User size={14} />
                          {client.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Voulez-vous lier ce nouveau client à la recherche existante ou créer une nouvelle recherche distincte ?
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowLinkValidationModal(false);
                  setExistingSearchInfo(null);
                  setPendingFormData(null);
                }}
                className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1b2436] rounded-lg transition-colors border border-gray-300 dark:border-gray-600"
              >
                Annuler
              </button>
              <button
                onClick={async () => {
                  setShowLinkValidationModal(false);
                  // Créer une nouvelle recherche en modifiant légèrement la référence
                  setFormData({
                    ...formData,
                    detailedReference: formData.detailedReference + ' (nouveau)'
                  });
                  setExistingSearchInfo(null);
                  setPendingFormData(null);
                  // Soumettre automatiquement
                  const event = new Event('submit', { bubbles: true, cancelable: true });
                  document.querySelector('form')?.dispatchEvent(event);
                }}
                className="flex-1 px-4 py-2 bg-gray-600 text-white hover:bg-gray-700 rounded-lg transition-colors"
              >
                Créer nouvelle
              </button>
              <button
                onClick={async (e: any) => {
                  setShowLinkValidationModal(false);
                  setExistingSearchInfo(null);
                  setPendingFormData(null);
                  await handleSubmit(e, true);
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
