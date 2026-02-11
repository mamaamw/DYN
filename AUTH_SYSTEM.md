# Système d'Authentification DYN CRM

## Vue d'ensemble

Système complet d'authentification avec gestion des utilisateurs, rôles et permissions pour l'application DYN CRM.

## ✨ Fonctionnalités

### Authentification
- ✅ Inscription de nouveaux utilisateurs
- ✅ Connexion avec email et mot de passe
- ✅ Mot de passe oublié / Réinitialisation
- ✅ Déconnexion sécurisée
- ✅ Protection des routes avec middleware
- ✅ Tokens JWT avec cookies sécurisés (7 jours)

### Gestion des Utilisateurs
- ✅ 4 rôles prédéfinis : ADMIN, MANAGER, USER, VIEWER
- ✅ Activation/Désactivation de comptes
- ✅ Vérification d'email
- ✅ Suivi de la dernière connexion
- ✅ Panel d'administration (ADMIN uniquement)

### Sécurité
- 🔒 Mots de passe hashés avec bcrypt (12 rounds)
- 🔒 Tokens JWT signés avec secret
- 🔒 Tokens de réinitialisation avec expiration (1 heure)
- 🔒 Cookies sécurisés pour le stockage des tokens
- 🔒 Vérification des permissions côté serveur

## 🗄️ Structure de la Base de Données

