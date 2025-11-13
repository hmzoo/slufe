# 🏗️ Architecture Frontend - Plan de Réorganisation v2

## 📅 Date: 6 novembre 2025 (Mise à jour)

---

## 🎯 Contexte

Après le **nettoyage complet** du code obsolète et la création du **système Templates**, nous avons maintenant une base saine pour réorganiser l'architecture frontend.

### ✅ Nettoyage Effectué

- ✅ **-7,886 lignes** de code obsolète supprimées
- ✅ Suppression de `useMainStore` et composants dépréciés
- ✅ Unification `useMediaStore` → `useCollectionStore`
- ✅ Renommage cohérent: `Media*` → `CollectionMedia*`
- ✅ Système Templates complet créé (`useTemplateStore` + `TemplateManager`)
- ✅ Dissociation claire: Workflow ≠ Templates ≠ Collections

### 📊 État Actuel (Post-Nettoyage)

```
frontend/src/
├── components/ (15 fichiers)
│   ├── CollectionImageUpload.vue
│   ├── CollectionManager.vue
│   ├── CollectionMediaGallery.vue
│   ├── CollectionMediaInfoDialog.vue
│   ├── CollectionMediaPreviewDialog.vue
│   ├── CollectionMediaSearchDialog.vue
│   ├── CollectionMediaSelector.vue
│   ├── CollectionMediaUploadDialog.vue
│   ├── CollectionView.vue
│   ├── MainNavigation.vue
│   ├── MediaSelector.vue
│   ├── TemplateManager.vue
│   ├── WorkflowBuilder.vue
│   ├── WorkflowManager.vue
│   └── WorkflowTaskCard.vue
│
├── stores/ (4 fichiers)
│   ├── index.js
│   ├── useCollectionStore.js (527 lignes)
│   ├── useTemplateStore.js (391 lignes)
│   └── useWorkflowStore.js (941 lignes)
│
├── config/
│   ├── taskDefinitions.js
│   └── ioDefinitions.js
│
└── utils/
    └── workflowMigration.js
```

---

## 🚨 Problèmes Identifiés (État Actuel)

### 1. **Mélange Interfaces Principales et Sous-Composants**

❌ **Problème**: Tous les fichiers sont dans `/components/` sans hiérarchie

```
components/
├── WorkflowBuilder.vue          ← Interface principale
├── WorkflowManager.vue           ← Interface principale  
├── WorkflowTaskCard.vue          ← Sous-composant workflow
├── TemplateManager.vue           ← Interface principale
├── CollectionView.vue            ← Interface principale
├── CollectionManager.vue         ← Sous-composant collection
├── CollectionImageUpload.vue     ← Sous-composant collection
├── CollectionMedia*.vue (6)      ← Composants médias
└── MediaSelector.vue             ← Composant partagé?
```

**Impact**: Difficile de distinguer interfaces principales vs composants utilitaires

---

### 2. **Nommage Inconsistant des Interfaces**

❌ **Problème**: 3 patterns différents pour les interfaces principales

```
WorkflowBuilder     ← Pattern: Feature + Builder
WorkflowManager     ← Pattern: Feature + Manager
TemplateManager     ← Pattern: Feature + Manager
CollectionView      ← Pattern: Feature + View
```

**Recommandation**: Uniformiser avec le pattern `*View`

---

### 3. **Composants Collection Dispersés**

❌ **Problème**: 9 composants collection sans organisation

```
Collection-related (9 fichiers):
├── CollectionView.vue                    ← Interface
├── CollectionManager.vue                 ← Manager?
├── CollectionImageUpload.vue             ← Utilitaire
├── CollectionMediaGallery.vue            ← Média
├── CollectionMediaInfoDialog.vue         ← Dialog
├── CollectionMediaPreviewDialog.vue      ← Dialog
├── CollectionMediaSearchDialog.vue       ← Dialog
├── CollectionMediaSelector.vue           ← Sélecteur
└── CollectionMediaUploadDialog.vue       ← Dialog
```

