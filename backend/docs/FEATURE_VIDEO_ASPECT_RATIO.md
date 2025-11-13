# Choix du format vidéo (Aspect Ratio) pour I2V et T2V

## 📋 Résumé

Ajout d'un paramètre `aspectRatio` pour choisir le format des vidéos générées (16:9 paysage ou 9:16 portrait) dans les tâches `generate_video_i2v` et `generate_video_t2v`.

## 🎯 Objectif

Permettre aux utilisateurs de générer des vidéos dans différents formats selon leur besoin :
- **16:9** (paysage) : Format horizontal classique pour YouTube, écrans larges
- **9:16** (portrait) : Format vertical pour TikTok, Instagram Stories, Reels

## 🔧 Modifications apportées

### 1. Frontend - Configuration des tâches

**Fichier**: `/frontend/src/config/taskDefinitions.js`

**Ajout du paramètre `aspectRatio` pour les 2 tâches vidéo** :

#### generate_video_t2v (Text-to-Video)

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
    aspectRatio: {
      type: 'select',
      label: 'Format vidéo',
      required: false,
      options: [
        { label: '16:9 (paysage)', value: '16:9' },
        { label: '9:16 (portrait)', value: '9:16' }
      ],
      default: '16:9',
      acceptsVariable: false
    },
    loraWeightsTransformer: { ... },
    // ...
  }
}
```

#### generate_video_i2v (Image-to-Video)

```javascript
generate_video_i2v: {
  inputs: {
    image: { ... },
    prompt: { ... },
    numFrames: {
      type: 'select',
      options: [
        { label: '81 frames (rapide, ~3-5s)', value: 81 },
        { label: '121 frames (long, ~5-8s)', value: 121 }
      ],
      default: 81
    },
    aspectRatio: {
      type: 'select',
      label: 'Format vidéo',
      required: false,
      options: [
        { label: '16:9 (paysage)', value: '16:9' },
        { label: '9:16 (portrait)', value: '9:16' }
      ],
      default: '16:9',
      acceptsVariable: false
    },
    loraWeightsTransformer: { ... },
    // ...
  }
}
```

**Position du paramètre** :
- Placé juste après `numFrames`
- Avant les paramètres LoRA
- Valeur par défaut : `'16:9'` (format horizontal classique)

### 2. Backend - Task T2V

**Fichier**: `/backend/services/tasks/GenerateVideoT2VTask.js`

#### Méthode `execute()` - Transmission du paramètre

```javascript
async execute(inputs) {
  // ...
  
  global.logWorkflow(`🎬 Génération vidéo T2V`, {
    model: this.modelName,
    prompt: inputs.prompt?.substring(0, 100) + '...',
    numFrames: inputs.numFrames,
    aspectRatio: inputs.aspectRatio || '16:9',  // ✅ Log du format
    loraWeightsTransformer: loraWeightsTransformer ? '...' : 'none',
    // ...
  });

  // Préparation des paramètres
  const generationParams = {
    prompt: inputs.prompt,
    numFrames: inputs.numFrames || 81,
    aspectRatio: inputs.aspectRatio || '16:9',  // ✅ Récupération + défaut
    loraWeightsTransformer,
    // ...
  };

  // Appel du service
  const result = await generateVideo({
    prompt: inputs.prompt,
    numFrames: generationParams.numFrames,
    aspectRatio: generationParams.aspectRatio,  // ✅ Transmission au service
    loraWeightsTransformer,
    // ...
  });
}
```

#### Méthode `validateInputs()` - Validation

```javascript
validateInputs(inputs) {
  const errors = [];
  
  // Validation du prompt...
  
  // Validation du numFrames...
  
  // ✅ Validation de l'aspect ratio
  if (inputs.aspectRatio !== undefined && inputs.aspectRatio !== null) {
    const validRatios = ['16:9', '9:16'];
    if (!validRatios.includes(inputs.aspectRatio)) {
      errors.push('aspectRatio doit être "16:9" ou "9:16"');
    }
  }
  
  // Validation des LoRA...
  
  return {
    isValid: errors.length === 0,
    errors
  };
}
```

#### Méthode `getMetadata()` - Schéma

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
      aspectRatio: {
        type: 'string',
        required: false,
        enum: ['16:9', '9:16'],
        default: '16:9',
        description: 'Format de la vidéo (16:9 = paysage, 9:16 = portrait)'
      },
      loraWeightsTransformer: { ... },
      // ...
    }
  };
}
```

