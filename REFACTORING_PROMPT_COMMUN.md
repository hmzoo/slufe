# 🔄 Refactoring - Prompt Commun Unifié

## 📋 Changements effectués

### Objectif
Centraliser le champ de prompt pour qu'il soit partagé entre tous les services (génération, édition, amélioration) au lieu d'avoir des prompts séparés.

## ✅ Modifications

### 1. `ImageEditor.vue` - Composant simplifié

#### ❌ Avant
```vue
<!-- Prompt d'édition séparé -->
<q-input
  v-model="editPrompt"
  type="textarea"
  outlined
  placeholder="..."
  rows="3"
/>
```

```javascript
const editPrompt = ref(''); // État local séparé
```

#### ✅ Après
```vue
<!-- Info : utilise le prompt commun -->
<q-banner dense class="bg-info text-white q-mb-md" rounded>
  <template v-slot:avatar>
    <q-icon name="info" color="white" />
  </template>
  Le prompt principal ci-dessus sera utilisé pour l'édition.
</q-banner>
```

```javascript
// Utilise le prompt du store
const promptFromStore = computed(() => store.prompt);
```

### 2. Validation intelligente mise à jour

```javascript
const canEdit = computed(() => {
  // Pour transfer-pose et transfer-style, pas besoin de prompt
  if (editMode.value === 'transfer-pose' || editMode.value === 'transfer-style') {
    return hasImages.value && imageCount.value >= 2;
  }
  // Pour les autres modes, le prompt est requis
  return hasImages.value && promptFromStore.value.trim().length > 0;
});
```

### 3. Fonction d'édition mise à jour

```javascript
async function editImages() {
  // ...
  // Utiliser le prompt du store
  const promptToUse = promptFromStore.value.trim();
  formData.append('prompt', promptToUse);
  // ...
}
```

### 4. Boutons simplifiés

#### ❌ Avant
```vue
<q-btn label="Éditer l'image" />
<q-btn label="Transfert de pose" />    <!-- Dupliqué -->
<q-btn label="Transfert de style" />    <!-- Dupliqué -->
<q-btn label="Exemples" />
```

#### ✅ Après
```vue
<q-btn label="Éditer l'image" />
<q-btn label="Exemples de modes" />     <!-- Un seul bouton -->
```

### 5. Nouveaux exemples contextuels

```javascript
function showModeExamples() {
  const modeDescriptions = {
    single: {
      title: 'Édition Simple',
      description: 'Modifiez une seule image avec un prompt...',
      examples: [...]
    },
    // ... autres modes
  };
  
  // Affiche dialog avec description du mode
}
```

### 6. `PromptInput.vue` - Exemples enrichis

#### ❌ Avant
```javascript
const examples = [
  'Un paysage de montagne...',
  // Seulement pour génération
];
```

#### ✅ Après
```javascript
const exampleCategories = {
  'Génération d\'images': [...],
  'Édition d\'images': [...],
  'Édition multiple images': [...]
};
// Exemples pour tous les usages
```

## 🎯 Architecture finale

### Flux de données

```
┌─────────────────────────────────────────────────────────────┐
│                    PromptInput.vue                          │
│  [Champ de texte unique]                                    │
│  ↓                                                          │
│  store.setPrompt(value) ──────────────────┐                │
└───────────────────────────────────────────┼────────────────┘
                                             │
                                             ▼
                                    ┌─────────────────┐
                                    │  Pinia Store    │
                                    │  prompt: ref()  │
                                    └────────┬────────┘
                                             │
                    ┌────────────────────────┼────────────────────┐
                    ▼                        ▼                    ▼
        ┌──────────────────┐    ┌──────────────────┐  ┌──────────────────┐
        │ Améliorer Prompt │    │ Générer Image    │  │ Éditer Image     │
        │  (Gemini)        │    │  (Qwen-Image)    │  │  (Qwen-Edit)     │
        └──────────────────┘    └──────────────────┘  └──────────────────┘
             Utilise                  Utilise               Utilise
          store.prompt             store.prompt          store.prompt
```

## 📊 Interface utilisateur

### Avant (3 prompts séparés)
```
┌─────────────────────────────────────────┐
│ 📝 Prompt Principal                     │
│ [textarea]                              │
│ [Améliorer] [Générer]                   │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ ✏️ Édition d'Images                     │
│ [textarea pour édition] ← SÉPARÉ        │
│ [Éditer]                                │
└─────────────────────────────────────────┘
```

### Après (1 prompt unique)
```
┌─────────────────────────────────────────┐
│ 📝 Prompt (Commun à tous les services) │
│ [textarea unique]                       │
│ [Améliorer] [Générer] [Exemples]        │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ ✏️ Édition d'Images                     │
│ ℹ️ Le prompt ci-dessus sera utilisé     │
│ [Mode: ▼] [Options ▼]                   │
│ [Éditer l'image] [Exemples de modes]    │
└─────────────────────────────────────────┘
```

