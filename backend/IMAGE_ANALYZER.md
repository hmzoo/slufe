# Service d'analyse d'images avec LLaVA-13B

## Description
Ce service utilise le modèle **LLaVA-13B** (Large Language and Vision Assistant) via l'API Replicate pour analyser et décrire automatiquement le contenu d'images.

## Modèle utilisé
- **Nom**: `yorickvp/llava-13b`
- **Version**: `a0fdc44e4f2e1f20f2bb4e27846899953ac8e66c5886c5878fa1d6b73ce009e5`
- **Capacités**: Analyse d'images, description détaillée, compréhension visuelle

## Configuration

### Prérequis
Le service utilise la même clé API Replicate que le service promptEnhancer.

Dans `backend/.env` :
```env
REPLICATE_API_TOKEN=r8_votre_token_ici
```

## Utilisation

### Endpoint 1: POST /api/images/analyze
Analyse des images via URLs.

**Requête:**
```bash
curl -X POST http://localhost:3000/api/images/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "images": [
      "https://example.com/image1.jpg",
      "https://example.com/image2.jpg"
    ],
    "prompt": "Give a detailed description of this image."
  }'
```

**Paramètres:**
- `images` (Array<string>, requis) - Tableau d'URLs d'images (max 10)
- `prompt` (string, optionnel) - Prompt personnalisé pour l'analyse

**Réponse (succès):**
```json
{
  "success": true,
  "results": [
    {
      "url": "https://example.com/image1.jpg",
      "description": "The image shows a beautiful sunset over a calm ocean...",
      "success": true
    },
    {
      "url": "https://example.com/image2.jpg",
      "description": "This image depicts a mountain landscape with...",
      "success": true
    }
  ],
  "stats": {
    "total": 2,
    "success": 2,
    "failed": 0
  },
  "mock": false
}
```

**Réponse (mode mock):**
```json
{
  "success": true,
  "results": [
    {
      "url": "https://example.com/image1.jpg",
      "description": "Mock description for image 1: This is a sample description...",
      "success": true,
      "mock": true
    }
  ],
  "mock": true,
  "message": "Réponses mock - Configurez REPLICATE_API_TOKEN"
}
```

### Endpoint 2: POST /api/images/analyze-upload
Analyse des images uploadées (fichiers multipart).

**Requête:**
```bash
curl -X POST http://localhost:3000/api/images/analyze-upload \
  -F "images=@/path/to/image1.jpg" \
  -F "images=@/path/to/image2.jpg" \
  -F "prompt=Describe what you see in this image"
```

**Paramètres:**
- `images` (files[], requis) - Fichiers images (max 10, 10MB chacun)
- `prompt` (string, optionnel) - Prompt personnalisé

**Réponse:**
```json
{
  "success": true,
  "results": [
    {
      "filename": "image1.jpg",
      "description": "The image contains...",
      "success": true
    },
    {
      "filename": "image2.jpg",
      "description": "This photograph shows...",
      "success": true
    }
  ],
  "stats": {
    "total": 2,
    "success": 2,
    "failed": 0
  },
  "mock": false
}
```

### Endpoint 3: GET /api/images/status
Vérifie le statut du service.

**Réponse:**
```json
{
  "success": true,
  "service": "imageAnalyzer",
  "configured": true,
  "model": "yorickvp/llava-13b",
  "status": "ready",
  "message": "Service d'analyse d'images opérationnel"
}
```

## Structure du code

### services/imageAnalyzer.js
Service principal d'analyse d'images:
- `analyzeImage(imageUrl, customPrompt)` - Analyse une seule image
- `analyzeImages(imageUrls, customPrompt)` - Analyse plusieurs images en parallèle
- `urlToBase64(url)` - Convertit une URL en data URI base64
- `isReplicateConfigured()` - Vérifie la configuration

### routes/images.js
Routes Express:
- `POST /api/images/analyze` - Analyse via URLs
- `POST /api/images/analyze-upload` - Analyse via upload
- `GET /api/images/status` - Statut du service

## Paramètres du modèle LLaVA-13B

```javascript
{
  image: "data:image/jpeg;base64,...",  // Image en base64
  prompt: "Give a description...",       // Instruction
  top_p: 1,                              // Nucleus sampling
  max_tokens: 1024,                      // Longueur max réponse
  temperature: 0.2                       // Créativité (0-1)
}
```

## Gestion des erreurs

Le service gère:
- ✅ Token API manquant → Mode mock
- ✅ Tableau d'images vide → Erreur 400
- ✅ Plus de 10 images → Erreur 400
- ✅ Erreur de téléchargement d'image → Marqué comme échec
- ✅ Erreur Replicate → Erreur 500
- ✅ Analyse partielle → Retourne succès ET échecs

## Mode développement (Mock)

Sans `REPLICATE_API_TOKEN`, le service retourne des descriptions génériques:

```json
{
  "description": "Mock description for image 1: This is a sample description...",
  "mock": true
}
```

## Exemples d'utilisation

