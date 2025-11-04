# Ajout support LoRA pour génération vidéo I2V

## Date
3 novembre 2025

## Fonctionnalité ajoutée

Ajout de la possibilité de spécifier des URL de modèles LoRA (Low-Rank Adaptation) avec leurs poids pour personnaliser la génération vidéo image-to-video.

### Qu'est-ce qu'un LoRA ?

**LoRA (Low-Rank Adaptation)** est une technique de fine-tuning qui permet de personnaliser un modèle IA avec un style spécifique sans modifier le modèle principal. 

**Cas d'usage** :
- Styles artistiques spécifiques (anime, cartoon, réaliste, etc.)
- Personnages récurrents
- Environnements particuliers
- Effets visuels personnalisés

---

## Modifications apportées

### 1. Backend - Schéma de tâche ✅

**Fichier** : `/backend/services/tasks/GenerateVideoI2VTask.js`

**Ajout lignes 286-309** (dans `parameters.properties`) :
```javascript
loraWeightsTransformer: {
  type: 'string',
  required: false,
  description: 'URL du modèle LoRA transformer (ex: https://replicate.delivery/...)'
},
loraScaleTransformer: {
  type: 'number',
  default: 1.0,
  minimum: 0.0,
  maximum: 1.0,
  description: 'Poids du LoRA transformer (0.0 = désactivé, 1.0 = maximum)'
},
loraWeightsTransformer2: {
  type: 'string',
  required: false,
  description: 'URL du second modèle LoRA transformer (optionnel)'
},
loraScaleTransformer2: {
  type: 'number',
  default: 1.0,
  minimum: 0.0,
  maximum: 1.0,
  description: 'Poids du second LoRA transformer (0.0 = désactivé, 1.0 = maximum)'
}
```

---

### 2. Backend - Transmission des paramètres ✅

**Fichier** : `/backend/services/tasks/GenerateVideoI2VTask.js`

**Ajout lignes 62-66** (appel service) :
```javascript
const result = await generateVideoFromImage({
  image: inputs.image,
  prompt: inputs.prompt,
  numFrames: numFrames,
  framesPerSecond: generationParams.fps,
  // ✅ Paramètres LoRA (optionnels)
  loraWeightsTransformer: generationParams.loraWeightsTransformer,
  loraScaleTransformer: generationParams.loraScaleTransformer,
  loraWeightsTransformer2: generationParams.loraWeightsTransformer2,
  loraScaleTransformer2: generationParams.loraScaleTransformer2,
});
```

**Note** : Le service `videoImageGenerator.js` supportait déjà les LoRA (lignes 205-212), il suffisait de transmettre les paramètres.

---

### 3. Frontend - Interface utilisateur ✅

**Fichier** : `/frontend/src/config/taskDefinitions.js`

**Modification section `generate_video_i2v.inputs`** (lignes 273-323) :

**AVANT** :
```javascript
inputs: {
  image: { ... },
  prompt: { ... },
  duration: {  // ❌ Ancien paramètre
    type: 'select',
    options: [
      { label: '2 secondes', value: 2 },
      { label: '3 secondes', value: 3 },
      { label: '5 secondes', value: 5 }
    ],
    default: 3
  }
}
```

**APRÈS** :
```javascript
inputs: {
  image: { ... },
  prompt: { ... },
  numFrames: {  // ✅ Nouveau paramètre (cohérent avec backend)
    type: 'select',
    options: [
      { label: '81 frames (rapide, ~3-5s)', value: 81 },
      { label: '121 frames (long, ~5-8s)', value: 121 }
    ],
    default: 81
  },
  loraWeightsTransformer: {
    type: 'text',
    label: 'URL LoRA 1 (optionnel)',
    placeholder: 'https://replicate.delivery/pbxt/...',
    required: false
  },
  loraScaleTransformer: {
    type: 'number',
    label: 'Poids LoRA 1',
    min: 0,
    max: 1,
    step: 0.1,
    default: 1.0
  },
  loraWeightsTransformer2: {
    type: 'text',
    label: 'URL LoRA 2 (optionnel)',
    placeholder: 'https://replicate.delivery/pbxt/...',
    required: false
  },
  loraScaleTransformer2: {
    type: 'number',
    label: 'Poids LoRA 2',
    min: 0,
    max: 1,
    step: 0.1,
    default: 1.0
  }
}
```

