# Workflows Multi-Étapes

## 📖 Vue d'ensemble

Le système de workflows multi-étapes permet d'orchestrer des opérations complexes en plusieurs étapes séquentielles, avec sauvegarde de chaque résultat intermédiaire.

## 🎯 Fonctionnalités

- ✅ **Exécution séquentielle** - Chaque étape s'exécute après la précédente
- ✅ **Transformation de prompts** - Extraction automatique des instructions pour chaque étape
- ✅ **Sauvegarde intermédiaire** - Chaque étape sauvegarde son résultat
- ✅ **Chaînage des résultats** - La sortie d'une étape devient l'entrée de la suivante
- ✅ **Gestion d'erreurs** - Arrêt propre en cas d'échec d'une étape
- ✅ **Tracking complet** - Durée, succès/échec de chaque étape

## 🔧 Architecture

### 1. Service Orchestrateur (`workflowOrchestrator.js`)

Responsable de l'exécution des workflows multi-étapes.

**Fonctions principales :**
- `executeMultiStepWorkflow()` - Orchestration complète
- `executeStep()` - Exécution d'une étape individuelle
- `saveStepResult()` - Sauvegarde du résultat intermédiaire

### 2. Intégration dans la route workflow

La route `/api/workflow/execute` détecte automatiquement les workflows multi-étapes et utilise l'orchestrateur.

## 📝 Configuration d'un Workflow Multi-Étapes

### Exemple : "Édition puis vidéo"

```javascript
{
  id: 'edit_then_video',
  name: 'Édition puis vidéo',
  description: 'Éditer l\'image puis créer une vidéo animée',
  steps: [
    {
      name: 'Édition de l\'image',
      service: 'imageEditor',
      method: 'editSingleImage',
      type: 'image',
      promptTransform: (prompt) => {
        // Extraire la partie édition
        // "édite cette image pour ajouter un coucher de soleil puis anime-la"
        // -> "ajouter un coucher de soleil"
        const parts = prompt.toLowerCase().split(/puis|ensuite|après/);
        return parts[0].trim();
      }
    },
    {
      name: 'Animation en vidéo',
      service: 'videoImageGenerator',
      method: 'generateVideoFromImage',
      type: 'video',
      promptTransform: (prompt) => {
        // Extraire la partie animation
        // "édite cette image puis anime-la avec des mouvements de caméra"
        // -> "avec des mouvements de caméra"
        const parts = prompt.toLowerCase().split(/puis|ensuite|après/);
        return parts.length > 1 ? parts[1].trim() : 'anime cette image';
      }
    }
  ]
}
```

### Propriétés d'une étape

| Propriété | Type | Description |
|-----------|------|-------------|
| `name` | string | Nom descriptif de l'étape |
| `service` | string | Service à utiliser (`imageEditor`, `videoGenerator`, `videoImageGenerator`) |
| `method` | string | Méthode du service à appeler |
| `type` | string | Type de sortie (`image` ou `video`) |
| `promptTransform` | function | Fonction pour transformer le prompt pour cette étape (optionnel) |

## 🔄 Flux d'exécution

```
1. Utilisateur envoie prompt + image
   "édite cette image pour ajouter un coucher de soleil puis anime-la"
   
2. Analyseur détecte workflow: edit_then_video

3. Orchestrateur charge la configuration
   - Étape 1: Édition d'image
   - Étape 2: Animation en vidéo

4. Exécution Étape 1
   ├─ Transform prompt: "ajouter un coucher de soleil"
   ├─ Appel imageEditor.editSingleImage()
   ├─ Résultat: URL de l'image éditée
   └─ Sauvegarde: backend/data/operations/
        ├─ 20251103_abc123_step_1_out.jpg
        └─ 20251103_abc123_step_1.json

5. Exécution Étape 2
   ├─ Input: Image éditée de l'étape 1
   ├─ Transform prompt: "anime-la"
   ├─ Appel videoImageGenerator.generateVideoFromImage()
   ├─ Résultat: URL de la vidéo
   └─ Sauvegarde: backend/data/operations/
        ├─ 20251103_def456_step_2_out.mp4
        └─ 20251103_def456_step_2.json

6. Retour au frontend
   {
     success: true,
     type: 'multi_step',
     steps: [
       { stepNumber: 1, name: 'Édition...', outputUrl: '...jpg', ... },
       { stepNumber: 2, name: 'Animation...', outputUrl: '...mp4', ... }
     ],
     finalUrl: 'https://...video.mp4',
     imageUrl: 'https://...edited-image.jpg'
   }
```

