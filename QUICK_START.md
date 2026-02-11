# 🚀 Quick Start - DYN

## Démarrage Rapide en 5 Étapes

### Étape 1: Configurer PostgreSQL (⚠️ CRITIQUE)

```powershell
# Vérifier que PostgreSQL est en cours d'exécution
Get-Service postgresql*

# Si non installé, télécharger depuis:
# https://www.postgresql.org/download/windows/

# Créer la base de données (dans psql ou pgAdmin)
createdb dyn

# Ou via PowerShell (si psql est dans le PATH):
psql -U postgres -c "CREATE DATABASE dyn;"
```

### Étape 2: Configurer les Variables d'Environnement

```powershell
# Copier .env.example en .env.local
Copy-Item .env.example .env.local

# Éditer .env.local avec vos paramètres PostgreSQL
# Exemple:
# DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/dyn?schema=public"
```

### Étape 3: Exécuter les Migrations

```bash
cd C:\Users\Suira\Downloads\dyn-crm

# Créer les tables dans PostgreSQL
npx prisma migrate dev --name init

# (À chaque fois que vous modifiez schema.prisma)
```

### Étape 4: Démarrer le Serveur

```bash
npm run dev

# L'app sera disponible à http://localhost:3000
```

### Étape 5: Tester l'API Clients

```bash
# Dans un navigateur ou avec curl
curl http://localhost:3000/api/clients

# Vous devriez obtenir: []
# (Liste vide si vous n'avez pas encore créé de clients)
```

---

## 📁 Fichiers Importants

| Fichier | Description |
|---------|-------------|
| `prisma/schema.prisma` | Schéma de base de données avec tous les models |
| `src/lib/prisma.ts` | Client Prisma singleton |
| `src/app/api/clients/route.ts` | API: GET et POST clients |
| `src/app/api/clients/[id]/route.ts` | API: GET, PUT, DELETE client |
| `.env.local` | Variables d'environnement (à créer) |
| `SETUP_GUIDE.md` | Guide complet de configuration |
| `MIGRATION_CHECKLIST.md` | Checklist de migration et tasks |

---

## 🛠️ Commandes Utiles

```bash
# Développement
npm run dev                          # Démarrer le serveur

# Prisma
npx prisma studio                    # UI pour explorer/modifier la BD
npx prisma migrate dev               # Créer et exécuter migration
npx prisma migrate reset             # Réinitialiser la BD (DANGER!)
npx prisma generate                  # Générer le client Prisma

# Build
npm run build                        # Compiler pour production
npm start                            # Démarrer serveur production
npm run lint                         # Vérifier le code avec ESLint

# TypeScript
npx tsc --noEmit                     # Vérifier les types sans compiler
```

---

## 📡 API Routes Disponibles

### Clients (Complète)
```
GET    /api/clients                  # Lister tous les clients
POST   /api/clients                  # Créer un client
GET    /api/clients/[id]             # Récupérer un client
PUT    /api/clients/[id]             # Mettre à jour un client
DELETE /api/clients/[id]             # Supprimer un client
```

### À Créer
```
/api/projects
/api/invoices
/api/proposals
/api/tasks
/api/users
/api/leads
```

---

## 📝 Exemple: Créer un Client via l'API

```javascript
// POST /api/clients
{
  "firstName": "Jean",
  "lastName": "Dupont",
  "nickname": "JD",
  "email": "jean@example.com",
  "phone1": "+33 1 23 45 67 89",
  "phone2": "+33 6 12 34 56 78",
  "company": "Acme Corp",
  "industry": "Tech",
  "instagram": "@jeandupont",
  "facebook": "jean.dupont",
  "twitter": "@jeandupont",
  "linkedin": "jean-dupont",
  "website": "https://example.com",
  "address": "123 Rue de la Paix",
  "city": "Paris",
  "postalCode": "75001",
  "country": "France",
  "status": "active",
  "userId": 1  // ID de l'utilisateur créateur (à implémenter)
}
```

---

## 🔧 Structure du Projet

```
dyn-crm/
├── src/
│   ├── app/
│   │   ├── api/clients/route.ts          ✅ GET, POST clients
│   │   ├── api/clients/[id]/route.ts     ✅ GET, PUT, DELETE client
│   │   ├── page.tsx                      ⏳ Page d'accueil
│   │   └── layout.tsx                    ⏳ Layout principal
│   ├── components/ui/
│   │   ├── Button.tsx                    ✅
│   │   ├── Input.tsx                     ✅
│   │   ├── Card.tsx                      ✅
│   │   └── index.ts                      ✅
│   └── lib/
│       └── prisma.ts                     ✅ Client Prisma
├── prisma/
│   ├── schema.prisma                     ✅ Schéma complet
│   └── migrations/                       ⏳ À créer via migrate
├── public/                               (Images, favicon)
├── .env.local                            ⏳ À créer
├── SETUP_GUIDE.md                        📖 Guide complet
├── MIGRATION_CHECKLIST.md                📋 Tasks à faire
└── package.json                          ✅ Dépendances

```

---

## 🎯 Prochaines Étapes

1. **Immédiat**: Configurer PostgreSQL et lancer `npx prisma migrate dev --name init`
2. **Court terme**: Créer les pages React (dashboard, clients, projects)
3. **Moyen terme**: Implémenter les autres API routes (projects, invoices, etc.)
4. **Long terme**: Ajouter l'authentification et déployer

---

## ⚠️ Points Importants

- **`.env.local` DOIT contenir `DATABASE_URL`** sinon les migrations échoueront
- **Ne pas commiter `.env.local`** (déjà dans `.gitignore`)
- **PostgreSQL DOIT être en cours d'exécution** pour que Prisma fonctionne
- **Vérifier les migrations** avec `npx prisma studio` après `migrate dev`

---

## 💡 Tips

```bash
# Si vous oubliez la migration:
# Error: Can't reach database server

# Solution: Vérifier PostgreSQL et lancer:
npx prisma migrate deploy

# Si vous avez modifié le schéma:
npx prisma migrate dev --name description

# Pour voir l'UI Prisma:
npx prisma studio
# Ouvre http://localhost:5555
```

---

## ✨ Vous Êtes Prêt!

Le projet est entièrement configuré et prêt à l'emploi. 

**Prochaine action**: Ouvrir ce dossier dans VS Code et suivre `SETUP_GUIDE.md`

```powershell
# Ouvrir dans VS Code
code .
```

Bonne chance! 🎉