### 3. Backend - Task I2V

**Fichier**: `/backend/services/tasks/GenerateVideoI2VTask.js`

#### Méthode `execute()` - Transmission du paramètre

```javascript
async execute(inputs) {
  // ...
  
  // numFrames: 81 (rapide) ou 121 (long) - défaut 81
  const numFrames = generationParams.numFrames || 81;
  const aspectRatio = inputs.aspectRatio || generationParams.aspectRatio || '16:9';  // ✅
  
  const result = await generateVideoFromImage({
    image: inputs.image,
    prompt: inputs.prompt,
    numFrames: numFrames,
    aspectRatio: aspectRatio,  // ✅ Transmission au service
    framesPerSecond: generationParams.fps,
    loraWeightsTransformer: generationParams.loraWeightsTransformer,
    // ...
  });
}
```

#### Méthode `validateInputs()` - Validation

```javascript
validateInputs(inputs) {
  const errors = [];
  
  // Validation du prompt...
  
  // Validation de l'image source...
  
  // ✅ Validation du format vidéo (niveau inputs)
  if (inputs.aspectRatio !== undefined && inputs.aspectRatio !== null) {
    const validRatios = ['16:9', '9:16'];
    if (!validRatios.includes(inputs.aspectRatio)) {
      errors.push('aspectRatio doit être "16:9" ou "9:16"');
    }
  }
  
  // Validation des paramètres optionnels
  if (inputs.parameters) {
    const params = inputs.parameters;
    
    // ...
    
    // ✅ Validation du format vidéo (niveau parameters)
    if (params.aspectRatio && !['16:9', '9:16'].includes(params.aspectRatio)) {
      errors.push('aspectRatio doit être "16:9" ou "9:16"');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}
```

#### Méthode `getMetadata()` - Schéma

```javascript
getMetadata() {
  return {
    inputSchema: {
      prompt: { ... },
      image: { ... },
      parameters: {
        type: 'object',
        properties: {
          numFrames: {
            type: 'integer',
            enum: [81, 121],
            default: 81,
            description: 'Nombre d\'images (81 = rapide ~3-5s, 121 = long ~5-8s)'
          },
          aspectRatio: {
            type: 'string',
            default: '16:9',
            enum: ['16:9', '9:16'],
            description: 'Format de la vidéo (16:9 = paysage, 9:16 = portrait)'
          },
          fps: { ... },
          // ...
        }
      }
    }
  };
}
```

### 4. Backend - Services vidéo (déjà compatibles)

#### Service `videoGenerator.js` (T2V)

✅ **Déjà compatible** - Supporte `aspectRatio` depuis le début :

```javascript
export async function generateVideo(params) {
  const {
    prompt,
    numFrames = VIDEO_DEFAULTS.numFrames,
    aspectRatio = VIDEO_DEFAULTS.aspectRatio,  // ✅ Déjà présent
    // ...
  } = params;

  // Validation
  const validation = validateVideoParams(params);
  
  // ...
  
  const input = {
    prompt: prompt,
    num_frames: numFrames,
    aspect_ratio: aspectRatio,  // ✅ Transmis à Replicate
    resolution: resolution,
    // ...
  };

  const output = await replicate.run('wan-video/wan-2.2-t2v-fast', { input });
  // ...
}
```

#### Service `videoImageGenerator.js` (I2V)

✅ **Déjà compatible** - Supporte `aspectRatio` avec auto-détection :

```javascript
export async function generateVideoFromImage(params) {
  // ...
  
  let detectedAspectRatio = params.aspectRatio;
  
  // Si image est un Buffer, la préparer pour la vidéo
  if (Buffer.isBuffer(imageBuffer)) {
    // Préparer les images avec auto-détection du format
    const prepared = await prepareMultipleImagesForVideo(images, params.aspectRatio);
    detectedAspectRatio = prepared.aspectRatio;  // ✅ Auto-détection si non fourni
    // ...
  }
  
  // Utiliser le ratio détecté ou fourni
  const finalAspectRatio = detectedAspectRatio || params.aspectRatio || '16:9';
  
  // ...
  
  // Note: Le paramètre aspect_ratio n'est pas dans l'API I2V de Replicate
  // mais il est utilisé pour le recadrage automatique des images
}
```

