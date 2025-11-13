# 🎬 AppViewer - Exécuteur de Templates

## 📋 Vue d'ensemble

**AppViewer** est un composant Vue 3 qui offre une interface conviviale pour exécuter des templates de workflows. Il permet aux utilisateurs de:

1. **Sélectionner** un template depuis une liste
2. **Remplir** les paramètres d'entrée de manière intuitive
3. **Exécuter** le template avec un simple clic
4. **Visualiser** les résultats en temps réel

## 🎯 Fonctionnalités

### ✨ Sélection de Template
- Dropdown de sélection avec tous les templates disponibles
- Recherche et filtrage en temps réel
- Affichage des détails du template (nom, description, catégorie)
- Actualisation depuis le serveur

### 📝 Formulaire Dynamique
Génération automatique du formulaire selon les types d'inputs:

| Type | Composant | Caractéristiques |
|------|-----------|------------------|
| `text_input` / `text` | QInput (texte) | placeholder, hint, validation |
| `number` | QInput (nombre) | min, max, step |
| `select` | QSelect | options dynamiques |
| `checkbox` | QCheckbox | label, hint |
| `toggle` | QToggle | label, hint |
| `image_input` / `image` | QFile | upload d'images, aperçu |
| `textarea` | QInput (textarea) | rows personnalisable |

**Validation:**
- Champs obligatoires détectés automatiquement
- Validation en temps réel
- Bouton "Exécuter" désactivé jusqu'à validation complète

### ⚡ Exécution
- Exécution asynchrone sans blocage UI
- Support des uploads d'images via FormData
- Mesure du temps d'exécution
- Gestion des erreurs détaillée

### 📊 Visualisation des Résultats

#### Types de résultats supportés:
- **Images** - Affichage avec prévisualisation
- **Arrays** - Affichage itératif avec support images
- **Objects** - Affichage JSON formaté
- **Strings/Text** - Affichage texte brut

#### Actions:
- Téléchargement des résultats en JSON
- Fermeture et réinitialisation du formulaire

## 📁 Structure du Composant

### Fichiers créés:

```
frontend/src/
├── components/
│   ├── AppViewer.vue          ← Composant principal
│   └── MainNavigation.vue     ← Navigation (mise à jour)
├── composables/               ← Nouveaux dossier
│   ├── useNotify.js          ← Notifications
│   └── useWorkflowExecution.js ← Logique d'exécution
└── stores/
    └── useTemplateStore.js    ← (Existant)
```

## 🔧 Composables

### `useNotify()`
Gestion centralisée des notifications:

```javascript
const { showNotification, showSuccess, showError, showWarning, showInfo } = useNotify()

// Utilisations
showNotification('Message', 'positive')  // type-agnostique
showSuccess('Opération réussie!')
showError('Erreur!')
showWarning('Attention!')
showInfo('Information')
```

**Options:**
- `type`: 'positive' | 'negative' | 'warning' | 'info' (défaut: 'info')
- `position`: 'top-right' (par défaut), 'top-left', 'bottom-right', etc.
- `timeout`: 3000ms (par défaut)
- `actions`: Boutons d'action

### `useWorkflowExecution()`
Logique d'exécution réutilisable:

```javascript
const {
  executing,           // ref<boolean>
  executionResult,     // ref<object>
  executionError,      // ref<string>
  executionTime,       // ref<number> (ms)
  
  executeWorkflow,     // fn(workflow, inputs) → Promise
  clearResults,        // fn()
  getImagePreview,     // fn(file) → DataURL
  isImageOutput,       // fn(value) → boolean
  downloadResults      // fn(filename?) → void
} = useWorkflowExecution()
```

**Usage:**
```javascript
try {
  const result = await executeWorkflow(workflowObj, inputsObj)
  console.log('Résultats:', result)
} catch (error) {
  console.error('Erreur:', error)
}
```

## 🎨 Interface Utilisateur

