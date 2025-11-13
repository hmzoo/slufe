# Guide : Supprimer les fichiers médias du dépôt distant et de l'historique Git

## ⚠️ IMPORTANT - Avant de commencer

**ATTENTION** : Ces opérations vont **réécrire l'historique Git**. 

### Précautions
1. ✅ Faire une **sauvegarde complète** du projet
2. ✅ Prévenir tous les collaborateurs (ils devront re-cloner)
3. ✅ S'assurer que personne ne travaille sur le dépôt
4. ✅ Avoir les droits d'administration sur le dépôt distant

## 🎯 Méthode recommandée : git filter-repo

`git filter-repo` est l'outil recommandé par Git (plus rapide et sûr que `filter-branch`).

### Étape 1 : Installer git filter-repo

```bash
# Sur Ubuntu/Debian
sudo apt-get install git-filter-repo

# Sur macOS avec Homebrew
brew install git-filter-repo

# Ou avec pip (Python)
pip3 install git-filter-repo
```

### Étape 2 : Créer une sauvegarde

```bash
cd /home/hmj/Documents/projets/slufe

# Sauvegarde complète
cp -r ../slufe ../slufe-backup-$(date +%Y%m%d)

# Ou créer un bundle Git
git bundle create ../slufe-backup.bundle --all
```

### Étape 3 : Supprimer les fichiers de l'historique

```bash
cd /home/hmj/Documents/projets/slufe

# Supprimer tous les fichiers médias de l'historique
git filter-repo --path backend/medias --invert-paths --force

# Ou supprimer plusieurs dossiers
git filter-repo \
  --path backend/medias --invert-paths \
  --path backend/data --invert-paths \
  --path backend/collections --invert-paths \
  --path backend/logs --invert-paths \
  --force
```

**Note** : `--invert-paths` signifie "supprimer ces chemins" (inverse de "garder ces chemins")

### Étape 4 : Vérifier la taille du dépôt

```bash
# Avant nettoyage
du -sh .git

# Nettoyer les objets orphelins
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# Après nettoyage
du -sh .git
```

### Étape 5 : Pousser vers le dépôt distant

```bash
# Ajouter à nouveau le remote (filter-repo l'enlève par sécurité)
git remote add origin <URL_DU_DEPOT>

# Pousser en force (écrase l'historique distant)
git push origin --force --all

# Pousser les tags aussi
git push origin --force --tags
```

### Étape 6 : Notifier les collaborateurs

Tous les collaborateurs doivent :

```bash
# Supprimer leur copie locale
cd ..
rm -rf slufe

# Re-cloner le dépôt
git clone <URL_DU_DEPOT>
cd slufe
```

## 🔧 Méthode alternative : BFG Repo-Cleaner

BFG est plus simple mais moins flexible.

### Étape 1 : Télécharger BFG

```bash
# Télécharger depuis https://rtyley.github.io/bfg-repo-cleaner/
wget https://repo1.maven.org/maven2/com/madgag/bfg/1.14.0/bfg-1.14.0.jar
```

### Étape 2 : Supprimer les dossiers

```bash
cd /home/hmj/Documents/projets/slufe

# Supprimer un dossier
java -jar ~/bfg-1.14.0.jar --delete-folders medias

# Ou supprimer par extension
java -jar ~/bfg-1.14.0.jar --delete-files '*.{jpg,png,mp4,webm}'
```

### Étape 3 : Nettoyer et pousser

```bash
git reflog expire --expire=now --all
git gc --prune=now --aggressive
git push origin --force --all
```

## 📋 Script automatisé complet

Créons un script pour automatiser le processus :

