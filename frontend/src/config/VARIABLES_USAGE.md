# Système de Variables et Métadonnées des Tâches

## 📚 Vue d'ensemble

Ce système permet de référencer facilement les outputs des tâches précédentes dans un workflow en utilisant des variables au format `{{taskId.outputKey}}`.

## 🎯 Fichiers principaux

### Documentation
- **`TASK_VARIABLES_REFERENCE.md`**: Documentation complète de toutes les variables disponibles par tâche
- **`taskMetadata.json`**: Métadonnées structurées (JSON) pour import/export
- **`frontend/src/config/taskDefinitions.js`**: Définitions enrichies avec métadonnées

### Code utilitaire
- **`frontend/src/utils/variableHelper.js`**: Helper pour manipuler variables et métadonnées
- **`frontend/src/components/VariableHelper.vue`**: Composant UI listant variables disponibles
- **`frontend/src/components/TaskVariableInfo.vue`**: Composant affichant infos tâche (dans formulaire)

## 🔧 Utilisation

### 1. Dans les définitions de tâches

Chaque tâche contient maintenant des métadonnées enrichies :

```javascript
generate_image: {
  type: 'generate_image',
  name: 'Générer une image',
  
  // Métadonnées pour référencement
  variablePrefix: 'img',  // Préfixe suggéré pour l'ID
  variableExample: '{{img1.image}}',  // Exemple de variable
  outputDescription: 'Génère une image accessible via {{taskId.image}}',
  
  inputs: {
    prompt: {
      type: 'text',
      acceptsVariable: true,
      variableDescription: 'Description de l\'image à créer'
    }
  },
  
  outputs: {
    image: {
      type: 'image',
      description: 'URL de l\'image générée',
      variablePath: '{{taskId.image}}',  // Template de variable
      example: '/medias/generated_abc123.webp'  // Exemple de valeur
    }
  }
}
```

### 2. Utiliser le helper de variables

```javascript
import { 
  getTaskMetadata,
  getAvailableVariables,
  validateVariableReference,
  suggestTaskId
} from '@/utils/variableHelper.js'

// Récupérer les métadonnées d'une tâche
const metadata = getTaskMetadata('generate_image')
// → { variablePrefix: 'img', variableExample: '{{img1.image}}', ... }

// Récupérer toutes les variables disponibles dans un workflow
const variables = getAvailableVariables(tasks, currentTaskId)
// → [
//     { taskId: 'img1', outputKey: 'image', variable: '{{img1.image}}', ... },
//     { taskId: 'desc1', outputKey: 'descriptions', variable: '{{desc1.descriptions}}', ... }
//   ]

// Suggérer un ID de tâche
const suggestedId = suggestTaskId('generate_image', existingTasks)
// → 'img1', 'img2', etc.

// Valider une variable
const validation = validateVariableReference('{{img1.image}}', tasks, currentTaskId)
// → { valid: true, info: { taskName: 'Générer une image', outputType: 'image', ... } }
```

### 3. Utiliser les composants UI

#### VariableHelper (liste complète)

```vue
<template>
  <VariableHelper 
    :tasks="workflow.tasks"
    :current-task-id="currentTask.id"
    @select="onVariableSelect"
  />
</template>

<script>
import VariableHelper from '@/components/VariableHelper.vue'

export default {
  components: { VariableHelper },
  
  methods: {
    onVariableSelect(variable) {
      console.log('Variable sélectionnée:', variable)
      // → '{{img1.image}}'
    }
  }
}
</script>
```

#### TaskVariableInfo (infos compactes)

```vue
<template>
  <TaskVariableInfo 
    :task-type="task.type"
    :task-id="task.id"
  />
</template>

<script>
import TaskVariableInfo from '@/components/TaskVariableInfo.vue'

export default {
  components: { TaskVariableInfo }
}
</script>
```

## 📋 Exemples de workflows

### Exemple 1: Image → Edit → Describe

```javascript
const workflow = {
  name: 'Édition et analyse',
  tasks: [
    {
      id: 'img1',  // ← Utilise le préfixe suggéré 'img'
      type: 'generate_image',
      inputs: {
        prompt: 'A beautiful sunset'
      }
      // Outputs: {{img1.image}}
    },
    {
      id: 'edit1',  // ← Préfixe 'edit'
      type: 'edit_image',
      inputs: {
        image1: '{{img1.image}}',  // ← Référence à la tâche précédente
        editPrompt: 'Make it more dramatic'
      }
      // Outputs: {{edit1.edited_image}}, {{edit1.edited_images}}
    },
    {
      id: 'desc1',  // ← Préfixe 'desc'
      type: 'describe_images',
      inputs: {
        images: '{{edit1.edited_images}}'  // ← Référence au tableau d'images
      }
      // Outputs: {{desc1.descriptions}}
    }
  ]
}
```

### Exemple 2: Prompt amélioré → Vidéo

```javascript
const workflow = {
  name: 'Vidéo avec prompt optimisé',
  tasks: [
    {
      id: 'txt1',  // ← Préfixe 'txt' (input_text)
      type: 'input_text',
      inputs: {
        label: 'Votre idée de vidéo',
        userInput: 'A cat walking in space'
      }
      // Outputs: {{txt1.text}}
    },
    {
      id: 'enh1',  // ← Préfixe 'enh' (enhance_prompt)
      type: 'enhance_prompt',
      inputs: {
        prompt: '{{txt1.text}}',  // ← Référence au texte saisi
        targetType: 'video'
      }
      // Outputs: {{enh1.enhanced_prompt}}
    },
    {
      id: 't2v1',  // ← Préfixe 't2v' (generate_video_t2v)
      type: 'generate_video_t2v',
      inputs: {
        prompt: '{{enh1.enhanced_prompt}}'  // ← Prompt amélioré
      }
      // Outputs: {{t2v1.video}}
    }
  ]
}
```

