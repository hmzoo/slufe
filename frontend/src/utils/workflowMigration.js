/**
 * Script de migration pour convertir les workflows v1 vers v2
 * Nouvelle structure: { inputs: [], tasks: [], outputs: [] }
 */

/**
 * Migre un workflow de l'ancienne structure vers la nouvelle
 * @param {Object} oldWorkflow - Workflow au format v1 (avec seulement tasks)
 * @returns {Object} Workflow au format v2 (avec inputs, tasks, outputs)
 */
export function migrateWorkflowToV2(oldWorkflow) {
  if (!oldWorkflow || !oldWorkflow.tasks) {
    throw new Error('Workflow invalide ou manquant')
  }

  // Si c'est déjà un workflow v2, on le retourne tel quel
  if (oldWorkflow.version === '2.0' || (oldWorkflow.inputs && oldWorkflow.outputs)) {
    return oldWorkflow
  }

  const newWorkflow = {
    id: oldWorkflow.id,
    name: oldWorkflow.name,
    description: oldWorkflow.description,
    version: '2.0',
    created: oldWorkflow.created || new Date().toISOString(),
    updated: new Date().toISOString(),
    inputs: [],
    tasks: [],
    outputs: [],
    metadata: {
      tags: oldWorkflow.tags || [],
      category: oldWorkflow.category || 'general',
      difficulty: 'intermediate',
      estimatedDuration: '5-10 minutes',
      migratedFrom: 'v1'
    }
  }

  // Analyser les anciennes tasks pour extraire les inputs
  const detectedInputs = new Set()
  const detectedOutputs = new Set()

  // Parcourir toutes les tâches pour détecter les patterns d'input
  oldWorkflow.tasks.forEach(task => {
    // Détecter les variables d'input (format {{inputs.xxx}})
    const inputMatches = JSON.stringify(task.input || {}).match(/\{\{inputs\.(\w+)\}\}/g)
    if (inputMatches) {
      inputMatches.forEach(match => {
        const inputName = match.replace('{{inputs.', '').replace('}}', '')
        detectedInputs.add(inputName)
      })
    }

    // Ajouter la tâche aux tasks de processing
    newWorkflow.tasks.push(task)

    // Détecter les outputs possibles (dernière tâche génératrice)
    if (task.type === 'generate_image' || task.type === 'edit_image') {
      detectedOutputs.add('image')
    }
    if (task.type === 'analyze_image' || task.type === 'enhance_prompt') {
      detectedOutputs.add('text')
    }
    if (task.type === 'generate_video') {
      detectedOutputs.add('video')
    }
  })

  // Créer les inputs détectés avec des configurations par défaut
  Array.from(detectedInputs).forEach(inputName => {
    const inputConfig = generateDefaultInputConfig(inputName)
    if (inputConfig) {
      newWorkflow.inputs.push({
        id: inputName,
        type: inputConfig.type,
        config: inputConfig.config
      })
    }
  })

  // Créer les outputs par défaut basés sur les dernières tâches
  Array.from(detectedOutputs).forEach((outputType, index) => {
    const outputConfig = generateDefaultOutputConfig(outputType, newWorkflow.tasks, index)
    if (outputConfig) {
      newWorkflow.outputs.push(outputConfig)
    }
  })

  return newWorkflow
}

/**
 * Génère une configuration d'input par défaut basée sur le nom
 */
function generateDefaultInputConfig(inputName) {
  const name = inputName.toLowerCase()
  
  if (name.includes('prompt') || name.includes('text') || name.includes('description')) {
    return {
      type: 'text_input',
      config: {
        label: inputName.charAt(0).toUpperCase() + inputName.slice(1).replace(/([A-Z])/g, ' $1'),
        placeholder: `Saisissez ${inputName.toLowerCase()}...`,
        multiline: true,
        required: true
      }
    }
  }
  
  if (name.includes('image') || name.includes('photo') || name.includes('picture')) {
    return {
      type: 'image_input',
      config: {
        label: inputName.charAt(0).toUpperCase() + inputName.slice(1).replace(/([A-Z])/g, ' $1'),
        multiple: false,
        required: true
      }
    }
  }
  
  if (name.includes('ratio') || name.includes('format') || name.includes('size')) {
    return {
      type: 'select_input',
      config: {
        label: inputName.charAt(0).toUpperCase() + inputName.slice(1).replace(/([A-Z])/g, ' $1'),
        options: "1:1 - Carré\n16:9 - Paysage\n9:16 - Portrait\n4:3 - Standard",
        defaultValue: "1:1"
      }
    }
  }

  // Par défaut, créer un text_input
  return {
    type: 'text_input',
    config: {
      label: inputName.charAt(0).toUpperCase() + inputName.slice(1).replace(/([A-Z])/g, ' $1'),
      placeholder: `Saisissez ${inputName.toLowerCase()}...`,
      required: false
    }
  }
}

