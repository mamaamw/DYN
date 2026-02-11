#!/bin/bash

# Script de correction pour la base de données de production
# À exécuter sur votre serveur Ubuntu

echo "🚀 Démarrage de la correction de la base de données de production..."

# Aller dans le répertoire de l'application
cd /home/ubuntu/DYN

# Arrêter PM2 temporairement
echo "⏸️  Arrêt temporaire de l'application..."
pm2 stop dyn-app

# Sauvegarder la base de données (optionnel mais recommandé)
echo "💾 Sauvegarde de la base de données..."
pg_dump -U dyn_user -h localhost -d dyn_db > backup_$(date +%Y%m%d_%H%M%S).sql || echo "⚠️  Sauvegarde échouée, mais on continue..."

# Exécuter le script de correction
echo "🔧 Exécution du script de correction..."
node scripts/fix-production-db.js

# Déployer les migrations si nécessaire
echo "📦 Application des migrations Prisma..."
npx prisma db push

# Générer le client Prisma
echo "🔄 Génération du client Prisma..."
npx prisma generate

# Redémarrer PM2
echo "🚀 Redémarrage de l'application..."
pm2 start dyn-app
pm2 save

echo "✅ Correction terminée ! Vérifiez les logs :"
echo "   pm2 logs dyn-app --lines 20"