import { v4 as uuidv4 } from 'uuid';
import fetch from 'node-fetch';

/**
 * Exécuteur principal de workflows SLUFE IA
 * Traite les workflows JSON contenant des séquences de tâches IA
 */
export class WorkflowRunner {
  constructor() {
    this.taskServices = new Map();
    this.initializeTaskServices();
  }

  /**
   * Initialise les services pour chaque type de tâche
   */
  initializeTaskServices() {
    // Dynamiquement importer les services de tâches
    this.taskServices.set('enhance_prompt', null); // Sera chargé à la demande
    this.taskServices.set('describe_images', null);
    this.taskServices.set('generate_image', null);
    this.taskServices.set('edit_image', null);
    this.taskServices.set('generate_video_t2v', null);
    this.taskServices.set('generate_video_i2v', null);
    this.taskServices.set('generate_workflow', null);
  }

  /**
   * Exécute un workflow complet
   * @param {Object} workflow - Workflow JSON à exécuter
   * @param {Object} inputs - Données d'entrée du workflow
   * @returns {Object} Résultats de l'exécution
   */
  async executeWorkflow(workflow, inputs = {}) {
    const execution = new WorkflowExecution(workflow, inputs);
    
    try {
      global.logWorkflow(`🚀 Démarrage du workflow: ${workflow.id}`, {
        name: workflow.name,
        tasks: workflow.tasks.length,
        inputs: Object.keys(inputs)
      });

      // Validation du workflow
      this.validateWorkflow(workflow);

      // Exécution séquentielle des tâches
      for (const task of workflow.tasks) {
        await this.executeTask(task, execution);
      }

      execution.markCompleted();
      
      global.logWorkflow(`✅ Workflow terminé: ${workflow.id}`, {
        duration: execution.getExecutionTime(),
        success: true
      });

      return execution.getResults();

    } catch (error) {
      execution.markFailed(error);
      
      global.logWorkflow(`❌ Échec du workflow: ${workflow.id}`, {
        error: error.message,
        task: execution.getCurrentTask()
      });

      throw error;
    }
  }

  /**
   * Exécute une tâche individuelle
   * @param {Object} task - Configuration de la tâche
   * @param {WorkflowExecution} execution - Contexte d'exécution
   */
  async executeTask(task, execution) {
    const startTime = Date.now();
    
    try {
      execution.setCurrentTask(task.id);
      
      global.logWorkflow(`📋 Exécution tâche: ${task.id}`, {
        type: task.type,
        inputs: Object.keys(task.input || task.inputs || {})
      });

      // Résolution des variables dans les entrées
      const resolvedInputs = await this.resolveVariables(task.input || task.inputs, execution.getContext());

      // Obtention du service pour ce type de tâche
      const service = await this.getServiceForTask(task.type);

      // Exécution de la tâche
      const result = await service.execute(resolvedInputs);

      // Stockage du résultat
      const executionTime = Date.now() - startTime;
      execution.addTaskResult(task.id, {
        type: task.type,
        status: 'completed',
        execution_time: executionTime,
        outputs: result
      });

      global.logWorkflow(`✅ Tâche terminée: ${task.id}`, {
        duration: executionTime,
        outputs: Object.keys(result)
      });

    } catch (error) {
      const executionTime = Date.now() - startTime;
      execution.addTaskResult(task.id, {
        type: task.type,
        status: 'failed',
        execution_time: executionTime,
        error: error.message
      });

      global.logWorkflow(`❌ Échec tâche: ${task.id}`, {
        error: error.message,
        duration: executionTime
      });

      throw new Error(`Tâche ${task.id} échouée: ${error.message}`);
    }
  }

  /**
   * Résout les variables et références dans les entrées d'une tâche
   * @param {Object} inputs - Entrées avec variables à résoudre
   * @param {Object} context - Contexte d'exécution (inputs + résultats des tâches)
   * @returns {Object} Entrées avec variables résolues
   */
  async resolveVariables(inputs, context) {
    if (!inputs) return {};

    const resolved = {};
    
    for (const [key, value] of Object.entries(inputs)) {
      resolved[key] = await this.resolveValue(value, context);
    }

    return resolved;
  }

