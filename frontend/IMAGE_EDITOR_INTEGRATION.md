# Intégration Frontend - Service d'Édition d'Images

## 🎨 Composant créé : `ImageEditor.vue`

### Fonctionnalités

Le composant `ImageEditor.vue` permet aux utilisateurs d'éditer leurs images avec des instructions textuelles.

### Modes d'édition disponibles

1. **Édition simple** - Édite une seule image
2. **Édition multiple** - Combine plusieurs images
3. **Transfert de pose** - Transfère la pose d'une image à une personne
4. **Transfert de style** - Applique le style d'une image à une autre

## 🎯 Interface utilisateur

### Structure

```
┌─────────────────────────────────────────────────────────────┐
│ 🎨 Édition d'Images                                         │
│ Modifiez vos images avec des instructions textuelles       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Mode d'édition: [Dropdown]                                 │
│   • Édition simple                                          │
│   • Édition multiple                                        │
│   • Transfert de pose                                       │
│   • Transfert de style                                      │
│                                                             │
│ Prompt d'édition: [Textarea]                               │
│ Ex: Remplacer l'arrière-plan par une plage...             │
│                                                             │
│ ⚙️ Options avancées (collapsible)                          │
│   • Format de sortie (1:1, 16:9, etc.)                    │
│   • Format de fichier (webp, png, jpg)                    │
│   • Mode rapide (toggle)                                   │
│   • Qualité de sortie (slider 50-100%)                    │
│                                                             │
│ [Éditer l'image] [Exemples]                               │
│                                                             │
│ ℹ️ Ajoutez d'abord des images pour pouvoir les éditer     │
└─────────────────────────────────────────────────────────────┘
```

### Placement dans l'application

Le composant `ImageEditor` est placé dans `HomePage.vue` entre `PromptInput` et le bouton "Générer" :

```vue
<ImageUploader class="q-mb-lg" />
<PromptInput class="q-mb-lg" />
<ImageEditor class="q-mb-lg" />  <!-- NOUVEAU -->
<q-btn color="primary" label="Générer" />
```

## 🔄 Flux de données

```
User uploads images → ImageUploader → Store
                                        ↓
User enters edit prompt → ImageEditor
                            ↓
[Bouton "Éditer l'image"]
                            ↓
POST /api/edit/[endpoint]
                            ↓
Backend (Qwen Image Edit Plus)
                            ↓
Response { imageUrls: [...] }
                            ↓
store.setResult({ type: 'image', ... })
                            ↓
ResultDisplay shows edited image
```

## 📋 Props et État

### État local

```javascript
const editPrompt = ref('');              // Prompt d'édition
const editMode = ref('single');          // Mode: single, multiple, transfer-pose, transfer-style
const aspectRatio = ref('match_input_image'); // Format de sortie
const outputFormat = ref('webp');        // Format: webp, png, jpg
const outputQuality = ref(95);           // Qualité 50-100
const goFast = ref(true);                // Mode rapide
const editing = ref(false);              // État de chargement
```

### Computed

```javascript
const hasImages = computed(() => store.hasImages);
const imageCount = computed(() => store.imageCount);
const canEdit = computed(() => hasImages.value && editPrompt.value.trim().length > 0);
```

## 🎨 Modes d'édition détaillés

### 1. Édition Simple

**Utilisation** : Modifier une seule image

**Endpoint** : `POST /api/edit/single-image`

**Prompt exemple** :
```
"Remplacer l'arrière-plan par une plage au coucher du soleil"
"Transformer en peinture à l'aquarelle"
"Changer la couleur de la voiture en rouge"
```

**Conditions** :
- Au moins 1 image uploadée
- Prompt non vide

### 2. Édition Multiple

**Utilisation** : Combiner plusieurs images avec un prompt personnalisé

**Endpoint** : `POST /api/edit/image`

**Prompt exemple** :
```
"Fusionner l'éclairage de image 1 avec le sujet de image 2"
"Combiner l'arrière-plan de image 1 avec le premier plan de image 2"
```

**Conditions** :
- Au moins 1 image uploadée
- Prompt non vide avec références aux numéros d'images

### 3. Transfert de Pose

**Utilisation** : Transférer la pose d'une image à une personne dans une autre

**Endpoint** : `POST /api/edit/transfer-pose`

**Prompt** : Automatique (`"The person in image 2 adopts the pose from image 1"`)

**Champs envoyés** :
- `poseSource`: Image 1 (source de la pose)
- `targetPerson`: Image 2 (personne cible)

**Conditions** :
- Exactement 2 images uploadées
- Pas besoin de prompt (automatique)

### 4. Transfert de Style

**Utilisation** : Appliquer le style artistique d'une image à une autre

