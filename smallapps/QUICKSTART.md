# 🚀 SmallApp - Guide de Démarrage Rapide

## En 3 Étapes

### 1️⃣ Démarrer le Backend

```bash
cd backend/
node server.js
```

Le backend démarre sur `http://localhost:3000`

---

### 2️⃣ Accéder à SmallApp

**Option A - Via le Backend (Recommandé)**

Ouvrir dans le navigateur :
```
http://localhost:3000/smallapps/
```

**Option B - Serveur Simple**

Dans un nouveau terminal :
```bash
cd smallapps/
python3 -m http.server 8080
```

Ouvrir : `http://localhost:8080`

---

### 3️⃣ Tester sur Mobile (HTTPS)

Pour tester la caméra sur mobile, utiliser le reverse proxy HTTPS :

```bash
# À la racine du projet
sudo ./setup-https-proxy.sh
```

Puis sur mobile, ouvrir :
```
https://192.168.x.x/smallapps/
```

*(Remplacer 192.168.x.x par l'IP affichée par le script)*

**Accepter le certificat auto-signé :**
- Sur le mobile : "Avancé" → "Continuer"

---

## 🎯 Modifier le Template

Éditer le fichier `template.json` pour changer l'application :

```json
{
  "name": "Mon App Perso",
  "description": "Description...",
  "workflow": {
    "inputs": [...],
    "tasks": [...],
    "outputs": [...]
  }
}
```

Recharger la page (F5) pour voir les changements.

---

## 🔍 Vérifier que ça Marche

### Checklist

- [ ] Backend démarré (`node server.js`)
- [ ] SmallApp accessible dans le navigateur
- [ ] Le titre du template s'affiche
- [ ] Les champs du formulaire sont visibles
- [ ] Upload d'image fonctionne (drag & drop)
- [ ] Bouton "Exécuter" devient actif quand le formulaire est rempli
- [ ] L'exécution affiche des résultats

### Sur Mobile HTTPS

- [ ] Reverse proxy configuré (`./setup-https-proxy.sh`)
- [ ] Accès HTTPS depuis le mobile
- [ ] Certificat accepté
- [ ] Bouton "Prendre une photo" visible
- [ ] Bouton "Caméra frontale" visible (mobile uniquement)
- [ ] Caméra s'ouvre correctement
- [ ] Photo capturée et utilisée dans le formulaire

---

## 🐛 Problèmes Courants

### "Impossible de charger le template"

✅ Vérifier que `template.json` existe  
✅ Valider le JSON sur [jsonlint.com](https://jsonlint.com)

### "Cannot POST /workflows/run"

✅ Backend non démarré  
✅ Lancer : `cd backend && node server.js`

### Caméra ne fonctionne pas

✅ Utiliser HTTPS ou localhost  
✅ Sur mobile : HTTPS obligatoire  
✅ Vérifier les permissions caméra

---

## 📚 Plus d'Infos

Voir le fichier `README.md` complet pour :
- Personnalisation avancée
- Exemples de templates
- Déploiement en production
- Création de PWA

---

**Prêt à créer ! 🎨**
