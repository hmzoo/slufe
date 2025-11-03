# 📡 API Endpoints Documentation

> **SLUFE IA Backend API** - Documentation complète des endpoints disponibles

---

## 🌟 Vue d'ensemble

L'API SLUFE IA fournit des services d'intelligence artificielle pour la génération, l'édition et l'analyse d'images et de vidéos. Tous les endpoints sont préfixés par `/api`.

### 🔗 Base URL
```
http://localhost:3000/api
```

### 📋 Groupes d'endpoints
- **[AI Core](#-ai-core)** - Services IA principaux
- **[Prompt Enhancement](#-prompt-enhancement)** - Amélioration des prompts
- **[Image Analysis](#-image-analysis)** - Analyse d'images
- **[Image Generation](#-image-generation)** - Génération d'images
- **[Image Editing](#-image-editing)** - Édition d'images
- **[Video Generation](#-video-generation)** - Génération de vidéos
- **[Video-Image](#-video-image)** - Génération vidéo à partir d'images
- **[Workflow](#-workflow)** - Orchestration de workflows
- **[History](#-history)** - Historique des opérations

---

## 🤖 AI Core

### GET `/status`
Vérifier le statut de l'API

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-11-03T10:30:00.000Z",
  "version": "1.0.0"
}
```

### POST `/prompt`
Traiter un prompt avec images (endpoint principal)

**Content-Type:** `multipart/form-data`

**Parameters:**
- `prompt` (string, required) - Le prompt à traiter
- `images` (files[], optional) - Maximum 10 images (10MB par fichier)

**Response:**
```json
{
  "success": true,
  "type": "image",
  "resultUrl": "https://example.com/result.jpg",
  "message": "Résultat généré pour: \"votre prompt\"",
  "processedImages": 2,
  "timestamp": "2025-11-03T10:30:00.000Z"
}
```

---

## 🎯 Prompt Enhancement

### POST `/prompt/enhance`
Améliorer et optimiser un prompt

**Content-Type:** `application/json`

**Body:**
```json
{
  "prompt": "un chat",
  "style": "réaliste",
  "language": "fr",
  "enhancementLevel": "medium"
}
```

**Response:**
```json
{
  "success": true,
  "originalPrompt": "un chat",
  "enhancedPrompt": "Un chat domestique aux yeux verts, pelage tigré, assis gracieusement, éclairage naturel, style photographique réaliste, haute définition",
  "improvements": ["Ajout de détails visuels", "Spécification du style"],
  "confidence": 0.92,
  "timestamp": "2025-11-03T10:30:00.000Z"
}
```

### GET `/prompt/status`
Statut du service d'amélioration des prompts

---

## 🔍 Image Analysis

### POST `/images/analyze-urls`
Analyser des images depuis des URLs

**Content-Type:** `application/json`

**Body:**
```json
{
  "imageUrls": [
    "https://example.com/image1.jpg",
    "https://example.com/image2.jpg"
  ],
  "analysisType": "comprehensive"
}
```

**Response:**
```json
{
  "success": true,
  "results": [
    {
      "url": "https://example.com/image1.jpg",
      "description": "Un paysage montagneux au coucher du soleil",
      "objects": ["montagne", "ciel", "nuages"],
      "colors": ["orange", "bleu", "violet"],
      "mood": "paisible",
      "confidence": 0.95
    }
  ],
  "totalAnalyzed": 2,
  "timestamp": "2025-11-03T10:30:00.000Z"
}
```

### POST `/images/analyze`
Analyser une image uploadée

**Content-Type:** `multipart/form-data`

**Parameters:**
- `image` (file, required) - Image à analyser (max 10MB)
- `analysisType` (string, optional) - Type d'analyse

### POST `/images/analyze-upload`
Analyser plusieurs images uploadées

**Content-Type:** `multipart/form-data`

**Parameters:**
- `images` (files[], required) - Maximum 10 images
- `analysisType` (string, optional) - Type d'analyse

### GET `/images/status`
Statut du service d'analyse d'images

---

## 🎨 Image Generation

### POST `/generate/text-to-image`
Générer une image à partir d'un texte

**Content-Type:** `application/json`

**Body:**
```json
{
  "prompt": "Un paysage futuriste avec des gratte-ciels",
  "style": "cyberpunk",
  "width": 1024,
  "height": 1024,
  "steps": 50,
  "guidance_scale": 7.5,
  "seed": 42
}
```

**Response:**
```json
{
  "success": true,
  "imageUrl": "https://example.com/generated-image.jpg",
  "prompt": "Un paysage futuriste avec des gratte-ciels",
  "parameters": {
    "width": 1024,
    "height": 1024,
    "steps": 50,
    "guidance_scale": 7.5,
    "seed": 42
  },
  "processingTime": 45.2,
  "timestamp": "2025-11-03T10:30:00.000Z"
}
```

### POST `/generate/img-to-img`
Générer une image à partir d'une image source

**Content-Type:** `multipart/form-data`

**Parameters:**
- `image` (file, required) - Image source
- `prompt` (string, required) - Description de la transformation
- `strength` (number, optional) - Force de la transformation (0.1-1.0)

### GET `/generate/status`
Statut du service de génération d'images

### GET `/generate/presets`
Obtenir les presets de génération disponibles

**Response:**
```json
{
  "presets": [
    {
      "name": "Réaliste",
      "style": "photorealistic",
      "defaultSettings": {
        "steps": 50,
        "guidance_scale": 7.5
      }
    }
  ]
}
```

---

## ✂️ Image Editing

### POST `/edit/image`
Éditer plusieurs images

**Content-Type:** `multipart/form-data`

**Parameters:**
- `images` (files[], required) - Maximum 5 images
- `operation` (string, required) - Type d'édition
- `parameters` (string, optional) - Paramètres JSON

### POST `/edit/single-image`
Éditer une seule image

**Content-Type:** `multipart/form-data`

**Parameters:**
- `image` (file, required) - Image à éditer
- `operation` (string, required) - Type d'édition
- `parameters` (string, optional) - Paramètres JSON

### POST `/edit/transfer-pose`
Transférer la pose d'une image à une autre

**Content-Type:** `multipart/form-data`

**Parameters:**
- `sourceImage` (file, required) - Image source de la pose
- `targetImage` (file, required) - Image cible

### POST `/edit/transfer-style`
Transférer le style d'une image à une autre

**Content-Type:** `multipart/form-data`

**Parameters:**
- `styleImage` (file, required) - Image source du style
- `contentImage` (file, required) - Image de contenu

### GET `/edit/status`
Statut du service d'édition d'images

### GET `/edit/examples`
Exemples d'éditions disponibles

---

## 🎬 Video Generation

### POST `/video/generate`
Générer une vidéo à partir d'un prompt

**Content-Type:** `application/json`

**Body:**
```json
{
  "prompt": "Un chat qui joue dans un jardin",
  "duration": 5,
  "fps": 24,
  "width": 1024,
  "height": 576,
  "style": "réaliste"
}
```

**Response:**
```json
{
  "success": true,
  "videoUrl": "https://example.com/generated-video.mp4",
  "prompt": "Un chat qui joue dans un jardin",
  "duration": 5,
  "resolution": "1024x576",
  "fps": 24,
  "processingTime": 120.5,
  "timestamp": "2025-11-03T10:30:00.000Z"
}
```

### POST `/video/generate-with-workflow`
Générer une vidéo avec workflow personnalisé

### GET `/video/workflows`
Obtenir les workflows vidéo disponibles

### GET `/video/status`
Statut du service de génération vidéo

### GET `/video/examples`
Exemples de génération vidéo

---

## 🎞️ Video-Image

### POST `/video-image/generate`
Générer une vidéo à partir d'images

**Content-Type:** `multipart/form-data`

**Parameters:**
- `images` (files[], required) - Images sources
- `firstFrame` (file, optional) - Première frame spécifique
- `prompt` (string, required) - Description de la vidéo
- `duration` (number, optional) - Durée en secondes

### POST `/video-image/generate-with-workflow`
Générer une vidéo avec workflow personnalisé

### GET `/video-image/workflows`
Workflows disponibles pour vidéo-image

### GET `/video-image/status`
Statut du service vidéo-image

### GET `/video-image/examples`
Exemples de génération vidéo-image

---

## 🔄 Workflow

### POST `/workflow/analyze`
Analyser et optimiser un workflow

**Content-Type:** `multipart/form-data` ou `application/json`

**Parameters:**
- `prompt` (string, required) - Description du workflow
- `images` (files[], optional) - Images d'entrée
- `workflowType` (string, optional) - Type de workflow

**Response:**
```json
{
  "success": true,
  "workflowId": "wf_abc123",
  "analysis": {
    "complexity": "medium",
    "estimatedSteps": 3,
    "requiredServices": ["image-generation", "image-editing"]
  },
  "optimizedWorkflow": {
    "steps": [
      {
        "id": 1,
        "service": "image-generation",
        "parameters": {...}
      }
    ]
  },
  "estimatedTime": 45,
  "timestamp": "2025-11-03T10:30:00.000Z"
}
```

### POST `/workflow/execute`
Exécuter un workflow complet

**Content-Type:** `multipart/form-data`

**Parameters:**
- `workflowId` (string, required) - ID du workflow
- `images` (files[], optional) - Images d'entrée
- `parameters` (string, optional) - Paramètres JSON

### GET `/workflow/list`
Lister tous les workflows disponibles

### GET `/workflow/examples`
Exemples de workflows

### GET `/workflow/:id`
Obtenir les détails d'un workflow spécifique

### GET `/workflow/cache/stats`
Statistiques du cache des workflows

### DELETE `/workflow/cache`
Vider le cache des workflows

### POST `/workflow/run` 🆕
**Exécuter un workflow complet basé sur des tâches séquentielles**

**Content-Type:** `multipart/form-data` ou `application/json`

**Multipart (avec fichiers):**
- `workflow` (string, required) - JSON du workflow à exécuter
- `images[]` (files[], optional) - Images d'entrée
- `user_prompt` (string, optional) - Prompt utilisateur

**JSON (sans fichiers):**
```json
{
  "workflow": {
    "workflow": {
      "id": "wf_simple_enhance",
      "name": "Test amélioration simple",
      "tasks": [
        {
          "type": "enhance_prompt",
          "id": "enhance",
          "inputs": {
            "prompt": "{{input.user_prompt}}"
          }
        },
        {
          "type": "generate_image",
          "id": "generate", 
          "inputs": {
            "prompt": "{{enhance.enhanced_prompt}}"
          }
        }
      ],
      "outputs": {
        "result": "{{generate.image}}"
      }
    }
  },
  "inputs": {
    "user_prompt": "un chat dans un jardin"
  }
}
```

**Types de tâches supportées:**
- `enhance_prompt` - Amélioration de prompts (gemini-2.5-flash)
- `describe_images` - Description d'images (llava-13b)
- `generate_image` - Génération d'images (qwen-image)
- `edit_image` - Édition d'images (qwen-image-edit-plus)
- `generate_video_t2v` - Génération vidéo text-to-video (wan-2.2-t2v-fast)
- `generate_video_i2v` - Génération vidéo image-to-video (wan-2.2-i2v-fast)

**Response:**
```json
{
  "success": true,
  "workflow_id": "wf_simple_enhance_exec_abc12345",
  "execution": {
    "status": "completed",
    "progress": {
      "total_tasks": 2,
      "completed_tasks": 2,
      "current_task": null,
      "percentage": 100
    },
    "execution_time": 47.2,
    "started_at": "2025-11-03T10:30:00.000Z",
    "completed_at": "2025-11-03T10:30:47.200Z"
  },
  "results": {
    "result": "https://storage.com/generated_image.jpg"
  },
  "task_results": [
    {
      "task_id": "enhance",
      "type": "enhance_prompt",
      "status": "completed",
      "execution_time": 2.1,
      "outputs": {
        "enhanced_prompt": "Un magnifique paysage...",
        "confidence": 0.92
      }
    }
  ]
}
```

---

## 📚 History

### GET `/history/`
Obtenir l'historique des opérations

**Query Parameters:**
- `limit` (number, optional) - Nombre max d'éléments (défaut: 50)
- `offset` (number, optional) - Décalage pour pagination
- `type` (string, optional) - Filtrer par type d'opération

**Response:**
```json
{
  "success": true,
  "operations": [
    {
      "id": "op_abc123",
      "type": "image-generation",
      "prompt": "Un paysage de montagne",
      "status": "completed",
      "createdAt": "2025-11-03T10:30:00.000Z",
      "completedAt": "2025-11-03T10:31:30.000Z",
      "resultUrl": "https://example.com/result.jpg"
    }
  ],
  "total": 25,
  "limit": 50,
  "offset": 0
}
```

### GET `/history/:operationId`
Obtenir les détails d'une opération spécifique

**Response:**
```json
{
  "success": true,
  "operation": {
    "id": "op_abc123",
    "type": "image-generation",
    "prompt": "Un paysage de montagne",
    "status": "completed",
    "parameters": {...},
    "results": {...},
    "logs": [...],
    "createdAt": "2025-11-03T10:30:00.000Z",
    "completedAt": "2025-11-03T10:31:30.000Z"
  }
}
```

---

## 📝 Codes de statut HTTP

| Code | Signification | Description |
|------|---------------|-------------|
| 200 | OK | Requête réussie |
| 201 | Created | Ressource créée avec succès |
| 400 | Bad Request | Paramètres invalides |
| 401 | Unauthorized | Authentification requise |
| 403 | Forbidden | Accès interdit |
| 404 | Not Found | Ressource non trouvée |
| 413 | Payload Too Large | Fichier trop volumineux |
| 415 | Unsupported Media Type | Type de fichier non supporté |
| 429 | Too Many Requests | Limite de taux dépassée |
| 500 | Internal Server Error | Erreur serveur |
| 503 | Service Unavailable | Service temporairement indisponible |

---

## 🔧 Configuration

### Variables d'environnement requises
```env
# API Keys
REPLICATE_API_TOKEN=your_replicate_token
OPENAI_API_KEY=your_openai_key

# Configuration serveur
PORT=3000
NODE_ENV=production

# Timeouts (en millisecondes)
REQUEST_TIMEOUT=600000
KEEP_ALIVE_TIMEOUT=610000
HEADERS_TIMEOUT=620000
```

### Limites par défaut
- **Taille fichier max:** 10MB par image
- **Nombre d'images max:** 10 par requête
- **Timeout requête:** 10 minutes
- **Formats supportés:** JPG, PNG, GIF, WebP

---

## 🚀 Utilisation avec cURL

### Exemple de génération d'image
```bash
curl -X POST http://localhost:3000/api/generate/text-to-image \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Un chat futuriste dans un paysage cyberpunk",
    "width": 1024,
    "height": 1024,
    "steps": 50
  }'
```

### Exemple d'upload d'image
```bash
curl -X POST http://localhost:3000/api/images/analyze \
  -F "image=@/path/to/image.jpg" \
  -F "analysisType=comprehensive"
```

---

## 📊 Monitoring

Tous les endpoints exposent des métriques de performance accessibles via les logs du serveur. Les requêtes longues (>30s) sont automatiquement loggées avec des détails de performance.

### Logs disponibles
- `/backend/logs/workflow-debug.log` - Logs détaillés des workflows
- Console serveur - Logs en temps réel

---

*Documentation générée le 3 novembre 2025 - Version API 1.0.0*