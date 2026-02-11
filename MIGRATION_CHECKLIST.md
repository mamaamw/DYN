# Checklist de Migration: Duralux → DYN Next.js

## 📊 État Actuel du Projet

### ✅ Infrastructure Backend Complète
- [x] Next.js 16 avec TypeScript + App Router
- [x] PostgreSQL + Prisma ORM
- [x] Client Prisma singleton en `src/lib/prisma.ts`
- [x] Schéma Prisma avec 7 models (User, Client, Project, Invoice, Proposal, Task, Lead)
- [x] API Routes complètes pour clients:
  - [x] GET /api/clients
  - [x] POST /api/clients
  - [x] GET/PUT/DELETE /api/clients/[id]
- [x] Tailwind CSS configuré
- [x] ESLint configuré
- [x] Variables d'environnement préparées

### ✅ Composants UI de Base Créés
- [x] Button.tsx (variants: primary, secondary, danger)
- [x] Input.tsx (avec labels, erreurs, helper text)
- [x] Card.tsx (Card, CardHeader, CardTitle, CardContent)
- [x] Index barrel export pour réutilisation facile

### ⏳ À Faire: Connexion à la Base de Données

**PRIORITÉ 1: Configurer PostgreSQL**

1. [ ] Vérifier que PostgreSQL est installé et démarré
   ```powershell
   Get-Service postgresql*
   ```

2. [ ] Créer la base de données `dyn`
   ```bash
   # Via psql
   createdb dyn
   
   # Ou via pgAdmin
   ```

3. [ ] Configurer `.env.local`
   ```
   DATABASE_URL="postgresql://postgres:password@localhost:5432/dyn?schema=public"
   ```

4. [ ] Exécuter la migration Prisma
   ```bash
   cd C:\Users\Suira\Downloads\dyn-crm
   npx prisma migrate dev --name init
   ```

5. [ ] Vérifier que les tables sont créées
   ```bash
   npx prisma studio
   ```

---

## 📱 Créer les Pages Frontend

### Phase 1: Pages de Base

**À créer dans `src/app/`:**

- [ ] `src/app/dashboard/page.tsx` - Tableau de bord
  - Afficher les statistiques (nb clients, projets, factures)
  - Afficher les factures récentes
  - Afficher les projets en cours

- [ ] `src/app/clients/page.tsx` - Liste des clients
  - Afficher un tableau avec tous les clients
  - Bouton "Ajouter un client"
  - Lien pour voir les détails

- [ ] `src/app/clients/[id]/page.tsx` - Détail du client
  - Formulaire de modification
  - Projets associés
  - Factures associées
  - Bouton supprimer

- [ ] `src/app/clients/new/page.tsx` - Créer un client
  - Formulaire avec tous les champs
  - Validation côté client
  - Appel à l'API `/api/clients`

- [ ] `src/app/projects/page.tsx` - Liste des projets
- [ ] `src/app/invoices/page.tsx` - Liste des factures
- [ ] `src/app/layout.tsx` - Layout avec Sidebar et Header

### Phase 2: Formulaires

**À créer dans `src/components/forms/`:**

- [ ] `ClientForm.tsx` - Formulaire réutilisable pour ajouter/éditer client
- [ ] `ProjectForm.tsx` - Formulaire pour projets
- [ ] `InvoiceForm.tsx` - Formulaire pour factures

### Phase 3: Composants de Layout

**À créer dans `src/components/layout/`:**

- [ ] `Sidebar.tsx` - Navigation avec menu
- [ ] `Header.tsx` - En-tête avec user info
- [ ] `RootLayout.tsx` - Layout principal avec Sidebar + Header + Content

---

## 📡 API Routes Manquantes

**À créer:**

```
src/app/api/
├── clients/         ✅ COMPLÈTE
├── projects/        ⏳ À créer
│   ├── route.ts     (GET /api/projects, POST /api/projects)
│   └── [id]/route.ts (GET/PUT/DELETE)
├── invoices/        ⏳ À créer
│   ├── route.ts
│   └── [id]/route.ts
├── proposals/       ⏳ À créer
├── tasks/           ⏳ À créer
├── users/           ⏳ À créer
└── leads/           ⏳ À créer
```

Template pour chaque API:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/[resource]
export async function GET(request: NextRequest) {
  try {
    const items = await prisma.[model].findMany()
    return NextResponse.json(items)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch items' },
      { status: 500 }
    )
  }
}

// POST /api/[resource]
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const item = await prisma.[model].create({ data: body })
    return NextResponse.json(item, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create item' },
      { status: 500 }
    )
  }
}
```

---

## 🔐 Authentification (Plus tard)

- [ ] Installer NextAuth.js: `npm install next-auth`
- [ ] Créer `/api/auth/[...nextauth]/route.ts`
- [ ] Ajouter JWT ou session
- [ ] Protéger les routes avec middleware

---

## 📋 Contenu du Formulaire Client (Du fichier HTML original)

Le formulaire client doit inclure:

**Informations Personnelles:**
- [x] Prénom (firstName)
- [x] Nom (lastName)
- [x] Surnom (nickname) - OPTIONNEL
- [x] Email

**Contact:**
- [x] Téléphone 1 (phone1)
- [x] Téléphone 2 (phone2) - OPTIONNEL
- [x] Adresse
- [x] Ville
- [x] Code postal
- [x] Pays

**Web & Réseaux:**
- [x] Website
- [x] Instagram
- [x] Facebook
- [x] Twitter
- [x] LinkedIn
- [x] TikTok

**Entreprise:**
- [x] Entreprise (company)
- [x] Secteur (industry)
- [x] Notes (notes)
- [x] Status (active/inactive/prospect)

**Tous ces champs sont déjà dans le schéma Prisma!**

---

## 🚀 Dépendances Actuelles

```json
{
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "next": "^16.1.4",
    "@prisma/client": "^6.4.3"
  },
  "devDependencies": {
    "typescript": "^5",
    "tailwindcss": "^4.0.0",
    "postcss": "^8",
    "autoprefixer": "^10",
    "@types/node": "^20",
    "@types/react": "^19",
    "eslint": "^9",
    "prisma": "^6.4.3"
  }
}
```

---

## 📚 Ressources Fichiers

**À consulter:**
- `SETUP_GUIDE.md` - Guide complet de démarrage
- `.env.example` - Variables d'environnement
- `prisma/schema.prisma` - Schéma de base de données
- `src/lib/prisma.ts` - Client Prisma
- `src/api/clients/` - Exemple d'API route

---

## ⚡ Prochaine Étape Immédiate

1. **Configurer PostgreSQL et lancer la migration:**
   ```bash
   cd C:\Users\Suira\Downloads\dyn-crm
   npx prisma migrate dev --name init
   ```

2. **Tester l'API clients:**
   ```bash
   npm run dev
   # Ouvrir http://localhost:3000/api/clients dans le navigateur
   ```

3. **Créer la page `/clients`:**
   - Récupérer les clients via `fetch('/api/clients')`
   - Afficher dans un tableau
   - Ajouter un bouton "Nouveau client"

---

## 📞 Besoin d'Aide?

- [Docs Next.js](https://nextjs.org/docs)
- [Docs Prisma](https://www.prisma.io/docs)
- [Docs Tailwind](https://tailwindcss.com/docs)
- [Types Prisma](https://www.prisma.io/docs/reference/api-reference)
