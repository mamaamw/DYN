# Guide d'Export des Données

## Vue d'ensemble

Le système d'export universel permet d'exporter toutes les listes de données du site dans 4 formats différents :
- **Excel (.xls)** - Format compatible Microsoft Excel
- **CSV** - Valeurs séparées par virgules
- **JSON** - Format de données structurées
- **HTML** - Page web autonome avec tableau formaté

## Utilisation

### Accès rapide

Le bouton d'export est disponible sur toutes les pages avec des listes :
- ✅ **Tasks** (Tâches)
- ✅ **Calendar** (Événements)
- ✅ **Clients**
- ✅ **Admin Users** (Utilisateurs)
- ✅ **Proposals** (Propositions)
- ✅ **Invoices** (Factures)

### Comment exporter

1. **Cliquez sur le bouton "Exporter"** en haut à droite de la page
2. **Choisissez le format** souhaité dans le menu déroulant
3. Le fichier se télécharge automatiquement

### Formats disponibles

#### 📊 Excel (.xls)
- Format compatible avec Microsoft Excel, LibreOffice Calc, Google Sheets
- Avec en-têtes formatés (fond bleu, texte blanc)
- Types de données reconnus (nombres, dates, texte)
- **Idéal pour** : Analyses, graphiques, tableaux croisés dynamiques

#### 📄 CSV
- Format texte simple, universel
- Compatible avec tous les tableurs et bases de données
- Encodage UTF-8 pour les caractères accentués
- **Idéal pour** : Import dans d'autres systèmes, traitement par scripts

#### 🔧 JSON
- Format de données structurées
- Lisible par les humains (indenté)
- Compatible avec tous les langages de programmation
- **Idéal pour** : Développement, API, sauvegarde de données

#### 🌐 HTML
- Page web autonome avec tableau formaté
- Design moderne et responsive
- Métadonnées (date/heure d'export, nombre d'enregistrements)
- **Idéal pour** : Partage, impression, archivage visuel

## Fonctionnalités

### Filtrage automatique
Les exports respectent les filtres actifs sur la page :
- Recherche textuelle
- Filtres par statut, priorité, dates, etc.
- Seules les données visibles sont exportées

### Nettoyage des données
Le système nettoie automatiquement les données avant export :
- Suppression des champs techniques (password, deletedAt, *Id)
- Formatage des dates en français
- Conversion des booléens (Oui/Non)
- Parsing des JSON stockés
- Gestion des valeurs nulles

### Personnalisation par page

Chaque page peut exclure des champs spécifiques :

```typescript
<ExportButton 
  data={filteredTasks} 
  filename="taches" 
  title="Liste des Tâches"
  excludeFields={['userId']} // Exclure userId
/>
```

## Exemples d'utilisation

### Export des tâches du jour
1. Allez dans **Tasks**
2. Filtrez par statut "En cours"
3. Cliquez sur **Exporter** → **Excel**
4. Résultat : Fichier `taches.xls` avec uniquement les tâches en cours

### Export des clients pour comptabilité
1. Allez dans **Clients**
2. Appliquez vos filtres (période, priorité, etc.)
3. Cliquez sur **Exporter** → **CSV**
4. Importez le CSV dans votre logiciel de compta

### Archivage des événements mensuels
1. Allez dans **Calendar**
2. Sélectionnez la vue "Mois"
3. Cliquez sur **Exporter** → **HTML**
4. Imprimez ou sauvegardez la page HTML générée

### Backup JSON de tous les utilisateurs
1. Allez dans **Admin → Users**
2. Cliquez sur **Exporter** → **JSON**
3. Sauvegardez le fichier `utilisateurs.json` comme backup

## Intégration dans vos propres pages

### 1. Importer le composant

```typescript
import ExportButton from '@/components/ExportButton';
```

### 2. Ajouter le bouton

```typescript
<ExportButton 
  data={myData}                    // Tableau d'objets à exporter
  filename="mon-export"            // Nom du fichier (sans extension)
  title="Titre de l'export"       // Titre pour HTML
  excludeFields={['password']}     // Champs à exclure (optionnel)
/>
```

### 3. Exemple complet

```typescript
export default function MyPage() {
  const [items, setItems] = useState([]);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1>Ma Liste</h1>
        <ExportButton 
          data={items} 
          filename="ma-liste" 
          title="Ma Liste"
        />
      </div>
      {/* Votre contenu */}
    </div>
  );
}
```

## Fonctions utilitaires

Si vous avez besoin d'un contrôle plus fin, utilisez directement les fonctions :

```typescript
import { exportData, prepareDataForExport } from '@/lib/exportUtils';

// Nettoyer les données
const cleanData = prepareDataForExport(myData, ['password', 'secret']);

// Exporter directement
exportData(cleanData, 'excel', 'mon-fichier', { 
  title: 'Mon Export',
  sheetName: 'Données' 
});
```

### Fonctions disponibles

- `exportData(data, format, filename, options)` - Fonction principale d'export
- `toExcel(data, filename, sheetName)` - Export Excel
- `toCSV(data, filename)` - Export CSV
- `toJSON(data, filename)` - Export JSON
- `toHTML(data, filename, title)` - Export HTML
- `prepareDataForExport(data, excludeFields)` - Nettoyer les données

## Limites et recommandations

### Performances
- ✅ Optimal : < 1000 enregistrements
- ⚠️ Acceptable : 1000-5000 enregistrements
- ❌ Peut être lent : > 5000 enregistrements

**Recommandation** : Utilisez les filtres pour limiter le nombre d'enregistrements

### Taille des fichiers
- **CSV/JSON** : Très compacts
- **Excel** : Compact
- **HTML** : Plus volumineux (inclut le style)

### Caractères spéciaux
- Tous les formats supportent UTF-8
- Les caractères accentués sont préservés
- Les sauts de ligne et virgules sont échappés en CSV

## Dépannage

### Le bouton est désactivé
→ Aucune donnée à exporter (liste vide ou tous les filtres retournent 0 résultat)

### Les accents sont mal affichés
→ Ouvrez le CSV avec l'encodage UTF-8 (Excel : Import de données → UTF-8)

### Certains champs manquent
→ Vérifiez le paramètre `excludeFields` ou les champs techniques automatiquement exclus

### Le fichier ne se télécharge pas
→ Vérifiez les permissions du navigateur pour les téléchargements

## Support

Pour toute question ou suggestion d'amélioration, contactez l'équipe de développement.

---

**Dernière mise à jour** : 25 janvier 2026
**Version** : 1.0
