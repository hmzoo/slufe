# Panneau de gestion des workflows sauvegardés

## Date
3 novembre 2025

## Fonctionnalité ajoutée

Ajout d'un panneau sur la droite du Builder pour visualiser, gérer et modifier les workflows sauvegardés localement dans le navigateur.

---

## Interface mise à jour

### Avant (2 colonnes)
```
┌─────────────────────────────────────────────────┐
│  Tâches disponibles  │  Zone de construction   │
│      (4 cols)        │        (8 cols)         │
└─────────────────────────────────────────────────┘
```

### Après (3 colonnes)
```
┌──────────────────────────────────────────────────────────────┐
│ Tâches    │  Zone de construction  │  Workflows sauvegardés │
│ (3 cols)  │      (6 cols)          │       (3 cols)         │
└──────────────────────────────────────────────────────────────┘
```

---

## Modifications apportées

### 1. Variable reactive pour workflows sauvegardés ✅

**Fichier** : `/frontend/src/components/WorkflowRunner.vue`

**Ligne 728** :
```javascript
// Workflows sauvegardés en localStorage
const savedWorkflows = ref([])
```

---

### 2. Chargement des workflows au démarrage ✅

**Lignes 1516-1527** (dans `onMounted`) :
```javascript
// Charger les workflows personnalisés depuis localStorage
const saved = localStorage.getItem('customWorkflows')
if (saved) {
  try {
    savedWorkflows.value = JSON.parse(saved)
    console.log(`✅ ${savedWorkflows.value.length} workflow(s) personnalisé(s) chargé(s) depuis localStorage`)
  } catch (error) {
    console.error('Erreur lors du chargement des workflows personnalisés:', error)
    savedWorkflows.value = []
  }
}
```

---

### 3. Rafraîchissement après sauvegarde ✅

**Lignes 1030-1034** (dans `saveCustomWorkflow`) :
```javascript
localStorage.setItem('customWorkflows', JSON.stringify(saved))

// Rafraîchir la liste des workflows sauvegardés
savedWorkflows.value = saved

$q.notify({
  type: 'positive',
  message: `Workflow "${name}" sauvegardé !`,
  position: 'top'
})
```

---

### 4. Nouvelles fonctions de gestion ✅

#### `loadSavedWorkflow(workflow)`
Charge un workflow sauvegardé dans l'éditeur pour modification.

```javascript
function loadSavedWorkflow(workflow) {
  customWorkflow.value = JSON.parse(JSON.stringify(workflow))
  $q.notify({
    type: 'info',
    message: `Workflow "${workflow.name}" chargé`,
    position: 'top',
    timeout: 1000
  })
}
```

#### `duplicateSavedWorkflow(workflow)`
Crée une copie du workflow avec un nouvel ID.

```javascript
function duplicateSavedWorkflow(workflow) {
  const duplicate = JSON.parse(JSON.stringify(workflow))
  duplicate.id = `${workflow.id}-copy-${Date.now()}`
  duplicate.name = `${workflow.name} (copie)`
  
  const saved = JSON.parse(localStorage.getItem('customWorkflows') || '[]')
  saved.push(duplicate)
  localStorage.setItem('customWorkflows', JSON.stringify(saved))
  savedWorkflows.value = saved
  
  $q.notify({
    type: 'positive',
    message: `Workflow "${duplicate.name}" dupliqué !`,
    position: 'top'
  })
}
```

#### `deleteSavedWorkflow(workflow)`
Supprime définitivement un workflow après confirmation.

```javascript
function deleteSavedWorkflow(workflow) {
  $q.dialog({
    title: 'Confirmer la suppression',
    message: `Supprimer définitivement le workflow "${workflow.name}" ?`,
    cancel: true,
    persistent: true
  }).onOk(() => {
    const saved = JSON.parse(localStorage.getItem('customWorkflows') || '[]')
    const filtered = saved.filter(w => w.id !== workflow.id)
    localStorage.setItem('customWorkflows', JSON.stringify(filtered))
    savedWorkflows.value = filtered
    
    $q.notify({
      type: 'info',
      message: `Workflow "${workflow.name}" supprimé`,
      position: 'top'
    })
  })
}
```

---

### 5. Interface du panneau ✅

**Lignes 352-428** :

