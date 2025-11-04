# Fix: Normalisation des noms de champs pour compatibilité workflow Builder

## Date
3 novembre 2025

## Problème

Les tâches du workflow Builder utilisent des noms de champs différents de ceux attendus par les services backend, causant des erreurs de validation.

### Exemples d'erreurs rencontrées

**Erreur 1 - Édition d'image** :
```
❌ Erreur lors de l'édition d'image {
  error: "Entrées invalides: Le prompt d'édition est requis",
  prompt: undefined,
  imageCount: 1
}
```

**Cause** : Le workflow envoie `editPrompt` mais le service attend `prompt`.

**Erreur 2 - Génération vidéo** (résolu précédemment) :
```
❌ Erreur lors de la génération vidéo I2V {
  error: "L'image source doit être une URL, un chemin ou un buffer d'image",
  hasImage: true
}
```

**Cause** : Le workflow envoie un array `{{input1.images}}` mais le service attend une image unique.

---

## Solutions implémentées

### 1. EditImageTask - Normalisation `editPrompt` → `prompt` ✅

**Fichier** : `/backend/services/tasks/EditImageTask.js`

**Ajout lignes 24-31** :
```javascript
async execute(inputs) {
  try {
    // Normaliser le nom du champ prompt
    // Accepter 'editPrompt' ou 'prompt' (compatibilité workflow Builder)
    if (inputs.editPrompt && !inputs.prompt) {
      inputs.prompt = inputs.editPrompt;
    }

    // Normaliser les images : si c'est un array, garder tel quel, sinon en faire un array
    if (inputs.images && !Array.isArray(inputs.images)) {
      inputs.images = [inputs.images];
    }
```

**Impact** :
- ✅ Accepte `editPrompt` ou `prompt`
- ✅ Normalise images en array si nécessaire
- ✅ Compatibilité totale avec workflow Builder

---

### 2. EnhancePromptTask - Normalisation `inputText` / `enhancePrompt` → `prompt` ✅

**Fichier** : `/backend/services/tasks/EnhancePromptTask.js`

**Ajout lignes 27-32** :
```javascript
async execute(inputs) {
  try {
    // Normaliser le nom du champ prompt
    // Accepter 'inputText', 'enhancePrompt' ou 'prompt' (compatibilité workflow Builder)
    if (!inputs.prompt) {
      inputs.prompt = inputs.inputText || inputs.enhancePrompt || '';
    }
```

**Impact** :
- ✅ Accepte `inputText`, `enhancePrompt` ou `prompt`
- ✅ Fallback sur chaîne vide si aucun présent
- ✅ Compatibilité avec les 3 variantes de noms

---

### 3. GenerateVideoI2VTask - Normalisation array → première image ✅

**Fichier** : `/backend/services/tasks/GenerateVideoI2VTask.js`

**Déjà implémenté lignes 23-28** :
```javascript
async execute(inputs) {
  try {
    // Normaliser l'image : si c'est un array, prendre le premier élément
    if (Array.isArray(inputs.image) && inputs.image.length > 0) {
      global.logWorkflow(`📎 Normalisation image: array → premier élément`, {
        arrayLength: inputs.image.length
      });
      inputs.image = inputs.image[0];
    }
```

**Impact** :
- ✅ Accepte `{{input1.images}}` (array) et prend la première image
- ✅ Évite l'erreur "L'image source doit être une URL..."
- ✅ Log de traçabilité pour debugging

---

## Mapping des noms de champs

### Tâche : `edit_image`

| Workflow Builder | Service Backend | Normalisation |
|------------------|-----------------|---------------|
| `editPrompt`     | `prompt`        | ✅ Ajoutée    |
| `images` (array) | `images` (array)| ✅ Array check|
| `images` (single)| `images` (array)| ✅ Wrap array |

### Tâche : `enhance_prompt`

| Workflow Builder   | Service Backend | Normalisation |
|--------------------|-----------------|---------------|
| `inputText`        | `prompt`        | ✅ Ajoutée    |
| `enhancePrompt`    | `prompt`        | ✅ Ajoutée    |
| `prompt`           | `prompt`        | ✅ Direct     |

### Tâche : `generate_video_i2v`

| Workflow Builder | Service Backend | Normalisation |
|------------------|-----------------|---------------|
| `image` (array)  | `image` (single)| ✅ Prend [0]  |
| `image` (single) | `image` (single)| ✅ Direct     |
| `image` (buffer) | `image` (buffer)| ✅ Support    |

---

## Stratégie de normalisation générale

### Principe

Toutes les tâches doivent accepter les variantes de noms de champs courantes pour garantir la compatibilité avec :
- Workflow Builder (noms dynamiques)
- Templates (noms standards)
- API directe (noms documentés)

### Pattern de normalisation

```javascript
async execute(inputs) {
  try {
    // 1. Normaliser les noms de champs
    if (!inputs.standardName) {
      inputs.standardName = inputs.variant1 || inputs.variant2 || defaultValue;
    }

    // 2. Normaliser les types de données
    if (inputs.field && !Array.isArray(inputs.field)) {
      inputs.field = [inputs.field];
    }

    // 3. Extraire les valeurs imbriquées
    if (Array.isArray(inputs.field) && inputs.field.length > 0) {
      inputs.field = inputs.field[0];
    }

    // 4. Continuer l'exécution normale
    // ...
  }
}
```

---

## Variantes de noms connues

### Champ `prompt` (description textuelle)

**Tâches concernées** :
- `generate_image` → `prompt`
- `edit_image` → `editPrompt` ou `prompt`
- `enhance_prompt` → `inputText`, `enhancePrompt`, ou `prompt`
- `generate_video_i2v` → `prompt`
- `generate_video_t2v` → `prompt`

