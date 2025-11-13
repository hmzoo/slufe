# Résumé: Supprimer médias du dépôt distant

## 🎯 Objectif

Supprimer les 100+ fichiers médias du **dépôt distant GitHub/GitLab** et de **tout l'historique Git**.

## ⚠️ IMPORTANT

Cette opération :
- ❌ **Réécrit l'historique Git** (tous les commits changent)
- ❌ Nécessite un **push --force**
- ❌ Les collaborateurs doivent **re-cloner** le dépôt
- ✅ Réduit significativement la taille du dépôt

## 🚀 Procédure complète

### 1️⃣ Faire une sauvegarde

```bash
cd /home/hmj/Documents/projets
cp -r slufe slufe-backup-$(date +%Y%m%d)
```

### 2️⃣ Installer git filter-repo

```bash
# Option 1 : Avec pip
pip3 install git-filter-repo

# Option 2 : Avec apt
sudo apt-get install git-filter-repo
```

### 3️⃣ Exécuter le script

```bash
cd /home/hmj/Documents/projets/slufe
./cleanup-git-media-history.sh
```

Le script va :
- ✅ Vérifier les prérequis
- ✅ Afficher la taille actuelle
- ✅ Supprimer les dossiers médias de l'historique
- ✅ Nettoyer les objets orphelins
- ✅ Afficher la nouvelle taille

### 4️⃣ Pousser vers le distant

```bash
# Ajouter le remote (supprimé par sécurité)
git remote add origin git@github.com:hmzoo/slufe.git

# Pousser en FORCE
git push origin --force --all
git push origin --force --tags
```

### 5️⃣ Notifier les collaborateurs

Envoyer ce message :

```
⚠️ Le dépôt Git a été nettoyé - Action requise

L'historique Git a été réécrit pour supprimer les fichiers médias.

VOUS DEVEZ re-cloner le dépôt:

  cd ..
  rm -rf slufe
  git clone git@github.com:hmzoo/slufe.git
  cd slufe

⚠️ Ne faites PAS 'git pull', ça ne fonctionnera pas!
```

## 📊 Résultats attendus

**Avant** :
- ❌ Dépôt volumineux (100+ fichiers médias)
- ❌ Clone lent
- ❌ Push/Pull lents

**Après** :
- ✅ Dépôt léger
- ✅ Clone rapide
- ✅ Push/Pull rapides
- ✅ Gain de 50 MB à plusieurs GB

## 🔍 Vérifier le nettoyage

Après le push, vérifier qu'il ne reste plus de médias :

```bash
git rev-list --objects --all | \
  git cat-file --batch-check='%(objecttype) %(objectname) %(objectsize) %(rest)' | \
  grep -E '\.(jpg|png|mp4|webm)'

# Si cette commande ne retourne RIEN, c'est parfait !
```

## ⚡ Alternative rapide (moins efficace)

Si vous ne voulez pas réécrire l'historique :

```bash
# Supprimer du tracking actuel seulement
./cleanup-git-media.sh
git commit -m "Remove media files from Git tracking"
git push origin main
```

**Note** : Les médias resteront dans l'historique des anciens commits.

## 🆘 En cas de problème

### Erreur "refusing to merge unrelated histories"

**Cause** : Tentative de pull après un push --force

**Solution** : Re-cloner le dépôt (ne pas pull)

### Remote supprimé

**Cause** : git filter-repo supprime les remotes par sécurité

**Solution** : `git remote add origin <URL>`

### Protections de branches

**Cause** : GitHub/GitLab empêche le push --force

**Solution** : 
1. Aller dans Settings → Branches
2. Désactiver temporairement les protections
3. Push --force
4. Réactiver les protections

## 📋 Checklist

Avant d'exécuter :
- [ ] ✅ Sauvegarde créée
- [ ] ✅ git filter-repo installé
- [ ] ✅ Collaborateurs prévenus
- [ ] ✅ Personne ne travaille sur le dépôt

Après exécution :
- [ ] ✅ Script exécuté sans erreur
- [ ] ✅ Taille du .git réduite
- [ ] ✅ Remote rajouté
- [ ] ✅ Push --force effectué
- [ ] ✅ Vérification : aucun média dans l'historique
- [ ] ✅ Collaborateurs ont re-cloné

---

**Fichiers créés** :
- `cleanup-git-media-history.sh` - Script automatisé
- `GUIDE_CLEANUP_GIT_HISTORY.md` - Guide détaillé

**Prêt à exécuter** ✅
