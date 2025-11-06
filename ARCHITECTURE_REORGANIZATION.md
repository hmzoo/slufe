# 🏗️ Proposition de Réorganisation Architecture Frontend

## 📅 Date: 6 novembre 2025

---

## 🎯 Objectif

**Améliorer la cohérence** de l'organisation des fichiers pour les 4 interfaces principales:
1. **WorkflowBuilder** - Création/édition de workflows
2. **WorkflowManager** - Gestion des workflows sauvegardés
3. **TemplateManager** - Gestion des templates de workflows
4. **CollectionView** - Gestion des collections de médias

---

## 📊 État Actuel de l'Architecture

### Structure Actuelle

```
frontend/src/
├── components/
│   ├── MainNavigation.vue ✅ (Layout principal)
│   │
│   ├── WorkflowBuilder.vue ⚠️ (Interface principale)
│   ├── WorkflowManager.vue ⚠️ (Interface principale)
│   ├── WorkflowRunner.vue ⚠️ (Composant utilitaire)
│   ├── TaskCard.vue ⚠️ (Sous-composant workflow)
│   │
│   ├── TemplateManager.vue ⚠️ (Interface principale)
│   │
│   ├── CollectionView.vue ⚠️ (Interface principale)
│   ├── CollectionManager.vue ⚠️ (Sous-composant)
│   ├── CollectionImageUpload.vue ⚠️ (Sous-composant)
│   │
│   ├── MediaGallery.vue ⚠️ (Composant média)
│   ├── MediaSelector.vue ⚠️ (Composant média)
│   ├── MediaUploadDialog.vue ⚠️ (Composant média)
│   ├── MediaSearchDialog.vue ⚠️ (Composant média)
│   ├── MediaPreviewDialog.vue ⚠️ (Composant média)
│   ├── MediaInfoDialog.vue ⚠️ (Composant média)
│   ├── SimpleMediaGallery.vue ⚠️ (Composant média)
│   ├── ImageGallerySelector.vue ⚠️ (Composant média)
│   │
│   └── workflow/
│       └── SavedWorkflowManager.vue ⚠️ (Isolé)
│
├── stores/
│   ├── useWorkflowStore.js ✅
│   └── useCollectionStore.js ✅
│
└── config/
    ├── taskDefinitions.js ✅
    └── ioDefinitions.js ✅
```

### Problèmes Identifiés

❌ **Manque de cohérence**:
- Interfaces principales mélangées avec sous-composants
- Pas de hiérarchie claire (tout à plat dans `/components/`)
- Nommage incohérent (`CollectionView` vs `WorkflowManager` vs `TemplateManager`)

❌ **Difficultés de maintenance**:
- 17 fichiers dans `/components/` sans organisation
- Difficile de trouver les sous-composants d'une interface
- Composants médias éparpillés

❌ **Nommage inconsistant**:
- `CollectionView` (View)
- `WorkflowManager` (Manager)
- `TemplateManager` (Manager)
- `WorkflowBuilder` (Builder)

---

## 🎨 Architecture Proposée

### Principe: **Feature-Based Organization**

Organiser par **domaine fonctionnel** avec une hiérarchie claire:

```
frontend/src/
├── views/                     ← NOUVEAU: Interfaces principales
│   ├── WorkflowBuilderView.vue
│   ├── WorkflowManagerView.vue
│   ├── TemplateManagerView.vue
│   └── CollectionManagerView.vue
│
├── features/                  ← NOUVEAU: Composants par feature
│   ├── workflow/
│   │   ├── components/
│   │   │   ├── TaskCard.vue
│   │   │   ├── WorkflowRunner.vue
│   │   │   ├── WorkflowList.vue (ex: partie de WorkflowManager)
│   │   │   ├── WorkflowCard.vue
│   │   │   └── WorkflowExecutor.vue
│   │   ├── composables/
│   │   │   └── useWorkflowValidation.js
│   │   └── utils/
│   │       └── workflowHelpers.js
│   │
│   ├── template/
│   │   ├── components/
│   │   │   ├── TemplateCard.vue
│   │   │   ├── TemplateList.vue
│   │   │   └── TemplatePreview.vue
│   │   └── composables/
│   │       └── useTemplateFilters.js
│   │
│   ├── collection/
│   │   ├── components/
│   │   │   ├── CollectionCard.vue
│   │   │   ├── CollectionGrid.vue
│   │   │   ├── CollectionUpload.vue (ex: CollectionImageUpload)
│   │   │   └── CollectionManager.vue
│   │   └── composables/
│   │       └── useCollectionFilters.js
│   │
│   └── media/
│       ├── components/
│       │   ├── MediaGallery.vue
│       │   ├── MediaSelector.vue
│       │   ├── MediaCard.vue
│       │   ├── MediaUploadDialog.vue
│       │   ├── MediaSearchDialog.vue
│       │   ├── MediaPreviewDialog.vue
│       │   ├── MediaInfoDialog.vue
│       │   └── SimpleMediaGallery.vue
│       └── composables/
│           └── useMediaFilters.js
│
├── components/                ← Composants partagés uniquement
│   ├── common/
│   │   ├── AppHeader.vue
│   │   ├── AppFooter.vue
│   │   └── EmptyState.vue
│   └── ui/
│       ├── DialogConfirm.vue
│       └── LoadingSpinner.vue
│
├── layouts/
│   ├── MainLayout.vue (ex: MainNavigation)
│   └── EmptyLayout.vue
│
├── stores/
│   ├── useWorkflowStore.js ✅
│   └── useCollectionStore.js ✅
│
└── config/
    ├── taskDefinitions.js ✅
    └── ioDefinitions.js ✅
```

