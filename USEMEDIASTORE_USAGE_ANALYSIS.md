# 🔍 Analyse useMediaStore - Utilisation Actuelle

## 📅 Date: 6 novembre 2025

---

## 🎯 Résumé

**Composants utilisant useMediaStore** : 6 composants
- 5 composants actifs de l'interface médias
- 1 page de test (TestUpload.vue)

**Conclusion préliminaire** : ⚠️ **useMediaStore est activement utilisé** et nécessite une migration soigneuse vers useCollectionStore.

---

## 📊 Analyse Détaillée par Composant

### 1. MediaUploadDialog.vue ⭐ (CRITIQUE)

**Imports** :
```javascript
import { useMediaStore } from 'src/stores/useMediaStore'
```

**Utilisations** :
```javascript
const mediaStore = useMediaStore()

// Upload simple
const media = await mediaStore.uploadSingle(validFiles[0])

// Upload multiple
const result = await mediaStore.uploadMultiple(validFiles)
```

**Fonctionnalités utilisées** :
- ✅ `uploadSingle(file)` - Upload d'un fichier
- ✅ `uploadMultiple(files)` - Upload multiple

**Impact** : 🔴 **CRITIQUE** - Composant principal d'upload
**Migration** : Nécessite ajout de ces méthodes à useCollectionStore

---

### 2. MediaSelector.vue ⭐ (CRITIQUE)

**Utilisations multiples** :
```javascript
// Récupération média
const media = mediaStore.getMedia(mediaId)

// Format taille
mediaStore.formatFileSize(size)

// Upload
result = await mediaStore.uploadMultiple(files)
result = await mediaStore.uploadSingle(files[0])

// Accès direct à la Map
mediaStore.medias.set(mediaId, { ... })
```

**Fonctionnalités utilisées** :
- ✅ `getMedia(id)` - Récupération média
- ✅ `formatFileSize(bytes)` - Utilitaire formatage
- ✅ `uploadSingle/Multiple()` - Upload
- ✅ `medias` (Map) - Accès direct cache

**Impact** : 🔴 **CRITIQUE** - Composant de sélection principal
**Migration** : Nécessite refactoring complet

---

### 3. MediaGallery.vue ⭐ (CRITIQUE)

**Utilisations massives** (17 références) :
```javascript
// Statistiques
mediaStore.totalCount
mediaStore.totalSize
mediaStore.images.length
mediaStore.videos.length

// Computed
mediaStore.images
mediaStore.videos
mediaStore.allMedias

// Méthodes
mediaStore.getRecent(20)
mediaStore.getMostUsed(20)
mediaStore.useMedia(id)
mediaStore.loadAllMedias()
mediaStore.deleteMedia(id)
mediaStore.formatFileSize(bytes)

// État
mediaStore.loading
```

**Fonctionnalités utilisées** :
- ✅ Statistiques (count, size)
- ✅ Filtres par type (images, videos)
- ✅ Tri (récents, plus utilisés)
- ✅ CRUD (load, delete)
- ✅ Marquage utilisation
- ✅ Utilitaires (formatFileSize)

**Impact** : 🔴 **CRITIQUE** - Galerie principale très dépendante
**Migration** : Refactoring majeur nécessaire

---

### 4. SimpleMediaGallery.vue ✅ (FACILE)

**Utilisations minimales** :
```javascript
mediaStore.formatFileSize(bytes)
```

**Fonctionnalités utilisées** :
- ✅ `formatFileSize(bytes)` - Utilitaire uniquement

**Impact** : 🟢 **FACILE** - Une seule fonction utilitaire
**Migration** : Remplacer par fonction standalone ou ajouter à useCollectionStore

---

### 5. MediaSearchDialog.vue ✅ (FACILE)

**Utilisations minimales** :
```javascript
mediaStore.searchMedias(searchQuery.value)
```

**Fonctionnalités utilisées** :
- ✅ `searchMedias(query)` - Recherche

**Impact** : 🟢 **FACILE** - Une seule méthode
**Migration** : Ajouter fonction de recherche à useCollectionStore

---

### 6. TestUpload.vue ⚠️ (PAGE TEST)

**Utilisations multiples** :
```javascript
// Statistiques
mediaStore.totalCount
mediaStore.images.length
mediaStore.videos.length
mediaStore.totalSize

// Méthodes
mediaStore.loadAllMedias()
mediaStore.clearStore()
mediaStore.formatFileSize(bytes)

// État
mediaStore.loading
```

