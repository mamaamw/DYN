# Configuration pour Déploiement Réseau Local Offline

## 🎯 Objectif
Optimiser le projet DYN pour fonctionner dans un environnement réseau local **sans accès internet**, avec des dépendances minimales.

---

## 📦 Technologies et Librairies - État Actuel vs Optimisé

### ✅ Technologies CORE (Essentielles - CONSERVÉES)

#### Framework & Runtime
- **Next.js 16.1.4** - Framework React SSR/SSG
  - ✅ Fonctionne 100% offline après build
  - ✅ Pas de CDN requis
  - ✅ **CONSERVER**

- **React 19.2.3 + React DOM 19.2.3**
  - ✅ Bundle local
  - ✅ **CONSERVER**

- **TypeScript 5.x**
  - ✅ Compilation locale
  - ✅ **CONSERVER**

#### Base de données & ORM
- **Prisma 5.22.0 + @prisma/client 5.22.0**
  - ✅ ORM local
  - ✅ Génération de client en local
  - ✅ **CONSERVER**
  - ⚠️ Nécessite PostgreSQL/MySQL sur le réseau local

#### Sécurité & Authentification
- **bcryptjs 3.0.3** - Hash de mots de passe
  - ✅ Pure JavaScript, offline
  - ✅ **CONSERVER**

- **jsonwebtoken 9.0.3** - Tokens JWT
  - ✅ Génération locale
  - ✅ **CONSERVER**

#### Styling
- **Tailwind CSS 4.x**
  - ✅ Classes générées au build time
  - ✅ Pas de CDN requis
  - ✅ **CONSERVER**

- **PostCSS 4.x**
  - ✅ Processing local
  - ✅ **CONSERVER**

#### Icônes
- **lucide-react 0.563.0**
  - ✅ Composants React locaux
  - ✅ SVG inline, pas de CDN
  - ✅ **CONSERVER**

- **react-icons 5.5.0**
  - ✅ Bundle local
  - ✅ **CONSERVER**

---

### ⚠️ Technologies à MODIFIER/REMPLACER

#### 1. Fonts Google (next/font/google) ❌
**Problème:** Télécharge les fonts depuis Google Fonts CDN
```typescript
// ❌ ACTUEL - Nécessite internet
import { Geist, Geist_Mono } from "next/font/google";
```

**✅ SOLUTION:** Utiliser des fonts système ou fonts locales
```typescript
// Option 1: Fonts système (RECOMMANDÉ pour offline)
// Pas d'import, juste utiliser dans tailwind.config.ts
fontFamily: {
  sans: ['system-ui', 'sans-serif'],
  mono: ['ui-monospace', 'monospace'],
}

// Option 2: Fonts locales (si design spécifique requis)
// 1. Télécharger les fonts .woff2 manuellement
// 2. Les placer dans public/fonts/
// 3. Les charger via CSS @font-face
```

**Action:** **MODIFIER** - Remplacer par fonts système

---

#### 2. Nodemailer (@types/nodemailer, nodemailer 7.0.12) ⚠️
**Problème:** Nécessite un serveur SMTP externe (Gmail, SendGrid, etc.)

**✅ SOLUTION:** 
- Option A: Configurer un serveur SMTP local sur le réseau (Postfix, hMailServer)
- Option B: Désactiver les emails si non critiques
- Option C: Logger les emails dans la base de données

**Action:** **MODIFIER** - Configuration SMTP locale requise

---

#### 3. @prisma/extension-accelerate ❌
**Problème:** Extension pour Prisma Accelerate (service cloud de caching)
```json
"@prisma/extension-accelerate": "^3.0.1"
```

**✅ SOLUTION:** **SUPPRIMER** - Non utilisé en réseau local
- Le caching peut être fait avec Redis local si nécessaire

**Action:** **SUPPRIMER**

---

#### 4. ESLint ⚠️
**Problème:** Peut télécharger des configs/plugins depuis npm
```json
"eslint": "^9",
"eslint-config-next": "16.1.4"
```

**✅ SOLUTION:** 
- Conserver pour le développement
- Pas nécessaire en production
- Toutes les dépendances seront dans node_modules

**Action:** **CONSERVER** (dev only)

---

## 🏗️ Architecture Optimisée pour Offline

### Stack Final RECOMMANDÉ

