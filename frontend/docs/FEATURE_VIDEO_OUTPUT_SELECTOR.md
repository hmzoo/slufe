# ✅ Amélioration : Sélection de Variables pour l'Affichage Vidéo

**Date** : 6 novembre 2025  
**Session** : Session 3 - Amélioration Affichage Vidéo  
**Commit** : À venir

---

## 📋 Contexte

La tâche **"Affichage de vidéo" (`video_output`)** permettait déjà d'accepter des variables via `acceptsVariable: true`, mais le champ de type `video` n'avait **pas de traitement spécifique** dans le WorkflowBuilder, contrairement au type `image`.

**Problème identifié** :
- Pas d'interface pour sélectionner une vidéo depuis les collections
- Pas de bouton pour uploader une nouvelle vidéo
- Pas de preview de la vidéo sélectionnée
- Pas d'affichage du nom de la vidéo sélectionnée

---

## 🎯 Modifications Apportées

### 1. Ajout du Rendu pour le Type `video` dans le Template

**Fichier** : `frontend/src/components/WorkflowBuilder.vue`

**Localisation** : Lignes 573-645 (après le rendu du type `image`)

#### Template Ajouté

```vue
<!-- Input video (sélection depuis les collections) -->
<div v-else-if="inputDef.type === 'video'">
    <q-input
        :model-value="getVideoInputDisplayValue(taskForm[inputKey])"
        :label="inputDef.label"
        :hint="inputDef.hint || 'Sélectionnez ou ajoutez une vidéo'"
        readonly
        outlined
        dense
    >
        <template v-slot:prepend v-if="inputDef.acceptsVariable !== false">
            <q-btn
                dense
                flat
                icon="code"
                color="primary"
                @click="showVariableSelector(editingTask.id, inputKey)"
                size="sm"
            >
                <q-tooltip>Sélectionner une variable</q-tooltip>
            </q-btn>
        </template>
        
        <template v-slot:append>
            <q-btn-group>
                <q-btn
                    icon="video_library"
                    flat
                    dense
                    @click="selectVideoFromCollection(inputKey)"
                    title="Choisir une vidéo existante"
                />
                <q-btn
                    icon="add_to_photos"
                    flat
                    dense
                    @click="uploadVideoForInput(inputKey)"
                    title="Ajouter une nouvelle vidéo"
                />
                <q-btn
                    v-if="taskForm[inputKey]"
                    icon="clear"
                    flat
                    dense
                    @click="taskForm[inputKey] = ''"
                    title="Supprimer la sélection"
                />
            </q-btn-group>
        </template>
    </q-input>
    
    <!-- Preview de la vidéo sélectionnée -->
    <div v-if="taskForm[inputKey]" class="q-mt-sm">
        <!-- Aperçu pour une URL normale -->
        <video
            v-if="!taskForm[inputKey].startsWith('{{')"
            :src="taskForm[inputKey]"
            controls
            style="max-width: 300px; max-height: 200px"
            class="rounded-borders"
        >
            Votre navigateur ne supporte pas la balise vidéo.
        </video>
        <!-- Indicateur pour une variable -->
        <div v-else class="variable-indicator q-pa-md text-center">
            <q-icon name="code" size="2rem" color="primary" />
            <div class="text-body2 q-mt-xs">Variable utilisée</div>
            <div class="text-caption text-grey-6">{{ taskForm[inputKey] }}</div>
        </div>
    </div>
</div>
```

**Fonctionnalités UI** :
- ✅ **Bouton Variables** (`code`) - Ouvre le sélecteur de variables (tâches précédentes)
- ✅ **Bouton Galerie** (`video_library`) - Ouvre la galerie de vidéos de la collection
- ✅ **Bouton Upload** (`add_to_photos`) - Permet d'uploader une nouvelle vidéo
- ✅ **Bouton Clear** (`clear`) - Efface la sélection
- ✅ **Preview vidéo** - Affiche la vidéo sélectionnée avec contrôles HTML5
- ✅ **Indicateur variable** - Si une variable est utilisée, affiche son nom

---

### 2. Ajout des Fonctions JavaScript

**Fichier** : `frontend/src/components/WorkflowBuilder.vue`

**Localisation** : Lignes 1260-1403 (après `uploadImageForInput`)

#### `getVideoInputDisplayValue(videoUrl)`

Affiche le nom lisible de la vidéo sélectionnée.

```javascript
const getVideoInputDisplayValue = (videoUrl) => {
    if (!videoUrl) return 'Aucune vidéo sélectionnée'
    
    // Vérifier si c'est une variable (commence et finit par {{ }})
    if (videoUrl.startsWith('{{') && videoUrl.endsWith('}}')) {
        return `Variable: ${videoUrl}`
    }
    
    // Essayer de trouver le média dans la collection pour afficher son nom
    const media = collectionStore.currentCollectionMedias?.find(m => m.url === videoUrl)
    if (media) {
        return media.description || `Vidéo ${media.mediaId.slice(0, 8)}...`
    }
    
    // Sinon, extraire le nom du fichier de l'URL
    return videoUrl.split('/').pop() || 'Vidéo sélectionnée'
}
```

