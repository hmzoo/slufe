# Fix: Support des buffers pour la génération vidéo I2V

## Problème rencontré

Lors de l'exécution d'un workflow avec upload d'image suivi de génération vidéo I2V, l'erreur suivante se produisait :

```
❌ Erreur lors de la génération vidéo I2V {
  error: 'Paramètres invalides: startImage est requis (URL ou data URI)',
  prompt: 'A majestic queen...',
  hasImage: true
}
```

### Cause du problème

Le workflow Builder uploade les images au format **buffer object** `{buffer: Buffer, mimeType, originalName, size}`, mais le service de génération vidéo attendait :
1. Une **string** (URL ou data URI) pour la validation
2. Un **Buffer direct** pour la conversion

Il y avait **3 problèmes** :

1. **Mauvais nom de paramètre** : `GenerateVideoI2VTask` passait `firstFrame` au lieu de `image`
2. **Validation trop stricte** : Rejetait tous les buffers
3. **Pas d'extraction du buffer** : Le service attendait `Buffer` directement, pas `{buffer: Buffer, ...}`

## Solution implémentée

### 1. Correction des paramètres (GenerateVideoI2VTask.js)

**AVANT** (lignes 47-53) :
```javascript
const result = await generateVideoFromImage({
  images: [inputs.image], // ❌ Mauvais paramètre
  firstFrame: inputs.image, // ❌ Mauvais nom
  prompt: inputs.prompt,
  duration: generationParams.duration,
  fps: generationParams.fps,
  motionStrength: generationParams.motion_strength // ❌ Paramètre non supporté
});
```

**APRÈS** (lignes 47-55) :
```javascript
const result = await generateVideoFromImage({
  image: inputs.image, // ✅ Bon paramètre - sera converti automatiquement
  prompt: inputs.prompt,
  numFrames: generationParams.duration ? Math.round(generationParams.duration * generationParams.fps) : 81,
  framesPerSecond: generationParams.fps,
  // motionStrength n'est pas supporté - utiliser sampleShift si nécessaire
});
```

### 2. Validation acceptant les buffers (GenerateVideoI2VTask.js)

**AVANT** (lignes 136-139) :
```javascript
if (!inputs.image) {
  errors.push('L\'image source est requise pour la génération I2V');
} else if (typeof inputs.image !== 'string') {
  errors.push('L\'image source doit être une URL ou un chemin'); // ❌ Rejette buffers
}
```

**APRÈS** (lignes 136-141) :
```javascript
if (!inputs.image) {
  errors.push('L\'image source est requise pour la génération I2V');
} else if (typeof inputs.image !== 'string' && (!inputs.image.buffer || !Buffer.isBuffer(inputs.image.buffer))) {
  // ✅ Accepter string (URL) OU objet buffer {buffer, mimeType, ...}
  errors.push('L\'image source doit être une URL, un chemin ou un buffer d\'image');
}
```

### 3. Extraction du buffer (videoImageGenerator.js)

**AVANT** (lignes 102-107) :
```javascript
let startImageUrl = params.image;
let lastImageUrl = params.lastImage;

// Si image est un Buffer, la préparer pour la vidéo
if (Buffer.isBuffer(params.image)) { // ❌ Ne fonctionne pas avec {buffer: Buffer}
  console.log('🖼️  Préparation de l\'image de départ...');
```

**APRÈS** (lignes 102-124) :
```javascript
let startImageUrl = params.image;
let lastImageUrl = params.lastImage;

// ✅ Extraire le buffer si l'image est un objet {buffer, mimeType, ...}
let imageBuffer = params.image;
if (params.image && typeof params.image === 'object' && params.image.buffer) {
  imageBuffer = params.image.buffer;
}

let lastImageBuffer = params.lastImage;
if (params.lastImage && typeof params.lastImage === 'object' && params.lastImage.buffer) {
  lastImageBuffer = params.lastImage.buffer;
}

// Si image est un Buffer, la préparer pour la vidéo
if (Buffer.isBuffer(imageBuffer)) {
  console.log('🖼️  Préparation de l\'image de départ...');
  
  const images = [imageBuffer];
  if (lastImageBuffer && Buffer.isBuffer(lastImageBuffer)) {
    images.push(lastImageBuffer);
  }
```

## Flux de conversion complet