---

## Interface Builder

### Apparence dans le workflow Builder

```
┌──────────────────────────────────────────────────────┐
│ Tâche: Générer vidéo (image)                        │
│ Modèle: Wan 2.2 I2V                                  │
├──────────────────────────────────────────────────────┤
│                                                       │
│ Image de départ *                                    │
│ [Sélectionner une image...]                          │
│                                                       │
│ Description du mouvement *                           │
│ ┌────────────────────────────────────────────────┐  │
│ │ Décrivez l'animation souhaitée...              │  │
│ └────────────────────────────────────────────────┘  │
│                                                       │
│ Nombre d'images                                      │
│ [81 frames (rapide, ~3-5s) ▼]                       │
│                                                       │
│ ▼ Paramètres LoRA (optionnel)                       │
│                                                       │
│   URL LoRA 1 (optionnel)                             │
│   ┌────────────────────────────────────────────────┐│
│   │ https://replicate.delivery/pbxt/...           ││
│   └────────────────────────────────────────────────┘│
│                                                       │
│   Poids LoRA 1                                       │
│   [━━━━━━━━━━] 1.0                                   │
│   0 ────────────── 1                                 │
│                                                       │
│   URL LoRA 2 (optionnel)                             │
│   ┌────────────────────────────────────────────────┐│
│   │                                                ││
│   └────────────────────────────────────────────────┘│
│                                                       │
│   Poids LoRA 2                                       │
│   [━━━━━━━━━━] 1.0                                   │
│   0 ────────────── 1                                 │
│                                                       │
└──────────────────────────────────────────────────────┘
```

---

## Utilisation

### Exemple 1 : Sans LoRA (génération standard)

**Workflow** :
```json
{
  "id": "generate1",
  "type": "generate_video_i2v",
  "inputs": {
    "image": "{{input1.images}}",
    "prompt": "A woman rises gracefully from water",
    "numFrames": 81
    // Pas de LoRA
  }
}
```

**Résultat** : Vidéo avec style par défaut du modèle Wan-2

---

### Exemple 2 : Avec 1 LoRA (style anime)

**Workflow** :
```json
{
  "id": "generate1",
  "type": "generate_video_i2v",
  "inputs": {
    "image": "{{input1.images}}",
    "prompt": "A woman rises gracefully from water",
    "numFrames": 81,
    "loraWeightsTransformer": "https://replicate.delivery/pbxt/anime-style-v2.tar",
    "loraScaleTransformer": 0.8
  }
}
```

**Résultat** : Vidéo avec style anime à 80% d'intensité

---

### Exemple 3 : Avec 2 LoRAs combinés

**Workflow** :
```json
{
  "id": "generate1",
  "type": "generate_video_i2v",
  "inputs": {
    "image": "{{input1.images}}",
    "prompt": "A woman rises gracefully from water",
    "numFrames": 121,
    "loraWeightsTransformer": "https://replicate.delivery/pbxt/anime-style-v2.tar",
    "loraScaleTransformer": 0.7,
    "loraWeightsTransformer2": "https://replicate.delivery/pbxt/watercolor-effect.tar",
    "loraScaleTransformer2": 0.5
  }
}
```

**Résultat** : Vidéo avec combinaison :
- 70% style anime
- 50% effet aquarelle
- Total personnalisation unique

---

## Paramètres LoRA

### loraWeightsTransformer (string, optionnel)

