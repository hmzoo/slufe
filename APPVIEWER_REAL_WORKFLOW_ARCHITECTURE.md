# 🔍 Compréhension Réelle des Workflows SLUFE

## ❌ Fausse compréhension

Avant, je pensais que:
```
AppViewer.formInputs = { image1: File, text1: "Hello" }
  ↓
Backend reçoit dans workflow.inputs simplement
```

## ✅ Vraie Structure

Les workflows SLUFE ont une architecture **séquentielle avec références de variables**:

```json
{
  "workflow": {
    "id": "template-xxx",
    "inputs": [
      {
        "id": "image1",
        "type": "image_input",
        "label": "Image à éditer",
        "selectedImage": "",
        "defaultImage": ""
      },
      {
        "id": "text1", 
        "type": "text_input",
        "label": "Prompt",
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
    ],
    "outputs": [...]
  }
}
```

## 🔄 Flow d'Exécution Réel

**Étape 1: Exécution des inputs** (ImageInputTask, TextInputTask)
```
Input tâche "image1" reçoit:
{
  selectedImage: "http://localhost:3000/uploads/image-abc.jpg",
  image: undefined,
  defaultImage: undefined
}

Retourne:
{
  image: "http://localhost:3000/uploads/image-abc.jpg",
  image_url: "...",
  status: "success"
}

→ Ajouté au contexte: context.image1 = { image: "..." }
```

**Étape 2: Exécution des tâches avec résolution de variables**
```
Tâche "edit1" avec:
{
  image1: "{{image1.image}}",
  editPrompt: "{{text1.text}}"
}

Résolution des variables:
- {{image1.image}} → context.image1.image → "http://localhost:3000/uploads/image-abc.jpg"
- {{text1.text}} → context.text1.text → "Edit as sketch"

Tâche reçoit réellement:
{
  image1: "http://localhost:3000/uploads/image-abc.jpg",
  editPrompt: "Edit as sketch"
}
```

## 🎯 Ce que AppViewer Doit Faire

### Actuellement (FAUX)
```javascript
executeWorkflow(
  currentTemplateData.value.workflow,  // Template inchangé
  formInputs.value  // { image1: File, text1: "Hello" }
)
```

Le backend s'attend à:
```javascript
workflow.inputs[0] = {
  id: "image1",
  type: "image_input",
  selectedImage: "FILE_URL_APRÈS_UPLOAD"  // ← Le backend cherche ici!
}
```

### Correct (À FAIRE)

Avant d'exécuter, il faut:

**Étape 1: Upload des images**
```javascript
formInputs.image1 = File
  ↓
POST /api/media/upload
  ↓
Résultat: "http://localhost:3000/uploads/image-abc123.jpg"
```

**Étape 2: Modifier le workflow pour injecter les données**
```javascript
const workflowToExecute = JSON.parse(JSON.stringify(currentTemplateData.value.workflow))

// Pour chaque input dans le formulaire
workflowToExecute.inputs.forEach(inputTask => {
  if (inputTask.type === 'image_input') {
    inputTask.selectedImage = formInputsWithUrls[inputTask.id]  // URL après upload
  } else if (inputTask.type === 'text_input') {
    inputTask.userInput = formInputs[inputTask.id]
  }
})
```

**Étape 3: Exécuter avec le workflow modifié**
```javascript
executeWorkflow(workflowToExecute)
```

## 📊 Exemple Complet

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

### Formulaire Rempli
```javascript
formInputs = {
  image1: File { name: "test.jpg", size: 12345 },
  text1: "Make it look like a sketch"
}
```

### Après Upload & Modification (Avant Exécution)
```json
{
  "workflow": {
    "id": "template-1763048377934-jt9opj",
    "inputs": [
      {
        "id": "image1",
        "type": "image_input",
        "selectedImage": "http://localhost:3000/uploads/image-abc123.jpg"
      },
      {
        "id": "text1",
        "type": "text_input",
        "userInput": "Make it look like a sketch"
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

### Exécution Backend

1. **Exécute tâche image1 (ImageInputTask)**:
   - Reçoit: `{ selectedImage: "http://localhost:3000/uploads/image-abc123.jpg" }`
   - Retourne: `{ image: "http://localhost:3000/uploads/image-abc123.jpg" }`
   - Context: `{ image1: { image: "http://localhost:3000/uploads/image-abc123.jpg" } }`

2. **Exécute tâche text1 (TextInputTask)**:
   - Reçoit: `{ userInput: "Make it look like a sketch" }`
   - Retourne: `{ text: "Make it look like a sketch" }`
   - Context: `{ ..., text1: { text: "Make it look like a sketch" } }`

3. **Exécute tâche edit1 (EditImageTask)** avec résolution de variables:
   - Variables: `image1: "{{image1.image}}"` → `"http://localhost:3000/uploads/image-abc123.jpg"`
   - Variables: `editPrompt: "{{text1.text}}"` → `"Make it look like a sketch"`
   - Reçoit: `{ image1: "http://...", editPrompt: "Make it look like a sketch" }`
   - Exécute l'édition d'image avec ces paramètres

## 🛠️ Code Nécessaire dans AppViewer

```javascript
const executeTemplate = async () => {
  // 1. Upload les images du formulaire
  const imageUrls = {}
  for (const [key, file] of Object.entries(formInputs.value)) {
    if (file instanceof File) {
      imageUrls[key] = await uploadImage(file)
    }
  }

  // 2. Crée une copie profonde du workflow
  const workflowToExecute = JSON.parse(JSON.stringify(currentTemplateData.value.workflow))

  // 3. Injecte les données dans les tâches input
  if (workflowToExecute.inputs) {
    for (const inputTask of workflowToExecute.inputs) {
      if (inputTask.type === 'image_input' && imageUrls[inputTask.id]) {
        inputTask.selectedImage = imageUrls[inputTask.id]
      } else if (inputTask.type === 'text_input' && formInputs.value[inputTask.id]) {
        inputTask.userInput = formInputs.value[inputTask.id]
      }
    }
  }

  // 4. Exécute le workflow modifié (pas les inputs du formulaire!)
  await executeWorkflow(workflowToExecute)  // Pas formInputs!
}
```

## 📋 Résumé

| Aspect | Avant (Faux) | Après (Correct) |
|--------|------------|-----------------|
| **Données passées** | formInputs directement | Modifiées dans workflow.inputs |
| **Upload des images** | Non | Oui, avant injection |
| **Tâches input exécutées** | Non | Oui, par le backend |
| **Références variables** | Pas utilisées | Résolues par le backend |
| **Architecture** | Ignorée | Respectée |

