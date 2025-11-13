# Fix : Édition de Workflow Charge Toujours le Workflow en Cours

## 🐛 Problème

Lorsqu'on clique sur "Éditer" dans le gestionnaire de workflows, le WorkflowBuilder affiche toujours le **workflow en cours** au lieu du **workflow sélectionné**.

### Symptômes

1. Ouvrir le gestionnaire de workflows
2. Cliquer sur "Éditer" pour un workflow spécifique
3. Le Builder s'ouvre mais affiche le workflow précédemment édité ❌
4. Le workflow sélectionné n'est pas chargé

### Cause Racine

**Problème 1** : `MainNavigation.vue` ne chargeait pas le workflow dans le store
```javascript
// ❌ AVANT : Ne fait que logger
const loadWorkflow = (workflow) => {
  console.log('Charger workflow:', workflow)
  openBuilder()
}
```

**Problème 2** : `WorkflowBuilder` ne rechargeait le workflow que lors du `onMounted`, pas lors de l'activation
- Le composant reste monté même quand on change de section
- `onMounted` n'est appelé qu'une seule fois
- Quand on revient au Builder, le workflow n'est pas rechargé

## ✅ Solution

### 1. Charger le Workflow dans le Store

Modifier `MainNavigation.vue` pour appeler `workflowStore.loadSavedWorkflow()` :

```javascript
const loadWorkflow = (workflow) => {
  console.log('🔄 Chargement du workflow dans le builder:', workflow)
  
  // Charger le workflow dans le store
  workflowStore.loadSavedWorkflow(workflow.id)
  
  // Ouvrir le builder
  openBuilder()
  
  // Notification
  $q.notify({
    type: 'positive',
    message: `Workflow "${workflow.name}" chargé`,
    position: 'top',
    timeout: 2000
  })
}
```

### 2. Recharger le Workflow à l'Activation

Ajouter `onActivated()` dans `WorkflowBuilder.vue` pour recharger le workflow quand le composant devient actif :

```javascript
// Fonction réutilisable pour charger le workflow
const loadWorkflowFromStore = () => {
    const persistedWorkflow = workflowStore.getCurrentBuilderWorkflow()
    
    if (persistedWorkflow && persistedWorkflow.workflow) {
        console.log('🔄 Chargement du workflow depuis le store:', persistedWorkflow)
        currentWorkflow.value = {
            id: persistedWorkflow.id,
            name: persistedWorkflow.workflow.name || persistedWorkflow.name || 'Workflow en cours',
            inputs: persistedWorkflow.workflow.inputs || [],
            tasks: persistedWorkflow.workflow.tasks || [],
            outputs: persistedWorkflow.workflow.outputs || []
        }
        return true
    }
    return false
}

// Recharger lors de l'activation (quand on revient au Builder)
onActivated(() => {
    console.log('WorkflowBuilder: Composant activé, rechargement du workflow')
    loadWorkflowFromStore()
})
```

### 3. Ajouter les Imports Manquants

Dans `MainNavigation.vue`, ajouter les imports nécessaires :

```javascript
import { useQuasar } from 'quasar'
import { useWorkflowStore } from 'src/stores/useWorkflowStore'

const workflowStore = useWorkflowStore()
const $q = useQuasar()
```

## 📝 Fichiers Modifiés

### 1. `frontend/src/components/MainNavigation.vue`

**Imports ajoutés** :
```javascript
import { useQuasar } from 'quasar'
import { useWorkflowStore } from 'src/stores/useWorkflowStore'
```

**Fonction `loadWorkflow` modifiée** :
```javascript
// AVANT
const loadWorkflow = (workflow) => {
  console.log('Charger workflow:', workflow)
  openBuilder()
}

// APRÈS
const loadWorkflow = (workflow) => {
  console.log('🔄 Chargement du workflow dans le builder:', workflow)
  workflowStore.loadSavedWorkflow(workflow.id)
  openBuilder()
  $q.notify({
    type: 'positive',
    message: `Workflow "${workflow.name}" chargé`,
    position: 'top',
    timeout: 2000
  })
}
```