### JavaScript/Fetch

```javascript
async function analyzeImages(imageUrls) {
  const response = await fetch('http://localhost:3000/api/images/analyze', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      images: imageUrls,
      prompt: 'Describe this image in detail'
    }),
  });
  
  const data = await response.json();
  
  if (data.success) {
    data.results.forEach(result => {
      console.log(`${result.url}:`, result.description);
    });
  }
}
```

### Axios

```javascript
import axios from 'axios';

const result = await axios.post('http://localhost:3000/api/images/analyze', {
  images: [
    'https://example.com/photo1.jpg',
    'https://example.com/photo2.jpg'
  ]
});

console.log(result.data.results);
```

### Upload de fichiers

```javascript
const formData = new FormData();
formData.append('images', file1);
formData.append('images', file2);
formData.append('prompt', 'Describe what you see');

const response = await fetch('http://localhost:3000/api/images/analyze-upload', {
  method: 'POST',
  body: formData,
});

const data = await response.json();
```

## Intégration frontend

### Ajouter des tooltips avec descriptions

Dans `frontend/src/components/ImageUploader.vue`:

```vue
<template>
  <q-img :src="image.url">
    <q-tooltip v-if="image.description">
      {{ image.description }}
    </q-tooltip>
  </q-img>
</template>

<script setup>
// Après l'upload, analyser les images
async function analyzeUploadedImages() {
  const imageUrls = images.value.map(img => img.url);
  
  const response = await api.post('/images/analyze', {
    images: imageUrls
  });
  
  if (response.data.success) {
    response.data.results.forEach((result, index) => {
      if (result.success) {
        images.value[index].description = result.description;
      }
    });
  }
}
</script>
```

### Dans le store Pinia

```javascript
// stores/useMainStore.js
async function analyzeImages() {
  const imageUrls = images.value.map(img => img.url);
  
  try {
    const response = await api.post('/images/analyze', { images: imageUrls });
    
    if (response.data.success) {
      response.data.results.forEach((result, index) => {
        if (result.success && images.value[index]) {
          images.value[index].description = result.description;
        }
      });
    }
  } catch (error) {
    console.error('Erreur analyse:', error);
  }
}
```

## Performances

- **Analyse parallèle**: Toutes les images sont analysées simultanément
- **Timeout**: 30 secondes par image par défaut
- **Limite**: Maximum 10 images par requête
- **Taille**: Maximum 10MB par image

## Coûts

Le modèle LLaVA-13B sur Replicate facture à l'utilisation:
- Consultez [replicate.com/pricing](https://replicate.com/pricing)
- Utilisez le mode mock pour le développement
- Cache les descriptions pour éviter les analyses répétées

## Tests

### Script de test automatique

```bash
cd backend
./test-image-analyzer.sh
```

### Tests manuels

```bash
# Statut
curl http://localhost:3000/api/images/status | jq

# Analyse d'une image
curl -X POST http://localhost:3000/api/images/analyze \
  -H "Content-Type: application/json" \
  -d '{"images": ["https://picsum.photos/400/300"]}' | jq

# Upload
curl -X POST http://localhost:3000/api/images/analyze-upload \
  -F "images=@photo.jpg" | jq
```

## Limites

- Maximum 10 images par requête
- Taille maximale: 10MB par image
- Formats supportés: JPEG, PNG, GIF, WebP
- Rate limiting selon votre plan Replicate

## Dépannage

### "REPLICATE_API_TOKEN non configuré"
→ Ajoutez votre token dans `backend/.env`

### "Failed to download image"
→ Vérifiez que l'URL est accessible et publique

### Descriptions incomplètes
→ Augmentez `max_tokens` dans le service

### Timeout
→ Réduisez le nombre d'images ou analysez-les en plusieurs fois

## Prompts personnalisés

Exemples de prompts utiles:

```javascript
// Description générale
"Describe this image in detail."

// Focus sur les couleurs
"What colors are present in this image?"

// Composition
"Describe the composition and layout of this image."

// Objets
"List all objects visible in this image."

// Ambiance
"Describe the mood and atmosphere of this image."

// Technique
"Describe the photographic style and technique used."
```

## Exemple complet

```javascript
// Analyser plusieurs images avec prompt personnalisé
const images = [
  'https://example.com/photo1.jpg',
  'https://example.com/photo2.jpg',
  'https://example.com/photo3.jpg'
];

const result = await fetch('http://localhost:3000/api/images/analyze', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    images: images,
    prompt: 'Describe the main subject and setting of this image.'
  })
});

const data = await result.json();

// Afficher les résultats
data.results.forEach(img => {
  if (img.success) {
    console.log(`✅ ${img.url}`);
    console.log(`   ${img.description}\n`);
  } else {
    console.log(`❌ ${img.url}: ${img.error}\n`);
  }
});

// Statistiques
console.log(`Total: ${data.stats.total}`);
console.log(`Succès: ${data.stats.success}`);
console.log(`Échecs: ${data.stats.failed}`);
```
