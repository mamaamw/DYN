'use client';

import { useEffect, useState, useRef } from 'react';
import {
  Send,
  Search,
  Plus,
  User,
  Users,
  MessageCircle,
  X,
  Check,
  CheckCheck,
  CheckCircle,
  Paperclip,
  FileText,
  Download,
  Image as ImageIcon,
  Video,
  Music,
  ExternalLink
} from 'lucide-react';
import Toast, { ToastType } from '@/components/ui/Toast';


interface Message {
  id: number;
  conversationId: number;
  senderId: number;
  content: string;
  messageType: string;
  metadata?: string;
  isEdited: boolean;
  createdAt: string;
  sender?: {
    id: number;
    username: string;
    firstName: string;
    lastName: string;
  };
}

interface Conversation {
  id: number;
  name: string | null;
  isGroup: boolean;
  autoDeleteDays: number | null;
  otherUser?: {
    id: number;
    username: string;
    firstName: string;
    lastName: string;
    isActive: boolean;
    lastSeen?: string;
  };
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount: number;
}

interface ChatUser {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

export default function ChatPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showFileModal, setShowFileModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileMessage, setFileMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<ChatUser[]>([]);
  const [searchUser, setSearchUser] = useState('');
  const [currentUserId, setCurrentUserId] = useState<number>(0);
  const [isGroupMode, setIsGroupMode] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const [groupName, setGroupName] = useState('');
  const [conversationParticipants, setConversationParticipants] = useState<Array<{
    userId: number;
    lastReadAt: string | null;
  }>>([]);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);
  const [showSearchBar, setShowSearchBar] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Message[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [globalSearchResults, setGlobalSearchResults] = useState<Array<Message & {
    conversation?: { id: number; name: string; isGroup: boolean };
  }>>([]);
  const [globalSearchLoading, setGlobalSearchLoading] = useState(false);
  const [groupMembers, setGroupMembers] = useState<Array<{
    id: number;
    userId: number;
    joinedAt: string;
    user?: {
      id: number;
      username: string;
      firstName: string;
      lastName: string;
      email: string;
      role: string;
      isActive: boolean;
    };
  }>>([]);
  const [userStatuses, setUserStatuses] = useState<Record<number, { isOnline: boolean; lastSeen: string | null }>>({});
  const [mentionSuggestions, setMentionSuggestions] = useState<Array<{
    id: number;
    nickname: string;
    customId: string;
    fullName: string;
  }>>([]);
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const [mentionType, setMentionType] = useState<'@' | '#' | null>(null);
  const [mentionCursorPosition, setMentionCursorPosition] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [showClientModal, setShowClientModal] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [clientDetails, setClientDetails] = useState<any>(null);
  const [loadingClient, setLoadingClient] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Mettre à jour la présence de l'utilisateur actuel
  useEffect(() => {
    const updatePresence = async () => {
      try {
        await fetch('/api/user/presence', { method: 'POST' });
      } catch (error) {
        console.error('Erreur mise à jour présence:', error);
      }
    };

    // Mettre à jour immédiatement
    updatePresence();

    // Mettre à jour toutes les minutes
    const interval = setInterval(updatePresence, 60000);

    return () => clearInterval(interval);
  }, []);

  // Vérifier le statut des utilisateurs dans les conversations
  useEffect(() => {
    const checkUserStatuses = async () => {
      const userIds = new Set<number>();
      
      // Collecter tous les IDs d'utilisateurs
      conversations.forEach(conv => {
        if (!conv.isGroup && conv.otherUser) {
          userIds.add(conv.otherUser.id);
        }
      });

      // Vérifier le statut de chaque utilisateur
      for (const userId of userIds) {
        try {
          const res = await fetch(`/api/user/presence?userId=${userId}`);
          if (res.ok) {
            const data = await res.json();
            setUserStatuses(prev => ({
              ...prev,
              [userId]: {
                isOnline: data.isOnline,
                lastSeen: data.lastSeen
              }
            }));
          }
        } catch (error) {
          console.error('Erreur vérification statut:', error);
        }
      }
    };

    if (conversations.length > 0) {
      checkUserStatuses();
      
      // Vérifier toutes les 30 secondes
      const interval = setInterval(checkUserStatuses, 30000);
      return () => clearInterval(interval);
    }
  }, [conversations]);

  // Fonction pour formater le temps "vu il y a..."
  const formatLastSeen = (lastSeen: string | null | undefined) => {
    if (!lastSeen) return 'Hors ligne';
    
    const now = new Date().getTime();
    const seenTime = new Date(lastSeen).getTime();
    const diff = now - seenTime;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 2) return 'En ligne';
    if (minutes < 60) return `Vu il y a ${minutes}min`;
    if (hours < 24) return `Vu il y a ${hours}h`;
    if (days < 7) return `Vu il y a ${days}j`;
    return 'Hors ligne';
  };

  // Rechercher des clients pour les mentions
  const searchClients = async (query: string) => {
    console.log('===== searchClients appelé =====');
    console.log('Query:', JSON.stringify(query), 'Length:', query.length);
    
    try {
      const url = `/api/newclients?search=${encodeURIComponent(query)}`;
      console.log('Appel API:', url);
      
      const res = await fetch(url);
      console.log('Réponse status:', res.status, 'OK:', res.ok);
      
      if (res.ok) {
        const data = await res.json();
        console.log('Données brutes:', JSON.stringify(data, null, 2));
        
        // L'API retourne directement un tableau, pas { clients: [...] }
        const clients = Array.isArray(data) ? data : (data.clients || []);
        console.log('Clients trouvés:', clients.length);
        
        const suggestions = clients.slice(0, 10).map((client: any) => {
          console.log('Traitement client:', client.id, client.nickname);
          return {
            id: client.id,
            nickname: client.nickname || '',
            customId: client.contactIdentifiers?.[0]?.accountNumber || client.id?.toString() || '',
            fullName: `${client.firstName || ''} ${client.surname || ''}`.trim() || 'Sans nom'
          };
        });
        
        console.log('✅ Suggestions finales:', suggestions);
        console.log('Nombre de suggestions:', suggestions.length);
        setMentionSuggestions(suggestions);
      } else {
        console.error('Réponse non OK:', res.status);
        setMentionSuggestions([]);
      }
    } catch (error) {
      console.error('Erreur recherche clients:', error);
      setMentionSuggestions([]);
    }
  };

  // Gérer le changement de texte avec détection des mentions
  const handleMessageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const cursorPos = e.target.selectionStart || 0;
    
    console.log('===== handleMessageChange =====');
    console.log('Value:', JSON.stringify(value));
    console.log('Cursor:', cursorPos);
    
    setNewMessage(value);

    // Clear previous timer
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }

    // Détecter @ ou # avant le curseur
    const textBeforeCursor = value.substring(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    const lastHashIndex = textBeforeCursor.lastIndexOf('#');
    
    console.log('lastAtIndex:', lastAtIndex);
    console.log('lastHashIndex:', lastHashIndex);
    
    const triggerIndex = Math.max(lastAtIndex, lastHashIndex);
    const triggerChar = lastAtIndex > lastHashIndex ? '@' : '#';
    
    console.log('triggerIndex:', triggerIndex);
    console.log('triggerChar:', triggerChar);
    
    if (triggerIndex >= 0) {
      const textAfterTrigger = textBeforeCursor.substring(triggerIndex + 1);
      
      console.log('textAfterTrigger:', JSON.stringify(textAfterTrigger));
      console.log('includes space?', textAfterTrigger.includes(' '));
      
      // Vérifier qu'il n'y a pas d'espace après le trigger
      if (!textAfterTrigger.includes(' ')) {
        console.log('✅ MENTION DÉTECTÉE - Ouverture dropdown');
        setMentionType(triggerChar as '@' | '#');
        setMentionSearch(textAfterTrigger);
        setMentionCursorPosition(triggerIndex);
        setShowMentionDropdown(true);
        
        // Debounce la recherche
        searchTimerRef.current = setTimeout(() => {
          searchClients(textAfterTrigger);
        }, 300);
        return;
      }
    }
    
    console.log('❌ Pas de mention valide - Fermeture dropdown');
    // Fermer le dropdown si pas de trigger valide
    setShowMentionDropdown(false);
    setMentionSuggestions([]);
  };

  // Insérer une mention
  const insertMention = (client: typeof mentionSuggestions[0]) => {
    const beforeMention = newMessage.substring(0, mentionCursorPosition);
    const afterMention = newMessage.substring(mentionCursorPosition + mentionSearch.length + 1);
    
    const mentionText = mentionType === '@' 
      ? `@${client.nickname || client.fullName}`
      : `#${client.customId}`;
    
    const newText = beforeMention + mentionText + ' ' + afterMention;
    setNewMessage(newText);
    setShowMentionDropdown(false);
    setMentionSuggestions([]);
    
    // Remettre le focus sur l'input
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  // Charger les détails d'un client
  const loadClientDetails = async (mention: string) => {
    setLoadingClient(true);
    setShowClientModal(true);
    
    try {
      console.log('🔍 loadClientDetails appelé avec:', mention);
      
      // Extraire l'identifiant de la mention
      let searchQuery = '';
      const isNickname = mention.startsWith('@');
      const isId = mention.startsWith('#');
      
      if (isNickname) {
        searchQuery = mention.substring(1);
      } else if (isId) {
        searchQuery = mention.substring(1);
      }
      
      console.log('Recherche:', searchQuery);
      
      const res = await fetch(`/api/newclients?search=${encodeURIComponent(searchQuery)}`);
      if (res.ok) {
        const data = await res.json();
        // L'API retourne directement un tableau
        const clients = Array.isArray(data) ? data : [];
        
        console.log('Clients trouvés:', clients.length);
        
        if (clients.length > 0) {
          // Trouver le client exact
          let client = null;
          
          if (isNickname) {
            // Chercher par surnom exact (insensible à la casse)
            client = clients.find((c: any) => 
              c.nickname?.toLowerCase() === searchQuery.toLowerCase()
            );
          } else if (isId) {
            // Chercher par ID de contact
            client = clients.find((c: any) => 
              c.contactIdentifiers?.some((ci: any) => 
                ci.accountNumber === searchQuery
              )
            );
          }
          
          // Si pas de correspondance exacte, prendre le premier
          if (!client) {
            console.log('Pas de correspondance exacte, prendre le premier');
            client = clients[0];
          }
          
          console.log('Client sélectionné:', client);
          setClientDetails(client);
          setSelectedClientId(client.id);
        } else {
          console.log('Aucun client trouvé');
          setClientDetails(null);
        }
      }
    } catch (error) {
      console.error('Erreur chargement client:', error);
      setClientDetails(null);
    } finally {
      setLoadingClient(false);
    }
  };

  // Fermer le modal client
  const closeClientModal = () => {
    setShowClientModal(false);
    setSelectedClientId(null);
    setClientDetails(null);
  };

  // Rendre les mentions cliquables dans les messages
  const renderMessageContent = (content: string, isOwnMessage: boolean = false) => {
    const parts = [];
    let lastIndex = 0;
    
    // Regex pour détecter @mentions et #IDs (supporte #26-5-1)
    const mentionRegex = /(@[\wÀ-ÿ-]+|#\d+(-\d+)*)/g;
    let match;
    
    while ((match = mentionRegex.exec(content)) !== null) {
      // Ajouter le texte avant la mention
      if (match.index > lastIndex) {
        parts.push(
          <span key={`text-${lastIndex}`}>
            {content.substring(lastIndex, match.index)}
          </span>
        );
      }
      
      // Ajouter la mention cliquable
      const mention = match[0];
      const isMention = mention.startsWith('@');
      parts.push(
        <button
          key={`mention-${match.index}`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            loadClientDetails(mention);
          }}
          className={`font-semibold underline hover:opacity-80 transition-opacity ${
            isOwnMessage 
              ? 'text-white/90 hover:text-white' 
              : 'text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300'
          }`}
          title={isMention ? 'Voir les détails du client' : 'Voir les détails du client'}
        >
          {mention}
        </button>
      );
      
      lastIndex = match.index + mention.length;
    }
    
    // Ajouter le texte restant
    if (lastIndex < content.length) {
      parts.push(
        <span key={`text-${lastIndex}`}>
          {content.substring(lastIndex)}
        </span>
      );
    }
    
    return parts.length > 0 ? parts : content;
  };


  // Récupérer l'ID de l'utilisateur actuel
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const res = await fetch('/api/chat/me');
        if (res.ok) {
          const data = await res.json();
          console.log('Current user from API:', data.userId);
          setCurrentUserId(Number(data.userId));
        } else {
          console.error('Failed to fetch current user');
        }
      } catch (error) {
        console.error('Error fetching current user:', error);
      }
    };

    fetchCurrentUser();
  }, []);

  // Charger les conversations
  const loadConversations = async () => {
    try {
      const res = await fetch('/api/chat/conversations');
      if (!res.ok) throw new Error('Erreur chargement conversations');
      
      const data = await res.json();
      setConversations(data.conversations);
    } catch (error: any) {
      setToast({ message: error.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Charger les messages d'une conversation
  const loadMessages = async (conversationId: number) => {
    try {
      const res = await fetch(`/api/chat/conversations/${conversationId}`);
      if (!res.ok) throw new Error('Erreur chargement messages');
      
      const data = await res.json();
      setMessages(data.messages);
      
      // Stocker les participants pour l'accusé de lecture
      if (data.participants) {
        setConversationParticipants(data.participants);
      }
      
      // Scroll vers le bas
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (error: any) {
      setToast({ message: error.message, type: 'error' });
    }
  };

  // Envoyer un message
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    const messageContent = newMessage;
    setNewMessage('');
    setSending(true);

    try {
      const res = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: selectedConversation.id,
          content: messageContent,
          messageType: 'text'
        })
      });

      if (!res.ok) throw new Error('Erreur envoi message');

      const data = await res.json();
      setMessages([...messages, data.message]);
      
      // Actualiser les conversations
      loadConversations();
      
      // Scroll vers le bas
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (error: any) {
      setToast({ message: error.message, type: 'error' });
      setNewMessage(messageContent); // Restaurer le message
    } finally {
      setSending(false);
    }
  };

  // Upload de fichier
  const handleFileUpload = async (file: File, message: string = '') => {
    if (!selectedConversation) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('conversationId', selectedConversation.id.toString());
      if (message.trim()) {
        formData.append('message', message);
      }

      const res = await fetch('/api/chat/upload', {
        method: 'POST',
        body: formData
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Erreur upload fichier');
      }

      const data = await res.json();
      setMessages([...messages, data.message]);
      
      // Actualiser les conversations
      loadConversations();
      
      // Scroll vers le bas
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);

      setToast({ message: 'Fichier envoyé avec succès', type: 'success' });
    } catch (error: any) {
      setToast({ message: error.message, type: 'error' });
    } finally {
      setUploading(false);
    }
  };

  // Gérer la sélection de fichier
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setShowFileModal(true);
      // Reset l'input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Confirmer l'envoi du fichier
  const handleConfirmFileUpload = () => {
    if (selectedFile) {
      handleFileUpload(selectedFile, fileMessage);
    }
    setShowFileModal(false);
    setSelectedFile(null);
    setFileMessage('');
  };

  // Annuler l'envoi du fichier
  const handleCancelFileUpload = () => {
    setShowFileModal(false);
    setSelectedFile(null);
    setFileMessage('');
  };

  // Charger les utilisateurs disponibles
  const loadAvailableUsers = async () => {
    try {
      const res = await fetch(`/api/chat/users?search=${searchUser}`);
      if (!res.ok) throw new Error('Erreur chargement utilisateurs');
      
      const data = await res.json();
      setAvailableUsers(data.users);
    } catch (error: any) {
      setToast({ message: error.message, type: 'error' });
    }
  };

  // Obtenir l'icône selon le type de fichier
  const getFileIcon = (mimetype: string) => {
    if (mimetype.startsWith('image/')) {
      return <ImageIcon className="w-4 h-4" />;
    } else if (mimetype.startsWith('video/')) {
      return <Video className="w-4 h-4" />;
    } else if (mimetype.startsWith('audio/')) {
      return <Music className="w-4 h-4" />;
    } else {
      return <FileText className="w-4 h-4" />;
    }
  };

  // Formater la taille du fichier
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Créer une nouvelle conversation
  const handleStartConversation = async (userId?: number) => {
    try {
      let participantIds: number[];
      let isGroup = false;
      let name: string | undefined;

      if (isGroupMode) {
        // Mode groupe : utiliser les utilisateurs sélectionnés
        if (selectedUserIds.length === 0) {
          setToast({ message: 'Veuillez sélectionner au moins un participant', type: 'error' });
          return;
        }
        if (!groupName.trim()) {
          setToast({ message: 'Veuillez entrer un nom pour le groupe', type: 'error' });
          return;
        }
        participantIds = selectedUserIds;
        isGroup = true;
        name = groupName.trim();
      } else {
        // Mode 1-to-1 : un seul utilisateur
        if (!userId) return;
        participantIds = [userId];
      }

      const res = await fetch('/api/chat/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participantIds,
          isGroup,
          name
        })
      });

      if (!res.ok) throw new Error('Erreur création conversation');

      const data = await res.json();
      setShowNewChatModal(false);
      setIsGroupMode(false);
      setSelectedUserIds([]);
      setGroupName('');
      await loadConversations();
      
      // Sélectionner la nouvelle conversation
      const newConv = conversations.find(c => c.id === data.conversation.id) || data.conversation;
      setSelectedConversation(newConv);
      loadMessages(newConv.id);
    } catch (error: any) {
      setToast({ message: error.message, type: 'error' });
    }
  };

  // Basculer la sélection d'un utilisateur pour le groupe
  const toggleUserSelection = (userId: number) => {
    setSelectedUserIds(prev => 
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  // Charger les membres d'un groupe
  const loadGroupMembers = async (conversationId: number) => {
    try {
      const res = await fetch(`/api/chat/conversations/${conversationId}?action=participants`);
      if (!res.ok) throw new Error('Erreur chargement membres');
      
      const data = await res.json();
      setGroupMembers(data.participants);
      setShowMembersModal(true);
    } catch (error: any) {
      setToast({ message: error.message, type: 'error' });
    }
  };

  // Mettre à jour les paramètres de rétention
  const updateAutoDelete = async (days: number | null) => {
    if (!selectedConversation) return;

    try {
      const res = await fetch(`/api/chat/conversations/${selectedConversation.id}/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ autoDeleteDays: days })
      });

      if (!res.ok) throw new Error('Erreur mise à jour paramètres');

      // Mettre à jour localement
      setSelectedConversation({
        ...selectedConversation,
        autoDeleteDays: days
      });

      // Actualiser les conversations
      await loadConversations();

      setShowSettingsDropdown(false);
      
      const label = days === null ? 'Permanent' : 
                    days === 3 ? '3 jours' :
                    days === 7 ? '7 jours' :
                    days === 14 ? '14 jours' :
                    days === 30 ? '30 jours' : '3 mois';
      
      setToast({ message: `Suppression automatique: ${label}`, type: 'success' });
    } catch (error: any) {
      setToast({ message: error.message, type: 'error' });
    }
  };

  // Rechercher des messages
  const searchMessages = async (query: string) => {
    if (!selectedConversation || !query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    try {
      const res = await fetch(`/api/chat/conversations/${selectedConversation.id}/search?q=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error('Erreur recherche messages');
      
      const data = await res.json();
      setSearchResults(data.messages);
    } catch (error: any) {
      setToast({ message: error.message, type: 'error' });
    } finally {
      setSearchLoading(false);
    }
  };

  // Scroller vers un message spécifique
  const scrollToMessage = (messageId: number) => {
    const messageElement = document.getElementById(`message-${messageId}`);
    if (messageElement) {
      messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      messageElement.classList.add('highlight-message');
      setTimeout(() => {
        messageElement.classList.remove('highlight-message');
      }, 2000);
    }
  };

  // Recherche globale dans toutes les conversations
  const searchGlobal = async (query: string) => {
    if (!query.trim()) {
      setGlobalSearchResults([]);
      return;
    }

    setGlobalSearchLoading(true);
    try {
      const res = await fetch(`/api/chat/search?q=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error('Erreur recherche globale');
      
      const data = await res.json();
      setGlobalSearchResults(data.messages);
    } catch (error: any) {
      setToast({ message: error.message, type: 'error' });
    } finally {
      setGlobalSearchLoading(false);
    }
  };

  // Ouvrir une conversation depuis la recherche globale
  const openConversationFromSearch = async (conversationId: number, messageId: number) => {
    const conversation = conversations.find(c => c.id === conversationId);
    if (conversation) {
      setSelectedConversation(conversation);
      await loadMessages(conversationId);
      
      // Attendre que les messages soient chargés avant de scroller
      setTimeout(() => {
        scrollToMessage(messageId);
      }, 500);
      
      // Réinitialiser la recherche
      setGlobalSearchQuery('');
      setGlobalSearchResults([]);
    }
  };

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (showNewChatModal) {
      loadAvailableUsers();
    }
  }, [showNewChatModal, searchUser]);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id);
    }
  }, [selectedConversation]);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}j`;
    
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6 flex items-center justify-center min-h-[60vh]">
        <p className="text-gray-400">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between p-6 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Chat</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">Messages</p>
            </div>
          </div>
          
          <button
            onClick={() => setShowNewChatModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Nouveau</span>
          </button>
        </div>

        {/* Chat Container */}
        <div className="flex flex-1 bg-gray-50 dark:bg-slate-800 overflow-hidden min-h-0">
          {/* Sidebar - Liste des conversations */}
          <div className="w-80 bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-700 flex flex-col overflow-hidden min-h-0">
            {/* Recherche */}
            <div className="flex-shrink-0 p-4 border-b border-gray-200 dark:border-slate-700">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={globalSearchQuery}
                  onChange={(e) => {
                    setGlobalSearchQuery(e.target.value);
                    searchGlobal(e.target.value);
                  }}
                  placeholder="Rechercher..."
                  className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-slate-800 border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-700"
                />
              </div>
              
              {globalSearchQuery && (
                <div className="mt-2">
                  {globalSearchLoading ? (
                    <p className="text-xs text-muted-foreground">Recherche...</p>
                  ) : (globalSearchQuery && globalSearchResults.length > 0) ? (
                    <p className="text-xs text-muted-foreground">
                      {globalSearchResults.length} résultat{globalSearchResults.length > 1 ? 's' : ''} trouvé{globalSearchResults.length > 1 ? 's' : ''}
                    </p>
                  ) : globalSearchQuery ? (
                    <p className="text-xs text-muted-foreground">Recherche...</p>
                  ) : null}
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto min-h-0">
              {/* Résultats de recherche globale */}
              {globalSearchQuery && globalSearchResults.length > 0 ? (
                globalSearchResults.map((result) => (
                  <div
                    key={result.id}
                    onClick={() => openConversationFromSearch(result.conversationId, result.id)}
                    className="p-4 border-b border-border cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                        {result.conversation?.isGroup ? (
                          <Users className="w-5 h-5" />
                        ) : (
                          <User className="w-5 h-5" />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-semibold text-sm truncate">{result.conversation?.name}</h3>
                          <span className="text-xs text-gray-400">
                            {new Date(result.createdAt).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'short'
                            })}
                          </span>
                        </div>
                        
                        <p className="text-xs text-gray-500 mb-1">
                          {result.sender?.firstName} {result.sender?.lastName}
                        </p>
                        
                        <p className="text-sm text-gray-300 truncate">
                          {renderMessageContent(result.content)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : globalSearchQuery ? (
                <div className="flex flex-col items-center justify-center flex-1 text-muted-foreground p-6 text-center">
                  <Search className="w-12 h-12 mb-3 opacity-50" />
                  <p className="text-sm">Aucun résultat</p>
                </div>
              ) : (
                /* Liste des conversations normale */
                <>
                  {conversations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center flex-1 p-8 text-center">
                      <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                        <MessageCircle className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 font-medium">Aucune conversation</p>
                      <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">Commencez une nouvelle conversation</p>
                    </div>
                  ) : (
                    conversations.map((conv) => {
                      const initials = conv.name ? conv.name.split(' ').map(n => n[0]).join('').toUpperCase() : '?';
                      const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-red-500'];
                      const colorIndex = conv.id % colors.length;
                      
                      return (
                        <div
                          key={conv.id}
                          onClick={() => setSelectedConversation(conv)}
                          className={`p-4 hover:bg-gray-50 dark:hover:bg-slate-800 cursor-pointer transition-colors border-b border-gray-100 dark:border-slate-800 ${
                            selectedConversation?.id === conv.id
                              ? 'bg-blue-50 dark:bg-blue-900/20 border-r-2 border-r-blue-500'
                              : ''
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-12 h-12 rounded-full ${colors[colorIndex]} flex items-center justify-center text-white font-semibold shadow-sm`}>
                              {conv.isGroup ? (
                                <Users className="w-6 h-6" />
                              ) : (
                                <span className="text-lg">{initials}</span>
                              )}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <h3 className="font-semibold text-gray-900 dark:text-white truncate">{conv.name}</h3>
                                {conv.lastMessageTime && (
                                  <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                                    {formatTime(conv.lastMessageTime)}
                                  </span>
                                )}
                              </div>
                              
                              <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                                {conv.lastMessage || 'Nouvelle conversation'}
                              </p>
                            </div>

                            {conv.unreadCount > 0 && (
                              <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center">
                                <span className="text-xs font-bold text-white">{conv.unreadCount}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </>
              )}
            </div>
          </div>

          {/* Main Chat Area */}
          <div className="flex-1 flex flex-col bg-white dark:bg-slate-900 overflow-hidden min-h-0">
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <div className="flex-shrink-0 p-4 border-b border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full ${['bg-blue-500', 'bg-green-500', 'bg-purple-500'][selectedConversation.id % 3]} flex items-center justify-center`}>
                      {selectedConversation.isGroup ? (
                        <Users className="w-5 h-5 text-white" />
                      ) : (
                        <span className="text-white font-semibold">
                          {selectedConversation.name?.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <h2 className="font-semibold text-gray-900 dark:text-white">{selectedConversation.name}</h2>
                      {!selectedConversation.isGroup && selectedConversation.otherUser && (() => {
                        const userId = selectedConversation.otherUser.id;
                        const status = userStatuses[userId];
                        const isOnline = status?.isOnline;
                        const lastSeen = selectedConversation.otherUser.lastSeen || status?.lastSeen;
                        
                        return (
                          <div className="flex items-center gap-1.5">
                            <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-400 dark:bg-gray-600'}`}></div>
                            <span className={`text-sm ${isOnline ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                              {formatLastSeen(lastSeen)}
                            </span>
                          </div>
                        );
                      })()}
                      {selectedConversation.isGroup && (
                        <div className="flex items-center gap-1.5">
                          <Users className="w-3 h-3 text-gray-500 dark:text-gray-400" />
                          <span className="text-sm text-gray-500 dark:text-gray-400">Groupe</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {selectedConversation.isGroup && (
                        <button
                          onClick={() => loadGroupMembers(selectedConversation.id)}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        >
                          <Users className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setShowSearchBar(!showSearchBar);
                          if (showSearchBar) {
                            setSearchQuery('');
                            setSearchResults([]);
                          }
                        }}
                        className={`p-2 rounded-lg transition-colors ${
                          showSearchBar 
                            ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400'
                            : 'hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-600 dark:text-gray-400'
                        }`}
                      >
                        <Search className="w-5 h-5" />
                      </button>

                      {/* Paramètres de suppression auto */}
                      <div className="relative">
                        <button
                          onClick={() => setShowSettingsDropdown(!showSettingsDropdown)}
                          className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-2"
                          title="Paramètres de suppression"
                        >
                          <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {selectedConversation.autoDeleteDays === null 
                              ? 'Permanent' 
                              : selectedConversation.autoDeleteDays === 3
                              ? '3 jours'
                              : selectedConversation.autoDeleteDays === 7
                              ? '7 jours'
                              : selectedConversation.autoDeleteDays === 14
                              ? '14 jours'
                              : selectedConversation.autoDeleteDays === 30
                              ? '30 jours'
                              : '3 mois'
                            }
                          </span>
                        </button>

                        {showSettingsDropdown && (
                          <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-gray-200 dark:border-slate-700 z-50 overflow-hidden">
                            <div className="p-3 border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900">
                              <p className="text-sm font-semibold text-gray-900 dark:text-white">Suppression automatique</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Messages supprimés après</p>
                            </div>
                            
                            <div className="p-2 max-h-80 overflow-y-auto">
                              {[
                                { label: 'Permanent', value: null, icon: '♾️' },
                                { label: '3 jours', value: 3, icon: '📅' },
                                { label: '7 jours', value: 7, icon: '📅' },
                                { label: '14 jours', value: 14, icon: '📅' },
                                { label: '30 jours', value: 30, icon: '📅' },
                                { label: '3 mois', value: 90, icon: '📅' }
                              ].map((option) => (
                                <button
                                  key={option.label}
                                  onClick={() => {
                                    updateAutoDelete(option.value);
                                    setShowSettingsDropdown(false);
                                  }}
                                  className={`w-full text-left px-3 py-2.5 rounded-lg transition-all text-sm mb-1 flex items-center justify-between ${
                                    selectedConversation.autoDeleteDays === option.value
                                      ? 'bg-blue-600 text-white shadow-md'
                                      : 'hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300'
                                  }`}
                                >
                                  <span className="flex items-center gap-2">
                                    <span className="text-lg">{option.icon}</span>
                                    <span className="font-medium">{option.label}</span>
                                  </span>
                                  {selectedConversation.autoDeleteDays === option.value && (
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  )}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Barre de recherche */}
                {showSearchBar && (
                  <div className="border-b border-gray-700 p-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          searchMessages(e.target.value);
                        }}
                        placeholder="Rechercher dans la conversation..."
                        className="w-full pl-10 pr-4 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 text-foreground placeholder:text-muted-foreground"
                      />
                    </div>
                    
                    {searchQuery && (
                      <div className="mt-2">
                        {searchLoading ? (
                          <p className="text-xs text-muted-foreground">Recherche...</p>
                        ) : (
                          <p className="text-xs text-muted-foreground">
                            {searchResults.length} résultat{searchResults.length > 1 ? 's' : ''}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Résultats de recherche */}
                    {searchResults.length > 0 && (
                      <div className="mt-2 max-h-48 overflow-y-auto bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700">
                        {searchResults.map((result) => (
                          <div
                            key={result.id}
                            onClick={() => {
                              scrollToMessage(result.id);
                              setShowSearchBar(false);
                              setSearchQuery('');
                              setSearchResults([]);
                            }}
                            className="p-3 hover:bg-gray-50 dark:hover:bg-slate-700 cursor-pointer border-b border-gray-100 dark:border-slate-700 last:border-0 transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-gray-900 dark:text-white">
                                  {result.sender?.firstName} {result.sender?.lastName}
                                </p>
                                <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                                  {renderMessageContent(result.content)}
                                </p>
                              </div>
                              <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                                {new Date(result.createdAt).toLocaleDateString('fr-FR', {
                                  day: 'numeric',
                                  month: 'short'
                                })}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-slate-800 min-h-0">
                  {messages.map((message, index) => {
                    const isOwn = Number(message.senderId) === Number(currentUserId);
                    const messageDate = new Date(message.createdAt);
                    const prevMessage = index > 0 ? messages[index - 1] : null;
                    const prevMessageDate = prevMessage ? new Date(prevMessage.createdAt) : null;
                    
                    // Vérifier si on doit afficher le séparateur de date
                    const showDateSeparator = !prevMessageDate || 
                      messageDate.toDateString() !== prevMessageDate.toDateString();
                    
                    const formatDateSeparator = (date: Date) => {
                      const today = new Date();
                      const yesterday = new Date(today);
                      yesterday.setDate(yesterday.getDate() - 1);
                      
                      if (date.toDateString() === today.toDateString()) {
                        return "Aujourd'hui";
                      } else if (date.toDateString() === yesterday.toDateString()) {
                        return "Hier";
                      } else {
                        return date.toLocaleDateString('fr-FR', { 
                          weekday: 'long', 
                          day: 'numeric', 
                          month: 'long',
                          year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
                        });
                      }
                    };
                    
                    return (
                      <div key={message.id}>
                        {/* Séparateur de date */}
                        {showDateSeparator && (
                          <div className="flex items-center justify-center my-6">
                            <div className="px-4 py-2 bg-white dark:bg-slate-700 rounded-full text-sm text-gray-600 dark:text-gray-300 shadow-sm">
                              {formatDateSeparator(messageDate)}
                            </div>
                          </div>
                        )}
                        
                        <div
                          id={`message-${message.id}`}
                          className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                        >
                        <div
                          className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                            isOwn
                              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                              : 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-md'
                          }`}
                        >
                          {!isOwn && message.sender && (
                            <p className="text-xs font-semibold mb-1 opacity-75">
                              {message.sender.firstName} {message.sender.lastName}
                            </p>
                          )}
                          
                          {message.messageType === 'file' ? (
                            // Affichage pour les fichiers
                            (() => {
                              const metadata = message.metadata ? JSON.parse(message.metadata) : null;
                              return (
                                <div className="space-y-3">
                                  {/* Message d'accompagnement si présent */}
                                  {metadata?.hasMessage && message.content !== metadata?.originalName && (
                                    <p className="text-sm font-medium">{renderMessageContent(message.content, isOwn)}</p>
                                  )}
                                  
                                  {/* Fichier */}
                                  <div className={`rounded-2xl overflow-hidden border-2 ${
                                    isOwn 
                                      ? 'bg-white/15 border-white/30 backdrop-blur-sm'
                                      : 'bg-blue-50 dark:bg-slate-600 border-blue-200 dark:border-slate-500'
                                  }`}>
                                    <div className="p-4 flex items-center gap-3">
                                      <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${
                                        isOwn
                                          ? 'bg-white/20'
                                          : 'bg-blue-100 dark:bg-slate-700'
                                      }`}>
                                        {metadata && getFileIcon(metadata.mimetype)}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className={`font-bold text-sm truncate mb-0.5 ${
                                          isOwn ? 'text-white' : 'text-gray-900 dark:text-white'
                                        }`}>
                                          {metadata?.originalName || 'Fichier'}
                                        </p>
                                        <p className={`text-xs font-medium ${
                                          isOwn ? 'text-white/80' : 'text-gray-600 dark:text-gray-400'
                                        }`}>
                                          {metadata?.filesize && formatFileSize(metadata.filesize)}
                                        </p>
                                      </div>
                                      {metadata?.url && (
                                        <a
                                          href={metadata.url}
                                          download={metadata.originalName}
                                          className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                                            isOwn
                                              ? 'bg-white text-blue-600 hover:bg-white/90 hover:scale-105'
                                              : 'bg-blue-600 text-white hover:bg-blue-700 hover:scale-105'
                                          } shadow-lg`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                        >
                                          <Download className="w-5 h-5" />
                                        </a>
                                      )}
                                    </div>
                                    {/* Prévisualisation pour les images */}
                                    {metadata?.mimetype?.startsWith('image/') && metadata?.url && (
                                      <div className="px-4 pb-4">
                                        <img
                                          src={metadata.url}
                                          alt={metadata.originalName}
                                          className={`w-full rounded-xl cursor-pointer shadow-xl transition-transform hover:scale-[1.02] ${
                                            isOwn 
                                              ? 'border-2 border-white/20'
                                              : 'border-2 border-blue-100 dark:border-slate-500'
                                          }`}
                                          style={{ maxHeight: '300px', objectFit: 'cover' }}
                                          onClick={() => window.open(metadata.url, '_blank')}
                                        />
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })()
                          ) : (
                            // Affichage pour les messages texte
                            <p className="text-sm">{renderMessageContent(message.content, isOwn)}</p>
                          )}
                          
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs opacity-75">
                              {new Date(message.createdAt).toLocaleTimeString('fr-FR', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                            
                            {isOwn && (() => {
                              // Vérifier si le message a été lu par les autres participants
                              const otherParticipants = conversationParticipants.filter(
                                p => p.userId !== currentUserId
                              );
                              
                              if (otherParticipants.length === 0) {
                                // Aucun participant (ne devrait pas arriver)
                                return <Check className="w-3 h-3 opacity-50" />;
                              }
                              
                              const messageTime = new Date(message.createdAt).getTime();
                              const isRead = otherParticipants.some(p => 
                                p.lastReadAt && new Date(p.lastReadAt).getTime() >= messageTime
                              );
                              
                              if (isRead) {
                                // Lu - V dans un cercle bleu
                                return <CheckCircle className="w-3 h-3 text-primary" />;
                              } else {
                                // Envoyé mais pas encore lu - simple V gris
                                return <Check className="w-3 h-3 text-muted-foreground" />;
                              }
                            })()}
                          </div>
                        </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="flex-shrink-0 p-4 border-t border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                  <div className="flex items-end gap-3">
                    {/* Bouton d'upload de fichier */}
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="p-3 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Ajouter un fichier"
                    >
                      <Paperclip className="w-5 h-5" />
                    </button>
                    
                    {/* Input de fichier caché */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      onChange={handleFileSelect}
                      className="hidden"
                      accept="*/*"
                    />
                    
                    <div className="flex-1 relative">
                      <input
                        ref={inputRef}
                        type="text"
                        value={newMessage}
                        onChange={handleMessageChange}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            if (!showMentionDropdown) {
                              handleSendMessage();
                            }
                          }
                        }}
                        onKeyDown={(e) => {
                          if (showMentionDropdown) {
                            if (e.key === 'Escape') {
                              setShowMentionDropdown(false);
                              setMentionSuggestions([]);
                            } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                              e.preventDefault();
                            }
                          }
                        }}
                        placeholder={uploading ? "Upload en cours..." : "Tapez votre message... (@nom ou #ID)"}
                        disabled={sending || uploading}
                        className="w-full px-4 py-3 bg-gray-100 dark:bg-slate-800 rounded-full text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-700 disabled:opacity-50 pr-12"
                      />

                      {/* Dropdown des suggestions de mentions */}
                      {showMentionDropdown && (
                        <div className="absolute bottom-full left-0 mb-2 w-full max-w-md bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden z-50">
                          {mentionSuggestions.length > 0 ? (
                            <>
                              <div className="max-h-60 overflow-y-auto">
                                {mentionSuggestions.map((client) => (
                                  <button
                                    key={client.id}
                                    onClick={() => insertMention(client)}
                                    className="w-full px-4 py-3 text-left hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center gap-3 border-b border-slate-100 dark:border-slate-700 last:border-0"
                                  >
                                    <div className="flex-1 min-w-0">
                                      <div className="font-medium text-slate-900 dark:text-white truncate">
                                        {client.nickname || client.fullName}
                                      </div>
                                      <div className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2">
                                        {client.customId && (
                                          <span className="font-mono">#{client.customId}</span>
                                        )}
                                        {client.fullName && client.nickname && (
                                          <span>{client.fullName}</span>
                                        )}
                                      </div>
                                    </div>
                                  </button>
                                ))}
                              </div>
                              <div className="px-4 py-2 bg-slate-50 dark:bg-slate-900 text-xs text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-700">
                                Utilisez @ pour le surnom ou # pour l'ID
                              </div>
                            </>
                          ) : (
                            <div className="px-4 py-3 text-center text-slate-500 dark:text-slate-400">
                              {mentionSearch.length > 0 ? 'Aucun client trouvé' : 'Tapez pour rechercher...'}
                            </div>
                          )}
                        </div>
                      )}
                      
                      <button
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim() || sending || uploading}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-full transition-colors disabled:cursor-not-allowed"
                      >
                        {sending || uploading ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 bg-gray-50 dark:bg-slate-800">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mb-6">
                  <MessageCircle className="w-12 h-12 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Sélectionnez une conversation</h3>
                <p className="text-gray-600 dark:text-gray-400 text-center max-w-sm">
                  Choisissez une conversation existante dans la liste ou créez-en une nouvelle pour commencer à discuter.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal Nouvelle Conversation */}
      {showNewChatModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl border border-gray-200 dark:border-slate-700 max-h-[85vh] flex flex-col">
            <div className="p-6 border-b border-gray-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Nouvelle conversation</h2>
                <button
                  onClick={() => {
                    setShowNewChatModal(false);
                    setIsGroupMode(false);
                    setSelectedUserIds([]);
                    setGroupName('');
                  }}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto">
              {/* Toggle Mode */}
              <div className="flex gap-2 mb-6 bg-gray-100 dark:bg-slate-800 p-1 rounded-xl">
                <button
                  onClick={() => {
                    setIsGroupMode(false);
                    setSelectedUserIds([]);
                    setGroupName('');
                  }}
                  className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-all ${
                    !isGroupMode
                      ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <User className="w-4 h-4" />
                    <span>1-to-1</span>
                  </div>
                </button>
                <button
                  onClick={() => setIsGroupMode(true)}
                  className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-all ${
                    isGroupMode
                      ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <Users className="w-4 h-4" />
                    <span>Groupe</span>
                  </div>
                </button>
              </div>

              {/* Nom du groupe (uniquement en mode groupe) */}
              {isGroupMode && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nom du groupe
                  </label>
                  <input
                    type="text"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    placeholder="Ex: Projet Awesome"
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-400"
                  />
                </div>
              )}

              {/* Recherche utilisateurs */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Rechercher un utilisateur
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchUser}
                    onChange={(e) => setSearchUser(e.target.value)}
                    placeholder="Rechercher..."
                    className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-400"
                  />
                </div>
              </div>

              {/* Sélection multiple en mode groupe */}
              {isGroupMode && selectedUserIds.length > 0 && (
                <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-3">
                    {selectedUserIds.length} participant{selectedUserIds.length > 1 ? 's' : ''} sélectionné{selectedUserIds.length > 1 ? 's' : ''}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selectedUserIds.map(userId => {
                      const user = availableUsers.find(u => u.id === userId);
                      return user ? (
                        <span key={userId} className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-full flex items-center gap-2 shadow-sm">
                          {user.firstName}
                          <button
                            onClick={() => toggleUserSelection(userId)}
                            className="hover:bg-blue-700 rounded-full p-0.5 transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </span>
                      ) : null;
                    })}
                  </div>
                </div>
              )}

              {/* Liste des utilisateurs */}
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {availableUsers.map((user) => {
                  const isSelected = isGroupMode && selectedUserIds.includes(user.id);
                  const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500', 'bg-indigo-500'];
                  const colorIndex = user.id % colors.length;
                  const initials = `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
                  
                  return (
                    <div
                      key={user.id}
                      onClick={() => isGroupMode ? toggleUserSelection(user.id) : handleStartConversation(user.id)}
                      className={`p-4 rounded-xl cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-500'
                          : 'bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 border-2 border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-11 h-11 rounded-full ${colors[colorIndex]} flex items-center justify-center shadow-sm`}>
                          {isSelected ? (
                            <Check className="w-6 h-6 text-white" />
                          ) : (
                            <span className="text-white font-semibold">{initials}</span>
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {user.firstName} {user.lastName}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">@{user.username}</p>
                        </div>

                        <span className="px-2.5 py-1 text-xs font-medium bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-full">
                          {user.role}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Bouton de création pour les groupes */}
              {isGroupMode && (
                <div className="mt-6 pt-4 border-t border-gray-200 dark:border-slate-700">
                  <button
                    onClick={() => handleStartConversation()}
                    disabled={selectedUserIds.length === 0 || !groupName.trim()}
                    className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30"
                  >
                    <Users className="w-5 h-5" />
                    Créer le groupe ({selectedUserIds.length})
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Membres du Groupe */}
      {showMembersModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl border border-gray-200 dark:border-slate-700">
            <div className="p-6 border-b border-gray-200 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Membres du groupe</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {groupMembers.length} membre{groupMembers.length > 1 ? 's' : ''}
                  </p>
                </div>
                <button
                  onClick={() => setShowMembersModal(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </button>
              </div>
            </div>

            <div className="p-6 max-h-[60vh] overflow-y-auto">
              <div className="space-y-3">
                {groupMembers.map((member) => {
                  const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500'];
                  const colorIndex = member.userId % colors.length;
                  const initials = member.user ? `${member.user.firstName[0]}${member.user.lastName[0]}`.toUpperCase() : '?';
                  
                  return (
                    <div
                      key={member.id}
                      className="p-4 bg-gray-50 dark:bg-slate-800 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-750 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-11 h-11 rounded-full ${colors[colorIndex]} flex items-center justify-center shadow-sm`}>
                          <span className="text-white font-semibold">{initials}</span>
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-gray-900 dark:text-white">
                              {member.user?.firstName} {member.user?.lastName}
                            </p>
                            {member.userId === currentUserId && (
                              <span className="px-2 py-0.5 text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full">
                                Vous
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">@{member.user?.username}</p>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                            Depuis {new Date(member.joinedAt).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </p>
                        </div>

                        <span className="px-2.5 py-1 text-xs font-medium bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300 rounded-full">
                          {member.user?.role}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Envoi de Fichier */}
      {showFileModal && selectedFile && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl border border-gray-200 dark:border-slate-700">
            <div className="p-6 border-b border-gray-200 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <Paperclip className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex-1">Envoyer un fichier</h2>
                <button
                  onClick={handleCancelFileUpload}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* Informations du fichier */}
              <div className="mb-6 p-4 bg-gray-50 dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    {getFileIcon(selectedFile.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-white truncate mb-1">{selectedFile.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {formatFileSize(selectedFile.size)}
                    </p>
                  </div>
                </div>
                
                {/* Prévisualisation pour les images */}
                {selectedFile.type.startsWith('image/') && (
                  <div className="mt-4">
                    <img
                      src={URL.createObjectURL(selectedFile)}
                      alt={selectedFile.name}
                      className="w-full rounded-lg object-cover max-h-48"
                    />
                  </div>
                )}
              </div>

              {/* Champ de message optionnel */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Message (optionnel)
                </label>
                <textarea
                  value={fileMessage}
                  onChange={(e) => setFileMessage(e.target.value)}
                  placeholder="Ajouter un message avec votre fichier..."
                  rows={3}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-400 resize-none"
                />
              </div>

              {/* Boutons d'action */}
              <div className="flex gap-3">
                <button
                  onClick={handleCancelFileUpload}
                  className="flex-1 px-4 py-3 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 font-medium rounded-xl transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleConfirmFileUpload}
                  disabled={uploading}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30"
                >
                  {uploading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Envoi...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Envoyer
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Client Details Modal */}
      {showClientModal && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={closeClientModal}
        >
          <div 
            className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 p-6 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                Détails du Client
              </h2>
              <button
                onClick={closeClientModal}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Loading State */}
            {loadingClient && (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            )}

            {/* Client Details */}
            {!loadingClient && clientDetails && (
              <div className="space-y-6">
                {/* Basic Info */}
                <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">Surnom</div>
                      <div className="text-lg font-semibold text-slate-900 dark:text-white">
                        {clientDetails.nickname || 'N/A'}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">ID personnalisé</div>
                      <div className="text-lg font-semibold text-slate-900 dark:text-white">
                        {clientDetails.customId || 'N/A'}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">Nom complet</div>
                      <div className="text-lg text-slate-900 dark:text-white">
                        {clientDetails.fullName || 'N/A'}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">Priorité</div>
                      <div className={`inline-flex px-2 py-1 rounded-full text-sm font-medium ${
                        clientDetails.priority === 'HIGH' 
                          ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' 
                          : clientDetails.priority === 'MEDIUM'
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                          : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      }`}>
                        {clientDetails.priority || 'N/A'}
                      </div>
                    </div>
                  </div>
                  {clientDetails.description && (
                    <div className="mt-4">
                      <div className="text-sm text-slate-500 dark:text-slate-400">Description</div>
                      <div className="text-slate-900 dark:text-white mt-1">
                        {clientDetails.description}
                      </div>
                    </div>
                  )}
                </div>

                {/* Contact Identifiers */}
                {clientDetails.contactIdentifiers && clientDetails.contactIdentifiers.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">
                      Identifiants de contact
                    </h3>
                    <div className="space-y-2">
                      {clientDetails.contactIdentifiers.map((contact: any) => (
                        <div
                          key={contact.id}
                          className="flex items-center justify-between bg-slate-50 dark:bg-slate-900 rounded-lg p-3"
                        >
                          <div className="flex-1">
                            <div className="font-medium text-slate-900 dark:text-white">
                              {contact.accountType}
                            </div>
                            <div className="text-sm text-slate-600 dark:text-slate-400">
                              {contact.accountNumber}
                            </div>
                          </div>
                          {contact.info && (
                            <div className="text-sm text-slate-500 dark:text-slate-400">
                              {contact.info}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Searches */}
                {clientDetails.searches && clientDetails.searches.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">
                      Recherches associées
                    </h3>
                    <div className="space-y-2">
                      {clientDetails.searches.slice(0, 5).map((search: any, index: number) => (
                        <div
                          key={search.id || index}
                          className="bg-slate-50 dark:bg-slate-900 rounded-lg p-3"
                        >
                          <div className="font-medium text-slate-900 dark:text-white">
                            {search.generalReference}
                          </div>
                          {search.detailedReference && (
                            <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                              {search.detailedReference}
                            </div>
                          )}
                        </div>
                      ))}
                      {clientDetails.searches.length > 5 && (
                        <div className="text-sm text-slate-500 dark:text-slate-400 text-center">
                          +{clientDetails.searches.length - 5} autres recherches
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Action Button */}
                <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                  <a
                    href={`/clients/${clientDetails.slug || clientDetails.id}`}
                    className="inline-flex items-center justify-center w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Voir la fiche complète
                  </a>
                </div>
              </div>
            )}

            {/* No Data State */}
            {!loadingClient && !clientDetails && (
              <div className="text-center py-12">
                <div className="text-slate-400 mb-2">
                  <User className="w-16 h-16 mx-auto opacity-50" />
                </div>
                <p className="text-slate-600 dark:text-slate-400">
                  Aucune donnée disponible
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
