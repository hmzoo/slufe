# Support LoRA pour génération vidéo Text-to-Video (T2V)

## 📋 Résumé

Ajout complet du support LoRA pour la tâche `generate_video_t2v`, permettant d'appliquer jusqu'à 2 modèles LoRA personnalisés lors de la génération de vidéos à partir de texte.

## 🎯 Objectif

Harmoniser les fonctionnalités entre `generate_video_i2v` et `generate_video_t2v` en ajoutant les mêmes paramètres LoRA pour la personnalisation des vidéos générées depuis du texte.

## 🔧 Modifications apportées

### 1. Frontend - Configuration de la tâche T2V

**Fichier**: `/frontend/src/config/taskDefinitions.js`

**Changements**:
- ✅ Remplacement de `duration` (secondes) par `numFrames` (frames) pour cohérence avec I2V
- ✅ Options `numFrames`: 81 frames (~3-5s) ou 121 frames (~5-8s)
- ✅ Ajout de 4 nouveaux paramètres LoRA

**Nouveaux paramètres**:

```javascript
generate_video_t2v: {
  inputs: {
    prompt: { ... },
    numFrames: {
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
      max: 2,
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
      max: 2,
      step: 0.1,
      default: 1.0
    }
  }
}
```

### 2. Backend - Task handler T2V

**Fichier**: `/backend/services/tasks/GenerateVideoT2VTask.js`

**Changements principaux**:

#### a) Méthode `execute()` - Récupération des LoRA

```javascript
async execute(inputs) {
  // Récupérer les paramètres LoRA depuis inputs directement
  const loraWeightsTransformer = inputs.loraWeightsTransformer || null;
  const loraScaleTransformer = inputs.loraScaleTransformer ?? 1.0;  // Opérateur ?? pour préserver 0
  const loraWeightsTransformer2 = inputs.loraWeightsTransformer2 || null;
  const loraScaleTransformer2 = inputs.loraScaleTransformer2 ?? 1.0;
  
  global.logWorkflow(`🎬 Génération vidéo T2V`, {
    model: this.modelName,
    prompt: inputs.prompt?.substring(0, 100) + '...',
    numFrames: inputs.numFrames,
    loraWeightsTransformer: loraWeightsTransformer ? '...' : 'none',
    loraScaleTransformer,
    loraWeightsTransformer2: loraWeightsTransformer2 ? '...' : 'none',
    loraScaleTransformer2
  });
  
  // ...
  
  const result = await generateVideo({
    prompt: inputs.prompt,
    numFrames: generationParams.numFrames,
    loraWeightsTransformer,
    loraScaleTransformer,
    loraWeightsTransformer2,
    loraScaleTransformer2
  });
}
```

#### b) Méthode `validateInputs()` - Validation LoRA

```javascript
validateInputs(inputs) {
  const errors = [];
  
  // Validation numFrames
  if (inputs.numFrames !== undefined && inputs.numFrames !== null) {
    const validFrames = [81, 121];
    if (!validFrames.includes(inputs.numFrames)) {
      errors.push('numFrames doit être 81 ou 121');
    }
  }
  
  // Validation LoRA URLs
  if (inputs.loraWeightsTransformer && typeof inputs.loraWeightsTransformer !== 'string') {
    errors.push('loraWeightsTransformer doit être une URL');
  }
  
  // Validation LoRA scales (0-2)
  if (inputs.loraScaleTransformer !== undefined && inputs.loraScaleTransformer !== null) {
    const scale = parseFloat(inputs.loraScaleTransformer);
    if (isNaN(scale) || scale < 0 || scale > 2) {
      errors.push('loraScaleTransformer doit être entre 0 et 2');
    }
  }
  
  // Mêmes validations pour LoRA 2...
}
```

#### c) Méthode `getMetadata()` - Schéma LoRA

```javascript
getMetadata() {
  return {
    inputSchema: {
      prompt: { ... },
      numFrames: {
        type: 'integer',
        enum: [81, 121],
        default: 81,
        description: 'Nombre de frames à générer'
      },
      loraWeightsTransformer: {
        type: 'string',
        required: false,
        description: 'URL du modèle LoRA transformer'
      },
      loraScaleTransformer: {
        type: 'number',
        minimum: 0,
        maximum: 2,
        default: 1.0,
        description: 'Poids du premier LoRA'
      },
      loraWeightsTransformer2: { ... },
      loraScaleTransformer2: { ... }
    }
  };
}
```

