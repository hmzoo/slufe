import { ref } from 'vue'
import { api } from 'src/boot/axios'

// Utiliser l'instance axios configurée dans boot/axios.js
// qui gère automatiquement les URLs en dev et prod

/**
 * Composable pour l'exécution de workflows/templates
 * Centralise la logique d'exécution et la gestion des résultats
 */
export function useWorkflowExecution() {
  // State
  const executing = ref(false)
  const executionResult = ref(null)
  const executionError = ref(null)
  const executionTime = ref(0)

  /**
   * Upload une image et retourne son URL
   * @param {File} imageFile - Fichier image à uploader
   * @returns {Promise<string>} URL de l'image uploadée
   */
  const uploadImage = async (imageFile) => {
    const formData = new FormData()
    formData.append('file', imageFile)

    try {
      const response = await api.post('/media/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      
      console.log('📥 Réponse complète du upload:', response.data)
      
      // Structure réelle: { success, type: 'fields', results: { file: { uploaded: [{url, ...}] } } }
      if (response.data.success) {
        let url = null
        
        // Cas 1: Type 'fields' (structure actuelle)
        if (response.data.type === 'fields' && response.data.results?.file?.uploaded?.[0]?.url) {
          url = response.data.results.file.uploaded[0].url
        }
        // Cas 2: Type 'single' (structure alternative)
        else if (response.data.type === 'single' && response.data.media?.url) {
          url = response.data.media.url
        }
        // Cas 3: URL à la racine
        else if (response.data.url) {
          url = response.data.url
        }
        
        if (url) {
          console.log('✅ URL extraite:', url)
          return url
        }
      }
      
      console.log('⚠️ Structure réponse non attendue:', JSON.stringify(response.data))
      throw new Error('Réponse invalide du serveur lors de l\'upload')
    } catch (error) {
      console.error('❌ Erreur lors de l\'upload de l\'image:', error)
      throw new Error(`Impossible d'uploader l'image: ${error.message}`)
    }
  }

  /**
   * Prépare les URLs des images uploadées
   * @param {object} inputs - Inputs avec possibles File objects
   * @returns {Promise<object>} Mapping id -> URL pour les images
   */
  const prepareImageUrls = async (inputs) => {
    const imageUrls = {}

    for (const [key, value] of Object.entries(inputs)) {
      if (value instanceof File) {
        console.log(`📤 Upload de l'image: ${key}`)
        const imageUrl = await uploadImage(value)
        imageUrls[key] = imageUrl
        console.log(`✅ Image uploadée: ${key} → ${imageUrl}`)
      }
    }

    return imageUrls
  }

  /**
   * Injecte les données du formulaire dans le workflow
   * Les tâches input reçoivent les valeurs saisies par l'utilisateur
   * @param {object} workflow - Workflow à modifier
   * @param {object} inputs - Données du formulaire
   * @param {object} imageUrls - URLs des images uploadées
   * @returns {object} Workflow modifié avec les données injectées
   */
  const injectFormDataIntoWorkflow = (workflow, inputs, imageUrls) => {
    console.log('3️⃣ Injection des données dans le workflow...')
    console.log('  workflow.inputs reçu:', workflow.inputs?.map(t => ({
      id: t.id,
      type: t.type,
      selectedImage: t.selectedImage,
      userInput: t.userInput
    })))
    
    // Créer une copie profonde du workflow pour ne pas modifier l'original
    const workflowCopy = JSON.parse(JSON.stringify(workflow))
    
    console.log('  workflowCopy.inputs après JSON.parse:', workflowCopy.inputs?.map(t => ({
      id: t.id,
      type: t.type,
      selectedImage: t.selectedImage,
      userInput: t.userInput
    })))
    
    // Injecter les données dans les tâches input
    if (workflowCopy.inputs && Array.isArray(workflowCopy.inputs)) {
      for (const inputTask of workflowCopy.inputs) {
        const inputId = inputTask.id
        
        if (inputTask.type === 'image_input') {
          // Pour les images: utiliser l'URL uploadée
          if (imageUrls[inputId]) {
            inputTask.selectedImage = imageUrls[inputId]
            console.log(`  ✅ Image injectée: ${inputId} = ${imageUrls[inputId]}`)
          }
        } else if (inputTask.type === 'text_input') {
          // Pour le texte: utiliser la valeur du formulaire
          if (inputs[inputId] !== undefined) {
            inputTask.userInput = inputs[inputId]
            console.log(`  ✅ Texte injecté: ${inputId} = ${inputs[inputId]}`)
          }
        } else {
          // Autres types d'inputs (select, number, etc.)
          if (inputs[inputId] !== undefined) {
            inputTask.userInput = inputs[inputId]
            console.log(`  ✅ Valeur injectée: ${inputId} = ${inputs[inputId]}`)
          }
        }
      }
    }
    
    console.log('  workflowCopy.inputs après injection:', workflowCopy.inputs?.map(t => ({
      id: t.id,
      type: t.type,
      selectedImage: t.selectedImage,
      userInput: t.userInput
    })))
    
    return workflowCopy
  }

  /**
   * Exécute un workflow avec les inputs fournis
   * Gère l'upload des images et l'injection des données dans le workflow
   * @param {object} workflow - Structure du workflow (template)
   * @param {object} inputs - Inputs du formulaire (peuvent contenir des File objects)
   * @returns {Promise<object>} Les résultats de l'exécution
   */
  const executeWorkflow = async (workflow, inputs) => {
    executing.value = true
    executionResult.value = null
    executionError.value = null

    const startTime = performance.now()

    try {
      console.log('🚀 Exécution du workflow...')
      
      // 1️⃣ UPLOADER LES IMAGES
      console.log('1️⃣ Upload des images du formulaire...')
      const imageUrls = await prepareImageUrls(inputs)
      console.log('✅ Images uploadées:', imageUrls)

      // 2️⃣ INJECTER LES DONNÉES DANS LE WORKFLOW
      const workflowToExecute = injectFormDataIntoWorkflow(workflow, inputs, imageUrls)
      
      // Ajouter un ID unique si manquant
      if (!workflowToExecute.id) {
        workflowToExecute.id = `template-${Date.now()}-${Math.random().toString(36).substring(7)}`
      }
      console.log(`✅ Workflow préparé avec ID: ${workflowToExecute.id}`)

            // 3️⃣ EXÉCUTER LE WORKFLOW
      console.log('4️⃣ Envoi du workflow au serveur...')
      console.log('📦 FINAL Workflow inputs à envoyer:', workflowToExecute.inputs?.map(t => ({
        id: t.id,
        type: t.type,
        selectedImage: t.selectedImage,
        userInput: t.userInput,
        defaultImage: t.defaultImage
      })))
      console.log('📦 FINAL Body à envoyer:', {
        workflow: {
          id: workflowToExecute.id,
          inputs: workflowToExecute.inputs?.length,
          tasks: workflowToExecute.tasks?.length
        }
      })
      
      // NOTE: On envoie AUSSI les inputs dans un paramètre séparé
      // car le backend les passe au WorkflowRunner
      // Les données sont dans workflow.inputs MAIS le backend s'attend aussi à req.body.inputs
      const response = await api.post('/workflow/run', {
        workflow: workflowToExecute,
        inputs: {}  // Vide mais requis par le backend
      })

      const endTime = performance.now()
      executionTime.value = Math.round(endTime - startTime)

      console.log('✅ Réponse reçue:', response.data)

      // Vérifier les différentes structures possibles de réponse
      if (response.data && response.data.success) {
        executionResult.value = response.data
        console.log('✅ Workflow exécuté avec succès!')
        console.log('📊 Résultats:', response.data.results)
        return response.data
      } else if (response.data && response.data.outputs) {
        executionResult.value = response.data
        return response.data
      } else {
        throw new Error('Réponse invalide du serveur')
      }
    } catch (error) {
      console.error('❌ Erreur lors de l\'exécution du workflow:', error.message)
      executionError.value = error.response?.data?.error || error.message || 'Erreur inconnue lors de l\'exécution'
      throw error
    } finally {
      executing.value = false
    }
  }

  /**
   * Réinitialise l'état d'exécution
   */
  const clearResults = () => {
    executionResult.value = null
    executionError.value = null
    executionTime.value = 0
  }

  /**
   * Crée une preview d'image à partir d'un fichier
   */
  const getImagePreview = (file) => {
    if (file instanceof File) {
      return URL.createObjectURL(file)
    }
    return file
  }

  /**
   * Vérifie si une valeur est une image
   */
  const isImageOutput = (value) => {
    if (typeof value !== 'string') return false
    return value.startsWith('data:image/') || value.match(/\.(jpg|jpeg|png|gif|webp)$/i)
  }

  /**
   * Télécharge les résultats en JSON
   */
  const downloadResults = (filename = null) => {
    if (!executionResult.value) {
      throw new Error('Aucun résultat à télécharger')
    }

    const dataStr = JSON.stringify(executionResult.value, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr)

    const exportFileDefaultName = filename || `execution-results-${Date.now()}.json`

    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
  }

  return {
    // State
    executing,
    executionResult,
    executionError,
    executionTime,

    // Methods
    executeWorkflow,
    clearResults,
    getImagePreview,
    isImageOutput,
    downloadResults
  }
}
