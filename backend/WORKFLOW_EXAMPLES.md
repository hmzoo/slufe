# 📋 Exemples de Workflows JSON

> Collection d'exemples de workflows pour tester le système de tâches séquentielles

---

## 🎯 Workflow 1: Amélioration simple de prompt

**Description :** Améliore un prompt basique et génère une image

```json
{
  "workflow": {
    "id": "wf_simple_enhance",
    "name": "Amélioration et génération simple",
    "description": "Améliore un prompt utilisateur et génère une image correspondante",
    "version": "1.0",
    "tasks": [
      {
        "type": "enhance_prompt",
        "id": "enhance",
        "inputs": {
          "prompt": "{{input.user_prompt}}",
          "style": "réaliste",
          "language": "fr",
          "enhancementLevel": "high"
        }
      },
      {
        "type": "generate_image",
        "id": "generate",
        "inputs": {
          "prompt": "{{enhance.enhanced_prompt}}",
          "parameters": {
            "width": 1024,
            "height": 1024,
            "steps": 50,
            "quality": "high"
          }
        }
      }
    ],
    "outputs": {
      "final_image": "{{generate.image}}",
      "enhanced_prompt": "{{enhance.enhanced_prompt}}"
    }
  }
}
```

**Test avec cURL :**
```bash
curl -X POST http://localhost:3000/api/workflow/run \
  -H "Content-Type: application/json" \
  -d '{
    "workflow": {
      "workflow": {
        "id": "wf_simple_enhance",
        "name": "Test amélioration simple",
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
              "prompt": "{{enhance.enhanced_prompt}}"
            }
          }
        ],
        "outputs": {
          "result": "{{generate.image}}"
        }
      }
    },
    "inputs": {
      "user_prompt": "un chat dans un jardin"
    }
  }'
```

---

## 🔍 Workflow 2: Analyse d'images et génération

**Description :** Analyse des images uploadées, améliore la description et génère une nouvelle image

```json
{
  "workflow": {
    "id": "wf_analyze_generate",
    "name": "Analyse et régénération d'images",
    "description": "Analyse les images fournies et génère une nouvelle image basée sur la description",
    "tasks": [
      {
        "type": "describe_images",
        "id": "analyze",
        "inputs": {
          "images": "{{input.images}}",
          "analysisType": "comprehensive",
          "language": "fr"
        }
      },
      {
        "type": "enhance_prompt",
        "id": "enhance",
        "inputs": {
          "prompt": "Créer une version artistique de: {{analyze.descriptions[0]}}",
          "style": "artistique",
          "enhancementLevel": "high"
        }
      },
      {
        "type": "generate_image",
        "id": "create",
        "inputs": {
          "prompt": "{{enhance.enhanced_prompt}}",
          "parameters": {
            "width": 1024,
            "height": 1024,
            "steps": 75,
            "quality": "ultra"
          }
        }
      }
    ],
    "outputs": {
      "original_descriptions": "{{analyze.descriptions}}",
      "enhanced_prompt": "{{enhance.enhanced_prompt}}",
      "artistic_version": "{{create.image}}"
    }
  }
}
```

---

## 🎬 Workflow 3: Pipeline complet image vers vidéo

**Description :** Analyse une image, l'optimise pour l'animation et crée une vidéo

```json
{
  "workflow": {
    "id": "wf_image_to_video",
    "name": "Transformation image vers vidéo",
    "description": "Pipeline complet pour transformer une image statique en vidéo animée",
    "tasks": [
      {
        "type": "describe_images",
        "id": "analyze_source",
        "inputs": {
          "images": "{{input.images}}",
          "analysisType": "scene",
          "includeMood": true
        }
      },
      {
        "type": "enhance_prompt",
        "id": "create_animation_prompt",
        "inputs": {
          "prompt": "Animer cette scène: {{analyze_source.descriptions[0]}}",
          "style": "cinématographique",
          "enhancementLevel": "high"
        }
      },
      {
        "type": "edit_image",
        "id": "prepare_for_animation",
        "inputs": {
          "prompt": "optimiser pour l'animation vidéo, stabiliser les éléments",
          "images": "{{input.images}}",
          "parameters": {
            "strength": 0.3,
            "guidance_scale": 8.0
          }
        }
      },
      {
        "type": "generate_video_i2v",
        "id": "animate",
        "inputs": {
          "prompt": "{{create_animation_prompt.enhanced_prompt}}",
          "image": "{{prepare_for_animation.edited_image}}",
          "parameters": {
            "duration": 5,
            "fps": 24,
            "motion_strength": 0.8
          }
        }
      }
    ],
    "outputs": {
      "final_video": "{{animate.video}}",
      "prepared_image": "{{prepare_for_animation.edited_image}}",
      "analysis": "{{analyze_source.descriptions[0]}}"
    }
  }
}
```