**Logique** :
1. Si vide → "Aucune vidéo sélectionnée"
2. Si variable (`{{...}}`) → "Variable: {{task.output}}"
3. Si média dans collection → Affiche sa description
4. Sinon → Extrait le nom du fichier de l'URL

---

#### `selectVideoFromCollection(inputKey)`

Ouvre le sélecteur de médias filtré sur les vidéos.

```javascript
const selectVideoFromCollection = (inputKey) => {
    if (!collectionStore.currentCollectionMedias || collectionStore.currentCollectionMedias.length === 0) {
        $q.notify({
            type: 'warning',
            message: 'Aucune vidéo disponible dans la collection actuelle',
            position: 'top'
        })
        return
    }
    
    // Utiliser CollectionMediaSelector (module collection) pour sélectionner une vidéo
    $q.dialog({
        component: defineAsyncComponent(() => import('./CollectionMediaSelector.vue')),
        componentProps: {
            modelValue: taskForm.value[inputKey] || null,
            label: 'Sélectionner une vidéo',
            accept: ['video'],  // 🎯 Filtre uniquement les vidéos
            multiple: false,
            hidePreview: true
        }
    }).onOk(selectedUrl => {
        if (selectedUrl) {
            taskForm.value[inputKey] = selectedUrl
            
            $q.notify({
                type: 'positive',
                message: `Vidéo "${selectedMedia?.description || 'sélectionnée'}" choisie`,
                position: 'top'
            })
        }
    })
}
```

**Fonctionnalités** :
- Vérifie si la collection a des médias
- Ouvre `CollectionMediaSelector` avec `accept: ['video']`
- Met à jour `taskForm[inputKey]` avec l'URL de la vidéo
- Affiche une notification de succès

---

#### `uploadVideoForInput(inputKey)`

Permet d'uploader une nouvelle vidéo vers la collection.

```javascript
const uploadVideoForInput = (inputKey) => {
    // Créer un input file temporaire
    const fileInput = document.createElement('input')
    fileInput.type = 'file'
    fileInput.accept = 'video/*'  // 🎯 Filtre uniquement les vidéos
    fileInput.style.display = 'none'
    
    fileInput.onchange = async (event) => {
        const file = event.target.files[0]
        if (!file) return
        
        try {
            $q.loading.show({
                message: 'Upload de la vidéo en cours...'
            })
            
            // Vérifier qu'une collection est sélectionnée
            if (!collectionStore.currentCollection) {
                $q.notify({
                    type: 'warning',
                    message: 'Veuillez sélectionner une collection avant d\'uploader',
                    position: 'top'
                })
                return
            }
            
            // Créer un FormData pour l'upload
            const formData = new FormData()
            formData.append('files', file)
            formData.append('description', file.name)
            
            // Uploader la vidéo via l'API
            const uploadUrl = `/collections/${collectionStore.currentCollection.id}/upload`
            const response = await api.post(uploadUrl, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            })
            
            if (!response.data.success) {
                throw new Error(response.data.message || 'Erreur lors de l\'upload')
            }
            
            const result = response.data
            
            // Actualiser les médias de la collection
            await collectionStore.loadCollectionMedias(collectionStore.currentCollection.id)
            
            // Utiliser l'URL de la vidéo uploadée (premier résultat)
            const uploadedMedia = result.results?.[0]
            if (uploadedMedia) {
                taskForm.value[inputKey] = uploadedMedia.url
            }
            
            $q.notify({
                type: 'positive',
                message: 'Vidéo uploadée et sélectionnée avec succès',
                position: 'top'
            })
            
        } catch (error) {
            console.error('Erreur upload:', error)
            $q.notify({
                type: 'negative',
                message: 'Erreur lors de l\'upload de la vidéo',
                position: 'top'
            })
        } finally {
            $q.loading.hide()
            document.body.removeChild(fileInput)
        }
    }
    
    // Ajouter temporairement à la page et cliquer
    document.body.appendChild(fileInput)
    fileInput.click()
}
```

**Flux d'upload** :
1. Création input file HTML temporaire (`accept="video/*"`)
2. Sélection fichier par l'utilisateur
3. Vérification collection active
4. Upload via API `/collections/{id}/upload`
5. Rafraîchissement médias collection
6. Sélection automatique de la vidéo uploadée
7. Notification succès/erreur

---

## 🎨 Interface Utilisateur

### Mode Édition Tâche `video_output`

**Avant** :
- ❌ Pas de champ visible pour sélectionner la vidéo
- ❌ Impossible de choisir depuis la collection
- ❌ Impossible d'uploader une vidéo

