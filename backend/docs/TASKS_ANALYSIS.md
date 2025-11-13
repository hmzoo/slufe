# 📋 Analyse des Tâches du Workflow Builder

## 📅 Date: 6 novembre 2025

---

## 🏗️ Architecture des Tâches

### Structure d'une Tâche

Chaque tâche dans `taskDefinitions.js` suit cette structure:

```javascript
{
  type: 'nom_type',              // Identifiant unique
  name: 'Nom affiché',           // Nom dans l'interface
  icon: 'icone_material',        // Icône Material Design
  color: 'couleur',              // Couleur de la carte
  category: 'categorie',         // Catégorie (image, video, text, input)
  description: 'Description',    // Description courte
  model: 'Nom du modèle',        // Modèle IA utilisé ou "Local"
  noExecution: true/false,       // Si true, pas d'appel API (inputs seulement)
  
  inputs: {                      // Paramètres d'entrée
    nom_param: {
      type: 'type',              // text, image, images, video, select, number
      label: 'Libellé',
      placeholder: 'Texte aide',
      required: true/false,
      acceptsVariable: true/false, // Accepte {{variable}}
      multiline: true/false,     // Pour type 'text'
      multiple: true/false,      // Pour type 'image'
      options: [],               // Pour type 'select'
      min: 0,                    // Pour type 'number'
      max: 100,
      default: valeur,
      hint: 'Info bulle',
      hidden: true/false,        // Masqué dans UI (params avancés)
      executionTime: true/false  // Rempli à l'exécution (input_text)
    }
  },
  
  outputs: {                     // Sorties produites
    nom_output: {
      type: 'type',              // image, images, video, text, array, object
      description: 'Description'
    }
  }
}
```

---

## 📊 Liste Complète des Tâches

### 🖼️ Tâches Image (6 tâches)

#### 1. `generate_image` - Générer une image ✅

**Modèle**: Qwen-Image  
**Status**: ✅ **Opérationnelle**

**Inputs**:
- `prompt` (text, requis) - Description de l'image
- `aspectRatio` (select) - Format: 1:1, 9:16, 16:9, 3:4, 4:3

**Outputs**:
- `image` (image) - URL de l'image générée

**Backend**: `imageGenerator.js::generateImage()`

**Notes**: Fonctionne correctement, génération rapide

---

#### 2. `edit_image` - Éditer une image ✅

**Modèle**: Qwen-Image-Edit-Plus  
**Status**: ✅ **Opérationnelle**

**Inputs**:
- `image1` (image, requis)
- `image2` (image, optionnel)
- `image3` (image, optionnel)
- `editPrompt` (text, requis) - Instructions d'édition
- `aspectRatio` (select) - Format de sortie

**Outputs**:
- `edited_images` (images) - URLs des images modifiées

**Backend**: `imageEditor.js::editImage()`

**Notes**: Supporte jusqu'à 3 images en entrée

---

#### 3. `image_resize_crop` - Redimensionner/Recadrer ✅

**Modèle**: Sharp (local)  
**Status**: ✅ **Opérationnelle**

**Inputs**:
- `image` (image, requis)
- `h_max` (number) - Largeur max (1-4096, défaut: 1024)
- `v_max` (number) - Hauteur max (1-4096, défaut: 1024)
- `ratio` (select) - Ratio d'aspect (keep, 1:1, 16:9, 9:16, etc.)
- `crop_center` (select) - Position: center, top, bottom, head

**Outputs**:
- `image_url` (image) - Image traitée
- `original_dimensions` (object) - Dimensions originales
- `final_dimensions` (object) - Dimensions finales
- `applied_operations` (object) - Opérations appliquées

**Backend**: Service de traitement d'image local

**Notes**: Traitement local rapide, pas d'API externe

---

#### 4. `describe_images` - Analyser des images ✅

**Modèle**: LLaVA-13B  
**Status**: ✅ **Opérationnelle**

**Inputs**:
- `images` (images, requis, multiple) - Images à analyser
- `question` (text, optionnel) - Question sur l'image
- `language` (select) - Langue: en (recommandé), fr