  /**
   * Résout une valeur individuelle (string, array, object)
   * @param {*} value - Valeur à résoudre
   * @param {Object} context - Contexte pour la résolution
   * @returns {*} Valeur résolue
   */
  async resolveValue(value, context) {
    if (typeof value === 'string') {
      const resolved = this.resolveStringVariables(value, context);
      // Si c'est une URL d'image, la convertir en base64
      if (this.isImageUrl(resolved)) {
        return await this.convertUrlToBase64(resolved);
      }
      return resolved;
    }
    
    if (Array.isArray(value)) {
      const resolvedArray = [];
      for (const item of value) {
        resolvedArray.push(await this.resolveValue(item, context));
      }
      return resolvedArray;
    }
    
    if (value && typeof value === 'object') {
      const resolved = {};
      for (const [k, v] of Object.entries(value)) {
        resolved[k] = await this.resolveValue(v, context);
      }
      return resolved;
    }

    return value;
  }

  /**
   * Résout les variables dans une chaîne de caractères
   * @param {string} str - Chaîne avec variables {{variable}}
   * @param {Object} context - Contexte pour la résolution
   * @returns {string} Chaîne avec variables résolues
   */
  resolveStringVariables(str, context) {
    return str.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
      const trimmedPath = path.trim();
      const value = this.getValueFromPath(trimmedPath, context);
      
      global.logWorkflow(`🔍 Résolution variable: ${match}`, {
        path: trimmedPath,
        value: value,
        context: Object.keys(context),
        resolved: value !== undefined ? 'OUI' : 'NON'
      });
      
      return value !== undefined ? value : match;
    });
  }

  /**
   * Récupère une valeur depuis un chemin (ex: "input.images[0]", "task_1.enhanced_prompt")
   * @param {string} path - Chemin vers la valeur
   * @param {Object} context - Contexte de données
   * @returns {*} Valeur trouvée ou undefined
   */
  getValueFromPath(path, context) {
    const parts = path.split('.');
    let current = context;

    for (const part of parts) {
      // Gestion des indices d'array [0], [1], etc.
      const arrayMatch = part.match(/^(.+)\[(\d+)\]$/);
      if (arrayMatch) {
        const [, arrayName, index] = arrayMatch;
        current = current?.[arrayName]?.[parseInt(index)];
      } else {
        current = current?.[part];
      }

      if (current === undefined) {
        return undefined;
      }
    }

    return current;
  }

  /**
   * Obtient le service approprié pour un type de tâche
   * @param {string} taskType - Type de tâche (enhance_prompt, generate_image, etc.)
   * @returns {Object} Service pour exécuter la tâche
   */
  async getServiceForTask(taskType) {
    if (!this.taskServices.has(taskType)) {
      throw new Error(`Type de tâche non supporté: ${taskType}`);
    }

    let service = this.taskServices.get(taskType);
    
    if (!service) {
      // Chargement dynamique du service
      try {
        const ServiceClass = await this.loadTaskService(taskType);
        service = new ServiceClass();
        this.taskServices.set(taskType, service);
      } catch (error) {
        throw new Error(`Impossible de charger le service pour ${taskType}: ${error.message}`);
      }
    }

    return service;
  }

  /**
   * Charge dynamiquement un service de tâche
   * @param {string} taskType - Type de tâche
   * @returns {Class} Classe du service
   */
  async loadTaskService(taskType) {
    const serviceMap = {
      'enhance_prompt': './tasks/EnhancePromptTask.js',
      'describe_images': './tasks/DescribeImagesTask.js',
      'generate_image': './tasks/GenerateImageTask.js',
      'edit_image': './tasks/EditImageTask.js',
      'generate_video_t2v': './tasks/GenerateVideoT2VTask.js',
      'generate_video_i2v': './tasks/GenerateVideoI2VTask.js',
      'generate_workflow': './tasks/GenerateWorkflowTask.js'
    };

    const servicePath = serviceMap[taskType];
    if (!servicePath) {
      throw new Error(`Service non défini pour le type: ${taskType}`);
    }

    const module = await import(servicePath);
    return module.default || module[Object.keys(module)[0]];
  }

  /**
   * Détermine si une chaîne est une URL d'image
   * @param {string} str - Chaîne à vérifier
   * @returns {boolean} True si c'est une URL d'image
   */
  isImageUrl(str) {
    if (typeof str !== 'string') return false;
    
    // Vérifie si c'est une URL HTTP/HTTPS avec extension d'image
    const imageUrlPattern = /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?.*)?$/i;
    
    // Ou si c'est une URL Replicate (format typique)
    const replicatePattern = /^https?:\/\/.*replicate\.com.*$/i;
    
    // Ou si c'est déjà une URL d'asset téléchargé localement
    const localAssetPattern = /^https?:\/\/.*\.(jpg|jpeg|png|gif|webp)$/i;
    
    return imageUrlPattern.test(str) || replicatePattern.test(str) || localAssetPattern.test(str);
  }

  /**
   * Convertit une URL d'image en données base64
   * @param {string} imageUrl - URL de l'image à convertir
   * @returns {string} Données base64 de l'image
   */
  async convertUrlToBase64(imageUrl) {
    try {
      global.logWorkflow(`🔄 Conversion URL vers base64: ${imageUrl.substring(0, 60)}...`);
      
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`Erreur HTTP ${response.status}: ${response.statusText}`);
      }

      const buffer = await response.buffer();
      const contentType = response.headers.get('content-type') || 'image/jpeg';
      
      const base64Data = buffer.toString('base64');
      const dataUri = `data:${contentType};base64,${base64Data}`;
      
      global.logWorkflow(`✅ Conversion réussie`, {
        originalUrl: imageUrl.substring(0, 60) + '...',
        size: `${Math.round(buffer.length / 1024)}KB`,
        contentType: contentType,
        base64Length: base64Data.length
      });
      
      return dataUri;
    } catch (error) {
      global.logWorkflow(`❌ Erreur conversion URL: ${error.message}`);
      // En cas d'erreur, retourner l'URL originale
      return imageUrl;
    }
  }

  /**
   * Valide la structure d'un workflow
   * @param {Object} workflow - Workflow à valider
   * @throws {Error} Si le workflow n'est pas valide
   */
  validateWorkflow(workflow) {
    if (!workflow.id) {
      throw new Error('Le workflow doit avoir un ID');
    }

    if (!workflow.tasks || !Array.isArray(workflow.tasks)) {
      throw new Error('Le workflow doit contenir un tableau de tâches');
    }

    if (workflow.tasks.length === 0) {
      throw new Error('Le workflow doit contenir au moins une tâche');
    }

    // Validation des tâches individuelles
    const taskIds = new Set();
    for (const task of workflow.tasks) {
      if (!task.id) {
        throw new Error('Chaque tâche doit avoir un ID');
      }

      if (taskIds.has(task.id)) {
        throw new Error(`ID de tâche dupliqué: ${task.id}`);
      }
      taskIds.add(task.id);

      if (!task.type) {
        throw new Error(`Tâche ${task.id} doit avoir un type`);
      }

      if (!this.taskServices.has(task.type)) {
        throw new Error(`Type de tâche non supporté: ${task.type}`);
      }
    }

    // Validation des références entre tâches
    this.validateTaskReferences(workflow.tasks);
  }

  /**
   * Valide que les références entre tâches sont correctes
   * @param {Array} tasks - Tableau des tâches
   * @throws {Error} Si des références circulaires ou invalides sont trouvées
   */
  validateTaskReferences(tasks) {
    const taskIds = new Set(tasks.map(t => t.id));
    
    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i];
      const inputStr = JSON.stringify(task.inputs || {});
      
      // Recherche des références à d'autres tâches
      const references = inputStr.match(/\{\{(\w+)\./g);
      if (references) {
        for (const ref of references) {
          const referencedId = ref.slice(2, -1); // Enlève {{}}
          
          if (referencedId !== 'input' && taskIds.has(referencedId)) {
            // Vérifier que la tâche référencée est définie avant cette tâche
            const referencedIndex = tasks.findIndex(t => t.id === referencedId);
            if (referencedIndex >= i) {
              throw new Error(`Référence circulaire ou invalide: tâche ${task.id} référence ${referencedId}`);
            }
          }
        }
      }
    }
  }
}

