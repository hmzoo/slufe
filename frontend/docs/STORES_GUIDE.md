# 🎯 Guide des Stores SLUFE - Responsabilités Actuelles

## 📋 Vue d'ensemble

SLUFE utilise actuellement **3 stores actifs** (+ 1 obsolète à supprimer)

---

## ✅ Store 1: useCollectionStore

### 🎯 Responsabilité
**Gestion des collections de médias organisées et persistantes**

### 📦 État Principal
```javascript
{
  // Collections
  collections: Array,              // Liste toutes collections
  currentCollection: Object,       // Collection visualisée
  serverCurrentCollection: Object, // Collection active serveur
  
  // Workflow Selection
  selectedMediasForWorkflow: Array,
  workflowSelectionMode: Boolean,
  
  // UI
  loading: Boolean,
  error: String
}
```

### 🔧 Actions Principales

#### Gestion Collections
- `fetchCollections()` - Liste toutes
- `fetchCurrentCollection()` - Collection active serveur
- `viewCollection(id)` - Affiche (sans définir active)
- `setCurrentCollection(id)` - Définit comme active
- `createCollection(data)`
- `updateCollection(id, data)`
- `deleteCollection(id)`

#### Gestion Médias
- `addMediaToCollection(collectionId, media)`
- `removeMediaFromCollection(collectionId, mediaId)`

#### Sélection pour Workflows
- `toggleWorkflowSelectionMode()` - Active/désactive mode
- `toggleMediaForWorkflow(media)` - Sélectionne média
- `selectAllMediasForWorkflow()` - Tout sélectionner
- `clearWorkflowSelection()` - Vider sélection

### 📊 Computed
- `hasCollections` - Boolean
- `hasCurrentCollection` - Boolean
- `currentCollectionMedias` - Array (images + vidéos)
- `currentCollectionStats` - { total, images, videos }

### 🔗 Utilisé Par
- WorkflowBuilder.vue ⭐
- CollectionView.vue
- CollectionManager.vue
- MainNavigation.vue

### 💾 Persistence
- **Backend**: Fichiers JSON dans `backend/collections/`
- **Pas de localStorage** (tout serveur)

---

## ✅ Store 2: useWorkflowStore

### 🎯 Responsabilité
**Gestion des workflows (création, édition, exécution, templates)**

### 📦 État Principal
```javascript
{
  // Workflow
  currentWorkflow: Object,        // En cours d'édition
  workflowHistory: Array,         // Historique exécutions
  
  // Exécution
  executing: Boolean,
  lastResult: Object,
  
  // Sauvegarde
  savedWorkflows: Array,          // localStorage
  workflowTemplates: Array,       // Prédéfinis (10+)
  
  // UI
  error: String
}
```

### 🔧 Actions Principales

#### Exécution
- `executeWorkflow(workflow)` - Lance exécution
- `stopExecution()` - Arrête si en cours

#### Sauvegarde
- `saveWorkflow(name, desc, workflow)` - Sauvegarde avec versioning
- `loadWorkflow(id)` - Charge depuis localStorage
- `deleteWorkflow(id)` - Supprime
- `duplicateWorkflow(id)` - Duplique
- `renameWorkflow(id, newName)` - Renomme

#### Templates
- `getTemplateById(id)` - Récupère template
- `loadTemplate(id)` - Charge dans builder

### 📊 Computed
- `hasSavedWorkflows` - Boolean
- `workflowCount` - Number

### 🔗 Utilisé Par
- WorkflowBuilder.vue ⭐
- WorkflowRunner.vue
- WorkflowManager.vue
- TemplateManager.vue

### 💾 Persistence
- **localStorage**: `slufe_saved_workflows`
- **Backend**: Fichiers exécution dans `backend/data/workflows/`

### 📝 Templates Inclus
```javascript
[
  'generate-simple',           // Génération basique
  'enhance-generate',          // Prompt amélioré
  'generate-edit',            // Génération + édition
  'describe-generate',        // Description → génération
  'multi-generate',           // Génération multiple
  'video-t2v',               // Vidéo Text-to-Video
  'video-i2v',               // Vidéo Image-to-Video
  'video-concatenate',        // Fusion vidéos
  // ... (10+ templates)
]
```

---

## ⚠️ Store 3: useMediaStore (À CLARIFIER)

### 🎯 Responsabilité (Actuelle)
**Gestion des médias temporaires en session**

### 📦 État Principal
```javascript
{
  medias: Map<id, mediaInfo>,     // Cache session
  loading: Boolean,
  error: String,
  
  sessionStats: {
    totalUploaded: Number,
    totalSize: Number,
    lastUpload: Date
  }
}
```

### 🔧 Actions Principales

#### Upload
- `uploadSingle(file)` - Upload + ajout store
- `uploadMultiple(files)` - Upload multiple

#### Gestion
- `addMedia(mediaInfo)` - Ajoute au cache
- `getMedia(id)` - Lecture seule
- `useMedia(id)` - Marque comme utilisé
- `removeMedia(id)` - Retire du cache
- `loadAllMedias()` - Charge depuis serveur

### 📊 Computed
- `images` - Filtre type image
- `videos` - Filtre type video
- `audios` - Filtre type audio
- `allMedias` - Tous triés par date
- `totalCount` - Nombre total
- `totalSize` - Taille totale

