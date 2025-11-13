import { api } from 'boot/axios'

/**
 * Service unifié pour la gestion des médias via l'API /api/media
 * Remplace l'ancien uploadMediaService avec une API consolidée et plus efficace
 */
export const mediaService = {
  /**
   * Upload unifié - détection automatique du type (single/multiple/fields)
   * @param {File|File[]|Object} files - Fichier(s) à uploader
   * @param {Object} options - Options d'upload (onUploadProgress, etc.)
   * @returns {Promise<Object>} Résultat de l'upload
   */
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
    } else if (typeof files === 'object' && files.constructor === Object) {
      // Fields upload - objet avec clés nommées
      Object.entries(files).forEach(([field, fieldFiles]) => {
        if (Array.isArray(fieldFiles)) {
          fieldFiles.forEach(file => formData.append(field, file))
        } else {
          formData.append(field, fieldFiles)
        }
      })
    } else if (files instanceof File) {
      // Single file
      formData.append('file', files)
    } else {
      throw new Error('Format de fichiers non supporté')
    }

    const response = await api.post('/api/media/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      ...options
    })
    
    return response.data
  },

  /**
   * Liste les médias avec filtres optionnels
   * @param {Object} filters - Filtres { type, search, limit, offset }
   * @returns {Promise<Object>} Liste des médias avec pagination
   */
  async list(filters = {}) {
    const params = new URLSearchParams()
    
    if (filters.type) params.append('type', filters.type)
    if (filters.search) params.append('search', filters.search)
    if (filters.limit) params.append('limit', filters.limit.toString())
    if (filters.offset) params.append('offset', filters.offset.toString())
    
    const response = await api.get(`/api/media?${params.toString()}`)
    return response.data
  },

  /**
   * Récupère les informations détaillées d'un média
   * @param {string} id - ID du média
   * @returns {Promise<Object>} Informations du média
   */
  async getInfo(id) {
    const response = await api.get(`/api/media/${id}`)
    return response.data
  },

  /**
   * Supprime un média
   * @param {string} id - ID du média à supprimer
   * @returns {Promise<Object>} Résultat de la suppression
   */
  async delete(id) {
    const response = await api.delete(`/api/media/${id}`)
    return response.data
  },

  /**
   * Copie un média vers une collection (optimisé - 1 requête)
   * @param {string} sourceUrl - URL du média source
   * @param {string} targetCollectionId - ID de la collection destination
   * @param {string} description - Description optionnelle
   * @returns {Promise<Object>} Résultat de la copie
   */
  async copy(sourceUrl, targetCollectionId, description = '') {
    const response = await api.post('/api/media/copy', {
      sourceUrl,
      targetCollectionId,
      description
    })
    return response.data
  },

  /**
   * Copie multiple de médias (batch operation optimisée)
   * @param {Array} operations - [{sourceUrl, targetCollectionId, description}]
   * @returns {Promise<Object>} Résultat des copies
   */
  async copyBatch(operations) {
    const response = await api.post('/api/media/copy-batch', {
      operations
    })
    return response.data
  },

  // ==========================================
  // Méthodes utilitaires conservées
  // ==========================================

  /**
   * Valide un fichier avant upload
   * @param {File} file - Fichier à valider
   * @returns {Object} { valid: boolean, error?: string }
   */
  validateFile(file) {
    const maxSize = 50 * 1024 * 1024 // 50MB
    const allowedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
      'video/mp4', 'video/webm', 'video/quicktime',
      'audio/mpeg', 'audio/wav'
    ]

    if (!file) {
      return { valid: false, error: 'Aucun fichier fourni' }
    }

    if (file.size > maxSize) {
      return { valid: false, error: `Fichier trop volumineux (max ${this.formatFileSize(maxSize)})` }
    }

    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: `Type de fichier non supporté: ${file.type}` }
    }

    return { valid: true }
  },

  /**
   * Formate une taille de fichier en octets vers une chaîne lisible
   * @param {number} bytes - Taille en octets
   * @returns {string} Taille formatée (ex: "1.5 MB")
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes'
    
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  },

  /**
   * Crée une URL de prévisualisation pour un fichier
   * @param {File} file - Fichier pour lequel créer une prévisualisation
   * @returns {string} URL de prévisualisation
   */
  createFilePreviewUrl(file) {
    return URL.createObjectURL(file)
  },

  /**
   * Libère une URL de prévisualisation
   * @param {string} url - URL à libérer
   */
  revokeFilePreviewUrl(url) {
    URL.revokeObjectURL(url)
  }
}

// ==========================================
// MIGRATION TERMINÉE 🎉
// L'ancienne API /api/upload a été remplacée par /api/media
// Tous les composants utilisent maintenant mediaService
// ==========================================

// Export par défaut pour faciliter les imports
export default mediaService