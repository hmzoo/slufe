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
    this.taskServices.set('image_resize_crop', null);
    this.taskServices.set('image_enhance', null);
    this.taskServices.set('generate_video_t2v', null);
    this.taskServices.set('generate_video_i2v', null);
    this.taskServices.set('generate_workflow', null);
    
    // Tâches de traitement vidéo
    this.taskServices.set('video_extract_frame', null);
    this.taskServices.set('video_concatenate', null);
    
    // Tâches génériques (inputs utilisateur)
    this.taskServices.set('input_text', null);
    this.taskServices.set('text_input', null); // Alias pour compatibilité frontend
    this.taskServices.set('text_output', null); // Alias pour les outputs de texte  
    this.taskServices.set('image_input', null); // Support pour les inputs d'image
    this.taskServices.set('image_output', null); // Support pour les outputs d'image
    this.taskServices.set('video_output', null); // Support pour les outputs de vidéo
    this.taskServices.set('input_images', null);
    this.taskServices.set('camera_capture', null);
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

      // Exécution séquentielle selon le format du workflow
      if (workflow.inputs || workflow.outputs) {
        // Format v2 avec sections séparées
        
        // 1. Exécuter les inputs
        if (workflow.inputs && Array.isArray(workflow.inputs)) {
          global.logWorkflow(`📥 Exécution des inputs (${workflow.inputs.length})`);
          for (const inputTask of workflow.inputs) {
            await this.executeTask(inputTask, execution);
          }
        }
        
        // 2. Exécuter les tâches principales
        if (workflow.tasks && Array.isArray(workflow.tasks)) {
          global.logWorkflow(`⚙️ Exécution des tâches (${workflow.tasks.length})`);
          for (const task of workflow.tasks) {
            await this.executeTask(task, execution);
          }
        }
        
        // 3. Exécuter les outputs
        if (workflow.outputs && Array.isArray(workflow.outputs)) {
          global.logWorkflow(`📤 Exécution des outputs (${workflow.outputs.length})`);
          for (const outputTask of workflow.outputs) {
            await this.executeTask(outputTask, execution);
          }
        }
      } else {
        // Format v1 classique - seulement tasks
        for (const task of workflow.tasks) {
          await this.executeTask(task, execution);
        }
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
      let taskInputs = task.input || task.inputs || {};
      
      // Pour les tâches d'input/output, inclure les champs spéciaux de la tâche
      if (task.type === 'text_input' || task.type === 'input_text' || task.type === 'text_output') {
        taskInputs = {
          ...taskInputs,
          label: task.label || task.id,
          userInput: task.userInput || taskInputs.text, // Permet d'utiliser text résolu comme userInput
          defaultValue: task.defaultValue,
          placeholder: task.placeholder,
          text: task.text || taskInputs.text, // Pour text_output
          title: task.title,
          format: task.format
        };
      } else if (task.type === 'image_input' || task.type === 'image_output') {
        taskInputs = {
          ...taskInputs,
          label: task.label || task.id,
          image: task.image || task.selectedImage || taskInputs.image,
          selectedImage: task.selectedImage,
          defaultImage: task.defaultImage,
          title: task.title,
          caption: task.caption,
          width: task.width
        };
      } else if (task.type === 'video_output') {
        taskInputs = {
          ...taskInputs,
          label: task.label || task.id,
          video: task.video || taskInputs.video,
          title: task.title,
          width: task.width,
          autoplay: task.autoplay,
          controls: task.controls,
          loop: task.loop
        };
      }
      
      const resolvedInputs = await this.resolveVariables(taskInputs, execution.getContext());

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
      // Cas spécial: Référence à une image unique uploadée depuis le Builder
      if (value.startsWith('__UPLOADED_IMAGE_')) {
        const match = value.match(/^__UPLOADED_IMAGE_(.+?)_(.+?)__$/);
        if (match && context.inputs && context.inputs.__uploadedFiles) {
          const [, taskId, inputKey] = match;
          const fieldName = `${taskId}_${inputKey}`;
          const uploadedFiles = context.inputs.__uploadedFiles[fieldName];
          
          if (uploadedFiles && uploadedFiles.length > 0) {
            global.logWorkflow(`📎 Résolution image unique uploadée: ${fieldName}`);
            return uploadedFiles[0]; // Retourne le premier fichier
          }
        }
        
        global.logWorkflow(`⚠️ Image uploadée non trouvée: ${value}`);
        return value;
      }
      
      // Cas spécial: Référence aux images uploadées depuis le Builder (multiple)
      if (value.startsWith('__UPLOADED_IMAGES_')) {
        const match = value.match(/^__UPLOADED_IMAGES_(.+?)_(.+?)__$/);
        if (match && context.inputs && context.inputs.__uploadedFiles) {
          const [, taskId, inputKey] = match;
          const fieldName = `${taskId}_${inputKey}`;
          const uploadedFiles = context.inputs.__uploadedFiles[fieldName];
          
          if (uploadedFiles) {
            global.logWorkflow(`📎 Résolution images uploadées: ${fieldName}`, {
              count: uploadedFiles.length
            });
            return uploadedFiles;
          }
        }
        
        global.logWorkflow(`⚠️ Images uploadées non trouvées: ${value}`);
        return value;
      }
      
      // Cas spécial : si la chaîne est UNIQUEMENT une variable (ex: "{{inputs.images}}")
      // retourner la valeur directement sans conversion en string
      const singleVarMatch = value.match(/^\{\{([^}]+)\}\}$/);
      if (singleVarMatch) {
        const path = singleVarMatch[1].trim();
        const resolvedValue = this.getValueFromPath(path, context);
        
        global.logWorkflow(`🔍 Résolution variable unique: ${value}`, {
          path: path,
          valueType: Array.isArray(resolvedValue) ? 'array' : typeof resolvedValue,
          resolved: resolvedValue !== undefined ? 'OUI' : 'NON'
        });
        
        // Si c'est une URL d'image, la convertir en base64
        if (typeof resolvedValue === 'string' && this.isImageUrl(resolvedValue)) {
          return await this.convertUrlToBase64(resolvedValue);
        }
        
        return resolvedValue !== undefined ? resolvedValue : value;
      }
      
      // Cas spécial: UUID de média - résolution vers fichier uploadé
      if (value.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        // C'est un UUID, chercher dans __mediaFiles (mapping direct UUID -> fichier)
        if (context.inputs && context.inputs.__mediaFiles && context.inputs.__mediaFiles[value]) {
          global.logWorkflow(`📎 Résolution UUID: ${value} -> fichier média`, {
            mediaId: value
          });
          return context.inputs.__mediaFiles[value];
        }
        global.logWorkflow(`⚠️ UUID non résolu: ${value}`);
        return value;
      }
      
      // Cas normal : résolution de variables dans une chaîne avec texte
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
      'image_resize_crop': './tasks/ImageResizeCropTask.js',
      'image_enhance': './tasks/ImageEnhanceTask.js',
      'generate_video_t2v': './tasks/GenerateVideoT2VTask.js',
      'generate_video_i2v': './tasks/GenerateVideoI2VTask.js',
      'generate_workflow': './tasks/GenerateWorkflowTask.js',
      
      // Tâches de traitement vidéo
      'video_extract_frame': './tasks/VideoExtractFrameTask.js',
      'video_concatenate': './tasks/VideoConcatenateTask.js',
      
      // Tâches génériques (inputs utilisateur)
      'input_text': './tasks/InputTextTask.js',
      'text_input': './tasks/InputTextTask.js', // Alias pour compatibilité frontend
      'text_output': './tasks/InputTextTask.js', // Alias pour les outputs de texte
      'image_input': './tasks/InputImageTask.js', // Support pour les inputs d'image
      'image_output': './tasks/ImageOutputTask.js', // Support pour les outputs d'image
      'video_output': './tasks/VideoOutputTask.js', // Support pour les outputs de vidéo
      'input_images': './tasks/InputImagesTask.js',
      'camera_capture': './tasks/CameraCaptureTask.js'
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

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
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

    // Vérifier le format du workflow
    const hasV2Format = workflow.inputs || workflow.outputs;
    
    if (hasV2Format) {
      // Format v2 - au moins une section doit exister et contenir des tâches
      const totalTasks = (workflow.inputs?.length || 0) + 
                        (workflow.tasks?.length || 0) + 
                        (workflow.outputs?.length || 0);
                        
      if (totalTasks === 0) {
        throw new Error('Le workflow doit contenir au moins une tâche dans inputs, tasks ou outputs');
      }
    } else {
      // Format v1 classique
      if (!workflow.tasks || !Array.isArray(workflow.tasks)) {
        throw new Error('Le workflow doit contenir un tableau de tâches');
      }

      if (workflow.tasks.length === 0) {
        throw new Error('Le workflow doit contenir au moins une tâche');
      }
    }

    // Validation des IDs uniques entre toutes les sections
    const allTasks = [];
    const taskIds = new Set();

    // Collecter toutes les tâches des différentes sections
    if (workflow.inputs) {
      allTasks.push(...workflow.inputs);
    }
    if (workflow.tasks) {
      allTasks.push(...workflow.tasks);
    }
    if (workflow.outputs) {
      allTasks.push(...workflow.outputs);
    }

    // Validation des tâches individuelles
    for (const task of allTasks) {
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
    this.validateTaskReferences(allTasks);
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
    let outputsList = []; // Format array pour le frontend
    
    if (this.workflow.outputs) {
      if (Array.isArray(this.workflow.outputs)) {
        // Format v2 - outputs est un array de tâches
        this.workflow.outputs.forEach((outputTask, index) => {
          const taskResult = this.taskResults.get(outputTask.id);
          if (taskResult && taskResult.status === 'completed') {
            outputs[index] = {
              id: outputTask.id,
              type: outputTask.type,
              result: taskResult.outputs
            };
            
            // Ajouter à la liste des résultats avec le bon format pour le frontend
            // Si le résultat a un type (image, video), l'utiliser directement
            if (taskResult.outputs && taskResult.outputs.type) {
              outputsList.push({
                id: outputTask.id,
                taskType: outputTask.type,
                type: taskResult.outputs.type,  // Type du contenu (image, video)
                url: taskResult.outputs.image || taskResult.outputs.video || taskResult.outputs.url,
                path: taskResult.outputs.image || taskResult.outputs.video || taskResult.outputs.url,
                mediaId: `workflow-${Date.now()}-${index}`,
                description: taskResult.outputs.description || taskResult.outputs.caption || '',
                ...taskResult.outputs  // Inclure tous les outputs
              });
            }
          }
        });
      } else {
        // Format v1 - outputs est un objet
        const context = this.getContext();
        for (const [key, path] of Object.entries(this.workflow.outputs)) {
          if (typeof path === 'string' && path.includes('{{')) {
            outputs[key] = this.resolveStringVariables(path, context);
          } else {
            outputs[key] = path;
          }
        }
      }
    }

    // Si pas d'outputs explicites, créer outputsList depuis tous les taskResults avec type image/video
    if (outputsList.length === 0) {
      let index = 0;
      for (const [taskId, taskResult] of this.taskResults.entries()) {
        if (taskResult.status === 'completed' && taskResult.outputs && taskResult.outputs.type && 
            (taskResult.outputs.type === 'image' || taskResult.outputs.type === 'video')) {
          outputsList.push({
            id: taskId,
            taskType: taskResult.type,
            type: taskResult.outputs.type,  // Type du contenu (image, video)
            url: taskResult.outputs.image || taskResult.outputs.video || taskResult.outputs.url,
            path: taskResult.outputs.image || taskResult.outputs.video || taskResult.outputs.url,
            mediaId: `workflow-${Date.now()}-${index}`,
            description: taskResult.outputs.description || taskResult.outputs.caption || '',
            ...taskResult.outputs  // Inclure tous les outputs
          });
          index++;
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
      results: outputsList.length > 0 ? outputsList : outputs,  // Retourner array si possible, sinon objet
      results_object: outputs,  // Garder aussi l'objet pour compatibilité
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