### Layout
```
┌─────────────────────────────────────────────────────┐
│ HEADER: AppViewer - Exécuteur de Templates [Refresh]│
└─────────────────────────────────────────────────────┘

┌──────────────────────────┬──────────────────────────┐
│ COLONNE GAUCHE           │ COLONNE DROITE           │
│                          │                          │
│ • Sélection Template     │ • État d'exécution       │
│ • Détails Template       │ • Résultats              │
│ • Formulaire Inputs      │ • Erreurs                │
│ • Boutons d'action       │ • Guide d'utilisation    │
└──────────────────────────┴──────────────────────────┘
```

### Couleurs et Thèmes
- **Bleu clair** (`bg-light-blue-1`) - Sélection template
- **Bleu** (`bg-blue-1`) - Détails template et guide
- **Vert** (`bg-green-1`) - Formulaire inputs
- **Vert positif** - Succès et résultats
- **Rouge** (`bg-red-1`, `bg-red-2`) - Erreurs

### États Visuels
1. **Chargement** - Spinner + message d'attente
2. **En cours** - Spinner + "Exécution en cours..."
3. **Succès** - Card verte avec résultats
4. **Erreur** - Card rouge avec message
5. **Idle** - Guide d'utilisation

## 🔗 Intégration Navigation

### MainNavigation.vue - Changements

```vue
<!-- Avant -->
<q-tabs>
  <q-tab name="builder" label="Builder" ... />
  <q-tab name="workflows" label="Workflows" ... />
  <q-tab name="templates" label="Templates" ... />
  <q-tab name="collections" label="Collections" ... />
</q-tabs>

<!-- Après -->
<q-tabs>
  <q-tab name="builder" label="Builder" ... />
  <q-tab name="workflows" label="Workflows" ... />
  <q-tab name="templates" label="Templates" ... />
  <q-tab name="appviewer" label="AppViewer" icon="play_circle" />  <!-- NEW -->
  <q-tab name="collections" label="Collections" ... />
</q-tabs>
```

## 📡 Interaction avec le Backend

### Endpoint utilisé:
```
POST /api/workflows/execute
```

### Formats supportés:

**Sans images (JSON):**
```json
{
  "workflow": { ... },
  "inputs": {
    "prompt": "Votre texte",
    "aspectRatio": "16:9"
  }
}
```

**Avec images (FormData):**
```
workflow: {JSON}
inputs: {JSON (non-images)}
images: [File, File, ...]
```

## 🚀 Utilisation

### Pour les développeurs

1. **Importer le composant:**
```javascript
import AppViewer from '@/components/AppViewer.vue'
```

2. **Utiliser les composables:**
```javascript
import { useWorkflowExecution } from '@/composables/useWorkflowExecution'
import { useNotify } from '@/composables/useNotify'
```

3. **Réutiliser la logique d'exécution:**
```javascript
const { executeWorkflow, executing, executionResult } = useWorkflowExecution()

const result = await executeWorkflow(workflow, inputs)
```

### Pour les utilisateurs finaux

1. Cliquer sur **"AppViewer"** dans la barre de navigation
2. Sélectionner un template dans la liste
3. Remplir les paramètres d'entrée
4. Cliquer sur **"Exécuter"**
5. Voir les résultats s'afficher automatiquement
6. Optionnellement, télécharger les résultats en JSON

## 🎓 Exemple de Template

```javascript
{
  id: 'enhance-image',
  name: 'Amélioration d\'image',
  description: 'Améliore la qualité d\'une image',
  category: 'image-processing',
  workflow: {
    id: 'enhance-image-flow',
    name: 'Workflow d\'amélioration',
    tasks: [
      {
        id: 'enhance1',
        type: 'enhance_image',
        input: {
          image: '{{inputs.image}}',
          strength: '{{inputs.strength}}'
        }
      }
    ]
  },
  inputs: {
    image: {
      type: 'image_input',
      label: 'Image à améliorer',
      placeholder: 'Sélectionner une image',
      hint: 'PNG, JPG, WebP',
      required: true
    },
    strength: {
      type: 'number',
      label: 'Intensité',
      placeholder: '50',
      hint: '0-100',
      min: 0,
      max: 100,
      defaultValue: 50,
      required: true
    }
  }
}
```

## 🔍 Validation du Formulaire

### Règles de validation:

