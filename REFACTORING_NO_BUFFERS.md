# 🔧 Refactoring Majeur - Suppression des Buffers

## 📅 Date
5 novembre 2025

## 🎯 Objectif

**Arrêter d'utiliser les buffers** pour les médias et utiliser à la place les **URLs/chemins** des fichiers déjà enregistrés.

## ⚠️ Problème Identifié

Après les premiers fixes, la sélection d'images ne fonctionnait plus ni pour "Edit Image" ni pour "Generate Video I2V".

### Cause Racine

Le système a évolué :
- ❌ **AVANT** : Les médias étaient uploadés comme buffers
- ✅ **MAINTENANT** : Chaque média a un **ID unique** et un **chemin de fichier**

Les tâches essayaient toujours de gérer des buffers alors que le backend stocke maintenant les médias avec des IDs.

## 🔄 Architecture du Système de Médias

```
┌─────────────────────────────────────────────────┐
│ uploadMediaService.js                            │
├─────────────────────────────────────────────────┤
│ getMediaInfo(mediaId)                           │
│   ↓                                             │
│   Retourne:                                     │
│   {                                             │
│     id: "abc-123-...",                          │
│     filename: "abc-123-....jpg",                │
│     url: "/medias/abc-123-....jpg",             │
│     path: "/absolute/path/medias/abc-123.jpg",  │
│     type: "image",                              │
│     mimetype: "image/jpeg",                     │
│     size: 123456                                │
│   }                                             │
└─────────────────────────────────────────────────┘
```

## ✅ Solutions Implémentées

### 1. Mise à Jour `resolveMediaIds` (workflow.js)

**AVANT** : Créait des buffers
```javascript
const mediaBuffer = await fs.readFile(mediaInfo.path);
const fileInfo = {
  buffer: mediaBuffer,
  originalName: mediaInfo.filename,
  mimeType: mediaInfo.mimetype,
  size: mediaBuffer.length
};
```

**APRÈS** : Stocke les infos du média (URLs/chemins)
```javascript
const fileInfo = {
  id: mediaInfo.id || value,
  url: mediaInfo.url,              // ← URL locale /medias/...
  path: mediaInfo.path,            // ← Chemin absolu
  originalName: mediaInfo.originalName || mediaInfo.filename,
  mimeType: mediaInfo.mimetype,
  size: mediaInfo.size,
  type: mediaInfo.type || 'image'
};
```

### 2. Simplification `normalizeImageInput` (Tasks)

**AVANT** : Gérait buffers, objets avec buffer, etc.
```javascript
if (Buffer.isBuffer(input)) { ... }
else if (input.buffer) { 
  images.push(input.buffer); 
}
```

**APRÈS** : Gère URLs/chemins uniquement
```javascript
// String : URL, chemin ou ID
if (typeof input === 'string') {
  if (input.startsWith('http://') || input.startsWith('/medias/')) {
    images.push(input);
  }
}
// Objet : url, path ou filename
else if (input.url) {
  images.push(input.url);
}
else if (input.path) {
  const filename = input.path.split('/').pop();
  images.push(`/medias/${filename}`);
}
else if (input.filename) {
  images.push(`/medias/${input.filename}`);
}
```

### 3. Support Collections

**AVANT** : Lisait le fichier en buffer
```javascript
const mediaBuffer = await fs.readFile(mediaPath);
```

**APRÈS** : Stocke URL et chemin
```javascript
mediaInfo = {
  id: `collection_${index}`,
  url: img.url,                    // /medias/...
  path: mediaPath,                 // Chemin absolu
  type: img.type || 'image',
  // ...
};
```

## 📋 Fichiers Modifiés

### 1. `/backend/routes/workflow.js`
- **`resolveMediaIds()`** :
  - ❌ Supprimé : Lecture de buffers avec `fs.readFile()`
  - ✅ Ajouté : Stockage des infos média (url, path, id, type)
  - Support collections mis à jour
  - Support arrays d'IDs mis à jour

### 2. `/backend/services/tasks/GenerateVideoI2VTask.js`
- **`normalizeImageInput()`** :
  - ❌ Supprimé : Gestion des buffers (`Buffer.isBuffer()`, `input.buffer`)
  - ✅ Ajouté : Support `input.path`, `input.filename`
  - ✅ Ajouté : Support chemins locaux `/medias/...`
  - Logs plus clairs

### 3. `/backend/services/tasks/EditImageTask.js`
- **`normalizeImageInput()`** :
  - Mêmes modifications que GenerateVideoI2VTask
  - Cohérence entre les deux tâches

## 🔄 Flux Complet Mis à Jour