---

## 📋 Plan de Migration Détaillé

### Phase 1: Création Structure (30min)

**Actions**:
```bash
# Créer nouveaux dossiers
mkdir -p frontend/src/views
mkdir -p frontend/src/features/{workflow,template,collection,media}/components
mkdir -p frontend/src/features/{workflow,template,collection,media}/composables
mkdir -p frontend/src/components/{common,ui}
mkdir -p frontend/src/layouts
```

---

### Phase 2: Migration Layouts (15min)

**2.1. MainNavigation → MainLayout**

```bash
# Renommer et déplacer
mv frontend/src/components/MainNavigation.vue \
   frontend/src/layouts/MainLayout.vue
```

**Modifications**:
```vue
<!-- MainLayout.vue -->
<template>
  <q-layout view="hHh lpR fFf">
    <q-header>
      <q-toolbar>
        <q-toolbar-title>SLUFE - Workflow Studio</q-toolbar-title>
        <q-tabs v-model="currentView">
          <q-tab name="builder" label="Builder" />
          <q-tab name="workflows" label="Workflows" />
          <q-tab name="templates" label="Templates" />
          <q-tab name="collections" label="Collections" />
        </q-tabs>
      </q-toolbar>
    </q-header>
    
    <q-page-container>
      <component :is="currentComponent" />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { ref, computed } from 'vue'
import WorkflowBuilderView from 'src/views/WorkflowBuilderView.vue'
import WorkflowManagerView from 'src/views/WorkflowManagerView.vue'
import TemplateManagerView from 'src/views/TemplateManagerView.vue'
import CollectionManagerView from 'src/views/CollectionManagerView.vue'

const currentView = ref('builder')

const currentComponent = computed(() => {
  const views = {
    builder: WorkflowBuilderView,
    workflows: WorkflowManagerView,
    templates: TemplateManagerView,
    collections: CollectionManagerView
  }
  return views[currentView.value]
})
</script>
```

---

### Phase 3: Migration Views (1h)

**3.1. WorkflowBuilder → WorkflowBuilderView**

```bash
# Déplacer
mv frontend/src/components/WorkflowBuilder.vue \
   frontend/src/views/WorkflowBuilderView.vue
```

**Modifications**:
```vue
<!-- WorkflowBuilderView.vue -->
<script setup>
// Importer depuis features/workflow
import TaskCard from 'src/features/workflow/components/TaskCard.vue'
import { useWorkflowStore } from 'src/stores/useWorkflowStore'
import { useCollectionStore } from 'src/stores/useCollectionStore'
// ... rest
</script>
```

**3.2. WorkflowManager → WorkflowManagerView**

```bash
mv frontend/src/components/WorkflowManager.vue \
   frontend/src/views/WorkflowManagerView.vue
```

**3.3. TemplateManager → TemplateManagerView**

```bash
mv frontend/src/components/TemplateManager.vue \
   frontend/src/views/TemplateManagerView.vue
```

**3.4. CollectionView → CollectionManagerView**

```bash
mv frontend/src/components/CollectionView.vue \
   frontend/src/views/CollectionManagerView.vue
```

---

### Phase 4: Migration Features Workflow (30min)

**4.1. Composants workflow**

```bash
# Déplacer composants
mv frontend/src/components/TaskCard.vue \
   frontend/src/features/workflow/components/

mv frontend/src/components/WorkflowRunner.vue \
   frontend/src/features/workflow/components/

mv frontend/src/components/workflow/SavedWorkflowManager.vue \
   frontend/src/features/workflow/components/WorkflowList.vue
```

**4.2. Mise à jour imports**

```vue
<!-- WorkflowBuilderView.vue -->
<script setup>
import TaskCard from 'src/features/workflow/components/TaskCard.vue'
import WorkflowRunner from 'src/features/workflow/components/WorkflowRunner.vue'
</script>
```

