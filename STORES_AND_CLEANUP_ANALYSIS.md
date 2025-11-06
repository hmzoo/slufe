# 🔍 Analyse des Stores et Nettoyage du Code

## 📅 Date: 6 novembre 2025

---

## 📊 Vue d'ensemble des Stores

Le projet SLUFE utilise **4 stores Pinia** avec des responsabilités qui se chevauchent parfois, créant de la confusion.

### 1. **useCollectionStore** ✅ (Store Principal - Collections)

**Fichier**: `frontend/src/stores/useCollectionStore.js` (355 lignes)

**Responsabilité**: Gestion des collections de médias (images/vidéos)

**État Principal**:
```javascript
{
  collections: [],                    // Toutes les collections
  currentCollection: null,            // Collection visualisée
  serverCurrentCollection: null,      // Collection active sur serveur
  selectedMediasForWorkflow: [],      // Sélection pour workflows
  workflowSelectionMode: false,       // Mode sélection activé
  loading: false,
  error: null
}
```

**Actions Clés**:
- ✅ `fetchCollections()` - Liste toutes les collections
- ✅ `viewCollection(id)` - Affiche une collection (sans la définir comme active)
- ✅ `setCurrentCollection(id)` - Définit comme collection active serveur
- ✅ `createCollection()`, `updateCollection()`, `deleteCollection()`
- ✅ `addMediaToCollection()`, `removeMediaFromCollection()`
- ✅ `toggleWorkflowSelectionMode()` - Active sélection médias
- ✅ `toggleMediaForWorkflow()` - Sélectionne/désélectionne média

**Utilisation**: 
- ✅ `CollectionView.vue`
- ✅ `CollectionManager.vue`
- ✅ `WorkflowBuilder.vue`
- ✅ `MainNavigation.vue`

**Verdict**: ✅ **ESSENTIEL** - Store principal pour collections, bien structuré

---

### 2. **useWorkflowStore** ✅ (Store Principal - Workflows)

**Fichier**: `frontend/src/stores/useWorkflowStore.js` (868 lignes)

**Responsabilité**: Gestion des workflows (création, exécution, templates)

**État Principal**:
```javascript
{
  currentWorkflow: null,              // Workflow en cours d'édition
  workflowHistory: [],                // Historique des exécutions
  executing: false,                   // Indicateur exécution
  lastResult: null,                   // Dernier résultat d'exécution
  savedWorkflows: [],                 // Workflows sauvegardés (localStorage)
  workflowTemplates: [],              // Templates prédéfinis
  error: null
}
```

**Actions Clés**:
- ✅ `executeWorkflow()` - Exécute un workflow
- ✅ `saveWorkflow()` - Sauvegarde avec versioning
- ✅ `loadWorkflow()` - Charge depuis localStorage
- ✅ `deleteWorkflow()` - Supprime workflow
- ✅ `duplicateWorkflow()` - Duplique workflow
- ✅ Templates: 10+ workflows prédéfinis (generate-simple, enhance-generate, etc.)

**Utilisation**: 
- ✅ `WorkflowBuilder.vue`
- ✅ `WorkflowManager.vue`
- ✅ `TemplateManager.vue`
- ✅ `WorkflowRunner.vue`

**Verdict**: ✅ **ESSENTIEL** - Store principal pour workflows, bien structuré

---

### 3. **useMediaStore** ⚠️ (Doublons avec useCollectionStore)

**Fichier**: `frontend/src/stores/useMediaStore.js` (323 lignes)

**Responsabilité**: Gestion des médias en session (upload, stockage temporaire)

**État Principal**:
```javascript
{
  medias: new Map(),                  // Map<id, mediaInfo>
  loading: false,
  error: null,
  sessionStats: {
    totalUploaded: 0,
    totalSize: 0,
    lastUpload: null
  }
}
```

**Actions Clés**:
- ⚠️ `uploadSingle()` - Upload un fichier
- ⚠️ `uploadMultiple()` - Upload plusieurs fichiers
- ⚠️ `loadAllMedias()` - Charge tous les médias serveur
- ⚠️ `addMedia()` - Ajoute média au store
- ⚠️ `getMedia()`, `useMedia()` - Récupération médias

**Computed**:
```javascript
const images = computed(() => medias.filter(m => m.type === 'image'))
const videos = computed(() => medias.filter(m => m.type === 'video'))
const audios = computed(() => medias.filter(m => m.type === 'audio'))
```

**Utilisation**:
- ⚠️ `SimpleMediaGallery.vue`
- ⚠️ `MediaSelector.vue`
- ⚠️ `MediaGallery.vue`
- ⚠️ `MediaUploadDialog.vue`
- ⚠️ `MediaSearchDialog.vue`
- ⚠️ `WorkflowRunner.vue`
- ⚠️ `TestUpload.vue`

