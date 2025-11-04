import { enhancePrompt } from '../promptEnhancer.js';

/**
 * Service de génération automatique de workflows
 * Utilise Gemini 2.5 Flash pour analyser le prompt et les images
 * et générer un workflow JSON intelligent
 */
export class GenerateWorkflowTask {
  constructor() {
    this.type = 'generate_workflow';
    this.description = 'Génère automatiquement un workflow JSON basé sur un prompt et des images';
    this.modelName = 'gemini-2.5-flash';
  }

  /**
   * Métadonnées de la tâche pour validation
   */
  static getMetadata() {
    return {
      type: 'generate_workflow',
      description: 'Génère automatiquement un workflow JSON basé sur un prompt et des images',
      inputs: {
        required: ['prompt'],
        optional: ['images', 'image_descriptions', 'workflow_style', 'complexity_level']
      },
      outputs: ['workflow', 'reasoning', 'estimated_duration', 'task_count']
    };
  }

  /**
   * Validation des entrées
   */
  validateInputs(inputs) {
    if (!inputs.prompt || typeof inputs.prompt !== 'string') {
      throw new Error('Le prompt est requis et doit être une chaîne de caractères');
    }

    if (inputs.images && !Array.isArray(inputs.images)) {
      throw new Error('Les images doivent être un tableau');
    }

    if (inputs.image_descriptions && !Array.isArray(inputs.image_descriptions)) {
      throw new Error('Les descriptions d\'images doivent être un tableau');
    }

    return true;
  }

  /**
   * Exécute la génération automatique de workflow
   * @param {Object} inputs - Entrées de la tâche
   * @param {string} inputs.prompt - Description de ce que l'utilisateur veut accomplir
   * @param {Array} [inputs.images] - Liste des images à traiter
   * @param {Array} [inputs.image_descriptions] - Descriptions des images
   * @param {string} [inputs.workflow_style] - Style de workflow (simple, détaillé, créatif)
   * @param {string} [inputs.complexity_level] - Niveau de complexité (basic, intermediate, advanced)
   * @returns {Object} Workflow généré avec métadonnées
   */
  async execute(inputs) {
    try {
      global.logWorkflow(`🧠 Génération automatique de workflow: "${inputs.prompt}"`, {
        model: this.modelName,
        hasImages: !!(inputs.images && inputs.images.length),
        imageCount: inputs.images?.length || 0,
        hasDescriptions: !!(inputs.image_descriptions && inputs.image_descriptions.length)
      });

      // Validation des entrées
      this.validateInputs(inputs);

      // Construction du prompt pour Gemini
      const systemPrompt = this.buildSystemPrompt(inputs);
      
      global.logWorkflow('📝 Prompt système construit', {
        systemPromptLength: systemPrompt.length,
        workflowStyle: inputs.workflow_style || 'standard',
        complexity: inputs.complexity_level || 'intermediate'
      });

      // Appel à Gemini pour générer le workflow
      const generatedWorkflow = await this.callGeminiForWorkflow(systemPrompt);

      global.logWorkflow('📄 Réponse brute de Gemini', {
        responseLength: generatedWorkflow.length,
        firstChars: generatedWorkflow.substring(0, 200),
        lastChars: generatedWorkflow.substring(generatedWorkflow.length - 100)
      });

      // Parsing et validation du JSON généré
      const workflowData = this.parseAndValidateWorkflow(generatedWorkflow);

      global.logWorkflow('✅ Workflow généré avec succès', {
        taskCount: workflowData.workflow.tasks.length,
        workflowId: workflowData.workflow.id,
        estimatedDuration: workflowData.estimated_duration
      });

      return {
        workflow: workflowData.workflow,
        reasoning: workflowData.reasoning || 'Workflow généré automatiquement par Gemini',
        estimated_duration: workflowData.estimated_duration || this.estimateDuration(workflowData.workflow),
        task_count: workflowData.workflow.tasks.length,
        complexity_level: inputs.complexity_level || 'intermediate',
        generated_at: new Date().toISOString(),
        model_used: this.modelName
      };

    } catch (error) {
      global.logWorkflow('❌ Erreur génération workflow', {
        error: error.message,
        prompt: inputs.prompt?.substring(0, 100) + '...'
      });

      // En cas d'erreur, retourner un workflow de base
      return this.createFallbackWorkflow(inputs, error.message);
    }
  }

