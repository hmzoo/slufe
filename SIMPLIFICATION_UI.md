# 🎨 Simplification de l'interface - Édition intégrée

## 📋 Changements effectués

### Objectif
Simplifier l'interface en intégrant le bouton d'édition d'images directement à côté du bouton de génération, au lieu d'avoir un bloc séparé pour l'édition.

## ✅ Modifications

### 1. `HomePage.vue` - Suppression du bloc ImageEditor

#### ❌ Avant
```vue
<ImageUploader class="q-mb-lg" />
<PromptInput class="q-mb-lg" />
<ImageEditor class="q-mb-lg" />  <!-- Bloc séparé -->
```

#### ✅ Après
```vue
<ImageUploader class="q-mb-lg" />
<PromptInput class="q-mb-lg" />
<!-- ImageEditor supprimé - intégré dans PromptInput -->
```

### 2. `PromptInput.vue` - Ajout du bouton "Éditer l'image"

#### ❌ Avant
```vue
<q-btn label="Améliorer le prompt" />
<q-btn label="Générer l'image" />
<q-btn label="Exemples" />
```

#### ✅ Après
```vue
<q-btn label="Améliorer le prompt" />
<q-btn label="Générer l'image" />
<q-btn label="Éditer l'image" />  <!-- NOUVEAU -->
<q-btn label="Exemples" />
```

### 3. Fonctionnalités d'édition intégrées

```javascript
// États pour l'édition
const editing = ref(false);
const editMode = ref('single');
const aspectRatio = ref('1:1');
const outputFormat = ref('webp');
const outputQuality = ref(95);
const goFast = ref(false);

// Validation intelligente
const canEdit = computed(() => {
  // Transferts : besoin de 2+ images, pas de prompt
  if (editMode.value === 'transfer-pose' || editMode.value === 'transfer-style') {
    return hasImages.value && imageCount.value >= 2;
  }
  // Autres modes : images + prompt requis
  return hasImages.value && localPrompt.value.trim().length > 0;
});

// Fonction d'édition
async function editImages() {
  // Configure FormData avec prompt, images, paramètres
  // Choisit l'endpoint selon le mode
  // Lance la requête et affiche le résultat
}
```

## 🎯 Workflow utilisateur simplifié

### Avant (3 étapes)
```
1. Upload images dans ImageUploader
2. Entre prompt dans PromptInput
3. Configure options dans ImageEditor (bloc séparé)
4. Clique "Éditer l'image"
```

### Après (2 étapes)
```
1. Upload images dans ImageUploader
2. Entre prompt dans PromptInput
3. Clique "Éditer l'image" (bouton à côté de "Générer")
   → Dialog de configuration s'ouvre
   → Configure et édite directement
```

## 📊 Interface utilisateur

### Organisation des boutons

```
┌─────────────────────────────────────────────────────────────┐
│ 📝 Prompt                                                   │
│ [textarea]                                                  │
│                                                             │
│ [Améliorer]  [Générer l'image]  [Éditer l'image]  [Exemples]  [Effacer] │
│   (outline)    (secondary)         (accent)         (flat)     (flat)    │
└─────────────────────────────────────────────────────────────┘
```

### Dialog d'édition

Quand l'utilisateur clique sur "Éditer l'image" :

```
┌──────────────────────────────────────┐
│ Options d'édition                    │
├──────────────────────────────────────┤
│ Images sélectionnées : 2             │
│ Mode requis : 1+ images              │
│                                      │
│ [Éditer maintenant]  [Configuration] │
└──────────────────────────────────────┘
```

Si l'utilisateur clique sur "Configuration" :

```
1. Dialog: Choix du mode
   ○ Édition simple (1 image)
   ○ Édition multiple (plusieurs images)
   ○ Transfert de pose (2+ images)
   ○ Transfert de style (2+ images)

2. Dialog: Choix du ratio
   ○ Carré (1:1)
   ○ Portrait (3:4)
   ○ Paysage (4:3)
   ○ Large (16:9)

3. Édition lancée automatiquement
```

## 🔄 Modes d'édition supportés

| Mode | Endpoint | Images requises | Prompt requis |
|------|----------|-----------------|---------------|
| **Édition simple** | `/edit/single-image` | 1 | ✅ Oui |
| **Édition multiple** | `/edit/image` | 1+ | ✅ Oui |
| **Transfert de pose** | `/edit/transfer-pose` | 2+ | ❌ Auto |
| **Transfert de style** | `/edit/transfer-style` | 2+ | ❌ Auto |