**Outputs**:
- `descriptions` (array) - Descriptions textuelles

**Backend**: Service d'analyse d'images

**Notes**: 
- Langue anglaise recommandée pour meilleure qualité
- Utile avant génération vidéo (descriptions précises)

---

#### 5. `input_images` - Upload d'images ✅

**Modèle**: Local  
**Status**: ✅ **Opérationnelle**  
**noExecution**: true

**Inputs**:
- `label` (text, requis) - Libellé du champ
- `multiple` (select) - Une seule ou plusieurs images

**Outputs**:
- `images` (images) - Images uploadées

**Backend**: Aucun (stockage local)

**Notes**: Tâche input, pas d'appel API

---

#### 6. `camera_capture` - Capture caméra ✅

**Modèle**: Local  
**Status**: ✅ **Opérationnelle**  
**noExecution**: true

**Inputs**:
- `label` (text, requis) - Libellé
- `facingMode` (select) - Caméra: user (avant), environment (arrière)

**Outputs**:
- `image` (image) - Image capturée

**Backend**: Aucun (capture navigateur)

**Notes**: Utilise l'API WebRTC du navigateur

---

### 🎬 Tâches Vidéo (4 tâches)

#### 7. `generate_video_t2v` - Générer vidéo (texte) ⚠️

**Modèle**: Wan 2.2 T2V  
**Status**: ⚠️ **PROBLÈME DÉTECTÉ**

**Inputs**:
- `prompt` (text, requis) - Description de la vidéo
- `numFrames` (select) - 81 frames (~3-5s) ou 121 frames (~5-8s)
- `aspectRatio` (select) - 16:9 ou 9:16
- `loraWeightsTransformer` (text, optionnel) - URL LoRA 1
- `loraScaleTransformer` (number, 0-2, défaut: 1.0) - Poids LoRA 1
- `loraWeightsTransformer2` (text, optionnel) - URL LoRA 2
- `loraScaleTransformer2` (number, 0-2, défaut: 1.0) - Poids LoRA 2

**Outputs**:
- `video` (video) - URL de la vidéo générée

**Backend**: `videoGenerator.js::generateVideo()`

**Problèmes Identifiés**:
1. ❌ **Paramètres manquants dans backend**:
   - `resolution` (défini dans validation mais pas utilisé)
   - `framesPerSecond` (défini mais pas dans inputs frontend)
   - `interpolateOutput` (manque frontend)
   - `goFast` (manque frontend)
   - `sampleShift` (manque frontend)
   - `seed` (manque frontend)
   - `disableSafetyChecker` (manque frontend)

2. ❌ **Incohérence nomenclature**:
   - Frontend: `numFrames` (camelCase)
   - Backend attend: `num_frames` (snake_case)
   - Frontend: `aspectRatio`
   - Backend attend: `aspect_ratio`

3. ❌ **Paramètres LoRA**:
   - Nomenclature différente frontend/backend
   - Manque validation côté frontend

**Actions requises**:
- ✅ Ajouter paramètres manquants dans taskDefinitions.js
- ✅ Uniformiser nomenclature (camelCase → snake_case)
- ✅ Ajouter validation LoRA URLs
- ✅ Exposer paramètres avancés (hidden: true)

---

#### 8. `generate_video_i2v` - Générer vidéo (image) ⚠️

**Modèle**: Wan 2.2 I2V  
**Status**: ⚠️ **PROBLÈME DÉTECTÉ**

**Inputs**:
- `image` (image, requis) - Image de départ
- `lastImage` (image, optionnel) - Image de fin pour transition
- `prompt` (text, requis) - Description du mouvement
- `numFrames` (select) - 81 ou 121 frames
- `aspectRatio` (select) - 16:9 ou 9:16
- `loraWeightsTransformer` (text, optionnel)
- `loraScaleTransformer` (number, 0-2)
- `loraWeightsTransformer2` (text, optionnel)
- `loraScaleTransformer2` (number, 0-2)