**Endpoint** : `POST /api/edit/transfer-style`

**Prompt** : Automatique (`"Apply the artistic style from image 1 to image 2"`)

**Champs envoyés** :
- `styleSource`: Image 1 (source du style)
- `targetImage`: Image 2 (image cible)

**Conditions** :
- Exactement 2 images uploadées
- Pas besoin de prompt (automatique)

## 🎯 Options avancées

### Format de sortie (Aspect Ratio)

| Option | Valeur | Usage |
|--------|--------|-------|
| Conserver proportions | `match_input_image` | Garde le ratio original |
| Carré | `1:1` | Instagram posts |
| Paysage | `16:9` | YouTube, bannières |
| Portrait | `9:16` | Stories verticales |
| Photo classique | `4:3` | Photo standard |
| Portrait vertical | `3:4` | Portrait |

### Format de fichier

| Format | Description | Avantages |
|--------|-------------|-----------|
| WebP | Recommandé | Petit fichier, bonne qualité |
| PNG | Qualité maximale | Transparence, sans perte |
| JPEG | Compatible | Universel, bon pour photos |

### Mode rapide (Go Fast)

- **Activé (défaut)** : Génération rapide (~30-60s), qualité acceptable
- **Désactivé** : Meilleure qualité (~1-3 min), plus coûteux

### Qualité de sortie

- **Slider** : 50% à 100%
- **Défaut** : 95%
- **Note** : N'affecte pas les PNG

## 💡 Messages d'aide dynamiques

### Placeholder selon le mode

```javascript
const currentPlaceholder = computed(() => {
  switch (editMode.value) {
    case 'transfer-pose':
      return 'Ex: La personne dans image 2 adopte la pose de image 1';
    case 'transfer-style':
      return 'Ex: Appliquer le style artistique de image 1 à image 2';
    case 'multiple':
      return 'Ex: Fusionner l\'éclairage de image 1 avec le sujet de image 2';
    default:
      return 'Ex: Remplacer l\'arrière-plan par une plage au coucher du soleil';
  }
});
```

### Bannières contextuelles

#### Aucune image
```
ℹ️ Ajoutez d'abord des images pour pouvoir les éditer.
```

#### 2+ images
```
💡 Astuce : Avec plusieurs images, référencez-les par numéro dans votre prompt.
   Exemple : "La personne dans image 2 adopte la pose de image 1"
```

## 🧪 Exemples de prompts intégrés

Le bouton "Exemples" affiche des prompts adaptés au mode sélectionné :

### Mode Simple
- Remplacer l'arrière-plan par une montagne au coucher du soleil
- Transformer en peinture à l'aquarelle
- Changer la couleur de la voiture en rouge
- Améliorer l'éclairage pour un effet golden hour

### Mode Multiple
- La personne dans image 2 adopte la pose de image 1
- Appliquer le style artistique de image 1 à image 2
- Fusionner l'éclairage de image 1 avec le sujet de image 2
- Combiner l'arrière-plan de image 1 avec le premier plan de image 2

### Transfert de Pose
- La personne dans image 2 adopte la pose de image 1
- Transférer la pose de yoga de image 1 à la personne dans image 2

### Transfert de Style
- Appliquer le style artistique de image 1 à image 2
- Transformer image 2 dans le style de Van Gogh (image 1)

## 🔄 Fonction d'édition

### Code principal

```javascript
async function editImages() {
  // 1. Validation
  if (!canEdit.value) {
    // Notification d'erreur
    return;
  }

  editing.value = true;

  try {
    // 2. Préparer FormData
    const formData = new FormData();
    
    // Ajouter les images
    store.images.forEach((img) => {
      formData.append('images', img.file);
    });

    // Ajouter les paramètres
    formData.append('prompt', editPrompt.value.trim());
    formData.append('aspectRatio', aspectRatio.value);
    formData.append('outputFormat', outputFormat.value);
    formData.append('outputQuality', outputQuality.value.toString());
    formData.append('goFast', goFast.value.toString());

    // 3. Choisir l'endpoint selon le mode
    let endpoint = '/edit/image';
    
    // Adapter pour transfer-pose et transfer-style
    if (editMode.value === 'transfer-pose') {
      endpoint = '/edit/transfer-pose';
      // Renommer les champs
    } else if (editMode.value === 'transfer-style') {
      endpoint = '/edit/transfer-style';
      // Renommer les champs
    } else if (editMode.value === 'single' && store.images.length === 1) {
      endpoint = '/edit/single-image';
    }

    // 4. Appeler l'API
    const response = await api.post(endpoint, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });

    // 5. Traiter la réponse
    if (response.data.success) {
      store.setResult({
        type: 'image',
        resultUrl: response.data.imageUrls[0],
        message: 'Image éditée avec succès',
        // ... autres champs
      });

      // Notification de succès
      editPrompt.value = ''; // Reset
    }

  } catch (error) {
    // Gestion d'erreur
  } finally {
    editing.value = false;
  }
}
```

