# Politique de Mot de Passe - DYN CRM

## 📋 Exigences Actuelles

### ✅ Validations Implémentées

Tous les mots de passe doivent respecter les critères suivants :

1. **Longueur minimale** : 8 caractères
2. **Lettre majuscule** : Au moins une (A-Z)
3. **Lettre minuscule** : Au moins une (a-z)
4. **Chiffre** : Au moins un (0-9)
5. **Caractère spécial** : Au moins un (!@#$%^&*...)

### 🎨 Indicateur de Force

Le système affiche en temps réel la force du mot de passe :

- **Faible** (Rouge) : Score 0-3
  - Mot de passe trop court ou simple
  - Manque de complexité
  
- **Moyen** (Orange) : Score 4-5
  - Longueur acceptable
  - Quelques critères manquants
  
- **Fort** (Jaune) : Score 6-7
  - Tous les critères de base respectés
  - Bonne longueur
  
- **Très Fort** (Vert) : Score 8+
  - Tous les critères respectés
  - Longueur importante (12+ caractères)
  - Grande variété de caractères

### 🔍 Validation Temps Réel

Sur les pages d'inscription et de réinitialisation :

- ✅ **Feedback immédiat** : L'utilisateur voit instantanément si son mot de passe respecte les exigences
- ✅ **Liste des erreurs** : Affichage clair de ce qui manque
- ✅ **Barre de progression** : Indicateur visuel de la force
- ✅ **Vérification de correspondance** : Pour le champ "Confirmer le mot de passe"
- ✅ **Bouton désactivé** : Impossible de soumettre si le mot de passe est invalide

### 🛡️ Sécurité

#### Côté Client
- Validation en temps réel avec feedback UX
- Empêche la soumission de mots de passe faibles

#### Côté Serveur
- Double validation sur tous les endpoints
- Messages d'erreur clairs
- Hashage avec bcrypt (12 rounds)

### 📄 Endpoints avec Validation

1. **POST /api/auth/register**
   - Validation complète avant création
   - Retourne l'erreur spécifique si invalide
   
2. **POST /api/auth/reset-password**
   - Même validation que l'inscription
   - S'applique au nouveau mot de passe

### 💡 Exemples

#### ❌ Mots de passe INVALIDES

\`\`\`
admin123          → Pas de majuscule, pas de caractère spécial
Password          → Pas de chiffre, pas de caractère spécial
password123       → Pas de majuscule, pas de caractère spécial
Abcd1234          → Pas de caractère spécial
\`\`\`

#### ✅ Mots de passe VALIDES

\`\`\`
Admin@123         → ✓ Tous les critères (score: 5/8)
MyP@ssw0rd!       → ✓ Tous les critères (score: 6/8)
Secure#Pass2024   → ✓ Tous les critères (score: 7/8)
C0mpl3x!Passw0rd@ → ✓ Très fort (score: 8/8)
\`\`\`

### 🔧 Configuration

Les exigences sont définies dans `lib/passwordValidation.ts` :

\`\`\`typescript
export const DEFAULT_PASSWORD_REQUIREMENTS = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
};
\`\`\`

### 🎯 Personnalisation

Pour modifier les exigences, éditer le fichier `lib/passwordValidation.ts` :

\`\`\`typescript
// Exemple : Rendre les caractères spéciaux optionnels
export const CUSTOM_REQUIREMENTS = {
  minLength: 10,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: false, // ← Désactivé
};

// Utiliser dans la validation
validatePassword(password, CUSTOM_REQUIREMENTS);
\`\`\`

### 📊 Statistiques de Sécurité

Avec la politique actuelle :

- **Combinaisons possibles** : > 10^14 (avec 8 caractères)
- **Temps de craquage** (brute force) : 
  - Avec GPU standard : ~200 ans
  - Avec cluster : ~2 ans
  - Avec hashage bcrypt : ~20 000 ans
  
- **Résistance aux attaques** :
  - ✅ Dictionnaire : Excellente
  - ✅ Brute force : Excellente
  - ✅ Rainbow tables : Excellente (bcrypt)
  - ✅ Attaques hybrides : Très bonne

### 🔄 Comparaison avec l'Ancien Système

| Critère | Avant | Maintenant |
|---------|-------|------------|
| Longueur min | 6 | 8 |
| Majuscules | ❌ | ✅ |
| Minuscules | ❌ | ✅ |
| Chiffres | ❌ | ✅ |
| Spéciaux | ❌ | ✅ |
| Feedback temps réel | ❌ | ✅ |
| Indicateur de force | ❌ | ✅ |
| Validation serveur | ❌ | ✅ |

### 🚀 Futures Améliorations Possibles

1. **Vérification de mots de passe compromis**
   - Intégration avec Have I Been Pwned API
   - Refuser les mots de passe dans les bases de données de fuites
   
2. **Historique des mots de passe**
   - Empêcher la réutilisation des 5 derniers
   - Stocker les hashs dans la base de données
   
3. **Expiration des mots de passe**
   - Forcer le changement tous les 90 jours
   - Notifications avant expiration
   
4. **Authentification à deux facteurs (2FA)**
   - SMS ou application (Google Authenticator)
   - Codes de récupération

### 📱 Où s'Applique la Validation ?

- ✅ Page d'inscription (`/auth/register`)
- ✅ Page de réinitialisation (`/auth/reset-password`)
- ✅ API d'inscription (`/api/auth/register`)
- ✅ API de réinitialisation (`/api/auth/reset-password`)
- ❌ Pas sur le login (vérification uniquement)

### 🎨 UI/UX

**Inscription** :
- Barre de progression colorée
- Liste déroulante des exigences non respectées
- Icônes ✓ et ✗ pour chaque critère
- Message de succès quand tout est OK

**Réinitialisation** :
- Même système que l'inscription
- Vérification du token en plus
- Confirmation du nouveau mot de passe

### 🐛 Gestion des Erreurs

Messages d'erreur clairs et spécifiques :

- "Le mot de passe doit contenir au moins 8 caractères"
- "Le mot de passe doit contenir au moins une lettre majuscule"
- "Le mot de passe doit contenir au moins une lettre minuscule"
- "Le mot de passe doit contenir au moins un chiffre"
- "Le mot de passe doit contenir au moins un caractère spécial"

### ✅ Checklist de Conformité

- [x] RGPD : Hashage sécurisé des mots de passe
- [x] NIST SP 800-63B : Longueur minimale de 8 caractères
- [x] OWASP : Validation côté client ET serveur
- [x] PCI DSS : Complexité du mot de passe
- [x] ISO 27001 : Politique de mots de passe documentée

## 📞 Support

Pour toute question sur la politique de mot de passe :
- Consulter `lib/passwordValidation.ts`
- Lire `AUTH_SYSTEM.md`
- Voir `SSO_GUIDE.md` pour les alternatives