**Outputs**:
- `video` (video) - URL de la vidéo générée

**Backend**: `videoImageGenerator.js::generateVideoFromImage()`

**Problèmes Identifiés**:
1. ❌ **Même problèmes nomenclature que T2V**:
   - `numFrames` vs `num_frames`
   - `aspectRatio` vs `aspect_ratio`
   - `lastImage` vs `last_image`

2. ❌ **Paramètres manquants**:
   - Même liste que T2V (resolution, fps, etc.)

3. ⚠️ **Image upload**:
   - Besoin vérifier format accepté (URL vs Buffer)
   - Vérifier support `lastImage` dans backend

**Actions requises**:
- ✅ Uniformiser nomenclature
- ✅ Vérifier support lastImage
- ✅ Ajouter paramètres avancés
- ✅ Tests avec images de différentes sources

---

#### 9. `video_extract_frame` - Extraire une frame ❓

**Modèle**: FFmpeg  
**Status**: ❓ **NON TESTÉE**

**Inputs**:
- `video` (video, requis) - Vidéo source
- `frameType` (select) - first, last, middle, time
- `timeCode` (text, optionnel) - Format: 00:00:05.50 ou 5.5
- `outputFormat` (select) - jpg, png, webp
- `quality` (number, 1-100, défaut: 95)

**Outputs**:
- `image_url` (image) - Image extraite
- `frame_info` (object) - Infos sur la frame

**Backend**: ❓ **SERVICE MANQUANT**

**Problèmes Identifiés**:
1. ❌ **Backend non implémenté**:
   - Pas de service `videoProcessor.js::extractFrame()`
   - Besoin créer service FFmpeg

2. ❌ **Dépendance FFmpeg**:
   - Vérifier si FFmpeg installé sur serveur
   - Ajouter dans package.json si besoin

**Actions requises**:
- 🔨 Créer service `videoProcessor.js`
- 🔨 Implémenter `extractFrame()` avec FFmpeg
- ✅ Ajouter validation timeCode
- ✅ Tests extraction à différents moments

---

#### 10. `video_concatenate` - Concaténer des vidéos ❓

**Modèle**: FFmpeg  
**Status**: ❓ **NON TESTÉE**

**Inputs**:
- `video1` (video, requis) - Première vidéo
- `video2` (video, requis) - Deuxième vidéo
- `outputFormat` (select, hidden) - mp4, mov, avi, mkv, webm
- `resolution` (select, hidden) - Auto, 720p, 1080p, 2K, 4K, stories
- `fps` (select, hidden) - Auto, 24, 25, 30, 60
- `quality` (select, hidden) - low, medium, high

**Outputs**:
- `video_url` (video) - Vidéo concaténée
- `concat_info` (object) - Infos concaténation

**Backend**: ❓ **SERVICE MANQUANT**

**Problèmes Identifiés**:
1. ❌ **Backend non implémenté**:
   - Pas de service `videoProcessor.js::concatenate()`
   - Besoin logique complexe (résolution commune, FPS, etc.)

2. ⚠️ **Paramètres hidden**:
   - Tous les paramètres avancés sont `hidden: true`
   - UI doit gérer affichage/masquage

3. ❌ **Résolution automatique**:
   - Logique complexe pour trouver résolution commune
   - Gestion des différences de ratio

**Actions requises**:
- 🔨 Créer service complet concaténation
- 🔨 Logique résolution/FPS automatique
- ✅ Tests avec vidéos différentes formats
- ✅ UI pour paramètres avancés

---

### 📝 Tâches Texte (2 tâches)

#### 11. `enhance_prompt` - Améliorer un prompt ✅

**Modèle**: Gemini 2.5 Flash  
**Status**: ✅ **Opérationnelle**

**Inputs**:
- `prompt` (text, requis) - Prompt à améliorer
- `targetType` (select) - image, edit, video
- `style` (select) - photographic, artistic, cinematic, realistic, fantasy
- `imageDescription1` (text, optionnel) - Contexte image 1
- `imageDescription2` (text, optionnel) - Contexte image 2