**Impact**: Difficile de trouver le bon composant pour une tâche

---

### 4. **Ambiguïté MediaSelector vs CollectionMedia***

❌ **Problème**: `MediaSelector.vue` existe à côté de `CollectionMediaSelector.vue`

**Questions**:
- `MediaSelector` est-il obsolète?
- Doublon avec `CollectionMediaSelector`?
- Composant partagé générique?

**Action requise**: Clarifier le rôle ou supprimer si obsolète

---

### 5. **Pas de Séparation Domaine Fonctionnel**

❌ **Problème**: Impossible de travailler sur un domaine isolément

**Exemple**: Modifier la feature "Collection" nécessite:
- Ouvrir 9 fichiers dispersés dans `/components/`
- Risque de modifier d'autres features
- Pas de boundaries claires

---

## 🎯 Architecture Proposée (Améliorée)

### Principe: **Feature-First + View Pattern**

```
frontend/src/
├── views/                          ← NOUVEAU: Pages principales (4 fichiers)
│   ├── WorkflowBuilderView.vue     ← ex: WorkflowBuilder
│   ├── WorkflowManagerView.vue     ← ex: WorkflowManager
│   ├── TemplateManagerView.vue     ← ex: TemplateManager
│   └── CollectionView.vue          ← (garder nom actuel OK)
│
├── features/                       ← NOUVEAU: Composants par domaine
│   ├── workflow/
│   │   ├── components/
│   │   │   └── WorkflowTaskCard.vue
│   │   ├── composables/
│   │   │   └── useWorkflowExecution.js
│   │   └── utils/
│   │       └── workflowHelpers.js
│   │
│   ├── template/
│   │   ├── components/
│   │   │   ├── TemplateCard.vue         ← NOUVEAU (extrait de TemplateManager)
│   │   │   └── TemplateFilters.vue      ← NOUVEAU (extrait de TemplateManager)
│   │   └── composables/
│   │       └── useTemplateFilters.js    ← NOUVEAU
│   │
│   ├── collection/
│   │   ├── components/
│   │   │   ├── CollectionManager.vue
│   │   │   ├── CollectionImageUpload.vue
│   │   │   ├── CollectionMediaGallery.vue
│   │   │   ├── CollectionMediaSelector.vue
│   │   │   └── media/                   ← Sous-dossier dialogs
│   │   │       ├── MediaInfoDialog.vue
│   │   │       ├── MediaPreviewDialog.vue
│   │   │       ├── MediaSearchDialog.vue
│   │   │       └── MediaUploadDialog.vue
│   │   ├── composables/
│   │   │   ├── useCollectionFilters.js
│   │   │   └── useMediaUpload.js
│   │   └── utils/
│   │       └── collectionHelpers.js
│   │
│   └── shared/                          ← NOUVEAU: Composants partagés
│       ├── components/
│       │   └── MediaSelector.vue        ← Si vraiment partagé
│       └── composables/
│           └── useMediaSelection.js
│
├── layouts/
│   ├── MainLayout.vue                   ← ex: MainNavigation
│   └── EmptyLayout.vue                  ← NOUVEAU (si besoin)
│
├── components/                          ← Composants génériques uniquement
│   ├── common/
│   │   ├── AppHeader.vue
│   │   ├── EmptyState.vue
│   │   └── LoadingSpinner.vue
│   └── ui/
│       ├── ConfirmDialog.vue
│       └── NotificationBanner.vue
│
├── stores/
│   ├── useWorkflowStore.js              ✅ Déjà bon
│   ├── useTemplateStore.js              ✅ Déjà bon
│   └── useCollectionStore.js            ✅ Déjà bon
│
├── config/
│   ├── taskDefinitions.js               ✅ Déjà bon
│   └── ioDefinitions.js                 ✅ Déjà bon
│
└── utils/
    ├── workflowMigration.js             ✅ Déjà bon
    └── helpers.js
```

