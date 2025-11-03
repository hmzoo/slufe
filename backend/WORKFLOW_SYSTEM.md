# 🔄 Système de Workflows SLUFE IA

> **Architecture unifiée** pour l'exécution de tâches IA séquentielles basées sur des workflows JSON

---

## 🎯 Vue d'ensemble

Le système de workflows SLUFE IA permet d'exécuter des séquences de tâches IA de manière homogène et automatisée. Chaque workflow est défini dans un fichier JSON contenant une liste ordonnée de tâches à exécuter.

### 🏗️ Architecture

```
Demande utilisateur → Analyseur IA → Workflow JSON → Exécuteur → Résultats
```

1. **Analyseur IA** : Génère un workflow JSON à partir d'une demande utilisateur
2. **Exécuteur de workflows** : Traite séquentiellement les tâches du workflow
3. **Services spécialisés** : Exécutent chaque type de tâche

---

## 📋 Types de tâches disponibles

### 1. 🎯 Amélioration de prompt
**Modèle :** `gemini-2.5-flash`

```json
{
  "type": "enhance_prompt",
  "id": "task_1",
  "inputs": {
    "prompt": "un chat dans un jardin"
  },
  "outputs": {
    "enhanced_prompt": "{{task_1.enhanced_prompt}}"
  }
}
```

### 2. 🔍 Description d'images
**Modèle :** `llava-13b`

```json
{
  "type": "describe_images",
  "id": "task_2", 
  "inputs": {
    "images": ["{{input.images}}", "path/to/image2.jpg"]
  },
  "outputs": {
    "descriptions": "{{task_2.descriptions}}"
  }
}
```

### 3. 🎨 Génération d'image
**Modèle :** `qwen-image`

```json
{
  "type": "generate_image",
  "id": "task_3",
  "inputs": {
    "prompt": "{{task_1.enhanced_prompt}}",
    "reference_image": "{{input.images[0]}}",
    "parameters": {
      "width": 1024,
      "height": 1024,
      "steps": 50,
      "guidance_scale": 7.5
    }
  },
  "outputs": {
    "image": "{{task_3.image}}"
  }
}
```

### 4. ✂️ Édition d'image
**Modèle :** `qwen-image-edit-plus`

```json
{
  "type": "edit_image",
  "id": "task_4",
  "inputs": {
    "prompt": "ajouter des fleurs colorées",
    "images": ["{{task_3.image}}"],
    "parameters": {
      "strength": 0.8,
      "guidance_scale": 7.5
    }
  },
  "outputs": {
    "edited_image": "{{task_4.edited_image}}"
  }
}
```

### 5. 🎬 Génération vidéo (text-to-video)
**Modèle :** `wan-2.2-t2v-fast`

```json
{
  "type": "generate_video_t2v",
  "id": "task_5",
  "inputs": {
    "prompt": "{{task_1.enhanced_prompt}}",
    "parameters": {
      "duration": 5,
      "fps": 24,
      "width": 1024,
      "height": 576
    }
  },
  "outputs": {
    "video": "{{task_5.video}}"
  }
}
```

### 6. 🎞️ Génération vidéo (image-to-video)
**Modèle :** `wan-2.2-i2v-fast`

```json
{
  "type": "generate_video_i2v", 
  "id": "task_6",
  "inputs": {
    "prompt": "le chat commence à courir",
    "image": "{{task_3.image}}",
    "parameters": {
      "duration": 3,
      "fps": 24,
      "motion_strength": 0.7
    }
  },
  "outputs": {
    "video": "{{task_6.video}}"
  }
}
```

### 7. 🤖 Génération de workflow
**Modèle :** `gemini-2.5-flash`

```json
{
  "type": "generate_workflow",
  "id": "task_0",
  "inputs": {
    "user_prompt": "Créer une image d'un chat et l'animer",
    "input_images": ["{{input.images}}"],
    "image_descriptions": ["{{input.descriptions}}"]
  },
  "outputs": {
    "workflow": "{{task_0.workflow}}"
  }
}
```

---

## 📄 Schéma de workflow JSON

### Structure principale