**Note importante pour I2V** :
- Le modèle `wan-2.2-i2v-fast` ne supporte pas directement `aspect_ratio` dans son API
- Le format est contrôlé par le **recadrage automatique de l'image source**
- `videoImageGenerator.js` détecte ou applique le ratio lors de la préparation de l'image
- L'image est recadrée au bon format **avant** d'être envoyée au modèle

## 📊 Formats supportés

| Format | Valeur | Description | Cas d'usage |
|--------|--------|-------------|-------------|
| **16:9** | `'16:9'` | Paysage (horizontal) | YouTube, écrans larges, cinéma |
| **9:16** | `'9:16'` | Portrait (vertical) | TikTok, Instagram Stories, Reels |

### Résolutions correspondantes

Selon le paramètre `resolution` (480p ou 720p) :

| Format | 480p | 720p |
|--------|------|------|
| **16:9** | 854x480 | 1280x720 |
| **9:16** | 480x854 | 720x1280 |

## 🎨 Cas d'usage

### 1. Vidéo YouTube (16:9)

```json
{
  "tasks": [
    {
      "id": "video1",
      "type": "generate_video_t2v",
      "inputs": {
        "prompt": "A cinematic landscape with mountains at sunset",
        "numFrames": 121,
        "aspectRatio": "16:9"
      }
    }
  ]
}
```

### 2. Story Instagram (9:16)

```json
{
  "tasks": [
    {
      "id": "video1",
      "type": "generate_video_t2v",
      "inputs": {
        "prompt": "A fashion model walking down a street",
        "numFrames": 81,
        "aspectRatio": "9:16"
      }
    }
  ]
}
```

### 3. Animation image portrait (9:16)

```json
{
  "tasks": [
    {
      "id": "describe",
      "type": "describe_images",
      "inputs": {
        "images": ["portrait.jpg"]
      }
    },
    {
      "id": "animate",
      "type": "generate_video_i2v",
      "inputs": {
        "image": "portrait.jpg",
        "prompt": "{{describe.descriptions}}",
        "numFrames": 81,
        "aspectRatio": "9:16"
      }
    }
  ]
}
```

### 4. Workflow complet avec LoRA

```json
{
  "tasks": [
    {
      "id": "video1",
      "type": "generate_video_t2v",
      "inputs": {
        "prompt": "A cyberpunk city at night with neon lights",
        "numFrames": 121,
        "aspectRatio": "9:16",
        "loraWeightsTransformer": "https://replicate.delivery/.../cyberpunk-style.tar",
        "loraScaleTransformer": 1.3
      }
    }
  ]
}
```

## 🔍 Comportement

### Valeur par défaut

- Si `aspectRatio` n'est pas spécifié → **16:9** (paysage)
- Format horizontal classique pour compatibilité maximale

### Pour I2V (Image-to-Video)

**Deux modes** :

1. **aspectRatio spécifié** :
   - L'image source est automatiquement recadrée au format demandé
   - Exemple : Image 1920x1080 + aspectRatio '9:16' → Recadrage en 1080x1920

2. **aspectRatio non spécifié** :
   - Auto-détection basée sur les dimensions de l'image source
   - Image paysage (largeur > hauteur) → 16:9
   - Image portrait (hauteur > largeur) → 9:16

### Pour T2V (Text-to-Video)

