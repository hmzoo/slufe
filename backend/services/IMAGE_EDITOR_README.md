# Service d'Édition d'Images - Qwen Image Edit Plus

Service backend pour l'édition d'images avec instructions textuelles utilisant le modèle Qwen Image Edit Plus de Replicate.

## 📋 Vue d'ensemble

Le service permet :
- **Édition d'images** avec instructions textuelles
- **Transfert de pose** entre personnes
- **Transfert de style** artistique
- **Combinaison d'éléments** de plusieurs images
- **Support de 1 à 5 images** en entrée

## 🚀 Endpoints

### 1. POST `/api/edit/image`

Édite une ou plusieurs images avec un prompt textuel.

#### Requête (JSON)

```json
{
  "prompt": "Replace the background with a beach sunset",
  "imageUrls": [
    "https://example.com/photo.jpg"
  ],
  "aspectRatio": "match_input_image",
  "goFast": true,
  "seed": null,
  "outputFormat": "webp",
  "outputQuality": 95,
  "disableSafetyChecker": false
}
```

#### Requête (Multipart/Form-Data)

```bash
curl -X POST http://localhost:3000/api/edit/image \
  -F "images=@photo1.jpg" \
  -F "images=@photo2.jpg" \
  -F "prompt=The person in image 2 adopts the pose from image 1" \
  -F "aspectRatio=16:9" \
  -F "outputFormat=png"
```

#### Paramètres