```
┌────────────────────────────────────────────────────┐
│ 1. FRONTEND - Sélection                            │
├────────────────────────────────────────────────────┤
│ MediaSelector émet UUID: "abc-123-..."            │
└────────────────────────────────────────────────────┘
              ↓
┌────────────────────────────────────────────────────┐
│ 2. BACKEND - resolveMediaIds()                     │
├────────────────────────────────────────────────────┤
│ getMediaInfo("abc-123-...")                        │
│   ↓                                                │
│ Retourne: {                                        │
│   url: "/medias/abc-123-....jpg",                  │
│   path: "/abs/path/medias/abc-123.jpg",            │
│   type: "image"                                    │
│ }                                                  │
│   ↓                                                │
│ Stocke dans inputs.__mediaFiles["abc-123-..."]    │
└────────────────────────────────────────────────────┘
              ↓
┌────────────────────────────────────────────────────┐
│ 3. WORKFLOWRUNNER - resolveValue()                 │
├────────────────────────────────────────────────────┤
│ Détecte UUID string                                │
│ Récupère __mediaFiles["abc-123-..."]              │
│ Retourne: {                                        │
│   url: "/medias/abc-123-....jpg",                  │
│   path: "/abs/path/...",                           │
│   type: "image"                                    │
│ }                                                  │
└────────────────────────────────────────────────────┘
              ↓
┌────────────────────────────────────────────────────┐
│ 4. TASK - normalizeImageInput()                    │
├────────────────────────────────────────────────────┤
│ Reçoit: { url: "/medias/...", path: "...", ... }  │
│   ↓                                                │
│ Détecte input.url existe                           │
│ Retourne: ["/medias/abc-123-....jpg"]             │
└────────────────────────────────────────────────────┘
              ↓
┌────────────────────────────────────────────────────┐
│ 5. SERVICE - videoImageGenerator / imageEditor     │
├────────────────────────────────────────────────────┤
│ Reçoit URL: "/medias/abc-123-....jpg"             │
│   ↓                                                │
│ Le service lit le fichier si nécessaire            │
│ Ou utilise l'URL directement pour Replicate       │
│   ↓                                                │
│ ✅ Traitement réussi                               │
└────────────────────────────────────────────────────┘
```

## 📊 Comparaison Avant/Après

| Aspect | ❌ AVANT (Buffers) | ✅ APRÈS (URLs/Chemins) |
|--------|-------------------|------------------------|
| **Stockage** | `buffer: Buffer(...)` | `url: "/medias/..."`, `path: "..."` |
| **Taille mémoire** | ⚠️ Grande (buffer en RAM) | ✅ Petite (string seulement) |
| **Performance** | ⚠️ Lecture anticipée | ✅ Lecture à la demande |
| **Flexibilité** | ❌ Buffer = format fixe | ✅ URL = réutilisable |
| **Debug** | ⚠️ Difficile (binaire) | ✅ Facile (URL lisible) |
| **Transmission** | ⚠️ Sérialisation complexe | ✅ String simple |

## 🧪 Tests à Effectuer

### Test 1: Edit Image
```bash
1. Workflow "Edit Image"
2. Sélectionner image depuis galerie
3. Ajouter prompt: "Make it blue"
4. Exécuter
# ✅ Devrait fonctionner
```

### Test 2: Generate Video I2V
```bash
1. Workflow "Generate Video I2V"
2. Sélectionner image depuis galerie
3. Ajouter prompt: "Add motion"
4. Exécuter
# ✅ Devrait fonctionner
```

### Test 3: Vérifier Logs
```bash
# Logs attendus:
🔍 Normalisation input: { type: 'object', objectKeys: 'id,url,path,mimeType,size,type' }
✅ Objet avec URL: /medias/abc-123-....jpg
✅ Tâche exécutée avec succès
```

## 🎯 Avantages de ce Refactoring

### 1. **Performance**
- Pas de lecture de fichier tant que non nécessaire
- Mémoire économisée (URLs au lieu de buffers)

### 2. **Maintenabilité**
- Code plus simple à comprendre
- Logs plus lisibles (URLs au lieu de buffers)
- Moins de conversions buffer ↔ base64

### 3. **Flexibilité**
- Services peuvent lire le fichier quand ils en ont besoin
- Ou utiliser l'URL directement si supporté (ex: Replicate)

### 4. **Cohérence**
- Toutes les tâches utilisent le même système
- Un seul point de vérité : le système de fichiers

## 🔗 Responsabilités

### `resolveMediaIds()` (routes/workflow.js)
- ✅ Résout UUID → Info média (url, path, type)
- ✅ Stocke dans `inputs.__mediaFiles`
- ❌ Ne lit PAS les fichiers

### `WorkflowRunner.resolveValue()`
- ✅ Détecte UUID string
- ✅ Récupère info depuis `__mediaFiles`
- ✅ Retourne objet avec url/path
- ❌ Ne lit PAS les fichiers

### `Task.normalizeImageInput()`
- ✅ Extrait URL/path depuis objet
- ✅ Retourne array d'URLs
- ❌ Ne lit PAS les fichiers

### Services (videoImageGenerator, imageEditor)
- ✅ Reçoivent URL/path
- ✅ **Lisent le fichier si nécessaire**
- ✅ Gèrent la conversion vers le format requis

## 📝 Notes Importantes

### URL vs Path
- **URL** (`/medias/...`) : Pour références HTTP, frontend
- **Path** (chemin absolu) : Pour lecture fichier backend

### Lecture Fichiers
- Les **services** lisent maintenant les fichiers, pas les routes/runner
- Lecture **à la demande** au lieu d'anticipée

### Compatibilité
- Les services existants doivent accepter les URLs
- Si nécessaire, ajouter conversion URL → buffer dans le service

---

**Date** : 5 novembre 2025  
**Impact** : Refactoring majeur du système de gestion des médias  
**Status** : ✅ Implémenté - Tests nécessaires  
**Performance** : ⬆️ Amélioration significative (pas de buffers en mémoire)