---

## 📋 Plan de Migration (7 Phases)

### ⏱️ Temps Total Estimé: **4h30**

---

### Phase 1: Préparation (15min)

**Actions**:
```bash
# Créer backup
git checkout -b refactor/architecture-v2

# Créer structure dossiers
mkdir -p frontend/src/views
mkdir -p frontend/src/features/{workflow,template,collection,shared}/components
mkdir -p frontend/src/features/{workflow,template,collection,shared}/composables
mkdir -p frontend/src/features/{workflow,template,collection}/utils
mkdir -p frontend/src/features/collection/components/media
mkdir -p frontend/src/components/{common,ui}
mkdir -p frontend/src/layouts
```

**Validation**:
- ✅ Structure dossiers créée
- ✅ Git branch créée

---

### Phase 2: Migration Layouts (20min)

**2.1. MainNavigation → MainLayout**

```bash
mv frontend/src/components/MainNavigation.vue \
   frontend/src/layouts/MainLayout.vue
```

**Modifications requises**:

```vue
<!-- MainLayout.vue -->
<script setup>
import WorkflowBuilderView from 'src/views/WorkflowBuilderView.vue'
import WorkflowManagerView from 'src/views/WorkflowManagerView.vue'
import TemplateManagerView from 'src/views/TemplateManagerView.vue'
import CollectionView from 'src/views/CollectionView.vue'

const currentView = ref('builder')

const currentComponent = computed(() => {
  const views = {
    builder: WorkflowBuilderView,
    workflows: WorkflowManagerView,
    templates: TemplateManagerView,
    collections: CollectionView
  }
  return views[currentView.value]
})
</script>
```

**Validation**:
- ✅ MainLayout fonctionne
- ✅ Build OK

---

### Phase 3: Migration Views (45min)

**3.1. WorkflowBuilder → WorkflowBuilderView**

```bash
mv frontend/src/components/WorkflowBuilder.vue \
   frontend/src/views/WorkflowBuilderView.vue
```

**Mise à jour imports**:
```vue
<!-- WorkflowBuilderView.vue -->
<script setup>
import WorkflowTaskCard from 'src/features/workflow/components/WorkflowTaskCard.vue'
// ... autres imports
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

**3.4. CollectionView**

```bash
# Déjà bien nommé, juste déplacer
mv frontend/src/components/CollectionView.vue \
   frontend/src/views/CollectionView.vue
```

**Validation**:
- ✅ 4 views dans `/views/`
- ✅ Nommage cohérent `*View`
- ✅ Build OK

---

### Phase 4: Migration Feature Workflow (20min)

**4.1. Déplacer WorkflowTaskCard**

```bash
mv frontend/src/components/WorkflowTaskCard.vue \
   frontend/src/features/workflow/components/WorkflowTaskCard.vue
```

**4.2. Créer composable useWorkflowExecution**

```bash
touch frontend/src/features/workflow/composables/useWorkflowExecution.js
```

**Code**:
```javascript
// useWorkflowExecution.js
import { ref } from 'vue'
import { useWorkflowStore } from 'src/stores/useWorkflowStore'

export function useWorkflowExecution() {
  const workflowStore = useWorkflowStore()
  const executing = ref(false)
  
  async function executeWorkflow(workflow) {
    executing.value = true
    try {
      await workflowStore.executeCurrentWorkflow()
      return true
    } catch (error) {
      console.error('Erreur exécution:', error)
      return false
    } finally {
      executing.value = false
    }
  }
  
  return {
    executing,
    executeWorkflow
  }
}
```

**Validation**:
- ✅ WorkflowTaskCard dans `features/workflow/`
- ✅ Imports mis à jour dans WorkflowBuilderView
- ✅ Build OK

---

### Phase 5: Migration Feature Template (30min)

**5.1. Créer composable useTemplateFilters**

```bash
touch frontend/src/features/template/composables/useTemplateFilters.js
```

**Code**:
```javascript
// useTemplateFilters.js
import { computed, ref } from 'vue'

