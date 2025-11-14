# 🖼️ Fix Injection des Images dans le Workflow

## ❌ Problème Initial

```
❌ Erreur InputImageTask: Error: Aucune image fournie pour la tâche image_input
📸 InputImageTask - inputs: {
  image: undefined,     ← PAS D'IMAGE !
  selectedImage: '',    ← VIDE !
}
```

**Le backend ne recevait pas les images** malgré l'upload réussi.

---

## 🔍 Analyse Comparative

### Comment AppViewer fonctionne ✅

```javascript
// 1️⃣ Upload images → récupère URLs
const imageUrls = await prepareImageUrls(inputs)
// → { image1: "/medias/xxx.jpg" }

// 2️⃣ Injecte URLs dans workflow.inputs
const workflowCopy = JSON.parse(JSON.stringify(workflow))
for (const inputTask of workflowCopy.inputs) {
  if (inputTask.type === 'image_input') {
    if (imageUrls[inputTask.id]) {
      inputTask.selectedImage = imageUrls[inputTask.id]  // ✅ INJECTION ICI
    }
  }
}

// 3️⃣ Envoie workflow avec URLs dedans
await api.post('/workflow/run', {
  workflow: workflowCopy,  // ← Contient selectedImage
  inputs: {}
})
```

### Comment SmallApp fonctionnait (AVANT) ❌

```javascript
// 1️⃣ Upload images → récupère URLs
const uploadResponse = await axios.post('/api/media/upload', imageFormData)
const imageUrl = uploadResponse.data.filename

// 2️⃣ Ajoute URL en paramètre FormData (SÉPARÉ du workflow)
formData.append('image1', imageUrl)  // ❌ PAS DANS LE WORKFLOW

// 3️⃣ Ajoute workflow SANS les URLs
formData.append('workflow', JSON.stringify(workflow))  // ❌ Vide

// 4️⃣ Envoie en multipart
await axios.post('/api/workflow/run', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
})
```

**Problème :** Le workflow reçu par le backend n'avait pas `selectedImage` renseigné !

---

## ✅ Solution Appliquée

### Nouveau Code SmallApp (APRÈS)

```javascript
// 1️⃣ UPLOAD DES IMAGES
const imageUrls = {}
for (const [key, value] of Object.entries(state.formInputs)) {
  if (value instanceof File) {
    const uploadResponse = await axios.post('/api/media/upload', imageFormData)
    imageUrls[key] = uploadResponse.data.filename
    // → imageUrls = { image1: "/medias/xxx.jpg" }
  }
}

// 2️⃣ INJECTION DANS LE WORKFLOW
const workflow = {
  ...state.template.workflow,
  id: state.template.id || `workflow_${Date.now()}`
}

for (const input of workflow.inputs) {
  if (input.type === 'image_input') {
    if (imageUrls[input.id]) {
      input.selectedImage = imageUrls[input.id]  // ✅ INJECTION
    }
  } else if (input.type === 'text_input') {
    if (state.formInputs[input.id] !== undefined) {
      input.userInput = state.formInputs[input.id]  // ✅ INJECTION
    }
  }
}

// 3️⃣ ENVOI EN JSON (pas multipart)
await axios.post('/api/workflow/run', {
  workflow: workflow,  // ← Contient selectedImage + userInput
  inputs: {}
})
```

---

## 📊 Avant / Après

### Structure du Workflow Envoyé

#### AVANT ❌
```json
{
  "workflow": {
    "id": "template_xxx",
    "inputs": [
      {
        "id": "image1",
        "type": "image_input",
        "selectedImage": "",        ← VIDE !
        "defaultImage": ""
      },
      {
        "id": "text1",
        "type": "text_input",
        "userInput": ""             ← VIDE !
      }
    ]
  },
  "image1": "/medias/xxx.jpg",      ← Séparé, pas exploité
  "text1": "hello"                  ← Séparé, pas exploité
}
```

#### APRÈS ✅
```json
{
  "workflow": {
    "id": "template_xxx",
    "inputs": [
      {
        "id": "image1",
        "type": "image_input",
        "selectedImage": "/medias/xxx.jpg",  ← RENSEIGNÉ !
        "defaultImage": ""
      },
      {
        "id": "text1",
        "type": "text_input",
        "userInput": "hello"                 ← RENSEIGNÉ !
      }
    ]
  },
  "inputs": {}
}
```

---

## 🎯 Points Clés

### 1. Upload d'abord, injection ensuite
```javascript
// ✅ BON ORDRE
const imageUrls = await uploadAllImages()  // 1️⃣
injectInWorkflow(workflow, imageUrls)      // 2️⃣
sendWorkflow(workflow)                      // 3️⃣
```

### 2. Injection dans workflow.inputs[]
```javascript
// workflow.inputs est un TABLEAU d'objets input
workflow.inputs = [
  {
    id: "image1",
    type: "image_input",
    selectedImage: "/medias/xxx.jpg"  // ← Injecté ici
  }
]
```

### 3. Envoi en JSON, pas multipart
```javascript
// ❌ ANCIEN (multipart)
const formData = new FormData()
formData.append('workflow', JSON.stringify(workflow))
await axios.post('/workflow/run', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
})

// ✅ NOUVEAU (JSON)
await axios.post('/workflow/run', {
  workflow: workflow,
  inputs: {}
})
```

---

## 🧪 Vérification

### Logs Attendus

```javascript
🚀 Début exécution workflow
1️⃣ Upload des images...
📤 Upload image: image1
✅ Image uploadée: image1 → /medias/1763234567890_abc123.jpg

2️⃣ Injection des données dans le workflow...
  ✅ Image injectée dans workflow: image1 = /medias/1763234567890_abc123.jpg
  ✅ Texte injecté dans workflow: text1 = change the colors

3️⃣ Envoi du workflow au backend...
📦 Workflow inputs: [
  {
    id: "image1",
    type: "image_input",
    selectedImage: "/medias/1763234567890_abc123.jpg"  ← OK !
  },
  {
    id: "text1",
    type: "text_input",
    userInput: "change the colors"                     ← OK !
  }
]
```

### Backend Logs Attendus

```javascript
📋 Workflow reçu { workflowId: 'template_xxx', tasksCount: 1 }
📥 Exécution des inputs (2)
📋 Exécution tâche: image1
📸 InputImageTask - inputs: {
  image: undefined,
  selectedImage: '/medias/1763234567890_abc123.jpg',  ← TROUVÉ !
  defaultImage: ''
}
✅ Image chargée: /medias/1763234567890_abc123.jpg
✅ Tâche terminée: image1
```

---

## 📁 Fichiers Modifiés

- **`smallapps/app.js`** (lignes 593-653)
  - Fonction `executeWorkflow()`
  - Ajout phase 1️⃣ : Upload images
  - Ajout phase 2️⃣ : Injection dans workflow
  - Modification phase 3️⃣ : Envoi JSON au lieu de multipart

---

## 🔗 Références

- **AppViewer** : `frontend/src/composables/useWorkflowExecution.js`
  - Lignes 23-60 : `uploadImage()` et `prepareImageUrls()`
  - Lignes 98-149 : `injectFormDataIntoWorkflow()`
  - Lignes 156-207 : `executeWorkflow()`

- **Backend** : `backend/services/tasks/InputImageTask.js`
  - Ligne 35 : Validation `selectedImage` ou `defaultImage` requis

---

**Date :** 14 novembre 2025  
**Status :** ✅ Corrigé  
**Type :** Bug critique - injection données manquante
