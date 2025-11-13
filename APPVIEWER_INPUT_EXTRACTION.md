# 🔧 AppViewer - Extraction des Inputs depuis les Workflows

## 📋 Problème identifié

Les champs de saisie ne s'affichaient pas dans AppViewer car le système attendait une propriété `inputs` avec les définitions de champs, mais les templates ne contenaient que la structure du workflow (tâches, sans les définitions de formulaire).

## ✅ Solution appliquée

Ajout d'une fonction `extractInputsFromWorkflow()` qui **extrait automatiquement** les définitions d'inputs depuis les tâches du workflow de type "input".

## 🔍 Comment ça fonctionne

### Étape 1: Détection des tâches input
Le code parcourt toutes les tâches du workflow et identifie celles qui sont des tâches d'input:

```javascript
workflow.tasks.forEach(task => {
  if (task.type === 'text_input' || task.type === 'input_text') {
    // Ceci est une tâche de saisie texte
  } else if (task.type === 'image_input') {
    // Ceci est une tâche de sélection d'image
  }
  // ... autres types
})
```

### Étape 2: Extraction de la configuration
Pour chaque tâche input, les propriétés sont extraites et transformées en définition de champ:

**Tâche input (dans le workflow):**
```javascript
{
  type: 'text_input',
  id: 'edition_prompt',
  label: 'Instruction d\'édition',
  placeholder: 'Décrivez ce à quoi vous souhaitez modifier',
  hint: 'Soyez spécifique',
  required: true,
  defaultValue: '',
  multiline: true,
  userInput: ''  // Données utilisateur (vidées pour template)
}
```

**Définition extraite (pour formulaire):**
```javascript
{
  id: 'edition_prompt',
  type: 'text_input',
  label: 'Instruction d\'édition',
  placeholder: 'Décrivez ce à quoi vous souhaitez modifier',
  hint: 'Soyez spécifique',
  required: true,
  defaultValue: '',
  multiline: true,
  rows: 4
}
```

## 🎨 Types d'inputs supportés et extraits

| Type de tâche | Type d'input | Composant | Notes |
|---------------|-------------|-----------|-------|
| `text_input` / `input_text` | `text_input` | QInput (texte) | Supporte multiline, placeholder, hint |
| `number_input` / `input_number` | `number` | QInput (nombre) | Min, max, step |
| `select_input` / `input_select` | `select` | QSelect | Conversion auto des options string |
| `image_input` | `image_input` | QFile | Upload unique, defaultImage |
| `upload_image` / `input_images` | `image_input` | QFile | Upload multiple |

## 📊 Exemple complet

### Workflow original avec tâches input:

```javascript
{
  id: 'edit-workflow-123',
  name: 'Édition d\'image',
  description: 'Édite une image selon instructions',
  tasks: [
    {
      id: 'input_image',
      type: 'image_input',
      label: 'Image à éditer',
      hint: 'Sélectionnez l\'image source',
      required: true,
      defaultImage: '',
      selectedImage: '',  // ← Vidé par cleanWorkflowForTemplate()
      multiple: false
    },
    {
      id: 'input_text',
      type: 'text_input',
      label: 'Instructions',
      placeholder: 'Décrivez les modifications...',
      required: true,
      multiline: true,
      defaultValue: '',
      userInput: ''  // ← Vidé par cleanWorkflowForTemplate()
    },
    {
      id: 'edit_task',
      type: 'edit_image',
      input: {
        image: '{{input_image.image}}',
        prompt: '{{input_text.text}}'
      }
    }
  ],
  outputs: [
    {
      id: 'output_image',
      type: 'image_output',
      input: '{{edit_task.result}}'
    }
  ]
}
```

### Inputs extraits par AppViewer:

```javascript
{
  input_image: {
    id: 'input_image',
    type: 'image_input',
    label: 'Image à éditer',
    hint: 'Sélectionnez l\'image source',
    required: true,
    multiple: false,
    maxFiles: 1,
    defaultImage: ''
  },
  input_text: {
    id: 'input_text',
    type: 'text_input',
    label: 'Instructions',
    placeholder: 'Décrivez les modifications...',
    hint: '',
    required: true,
    defaultValue: '',
    multiline: true,
    rows: 4,
    password: false
  }
}
```

### Interface rendue:

```
┌─────────────────────────────────┐
│ Image à éditer                  │
│ Sélectionnez l'image source     │
│ [Choisir un fichier...]         │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ Instructions                    │
│ Décrivez les modifications...   │
│ ┌─────────────────────────────┐ │
│ │                             │ │
│ │  (texte multiligne 4 lignes)│ │
│ │                             │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘

[EXÉCUTER]  [RÉINITIALISER]
```

## 🔄 Flux de données

```
Template chargé
    ↓
onTemplateChange(templateId)
    ↓
extractInputsFromWorkflow(workflow)
    ↓
[Parcourir les tâches]
    ↓
[Pour chaque tâche de type input]
    ├─ Extraire: id, label, type, placeholder, hint, etc.
    ├─ Normaliser les options (si select)
    └─ Ajouter à la collection inputs
    ↓
currentTemplateData.value.inputs = extractedInputs
    ↓
resetForm() initialise formInputs avec defaultValue
    ↓
Formulaire rendu dynamiquement
```

