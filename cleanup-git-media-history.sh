#!/bin/bash

# cleanup-git-media-history.sh
# Supprime les fichiers médias de l'historique Git complet

set -e  # Arrêter en cas d'erreur

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║  🚨 NETTOYAGE DE L'HISTORIQUE GIT - FICHIERS MÉDIAS 🚨       ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "⚠️  ATTENTION : Cette opération va RÉÉCRIRE l'historique Git !"
echo ""
echo "Conséquences :"
echo "  • Tous les commits seront modifiés"
echo "  • Les collaborateurs devront re-cloner le dépôt"
echo "  • Les pull requests ouvertes seront cassées"
echo "  • Il faudra faire un push --force"
echo ""

# Vérification sauvegarde
read -p "❓ Avez-vous fait une SAUVEGARDE du projet ? (oui/non) : " BACKUP
if [ "$BACKUP" != "oui" ]; then
    echo ""
    echo "❌ Faites d'abord une sauvegarde !"
    echo ""
    echo "Commande recommandée :"
    echo "  cd /home/hmj/Documents/projets"
    echo "  cp -r slufe slufe-backup-\$(date +%Y%m%d)"
    echo ""
    exit 1
fi

echo ""
read -p "❓ Êtes-vous CERTAIN de vouloir continuer ? (TAPEZ 'OUI EN MAJUSCULES') : " CONFIRM
if [ "$CONFIRM" != "OUI" ]; then
    echo "❌ Opération annulée (vous n'avez pas tapé 'OUI' en majuscules)"
    exit 0
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 Vérification des prérequis..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Vérifier git filter-repo
if ! command -v git-filter-repo &> /dev/null; then
    echo ""
    echo "❌ git-filter-repo n'est pas installé"
    echo ""
    echo "Installation :"
    echo "  pip3 install git-filter-repo"
    echo ""
    echo "Ou :"
    echo "  sudo apt-get install git-filter-repo"
    echo ""
    exit 1
fi

echo "✅ git-filter-repo est installé"

# Vérifier qu'on est dans un dépôt Git
if [ ! -d .git ]; then
    echo "❌ Ce dossier n'est pas un dépôt Git"
    exit 1
fi

echo "✅ Dépôt Git détecté"

# Sauvegarder l'URL du remote
REMOTE_URL=$(git remote get-url origin 2>/dev/null || echo "")
if [ -n "$REMOTE_URL" ]; then
    echo "✅ Remote origin: $REMOTE_URL"
else
    echo "⚠️  Aucun remote 'origin' trouvé"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Analyse de la taille du dépôt..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

SIZE_BEFORE=$(du -sh .git | cut -f1)
echo "📦 Taille actuelle du .git: $SIZE_BEFORE"

# Compter les fichiers médias dans l'historique
MEDIA_COUNT=$(git rev-list --objects --all | \
  git cat-file --batch-check='%(objecttype) %(objectname) %(objectsize) %(rest)' | \
  grep -E '\.(jpg|jpeg|png|gif|webp|mp4|webm|avi|mov)' | wc -l || echo "0")

echo "📸 Fichiers médias dans l'historique: $MEDIA_COUNT"

if [ "$MEDIA_COUNT" -eq 0 ]; then
    echo ""
    echo "✅ Aucun fichier média trouvé dans l'historique !"
    echo "   Le nettoyage n'est pas nécessaire."
    exit 0
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🧹 Suppression des fichiers médias de l'historique..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Dossiers à supprimer:"
echo "  • backend/medias/"
echo "  • backend/data/"
echo "  • backend/collections/"
echo "  • backend/logs/"
echo "  • backend/uploads/"
echo ""
echo "⏳ Cela peut prendre quelques minutes..."
echo ""

# Supprimer les dossiers médias de l'historique
git filter-repo \
  --path backend/medias --invert-paths \
  --path backend/data --invert-paths \
  --path backend/collections --invert-paths \
  --path backend/logs --invert-paths \
  --path backend/uploads --invert-paths \
  --force

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🗑️  Nettoyage des objets orphelins..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

git reflog expire --expire=now --all
git gc --prune=now --aggressive

SIZE_AFTER=$(du -sh .git | cut -f1)

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Nettoyage local terminé avec succès !"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 Résultats:"
echo "  • Taille avant:  $SIZE_BEFORE"
echo "  • Taille après:  $SIZE_AFTER"
echo ""

# Vérifier qu'il ne reste plus de médias
MEDIA_COUNT_AFTER=$(git rev-list --objects --all | \
  git cat-file --batch-check='%(objecttype) %(objectname) %(objectsize) %(rest)' | \
  grep -E '\.(jpg|jpeg|png|gif|webp|mp4|webm|avi|mov)' | wc -l || echo "0")

if [ "$MEDIA_COUNT_AFTER" -gt 0 ]; then
    echo "⚠️  ATTENTION: Il reste encore $MEDIA_COUNT_AFTER fichiers médias dans l'historique"
else
    echo "✅ Aucun fichier média ne reste dans l'historique"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📤 Prochaines étapes - POUSSER VERS LE DÉPÔT DISTANT"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1️⃣  Ajouter le remote (il a été supprimé par sécurité):"
if [ -n "$REMOTE_URL" ]; then
    echo "    git remote add origin $REMOTE_URL"
else
    echo "    git remote add origin <URL_DU_DEPOT>"
fi
echo ""
echo "2️⃣  Pousser en FORCE (écrase l'historique distant):"
echo "    git push origin --force --all"
echo "    git push origin --force --tags"
echo ""
echo "3️⃣  Notifier TOUS les collaborateurs:"
echo "    Ils doivent SUPPRIMER leur copie locale et RE-CLONER"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "⚠️  IMPORTANT - Instructions pour les collaborateurs"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Les collaborateurs doivent exécuter:"
echo ""
echo "  cd .."
echo "  rm -rf slufe"
echo "  git clone $REMOTE_URL"
echo "  cd slufe"
echo ""
echo "⚠️  Ne PAS faire 'git pull', cela ne fonctionnera pas !"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Script terminé"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