### 🔗 Utilisé Par
- SimpleMediaGallery.vue
- MediaSelector.vue
- MediaGallery.vue
- MediaUploadDialog.vue
- MediaSearchDialog.vue
- WorkflowRunner.vue
- TestUpload.vue (page test)

### 💾 Persistence
- **Aucune** - Cache session uniquement
- Médias sur serveur dans `backend/medias/`

### ⚠️ Problème
**Redondance avec useCollectionStore**:
- Les deux gèrent des médias
- Collections stocke dans `images[]`
- MediaStore stocke dans `Map()`
- Double système upload/gestion

---

## ❌ Store 4: useMainStore (OBSOLÈTE)

### 🎯 Responsabilité (Ancienne)
**Store du prototype v1 - À SUPPRIMER**

### 📦 État
```javascript
{
  images: Array,              // Upload analyse auto
  prompt: String,
  enhancedPrompt: String,
  imageDescriptions: Array,
  result: Object,
  loading: Boolean,
  workflowAnalysis: Object
}
```

### 🔗 Utilisé Par (Composants Obsolètes)
- ❌ PromptInput.vue (non utilisé)
- ❌ InfoPreview.vue (non utilisé)
- ❌ DebugStore.vue (non utilisé)

### ❌ À SUPPRIMER
Aucune référence dans code actif v2

---

## 🔄 Comparaison useMediaStore vs useCollectionStore

### useMediaStore (Session)
```
Upload fichier
    ↓
Ajout à Map
    ↓
Cache temporaire
    ↓
Utilisation dans workflow
    ↓
(Perdu au refresh)
```

### useCollectionStore (Persistant)
```
Média existant
    ↓
Ajout à collection
    ↓
Stockage backend JSON
    ↓
Persistant + Organisé
    ↓
Sélection pour workflow
```

### 🤔 Confusion Actuelle
- Upload où ? MediaStore ou Collection ?
- Workflow utilise quoi ? Session ou Collection ?
- Quelle source de vérité ?

---

## 💡 Architecture Recommandée

### Option A: Fusion dans useCollectionStore ⭐

```javascript
// useCollectionStore étendu
{
  // Collections (persistant)
  collections: Array,
  currentCollection: Object,
  
  // Session (temporaire) - NOUVEAU
  sessionMedias: Map<id, media>,
  
  // Workflow
  selectedMediasForWorkflow: Array,
  workflowSelectionMode: Boolean
}

// Flux proposé:
// 1. Upload → sessionMedias (temporaire)
// 2. Ajout à collection → collections[].images[]
// 3. Workflow utilise → selectedMediasForWorkflow (depuis collections OU session)
```

**Avantages**:
- ✅ Un seul store médias
- ✅ Flux clair: temporaire → persistant
- ✅ Workflow peut utiliser les 2 sources

**Actions à ajouter**:
```javascript
uploadToSession(file)              // Upload temporaire
moveToCollection(mediaId, collId)  // Session → Collection
getSessionMedias()                 // Liste session
clearSession()                     // Vide session
```

---

## 📊 Statistiques Stores

| Store | Lignes | État | Actions | Computed | Utilisé Par |
|-------|--------|------|---------|----------|-------------|
| **useCollectionStore** | 355 | ✅ Essentiel | 15+ | 4 | 4 composants |
| **useWorkflowStore** | 868 | ✅ Essentiel | 10+ | 2 | 4 composants |
| **useMediaStore** | 323 | ⚠️ Redondant | 10+ | 5 | 7 composants |
| **useMainStore** | 259 | ❌ Obsolète | 8+ | 2 | 0 composants |
| **TOTAL** | 1,805 | - | 40+ | 13 | 15 unique |

---

## 🎯 Décisions à Prendre

### 1. useMediaStore - 3 Options

#### A. Supprimer ⭐
- Migrer vers useCollectionStore
- Refactoring 7 composants
- Architecture la plus claire

#### B. Conserver
- Documenter rôle précis
- Session vs Persistant
- Risque confusion reste

#### C. Fusionner
- useCollectionStore étendu
- sessionMedias + collections
- Meilleur compromis

### 2. useMainStore - 1 Action

#### Supprimer Immédiatement ✅
- Aucune référence active
- Store v1 obsolète
- Gain: 259 lignes

---

## 🚀 Recommandation Finale

### Immédiat (Phase 1)
```bash
# Supprimer useMainStore + 8 composants obsolètes
rm frontend/src/stores/useMainStore.js
rm frontend/src/components/{PromptInput,ResultDisplay,InfoPreview,DebugStore}.vue
rm frontend/src/components/{ImageUploader,ImageEditor,WorkflowAnalysis,CameraCapture}.vue
```

### Court Terme (Phase 2)
```bash
# Option A: Migrer useMediaStore vers useCollectionStore
# 1. Étendre useCollectionStore avec sessionMedias
# 2. Migrer 7 composants un par un
# 3. Supprimer useMediaStore.js
# 4. Tests de régression
```

### Résultat Final
```
ARCHITECTURE CLAIRE:
├── useCollectionStore (Collections + Médias session/persistant)
└── useWorkflowStore (Workflows + Templates)

2 STORES | Responsabilités claires | Aucune redondance
```

---

**Statut**: ⏳ Attente validation utilisateur
