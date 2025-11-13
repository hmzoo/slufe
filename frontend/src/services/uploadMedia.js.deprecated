import { api } from 'boot/axios'

/**
 * Service frontend pour gérer les uploads de médias
 */
export const uploadMediaService = {
  /**
   * Upload un seul fichier
   * @param {File} file - Fichier à uploader
   * @returns {Promise} - Promesse avec les infos du média uploadé
   */
  async uploadSingle(file) {
    const formData = new FormData()
    formData.append('file', file)

    const response = await api.post('/upload/single', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      // Progress callback pour suivre l'upload
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
        console.log(`Upload progress: ${percentCompleted}%`)
      }
    })

    return response.data
  },

  /**
   * Upload plusieurs fichiers
   * @param {File[]} files - Array de fichiers à uploader
   * @returns {Promise} - Promesse avec les infos des médias uploadés
   */
  async uploadMultiple(files) {
    const formData = new FormData()
    
    files.forEach((file) => {
      formData.append('files', file)
    })

    const response = await api.post('/upload/multiple', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
        console.log(`Upload progress: ${percentCompleted}%`)
      }
    })

    return response.data
  },

  /**
   * Upload avec champs multiples
   * @param {Object} fieldFiles - Objet avec champs et fichiers { image: [File], video: [File] }
   * @returns {Promise} - Promesse avec les infos des médias uploadés
   */
  async uploadFields(fieldFiles) {
    const formData = new FormData()
    
    // Ajoute les fichiers pour chaque champ
    Object.entries(fieldFiles).forEach(([fieldName, files]) => {
      if (Array.isArray(files)) {
        files.forEach((file) => {
          formData.append(fieldName, file)
        })
      } else {
        formData.append(fieldName, files)
      }
    })

    const response = await api.post('/upload/fields', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
        console.log(`Upload progress: ${percentCompleted}%`)
      }
    })

    return response.data
  },

  /**
   * Récupère les informations d'un média par son ID
   * @param {string} id - ID du média
   * @returns {Promise} - Promesse avec les infos du média
   */
  async getMediaInfo(id) {
    const response = await api.get(`/upload/media/${id}`)
    return response.data
  },

  /**
   * Liste tous les médias disponibles
   * @returns {Promise} - Promesse avec la liste des médias
   */
  async listAllMedias() {
    const response = await api.get('/upload/medias')
    return response.data
  },

  /**
   * Supprime un média par son ID
   * @param {string} id - ID du média à supprimer
   * @returns {Promise} - Promesse de suppression
   */
  async deleteMedia(id) {
    const response = await api.delete(`/upload/media/${id}`)
    return response.data
  },

  /**
   * Supprime un média
   * @param {string} mediaId - ID du média à supprimer
   * @returns {Promise} - Promesse avec le résultat de la suppression
   */
  async deleteMedia(mediaId) {
    const response = await api.delete(`/upload/media/${mediaId}`)
    return response.data
  },

  /**
   * Liste tous les médias
   * @returns {Promise} - Promesse avec la liste des médias
   */
  async listAllMedias() {
    const response = await api.get('/upload/medias')
    return response.data
  },

  /**
   * Valide un fichier avant upload
   * @param {File} file - Fichier à valider
   * @returns {Object} - Résultat de la validation
   */
  validateFile(file) {
    const maxSize = 100 * 1024 * 1024 // 100MB
    const allowedTypes = [
      // Images
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 
      'image/webp', 'image/bmp', 'image/tiff',
      // Vidéos
      'video/mp4', 'video/avi', 'video/mov', 'video/wmv',
      'video/flv', 'video/webm', 'video/mkv',
      // Audio
      'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/aac'
    ]

    if (file.size > maxSize) {
      return {
        valid: false,
        error: `Fichier trop volumineux: ${Math.round(file.size / 1024 / 1024)}MB (max: 100MB)`
      }
    }

    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: `Type de fichier non supporté: ${file.type}`
      }
    }

    return {
      valid: true,
      type: file.type.startsWith('image/') ? 'image' : 
            file.type.startsWith('video/') ? 'video' :
            file.type.startsWith('audio/') ? 'audio' : 'unknown',
      size: file.size,
      sizeFormatted: this.formatFileSize(file.size)
    }
  },

  /**
   * Formate la taille d'un fichier pour affichage
   * @param {number} bytes - Taille en bytes
   * @returns {string} - Taille formatée
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  },

  /**
   * Convertit un fichier en URL locale temporaire pour prévisualisation
   * @param {File} file - Fichier à convertir
   * @returns {string} - URL locale temporaire
   */
  createFilePreviewUrl(file) {
    return URL.createObjectURL(file)
  },

  /**
   * Libère une URL temporaire créée avec createFilePreviewUrl
   * @param {string} url - URL à libérer
   */
  revokeFilePreviewUrl(url) {
    URL.revokeObjectURL(url)
  }
}