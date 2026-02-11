# 🚀 DYN - Système de Gestion d'Entreprise

Application Next.js complète de gestion d'entreprise avec système de clients, projets, finances, tâches et plus.

## 📋 Table des Matières

- [Technologies](#-technologies)
- [Démarrage Rapide](#-démarrage-rapide)
- [Fonctionnalités](#-fonctionnalités)
- [Structure du Projet](#-structure-du-projet)
- [Documentation](#-documentation)
- [Déploiement](#-déploiement)

## 🛠 Technologies

- **Framework:** Next.js 16.1.4 (App Router)
- **UI:** React 19, Tailwind CSS 4.0
- **Base de données:** PostgreSQL + Prisma ORM
- **Authentification:** Système personnalisé avec JWT
- **TypeScript:** Typage complet

## ⚡ Démarrage Rapide

### Prérequis
- Node.js 18+
- PostgreSQL
- npm ou yarn

### Installation

```bash
# 1. Cloner le projet
git clone <repo-url>
cd DYN

# 2. Installer les dépendances
npm install

# 3. Configurer les variables d'environnement
cp .env.example .env.local
# Éditer .env.local avec vos paramètres

# 4. Initialiser la base de données
npx prisma generate
npx prisma migrate dev

# 5. Lancer le serveur de développement
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000)

**Compte admin par défaut:**
- Email: `admin@dyn.com`
- Mot de passe: Voir `.env.local`

Pour plus de détails, voir [QUICK_START.md](./QUICK_START.md)

## ✨ Fonctionnalités

### 📊 Dashboard
- Vue d'ensemble des activités
- Statistiques en temps réel
- Activités récentes

### 👥 Gestion des Clients
- CRUD complet avec historique
- Catégorisation flexible
- Identifiants de contact multiples
- Soft delete et corbeille

### 💰 Finance & Rapports
- Gestion multi-devises (BTC, EUR, USD, GBP, CHF)
- Projets avec budgets
- Portefeuilles (wallets)
- Suivi des dépenses (matériel, licenses, autres)
- Analytics détaillées

### 📋 Gestion de Tâches
- Système Kanban
- Priorités et statuts
- Assignation d'utilisateurs
- Vue calendrier

### 🔍 Recherches
- Système de recherche avancée
- Filtres sauvegardés
- Historique des recherches

### 📧 Applications Intégrées
- Email
- Chat (temps réel)
- Calendrier
- Stockage de fichiers
- Notes

### 🔐 Sécurité
- Authentification JWT
- Contrôle d'accès basé sur les rôles (RBAC)
- Politique de mots de passe robuste
- Journalisation complète
- Support SSO (optionnel)

### 👨‍💼 Administration
- Gestion des utilisateurs et rôles
- Configuration des catégories
- Gestion des devises
- Monitoring système
- Backup/Restore base de données
- Logs d'activité

## 📁 Structure du Projet

```
DYN/
├── app/                    # Pages et routes API Next.js
│   ├── api/               # Routes API backend
│   ├── admin/             # Interface administration
│   ├── apps/              # Apps intégrées (chat, email, etc.)
│   ├── auth/              # Pages authentification
│   ├── clients/           # Gestion clients
│   ├── dashboard/         # Dashboard principal
│   ├── finance/           # Module finance
│   └── ...
├── components/            # Composants React réutilisables
│   └── ui/               # Composants UI de base
├── hooks/                 # Hooks React personnalisés
├── lib/                   # Utilitaires et configuration
│   ├── auth.ts           # Fonctions authentification
│   ├── prisma.ts         # Client Prisma
│   ├── roles.ts          # Gestion des rôles
│   └── utils.ts          # Utilitaires généraux
├── prisma/               # Schéma et migrations
│   └── schema.prisma     # Modèles de données
├── scripts/              # Scripts utilitaires
└── types/                # Types TypeScript partagés
```

Voir [CODE_STRUCTURE.md](./CODE_STRUCTURE.md) pour plus de détails.

## 📚 Documentation

- **[QUICK_START.md](./QUICK_START.md)** - Guide de démarrage rapide
- **[SETUP_GUIDE.md](./SETUP_GUIDE.md)** - Installation détaillée
- **[CODE_STRUCTURE.md](./CODE_STRUCTURE.md)** - Architecture du code
- **[AUTH_SYSTEM.md](./AUTH_SYSTEM.md)** - Système d'authentification
- **[PASSWORD_POLICY.md](./PASSWORD_POLICY.md)** - Politique de sécurité
- **[HISTORY_SYSTEM.md](./HISTORY_SYSTEM.md)** - Système d'historique
- **[EXPORT_GUIDE.md](./EXPORT_GUIDE.md)** - Export de données
- **[TESTING_GUIDE.md](./TESTING_GUIDE.md)** - Tests et qualité
- **[SSO_GUIDE.md](./SSO_GUIDE.md)** - Configuration SSO
- **[MIGRATION_CHECKLIST.md](./MIGRATION_CHECKLIST.md)** - Checklist migrations DB

## 🚀 Déploiement

### Production (Ubuntu Server)

```bash
# Sur le serveur
git pull
npm install
npx prisma generate
npx prisma migrate deploy
npm run build
pm2 restart dyn
```

### Environnement Offline

Pour un déploiement en réseau local sans internet, voir [DEPLOYMENT_OFFLINE.md](./DEPLOYMENT_OFFLINE.md)

### Build de Production

```bash
# Vérifier le build
npm run build

# Lancer en production
npm start
```

## 🔧 Scripts Disponibles

```bash
npm run dev          # Serveur de développement
npm run build        # Build de production
npm start            # Lancer en production
npm run lint         # Vérifier le code
npx prisma studio    # Interface Prisma GUI
```

## 📝 Variables d'Environnement

Copier `.env.example` vers `.env.local` et configurer :

```env
DATABASE_URL="postgresql://user:password@localhost:5432/dyn"
JWT_SECRET="votre-secret-jwt"
NEXT_PUBLIC_API_URL="http://localhost:3000"
```

## 🤝 Contribution

1. Créer une branche feature
2. Commits avec messages clairs
3. Tests avant push
4. Pull request avec description

## 📄 Licence

Propriétaire - Tous droits réservés

---

**Version:** 1.0.0  
**Dernière mise à jour:** Janvier 2026