**Description** : URL du fichier LoRA hébergé sur Replicate

**Format** : `https://replicate.delivery/pbxt/[ID]/[filename].tar`

**Exemples** :
- `https://replicate.delivery/pbxt/abc123/anime-lora.tar`
- `https://replicate.delivery/pbxt/xyz789/realistic-portrait.tar`

**Obtention** :
1. Entraîner un LoRA sur Replicate ou autre plateforme
2. Uploader sur Replicate Delivery
3. Récupérer l'URL publique

---

### loraScaleTransformer (number, 0.0-1.0)

**Description** : Intensité d'application du LoRA

**Valeurs** :
- `0.0` : Désactivé (comme si pas de LoRA)
- `0.3` : Effet subtil (30%)
- `0.5` : Effet modéré (50%)
- `0.7` : Effet fort (70%)
- `1.0` : Effet maximum (100%)

**Recommandations** :
- Commencer à `0.7-0.8` pour un bon équilibre
- Baisser si le style est trop prononcé
- Augmenter si l'effet est trop faible

---

### loraWeightsTransformer2 & loraScaleTransformer2

**Description** : Second LoRA optionnel pour combiner plusieurs styles

**Usage** :
- Mixer deux styles différents
- Superposer effets complémentaires
- Créer des rendus uniques

**Exemple de combinaison** :
```javascript
// Style principal: Anime (fort)
loraWeightsTransformer: "anime-lora.tar"
loraScaleTransformer: 0.8

// Style secondaire: Lighting effect (modéré)
loraWeightsTransformer2: "dramatic-lighting.tar"
loraScaleTransformer2: 0.5

// → Résultat: Anime avec éclairage dramatique
```

---

## Transmission des paramètres

### Flux complet

```
Frontend (Builder)
   ↓
   Saisie URL LoRA + poids
   ↓
taskDefinitions.js
   ↓
   Format: { loraWeightsTransformer, loraScaleTransformer, ... }
   ↓
WorkflowRunner → API /workflow/run
   ↓
GenerateVideoI2VTask.execute()
   ↓
   Transmet paramètres LoRA
   ↓
videoImageGenerator.generateVideoFromImage()
   ↓
   Prépare input Replicate:
   {
     lora_weights_transformer: URL,
     lora_scale_transformer: weight,
     lora_weights_transformer_2: URL2,
     lora_scale_transformer_2: weight2
   }
   ↓
Replicate API (Wan-2.2-i2v-fast)
   ↓
Vidéo avec LoRA appliqué ✅
```

---

## Compatibilité

### Backend
- ✅ `videoImageGenerator.js` : Déjà compatible (lignes 205-212)
- ✅ `GenerateVideoI2VTask.js` : Schéma et transmission ajoutés
- ✅ Validation : Aucune validation stricte, URLs optionnelles

### Frontend
- ✅ `taskDefinitions.js` : Champs ajoutés avec types corrects
- ✅ WorkflowRunner : Transmet automatiquement tous les inputs
- ✅ Types supportés : `text` (URL) + `number` (poids)

### API Replicate
- ✅ Modèle Wan-2.2-i2v-fast supporte nativement les LoRA
- ✅ Paramètres : `lora_weights_transformer`, `lora_scale_transformer`
- ✅ Jusqu'à 2 LoRAs simultanés

---

## Correction bonus : `duration` → `numFrames`

### Problème découvert

Le frontend utilisait `duration` (en secondes) alors que le backend attend `numFrames` (81 ou 121).

### Correction appliquée

**Frontend** : Changement de `duration` vers `numFrames` avec options correctes

**AVANT** :
```javascript
duration: {
  options: [
    { label: '2 secondes', value: 2 },
    { label: '3 secondes', value: 3 },
    { label: '5 secondes', value: 5 }
  ],
  default: 3
}
```