```vue
<!-- Panneau des workflows sauvegardés -->
<div class="col-12 col-md-3">
  <q-card flat bordered>
    <q-card-section>
      <div class="text-subtitle2 q-mb-sm">
        💾 Workflows sauvegardés
        <q-badge v-if="savedWorkflows.length" color="primary" :label="savedWorkflows.length" class="q-ml-xs" />
      </div>
      
      <!-- Message si aucun workflow -->
      <div v-if="!savedWorkflows.length" class="text-center text-grey-6 q-pa-md">
        <q-icon name="folder_open" size="lg" class="q-mb-sm" />
        <div class="text-caption">Aucun workflow sauvegardé</div>
        <div class="text-caption">Créez et sauvegardez un workflow pour le retrouver ici</div>
      </div>

      <!-- Liste des workflows -->
      <q-list v-else separator dense>
        <q-item
          v-for="workflow in savedWorkflows"
          :key="workflow.id"
          class="saved-workflow-item"
        >
          <q-item-section>
            <q-item-label class="text-weight-medium text-caption">
              {{ workflow.name }}
            </q-item-label>
            <q-item-label caption>
              {{ workflow.tasks.length }} tâche{{ workflow.tasks.length > 1 ? 's' : '' }}
            </q-item-label>
          </q-item-section>
          
          <q-item-section side>
            <div class="row q-gutter-xs">
              <!-- Charger -->
              <q-btn
                flat dense round
                icon="edit"
                color="primary"
                size="xs"
                @click="loadSavedWorkflow(workflow)"
              >
                <q-tooltip>Charger et modifier</q-tooltip>
              </q-btn>
              
              <!-- Dupliquer -->
              <q-btn
                flat dense round
                icon="content_copy"
                color="info"
                size="xs"
                @click="duplicateSavedWorkflow(workflow)"
              >
                <q-tooltip>Dupliquer</q-tooltip>
              </q-btn>
              
              <!-- Supprimer -->
              <q-btn
                flat dense round
                icon="delete"
                color="negative"
                size="xs"
                @click="deleteSavedWorkflow(workflow)"
              >
                <q-tooltip>Supprimer</q-tooltip>
              </q-btn>
            </div>
          </q-item-section>
        </q-item>
      </q-list>
    </q-card-section>
  </q-card>
</div>
```

---

### 6. Optimisation de la palette de tâches ✅

Pour gagner de la place avec 3 colonnes au lieu de 2, la palette de tâches a été compactée :

**Avant** :
```vue
<q-avatar :color="taskDef.color" text-color="white" :icon="taskDef.icon" size="md" />
<q-item-label>{{ taskDef.name }}</q-item-label>
<q-item-label caption>{{ taskDef.description }}</q-item-label>
<q-item-label caption class="text-grey-5">{{ taskDef.model }}</q-item-label>
```

**Après** :
```vue
<q-avatar :color="taskDef.color" text-color="white" :icon="taskDef.icon" size="sm" />
<q-item-label class="text-caption">{{ taskDef.name }}</q-item-label>
<!-- Description et modèle retirés pour compacter -->
```

---

## Fonctionnalités du panneau

### 📋 Affichage des workflows
- **Nom** du workflow
- **Nombre de tâches** (ex: "5 tâches")
- **Badge** avec le nombre total de workflows sauvegardés

### 🔧 Actions disponibles

#### 1. Charger (icône edit 📝)
- Charge le workflow dans l'éditeur
- Permet de le modifier
- Notification : "Workflow [nom] chargé"

#### 2. Dupliquer (icône content_copy 📋)
- Crée une copie du workflow
- Ajoute "(copie)" au nom
- Génère un nouvel ID unique
- Notification : "Workflow [nom] (copie) dupliqué !"

#### 3. Supprimer (icône delete 🗑️)
- Demande confirmation avant suppression
- Supprime définitivement de localStorage
- Notification : "Workflow [nom] supprimé"

---

## État vide

Lorsqu'aucun workflow n'est sauvegardé :

```
┌─────────────────────────────────┐
│  💾 Workflows sauvegardés       │
│                                  │
│         📂 (icône folder)       │
│    Aucun workflow sauvegardé    │
│  Créez et sauvegardez un        │
│  workflow pour le retrouver ici │
└─────────────────────────────────┘
```