  /**
   * Appelle Gemini spécifiquement pour générer un workflow JSON
   */
  async callGeminiForWorkflow(systemPrompt) {
    try {
      // Import dynamique de Replicate
      const Replicate = (await import('replicate')).default;
      
      if (!process.env.REPLICATE_API_TOKEN) {
        throw new Error('REPLICATE_API_TOKEN non configuré');
      }

      const replicate = new Replicate({
        auth: process.env.REPLICATE_API_TOKEN,
      });

      // Modèle Gemini 2.5 Flash pour génération structurée
      const systemInstruction = "Tu es un générateur de workflows JSON. Tu réponds UNIQUEMENT avec du JSON valide, sans markdown, sans texte d'introduction.";
      
      const input = {
        system_instruction: systemInstruction,
        prompt: systemPrompt,
        max_output_tokens: 2000,
        temperature: 0.3, // Moins créatif pour plus de structure
        top_p: 0.8,
        dynamic_thinking: false
      };

      global.logWorkflow('🤖 Appel Gemini pour génération workflow', {
        model: 'google/gemini-2.5-flash',
        promptLength: systemPrompt.length,
        temperature: input.temperature
      });

      const output = await replicate.run(
        "google/gemini-2.5-flash",
        { input }
      );

      // Concaténer la sortie si c'est un array
      let result = Array.isArray(output) ? output.join('') : output;
      
      global.logWorkflow('📄 Réponse brute de Gemini', {
        responseLength: result.length,
        firstChars: result.substring(0, 200),
        lastChars: result.substring(Math.max(0, result.length - 100))
      });

      return result;

    } catch (error) {
      global.logWorkflow('❌ Erreur appel Gemini', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Construit le prompt système pour Gemini
   */
  buildSystemPrompt(inputs) {
    const hasImages = inputs.images && inputs.images.length > 0;
    const hasDescriptions = inputs.image_descriptions && inputs.image_descriptions.length > 0;
    const workflowStyle = inputs.workflow_style || 'standard';
    const complexity = inputs.complexity_level || 'intermediate';

    let systemPrompt = `Tu es un expert en génération de workflows d'IA créative. Ta mission est de générer un workflow JSON structuré basé sur les besoins de l'utilisateur.

CONTEXTE:
- Prompt utilisateur: "${inputs.prompt}"
- Nombre d'images: ${inputs.images?.length || 0}
- Style de workflow: ${workflowStyle}
- Complexité: ${complexity}`;

    if (hasDescriptions) {
      systemPrompt += `\n- Descriptions des images: ${inputs.image_descriptions.join(', ')}`;
    }

    systemPrompt += `

TYPES DE TÂCHES DISPONIBLES:
1. "enhance_prompt" - Améliore un prompt texte
   Entrées: prompt, style, language
   Sorties: enhanced_prompt, improvements

2. "describe_images" - Analyse et décrit des images
   Entrées: images
   Sorties: descriptions, analysis

3. "generate_image" - Génère des images à partir de prompts
   Entrées: prompt, aspectRatio, style
   Sorties: image, parameters_used

4. "edit_image" - Édite/modifie des images existantes
   Entrées: image, prompt, operation_type
   Sorties: edited_image, modifications

5. "generate_video_i2v" - Génère une vidéo à partir d'une image
   Entrées: image, prompt, duration
   Sorties: video, metadata

6. "generate_video_t2v" - Génère une vidéo à partir de texte
   Entrées: prompt, duration, aspect_ratio
   Sorties: video, metadata

RÉSOLUTION DE VARIABLES:
- {{inputs.nom_variable}} : accès aux entrées du workflow
- {{task_id.output_field}} : accès aux sorties d'une tâche précédente

INSTRUCTIONS SPÉCIALES SELON LE CONTEXTE:`;

    if (hasImages && !hasDescriptions) {
      systemPrompt += `
- L'utilisateur a fourni des images mais pas de descriptions
- OBLIGATOIRE: Commence toujours par une tâche "describe_images" pour analyser les images
- Utilise ensuite {{describe1.descriptions}} dans les tâches suivantes`;
    }

    if (complexity === 'basic') {
      systemPrompt += `
- Génère un workflow simple avec 1-3 tâches maximum
- Privilégie la simplicité et l'efficacité`;
    } else if (complexity === 'advanced') {
      systemPrompt += `
- Génère un workflow complexe avec 4-8 tâches
- Inclus des étapes d'optimisation et de raffinement`;
    }

    systemPrompt += `

IMPORTANT: Tu DOIS répondre UNIQUEMENT avec un objet JSON valide, sans texte d'introduction, sans markdown, sans explication.

STRUCTURE JSON REQUISE:
{
  "workflow": {
    "id": "auto_generated_20251103_113000",
    "name": "Nom du workflow",
    "description": "Description",
    "tasks": [
      {
        "id": "task1",
        "type": "enhance_prompt",
        "input": {
          "prompt": "{{inputs.prompt}}",
          "style": "photographic"
        }
      },
      {
        "id": "task2", 
        "type": "generate_image",
        "input": {
          "prompt": "{{task1.enhanced_prompt}}",
          "aspectRatio": "16:9"
        }
      }
    ]
  },
  "reasoning": "Explication du workflow",
  "estimated_duration": 25
}

COMMENCE DIRECTEMENT PAR { ET TERMINE PAR }. PAS DE TEXTE AVANT OU APRÈS.`;

    return systemPrompt;
  }

  /**
   * Parse et valide le workflow JSON généré
   */
  parseAndValidateWorkflow(generatedText) {
    try {
      // Nettoyer le texte pour extraire le JSON
      let jsonText = generatedText.trim();
      
      // Enlever les markdown code blocks si présents
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      
      // Trouver le premier { et le dernier }
      const startIndex = jsonText.indexOf('{');
      const lastIndex = jsonText.lastIndexOf('}');
      
      if (startIndex === -1 || lastIndex === -1) {
        throw new Error('JSON non trouvé dans la réponse');
      }
      
      jsonText = jsonText.substring(startIndex, lastIndex + 1);
      
      const workflowData = JSON.parse(jsonText);
      
      // Validation de base
      if (!workflowData.workflow) {
        throw new Error('Objet "workflow" manquant');
      }
      
      if (!workflowData.workflow.tasks || !Array.isArray(workflowData.workflow.tasks)) {
        throw new Error('Liste "tasks" manquante ou invalide');
      }
      
      if (workflowData.workflow.tasks.length === 0) {
        throw new Error('Le workflow doit contenir au moins une tâche');
      }
      
      // Générer un ID si manquant
      if (!workflowData.workflow.id) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '').substring(0, 15);
        workflowData.workflow.id = `auto_generated_${timestamp}`;
      }
      
      return workflowData;
      
    } catch (error) {
      throw new Error(`Erreur parsing JSON: ${error.message}`);
    }
  }

  /**
   * Estime la durée d'exécution d'un workflow
   */
  estimateDuration(workflow) {
    const taskDurations = {
      'enhance_prompt': 5,
      'describe_images': 10,
      'generate_image': 15,
      'edit_image': 20,
      'generate_video_i2v': 30,
      'generate_video_t2v': 45
    };
    
    let totalDuration = 0;
    for (const task of workflow.tasks) {
      totalDuration += taskDurations[task.type] || 10;
    }
    
    return totalDuration;
  }

  /**
   * Crée un workflow de secours en cas d'erreur
   */
  createFallbackWorkflow(inputs, errorMessage) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '').substring(0, 15);
    
    // Workflow de base selon le contexte
    const hasImages = inputs.images && inputs.images.length > 0;
    
    const fallbackWorkflow = {
      id: `fallback_${timestamp}`,
      name: 'Workflow de Secours',
      description: 'Workflow généré automatiquement suite à une erreur',
      tasks: []
    };
    
    if (hasImages) {
      fallbackWorkflow.tasks.push({
        id: 'describe1',
        type: 'describe_images',
        input: {
          images: '{{inputs.images}}'
        }
      });
    }
    
    fallbackWorkflow.tasks.push({
      id: 'enhance1',
      type: 'enhance_prompt',
      input: {
        prompt: '{{inputs.prompt}}',
        style: 'creative'
      }
    });
    
    return {
      workflow: fallbackWorkflow,
      reasoning: `Workflow de secours généré suite à l'erreur: ${errorMessage}`,
      estimated_duration: this.estimateDuration(fallbackWorkflow),
      task_count: fallbackWorkflow.tasks.length,
      error: errorMessage,
      fallback: true,
      generated_at: new Date().toISOString(),
      model_used: 'fallback_generator'
    };
  }
}

export default GenerateWorkflowTask;