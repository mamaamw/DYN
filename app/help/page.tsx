'use client';

import { useState } from 'react';
import { HelpCircle, MessageCircle, Book, Video, Search, ChevronDown, ChevronUp, Mail, Phone, FileText, Lightbulb, Users, Shield, Database, Zap, ExternalLink } from 'lucide-react';

export default function HelpPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState('all');

  const categories = [
    { id: 'all', label: 'Tout', icon: <Book className="w-4 h-4" /> },
    { id: 'clients', label: 'Clients', icon: <Users className="w-4 h-4" /> },
    { id: 'tasks', label: 'Tâches', icon: <FileText className="w-4 h-4" /> },
    { id: 'admin', label: 'Administration', icon: <Shield className="w-4 h-4" /> },
    { id: 'data', label: 'Données', icon: <Database className="w-4 h-4" /> },
  ];

  const faqs = [
    {
      category: 'clients',
      q: 'Comment créer un nouveau client ?',
      a: 'Rendez-vous dans la section Clients, cliquez sur "Nouveau Client", remplissez les informations requises (prénom, nom, email, téléphone) et sauvegardez. Le client sera ajouté immédiatement à votre base de données.',
    },
    {
      category: 'clients',
      q: 'Comment rechercher un client spécifique ?',
      a: 'Dans la section Recherches, utilisez la barre de recherche en entrant le nom, email ou numéro de téléphone du client. Vous pouvez filtrer par priorité et type de recherche pour affiner les résultats.',
    },
    {
      category: 'clients',
      q: 'Comment gérer l\'historique d\'un client ?',
      a: 'Accédez au profil du client, puis cliquez sur l\'onglet "Historique". Vous pourrez voir toutes les modifications, recherches et interactions avec ce client.',
    },
    {
      category: 'tasks',
      q: 'Comment créer une nouvelle tâche ?',
      a: 'Allez dans la section Tâches ou TODO, cliquez sur "Nouvelle tâche", remplissez la description, définissez la priorité et la date limite, puis sauvegardez.',
    },
    {
      category: 'tasks',
      q: 'Comment utiliser le Kanban ?',
      a: 'Dans TODO Kanban, vous pouvez glisser-déposer les tâches entre les colonnes (À faire, En cours, Terminé) pour suivre leur progression. Cliquez sur une tâche pour voir les détails.',
    },
    {
      category: 'tasks',
      q: 'Comment définir les priorités des tâches ?',
      a: 'Lors de la création ou modification d\'une tâche, sélectionnez le niveau de priorité : Faible, Moyenne, Haute ou Immédiate. Cela affecte l\'ordre d\'affichage et les notifications.',
    },
    {
      category: 'admin',
      q: 'Comment gérer les rôles et permissions ?',
      a: 'Accédez à Admin > Gestion Rôles pour créer, modifier ou supprimer des rôles. Dans Admin > Contrôle d\'Accès, définissez les permissions (lecture/écriture/aucun) pour chaque page et rôle.',
    },
    {
      category: 'admin',
      q: 'Comment ajouter un nouvel utilisateur ?',
      a: 'Dans Admin > Gestion Utilisateurs, cliquez sur "Nouvel utilisateur", entrez l\'email, nom d\'utilisateur, mot de passe et assignez un rôle. L\'utilisateur recevra ses identifiants par email.',
    },
    {
      category: 'admin',
      q: 'Comment personnaliser la navigation ?',
      a: 'Allez dans Admin > Navigation pour ajouter, supprimer, réorganiser ou masquer des sections du menu. Vous pouvez marquer des sections comme "ADMIN uniquement" pour restreindre l\'accès.',
    },
    {
      category: 'admin',
      q: 'Comment consulter les logs système ?',
      a: 'Dans Admin > Logs Système, vous trouverez l\'historique complet des actions (connexions, modifications, suppressions). Filtrez par utilisateur, action ou date pour auditer l\'activité.',
    },
    {
      category: 'data',
      q: 'Comment exporter mes données ?',
      a: 'La plupart des sections disposent d\'un bouton d\'export. Cliquez dessus et choisissez le format (CSV, Excel, PDF) pour télécharger vos données.',
    },
    {
      category: 'data',
      q: 'Comment sauvegarder la base de données ?',
      a: 'Dans Admin > Base de Données, utilisez l\'option "Sauvegarder" pour créer une copie de sécurité. Les sauvegardes sont horodatées et stockées localement.',
    },
    {
      category: 'data',
      q: 'Comment restaurer des données supprimées ?',
      a: 'Allez dans Admin > Corbeille pour voir tous les éléments supprimés. Sélectionnez ceux à restaurer et cliquez sur "Restaurer". Les éléments seront réactivés immédiatement.',
    },
    {
      category: 'admin',
      q: 'Comment configurer les notifications ?',
      a: 'Dans Paramètres > Notifications, activez/désactivez les notifications par email, les mises à jour de projets, messages d\'équipe et rappels de factures selon vos préférences.',
    },
    {
      category: 'clients',
      q: 'Comment gérer les identifiants de contact ?',
      a: 'Dans le profil d\'un client, section "Identifiants de contact", ajoutez des numéros de téléphone, comptes WhatsApp, Telegram, etc. Définissez les tâches associées à chaque identifiant.',
    },
  ];

  const guides = [
    {
      title: 'Guide de Démarrage',
      desc: 'Apprenez les bases de DYN en 10 minutes',
      icon: <Lightbulb className="w-6 h-6 text-yellow-600" />,
      color: 'yellow',
    },
    {
      title: 'Gestion des Clients',
      desc: 'Gérez efficacement vos clients et recherches',
      icon: <Users className="w-6 h-6 text-blue-600" />,
      color: 'blue',
    },
    {
      title: 'Administration Avancée',
      desc: 'Configuration des rôles et permissions',
      icon: <Shield className="w-6 h-6 text-purple-600" />,
      color: 'purple',
    },
    {
      title: 'Gestion des Données',
      desc: 'Import, export et sauvegardes',
      icon: <Database className="w-6 h-6 text-green-600" />,
      color: 'green',
    },
  ];

  const filteredFaqs = faqs.filter(faq => {
    const matchesSearch = faq.q.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         faq.a.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory === 'all' || faq.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Centre d'Aide</h1>
        <p className="text-gray-600 mt-1">
          Trouvez des réponses aux questions fréquentes et obtenez du support
        </p>
      </div>

      {/* Contact Support */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 hover:shadow-md transition">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Mail size={24} className="text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-blue-900">Email Support</h3>
              <p className="text-sm text-blue-700 mt-1">
                support@dyn.com
              </p>
              <p className="text-xs text-blue-600 mt-2">Réponse sous 24h</p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-6 hover:shadow-md transition">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <Phone size={24} className="text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-green-900">Téléphone</h3>
              <p className="text-sm text-green-700 mt-1">
                +33 1 23 45 67 89
              </p>
              <p className="text-xs text-green-600 mt-2">Lun-Ven 9h-18h</p>
            </div>
          </div>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 hover:shadow-md transition">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <MessageCircle size={24} className="text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-purple-900">Chat en Direct</h3>
              <p className="text-sm text-purple-700 mt-1">
                Discutez avec notre équipe
              </p>
              <button className="text-xs text-purple-600 mt-2 font-semibold hover:underline">
                Démarrer le chat →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Rechercher dans l'aide..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 mt-4 flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
                activeCategory === cat.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {cat.icon}
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* FAQs */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <HelpCircle className="w-6 h-6" />
          Questions Fréquentes
        </h2>
        {filteredFaqs.length === 0 ? (
          <p className="text-center text-gray-500 py-8">
            Aucun résultat trouvé pour "{searchTerm}"
          </p>
        ) : (
          <div className="space-y-3">
            {filteredFaqs.map((faq, idx) => (
              <div
                key={idx}
                className="border border-gray-200 rounded-lg overflow-hidden"
              >
                <button
                  onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition"
                >
                  <span className="font-medium text-gray-900 pr-4">{faq.q}</span>
                  {expandedFaq === idx ? (
                    <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  )}
                </button>
                {expandedFaq === idx && (
                  <div className="px-4 pb-4 text-gray-600 text-sm border-t border-gray-100 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Guides */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <Book className="w-6 h-6" />
          Guides & Documentation
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {guides.map((guide, idx) => (
            <div
              key={idx}
              className={`border-2 border-${guide.color}-200 bg-${guide.color}-50 rounded-lg p-5 hover:shadow-lg transition cursor-pointer`}
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 bg-${guide.color}-100 rounded-lg`}>
                  {guide.icon}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                    {guide.title}
                    <ExternalLink className="w-4 h-4 text-gray-400" />
                  </h4>
                  <p className="text-sm text-gray-600 mt-1">{guide.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Video Tutorials */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
          <Video className="w-6 h-6" />
          Tutoriels Vidéo
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { title: 'Introduction à DYN', duration: '5:30', views: '1.2K' },
            { title: 'Gestion des Clients', duration: '8:15', views: '856' },
            { title: 'Configuration Admin', duration: '12:40', views: '643' },
          ].map((video, idx) => (
            <div
              key={idx}
              className="border border-gray-300 rounded-lg overflow-hidden hover:shadow-lg transition cursor-pointer"
            >
              <div className="aspect-video bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <Video className="w-12 h-12 text-white" />
              </div>
              <div className="p-4">
                <h4 className="font-semibold text-gray-900">{video.title}</h4>
                <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                  <span>⏱ {video.duration}</span>
                  <span>👁 {video.views} vues</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Tips */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-yellow-500" />
          Astuces Rapides
        </h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex items-start gap-2">
            <span className="text-blue-600 font-bold">•</span>
            <span>Utilisez <kbd className="px-2 py-0.5 bg-white border border-gray-300 rounded text-xs">Ctrl+K</kbd> pour ouvrir la recherche rapide</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 font-bold">•</span>
            <span>Glissez-déposez les tâches dans le Kanban pour changer leur statut</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 font-bold">•</span>
            <span>Cliquez sur le badge "Admin par défaut" pour identifier les pages restreintes</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 font-bold">•</span>
            <span>Les données supprimées restent 30 jours dans la corbeille avant suppression définitive</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