## 🎨 Intégration avec le Store

### Méthode utilisée

```javascript
store.setResult({
  type: 'image',
  resultUrl: imageUrls[0],
  message: 'Image éditée avec succès',
  prompt: editPrompt.value || 'Édition automatique',
  editMode: editMode.value,
  params: response.data.params,
  mock: response.data.mock || false,
  timestamp: new Date().toISOString(),
  allImages: imageUrls // Toutes les images si plusieurs
});
```

### Compatibilité avec ResultDisplay

✅ Le composant `ResultDisplay` reconnaît `type: 'image'` et affiche :
- L'image éditée
- Le message "Image éditée avec succès"
- Les boutons d'action (Télécharger, Réutiliser, Nouvelle génération)

## ⚠️ Gestion d'erreurs

### Validation côté frontend

```javascript
const canEdit = computed(() => {
  return hasImages.value && editPrompt.value.trim().length > 0;
});
```

### Messages d'erreur

| Condition | Message |
|-----------|---------|
| Pas d'images | "Ajoutez des images et un prompt d'édition" |
| Erreur API | Affiche `error.response?.data?.error` |
| Erreur réseau | "Erreur lors de l'édition de l'image" |

### Notifications Quasar

```javascript
// Succès
$q.notify({
  type: 'positive',
  message: 'Image éditée avec succès !',
  caption: mock ? 'Mode simulation' : 'Éditée par Qwen Image Edit Plus'
});

// Erreur
$q.notify({
  type: 'negative',
  message: 'Erreur lors de l\'édition de l\'image',
  caption: error.message
});
```

## 🎯 Cas d'usage UX

### Workflow 1 : Édition simple

1. User uploade 1 image
2. Sélectionne "Édition simple"
3. Entre prompt : "Remplacer l'arrière-plan par une plage"
4. Clique "Éditer l'image"
5. Voit l'image éditée dans ResultDisplay

### Workflow 2 : Transfert de pose rapide

1. User uploade 2 images
2. Sélectionne "Transfert de pose"
3. Clique "Transfert de pose" (pas besoin de prompt)
4. Voit le résultat

### Workflow 3 : Édition avancée

1. User uploade images
2. Ouvre "Options avancées"
3. Ajuste format, qualité, mode rapide
4. Entre prompt personnalisé
5. Clique "Éditer l'image"
6. Télécharge le résultat

## 🚀 Tests

### Test manuel

1. Démarrer le frontend : `npm run dev`
2. Ouvrir http://localhost:9000
3. Uploader une image
4. Scroller vers "Édition d'Images"
5. Sélectionner un mode
6. Cliquer sur "Exemples" pour charger un prompt
7. Cliquer sur "Éditer l'image"
8. Vérifier le résultat dans ResultDisplay

### Test avec 2 images (transfert de pose)

1. Uploader 2 images
2. Sélectionner "Transfert de pose"
3. Observer le changement de placeholder
4. Cliquer "Transfert de pose"
5. Vérifier le résultat

## 📊 Résumé

### Fichiers modifiés/créés

1. ✅ **Créé** : `frontend/src/components/ImageEditor.vue` (387 lignes)
2. ✅ **Modifié** : `frontend/src/pages/HomePage.vue`
   - Ajout import `ImageEditor`
   - Ajout `<ImageEditor class="q-mb-lg" />`

### Fonctionnalités ajoutées

- ✅ 4 modes d'édition
- ✅ Options avancées (aspect ratio, format, qualité, vitesse)
- ✅ Exemples de prompts contextuels
- ✅ Validation intelligente
- ✅ Messages d'aide dynamiques
- ✅ Intégration complète avec le store
- ✅ Compatible avec ResultDisplay

### Endpoints utilisés

- `POST /api/edit/image` - Édition multiple
- `POST /api/edit/single-image` - Édition simple
- `POST /api/edit/transfer-pose` - Transfert de pose
- `POST /api/edit/transfer-style` - Transfert de style

## 🎉 Résultat final

Interface complète d'édition d'images intégrée dans l'application avec :
- Sélection de mode intuitive
- Options avancées pour utilisateurs expérimentés
- Aide contextuelle automatique
- Exemples de prompts
- Validation robuste
- Notifications claires
- Compatible avec l'ensemble de l'application

L'utilisateur peut maintenant :
1. **Générer** des images (bouton "Générer l'image")
2. **Éditer** ses images uploadées (composant ImageEditor)
3. **Analyser** ses images (workflow complet existant)