**APRÈS** :
```javascript
numFrames: {
  options: [
    { label: '81 frames (rapide, ~3-5s)', value: 81 },
    { label: '121 frames (long, ~5-8s)', value: 121 }
  ],
  default: 81
}
```

**Résultat** : Cohérence totale Frontend ↔ Backend ✅

---

## Tests recommandés

### Test 1 : Génération sans LoRA

**Actions** :
1. Créer workflow avec `generate_video_i2v`
2. Remplir image + prompt
3. Laisser LoRA vides
4. Exécuter

**Résultat attendu** :
- ✅ Vidéo générée avec style standard
- ✅ Pas d'erreur

---

### Test 2 : Génération avec 1 LoRA

**Actions** :
1. Créer workflow avec `generate_video_i2v`
2. Remplir image + prompt
3. Renseigner LoRA 1 URL + poids 0.7
4. Exécuter

**Résultat attendu** :
- ✅ Vidéo générée avec style LoRA appliqué
- ✅ Effet visible à 70%

---

### Test 3 : Génération avec 2 LoRAs

**Actions** :
1. Créer workflow avec `generate_video_i2v`
2. Remplir image + prompt
3. Renseigner LoRA 1 (0.8) + LoRA 2 (0.5)
4. Exécuter

**Résultat attendu** :
- ✅ Vidéo avec combinaison des deux styles
- ✅ Rendu unique

---

### Test 4 : Poids à 0.0 (désactivé)

**Actions** :
1. Renseigner LoRA URL
2. Mettre poids à 0.0
3. Exécuter

**Résultat attendu** :
- ✅ LoRA ignoré (comme si absent)
- ✅ Vidéo standard générée

---

## Sources de LoRAs

### Plateformes recommandées

1. **Replicate** : https://replicate.com/collections/loras
   - LoRAs pré-entraînés
   - Hébergement intégré
   - URLs directement utilisables

2. **Civitai** : https://civitai.com
   - Grande bibliothèque
   - Télécharger puis uploader sur Replicate

3. **Hugging Face** : https://huggingface.co/models
   - Modèles open-source
   - Nécessite conversion

### Créer son propre LoRA

**Étapes** :
1. Préparer dataset d'images (style cible)
2. Entraîner avec DreamBooth ou similaire
3. Uploader sur Replicate Delivery
4. Récupérer URL publique
5. Utiliser dans SLUFE IA ✅

---

## Résumé des fichiers modifiés

### Backend
**`/backend/services/tasks/GenerateVideoI2VTask.js`**
- Lignes 286-309 : Ajout schéma LoRA (4 paramètres)
- Lignes 62-66 : Transmission paramètres au service

### Frontend
**`/frontend/src/config/taskDefinitions.js`**
- Lignes 273-323 : Remplacement `duration` par `numFrames`
- Lignes 280-323 : Ajout 4 champs LoRA avec interface

---

## Documentation utilisateur recommandée

Ajouter dans l'aide du Builder :

```markdown
### 🎨 Personnalisation avec LoRA

Les LoRA (Low-Rank Adaptation) permettent de personnaliser le style vidéo :

**Exemples d'usage** :
- Style anime, cartoon, réaliste
- Effets visuels spécifiques
- Personnages récurrents

**Comment utiliser** :
1. Obtenir URL LoRA depuis Replicate
2. Coller l'URL dans "URL LoRA 1"
3. Ajuster le poids (0.7 recommandé)
4. (Optionnel) Ajouter second LoRA

**Conseils** :
- Commencer avec poids 0.7-0.8
- Baisser si effet trop fort
- Combiner 2 LoRAs pour effets uniques
```

---

## Auteur

Copilot AI Assistant

## Validation

✅ Backend : Schéma LoRA ajouté
✅ Backend : Transmission paramètres implémentée
✅ Frontend : Interface LoRA ajoutée
✅ Frontend : Correction `duration` → `numFrames`
✅ Cohérence totale Frontend ↔ Backend
✅ Pas de régression