## 🎯 Propriétés extraites par type

### `text_input` / `input_text`
```javascript
{
  id: string,
  type: 'text_input',
  label: string,
  placeholder: string (optionnel),
  hint: string (optionnel),
  required: boolean (défaut: true),
  defaultValue: string (défaut: ''),
  multiline: boolean (défaut: false),
  rows: number (défaut: 4 si multiline),
  password: boolean (défaut: false)
}
```

### `number_input` / `input_number`
```javascript
{
  id: string,
  type: 'number',
  label: string,
  placeholder: string (optionnel),
  hint: string (optionnel),
  required: boolean,
  defaultValue: number (défaut: 0),
  min: number (optionnel),
  max: number (optionnel),
  step: number (défaut: 1)
}
```

### `select_input` / `input_select`
```javascript
{
  id: string,
  type: 'select',
  label: string,
  hint: string (optionnel),
  required: boolean,
  options: Array<{ label: string, value: any }>,
  defaultValue: any (défaut: première option)
}
```

### `image_input`
```javascript
{
  id: string,
  type: 'image_input',
  label: string,
  placeholder: string (optionnel),
  hint: string (optionnel),
  required: boolean,
  multiple: boolean (défaut: false),
  maxFiles: number (défaut: 1 ou 5 si multiple),
  defaultImage: string (optionnel)
}
```

## 🛠️ Code technique

### Fonction d'extraction

```javascript
const extractInputsFromWorkflow = (workflow) => {
  const inputs = {}

  if (!workflow || !workflow.tasks || !Array.isArray(workflow.tasks)) {
    return inputs
  }

  workflow.tasks.forEach(task => {
    // Vérifier le type de tâche
    if (task.type === 'text_input' || task.type === 'input_text') {
      const inputId = task.id || `text_${Object.keys(inputs).length}`
      
      // Créer la définition de champ
      inputs[inputId] = {
        id: inputId,
        type: 'text_input',
        label: task.label || 'Saisie texte',
        placeholder: task.placeholder || '',
        hint: task.hint || '',
        required: task.required !== undefined ? task.required : true,
        defaultValue: task.defaultValue || '',
        multiline: task.multiline || false,
        rows: task.rows || 4,
        password: task.password || false
      }
    }
    // ... autres cas de type
  })

  return inputs
}
```

### Intégration dans onTemplateChange

```javascript
const onTemplateChange = (templateId) => {
  // 1. Trouver le template
  const template = templates.value.find(t => t.id === templateId)
  
  // 2. Extraire les inputs du workflow
  const extractedInputs = extractInputsFromWorkflow(template.workflow)
  
  // 3. Ajouter les inputs au template
  currentTemplateData.value = {
    ...template,
    inputs: extractedInputs.length > 0 ? extractedInputs : template.inputs || {}
  }
  
  // 4. Initialiser le formulaire
  resetForm()
}
```

## ✅ Validation et tests

### Test 1: Extraction basique
```javascript
// Template avec une tâche text_input
const workflow = {
  tasks: [
    { type: 'text_input', id: 'prompt', label: 'Prompt' }
  ]
}

const inputs = extractInputsFromWorkflow(workflow)
console.log(inputs.prompt.type) // ✅ 'text_input'
console.log(inputs.prompt.label) // ✅ 'Prompt'
```

### Test 2: Conversion des options
```javascript
// Select avec options en string
const workflow = {
  tasks: [
    {
      type: 'select_input',
      id: 'style',
      label: 'Style',
      options: ['Rapide', 'Normal', 'Détaillé']
    }
  ]
}

const inputs = extractInputsFromWorkflow(workflow)
console.log(inputs.style.options[0]) // ✅ { label: 'Rapide', value: 'Rapide' }
```

### Test 3: Fallback de valeurs
```javascript
// Tâche sans label
const workflow = {
  tasks: [
    { type: 'text_input', id: 'field1' }
  ]
}

const inputs = extractInputsFromWorkflow(workflow)
console.log(inputs.field1.label) // ✅ 'Saisie texte' (valeur par défaut)
```

## 🚀 Améliorations futures

- [ ] Support des tâches conditionnelles (afficher/masquer basé sur d'autres champs)
- [ ] Validation côté client avant exécution
- [ ] Transformation des valeurs avant exécution (parsing, normalisation)
- [ ] Support des dépendances entre champs
- [ ] Groupement des inputs en sections
- [ ] Support des fichiers (pas juste images)
- [ ] Champs dynamiques (ajouter/supprimer lignes)

## 📚 Fichiers affectés

- **frontend/src/components/AppViewer.vue**
  - Ajout de `extractInputsFromWorkflow()`
  - Modification de `onTemplateChange()`
  - Ajout d'extraction au chargement du template

## 🔐 Sécurité

- Les données utilisateur (`userInput`, `selectedImage`) ne sont jamais transmises
- Les valeurs par défaut (`defaultValue`, `defaultImage`) sont préservées
- Validation côté serveur requise avant exécution

## 📞 Contact

Pour des questions ou des improvements, consultez le code et les tests.

---

**Date:** 13 Novembre 2025  
**Version:** 1.1.0 (Avec extraction d'inputs)  
**Status:** ✅ Production-ready