export function useTemplateFilters(templates) {
  const searchQuery = ref('')
  const selectedCategory = ref('all')
  
  const filteredTemplates = computed(() => {
    let result = templates.value
    
    // Filtre catégorie
    if (selectedCategory.value && selectedCategory.value !== 'all') {
      result = result.filter(t => t.category === selectedCategory.value)
    }
    
    // Filtre recherche
    if (searchQuery.value.trim()) {
      const query = searchQuery.value.toLowerCase()
      result = result.filter(t => 
        t.name?.toLowerCase().includes(query) ||
        t.description?.toLowerCase().includes(query) ||
        t.tags?.some(tag => tag.toLowerCase().includes(query))
      )
    }
    
    return result
  })
  
  return {
    searchQuery,
    selectedCategory,
    filteredTemplates
  }
}
```

**5.2. Créer TemplateCard**

```bash
touch frontend/src/features/template/components/TemplateCard.vue
```

**Code**:
```vue
<!-- TemplateCard.vue -->
<template>
  <q-card flat bordered class="template-card" @click="$emit('select', template)">
    <q-card-section class="bg-grey-2">
      <div class="row items-center">
        <q-avatar size="48px" :color="categoryColor" text-color="white">
          <q-icon :name="template.icon || 'dashboard'" size="sm" />
        </q-avatar>
        <div class="q-ml-sm flex-1">
          <div class="text-subtitle1 text-weight-medium">{{ template.name }}</div>
          <q-chip :label="template.category || 'custom'" size="sm" dense 
                  :color="categoryColor" text-color="white" />
        </div>
      </div>
    </q-card-section>
    
    <q-card-section>
      <div class="text-caption text-grey-7" style="min-height: 40px;">
        {{ template.description || 'Aucune description' }}
      </div>
      
      <div class="row items-center q-mt-sm text-caption text-grey-6">
        <q-icon name="schedule" size="xs" class="q-mr-xs" />
        {{ formatDate(template.createdAt) }}
      </div>
      
      <div class="row items-center q-mt-xs text-caption text-grey-6">
        <q-icon name="task" size="xs" class="q-mr-xs" />
        {{ template.workflow?.tasks?.length || 0 }} tâche(s)
      </div>
    </q-card-section>
    
    <q-separator />
    
    <q-card-actions align="right">
      <slot name="actions" :template="template" />
    </q-card-actions>
  </q-card>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  template: { type: Object, required: true }
})

const emit = defineEmits(['select'])

const categoryColor = computed(() => {
  const colors = {
    custom: 'purple',
    image: 'pink',
    video: 'orange',
    editing: 'green',
    generation: 'blue',
    analysis: 'teal'
  }
  return colors[props.template.category] || 'grey'
})

function formatDate(date) {
  if (!date) return 'Date inconnue'
  return new Date(date).toLocaleDateString('fr-FR')
}
</script>

<style scoped lang="scss">
.template-card {
  transition: all 0.3s ease;
  cursor: pointer;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  }
}
</style>
```

**5.3. Refactoriser TemplateManagerView**

Utiliser `TemplateCard` et `useTemplateFilters` dans TemplateManagerView:

```vue
<!-- TemplateManagerView.vue -->
<script setup>
import TemplateCard from 'src/features/template/components/TemplateCard.vue'
import { useTemplateFilters } from 'src/features/template/composables/useTemplateFilters'
import { useTemplateStore } from 'src/stores/useTemplateStore'

const templateStore = useTemplateStore()
const { searchQuery, selectedCategory, filteredTemplates } = useTemplateFilters(
  computed(() => templateStore.sortedTemplates)
)
</script>

