# 🔄 Guide de Migration : Frontend vers API Media Unifiée

## Vue d'ensemble

Guide step-by-step pour migrer le frontend de l'ancienne API `/api/upload` vers la nouvelle API `/api/media` unifiée.

---

## 📊 **État Actuel vs Cible**

### **❌ AVANT - APIs Multiples**
```javascript
// Upload single
await api.post('/upload/single', formData)

// Upload multiple  
await api.post('/upload/multiple', formData)

// Upload fields
await api.post('/upload/fields', formData)

// Get media info
await api.get(`/upload/media/${id}`)

// List medias
await api.get('/upload/medias')

// Delete media
await api.delete(`/upload/media/${id}`)

// Copy media (inefficient - 2 requests)
await api.post(`/collections/${targetId}/images`, {...})
await api.delete(`/collections/${sourceId}/images/${encodedUrl}`)
```

### **✅ APRÈS - API Unifiée**
```javascript
// Tout upload via endpoint unique
await api.post('/api/media/upload', formData)

// Get media info
await api.get(`/api/media/${id}`)

// List with filters
await api.get('/api/media?type=image&limit=20&search=...')

// Delete media
await api.delete(`/api/media/${id}`)

// Copy media (efficient - 1 request)
await api.post('/api/media/copy', { sourceUrl, targetCollectionId })

// Batch copy
await api.post('/api/media/copy-batch', { operations: [...] })
```

---

## 🔧 **Migrations par Fichier**

### **1. `services/uploadMedia.js` → `services/mediaService.js`**

#### **AVANT** (uploadMedia.js)
```javascript
export const uploadMediaService = {
  async uploadSingle(file) {
    const formData = new FormData()
    formData.append('file', file)
    const response = await api.post('/upload/single', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return response.data
  },

  async uploadMultiple(files) {
    const formData = new FormData()
    files.forEach(file => formData.append('files', file))
    const response = await api.post('/upload/multiple', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return response.data
  },

  async listAllMedias() {
    const response = await api.get('/upload/medias')
    return response.data
  },

  async getMediaInfo(id) {
    const response = await api.get(`/upload/media/${id}`)
    return response.data
  },

  async deleteMedia(id) {
    const response = await api.delete(`/upload/media/${id}`)
    return response.data
  }
}
```

#### **✅ APRÈS** (mediaService.js)
```javascript
export const mediaService = {
  // Upload unifié - détection automatique du type
  async upload(files, options = {}) {
    const formData = new FormData()
    
    if (Array.isArray(files)) {
      if (files.length === 1) {
        // Single upload
        formData.append('file', files[0])
      } else {
        // Multiple upload
        files.forEach(file => formData.append('files', file))
      }
    } else if (typeof files === 'object') {
      // Fields upload
      Object.entries(files).forEach(([field, fieldFiles]) => {
        if (Array.isArray(fieldFiles)) {
          fieldFiles.forEach(file => formData.append(field, file))
        } else {
          formData.append(field, fieldFiles)
        }
      })
    } else {
      // Single file
      formData.append('file', files)
    }

    const response = await api.post('/api/media/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      ...options
    })
    
    return response.data
  },

  // Liste avec filtres avancés
  async list(filters = {}) {
    const params = new URLSearchParams()
    
    if (filters.type) params.append('type', filters.type)
    if (filters.search) params.append('search', filters.search)
    if (filters.limit) params.append('limit', filters.limit.toString())
    if (filters.offset) params.append('offset', filters.offset.toString())
    
    const response = await api.get(`/api/media?${params.toString()}`)
    return response.data
  },

  async getInfo(id) {
    const response = await api.get(`/api/media/${id}`)
    return response.data
  },

  async delete(id) {
    const response = await api.delete(`/api/media/${id}`)
    return response.data
  },

  // Nouvelles fonctionnalités de copie
  async copy(sourceUrl, targetCollectionId, description) {
    const response = await api.post('/api/media/copy', {
      sourceUrl,
      targetCollectionId,
      description
    })
    return response.data
  },

  async copyBatch(operations) {
    const response = await api.post('/api/media/copy-batch', {
      operations
    })
    return response.data
  },

  // Méthodes utilitaires conservées
  validateFile(file) {
    // ... code existant inchangé
  },

  formatFileSize(bytes) {
    // ... code existant inchangé  
  },

  createFilePreviewUrl(file) {
    // ... code existant inchangé
  },

  revokeFilePreviewUrl(url) {
    // ... code existant inchangé
  }
}

// Backward compatibility (transition)
export const uploadMediaService = {
  ...mediaService,
  uploadSingle: (file) => mediaService.upload(file),
  uploadMultiple: (files) => mediaService.upload(files),
  listAllMedias: () => mediaService.list(),
  getMediaInfo: (id) => mediaService.getInfo(id),
  deleteMedia: (id) => mediaService.delete(id)
}
```

### **2. `stores/useCollectionStore.js` - Optimisation Copie**

#### **AVANT** - Déplacement Inefficace (2 requêtes)
```javascript
// Dans CollectionView.vue
const confirmMoveMedias = async () => {
  for (const media of selectedMedias.value) {
    // 1. Ajouter à destination
    await collectionStore.addMediaToCollection(targetCollection.value, {
      url: media.url,
      mediaId: media.mediaId,
      description: media.description || ''
    })
    
    // 2. Supprimer de source  
    await collectionStore.removeMediaFromCollection(
      collectionStore.currentCollection.id, 
      media.mediaId
    )
  }
}
```

