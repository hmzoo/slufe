# 📡 API Endpoints Documentation

> **SLUFE IA Backend API** - Documentation complète des endpoints disponibles

---

## 🌟 Vue d'ensemble

L'API SLUFE IA fournit des services d'intelligence artificielle pour la génération, l'édition et l'analyse d'images et de vidéos. Tous les endpoints sont préfixés par `/api`.

### 🔗 Base URL
```
http://localhost:3000/api
```

### 📁 Ressources statiques
```
http://localhost:3000/medias/    - Fichiers médias (images, vidéos)
http://localhost:3000/workflows/ - Fichiers JSON de workflows
```

### 📋 Groupes d'endpoints

> **🔄 ARCHITECTURE WORKFLOW-CENTRIC** - Le frontend utilise exclusivement les workflows pour le traitement IA

- **[AI Core](#-ai-core)** - Services IA principaux (statut seulement)
- **[Workflow](#-workflow)** - ⭐ **Point central** - Orchestration de workflows (traitement IA unifié)
- **[Media](#-media)** - 🆕 **API Unifiée** - Gestion complète des médias
- **[Collections](#-collections)** - Gestion des collections d'images
- **[Templates](#-templates)** - Gestion des templates de workflows  
- **[History](#-history)** - Historique des opérations



---

## 🤖 AI Core

### GET `/status`
Vérifier le statut de l'API

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-11-13T10:30:00.000Z",
  "version": "2.0.0"
}
```





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

*Tâches IA principales:*
- `enhance_prompt` - Amélioration de prompts (gemini-2.5-flash)
- `describe_images` - Description d'images (llava-13b)
- `generate_image` - Génération d'images (qwen-image)
- `edit_image` - Édition d'images (qwen-image-edit-plus)
- `generate_video_t2v` - Génération vidéo text-to-video (wan-2.2-t2v-fast)
- `generate_video_i2v` - Génération vidéo image-to-video (wan-2.2-i2v-fast)
- `generate_workflow` - Génération automatique de workflows

*Tâches de traitement média:*
- `image_resize_crop` - Redimensionnement et recadrage d'images
- `video_extract_frame` - Extraction de frames depuis une vidéo
- `video_concatenate` - Concaténation de vidéos

*Tâches d'entrée/sortie:*
- `input_text` / `text_input` - Entrée de texte
- `text_output` - Sortie de texte
- `image_input` - Entrée d'image
- `image_output` - Sortie d'image
- `video_output` - Sortie de vidéo
- `input_images` - Entrée d'images multiples

*Tâches spéciales:*
- `camera_capture` - Capture depuis caméra

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

## 📡 Media

API unifiée pour la gestion complète des médias (upload, listage, copie, suppression).



### GET `/media`
Lister tous les médias avec pagination

**Query Parameters:**
- `page` (number, optional) - Numéro de page (défaut: 1)
- `limit` (number, optional) - Éléments par page (défaut: 20)
- `type` (string, optional) - Filtrer par type (image, video)

**Response:**
```json
{
  "success": true,
  "medias": [
    {
      "filename": "61a0b695-877b-4954-9b1d-5183dad5aec7.jpg",
      "url": "/medias/61a0b695-877b-4954-9b1d-5183dad5aec7.jpg",
      "mimeType": "image/jpeg",
      "size": 245760,
      "uploadedAt": "2025-11-13T09:30:55.017Z",
      "type": "image"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 7,
    "totalPages": 1
  }
}
```

### POST `/media/upload`
Upload d'un ou plusieurs fichiers médias

**Content-Type:** `multipart/form-data`

**Parameters:**
- `files` (files[], required) - Fichiers à uploader (max 10 fichiers, 50MB par fichier)

**Response:**
```json
{
  "success": true,
  "uploaded": [
    {
      "filename": "image_abc123.jpg",
      "originalName": "mon-image.jpg",
      "url": "/medias/image_abc123.jpg",
      "mimeType": "image/jpeg",
      "size": 1024000,
      "uploadedAt": "2025-11-13T10:30:00.000Z",
      "type": "image"
    }
  ],
  "count": 1
}
```

### POST `/media/copy`
Copier un média vers une collection

**Content-Type:** `application/json`

**Body:**
```json
{
  "sourceUrl": "/medias/image_123.jpg",
  "targetCollectionId": "col_abc456",
  "description": "Copie du média"
}
```

**Response:**
```json
{
  "success": true,
  "copiedMedia": {
    "url": "/medias/image_123_copy.jpg",
    "targetCollection": "col_abc456",
    "copiedAt": "2025-11-13T10:30:00.000Z"
  }
}
```

### POST `/media/copy-batch`
Copier plusieurs médias en lot (optimisé)

**Content-Type:** `application/json`

**Body:**
```json
{
  "operations": [
    {
      "sourceUrl": "/medias/image_123.jpg",
      "targetCollectionId": "col_abc456"
    },
    {
      "sourceUrl": "/medias/image_124.jpg", 
      "targetCollectionId": "col_abc789"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "results": [
    {
      "sourceUrl": "/medias/image_123.jpg",
      "copiedUrl": "/medias/image_123_copy.jpg",
      "targetCollection": "col_abc456",
      "status": "success"
    }
  ],
  "totalProcessed": 2,
  "successCount": 2,
  "errorCount": 0
}
```

### DELETE `/media/:filename`
Supprimer un média

**Response:**
```json
{
  "success": true,
  "message": "Média supprimé avec succès",
  "deletedFile": "image_abc123.jpg"
}
```



---

## 🗂️ Collections

### GET `/collections/init`
Initialiser le système de collections

### GET `/collections/`
Récupérer toutes les collections

**Response:**
```json
{
  "success": true,
  "collections": [
    {
      "id": "col_abc123",
      "name": "Ma Collection",
      "description": "Collection d'images de test",
      "imageCount": 15,
      "createdAt": "2025-11-13T10:00:00.000Z",
      "updatedAt": "2025-11-13T10:30:00.000Z"
    }
  ],
  "count": 1
}
```

### GET `/collections/:id`
Récupérer une collection spécifique

### POST `/collections/`
Créer une nouvelle collection

**Content-Type:** `application/json`

**Body:**
```json
{
  "name": "Nouvelle Collection",
  "description": "Description de la collection"
}
```

### PUT `/collections/:id`
Mettre à jour une collection

### DELETE `/collections/:id`
Supprimer une collection

### GET `/collections/current/info`
Informations sur la collection courante

### POST `/collections/current/set`
Définir la collection courante

**Content-Type:** `application/json`

**Body:**
```json
{
  "collectionId": "col_abc123"
}
```

### POST `/collections/:id/images`
Ajouter des images à une collection

### POST `/collections/current/images`
Ajouter des images à la collection courante

### DELETE `/collections/:id/images/:imageUrl(*)`
Supprimer une image d'une collection

### PUT `/collections/:id/images/:imageUrl(*)`
Mettre à jour une image dans une collection

### GET `/collections/current/gallery`
Récupérer la galerie de la collection courante

### POST `/collections/:id/upload`
Upload d'images directement dans une collection

**Content-Type:** `multipart/form-data`

**Parameters:**
- `files` (files[], required) - Images à uploader (max 10)

### POST `/collections/current/upload`
Upload d'images dans la collection courante

---

## 📋 Templates

### GET `/templates/`
Récupérer tous les templates de workflows

**Response:**
```json
{
  "success": true,
  "templates": [
    {
      "id": "tpl_abc123",
      "name": "Génération d'Image Simple",
      "description": "Template pour générer une image à partir d'un prompt",
      "category": "image-generation",
      "workflow": {...},
      "createdAt": "2025-11-13T10:00:00.000Z"
    }
  ],
  "count": 1
}
```

### GET `/templates/:id`
Récupérer un template spécifique

### POST `/templates/`
Créer un nouveau template

**Content-Type:** `application/json`

**Body:**
```json
{
  "name": "Mon Template",
  "description": "Description du template",
  "category": "image-generation",
  "workflow": {
    "tasks": [...]
  }
}
```

### PUT `/templates/:id`
Mettre à jour un template

### DELETE `/templates/:id`
Supprimer un template

### POST `/templates/from-workflow`
Créer un template à partir d'un workflow existant

**Content-Type:** `application/json`

**Body:**
```json
{
  "workflowId": "wf_abc123",
  "name": "Template depuis workflow",
  "description": "Template créé automatiquement"
}
```

---

## �📚 History

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

## 🚀 Exemples d'Utilisation (Version 2.0)

### Nouvelle architecture - Workflow unifié
```bash
# Génération d'image avec workflow
curl -X POST http://localhost:3000/api/workflow/run \
  -H "Content-Type: application/json" \
  -d '{
    "workflow": {
      "tasks": [
        {
          "type": "generate_image", 
          "inputs": {
            "prompt": "Un chat futuriste dans un paysage cyberpunk",
            "width": 1024,
            "height": 1024
          }
        }
      ]
    }
  }'
```

### Upload avec nouvelle API unifiée
```bash
# Upload de médias
curl -X POST http://localhost:3000/api/media/upload \
  -F "files=@/path/to/image1.jpg" \
  -F "files=@/path/to/image2.jpg"

# Listing des médias avec pagination
curl "http://localhost:3000/api/media?page=1&limit=10&type=image"
```

### Copie optimisée en lot
```bash
# Copie batch de médias (50% plus rapide)
curl -X POST http://localhost:3000/api/media/copy-batch \
  -H "Content-Type: application/json" \
  -d '{
    "operations": [
      {"sourceUrl": "/medias/img1.jpg", "targetCollectionId": "col_123"},
      {"sourceUrl": "/medias/img2.jpg", "targetCollectionId": "col_456"}
    ]
  }'
```



---

## 📊 Monitoring

Tous les endpoints exposent des métriques de performance accessibles via les logs du serveur. Les requêtes longues (>30s) sont automatiquement loggées avec des détails de performance.

### Logs disponibles
- `/backend/logs/workflow-debug.log` - Logs détaillés des workflows
- Console serveur - Logs en temps réel

---

---

## ⚠️ Notes importantes

### Authentification
Actuellement, l'API ne nécessite pas d'authentification. En production, il est recommandé d'ajouter un système d'authentification approprié.

### Rate Limiting
Aucune limitation de taux n'est actuellement implémentée. En production, considérez l'ajout de rate limiting pour éviter les abus.

### CORS
Le serveur est configuré pour accepter les requêtes de toutes les origines. En production, configurez CORS de manière plus restrictive.

### Environnement de développement vs Production
- **Développement**: Mode mock activé si les clés API ne sont pas configurées
- **Production**: Requiert les clés API Replicate pour le fonctionnement complet

---

---

## 🔄 Historique des Modifications

### Version 2.0.0 - 13 novembre 2025
- **Architecture workflow-centric** - Point central pour tous les traitements IA
- **API Media unifiée** - Gestion complète des médias avec opérations optimisées
- **Backend simplifié** - Focus sur les endpoints réellement utilisés
- **Performance améliorée** - Optimisation des opérations de copie média

---

*Documentation mise à jour le 13 novembre 2025 - **Version API 2.0.0***