<template>
  <div class="template-manager">
    <!-- Filtres utilisant searchQuery et selectedCategory -->
    
    <!-- Grille de cartes -->
    <div class="row q-col-gutter-md">
      <div v-for="template in filteredTemplates" :key="template.id" 
           class="col-12 col-sm-6 col-md-4">
        <TemplateCard :template="template" @select="selectTemplate">
          <template #actions="{ template }">
            <!-- Boutons actions -->
          </template>
        </TemplateCard>
      </div>
    </div>
  </div>
</template>
```

**Validation**:
- ✅ TemplateCard réutilisable créé
- ✅ useTemplateFilters extrait
- ✅ TemplateManagerView simplifié
- ✅ Build OK

---

### Phase 6: Migration Feature Collection (1h)

**6.1. Déplacer composants principaux**

```bash
# Composants principaux
mv frontend/src/components/CollectionManager.vue \
   frontend/src/features/collection/components/

mv frontend/src/components/CollectionImageUpload.vue \
   frontend/src/features/collection/components/

mv frontend/src/components/CollectionMediaGallery.vue \
   frontend/src/features/collection/components/

mv frontend/src/components/CollectionMediaSelector.vue \
   frontend/src/features/collection/components/
```

**6.2. Déplacer dialogs médias**

```bash
# Dialogs dans sous-dossier media/
mv frontend/src/components/CollectionMediaInfoDialog.vue \
   frontend/src/features/collection/components/media/MediaInfoDialog.vue

mv frontend/src/components/CollectionMediaPreviewDialog.vue \
   frontend/src/features/collection/components/media/MediaPreviewDialog.vue

mv frontend/src/components/CollectionMediaSearchDialog.vue \
   frontend/src/features/collection/components/media/MediaSearchDialog.vue

mv frontend/src/components/CollectionMediaUploadDialog.vue \
   frontend/src/features/collection/components/media/MediaUploadDialog.vue
```

**6.3. Analyser MediaSelector**

```bash
# Vérifier si MediaSelector est utilisé
grep -r "MediaSelector" frontend/src/
```

**Actions selon résultat**:
- Si **obsolète** → Supprimer
- Si **doublon** de `CollectionMediaSelector` → Supprimer
- Si **composant partagé générique** → Déplacer vers `features/shared/`

**6.4. Créer composables**

```bash
touch frontend/src/features/collection/composables/useCollectionFilters.js
touch frontend/src/features/collection/composables/useMediaUpload.js
```

**Code useMediaUpload**:
```javascript
// useMediaUpload.js
import { ref } from 'vue'
import { useCollectionStore } from 'src/stores/useCollectionStore'
import { api } from 'src/boot/axios'

export function useMediaUpload() {
  const collectionStore = useCollectionStore()
  const uploading = ref(false)
  const uploadProgress = ref(0)
  
  async function uploadMedia(files) {
    if (!files || files.length === 0) return []
    
    uploading.value = true
    uploadProgress.value = 0
    
    try {
      const formData = new FormData()
      files.forEach(file => formData.append('medias', file))
      
      const response = await api.post('/api/medias/upload', formData, {
        onUploadProgress: (progressEvent) => {
          uploadProgress.value = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          )
        }
      })
      
      return response.data.medias
    } catch (error) {
      console.error('Erreur upload:', error)
      throw error
    } finally {
      uploading.value = false
      uploadProgress.value = 0
    }
  }
  
  return {
    uploading,
    uploadProgress,
    uploadMedia
  }
}
```

**6.5. Mettre à jour imports dans CollectionView**

```vue
<!-- CollectionView.vue -->
<script setup>
import CollectionManager from 'src/features/collection/components/CollectionManager.vue'
import CollectionMediaGallery from 'src/features/collection/components/CollectionMediaGallery.vue'
import CollectionMediaSelector from 'src/features/collection/components/CollectionMediaSelector.vue'
import MediaInfoDialog from 'src/features/collection/components/media/MediaInfoDialog.vue'
// ... etc
</script>
```

**Validation**:
- ✅ 9 composants collection dans `features/collection/`
- ✅ Dialogs organisés dans `media/`
- ✅ 2 composables créés
- ✅ Imports mis à jour
- ✅ Build OK

---

### Phase 7: Nettoyage et Validation (30min)

**7.1. Vérifier imports globaux**

```bash
# Chercher anciens chemins
grep -r "from 'src/components/Workflow" frontend/src/
grep -r "from 'src/components/Collection" frontend/src/
grep -r "from 'src/components/Template" frontend/src/
grep -r "from './Workflow" frontend/src/
grep -r "from './Collection" frontend/src/
grep -r "from './Template" frontend/src/
```

**7.2. Créer composants UI génériques**

```bash
touch frontend/src/components/common/EmptyState.vue
touch frontend/src/components/common/LoadingSpinner.vue
```

**EmptyState.vue**:
```vue
<template>
  <div class="empty-state text-center q-py-xl">
    <q-icon :name="icon" :size="iconSize" :color="iconColor" />
    <div class="text-h6 q-mt-md" :class="`text-${titleColor}`">
      {{ title }}
    </div>
    <div v-if="message" class="text-body2 text-grey-6 q-mt-sm">
      {{ message }}
    </div>
    <slot name="actions" />
  </div>