---

## ✂️ Workflow 4: Édition multicouche d'images

**Description :** Édite une image en plusieurs étapes avec différents effets

```json
{
  "workflow": {
    "id": "wf_multi_edit",
    "name": "Édition multicouche",
    "description": "Applique plusieurs effets d'édition en séquence sur une image",
    "tasks": [
      {
        "type": "describe_images",
        "id": "analyze_original",
        "inputs": {
          "images": "{{input.images}}",
          "analysisType": "comprehensive"
        }
      },
      {
        "type": "edit_image",
        "id": "enhance_lighting",
        "inputs": {
          "prompt": "améliorer l'éclairage et les contrastes",
          "images": "{{input.images}}",
          "parameters": {
            "strength": 0.4
          }
        }
      },
      {
        "type": "edit_image",
        "id": "add_artistic_style",
        "inputs": {
          "prompt": "ajouter un style artistique moderne",
          "images": ["{{enhance_lighting.edited_image}}"],
          "parameters": {
            "strength": 0.6,
            "guidance_scale": 7.0
          }
        }
      },
      {
        "type": "edit_image",
        "id": "final_polish",
        "inputs": {
          "prompt": "finaliser avec des détails fins et une meilleure netteté",
          "images": ["{{add_artistic_style.edited_image}}"],
          "parameters": {
            "strength": 0.3,
            "guidance_scale": 9.0
          }
        }
      }
    ],
    "outputs": {
      "original_analysis": "{{analyze_original.descriptions[0]}}",
      "step1_lighting": "{{enhance_lighting.edited_image}}",
      "step2_style": "{{add_artistic_style.edited_image}}",
      "final_result": "{{final_polish.edited_image}}"
    }
  }
}
```

---

## 🎨 Workflow 5: Génération de variations

**Description :** Génère plusieurs variations d'une image basée sur un prompt

```json
{
  "workflow": {
    "id": "wf_variations",
    "name": "Génération de variations",
    "description": "Crée plusieurs versions d'une même idée avec des styles différents",
    "tasks": [
      {
        "type": "enhance_prompt",
        "id": "base_prompt",
        "inputs": {
          "prompt": "{{input.user_prompt}}",
          "enhancementLevel": "medium"
        }
      },
      {
        "type": "generate_image",
        "id": "version_realistic",
        "inputs": {
          "prompt": "{{base_prompt.enhanced_prompt}}, style réaliste photographique",
          "parameters": {
            "seed": 12345,
            "guidance_scale": 7.5
          }
        }
      },
      {
        "type": "generate_image",
        "id": "version_artistic",
        "inputs": {
          "prompt": "{{base_prompt.enhanced_prompt}}, style artistique peint à l'huile",
          "parameters": {
            "seed": 67890,
            "guidance_scale": 8.0
          }
        }
      },
      {
        "type": "generate_image",
        "id": "version_anime",
        "inputs": {
          "prompt": "{{base_prompt.enhanced_prompt}}, style anime japonais",
          "parameters": {
            "seed": 54321,
            "guidance_scale": 7.0
          }
        }
      }
    ],
    "outputs": {
      "enhanced_prompt": "{{base_prompt.enhanced_prompt}}",
      "realistic_version": "{{version_realistic.image}}",
      "artistic_version": "{{version_artistic.image}}",
      "anime_version": "{{version_anime.image}}"
    }
  }
}
```

---

## 🎞️ Workflow 6: Création de story-board vidéo

**Description :** Crée une séquence d'images puis les assemble en vidéo