```
┌─────────────────────────────────────────────────────────────────┐
│ Frontend (WorkflowRunner.vue)                                   │
│ ─────────────────────────────────────────                       │
│ File object → FormData (task1_uploadedImages)                   │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ Backend Multer (workflow.js)                                    │
│ ─────────────────────────────────                               │
│ .any() accepte champs dynamiques                                │
│ → Convertit en {buffer, mimeType, originalName, size}           │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ WorkflowRunner (workflowRunner.js)                              │
│ ─────────────────────────────────────                           │
│ Groupe fichiers par fieldname dans __uploadedFiles              │
│ Résout __UPLOADED_IMAGES_taskId_key__ → buffer object           │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ GenerateVideoI2VTask.execute()                                  │
│ ─────────────────────────────────                               │
│ Reçoit inputs.image = {buffer, mimeType, ...}                   │
│ Validation : accepte buffer object ✅                            │
│ Passe au service : image: inputs.image                          │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ videoImageGenerator.generateVideoFromImage()                    │
│ ─────────────────────────────────────────                       │
│ 1. Extrait buffer : imageBuffer = params.image.buffer           │
│ 2. Vérifie : Buffer.isBuffer(imageBuffer) → true                │
│ 3. Prépare : prepareMultipleImagesForVideo([imageBuffer])       │
│    - Recadre au ratio 16:9 ou 9:16                              │
│    - Détecte automatiquement le ratio                           │
│ 4. Convertit : data:image/jpeg;base64,${buffer.toString()}      │
│ 5. Assigne : startImage = data URI                              │
│ 6. Valide : validateVideoImageParams({startImage, ...})         │
│ 7. Appelle Replicate avec data URI ✅                            │
└─────────────────────────────────────────────────────────────────┘
```

## Formats supportés

Le service de génération vidéo I2V accepte maintenant **3 formats** :

### 1. URL publique
```javascript
await generateVideoFromImage({
  image: 'https://example.com/image.jpg',
  prompt: 'A beautiful scene'
});
```

### 2. Data URI
```javascript
await generateVideoFromImage({
  image: 'data:image/jpeg;base64,/9j/4AAQSkZJRg...',
  prompt: 'A beautiful scene'
});
```

### 3. Buffer object (depuis workflow Builder)
```javascript
await generateVideoFromImage({
  image: {
    buffer: Buffer.from(...),
    mimeType: 'image/jpeg',
    originalName: 'photo.jpg',
    size: 123456
  },
  prompt: 'A beautiful scene'
});
```

## Conversion automatique

Le service détecte automatiquement le format et effectue les conversions nécessaires :

- **String** → Utilisé tel quel (URL ou data URI)
- **Buffer object** → Extrait `image.buffer` → Prépare → Convertit en data URI
- **Buffer direct** → Prépare → Convertit en data URI

La préparation inclut :
- Auto-détection du ratio d'image (16:9 ou 9:16)
- Recadrage automatique au ratio détecté
- Conversion en JPEG base64
- Validation des dimensions

## Test recommandé

Pour tester la correction, créer un workflow avec :

```json
{
  "tasks": [
    {
      "id": "task1",
      "type": "input_images",
      "label": "Upload une image",
      "key": "uploadedImages",
      "required": true
    },
    {
      "id": "task2",
      "type": "generate_video_i2v",
      "label": "Générer vidéo",
      "inputs": {
        "image": "__UPLOADED_IMAGES_task1_uploadedImages__",
        "prompt": "A majestic queen walking gracefully through a palace"
      }
    }
  ]
}
```

**Résultat attendu** :
- ✅ Upload d'image fonctionne
- ✅ Image convertie en buffer object
- ✅ Buffer extrait et converti en data URI
- ✅ Vidéo générée avec succès

## Fichiers modifiés

1. **`/backend/services/tasks/GenerateVideoI2VTask.js`**
   - Correction nom paramètre `image` au lieu de `firstFrame`
   - Validation acceptant buffers
   - Paramètres corrects pour le service

2. **`/backend/services/videoImageGenerator.js`**
   - Extraction du buffer depuis objet `{buffer, mimeType, ...}`
   - Support complet des 3 formats (URL, data URI, buffer object)

## Impacts

### Services affectés
- ✅ `generate_video_i2v` : Fonctionne avec buffers
- ⚠️ `generate_video_t2v` : À vérifier (texte → vidéo, pas d'image)

### Fonctionnalités concernées
- ✅ Workflow Builder avec upload + génération vidéo
- ✅ API directe `/api/generate/video-from-image` (garde compatibilité URL/data URI)
- ✅ Templates avec références d'images

## Notes techniques

### Pourquoi Buffer.isBuffer(params.image) ne fonctionnait pas ?

Le workflow Builder stocke les images au format :
```javascript
{
  buffer: Buffer.from(...),  // Le vrai Buffer
  mimeType: 'image/jpeg',
  originalName: 'photo.jpg',
  size: 123456
}
```

`Buffer.isBuffer(params.image)` retourne `false` car c'est un **objet plain** contenant un buffer.
Il faut d'abord extraire `params.image.buffer` puis vérifier `Buffer.isBuffer(imageBuffer)`.

### Pourquoi prepareImageForVideo() n'était pas utilisé ?

La fonction `prepareImageForVideo()` existe dans `imageUtils.js` mais :
- Elle était importée mais jamais appelée
- Le service utilisait `prepareMultipleImagesForVideo()` qui est plus complète
- Cette dernière gère plusieurs images et auto-détecte le ratio

Le flux de conversion est maintenant :
```
Buffer object → Extract buffer → prepareMultipleImagesForVideo() → Data URI
```

## Date de correction

2025-01-XX

## Auteur

Copilot AI Assistant