- Le format est directement transmis au modèle Replicate
- Le modèle génère la vidéo dans le format demandé
- Pas de recadrage nécessaire (pas d'image source)

## ✅ Validation

### Tests à effectuer

1. **T2V format 16:9** (défaut)
   ```json
   {
     "prompt": "A landscape scene",
     "numFrames": 81
   }
   ```

2. **T2V format 9:16** (portrait)
   ```json
   {
     "prompt": "A portrait scene",
     "numFrames": 81,
     "aspectRatio": "9:16"
   }
   ```

3. **I2V format 16:9** avec image paysage
   ```json
   {
     "image": "landscape.jpg",
     "prompt": "Camera pan from left to right",
     "aspectRatio": "16:9"
   }
   ```

4. **I2V format 9:16** avec image portrait
   ```json
   {
     "image": "portrait.jpg",
     "prompt": "Gentle head movement",
     "aspectRatio": "9:16"
   }
   ```

5. **I2V auto-détection** (pas de aspectRatio)
   ```json
   {
     "image": "any-image.jpg",
     "prompt": "Animate this image"
   }
   ```

### Points de vérification

- [ ] UI affiche le sélecteur de format dans le Builder
- [ ] Options "16:9 (paysage)" et "9:16 (portrait)" visibles
- [ ] Valeur par défaut = 16:9
- [ ] Logs backend affichent l'aspectRatio choisi
- [ ] T2V : Vidéo générée dans le bon format
- [ ] I2V : Image recadrée correctement avant génération
- [ ] I2V : Auto-détection fonctionne si pas de aspectRatio

## 🔍 Logs backend attendus

### T2V

```
🎬 Génération vidéo T2V {
  model: 'wan-2.2-t2v-fast',
  prompt: 'A cyberpunk city at night...',
  numFrames: 81,
  aspectRatio: '9:16',  // ✅ Format visible
  loraWeightsTransformer: 'none',
  loraScaleTransformer: 1
}

⚙️ Paramètres de génération vidéo T2V {
  prompt: '...',
  numFrames: 81,
  aspectRatio: '9:16',  // ✅ Format transmis
  loraWeightsTransformer: null,
  loraScaleTransformer: 1
}
```

### I2V

```
🎞️ Génération vidéo I2V {
  model: 'wan-2.2-i2v-fast',
  prompt: 'Gentle head movement...',
  hasSourceImage: true,
  parameters: { numFrames: 81, aspectRatio: '9:16', ... }
}

🖼️  Préparation de l'image de départ...
✅ Images préparées et recadrées au format 9:16  // ✅ Recadrage appliqué
```

## 📦 Fichiers modifiés

### Frontend (1 fichier)

- `/frontend/src/config/taskDefinitions.js`
  - generate_video_t2v : Ajout paramètre `aspectRatio`
  - generate_video_i2v : Ajout paramètre `aspectRatio`

### Backend (2 fichiers)

- `/backend/services/tasks/GenerateVideoT2VTask.js`
  - Méthode `execute()` : Récupération + transmission aspectRatio
  - Méthode `validateInputs()` : Validation '16:9' ou '9:16'
  - Méthode `getMetadata()` : Schéma aspectRatio
  - Logs enrichis avec format

- `/backend/services/tasks/GenerateVideoI2VTask.js`
  - Méthode `execute()` : Récupération + transmission aspectRatio
  - Méthode `validateInputs()` : Validation au niveau inputs et parameters
  - Méthode `getMetadata()` : Schéma aspectRatio
  - Support auto-détection si non spécifié

### Backend (0 modification)

- `/backend/services/videoGenerator.js`
  - ✅ Déjà compatible aspectRatio pour T2V

- `/backend/services/videoImageGenerator.js`
  - ✅ Déjà compatible aspectRatio pour I2V (avec auto-détection)

## 🎯 Avantages

### Pour les utilisateurs

- **Flexibilité** : Choix du format selon la plateforme cible
- **Simplicité** : 2 options claires (paysage/portrait)
- **Auto-détection I2V** : Format optimal si non spécifié
- **Valeur par défaut** : 16:9 pour compatibilité maximale

### Pour les cas d'usage

- **YouTube/Vimeo** : 16:9 optimal
- **TikTok/Instagram** : 9:16 natif
- **Stories/Reels** : 9:16 plein écran
- **Présentation** : 16:9 classique

## 🔗 Voir aussi

- [FEATURE_LORA_T2V_SUPPORT.md](./FEATURE_LORA_T2V_SUPPORT.md) - Support LoRA pour T2V
- [FEATURE_LORA_SUPPORT_VIDEO.md](./FEATURE_LORA_SUPPORT_VIDEO.md) - Support LoRA pour I2V
- [CORRECTIONS_VIDEO_I2V_FINAL.md](./CORRECTIONS_VIDEO_I2V_FINAL.md) - Corrections vidéo I2V

---

**Date** : 4 novembre 2025
**Version** : 1.0.0
**Statut** : ✅ Implémenté
