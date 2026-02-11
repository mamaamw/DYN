# Guide d'intégration Keycloak SSO

## Vue d'ensemble

L'application DYN supporte maintenant l'authentification SSO (Single Sign-On) via Keycloak en tant qu'option complémentaire au système d'authentification traditionnel par username/password.

## Fonctionnalités

- ✅ Authentification SSO via Keycloak
- ✅ Authentification traditionnelle (username/password)
- ✅ Mapping automatique des rôles Keycloak → DYN
- ✅ Création automatique des utilisateurs lors de la première connexion SSO
- ✅ Synchronisation du champ `keycloakId` pour lier les comptes
- ✅ Interface de connexion adaptative (affiche le bouton SSO si activé)

## Prérequis

1. **Instance Keycloak** en production ou développement
2. **Realm configuré** dans Keycloak
3. **Client créé** dans le realm avec les paramètres suivants:
   - Access Type: `confidential` ou `public`
   - Valid Redirect URIs: `https://votre-domaine.com/*` et `http://localhost:3000/*` (dev)
   - Web Origins: `https://votre-domaine.com` et `http://localhost:3000` (dev)

## Configuration

### 1. Variables d'environnement

Copiez `.env.keycloak.example` vers votre fichier `.env` et décommentez les variables:

```bash
# Keycloak SSO Configuration
NEXT_PUBLIC_KEYCLOAK_ENABLED=true
NEXT_PUBLIC_KEYCLOAK_URL=https://votre-keycloak.com
NEXT_PUBLIC_KEYCLOAK_REALM=votre-realm
NEXT_PUBLIC_KEYCLOAK_CLIENT_ID=votre-client-id
```

**Variables détaillées:**
- `NEXT_PUBLIC_KEYCLOAK_ENABLED`: Active/désactive l'option SSO (`true` ou `false`)
- `NEXT_PUBLIC_KEYCLOAK_URL`: URL de base de votre instance Keycloak (ex: `https://auth.example.com`)
- `NEXT_PUBLIC_KEYCLOAK_REALM`: Nom du realm Keycloak
- `NEXT_PUBLIC_KEYCLOAK_CLIENT_ID`: ID du client configuré dans Keycloak

**Note:** Les variables utilisent le préfixe `NEXT_PUBLIC_` car elles sont nécessaires côté client.

### 2. Migration de la base de données

Le champ `keycloakId` a été ajouté au modèle `User`. Si ce n'est pas déjà fait:

```bash
npx prisma generate
npx prisma db push
```

**⚠️ Si vous obtenez une erreur EPERM:** Arrêtez le serveur Next.js (`Ctrl+C`) et relancez les commandes.

### 3. Configuration Keycloak

Dans votre console Keycloak:

#### a) Créer un client
1. Allez dans `Clients` → `Create client`
2. **Client ID**: `dyn-app` (ou le nom de votre choix)
3. **Client Protocol**: `openid-connect`
4. **Access Type**: `confidential` ou `public`

#### b) Configurer les redirections
1. **Valid Redirect URIs**: 
   - Production: `https://votre-domaine.com/*`
   - Dev: `http://localhost:3000/*`
2. **Web Origins**:
   - Production: `https://votre-domaine.com`
   - Dev: `http://localhost:3000`

#### c) Configurer les rôles (optionnel)
Pour mapper les rôles Keycloak aux rôles DYN:
1. Créez un rôle `admin` ou `administrator` dans le realm
2. Assignez ce rôle aux utilisateurs qui doivent être administrateurs
3. Les utilisateurs sans ces rôles seront créés avec le rôle `USER` par défaut

## Mapping des rôles

Le système mappe automatiquement les rôles Keycloak:

| Rôle Keycloak        | Rôle DYN |
|---------------------|----------|
| `admin`             | `ADMIN`  |
| `administrator`     | `ADMIN`  |
| Autres/Aucun        | `USER`   |

## Architecture

### Backend

**API Endpoint:** `app/api/auth/keycloak/route.ts`
- Reçoit les tokens Keycloak (accessToken, idToken)
- Décode le token pour extraire les informations utilisateur
- Cherche l'utilisateur par `keycloakId` ou crée un nouveau compte
- Mappe les rôles Keycloak → DYN
- Émet un cookie JWT comme l'authentification traditionnelle

**Configuration:** `lib/keycloak-config.ts`
- Fonctions: `getKeycloakConfig()`, `isKeycloakEnabled()`
- Valide la présence des variables d'environnement

### Frontend

**Hook:** `lib/useKeycloak.tsx`
- Initialise Keycloak avec `check-sso`
- Gère l'état d'authentification
- Fournit les fonctions `login()`, `logout()`, `authenticateWithBackend()`

**Page de login:** `app/auth/login/page.tsx`
- Affiche le bouton "Se connecter avec Keycloak" si `KEYCLOAK_ENABLED=true`
- Séparateur "OU" entre authentification traditionnelle et SSO
- Authentification automatique au backend après connexion Keycloak

**Fichier silencieux:** `public/silent-check-sso.html`
- Nécessaire pour la vérification silencieuse du SSO

## Flux d'authentification

### Connexion Keycloak

```mermaid
graph TD
    A[Utilisateur clique "Se connecter avec Keycloak"] --> B[Redirection vers Keycloak]
    B --> C[Utilisateur s'authentifie]
    C --> D[Keycloak retourne avec tokens]
    D --> E[Frontend appelle /api/auth/keycloak]
    E --> F{Utilisateur existe?}
    F -->|Oui| G[Mise à jour lastLogin]
    F -->|Non| H[Création utilisateur avec keycloakId]
    G --> I[Mapping rôles Keycloak → DYN]
    H --> I
    I --> J[Émission JWT cookie]
    J --> K[Redirection vers /dashboard]
```

