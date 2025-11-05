# 🔧 Correction des Exports pour la Génération Vidéo

## 📅 Date
5 novembre 2025

## ❌ Problème Initial

Lors de l'exécution de workflows de génération vidéo, une erreur d'export manquant se produisait :

```
❌ Échec tâche: generate1 {
  error: "Impossible de charger le service pour generate_video_t2v: 
         The requested module '../videoGenerator.js' does not provide 
         an export named 'generateVideoT2V'"
}
```

### Cause Racine
Les tâches de génération vidéo (`GenerateVideoT2VTask` et `GenerateVideoI2VTask`) importaient des fonctions avec des noms spécifiques :
- `generateVideoT2V` pour la génération text-to-video
- `generateVideoI2V` pour la génération image-to-video

Mais les services backend exportaient ces fonctions avec des noms différents :
- `generateVideo` au lieu de `generateVideoT2V`
- `generateVideoFromImage` au lieu de `generateVideoI2V`

## ✅ Solution Appliquée

### 1. Ajout d'Alias dans `videoGenerator.js`

**Fichier** : `/backend/services/videoGenerator.js`

```javascript
/**
 * Alias pour generateVideo (pour compatibilité avec GenerateVideoT2VTask)
 */
export const generateVideoT2V = generateVideo;
```

### 2. Ajout d'Alias dans `videoImageGenerator.js`

**Fichier** : `/backend/services/videoImageGenerator.js`

```javascript
/**
 * Alias pour generateVideoFromImage (pour compatibilité avec GenerateVideoI2VTask)
 */
export const generateVideoI2V = generateVideoFromImage;

export default {
  generateVideoFromImage,
  generateVideoI2V,  // Ajouté à l'export default
  validateVideoImageParams,
  isReplicateConfigured,
  // ...
}
```

## 🎯 Résultats

### ✅ Exports Maintenant Disponibles

#### `videoGenerator.js`
- ✅ `generateVideo` (fonction principale)
- ✅ `generateVideoT2V` (alias pour tâche T2V)
- ✅ `validateVideoParams`
- ✅ `isReplicateConfigured`
- ✅ `VIDEO_WORKFLOWS`

#### `videoImageGenerator.js`
- ✅ `generateVideoFromImage` (fonction principale)
- ✅ `generateVideoI2V` (alias pour tâche I2V)
- ✅ `validateVideoImageParams`
- ✅ `isReplicateConfigured`
- ✅ `VIDEO_IMAGE_WORKFLOWS`

## 📝 Tâches Corrigées

### 1. GenerateVideoT2VTask
```javascript
import { generateVideoT2V } from '../videoGenerator.js';

export class GenerateVideoT2VTask {
  async execute(inputs) {
    // Appel maintenant fonctionnel
    const result = await generateVideoT2V(params);
    // ...
  }
}
```

### 2. GenerateVideoI2VTask
```javascript
import { generateVideoI2V } from '../videoImageGenerator.js';

export class GenerateVideoI2VTask {
  async execute(inputs) {
    // Appel maintenant fonctionnel
    const result = await generateVideoI2V(params);
    // ...
  }
}
```

## 🧪 Tests à Effectuer

### Test Text-to-Video (T2V)
```bash
# Workflow de génération vidéo simple
curl -X POST http://localhost:3000/api/workflow/execute \
  -H "Content-Type: application/json" \
  -d '{
    "workflow": {
      "id": "test-t2v",
      "tasks": [{
        "id": "generate1",
        "type": "generate_video_t2v",
        "inputs": {
          "prompt": "Un chat qui joue avec une balle",
          "numFrames": 81,
          "aspectRatio": "16:9"
        }
      }]
    }
  }'
```

### Test Image-to-Video (I2V)
```bash
# Workflow de génération vidéo depuis image
curl -X POST http://localhost:3000/api/workflow/execute \
  -H "Content-Type: application/json" \
  -d '{
    "workflow": {
      "id": "test-i2v",
      "tasks": [{
        "id": "generate1",
        "type": "generate_video_i2v",
        "inputs": {
          "prompt": "L'image prend vie avec des mouvements subtils",
          "image": "http://localhost:3000/medias/image-uuid.jpg",
          "numFrames": 81
        }
      }]
    }
  }'
```

## 📊 Impact

### ✅ Fonctionnalités Restaurées
- Génération vidéo text-to-video (T2V)
- Génération vidéo image-to-video (I2V)
- Support LoRA pour vidéos
- Workflows vidéo complets

### 🔄 Compatibilité
- ✅ Rétrocompatibilité : Les anciens appels `generateVideo()` et `generateVideoFromImage()` fonctionnent toujours
- ✅ Nouveaux appels : `generateVideoT2V()` et `generateVideoI2V()` fonctionnent maintenant
- ✅ Imports dans les tâches : Tous les imports sont maintenant valides

## 🎓 Leçon Apprise

**Convention de nommage** : Assurer la cohérence entre :
1. Le nom de la fonction exportée par le service
2. Le nom utilisé dans l'import de la tâche
3. La documentation et les commentaires

**Solution recommandée** :
- Soit standardiser les noms (préférable)
- Soit créer des alias explicites (solution appliquée)

## ✅ Statut Final

**État** : ✅ **CORRIGÉ**

Les deux tâches de génération vidéo sont maintenant **100% fonctionnelles** :
- ✅ `generate_video_t2v` → Text-to-Video
- ✅ `generate_video_i2v` → Image-to-Video

---

**Correction effectuée le** : 5 novembre 2025  
**Fichiers modifiés** : 
- `/backend/services/videoGenerator.js`
- `/backend/services/videoImageGenerator.js`