**Outputs**:
- `enhanced_prompt` (text) - Prompt amélioré
- `original_prompt` (text) - Prompt original

**Backend**: `promptEnhancer.js::enhancePrompt()`

**Notes**: 
- Fonctionne bien
- Utile avant génération image/vidéo
- Support contexte multi-images

---

#### 12. `input_text` - Saisie de texte ✅

**Modèle**: Local  
**Status**: ✅ **Opérationnelle**  
**noExecution**: true

**Inputs**:
- `label` (text, requis) - Libellé du champ
- `placeholder` (text, optionnel) - Texte d'aide
- `defaultValue` (text, optionnel) - Valeur initiale
- `userInput` (text, executionTime: true) - Rempli à l'exécution

**Outputs**:
- `text` (text) - Texte saisi
- `label` (text) - Libellé
- `timestamp` (text) - Horodatage

**Backend**: Aucun (stockage local)

**Notes**: Tâche input dynamique, valeur saisie lors de l'exécution

---

## 🔍 Problèmes Globaux Identifiés

### 1. ❌ Incohérence Nomenclature Frontend/Backend

**Problème**: Les noms de paramètres diffèrent entre frontend et backend

**Exemples**:
```javascript
// Frontend (taskDefinitions.js)
inputs: {
  numFrames: { ... },
  aspectRatio: { ... },
  lastImage: { ... }
}

// Backend attend (videoGenerator.js)
{
  num_frames: ...,
  aspect_ratio: ...,
  last_image: ...
}
```

**Impact**: 
- ❌ Paramètres ignorés par le backend
- ❌ Valeurs par défaut utilisées au lieu des valeurs user
- ❌ Vidéos générées pas selon les specs demandées

**Solution**:
```javascript
// Option 1: Uniformiser frontend (recommandé)
inputs: {
  num_frames: { ... },
  aspect_ratio: { ... }
}

// Option 2: Mapper dans workflowOrchestrator
function mapTaskParams(taskType, frontendParams) {
  const mapping = {
    numFrames: 'num_frames',
    aspectRatio: 'aspect_ratio',
    lastImage: 'last_image'
  };
  // ... logique mapping
}
```

---

### 2. ❌ Services Backend Manquants

**Tâches sans backend**:
1. `video_extract_frame` - Manque service FFmpeg extraction
2. `video_concatenate` - Manque service FFmpeg concaténation

**Impact**:
- ❌ Tâches affichées dans UI mais non fonctionnelles
- ❌ Erreur lors de l'exécution
- ❌ Mauvaise expérience utilisateur

**Solution**:
```javascript
// Créer videoProcessor.js
export async function extractFrame(params) {
  // Logique FFmpeg extraction frame
}

export async function concatenateVideos(params) {
  // Logique FFmpeg concaténation
}
```

---

### 3. ⚠️ Paramètres Avancés Manquants

**Tâches vidéo T2V/I2V manquent**:
- `resolution` (480p, 720p)
- `framesPerSecond` (5-30 FPS)
- `interpolateOutput` (boolean)
- `goFast` (boolean)
- `sampleShift` (1-20, intensité mouvement)
- `seed` (reproductibilité)
- `disableSafetyChecker` (boolean)

**Impact**:
- ⚠️ Utilisateur ne peut pas contrôler qualité
- ⚠️ Temps génération pas optimisable
- ⚠️ Pas de reproductibilité

**Solution**:
```javascript
// Ajouter dans taskDefinitions.js avec hidden: true
inputs: {
  // ... params existants
  
  resolution: {
    type: 'select',
    label: 'Résolution',
    required: false,
    hidden: true, // Paramètre avancé
    options: [
      { label: '480p (rapide)', value: '480p' },
      { label: '720p (qualité)', value: '720p' }
    ],
    default: '480p'
  },
  
  sampleShift: {
    type: 'number',
    label: 'Intensité du mouvement',
    required: false,
    hidden: true,
    min: 1,
    max: 20,
    default: 12,
    hint: '1-20, plus élevé = mouvement plus intense'
  }
  
  // ... autres paramètres
}
```

