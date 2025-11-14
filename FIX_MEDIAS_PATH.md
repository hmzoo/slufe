# ✅ Correction des chemins médias (data/medias)

## 📅 Date: 14 novembre 2025

## 🎯 P### ✅ Fichiers déjà conformes (6 fichiers)

Ces fichiers utilisaient **déjà** `getMediasDir()` ou `getMediaFilePath()` correctement :
- ✅ `backend/services/dataStorage.js`
- ✅ `backend/services/videoProcessor.js`
- ✅ `backend/services/imageAnalyzer.js`
- ✅ `backend/services/imageEditor.js`
- ✅ `backend/services/tasks/ImageResizeCropTask.js`e dossier des médias a été déplacé de `medias/` vers `data/medias/`, mais certains services du backend utilisaient encore l'ancien chemin en dur.

## 🔧 Corrections appliquées

### 1. **uploadMedia.js** (2 occurrences)
#### Avant :
```javascript
const mediasDir = path.join(__dirname, '../medias');
```

#### Après :
```javascript
import { getMediasDir } from '../utils/fileUtils.js';
const mediasDir = getMediasDir();
```

**Lignes modifiées :**
- Import : ligne 5
- `getMediaInfo()` : ligne 201
- `listAllMedias()` : ligne 271

---

### 2. **videoImageGenerator.js** (2 occurrences)
#### Avant :
```javascript
const fullPath = path.join(__dirname, '..', params.image);
imageBuffer = await fs.readFile(fullPath);
```

#### Après :
```javascript
import { getMediaFilePath } from '../utils/fileUtils.js';
const filename = params.image.replace('/medias/', '');
const fullPath = getMediaFilePath(filename);
imageBuffer = await fs.readFile(fullPath);
```

**Lignes modifiées :**
- Import : ligne 9
- Lecture `params.image` : ligne 130
- Lecture `params.lastImage` : ligne 143

---

### 3. **VideoConcatenateTask.js** (1 occurrence)
#### Avant :
```javascript
videoPath = path.join(process.cwd(), 'medias', filename);
```

#### Après :
```javascript
import { getMediasDir } from '../../utils/fileUtils.js';
videoPath = path.join(getMediasDir(), filename);
```

**Lignes modifiées :**
- Import : ligne 3
- Conversion URL → chemin : ligne 219

---

### 3. **VideoExtractFrameTask.js** (1 occurrence)
#### Avant :
```javascript
videoPath = path.join(process.cwd(), 'medias', filename);
```

#### Après :
```javascript
import { getMediasDir } from '../../utils/fileUtils.js';
videoPath = path.join(getMediasDir(), filename);
```

**Lignes modifiées :**
- Import : ligne 2
- Conversion URL → chemin : ligne 176

---

## ✅ Fichiers déjà conformes

Ces fichiers utilisaient **déjà** `getMediasDir()` correctement :
- ✅ `backend/services/dataStorage.js`
- ✅ `backend/services/videoProcessor.js`
- ✅ `backend/services/imageAnalyzer.js`
- ✅ `backend/services/imageEditor.js`
- ✅ `backend/services/videoImageGenerator.js`
- ✅ `backend/services/tasks/ImageResizeCropTask.js`

---

## 📂 Architecture des chemins

Tous les chemins sont maintenant centralisés dans **`backend/utils/fileUtils.js`** :

```javascript
export function getDataDir() {
  return path.join(process.cwd(), 'data');
}

export function getMediasDir() {
  return path.join(getDataDir(), 'medias');  // → data/medias
}

export function getCollectionsDir() {
  return path.join(getDataDir(), 'collections');  // → data/collections
}

export function getTemplatesDir() {
  return path.join(getDataDir(), 'templates');  // → data/templates
}

export function getWorkflowsDir() {
  return path.join(getDataDir(), 'workflows');  // → data/workflows
}
```

---

## 📝 Notes

### Dossier temporaire
Le dossier `uploads/temp` utilisé dans `videoProcessor.js` reste inchangé car :
- Il contient des fichiers **vraiment temporaires** (traitement FFmpeg)
- Il n'est **pas** dans `data/` volontairement (séparation logique)
- Il est nettoyé automatiquement après chaque traitement

### URLs relatives
Toutes les URLs retournées au frontend utilisent le format `/medias/filename.ext`, qui est correctement résolu par :
1. Le reverse proxy Nginx (pour l'accès web)
2. Les fonctions `getMediaFilePath()` dans le backend (pour l'accès fichier)

---

## 🧪 Tests recommandés

Pour vérifier que tout fonctionne :

1. **Upload d'image** → Vérifier que le fichier est dans `data/medias/`
2. **Workflow avec vidéo** → Tester VideoExtractFrameTask et VideoConcatenateTask
3. **Liste des médias** → Appeler `/api/media/list` et vérifier les chemins

---

## ✅ Résultat
Tous les services backend utilisent maintenant la fonction centralisée `getMediasDir()` pour accéder au dossier `data/medias/`. Plus aucune référence en dur à l'ancien chemin `medias/` ou `../medias`.