---

### Phase 5: Migration Features Collection (30min)

**5.1. Composants collection**

```bash
mv frontend/src/components/CollectionManager.vue \
   frontend/src/features/collection/components/

mv frontend/src/components/CollectionImageUpload.vue \
   frontend/src/features/collection/components/CollectionUpload.vue
```

**5.2. Mise à jour imports**

```vue
<!-- CollectionManagerView.vue -->
<script setup>
import CollectionUpload from 'src/features/collection/components/CollectionUpload.vue'
import CollectionManager from 'src/features/collection/components/CollectionManager.vue'
</script>
```

---

### Phase 6: Migration Features Media (30min)

**6.1. Tous les composants médias**

```bash
mv frontend/src/components/Media*.vue \
   frontend/src/features/media/components/

mv frontend/src/components/SimpleMediaGallery.vue \
   frontend/src/features/media/components/

mv frontend/src/components/ImageGallerySelector.vue \
   frontend/src/features/media/components/
```

**6.2. Mise à jour imports partout**

```vue
<!-- Exemple dans WorkflowBuilderView.vue -->
<script setup>
import MediaSelector from 'src/features/media/components/MediaSelector.vue'
</script>
```

```vue
<!-- Exemple dans CollectionManagerView.vue -->
<script setup>
import MediaGallery from 'src/features/media/components/MediaGallery.vue'
</script>
```

---

### Phase 7: Validation & Tests (30min)

**7.1. Build Test**
```bash
npm run build
```

**7.2. Vérifier imports**
```bash
# Chercher les anciens chemins
grep -r "from 'src/components/Workflow" frontend/src/
grep -r "from 'src/components/Collection" frontend/src/
grep -r "from 'src/components/Media" frontend/src/
grep -r "from 'src/components/Template" frontend/src/
```

**7.3. Tests manuels**
- Tester navigation entre vues
- Tester création workflow
- Tester gestion collections
- Tester sélection médias

---

## 🎯 Avantages de la Nouvelle Architecture

### 1. **Cohérence de Nommage**

**Avant**:
- `WorkflowBuilder` (Builder)
- `WorkflowManager` (Manager)
- `TemplateManager` (Manager)
- `CollectionView` (View)

**Après**:
- `WorkflowBuilderView` (View)
- `WorkflowManagerView` (View)
- `TemplateManagerView` (View)
- `CollectionManagerView` (View)

✅ **Tous les noms suivent le pattern `*View`**

---

### 2. **Hiérarchie Claire**

```
views/              ← Interfaces principales (4 fichiers)
features/           ← Composants par domaine
  workflow/         ← Tout ce qui concerne workflows
  template/         ← Tout ce qui concerne templates
  collection/       ← Tout ce qui concerne collections
  media/            ← Tout ce qui concerne médias
components/         ← Composants partagés uniquement
```

✅ **Organisation logique** par domaine fonctionnel

---

### 3. **Découverte Facile**

**Question**: "Où sont les composants de workflow?"  
**Réponse**: `features/workflow/components/`

**Question**: "Où sont les composants médias?"  
**Réponse**: `features/media/components/`

✅ **Navigation intuitive** dans le code

---

### 4. **Scalabilité**

Ajouter une nouvelle feature:
```bash
mkdir -p frontend/src/features/export/components
# + Créer ExportManagerView.vue
# + Ajouter tab dans MainLayout
```

✅ **Extension simple** sans polluer `/components/`

---

### 5. **Isolation & Réutilisation**

```
features/media/
├── components/      ← Composants UI médias
└── composables/     ← Logique réutilisable
    └── useMediaFilters.js
    └── useMediaUpload.js
```

✅ **Séparation logique/UI** claire

---

## 📊 Comparaison Avant/Après

### Avant (17 fichiers à plat)

```
components/
├── WorkflowBuilder.vue ⚠️
├── WorkflowManager.vue ⚠️
├── WorkflowRunner.vue ⚠️
├── TaskCard.vue ⚠️
├── TemplateManager.vue ⚠️
├── CollectionView.vue ⚠️
├── CollectionManager.vue ⚠️
├── CollectionImageUpload.vue ⚠️
├── MediaGallery.vue ⚠️
├── MediaSelector.vue ⚠️
├── MediaUploadDialog.vue ⚠️
├── MediaSearchDialog.vue ⚠️
├── MediaPreviewDialog.vue ⚠️
├── MediaInfoDialog.vue ⚠️
├── SimpleMediaGallery.vue ⚠️
├── ImageGallerySelector.vue ⚠️
└── MainNavigation.vue ⚠️
```

**Problèmes**:
- ❌ Pas de structure
- ❌ Difficile de trouver un composant
- ❌ Noms inconsistants