---

### 4. ❌ Validation LoRA Insuffisante

**Problème**: URLs LoRA acceptent n'importe quelle chaîne

**Risques**:
- ❌ URLs invalides passent la validation
- ❌ Erreur lors de l'exécution backend
- ❌ Gaspillage crédits API

**Solution**:
```javascript
// Ajouter validation URL LoRA
loraWeightsTransformer: {
  type: 'text',
  label: 'URL LoRA 1 (optionnel)',
  placeholder: 'https://replicate.delivery/pbxt/...',
  required: false,
  acceptsVariable: true,
  validation: {
    pattern: /^https:\/\/replicate\.delivery\/pbxt\/.+$/,
    message: 'URL LoRA invalide (doit commencer par https://replicate.delivery/pbxt/)'
  }
}
```

---

## 📋 Plan d'Action Correction

### Phase 1: Corrections Critiques (Priorité Haute) - 2h

#### 1.1. Uniformiser Nomenclature (30min)

**Fichier**: `frontend/src/config/taskDefinitions.js`

```javascript
// Renommer tous les paramètres en snake_case
generate_video_t2v: {
  inputs: {
    prompt: { ... },
    num_frames: { ... },      // ex: numFrames
    aspect_ratio: { ... },    // ex: aspectRatio
    lora_weights_transformer: { ... },
    lora_scale_transformer: { ... }
  }
}

generate_video_i2v: {
  inputs: {
    image: { ... },
    last_image: { ... },      // ex: lastImage
    prompt: { ... },
    num_frames: { ... },
    aspect_ratio: { ... }
  }
}
```

**Validation**: Tester génération vidéo avec paramètres

---

#### 1.2. Ajouter Paramètres Manquants Vidéo (1h)

**Fichier**: `frontend/src/config/taskDefinitions.js`

```javascript
generate_video_t2v: {
  inputs: {
    // ... params existants
    
    resolution: {
      type: 'select',
      label: 'Résolution',
      required: false,
      hidden: true,
      options: [
        { label: '480p (rapide)', value: '480p' },
        { label: '720p (qualité)', value: '720p' }
      ],
      default: '480p'
    },
    
    frames_per_second: {
      type: 'number',
      label: 'FPS',
      required: false,
      hidden: true,
      min: 5,
      max: 30,
      default: 16,
      hint: 'Images par seconde (5-30)'
    },
    
    interpolate_output: {
      type: 'select',
      label: 'Interpoler à 30 FPS',
      required: false,
      hidden: true,
      options: [
        { label: 'Oui (plus fluide)', value: true },
        { label: 'Non (original)', value: false }
      ],
      default: true
    },
    
    go_fast: {
      type: 'select',
      label: 'Mode rapide',
      required: false,
      hidden: true,
      options: [
        { label: 'Activé (recommandé)', value: true },
        { label: 'Désactivé', value: false }
      ],
      default: true
    },
    
    sample_shift: {
      type: 'number',
      label: 'Intensité du mouvement',
      required: false,
      hidden: true,
      min: 1,
      max: 20,
      default: 12,
      hint: '1-20, plus élevé = mouvement plus intense'
    },
    
    seed: {
      type: 'number',
      label: 'Seed (reproductibilité)',
      required: false,
      hidden: true,
      min: 0,
      max: 2147483647,
      hint: 'Laisser vide pour aléatoire'
    },
    
    disable_safety_checker: {
      type: 'select',
      label: 'Désactiver filtre contenu',
      required: false,
      hidden: true,
      options: [
        { label: 'Non (recommandé)', value: false },
        { label: 'Oui', value: true }
      ],
      default: false
    }
  }
}

// Ajouter aussi pour generate_video_i2v
```

**Validation**: 
- ✅ Tous les paramètres backend disponibles
- ✅ Valeurs par défaut cohérentes

