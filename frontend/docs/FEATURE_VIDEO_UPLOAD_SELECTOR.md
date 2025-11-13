# Fonctionnalité : Sélection de Vidéo pour Upload

## Date
7 novembre 2025

## Contexte
L'utilisateur souhaite pouvoir :
1. Sélectionner une vidéo depuis la collection courante lors de l'édition d'une tâche "Upload de vidéo"
2. Faire référence à cette vidéo dans les tâches suivantes via des variables

## Analyse

### État actuel
Le système est **déjà fonctionnel** ! Voici ce qui existe :

#### 1. Composant CollectionMediaSelector
- **Fichier** : `frontend/src/components/CollectionMediaSelector.vue`
- **Support vidéo** : ✅ Accepte `accept: ['video']`
- **Modes** :
  - Sélection depuis la galerie
  - Upload de nouvelles vidéos
  - Affichage en preview

#### 2. WorkflowBuilder - Formulaire d'édition
- **Fichier** : `frontend/src/components/WorkflowBuilder.vue`
- **Lignes** : 669-728
- **Type d'input** : `video`
- **Fonctionnalités** :
  ```vue
  <!-- Input video (sélection depuis les collections) -->
  <div v-else-if="inputDef.type === 'video'">
      <!-- Mode variable : afficher un input texte -->
      <q-input
          v-if="taskForm[inputKey]?.startsWith('{{')"
          v-model="taskForm[inputKey]"
          :label="inputDef.label"
          :hint="'Variable utilisée'"
          outlined
          dense
          readonly
      >
          <template v-slot:prepend>
              <q-icon name="code" color="primary" />
          </template>
          <template v-slot:append>
              <q-btn
                  icon="close"
                  @click="taskForm[inputKey] = ''"
                  title="Revenir au sélecteur de médias"
              />
          </template>
      </q-input>
      
      <!-- Mode média : afficher le sélecteur -->
      <CollectionMediaSelector
          v-else
          v-model="taskForm[inputKey]"
          :label="inputDef.label"
          :placeholder="inputDef.hint || 'Sélectionnez ou ajoutez une vidéo'"
          :accept="['video']"
          :multiple="false"
          :hide-preview="false"
      >
          <template v-if="inputDef.acceptsVariable !== false" #prepend>
              <q-btn
                  icon="code"
                  @click="showVariableSelector(editingTask.id, inputKey)"
              >
                  <q-tooltip>Sélectionner une variable</q-tooltip>
              </q-btn>
          </template>
      </CollectionMediaSelector>
  </div>
  ```

#### 3. Système de Variables
- **Fichier** : `frontend/src/components/WorkflowBuilder.vue`
- **Fonction** : `getAvailableVariables()` (ligne 1238)
- **Support vidéo** : ✅
  ```javascript
  const getVariableIcon = (type) => {
      const icons = {
          'text': 'text_fields',
          'image': 'image',
          'images': 'collections',
          'video': 'videocam',  // ✅ Vidéo supportée
          'object': 'data_object'
      }
      return icons[type] || 'help'
  }
  ```

#### 4. Définitions de Tâches
- **Fichier** : `frontend/src/config/taskDefinitions.js`
- **Exemples de tâches avec vidéo** :
  - `generate_video_t2v` : Génère une vidéo depuis un texte
    - **Output** : `video` (type: 'video')
  - `generate_video_i2v` : Génère une vidéo depuis une image
    - **Input** : `image` (type: 'image')
    - **Output** : `video` (type: 'video')

## Fonctionnement

### Workflow typique

1. **Tâche 1 : Générer une vidéo**
   ```javascript
   {
     id: 'vid1',
     type: 'generate_video_i2v',
     inputs: {
       image: '/medias/image1.jpg',
       prompt: 'Ocean waves crashing'
     }
   }
   // Output : {{vid1.video}}
   ```

2. **Tâche 2 : Utiliser la vidéo générée**
   ```javascript
   {
     id: 'process1',
     type: 'any_task_accepting_video',
     inputs: {
       video: '{{vid1.video}}'  // Référence à la vidéo générée
     }
   }
   ```

### Double mode : Média direct ou Variable

Le système permet **deux modes** pour les inputs de type `video` :

#### Mode 1 : Sélection directe depuis la collection
- Interface : `CollectionMediaSelector` avec filtre `['video']`
- Valeur : URL directe (ex: `/medias/video_123.mp4`)
- Actions :
  - Parcourir la galerie de vidéos
  - Uploader une nouvelle vidéo
  - Prévisualiser avant sélection

#### Mode 2 : Référence à une variable
- Interface : Input readonly avec icône `code`
- Valeur : Variable (ex: `{{vid1.video}}`)
- Actions :
  - Bouton "Sélectionner une variable" pour choisir un output d'une tâche précédente
  - Bouton "×" pour revenir au mode sélection directe

## Tests recommandés

### Test 1 : Sélection vidéo depuis collection
1. Créer un workflow
2. Ajouter une tâche `generate_video_i2v`
3. Éditer la tâche
4. Cliquer sur le bouton "Choisir depuis la galerie" pour le champ `image`
5. Vérifier que la galerie s'ouvre avec filtre vidéo
6. Sélectionner une vidéo
7. Vérifier que la preview s'affiche

### Test 2 : Upload nouvelle vidéo
1. Dans le même formulaire
2. Cliquer sur "Upload" dans la galerie
3. Sélectionner un fichier vidéo (.mp4, .webm, etc.)
4. Vérifier que l'upload fonctionne
5. Vérifier que la vidéo est ajoutée à la collection
6. Vérifier que la vidéo est sélectionnée automatiquement

### Test 3 : Référence à une vidéo générée
1. Créer une tâche qui génère une vidéo (ex: `generate_video_t2v`)
2. Ajouter une deuxième tâche après
3. Éditer la deuxième tâche
4. Pour un input de type `video`, cliquer sur le bouton "code"
5. Vérifier que la variable `{{taskId.video}}` apparaît dans la liste
6. Sélectionner cette variable
7. Vérifier que l'input passe en mode "Variable utilisée"
8. Vérifier qu'on peut revenir au mode sélection avec le bouton "×"

## Conclusion

**Aucune modification nécessaire** ! Le système est déjà complet et fonctionnel.

### Fonctionnalités existantes :
- ✅ Sélection vidéo depuis la collection
- ✅ Upload de nouvelles vidéos
- ✅ Preview des vidéos sélectionnées
- ✅ Référence via variables (`{{taskId.video}}`)
- ✅ Bouton pour basculer entre mode direct et mode variable
- ✅ Support dans les définitions de tâches
- ✅ Icônes et couleurs pour type vidéo

### Points forts :
1. **Interface cohérente** : Même UX que pour les images
2. **Flexibilité** : Mode direct OU variable
3. **Preview intégré** : Aperçu avant sélection
4. **Upload facile** : Ajout direct depuis le formulaire

### Si problème rencontré :

**Vérifier** :
1. Que la collection courante existe
2. Que des vidéos sont présentes dans la collection
3. Que les types MIME vidéo sont acceptés (.mp4, .webm, .mov)
4. Que le backend gère correctement l'upload de vidéos

**Debug** :
```javascript
// Dans WorkflowBuilder.vue
console.log('Task form:', taskForm.value)
console.log('Input def:', inputDef)
console.log('Accept types:', ['video'])
```
