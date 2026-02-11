# 📚 Documentation DYN - Index Complet

Guide centralisé de toute la documentation du projet.

## 🚀 Pour Commencer

### Nouveau sur le projet ?
1. **[README.md](./README.md)** - Vue d'ensemble et introduction
2. **[QUICK_START.md](./QUICK_START.md)** - Démarrage en 5 minutes
3. **[SETUP_GUIDE.md](./SETUP_GUIDE.md)** - Installation complète pas à pas

## 📖 Documentation Technique

### Architecture & Code
- **[CODE_STRUCTURE.md](./CODE_STRUCTURE.md)** - Organisation du code, dossiers, conventions
  - Structure des dossiers
  - Patterns de code
  - Composants réutilisables
  - Hooks personnalisés

### Base de Données
- **[MIGRATION_CHECKLIST.md](./MIGRATION_CHECKLIST.md)** - Checklist pour les migrations Prisma
  - Processus de migration
  - Commandes Prisma
  - Rollback et gestion d'erreurs

### Systèmes Spécifiques

#### Authentification & Sécurité
- **[AUTH_SYSTEM.md](./AUTH_SYSTEM.md)** - Système d'authentification complet
  - JWT et sessions
  - Middleware de protection
  - Contrôle d'accès (RBAC)
  - API d'authentification

- **[PASSWORD_POLICY.md](./PASSWORD_POLICY.md)** - Politique de mots de passe
  - Règles de complexité
  - Validation
  - Sécurité des mots de passe

- **[SSO_GUIDE.md](./SSO_GUIDE.md)** - Configuration Single Sign-On
  - SAML 2.0
  - OAuth 2.0 / OpenID Connect
  - Configuration providers

#### Fonctionnalités Métier
- **[HISTORY_SYSTEM.md](./HISTORY_SYSTEM.md)** - Système d'historique et audit
  - Tracking des modifications
  - Logs d'activité
  - Soft delete et corbeille

- **[EXPORT_GUIDE.md](./EXPORT_GUIDE.md)** - Export de données
  - Export Excel/CSV
  - Export PDF
  - Génération de rapports

## 🧪 Tests & Qualité

- **[TESTING_GUIDE.md](./TESTING_GUIDE.md)** - Guide de tests
  - Tests unitaires
  - Tests d'intégration
  - Tests E2E
  - Coverage et CI/CD

## 🚀 Déploiement

- **[DEPLOYMENT_OFFLINE.md](./DEPLOYMENT_OFFLINE.md)** - Déploiement réseau local
  - Configuration offline
  - Dépendances minimales
  - Optimisations réseau local

### Commandes Rapides de Déploiement

**Serveur de production (Ubuntu + PM2):**
```bash
git pull
npm install
npx prisma generate
npx prisma migrate deploy
npm run build
pm2 restart dyn
```

**Vérification locale:**
```bash
npm run build
npm start
```

## 📊 Modules du Système

### Gestion des Clients
- CRUD complet avec soft delete
- Catégorisation flexible
- Identifiants de contact multiples
- Historique des modifications

### Finance & Rapports
- **Multi-devises:** BTC, EUR, USD, GBP, CHF
- **Projets:** Budgets et suivi
- **Wallets:** Portefeuilles de fonds
- **Dépenses:** Matériel, licenses, autres
- **Analytics:** Graphiques et statistiques

### Tâches & Planning
- Vue Kanban
- Vue calendrier
- Priorités et assignations
- Notifications

### Recherches
- Système de recherche avancée
- Filtres personnalisés et sauvegardés
- Historique de recherche

### Applications Intégrées
- 📧 Email
- 💬 Chat temps réel
- 📅 Calendrier
- 📁 Stockage de fichiers
- 📝 Notes

### Administration
- Gestion utilisateurs et rôles
- Configuration catégories
- Gestion devises
- Monitoring système
- Backup/Restore DB
- Logs et audit

## 🔧 Utilitaires & Scripts

### Scripts Prisma
```bash
npx prisma studio              # Interface GUI
npx prisma generate            # Régénérer le client
npx prisma migrate dev         # Migration dev
npx prisma migrate deploy      # Migration production
npx prisma db seed             # Seed data
```

### Scripts Personnalisés (`scripts/`)
- `create-admin.js` - Créer un admin
- `check-db-structure.js` - Vérifier la structure DB
- `seed-*.js` - Seed de données
- Et plus...

## 📝 Conventions de Code

### Structure des Fichiers
```
- PascalCase pour composants React
- camelCase pour fonctions/variables
- kebab-case pour fichiers CSS
- SCREAMING_SNAKE_CASE pour constantes
```

### Imports
```typescript
// 1. Imports externes
import React from 'react';
import { useRouter } from 'next/navigation';

// 2. Imports internes
import { Button } from '@/components/ui/Button';
import { apiClient } from '@/lib/api-client';

// 3. Types
import type { User } from '@/types';
```

### API Routes
```typescript
// Pattern standard
export async function GET(request: Request) {
  try {
    // Logique
    return Response.json({ data }, { status: 200 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
```

## 🐛 Dépannage

### Erreurs Courantes

**Build TypeScript échoue:**
```bash
npx prisma generate
npm run build
```

**Problème de migration:**
```bash
npx prisma migrate reset
npx prisma migrate dev
```

**Serveur ne démarre pas:**
```bash
# Tuer les processus Node
Get-Process | Where-Object {$_.ProcessName -eq "node"} | Stop-Process -Force
npm run dev
```

**Suspense boundary error (Next.js 16):**
- Wrapper `useSearchParams` dans `<Suspense>`
- Voir [app/finance/page.tsx](./app/finance/page.tsx) pour exemple

## 🔗 Ressources Externes

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)

## 📞 Support

Pour toute question :
1. Consulter cette documentation
2. Vérifier les fichiers de logs (`/logs/`)
3. Utiliser Prisma Studio pour inspecter la DB
4. Contacter l'équipe de développement

---

**Dernière mise à jour:** Janvier 2026  
**Mainteneurs:** Équipe DYN