#### **✅ APRÈS** - Copie Optimisée (1 requête batch)
```javascript
// Nouvelle méthode dans useCollectionStore.js
const copyMediasToCollection = async (mediaUrls, targetCollectionId) => {
  const operations = mediaUrls.map(url => ({
    sourceUrl: url,
    targetCollectionId: targetCollectionId
  }))
  
  const result = await mediaService.copyBatch(operations)
  
  // Recharger collections pour refléter les changements
  await fetchCollections()
  
  return result
}

// Dans CollectionView.vue  
const confirmMoveMedias = async () => {
  try {
    const mediaUrls = selectedMedias.value.map(m => m.url)
    
    // 1. Copier vers destination (1 requête batch)
    const copyResult = await collectionStore.copyMediasToCollection(
      mediaUrls, 
      targetCollection.value
    )
    
    // 2. Optionnel: Supprimer de source si c'est un déplacement
    if (moveMode.value === 'move') {
      // Supprimer de la collection source
      for (const media of selectedMedias.value) {
        await collectionStore.removeMediaFromCollection(
          collectionStore.currentCollection.id, 
          media.mediaId
        )
      }
    }
    
    $q.notify({
      type: 'positive',
      message: `${copyResult.summary.successful_copies} média(s) ${moveMode.value === 'move' ? 'déplacé(s)' : 'copié(s)'}`
    })
    
  } catch (error) {
    console.error('Erreur opération médias:', error)
  }
}
```

### **3. Composants Upload - Migration**

#### **AVANT** - Composants Séparés
```javascript
// CollectionImageUpload.vue
const uploadFiles = async () => {
  if (uploadType.value === 'single') {
    result = await uploadMediaService.uploadSingle(files.value[0])
  } else {
    result = await uploadMediaService.uploadMultiple(files.value)
  }
}
```

#### **✅ APRÈS** - Composant Unifié
```javascript
// CollectionMediaUpload.vue (nouveau nom)
const uploadFiles = async () => {
  try {
    // L'API détecte automatiquement le type d'upload
    const result = await mediaService.upload(files.value, {
      onUploadProgress: updateProgress
    })
    
    // Traitement unifié du résultat
    let uploadedMedias = []
    
    switch (result.type) {
      case 'single':
        uploadedMedias = [result.media]
        break
      case 'multiple':
        uploadedMedias = result.uploaded || []
        break  
      case 'fields':
        uploadedMedias = Object.values(result.results)
          .flatMap(r => r.uploaded || [])
        break
    }
    
    emit('uploaded', uploadedMedias)
    
  } catch (error) {
    console.error('Upload error:', error)
  }
}
```

---

## 🎯 **Plan de Migration Progressive**

### **Phase 1 : Préparation (1 jour)**
1. ✅ Créer `services/mediaService.js` avec backward compatibility
2. ✅ Tester API unifiée avec Postman/curl
3. ✅ Valider que `/api/media` fonctionne

### **Phase 2 : Migration Core (2-3 jours)**
1. 🔄 Remplacer `uploadMediaService` par `mediaService` dans les stores
2. 🔄 Migrer `useCollectionStore.js` pour utiliser `/api/media/copy`
3. 🔄 Tester les fonctionnalités existantes

### **Phase 3 : Optimisations (1-2 jours)**  
1. 🎯 Implémenter la copie batch dans l'interface
2. 🎯 Ajouter filtres et pagination à la galerie
3. 🎯 Améliorer UX avec nouveaux codes d'erreur

### **Phase 4 : Nettoyage (optionnel)**
1. 🧹 Supprimer backward compatibility
2. 🧹 Nettoyer ancien code `/api/upload`
3. 🧹 Simplifier les composants

---

## ✅ **Bénéfices Immédiats**

### **Performance**
- ⚡ **50% moins de requêtes** pour copie/déplacement
- ⚡ **Batch operations** pour réorganisation massive
- ⚡ **Pagination côté serveur** pour grandes galeries

### **Code**  
- 🎯 **API unifiée** - Moins de confusion
- 🎯 **Gestion d'erreur** cohérente
- 🎯 **Maintenance** simplifiée

### **UX**
- 🎨 **Actions plus rapides** - Moins d'attente
- 🎨 **Feedback amélioré** - Codes d'erreur clairs
- 🎨 **Nouvelles fonctionnalités** - Copie sans perte

---

## 🚨 **Points de Vigilance**

### **Tests Indispensables**
- ✅ Upload de différents types de fichiers
- ✅ Copie de médias entre collections
- ✅ Opérations batch avec gros volumes
- ✅ Gestion d'erreur et edge cases

### **Rétrocompatibilité**  
- ⚠️ Garder `uploadMediaService` temporairement
- ⚠️ Tester que les anciennes fonctionnalités marchent
- ⚠️ Migration progressive composant par composant

### **Performance**
- 📊 Monitorer les temps de réponse
- 📊 Valider que les batch operations sont efficaces  
- 📊 S'assurer que le cache fonctionne

---

Cette migration apportera une **amélioration significative** de l'architecture frontend avec une API plus cohérente et performante ! 🚀