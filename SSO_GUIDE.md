# Guide SSO (Single Sign-On) pour DYN CRM

## 🔐 Qu'est-ce que le SSO ?

Le Single Sign-On (SSO) permet aux utilisateurs de se connecter avec leurs comptes existants (Google, Microsoft, GitHub, etc.) au lieu de créer un nouveau mot de passe.

## ✅ Avantages du SSO

- **Sécurité accrue** : Pas de mots de passe à gérer
- **Expérience utilisateur** : Connexion en un clic
- **Authentification OAuth 2.0** : Standard de l'industrie
- **Conformité RGPD** : Délégation de l'authentification

## 🚀 Implémentation avec NextAuth.js

### Étape 1 : Installation

\`\`\`bash
npm install next-auth@beta
\`\`\`

### Étape 2 : Configuration des Providers

Créer le fichier `app/api/auth/[...nextauth]/route.ts` :

\`\`\`typescript
import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import GitHubProvider from "next-auth/providers/github"
import AzureADProvider from "next-auth/providers/azure-ad"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      tenantId: process.env.AZURE_AD_TENANT_ID!,
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        session.user.role = user.role;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/login',
  },
})

export { handlers as GET, handlers as POST }
\`\`\`

### Étape 3 : Mise à jour du schéma Prisma

Ajouter les modèles NextAuth au `schema.prisma` :

\`\`\`prisma
model Account {
  id                String  @id @default(cuid())
  userId            Int
  type              String
  provider          String
  providerAccountId String
  refresh_token     String?
  access_token      String?
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       Int
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}

model User {
  id                   Int       @id @default(autoincrement())
  email                String    @unique
  password             String?   // Optionnel pour SSO
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

  accounts Account[]
  sessions Session[]
  clients  Client[]
}
\`\`\`

### Étape 4 : Configuration des variables d'environnement

Ajouter à `.env.local` :

\`\`\`env
# NextAuth
NEXTAUTH_SECRET="your-secret-key-min-32-characters"
NEXTAUTH_URL="http://localhost:3000"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# GitHub OAuth
GITHUB_ID="your-github-client-id"
GITHUB_SECRET="your-github-client-secret"

# Microsoft Azure AD
AZURE_AD_CLIENT_ID="your-azure-client-id"
AZURE_AD_CLIENT_SECRET="your-azure-client-secret"
AZURE_AD_TENANT_ID="your-azure-tenant-id"
\`\`\`

### Étape 5 : Mise à jour de la page de connexion

Modifier `app/auth/login/page.tsx` :

\`\`\`tsx
'use client';

import { signIn } from 'next-auth/react';

export default function LoginPage() {
  return (
    <div>
      {/* Connexion classique */}
      <form onSubmit={handleEmailLogin}>
        {/* ... formulaire existant ... */}
      </form>

      {/* Séparateur */}
      <div className="my-6 flex items-center gap-4">
        <div className="flex-1 border-t border-slate-300"></div>
        <span className="text-sm text-slate-500">OU</span>
        <div className="flex-1 border-t border-slate-300"></div>
      </div>

      {/* Boutons SSO */}
      <div className="space-y-3">
        <button
          onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
          className="w-full flex items-center justify-center gap-3 py-3 border border-slate-300 rounded-lg hover:bg-slate-50 transition"
        >
          <img src="/google-icon.svg" alt="Google" className="w-5 h-5" />
          <span className="font-medium text-slate-700">Continuer avec Google</span>
        </button>

        <button
          onClick={() => signIn('github', { callbackUrl: '/dashboard' })}
          className="w-full flex items-center justify-center gap-3 py-3 border border-slate-300 rounded-lg hover:bg-slate-50 transition"
        >
          <img src="/github-icon.svg" alt="GitHub" className="w-5 h-5" />
          <span className="font-medium text-slate-700">Continuer avec GitHub</span>
        </button>

        <button
          onClick={() => signIn('azure-ad', { callbackUrl: '/dashboard' })}
          className="w-full flex items-center justify-center gap-3 py-3 border border-slate-300 rounded-lg hover:bg-slate-50 transition"
        >
          <img src="/microsoft-icon.svg" alt="Microsoft" className="w-5 h-5" />
          <span className="font-medium text-slate-700">Continuer avec Microsoft</span>
        </button>
      </div>
    </div>
  );
}
\`\`\`

## 📝 Configuration des Providers

### Google OAuth

1. Aller sur [Google Cloud Console](https://console.cloud.google.com/)
2. Créer un nouveau projet
3. Activer "Google+ API"
4. Créer des identifiants OAuth 2.0
5. Ajouter les URI de redirection :
   - `http://localhost:3000/api/auth/callback/google`
   - `https://votre-domaine.com/api/auth/callback/google`

