# Guide de Test - Système d'Authentification

## 🚀 Le serveur est démarré !

URL : http://localhost:3000

## 📋 Étapes de Test

### 1. Créer un compte administrateur

1. Aller sur http://localhost:3000/auth/register
2. Remplir le formulaire :
   - Prénom : Admin
   - Nom : System
   - Email : admin@dyn.com
   - Mot de passe : admin123
   - Confirmer mot de passe : admin123
3. Cliquer sur "Créer un compte"
4. Vous serez automatiquement connecté et redirigé vers `/dashboard`

### 2. Promouvoir le compte en ADMIN (via base de données)

Ouvrir un nouveau terminal PowerShell et exécuter :

\`\`\`powershell
cd "C:\Users\Suira\Downloads\dyn-crm"

# Ouvrir Prisma Studio
npx prisma studio
\`\`\`

Dans Prisma Studio (http://localhost:5555) :
1. Cliquer sur "User"
2. Trouver votre utilisateur
3. Changer le champ `role` de `USER` à `ADMIN`
4. Sauvegarder

### 3. Tester la page d'administration

1. Rafraîchir la page (F5)
2. Cliquer sur votre avatar en haut à droite
3. Vous verrez maintenant l'option "Gestion des utilisateurs"
4. Cliquer dessus pour accéder à `/admin/users`

### 4. Créer d'autres utilisateurs

1. Se déconnecter (menu utilisateur > Déconnexion)
2. Créer plusieurs comptes avec différents rôles :
   - manager@dyn.com (MANAGER)
   - user@dyn.com (USER)
   - viewer@dyn.com (VIEWER)

### 5. Gérer les utilisateurs depuis le panel admin

1. Se reconnecter avec admin@dyn.com
2. Aller sur `/admin/users`
3. Tester les fonctionnalités :
   - Changer le rôle d'un utilisateur (dropdown)
   - Activer/Désactiver un compte (bouton Actif/Inactif)
   - Voir les informations (email vérifié, dernière connexion)

### 6. Tester le mot de passe oublié

1. Se déconnecter
2. Sur la page de login, cliquer "Mot de passe oublié"
3. Entrer un email existant
4. Copier le lien de réinitialisation affiché
5. Ouvrir le lien dans un nouvel onglet
6. Entrer un nouveau mot de passe
7. Se reconnecter avec le nouveau mot de passe

### 7. Tester la protection des routes

1. Se déconnecter
2. Essayer d'accéder directement à `/admin/users`
3. Vous serez redirigé vers `/auth/login`
4. Se connecter avec un compte USER (pas ADMIN)
5. Essayer d'accéder à `/admin/users`
6. Vous verrez "Accès refusé - Administrateur requis"

## ✨ Fonctionnalités à tester

### Menu utilisateur (Header)
- [x] Avatar avec initiales
- [x] Nom et rôle affichés
- [x] Menu déroulant au clic
- [x] Lien "Mon profil"
- [x] Lien "Gestion des utilisateurs" (ADMIN uniquement)
- [x] Bouton "Déconnexion"

### Page d'inscription (/auth/register)
- [x] Tous les champs requis
- [x] Validation du mot de passe (min 6 caractères)
- [x] Vérification de correspondance des mots de passe
- [x] Toggle show/hide password
- [x] Messages d'erreur
- [x] Auto-connexion après inscription

### Page de connexion (/auth/login)
- [x] Email et mot de passe
- [x] Toggle show/hide password
- [x] Messages d'erreur
- [x] Lien mot de passe oublié
- [x] Lien inscription
- [x] Redirection vers dashboard

### Page mot de passe oublié (/auth/forgot-password)
- [x] Champ email
- [x] Génération de token
- [x] Affichage du lien (mode dev)
- [x] Message de succès

### Page réinitialisation (/auth/reset-password?token=xxx)
- [x] Nouveau mot de passe + confirmation
- [x] Validation du token
- [x] Vérification de l'expiration (1 heure)
- [x] Redirection automatique vers login

### Panel admin (/admin/users)
- [x] Liste de tous les utilisateurs
- [x] Modification des rôles (dropdown)
- [x] Activation/Désactivation de comptes
- [x] Badges de couleur par rôle
- [x] Affichage du statut de vérification email
- [x] Dernière connexion
- [x] Protection : impossible de modifier son propre compte
- [x] Réservé aux ADMIN

### API Endpoints
- [x] POST /api/auth/register
- [x] POST /api/auth/login
- [x] POST /api/auth/logout
- [x] POST /api/auth/forgot-password
- [x] POST /api/auth/reset-password
- [x] GET /api/users (ADMIN)
- [x] PATCH /api/users (ADMIN)

### Sécurité
- [x] Mots de passe hashés (bcrypt)
- [x] Tokens JWT avec cookies (7 jours)
- [x] Tokens de réinitialisation avec expiration (1 heure)
- [x] Vérification des permissions côté serveur
- [x] Middleware de protection des routes
- [x] Vérification du compte actif au login

## 🐛 Problèmes connus

1. **Erreurs TypeScript** : Le client Prisma peut avoir besoin d'une régénération après redémarrage
   - Solution : `npx prisma generate`

2. **Emails non envoyés** : L'envoi d'email n'est pas configuré
   - En mode dev, le lien de réinitialisation s'affiche directement

3. **Warnings Next.js** : Warnings sur middleware (peut être ignoré)

## 📊 Statut du Système

✅ **COMPLET ET FONCTIONNEL**

- Base de données migrée
- Tous les endpoints API créés
- Toutes les pages UI créées
- Protection des routes active
- Menu utilisateur intégré
- Panel d'administration opérationnel

Bon test ! 🎉
