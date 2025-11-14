# 🔧 Fix Upload Response Structure

## ❌ Problème

```javascript
✅ Image uploadée: image1 → undefined
imageUrls collectées: { image1: undefined }
```

L'URL de l'image uploadée était `undefined` !

---

## 🔍 Cause

### Code Ancien (AVANT)

```javascript
const uploadResponse = await axios.post('/api/media/upload', imageFormData)
imageUrls[key] = uploadResponse.data.filename  // ❌ filename n'existe pas !
```

### Structure Réelle de la Réponse API

L'API `/api/media/upload` renvoie **différentes structures** selon le champ utilisé :

#### Type 'single' (champ 'file')

```json
{
  "success": true,
  "type": "single",
  "media": {
    "url": "/medias/1763234567890_abc.jpg",
    "filename": "1763234567890_abc.jpg",
    "mimetype": "image/jpeg",
    "size": 123456
  }
}
```

#### Type 'fields' (champ 'image', 'video', etc.)

```json
{
  "success": true,
  "type": "fields",
  "results": {
    "image": {
      "uploaded": [
        {
          "url": "/medias/1763234567890_abc.jpg",
          "filename": "1763234567890_abc.jpg",
          "mimetype": "image/jpeg",
          "size": 123456
        }
      ],
      "errors": []
    }
  },
  "summary": {
    "total_uploaded": 1,
    "total_errors": 0
  }
}
```

**SmallApp utilise le champ `image`** → Type **'fields'** !

---

## ✅ Solution

### Code Nouveau (APRÈS)

```javascript
const uploadResponse = await axios.post('/api/media/upload', imageFormData)

// Extraire l'URL selon la structure
let imageUrl = null
if (uploadResponse.data.success) {
  // Type 'single': { media: { url } }
  if (uploadResponse.data.type === 'single' && 
      uploadResponse.data.media?.url) {
    imageUrl = uploadResponse.data.media.url
  }
  // Type 'fields': { results: { image: { uploaded: [{url}] } } }
  else if (uploadResponse.data.type === 'fields' && 
           uploadResponse.data.results?.image?.uploaded?.[0]?.url) {
    imageUrl = uploadResponse.data.results.image.uploaded[0].url
  }
  // Fallback: URL à la racine
  else if (uploadResponse.data.url) {
    imageUrl = uploadResponse.data.url
  }
}

if (!imageUrl) {
  throw new Error('Impossible d\'extraire l\'URL de l\'image uploadée')
}

imageUrls[key] = imageUrl
console.log(`✅ Image uploadée: ${key} → ${imageUrl}`)
```

---

## 📊 Comparaison AppViewer vs SmallApp

### AppViewer

**Code :** `frontend/src/composables/useWorkflowExecution.js` lignes 23-60

```javascript
const uploadImage = async (imageFile) => {
  const formData = new FormData()
  formData.append('file', imageFile)  // ← Champ 'file'

  const response = await api.post('/media/upload', formData)
  
  // Gère les 3 structures possibles
  if (response.data.success) {
    let url = null
    
    if (response.data.type === 'fields' && 
        response.data.results?.file?.uploaded?.[0]?.url) {
      url = response.data.results.file.uploaded[0].url
    }
    else if (response.data.type === 'single' && 
             response.data.media?.url) {
      url = response.data.media.url
    }
    else if (response.data.url) {
      url = response.data.url
    }
    
    return url
  }
}
```

### SmallApp (NOUVEAU)

**Code :** `smallapps/app.js` lignes 614-641

```javascript
const imageFormData = new FormData()
imageFormData.append('image', value)  // ← Champ 'image'

const uploadResponse = await axios.post('/api/media/upload', imageFormData)

// Même logique d'extraction que AppViewer
let imageUrl = null
if (uploadResponse.data.success) {
  // Type 'single'
  if (uploadResponse.data.type === 'single' && 
      uploadResponse.data.media?.url) {
    imageUrl = uploadResponse.data.media.url
  }
  // Type 'fields' (image au lieu de file)
  else if (uploadResponse.data.type === 'fields' && 
           uploadResponse.data.results?.image?.uploaded?.[0]?.url) {
    imageUrl = uploadResponse.data.results.image.uploaded[0].url
  }
  // Fallback
  else if (uploadResponse.data.url) {
    imageUrl = uploadResponse.data.url
  }
}
```

**Différence :** Champ `image` au lieu de `file`, donc path différent dans `results`

---

## 🧪 Test de Validation

### Logs Attendus

```javascript
🚀 Début exécution workflow
📋 state.formInputs: { image1: File {...}, text1: "..." }

1️⃣ Upload des images...
📤 Upload image: image1
✅ Image uploadée: image1 → /medias/1763234567890_abc.jpg  ← URL VALIDE

2️⃣ Injection des données dans le workflow...
  imageUrls collectées: { image1: "/medias/1763234567890_abc.jpg" }  ← OK
  ✅ Image injectée dans workflow: image1 = /medias/1763234567890_abc.jpg

3️⃣ Envoi du workflow au backend...
📦 Workflow complet: {
  "inputs": [
    {
      "id": "image1",
      "selectedImage": "/medias/1763234567890_abc.jpg"  ← REMPLI
    }
  ]
}
```

### Backend Logs Attendus

```
📋 Workflow reçu { workflowId: 'template_xxx' }
📸 InputImageTask - inputs: {
  selectedImage: '/medias/1763234567890_abc.jpg',  ← TROUVÉ
}
✅ Image chargée depuis: /medias/1763234567890_abc.jpg
✅ Tâche terminée: image1
```

---

## 📋 Résumé des Corrections

### Fix 1 : API Endpoint URLs ✅
- `/medias/upload` → `/api/media/upload`
- `/workflows/run` → `/api/workflow/run`

### Fix 2 : Workflow ID ✅
- Ajout automatique de `workflow.id`

### Fix 3 : Injection Images ✅
- Upload d'abord → URLs
- Injection dans `workflow.inputs[].selectedImage`
- Envoi en JSON au lieu de multipart

### Fix 4 : Upload Response Structure ✅
- Extraction correcte de l'URL selon le type de réponse
- Support des types 'single' et 'fields'
- Gestion du champ 'image' au lieu de 'file'

---

## 🔗 Références

- **Backend API** : `backend/routes/mediaUnified.js` lignes 47-120
  - Logique de détection du type d'upload
  - Structures de réponse selon les champs

- **AppViewer Reference** : `frontend/src/composables/useWorkflowExecution.js`
  - Ligne 26 : `formData.append('file', imageFile)`
  - Lignes 38-48 : Extraction multi-structure

- **SmallApp Fixed** : `smallapps/app.js`
  - Ligne 616 : `imageFormData.append('image', value)`
  - Lignes 620-640 : Extraction adaptée au champ 'image'

---

**Date :** 14 novembre 2025  
**Status :** ✅ Corrigé  
**Type :** Bug critique - extraction URL incorrecte
