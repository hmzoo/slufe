import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

/**
 * Store dédié à la gestion des templates de workflows
 * 
 * Les templates sont des workflows réutilisables avec:
 * - Les tâches d'input et d'output vierges
 * - Les propriétés de configuration préservées
 * - Sauvegardés sur le backend
 */
export const useTemplateStore = defineStore('template', () => {
  // ==================== STATE ====================
  
  const templates = ref([])
  const currentTemplate = ref(null)
  const loading = ref(false)
  const error = ref(null)
  
  // ==================== GETTERS ====================
  
  /**
   * Templates triés par date de création (plus récents en premier)
   */
  const sortedTemplates = computed(() => {
    return [...templates.value].sort((a, b) => {
      return new Date(b.createdAt) - new Date(a.createdAt)
    })
  })
  
  /**
   * Templates groupés par catégorie
   */
  const templatesByCategory = computed(() => {
    const grouped = {}
    
    templates.value.forEach(template => {
      const category = template.category || 'custom'
      if (!grouped[category]) {
        grouped[category] = []
      }
      grouped[category].push(template)
    })
    
    return grouped
  })
  
  /**
   * Catégories disponibles
   */
  const categories = computed(() => {
    const cats = new Set(templates.value.map(t => t.category || 'custom'))
    return Array.from(cats).sort()
  })
  
  /**
   * Nombre total de templates
   */
  const totalCount = computed(() => templates.value.length)
  
  /**
   * Vérifie si des templates sont chargés
   */
  const hasTemplates = computed(() => templates.value.length > 0)
  
  // ==================== ACTIONS ====================
  
  /**
   * Charge tous les templates depuis le backend
   */
  async function loadTemplates() {
    loading.value = true
    error.value = null
    
    try {
      console.log('📋 Chargement des templates depuis le backend...')
      
      const response = await axios.get(`${API_URL}/api/templates`)
      
      if (response.data.success) {
        templates.value = response.data.templates || []
        console.log(`✅ ${templates.value.length} template(s) chargé(s)`)
        return templates.value
      } else {
        throw new Error('Erreur lors du chargement des templates')
      }
      
    } catch (err) {
      console.error('❌ Erreur chargement templates:', err)
      error.value = err.message
      templates.value = []
      throw err
    } finally {
      loading.value = false
    }
  }
  
  /**
   * Charge un template spécifique par ID
   */
  async function loadTemplate(templateId) {
    loading.value = true
    error.value = null
    
    try {
      console.log(`📋 Chargement du template ${templateId}...`)
      
      const response = await axios.get(`${API_URL}/api/templates/${templateId}`)
      
      if (response.data.success) {
        currentTemplate.value = response.data.template
        console.log(`✅ Template "${currentTemplate.value.name}" chargé`)
        return currentTemplate.value
      } else {
        throw new Error('Template non trouvé')
      }
      
    } catch (err) {
      console.error(`❌ Erreur chargement template ${templateId}:`, err)
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }
  
  /**
   * Crée un nouveau template à partir d'un workflow
   * 
   * @param {Object} templateData - Données du template
   * @param {string} templateData.name - Nom du template
   * @param {string} templateData.description - Description
   * @param {string} templateData.category - Catégorie (custom, image, video, etc.)
   * @param {string} templateData.icon - Icône (Material Icons)
   * @param {Object} templateData.workflow - Workflow source
   * @param {string} templateData.originalWorkflowId - ID du workflow d'origine
   * @param {Array} templateData.tags - Tags pour filtrage
   */
  async function createTemplate(templateData) {
    loading.value = true
    error.value = null
    
    try {
      console.log(`💾 Création du template "${templateData.name}"...`)
      
      const response = await axios.post(`${API_URL}/api/templates`, templateData)
      
      if (response.data.success) {
        const newTemplate = response.data.template
        
        // Ajouter le template à la liste
        templates.value.push(newTemplate)
        
        console.log(`✅ Template "${newTemplate.name}" créé avec succès`)
        return newTemplate
      } else {
        throw new Error('Erreur lors de la création du template')
      }
      
    } catch (err) {
      console.error('❌ Erreur création template:', err)
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }
  
  /**
   * Met à jour un template existant
   */
  async function updateTemplate(templateId, updates) {
    loading.value = true
    error.value = null
    
    try {
      console.log(`🔄 Mise à jour du template ${templateId}...`)
      
      const response = await axios.put(`${API_URL}/api/templates/${templateId}`, updates)
      
      if (response.data.success) {
        const updatedTemplate = response.data.template
        
        // Mettre à jour dans la liste
        const index = templates.value.findIndex(t => t.id === templateId)
        if (index !== -1) {
          templates.value[index] = updatedTemplate
        }
        
        // Mettre à jour le template courant si c'est lui
        if (currentTemplate.value?.id === templateId) {
          currentTemplate.value = updatedTemplate
        }
        
        console.log(`✅ Template "${updatedTemplate.name}" mis à jour`)
        return updatedTemplate
      } else {
        throw new Error('Erreur lors de la mise à jour du template')
      }
      
    } catch (err) {
      console.error(`❌ Erreur mise à jour template ${templateId}:`, err)
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }
  
  /**
   * Supprime un template
   */
  async function deleteTemplate(templateId) {
    loading.value = true
    error.value = null
    
    try {
      console.log(`🗑️ Suppression du template ${templateId}...`)
      
      const response = await axios.delete(`${API_URL}/api/templates/${templateId}`)
      
      if (response.data.success) {
        // Retirer de la liste
        templates.value = templates.value.filter(t => t.id !== templateId)
        
        // Nettoyer le template courant si c'est lui
        if (currentTemplate.value?.id === templateId) {
          currentTemplate.value = null
        }
        
        console.log(`✅ Template supprimé`)
        return true
      } else {
        throw new Error('Erreur lors de la suppression du template')
      }
      
    } catch (err) {
      console.error(`❌ Erreur suppression template ${templateId}:`, err)
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }
  
  /**
   * Recherche de templates par nom/description/tags
   */
  function searchTemplates(query) {
    if (!query || query.trim() === '') {
      return templates.value
    }
    
    const searchQuery = query.toLowerCase()
    
    return templates.value.filter(template => {
      const nameMatch = template.name?.toLowerCase().includes(searchQuery)
      const descMatch = template.description?.toLowerCase().includes(searchQuery)
      const tagsMatch = template.tags?.some(tag => tag.toLowerCase().includes(searchQuery))
      const categoryMatch = template.category?.toLowerCase().includes(searchQuery)
      
      return nameMatch || descMatch || tagsMatch || categoryMatch
    })
  }
  
  /**
   * Filtre les templates par catégorie
   */
  function filterByCategory(category) {
    if (!category || category === 'all') {
      return templates.value
    }
    
    return templates.value.filter(t => t.category === category)
  }
  
  /**
   * Obtenir un template par ID (local)
   */
  function getTemplateById(templateId) {
    return templates.value.find(t => t.id === templateId)
  }
  
  /**
   * Dupliquer un template
   */
  async function duplicateTemplate(templateId) {
    const original = getTemplateById(templateId)
    
    if (!original) {
      throw new Error('Template non trouvé')
    }
    
    const duplicate = {
      name: `${original.name} (copie)`,
      description: original.description,
      category: original.category,
      icon: original.icon,
      workflow: JSON.parse(JSON.stringify(original.workflow)), // Deep copy
      tags: [...(original.tags || [])]
    }
    
    return await createTemplate(duplicate)
  }
  
  /**
   * Exporter un template en JSON
   */
  function exportTemplate(template) {
    const dataStr = JSON.stringify(template, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `template_${template.name.replace(/\s+/g, '_')}.json`
    link.click()
    
    URL.revokeObjectURL(url)
    
    console.log(`📥 Template "${template.name}" exporté`)
  }
  
  /**
   * Importer un template depuis JSON
   */
  async function importTemplate(jsonData) {
    try {
      const template = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData
      
      // Créer le template (sans l'ID pour éviter les conflits)
      const { id, createdAt, updatedAt, ...templateData } = template
      
      return await createTemplate(templateData)
      
    } catch (err) {
      console.error('❌ Erreur import template:', err)
      throw new Error('Format JSON invalide')
    }
  }
  
  /**
   * Réinitialise le store
   */
  function $reset() {
    templates.value = []
    currentTemplate.value = null
    loading.value = false
    error.value = null
  }
  
  // ==================== RETURN ====================
  
  return {
    // State
    templates,
    currentTemplate,
    loading,
    error,
    
    // Getters
    sortedTemplates,
    templatesByCategory,
    categories,
    totalCount,
    hasTemplates,
    
    // Actions
    loadTemplates,
    loadTemplate,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    searchTemplates,
    filterByCategory,
    getTemplateById,
    duplicateTemplate,
    exportTemplate,
    importTemplate,
    $reset
  }
})
