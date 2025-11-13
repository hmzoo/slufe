# 🧹 Plan de Nettoyage SLUFE - Action Immédiate

## 🎯 Objectif
Supprimer **1,800 lignes de code obsolète** et clarifier l'architecture des stores

---

## ✅ Phase 1: Nettoyage Immédiat (SAFE - Aucun Impact)

### Fichiers à Supprimer

#### 1. Store Obsolète (259 lignes)
```bash
rm frontend/src/stores/useMainStore.js
```
**Raison**: Store du prototype v1, remplacé par useWorkflowStore + useCollectionStore

#### 2. Composants Obsolètes (8 fichiers, ~1,000 lignes)
```bash
rm frontend/src/components/PromptInput.vue
rm frontend/src/components/ResultDisplay.vue  
rm frontend/src/components/InfoPreview.vue
rm frontend/src/components/DebugStore.vue
rm frontend/src/components/ImageUploader.vue
rm frontend/src/components/ImageEditor.vue
rm frontend/src/components/WorkflowAnalysis.vue
rm frontend/src/components/CameraCapture.vue
```

**Raison**: 
- ❌ **0 références** dans le code actif
- ❌ Utilisent `useMainStore` (obsolète)
- ❌ Architecture v1 (remplacée par v2)

#### 3. Mise à jour index des stores
```javascript
// frontend/src/stores/index.js
// Retirer la ligne:
// export { useMainStore } from './useMainStore'
```

---

## ⚠️ Phase 2: Décision useMediaStore (Nécessite Discussion)

### Situation Actuelle

**3 systèmes de gestion médias coexistent** :

1. **useCollectionStore** (355 lignes)
   - Gère collections persistantes
   - État: `collections[].images[]`
   
2. **useMediaStore** (323 lignes) ⚠️
   - Gère médias en session
   - État: `medias Map<id, info>`
   - Utilisé par 7 composants
   
3. **Backend Collections API**
   - Persistence sur disque

### Options

#### Option A: Supprimer useMediaStore ⭐ RECOMMANDÉE
```
Tout migrer vers useCollectionStore
+ Collections persistantes
+ Médias temporaires (nouvelle section)
```

**Avantages**:
- ✅ Un seul système médias
- ✅ Pas de duplication
- ✅ Architecture claire

**Inconvénients**:
- ⚠️ Refactoring 7 composants
- ⚠️ 2-4h de travail

**Composants à modifier**:
- SimpleMediaGallery.vue
- MediaSelector.vue
- MediaGallery.vue
- MediaUploadDialog.vue
- MediaSearchDialog.vue
- WorkflowRunner.vue
- TestUpload.vue

#### Option B: Conserver avec Rôle Clarifié
```
useMediaStore = Cache session (temporaire)
useCollectionStore = Collections (persistant)
```

**Avantages**:
- ✅ Pas de refactoring
- ✅ Séparation temporaire/persistant

**Inconvénients**:
- ⚠️ 2 sources de vérité
- ⚠️ Confusion possible

#### Option C: Fusionner dans useCollectionStore
```javascript
// useCollectionStore étendu
{
  collections: [],           // Persistantes
  sessionMedias: new Map(),  // Temporaires
  // Workflow: upload → session → ajout collection
}
```

**Avantages**:
- ✅ Un store, workflow clair
- ✅ Flexibilité session/persistant

**Inconvénients**:
- ⚠️ Store plus complexe

---

## 📊 Impact Visuel

### Avant Nettoyage
```
STORES (4):
├── useCollectionStore ✅ (355 lignes)
├── useWorkflowStore ✅ (868 lignes)
├── useMediaStore ⚠️ (323 lignes) - REDONDANT
└── useMainStore ❌ (259 lignes) - OBSOLÈTE

COMPOSANTS (26):
├── Actifs (18) ✅
└── Obsolètes (8) ❌ - NON UTILISÉS
    ├── PromptInput.vue
    ├── ResultDisplay.vue
    ├── InfoPreview.vue
    ├── DebugStore.vue
    ├── ImageUploader.vue
    ├── ImageEditor.vue
    ├── WorkflowAnalysis.vue
    └── CameraCapture.vue
```

