# 🎉 Service imageAnalyzer Ajouté avec Succès !

## ✅ Ce qui a été créé

### Nouveaux fichiers (4)

1. **`backend/services/imageAnalyzer.js`**
   - Service d'analyse d'images avec LLaVA-13B
   - `analyzeImage(url, prompt)` - Analyse une image
   - `analyzeImages(urls, prompt)` - Analyse multiple en parallèle
   - `urlToBase64(url)` - Conversion URL → base64
   - Gestion d'erreurs complète

2. **`backend/routes/images.js`**
   - `POST /api/images/analyze` - Analyse via URLs
   - `POST /api/images/analyze-upload` - Analyse via fichiers uploadés
   - `GET /api/images/status` - Statut du service
   - Mode mock si token non configuré

3. **`backend/IMAGE_ANALYZER.md`**
   - Documentation complète du service
   - Exemples d'utilisation
   - Guide d'intégration frontend
   - Troubleshooting

4. **`backend/test-image-analyzer.sh`**
   - Script de test automatique
   - Tests des 3 endpoints
   - Validation des erreurs

### Fichiers modifiés (2)

1. **`backend/package.json`**
   - Ajout de `node-fetch` pour le téléchargement d'images

2. **`backend/server.js`**
   - Import et montage de la route `/api/images`

## 🚀 Utilisation

### 1. Configuration (même token que promptEnhancer)

Le service utilise le même `REPLICATE_API_TOKEN` déjà configuré dans `.env`.

### 2. Démarrer le serveur

```bash
cd /home/hmj/Documents/projets/slufe
npm run dev
```

### 3. Tester le service

**Option 1: Script de test**
```bash
cd backend
./test-image-analyzer.sh
```

**Option 2: Tests manuels**
```bash
# Vérifier le statut
curl http://localhost:3000/api/images/status | jq

# Analyser des images (URLs publiques)
curl -X POST http://localhost:3000/api/images/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "images": [
      "https://picsum.photos/400/300",
      "https://picsum.photos/seed/sunset/400/300"
    ]
  }' | jq

# Analyser avec prompt personnalisé
curl -X POST http://localhost:3000/api/images/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "images": ["https://picsum.photos/seed/mountain/400/300"],
    "prompt": "Describe the colors and composition of this image."
  }' | jq

# Upload de fichiers
curl -X POST http://localhost:3000/api/images/analyze-upload \
  -F "images=@photo1.jpg" \
  -F "images=@photo2.jpg" | jq
```

## 📡 Endpoints disponibles

### 1. GET /api/images/status
Vérifier le statut du service.

```json
{
  "success": true,
  "service": "imageAnalyzer",
  "configured": true,
  "model": "yorickvp/llava-13b",
  "status": "ready"
}
```

### 2. POST /api/images/analyze
Analyser des images via URLs.

**Requête:**
```json
{
  "images": ["url1", "url2", "..."],
  "prompt": "Optional custom prompt"
}
```

**Réponse:**
```json
{
  "success": true,
  "results": [
    {
      "url": "url1",
      "description": "The image shows...",
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

### 3. POST /api/images/analyze-upload
Analyser des fichiers uploadés.

**Requête:** multipart/form-data avec champ `images` (fichiers)

**Réponse:**
```json
{
  "success": true,
  "results": [
    {
      "filename": "photo.jpg",
      "description": "This image contains...",
      "success": true
    }
  ],
  "stats": { ... }
}
```

## 🎯 Fonctionnalités

- ✅ Analyse d'images via URLs
- ✅ Analyse de fichiers uploadés
- ✅ Prompts personnalisés
- ✅ Analyse parallèle (multiple images)
- ✅ Conversion automatique URL → base64
- ✅ Mode mock pour développement
- ✅ Gestion d'erreurs par image
- ✅ Statistiques de succès/échec
- ✅ Validation des entrées
- ✅ Limite de taille et nombre

## 🔗 Intégration Frontend

### Option 1: Tooltip sur les images

Dans `frontend/src/components/ImageUploader.vue`:

```vue
<template>
  <q-img :src="image.url" :ratio="1">
    <!-- Bouton pour analyser -->
    <div class="absolute-top-right q-pa-xs">
      <q-btn
        round
        dense
        color="info"
        icon="analytics"
        size="sm"
        @click="analyzeImage(image.id)"
        :loading="image.analyzing"
      >
        <q-tooltip>Analyser l'image</q-tooltip>
      </q-btn>
    </div>
    
    <!-- Afficher la description en tooltip -->
    <q-tooltip v-if="image.description" max-width="300px">
      {{ image.description }}
    </q-tooltip>
  </q-img>