### Déconnexion Keycloak

```mermaid
graph TD
    A[Utilisateur clique "Déconnexion"] --> B{Utilisateur Keycloak?}
    B -->|Oui| C[Appel keycloak.logout]
    B -->|Non| D[Appel /api/auth/logout standard]
    C --> E[Suppression session Keycloak]
    D --> F[Suppression cookie JWT]
    E --> F
    F --> G[Redirection vers /]
```

## Utilisation

### Activer Keycloak

Dans votre `.env`:
```bash
NEXT_PUBLIC_KEYCLOAK_ENABLED=true
NEXT_PUBLIC_KEYCLOAK_URL=https://auth.example.com
NEXT_PUBLIC_KEYCLOAK_REALM=production
NEXT_PUBLIC_KEYCLOAK_CLIENT_ID=dyn-app
```

Redémarrez le serveur:
```bash
npm run dev
# ou en production
npm run build && npm start
```

Le bouton "Se connecter avec Keycloak" apparaîtra sur la page de connexion.

### Désactiver Keycloak

Dans votre `.env`:
```bash
NEXT_PUBLIC_KEYCLOAK_ENABLED=false
```

Le système reviendra uniquement à l'authentification traditionnelle.

## Sécurité

### ⚠️ Important pour la production

L'implémentation actuelle décode les tokens Keycloak sans vérification complète. Pour la production, ajoutez la vérification de signature:

```typescript
// Dans app/api/auth/keycloak/route.ts
import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';

const client = jwksClient({
  jwksUri: `${process.env.NEXT_PUBLIC_KEYCLOAK_URL}/realms/${process.env.NEXT_PUBLIC_KEYCLOAK_REALM}/protocol/openid-connect/certs`
});

function getKey(header: any, callback: any) {
  client.getSigningKey(header.kid, (err, key) => {
    const signingKey = key?.getPublicKey();
    callback(null, signingKey);
  });
}

const decoded = await new Promise((resolve, reject) => {
  jwt.verify(accessToken, getKey, { algorithms: ['RS256'] }, (err, decoded) => {
    if (err) reject(err);
    else resolve(decoded);
  });
});
```

Installez les dépendances:
```bash
npm install jsonwebtoken jwks-rsa
npm install --save-dev @types/jsonwebtoken
```

### Bonnes pratiques

1. **HTTPS obligatoire en production** pour toutes les communications
2. **Validation des tokens** avec la clé publique Keycloak
3. **Rotation des secrets** du client Keycloak régulièrement
4. **Limitation des redirections** aux domaines autorisés uniquement
5. **Logs d'audit** pour les connexions Keycloak

## Dépannage

### Le bouton Keycloak n'apparaît pas
- Vérifiez que `NEXT_PUBLIC_KEYCLOAK_ENABLED=true`
- Vérifiez que toutes les variables `NEXT_PUBLIC_KEYCLOAK_*` sont définies
- Redémarrez le serveur Next.js

### Erreur "Keycloak initialization failed"
- Vérifiez l'URL Keycloak (accessible depuis le navigateur?)
- Vérifiez le nom du realm (sensible à la casse)
- Consultez la console navigateur pour les détails

### Erreur "Backend authentication failed"
- Vérifiez les logs serveur dans le terminal Next.js
- Vérifiez que le champ `keycloakId` existe dans la table `User`
- Vérifiez que l'API `/api/auth/keycloak` est accessible

### Erreur EPERM lors de `npx prisma generate`
- Arrêtez le serveur Next.js avec `Ctrl+C`
- Relancez `npx prisma generate`
- Relancez le serveur avec `npm run dev`

### L'utilisateur est créé mais avec le rôle USER au lieu d'ADMIN
- Vérifiez que le rôle `admin` ou `administrator` existe dans Keycloak
- Vérifiez que le rôle est assigné à l'utilisateur
- Vérifiez les logs backend pour voir les rôles détectés

## Test en développement

1. **Démarrer Keycloak local** (si applicable):
```bash
docker run -p 8080:8080 -e KEYCLOAK_ADMIN=admin -e KEYCLOAK_ADMIN_PASSWORD=admin quay.io/keycloak/keycloak:latest start-dev
```

2. **Configurer `.env`**:
```bash
NEXT_PUBLIC_KEYCLOAK_ENABLED=true
NEXT_PUBLIC_KEYCLOAK_URL=http://localhost:8080
NEXT_PUBLIC_KEYCLOAK_REALM=master
NEXT_PUBLIC_KEYCLOAK_CLIENT_ID=dyn-local
```

3. **Créer le client dans Keycloak**:
- Allez sur http://localhost:8080
- Connectez-vous (admin/admin)
- Créez un client avec les redirections vers `http://localhost:3000/*`

4. **Tester la connexion**:
- Allez sur http://localhost:3000/auth/login
- Cliquez sur "Se connecter avec Keycloak"
- Authentifiez-vous avec vos credentials Keycloak

## Support

Pour des questions spécifiques à votre instance Keycloak, consultez:
- [Documentation Keycloak](https://www.keycloak.org/documentation)
- [Keycloak JavaScript Adapter](https://www.keycloak.org/docs/latest/securing_apps/#_javascript_adapter)