/**
 * Génère une configuration d'output par défaut
 */
function generateDefaultOutputConfig(outputType, tasks, index) {
  const lastTask = tasks[tasks.length - 1]
  
  if (outputType === 'image') {
    // Chercher la dernière tâche qui génère une image
    const imageTask = [...tasks].reverse().find(t => 
      t.type === 'generate_image' || 
      t.type === 'edit_image' || 
      t.type === 'resize_crop_image'
    )
    
    if (imageTask) {
      return {
        id: `result_image_${index + 1}`,
        type: 'image_output',
        config: {
          title: 'Image générée',
          image: `{{${imageTask.id}.${imageTask.type.includes('edit') ? 'edited_images' : 'image'}}}`,
          width: 'medium'
        }
      }
    }
  }
  
  if (outputType === 'text') {
    // Chercher la dernière tâche qui génère du texte
    const textTask = [...tasks].reverse().find(t => 
      t.type === 'analyze_image' || 
      t.type === 'enhance_prompt'
    )
    
    if (textTask) {
      return {
        id: `result_text_${index + 1}`,
        type: 'text_output',
        config: {
          title: 'Résultat',
          text: `{{${textTask.id}.${textTask.type === 'analyze_image' ? 'description' : 'enhanced_prompt'}}}`,
          format: 'plain'
        }
      }
    }
  }
  
  if (outputType === 'video') {
    // Chercher la dernière tâche qui génère une vidéo
    const videoTask = [...tasks].reverse().find(t => 
      t.type === 'generate_video' || 
      t.type === 'concatenate_videos'
    )
    
    if (videoTask) {
      return {
        id: `result_video_${index + 1}`,
        type: 'video_output',
        config: {
          title: 'Vidéo générée',
          video: `{{${videoTask.id}.video}}`,
          width: 'medium',
          controls: true
        }
      }
    }
  }
  
  return null
}

/**
 * Migre un template de l'ancienne structure vers la nouvelle
 */
export function migrateTemplateToV2(oldTemplate) {
  if (!oldTemplate || !oldTemplate.workflow) {
    throw new Error('Template invalide ou manquant')
  }

  const migratedWorkflow = migrateWorkflowToV2(oldTemplate.workflow)
  
  return {
    ...oldTemplate,
    workflow: migratedWorkflow,
    version: '2.0',
    updated: new Date().toISOString()
  }
}

/**
 * Migre tous les workflows sauvegardés vers la nouvelle structure
 */
export function migrateAllSavedWorkflows() {
  const savedWorkflows = JSON.parse(localStorage.getItem('saved-workflows') || '[]')
  const migratedWorkflows = savedWorkflows.map(workflow => {
    try {
      return migrateWorkflowToV2(workflow)
    } catch (error) {
      console.error('Erreur migration workflow:', workflow.name, error)
      return workflow // Garder l'original en cas d'erreur
    }
  })
  
  localStorage.setItem('saved-workflows', JSON.stringify(migratedWorkflows))
  localStorage.setItem('workflows-migrated-v2', 'true')
  
  return migratedWorkflows
}

/**
 * Vérifie si les workflows ont déjà été migrés
 */
export function areWorkflowsMigrated() {
  return localStorage.getItem('workflows-migrated-v2') === 'true'
}

/**
 * Valide la structure d'un workflow v2
 */
export function validateWorkflowV2(workflow) {
  const errors = []
  
  if (!workflow.id) errors.push('ID manquant')
  if (!workflow.name) errors.push('Nom manquant')
  if (!Array.isArray(workflow.inputs)) errors.push('Section inputs manquante ou invalide')
  if (!Array.isArray(workflow.tasks)) errors.push('Section tasks manquante ou invalide')
  if (!Array.isArray(workflow.outputs)) errors.push('Section outputs manquante ou invalide')
  
  // Vérifier que chaque input a un id et type
  workflow.inputs?.forEach((input, index) => {
    if (!input.id) errors.push(`Input ${index}: ID manquant`)
    if (!input.type) errors.push(`Input ${index}: type manquant`)
  })
  
  // Vérifier que chaque task a un id et type
  workflow.tasks?.forEach((task, index) => {
    if (!task.id) errors.push(`Task ${index}: ID manquant`)
    if (!task.type) errors.push(`Task ${index}: type manquant`)
  })
  
  // Vérifier que chaque output a un id et type
  workflow.outputs?.forEach((output, index) => {
    if (!output.id) errors.push(`Output ${index}: ID manquant`)
    if (!output.type) errors.push(`Output ${index}: type manquant`)
  })
  
  return {
    isValid: errors.length === 0,
    errors
  }
}