### 3. Backend - Service vidéo (déjà compatible)

**Fichier**: `/backend/services/videoGenerator.js`

Le service `generateVideo()` supportait **déjà** les paramètres LoRA :

```javascript
export async function generateVideo(params) {
  const {
    prompt,
    numFrames = 81,
    loraWeightsTransformer = null,
    loraScaleTransformer = 1,
    loraWeightsTransformer2 = null,
    loraScaleTransformer2 = 1
  } = params;
  
  const input = {
    prompt,
    num_frames: numFrames,
    lora_scale_transformer: loraScaleTransformer,
    lora_scale_transformer_2: loraScaleTransformer2
  };
  
  if (loraWeightsTransformer) {
    input.lora_weights_transformer = loraWeightsTransformer;
  }
  if (loraWeightsTransformer2) {
    input.lora_weights_transformer_2 = loraWeightsTransformer2;
  }
  
  const output = await replicate.run('wan-video/wan-2.2-t2v-fast', { input });
  // ...
}
```

✅ **Aucune modification nécessaire** - Le service était déjà prêt pour les LoRA !

## 📊 Paramètres LoRA disponibles

### Pour chaque LoRA (2 maximum)

| Paramètre | Type | Valeurs | Défaut | Description |
|-----------|------|---------|--------|-------------|
| `loraWeightsTransformer` | string | URL | null | URL du fichier LoRA 1 (.tar) |
| `loraScaleTransformer` | number | 0-2 | 1.0 | Intensité du LoRA 1 |
| `loraWeightsTransformer2` | string | URL | null | URL du fichier LoRA 2 (.tar) |
| `loraScaleTransformer2` | number | 0-2 | 1.0 | Intensité du LoRA 2 |

### Échelle d'intensité

- **0.0** : LoRA désactivé
- **0.5** : Effet léger
- **1.0** : Intensité normale (recommandé)
- **1.5** : Effet fort
- **2.0** : Effet maximum

## 🎨 Cas d'usage T2V avec LoRA

### 1. Style artistique unique

```json
{
  "tasks": [
    {
      "id": "video1",
      "type": "generate_video_t2v",
      "inputs": {
        "prompt": "A knight riding through a misty forest",
        "numFrames": 81,
        "loraWeightsTransformer": "https://replicate.delivery/.../fantasy-art-style.tar",
        "loraScaleTransformer": 1.3
      }
    }
  ]
}
```

### 2. Personnage consistant

```json
{
  "tasks": [
    {
      "id": "video1",
      "type": "generate_video_t2v",
      "inputs": {
        "prompt": "A young wizard casting a spell",
        "numFrames": 121,
        "loraWeightsTransformer": "https://replicate.delivery/.../character-wizard.tar",
        "loraScaleTransformer": 1.5
      }
    }
  ]
}
```

### 3. Combinaison de 2 LoRA

```json
{
  "tasks": [
    {
      "id": "video1",
      "type": "generate_video_t2v",
      "inputs": {
        "prompt": "A cyberpunk city at night with neon lights",
        "numFrames": 121,
        "loraWeightsTransformer": "https://replicate.delivery/.../cyberpunk-style.tar",
        "loraScaleTransformer": 1.2,
        "loraWeightsTransformer2": "https://replicate.delivery/.../neon-lighting.tar",
        "loraScaleTransformer2": 0.8
      }
    }
  ]
}
```

## 🔄 Différences I2V vs T2V

| Aspect | I2V (Image-to-Video) | T2V (Text-to-Video) |
|--------|----------------------|---------------------|
| **Input** | Image + prompt | Prompt uniquement |
| **LoRA support** | ✅ Oui (2 LoRA) | ✅ Oui (2 LoRA) |
| **numFrames** | 81 ou 121 | 81 ou 121 |
| **Poids LoRA** | 0-2, défaut 1.0 | 0-2, défaut 1.0 |
| **Modèle** | wan-2.2-i2v-fast | wan-2.2-t2v-fast |
| **Cas d'usage** | Animation image existante | Création vidéo complète |