</template>

<script setup>
defineProps({
  icon: { type: String, default: 'inbox' },
  iconSize: { type: String, default: '4rem' },
  iconColor: { type: String, default: 'grey-5' },
  title: { type: String, required: true },
  titleColor: { type: String, default: 'grey-6' },
  message: { type: String, default: '' }
})
</script>
```

**7.3. Build final**

```bash
npm run build
```

**7.4. Tests manuels**

- ✅ Navigation entre vues fonctionne
- ✅ WorkflowBuilder charge et exécute workflows
- ✅ TemplateManager affiche et crée templates
- ✅ CollectionView gère collections
- ✅ Dialogs médias s'ouvrent correctement

**7.5. Commit**

```bash
git add -A
git commit -m "♻️ Réorganisation architecture frontend

🏗️ Migration vers architecture feature-first

✅ Changements:
- Views: 4 interfaces principales dans /views/
- Features: Composants organisés par domaine (workflow, template, collection)
- Layouts: MainLayout extrait
- Composables: Logique réutilisable extraite
- UI: Composants génériques dans /components/

📊 Organisation:
- features/workflow: WorkflowTaskCard + composables
- features/template: TemplateCard + useTemplateFilters
- features/collection: 9 composants + dialogs + composables
- features/shared: Composants partagés

🎯 Gains:
- Hiérarchie claire interfaces vs sous-composants
- Organisation par domaine fonctionnel
- Meilleure maintenabilité
- Scalabilité améliorée"
```

---

## 🎯 Gains Attendus

### 1. **Organisation Claire**

**Avant**:
```
components/ (15 fichiers mélangés)
├── Interfaces principales
├── Sous-composants
├── Dialogs
└── Utilitaires
```

**Après**:
```
views/ (4 interfaces)
features/ (par domaine)
  ├── workflow/
  ├── template/
  └── collection/
components/ (génériques seulement)
```

**Gain**: -70% temps pour trouver un fichier

---

### 2. **Réutilisabilité**

**Nouveaux composants réutilisables**:
- ✅ `TemplateCard` (utilisable partout)
- ✅ `EmptyState` (générique)
- ✅ `LoadingSpinner` (générique)

**Nouveaux composables**:
- ✅ `useTemplateFilters` (logique filtrage templates)
- ✅ `useWorkflowExecution` (logique exécution workflows)
- ✅ `useMediaUpload` (logique upload médias)
- ✅ `useCollectionFilters` (logique filtrage collections)

**Gain**: Code DRY, moins de duplication

---

### 3. **Maintenance Localisée**

**Exemple feature "Collection"**:

**Avant**:
```
Modifier collection → Ouvrir 9 fichiers dispersés
Risque de casser autre chose
```

**Après**:
```
Modifier collection → features/collection/
Tout isolé, boundaries claires
```

**Gain**: -50% risque régression

---

### 4. **Scalabilité**

**Ajouter nouvelle feature "Export"**:

**Avant**:
```
Ajouter ExportManager.vue dans components/ (déjà 15 fichiers)
Mélangé avec le reste
```

**Après**:
```
mkdir features/export/
  ├── components/
  │   └── ExportForm.vue
  ├── composables/
  │   └── useExport.js
  └── utils/
      └── exportHelpers.js