**Problèmes Identifiés**:
1. 🔴 **Duplication** avec `useCollectionStore`:
   - Les deux stores gèrent des médias
   - `useCollectionStore` stocke dans `collections[].images[]`
   - `useMediaStore` stocke dans `medias Map()`
   
2. 🔴 **Confusion conceptuelle**:
   - `useMediaStore` = Médias temporaires en session ?
   - `useCollectionStore` = Médias persistants en collections ?
   - Pas clair où uploader les nouveaux médias

3. 🔴 **Double système d'upload**:
   - `useMediaStore.uploadSingle()` existe
   - Collections ont leur propre système d'ajout
   - Risque de désynchronisation

**Verdict**: ⚠️ **À ÉVALUER** - Possiblement redondant avec useCollectionStore

---

### 4. **useMainStore** ❌ (Store Obsolète)

**Fichier**: `frontend/src/stores/useMainStore.js` (259 lignes)

**Responsabilité**: Ancien store du prototype initial

**État Principal**:
```javascript
{
  images: [],                         // Images uploadées
  prompt: '',                         // Prompt de génération
  enhancedPrompt: '',                 // Prompt amélioré
  imageDescriptions: [],              // Descriptions analysées
  result: null,                       // Résultat génération
  loading: false,
  workflowAnalysis: null              // Analyse workflow
}
```

**Actions**:
- ❌ `addImage()` - Ajoute image et l'analyse automatiquement
- ❌ `analyzeImage()` - Analyse via LLaVA
- ❌ `getImageDescriptions()` - Récupère descriptions
- ❌ `removeImage()`, `clearImages()`
- ❌ `setPrompt()`, `setEnhancedPrompt()`

**Utilisation**:
- ❌ `PromptInput.vue` (ancien composant)
- ❌ `InfoPreview.vue` (ancien composant)
- ❌ `DebugStore.vue` (debug uniquement)

**Problèmes Identifiés**:
1. 🔴 **Architecture v1** - Ce store appartient au prototype initial
2. 🔴 **Fonctionnalités obsolètes** - Maintenant gérées par workflows v2
3. 🔴 **Analyse automatique** - Système remplacé par tâche `describe_images`
4. 🔴 **Utilisé uniquement par composants obsolètes**

**Verdict**: ❌ **OBSOLÈTE** - À supprimer après migration composants

---

## 🔴 Composants Obsolètes Identifiés

### Composants Non Utilisés (0 références)

#### 1. **InfoPreview.vue** ❌
- **Utilisation**: Aucune (0 matches grep)
- **Dépendances**: `useMainStore` (obsolète)
- **Fonction**: Affichage des analyses d'images
- **Verdict**: ❌ **À SUPPRIMER**

#### 2. **DebugStore.vue** ❌
- **Utilisation**: Aucune (0 matches grep)
- **Dépendances**: `useMainStore` (obsolète)
- **Fonction**: Debug du store principal
- **Verdict**: ❌ **À SUPPRIMER**

#### 3. **PromptInput.vue** ❌
- **Utilisation**: Aucune (0 matches grep)
- **Dépendances**: `useMainStore`, `ResultDisplay.vue`
- **Fonction**: Ancien système de génération d'images
- **Description**: Composant prototype avec analyse images + génération
- **Verdict**: ❌ **À SUPPRIMER** (remplacé par WorkflowBuilder)

#### 4. **ResultDisplay.vue** ❌
- **Utilisation**: Importé uniquement par `PromptInput.vue` (lui-même obsolète)
- **Fonction**: Affichage résultats de génération
- **Verdict**: ❌ **À SUPPRIMER**

#### 5. **ImageUploader.vue** ❌
- **Utilisation**: Aucune (0 matches grep)
- **Dépendances**: `CameraCapture.vue`
- **Fonction**: Upload images avec capture caméra
- **Verdict**: ❌ **À SUPPRIMER** (remplacé par système collections)

#### 6. **ImageEditor.vue** ❌
- **Utilisation**: Aucune (0 matches grep)
- **Fonction**: Éditeur d'images
- **Verdict**: ❌ **À SUPPRIMER** (ou à intégrer si fonctionnalités utiles)

#### 7. **WorkflowAnalysis.vue** ❌
- **Utilisation**: Aucune (0 matches grep)
- **Fonction**: Analyse et décomposition de workflows
- **Description**: Référencé dans `PromptInput.vue` via `store.workflowAnalysis`
- **Verdict**: ❌ **À SUPPRIMER** (fonctionnalité intégrée ailleurs)

#### 8. **CameraCapture.vue** ⚠️
- **Utilisation**: Importé uniquement par `ImageUploader.vue` (obsolète)
- **Fonction**: Capture depuis webcam
- **Verdict**: ⚠️ **À ÉVALUER** - Fonctionnalité utile mais non intégrée

