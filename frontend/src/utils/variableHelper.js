/**
 * Helper pour travailler avec les variables de workflows
 * et les métadonnées des tâches
 */

import { TASK_DEFINITIONS } from '../config/taskDefinitions.js'

/**
 * Récupère les métadonnées d'une tâche
 * @param {string} taskType - Type de tâche
 * @returns {Object} Métadonnées (prefix, example, outputs, etc.)
 */
export function getTaskMetadata(taskType) {
  const task = TASK_DEFINITIONS[taskType]
  if (!task) return null

  return {
    type: task.type,
    name: task.name,
    variablePrefix: task.variablePrefix || taskType.split('_')[0],
    variableExample: task.variableExample || `{{${taskType}1.output}}`,
    outputDescription: task.outputDescription || '',
    outputs: task.outputs || {},
    inputs: task.inputs || {}
  }
}

/**
 * Récupère tous les outputs disponibles pour une tâche
 * @param {string} taskType - Type de tâche
 * @returns {Array} Liste des outputs avec leurs métadonnées
 */
export function getTaskOutputs(taskType) {
  const task = TASK_DEFINITIONS[taskType]
  if (!task || !task.outputs) return []

  return Object.entries(task.outputs).map(([key, output]) => ({
    key,
    type: output.type,
    description: output.description,
    variablePath: output.variablePath || `{{taskId.${key}}}`,
    example: output.example || ''
  }))
}

/**
 * Récupère tous les inputs qui acceptent des variables
 * @param {string} taskType - Type de tâche
 * @returns {Array} Liste des inputs avec leurs métadonnées
 */
export function getTaskVariableInputs(taskType) {
  const task = TASK_DEFINITIONS[taskType]
  if (!task || !task.inputs) return []

  return Object.entries(task.inputs)
    .filter(([_, input]) => input.acceptsVariable)
    .map(([key, input]) => ({
      key,
      label: input.label,
      type: input.type,
      variableDescription: input.variableDescription || '',
      required: input.required || false
    }))
}

/**
 * Génère un exemple de variable pour un output donné
 * @param {string} taskId - ID de la tâche
 * @param {string} outputKey - Clé de l'output
 * @returns {string} Variable formatée (ex: {{img1.image}})
 */
export function formatVariable(taskId, outputKey) {
  return `{{${taskId}.${outputKey}}}`
}

/**
 * Parse une variable pour extraire taskId et outputKey
 * @param {string} variable - Variable (ex: {{img1.image}})
 * @returns {Object|null} { taskId, outputKey } ou null
 */
export function parseVariable(variable) {
  const match = variable.match(/^\{\{([^.]+)\.([^}]+)\}\}$/)
  if (!match) return null

  return {
    taskId: match[1],
    outputKey: match[2]
  }
}

/**
 * Vérifie si une valeur est une variable
 * @param {string} value - Valeur à vérifier
 * @returns {boolean}
 */
export function isVariable(value) {
  return typeof value === 'string' && value.startsWith('{{') && value.endsWith('}}')
}

/**
 * Récupère toutes les variables disponibles depuis un workflow
 * @param {Array} tasks - Liste des tâches du workflow
 * @param {string} currentTaskId - ID de la tâche actuelle (pour exclure les tâches suivantes)
 * @returns {Array} Liste de variables disponibles avec métadonnées
 */
export function getAvailableVariables(tasks, currentTaskId) {
  if (!tasks || !Array.isArray(tasks)) return []

  const currentIndex = tasks.findIndex(t => t.id === currentTaskId)
  const availableTasks = currentIndex === -1 
    ? tasks 
    : tasks.slice(0, currentIndex)

  const variables = []

  availableTasks.forEach(task => {
    const outputs = getTaskOutputs(task.type)
    
    outputs.forEach(output => {
      variables.push({
        taskId: task.id,
        taskName: task.name || task.type,
        taskType: task.type,
        outputKey: output.key,
        outputType: output.type,
        variable: formatVariable(task.id, output.key),
        description: output.description,
        example: output.example
      })
    })
  })

  return variables
}

/**
 * Filtre les variables par type compatible
 * @param {Array} variables - Liste de variables
 * @param {string} targetType - Type attendu (image, images, video, text, etc.)
 * @returns {Array} Variables filtrées
 */
export function filterVariablesByType(variables, targetType) {
  if (!targetType) return variables

  return variables.filter(v => {
    // Correspondances de types
    if (targetType === 'image') {
      return v.outputType === 'image'
    }
    if (targetType === 'images') {
      return v.outputType === 'images' || v.outputType === 'array'
    }
    if (targetType === 'video') {
      return v.outputType === 'video'
    }
    if (targetType === 'text') {
      return v.outputType === 'text' || v.outputType === 'string'
    }
    
    // Par défaut, match exact
    return v.outputType === targetType
  })
}