/**
 * Contexte d'exécution d'un workflow
 * Garde trace de l'état et des résultats pendant l'exécution
 */
class WorkflowExecution {
  constructor(workflow, inputs = {}) {
    this.workflow = workflow;
    this.inputs = inputs;
    this.taskResults = new Map();
    this.startTime = Date.now();
    this.endTime = null;
    this.currentTask = null;
    this.status = 'running';
    this.error = null;
    this.executionId = `${workflow.id}_exec_${uuidv4().slice(0, 8)}`;
  }

  setCurrentTask(taskId) {
    this.currentTask = taskId;
  }

  getCurrentTask() {
    return this.currentTask;
  }

  addTaskResult(taskId, result) {
    this.taskResults.set(taskId, result);
  }

  getTaskResult(taskId) {
    return this.taskResults.get(taskId);
  }

  /**
   * Obtient le contexte complet pour la résolution de variables
   * @returns {Object} Contexte avec inputs et résultats des tâches
   */
  getContext() {
    const context = {
      input: this.inputs,
      inputs: this.inputs  // Support des deux formats pour compatibilité
    };

    // Ajouter les résultats de chaque tâche
    for (const [taskId, result] of this.taskResults) {
      context[taskId] = result.outputs;
    }

    return context;
  }

  markCompleted() {
    this.status = 'completed';
    this.endTime = Date.now();
    this.currentTask = null;
  }

