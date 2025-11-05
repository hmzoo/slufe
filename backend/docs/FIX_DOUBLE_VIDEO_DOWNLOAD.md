# 🔧 Correction Double Téléchargement Vidéo

## 📅 Date
5 novembre 2025

## ❌ Problème

Après l'implémentation de l'auto-ajout des vidéos aux collections, erreur lors de l'exécution :

```
✅ Vidéo générée sauvegardée et ajoutée à la collection: xxx.mp4
📥 Téléchargement de la vidéo T2V...
❌ Erreur: Failed to parse URL from /medias/xxx.mp4
```

## 🔍 Analyse

### Architecture Initiale (Incorrecte)

**Avant la modification :**
```
videoGenerator.js → Retourne URL Replicate
     ↓
GenerateVideoT2VTask → Télécharge depuis URL Replicate
     ↓
Sauvegarde locale
```

**Après modification (Double téléchargement) :**
```
videoGenerator.js → Télécharge depuis Replicate
                 → Sauvegarde locale
                 → Retourne URL locale /medias/...
     ↓
GenerateVideoT2VTask → Essaie de télécharger depuis /medias/... ❌
                    → ERREUR: URL locale invalide
```

### Cause du Problème

1. **Service `videoGenerator.js`** télécharge et sauvegarde la vidéo
2. **Service modifie** `videoUrl` pour pointer vers `/medias/...`
3. **Tâche `GenerateVideoT2VTask`** essaie de télécharger cette URL locale
4. **Erreur** : `fetch()` ne peut pas télécharger une URL relative

## ✅ Solution

**Supprimer le téléchargement dans les tâches** car c'est déjà fait par les services.

### Architecture Corrigée

```
videoGenerator.js → Télécharge depuis Replicate
                 → Sauvegarde locale
                 → Ajoute à collection
                 → Retourne URL locale /medias/...
     ↓
GenerateVideoT2VTask → Utilise directement l'URL locale ✅
                    → Pas de téléchargement
                    → Retourne résultats
```

## 📝 Modifications

### 1. GenerateVideoT2VTask.js

#### Avant
```javascript
import { generateVideoT2V } from '../videoGenerator.js';
import { saveMediaFile, getFileExtension } from '../../utils/fileUtils.js';

// ... dans execute()
const result = await generateVideoT2V({...});

// Télécharger et sauvegarder la vidéo localement ❌ Double téléchargement
const response = await fetch(result.videoUrl);
const arrayBuffer = await response.arrayBuffer();
const buffer = Buffer.from(arrayBuffer);
const filename = `${Date.now()}-${Math.random()}.mp4`;
const savedFile = saveMediaFile(filename, buffer);

return {
  video: savedFile.url,
  video_filename: savedFile.filename,
  external_url: result.videoUrl
};
```

#### Après
```javascript
import { generateVideoT2V } from '../videoGenerator.js';

// ... dans execute()
const result = await generateVideoT2V({...});

// La vidéo a déjà été téléchargée et sauvegardée
// result.videoUrl contient l'URL locale /medias/...

const filename = result.videoUrl.split('/').pop();

return {
  video: result.videoUrl, // URL locale déjà prête
  video_filename: filename,
  metadata: {
    ...result.params // Inclut durée, FPS, résolution
  }
};
```

### 2. GenerateVideoI2VTask.js

Même correction appliquée pour la génération image-to-video.

## 🎯 Résultats

### ✅ Avantages
- **Performance** : Pas de double téléchargement
- **Fiabilité** : Plus d'erreur "Failed to parse URL"
- **Code propre** : Séparation des responsabilités claire
- **Collections** : Auto-ajout fonctionne parfaitement

### 📊 Flux Correct

```
1. User → Lance génération T2V
2. videoGenerator.js → Appelle Replicate
3. videoGenerator.js → Télécharge vidéo (1x)
4. videoGenerator.js → Sauvegarde dans /medias/
5. videoGenerator.js → Ajoute à collection courante
6. videoGenerator.js → Retourne URL locale
7. GenerateVideoT2VTask → Utilise URL locale
8. GenerateVideoT2VTask → Retourne résultats
9. Frontend → Affiche vidéo depuis /medias/
```

## 🧪 Test de Validation

```bash
# Générer vidéo T2V
POST /api/workflow/execute
{
  "workflow": {
    "tasks": [{
      "type": "generate_video_t2v",
      "inputs": {
        "prompt": "Une forêt mystérieuse traversée par un dragon",
        "numFrames": 81,
        "aspectRatio": "16:9"
      }
    }]
  }
}

# Vérifier logs :
✅ 🎬 Génération de vidéo avec WAN 2.2 T2V Fast...
✅ ✅ Génération terminée
✅ 🎥 Vidéo URL: https://replicate.delivery/...
✅ 📥 Téléchargement de la vidéo générée...
✅ ✅ Vidéo ajoutée à la collection: xxx
✅ 💾 Vidéo générée sauvegardée: xxx.mp4
✅ ✅ Vidéo T2V générée avec succès
✅ Workflow terminé

❌ PAS de "📥 Téléchargement de la vidéo T2V..." (supprimé)
❌ PAS de "Failed to parse URL" (corrigé)
```

## 📁 Fichiers Modifiés

1. ✅ `/backend/services/tasks/GenerateVideoT2VTask.js`
   - Supprimé imports inutiles (`fetch`, `saveMediaFile`, `getFileExtension`)
   - Supprimé code de téléchargement (lignes 92-110)
   - Utilisation directe de l'URL locale

2. ✅ `/backend/services/tasks/GenerateVideoI2VTask.js`
   - Même corrections pour I2V

3. ✅ `/backend/docs/FIX_DOUBLE_VIDEO_DOWNLOAD.md`
   - Cette documentation

## 💡 Principe de Conception

### Séparation des Responsabilités

**Services (`videoGenerator.js`)** :
- Appel API Replicate
- Téléchargement vidéo
- Sauvegarde locale
- Ajout aux collections
- Retour URL locale

**Tâches (`GenerateVideoT2VTask`)** :
- Validation des entrées
- Préparation des paramètres
- Appel du service
- Formatage des résultats
- PAS de téléchargement (déjà fait)

## ✅ Statut

**CORRIGÉ** - Les vidéos sont maintenant :
- ✅ Téléchargées une seule fois
- ✅ Sauvegardées localement
- ✅ Ajoutées aux collections automatiquement
- ✅ Accessibles via URL locale
- ✅ Affichables dans les galeries

---

**Correction effectuée le** : 5 novembre 2025  
**Impact** : Génération T2V et I2V  
**Amélioration** : Performance et fiabilité
