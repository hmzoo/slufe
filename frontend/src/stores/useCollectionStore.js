import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from 'src/boot/axios'

export const useCollectionStore = defineStore('collections', () => {
  // State
  const collections = ref([])
  const currentCollection = ref(null) // Collection actuellement visualisée
  const serverCurrentCollection = ref(null) // Collection active sur le serveur
  const loading = ref(false)
  const error = ref(null)

  // Getters
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

  // Fonction pour réinitialiser le store
  const reset = () => {
    collections.value = []
    currentCollection.value = null
    serverCurrentCollection.value = null
    loading.value = false
    error.value = null
    selectedMediasForWorkflow.value = []
    workflowSelectionMode.value = false
  }

  return {
    // State
    collections,
    currentCollection,
    serverCurrentCollection,
    loading,
    error,

    // Workflow selection state
    selectedMediasForWorkflow,
    workflowSelectionMode,

    // Getters
    hasCollections,
    hasCurrentCollection,
    currentCollectionMedias,
    currentCollectionStats,

    // Actions
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
    
    // Workflow selection actions
    toggleWorkflowSelectionMode,
    toggleMediaForWorkflow,
    selectAllMediasForWorkflow,
    clearWorkflowSelection,
    
    refreshAll,
    initialize,
    reset
  }
})