</template>

<script setup>
import { api } from 'src/boot/axios';

async function analyzeImage(imageId) {
  const image = images.value.find(img => img.id === imageId);
  if (!image) return;
  
  image.analyzing = true;
  
  try {
    const response = await api.post('/images/analyze', {
      images: [image.url]
    });
    
    if (response.data.success && response.data.results[0]) {
      image.description = response.data.results[0].description;
      
      $q.notify({
        type: 'positive',
        message: 'Image analysée avec succès',
      });
    }
  } catch (error) {
    console.error('Erreur analyse:', error);
    $q.notify({
      type: 'negative',
      message: 'Erreur lors de l\'analyse',
    });
  } finally {
    image.analyzing = false;
  }
}
</script>
```

### Option 2: Analyser toutes les images automatiquement

Dans le store Pinia `frontend/src/stores/useMainStore.js`:

```javascript
// Ajouter au state
const imageDescriptions = ref({});

// Ajouter une action
async function analyzeAllImages() {
  if (images.value.length === 0) return;
  
  loading.value = true;
  
  try {
    const imageUrls = images.value.map(img => img.url);
    
    const response = await api.post('/images/analyze', {
      images: imageUrls,
      prompt: 'Describe this image briefly'
    });
    
    if (response.data.success) {
      response.data.results.forEach((result, index) => {
        if (result.success) {
          images.value[index].description = result.description;
        }
      });
      
      return response.data.stats;
    }
  } catch (error) {
    console.error('Erreur:', error);
    throw error;
  } finally {
    loading.value = false;
  }
}

// Exporter
return {
  // ... état existant
  analyzeAllImages,
};
```

### Option 3: Bouton "Analyser les images"

Dans `frontend/src/pages/HomePage.vue`:

```vue
<template>
  <q-btn
    color="secondary"
    label="Analyser les images"
    icon="psychology"
    @click="analyzeImages"
    :loading="analyzingImages"
    :disable="imageCount === 0"
    class="q-mt-md"
  />
</template>

<script setup>
const analyzingImages = ref(false);