---

### Page de Test (Peut rester)

#### **TestUpload.vue** ✅
- **Utilisation**: Route `/test-upload` (routes.js)
- **Dépendances**: `useMediaStore`
- **Fonction**: Page de test pour upload médias
- **Verdict**: ✅ **GARDER** (utile pour debug/tests)

---

## 📂 Architecture Actuelle vs Optimale

### Architecture Actuelle (Avec Redondances)

```
Stores:
├── useCollectionStore ✅ (Collections + Médias persistants)
├── useWorkflowStore ✅ (Workflows + Templates)
├── useMediaStore ⚠️ (Médias temporaires - REDONDANT?)
└── useMainStore ❌ (Prototype v1 - OBSOLÈTE)

Composants (26 total):
├── ACTIFS (18):
│   ├── MainNavigation.vue ✅
│   ├── WorkflowBuilder.vue ✅
│   ├── WorkflowRunner.vue ✅
│   ├── WorkflowManager.vue ✅
│   ├── TemplateManager.vue ✅
│   ├── CollectionView.vue ✅
│   ├── CollectionManager.vue ✅
│   ├── CollectionImageUpload.vue ✅
│   ├── MediaSelector.vue ✅
│   ├── MediaGallery.vue ✅
│   ├── MediaUploadDialog.vue ✅
│   ├── MediaSearchDialog.vue ✅
│   ├── MediaInfoDialog.vue ✅
│   ├── MediaPreviewDialog.vue ✅
│   ├── SimpleMediaGallery.vue ✅
│   ├── ImageGallerySelector.vue ✅
│   ├── TaskCard.vue ✅
│   └── workflow/ (dossier) ✅
│
└── OBSOLÈTES (8):
    ├── PromptInput.vue ❌
    ├── ResultDisplay.vue ❌
    ├── InfoPreview.vue ❌
    ├── DebugStore.vue ❌
    ├── ImageUploader.vue ❌
    ├── ImageEditor.vue ❌
    ├── WorkflowAnalysis.vue ❌
    └── CameraCapture.vue ⚠️
```

### Architecture Optimale (Après Nettoyage)

```
Stores:
├── useCollectionStore ✅ (Collections + Médias)
│   └── Responsabilité unique: Gestion collections/médias persistants
│
├── useWorkflowStore ✅ (Workflows)
│   └── Responsabilité unique: Gestion workflows/templates
│
└── useMediaStore ⚠️ (À décider)
    ├── Option A: Supprimer et tout migrer vers useCollectionStore
    ├── Option B: Conserver pour médias temporaires non-collections
    └── Option C: Fusionner avec useCollectionStore

Composants (18 actifs):
└── Tous les composants v2 (WorkflowBuilder, Collections, etc.)
```

---

## 🎯 Recommandations de Nettoyage

### 🔴 Priorité 1 - Supprimer Immédiatement

#### Store Obsolète
```bash
rm frontend/src/stores/useMainStore.js
```

#### Composants Obsolètes (8 fichiers)
```bash
# Composants prototype v1
rm frontend/src/components/PromptInput.vue
rm frontend/src/components/ResultDisplay.vue
rm frontend/src/components/InfoPreview.vue
rm frontend/src/components/DebugStore.vue
rm frontend/src/components/ImageUploader.vue
rm frontend/src/components/ImageEditor.vue
rm frontend/src/components/WorkflowAnalysis.vue
rm frontend/src/components/CameraCapture.vue
```

**Impact**: ✅ Aucun - Ces fichiers ne sont plus référencés

---

### ⚠️ Priorité 2 - Évaluer useMediaStore

#### Option A: Supprimer et Migrer vers useCollectionStore

**Avantages**:
- ✅ Architecture simplifiée (2 stores au lieu de 3)
- ✅ Un seul système de gestion médias
- ✅ Pas de confusion conceptuelle

**Inconvénients**:
- ⚠️ Refactoring nécessaire (7 composants)
- ⚠️ Peut perdre notion de "médias temporaires"

**Fichiers à modifier**:
```
frontend/src/components/
├── SimpleMediaGallery.vue
├── MediaSelector.vue
├── MediaGallery.vue
├── MediaUploadDialog.vue
├── MediaSearchDialog.vue
└── WorkflowRunner.vue

frontend/src/pages/
└── TestUpload.vue
```

#### Option B: Conserver avec Rôle Clarifié

**Proposition**:
- `useMediaStore` = Cache temporaire en session (Map)
- `useCollectionStore` = Persistance organisée (Collections)
- Upload → `useMediaStore` → Ajout manuel à collection → `useCollectionStore`

**Avantages**:
- ✅ Pas de refactoring
- ✅ Séparation claire temporaire/persistant

**Inconvénients**:
- ⚠️ Deux sources de vérité
- ⚠️ Risque de désynchronisation

