# 🐛 Guide de Debug SmallApp

## ⚠️ IMPORTANT : Rafraîchir le Cache

Après modification du code JavaScript, **TOUJOURS** rafraîchir avec :

### Sur Desktop
- **Ctrl + F5** (Windows/Linux)
- **Cmd + Shift + R** (Mac)

### Sur Mobile
1. Ouvrir la console développeur
2. Cocher "Disable cache"
3. Rafraîchir la page

---

## 🔍 Logs à Vérifier

### 1. Au chargement de la page

```javascript
✅ Application initialisée { 
  id: "template_xxx",
  workflow: { inputs: [...], tasks: [...] }
}
```

### 2. Lors de l'exécution

#### Étape 1 : État Initial
```javascript
🚀 Début exécution workflow
📋 state.formInputs: {
  text1: "change colors",
  image1: File { name: "photo.jpg", size: 123456 }  ← File object !
}
📋 state.template.workflow.inputs: [
  { id: "text1", type: "text_input", ... },
  { id: "image1", type: "image_input", ... }
]
```

#### Étape 2 : Upload Images
```javascript
1️⃣ Upload des images...
📤 Upload image: image1
✅ Image uploadée: image1 → /medias/1763234567890_abc.jpg
```

**⚠️ SI PAS DE LOGS D'UPLOAD** → Le fichier n'est pas un `File` object !

#### Étape 3 : Injection
```javascript
2️⃣ Injection des données dans le workflow...
  imageUrls collectées: { image1: "/medias/1763234567890_abc.jpg" }
  state.formInputs: { text1: "...", image1: File {...} }
  
  workflow.inputs AVANT injection: [
    {
      "id": "text1",
      "type": "text_input",
      "userInput": ""    ← VIDE AVANT
    },
    {
      "id": "image1",
      "type": "image_input",
      "selectedImage": ""  ← VIDE AVANT
    }
  ]
  
  ✅ Texte injecté dans workflow: text1 = change colors
  ✅ Image injectée dans workflow: image1 = /medias/1763234567890_abc.jpg
  
  workflow.inputs APRÈS injection: [
    {
      "id": "text1",
      "type": "text_input",
      "userInput": "change colors"  ← REMPLI APRÈS
    },
    {
      "id": "image1",
      "type": "image_input",
      "selectedImage": "/medias/1763234567890_abc.jpg"  ← REMPLI APRÈS
    }
  ]
```

**⚠️ SI selectedImage RESTE VIDE** → Problème d'injection !

#### Étape 4 : Envoi Backend
```javascript
3️⃣ Envoi du workflow au backend...
📦 Workflow complet: {
  "id": "template_xxx",
  "name": "nice edit",
  "inputs": [
    {
      "id": "image1",
      "selectedImage": "/medias/1763234567890_abc.jpg"  ← DOIT ÊTRE LÀ
    }
  ]
}
```

---

## ❌ Problèmes Courants

### Problème 1 : Cache JavaScript

**Symptôme :**
```
❌ selectedImage: ''  (toujours vide)
```

**Cause :** Le navigateur utilise l'ancienne version de `app.js`

**Solution :**
1. **Ctrl + F5** pour vider le cache
2. Ou ouvrir DevTools → Network → Cocher "Disable cache"
3. Ou ajouter version query : `app.js?v=2`

---

### Problème 2 : File Object Perdu

**Symptôme :**
```
1️⃣ Upload des images...
(pas de logs d'upload)
```

**Cause :** `state.formInputs[key]` n'est pas un `File`

**Debug :**
```javascript
console.log('Type:', typeof state.formInputs.image1)
console.log('Is File?', state.formInputs.image1 instanceof File)
```

**Solution :** Vérifier `createImageInput()` pour s'assurer qu'on stocke bien le `File`

---

### Problème 3 : ID Input Mismatch

**Symptôme :**
```
✅ Image uploadée: image1 → /medias/xxx.jpg
(pas de log "Image injectée")
```

**Cause :** L'ID dans `imageUrls` ne correspond pas à l'ID dans `workflow.inputs`

**Debug :**
```javascript
console.log('imageUrls keys:', Object.keys(imageUrls))
console.log('workflow.inputs IDs:', workflow.inputs.map(i => i.id))
```

**Solution :** Vérifier que les IDs correspondent exactement (case-sensitive)

---

### Problème 4 : Spread Operator Shallow Copy

**Symptôme :**
```
workflow.inputs AVANT injection: [{ selectedImage: "/medias/xxx.jpg" }]
workflow.inputs APRÈS injection: [{ selectedImage: "/medias/xxx.jpg" }]
(déjà rempli avant ?!)
```

**Cause :** `{...state.template.workflow}` fait une copie superficielle

**Solution :** Utiliser `JSON.parse(JSON.stringify())` si nécessaire

---

## 🧪 Test Complet

### 1. Ouvrir Console Développeur
- **F12** (Chrome/Firefox)
- Onglet "Console"

### 2. Rafraîchir avec cache vide
- **Ctrl + F5**

### 3. Vérifier chargement
```
✅ Application initialisée
```

### 4. Remplir formulaire
- Ajouter une image (via file picker ou caméra)
- Remplir le champ texte

### 5. Vérifier File Object
Dans la console :
```javascript
state.formInputs
// Doit afficher : { image1: File {...}, text1: "..." }
```

### 6. Cliquer "Exécuter"

### 7. Vérifier les logs dans l'ordre
```
🚀 Début exécution workflow
1️⃣ Upload des images...
📤 Upload image: image1
✅ Image uploadée: image1 → /medias/xxx.jpg
2️⃣ Injection des données dans le workflow...
  ✅ Image injectée dans workflow: image1 = /medias/xxx.jpg
  ✅ Texte injecté dans workflow: text1 = ...
3️⃣ Envoi du workflow au backend...
📦 Workflow complet: { "inputs": [{ "selectedImage": "/medias/xxx.jpg" }] }
```

### 8. Vérifier Backend Logs
```
📋 Workflow reçu { workflowId: 'template_xxx' }
📸 InputImageTask - inputs: {
  selectedImage: '/medias/xxx.jpg',  ← DOIT ÊTRE REMPLI
}
✅ Image chargée: /medias/xxx.jpg
✅ Tâche terminée: image1
```

---

## 🔧 Si Toujours Bloqué

### Option 1 : Version Query String

Modifier `index.html` :
```html
<!-- Forcer rechargement -->
<script src="app.js?v=20251114-1500"></script>
```

### Option 2 : Hard Reload

1. Ouvrir DevTools (F12)
2. Clic droit sur le bouton refresh
3. Choisir "Empty Cache and Hard Reload"

### Option 3 : Navigation Privée

Tester dans une fenêtre de navigation privée (Ctrl+Shift+N)

---

## 📞 Partager les Logs

Si le problème persiste, copier ces logs :

```javascript
// Console Frontend
🚀 Début exécution workflow
...
📦 Workflow complet: { ... }

// Console Backend
📋 Workflow reçu { ... }
📸 InputImageTask - inputs: { ... }
```

Et vérifier notamment :
- ✅ `imageUrls` contient bien les URLs
- ✅ `workflow.inputs APRÈS injection` a `selectedImage` rempli
- ✅ Le backend reçoit `selectedImage` non vide

---

**Date :** 14 novembre 2025  
**Logs ajoutés dans :** `app.js` lignes 604-674
