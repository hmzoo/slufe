# ✅ Checklist Test SmallApp

## 🔄 Étape 1 : Rafraîchir le Cache

**OBLIGATOIRE** après modification du code !

- Desktop : **Ctrl + F5** (Windows/Linux) ou **Cmd + Shift + R** (Mac)
- Mobile : DevTools → Cocher "Disable cache" → Rafraîchir

---

## 📱 Étape 2 : Ouvrir l'Application

URL : `https://192.168.24.210/smallapps/`

Console développeur : **F12** → Onglet "Console"

---

## ✅ Étape 3 : Vérifier l'Initialisation

**Logs attendus :**
```
✅ Application initialisée { id: "template_xxx" }
```

Si erreur → Template.json manquant ou mal formé

---

## 📝 Étape 4 : Remplir le Formulaire

1. **Ajouter une image** :
   - Clic sur zone upload, ou
   - Drag & drop, ou
   - Bouton caméra (mobile)

2. **Vérifier dans console** :
   ```javascript
   state.formInputs.image1
   // Doit afficher : File { name: "...", size: ... }
   ```

3. **Remplir le texte** : Ex. "side view"

---

## 🚀 Étape 5 : Exécuter

Cliquer "Exécuter le Workflow"

**Logs attendus (dans l'ordre) :**

```javascript
🚀 Début exécution workflow
📋 state.formInputs: { text1: "side view", image1: File }

1️⃣ Upload des images...
📤 Upload image: image1
✅ Image uploadée: image1 → /medias/1763234567890_abc.jpg

2️⃣ Injection des données dans le workflow...
  imageUrls collectées: { image1: "/medias/1763234567890_abc.jpg" }
  ✅ Texte injecté dans workflow: text1 = side view
  ✅ Image injectée dans workflow: image1 = /medias/1763234567890_abc.jpg

3️⃣ Envoi du workflow au backend...
📦 Workflow complet: {
  "id": "template_xxx",
  "inputs": [
    { "userInput": "side view" },
    { "selectedImage": "/medias/1763234567890_abc.jpg" }
  ]
}
```

---

## 🎯 Étape 6 : Vérifier Backend

**Terminal backend (node server.js) :**

```
📋 Workflow reçu { workflowId: 'template_xxx', tasksCount: 1 }
📥 Exécution des inputs (2)
📸 InputImageTask - inputs: {
  selectedImage: '/medias/1763234567890_abc.jpg'  ← DOIT ÊTRE REMPLI
}
✅ Image chargée: /medias/1763234567890_abc.jpg
✅ Tâche terminée: image1
✅ Workflow terminé avec succès
```

---

## ❌ Problèmes Courants

### Problème 1 : `undefined` dans upload
```
✅ Image uploadée: image1 → undefined  ❌
```

**Cause :** Ancien code en cache  
**Solution :** Ctrl + F5 ou navigation privée

---

### Problème 2 : `selectedImage: ''` vide
```
  workflow.inputs APRÈS injection: [
    { "selectedImage": "" }  ❌
  ]
```

**Cause :** imageUrls vide ou IDs ne correspondent pas  
**Debug :**
```javascript
console.log('imageUrls:', imageUrls)
console.log('workflow.inputs IDs:', workflow.inputs.map(i => i.id))
```

---

### Problème 3 : Erreur 404 ou 500
```
POST /api/workflow/run [HTTP/2 500]
```

**Causes possibles :**
- Backend non démarré
- Workflow mal formé
- Images non chargées

**Vérifier :**
- Backend tourne : `node backend/server.js`
- Logs backend pour voir l'erreur exacte

---

## ✅ Succès Complet

**Frontend :**
```javascript
✅ Image uploadée: image1 → /medias/xxx.jpg
✅ Image injectée dans workflow
📦 Workflow complet envoyé
```

**Backend :**
```
✅ Image chargée: /medias/xxx.jpg
✅ Tâche terminée: image1
✅ Workflow terminé avec succès
```

**Interface :**
- Résultats affichés
- Images de sortie visibles
- Bouton téléchargement actif

---

## 🎉 Si Tout Fonctionne

**SmallApp est opérationnel ! Tu peux :**

1. Créer d'autres templates dans `template.json`
2. Déployer sur un serveur
3. Partager l'URL : `https://IP/smallapps/`

---

**Date :** 14 novembre 2025  
**Version :** Production Ready ✅