```json
{
  "workflow": {
    "id": "wf_{{timestamp}}_{{random}}",
    "name": "Génération et animation d'un chat",
    "description": "Workflow pour créer et animer une image de chat",
    "version": "1.0",
    "created_at": "2025-11-03T10:30:00.000Z",
    "metadata": {
      "estimated_duration": 120,
      "complexity": "medium",
      "required_models": ["gemini-2.5-flash", "qwen-image", "wan-2.2-i2v-fast"]
    },
    "inputs": {
      "user_prompt": "string",
      "images": ["file"],
      "descriptions": ["string"]
    },
    "tasks": [
      // ... liste des tâches
    ],
    "outputs": {
      "final_video": "{{task_6.video}}",
      "intermediate_image": "{{task_3.image}}"
    }
  }
}
```

### Variables et références

Le système supporte plusieurs types de références :

- `{{input.field}}` : Données d'entrée du workflow
- `{{task_id.output}}` : Sortie d'une tâche précédente  
- `{{task_id.outputs.field}}` : Champ spécifique d'une sortie
- `{{input.images[0]}}` : Premier élément d'un tableau

---

## 🚀 API Endpoint : `/workflow/run`

### POST `/api/workflow/run`
Exécuter un workflow complet

**Content-Type:** `multipart/form-data` ou `application/json`

#### Paramètres d'entrée

**Multipart (avec fichiers):**
```
workflow: {workflow_json}        // Workflow à exécuter
images[]: file1.jpg              // Images d'entrée (optionnel)
images[]: file2.jpg
user_prompt: "string"            // Prompt utilisateur (optionnel)
```

**JSON (sans fichiers):**
```json
{
  "workflow": {
    "workflow": {
      "id": "wf_abc123",
      "tasks": [...]
    }
  },
  "inputs": {
    "user_prompt": "Créer une image de chat",
    "image_urls": ["https://example.com/cat.jpg"]
  }
}
```

#### Réponse

```json
{
  "success": true,
  "workflow_id": "wf_abc123_exec_456",
  "execution": {
    "status": "completed",
    "progress": {
      "total_tasks": 3,
      "completed_tasks": 3,
      "current_task": null,
      "percentage": 100
    },
    "execution_time": 87.5,
    "started_at": "2025-11-03T10:30:00.000Z",
    "completed_at": "2025-11-03T10:31:27.500Z"
  },
  "results": {
    "final_video": {
      "url": "https://storage.com/result_video.mp4",
      "metadata": {
        "duration": 3,
        "resolution": "1024x576",
        "fps": 24
      }
    },
    "intermediate_image": {
      "url": "https://storage.com/generated_cat.jpg",
      "metadata": {
        "width": 1024,
        "height": 1024
      }
    }
  },
  "task_results": [
    {
      "task_id": "task_1",
      "type": "enhance_prompt",
      "status": "completed",
      "execution_time": 2.1,
      "outputs": {
        "enhanced_prompt": "Un chat domestique élégant aux yeux verts..."
      }
    },
    // ... autres tâches
  ],
  "logs": [
    {
      "timestamp": "2025-11-03T10:30:01.000Z",
      "level": "info",
      "task_id": "task_1",
      "message": "Démarrage amélioration du prompt"
    }
  ]
}
```

---

## 🔧 Architecture technique

### Service principal : WorkflowRunner

```javascript
class WorkflowRunner {
  async executeWorkflow(workflow, inputs = {}) {
    const execution = new WorkflowExecution(workflow);
    
    for (const task of workflow.tasks) {
      const result = await this.executeTask(task, execution.context);
      execution.addTaskResult(task.id, result);
    }
    
    return execution.getResults();
  }
  
  async executeTask(task, context) {
    const service = this.getServiceForTask(task.type);
    const resolvedInputs = this.resolveVariables(task.inputs, context);
    
    return await service.execute(resolvedInputs);
  }
}
```

### Services spécialisés

Chaque type de tâche a son service dédié :

```javascript
// services/tasks/EnhancePromptTask.js
class EnhancePromptTask {
  async execute(inputs) {
    const { prompt } = inputs;
    const enhanced = await this.geminiService.enhancePrompt(prompt);
    return { enhanced_prompt: enhanced };
  }
}

// services/tasks/GenerateImageTask.js  
class GenerateImageTask {
  async execute(inputs) {
    const { prompt, reference_image, parameters } = inputs;
    const image = await this.qwenService.generateImage(prompt, {
      reference_image,
      ...parameters
    });
    return { image: image.url };
  }
}
```

---

## 📁 Structure des fichiers