| Paramètre | Type | Requis | Défaut | Description |
|-----------|------|--------|--------|-------------|
| `prompt` | string | ✅ | - | Instructions d'édition |
| `imageUrls` | array | ✅* | - | URLs des images (*si pas de fichiers) |
| `images` | files | ✅* | - | Fichiers images (*si pas d'URLs) |
| `aspectRatio` | string | ❌ | "match_input_image" | 1:1, 16:9, 9:16, 4:3, 3:4, match_input_image |
| `goFast` | boolean | ❌ | true | Mode rapide (sacrifie qualité) |
| `seed` | number | ❌ | null | Reproductibilité |
| `outputFormat` | string | ❌ | "webp" | webp, jpg, png |
| `outputQuality` | number | ❌ | 95 | Qualité 0-100 |
| `disableSafetyChecker` | boolean | ❌ | false | Désactiver le filtre de sécurité |

#### Réponse

```json
{
  "success": true,
  "imageUrls": [
    "https://replicate.delivery/.../output_0.webp"
  ],
  "mock": false,
  "params": {
    "prompt": "Replace the background with a beach sunset",
    "imagesCount": 1,
    "aspectRatio": "match_input_image",
    "goFast": true,
    "outputFormat": "webp"
  }
}
```

### 2. POST `/api/edit/single-image`

Édite une seule image (version simplifiée).

#### Requête

```json
{
  "prompt": "Transform into watercolor painting",
  "imageUrl": "https://example.com/photo.jpg",
  "aspectRatio": "1:1",
  "outputFormat": "png"
}
```

Ou avec upload :

```bash
curl -X POST http://localhost:3000/api/edit/single-image \
  -F "image=@photo.jpg" \
  -F "prompt=Make it look like a Van Gogh painting"
```

### 3. POST `/api/edit/transfer-pose`

Transfère la pose d'une image à une personne dans une autre image.

#### Requête (JSON)

```json
{
  "poseSourceUrl": "https://example.com/pose.jpg",
  "targetPersonUrl": "https://example.com/person.jpg",
  "aspectRatio": "16:9",
  "outputFormat": "webp"
}
```

#### Requête (Multipart)

```bash
curl -X POST http://localhost:3000/api/edit/transfer-pose \
  -F "poseSource=@yoga_pose.jpg" \
  -F "targetPerson=@person.jpg" \
  -F "aspectRatio=1:1"
```

**Prompt automatique** : `"The person in image 2 adopts the pose from image 1"`

### 4. POST `/api/edit/transfer-style`

Applique le style artistique d'une image à une autre.

#### Requête (JSON)

```json
{
  "styleSourceUrl": "https://example.com/painting.jpg",
  "targetImageUrl": "https://example.com/photo.jpg",
  "aspectRatio": "match_input_image",
  "outputFormat": "png"
}
```

#### Requête (Multipart)

```bash
curl -X POST http://localhost:3000/api/edit/transfer-style \
  -F "styleSource=@van_gogh.jpg" \
  -F "targetImage=@my_photo.jpg"
```

**Prompt automatique** : `"Apply the artistic style from image 1 to image 2"`

### 5. GET `/api/edit/status`

Vérifie le statut du service.

#### Réponse

```json
{
  "success": true,
  "configured": true,
  "service": "qwen-image-edit-plus",
  "capabilities": {
    "editImage": true,
    "editSingleImage": true,
    "transferPose": true,
    "transferStyle": true,
    "multipleImages": true
  },
  "message": "Service d'édition d'images opérationnel"
}
```

### 6. GET `/api/edit/examples`

Retourne des exemples de prompts.

#### Réponse

```json
{
  "success": true,
  "examples": {
    "background_replacement": {
      "description": "Remplacer l'arrière-plan",
      "prompt": "Replace the background with a mountain landscape at sunset",
      "imagesNeeded": 1
    },
    "object_modification": {
      "description": "Modifier un objet",
      "prompt": "Change the car color to red",
      "imagesNeeded": 1
    },
    "style_transfer": {
      "description": "Transférer le style artistique",
      "prompt": "Apply the artistic style from image 1 to image 2",
      "imagesNeeded": 2
    },
    "pose_transfer": {
      "description": "Transférer la pose",
      "prompt": "The person in image 2 adopts the pose from image 1",
      "imagesNeeded": 2
    }
  }
}
```

## 🧪 Tests avec curl

### Test 1 : Édition simple avec URL

```bash
curl -X POST http://localhost:3000/api/edit/single-image \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Transform into a watercolor painting",
    "imageUrl": "https://images.unsplash.com/photo-1506748686214-e9df14d4d9d0"
  }'
```

### Test 2 : Édition avec upload de fichier

```bash
curl -X POST http://localhost:3000/api/edit/single-image \
  -F "image=@/path/to/your/photo.jpg" \
  -F "prompt=Change the background to a beach sunset" \
  -F "outputFormat=png"
```

### Test 3 : Transfert de pose avec 2 images

```bash
curl -X POST http://localhost:3000/api/edit/image \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "The person in image 2 adopts the pose from image 1",
    "imageUrls": [
      "https://example.com/yoga_pose.jpg",
      "https://example.com/person.jpg"
    ],
    "aspectRatio": "1:1"
  }'
```

### Test 4 : Transfert de style

```bash
curl -X POST http://localhost:3000/api/edit/transfer-style \
  -F "styleSource=@van_gogh_starry_night.jpg" \
  -F "targetImage=@my_photo.jpg" \
  -F "outputFormat=png"
```

### Test 5 : Édition avancée avec tous les paramètres

```bash
curl -X POST http://localhost:3000/api/edit/image \
  -F "images=@photo1.jpg" \
  -F "images=@photo2.jpg" \
  -F "prompt=Combine the lighting from image 1 with the subject from image 2" \
  -F "aspectRatio=16:9" \
  -F "goFast=false" \
  -F "outputFormat=png" \
  -F "outputQuality=100" \
  -F "seed=42"
```

## 💡 Guide d'utilisation

### Prompts efficaces

#### 🎯 Prompts pour 1 image

```javascript
// Modification d'arrière-plan
"Replace the background with [description]"

// Transformation stylistique
"Transform into [style] style"
"Make it look like a [artist] painting"

// Ajustements d'éclairage
"Improve the lighting to make it look like golden hour"
"Add dramatic lighting"

// Modifications d'objets
"Change the [object] color to [color]"
"Remove the [object] from the scene"
```

#### 🎯 Prompts pour 2+ images

```javascript
// Transfert de pose (IMPORTANT: référencer par numéros)
"The person in image 2 adopts the pose from image 1"

// Transfert de style
"Apply the artistic style from image 1 to image 2"

// Fusion d'éléments
"Combine the lighting from image 1 with the subject from image 2"
"Merge the background from image 1 with the foreground from image 2"
```

### Aspect Ratios

| Ratio | Usage recommandé |
|-------|------------------|
| `1:1` | Posts Instagram, avatars |
| `16:9` | Bannières, YouTube, desktop |
| `9:16` | Stories verticales, mobile |
| `4:3` | Photo classique |
| `3:4` | Portrait vertical |
| `match_input_image` | Conserver proportions originales |

### Go Fast Mode

- **`goFast: true`** (défaut)
  - ⚡ Génération rapide (30-60s)
  - 👍 Qualité acceptable
  - 💰 Moins coûteux
  - ✅ Recommandé pour tests/prototypes

- **`goFast: false`**
  - 🐌 Plus lent (1-3 minutes)
  - ⭐ Meilleure qualité
  - 💸 Plus coûteux
  - ✅ Recommandé pour production

### Output Formats

| Format | Avantages | Inconvénients |
|--------|-----------|---------------|
| `webp` | Petit fichier, bonne qualité | Support navigateur limité |
| `png` | Qualité maximale, transparence | Fichiers lourds |
| `jpg` | Compatibilité universelle | Pas de transparence |

## 📊 Architecture

```
backend/
├── services/
│   └── imageEditor.js          # Service principal
│       ├── editImage()          # Édition avec 1+ images
│       ├── editSingleImage()    # Raccourci pour 1 image
│       ├── transferPose()       # Transfert de pose
│       ├── transferStyle()      # Transfert de style
│       └── validateEditParams() # Validation
├── routes/
│   └── edit.js                  # Routes API
└── references_API/
    └── qwen-image-edit-plus.json # Documentation du modèle
```

## ⚠️ Gestion des erreurs

### Erreurs communes

| Code | Erreur | Solution |
|------|--------|----------|
| 400 | Prompt manquant | Fournir un prompt non vide |
| 400 | Image manquante | Fournir au moins 1 image |
| 400 | Type fichier invalide | Utiliser JPEG, PNG, GIF ou WebP |
| 413 | Fichier trop lourd | Max 10MB par fichier |
| 500 | Erreur Replicate | Vérifier logs serveur |

### Format des erreurs

```json
{
  "success": false,
  "error": "Message d'erreur utilisateur",
  "details": "Stack trace (dev only)"
}
```

## 🔒 Sécurité

### Safety Checker

Par défaut, le modèle inclut un filtre de sécurité qui bloque :
- Contenu violent
- Contenu sexuellement explicite
- Contenu offensant

**Désactiver** (si nécessaire) :
```json
{
  "disableSafetyChecker": true
}
```

### Limites d'upload

- **Taille max par fichier** : 10MB
- **Nombre max de fichiers** : 5 images
- **Formats acceptés** : JPEG, PNG, GIF, WebP

## 🎯 Cas d'usage

### 1. Édition simple (1 image)

**Workflow** : Upload image → Prompt → Éditer

```javascript
// Exemple : Changer l'arrière-plan
POST /api/edit/single-image
{
  "imageUrl": "photo.jpg",
  "prompt": "Replace background with Paris Eiffel Tower"
}
```

### 2. Transfert de pose (2 images)

**Workflow** : Upload 2 images → Transfert automatique

```javascript
POST /api/edit/transfer-pose
{
  "poseSourceUrl": "yoga_pose.jpg",
  "targetPersonUrl": "person.jpg"
}
// Résultat : La personne adopte la pose de yoga
```

### 3. Transfert de style (2 images)

**Workflow** : Upload référence style + photo → Transformation

```javascript
POST /api/edit/transfer-style
{
  "styleSourceUrl": "van_gogh.jpg",
  "targetImageUrl": "my_photo.jpg"
}
// Résultat : Photo avec style Van Gogh
```

### 4. Fusion d'images (2+ images)

**Workflow** : Upload plusieurs images → Prompt de fusion → Éditer

```javascript
POST /api/edit/image
{
  "imageUrls": ["lighting.jpg", "subject.jpg"],
  "prompt": "Combine lighting from image 1 with subject from image 2"
}
```

## 🔧 Configuration

### Variables d'environnement

```env
REPLICATE_API_TOKEN=votre_token_replicate
PORT=3000
NODE_ENV=development
```

### Mode Mock

Si `REPLICATE_API_TOKEN` n'est pas configuré :
- Service fonctionne en mode simulation
- Retourne des images placeholder
- Utile pour développement frontend

## 🚀 Intégration Frontend

### Exemple Vue.js avec Axios

```javascript
// Édition simple
async function editImage(imageFile, prompt) {
  const formData = new FormData();
  formData.append('image', imageFile);
  formData.append('prompt', prompt);
  formData.append('outputFormat', 'png');
  
  const response = await api.post('/edit/single-image', formData);
  return response.data.imageUrls[0];
}

// Transfert de pose
async function transferPose(poseFile, personFile) {
  const formData = new FormData();
  formData.append('poseSource', poseFile);
  formData.append('targetPerson', personFile);
  
  const response = await api.post('/edit/transfer-pose', formData);
  return response.data.imageUrls[0];
}

// Édition avec URLs
async function editWithUrls(imageUrls, prompt) {
  const response = await api.post('/edit/image', {
    prompt: prompt,
    imageUrls: imageUrls,
    goFast: true,
    outputFormat: 'webp'
  });
  return response.data.imageUrls;
}
```

## 📊 Performance

| Mode | Temps | Qualité | Coût |
|------|-------|---------|------|
| Fast (go_fast: true) | 30-60s | Bonne | $ |
| Quality (go_fast: false) | 1-3 min | Excellente | $$ |

## 📝 Bonnes pratiques

1. **Prompts clairs et précis** 
   - ❌ "change it"
   - ✅ "Replace the background with a beach sunset scene"

2. **Référencer les images par numéro**
   - ❌ "mix them"
   - ✅ "The person in image 2 adopts the pose from image 1"

3. **Utiliser go_fast pour tests**
   - Tests/développement : `goFast: true`
   - Production finale : `goFast: false`

4. **Choisir le bon aspect ratio**
   - Conserver proportions : `match_input_image`
   - Adapter format : choisir ratio spécifique

5. **Seed pour reproductibilité**
   - A/B testing : utiliser même seed
   - Production : laisser null (aléatoire)

6. **Format de sortie adapté**
   - Web moderne : `webp`
   - Qualité max : `png`
   - Compatibilité : `jpg`

## 🎉 Résultat

Service complet d'édition d'images avec :
- ✅ 6 endpoints fonctionnels
- ✅ Support multipart et JSON
- ✅ Validation robuste
- ✅ Mode mock intégré
- ✅ Exemples de prompts
- ✅ 4 fonctions spécialisées
- ✅ Documentation complète
- ✅ Prêt pour intégration frontend

## 🔗 Ressources

- [Documentation Qwen Image Edit Plus](https://replicate.com/qwen/qwen-image-edit-plus)
- [Schéma API complet](../references_API/qwen-image-edit-plus.json)
- [Replicate Documentation](https://replicate.com/docs)