### 2. `frontend/src/components/WorkflowBuilder.vue`

**Import `onActivated` ajouté** :
```javascript
import { ref, computed, onMounted, onActivated } from 'vue'
```

**Fonction `loadWorkflowFromStore` créée** :
```javascript
const loadWorkflowFromStore = () => {
    const persistedWorkflow = workflowStore.getCurrentBuilderWorkflow()
    
    if (persistedWorkflow && persistedWorkflow.workflow) {
        console.log('🔄 Chargement du workflow depuis le store:', persistedWorkflow)
        currentWorkflow.value = {
            id: persistedWorkflow.id,
            name: persistedWorkflow.workflow.name || persistedWorkflow.name,
            inputs: persistedWorkflow.workflow.inputs || [],
            tasks: persistedWorkflow.workflow.tasks || [],
            outputs: persistedWorkflow.workflow.outputs || []
        }
        return true
    }
    return false
}
```

**Hook `onActivated` ajouté** :
```javascript
onActivated(() => {
    console.log('WorkflowBuilder: Composant activé, rechargement du workflow')
    loadWorkflowFromStore()
})
```

**Refactorisation de `onMounted`** :
```javascript
onMounted(() => {
    console.log('WorkflowBuilder: Initialisation')
    
    const loaded = loadWorkflowFromStore()
    
    if (loaded) {
        $q.notify({
            type: 'info',
            message: 'Workflow restauré',
            position: 'top',
            timeout: 2000
        })
    }
    
    workflowStore.loadSavedWorkflows()
})
```

## 🔄 Flux de Données

### Avant (Problème)

```
1. User clique "Éditer" sur Workflow A
   ↓
2. WorkflowManager émet 'load-workflow'
   ↓
3. MainNavigation.loadWorkflow() 
   ❌ Ne charge PAS dans le store
   ✅ Ouvre le Builder
   ↓
4. WorkflowBuilder déjà monté
   ❌ onMounted n'est PAS rappelé
   ❌ Affiche l'ancien workflow (Workflow B)
```

### Après (Corrigé)

```
1. User clique "Éditer" sur Workflow A
   ↓
2. WorkflowManager émet 'load-workflow'
   ↓
3. MainNavigation.loadWorkflow()
   ✅ Charge Workflow A dans le store via loadSavedWorkflow()
   ✅ Persiste dans localStorage
   ✅ Ouvre le Builder
   ✅ Notification
   ↓
4. WorkflowBuilder activé
   ✅ onActivated() appelé
   ✅ loadWorkflowFromStore() charge depuis localStorage
   ✅ Affiche Workflow A ✅
```

## 🎯 Résultat

Maintenant :
- ✅ **Workflow correct chargé** : Le workflow sélectionné s'affiche
- ✅ **Notification visible** : Confirmation du chargement
- ✅ **Persistance** : Le workflow reste chargé même après navigation
- ✅ **Rechargement automatique** : Le workflow se recharge à l'activation

## 🔍 Cycle de Vie des Composants Vue

### Hooks Utilisés

**`onMounted`** : Appelé une seule fois quand le composant est monté
- ✅ Bon pour : Initialisation, chargement initial
- ❌ Pas bon pour : Rechargement après navigation

**`onActivated`** : Appelé chaque fois que le composant devient actif (avec `<keep-alive>`)
- ✅ Bon pour : Rechargement après changement de section
- ✅ Appelé à chaque activation

### Navigation avec `<component :is>`

Quand on utilise `<component :is="currentComponent">` :
- Le composant reste monté en mémoire
- `onMounted` n'est appelé qu'une fois
- `onActivated`/`onDeactivated` sont appelés à chaque changement

## 🧪 Tests de Validation

### Test 1 : Éditer un workflow
```
1. Ouvrir gestionnaire de workflows
2. Cliquer "Éditer" sur Workflow A
   → ✅ Workflow A s'affiche dans le Builder
   → ✅ Notification "Workflow A chargé"
```

