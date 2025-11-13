# 📋 Référence des Variables de Workflow

Ce document liste toutes les tâches disponibles et leurs variables accessibles dans les workflows.

## 🎨 Tâches Image

### `generate_image` - Générer une image
**Préfixe suggéré**: `img`  
**Exemple ID**: `img1`, `img2`, `imgLogo`

**Inputs**:
- `prompt` (text) - Description de l'image à générer
  - Variable: `{{taskId.prompt}}`
- `aspectRatio` (select) - Format de l'image (1:1, 16:9, 9:16, 4:3, 3:4)

**Outputs**:
- `image` (string) - URL de l'image générée
  - Variable: `{{img1.image}}`
  - Exemple: `/medias/generated_abc123.webp`

---

### `edit_image` - Éditer une image
**Préfixe suggéré**: `edit`  
**Exemple ID**: `edit1`, `editPose`, `editStyle`

**Inputs**:
- `image1` (image) - Image principale à éditer
  - Variable: `{{img1.image}}`
- `image2` (image, optionnel) - Image de référence secondaire
  - Variable: `{{img2.image}}`
- `image3` (image, optionnel) - Image de référence tertiaire
- `editPrompt` (text) - Instructions d'édition
  - Variable: `{{text1.text}}` ou texte direct
- `aspectRatio` (select) - Format de sortie
- `outputFormat` (select) - Format (webp, jpg, png)
- `outputQuality` (number) - Qualité 0-100
- `goFast` (boolean) - Mode rapide
- `seed` (number) - Graine aléatoire
- `disableSafetyChecker` (boolean) - Désactiver filtre

**Outputs**:
- `edited_image` (string) - URL de la première image éditée
  - Variable: `{{edit1.edited_image}}`
- `edited_images` (array) - URLs de toutes les images éditées
  - Variable: `{{edit1.edited_images}}`

---

### `image_resize_crop` - Redimensionner/Recadrer
**Préfixe suggéré**: `resize`  
**Exemple ID**: `resize1`, `cropSquare`

**Inputs**:
- `image` (image) - Image à redimensionner
  - Variable: `{{img1.image}}`
- `h_max`, `v_max` (number) - Dimensions max
- `ratio` (select) - Ratio forcé
- `crop_center` (boolean) - Recadrer au centre

**Outputs**:
- `image_url` (string) - URL de l'image redimensionnée
  - Variable: `{{resize1.image_url}}`

---

### `describe_images` - Analyser des images
**Préfixe suggéré**: `desc`  
**Exemple ID**: `desc1`, `descScene`

**Inputs**:
- `images` (images) - Images à analyser
  - Variable: `{{img1.image}}` ou `[{{img1.image}}, {{img2.image}}]`
- `question` (text, optionnel) - Question spécifique
- `language` (select) - Langue (en, fr)

**Outputs**:
- `descriptions` (array) - Descriptions textuelles
  - Variable: `{{desc1.descriptions}}`
- `description` (string) - Première description
  - Variable: `{{desc1.description}}`

---

## 📝 Tâches Texte

### `enhance_prompt` - Améliorer un prompt
**Préfixe suggéré**: `enhance`  
**Exemple ID**: `enhance1`, `enhanceVideo`

**Inputs**:
- `prompt` (text) - Prompt à améliorer
  - Variable: `{{text1.text}}` ou `{{desc1.description}}`
- `targetType` (select) - Type cible (image, video, text)
- `style` (select) - Style souhaité
- `language` (select) - Langue de sortie

**Outputs**:
- `enhanced_prompt` (string) - Prompt amélioré
  - Variable: `{{enhance1.enhanced_prompt}}`
- `original_prompt` (string) - Prompt original
- `improvements` (array) - Liste des améliorations

---

## 🎬 Tâches Vidéo

### `generate_video_t2v` - Générer vidéo (texte)
**Préfixe suggéré**: `video`  
**Exemple ID**: `video1`, `videoScene`

**Inputs**:
- `prompt` (text) - Description de la vidéo
  - Variable: `{{text1.text}}` ou `{{enhance1.enhanced_prompt}}`
- `numFrames` (select) - 81 ou 121 frames
- `aspectRatio` (select) - 16:9 ou 9:16
- `loraWeightsTransformer` (text) - URL LoRA 1
- `loraScaleTransformer` (number) - Poids LoRA 1
- `loraWeightsTransformer2` (text) - URL LoRA 2
- `loraScaleTransformer2` (number) - Poids LoRA 2
- `framesPerSecond`, `interpolateOutput`, `goFast`, `sampleShift`, `seed`

**Outputs**:
- `video` (string) - URL de la vidéo générée
  - Variable: `{{video1.video}}`
- `prompt_used` (string) - Prompt utilisé

---

### `generate_video_i2v` - Générer vidéo (image)
**Préfixe suggéré**: `i2v`  
**Exemple ID**: `i2v1`, `animPhoto`

**Inputs**:
- `image` (image) - Image de départ
  - Variable: `{{img1.image}}` ou `{{edit1.edited_image}}`
- `lastImage` (image, optionnel) - Image de fin
  - Variable: `{{img2.image}}`
- `prompt` (text) - Description du mouvement
  - Variable: `{{text1.text}}` ou `{{enhance1.enhanced_prompt}}`