**Similitudes** :
- Mêmes paramètres LoRA (noms, plages, défauts)
- Même mécanisme de transmission backend
- Même rendu frontend (inputs number avec slider)
- Support de 2 LoRA combinés

## ✅ Validation

### Tests à effectuer

1. **T2V sans LoRA** (comportement standard)
   ```json
   {
     "prompt": "A sunset over mountains",
     "numFrames": 81
   }
   ```

2. **T2V avec 1 LoRA**
   ```json
   {
     "prompt": "A dragon flying",
     "numFrames": 121,
     "loraWeightsTransformer": "https://...",
     "loraScaleTransformer": 1.5
   }
   ```

3. **T2V avec 2 LoRA**
   ```json
   {
     "prompt": "A futuristic city",
     "numFrames": 81,
     "loraWeightsTransformer": "https://...",
     "loraScaleTransformer": 1.2,
     "loraWeightsTransformer2": "https://...",
     "loraScaleTransformer2": 0.8
   }
   ```

4. **Poids LoRA à 0** (désactivation)
   ```json
   {
     "prompt": "A forest scene",
     "loraWeightsTransformer": "https://...",
     "loraScaleTransformer": 0  // Désactivé
   }
   ```

### Points de vérification

- [ ] UI affiche les 4 champs LoRA dans le Builder
- [ ] Sliders fonctionnent (0-2, pas 0.1)
- [ ] Valeur par défaut des poids = 1.0
- [ ] Valeur 0 préservée (opérateur ??)
- [ ] Logs backend affichent les paramètres LoRA
- [ ] Paramètres transmis au modèle Replicate
- [ ] Vidéo générée avec style LoRA appliqué
- [ ] Metadata contient `lora_applied: true/false`

## 🔍 Logs backend attendus

```
🎬 Génération vidéo T2V {
  model: 'wan-2.2-t2v-fast',
  prompt: 'A dragon flying over mountains...',
  numFrames: 81,
  loraWeightsTransformer: 'https://replicate.delivery/pbxt/...',
  loraScaleTransformer: 1.5,
  loraWeightsTransformer2: 'none',
  loraScaleTransformer2: 1
}

⚙️ Paramètres de génération vidéo T2V {
  prompt: '...',
  numFrames: 81,
  loraWeightsTransformer: 'https://replicate.delivery/pbxt/...',
  loraScaleTransformer: 1.5,
  loraWeightsTransformer2: null,
  loraScaleTransformer2: 1
}

✅ Vidéo T2V générée avec succès {
  videoUrl: 'https://replicate.delivery/pbxt/...',
  numFrames: 81,
  hasLoRA: true,
  processingTime: 45.2
}
```

## 📦 Fichiers modifiés

### Frontend (1 fichier)
- `/frontend/src/config/taskDefinitions.js`
  * Remplacement `duration` → `numFrames`
  * Ajout 4 paramètres LoRA (URLs + poids)

### Backend (1 fichier)
- `/backend/services/tasks/GenerateVideoT2VTask.js`
  * Méthode `execute()` : Récupération + transmission LoRA
  * Méthode `validateInputs()` : Validation LoRA
  * Méthode `getMetadata()` : Schéma LoRA
  * Logs enrichis avec infos LoRA

### Backend (0 modification)
- `/backend/services/videoGenerator.js`
  * ✅ Déjà compatible LoRA (aucune modification)

## 🎯 Prochaines étapes

1. ✅ Tests manuels avec workflows T2V + LoRA
2. ✅ Vérifier cohérence UI/UX entre I2V et T2V
3. ✅ Créer templates de workflows avec LoRA
4. ✅ Documentation utilisateur finale

## 🔗 Voir aussi

- [FEATURE_LORA_SUPPORT_VIDEO.md](./FEATURE_LORA_SUPPORT_VIDEO.md) - Support LoRA I2V initial
- [FIX_LORA_TRANSMISSION_AND_WEIGHT_RANGE.md](./FIX_LORA_TRANSMISSION_AND_WEIGHT_RANGE.md) - Corrections transmission
- [FIX_LORA_DEFAULT_WEIGHT.md](./FIX_LORA_DEFAULT_WEIGHT.md) - Poids par défaut à 1

---

**Date**: 2025
**Version**: 1.0.0
**Statut**: ✅ Implémenté