```
backend/
├── services/
│   ├── WorkflowRunner.js           // Exécuteur principal
│   ├── WorkflowAnalyzer.js         // Analyseur de demandes → workflows
│   └── tasks/
│       ├── EnhancePromptTask.js    // Amélioration de prompts
│       ├── DescribeImagesTask.js   // Description d'images
│       ├── GenerateImageTask.js    // Génération d'images
│       ├── EditImageTask.js        // Édition d'images
│       ├── GenerateVideoT2VTask.js // Génération vidéo T2V
│       ├── GenerateVideoI2VTask.js // Génération vidéo I2V
│       └── GenerateWorkflowTask.js // Génération de workflows
├── routes/
│   └── workflow.js                 // Route /workflow/run
└── schemas/
    ├── workflow-schema.json        // Schéma JSON du workflow
    └── task-schemas/              // Schémas pour chaque type de tâche
```

---

## 🎨 Exemples de workflows

### Exemple 1 : Amélioration et génération simple

```json
{
  "workflow": {
    "id": "wf_simple_generation",
    "name": "Génération simple avec amélioration",
    "tasks": [
      {
        "type": "enhance_prompt",
        "id": "enhance",
        "inputs": {
          "prompt": "{{input.user_prompt}}"
        }
      },
      {
        "type": "generate_image", 
        "id": "generate",
        "inputs": {
          "prompt": "{{enhance.enhanced_prompt}}",
          "parameters": {
            "width": 1024,
            "height": 1024
          }
        }
      }
    ],
    "outputs": {
      "result_image": "{{generate.image}}"
    }
  }
}
```

### Exemple 2 : Pipeline complet image → vidéo

```json
{
  "workflow": {
    "id": "wf_image_to_video_pipeline",
    "name": "Pipeline complet : analyse → génération → animation",
    "tasks": [
      {
        "type": "describe_images",
        "id": "analyze",
        "inputs": {
          "images": "{{input.images}}"
        }
      },
      {
        "type": "enhance_prompt",
        "id": "enhance",
        "inputs": {
          "prompt": "Créer une version animée basée sur: {{analyze.descriptions[0]}}"
        }
      },
      {
        "type": "edit_image",
        "id": "prepare",
        "inputs": {
          "prompt": "optimiser pour l'animation vidéo",
          "images": "{{input.images}}",
          "parameters": {
            "strength": 0.3
          }
        }
      },
      {
        "type": "generate_video_i2v",
        "id": "animate",
        "inputs": {
          "prompt": "{{enhance.enhanced_prompt}}",
          "image": "{{prepare.edited_image}}",
          "parameters": {
            "duration": 5,
            "motion_strength": 0.8
          }
        }
      }
    ],
    "outputs": {
      "final_video": "{{animate.video}}",
      "prepared_image": "{{prepare.edited_image}}"
    }
  }
}
```

---

## 🔍 Validation et gestion d'erreurs

### Validation des workflows

- **Schéma JSON** : Validation de la structure
- **Références circulaires** : Détection automatique
- **Dépendances** : Vérification de l'ordre des tâches
- **Types de données** : Validation des entrées/sorties

### Gestion d'erreurs

```json
{
  "success": false,
  "error": {
    "type": "task_execution_error",
    "task_id": "task_3",
    "task_type": "generate_image",
    "message": "Erreur lors de la génération d'image",
    "details": "API rate limit exceeded",
    "retry_after": 60
  },
  "partial_results": {
    // Résultats des tâches réussies
  }
}
```

---

## 📊 Monitoring et performance

### Métriques collectées

- Temps d'exécution par tâche
- Taux de réussite par type de tâche
- Utilisation des ressources
- Coûts API par workflow

### Logs détaillés

Chaque exécution génère des logs structurés pour le debugging et l'optimisation.

---

## 🚀 Migration des endpoints existants

Les endpoints actuels peuvent être mappés vers ce système :

- `/api/prompt/enhance` → Tâche `enhance_prompt`
- `/api/images/analyze` → Tâche `describe_images`
- `/api/generate/text-to-image` → Tâche `generate_image`
- `/api/edit/image` → Tâche `edit_image`
- `/api/video/generate` → Tâches `generate_video_t2v/i2v`

Les anciens endpoints restent disponibles pour la compatibilité.

---

*Documentation du système de workflows - Version 1.0 - 3 novembre 2025*