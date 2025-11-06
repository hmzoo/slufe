import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from 'src/boot/axios'
import { uploadMediaService } from 'src/services/uploadMedia'

export const useCollectionStore = defineStore('collections', () => {
  // State - Collections
  const collections = ref([])
  const currentCollection = ref(null) // Collection actuellement visualisée
  const serverCurrentCollection = ref(null) // Collection active sur le serveur
  const loading = ref(false)
  const error = ref(null)

  // State - Session temporaire (médias pas encore dans collections)
  const sessionMedias = ref(new Map())
  const sessionLoading = ref(false)
  const sessionError = ref(null)

  // Getters - Collections
  const hasCollections = computed(() => collections.value.length > 0)
  const hasCurrentCollection = computed(() => currentCollection.value !== null)
  const currentCollectionMedias = computed(() => currentCollection.value?.images || [])
  const currentCollectionStats = computed(() => {
    if (!currentCollection.value?.images) return { total: 0, images: 0, videos: 0 }
    
    const medias = currentCollection.value.images
    return {
      total: medias.length,
      images: medias.filter(m => m.type === 'image').length,
      videos: medias.filter(m => m.type === 'video').length
    }
  })

  // Getters - Médias globaux (session + collections)
  const allMedias = computed(() => {
    // Médias en session
    const sessionArray = Array.from(sessionMedias.value.values())
    
    // Médias dans collections
    const collectionMedias = collections.value.flatMap(c => c.images || [])
    
    return [...sessionArray, ...collectionMedias]
  })

  const images = computed(() => 
    allMedias.value.filter(m => m.type === 'image')
  )

  const videos = computed(() => 
    allMedias.value.filter(m => m.type === 'video')
  )

  const audios = computed(() => 
    allMedias.value.filter(m => m.type === 'audio')
  )

  const totalCount = computed(() => allMedias.value.length)

  const totalSize = computed(() => 
    allMedias.value.reduce((sum, m) => sum + (m.size || 0), 0)
  )

  // Actions
  const fetchCollections = async () => {
    try {
      loading.value = true
      error.value = null
      
      const response = await api.get('/collections')
      
      if (response.data?.success) {
        collections.value = response.data.collections || []
        return response.data.collections
      } else {
        throw new Error('Erreur lors du chargement des collections')
      }
    } catch (err) {
      error.value = err.message
      console.error('Erreur fetchCollections:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchCurrentCollection = async () => {
    try {
      const response = await api.get('/collections/current/info')
      
      if (response.data?.success && response.data.currentCollection) {
        serverCurrentCollection.value = response.data.currentCollection
        return response.data.currentCollection
      } else {
        serverCurrentCollection.value = null
        return null
      }
    } catch (err) {
      serverCurrentCollection.value = null
      console.log('Aucune collection courante définie')
      return null
    }
  }

  const fetchCollectionById = async (collectionId) => {
    try {
      const response = await api.get(`/collections/${collectionId}`)
      
      if (response.data?.success) {
        return response.data.collection
      } else {
        throw new Error('Collection non trouvée')
      }
    } catch (err) {
      console.error('Erreur fetchCollectionById:', err)
      throw err
    }
  }

  const viewCollection = async (collectionId) => {
    try {
      // Juste charger la collection pour l'affichage, sans la définir comme active
      const detailedCollection = await fetchCollectionById(collectionId)
      currentCollection.value = detailedCollection
      return detailedCollection
    } catch (err) {
      error.value = err.message
      console.error('Erreur viewCollection:', err)
      throw err
    }
  }

  const setCurrentCollection = async (collectionId) => {
    try {
      // 1. Définir comme collection courante sur le serveur
      const response = await api.post('/collections/current/set', { collectionId })
      
      if (response.data?.success) {
        // 2. Mettre à jour la collection active du serveur
        serverCurrentCollection.value = response.data.currentCollection
        
        // 3. Recharger les détails complets de la collection avec ses médias pour l'affichage
        const detailedCollection = await fetchCollectionById(collectionId)
        currentCollection.value = detailedCollection
        
        return detailedCollection
      } else {
        throw new Error('Erreur lors de la définition de la collection courante')
      }
    } catch (err) {
      error.value = err.message
      console.error('Erreur setCurrentCollection:', err)
      throw err
    }
  }

  const createCollection = async (collectionData) => {
    try {
      const response = await api.post('/collections', collectionData)
      
      if (response.data?.success) {
        // Recharger les collections après création
        await fetchCollections()
        
        // Si c'est la première collection, la définir comme courante
        if (collections.value.length === 1) {
          await setCurrentCollection(response.data.collection.id)
        }
        
        return response.data.collection
      } else {
        throw new Error(response.data?.message || 'Erreur lors de la création')
      }
    } catch (err) {
      error.value = err.message
      console.error('Erreur createCollection:', err)
      throw err
    }
  }

  const updateCollection = async (collectionId, collectionData) => {
    try {
      const response = await api.put(`/collections/${collectionId}`, collectionData)
      
      if (response.data?.success) {
        // Mettre à jour les collections locales
        await fetchCollections()
        
        // Si c'est la collection courante, la mettre à jour aussi
        if (currentCollection.value?.id === collectionId) {
          await fetchCurrentCollection()
        }
        
        return response.data.collection
      } else {
        throw new Error(response.data?.message || 'Erreur lors de la mise à jour')
      }
    } catch (err) {
      error.value = err.message
      console.error('Erreur updateCollection:', err)
      throw err
    }
  }

  const deleteCollection = async (collectionId) => {
    try {
      await api.delete(`/collections/${collectionId}`)
      
      // Supprimer de la liste locale
      collections.value = collections.value.filter(c => c.id !== collectionId)
      
      // Si c'était la collection courante, la réinitialiser
      if (currentCollection.value?.id === collectionId) {
        currentCollection.value = null
      }
      
      return true
    } catch (err) {
      error.value = err.message
      console.error('Erreur deleteCollection:', err)
      throw err
    }
  }

  const removeMediaFromCollection = async (collectionId, mediaId) => {
    try {
      // Trouver l'URL du média à partir de son mediaId
      let mediaUrl = null
      
      // Chercher dans la collection courante
      if (currentCollection.value?.id === collectionId) {
        const media = currentCollection.value.images?.find(m => m.mediaId === mediaId)
        mediaUrl = media?.url
      }
      
      // Si pas trouvé, chercher dans toutes les collections
      if (!mediaUrl) {
        const collection = collections.value.find(c => c.id === collectionId)
        const media = collection?.images?.find(m => m.mediaId === mediaId)
        mediaUrl = media?.url
      }
      
      if (!mediaUrl) {
        throw new Error(`Média ${mediaId} non trouvé dans la collection ${collectionId}`)
      }
      
      // L'API backend attend l'URL encodée
      const encodedUrl = encodeURIComponent(mediaUrl)
      console.log('🗑️ Suppression média URL:', mediaUrl, 'encodée:', encodedUrl)
      
      await api.delete(`/collections/${collectionId}/images/${encodedUrl}`)
      
      // Mettre à jour la collection locale
      const collection = collections.value.find(c => c.id === collectionId)
      if (collection?.images) {
        collection.images = collection.images.filter(m => m.mediaId !== mediaId)
      }
      
      // Mettre à jour aussi la collection courante si c'est la même
      if (currentCollection.value?.id === collectionId && currentCollection.value.images) {
        currentCollection.value.images = currentCollection.value.images.filter(m => m.mediaId !== mediaId)
      }
      
      return true
    } catch (err) {
      error.value = err.message
      console.error('Erreur removeMediaFromCollection:', err)
      throw err
    }
  }

  const addMediaToCollection = async (collectionId, mediaData) => {
    try {
      const response = await api.post(`/collections/${collectionId}/images`, {
        url: mediaData.url,
        mediaId: mediaData.mediaId,
        description: mediaData.description || ''
      })
      
      if (response.data?.success) {
        // Recharger les collections pour avoir les données à jour
        await fetchCollections()
        return response.data.collection
      } else {
        throw new Error('Erreur lors de l\'ajout du média à la collection')
      }
    } catch (err) {
      error.value = err.message
      console.error('Erreur addMediaToCollection:', err)
      throw err
    }
  }

  // Fonction utilitaire pour rafraîchir tout
  const refreshAll = async () => {
    await Promise.all([
      fetchCollections(),
      fetchCurrentCollection()
    ])
  }

  // Fonction pour initialiser le store
  const initialize = async () => {
    await refreshAll()
  }

  // Sélection de médias pour workflows
  const selectedMediasForWorkflow = ref([])
  const workflowSelectionMode = ref(false)

  const toggleWorkflowSelectionMode = () => {
    workflowSelectionMode.value = !workflowSelectionMode.value
    if (!workflowSelectionMode.value) {
      selectedMediasForWorkflow.value = []
    }
  }

  const toggleMediaForWorkflow = (media) => {
    const index = selectedMediasForWorkflow.value.findIndex(m => m.mediaId === media.mediaId)
    if (index === -1) {
      selectedMediasForWorkflow.value.push(media)
    } else {
      selectedMediasForWorkflow.value.splice(index, 1)
    }
  }

  const selectAllMediasForWorkflow = () => {
    if (selectedMediasForWorkflow.value.length === currentCollectionMedias.value.length) {
      selectedMediasForWorkflow.value = []
    } else {
      selectedMediasForWorkflow.value = [...currentCollectionMedias.value]
    }
  }

  const clearWorkflowSelection = () => {
    selectedMediasForWorkflow.value = []
    workflowSelectionMode.value = false
  }

  // ========== NOUVELLES FONCTIONNALITÉS: GESTION MÉDIAS SESSION ==========

  // Actions - Upload vers session temporaire
  const uploadSingle = async (file) => {
    try {
      sessionLoading.value = true
      sessionError.value = null
      
      const result = await uploadMediaService.uploadSingle(file)
      
      if (result.success && result.media) {
        const media = {
          ...result.media,
          inSession: true,
          usageCount: 0,
          lastUsed: null,
          addedToStore: new Date().toISOString()
        }
        sessionMedias.value.set(result.media.id, media)
        return media
      } else {
        throw new Error('Upload échoué')
      }
    } catch (err) {
      sessionError.value = err.message
      throw err
    } finally {
      sessionLoading.value = false
    }
  }

  const uploadMultiple = async (files) => {
    try {
      sessionLoading.value = true
      sessionError.value = null
      
      const result = await uploadMediaService.uploadMultiple(files)
      
      if (result.success) {
        const uploadedMedias = result.uploaded.map(mediaInfo => {
          const media = {
            ...mediaInfo,
            inSession: true,
            usageCount: 0,
            lastUsed: null,
            addedToStore: new Date().toISOString()
          }
          sessionMedias.value.set(mediaInfo.id, media)
          return media
        })
        return {
          ...result,
          uploaded: uploadedMedias
        }
      } else {
        throw new Error('Upload multiple échoué')
      }
    } catch (err) {
      sessionError.value = err.message
      throw err
    } finally {
      sessionLoading.value = false
    }
  }

  // Actions - Gestion session
  const getMedia = (id) => {
    // Chercher en session
    const sessionMedia = sessionMedias.value.get(id)
    if (sessionMedia) return sessionMedia
    
    // Chercher dans collections
    for (const collection of collections.value) {
      const media = collection.images?.find(m => m.mediaId === id || m.id === id)
      if (media) return media
    }
    
    return null
  }

  const useMedia = (id) => {
    const media = getMedia(id)
    if (media && media.inSession) {
      // Marquer comme utilisé si c'est un média de session
      media.usageCount++
      media.lastUsed = new Date().toISOString()
    }
    return media
  }

  const moveToCollection = async (mediaId, collectionId) => {
    const media = sessionMedias.value.get(mediaId)
    if (!media) {
      throw new Error(`Média ${mediaId} non trouvé dans la session`)
    }
    
    await addMediaToCollection(collectionId, media)
    sessionMedias.value.delete(mediaId)
  }

  const clearSession = () => {
    sessionMedias.value.clear()
  }

  const loadAllMedias = async () => {
    // Recharger les collections
    await fetchCollections()
    // Note: Les médias de session restent inchangés
  }

  const deleteMedia = async (id) => {
    // Si c'est un média de session
    if (sessionMedias.value.has(id)) {
      sessionMedias.value.delete(id)
      return
    }
    
    // Si c'est dans une collection, trouver et supprimer
    for (const collection of collections.value) {
      const media = collection.images?.find(m => m.mediaId === id || m.id === id)
      if (media) {
        await removeMediaFromCollection(collection.id, media.mediaId || id)
        return
      }
    }
  }

  // Méthodes utilitaires
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const getRecent = (limit = 20) => {
    return allMedias.value
      .sort((a, b) => {
        const dateA = new Date(a.uploadedAt || a.addedToStore || 0)
        const dateB = new Date(b.uploadedAt || b.addedToStore || 0)
        return dateB - dateA
      })
      .slice(0, limit)
  }

  const getMostUsed = (limit = 20) => {
    return allMedias.value
      .filter(m => m.usageCount && m.usageCount > 0)
      .sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0))
      .slice(0, limit)
  }

  const searchMedias = (query) => {
    if (!query || query.trim() === '') return allMedias.value
    
    const lowerQuery = query.toLowerCase()
    return allMedias.value.filter(m => 
      m.filename?.toLowerCase().includes(lowerQuery) ||
      m.description?.toLowerCase().includes(lowerQuery) ||
      m.name?.toLowerCase().includes(lowerQuery) ||
      m.mediaId?.toLowerCase().includes(lowerQuery)
    )
  }

  // Fonction pour réinitialiser le store
  const reset = () => {
    collections.value = []
    currentCollection.value = null
    serverCurrentCollection.value = null
    loading.value = false
    error.value = null
    selectedMediasForWorkflow.value = []
    workflowSelectionMode.value = false
    sessionMedias.value.clear()
    sessionLoading.value = false
    sessionError.value = null
  }

  return {
    // State - Collections
    collections,
    currentCollection,
    serverCurrentCollection,
    loading,
    error,

    // State - Session
    sessionMedias,
    sessionLoading,
    sessionError,

    // Workflow selection state
    selectedMediasForWorkflow,
    workflowSelectionMode,

    // Getters - Collections
    hasCollections,
    hasCurrentCollection,
    currentCollectionMedias,
    currentCollectionStats,

    // Getters - Médias globaux
    allMedias,
    images,
    videos,
    audios,
    totalCount,
    totalSize,

    // Actions - Collections
    fetchCollections,
    fetchCurrentCollection,
    fetchCollectionById,
    viewCollection,
    setCurrentCollection,
    createCollection,
    updateCollection,
    deleteCollection,
    addMediaToCollection,
    removeMediaFromCollection,
    
    // Actions - Session & Upload
    uploadSingle,
    uploadMultiple,
    getMedia,
    useMedia,
    moveToCollection,
    clearSession,
    loadAllMedias,
    deleteMedia,

    // Méthodes utilitaires
    formatFileSize,
    getRecent,
    getMostUsed,
    searchMedias,
    
    // Workflow selection actions
    toggleWorkflowSelectionMode,
    toggleMediaForWorkflow,
    selectAllMediasForWorkflow,
    clearWorkflowSelection,
    
    // Initialisation
    refreshAll,
    initialize,
    reset
  }
})