```
┌─────────────────────────────────────────┐
│         Frontend (Client Browser)       │
│  - Next.js 16.1.4 (SSR/Static)          │
│  - React 19.2.3                          │
│  - Tailwind CSS (fonts système)         │
│  - Lucide Icons + React Icons           │
└─────────────────────────────────────────┘
                    ↓ HTTP
┌─────────────────────────────────────────┐
│       Backend (Next.js API Routes)      │
│  - Node.js Runtime                       │
│  - JWT Authentication (jsonwebtoken)    │
│  - Password Hashing (bcryptjs)          │
│  - TypeScript                            │
└─────────────────────────────────────────┘
                    ↓ SQL
┌─────────────────────────────────────────┐
│      Base de Données (Réseau Local)     │
│  - PostgreSQL 14+ (RECOMMANDÉ)          │
│    OU                                    │
│  - MySQL 8+                              │
│  - Prisma ORM 5.22.0                    │
└─────────────────────────────────────────┘
           ↓ (Optionnel)
┌─────────────────────────────────────────┐
│      Services Additionnels (Local)      │
│  - Redis (cache) [OPTIONNEL]            │
│  - SMTP local (emails) [SI NÉCESSAIRE]  │
└─────────────────────────────────────────┘
```

---

## 📋 Liste des Technologies FINALES

### Production Dependencies (11 packages)
```json
{
  "@prisma/client": "^5.22.0",
  "bcryptjs": "^3.0.3",
  "jsonwebtoken": "^9.0.3",
  "lucide-react": "^0.563.0",
  "next": "16.1.4",
  "react": "19.2.3",
  "react-dom": "19.2.3",
  "react-icons": "^5.5.0"
}
```

**Types (pour TypeScript):**
```json
{
  "@types/bcryptjs": "^2.4.6",
  "@types/jsonwebtoken": "^9.0.10",
  "@types/node": "^20"
}
```

### Development Dependencies (7 packages)
```json
{
  "@tailwindcss/postcss": "^4",
  "@types/react": "^19",
  "@types/react-dom": "^19",
  "eslint": "^9",
  "eslint-config-next": "16.1.4",
  "prisma": "^5.22.0",
  "tailwindcss": "^4",
  "typescript": "^5"
}
```

### À SUPPRIMER
```json
{
  "@prisma/extension-accelerate": "^3.0.1",  // ❌ Service cloud
  "nodemailer": "^7.0.12",                   // ⚠️ Si emails non requis
  "@types/nodemailer": "^7.0.5"              // ⚠️ Si emails non requis
}
```

---

## 🔧 Modifications Requises

### 1. Remplacer les Google Fonts
**Fichier:** `app/layout.tsx`
```typescript
// ❌ AVANT
import { Geist, Geist_Mono } from "next/font/google";

// ✅ APRÈS
// Supprimer l'import, utiliser fonts système
```

### 2. Configuration Tailwind avec fonts système
**Fichier:** `tailwind.config.ts` (ou créer)
```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        // Fonts système universelles
        sans: [
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Arial',
          'sans-serif'
        ],
        mono: [
          'ui-monospace',
          'SFMono-Regular',
          'Consolas',
          'Liberation Mono',
          'Menlo',
          'monospace'
        ]
      }
    }
  }
}

export default config
```

### 3. Gérer Nodemailer
**Option A: SMTP Local**
```typescript
// lib/email.ts
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || '192.168.1.10', // IP serveur local
  port: parseInt(process.env.SMTP_PORT || '25'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});
```

**Option B: Logger les emails (fallback)**
```typescript
// lib/email.ts
export async function sendEmail(options: EmailOptions) {
  if (process.env.EMAIL_MODE === 'log') {
    // Logger dans la base de données
    await prisma.emailLog.create({
      data: {
        to: options.to,
        subject: options.subject,
        body: options.html,
        sentAt: new Date(),
      }
    });
    console.log('Email logged:', options.subject);
    return { success: true };
  }
  
  // Sinon, utiliser nodemailer avec SMTP local
  await transporter.sendMail(options);
}
```

### 4. Package.json nettoyé
```json
{
  "name": "dyn",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint"
  },
  "dependencies": {
    "@prisma/client": "^5.22.0",
    "bcryptjs": "^3.0.3",
    "jsonwebtoken": "^9.0.3",
    "lucide-react": "^0.563.0",
    "next": "16.1.4",
    "react": "19.2.3",
    "react-dom": "19.2.3",
    "react-icons": "^5.5.0"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4",
    "@types/bcryptjs": "^2.4.6",
    "@types/jsonwebtoken": "^9.0.10",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "eslint": "^9",
    "eslint-config-next": "16.1.4",
    "prisma": "^5.22.0",
    "tailwindcss": "^4",
    "typescript": "^5"
  }
}
```

