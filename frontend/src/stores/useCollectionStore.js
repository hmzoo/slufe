import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from 'src/boot/axios'
import { mediaService } from 'src/services/mediaService'

export const useCollectionStore = defineStore('collections', () => {
  // Clés localStorage pour la persistance
  const STORAGE_KEYS = {
    CURRENT_COLLECTION_ID: 'slufe_current_collection_id',
    DEFAULT_COLLECTION_ID: 'slufe_default_collection_id'
  }

  // Fonctions utilitaires localStorage
  const saveCurrentCollectionToStorage = (collectionId) => {
    try {
      if (collectionId) {
        localStorage.setItem(STORAGE_KEYS.CURRENT_COLLECTION_ID, collectionId)
        // Aussi sauvegarder comme collection par défaut
        localStorage.setItem(STORAGE_KEYS.DEFAULT_COLLECTION_ID, collectionId)
      }
    } catch (e) {
      console.warn('Impossible de sauvegarder la collection dans localStorage:', e)
    }
  }

  const getCurrentCollectionFromStorage = () => {
    try {
      return localStorage.getItem(STORAGE_KEYS.CURRENT_COLLECTION_ID)
    } catch (e) {
      console.warn('Impossible de lire la collection depuis localStorage:', e)
      return null
    }
  }

  const getDefaultCollectionFromStorage = () => {
    try {
      return localStorage.getItem(STORAGE_KEYS.DEFAULT_COLLECTION_ID)
    } catch (e) {
      console.warn('Impossible de lire la collection par défaut depuis localStorage:', e)
      return null
    }
  }
  // State - Collections
  const collections = ref([])
  const currentCollection = ref(null) // Collection actuellement visualisée
  const serverCurrentCollection = ref(null) // Collection active sur le serveur
  const defaultCollection = ref(null) // Collection par défaut pour la première visite
  const loading = ref(false)
  const error = ref(null)
  const initialized = ref(false) // Flag pour éviter les doubles initialisations

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

  // Collection active avec fallback
  const activeCollection = computed(() => {
    // 1. Prioriser la collection couramment visualisée
    if (currentCollection.value) {
      return currentCollection.value
    }
    
    // 2. Sinon utiliser la collection active du serveur
    if (serverCurrentCollection.value) {
      return serverCurrentCollection.value
    }
    
    // 3. Sinon essayer la première collection disponible
    if (collections.value.length > 0) {
      return collections.value[0]
    }
    
    return null
  })

  // ID de la collection active
  const activeCollectionId = computed(() => activeCollection.value?.id || null)

  // Collection par défaut (pour nouvelle visite)
  const defaultCollectionComputed = computed(() => {
    // 1. Si définie explicitement
    if (defaultCollection.value) {
      const found = collections.value.find(c => c.id === defaultCollection.value)
      if (found) return found
    }
    
    // 2. Sinon la collection active du serveur
    if (serverCurrentCollection.value) {
      return serverCurrentCollection.value
    }
    
    // 3. Sinon la première collection disponible
    if (collections.value.length > 0) {
      return collections.value[0]
    }
    
    return null
  })

  const defaultCollectionId = computed(() => defaultCollectionComputed.value?.id || null)

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
        
        // 3. Sauvegarder dans localStorage pour persistance
        saveCurrentCollectionToStorage(collectionId)
        
        // 4. Recharger les détails complets de la collection avec ses médias pour l'affichage
        const detailedCollection = await fetchCollectionById(collectionId)
        currentCollection.value = detailedCollection
        
        console.log('✅ Collection active définie et sauvegardée:', collectionId)
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

  // Définir la collection par défaut pour les nouvelles visites
  const setDefaultCollection = (collectionId) => {
    try {
      if (collectionId) {
        const exists = collections.value.find(c => c.id === collectionId)
        if (exists) {
          defaultCollection.value = collectionId
          localStorage.setItem(STORAGE_KEYS.DEFAULT_COLLECTION_ID, collectionId)
          console.log('🏠 Collection par défaut définie:', collectionId)
        } else {
          console.warn('⚠️ Collection par défaut inexistante:', collectionId)
        }
      } else {
        defaultCollection.value = null
        localStorage.removeItem(STORAGE_KEYS.DEFAULT_COLLECTION_ID)
        console.log('🏠 Collection par défaut réinitialisée')
      }
    } catch (e) {
      console.warn('Impossible de sauvegarder la collection par défaut:', e)
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
      
      // Si c'était la collection par défaut, la réinitialiser
      if (defaultCollection.value === collectionId) {
        setDefaultCollection(null)
        console.log('🧹 Collection par défaut supprimée:', collectionId)
      }
      
      // Si c'était la collection active, nettoyer localStorage
      const storedCollectionId = getCurrentCollectionFromStorage()
      if (storedCollectionId === collectionId) {
        localStorage.removeItem(STORAGE_KEYS.CURRENT_COLLECTION_ID)
        console.log('🧹 Collection supprimée du localStorage:', collectionId)
        
        // Essayer de définir une nouvelle collection par défaut
        if (collections.value.length > 0) {
          const newDefaultCollection = collections.value[0]
          console.log('🎯 Nouvelle collection par défaut:', newDefaultCollection.id)
          setDefaultCollection(newDefaultCollection.id)
          await setCurrentCollection(newDefaultCollection.id)
        }
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

  // Fonction pour initialiser la collection active
  const initializeCurrentCollection = async () => {
    try {
      console.log('🔄 Initialisation de la collection active...')
      
      // 1. Priorité: Essayer depuis localStorage en premier
      const storedCollectionId = getCurrentCollectionFromStorage()
      if (storedCollectionId) {
        console.log('📱 Collection trouvée en localStorage:', storedCollectionId)
        try {
          // Vérifier que la collection existe encore
          const detailedCollection = await fetchCollectionById(storedCollectionId)
          if (detailedCollection) {
            console.log('✅ Collection restaurée depuis localStorage:', storedCollectionId)
            currentCollection.value = detailedCollection
            return
          }
        } catch (e) {
          console.warn('⚠️ Collection stockée introuvable, nettoyage localStorage')
          localStorage.removeItem(STORAGE_KEYS.CURRENT_COLLECTION_ID)
        }
      }
      
      // 2. Ensuite essayer de récupérer la collection active depuis le serveur
      await fetchCurrentCollection()
      if (serverCurrentCollection.value) {
        currentCollection.value = serverCurrentCollection.value
        return
      }
      
      // 3. Si toujours pas de collection active, prendre la première disponible comme défaut
      if (collections.value.length > 0) {
        const firstCollection = collections.value[0]
        console.log('🎯 Définition de la collection par défaut:', firstCollection.id)
        setDefaultCollection(firstCollection.id)
        await setCurrentCollection(firstCollection.id)
        return
      }
      
      // 4. Si aucune collection n'existe, l'utilisateur devra en créer une
      if (collections.value.length === 0) {
        console.log('📝 Aucune collection disponible - l\'utilisateur devra en créer une')
      }
      
    } catch (err) {
      console.error('❌ Erreur lors de l\'initialisation de la collection active:', err)
    }
  }

  // Fonction pour initialiser le store
  const initialize = async () => {
    if (initialized.value) {
      console.log('⏩ Store collections déjà initialisé, ignoré')
      return
    }

    try {
      initialized.value = true
      console.log('🚀 Initialisation du store collections...')
      
      // 0. Charger la collection par défaut depuis localStorage
      const storedDefaultCollectionId = getDefaultCollectionFromStorage()
      if (storedDefaultCollectionId) {
        defaultCollection.value = storedDefaultCollectionId
        console.log('🏠 Collection par défaut restaurée depuis localStorage:', storedDefaultCollectionId)
      }
      
      // 1. Charger toutes les collections
      await refreshAll()
      
      // 2. Initialiser la collection active
      await initializeCurrentCollection()
      
      console.log('✅ Store collections initialisé')
    } catch (err) {
      initialized.value = false // Permettre de réessayer en cas d'erreur
      console.error('❌ Erreur lors de l\'initialisation du store collections:', err)
      throw err
    }
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

  // Actions - Upload vers session temporaire (API unifiée)
  const uploadSingle = async (file) => {
    try {
      sessionLoading.value = true
      sessionError.value = null
      
      const result = await mediaService.upload(file)
      
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
      
      const result = await mediaService.upload(files)
      
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

  // ==========================================
  // Nouvelles méthodes optimisées (API unifiée)
  // ==========================================

  /**
   * Copie un média vers une collection de manière optimisée (1 requête)
   * @param {string} sourceUrl - URL du média source
   * @param {string} targetCollectionId - ID collection destination
   * @param {string} description - Description optionnelle
   */
  const copyMediaToCollection = async (sourceUrl, targetCollectionId, description = '') => {
    try {
      const result = await mediaService.copy(sourceUrl, targetCollectionId, description)
      
      if (result.success) {
        // Recharger collections pour refléter les changements
        await fetchCollections()
        return result
      } else {
        throw new Error(result.error || 'Erreur lors de la copie')
      }
    } catch (err) {
      error.value = err.message
      console.error('Erreur copyMediaToCollection:', err)
      throw err
    }
  }

  /**
   * Copie multiple optimisée de médias vers collections (batch)
   * @param {Array} operations - [{sourceUrl, targetCollectionId, description}]
   */
  const copyMediasBatchToCollections = async (operations) => {
    try {
      const result = await mediaService.copyBatch(operations)
      
      if (result.success) {
        // Recharger collections pour refléter les changements
        await fetchCollections()
        return result
      } else {
        throw new Error(result.error || 'Erreur lors de la copie batch')
      }
    } catch (err) {
      error.value = err.message
      console.error('Erreur copyMediasBatchToCollections:', err)
      throw err
    }
  }

  /**
   * Déplacement optimisé de médias entre collections
   * @param {Array} mediaUrls - URLs des médias à déplacer
   * @param {string} sourceCollectionId - ID collection source
   * @param {string} targetCollectionId - ID collection destination
   */
  const moveMediasBetweenCollections = async (mediaUrls, sourceCollectionId, targetCollectionId) => {
    try {
      // 1. Copier vers destination (batch optimisé)
      const operations = mediaUrls.map(url => ({
        sourceUrl: url,
        targetCollectionId: targetCollectionId
      }))
      
      const copyResult = await mediaService.copyBatch(operations)
      
      if (!copyResult.success) {
        throw new Error('Erreur lors de la copie')
      }
      
      // 2. Supprimer de la collection source (si différente de destination)
      if (sourceCollectionId !== targetCollectionId) {
        for (const mediaUrl of mediaUrls) {
          try {
            // Extraire l'ID du média depuis l'URL
            const mediaId = mediaUrl.split('/').pop()?.split('.')[0]
            if (mediaId) {
              await removeMediaFromCollection(sourceCollectionId, mediaId)
            }
          } catch (removeErr) {
            console.warn('Erreur suppression média source:', removeErr)
          }
        }
      }
      
      // 3. Recharger collections
      await fetchCollections()
      
      return {
        success: true,
        moved: copyResult.summary.successful_copies,
        failed: copyResult.summary.failed_copies,
        details: copyResult
      }
      
    } catch (err) {
      error.value = err.message
      console.error('Erreur moveMediasBetweenCollections:', err)
      throw err
    }
  }

  // Fonction pour réinitialiser le store
  const reset = () => {
    collections.value = []
    currentCollection.value = null
    serverCurrentCollection.value = null
    defaultCollection.value = null
    loading.value = false
    error.value = null
    selectedMediasForWorkflow.value = []
    workflowSelectionMode.value = false
    sessionMedias.value.clear()
    sessionLoading.value = false
    sessionError.value = null
    initialized.value = false // Permettre une nouvelle initialisation
  }

  return {
    // State - Collections
    collections,
    currentCollection,
    serverCurrentCollection,
    defaultCollection,
    loading,
    error,
    initialized,

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
    activeCollection,
    activeCollectionId,
    defaultCollectionComputed,
    defaultCollectionId,

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
    setDefaultCollection,
    createCollection,
    updateCollection,
    deleteCollection,
    addMediaToCollection,
    removeMediaFromCollection,
    
    // Actions - Session & Upload
    uploadSingle,
    uploadMultiple,
    
    // Actions - Copy/Move optimisées (API unifiée)
    copyMediaToCollection,
    copyMediasBatchToCollections,
    moveMediasBetweenCollections,
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
    
    // Initialisation et collection active
    refreshAll,
    initialize,
    initializeCurrentCollection,
    reset,
    
    // Fonctions utilitaires collection active
    saveCurrentCollectionToStorage,
    getCurrentCollectionFromStorage,
    getDefaultCollectionFromStorage
  }
})