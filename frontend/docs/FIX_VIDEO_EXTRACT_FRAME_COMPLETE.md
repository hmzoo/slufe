# 🎬 Fix Complet - Extraction Frame Vidéo

## 📅 Date
5 novembre 2025

## 🐛 Problèmes Résolus

### 1. Erreur FFprobe - Objet au lieu de String

**Symptôme** :
```
❌ The "file" argument must be of type string. Received an instance of Object
```

**Cause** :
`ffprobe-static` v3 exporte un **objet** avec propriété `path`, pas une string directe :
```javascript
{
  path: '/home/.../node_modules/ffprobe-static/bin/linux/x64/ffprobe'
}
```

**Solution** :
```javascript
// ❌ AVANT - passait l'objet entier
ffmpeg.setFfprobePath(ffprobeStatic);

// ✅ APRÈS - extrait la propriété path
ffmpeg.setFfprobePath(ffprobeStatic.path || ffprobeStatic);
```

**Fichier** : `/backend/services/videoProcessor.js` ligne 16

---

### 2. Frame Non Ajoutée à la Collection

**Symptôme** :
- Workflow s'exécute avec succès ✅
- Frame extraite et sauvegardée ✅
- Mais **n'apparaît pas dans la galerie** ❌

**Cause** :
La fonction `extractVideoFrame()` ne faisait **aucun appel** à `addImageToCurrentCollection()`.

**Solution** :

#### Import ajouté
```javascript
import { addImageToCurrentCollection } from './collectionManager.js';
```

#### Ajout à la collection après extraction
```javascript
// Ajouter la frame extraite à la collection courante
try {
  // Extraire le mediaId depuis le filename (format: UUID.ext)
  const mediaId = outputFilename.split('.')[0];
  
  await addImageToCurrentCollection({
    url: `/medias/${outputFilename}`, // URL relative
    mediaId: mediaId, // UUID de l'image
    type: 'image', // Type image
    description: `Frame extraite (${frameType}) à ${formatTime(seekTime)}`,
    metadata: {
      extractedFrom: 'video',
      frameType: frameType,
      timestamp: seekTime.toFixed(2) + 's',
      videoDuration: duration.toFixed(2) + 's',
      format: outputFormat,
      quality: quality
    }
  });
  
  global.logWorkflow('💾 Frame ajoutée à la collection courante', {
    filename: outputFilename,
    frameType,
    timestamp: formatTime(seekTime)
  });
} catch (collectionError) {
  console.warn('⚠️ Impossible d\'ajouter la frame à la collection:', collectionError.message);
}
```

**Fichier** : `/backend/services/videoProcessor.js` lignes 165-191

---

## 🔄 Flux Complet Corrigé

### 1. Configuration FFmpeg au Démarrage

```javascript
// Module chargé
import ffprobeStatic from 'ffprobe-static';

// ffprobeStatic = {
//   path: '/home/.../ffprobe'
// }

// Configuration
ffmpeg.setFfprobePath(ffprobeStatic.path);
// → FFmpeg peut maintenant appeler ffprobe
```

### 2. Exécution du Workflow

```
1. Frontend → Sélection vidéo UUID
   ↓
2. Backend → resolveMediaIds() 
   → Objet {id, url: "/medias/...", path, type: "video"}
   ↓
3. VideoExtractFrameTask → normalizeVideoInput()
   → String "/medias/..."
   ↓
4. videoProcessor.extractVideoFrame()
   → Conversion chemin absolu
   → FFmpeg extrait frame
   → Sauvegarde avec UUID.jpg
   ↓
5. addImageToCurrentCollection()
   → Ajout à collection avec métadonnées
   ↓
6. Retour résultat
   → {image_url, image_path, frame_info, file_info}
```

### 3. Affichage Frontend

```
Frontend recharge collection
  ↓
Nouvelle image apparaît dans galerie
  ↓
Métadonnées visibles:
  - Description: "Frame extraite (last) à 00:00:03.26"
  - Timestamp, durée vidéo, format, qualité
```

---

## 📊 Comparaison Avant/Après

### Configuration FFprobe

| Aspect | Avant | Après |
|--------|-------|-------|
| Import | `ffprobeStatic` | `ffprobeStatic` |
| Type | Objet `{path: "..."}` | Objet `{path: "..."}` |
| Configuration | `setFfprobePath(ffprobeStatic)` ❌ | `setFfprobePath(ffprobeStatic.path)` ✅ |
| FFmpeg reçoit | Objet ❌ | String ✅ |
| Résultat | Erreur "expected string, got Object" | ✅ Fonctionne |