**Après** :
```
┌─────────────────────────────────────────────────────┐
│ [</>] Vidéo à afficher                    [🎥] [+] [×] │
│ Variable: {{task_1.video}}                           │
└─────────────────────────────────────────────────────┘
  ┌──────────────────────────────┐
  │ 🔢 Variable utilisée          │
  │ {{task_1.video}}             │
  └──────────────────────────────┘
```

**Boutons** :
- `[</>]` - Sélectionner une variable (ouvre dialog variables)
- `[🎥]` - Choisir depuis la galerie vidéo (ouvre CollectionMediaSelector)
- `[+]` - Uploader nouvelle vidéo
- `[×]` - Effacer la sélection

**Preview** :
- Si URL normale → Player vidéo HTML5 (300x200px max)
- Si variable → Indicateur avec nom de la variable

---

## 📊 Comparaison avec Type `image`

Les fonctionnalités pour le type `video` sont **identiques** au type `image` :

| Fonctionnalité | Type `image` | Type `video` |
|----------------|-------------|-------------|
| Sélection variable | ✅ | ✅ |
| Galerie collections | ✅ | ✅ |
| Upload direct | ✅ | ✅ |
| Preview | ✅ (q-img) | ✅ (video) |
| Affichage nom | ✅ | ✅ |
| Clear sélection | ✅ | ✅ |

**Différences** :
- Icon galerie : `photo_library` → `video_library`
- Accept filter : `['image']` → `['video']`
- Input accept : `image/*` → `video/*`
- Preview : `<q-img>` → `<video controls>`

---

## ✅ Tests à Effectuer

### Test 1 : Sélection Variable

1. Créer workflow avec tâche génération vidéo (`generate_video_t2v`)
2. Ajouter tâche `video_output` (Affichage de vidéo)
3. Éditer la tâche `video_output`
4. Cliquer sur bouton `</>` (Variables)
5. Sélectionner `{{task_1.video}}`
6. Vérifier affichage : "Variable: {{task_1.video}}"
7. Vérifier preview : Indicateur variable

### Test 2 : Sélection depuis Collection

1. S'assurer que la collection contient des vidéos
2. Éditer tâche `video_output`
3. Cliquer sur bouton `🎥` (Galerie)
4. Sélectionner une vidéo
5. Vérifier affichage : Nom/description de la vidéo
6. Vérifier preview : Player vidéo fonctionnel

### Test 3 : Upload Nouvelle Vidéo

1. Éditer tâche `video_output`
2. Cliquer sur bouton `+` (Upload)
3. Sélectionner fichier vidéo (MP4, WebM, etc.)
4. Attendre fin upload (loading)
5. Vérifier sélection automatique
6. Vérifier ajout dans collection
7. Vérifier preview : Player vidéo

### Test 4 : Clear Sélection

1. Avec vidéo sélectionnée
2. Cliquer sur bouton `×` (Clear)
3. Vérifier affichage : "Aucune vidéo sélectionnée"
4. Vérifier disparition preview

---

## 🔧 Configuration Tâche `video_output`

**Fichier** : `frontend/src/config/ioDefinitions.js` (lignes 413-470)

```javascript
video_output: {
    type: 'video_output',
    name: 'Affichage de vidéo',
    icon: 'play_circle',
    color: 'red',
    category: 'output',
    description: 'Affiche une vidéo à l\'utilisateur',
    inputs: {
      video: {
        type: 'video',           // 🎯 Type traité par le nouveau code
        label: 'Vidéo à afficher',
        required: true,
        acceptsVariable: true    // ✅ Support variables activé
      },
      title: { ... },
      width: { ... },
      autoplay: { ... },
      controls: { ... },
      loop: { ... }
    },
    outputs: {}
}
```

**Aucune modification nécessaire** dans `ioDefinitions.js` - Le champ était déjà bien configuré !

---

## 📝 Résumé

**Problème** : Tâche "Affichage de vidéo" ne permettait pas de sélectionner visuellement la vidéo source

**Solution** : Ajout du rendu pour le type `video` dans WorkflowBuilder

**Modifications** :
- ➕ Template `v-else-if="inputDef.type === 'video'"` (+73 lignes)
- ➕ Fonction `getVideoInputDisplayValue()` (+15 lignes)
- ➕ Fonction `selectVideoFromCollection()` (+35 lignes)
- ➕ Fonction `uploadVideoForInput()` (+78 lignes)

**Total** : +201 lignes de code

**Fonctionnalités ajoutées** :
- ✅ Sélection de variables (outputs tâches précédentes)
- ✅ Sélection depuis galerie vidéos collection
- ✅ Upload nouvelle vidéo vers collection
- ✅ Preview vidéo HTML5 avec contrôles
- ✅ Affichage nom/description vidéo
- ✅ Clear sélection

**Impact** :
- 🎯 UX cohérente avec type `image`
- 🎯 Workflow vidéo complet (génération → affichage)
- 🎯 Support complet variables entre tâches
- 🎯 Intégration parfaite avec système Collections

---

**Amélioration complétée avec succès ! 🎬✨**