---

### Après (Organisation claire)

```
layouts/
└── MainLayout.vue ✅

views/ (4 interfaces principales)
├── WorkflowBuilderView.vue ✅
├── WorkflowManagerView.vue ✅
├── TemplateManagerView.vue ✅
└── CollectionManagerView.vue ✅

features/
├── workflow/components/ (4 composants)
│   ├── TaskCard.vue
│   ├── WorkflowRunner.vue
│   ├── WorkflowList.vue
│   └── WorkflowCard.vue
│
├── collection/components/ (2 composants)
│   ├── CollectionManager.vue
│   └── CollectionUpload.vue
│
└── media/components/ (8 composants)
    ├── MediaGallery.vue
    ├── MediaSelector.vue
    ├── MediaUploadDialog.vue
    ├── MediaSearchDialog.vue
    ├── MediaPreviewDialog.vue
    ├── MediaInfoDialog.vue
    ├── SimpleMediaGallery.vue
    └── ImageGallerySelector.vue
```

**Avantages**:
- ✅ Structure logique par domaine
- ✅ Navigation intuitive
- ✅ Noms cohérents (`*View`)
- ✅ Séparation claire interfaces/composants

---

## 🔄 Conventions de Nommage

### Règles Établies

**1. Interfaces Principales** → `*View.vue`
- WorkflowBuilderView
- WorkflowManagerView
- TemplateManagerView
- CollectionManagerView

**2. Sous-Composants** → `Feature + Nom descriptif`
- TaskCard (workflow)
- CollectionUpload (collection)
- MediaGallery (media)

**3. Dialogs** → `Feature + Action + Dialog`
- MediaUploadDialog
- MediaSearchDialog
- MediaPreviewDialog

**4. Layouts** → `*Layout.vue`
- MainLayout
- EmptyLayout

**5. Composants Communs** → Nom générique
- AppHeader
- EmptyState
- LoadingSpinner

---

## ⚡ Gains Attendus

### Maintenance
- ✅ **-70% temps** pour trouver un fichier
- ✅ **Moins d'erreurs** d'import
- ✅ **Onboarding** plus rapide nouveaux devs

### Code Quality
- ✅ **Meilleure séparation** des responsabilités
- ✅ **Réutilisabilité** accrue (composables)
- ✅ **Tests** plus faciles (isolation)

### Scalabilité
- ✅ **Ajout features** simple (nouveau dossier)
- ✅ **Refactoring** localisé
- ✅ **Code splitting** automatique par feature

---

## 📝 Checklist Migration

### Préparation
- [ ] Backup git (commit actuel)
- [ ] Créer branche `refactor/architecture-reorganization`
- [ ] Documenter imports actuels

### Exécution
- [ ] Phase 1: Créer structure dossiers
- [ ] Phase 2: Migrer MainLayout
- [ ] Phase 3: Migrer 4 Views
- [ ] Phase 4: Migrer features/workflow
- [ ] Phase 5: Migrer features/collection
- [ ] Phase 6: Migrer features/media
- [ ] Phase 7: Mettre à jour tous les imports

### Validation
- [ ] Build réussi
- [ ] 0 erreur TypeScript
- [ ] Tests manuels OK
- [ ] Documentation mise à jour

### Finalisation
- [ ] Commit + push
- [ ] Merge dans main
- [ ] Supprimer anciens fichiers vides

---

## 🎓 Recommandations Futures

### 1. Ajouter des Composables

```javascript
// features/media/composables/useMediaFilters.js
export function useMediaFilters() {
  const filterByType = (medias, type) => {
    return medias.filter(m => m.type === type)
  }
  
  const searchMedias = (medias, query) => {
    return medias.filter(m => 
      m.filename.includes(query) ||
      m.description?.includes(query)
    )
  }
  
  return { filterByType, searchMedias }
}
```

### 2. Ajouter des Tests

```
features/media/
├── components/
│   └── MediaGallery.vue
├── composables/
│   └── useMediaFilters.js
└── __tests__/
    ├── MediaGallery.spec.js
    └── useMediaFilters.spec.js
```

### 3. Documentation par Feature

```
features/media/
├── README.md ← Documentation feature
├── components/
├── composables/
└── __tests__/
```

---

## 🎉 Conclusion

**Temps estimé**: ~3h30 total  
**Complexité**: Moyenne  
**Risque**: Faible (juste déplacements + imports)  
**Gains**: **Énormes** pour maintenance future

**Recommandation**: ✅ **À faire maintenant**

L'architecture actuelle fonctionne mais devient difficile à maintenir. Cette réorganisation posera des bases solides pour l'évolution future du projet.

---

**Prêt à exécuter la migration ?** 🚀
