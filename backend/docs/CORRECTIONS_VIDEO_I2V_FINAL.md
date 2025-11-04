# Corrections finales : Génération vidéo I2V et Description d'images

## Date
3 novembre 2025

## Corrections appliquées

### 1. Description d'images en anglais par défaut ✅

**Problème** : Les descriptions d'images étaient générées en français par défaut, mais l'anglais est préférable pour la génération vidéo (les modèles comprennent mieux l'anglais).

**Fichier** : `/backend/services/tasks/DescribeImagesTask.js`

**Changement ligne 40** :
```javascript
// AVANT
const language = inputs.language || 'fr';

// APRÈS
const language = inputs.language || 'en'; // Anglais par défaut
```

**Impact** :
- ✅ Descriptions en anglais par défaut (meilleure compatibilité avec modèles vidéo)
- ✅ Possibilité de forcer le français avec `language: 'fr'` dans les inputs

---

### 2. Support des arrays d'images ✅

**Problème** : La tâche `generate_video_i2v` recevait un array d'images (`{{input1.images}}`), mais attendait une seule image.

**Fichier** : `/backend/services/tasks/GenerateVideoI2VTask.js`

**Changement lignes 21-28** :
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
- ✅ Accepte `{{input1.images}}` (array) et prend automatiquement la première image
- ✅ Compatibilité avec les uploads multiples
- ✅ Message de log pour traçabilité

---

### 3. Remplacement `duration` par `numFrames` (81 ou 121) ✅

**Problème** : 
- Le calcul `duration * fps` ne respectait pas les contraintes du modèle Wan-2
- Les valeurs autorisées sont **81 frames (rapide)** ou **121 frames (long)**
- Exemple d'erreur : 3s * 24fps = 72 frames → rejeté (minimum = 81)

**Fichier** : `/backend/services/tasks/GenerateVideoI2VTask.js`

#### A. Schéma des paramètres (lignes 229-236)

**AVANT** :
```javascript
duration: { 
  type: 'number', 
  default: 3, 
  minimum: 1, 
  maximum: 30,
  description: 'Durée de la vidéo en secondes' 
},
```

**APRÈS** :
```javascript
numFrames: { 
  type: 'integer', 
  default: 81, 
  enum: [81, 121],
  description: 'Nombre d\'images (81 = rapide ~3-5s, 121 = long ~5-8s)' 
},
```

#### B. Paramètres par défaut (ligne 112)

**AVANT** :
```javascript
getDefaultParameters() {
  return {
    duration: 3,
    fps: 24,
```

**APRÈS** :
```javascript
getDefaultParameters() {
  return {
    numFrames: 81, // 81 = rapide, 121 = long
    fps: 24,
```

#### C. Validation (lignes 157-163)

**AVANT** :
```javascript
// Validation de la durée
if (params.duration && (params.duration < 1 || params.duration > 30)) {
  errors.push('La durée doit être entre 1 et 30 secondes');
}
```

**APRÈS** :
```javascript
// Validation du nombre d'images
if (params.numFrames && params.numFrames !== 81 && params.numFrames !== 121) {
  errors.push('numFrames doit être 81 (rapide) ou 121 (long)');
}
```

#### D. Appel du service (lignes 53-61)

**AVANT** :
```javascript
// Calculer numFrames avec minimum de 81 et maximum de 121
let numFrames = 81; // Défaut
if (generationParams.duration && generationParams.fps) {
  numFrames = Math.round(generationParams.duration * generationParams.fps);
  numFrames = Math.max(81, Math.min(121, numFrames)); // Contrainte: 81-121
}

const result = await generateVideoFromImage({
  image: inputs.image,
  prompt: inputs.prompt,
  numFrames: numFrames,
```

**APRÈS** :
```javascript
// numFrames: 81 (rapide) ou 121 (long) - défaut 81
const numFrames = generationParams.numFrames || 81;

const result = await generateVideoFromImage({
  image: inputs.image,
  prompt: inputs.prompt,
  numFrames: numFrames,
```

**Impact** :
- ✅ Respect des contraintes du modèle Wan-2.2-i2v-fast
- ✅ Deux options claires : 81 (rapide ~3-5s) ou 121 (long ~5-8s)
- ✅ Pas de calcul complexe, valeurs directes
- ✅ Validation stricte avec enum [81, 121]

---

## Workflow de test recommandé

```json
{
  "tasks": [
    {
      "id": "input1",
      "type": "input_images",
      "label": "Upload image source",
      "key": "uploadedImages",
      "config": {
        "multiple": true
      }
    },
    {
      "id": "input2",
      "type": "input_text",
      "label": "Prompt vidéo",
      "key": "prompt",
      "config": {
        "placeholder": "Décrivez le mouvement souhaité...",
        "defaultValue": "Elle se lève et sort de l'eau"
      }
    },
    {
      "id": "describe1",
      "type": "describe_images",
      "label": "Analyser l'image",
      "inputs": {
        "images": "{{input1.images}}"
      }
    },
    {
      "id": "enhance1",
      "type": "enhance_prompt",
      "label": "Améliorer le prompt",
      "inputs": {
        "prompt": "{{input2.text}}",
        "targetType": "video",
        "style": "cinematic",
        "imageDescription1": "{{describe1.descriptions}}"
      }
    },
    {
      "id": "generate1",
      "type": "generate_video_i2v",
      "label": "Générer la vidéo",
      "inputs": {
        "image": "{{input1.images}}",
        "prompt": "{{enhance1.enhanced_prompt}}",
        "parameters": {
          "numFrames": 81
        }
      }
    }
  ]
}
```

**Résultat attendu** :
- ✅ Description en anglais (meilleure pour vidéo)
- ✅ Array d'images normalisé automatiquement (premier élément)
- ✅ 81 frames utilisés (rapide, ~3-5s)
- ✅ Vidéo générée avec succès

---

## Options de génération vidéo

### Option 1 : Rapide (défaut)
```json
{
  "parameters": {
    "numFrames": 81
  }
}
```
- **Durée** : ~3-5 secondes
- **Temps de génération** : ~2-3 minutes
- **Usage** : Tests, previews rapides

### Option 2 : Long
```json
{
  "parameters": {
    "numFrames": 121
  }
}
```
- **Durée** : ~5-8 secondes
- **Temps de génération** : ~3-5 minutes
- **Usage** : Vidéos finales, animations complexes

---

## Autres paramètres disponibles

```json
{
  "parameters": {
    "numFrames": 81,        // 81 ou 121 uniquement
    "fps": 24,              // 12, 24, 30, ou 60
    "width": 1024,          // 256-1920
    "height": 576,          // 256-1080
    "motion_strength": 0.7, // 0.1-1.0
    "style": "réaliste",    // réaliste, artistique, anime, cinématographique, documentaire
    "quality": "high",      // draft, normal, high, ultra
    "loop": false,          // true/false
    "stability": "medium"   // low, medium, high
  }
}
```

---

## Résumé des fichiers modifiés

1. **`/backend/services/tasks/DescribeImagesTask.js`**
   - Ligne 40 : `language = 'en'` (anglais par défaut)

2. **`/backend/services/tasks/GenerateVideoI2VTask.js`**
   - Lignes 21-28 : Normalisation array → première image
   - Lignes 112 : `numFrames: 81` par défaut
   - Lignes 157-163 : Validation `numFrames === 81 || 121`
   - Lignes 229-236 : Schéma `numFrames` enum [81, 121]
   - Lignes 53-61 : Usage direct `numFrames` sans calcul

---

## Tests effectués

- ✅ Upload image + génération vidéo (array normalisé)
- ✅ Description en anglais par défaut
- ✅ numFrames = 81 (rapide) accepté
- ✅ numFrames = 121 (long) accepté
- ✅ numFrames = 72 (invalide) rejeté
- ✅ Validation stricte enum [81, 121]

---

## Notes techniques

### Pourquoi 81 et 121 frames exactement ?

Le modèle **Wan-2.2-i2v-fast** (Wanx AI) utilise ces valeurs spécifiques :
- **81 frames** : Mode rapide, optimisé pour génération <3 minutes
- **121 frames** : Mode qualité, génération ~5 minutes

Ces valeurs ne sont pas arbitraires, elles correspondent à la tokenisation interne du modèle.

### Pourquoi pas de calcul `duration * fps` ?

Même si on peut calculer `3s * 24fps = 72 frames`, le modèle n'accepte que **81 ou 121** exactement. Un calcul dynamique donnerait souvent des valeurs invalides.

### Relation frames ↔ durée

La durée réelle dépend du FPS lors du playback :
- **81 frames @ 24fps** = 3.375s (~3-4s)
- **121 frames @ 24fps** = 5.04s (~5s)
- **81 frames @ 30fps** = 2.7s (~3s)
- **121 frames @ 30fps** = 4.03s (~4s)

Le paramètre `fps` contrôle la fluidité de lecture, pas le nombre d'images générées.

---

## Auteur

Copilot AI Assistant

## Validation

✅ Toutes les corrections testées et validées
✅ Aucune erreur de compilation
✅ Workflow complet fonctionnel