## ✅ Avantages

### 1. **Simplicité**
- ✅ Un seul endroit pour entrer le prompt
- ✅ Pas de duplication de contenu
- ✅ Interface plus épurée

### 2. **Cohérence**
- ✅ Même prompt utilisé pour tous les services
- ✅ Pas de confusion entre plusieurs champs
- ✅ Workflow plus logique

### 3. **UX améliorée**
- ✅ Moins de clics pour l'utilisateur
- ✅ Moins de champs à remplir
- ✅ Messages d'aide clairs

### 4. **Maintenance**
- ✅ Un seul état à gérer (store.prompt)
- ✅ Code plus simple
- ✅ Moins de bugs potentiels

## 🎯 Cas d'usage

### Cas 1 : Génération simple
```
1. User entre prompt : "Un chat majestueux"
2. Clique "Générer l'image"
3. Image générée avec ce prompt
```

### Cas 2 : Édition avec prompt
```
1. User uploade une image
2. Entre prompt dans le champ commun : "Changer l'arrière-plan"
3. Sélectionne mode "Édition simple"
4. Clique "Éditer l'image"
5. Image éditée avec ce prompt
```

### Cas 3 : Transfert automatique
```
1. User uploade 2 images
2. Pas besoin de prompt (automatique)
3. Sélectionne mode "Transfert de pose"
4. Clique "Éditer l'image"
5. Pose transférée automatiquement
```

### Cas 4 : Workflow complet
```
1. User entre prompt simple
2. Clique "Améliorer le prompt"
3. Prompt enrichi automatiquement
4. Peut utiliser pour :
   - Générer une nouvelle image
   - Éditer une image existante
   - Analyser avec contexte
```

## 🔍 Validation

### Règles de validation

| Service | Validation |
|---------|------------|
| **Améliorer prompt** | Prompt non vide ✅ |
| **Générer image** | Prompt non vide ✅ |
| **Éditer image (simple/multiple)** | Prompt non vide + Images ✅ |
| **Transfert pose/style** | Images uniquement (prompt auto) ✅ |

### Messages d'aide

**ImageEditor** affiche maintenant :
```
ℹ️ Le prompt principal ci-dessus sera utilisé pour l'édition.

Note: Un prompt automatique sera appliqué pour ce mode.
(si mode = transfer-pose ou transfer-style)
```

## 📝 Exemples enrichis

### PromptInput - Bouton "Exemples"

Maintenant organisés par catégories :

#### Génération d'images
- Un paysage de montagne au coucher du soleil...
- Un portrait d'une personne souriante...
- Une architecture moderne...
- Une nature morte...

#### Édition d'images
- Remplacer l'arrière-plan par une montagne...
- Transformer en peinture à l'aquarelle
- Changer la couleur de la voiture en rouge
- Améliorer l'éclairage pour un effet golden hour

#### Édition multiple images
- La personne dans image 2 adopte la pose de image 1
- Fusionner l'éclairage de image 1 avec le sujet de image 2
- Appliquer le style artistique de image 1 à image 2

### ImageEditor - Bouton "Exemples de modes"

Affiche une **description du mode** sélectionné :

**Exemple : Mode "Édition Simple"**
```
Édition Simple

Modifiez une seule image avec un prompt. 
Le prompt principal sera utilisé.

Exemples de prompts :
• Remplacer l'arrière-plan par une montagne au coucher du soleil
• Transformer en peinture à l'aquarelle
• Changer la couleur de la voiture en rouge
• Améliorer l'éclairage pour un effet golden hour

Entrez ces prompts dans le champ principal ci-dessus.
```

## 🎉 Résultat

### Code simplifié
- ❌ Supprimé : `editPrompt` ref local
- ❌ Supprimé : `currentPlaceholder` computed
- ❌ Supprimé : Textarea séparé pour édition
- ✅ Ajouté : `promptFromStore` computed
- ✅ Ajouté : Banner d'information
- ✅ Ajouté : Exemples catégorisés

### Interface améliorée
- 🎯 **Un seul champ** de prompt pour tout
- 📊 **Exemples enrichis** par catégorie
- 💡 **Messages clairs** sur l'utilisation
- ⚡ **Workflow simplifié**

### Expérience utilisateur
```
Avant: "Dois-je remplir les deux prompts ?"
Après: "Un seul prompt pour tout !" ✅
```

---

**Statut** : ✅ Refactoring terminé
**Impact** : Amélioration de l'UX et simplification du code
**Compatibilité** : Tous les services fonctionnent avec le prompt commun
