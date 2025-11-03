# Service de Génération d'Images - Qwen-Image

Service backend pour la génération d'images avec le modèle Qwen-Image de Replicate.

## 📋 Vue d'ensemble

Le service offre deux pipelines :
1. **Text-to-Image** : Génération d'images à partir de texte
2. **Img-to-Img** : Transformation d'images existantes

## 🚀 Endpoints

### 1. POST `/api/generate/text-to-image`

Génère une image à partir d'un prompt textuel.

#### Requête

```json
{
  "prompt": "A beautiful sunset over mountains",
  "negativePrompt": "blurry, low quality",
  "guidance": 3,
  "numInferenceSteps": 30,
  "aspectRatio": "16:9",
  "imageSize": "optimize_for_quality",
  "outputFormat": "png",
  "outputQuality": 90,
  "enhancePrompt": false,
  "seed": null
}
```

#### Paramètres

| Paramètre | Type | Requis | Défaut | Description |
|-----------|------|--------|--------|-------------|
| `prompt` | string | ✅ | - | Description de l'image à générer |
| `negativePrompt` | string | ❌ | "blurry, low quality..." | Ce qu'on ne veut PAS |
| `guidance` | number | ❌ | 3 | Fidélité au prompt (0-10) |
| `numInferenceSteps` | number | ❌ | 30 | Qualité (1-50) |
| `aspectRatio` | string | ❌ | "16:9" | 1:1, 16:9, 9:16, 4:3, 3:4, 3:2, 2:3 |
| `imageSize` | string | ❌ | "optimize_for_quality" | optimize_for_quality ou optimize_for_speed |
| `outputFormat` | string | ❌ | "png" | png, jpg, webp |
| `outputQuality` | number | ❌ | 90 | Qualité 0-100 |
| `enhancePrompt` | boolean | ❌ | false | Amélioration auto du prompt |
| `seed` | number | ❌ | null | Reproductibilité |

#### Réponse

```json
{
  "success": true,
  "imageUrl": "https://replicate.delivery/.../output.png",
  "mock": false,
  "params": {
    "prompt": "A beautiful sunset over mountains",
    "guidance": 3,
    "numInferenceSteps": 30,
    "aspectRatio": "16:9"
  }
}
```

### 2. POST `/api/generate/img-to-img`

Transforme une image existante avec un prompt.

#### Requête

```json
{
  "imageUrl": "https://example.com/image.jpg",
  "prompt": "Transform into watercolor painting style",
  "strength": 0.7,
  "negativePrompt": "blurry, distorted",
  "guidance": 3.5,
  "numInferenceSteps": 35,
  "outputFormat": "png"
}
```

#### Paramètres

| Paramètre | Type | Requis | Défaut | Description |
|-----------|------|--------|--------|-------------|
| `imageUrl` | string | ✅ | - | URL de l'image source |
| `prompt` | string | ✅ | - | Transformation à appliquer |
| `strength` | number | ❌ | 0.7 | Intensité (0-1) |
| `negativePrompt` | string | ❌ | "blurry..." | Ce qu'on ne veut PAS |
| `guidance` | number | ❌ | 3.5 | Fidélité au prompt |
| `numInferenceSteps` | number | ❌ | 35 | Qualité |
| `outputFormat` | string | ❌ | "png" | Format de sortie |

#### Réponse

```json
{
  "success": true,
  "imageUrl": "https://replicate.delivery/.../transformed.png",
  "originalImageUrl": "https://example.com/image.jpg",
  "mock": false,
  "params": {
    "prompt": "Transform into watercolor painting style",
    "strength": 0.7,
    "guidance": 3.5
  }
}
```

### 3. GET `/api/generate/status`

Vérifie si le service est configuré.

#### Réponse

```json
{
  "success": true,
  "configured": true,
  "service": "qwen-image",
  "capabilities": {
    "textToImage": true,
    "imgToImg": true
  },
  "message": "Service de génération d'images opérationnel"
}
```

### 4. GET `/api/generate/presets`

Retourne des configurations prédéfinies.

#### Réponse