```json
{
  "workflow": {
    "id": "wf_storyboard_video",
    "name": "Story-board vers vidéo",
    "description": "Génère une séquence d'images formant une histoire, puis crée une vidéo",
    "tasks": [
      {
        "type": "enhance_prompt",
        "id": "scene1_prompt",
        "inputs": {
          "prompt": "{{input.user_prompt}} - scène d'ouverture",
          "style": "cinématographique"
        }
      },
      {
        "type": "generate_image",
        "id": "scene1",
        "inputs": {
          "prompt": "{{scene1_prompt.enhanced_prompt}}",
          "parameters": {
            "width": 1024,
            "height": 576,
            "seed": 11111
          }
        }
      },
      {
        "type": "enhance_prompt",
        "id": "scene2_prompt",
        "inputs": {
          "prompt": "{{input.user_prompt}} - développement de l'action",
          "style": "cinématographique"
        }
      },
      {
        "type": "generate_image",
        "id": "scene2",
        "inputs": {
          "prompt": "{{scene2_prompt.enhanced_prompt}}",
          "parameters": {
            "width": 1024,
            "height": 576,
            "seed": 22222
          }
        }
      },
      {
        "type": "generate_video_i2v",
        "id": "video_scene1",
        "inputs": {
          "prompt": "transition fluide vers la scène suivante",
          "image": "{{scene1.image}}",
          "parameters": {
            "duration": 3,
            "fps": 24
          }
        }
      }
    ],
    "outputs": {
      "scene1_image": "{{scene1.image}}",
      "scene2_image": "{{scene2.image}}",
      "video_part1": "{{video_scene1.video}}"
    }
  }
}
```

---

## 🧪 Tests avec différents formats

### Test JSON simple (sans fichiers)
```bash
curl -X POST http://localhost:3000/api/workflow/run \
  -H "Content-Type: application/json" \
  -d @workflow_simple.json
```

### Test Multipart (avec fichiers)
```bash
curl -X POST http://localhost:3000/api/workflow/run \
  -F "workflow=@workflow.json" \
  -F "images[]=@image1.jpg" \
  -F "images[]=@image2.jpg" \
  -F "user_prompt=Créer quelque chose d'incroyable"
```

### Test avec Node.js/JavaScript
```javascript
const FormData = require('form-data');
const fs = require('fs');

const workflow = {
  workflow: {
    id: "test_workflow",
    tasks: [
      {
        type: "enhance_prompt",
        id: "enhance",
        inputs: {
          prompt: "{{input.user_prompt}}"
        }
      }
    ],
    outputs: {
      result: "{{enhance.enhanced_prompt}}"
    }
  }
};

const form = new FormData();
form.append('workflow', JSON.stringify(workflow));
form.append('user_prompt', 'un paysage de montagne');

fetch('http://localhost:3000/api/workflow/run', {
  method: 'POST',
  body: form
}).then(res => res.json()).then(console.log);
```

---

## 📊 Structure des réponses

### Réponse de succès
```json
{
  "success": true,
  "workflow_id": "wf_simple_enhance_exec_abc12345",
  "execution": {
    "status": "completed",
    "progress": {
      "total_tasks": 2,
      "completed_tasks": 2,
      "current_task": null,
      "percentage": 100
    },
    "execution_time": 47.2,
    "started_at": "2025-11-03T10:30:00.000Z",
    "completed_at": "2025-11-03T10:30:47.200Z"
  },
  "results": {
    "final_image": "https://storage.example.com/generated_image.jpg",
    "enhanced_prompt": "Un magnifique paysage de montagne..."
  },
  "task_results": [
    {
      "task_id": "enhance",
      "type": "enhance_prompt",
      "status": "completed",
      "execution_time": 2.1,
      "outputs": {
        "enhanced_prompt": "Un magnifique paysage de montagne...",
        "confidence": 0.92
      }
    },
    {
      "task_id": "generate",
      "type": "generate_image", 
      "status": "completed",
      "execution_time": 45.1,
      "outputs": {
        "image": "https://storage.example.com/generated_image.jpg"
      }
    }
  ]
}
```

### Réponse d'erreur
```json
{
  "success": false,
  "error": "Erreur lors de l'exécution du workflow",
  "details": "Tâche enhance échouée: API rate limit exceeded",
  "timestamp": "2025-11-03T10:30:00.000Z"
}
```

---

*Exemples de workflows - Version 1.0 - 3 novembre 2025*