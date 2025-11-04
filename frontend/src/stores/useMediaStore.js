import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { uploadMediaService } from 'src/services/uploadMedia'

/**
 * Store Pinia pour la gestion des médias (images, vidéos, audio)
 * Permet de stocker, réutiliser et organiser les médias durant la session
 */
export const useMediaStore = defineStore('media', () => {
  // État réactif
  const medias = ref(new Map()) // Map<id, mediaInfo>
  const loading = ref(false)
  const error = ref(null)
  
  // Métadonnées de session
  const sessionStats = ref({
    totalUploaded: 0,
    totalSize: 0,
    lastUpload: null
  })

  // Computed - Listes filtrées par type
  const images = computed(() => {
    return Array.from(medias.value.values()).filter(media => media.type === 'image')
  })

  const videos = computed(() => {
    return Array.from(medias.value.values()).filter(media => media.type === 'video')
  })

  const audios = computed(() => {
    return Array.from(medias.value.values()).filter(media => media.type === 'audio')
  })

  const allMedias = computed(() => {
    return Array.from(medias.value.values()).sort((a, b) => 
      new Date(b.uploadedAt) - new Date(a.uploadedAt)
    )
  })

  // Computed - Statistiques
  const totalCount = computed(() => medias.value.size)
  const totalSize = computed(() => {
    return Array.from(medias.value.values()).reduce((sum, media) => sum + media.size, 0)
  })

  /**
   * Ajoute un média au store
   */
  function addMedia(mediaInfo) {
    const enhancedMedia = {
      ...mediaInfo,
      addedToStore: new Date().toISOString(),
      usageCount: 0,
      lastUsed: null
    }
    
    medias.value.set(mediaInfo.id, enhancedMedia)
    
    // Mise à jour des stats
    sessionStats.value.totalUploaded++
    sessionStats.value.totalSize += mediaInfo.size
    sessionStats.value.lastUpload = new Date().toISOString()
    
    return enhancedMedia
  }

  /**
   * Récupère un média par son ID (lecture seule)
   */
  function getMedia(id) {
    return medias.value.get(id)
  }

  /**
   * Récupère un média par son ID et marque comme utilisé
   */
  function useMedia(id) {
    const media = medias.value.get(id)
    if (media) {
      // Marquer comme utilisé
      media.usageCount++
      media.lastUsed = new Date().toISOString()
    }
    return media
  }

  /**
   * Upload un seul fichier et l'ajoute au store
   */
  async function uploadSingle(file) {
    try {
      loading.value = true
      error.value = null
      
      const result = await uploadMediaService.uploadSingle(file)
      
      if (result.success && result.media) {
        const media = addMedia(result.media)
        return media
      } else {
        throw new Error('Upload échoué')
      }
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Upload plusieurs fichiers et les ajoute au store
   */
  async function uploadMultiple(files) {
    try {
      loading.value = true
      error.value = null
      
      const result = await uploadMediaService.uploadMultiple(files)
      
      if (result.success) {
        const uploadedMedias = result.uploaded.map(mediaInfo => addMedia(mediaInfo))
        return {
          ...result,
          uploaded: uploadedMedias
        }
      } else {
        throw new Error('Upload multiple échoué')
      }
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Charge tous les médias existants depuis le serveur
   */
  async function loadAllMedias() {
    try {
      loading.value = true
      error.value = null
      
      const result = await uploadMediaService.listAllMedias()
      
      if (result.success && result.medias) {
        // Vider le store et recharger
        medias.value.clear()
        
        result.medias.forEach(mediaInfo => {
          medias.value.set(mediaInfo.id, {
            ...mediaInfo,
            addedToStore: new Date().toISOString(),
            usageCount: 0,
            lastUsed: null
          })
        })
        
        return result.medias
      } else {
        throw new Error('Chargement des médias échoué')
      }
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Supprime un média du store et du serveur
   */
  async function deleteMedia(id) {
    try {
      loading.value = true
      error.value = null
      
      await uploadMediaService.deleteMedia(id)
      
      // Supprimer du store local
      const media = medias.value.get(id)
      if (media) {
        sessionStats.value.totalSize -= media.size
        medias.value.delete(id)
      }
      
      return true
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Recherche de médias par nom, type ou métadonnées
   */
  function searchMedias(query) {
    const searchTerm = query.toLowerCase()
    
    return Array.from(medias.value.values()).filter(media => {
      return (
        media.originalName?.toLowerCase().includes(searchTerm) ||
        media.filename?.toLowerCase().includes(searchTerm) ||
        media.type?.toLowerCase().includes(searchTerm) ||
        media.id.toLowerCase().includes(searchTerm)
      )
    })
  }

  /**
   * Filtre les médias par type et taille
   */
  function filterMedias({ type, minSize, maxSize, dateFrom, dateTo } = {}) {
    return Array.from(medias.value.values()).filter(media => {
      if (type && media.type !== type) return false
      if (minSize && media.size < minSize) return false
      if (maxSize && media.size > maxSize) return false
      if (dateFrom && new Date(media.uploadedAt) < new Date(dateFrom)) return false
      if (dateTo && new Date(media.uploadedAt) > new Date(dateTo)) return false
      return true
    })
  }

  /**
   * Obtient les médias les plus utilisés
   */
  function getMostUsed(limit = 10) {
    return Array.from(medias.value.values())
      .filter(media => media.usageCount > 0)
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, limit)
  }

  /**
   * Obtient les médias récents
   */
  function getRecent(limit = 10) {
    return Array.from(medias.value.values())
      .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt))
      .slice(0, limit)
  }

  /**
   * Vide le store (garde les médias sur le serveur)
   */
  function clearStore() {
    medias.value.clear()
    sessionStats.value = {
      totalUploaded: 0,
      totalSize: 0,
      lastUpload: null
    }
    error.value = null
  }

  /**
   * Formate la taille d'un fichier
   */
  function formatFileSize(bytes) {
    return uploadMediaService.formatFileSize(bytes)
  }

  /**
   * Vérifie si un média existe dans le store
   */
  function hasMedia(id) {
    return medias.value.has(id)
  }

  /**
   * Clone/duplique un média (pour réutilisation)
   */
  function cloneMedia(id) {
    const media = medias.value.get(id)
    if (media) {
      return {
        ...media,
        usageCount: media.usageCount + 1,
        lastUsed: new Date().toISOString()
      }
    }
    return null
  }

  return {
    // État
    medias,
    loading,
    error,
    sessionStats,
    
    // Computed
    images,
    videos,  
    audios,
    allMedias,
    totalCount,
    totalSize,
    
    // Actions
    addMedia,
    getMedia,
    useMedia,
    uploadSingle,
    uploadMultiple,
    loadAllMedias,
    deleteMedia,
    searchMedias,
    filterMedias,
    getMostUsed,
    getRecent,
    clearStore,
    formatFileSize,
    hasMedia,
    cloneMedia
  }
})