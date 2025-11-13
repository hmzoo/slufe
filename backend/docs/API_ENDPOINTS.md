# 📚 API Endpoints - SLUFE Backend

## 📊 **Vue d'ensemble**

Documentation complète des endpoints disponibles dans SLUFE Backend après migration vers l'API Media Unifiée.

**🎯 Statut :** Mise à jour post-migration (Novembre 2025)  
**✅ API Media Unifiée :** Opérationnelle et remplace `/api/upload`

---

## 🔄 **Endpoints Media (Nouveau - API Unifiée)**

### **Upload Media Unifié**
```http
POST /api/media/upload
Content-Type: multipart/form-data
```

**Formats supportés :**
- **Single:** `file=<File>`
- **Multiple:** `files=<File[]>`
- **Fields:** `image=<File>&video=<File>&audio=<File>`

**Réponse :**
```json
{
  "success": true,
  "type": "single|multiple|fields",
  "media": {...}, // Pour single
  "uploaded": [...], // Pour multiple
  "results": {...}, // Pour fields
  "summary": {
    "total_uploaded": 1,
    "total_errors": 0,
    "uploaded_medias": [...],
    "errors": []
  }
}
```

### **Lister Médias avec Filtres**
```http
GET /api/media?type=image&limit=20&offset=0&search=query
```

**Paramètres query :**
- `type`: `image|video|audio` (optionnel)
- `search`: Recherche par nom (optionnel)
- `limit`: Nombre max de résultats (défaut: 20)
- `offset`: Décalage pour pagination (défaut: 0)

**Réponse :**
```json
{
  "success": true,
  "medias": [
    {
      "id": "uuid",
      "filename": "file.jpg",
      "url": "/medias/file.jpg", 
      "type": "image",
      "size": 1024,
      "createdAt": "2025-11-13T09:00:00.000Z",
      "modifiedAt": "2025-11-13T09:00:00.000Z"
    }
  ],
  "total": 150,
  "limit": 20,
  "offset": 0,
  "hasMore": true
}
```

### **Informations Média**
```http
GET /api/media/:id
```

**Réponse :**
```json
{
  "success": true,
  "media": {
    "id": "uuid",
    "filename": "file.jpg",
    "url": "/medias/file.jpg",
    "path": "/backend/medias/file.jpg",
    "type": "image",
    "mimetype": "image/jpeg",
    "size": 1024,
    "createdAt": "2025-11-13T09:00:00.000Z",
    "modifiedAt": "2025-11-13T09:00:00.000Z"
  }
}
```

### **Copie Media Optimisée**
```http
POST /api/media/copy
Content-Type: application/json
```

**Body :**
```json
{
  "sourceUrl": "medias/source.jpg",
  "targetCollectionId": "collection_123",
  "description": "Description optionnelle"
}
```

**Réponse :**
```json
{
  "success": true,
  "message": "Média copié avec succès",
  "copied_media": {
    "url": "/medias/new-uuid.jpg",
    "filename": "new-uuid.jpg", 
    "type": "image",
    "description": "Description",
    "size": 1024
  },
  "original_media": {
    "url": "medias/source.jpg",
    "filename": "source.jpg",
    "preserved": true
  },
  "collection_id": "collection_123"
}
```

### **Copie Batch Optimisée**
```http
POST /api/media/copy-batch
Content-Type: application/json
```

**Body :**
```json
{
  "operations": [
    {
      "sourceUrl": "medias/file1.jpg",
      "targetCollectionId": "collection_123",
      "description": "Description 1"
    },
    {
      "sourceUrl": "medias/file2.jpg", 
      "targetCollectionId": "collection_456",
      "description": "Description 2"
    }
  ]
}
```

**Réponse :**
```json
{
  "success": true,
  "message": "Opérations batch terminées",
  "summary": {
    "successful_copies": 2,
    "failed_copies": 0,
    "total_operations": 2
  },
  "results": [
    {
      "success": true,
      "copied_media": {...},
      "operation_index": 0
    }
  ]
}
```

### **Suppression Media**
```http
DELETE /api/media/:id
```

**Réponse :**
```json
{
  "success": true,
  "message": "Média supprimé avec succès",
  "deleted_media": {
    "id": "uuid",
    "filename": "file.jpg"
  }
}
```

---

## 📦 **Endpoints Collections**

### **Créer Collection**
```http
POST /api/collections
Content-Type: application/json

{
  "name": "Ma Collection",
  "description": "Description"
}
```