```json
{
  "success": true,
  "presets": {
    "fast": {
      "name": "Rapide",
      "description": "Génération rapide avec qualité acceptable",
      "params": {
        "guidance": 3,
        "numInferenceSteps": 20,
        "imageSize": "optimize_for_speed"
      }
    },
    "balanced": { ... },
    "quality": { ... },
    "portrait": { ... },
    "landscape": { ... }
  }
}
```

## 🧪 Tests avec curl

### Text-to-Image basique
```bash
curl -X POST http://localhost:3000/api/generate/text-to-image \
  -H "Content-Type: application/json" \
  -d '{"prompt":"A majestic cat wearing a crown"}'
```

### Text-to-Image avancé
```bash
curl -X POST http://localhost:3000/api/generate/text-to-image \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Professional product photo of a luxury watch",
    "negativePrompt": "blurry, low quality, distorted",
    "guidance": 4,
    "numInferenceSteps": 50,
    "aspectRatio": "1:1",
    "outputFormat": "png",
    "outputQuality": 100
  }'
```

### Img-to-Img
```bash
curl -X POST http://localhost:3000/api/generate/img-to-img \
  -H "Content-Type: application/json" \
  -d '{
    "imageUrl": "https://example.com/photo.jpg",
    "prompt": "Transform into a watercolor painting",
    "strength": 0.7
  }'
```

### Vérifier le status
```bash
curl http://localhost:3000/api/generate/status
```

### Obtenir les presets
```bash
curl http://localhost:3000/api/generate/presets
```

## 💡 Guide d'utilisation

### Guidance Scale
- **2-2.5** : Plus réaliste, moins fidèle au prompt
- **3-3.5** : Bon équilibre (recommandé)
- **4-10** : Plus artistique, très fidèle au prompt

### Num Inference Steps
- **20-30** : Rapide, qualité correcte
- **30-40** : Bon compromis
- **40-50** : Meilleure qualité, plus lent

### Strength (img2img)
- **0.1-0.3** : Modifications subtiles
- **0.4-0.7** : Transformation modérée
- **0.8-1.0** : Transformation importante

### Aspect Ratios
- **1:1** : Posts sociaux carrés
- **16:9** : Bannières, YouTube
- **9:16** : Stories verticales
- **3:4** : Portraits
- **4:3** : Classique

## 🔧 Configuration

### Variables d'environnement

```env
REPLICATE_API_TOKEN=votre_token_replicate
```

### Mode Mock

Si `REPLICATE_API_TOKEN` n'est pas configuré, le service fonctionne en mode mock et retourne des images placeholder.

## 📚 Architecture

```
backend/
├── services/
│   └── imageGenerator.js      # Service principal
├── routes/
│   └── generate.js             # Routes API
└── references_API/
    └── qwen-image.json         # Documentation du modèle
```

## ⚠️ Gestion des erreurs

Le service retourne des erreurs au format :

```json
{
  "success": false,
  "error": "Description de l'erreur",
  "details": "Détails techniques"
}
```

### Codes d'erreur HTTP
- **400** : Paramètres invalides
- **500** : Erreur serveur / Replicate

## 🎯 Bonnes pratiques

1. **Toujours utiliser `negativePrompt`** pour éviter les défauts
2. **Commencer avec guidance=3** et ajuster selon besoin
3. **Tester en rapide** (steps=20) puis produire en qualité
4. **Utiliser `seed`** pour reproductibilité des tests
5. **Choisir le bon `aspectRatio`** selon l'usage final

## 📊 Exemples de prompts

### Produit
```
"Professional product photo of [product], studio lighting, clean white background, highly detailed"
```

### Portrait
```
"Portrait of [subject], natural lighting, soft focus background, professional photography"
```

### Paysage
```
"Cinematic landscape of [scene], golden hour lighting, wide angle, highly detailed"
```

### Artistique
```
"[Subject] in the style of [artist/style], vibrant colors, dramatic composition"
```

## 🔗 Ressources

- [Documentation Qwen-Image](https://replicate.com/qwen/qwen-image)
- [Schéma API complet](./references_API/qwen-image.json)
- [Replicate Documentation](https://replicate.com/docs)
