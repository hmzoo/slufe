import { enhancePrompt } from '../promptEnhancer.js';

/**
 * Service de tâche pour l'amélioration de prompts
 * Modèle: gemini-2.5-flash
 */
export class EnhancePromptTask {
  constructor() {
    this.taskType = 'enhance_prompt';
    this.modelName = 'gemini-2.5-flash';
  }

  /**
   * Exécute la tâche d'amélioration de prompt
   * @param {Object} inputs - Entrées de la tâche
   * @param {string} inputs.prompt - Prompt à améliorer
   * @param {string} [inputs.style] - Style souhaité (optionnel)
   * @param {string} [inputs.language] - Langue (optionnel, défaut: 'fr')
   * @param {string} [inputs.enhancementLevel] - Niveau d'amélioration (optionnel)
   * @returns {Object} Résultats avec le prompt amélioré
   */
  async execute(inputs) {
    try {
      global.logWorkflow(`🎯 Amélioration du prompt: "${inputs.prompt}"`, {
        model: this.modelName,
        style: inputs.style,
        language: inputs.language || 'fr'
      });

      // Validation des entrées
      if (!inputs.prompt || typeof inputs.prompt !== 'string') {
        throw new Error('Le prompt est requis et doit être une chaîne de caractères');
      }

      // Préparation des paramètres pour le service d'amélioration
      const enhancementParams = {
        prompt: inputs.prompt,
        style: inputs.style || 'réaliste',
        language: inputs.language || 'fr',
        enhancementLevel: inputs.enhancementLevel || 'medium',
        addDetails: true,
        optimizeForAI: true
      };

      // Appel du service d'amélioration de prompts existant
      const enhancedPrompt = await enhancePrompt(inputs.prompt, {
        hasImages: false,
        imageCount: 0,
        style: inputs.style,
        language: inputs.language
      });

      global.logWorkflow(`✅ Prompt amélioré avec succès`, {
        originalLength: inputs.prompt.length,
        enhancedLength: enhancedPrompt.length
      });

      return {
        enhanced_prompt: enhancedPrompt,
        original_prompt: inputs.prompt,
        improvements: ['Prompt amélioré par Gemini 2.5 Flash'],
        confidence: 0.8,
        style_applied: inputs.style || 'réaliste',
        language: inputs.language || 'fr'
      };

    } catch (error) {
      global.logWorkflow(`❌ Erreur lors de l'amélioration du prompt`, {
        error: error.message,
        prompt: inputs.prompt
      });

      // En cas d'erreur, retourner le prompt original avec un message d'erreur
      return {
        enhanced_prompt: inputs.prompt, // Fallback vers le prompt original
        original_prompt: inputs.prompt,
        improvements: ['Erreur lors de l\'amélioration'],
        confidence: 0.0,
        error: error.message,
        fallback: true
      };
    }
  }

  /**
   * Valide les paramètres d'entrée pour cette tâche
   * @param {Object} inputs - Entrées à valider
   * @returns {Object} Résultat de la validation
   */
  validateInputs(inputs) {
    const errors = [];

    if (!inputs.prompt) {
      errors.push('Le prompt est requis');
    }

    if (typeof inputs.prompt !== 'string') {
      errors.push('Le prompt doit être une chaîne de caractères');
    }

    if (inputs.prompt && inputs.prompt.length > 2000) {
      errors.push('Le prompt ne peut pas dépasser 2000 caractères');
    }

    if (inputs.style && typeof inputs.style !== 'string') {
      errors.push('Le style doit être une chaîne de caractères');
    }

    if (inputs.language && typeof inputs.language !== 'string') {
      errors.push('La langue doit être une chaîne de caractères');
    }

    const validEnhancementLevels = ['low', 'medium', 'high'];
    if (inputs.enhancementLevel && !validEnhancementLevels.includes(inputs.enhancementLevel)) {
      errors.push(`Le niveau d'amélioration doit être l'un de: ${validEnhancementLevels.join(', ')}`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Retourne les métadonnées de cette tâche
   * @returns {Object} Métadonnées
   */
  getMetadata() {
    return {
      taskType: this.taskType,
      modelName: this.modelName,
      description: 'Améliore et optimise un prompt pour la génération IA',
      inputSchema: {
        prompt: { type: 'string', required: true, description: 'Prompt à améliorer' },
        style: { type: 'string', required: false, description: 'Style souhaité' },
        language: { type: 'string', required: false, default: 'fr', description: 'Langue du prompt' },
        enhancementLevel: { 
          type: 'string', 
          required: false, 
          default: 'medium',
          enum: ['low', 'medium', 'high'],
          description: 'Niveau d\'amélioration' 
        }
      },
      outputSchema: {
        enhanced_prompt: { type: 'string', description: 'Prompt amélioré' },
        original_prompt: { type: 'string', description: 'Prompt original' },
        improvements: { type: 'array', description: 'Liste des améliorations apportées' },
        confidence: { type: 'number', description: 'Score de confiance (0-1)' },
        style_applied: { type: 'string', description: 'Style appliqué' },
        language: { type: 'string', description: 'Langue utilisée' }
      },
      estimatedDuration: 3, // secondes
      costEstimate: 0.01 // USD
    };
  }
}

export default EnhancePromptTask;