Ajouter ExportView.vue dans views/
```

**Gain**: Extension propre, isolation

---

## 📊 Comparaison Avant/Après

| Critère | Avant (État Actuel) | Après (Architecture v2) | Gain |
|---------|---------------------|-------------------------|------|
| **Fichiers /components/** | 15 fichiers | 4-6 génériques | -60% |
| **Hiérarchie** | Plate (1 niveau) | 3 niveaux (views/features/components) | ✅ Claire |
| **Nommage Views** | 3 patterns | 1 pattern (*View) | ✅ Cohérent |
| **Organisation domaine** | ❌ Mélangé | ✅ Par feature | +100% |
| **Composables** | 0 | 4+ | ✅ Réutilisable |
| **Temps trouver fichier** | ~2-3min | ~20sec | -70% |
| **Risque régression** | Élevé | Faible | -50% |

---

## 🚀 Actions Immédiates Recommandées

### 1. **Décision MediaSelector** (5min)

**Action**: Analyser utilisation de `MediaSelector.vue`

```bash
grep -r "MediaSelector" frontend/src/ --exclude-dir=node_modules
```

**Décisions possibles**:
- Si **non utilisé** → ✅ Supprimer
- Si **doublon** → ✅ Supprimer et migrer vers `CollectionMediaSelector`
- Si **générique partagé** → Déplacer vers `features/shared/components/`

---

### 2. **Créer TemplateCard** (30min)

**Pourquoi maintenant**:
- TemplateManagerView contient ~658 lignes
- Logique carte template répétée
- Extraction améliore lisibilité

**Action**:
```bash
mkdir -p frontend/src/features/template/components
touch frontend/src/features/template/components/TemplateCard.vue
# Copier code depuis section Phase 5.2
```

---

### 3. **Créer useTemplateFilters** (20min)

**Pourquoi maintenant**:
- Logique filtrage actuellement dans TemplateManagerView
- Réutilisable pour futurs composants template
- Séparation UI/logique

**Action**:
```bash
mkdir -p frontend/src/features/template/composables
touch frontend/src/features/template/composables/useTemplateFilters.js
# Copier code depuis section Phase 5.1
```

---

### 4. **Migration Pilote: Feature Template** (1h)

**Pourquoi commencer par Template**:
- ✅ Feature la plus récente (code propre)
- ✅ Moins de dépendances
- ✅ Test réel de l'architecture proposée

**Actions**:
1. Créer structure `features/template/`
2. Créer `TemplateCard.vue`
3. Créer `useTemplateFilters.js`
4. Refactoriser `TemplateManagerView`
5. Tester build
6. Commit si OK

**Si succès** → Continuer avec Workflow puis Collection

---

## ⚠️ Points d'Attention

### 1. **Imports Relatifs vs Absolus**

❌ **Éviter**:
```javascript
import WorkflowTaskCard from '../../features/workflow/components/WorkflowTaskCard.vue'
```

✅ **Préférer**:
```javascript
import WorkflowTaskCard from 'src/features/workflow/components/WorkflowTaskCard.vue'
```

**Raison**: Chemins absolus plus maintenables

---

### 2. **Circular Dependencies**

⚠️ **Attention**: Store → Composable → Store

**Solution**: Garder composables purs, injecter store depuis composant

```javascript
// ❌ Éviter dans composable
import { useWorkflowStore } from 'src/stores/useWorkflowStore'

