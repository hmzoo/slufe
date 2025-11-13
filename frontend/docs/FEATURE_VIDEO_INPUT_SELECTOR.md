# Feature: Sélection de vidéo depuis la collection pour video_input

## Problème
La tâche `video_input` ne permettait pas de sélectionner une vidéo depuis la collection courante, contrairement aux tâches d'image (`image_input`). Elle avait seulement des champs de configuration (label, multiple, required, maxFiles) sans champ pour sélectionner/uploader la vidéo elle-même.

## Solution implémentée

### 1. Ajout du champ `video` dans les inputs

**Fichier modifié**: `frontend/src/config/ioDefinitions.js`

Ajout d'un nouvel input de type `video` dans la définition de `video_input`:

```javascript
video_input: {
  inputs: {
    video: {                    // ← NOUVEAU
      type: 'video',
      label: 'Vidéo',
      hint: 'Sélectionnez une vidéo depuis la collection ou uploadez-en une nouvelle',
      required: false,
      acceptsVariable: true     // Permet de référencer une vidéo d'une tâche précédente
    },
    label: { ... },
    multiple: { ... },
    required: { ... },
    maxFiles: { ... }
  }
}
```

### 2. Fonctionnalité ajoutée

Avec ce changement, dans le dialog d'édition de la tâche "Upload de vidéo", l'utilisateur peut maintenant :

1. **Sélectionner une vidéo** depuis la collection courante via `CollectionMediaSelector`
2. **Uploader une nouvelle vidéo** via le même sélecteur
3. **Utiliser une variable** pour référencer une vidéo produite par une tâche précédente (ex: `{{task_1.outputs.video}}`)

### 3. Affichage dans l'interface

Le composant `WorkflowBuilder.vue` gère déjà automatiquement les inputs de type `video` (lignes 677-721):

```vue
<!-- Input video (sélection depuis les collections) -->
<div v-else-if="inputDef.type === 'video'">
  <!-- Mode variable -->
  <q-input
    v-if="taskForm[inputKey]?.startsWith('{{')"
    v-model="taskForm[inputKey]"
    readonly
  />
  
  <!-- Mode média -->
  <CollectionMediaSelector
    v-else
    v-model="taskForm[inputKey]"
    :accept="['video']"
    :multiple="false"
  >
    <template #prepend>
      <q-btn icon="code" @click="showVariableSelector(...)">
        <q-tooltip>Sélectionner une variable</q-tooltip>
      </q-btn>
    </template>
  </CollectionMediaSelector>
</div>
```

### 4. Référencement dans les tâches suivantes

La vidéo sélectionnée/uploadée sera disponible dans l'output `video` de la tâche et pourra être référencée dans les tâches suivantes via le système de variables:

```javascript
// Dans une tâche suivante (ex: generate_video_from_video)
{
  inputs: {
    source_video: "{{task_video_input.outputs.video}}"
  }
}
```

Le système de variables gère déjà le type `'video'` avec l'icône appropriée (`videocam`).

## Fichiers modifiés

- `frontend/src/config/ioDefinitions.js` - Ajout du champ `video` dans `video_input.inputs`

## Fichiers déjà en place (pas de modification nécessaire)

- `frontend/src/components/WorkflowBuilder.vue` - Gère déjà les inputs de type `video`
- `frontend/src/components/CollectionMediaSelector.vue` - Supporte déjà `accept: ['video']`
- `frontend/src/components/CollectionMediaGallery.vue` - Filtre déjà les médias par type

## Test

Pour tester:

1. Créer un workflow
2. Ajouter une tâche "Upload de vidéo" (`video_input`)
3. Cliquer sur "Éditer" sur la tâche
4. **Le champ "Vidéo" devrait maintenant apparaître** avec un sélecteur permettant de:
   - Choisir une vidéo depuis la collection
   - Uploader une nouvelle vidéo
   - Utiliser le bouton "code" pour sélectionner une variable

## Statut

✅ **Implémenté** - Le champ vidéo apparaît maintenant dans le dialog d'édition de la tâche "Upload de vidéo"