### Test 2 : Éditer un autre workflow
```
1. Dans le Builder, on a Workflow A
2. Retourner au gestionnaire
3. Cliquer "Éditer" sur Workflow B
   → ✅ Workflow B remplace Workflow A
   → ✅ Notification "Workflow B chargé"
```

### Test 3 : Persistance
```
1. Éditer Workflow A
2. Naviguer vers Collections
3. Revenir au Builder
   → ✅ Workflow A toujours affiché
```

### Test 4 : Nouveau workflow
```
1. Éditer Workflow A
2. Cliquer "Vider" dans le Builder
3. Naviguer vers Gestionnaire puis Builder
   → ✅ Workflow vide affiché (pas Workflow A)
```

## 💡 Améliorations Futures Possibles

### 1. Confirmation avant Changement

Avertir l'utilisateur s'il a des modifications non sauvegardées :

```javascript
const hasUnsavedChanges = computed(() => {
  // Comparer currentWorkflow avec la version sauvegardée
  return JSON.stringify(currentWorkflow.value) !== 
         JSON.stringify(loadedWorkflow.value)
})

const loadWorkflow = (workflow) => {
  if (hasUnsavedChanges.value) {
    $q.dialog({
      title: 'Modifications non sauvegardées',
      message: 'Voulez-vous sauvegarder avant de charger un autre workflow ?',
      cancel: true,
      ok: 'Charger sans sauvegarder',
      cancel: 'Annuler'
    }).onOk(() => {
      workflowStore.loadSavedWorkflow(workflow.id)
      openBuilder()
    })
  } else {
    workflowStore.loadSavedWorkflow(workflow.id)
    openBuilder()
  }
}
```

### 2. Indicateur Visuel de Chargement

Afficher un spinner pendant le chargement :

```vue
<template>
  <q-inner-loading :showing="loading">
    <q-spinner-gears size="50px" color="primary" />
    <div class="text-caption q-mt-sm">Chargement du workflow...</div>
  </q-inner-loading>
</template>

<script setup>
const loading = ref(false)

onActivated(async () => {
  loading.value = true
  await loadWorkflowFromStore()
  loading.value = false
})
</script>
```

### 3. Historique de Navigation

Permettre de revenir au workflow précédent :

```javascript
const workflowHistory = ref([])

const loadWorkflow = (workflow) => {
  if (currentWorkflow.value.id) {
    workflowHistory.value.push(currentWorkflow.value.id)
  }
  workflowStore.loadSavedWorkflow(workflow.id)
  openBuilder()
}

const goBack = () => {
  const previousId = workflowHistory.value.pop()
  if (previousId) {
    workflowStore.loadSavedWorkflow(previousId)
  }
}
```

## 📚 Bonnes Pratiques

### ✅ À FAIRE

1. **Toujours charger via le store** pour centraliser la gestion
2. **Utiliser `onActivated`** pour les composants avec `<keep-alive>`
3. **Notifier l'utilisateur** des changements (chargement, succès)
4. **Persister dans localStorage** pour la récupération

### ❌ À ÉVITER

1. **Ne pas** modifier directement les composants enfants
2. **Ne pas** dupliquer la logique de chargement
3. **Ne pas** oublier de recharger lors de l'activation
4. **Ne pas** ignorer les hooks de cycle de vie

## 🔗 Références

### Vue.js Lifecycle Hooks
- [onMounted](https://vuejs.org/api/composition-api-lifecycle.html#onmounted)
- [onActivated](https://vuejs.org/api/composition-api-lifecycle.html#onactivated)
- [Keep-Alive](https://vuejs.org/guide/built-ins/keep-alive.html)

### Pinia Store Pattern
- [Actions](https://pinia.vuejs.org/core-concepts/actions.html)
- [State Management](https://pinia.vuejs.org/core-concepts/state.html)

---

**Date de correction** : 7 novembre 2025  
**Version** : 1.0  
**Impact** : Fix critique - Fonctionnalité essentielle  
**Fichiers modifiés** : 2 (MainNavigation.vue, WorkflowBuilder.vue)