**Fonctionnalités utilisées** :
- ✅ Statistiques complètes
- ✅ Load/Clear
- ✅ Utilitaires

**Impact** : 🟡 **MOYEN** - Page de test (peut être mise à jour)
**Migration** : Refactoring moyen

---

## 🔧 Fonctionnalités useMediaStore à Migrer

### Actions CRUD
```javascript
✅ uploadSingle(file)          → Ajouter à useCollectionStore
✅ uploadMultiple(files)       → Ajouter à useCollectionStore
✅ loadAllMedias()             → Peut utiliser fetchCollections()
✅ deleteMedia(id)             → Utiliser removeMediaFromCollection()
✅ getMedia(id)                → Chercher dans collections
✅ useMedia(id)                → Marquer utilisation (à ajouter)
```

### Computed/Filtres
```javascript
✅ images                      → Filtrer collections par type
✅ videos                      → Filtrer collections par type
✅ allMedias                   → Tous les médias des collections
✅ totalCount                  → Compter médias dans collections
✅ totalSize                   → Sommer tailles médias
```

### Méthodes Spécialisées
```javascript
✅ getRecent(n)                → Trier par date
✅ getMostUsed(n)              → Trier par usage
✅ searchMedias(query)         → Recherche dans collections
```

### Utilitaires
```javascript
✅ formatFileSize(bytes)       → Fonction standalone ou computed
✅ clearStore()                → Vider collections session
```

### Accès Direct
```javascript
⚠️ medias (Map)                → Remplacer par collections array
```

---

## 🚧 Problèmes Identifiés

### 1. Double Système de Gestion
```
useMediaStore (Session)          useCollectionStore (Persistant)
├── Map<id, media>               ├── collections[]
├── Cache temporaire             ├──   └── images[]
└── Upload service               └── Backend JSON
```

**Problème** : Confusion sur où chercher les médias

### 2. Dépendance Forte
- 3 composants critiques avec 10+ références chacun
- Accès direct à la structure interne (Map)
- Logique métier dispersée

### 3. Fonctionnalités Manquantes dans useCollectionStore
- ❌ Upload direct de médias
- ❌ Cache session temporaire
- ❌ Statistiques globales (totalCount, totalSize)
- ❌ Tri par récence/utilisation
- ❌ Recherche fulltext
- ❌ Marquage d'utilisation

---

## 📋 Plan de Migration Recommandé

### Phase 2A: Étendre useCollectionStore

#### Ajouter État Session
```javascript
// useCollectionStore étendu
{
  // Existant
  collections: [],
  currentCollection: null,
  
  // NOUVEAU - Session temporaire
  sessionMedias: new Map(),
  
  // NOUVEAU - Statistiques
  stats: {
    totalCount: 0,
    totalSize: 0,
    imageCount: 0,
    videoCount: 0
  }
}
```

#### Ajouter Actions Upload
```javascript
// Nouvelles actions
async uploadToSession(file) {
  const result = await uploadMediaService.uploadSingle(file)
  sessionMedias.set(result.id, {
    ...result,
    inSession: true,
    usageCount: 0
  })
  updateStats()
  return result
}

async uploadMultipleToSession(files) {
  const results = await uploadMediaService.uploadMultiple(files)
  results.forEach(media => {
    sessionMedias.set(media.id, {
      ...media,
      inSession: true,
      usageCount: 0
    })
  })
  updateStats()
  return results
}

async moveToCollection(mediaId, collectionId) {
  const media = sessionMedias.get(mediaId)
  await addMediaToCollection(collectionId, media)
  sessionMedias.delete(mediaId)
  updateStats()
}
```

#### Ajouter Computed
```javascript
// Nouveaux computed
const allMedias = computed(() => {
  // Session + Collections
  const sessionArray = Array.from(sessionMedias.value.values())
  const collectionMedias = collections.value
    .flatMap(c => c.images || [])
  return [...sessionArray, ...collectionMedias]
})

const images = computed(() => 
  allMedias.value.filter(m => m.type === 'image')
)

const videos = computed(() => 
  allMedias.value.filter(m => m.type === 'video')
)

const totalCount = computed(() => allMedias.value.length)
const totalSize = computed(() => 
  allMedias.value.reduce((sum, m) => sum + m.size, 0)
)
```