### Modèle User
\`\`\`prisma
model User {
  id                   String    @id @default(cuid())
  email                String    @unique
  password             String
  firstName            String
  lastName             String
  role                 UserRole  @default(USER)
  isActive             Boolean   @default(true)
  emailVerified        Boolean   @default(false)
  resetPasswordToken   String?
  resetPasswordExpires DateTime?
  lastLogin            DateTime?
  createdAt            DateTime  @default(now())
  updatedAt            DateTime  @updatedAt
}

enum UserRole {
  ADMIN    // Accès complet + gestion utilisateurs
  MANAGER  // Gestion données + rapports
  USER     // Accès standard
  VIEWER   // Lecture seule
}
\`\`\`

## 🚀 API Endpoints

### POST /api/auth/register
Inscription d'un nouvel utilisateur
\`\`\`json
{
  "email": "user@example.com",
  "password": "motdepasse123",
  "firstName": "Jean",
  "lastName": "Dupont"
}
\`\`\`

### POST /api/auth/login
Connexion utilisateur
\`\`\`json
{
  "email": "user@example.com",
  "password": "motdepasse123"
}
\`\`\`

### POST /api/auth/forgot-password
Demande de réinitialisation de mot de passe
\`\`\`json
{
  "email": "user@example.com"
}
\`\`\`

### POST /api/auth/reset-password
Réinitialisation du mot de passe
\`\`\`json
{
  "token": "reset-token-from-email",
  "password": "nouveaumotdepasse"
}
\`\`\`

### POST /api/auth/logout
Déconnexion de l'utilisateur

### GET /api/users
Liste tous les utilisateurs (ADMIN uniquement)

### PATCH /api/users
Modifier le rôle ou le statut d'un utilisateur (ADMIN uniquement)
\`\`\`json
{
  "userId": "user-id",
  "role": "MANAGER",
  "isActive": true
}
\`\`\`

## 📁 Structure des Fichiers

\`\`\`
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── register/route.ts      # Inscription
│   │   │   ├── login/route.ts         # Connexion
│   │   │   ├── logout/route.ts        # Déconnexion
│   │   │   ├── forgot-password/route.ts
│   │   │   └── reset-password/route.ts
│   │   └── users/route.ts             # Gestion utilisateurs (admin)
│   ├── auth/
│   │   ├── login/page.tsx             # Page de connexion
│   │   ├── register/page.tsx          # Page d'inscription
│   │   ├── forgot-password/page.tsx   # Mot de passe oublié
│   │   └── reset-password/page.tsx    # Réinitialisation
│   └── admin/
│       └── users/page.tsx             # Panel admin utilisateurs
├── lib/
│   └── auth.ts                        # Utilitaires d'authentification
├── middleware.ts                      # Protection des routes
├── components/
│   └── Header.tsx                     # Header avec menu utilisateur
└── prisma/
    └── schema.prisma                  # Schéma de la base de données
\`\`\`

## 🔧 Configuration

### Variables d'Environnement (.env.local)
\`\`\`env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/dyn?schema=public"
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
NEXT_PUBLIC_BASE_URL="http://localhost:3000"

# Email (optionnel - pour les emails de réinitialisation)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"
\`\`\`

### Migration de la Base de Données
\`\`\`bash
# Appliquer la migration
npx prisma migrate dev --name add_auth_fields

# Générer le client Prisma
npx prisma generate
\`\`\`

## 🎨 Pages d'Authentification

### Page de Connexion
- Route : `/auth/login`
- Design moderne avec dégradé bleu
- Validation côté client
- Gestion des erreurs
- Toggle affichage mot de passe
- Liens vers inscription et mot de passe oublié

### Page d'Inscription
- Route : `/auth/register`
- Formulaire complet (prénom, nom, email, mot de passe)
- Confirmation du mot de passe
- Validation des champs
- Auto-connexion après inscription

### Page Mot de Passe Oublié
- Route : `/auth/forgot-password`
- Envoi d'email avec lien de réinitialisation
- Token valide 1 heure

### Page Réinitialisation
- Route : `/auth/reset-password?token=xxx`
- Nouveau mot de passe + confirmation
- Validation du token
- Redirection automatique vers login

## 👥 Panel d'Administration

### Route : `/admin/users`
**Réservé aux ADMIN uniquement**

Fonctionnalités :
- ✅ Liste de tous les utilisateurs
- ✅ Modification des rôles en temps réel
- ✅ Activation/Désactivation des comptes
- ✅ Affichage du statut de vérification email
- ✅ Suivi de la dernière connexion
- ✅ Badges de couleur par rôle
- ✅ Protection : impossible de modifier son propre compte

## 🛡️ Middleware de Protection

Le fichier `middleware.ts` protège automatiquement toutes les routes :

- ✅ Redirige les utilisateurs non authentifiés vers `/auth/login`
- ✅ Empêche les utilisateurs connectés d'accéder aux pages d'auth
- ✅ Vérifie les tokens JWT dans les cookies
- ✅ Exclut les routes publiques (API, fichiers statiques)

## 👤 Menu Utilisateur dans le Header

Le composant Header affiche maintenant :
- Avatar de l'utilisateur (initiales)
- Nom complet et rôle
- Menu déroulant avec :
  - Mon profil
  - Gestion des utilisateurs (si ADMIN)
  - Déconnexion

## 🔐 Hiérarchie des Rôles

| Rôle | Permissions |
|------|-------------|
| **ADMIN** | Accès complet + gestion utilisateurs + tous les droits |
| **MANAGER** | Gestion des données + rapports avancés + export |
| **USER** | Accès standard + création/modification de données |
| **VIEWER** | Lecture seule + consultation des rapports |

## 📝 Utilisation

### 1. Créer un compte
Aller sur `/auth/register` et remplir le formulaire

### 2. Se connecter
Aller sur `/auth/login` avec vos identifiants

### 3. Gérer les utilisateurs (ADMIN)
- Se connecter en tant qu'ADMIN
- Aller sur `/admin/users`
- Modifier les rôles ou désactiver des comptes

### 4. Mot de passe oublié
- Cliquer sur "Mot de passe oublié"
- Entrer votre email
- Suivre le lien de réinitialisation (en mode dev, affiché directement)

## 🔍 Sécurité

### Protection Côté Serveur
Tous les endpoints API vérifient :
- ✅ Présence du token JWT
- ✅ Validité du token
- ✅ Rôle de l'utilisateur
- ✅ Statut actif du compte

### Protection Côté Client
- ✅ Middleware Next.js pour les routes
- ✅ Vérification du rôle dans les composants
- ✅ Stockage sécurisé des tokens (cookies HttpOnly recommandé pour production)

## 🚧 TODO / Améliorations Futures

- [ ] Envoi réel d'emails (nodemailer configuré mais pas activé)
- [ ] Vérification d'email obligatoire
- [ ] 2FA (authentification à deux facteurs)
- [ ] Historique des connexions
- [ ] Limitation des tentatives de connexion
- [ ] Refresh tokens
- [ ] Cookies HttpOnly pour les tokens (plus sécurisé)
- [ ] Logs d'audit pour les actions admin
- [ ] Page de profil utilisateur
- [ ] Upload d'avatar

## 📦 Dépendances

\`\`\`json
{
  "bcryptjs": "^2.4.3",
  "jsonwebtoken": "^9.0.2",
  "nodemailer": "^6.9.8",
  "@types/bcryptjs": "^2.4.6",
  "@types/jsonwebtoken": "^9.0.5",
  "@types/nodemailer": "^6.4.14"
}
\`\`\`

## 🎉 Résumé

Le système d'authentification est **complet et fonctionnel** avec :
- ✅ Inscription et connexion
- ✅ Réinitialisation de mot de passe
- ✅ Gestion des rôles et permissions
- ✅ Panel d'administration
- ✅ Protection des routes
- ✅ UI moderne et responsive
- ✅ Base de données migrée

Vous pouvez maintenant créer des comptes, vous connecter et gérer les utilisateurs !