```bash
#!/bin/bash

# cleanup-git-media-history.sh
# Supprime les fichiers médias de l'historique Git

set -e  # Arrêter en cas d'erreur

echo "🚨 ATTENTION : Cette opération va réécrire l'historique Git !"
echo ""
read -p "Avez-vous fait une sauvegarde ? (oui/non) : " BACKUP
if [ "$BACKUP" != "oui" ]; then
    echo "❌ Faites d'abord une sauvegarde avec: cp -r ../slufe ../slufe-backup"
    exit 1
fi

echo ""
read -p "Êtes-vous sûr de vouloir continuer ? (oui/non) : " CONFIRM
if [ "$CONFIRM" != "oui" ]; then
    echo "❌ Opération annulée"
    exit 0
fi

echo ""
echo "🔍 Vérification de git filter-repo..."
if ! command -v git-filter-repo &> /dev/null; then
    echo "❌ git-filter-repo n'est pas installé"
    echo "Installez-le avec: pip3 install git-filter-repo"
    exit 1
fi

echo "✅ git-filter-repo trouvé"
echo ""

# Sauvegarder l'URL du remote
REMOTE_URL=$(git remote get-url origin 2>/dev/null || echo "")

# Taille avant
echo "📊 Taille du dépôt avant nettoyage:"
du -sh .git

echo ""
echo "🧹 Suppression des fichiers médias de l'historique..."

# Supprimer les dossiers médias de l'historique
git filter-repo \
  --path backend/medias --invert-paths \
  --path backend/data --invert-paths \
  --path backend/collections --invert-paths \
  --path backend/logs --invert-paths \
  --path backend/uploads --invert-paths \
  --force

echo ""
echo "🗑️ Nettoyage des objets orphelins..."
git reflog expire --expire=now --all
git gc --prune=now --aggressive

echo ""
echo "📊 Taille du dépôt après nettoyage:"
du -sh .git

echo ""
echo "✅ Nettoyage local terminé !"
echo ""
echo "📤 Prochaines étapes pour pousser vers le dépôt distant:"
echo ""
echo "1. Ajouter le remote:"
if [ -n "$REMOTE_URL" ]; then
    echo "   git remote add origin $REMOTE_URL"
else
    echo "   git remote add origin <URL_DU_DEPOT>"
fi
echo ""
echo "2. Pousser en force:"
echo "   git push origin --force --all"
echo "   git push origin --force --tags"
echo ""
echo "3. Notifier les collaborateurs de re-cloner le dépôt"
echo ""
echo "⚠️ ATTENTION : Les collaborateurs devront supprimer leur copie locale"
echo "   et re-cloner le dépôt après votre push en force"
```

## 🎯 Étapes recommandées (résumé)

### Option A : Nettoyage complet (recommandé)

```bash
# 1. Sauvegarde
cd /home/hmj/Documents/projets
cp -r slufe slufe-backup-$(date +%Y%m%d)

# 2. Installer git filter-repo
pip3 install git-filter-repo

# 3. Créer et exécuter le script
cd slufe
chmod +x cleanup-git-media-history.sh
./cleanup-git-media-history.sh

# 4. Pousser vers le distant
git remote add origin git@github.com:hmzoo/slufe.git
git push origin --force --all
git push origin --force --tags
```

### Option B : Nettoyage simple (moins efficace)

```bash
# 1. Supprimer les fichiers du tracking
./cleanup-git-media.sh

# 2. Commiter
git commit -m "Remove media files from Git tracking"

# 3. Pousser
git push origin main
```

**Note** : L'Option B ne supprime pas les fichiers de l'historique, ils restent dans les anciens commits.

## 📊 Estimation de gain d'espace

Avec 100+ fichiers médias (images/vidéos), vous pouvez gagner :
- **50 MB - 500 MB** : Si ce sont principalement des images
- **500 MB - 5 GB** : Si ce sont des vidéos

## ⚠️ Problèmes potentiels

### 1. Le remote est supprimé par filter-repo
**Solution** : Re-ajouter avec `git remote add origin <URL>`

### 2. Erreur "refusing to merge unrelated histories"
**Solution** : Les collaborateurs doivent re-cloner, pas pull

### 3. Protections de branches sur GitHub/GitLab
**Solution** : Désactiver temporairement les protections dans les settings

### 4. Actions GitHub/pipelines cassées
**Solution** : Elles se relanceront après le push en force

## 🔍 Vérifier le résultat

```bash
# Lister tous les fichiers dans l'historique
git rev-list --objects --all | \
  git cat-file --batch-check='%(objecttype) %(objectname) %(objectsize) %(rest)' | \
  grep -E '\.(jpg|png|mp4|webm)' | \
  sort -k 3 -n -r | \
  head -20

# Si cette commande ne retourne rien, c'est bon !
```

## 📝 Checklist finale

Avant de pousser en force :

- [ ] ✅ Sauvegarde créée
- [ ] ✅ Collaborateurs prévenus
- [ ] ✅ Protections de branches désactivées (si nécessaire)
- [ ] ✅ Nettoyage local testé
- [ ] ✅ Taille du .git réduite significativement
- [ ] ✅ Aucun fichier média dans l'historique
- [ ] ✅ .gitignore correctement configuré

Une fois poussé en force :

- [ ] ✅ Collaborateurs re-clonent le dépôt
- [ ] ✅ Protections de branches réactivées
- [ ] ✅ CI/CD fonctionne à nouveau

---

**Date** : 13 novembre 2025  
**Prêt à utiliser** : Script créé, à exécuter avec précaution
