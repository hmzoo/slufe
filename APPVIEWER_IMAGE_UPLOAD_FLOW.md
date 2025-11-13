# 🔄 AppViewer - Image Upload & Workflow Execution Flow

## ❌ Problème Initial

```
❌ Échec du workflow: undefined { error: 'Le workflow doit avoir un ID', task: null }
❌ Erreur lors de l'exécution du workflow: Le workflow doit avoir un ID
```

**Cause**: 
1. Le workflow template n'avait pas d'ID
2. Les images (File objects) étaient envoyées directement au workflow sans être uploadées d'abord

---

## ✅ Solution Implémentée

### New Flow (3 étapes)

```
AppViewer (Formulaire rempli avec File object)
    ↓
executeTemplate()
    ↓
executeWorkflow(workflow, formInputs)
    ↓
┌─────────────────────────────────────────────┐
│ 1️⃣ PRÉPARER LES INPUTS                     │
│  - uploadImage() pour chaque File object   │
│  - Remplacer File par URL uploadée         │
│  - Retourner preparedInputs avec URLs     │
└─────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────┐
│ 2️⃣ CONSTRUIRE LE WORKFLOW                  │
│  - Ajouter un ID unique si manquant        │
│  - Format: template-{timestamp}-{random}   │
│  - Copier les propriétés du template       │
└─────────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────────┐
│ 3️⃣ EXÉCUTER LE WORKFLOW                    │
│  - POST /api/workflow/run                  │
│  - Body JSON: { workflow, inputs }         │
│  - Images déjà uploadées avec URLs         │
└─────────────────────────────────────────────┘
    ↓
Backend traite le workflow → Retourne outputs
    ↓
AppViewer affiche les résultats ✅
```

---

## 📝 Code Changes

### frontend/src/composables/useWorkflowExecution.js

**NEW: uploadImage(imageFile)**
```javascript
const uploadImage = async (imageFile) => {
  const formData = new FormData()
  formData.append('image', imageFile)
  
  const response = await axios.post(`${API_URL}/api/media/upload`, formData)
  return response.data.url || response.data.path
}
```

**NEW: prepareInputs(inputs)**
```javascript
const prepareInputs = async (inputs) => {
  const preparedInputs = {}
  
  for (const [key, value] of Object.entries(inputs)) {
    if (value instanceof File) {
      const imageUrl = await uploadImage(value)
      preparedInputs[key] = imageUrl
    } else if (Array.isArray(value) && value.some(v => v instanceof File)) {
      const uploadedUrls = []
      for (const item of value) {
        if (item instanceof File) {
          uploadedUrls.push(await uploadImage(item))
        } else {
          uploadedUrls.push(item)
        }
      }
      preparedInputs[key] = uploadedUrls
    } else {
      preparedInputs[key] = value
    }
  }
  
  return preparedInputs
}
```

**UPDATED: executeWorkflow(workflow, inputs)**
```javascript
const executeWorkflow = async (workflow, inputs) => {
  // 1️⃣ Préparer les inputs (uploader les images)
  const preparedInputs = await prepareInputs(inputs)
  
  // 2️⃣ Construire le workflow avec ID
  const workflowToExecute = {
    ...workflow,
    id: workflow.id || `template-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    name: workflow.name || `Exécution ${new Date().toLocaleString()}`
  }
  
  // 3️⃣ Exécuter le workflow
  const response = await axios.post(`${API_URL}/api/workflow/run`, {
    workflow: workflowToExecute,
    inputs: preparedInputs
  })
  
  return response.data
}
```

---

## 🧪 Test Flow

### Scenario: Template avec Image Input

**Données**:
- Template: "test edition d image 2"
- Inputs:
  - `image1`: File { name: "test.jpg", size: 12345 }
  - `text1`: "Bonjour"

**Exécution**:

1️⃣ **Préparer les inputs**:
   ```
   📤 Upload de l'image: image1
   ✅ Image uploadée: image1 → http://localhost:3000/uploads/image-abc123.jpg
   ```

2️⃣ **Construire le workflow**:
   ```
   {
     "id": "template-1731522480000-x7k9p2",
     "name": "test edition d image 2",
     "inputs": [...],
     "tasks": [...],
     "outputs": [...]
   }
   ```

3️⃣ **Exécuter le workflow**:
   ```
   POST /api/workflow/run
   {
     "workflow": { id, name, inputs, tasks, outputs },
     "inputs": {
       "image1": "http://localhost:3000/uploads/image-abc123.jpg",
       "text1": "Bonjour"
     }
   }
   ```

4️⃣ **Résultat**:
   ```
   ✅ Exécution réussie!
   Résultats affichés dans AppViewer
   ```

---

## 🔍 Key Points

1. **Workflow ID Generation**:
   - Format: `template-{timestamp}-{random}`
   - Fallback: Utilise `workflow.id` si déjà présent
   - Garantit un ID unique pour chaque exécution

2. **Image Upload**:
   - Endpoint: `POST /api/media/upload`
   - Input: FormData avec key `image`
   - Output: `{ url: "..." }` ou `{ path: "..." }`

3. **Inputs Preparation**:
   - Detects File objects automatiquement
   - Supporte les images individuelles ET les arrays
   - Async/await pour les uploads parallèles possibles

4. **Backward Compatibility**:
   - Si pas d'images → JSON classique
   - Si workflow a déjà un ID → Utilise celui-ci
   - Si images comme URLs → Passe directement

---

## 📊 Logging

Le composable affiche des logs clairs pour le debugging:

```
🚀 Exécution du workflow...
1️⃣ Préparation des inputs...
📤 Upload de l'image: image1
✅ Image uploadée: image1 → http://localhost:3000/uploads/image-abc123.jpg
✅ Inputs préparés: { image1: "...", text1: "Bonjour" }
2️⃣ Construction du workflow...
✅ Workflow construit avec ID: template-1731522480000-x7k9p2
3️⃣ Envoi du workflow au serveur...
✅ Réponse reçue: { outputs: {...} }
```

---

## ✅ Validation Checklist

- [x] uploadImage() prêt
- [x] prepareInputs() prêt
- [x] executeWorkflow() modifié
- [x] Workflow ID generation prêt
- [x] Logging détaillé en place
- [ ] Test end-to-end avec vraie image

**Status**: PRÊT POUR TEST 🚀