---

## Flux complet

### Créer et sauvegarder
```
1. Créer un workflow dans le Builder
2. Cliquer sur "Sauvegarder"
3. Entrer un nom
4. ✅ Apparaît dans le panneau de droite
```

### Modifier un workflow sauvegardé
```
1. Cliquer sur l'icône "edit" (📝)
2. Le workflow se charge dans l'éditeur
3. Modifier les tâches
4. Sauvegarder à nouveau (écrase l'ancien)
```

### Dupliquer un workflow
```
1. Cliquer sur l'icône "content_copy" (📋)
2. Une copie est créée avec "(copie)" dans le nom
3. ✅ Nouvelle entrée dans le panneau
```

### Supprimer un workflow
```
1. Cliquer sur l'icône "delete" (🗑️)
2. Confirmer la suppression
3. ✅ Retiré du panneau et de localStorage
```

---

## Structure des données

### localStorage : clé `customWorkflows`

```json
[
  {
    "id": "custom-workflow",
    "name": "Mon workflow IA",
    "description": "Workflow créé avec le builder",
    "tasks": [
      {
        "id": "input1",
        "type": "input_images",
        "input": {}
      },
      {
        "id": "generate1",
        "type": "generate_video_i2v",
        "input": {
          "image": "{{input1.images}}",
          "prompt": "A woman rises from water",
          "numFrames": 81,
          "loraWeightsTransformer": "https://...",
          "loraScaleTransformer": 1.5
        }
      }
    ]
  },
  {
    "id": "custom-workflow-copy-1730650000000",
    "name": "Mon workflow IA (copie)",
    "tasks": [...]
  }
]
```

---

## Style CSS ajouté

```scss
.saved-workflow-item {
  &:hover {
    background-color: rgba(0, 0, 0, 0.02);
  }
}
```

---

## Corrections de bugs

### Fonction dupliquée supprimée ✅

**Problème** : `loadSavedWorkflow` était déclarée deux fois (lignes 1125 et 1249)

**Solution** : Suppression de la seconde déclaration (moins complète)

---

## Responsive

- **Desktop** : 3 colonnes (3 + 6 + 3)
- **Mobile** : `col-12` pour chaque section (empilées verticalement)

---

## Tests recommandés

### Test 1 : Affichage workflows existants
1. Ouvrir l'app avec workflows en localStorage
2. ✅ Le panneau affiche tous les workflows
3. ✅ Badge avec le nombre total

### Test 2 : Charger un workflow
1. Cliquer sur "edit" (📝)
2. ✅ Le workflow se charge dans l'éditeur
3. ✅ Notification affichée

### Test 3 : Dupliquer un workflow
1. Cliquer sur "content_copy" (📋)
2. ✅ Une copie apparaît avec "(copie)"
3. ✅ ID unique généré

### Test 4 : Supprimer un workflow
1. Cliquer sur "delete" (🗑️)
2. Confirmer la suppression
3. ✅ Workflow retiré du panneau
4. ✅ Retiré de localStorage

### Test 5 : État vide
1. Vider localStorage
2. ✅ Message "Aucun workflow sauvegardé" affiché

---

## Fichiers modifiés

**`/frontend/src/components/WorkflowRunner.vue`**
- Ligne 728 : Variable `savedWorkflows`
- Lignes 1125-1191 : 3 nouvelles fonctions (load, duplicate, delete)
- Lignes 1030-1034 : Rafraîchissement après sauvegarde
- Lignes 1516-1527 : Chargement au démarrage
- Lignes 39-67 : Palette compactée (3 colonnes)
- Lignes 352-428 : Panneau workflows sauvegardés
- Lignes 1576-1580 : Style CSS

---

## Auteur

Copilot AI Assistant

## Validation

✅ Variable reactive `savedWorkflows`
✅ 3 fonctions de gestion (load, duplicate, delete)
✅ Panneau UI avec liste et actions
✅ Badge avec compteur
✅ État vide géré
✅ Responsive (3 colonnes → empilées en mobile)
✅ Tooltips sur les boutons
✅ Confirmations de suppression
✅ Notifications utilisateur
✅ Synchronisation localStorage ↔ UI
✅ Pas d'erreurs de compilation