**Champs obligatoires:**
- Doivent avoir une valeur non-vide
- Les images doivent avoir au moins 1 fichier

**Champs optionnels:**
- Acceptent les valeurs vides
- Utilisent `defaultValue` si fourni

### Affichage des erreurs:
```javascript
// Validation intégrée à Q-Input
:rules="inputConfig.required ? [
  val => val && val.trim() !== '' || 'Ce champ est obligatoire'
] : []"
```

## 🐛 Gestion des erreurs

### Types d'erreurs gérés:

1. **Aucun template sélectionné**
   - Message: "Veuillez sélectionner un template"
   - Type: warning

2. **Formulaire invalide**
   - Message: "Veuillez remplir tous les champs obligatoires"
   - Type: warning

3. **Erreur d'exécution serveur**
   - Message: Extrait de `error.response.data.error` ou message générique
   - Type: negative

4. **Upload fichier échoué**
   - Message: Détail du rejet (size, type, etc.)
   - Type: warning

## 📊 Cas d'usage

### ✅ Cas supportés:
- Templates simples (1-2 inputs)
- Templates complexes (nombreux inputs de types variés)
- Upload multiple d'images
- Résultats multiples (images, texte, JSON)
- Workflows avec dépendances de tâches

### ⚠️ Limitations:
- Pas de sauvegarde des historiques d'exécution (frontend uniquement)
- Pas de scheduling de tâches
- Pas de branchement conditionnel dans l'UI
- Résultats visibles une seule exécution à la fois

## 🔐 Sécurité

- **Validation côté client** pour UX rapide
- **Validation côté serveur** pour sécurité
- **CORS** configuré pour les endpoints de l'API
- **Filesize limits** appliquées par le serveur
- **Nettoyage des données** dans les templates (voir CLEANUP_RULES_TEMPLATES.md)

## 📈 Performance

- **Lazy loading** des templates à la demande
- **Debouncing** de la recherche (1000ms par défaut)
- **Preview d'images** optimisé (URL.createObjectURL)
- **Streaming** pour les uploads de fichiers volumineux
- **Mesure de temps** pour chaque exécution

## 🔄 Flux de données

```
Template Store
      ↓
AppViewer (Sélection)
      ↓
[Formulaire avec defaults]
      ↓
[User remplit les champs]
      ↓
useWorkflowExecution.executeWorkflow()
      ↓
POST /api/workflows/execute
      ↓
[Backend execute workflow]
      ↓
JSON Response (outputs)
      ↓
AppViewer (Affichage résultats)
      ↓
[User peut télécharger]
```

## 🚦 États du Composant

```
INITIAL
  ↓
[User sélectionne template] → TEMPLATE_LOADED
  ↓
[User remplit formulaire] → FORM_FILLED
  ↓
[Bouton Exécuter cliqué] → EXECUTING
  ↓
  ├─→ SUCCESS → RESULTS_DISPLAYED
  │      ↓
  │   [Télécharger ou Fermer]
  │
  └─→ ERROR → ERROR_DISPLAYED
         ↓
      [Fermer ou Corriger]
```

## 📝 Notes de développement

### Variables réactives clés:
- `selectedTemplate` - ID du template sélectionné
- `currentTemplateData` - Objet complet du template
- `formInputs` - Valeurs saisies par l'utilisateur
- `executing` - État d'exécution (depuis composable)
- `executionResult` - Résultats de l'exécution
- `executionError` - Message d'erreur le cas échéant

### Computed properties importants:
- `filteredTemplates` - Templates filtrés par recherche
- `isFormValid` - Validation complète du formulaire

### Hooks du lifecycle:
- `onMounted()` - Charge les templates au chargement

## 🎯 Prochaines améliorations

- [ ] Historique des exécutions (localStorage)
- [ ] Favoris de templates
- [ ] Présets d'inputs sauvegardés
- [ ] Comparaison de plusieurs résultats
- [ ] Export des résultats en CSV
- [ ] Scheduling d'exécution périodique
- [ ] Webhooks de notification après exécution
- [ ] Support des templates avec conditions

---

**Créé:** 13 Novembre 2025  
**Version:** 1.0.0  
**État:** ✅ Production-ready