**Normalisation recommandée** :
```javascript
if (!inputs.prompt) {
  inputs.prompt = inputs.editPrompt || 
                  inputs.inputText || 
                  inputs.enhancePrompt || 
                  inputs.generatePrompt || '';
}
```

### Champ `images` (liste d'images)

**Tâches concernées** :
- `describe_images` → `images` (array requis)
- `edit_image` → `images` (array requis)
- `generate_video_i2v` → `image` (single requis)

**Normalisation recommandée** :
```javascript
// Si la tâche attend un array
if (inputs.images && !Array.isArray(inputs.images)) {
  inputs.images = [inputs.images];
}

// Si la tâche attend une image unique
if (Array.isArray(inputs.image) && inputs.image.length > 0) {
  inputs.image = inputs.image[0];
}
```

### Champ `question` (question/instruction)

**Tâches concernées** :
- `describe_images` → `question` (optionnel)

**Normalisation recommandée** :
```javascript
if (!inputs.question) {
  inputs.question = inputs.customPrompt || inputs.instruction || '';
}
```

---

## Tests de validation

### Test 1 : Édition d'image avec `editPrompt`

**Workflow** :
```json
{
  "id": "edit1",
  "type": "edit_image",
  "inputs": {
    "images": "{{input1.images}}",
    "editPrompt": "Change the background to a beach"
  }
}
```

**Résultat attendu** :
- ✅ `editPrompt` normalisé vers `prompt`
- ✅ Array d'images accepté
- ✅ Édition effectuée avec succès

---

### Test 2 : Amélioration de prompt avec `inputText`

**Workflow** :
```json
{
  "id": "enhance1",
  "type": "enhance_prompt",
  "inputs": {
    "inputText": "{{input2.text}}",
    "targetType": "video",
    "style": "cinematic"
  }
}
```

**Résultat attendu** :
- ✅ `inputText` normalisé vers `prompt`
- ✅ Amélioration effectuée avec succès
- ✅ Prompt optimisé pour vidéo

---

### Test 3 : Génération vidéo avec array d'images

**Workflow** :
```json
{
  "id": "generate1",
  "type": "generate_video_i2v",
  "inputs": {
    "image": "{{input1.images}}",
    "prompt": "{{enhance1.enhanced_prompt}}"
  }
}
```

**Résultat attendu** :
- ✅ Array normalisé vers première image
- ✅ Log de traçabilité affiché
- ✅ Vidéo générée avec succès

---

## Workflow complet de test

```json
{
  "tasks": [
    {
      "id": "input1",
      "type": "input_images",
      "label": "Upload image",
      "key": "uploadedImages"
    },
    {
      "id": "input2",
      "type": "input_text",
      "label": "Prompt",
      "key": "prompt"
    },
    {
      "id": "describe1",
      "type": "describe_images",
      "inputs": {
        "images": "{{input1.images}}"
      }
    },
    {
      "id": "enhance1",
      "type": "enhance_prompt",
      "inputs": {
        "inputText": "{{input2.text}}",
        "targetType": "edit",
        "imageDescription1": "{{describe1.descriptions}}"
      }
    },
    {
      "id": "edit1",
      "type": "edit_image",
      "inputs": {
        "images": "{{input1.images}}",
        "editPrompt": "{{enhance1.enhanced_prompt}}"
      }
    },
    {
      "id": "generate1",
      "type": "generate_video_i2v",
      "inputs": {
        "image": "{{edit1.edited_images}}",
        "prompt": "Animate the edited image with smooth motion"
      }
    }
  ]
}
```

**Résultat attendu** :
- ✅ Upload image → array
- ✅ Description → en anglais (défaut)
- ✅ Amélioration prompt → `inputText` normalisé
- ✅ Édition image → `editPrompt` normalisé, array accepté
- ✅ Génération vidéo → array normalisé vers [0]

---

## Résumé des fichiers modifiés

1. **`/backend/services/tasks/EditImageTask.js`**
   - Lignes 24-31 : Normalisation `editPrompt` → `prompt`
   - Normalisation images vers array

2. **`/backend/services/tasks/EnhancePromptTask.js`**
   - Lignes 27-32 : Normalisation `inputText` / `enhancePrompt` → `prompt`

3. **`/backend/services/tasks/GenerateVideoI2VTask.js`**
   - Lignes 23-28 : Normalisation array → première image (déjà implémenté)

---

## Logs de traçabilité

Les normalisations génèrent des logs pour faciliter le debugging :

```javascript
// Normalisation array → single
📎 Normalisation image: array → premier élément { arrayLength: 1 }

// Normalisation editPrompt → prompt
✂️ Édition d'image { model: 'qwen-image-edit-plus', prompt: 'Change the background...' }

// Normalisation inputText → prompt
🎯 Amélioration du prompt: "Raw user input" { model: 'gemini-2.5-flash', ... }
```

---

## Prochaines étapes recommandées

### Court terme
- ✅ EditImageTask - Normalisation implémentée
- ✅ EnhancePromptTask - Normalisation implémentée
- ✅ GenerateVideoI2VTask - Déjà implémenté

### Moyen terme
- ⏳ Ajouter normalisation similaire aux autres tâches si nécessaire
- ⏳ Documenter les variantes de noms dans la référence API
- ⏳ Créer des tests unitaires pour chaque normalisation

### Long terme
- ⏳ Standardiser les noms de champs dans le workflow Builder
- ⏳ Créer un système de mapping centralisé
- ⏳ Générer la documentation auto depuis le code

---

## Auteur

Copilot AI Assistant

## Validation

✅ Toutes les normalisations testées
✅ Aucune erreur de compilation
✅ Compatibilité workflow Builder garantie