#### Ajouter Méthodes Utilitaires
```javascript
function formatFileSize(bytes) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

function getRecent(limit = 20) {
  return allMedias.value
    .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt))
    .slice(0, limit)
}

function getMostUsed(limit = 20) {
  return allMedias.value
    .filter(m => m.usageCount > 0)
    .sort((a, b) => b.usageCount - a.usageCount)
    .slice(0, limit)
}

function searchMedias(query) {
  const lowerQuery = query.toLowerCase()
  return allMedias.value.filter(m => 
    m.filename?.toLowerCase().includes(lowerQuery) ||
    m.description?.toLowerCase().includes(lowerQuery)
  )
}

function useMedia(id) {
  // Chercher en session
  let media = sessionMedias.value.get(id)
  if (media) {
    media.usageCount++
    media.lastUsed = new Date().toISOString()
    return media
  }
  
  // Chercher dans collections
  for (const collection of collections.value) {
    media = collection.images?.find(m => m.mediaId === id)
    if (media) {
      // Marquer utilisation côté backend si besoin
      return media
    }
  }
  
  return null
}

function clearSession() {
  sessionMedias.value.clear()
  updateStats()
}
```

---

### Phase 2B: Migrer les Composants

#### Ordre de Migration (du plus facile au plus complexe)

1. **SimpleMediaGallery.vue** (🟢 Facile - 5 min)
   - Remplacer `mediaStore.formatFileSize()` par `collectionStore.formatFileSize()`

2. **MediaSearchDialog.vue** (🟢 Facile - 10 min)
   - Remplacer `mediaStore.searchMedias()` par `collectionStore.searchMedias()`

3. **TestUpload.vue** (🟡 Moyen - 20 min)
   - Remplacer toutes les références
   - Tester fonctionnalités

4. **MediaUploadDialog.vue** (🔴 Complexe - 1h)
   - Remplacer `uploadSingle/Multiple` par versions de collectionStore
   - Tester workflow upload complet

5. **MediaSelector.vue** (🔴 Complexe - 1h)
   - Refactorer accès direct à `medias` Map
   - Remplacer `getMedia()` par recherche dans collections
   - Adapter logique upload

6. **MediaGallery.vue** (🔴 Très Complexe - 2h)
   - 17 références à remplacer
   - Refactorer filtres et tri
   - Adapter computed
   - Tester toutes les fonctionnalités

**Temps total estimé** : 4-5h

---

### Phase 2C: Supprimer useMediaStore

```bash
# Vérifier aucune référence
grep -r "useMediaStore" frontend/src/

# Supprimer le store
rm frontend/src/stores/useMediaStore.js

# Build et tests
npm run build

# Commit
git commit -m "♻️ Refactor: Fusion useMediaStore dans useCollectionStore"
```

---

## 🎯 Décision Requise

### Option 1: Migration Complète ⭐ RECOMMANDÉE
```
Durée: 4-5h
Résultat: Architecture optimale (2 stores)
Bénéfice: Aucune redondance, maintenance simplifiée
```

### Option 2: Coexistence Documentée
```
Durée: 0h
Résultat: 3 stores (confusion reste)
Bénéfice: Aucun refactoring
```

### Option 3: Cohabitation Clarifiée
```
Durée: 1h (documentation)
Résultat: Rôles clarifiés par doc
Bénéfice: Effort minimal, amélioration partielle
```

---

## 📊 Comparaison Avant/Après Migration

### Avant (Actuel)
```
useMediaStore:
- 323 lignes
- 6 composants dépendants
- Cache session (Map)
- Upload service
- Statistiques
- Filtres/Tri

useCollectionStore:
- 355 lignes
- 4 composants dépendants
- Collections persistantes
- Sélection workflow
```

### Après Migration
```
useCollectionStore:
- ~500 lignes (+145)
- 10 composants dépendants
- Collections persistantes
- Session temporaire (Map)
- Upload service intégré
- Statistiques globales
- Filtres/Tri/Recherche
- Sélection workflow

useMediaStore:
- SUPPRIMÉ (-323 lignes)
```

---

## ✅ Recommandation Finale

**MIGRER vers Option 1** car :

1. ✅ **Architecture claire** : Un seul store pour tous les médias
2. ✅ **Workflow unifié** : Upload → Session → Collection
3. ✅ **Maintenance simplifiée** : Une seule source de vérité
4. ✅ **Effort raisonnable** : 4-5h pour gain long terme
5. ✅ **Pas de breaking change** : Migration interne uniquement

**Prochaine étape** : Valider avec l'utilisateur puis démarrer Phase 2A

---

**Status** : ⏳ Attente validation pour Phase 2
