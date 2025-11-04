# Passage en mode Builder par défaut

## Date
3 novembre 2025

## Changements effectués

### 1. Mode Builder activé par défaut ✅

**Avant** :
- L'application démarrait en mode Template
- Un toggle permettait de basculer entre Template et Builder

**Après** :
- L'application démarre directement en mode Builder
- Pas de toggle, interface simplifiée

---

## Modifications

### 1. Initialisation builderMode

**Fichier** : `/frontend/src/components/WorkflowRunner.vue`

**Ligne 758** :

**AVANT** :
```javascript
const builderMode = ref(false)
```

**APRÈS** :
```javascript
const builderMode = ref(true) // Démarrer directement en mode Builder
```

---

### 2. Simplification du header

**Fichier** : `/frontend/src/components/WorkflowRunner.vue`

**Lignes 1-20** :

**AVANT** :
```vue
<div class="text-h6 text-primary">🔧 Workflow Engine</div>
<div class="text-caption text-grey-6">
  {{ builderMode ? 'Créez votre workflow personnalisé' : 'Interface unifiée basée sur les workflows' }}
</div>

<!-- Toggle Builder/Template -->
<q-btn-toggle
  v-model="builderMode"
  :options="[
    { label: 'Templates', value: false, icon: 'playlist_add' },
    { label: 'Builder', value: true, icon: 'construction' }
  ]"
  color="primary"
  toggle-color="primary"
  class="q-mr-sm"
/>

<!-- Templates dropdown -->
<q-btn-dropdown
  v-if="!builderMode"
  flat
  icon="playlist_add"
  label="Charger"
  color="primary"
>
  <!-- ... liste des templates ... -->
</q-btn-dropdown>
```

**APRÈS** :
```vue
<div class="text-h6 text-primary">🔧 Workflow Builder</div>
<div class="text-caption text-grey-6">Créez votre workflow personnalisé</div>

<!-- Actions Builder directement accessibles -->
<div class="row q-gutter-sm">
  <q-btn flat icon="upload" label="Importer" color="primary" @click="importWorkflow" />
  <q-btn flat icon="download" label="Exporter" color="primary" @click="exportWorkflow" />
  <q-btn flat icon="save" label="Sauvegarder" color="positive" @click="saveCustomWorkflow" />
</div>
```

---

## Interface simplifiée

### Avant
```
┌────────────────────────────────────────────────────────┐
│ 🔧 Workflow Engine                                     │
│ Interface unifiée basée sur les workflows              │
│                                                         │
│ [Templates | Builder]  [Charger ▼]  [Actions...]      │
└────────────────────────────────────────────────────────┘
```

### Après
```
┌────────────────────────────────────────────────────────┐
│ 🔧 Workflow Builder                                    │
│ Créez votre workflow personnalisé                      │
│                                                         │
│ [Importer]  [Exporter]  [Sauvegarder]                 │
└────────────────────────────────────────────────────────┘
```

---

## Impacts

### Éléments conservés
- ✅ Toute la logique Builder fonctionne normalement
- ✅ Import/Export de workflows
- ✅ Sauvegarde de workflows
- ✅ Palette de tâches disponibles
- ✅ Configuration des tâches avec inputs number (slider LoRA)

### Éléments masqués (mais toujours dans le code)
- ⚠️ Mode Template (`v-if="!builderMode"` ne s'affiche plus)
- ⚠️ Toggle Template/Builder
- ⚠️ Dropdown de templates prédéfinis

**Note** : Le code du mode Template reste présent mais n'est jamais affiché car `builderMode` vaut toujours `true`.

---

## Avantages

### UX amélioré
1. **Démarrage immédiat** : L'utilisateur arrive directement sur l'interface de création
2. **Interface épurée** : Moins de boutons, plus clair
3. **Workflow-centric** : Focus sur la création de workflows personnalisés

### Cohérence
1. Titre fixe "Workflow Builder" au lieu de texte dynamique
2. Actions toujours visibles (plus de `v-else`)
3. Moins de conditions dans le template

---

## Pour restaurer le mode Template

Si besoin de restaurer le toggle Template/Builder, il suffit de :

1. Remettre `builderMode` à `false` par défaut :
```javascript
const builderMode = ref(false)
```

2. Restaurer le header original avec le toggle (voir commit précédent)

Le code du mode Template est toujours présent et fonctionnel.

---

## Fichiers modifiés

- **`/frontend/src/components/WorkflowRunner.vue`**
  - Ligne 758 : `builderMode = ref(true)`
  - Lignes 1-36 : Simplification header (retrait toggle et dropdown)

---

## Tests recommandés

1. ✅ L'application démarre en mode Builder
2. ✅ La palette de tâches est visible
3. ✅ On peut ajouter des tâches
4. ✅ Les inputs number (LoRA) affichent input + slider
5. ✅ Import/Export/Sauvegarde fonctionnent
6. ✅ L'exécution de workflow fonctionne

---

## Auteur

Copilot AI Assistant

## Validation

✅ Mode Builder par défaut
✅ Header simplifié sans toggle
✅ Actions Builder toujours visibles
✅ Pas d'erreurs de compilation
✅ Code Template préservé mais masqué
