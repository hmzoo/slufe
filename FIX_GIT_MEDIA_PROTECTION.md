# Fix: Protection des fichiers médias dans Git

## ⚠️ Problème détecté

Des fichiers médias (images/vidéos) sont actuellement **trackés dans Git**, ce qui :
- Augmente la taille du dépôt Git
- Ralentit les opérations Git (clone, pull, push)
- Peut causer des problèmes avec GitHub/GitLab (limites de taille)

**Fichiers trouvés** : Plus de 100 fichiers images/vidéos dans `backend/medias/`

## ✅ Corrections appliquées

### 1. Mise à jour des fichiers .gitignore

#### `.gitignore` racine
```ignore
# Médias et collections
*.jpg
*.jpeg
*.png
*.gif
*.webp
*.bmp
*.svg
*.mp4
*.webm
*.ogg
*.avi
*.mov
*.mkv
*.flv
*.wmv

# Logs de workflows
backend/logs/
```

#### `backend/.gitignore`
```ignore
# Dossiers médias et données
medias/
data/
collections/

# Fichiers médias
*.jpg
*.jpeg
*.png
# ... (tous les formats)
```

#### `frontend/.gitignore`
```ignore
# Fichiers médias (au cas où)
*.jpg
*.jpeg
*.png
# ... (tous les formats)
```

### 2. Script de nettoyage créé

**Fichier** : `cleanup-git-media.sh`

Ce script supprime les fichiers médias du **suivi Git** sans les supprimer du disque.

## 🚀 Comment nettoyer le dépôt

### Étape 1 : Exécuter le script

```bash
cd /home/hmj/Documents/projets/slufe
./cleanup-git-media.sh
```

### Étape 2 : Vérifier les changements

```bash
git status
```

Vous verrez tous les fichiers médias marqués pour suppression (deleted).

### Étape 3 : Commiter

```bash
git commit -m "Remove media files from Git tracking

- Add media file extensions to .gitignore
- Remove tracked media files (kept on disk)
- Prevent future media uploads to Git"
```

### Étape 4 : Push (optionnel)

```bash
git push origin main
```

## 📊 Résultat attendu

**Avant** :
- ❌ 100+ fichiers médias trackés dans Git
- ❌ Dépôt Git volumineux
- ❌ Operations Git lentes

**Après** :
- ✅ Aucun fichier média tracké
- ✅ Dépôt Git léger
- ✅ Operations Git rapides
- ✅ Les médias restent sur le disque local
- ✅ Les nouveaux médias ne seront jamais trackés

## 📝 Formats protégés

### Images
- JPG/JPEG
- PNG
- GIF
- WebP
- BMP
- SVG

### Vidéos
- MP4
- WebM
- OGG
- AVI
- MOV
- MKV
- FLV
- WMV

## 🔒 Dossiers protégés

- `backend/medias/` - Tous les fichiers médias uploadés
- `backend/data/` - Données de workflows
- `backend/collections/` - Collections de médias
- `backend/logs/` - Logs d'exécution
- `backend/uploads/` - Uploads temporaires

## ⚡ Prochaines fois

Les fichiers médias uploadés ne seront **jamais** ajoutés à Git grâce au `.gitignore` mis à jour.

## 🎯 Recommandations

### Pour la production
1. **Stockage séparé** : Utiliser AWS S3, Azure Blob, ou Cloudinary pour les médias
2. **Base de données** : Stocker uniquement les URLs, pas les fichiers
3. **CDN** : Servir les médias via un CDN pour de meilleures performances

### Pour le développement
1. **Médias de test** : Créer un petit jeu de médias de test (< 1MB chacun)
2. **Documentation** : Documenter où obtenir les médias de test
3. **Seeds** : Script pour générer des données de test avec médias

## 📁 Fichiers modifiés

- `.gitignore` (racine) - Ajout formats vidéo + logs
- `backend/.gitignore` - Ajout dossiers + formats médias
- `frontend/.gitignore` - Ajout formats médias
- `cleanup-git-media.sh` - Nouveau script de nettoyage

---

**Date** : 13 novembre 2025  
**Status** : ⚠️ Script prêt, nettoyage à exécuter
