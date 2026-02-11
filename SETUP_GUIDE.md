# Guide de Démarrage - Projet DYN

## ✅ Étapes Complétées

1. ✅ **Création du workspace Next.js**
   - Framework: Next.js 16 avec TypeScript
   - Styling: Tailwind CSS
   - Linter: ESLint

2. ✅ **Installation des dépendances**
   - `@prisma/client`: Client Prisma pour accéder à la BD
   - `prisma`: CLI Prisma pour les migrations

3. ✅ **Initialisation de Prisma**
   - Création du dossier `prisma/schema.prisma`
   - Fichier `.env.local` pour DATABASE_URL

4. ✅ **Schéma de Base de Données Défini**
   - Models: User, Client, Project, Invoice, Proposal, Task, Lead
   - Relations complètes entre les entités
   - Tous les champs pour gestion des clients (téléphones, réseaux sociaux, etc.)

5. ✅ **API Routes Créées**
   - `GET /api/clients` - Lister tous les clients
   - `POST /api/clients` - Créer un client
   - `GET /api/clients/[id]` - Récupérer un client
   - `PUT /api/clients/[id]` - Mettre à jour un client
   - `DELETE /api/clients/[id]` - Supprimer un client

6. ✅ **Client Prisma Singleton**
   - Fichier `src/lib/prisma.ts` pour réutilisation du client

## ⏳ Prochaines Étapes

### Phase 1: Connecter à PostgreSQL (URGENT)

**Vérifiez que PostgreSQL est installé et en cours d'exécution:**

```powershell
# Windows: Vérifier le service PostgreSQL
Get-Service postgresql*

# Ou démarrer PostgreSQL si nécessaire
# (Installer depuis https://www.postgresql.org/download/windows/)
```

**Créer la base de données:**
```bash
# Depuis psql ou pgAdmin
createdb dyn
```

**Mettre à jour `.env.local`:**
```
DATABASE_URL="postgresql://postgres:password@localhost:5432/dyn?schema=public"
```

**Exécuter la migration:**
```bash
npx prisma migrate dev --name init
```

### Phase 2: Créer les Pages React

Créez les pages pour:
- `/dashboard` - Tableau de bord
- `/clients` - Liste des clients
- `/clients/[id]` - Détail d'un client
- `/projects` - Gestion des projets
- `/invoices` - Gestion des factures
- `/settings` - Paramètres

### Phase 3: Construire les Composants

Créez les composants réutilisables:
- `Sidebar` - Navigation latérale
- `Header` - En-tête avec utilisateur
- `ClientForm` - Formulaire client (reprendre du HTML original)
- `ClientList` - Tableau de clients
- `DataTable` - Tableau générique
- `Modal` - Fenêtre modale
- `Button`, `Input`, `Select` - Composants de base

### Phase 4: Implémenter les Autres APIs

Créez les routes pour:
- `/api/projects` (GET, POST, PUT, DELETE)
- `/api/invoices` (GET, POST, PUT, DELETE)
- `/api/proposals` (GET, POST, PUT, DELETE)
- `/api/tasks` (GET, POST, PUT, DELETE)
- `/api/users` (GET, POST, PUT, DELETE)

### Phase 5: Authentication

Implémenter l'authentification avec NextAuth.js ou Clerk:
- Login/Signup
- Password reset
- JWT tokens
- Session management

### Phase 6: Frontend Integration

Connecter les pages React aux API:
- Fetch data depuis `/api/clients`
- Forms avec validation
- Error handling
- Loading states

### Phase 7: Déploiement

Déployer sur Vercel ou autre:
```bash
vercel deploy
```

## 📁 Structure Actuelle du Projet

```
dyn-crm/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── clients/
│   │   │       ├── route.ts          ✅ GET/POST clients
│   │   │       └── [id]/route.ts     ✅ GET/PUT/DELETE client
│   │   ├── layout.tsx                ⏳ À modifier
│   │   └── page.tsx                  ⏳ À créer
│   ├── components/
│   │   └── ui/                       ⏳ À créer
│   └── lib/
│       └── prisma.ts                 ✅ Client Prisma
├── prisma/
│   ├── schema.prisma                 ✅ Schéma complet
│   └── migrations/                   ⏳ À créer via migrate
├── .env.local                        ⏳ À configurer
└── package.json                      ✅ Dépendances installées
```

## 🚀 Commandes Utiles

```bash
# Démarrer le serveur
npm run dev

# Voir la base de données (UI Prisma)
npx prisma studio

# Créer une migration
npx prisma migrate dev --name [nom]

# Réinitialiser la BD (DANGER!)
npx prisma migrate reset

# Générer le client Prisma
npx prisma generate

# Vérifier les types TypeScript
npx tsc --noEmit
```

## 📋 Checklist pour Continuer

- [ ] PostgreSQL installé et démarré
- [ ] Base de données `dyn` créée
- [ ] `.env.local` configuré avec DATABASE_URL
- [ ] Migration Prisma exécutée: `npx prisma migrate dev --name init`
- [ ] Tester l'API: `curl http://localhost:3000/api/clients`
- [ ] Créer les pages React pour le frontend
- [ ] Implémenter les formulaires client
- [ ] Connecter le formulaire à l'API
- [ ] Ajouter l'authentification
- [ ] Déployer sur Vercel

## 💡 Notes

- Le schéma Prisma inclut déjà tous les champs du formulaire client original
- Les routes API utilisent `NextResponse` et gèrent les erreurs
- Le client Prisma est un singleton pour éviter les multiples connexions
- TypeScript est activé pour la sécurité des types
- Tailwind CSS est configuré pour le styling