/**
 * Génère une suggestion de nom de tâche basé sur le prefix
 * @param {string} taskType - Type de tâche
 * @param {Array} existingTasks - Tâches existantes
 * @returns {string} Suggestion d'ID (ex: img1, img2, etc.)
 */
export function suggestTaskId(taskType, existingTasks = []) {
  const metadata = getTaskMetadata(taskType)
  if (!metadata) return taskType + '1'

  const prefix = metadata.variablePrefix
  const existingIds = existingTasks
    .filter(t => t.id.startsWith(prefix))
    .map(t => {
      const match = t.id.match(new RegExp(`^${prefix}(\\d+)$`))
      return match ? parseInt(match[1]) : 0
    })

  const nextNumber = existingIds.length > 0 ? Math.max(...existingIds) + 1 : 1
  return prefix + nextNumber
}

/**
 * Génère une documentation rapide pour une tâche
 * @param {string} taskType - Type de tâche
 * @returns {string} Documentation formatée en Markdown
 */
export function generateTaskDocumentation(taskType) {
  const task = TASK_DEFINITIONS[taskType]
  if (!task) return ''

  const metadata = getTaskMetadata(taskType)
  const outputs = getTaskOutputs(taskType)
  const inputs = getTaskVariableInputs(taskType)

  let doc = `### ${task.name} (\`${taskType}\`)\n\n`
  
  if (metadata.outputDescription) {
    doc += `**Description**: ${metadata.outputDescription}\n\n`
  }

  if (metadata.variablePrefix) {
    doc += `**Préfixe suggéré**: \`${metadata.variablePrefix}\`\n`
    doc += `**Exemple**: \`${metadata.variableExample}\`\n\n`
  }

  if (inputs.length > 0) {
    doc += `**Inputs acceptant des variables**:\n`
    inputs.forEach(input => {
      doc += `- \`${input.key}\` (${input.type})${input.required ? ' *requis*' : ''}`
      if (input.variableDescription) {
        doc += ` - ${input.variableDescription}`
      }
      doc += '\n'
    })
    doc += '\n'
  }

  if (outputs.length > 0) {
    doc += `**Outputs disponibles**:\n`
    outputs.forEach(output => {
      doc += `- \`${output.variablePath}\` (${output.type}) - ${output.description}`
      if (output.example) {
        doc += `\n  - Exemple: \`${output.example}\``
      }
      doc += '\n'
    })
  }

  return doc
}

/**
 * Valide une référence de variable dans le contexte d'un workflow
 * @param {string} variable - Variable à valider
 * @param {Array} tasks - Tâches du workflow
 * @param {string} currentTaskId - ID de la tâche courante
 * @returns {Object} { valid: boolean, error?: string, info?: Object }
 */
export function validateVariableReference(variable, tasks, currentTaskId) {
  if (!isVariable(variable)) {
    return { valid: false, error: 'Format de variable invalide (doit être {{taskId.outputKey}})' }
  }

  const parsed = parseVariable(variable)
  if (!parsed) {
    return { valid: false, error: 'Impossible de parser la variable' }
  }

  const { taskId, outputKey } = parsed

  // Vérifier que la tâche existe
  const task = tasks.find(t => t.id === taskId)
  if (!task) {
    return { valid: false, error: `Tâche "${taskId}" non trouvée` }
  }

  // Vérifier que la tâche est avant la tâche courante
  const taskIndex = tasks.findIndex(t => t.id === taskId)
  const currentIndex = tasks.findIndex(t => t.id === currentTaskId)
  
  if (currentIndex !== -1 && taskIndex >= currentIndex) {
    return { 
      valid: false, 
      error: `La tâche "${taskId}" doit être avant la tâche courante dans le workflow` 
    }
  }

  // Vérifier que l'output existe
  const outputs = getTaskOutputs(task.type)
  const output = outputs.find(o => o.key === outputKey)
  
  if (!output) {
    const availableOutputs = outputs.map(o => o.key).join(', ')
    return { 
      valid: false, 
      error: `Output "${outputKey}" non disponible pour ${task.type}. Disponibles: ${availableOutputs}` 
    }
  }

  return { 
    valid: true, 
    info: {
      taskName: task.name || task.type,
      outputType: output.type,
      description: output.description
    }
  }
}

export default {
  getTaskMetadata,
  getTaskOutputs,
  getTaskVariableInputs,
  formatVariable,
  parseVariable,
  isVariable,
  getAvailableVariables,
  filterVariablesByType,
  suggestTaskId,
  generateTaskDocumentation,
  validateVariableReference
}
