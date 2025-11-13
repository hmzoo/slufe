# Supprimer médias du dépôt distant - Aide-mémoire

## 🚀 Commandes à exécuter

```bash
# 1. Sauvegarde
cd /home/hmj/Documents/projets
cp -r slufe slufe-backup-$(date +%Y%m%d)

# 2. Installer l'outil
pip3 install git-filter-repo

# 3. Exécuter le nettoyage
cd slufe
./cleanup-git-media-history.sh

# 4. Re-ajouter le remote
git remote add origin git@github.com:hmzoo/slufe.git

# 5. Pousser en force
git push origin --force --all
git push origin --force --tags
```

## ⚠️ Rappels importants

1. **Sauvegarder** avant tout
2. **Prévenir** les collaborateurs
3. **Push --force** écrase l'historique distant
4. **Re-cloner** obligatoire pour tous

## 📧 Message pour collaborateurs

```
Le dépôt a été nettoyé. Vous devez re-cloner :

cd ..
rm -rf slufe
git clone git@github.com:hmzoo/slufe.git
```

---

**Fichiers** :
- `cleanup-git-media-history.sh` - Script complet
- `GUIDE_CLEANUP_GIT_HISTORY.md` - Documentation détaillée
- `CLEANUP_REMOTE_SUMMARY.md` - Procédure complète
