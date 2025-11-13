# 🔧 AppViewer - Correction de l'Architecture Workflow (FINAL)

## 📚 Compréhension Acquise

Les workflows SLUFE ne fonctionnent **PAS** avec une simple interface de formulaire:

### ❌ Fausse Approche (Avant)
```
AppViewer → Recueille formInputs → Passe au backend
❌ Le backend s'attend à des données dans workflow.inputs[0].selectedImage
❌ Les références variables ne sont pas résolues
❌ Les tâches input ne reçoivent rien
```

### ✅ Vraie Approche (Maintenant)

Les workflows ont une **structure séquentielle avec tâches qui se référencent**:

```
Workflow.inputs[0] = Tâche image_input (exécutée par ImageInputTask)
  ↓ Retourne { image: URL }
  ↓
Context.image1 = { image: URL }
  ↓
Workflow.tasks[0] = Tâche edit_image avec "{{image1.image}}"
  ↓ Backend résout la variable
  ↓
EditImageTask reçoit l'URL résolue
```

## 🛠️ Changes Implementés

### 1. useWorkflowExecution.js - 3 Nouvelles Fonctions

#### uploadImage(imageFile)
```javascript
// Upload un fichier image
// Retourne: URL de l'image uploadée
const imageUrl = await uploadImage(fileObject)
```

#### prepareImageUrls(inputs)
```javascript
// Parcourt les inputs
// Pour chaque File object, l'upload
// Retourne: { imageId: URL, ... }
const imageUrls = await prepareImageUrls(formInputs)
// Résultat: { image1: "http://...", image2: "http://..." }
```

#### injectFormDataIntoWorkflow(workflow, inputs, imageUrls)
```javascript
// Crée une copie du workflow
// Injecte les données dans les tâches input:
//   - image_input.selectedImage = imageUrl
//   - text_input.userInput = textValue
// Retourne: Workflow modifié
const workflowToExecute = injectFormDataIntoWorkflow(...)
```

#### executeWorkflow(workflow, inputs) - REWRITE
```javascript
// OLD: Envoyait simplement inputs au backend
// NEW: 
//   1. Upload des images → imageUrls
//   2. Injection dans workflow.inputs
//   3. Exécution du workflow modifié (PAS d'inputs second parameter!)
```

### 2. AppViewer.vue - Extraction des Tâches Input

L'extraction cherche maintenant dans **TOUS les cas**:
1. workflow.inputs (inputs généraux)
2. workflow.tasks pour les tâches type "..._input"

Cela remplit le formulaire AppViewer avec tous les champs à remplir.

## 📊 Flow Complet Exemple

### Template Original
```json
{
  "workflow": {
    "id": "template-1763048377934-jt9opj",
    "inputs": [
      {
        "id": "image1",
        "type": "image_input",
        "selectedImage": ""
      },
      {
        "id": "text1",
        "type": "text_input",
        "userInput": ""
      }
    ],
    "tasks": [
      {
        "id": "edit1",
        "type": "edit_image",
        "image1": "{{image1.image}}",
        "editPrompt": "{{text1.text}}"
      }
    ]
  }
}
```

### Utilisateur Remplit le Formulaire
```javascript
formInputs = {
  image1: File { name: "photo.jpg" },
  text1: "Convert to sketch style"
}
```

### AppViewer Appelle executeWorkflow()
```javascript
await executeWorkflow(workflow, formInputs)
```

### À l'Intérieur du Composable

**Étape 1: Upload des images**
```javascript
const imageUrls = await prepareImageUrls(formInputs)
// Résultat: { image1: "http://localhost:3000/uploads/abc123.jpg" }
```

**Étape 2: Injection dans le workflow**
```javascript
const workflowToExecute = injectFormDataIntoWorkflow(
  workflow,
  formInputs,
  imageUrls
)

// workflow.inputs[0] devient:
// {
//   "id": "image1",
//   "type": "image_input",
//   "selectedImage": "http://localhost:3000/uploads/abc123.jpg"  ← INJECTÉ
// }

// workflow.inputs[1] devient:
// {
//   "id": "text1",
//   "type": "text_input",
//   "userInput": "Convert to sketch style"  ← INJECTÉ
// }
```

**Étape 3: Exécution**
```javascript
axios.post('/api/workflow/run', {
  workflow: workflowToExecute
  // ← PAS D'INPUTS SÉPARÉS! Tout est dans le workflow
})
```

### Backend Exécute

**1. Tâche image1 (ImageInputTask)**
- Reçoit: `{ selectedImage: "http://..." }`
- Retourne: `{ image: "http://..." }`
- Contexte: `{ image1: { image: "http://..." } }`

**2. Tâche text1 (TextInputTask)**
- Reçoit: `{ userInput: "Convert to sketch style" }`
- Retourne: `{ text: "Convert to sketch style" }`
- Contexte: `{ ..., text1: { text: "Convert to sketch style" } }`

**3. Tâche edit1 (EditImageTask)**
- Reçoit: `{ image1: "{{image1.image}}", editPrompt: "{{text1.text}}" }`
- Résout: `{ image1: "http://...", editPrompt: "Convert to sketch style" }`
- Exécute l'édition ✅

## ✅ Points Clés Fixes

| Problème | Solution |
|----------|----------|
| Images jamais uploadées | Maintenant uploadées dans prepareImageUrls() |
| Données pas dans workflow.inputs | Injectées dans injectFormDataIntoWorkflow() |
| ID workflow manquant | Généré si absent |
| Variables pas résolues | Le backend les résout (on envoie le bon format) |
| Tâches input ne reçoivent rien | Maintenant reçoivent selectedImage/userInput |

## 🧪 Test Checklist

- [ ] Sélectionner "test edition d image 2"
- [ ] Voir le formulaire avec "image1" (File input) et "text1" (Text input)
- [ ] Sélectionner une image
- [ ] Entrer un prompt texte
- [ ] Cliquer "Exécuter"
- [ ] **Pas d'erreur "Aucune image fournie"** ← Clé!
- [ ] Voir les résultats de l'édition

## 📝 Résumé Technique

**Avant**: AppViewer = Interface basique qui ignore l'architecture
**Après**: AppViewer = Interface qui respecte l'architecture SLUFE
- Détecte les tâches input dans workflow
- Upload les images avant exécution
- Injecte les données dans les tâches input
- Laisse le backend résoudre les variables et exécuter la séquence

C'est ça la vraie solution! 🎯