## 📊 Structure de réponse

### Workflow multi-étapes

```json
{
  "success": true,
  "type": "multi_step",
  "workflowId": "edit_then_video",
  "workflowName": "Édition puis vidéo",
  "steps": [
    {
      "stepNumber": 1,
      "name": "Édition de l'image",
      "type": "image",
      "outputUrl": "https://replicate.delivery/.../edited.jpg",
      "duration": 3456,
      "success": true
    },
    {
      "stepNumber": 2,
      "name": "Animation en vidéo",
      "type": "video",
      "outputUrl": "https://replicate.delivery/.../animated.mp4",
      "duration": 15234,
      "success": true
    }
  ],
  "finalType": "video",
  "finalUrl": "https://replicate.delivery/.../animated.mp4",
  "videoUrl": "https://replicate.delivery/.../animated.mp4",
  "imageUrl": "https://replicate.delivery/.../edited.jpg",
  "message": "Workflow complété: 2 étapes exécutées",
  "workflow": {
    "id": "edit_then_video",
    "name": "Édition puis vidéo",
    "confidence": 0.95
  },
  "prompts": {
    "original": "édite cette image pour ajouter un coucher de soleil puis anime-la",
    "optimized": "Edit this image to add a beautiful sunset sky, then create a smooth animated video",
    "used": "Edit this image to add a beautiful sunset sky, then create a smooth animated video"
  }
}
```

## 💾 Sauvegarde des étapes

Chaque étape génère :

### 1. Fichier de résultat
- **Nom**: `{operationId}_step_{N}_out.{ext}`
- **Exemple**: `20251103143022_abc123_step_1_out.jpg`
- **Contenu**: Image ou vidéo générée

### 2. Fichier de métadonnées
- **Nom**: `{operationId}_step_{N}.json`
- **Exemple**: `20251103143022_abc123_step_1.json`
- **Contenu**:
  ```json
  {
    "operationId": "20251103143022_abc123",
    "timestamp": "2025-11-03T14:30:22.123Z",
    "operationType": "edit_then_video_step_1",
    "prompt": "ajouter un coucher de soleil",
    "parameters": {
      "workflowId": "edit_then_video",
      "workflowName": "Édition puis vidéo",
      "stepNumber": 1,
      "stepName": "Édition de l'image",
      "originalPrompt": "édite cette image puis anime-la"
    },
    "inputFiles": ["20251103143022_abc123_in_1.jpg"],
    "outputFile": "20251103143022_abc123_step_1_out.jpg",
    "resultUrl": "https://replicate.delivery/.../edited.jpg",
    "workflowAnalysis": {
      "workflow": {
        "id": "edit_then_video",
        "name": "Édition puis vidéo"
      },
      "step": {
        "number": 1,
        "name": "Édition de l'image",
        "type": "image"
      }
    }
  }
  ```

## 🎨 Affichage dans le frontend

### Composant ResultDisplay amélioré

Pour afficher les workflows multi-étapes :

```vue
<template>
  <div v-if="result.type === 'multi_step'">
    <q-card>
      <q-card-section>
        <div class="text-h6">
          {{ result.workflowName }}
        </div>
        <q-linear-progress 
          :value="1" 
          color="positive" 
          size="4px" 
          class="q-mt-sm"
        />
      </q-card-section>

      <!-- Afficher chaque étape -->
      <q-card-section 
        v-for="step in result.steps" 
        :key="step.stepNumber"
      >
        <div class="step-container">
          <div class="step-header">
            <q-icon name="check_circle" color="positive" />
            <span class="text-subtitle1 q-ml-sm">
              Étape {{ step.stepNumber }}: {{ step.name }}
            </span>
            <q-chip size="sm" color="grey-3" class="q-ml-auto">
              {{ (step.duration / 1000).toFixed(1) }}s
            </q-chip>
          </div>

          <!-- Prévisualisation du résultat de l'étape -->
          <div class="step-result q-mt-sm">
            <q-img 
              v-if="step.type === 'image'"
              :src="step.outputUrl"
              style="max-height: 300px"
            />
            <video 
              v-if="step.type === 'video'"
              :src="step.outputUrl"
              controls
              style="max-width: 100%"
            />
          </div>
        </div>
      </q-card-section>

      <!-- Résultat final (grand format) -->
      <q-card-section>
        <div class="text-subtitle1 text-weight-bold">
          Résultat final
        </div>
        <video 
          v-if="result.finalType === 'video'"
          :src="result.finalUrl"
          controls
          class="final-result"
        />
      </q-card-section>

      <q-card-actions>
        <q-btn 
          label="Télécharger tout" 
          icon="download" 
          @click="downloadAll"
        />
      </q-card-actions>
    </q-card>
  </div>
</template>
```

