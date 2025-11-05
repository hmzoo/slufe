import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from 'src/boot/axios'

export const useWorkflowStore = defineStore('workflow', () => {
  // État
  const currentWorkflow = ref(null)
  const workflowHistory = ref([])
  const executing = ref(false)
  const lastResult = ref(null)
  const error = ref(null)
  const savedWorkflows = ref([])

  // Templates de workflows prédéfinis
  const workflowTemplates = ref([
    {
      id: 'generate-simple',
      name: 'Génération simple',
      description: 'Génère une image à partir d\'un prompt',
      icon: 'image',
      category: 'generation',
      workflow: {
        id: "generate-image-simple",
        name: "Génération d'image simple",
        description: "Génère une image à partir d'un prompt",
        tasks: [
          {
            id: "generate1",
            type: "generate_image",
            input: {
              prompt: "{{inputs.prompt}}",
              aspectRatio: "{{inputs.aspectRatio}}"
            }
          }
        ]
      },
      inputs: {
        prompt: {
          type: 'text',
          label: 'Prompt de génération',
          placeholder: 'Décrivez l\'image que vous souhaitez générer...',
          hint: 'Décrivez précisément l\'image souhaitée',
          required: true
        },
        aspectRatio: {
          type: 'select',
          label: 'Format d\'image',
          options: [
            { label: 'Carré (1:1)', value: '1:1' },
            { label: 'Portrait (3:4)', value: '3:4' },
            { label: 'Paysage (4:3)', value: '4:3' },
            { label: 'Wide (16:9)', value: '16:9' }
          ],
          hint: 'Choisissez les proportions de l\'image',
          required: true
        }
      }
    },
    {
      id: 'enhance-generate',
      name: 'Génération avec prompt amélioré',
      description: 'Améliore le prompt puis génère l\'image',
      icon: 'auto_fix_high',
      category: 'generation',
      workflow: {
        id: "enhance-then-generate",
        name: "Génération avec prompt amélioré",
        description: "Améliore le prompt puis génère l'image",
        tasks: [
          {
            id: "enhance1",
            type: "enhance_prompt",
            input: {
              prompt: "{{inputs.prompt}}",
              style: "{{inputs.style}}"
            }
          },
          {
            id: "generate1",
            type: "generate_image",
            input: {
              prompt: "{{enhance1.enhanced_prompt}}",
              aspectRatio: "{{inputs.aspectRatio}}"
            }
          }
        ]
      },
      inputs: {
        prompt: {
          type: 'text',
          label: 'Prompt initial',
          placeholder: 'Idée de base pour l\'image...',
          hint: 'L\'IA améliorera automatiquement ce prompt',
          required: true
        },
        style: {
          type: 'select',
          label: 'Style d\'amélioration',
          options: [
            { label: 'Photographique', value: 'photographic' },
            { label: 'Artistique', value: 'artistic' },
            { label: 'Cinématique', value: 'cinematic' }
          ],
          hint: 'Type d\'amélioration à appliquer',
          required: true
        },
        aspectRatio: {
          type: 'select',
          label: 'Format d\'image',
          options: [
            { label: 'Carré (1:1)', value: '1:1' },
            { label: 'Portrait (3:4)', value: '3:4' },
            { label: 'Paysage (4:3)', value: '4:3' },
            { label: 'Wide (16:9)', value: '16:9' }
          ],
          hint: 'Choisissez les proportions de l\'image',
          required: true
        }
      }
    },
    {
      id: 'edit-image',
      name: 'Édition d\'image',
      description: 'Modifie une image existante selon vos instructions',
      icon: 'edit',
      category: 'editing',
      workflow: {
        id: "edit-image-workflow",
        name: "Édition d'image",
        description: "Modifie une image existante",
        tasks: [
          {
            id: "edit1",
            type: "edit_image",
            input: {
              images: "{{inputs.images}}",
              prompt: "{{inputs.editPrompt}}"
            }
          }
        ]
      },
      inputs: {
        images: {
          type: 'images',
          label: 'Images à modifier',
          hint: 'Sélectionnez une ou plusieurs images',
          required: true
        },
        editPrompt: {
          type: 'text',
          label: 'Instructions de modification',
          placeholder: 'Décrivez les modifications à apporter...',
          hint: 'Soyez précis sur les changements souhaités',
          required: true
        }
      }
    },
    {
      id: 'analyze-images',
      name: 'Analyse d\'images',
      description: 'Analyse et décrit le contenu d\'images',
      icon: 'visibility',
      category: 'analysis',
      workflow: {
        id: "analyze-images-workflow",
        name: "Analyse d'images",
        description: "Analyse le contenu d'images",
        tasks: [
          {
            id: "analyze1",
            type: "describe_images",
            input: {
              images: "{{inputs.images}}",
              question: "{{inputs.question}}"
            }
          }
        ]
      },
      inputs: {
        images: {
          type: 'images',
          label: 'Images à analyser',
          hint: 'Sélectionnez les images à analyser',
          required: true
        },
        question: {
          type: 'text',
          label: 'Question d\'analyse',
          placeholder: 'Que voulez-vous savoir sur ces images ?',
          hint: 'Posez une question spécifique ou laissez vide pour une description générale',
          required: false
        }
      }
    },
    {
      id: 'generate-video',
      name: 'Génération de vidéo',
      description: 'Génère une vidéo à partir d\'un prompt',
      icon: 'videocam',
      category: 'video',
      workflow: {
        id: "generate-video-workflow",
        name: "Génération de vidéo",
        description: "Génère une vidéo à partir d'un prompt",
        tasks: [
          {
            id: "video1",
            type: "generate_video_t2v",
            input: {
              prompt: "{{inputs.prompt}}",
              duration: "{{inputs.duration}}"
            }
          }
        ]
      },
      inputs: {
        prompt: {
          type: 'text',
          label: 'Description de la vidéo',
          placeholder: 'Décrivez la scène vidéo souhaitée...',
          hint: 'Soyez descriptif pour obtenir de meilleurs résultats',
          required: true
        },
        duration: {
          type: 'select',
          label: 'Durée de la vidéo',
          options: [
            { label: '2 secondes', value: 2 },
            { label: '3 secondes', value: 3 },
            { label: '5 secondes', value: 5 }
          ],
          hint: 'Durée de la vidéo générée',
          required: true
        }
      }
    },
    {
      id: 'complete-pipeline',
      name: 'Pipeline complet',
      description: 'Analyse → Amélioration → Génération → Édition',
      icon: 'account_tree',
      category: 'advanced',
      workflow: {
        id: "complete-pipeline-workflow",
        name: "Pipeline complet de génération",
        description: "Workflow complet avec toutes les étapes",
        tasks: [
          {
            id: "enhance1",
            type: "enhance_prompt",
            input: {
              prompt: "{{inputs.basePrompt}}",
              style: "photographic"
            }
          },
          {
            id: "generate1",
            type: "generate_image",
            input: {
              prompt: "{{enhance1.enhanced_prompt}}",
              aspectRatio: "{{inputs.aspectRatio}}"
            }
          },
          {
            id: "edit1",
            type: "edit_image",
            input: {
              images: ["{{generate1.image}}"],
              prompt: "{{inputs.editInstructions}}"
            }
          }
        ]
      },
      inputs: {
        basePrompt: {
          type: 'text',
          label: 'Prompt de base',
          placeholder: 'Idée initiale...',
          hint: 'Votre concept de base qui sera amélioré',
          required: true
        },
        aspectRatio: {
          type: 'select',
          label: 'Format d\'image',
          options: [
            { label: 'Carré (1:1)', value: '1:1' },
            { label: 'Portrait (3:4)', value: '3:4' },
            { label: 'Paysage (4:3)', value: '4:3' },
            { label: 'Wide (16:9)', value: '16:9' }
          ],
          hint: 'Format de l\'image générée',
          required: true
        },
        editInstructions: {
          type: 'text',
          label: 'Instructions d\'édition',
          placeholder: 'Comment modifier l\'image générée...',
          hint: 'Modifications à apporter à l\'image générée',
          required: true
        }
      }
    },
    {
      id: 'video-from-image',
      name: 'Générer vidéo (image)',
      description: 'Anime une image pour créer une vidéo',
      icon: 'movie',
      category: 'video',
      workflow: {
        id: "generate-video-from-image",
        name: "Génération de vidéo à partir d'image",
        description: "Anime une image pour créer une vidéo",
        tasks: [
          {
            id: "video1",
            type: "generate_video_i2v",
            input: {
              image: "{{inputs.image}}",
              prompt: "{{inputs.prompt}}",
              numFrames: "{{inputs.numFrames}}",
              aspectRatio: "{{inputs.aspectRatio}}"
            }
          }
        ]
      },
      inputs: {
        image: {
          type: 'image',
          label: 'Image de départ',
          hint: 'Image à animer pour créer la vidéo',
          required: true
        },
        prompt: {
          type: 'text',
          label: 'Description du mouvement',
          placeholder: 'Décrivez l\'animation souhaitée...',
          hint: 'Expliquez comment l\'image doit s\'animer',
          required: true
        },
        numFrames: {
          type: 'select',
          label: 'Durée de la vidéo',
          options: [
            { label: 'Courte (~3-5s)', value: 81 },
            { label: 'Longue (~5-8s)', value: 121 }
          ],
          hint: 'Nombre d\'images par seconde',
          required: true
        },
        aspectRatio: {
          type: 'select',
          label: 'Format vidéo',
          options: [
            { label: 'Paysage (16:9)', value: '16:9' },
            { label: 'Portrait (9:16)', value: '9:16' }
          ],
          hint: 'Orientation de la vidéo',
          required: true
        }
      }
    }
  ])

  // Getters
  const templatesByCategory = computed(() => {
    const categories = {}
    workflowTemplates.value.forEach(template => {
      const cat = template.category || 'other'
      if (!categories[cat]) {
        categories[cat] = []
      }
      categories[cat].push(template)
    })
    return categories
  })

  const isExecuting = computed(() => executing.value)
  const hasError = computed(() => !!error.value)
  const hasResult = computed(() => !!lastResult.value)

  // Actions
  function setCurrentWorkflow(workflowTemplate) {
    currentWorkflow.value = {
      template: workflowTemplate,
      workflow: { ...workflowTemplate.workflow },
      inputs: { ...workflowTemplate.inputs },
      inputValues: getDefaultInputValues(workflowTemplate.inputs)
    }
    error.value = null
  }

  function getDefaultInputValues(inputs) {
    const defaults = {}
    Object.keys(inputs).forEach(key => {
      const input = inputs[key]
      if (input.type === 'select' && input.options && input.options.length > 0) {
        defaults[key] = input.options[0].value
      } else if (input.type === 'number') {
        defaults[key] = input.min || 0
      } else if (input.type === 'images') {
        defaults[key] = []
      } else if (input.type === 'image') {
        defaults[key] = null
      } else {
        defaults[key] = ''
      }
    })
    return defaults
  }

  function updateInputValue(key, value) {
    if (currentWorkflow.value) {
      currentWorkflow.value.inputValues[key] = value
    }
  }

  function updateWorkflowDefinition(workflow) {
    if (currentWorkflow.value) {
      currentWorkflow.value.workflow = workflow
    }
  }

  async function executeCurrentWorkflow() {
    if (!currentWorkflow.value) {
      throw new Error('Aucun workflow sélectionné')
    }

    executing.value = true
    error.value = null
    lastResult.value = null

    try {
      // Déterminer si on a des images à uploader (images multiples ou image unique)
      const hasMultipleImages = currentWorkflow.value.inputValues.images && 
                        Array.isArray(currentWorkflow.value.inputValues.images) &&
                        currentWorkflow.value.inputValues.images.length > 0
      
      const hasSingleImage = currentWorkflow.value.inputValues.image && 
                        (currentWorkflow.value.inputValues.image instanceof File ||
                         Array.isArray(currentWorkflow.value.inputValues.image))

      const hasAnyImages = hasMultipleImages || hasSingleImage

      let response

      if (hasAnyImages) {
        // Utiliser FormData pour multipart/form-data avec fichiers
        const formData = new FormData()
        
        // Ajouter le workflow en JSON
        formData.append('workflow', JSON.stringify(currentWorkflow.value.workflow))
        
        // Ajouter tous les inputs non-images dans un objet JSON 'inputs'
        const nonImageInputs = {}
        Object.keys(currentWorkflow.value.inputValues).forEach(key => {
          if (key !== 'images' && key !== 'image') {
            nonImageInputs[key] = currentWorkflow.value.inputValues[key]
          }
        })
        
        // Envoyer les inputs comme JSON
        formData.append('inputs', JSON.stringify(nonImageInputs))
        
        // Ajouter les fichiers images multiples (images)
        if (hasMultipleImages) {
          const images = currentWorkflow.value.inputValues.images
          for (let i = 0; i < images.length; i++) {
            formData.append('images', images[i]) // Ajouter le File directement
          }
        }
        
        // Ajouter l'image unique (image)
        if (hasSingleImage) {
          const imageValue = currentWorkflow.value.inputValues.image
          if (Array.isArray(imageValue) && imageValue.length > 0) {
            // Si c'est un tableau avec un élément (comportement de q-file avec single)
            formData.append('image', imageValue[0])
          } else if (imageValue instanceof File) {
            // Si c'est directement un File
            formData.append('image', imageValue)
          }
        }

        console.log('🚀 Exécution workflow avec images (multipart/form-data)', {
          workflow: currentWorkflow.value.workflow.id,
          inputs: Object.keys(nonImageInputs),
          multipleImages: hasMultipleImages ? currentWorkflow.value.inputValues.images?.length : 0,
          singleImage: hasSingleImage ? 1 : 0
        })

        response = await api.post('/workflow/run', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        })
      } else {
        // Envoi JSON classique sans images
        const payload = {
          workflow: currentWorkflow.value.workflow,
          inputs: currentWorkflow.value.inputValues
        }

        console.log('🚀 Exécution workflow:', payload)

        response = await api.post('/workflow/run', payload)
      }

      if (response.data.success) {
        lastResult.value = response.data
        
        // Ajouter à l'historique
        workflowHistory.value.unshift({
          id: Date.now(),
          timestamp: new Date().toISOString(),
          workflow: { ...currentWorkflow.value.workflow },
          inputs: { ...currentWorkflow.value.inputValues },
          result: response.data
        })

        // Limiter l'historique à 50 entrées
        if (workflowHistory.value.length > 50) {
          workflowHistory.value = workflowHistory.value.slice(0, 50)
        }

        return response.data
      } else {
        throw new Error(response.data.error || 'Erreur inconnue')
      }
    } catch (err) {
      console.error('❌ Erreur workflow:', err)
      error.value = err.response?.data?.error || err.message || 'Erreur d\'exécution'
      throw err
    } finally {
      executing.value = false
    }
  }

  function resetCurrentWorkflow() {
    if (currentWorkflow.value) {
      currentWorkflow.value.inputValues = getDefaultInputValues(currentWorkflow.value.inputs)
      lastResult.value = null
      error.value = null
    }
  }

  function clearError() {
    error.value = null
  }

  function clearResult() {
    lastResult.value = null
  }

  function saveWorkflow(name, description, workflowToSave = null) {
    const workflow = workflowToSave || currentWorkflow.value
    if (!workflow) return

    console.log('💾 Sauvegarde workflow:', { name, workflow })

    // Vérifier si un workflow avec ce nom existe déjà
    const existingIndex = savedWorkflows.value.findIndex(w => w.name === name)
    
    if (existingIndex !== -1) {
      // Mettre à jour le workflow existant
      const existingWorkflow = savedWorkflows.value[existingIndex]
      const updatedWorkflow = {
        ...existingWorkflow,
        description: description || existingWorkflow.description,
        workflow: workflow.workflow ? { ...workflow.workflow } : { ...workflow },
        inputs: workflow.inputs ? { ...workflow.inputs } : {},
        updatedAt: new Date().toISOString(),
        version: (existingWorkflow.version || 1) + 1
      }
      
      savedWorkflows.value[existingIndex] = updatedWorkflow
      console.log(`🔄 Workflow "${name}" mis à jour (v${updatedWorkflow.version})`)
      
      // Sauvegarder en localStorage
      persistSavedWorkflows()
      
      return updatedWorkflow
    } else {
      // Créer un nouveau workflow
      const baseId = name.toLowerCase().replace(/[^a-z0-9]/g, '-')
      const timestamp = Date.now()
      const id = `${baseId}-${timestamp}`

      const savedWorkflow = {
        id,
        name,
        description: description || `Workflow créé le ${new Date().toLocaleDateString()}`,
        workflow: workflow.workflow ? { ...workflow.workflow } : { ...workflow },
        inputs: workflow.inputs ? { ...workflow.inputs } : {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: 1,
        category: 'custom',
        icon: 'save'
      }

      console.log('📊 Structure sauvegardée:', savedWorkflow)

      // Ajouter à la liste
      savedWorkflows.value.push(savedWorkflow)
      
      console.log(`✅ Nouveau workflow "${name}" créé avec ID: ${id}`)
    }
    
    // Sauvegarder en localStorage
    persistSavedWorkflows()
    
    return savedWorkflows.value.find(w => w.name === name)
  }

  function updateWorkflow(id, updates) {
    const index = savedWorkflows.value.findIndex(w => w.id === id)
    if (index === -1) return null

    const workflow = savedWorkflows.value[index]
    const updatedWorkflow = {
      ...workflow,
      ...updates,
      updatedAt: new Date().toISOString(),
      version: (workflow.version || 1) + 1
    }

    savedWorkflows.value[index] = updatedWorkflow
    persistSavedWorkflows()
    
    console.log(`✅ Workflow "${workflow.name}" mis à jour`)
    return updatedWorkflow
  }

  function duplicateWorkflow(id, newName = null) {
    const original = savedWorkflows.value.find(w => w.id === id)
    if (!original) return null

    const name = newName || `${original.name} (Copie)`
    return saveWorkflow(name, `Copie de: ${original.description}`, original)
  }

  function renameWorkflow(id, newName) {
    return updateWorkflow(id, { name: newName })
  }

  function persistSavedWorkflows() {
    try {
      localStorage.setItem('slufe_saved_workflows', JSON.stringify(savedWorkflows.value))
    } catch (e) {
      console.error('Erreur sauvegarde workflows:', e)
    }
  }

  function loadSavedWorkflow(workflowId) {
    // Trouver le workflow par ID ou par objet direct
    let workflow
    if (typeof workflowId === 'string') {
      workflow = savedWorkflows.value.find(w => w.id === workflowId)
      if (!workflow) {
        console.error(`Workflow avec ID "${workflowId}" introuvable`)
        return
      }
    } else {
      // Support legacy - si c'est déjà l'objet workflow
      workflow = workflowId
    }
    
    const templateLike = {
      id: workflow.id,
      name: workflow.name,
      description: workflow.description,
      icon: 'save',
      category: 'saved',
      workflow: workflow.workflow,
      inputs: workflow.inputs || {}
    }
    
    console.log('📋 Chargement workflow:', templateLike.name)
    setCurrentWorkflow(templateLike)
    return templateLike
  }

  function deleteSavedWorkflow(id) {
    savedWorkflows.value = savedWorkflows.value.filter(w => w.id !== id)
    localStorage.setItem('slufe_saved_workflows', JSON.stringify(savedWorkflows.value))
  }

  function loadSavedWorkflows() {
    try {
      const saved = localStorage.getItem('slufe_saved_workflows')
      if (saved) {
        savedWorkflows.value = JSON.parse(saved)
      }
    } catch (e) {
      console.warn('Erreur chargement workflows sauvegardés:', e)
    }
  }

  function getTemplateById(id) {
    return workflowTemplates.value.find(t => t.id === id)
  }

  function exportWorkflow(workflow = currentWorkflow.value) {
    if (!workflow) return null
    
    return {
      version: '1.0',
      exported_at: new Date().toISOString(),
      workflow: workflow.workflow,
      inputs: workflow.inputs,
      app: 'slufe-workflow-engine'
    }
  }

  function importWorkflow(exportedData) {
    if (!exportedData.workflow || !exportedData.inputs) {
      throw new Error('Format d\'export invalide')
    }

    const templateLike = {
      id: 'imported-' + Date.now(),
      name: exportedData.workflow.name || 'Workflow importé',
      description: exportedData.workflow.description || 'Importé le ' + new Date().toLocaleDateString(),
      icon: 'file_download',
      category: 'imported',
      workflow: exportedData.workflow,
      inputs: exportedData.inputs
    }

    setCurrentWorkflow(templateLike)
    return templateLike
  }

  // Migration des anciens workflows depuis 'customWorkflows'
  function migrateLegacyWorkflows() {
    try {
      const legacy = localStorage.getItem('customWorkflows')
      if (legacy) {
        const oldWorkflows = JSON.parse(legacy)
        console.log(`🔄 Migration de ${oldWorkflows.length} ancien(s) workflow(s)`)
        
        oldWorkflows.forEach(workflow => {
          // Convertir au nouveau format
          const migrated = saveWorkflow(
            workflow.name || 'Workflow migré',
            `Migré depuis l'ancien système - ${workflow.description || ''}`,
            workflow
          )
          console.log(`✅ Migré: ${migrated.name}`)
        })
        
        // Supprimer les anciens après migration
        localStorage.removeItem('customWorkflows')
        console.log('🗑️ Anciens workflows supprimés')
      }
    } catch (e) {
      console.warn('Erreur migration workflows:', e)
    }
  }

  // Initialisation
  loadSavedWorkflows()
  migrateLegacyWorkflows()

  return {
    // État
    currentWorkflow,
    workflowHistory,
    executing,
    lastResult,
    error,
    savedWorkflows,
    workflowTemplates,
    
    // Getters
    templatesByCategory,
    isExecuting,
    hasError,
    hasResult,
    
    // Actions
    setCurrentWorkflow,
    updateInputValue,
    updateWorkflowDefinition,
    executeCurrentWorkflow,
    resetCurrentWorkflow,
    clearError,
    clearResult,
    saveWorkflow,
    updateWorkflow,
    duplicateWorkflow,
    renameWorkflow,
    loadSavedWorkflow,
    deleteSavedWorkflow,
    getTemplateById,
    exportWorkflow,
    importWorkflow,
    persistSavedWorkflows
  }
})