// ✅ Préférer
export function useWorkflowExecution(workflowStore) {
  // Utiliser workflowStore passé en paramètre
}
```

---

### 3. **Tests après Migration**

**Tests manuels critiques**:
- ✅ Navigation entre toutes les vues
- ✅ Création workflow
- ✅ Exécution workflow
- ✅ Création template depuis workflow
- ✅ Création workflow depuis template
- ✅ Upload médias
- ✅ Sélection médias dans workflow
- ✅ Sauvegarde/chargement collections

---

## 📝 Checklist Migration Complète

### Préparation
- [ ] Créer branche `refactor/architecture-v2`
- [ ] Documenter imports actuels
- [ ] Backup base de données localStorage

### Phase 1: Structure
- [ ] Créer dossiers views/
- [ ] Créer dossiers features/
- [ ] Créer dossiers layouts/
- [ ] Créer dossiers components/common et ui/

### Phase 2: Layouts
- [ ] Migrer MainNavigation → MainLayout
- [ ] Mettre à jour imports
- [ ] Tester navigation

### Phase 3: Views
- [ ] Migrer WorkflowBuilder → WorkflowBuilderView
- [ ] Migrer WorkflowManager → WorkflowManagerView
- [ ] Migrer TemplateManager → TemplateManagerView
- [ ] Déplacer CollectionView → views/
- [ ] Mettre à jour tous imports
- [ ] Build OK

### Phase 4: Feature Workflow
- [ ] Migrer WorkflowTaskCard
- [ ] Créer useWorkflowExecution
- [ ] Mettre à jour imports
- [ ] Build OK

### Phase 5: Feature Template
- [ ] Créer TemplateCard
- [ ] Créer useTemplateFilters
- [ ] Refactoriser TemplateManagerView
- [ ] Build OK

### Phase 6: Feature Collection
- [ ] Migrer 4 composants principaux
- [ ] Migrer 4 dialogs dans media/
- [ ] Décider sort MediaSelector
- [ ] Créer useMediaUpload
- [ ] Créer useCollectionFilters
- [ ] Mettre à jour imports CollectionView
- [ ] Build OK

### Phase 7: Validation
- [ ] Grep anciens chemins (aucun résultat)
- [ ] Créer EmptyState
- [ ] Créer LoadingSpinner
- [ ] Build final OK
- [ ] Tests manuels OK
- [ ] Commit final

---

## 🎉 Résumé Exécutif

### État Actuel
- ✅ Base saine après nettoyage (-7,886 lignes)
- ✅ 3 stores bien organisés
- ⚠️ 15 composants mélangés dans `/components/`
- ⚠️ Nommage inconsistant
- ⚠️ Pas de hiérarchie claire

### Architecture Proposée
- ✅ **views/**: 4 interfaces principales (*View pattern)
- ✅ **features/**: Organisation par domaine (workflow, template, collection)
- ✅ **composables/**: Logique réutilisable extraite
- ✅ **components/**: Génériques UI uniquement

### Gains Principaux
- 📁 **Organisation**: -70% temps recherche fichier
- 🔄 **Réutilisabilité**: 4+ composables + composants extraits
- 🛡️ **Maintenabilité**: -50% risque régression
- 📈 **Scalabilité**: Extension features propre et isolée

### Recommandation
✅ **COMMENCER PAR**: Migration pilote feature Template (1h)
→ Si succès → Continuer Workflow → Collection

**Temps total**: 4h30 pour migration complète

---

## 📚 Ressources

- [Vue 3 Composition API Best Practices](https://vuejs.org/guide/reusability/composables.html)
- [Quasar Framework Structure](https://quasar.dev/quasar-cli-vite/directory-structure)
- [Feature-Sliced Design](https://feature-sliced.design/)

---

**Prêt à commencer la migration ?** 🚀

**Suggestion**: Commencer par la **migration pilote Template** pour valider l'approche avant de poursuivre avec les autres features.