## 🧪 Tests

### Test manuel

```bash
# 1. Démarrer le serveur
npm run dev

# 2. Préparer une image de test
# (copier une image dans /tmp/test.jpg)

# 3. Tester le workflow
curl -X POST http://localhost:3000/api/workflow/execute \
  -F 'prompt=édite cette image pour ajouter un coucher de soleil puis anime-la' \
  -F 'useOptimizedPrompt=true' \
  -F 'images=@/tmp/test.jpg'

# 4. Vérifier les fichiers créés
ls -lh backend/data/operations/

# Devrait afficher :
# 20251103_abc_in_1.jpg          # Image d'entrée
# 20251103_abc_step_1_out.jpg    # Image éditée
# 20251103_abc_step_1.json       # Métadonnées étape 1
# 20251103_def_step_2_out.mp4    # Vidéo finale
# 20251103_def_step_2.json       # Métadonnées étape 2
```

### Vérification des logs

Logs attendus :

```
🚀 Exécution automatique de workflow
📝 Prompt: édite cette image pour ajouter un coucher de soleil puis anime-la
🖼️  Images: 1
✅ Workflow détecté: Édition puis vidéo
🎬 Démarrage workflow multi-étapes: Édition puis vidéo
📋 Nombre d'étapes: 2

📍 Étape 1/2: Édition de l'image
  📝 Prompt pour cette étape: ajouter un coucher de soleil
  ✅ Étape terminée en 3456ms
  🔗 Résultat: https://replicate.delivery/.../edited.jpg
  💾 Résultat de l'étape 1 sauvegardé

📍 Étape 2/2: Animation en vidéo
  📝 Prompt pour cette étape: anime-la
  ✅ Étape terminée en 15234ms
  🔗 Résultat: https://replicate.delivery/.../video.mp4
  💾 Résultat de l'étape 2 sauvegardé

✅ Workflow Édition puis vidéo terminé avec succès
📊 2 étapes exécutées
💾 Opération workflow sauvegardée
✅ Exécution terminée avec succès
```

## 🚀 Ajouter un nouveau workflow multi-étapes

### 1. Définir le workflow

Dans `workflowOrchestrator.js` :

```javascript
export const MULTI_STEP_WORKFLOWS = {
  // ... workflows existants ...
  
  MY_NEW_WORKFLOW: {
    id: 'my_new_workflow',
    name: 'Mon nouveau workflow',
    description: 'Description du workflow',
    steps: [
      {
        name: 'Première étape',
        service: 'imageEditor',
        method: 'editSingleImage',
        type: 'image',
        promptTransform: (prompt) => {
          // Transformer le prompt pour cette étape
          return prompt;
        }
      },
      {
        name: 'Deuxième étape',
        service: 'videoGenerator',
        method: 'generateVideo',
        type: 'video',
        promptTransform: (prompt) => {
          return prompt;
        }
      }
    ]
  }
};
```

### 2. Ajouter dans l'analyseur

Dans `workflowAnalyzer.js`, ajouter le workflow :

```javascript
export const AVAILABLE_WORKFLOWS = {
  // ... workflows existants ...
  
  MY_NEW_WORKFLOW: {
    id: 'my_new_workflow',
    name: 'Mon nouveau workflow',
    description: 'Description',
    requires: { prompt: true, images: 1 },
    service: 'composite',
    steps: ['imageEditor', 'videoGenerator']
  }
};
```

### 3. Ajouter le cas dans la route

Dans `routes/workflow.js`, ajouter le case :

```javascript
case 'my_new_workflow':
  const multiStepWorkflow = getMultiStepWorkflow('my_new_workflow');
  const multiStepResult = await executeMultiStepWorkflow(multiStepWorkflow, context);
  result = { /* formater le résultat */ };
  break;
```

## 💡 Améliorations futures

- [ ] Parallélisation des étapes indépendantes
- [ ] Reprise sur erreur (retry automatique)
- [ ] Cache des résultats intermédiaires
- [ ] Annulation de workflow en cours
- [ ] Streaming des résultats progressifs
- [ ] Estimation du temps restant
- [ ] Workflows conditionnels (branchements)
- [ ] Composition dynamique de workflows

---

**Créé le** : 3 novembre 2025  
**Version** : 1.0  
**Status** : ✅ Opérationnel
