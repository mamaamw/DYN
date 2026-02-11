# Système d'Historique des Modifications des Clients

## Vue d'ensemble

Le système d'historique enregistre automatiquement toutes les modifications apportées aux clients (NewClient) avec les informations suivantes :
- **Date et heure** de la modification
- **Utilisateur** qui a effectué la modification  
- **Type d'action** (Création, Modification, Suppression)
- **Détails des changements** effectués

## Modèle de données

### Table `ClientHistory`

```prisma
model ClientHistory {
  id          Int      @id @default(autoincrement())
  newClientId Int
  userId      Int
  action      String   // CREATE, UPDATE, DELETE
  changes     String?  // JSON string des changements
  fieldName   String?  // Nom du champ modifié
  oldValue    String?  // Ancienne valeur
  newValue    String?  // Nouvelle valeur
  createdAt   DateTime @default(now())
  newClient   NewClient @relation(fields: [newClientId], references: [id], onDelete: Cascade)
  user        User      @relation(fields: [userId], references: [id])
}
```

## Fonctionnement

### 1. Création d'un client (CREATE)

Lors de la création d'un nouveau client via `POST /api/newclients` :
- Un enregistrement est créé dans `ClientHistory`
- `action`: "CREATE"
- `changes`: JSON contenant toutes les données initiales du client
- `userId`: ID de l'utilisateur qui a créé le client

**Exemple de données enregistrées:**
```json
{
  "nickname": "John Doe",
  "surname": "Doe", 
  "firstName": "John",
  "priority": "Haute",
  "contactIdentifiers": [...]
}
```

### 2. Modification d'un client (UPDATE)

Lors de la modification d'un client via `PATCH /api/newclients/[id]` :
- Un enregistrement est créé dans `ClientHistory`
- `action`: "UPDATE"
- `changes`: JSON contenant uniquement les champs modifiés avec ancien/nouvelle valeur
- Comparaison automatique des valeurs avant/après

**Exemple de données enregistrées:**
```json
{
  "priority": {
    "old": "Moyenne",
    "new": "Haute"
  },
  "nickname": {
    "old": "JD",
    "new": "John Doe"
  },
  "contactIdentifiers": {
    "old": [...],
    "new": [...]
  }
}
```

### 3. Suppression d'un client (DELETE)

Lors de la suppression d'un client via `DELETE /api/newclients/[id]` :
- Un enregistrement est créé dans `ClientHistory` **avant** la suppression
- `action`: "DELETE"
- `changes`: JSON contenant toutes les données du client supprimé
- Permet de conserver une trace même après suppression

## Endpoints API

### GET `/api/newclients/[id]/history`

Récupère l'historique complet des modifications d'un client.

**Réponse:**
```json
[
  {
    "id": 1,
    "action": "CREATE",
    "changes": "{...}",
    "createdAt": "2026-01-24T10:30:00Z",
    "user": {
      "id": 1,
      "firstName": "Admin",
      "lastName": "User",
      "email": "admin@example.com"
    }
  },
  {
    "id": 2,
    "action": "UPDATE",
    "changes": "{...}",
    "createdAt": "2026-01-24T11:45:00Z",
    "user": {
      "id": 1,
      "firstName": "Admin",
      "lastName": "User",
      "email": "admin@example.com"
    }
  }
]
```

## Interface utilisateur

### Page d'historique: `/clients/[id]/history`

**Fonctionnalités:**
- Affichage chronologique inversé (plus récent en haut)
- Badges de couleur selon le type d'action:
  - 🟢 **Vert** : Création
  - 🔵 **Bleu** : Modification
  - 🔴 **Rouge** : Suppression
- Date et heure formatées en français
- Nom de l'utilisateur ayant effectué l'action
- Détails des changements selon le type d'action

**Affichage des changements:**

1. **Création (CREATE)** :
   - Liste des données initiales
   - Nombre de contacts créés

2. **Modification (UPDATE)** :
   - Liste des champs modifiés uniquement
   - Affichage ancien/nouvelle valeur
   - Couleurs distinctes : orange pour l'ancienne valeur, vert pour la nouvelle

3. **Suppression (DELETE)** :
   - Nom du client supprimé
   - Données complètes au moment de la suppression

### Accès à l'historique

Depuis la page détails du client (`/clients/[id]`), un bouton "Historique" dans le header permet d'accéder à la page d'historique.

## Sécurité et confidentialité

⚠️ **Points d'attention actuels:**

1. **User ID hardcodé** : Actuellement, l'ID utilisateur est hardcodé à `1` dans les endpoints
   - **TODO**: Implémenter récupération de l'utilisateur depuis la session
   
2. **Pas de vérification d'autorisation** : Tous les utilisateurs peuvent voir l'historique
   - **TODO**: Ajouter vérification des permissions

3. **Suppression en cascade** : L'historique est supprimé si le client est supprimé
   - **Recommandation**: Envisager de désactiver `onDelete: Cascade` pour conserver l'historique même après suppression

## Évolutions futures possibles

1. **Filtrage de l'historique** :
   - Par type d'action
   - Par date
   - Par utilisateur

2. **Export de l'historique** :
   - PDF
   - CSV
   - Excel

3. **Notifications** :
   - Email lors de modifications importantes
   - Notifications dans l'application

4. **Historique détaillé par champ** :
   - Utiliser `fieldName`, `oldValue`, `newValue` pour un tracking plus granulaire
   - Vue par champ individuel

5. **Restauration** :
   - Possibilité de restaurer une version précédente du client
   - Annulation des modifications

6. **Audit complet** :
   - Logs système
   - Tracking IP
   - Informations du navigateur

## Utilisation

### Consulter l'historique d'un client

1. Accéder à la page détails d'un client: `/clients/[id]`
2. Cliquer sur le bouton "Historique" dans le header
3. Visualiser toutes les modifications chronologiquement

### Format des dates

Les dates sont affichées au format français :
- `DD/MM/YYYY HH:MM:SS`
- Exemple: `24/01/2026 15:30:45`

## Maintenance

### Nettoyer les anciens historiques

Pour supprimer les historiques de plus de X jours (exemple SQL) :

```sql
DELETE FROM "ClientHistory" 
WHERE "createdAt" < NOW() - INTERVAL '90 days';
```

### Archiver l'historique

Pour des raisons de performance, envisager d'archiver les anciens historiques dans une table séparée.

## Support

Pour toute question ou problème avec le système d'historique, consulter :
- Code source : `/app/api/newclients/[id]/history/route.ts`
- Interface : `/app/clients/[id]/history/page.tsx`
- Schéma : `/prisma/schema.prisma`