## 🎨 Préfixes suggérés par type de tâche

| Type de tâche | Préfixe | Exemple |
|---------------|---------|---------|
| `generate_image` | `img` | `{{img1.image}}` |
| `edit_image` | `edit` | `{{edit1.edited_image}}` |
| `describe_images` | `desc` | `{{desc1.descriptions}}` |
| `enhance_prompt` | `enh` | `{{enh1.enhanced_prompt}}` |
| `generate_video_t2v` | `t2v` | `{{t2v1.video}}` |
| `generate_video_i2v` | `i2v` | `{{i2v1.video}}` |
| `video_extract_frame` | `frame` | `{{frame1.image_url}}` |
| `video_concatenate` | `concat` | `{{concat1.video_url}}` |
| `input_text` | `txt` | `{{txt1.text}}` |
| `input_images` | `upload` | `{{upload1.images}}` |
| `camera_capture` | `cam` | `{{cam1.image}}` |
| `resize_crop` | `resize` | `{{resize1.resized_images}}` |

## 🔍 Validation des variables

Le système valide automatiquement:

1. **Format**: `{{taskId.outputKey}}`
2. **Existence de la tâche**: `taskId` doit exister dans le workflow
3. **Ordre**: La tâche référencée doit être **avant** la tâche courante
4. **Output valide**: `outputKey` doit exister dans les outputs de la tâche

Exemple de validation:

```javascript
// ✅ Valide
'{{img1.image}}' // dans une tâche après img1

// ❌ Invalide
'{{img5.image}}' // tâche img5 n'existe pas
'{{img1.video}}' // img1 n'a pas d'output 'video'
'{{img2.image}}' // dans une tâche AVANT img2 (ordre incorrect)
```

## 🚀 Intégration dans WorkflowBuilder

Le composant `WorkflowBuilder` peut utiliser ces helpers pour:

1. **Suggérer automatiquement** un ID de tâche basé sur le type
2. **Afficher** les variables disponibles dans un panneau latéral
3. **Valider** les variables en temps réel
4. **Autocompleter** les champs acceptant des variables
5. **Afficher des tooltips** avec les outputs disponibles

Exemple d'intégration:

```vue
<template>
  <div class="workflow-builder">
    <!-- Formulaire de tâche -->
    <q-card>
      <!-- Afficher infos variables pour cette tâche -->
      <TaskVariableInfo 
        :task-type="currentTask.type"
        :task-id="currentTask.id"
      />
      
      <!-- Champs du formulaire... -->
    </q-card>
    
    <!-- Panneau latéral avec variables -->
    <q-drawer side="right">
      <VariableHelper 
        :tasks="workflow.tasks"
        :current-task-id="currentTask.id"
        @select="insertVariable"
      />
    </q-drawer>
  </div>
</template>
```

## 📦 Export de métadonnées

Les métadonnées peuvent être exportées en JSON:

```javascript
import taskMetadata from '@/config/taskMetadata.json'

// Utiliser les métadonnées externes
const meta = taskMetadata['generate_image']
console.log(meta.variablePrefix) // → 'img'
```

## ✨ Fonctionnalités avancées

### Filtrage par type

```javascript
import { filterVariablesByType } from '@/utils/variableHelper.js'

const allVariables = getAvailableVariables(tasks, currentTaskId)
const imageVariables = filterVariablesByType(allVariables, 'image')
// → Seulement les variables de type 'image'
```

### Génération de documentation

```javascript
import { generateTaskDocumentation } from '@/utils/variableHelper.js'

const doc = generateTaskDocumentation('generate_image')
// → Markdown formaté avec tous les détails
```

### Parsing de variables

```javascript
import { parseVariable } from '@/utils/variableHelper.js'

const parsed = parseVariable('{{img1.image}}')
// → { taskId: 'img1', outputKey: 'image' }
```

## 🎯 Best practices

1. **Utiliser les préfixes suggérés** pour une meilleure lisibilité
2. **Valider les variables** avant de sauvegarder le workflow
3. **Afficher les variables disponibles** dans l'UI pour faciliter la saisie
4. **Documenter** les workflows complexes avec des commentaires
5. **Tester** les références de variables lors de l'exécution

## 🐛 Debugging

Pour debugger les variables:

```javascript
import { validateVariableReference } from '@/utils/variableHelper.js'

const result = validateVariableReference(
  '{{img1.image}}',
  workflow.tasks,
  currentTask.id
)

if (!result.valid) {
  console.error('Variable invalide:', result.error)
} else {
  console.log('Variable valide:', result.info)
}
```

## 📝 Changelog

- **v1.0**: Système initial avec métadonnées complètes
  - Ajout de `variablePrefix`, `variableExample`, `outputDescription`
  - Création de `variableHelper.js`
  - Composants `VariableHelper` et `TaskVariableInfo`
  - Documentation complète dans `TASK_VARIABLES_REFERENCE.md`