### **Lister Collections**
```http
GET /api/collections
```

### **Collection par ID**
```http
GET /api/collections/:id
```

### **Mettre à jour Collection**
```http
PUT /api/collections/:id
Content-Type: application/json

{
  "name": "Nouveau nom",
  "description": "Nouvelle description"
}
```

### **Supprimer Collection**
```http
DELETE /api/collections/:id
```

### **Ajouter Media à Collection**
```http
POST /api/collections/:id/images
Content-Type: application/json

{
  "url": "/medias/file.jpg",
  "mediaId": "uuid",
  "description": "Description"
}
```

### **Supprimer Media de Collection**
```http
DELETE /api/collections/:collectionId/images/:encodedUrl
```

---

## 🎬 **Endpoints Workflow**

### **Exécuter Workflow**
```http
POST /api/workflow/execute
Content-Type: application/json

{
  "templateId": "template_123", 
  "inputData": {...},
  "config": {...}
}
```

### **Status Workflow**
```http
GET /api/workflow/status/:executionId
```

### **Historique Workflows**
```http
GET /api/history
```

---

## 🎥 **Endpoints Vidéo**

### **Génération Vidéo**
```http
POST /api/video/generate
Content-Type: application/json

{
  "prompt": "Description vidéo",
  "model": "luma-video",
  "aspectRatio": "16:9",
  "duration": "5s"
}
```

### **Image vers Vidéo (I2V)**
```http
POST /api/video/image-to-video
Content-Type: application/json

{
  "imageUrl": "/medias/image.jpg",
  "prompt": "Animation description",
  "model": "luma-video"
}
```

### **Status Génération Vidéo**
```http
GET /api/video/status/:taskId
```

---

## 🖼️ **Endpoints Images**

### **Génération Image**
```http
POST /api/generate/image
Content-Type: application/json

{
  "prompt": "Description image",
  "model": "flux-pro",
  "aspectRatio": "1:1",
  "steps": 25
}
```

### **Édition Image**
```http
POST /api/edit/image
Content-Type: application/json

{
  "imageUrl": "/medias/image.jpg",
  "prompt": "Modifications",
  "model": "flux-fill"
}
```

---

## 🛠️ **Endpoints Templates**

### **Lister Templates**
```http
GET /api/templates
```

### **Template par ID**
```http
GET /api/templates/:id
```

### **Créer Template**
```http
POST /api/templates
Content-Type: application/json

{
  "name": "Mon Template",
  "description": "Description",
  "tasks": [...]
}
```

---

## ❌ **Endpoints DEPRECATED**

### **⚠️ `/api/upload` - SUPPRIMÉ**
```
❌ POST /api/upload/single - Remplacé par /api/media/upload
❌ POST /api/upload/multiple - Remplacé par /api/media/upload  
❌ POST /api/upload/fields - Remplacé par /api/media/upload
❌ GET /api/upload/medias - Remplacé par /api/media
❌ GET /api/upload/media/:id - Remplacé par /api/media/:id
❌ DELETE /api/upload/media/:id - Remplacé par /api/media/:id
```

**🎯 Migration :** Tous les endpoints `/api/upload/*` ont été consolidés dans `/api/media`

---

## 📈 **Codes de Réponse**

### **Success (2xx)**
- `200 OK` - Requête réussie
- `201 Created` - Ressource créée

### **Client Error (4xx)**  
- `400 Bad Request` - Données invalides
- `404 Not Found` - Ressource introuvable
- `413 Payload Too Large` - Fichier trop volumineux

### **Server Error (5xx)**
- `500 Internal Server Error` - Erreur serveur
- `503 Service Unavailable` - Service temporairement indisponible

---

## 🏆 **Améliorations Post-Migration**

### **Performance**
- ⚡ 50% moins de requêtes pour copie/déplacement
- ⚡ Pagination côté serveur pour grandes collections  
- ⚡ Opérations batch optimisées

### **Architecture**
- 🎯 API unifiée pour toutes opérations media
- 🎯 Gestion d'erreurs cohérente
- 🎯 Codes d'erreur explicites

### **Fonctionnalités**
- 🎨 Copie sans perte avec préservation métadonnées
- 🎨 Filtrage intelligent par type/recherche
- 🎨 Feedback détaillé sur toutes opérations

**📊 Résultat :** Architecture plus cohérente et performante ! 🚀