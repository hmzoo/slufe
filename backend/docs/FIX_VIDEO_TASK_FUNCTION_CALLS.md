# 🔧 Correction Appel Fonction Vidéo - Tâches T2V/I2V

## 📅 Date
5 novembre 2025

## ❌ Problème

Lors de l'exécution de workflows vidéo, erreur runtime :
```
❌ Erreur lors de la génération vidéo T2V {
  error: 'generateVideo is not defined'
}
```

## 🔍 Cause

Dans `GenerateVideoT2VTask.js` et `GenerateVideoI2VTask.js`, les tâches appelaient les anciennes fonctions au lieu des nouveaux alias :

### Avant (Incorrect)
```javascript
// GenerateVideoT2VTask.js
import { generateVideoT2V } from '../videoGenerator.js';
...
const result = await generateVideo({...}); // ❌ Fonction non importée!

// GenerateVideoI2VTask.js  
import { generateVideoI2V } from '../videoImageGenerator.js';
...
const result = await generateVideoFromImage({...}); // ❌ Ancien nom!
```

## ✅ Solution

Utiliser les fonctions importées (les nouveaux alias) :

### Après (Correct)
```javascript
// GenerateVideoT2VTask.js
import { generateVideoT2V } from '../videoGenerator.js';
...
const result = await generateVideoT2V({...}); // ✅

// GenerateVideoI2VTask.js
import { generateVideoI2V } from '../videoImageGenerator.js';
...
const result = await generateVideoI2V({...}); // ✅
```

## 📝 Fichiers Modifiés

1. ✅ `/backend/services/tasks/GenerateVideoT2VTask.js` - Ligne 75
2. ✅ `/backend/services/tasks/GenerateVideoI2VTask.js` - Ligne 69

## 🧪 Test

```bash
# Relancer le serveur
cd backend && npm run dev

# Tester génération T2V
POST /api/workflow/execute
{
  "workflow": {
    "tasks": [{
      "type": "generate_video_t2v",
      "inputs": {
        "prompt": "Une forêt mystérieuse traversée par un dragon effrayant",
        "numFrames": 81,
        "aspectRatio": "16:9"
      }
    }]
  }
}

# Vérifier :
✅ Pas d'erreur "generateVideo is not defined"
✅ Vidéo générée
✅ Ajoutée à la collection
```

## ✅ Statut
**CORRIGÉ** - Les deux tâches utilisent maintenant les bonnes fonctions.

---

**Note** : Cette erreur est survenue après l'ajout des alias d'export mais avant la mise à jour des appels dans les tâches.