- `numFrames` (select) - 81 ou 121 frames
- `aspectRatio` (select) - 16:9 ou 9:16
- LoRA et autres paramètres similaires à T2V

**Outputs**:
- `video` (string) - URL de la vidéo générée
  - Variable: `{{i2v1.video}}`
- `source_image` (string) - Image source utilisée

---

## 📥 Tâches Input

### `text_input` - Saisie de texte
**Préfixe suggéré**: `text`  
**Exemple ID**: `text1`, `textPrompt`, `textInstructions`

**Inputs**:
- `label` (string) - Libellé du champ
- `userInput` (text) - Texte saisi par l'utilisateur
- `defaultText` (text) - Valeur par défaut
- `placeholder` (text) - Texte d'aide

**Outputs**:
- `text` (string) - Texte saisi
  - Variable: `{{text1.text}}`
  - Exemple: "make it alive"
- `label` (string) - Libellé
- `timestamp` (string) - Horodatage de saisie

---

### `image_input` - Sélection d'image
**Préfixe suggéré**: `image`  
**Exemple ID**: `image1`, `imageSource`, `imagePhoto`

**Inputs**:
- `label` (string) - Libellé
- `selectedImage` (image) - Image sélectionnée
- `defaultImage` (image) - Image par défaut

**Outputs**:
- `image` (string) - URL de l'image sélectionnée
  - Variable: `{{image1.image}}`
  - Exemple: "/medias/d58530f4-a1d8-4117-af69-a921e25efb75.jpg"
- `image_url` (string) - Alias de `image`
- `status` (string) - Statut ("success", "empty")
- `message` (string) - Message d'information

---

### `video_input` - Sélection de vidéo
**Préfixe suggéré**: `videoIn`  
**Exemple ID**: `videoIn1`, `videoSource`

**Inputs**:
- `label` (string) - Libellé
- `selectedVideo` (video) - Vidéo sélectionnée
- `defaultVideo` (video) - Vidéo par défaut

**Outputs**:
- `video` (string) - URL de la vidéo sélectionnée
  - Variable: `{{videoIn1.video}}`
- `video_url` (string) - Alias de `video`

---

### `upload_image` - Upload d'image
**Préfixe suggéré**: `upload`  
**Exemple ID**: `upload1`, `uploadPhoto`

**Outputs**:
- `image` (string) - URL de l'image uploadée
  - Variable: `{{upload1.image}}`

---

## 📊 Exemples de Workflows Complets

### Workflow 1: Génération Image Simple
```javascript
{
  inputs: [
    { id: "text1", type: "text_input" }
  ],
  tasks: [
    { 
      id: "img1", 
      type: "generate_image",
      inputs: {
        prompt: "{{text1.text}}"
      }
    }
  ]
}
```

### Workflow 2: Image → Vidéo avec amélioration
```javascript
{
  inputs: [
    { id: "image1", type: "image_input" },
    { id: "text1", type: "text_input" }
  ],
  tasks: [
    {
      id: "enhance1",
      type: "enhance_prompt",
      inputs: {
        prompt: "{{text1.text}}",
        targetType: "video"
      }
    },
    {
      id: "i2v1",
      type: "generate_video_i2v",
      inputs: {
        image: "{{image1.image}}",
        prompt: "{{enhance1.enhanced_prompt}}",
        numFrames: 81,
        aspectRatio: "16:9"
      }
    }
  ]
}
```

### Workflow 3: Édition Multi-Images
```javascript
{
  inputs: [
    { id: "image1", type: "image_input" },  // Photo personne
    { id: "image2", type: "image_input" },  // Pose référence
    { id: "text1", type: "text_input" }     // Instructions
  ],
  tasks: [
    {
      id: "edit1",
      type: "edit_image",
      inputs: {
        image1: "{{image1.image}}",
        image2: "{{image2.image}}",
        editPrompt: "{{text1.text}}"
      }
    },
    {
      id: "i2v1",
      type: "generate_video_i2v",
      inputs: {
        image: "{{edit1.edited_image}}",
        prompt: "natural movement, smooth animation",
        aspectRatio: "9:16"
      }
    }
  ]
}
```

---

## 🔧 Conventions de Nommage

### IDs de Tâches
- **Descriptifs**: `enhancePrompt`, `generateLogo`, `animatePhoto`
- **Séquentiels**: `img1`, `img2`, `edit1`, `video1`
- **Par fonction**: `poseTransfer`, `styleApply`, `backgroundRemove`

### Variables
- Format: `{{taskId.outputKey}}`
- Exemples:
  - `{{img1.image}}`
  - `{{text1.text}}`
  - `{{edit1.edited_image}}`
  - `{{enhance1.enhanced_prompt}}`
  - `{{i2v1.video}}`

### Types de Données
- `string` - URL, texte, chemin
- `array` - Liste d'éléments
- `object` - Objet structuré
- `number` - Nombre
- `boolean` - Vrai/Faux

---

## 📚 Ressources

- **Documentation complète**: `/docs/MULTI_STEP_WORKFLOWS.md`
- **Définitions des tâches**: `/frontend/src/config/taskDefinitions.js`
- **Exemples d'API**: `/backend/references_API/`
