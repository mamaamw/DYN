# Structure du Projet DYN

## 📁 Organisation des Dossiers

```
DYN/
├── app/                    # Pages Next.js et routes API
│   ├── api/               # Routes API
│   ├── admin/             # Pages administration
│   ├── apps/              # Applications (email, chat, storage)
│   ├── auth/              # Authentification
│   └── ...
├── components/            # Composants React réutilisables
│   └── ui/               # Composants UI de base
├── hooks/                 # Hooks React personnalisés
├── lib/                   # Utilitaires et configurations
├── prisma/               # Schéma et migrations Prisma
├── public/               # Fichiers statiques
├── types/                # Types TypeScript partagés
└── ...
```

## 🔧 Utilitaires Principaux

### `lib/utils.ts`
Fonctions utilitaires pour:
- Formatage des dates (`formatDate`, `formatDateTime`, `formatRelativeTime`)
- Formatage des devises (`formatCurrency`)
- Classes CSS (`cn`)
- Validation (`isValidEmail`, `isValidPhone`)
- Manipulation de strings (`truncate`, `capitalize`)
- Debouncing
- Couleurs de priorité (`getPriorityColor`)

### `lib/constants.ts`
Constantes du projet:
- `CLIENT_PRIORITIES` - Niveaux de priorité client
- `TODO_STATUS` - Statuts des tâches
- `LOG_LEVELS` - Niveaux de log
- `CURRENCIES` - Devises supportées (BTC, EUR, USD)
- `USER_ROLES` - Rôles utilisateur

### `lib/api-client.ts`
Client API centralisé avec méthodes:
- `get<T>(endpoint)` - Requête GET
- `post<T>(endpoint, data)` - Requête POST
- `put<T>(endpoint, data)` - Requête PUT
- `delete<T>(endpoint)` - Requête DELETE

## 🎣 Hooks Personnalisés

### `useFetch<T>(url, options)`
Hook pour les requêtes HTTP
```tsx
const { data, loading, error, refetch } = useFetch<User[]>('/api/users');
```

### `useToast()`
Gestion des notifications toast
```tsx
const { toast, showToast, hideToast } = useToast();
showToast('Succès!', 'success');
```

### `useLocalStorage<T>(key, initialValue)`
Synchronisation avec localStorage
```tsx
const [theme, setTheme] = useLocalStorage('theme', 'light');
```

## 📦 Types TypeScript

### Types Principaux (`types/index.ts`)
- `DashboardStats` - Statistiques du dashboard
- `RecentActivity` - Activités récentes
- `Client` / `RecentClient` - Informations client
- `NavItem` / `NavSection` - Navigation
- `User` / `UserRole` - Utilisateur
- `ApiResponse<T>` - Réponses API
- `Toast` - Notifications

## 🎨 Composants UI

### `<Card>`, `<CardHeader>`, `<CardTitle>`, `<CardContent>`
Conteneurs stylisés
```tsx
<Card>
  <CardHeader>
    <CardTitle>Titre</CardTitle>
  </CardHeader>
  <CardContent>Contenu...</CardContent>
</Card>
```

### `<StatCard>`
Carte de statistique
```tsx
<StatCard
  icon={<Users />}
  title="Utilisateurs actifs"
  value={125}
  trend={{ value: '+12%', isPositive: true }}
/>
```

### `<EmptyState>`
État vide avec icône
```tsx
<EmptyState
  icon={Users}
  title="Aucun utilisateur"
  description="Commencez par créer un utilisateur"
  action={<Button>Créer</Button>}
/>
```

## 🔐 Authentification

- JWT stocké dans les cookies
- Middleware de vérification dans `/api/*`
- Rôles: ADMIN, USER, GUEST
- Gestion des sessions via localStorage

## 💾 Base de Données

- **ORM**: Prisma 5.22.0
- **DB**: PostgreSQL
- **Client**: `lib/prisma.ts`

### Commandes Prisma
```bash
# Générer le client
npx prisma generate

# Synchroniser la DB
npx prisma db push

# Ouvrir Prisma Studio
npx prisma studio
```

## 📊 Conventions de Code

### Nommage
- **Composants**: PascalCase (`UserCard.tsx`)
- **Hooks**: camelCase avec préfixe `use` (`useFetch.ts`)
- **Utilitaires**: camelCase (`formatDate`)
- **Constantes**: UPPER_SNAKE_CASE (`CLIENT_PRIORITIES`)
- **Types/Interfaces**: PascalCase (`UserRole`, `ApiResponse`)

### Imports
```tsx
// Ordre recommandé:
import { useState } from 'react';           // 1. React
import { useRouter } from 'next/navigation'; // 2. Next.js
import { Users } from 'lucide-react';       // 3. Librairies
import { Card } from '@/components/ui';     // 4. Composants locaux
import { useFetch } from '@/hooks';         // 5. Hooks
import { formatDate } from '@/lib/utils';   // 6. Utilitaires
import type { User } from '@/types';        // 7. Types
```

### Structure de Composant
```tsx
'use client'; // Si nécessaire

import { ... } from '...';
import type { ... } from '...';

interface Props {
  // Props du composant
}

export default function ComponentName({ prop1, prop2 }: Props) {
  // 1. Hooks
  const [state, setState] = useState();
  
  // 2. Effets
  useEffect(() => {}, []);
  
  // 3. Handlers
  const handleClick = () => {};
  
  // 4. Render
  return <div>...</div>;
}
```

## 🚀 Scripts

```bash
npm run dev      # Serveur de développement
npm run build    # Build de production
npm run start    # Serveur de production
npm run lint     # Linter
```

## 📝 Bonnes Pratiques

1. **Typage strict**: Toujours typer les props, states et fonctions
2. **Composants réutilisables**: Extraire la logique commune
3. **Hooks personnalisés**: Pour la logique réutilisable
4. **API centralisée**: Utiliser `apiClient` pour les requêtes
5. **Constantes**: Éviter les valeurs hardcodées
6. **Validation**: Utiliser les fonctions de `lib/utils.ts`
7. **Gestion d'erreurs**: Toujours gérer les cas d'erreur
8. **Loading states**: Afficher un feedback utilisateur