---

#### 1.3. Validation URLs LoRA (30min)

**Fichier**: `frontend/src/config/taskDefinitions.js`

```javascript
lora_weights_transformer: {
  type: 'text',
  label: 'URL LoRA 1 (optionnel)',
  placeholder: 'https://replicate.delivery/pbxt/...',
  required: false,
  acceptsVariable: true,
  validation: {
    pattern: /^https:\/\/replicate\.delivery\/pbxt\/.+$/,
    message: 'URL LoRA invalide'
  }
}
```

**Ajouter validation dans WorkflowBuilder**:
```vue
<!-- WorkflowBuilder.vue -->
<script setup>
function validateLoraUrl(url) {
  if (!url) return true; // Optionnel
  const pattern = /^https:\/\/replicate\.delivery\/pbxt\/.+$/;
  return pattern.test(url);
}
</script>
```

---

### Phase 2: Services Backend Manquants (Priorité Moyenne) - 4h

#### 2.1. Créer videoProcessor.js (2h)

**Fichier**: `backend/services/videoProcessor.js`

```javascript
import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import { saveMediaFile } from '../utils/fileUtils.js';

/**
 * Extrait une frame d'une vidéo
 */
export async function extractFrame(params) {
  const { video, frameType = 'first', timeCode, outputFormat = 'jpg', quality = 95 } = params;
  
  // Logique extraction avec FFmpeg
  // - Télécharger vidéo si URL
  // - Extraire frame selon frameType
  // - Sauvegarder image
  // - Retourner URL
}

/**
 * Concatène deux vidéos
 */
export async function concatenateVideos(params) {
  const { video1, video2, outputFormat = 'mp4', resolution, fps, quality = 'medium' } = params;
  
  // Logique concaténation avec FFmpeg
  // - Télécharger vidéos
  // - Détecter résolution commune
  // - Concaténer
  // - Retourner URL
}
```

**Installation FFmpeg**:
```bash
npm install fluent-ffmpeg
# + installer binaire FFmpeg sur serveur
```

---

#### 2.2. Intégrer dans workflowOrchestrator (1h)

**Fichier**: `backend/services/workflowOrchestrator.js`

```javascript
import { extractFrame, concatenateVideos } from './videoProcessor.js';

async function executeStep(step, input, stepNumber) {
  // ... code existant
  
  switch (step.service) {
    // ... cas existants
    
    case 'videoProcessor':
      if (step.method === 'extractFrame') {
        result = await extractFrame(input);
      } else if (step.method === 'concatenate') {
        result = await concatenateVideos(input);
      }
      break;
  }
}
```

---

#### 2.3. Tests (1h)

**Tests manuels**:
1. Extraire première frame d'une vidéo générée
2. Extraire frame au milieu
3. Concaténer 2 vidéos même format
4. Concaténer 2 vidéos formats différents
5. Vérifier résolution automatique

---

### Phase 3: Améliorations UI (Priorité Basse) - 2h

#### 3.1. Affichage Paramètres Avancés (1h)

**Fichier**: `frontend/src/components/WorkflowBuilder.vue`

```vue
<template>
  <div class="task-inputs">
    <!-- Paramètres normaux -->
    <div v-for="input in normalInputs" :key="input.name">
      <!-- ... -->
    </div>
    
    <!-- Toggle paramètres avancés -->
    <q-expansion-item 
      v-if="hiddenInputs.length > 0"
      label="Paramètres avancés"
      icon="settings"
      class="q-mt-md"
    >
      <div v-for="input in hiddenInputs" :key="input.name" class="q-pa-md">
        <!-- ... -->
      </div>
    </q-expansion-item>
  </div>
</template>

<script setup>
const normalInputs = computed(() => 
  Object.entries(task.inputs).filter(([_, def]) => !def.hidden)
);

const hiddenInputs = computed(() => 
  Object.entries(task.inputs).filter(([_, def]) => def.hidden)
);
</script>
```

---

#### 3.2. Indicateurs Status Tâches (30min)