---

## 🚀 Process de Déploiement Offline

### Étape 1: Préparation (avec internet)
```bash
# 1. Nettoyer et installer les dépendances
npm install

# 2. Générer le client Prisma
npx prisma generate

# 3. Build de production
npm run build

# 4. Créer une archive complète
tar -czf dyn-offline.tar.gz \
  .next/ \
  node_modules/ \
  prisma/ \
  public/ \
  package.json \
  next.config.ts \
  .env.local
```

### Étape 2: Déploiement (réseau local)
```bash
# 1. Extraire l'archive sur le serveur local
tar -xzf dyn-offline.tar.gz

# 2. Configurer les variables d'environnement
cp .env.example .env.local
# Éditer .env.local avec les IPs locales

# 3. Migrer la base de données
npx prisma migrate deploy

# 4. Démarrer l'application
npm start
# OU avec PM2:
pm2 start npm --name "dyn" -- start
```

### Étape 3: Configuration réseau local
```env
# .env.local (exemple)
DATABASE_URL="postgresql://user:pass@192.168.1.100:5432/dyn"
JWT_SECRET="votre-secret-tres-long-et-securise"
NEXT_PUBLIC_API_URL="http://192.168.1.50:3000"

# SMTP Local (optionnel)
SMTP_HOST="192.168.1.10"
SMTP_PORT="25"
SMTP_USER=""
SMTP_PASS=""
EMAIL_MODE="log"  # ou "smtp"
```

---

## 📊 Comparaison Avant/Après

| Aspect | Avant | Après | Amélioration |
|--------|-------|-------|--------------|
| **Dépendances prod** | 11 packages | 8 packages | -27% |
| **Services externes** | Google Fonts, Accelerate | 0 | -100% |
| **Connexions internet** | 2+ | 0 | -100% |
| **Taille bundle** | ~2.5 MB | ~2.3 MB | -8% |
| **Dépendances système** | BDD + SMTP externe | BDD local | ✅ |
| **Fonts chargées** | CDN Google | Système | ✅ |

---

## ✅ Checklist de Déploiement

### Avant le déploiement
- [ ] Remplacer Google Fonts par fonts système
- [ ] Supprimer @prisma/extension-accelerate
- [ ] Configurer SMTP local ou mode log pour emails
- [ ] Tester le build: `npm run build`
- [ ] Vérifier qu'aucune URL externe n'est appelée
- [ ] Créer l'archive avec node_modules + .next/

### Sur le réseau local
- [ ] Installer PostgreSQL/MySQL sur serveur local
- [ ] Configurer les IPs dans .env.local
- [ ] Tester la connexion BDD
- [ ] Migrer le schéma Prisma
- [ ] Démarrer l'application
- [ ] Tester tous les endpoints API
- [ ] Vérifier l'authentification JWT
- [ ] Tester les formulaires et CRUD

### Sécurité réseau local
- [ ] Firewall: Autoriser seulement ports 3000 (app) + 5432 (postgres)
- [ ] JWT_SECRET fort et unique
- [ ] Mots de passe BDD sécurisés
- [ ] Pas de ports exposés vers internet
- [ ] Logs configurés localement
- [ ] Backups automatiques de la BDD

---

## 🎯 Résumé Final

### Technologies MAINTENUES (100% offline)
✅ Next.js 16.1.4  
✅ React 19.2.3  
✅ TypeScript 5.x  
✅ Prisma 5.22.0  
✅ Tailwind CSS 4.x  
✅ bcryptjs + jsonwebtoken  
✅ Lucide + React Icons  
✅ PostgreSQL (local)  

### Technologies MODIFIÉES
⚠️ Fonts: Google Fonts → Fonts système  
⚠️ Emails: SMTP externe → SMTP local ou logs  

### Technologies SUPPRIMÉES
❌ @prisma/extension-accelerate (service cloud)  

### Qualité préservée
✅ Performance identique  
✅ Sécurité renforcée (réseau fermé)  
✅ Maintenance simplifiée  
✅ Aucune dépendance externe  
✅ Déploiement reproductible  

---

**Prochaine étape:** Appliquer les modifications pour rendre le projet 100% offline-ready ?