async function analyzeImages() {
  analyzingImages.value = true;
  
  try {
    const stats = await store.analyzeAllImages();
    
    $q.notify({
      type: 'positive',
      message: `${stats.success}/${stats.total} images analysées`,
      caption: 'Survolez les images pour voir les descriptions',
    });
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: 'Erreur lors de l\'analyse',
    });
  } finally {
    analyzingImages.value = false;
  }
}
</script>
```

## 📊 Architecture complète

```
backend/
├── services/
│   ├── promptEnhancer.js      ← Amélioration prompts (Gemini)
│   └── imageAnalyzer.js       ← Analyse images (LLaVA) ✨ NEW
├── routes/
│   ├── ai.js                  ← Routes génération
│   ├── prompt.js              ← Routes amélioration
│   └── images.js              ← Routes analyse ✨ NEW
├── server.js                  ← Mis à jour
├── IMAGE_ANALYZER.md          ← Documentation ✨ NEW
└── test-image-analyzer.sh     ← Tests ✨ NEW
```

## ✨ Services disponibles

### 1. Service de génération (ai.js)
- `POST /api/prompt` - Générer image/vidéo (mock)
- `GET /api/status` - Statut général

### 2. Service d'amélioration (prompt.js)
- `POST /api/prompt/enhance` - Améliorer un prompt (Gemini 2.5 Flash)
- `GET /api/prompt/status` - Statut amélioration

### 3. Service d'analyse (images.js) ✨ NEW
- `POST /api/images/analyze` - Analyser images URLs (LLaVA-13B)
- `POST /api/images/analyze-upload` - Analyser fichiers uploadés
- `GET /api/images/status` - Statut analyse

## 🎯 Workflow complet

1. **User uploade des images** → `ImageUploader.vue`
2. **Optionnel: Analyser les images** → `POST /api/images/analyze`
3. **User écrit un prompt** → `PromptInput.vue`
4. **Améliorer le prompt** → `POST /api/prompt/enhance`
5. **Générer le résultat** → `POST /api/prompt`
6. **Afficher le résultat** → `ResultDisplay.vue`

## 🐛 Dépannage

### Le service ne démarre pas
```bash
cd backend
npm install
npm run dev
```

### Tests échouent
```bash
# Vérifier que le serveur tourne
curl http://localhost:3000/api/images/status

# Vérifier les logs du serveur
```

### Mode mock actif
→ Le service fonctionne mais retourne des descriptions génériques.  
→ Configurez `REPLICATE_API_TOKEN` pour activer l'IA réelle.

### "Failed to download image"
→ Vérifiez que l'URL est publique et accessible.

## 📚 Documentation

- **`backend/IMAGE_ANALYZER.md`** - Guide complet du service
- **`backend/PROMPT_ENHANCER.md`** - Service d'amélioration de prompts
- API Replicate: https://replicate.com/docs
- Modèle LLaVA: https://replicate.com/yorickvp/llava-13b

## 💡 Cas d'usage

### 1. Analyse automatique à l'upload
```javascript
// Analyser dès qu'une image est ajoutée
function addImage(file) {
  const imageData = { id, file, url };
  images.value.push(imageData);
  
  // Analyser en arrière-plan
  analyzeImage(imageData.url).then(desc => {
    imageData.description = desc;
  });
}
```

### 2. Amélioration du prompt basée sur les images
```javascript
// Utiliser les descriptions pour enrichir le prompt
async function generateWithContext() {
  // 1. Analyser les images
  const analysis = await analyzeAllImages();
  
  // 2. Créer un prompt enrichi
  const context = analysis.results
    .map(r => r.description)
    .join('. ');
  
  const enrichedPrompt = `Based on these images: ${context}. ${userPrompt}`;
  
  // 3. Générer
  await submitPrompt(enrichedPrompt);
}
```

### 3. Validation des images
```javascript
// Vérifier que les images correspondent au prompt
async function validateImages(prompt) {
  const analysis = await analyzeAllImages();
  
  // Vérifier la cohérence
  const relevantImages = analysis.results.filter(img => {
    return img.description.toLowerCase().includes(prompt.toLowerCase());
  });
  
  if (relevantImages.length === 0) {
    $q.notify({
      type: 'warning',
      message: 'Aucune image ne semble correspondre au prompt',
    });
  }
}
```

## 🎊 Prochaines étapes

1. **Tester le service** avec le script ou manuellement
2. **Intégrer au frontend** (tooltips ou bouton d'analyse)
3. **Personnaliser les prompts** selon vos besoins
4. **Implémenter le workflow complet** (upload → analyse → amélioration → génération)

---

**Le service est prêt à l'emploi ! 🚀**

Deux services IA disponibles:
- 📝 **promptEnhancer** (Gemini 2.5 Flash) - Améliore les prompts
- 🔍 **imageAnalyzer** (LLaVA-13B) - Analyse les images

Mode mock actif par défaut. Configurez `REPLICATE_API_TOKEN` pour l'IA réelle.