### Après Nettoyage Phase 1
```
STORES (3):
├── useCollectionStore ✅ (355 lignes)
├── useWorkflowStore ✅ (868 lignes)
└── useMediaStore ⚠️ (323 lignes) - À DÉCIDER

COMPOSANTS (18):
└── Actifs uniquement ✅

Supprimé: 1,259 lignes
```

### Après Nettoyage Phase 2 (Option A)
```
STORES (2):
├── useCollectionStore ✅ (Collections + Médias)
└── useWorkflowStore ✅ (Workflows)

COMPOSANTS (18):
└── Actifs uniquement ✅

Supprimé: 1,582 lignes
```

---

## 🚀 Commandes d'Exécution

### Phase 1 - Nettoyage Immédiat
```bash
# Sauvegarder avant suppression
git add .
git commit -m "💾 Backup avant nettoyage"

# Supprimer store obsolète
rm frontend/src/stores/useMainStore.js

# Supprimer composants obsolètes
cd frontend/src/components
rm PromptInput.vue ResultDisplay.vue InfoPreview.vue DebugStore.vue
rm ImageUploader.vue ImageEditor.vue WorkflowAnalysis.vue CameraCapture.vue

# Vérifier aucune référence restante
cd ../../..
grep -r "useMainStore" frontend/src/ || echo "✅ Aucune référence useMainStore"
grep -r "PromptInput" frontend/src/ || echo "✅ Aucune référence PromptInput"
grep -r "InfoPreview" frontend/src/ || echo "✅ Aucune référence InfoPreview"

# Tester le build
cd frontend
npm run build

# Commit final
git add .
git commit -m "🧹 Nettoyage: Suppression stores et composants obsolètes v1"
```

### Phase 2 - Si Option A Choisie
```bash
# Créer branche de travail
git checkout -b refactor/merge-media-store

# Étendre useCollectionStore
# (Ajouter section sessionMedias + actions upload)

# Migrer composants un par un
# 1. SimpleMediaGallery.vue
# 2. MediaSelector.vue
# 3. ... (5 autres)

# Tests de régression
npm run test

# Supprimer useMediaStore
rm frontend/src/stores/useMediaStore.js

# Commit et merge
git add .
git commit -m "♻️ Refactor: Fusion useMediaStore dans useCollectionStore"
git checkout main
git merge refactor/merge-media-store
```

---

## ✅ Checklist de Validation

### Avant Suppression
- [ ] Backup complet (`git commit`)
- [ ] Vérifier aucune référence active (grep)
- [ ] Documenter décisions dans ce fichier

### Après Phase 1
- [ ] Build réussit (`npm run build`)
- [ ] Application démarre correctement
- [ ] Workflows fonctionnent
- [ ] Collections fonctionnent
- [ ] Aucune erreur console

### Après Phase 2 (Si applicable)
- [ ] Tous les composants médias fonctionnent
- [ ] Upload médias opérationnel
- [ ] Ajout à collections opérationnel
- [ ] Tests unitaires passent
- [ ] Documentation mise à jour

---

## 📝 Décision Requise

**Question pour l'utilisateur**: 

> Quelle option préfères-tu pour `useMediaStore` ?
> 
> - **Option A** ⭐: Supprimer et tout migrer vers `useCollectionStore`
>   - Architecture la plus claire
>   - 2-4h de refactoring
>   
> - **Option B**: Conserver avec rôle clarifié
>   - Pas de refactoring
>   - Documentation à améliorer
>   
> - **Option C**: Fusionner dans `useCollectionStore` (architecture étendue)
>   - Bon compromis
>   - Store plus complexe

**Recommandation**: Option A pour architecture optimale long terme

---

## 📚 Documentation à Créer Après Nettoyage

```bash
STORE_ARCHITECTURE.md       # Architecture finale des stores
MEDIA_WORKFLOW.md          # Flux de gestion des médias
MIGRATION_GUIDE.md         # Guide migration v1 → v2
```

---

**Status**: ⏳ Attente décision utilisateur pour Phase 2