### Ajout à Collection

| Aspect | Avant | Après |
|--------|-------|-------|
| Frame extraite | ✅ Oui | ✅ Oui |
| Sauvegardée dans /medias/ | ✅ Oui | ✅ Oui |
| Ajoutée à collection | ❌ Non | ✅ Oui |
| Visible dans galerie | ❌ Non | ✅ Oui |
| Métadonnées | ❌ Aucune | ✅ Complètes |

---

## 🧪 Test Complet

### Workflow "Extraire Frame"

```bash
1. Créer workflow avec tâche "Extraire une frame"
2. Sélectionner vidéo depuis galerie (mode Gallery)
3. Choisir type de frame: "last"
4. Exécuter workflow

✅ Résultat attendu:
- UUID vidéo résolu
- Frame extraite avec succès
- Sauvegardée avec UUID.jpg
- Ajoutée à collection courante
- Visible dans galerie avec métadonnées
```

### Logs Attendus

```javascript
🔧 Configuration FFmpeg/FFprobe: {
  ffmpegStatic: '/path/to/ffmpeg',
  ffprobeStatic: { path: '/path/to/ffprobe' }
}

🎬 Extraction de frame vidéo { frameType: 'last', ... }
🎥 Vidéo normalisée { normalized: '/medias/...' }
📁 Lecture vidéo locale { videoPath: '/absolute/path/...' }

✅ Frame extraite avec succès {
  seekTime: '3.27s',
  videoDuration: '3.37s'
}

💾 Frame ajoutée à la collection courante {
  filename: 'bd0c9ffc-....jpg',
  frameType: 'last',
  timestamp: '00:00:03.26'
}

✅ Tâche terminée: video1
✅ Workflow terminé: generate-simple
```

---

## 📁 Fichiers Modifiés

### /backend/services/videoProcessor.js

**Modifications** :

1. **Ligne 9** : Import ajouté
   ```javascript
   import { addImageToCurrentCollection } from './collectionManager.js';
   ```

2. **Ligne 16** : Fix configuration ffprobe
   ```javascript
   ffmpeg.setFfprobePath(ffprobeStatic.path || ffprobeStatic);
   ```

3. **Lignes 165-191** : Ajout à collection après extraction
   ```javascript
   await addImageToCurrentCollection({...});
   ```

---

## 🎯 Résultat Final

### Fonctionnalités

✅ **Extraction Frame** : FFmpeg extrait correctement la frame  
✅ **Sauvegarde** : Frame sauvegardée avec UUID dans `/medias/`  
✅ **Collection** : Frame automatiquement ajoutée à collection courante  
✅ **Galerie** : Frame visible immédiatement dans l'interface  
✅ **Métadonnées** : Informations complètes (timestamp, durée, type frame, etc.)  

### Architecture

Le système **"Extract Frame"** suit maintenant le **même pattern** que les autres workflows :

1. ✅ Exécution du service
2. ✅ Sauvegarde avec UUID
3. ✅ Ajout automatique à collection
4. ✅ Retour des URLs/chemins
5. ✅ Affichage dans galerie

**Cohérence totale** avec `generateVideoT2V`, `generateVideoI2V`, `editImage`, etc. ! 🚀

---

## 📝 Notes Techniques

### Format Metadata Collection

```javascript
{
  url: '/medias/UUID.jpg',
  mediaId: 'UUID',
  type: 'image',
  description: 'Frame extraite (last) à 00:00:03.26',
  metadata: {
    extractedFrom: 'video',
    frameType: 'last',
    timestamp: '3.27s',
    videoDuration: '3.37s',
    format: 'jpg',
    quality: 95
  }
}
```

### Gestion d'Erreurs

```javascript
try {
  await addImageToCurrentCollection({...});
  global.logWorkflow('💾 Frame ajoutée à la collection');
} catch (collectionError) {
  // Ne bloque pas l'exécution si collection échoue
  console.warn('⚠️ Impossible d\'ajouter à la collection:', error);
}
```

**Stratégie** : L'ajout à la collection est **non-bloquant** - même si ça échoue, le workflow retourne quand même l'image extraite.

---

**Date** : 5 novembre 2025  
**Status** : ✅ Fix complet implémenté et testé  
**Impact** : Workflow "Extract Frame" 100% fonctionnel avec intégration collection  
**Cohérence** : Architecture unifiée avec tous les autres workflows vidéo/image

