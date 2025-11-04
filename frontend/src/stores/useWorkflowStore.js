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
      // Déterminer si on a des images à uploader
      const hasImages = currentWorkflow.value.inputValues.images && 
                        Array.isArray(currentWorkflow.value.inputValues.images) &&
                        currentWorkflow.value.inputValues.images.length > 0

      let response

      if (hasImages) {
        // Utiliser FormData pour multipart/form-data avec fichiers
        const formData = new FormData()
        
        // Ajouter le workflow en JSON
        formData.append('workflow', JSON.stringify(currentWorkflow.value.workflow))
        
        // Ajouter tous les inputs non-images dans un objet JSON 'inputs'
        const nonImageInputs = {}
        Object.keys(currentWorkflow.value.inputValues).forEach(key => {
          if (key !== 'images') {
            nonImageInputs[key] = currentWorkflow.value.inputValues[key]
          }
        })
        
        // Envoyer les inputs comme JSON
        formData.append('inputs', JSON.stringify(nonImageInputs))
        
        // Ajouter les fichiers images directement (ce sont des objets File)
        const images = currentWorkflow.value.inputValues.images
        for (let i = 0; i < images.length; i++) {
          formData.append('images', images[i]) // Ajouter le File directement
        }

        console.log('🚀 Exécution workflow avec images (multipart/form-data)', {
          workflow: currentWorkflow.value.workflow.id,
          inputs: Object.keys(nonImageInputs),
          imageCount: images.length
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

  function saveWorkflow(name, description) {
    if (!currentWorkflow.value) return

    const savedWorkflow = {
      id: Date.now().toString(),
      name,
      description,
      workflow: { ...currentWorkflow.value.workflow },
      inputs: { ...currentWorkflow.value.inputs },
      createdAt: new Date().toISOString()
    }

    savedWorkflows.value.push(savedWorkflow)
    
    // Sauvegarder en localStorage
    localStorage.setItem('slufe_saved_workflows', JSON.stringify(savedWorkflows.value))
    
    return savedWorkflow
  }

  function loadSavedWorkflow(savedWorkflow) {
    const templateLike = {
      id: savedWorkflow.id,
      name: savedWorkflow.name,
      description: savedWorkflow.description,
      icon: 'save',
      category: 'saved',
      workflow: savedWorkflow.workflow,
      inputs: savedWorkflow.inputs
    }
    
    setCurrentWorkflow(templateLike)
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

  // Initialisation
  loadSavedWorkflows()

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
    loadSavedWorkflow,
    deleteSavedWorkflow,
    getTemplateById,
    exportWorkflow,
    importWorkflow
  }
})