#### Option C: Fusionner dans useCollectionStore

**Proposition**:
```javascript
// useCollectionStore étendu
{
  collections: [],           // Collections persistantes
  currentCollection: null,
  sessionMedias: new Map(),  // Médias temporaires (session)
  ...
}

// Nouvelles actions
uploadToSession(file)  // Upload temporaire
moveToCollection(mediaId, collectionId)  // Session → Collection
```

**Avantages**:
- ✅ Un seul store médias
- ✅ Workflow clair: upload → session → collection
- ✅ Pas de duplication

**Inconvénients**:
- ⚠️ Store plus complexe
- ⚠️ Refactoring moyen

---

### 🟢 Priorité 3 - Documentation et Tests

#### Documentation à Créer
```bash
# Documenter responsabilités stores
STORE_ARCHITECTURE.md
  - useCollectionStore: Collections + médias persistants
  - useWorkflowStore: Workflows + templates + exécution
  - [Decision] useMediaStore ou fusion

# Guides de migration
MIGRATION_V1_TO_V2.md
  - Anciens composants → Nouveaux équivalents
  - useMainStore → useCollectionStore/useWorkflowStore
```

#### Tests à Ajouter
```javascript
// Tests stores
describe('useCollectionStore', () => {
  it('should manage collections lifecycle')
  it('should handle workflow selection mode')
})

describe('useWorkflowStore', () => {
  it('should save and load workflows')
  it('should execute workflows')
})
```

---

## 📊 Statistiques de Nettoyage

### Avant Nettoyage
- **Stores**: 4 (2 essentiels, 1 redondant, 1 obsolète)
- **Composants**: 26 (18 actifs, 8 obsolètes)
- **Lignes de code**: ~1,800 lignes obsolètes
- **Confusion**: Haute (3 systèmes médias)

### Après Nettoyage (Minimal)
- **Stores**: 3 (2 essentiels, 1 à clarifier)
- **Composants**: 18 (actifs uniquement)
- **Lignes supprimées**: ~1,000 lignes
- **Confusion**: Moyenne (useMediaStore à clarifier)

### Après Nettoyage (Optimal)
- **Stores**: 2 (useCollectionStore, useWorkflowStore)
- **Composants**: 18 (actifs uniquement)
- **Lignes supprimées**: ~1,800 lignes
- **Confusion**: Faible (architecture claire)

---

## 🚀 Plan d'Action Suggéré

### Phase 1: Nettoyage Immédiat (1h)
```bash
# 1. Supprimer composants obsolètes
rm frontend/src/components/{PromptInput,ResultDisplay,InfoPreview,DebugStore,ImageUploader,ImageEditor,WorkflowAnalysis,CameraCapture}.vue

# 2. Supprimer store obsolète
rm frontend/src/stores/useMainStore.js

# 3. Mettre à jour index.js des stores
# Retirer export de useMainStore

# 4. Commit
git add .
git commit -m "🧹 Nettoyage: Suppression composants et stores obsolètes v1"
```

### Phase 2: Décision useMediaStore (2-4h)

**Option Recommandée**: Fusionner dans useCollectionStore

1. Étendre `useCollectionStore` avec `sessionMedias`
2. Migrer actions upload vers `useCollectionStore`
3. Refactorer 7 composants un par un
4. Tests de régression
5. Supprimer `useMediaStore.js`

### Phase 3: Documentation (1h)

1. Créer `STORE_ARCHITECTURE.md`
2. Mettre à jour `EVOLUTION_V2_SUMMARY.md`
3. Documenter flux upload médias
4. Diagrammes d'architecture

---

## 📝 Conclusion

Le projet SLUFE a évolué d'un prototype v1 vers une architecture v2 robuste, mais conserve des **artefacts du passé** qui créent de la confusion :

### Problèmes Actuels
1. 🔴 **useMainStore** complètement obsolète (v1)
2. 🔴 **8 composants** non utilisés et obsolètes
3. ⚠️ **useMediaStore** redondant avec useCollectionStore
4. ⚠️ **Double système** de gestion médias

### Solution Optimale
- ✅ Supprimer useMainStore + 8 composants obsolètes
- ✅ Fusionner useMediaStore dans useCollectionStore
- ✅ Architecture finale: **2 stores clairs** (Collections, Workflows)
- ✅ Flux unifié: Upload → Session → Collections

### Bénéfices Attendus
- 📉 **-1,800 lignes** de code obsolète
- 🎯 **Architecture claire** avec responsabilités séparées
- 🚀 **Maintenance simplifiée** (moins de confusion)
- 📚 **Meilleure documentation** des flux

---

**Prochaine Action Recommandée**: Exécuter Phase 1 (nettoyage immédiat) puis décider stratégie useMediaStore.