## 🎯 Validation intelligente

Le bouton "Éditer l'image" s'active selon les règles :

```javascript
// Pour modes de transfert
if (mode === 'transfer-pose' || mode === 'transfer-style') {
  enabled = hasImages && imageCount >= 2;
  // Pas besoin de prompt (automatique)
}

// Pour modes d'édition normaux
else {
  enabled = hasImages && prompt.length > 0;
  // Besoin d'images ET de prompt
}
```

## ✅ Avantages

### 1. **Interface plus compacte**
- ✅ Moins de blocs séparés
- ✅ Tous les boutons d'action au même endroit
- ✅ Interface plus épurée

### 2. **Workflow simplifié**
- ✅ Un seul endroit pour toutes les actions
- ✅ Dialog contextuel pour la configuration
- ✅ Moins de navigation entre les sections

### 3. **Cohérence visuelle**
- ✅ Tous les boutons ensemble dans PromptInput
- ✅ Améliorer / Générer / Éditer côte à côte
- ✅ Organisation logique des actions

### 4. **UX améliorée**
- ✅ Moins de confusion sur où cliquer
- ✅ Options d'édition à la demande (dialog)
- ✅ Workflow plus intuitif

## 📝 Cas d'usage

### Cas 1 : Édition simple avec prompt
```
1. User uploade 1 image
2. Entre prompt : "Changer l'arrière-plan en montagne"
3. Clique "Éditer l'image"
4. Dialog s'ouvre → Clique "Éditer maintenant"
5. Image éditée avec le prompt
```

### Cas 2 : Transfert de pose
```
1. User uploade 2 images
2. Prompt vide (pas nécessaire)
3. Clique "Éditer l'image"
4. Configure mode "Transfert de pose"
5. Pose transférée automatiquement
```

### Cas 3 : Configuration avancée
```
1. User uploade des images
2. Entre prompt
3. Clique "Éditer l'image"
4. Dialog → Clique "Configuration"
5. Sélectionne mode et ratio
6. Édition lancée avec paramètres personnalisés
```

## 🎉 Résultat

### Code simplifié
- ❌ Supprimé : Composant ImageEditor.vue séparé
- ❌ Supprimé : Import de ImageEditor dans HomePage
- ✅ Ajouté : Bouton "Éditer l'image" dans PromptInput
- ✅ Ajouté : Fonctions d'édition intégrées
- ✅ Ajouté : Dialogs de configuration

### Interface améliorée
- 🎯 **Un seul bloc** pour prompt + actions
- 📊 **Boutons groupés** logiquement
- 💡 **Configuration à la demande** via dialogs
- ⚡ **Workflow plus rapide**

### Architecture
```
AVANT:
├── ImageUploader (upload)
├── PromptInput (prompt + amélioration + génération)
└── ImageEditor (édition) ← Bloc séparé

APRÈS:
├── ImageUploader (upload)
└── PromptInput (prompt + amélioration + génération + édition) ← Tout intégré
```

## 🔍 Détails techniques

### Paramètres d'édition par défaut
```javascript
editMode: 'single'           // Mode par défaut
aspectRatio: '1:1'          // Format carré
outputFormat: 'webp'        // Format optimisé
outputQuality: 95           // Haute qualité
goFast: false               // Mode qualité (pas rapide)
```

### Endpoints utilisés
```javascript
const endpoint = {
  'single': '/edit/single-image',
  'multiple': '/edit/image',
  'transfer-pose': '/edit/transfer-pose',
  'transfer-style': '/edit/transfer-style'
}[editMode];
```

### Structure FormData
```javascript
formData = {
  prompt: '...',              // (sauf transferts)
  images: [File, File, ...],  // Fichiers depuis store
  aspectRatio: '1:1',
  outputFormat: 'webp',
  outputQuality: '95',
  goFast: 'false'
}
```

## 🚀 Prochaines étapes possibles

1. **Mémorisation des préférences**
   - Sauvegarder mode/ratio préférés
   - Réutiliser automatiquement

2. **Prévisualisation**
   - Aperçu du ratio avant édition
   - Prévisualisation des transferts

3. **Batch editing**
   - Éditer plusieurs images d'un coup
   - File d'attente d'éditions

4. **Templates**
   - Créer des presets de configuration
   - "Portrait professionnel", "Style artistique", etc.

---

**Statut** : ✅ Simplification terminée
**Impact** : Interface plus compacte et intuitive
**Compatibilité** : Toutes les fonctionnalités d'édition préservées
