# 📋 Changelog

Toutes les modifications notables du projet DYN sont documentées ici.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/).

## [1.2.0] - 2026-01-31

### ✨ Ajouté
- **Système Finance Multi-Devises**
  - Support BTC, EUR, USD, GBP, CHF
  - Gestion des devises depuis l'admin
  - Taux de change et conversions
  
- **Gestion de Projets Financiers**
  - Création de projets avec budgets
  - Association de wallets aux projets
  - Suivi du budget restant
  - Statistiques par projet
  
- **Gestion de Wallets (Portefeuilles)**
  - Création de wallets multi-devises
  - Association aux projets (optionnel)
  - Suivi des fonds restants
  - Analytics par wallet
  
- **Gestion des Dépenses**
  - Types: Matériel, License, Autre
  - Association projet + wallet
  - Historique complet des dépenses
  - CRUD complet avec modals
  - Export Excel des dépenses
  
- **Analytics Finance**
  - Graphiques des dépenses par projet
  - Graphiques des dépenses par type
  - Graphiques des dépenses par wallet
  - Vue consolidée toutes devises
  - Filtrage par période

### 🔧 Modifié
- Fix Suspense boundary pour `useSearchParams()` dans Next.js 16
- Migration Prisma pour ajout de Currency dans Expense
- Amélioration de l'interface finance avec onglets
- Optimisation des requêtes API finance

### 📚 Documentation
- Création de DOCUMENTATION.md (index complet)
- Mise à jour README.md
- Nettoyage des fichiers markdown obsolètes
- Ajout de CHANGELOG.md

## [1.1.0] - 2026-01-29

### ✨ Ajouté
- **Page Configuration Currencies** (`/admin/currencies`)
  - CRUD complet des devises
  - Configuration symboles et noms
  - Gestion devise par défaut
  - Activation/désactivation

- **Système de Recherche Avancée**
  - Filtres multiples et sauvegardés
  - Historique des recherches
  - API de recherche unifiée

- **Applications Intégrées**
  - Chat temps réel
  - Système d'email
  - Calendrier
  - Stockage de fichiers
  - Notes

### 🔧 Modifié
- Refactoring de la structure du code
- Centralisation des types TypeScript
- Création de hooks personnalisés
- Amélioration du client API

## [1.0.0] - 2026-01-15

### ✨ Version Initiale

#### Core Features
- **Authentification JWT**
  - Login/Register
  - Protection des routes
  - Sessions persistantes
  - Middleware de sécurité

- **Système de Rôles (RBAC)**
  - Rôles: SUPER_ADMIN, ADMIN, MANAGER, USER, READ_ONLY
  - Permissions granulaires
  - Configuration par catégorie

- **Gestion des Utilisateurs**
  - CRUD complet
  - Attribution de rôles
  - Catégories d'accès
  - Soft delete

- **Gestion des Clients**
  - Informations complètes
  - Contacts multiples (email, tel, réseaux sociaux)
  - Catégorisation
  - Historique des modifications
  - Soft delete avec corbeille

- **Système de Catégories**
  - Catégories hiérarchiques
  - Attribution utilisateurs/clients
  - Codes couleur
  - Gestion centralisée

- **Dashboard Principal**
  - Statistiques en temps réel
  - Activités récentes
  - Quick actions
  - Navigation intelligente

- **Gestion des Tâches**
  - Système Kanban
  - Vue liste
  - Priorités et statuts
  - Assignations
  - Dates d'échéance

- **Administration**
  - Gestion utilisateurs/rôles
  - Gestion catégories
  - Configuration système
  - Monitoring
  - Backup/Restore DB
  - Logs d'activité

#### Technique
- **Framework:** Next.js 16.1.4 (App Router)
- **UI:** React 19 + Tailwind CSS 4.0
- **Database:** PostgreSQL + Prisma ORM 5.22.0
- **TypeScript:** Full typing
- **Architecture:** Modular et scalable

#### Sécurité
- Politique de mots de passe robuste
- Validation des inputs
- Protection CSRF
- Rate limiting
- Journalisation complète

---

## Légende des Types de Changements

- **✨ Ajouté** - Nouvelles fonctionnalités
- **🔧 Modifié** - Changements de fonctionnalités existantes
- **🐛 Corrigé** - Corrections de bugs
- **🗑️ Supprimé** - Fonctionnalités retirées
- **🔒 Sécurité** - Corrections de vulnérabilités
- **📚 Documentation** - Changements de documentation
- **⚡ Performance** - Améliorations de performance

---

**Format de version:** MAJOR.MINOR.PATCH
- **MAJOR:** Changements incompatibles
- **MINOR:** Nouvelles fonctionnalités compatibles
- **PATCH:** Corrections de bugs compatibles