  markFailed(error) {
    this.status = 'failed';
    this.endTime = Date.now();
    this.error = error.message;
  }

  getExecutionTime() {
    return this.endTime ? this.endTime - this.startTime : Date.now() - this.startTime;
  }

  /**
   * Retourne les résultats formatés de l'exécution
   * @returns {Object} Résultats complets
   */
  getResults() {
    const taskResults = Array.from(this.taskResults.values());
    const completedTasks = taskResults.filter(r => r.status === 'completed').length;

    // Résolution des outputs du workflow
    const outputs = {};
    if (this.workflow.outputs) {
      const context = this.getContext();
      for (const [key, path] of Object.entries(this.workflow.outputs)) {
        if (typeof path === 'string' && path.includes('{{')) {
          outputs[key] = this.resolveStringVariables(path, context);
        } else {
          outputs[key] = path;
        }
      }
    }

    return {
      success: this.status === 'completed',
      workflow_id: this.executionId,
      execution: {
        status: this.status,
        progress: {
          total_tasks: this.workflow.tasks.length,
          completed_tasks: completedTasks,
          current_task: this.currentTask,
          percentage: Math.round((completedTasks / this.workflow.tasks.length) * 100)
        },
        execution_time: this.getExecutionTime(),
        started_at: new Date(this.startTime).toISOString(),
        completed_at: this.endTime ? new Date(this.endTime).toISOString() : null
      },
      results: outputs,
      task_results: taskResults,
      error: this.error
    };
  }

  /**
   * Version simplifiée de resolveStringVariables pour les outputs
   */
  resolveStringVariables(str, context) {
    return str.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
      const parts = path.trim().split('.');
      let current = context;
      
      for (const part of parts) {
        current = current?.[part];
        if (current === undefined) return match;
      }
      
      return current !== undefined ? current : match;
    });
  }
}

export default WorkflowRunner;