**Ajouter badges status dans liste tâches**:

```vue
<q-item>
  <q-item-section avatar>
    <q-avatar :color="task.color">
      <q-icon :name="task.icon" />
    </q-avatar>
  </q-item-section>
  
  <q-item-section>
    <q-item-label>{{ task.name }}</q-item-label>
    <q-item-label caption>{{ task.description }}</q-item-label>
  </q-item-section>
  
  <q-item-section side>
    <q-badge 
      v-if="getTaskStatus(task.type) === 'ok'" 
      color="positive" 
      label="OK"
    />
    <q-badge 
      v-else-if="getTaskStatus(task.type) === 'warning'" 
      color="warning" 
      label="⚠️"
    >
      <q-tooltip>{{ getTaskWarning(task.type) }}</q-tooltip>
    </q-badge>
    <q-badge 
      v-else-if="getTaskStatus(task.type) === 'error'" 
      color="negative" 
      label="❌"
    >
      <q-tooltip>{{ getTaskError(task.type) }}</q-tooltip>
    </q-badge>
  </q-item-section>
</q-item>
```

---

#### 3.3. Documentation Inline (30min)

**Ajouter tooltips explicatifs**:

```vue
<q-input
  v-model="taskInput.sample_shift"
  label="Intensité du mouvement"
  type="number"
  :min="1"
  :max="20"
>
  <template #append>
    <q-icon name="help" color="grey" size="sm">
      <q-tooltip max-width="300px" class="bg-indigo text-body2">
        <div class="q-mb-sm text-weight-bold">Intensité du mouvement</div>
        <div>Contrôle la quantité de mouvement dans la vidéo:</div>
        <ul class="q-pl-md q-my-sm">
          <li>1-5: Mouvement subtil, scène calme</li>
          <li>6-12: Mouvement modéré (recommandé)</li>
          <li>13-20: Mouvement intense, action dynamique</li>
        </ul>
        <div class="text-caption text-grey-4">Valeur par défaut: 12</div>
      </q-tooltip>
    </q-icon>
  </template>
</q-input>
```

---

## 📊 Résumé État des Tâches

### ✅ Opérationnelles (10 tâches)

1. `generate_image` - Générer une image
2. `edit_image` - Éditer une image
3. `image_resize_crop` - Redimensionner/Recadrer
4. `describe_images` - Analyser des images
5. `enhance_prompt` - Améliorer un prompt
6. `input_text` - Saisie de texte
7. `input_images` - Upload d'images
8. `camera_capture` - Capture caméra

### ⚠️ Problèmes à Corriger (2 tâches)

9. `generate_video_t2v` - Générer vidéo (texte)
   - ❌ Nomenclature incohérente
   - ❌ Paramètres manquants
   - ⚠️ Validation LoRA

10. `generate_video_i2v` - Générer vidéo (image)
    - ❌ Nomenclature incohérente
    - ❌ Paramètres manquants
    - ⚠️ Support lastImage à vérifier

### ❌ Non Implémentées (2 tâches)

11. `video_extract_frame` - Extraire une frame
    - ❌ Backend manquant
    - 🔨 Créer videoProcessor.js

12. `video_concatenate` - Concaténer des vidéos
    - ❌ Backend manquant
    - 🔨 Créer videoProcessor.js

---

## ⏱️ Estimation Temps Total Corrections

- **Phase 1** (Critique): 2h
- **Phase 2** (Backend): 4h
- **Phase 3** (UI): 2h

**Total**: **8 heures** pour avoir toutes les tâches opérationnelles

---

## 🎯 Recommandation

**Commencer par Phase 1** (2h):
1. Uniformiser nomenclature
2. Ajouter paramètres manquants
3. Validation LoRA

→ **Gain immédiat**: Tâches vidéo T2V/I2V fonctionnelles avec tous les paramètres

Puis **Phase 2** si besoin extraction/concaténation vidéo.

**Phase 3** peut être faite progressivement (amélioration UX).

---

**Document prêt pour corrections !** 🚀