### GitHub OAuth

1. Aller sur [GitHub Settings > Developer settings](https://github.com/settings/developers)
2. Cliquer "New OAuth App"
3. Remplir :
   - Application name: DYN CRM
   - Homepage URL: `http://localhost:3000`
   - Authorization callback URL: `http://localhost:3000/api/auth/callback/github`

### Microsoft Azure AD

1. Aller sur [Azure Portal](https://portal.azure.com/)
2. App registrations > New registration
3. Configurer :
   - Name: DYN CRM
   - Supported account types: Multitenant
   - Redirect URI: `http://localhost:3000/api/auth/callback/azure-ad`
4. Créer un client secret dans "Certificates & secrets"

## 🔧 Migration de la base de données

Après avoir modifié le schéma Prisma :

\`\`\`bash
npx prisma migrate dev --name add_sso_support
npx prisma generate
\`\`\`

## 🎨 Middleware pour la protection des routes

Le middleware NextAuth remplace le middleware actuel :

\`\`\`typescript
export { auth as middleware } from "@/app/api/auth/[...nextauth]/route"

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
\`\`\`

## ✨ Fonctionnalités supplémentaires

### Auto-création de compte

Lors de la première connexion SSO, créer automatiquement l'utilisateur :

\`\`\`typescript
callbacks: {
  async signIn({ user, account, profile }) {
    if (account?.provider === 'google' || account?.provider === 'github') {
      const existingUser = await prisma.user.findUnique({
        where: { email: user.email! }
      });

      if (!existingUser) {
        await prisma.user.create({
          data: {
            email: user.email!,
            firstName: profile?.given_name || user.name?.split(' ')[0] || '',
            lastName: profile?.family_name || user.name?.split(' ')[1] || '',
            emailVerified: true,
            role: 'USER',
          }
        });
      }
    }
    return true;
  }
}
\`\`\`

### Gestion hybride (Email + SSO)

Les utilisateurs peuvent :
- Se connecter avec email/mot de passe
- OU se connecter avec SSO
- Lier plusieurs comptes SSO au même profil

## 🚀 Déploiement en Production

1. **Mettre à jour les URLs de redirection** dans chaque provider
2. **Sécuriser NEXTAUTH_SECRET** avec une clé aléatoire forte :
   \`\`\`bash
   openssl rand -base64 32
   \`\`\`
3. **Configurer les domaines autorisés** pour chaque provider

## 📊 Tableau comparatif

| Feature | Actuel (JWT) | Avec SSO (NextAuth) |
|---------|-------------|---------------------|
| Mots de passe | ✅ Gérés en interne | ✅ Optionnels |
| Google Login | ❌ | ✅ |
| GitHub Login | ❌ | ✅ |
| Microsoft Login | ❌ | ✅ |
| Sessions | Cookie JWT | Database sessions |
| Sécurité | Bcrypt | OAuth 2.0 |
| Complexité | Faible | Moyenne |

## 🎯 Recommandation

Pour DYN CRM, je recommande :

1. **Court terme** : Garder le système actuel avec validation robuste
2. **Moyen terme** : Ajouter SSO Google pour les clients
3. **Long terme** : Ajouter Microsoft Azure AD pour les entreprises

## 📦 Packages nécessaires

\`\`\`json
{
  "dependencies": {
    "next-auth": "^5.0.0-beta",
    "@auth/prisma-adapter": "^2.0.0"
  }
}
\`\`\`

## ⚠️ Notes importantes

- NextAuth v5 est en beta mais stable
- Compatible avec Next.js 14+
- Nécessite une migration de base de données
- Les sessions sont stockées en DB (pas de JWT uniquement)
- Peut coexister avec le système actuel

Voulez-vous que j'implémente le SSO maintenant ou préférez-vous d'abord tester le système actuel avec la validation robuste du mot de passe ?
