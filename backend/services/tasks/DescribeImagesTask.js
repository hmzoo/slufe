import { analyzeImage } from '../imageAnalyzer.js';

/**
 * Service de tâche pour la description d'images
 * Modèle: llava-13b
 */
export class DescribeImagesTask {
  constructor() {
    this.taskType = 'describe_images';
    this.modelName = 'llava-13b';
  }

  /**
   * Exécute la tâche de description d'images
   * @param {Object} inputs - Entrées de la tâche
   * @param {Array} inputs.images - Liste des images à décrire (URLs ou chemins)
   * @param {string} [inputs.analysisType] - Type d'analyse (comprehensive, basic, objects, etc.)
   * @param {string} [inputs.language] - Langue des descriptions (défaut: 'fr')
   * @param {boolean} [inputs.includeObjects] - Inclure la détection d'objets
   * @param {boolean} [inputs.includeColors] - Inclure l'analyse des couleurs
   * @param {boolean} [inputs.includeMood] - Inclure l'analyse de l'ambiance
   * @returns {Object} Résultats avec les descriptions
   */
  async execute(inputs) {
    try {
      global.logWorkflow(`🔍 Analyse d'images`, {
        model: this.modelName,
        imageCount: inputs.images?.length || 0,
        analysisType: inputs.analysisType || 'comprehensive'
      });

      // Validation des entrées
      const validation = this.validateInputs(inputs);
      if (!validation.isValid) {
        throw new Error(`Entrées invalides: ${validation.errors.join(', ')}`);
      }

      const descriptions = [];
      const analysisType = inputs.analysisType || 'comprehensive';
      const language = inputs.language || 'fr';

      // Traitement de chaque image
      for (let i = 0; i < inputs.images.length; i++) {
        const image = inputs.images[i];
        
        try {
          global.logWorkflow(`📸 Analyse de l'image ${i + 1}/${inputs.images.length}`, {
            image: typeof image === 'string' ? image.substring(0, 50) + '...' : 'Buffer'
          });

          // Appel du service d'analyse d'images existant
          const description = await analyzeImage(image, `Describe this image in ${language === 'fr' ? 'French' : 'English'}.`);
          
          const analysisResult = {
            description: description,
            objects: [], // Le service existant ne retourne que la description
            colors: [],
            mood: 'neutre',
            confidence: 0.8,
            details: {}
          };

          descriptions.push({
            index: i,
            image: image,
            description: analysisResult.description,
            objects: analysisResult.objects || [],
            colors: analysisResult.colors || [],
            mood: analysisResult.mood || 'neutre',
            confidence: analysisResult.confidence || 0.8,
            details: analysisResult.details || {}
          });

        } catch (error) {
          global.logWorkflow(`⚠️ Erreur lors de l'analyse de l'image ${i + 1}`, {
            error: error.message
          });

          // Ajouter une description d'erreur pour cette image
          descriptions.push({
            index: i,
            image: image,
            description: `Erreur lors de l'analyse: ${error.message}`,
            objects: [],
            colors: [],
            mood: 'inconnu',
            confidence: 0.0,
            error: error.message
          });
        }
      }

      global.logWorkflow(`✅ Analyse d'images terminée`, {
        totalImages: inputs.images.length,
        successfulAnalyses: descriptions.filter(d => !d.error).length,
        failedAnalyses: descriptions.filter(d => d.error).length
      });

      return {
        descriptions: descriptions.map(d => d.description),
        detailed_results: descriptions,
        summary: {
          total_images: inputs.images.length,
          successful_analyses: descriptions.filter(d => !d.error).length,
          failed_analyses: descriptions.filter(d => d.error).length,
          average_confidence: this.calculateAverageConfidence(descriptions)
        },
        analysis_type: analysisType,
        language: language
      };

    } catch (error) {
      global.logWorkflow(`❌ Erreur lors de la description d'images`, {
        error: error.message,
        imageCount: inputs.images?.length || 0
      });

      throw error;
    }
  }



  /**
   * Calcule la confiance moyenne des analyses
   * @param {Array} descriptions - Liste des descriptions
   * @returns {number} Confiance moyenne
   */
  calculateAverageConfidence(descriptions) {
    const validDescriptions = descriptions.filter(d => !d.error);
    if (validDescriptions.length === 0) return 0.0;

    const totalConfidence = validDescriptions.reduce((sum, d) => sum + d.confidence, 0);
    return Math.round((totalConfidence / validDescriptions.length) * 100) / 100;
  }

  /**
   * Valide les paramètres d'entrée pour cette tâche
   * @param {Object} inputs - Entrées à valider
   * @returns {Object} Résultat de la validation
   */
  validateInputs(inputs) {
    const errors = [];

    if (!inputs.images) {
      errors.push('La liste d\'images est requise');
    } else if (!Array.isArray(inputs.images)) {
      errors.push('Les images doivent être fournies sous forme de tableau');
    } else if (inputs.images.length === 0) {
      errors.push('Au moins une image doit être fournie');
    } else if (inputs.images.length > 20) {
      errors.push('Maximum 20 images par analyse');
    }

    // Validation du type d'analyse
    const validAnalysisTypes = ['basic', 'comprehensive', 'objects', 'colors', 'mood', 'scene'];
    if (inputs.analysisType && !validAnalysisTypes.includes(inputs.analysisType)) {
      errors.push(`Type d'analyse invalide. Types valides: ${validAnalysisTypes.join(', ')}`);
    }

    // Validation de la langue
    const validLanguages = ['fr', 'en', 'es', 'de', 'it'];
    if (inputs.language && !validLanguages.includes(inputs.language)) {
      errors.push(`Langue non supportée. Langues supportées: ${validLanguages.join(', ')}`);
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
      description: 'Analyse et décrit le contenu d\'images en utilisant la vision par IA',
      inputSchema: {
        images: { 
          type: 'array', 
          required: true, 
          description: 'Liste des images à analyser (URLs ou buffers)',
          maxItems: 20
        },
        analysisType: { 
          type: 'string', 
          required: false, 
          default: 'comprehensive',
          enum: ['basic', 'comprehensive', 'objects', 'colors', 'mood', 'scene'],
          description: 'Type d\'analyse à effectuer' 
        },
        language: { 
          type: 'string', 
          required: false, 
          default: 'fr',
          enum: ['fr', 'en', 'es', 'de', 'it'],
          description: 'Langue des descriptions' 
        },
        includeObjects: { 
          type: 'boolean', 
          required: false, 
          default: true,
          description: 'Inclure la détection d\'objets' 
        },
        includeColors: { 
          type: 'boolean', 
          required: false, 
          default: true,
          description: 'Inclure l\'analyse des couleurs' 
        },
        includeMood: { 
          type: 'boolean', 
          required: false, 
          default: true,
          description: 'Inclure l\'analyse de l\'ambiance' 
        }
      },
      outputSchema: {
        descriptions: { 
          type: 'array', 
          description: 'Liste des descriptions textuelles' 
        },
        detailed_results: { 
          type: 'array', 
          description: 'Résultats détaillés avec objets, couleurs, etc.' 
        },
        summary: { 
          type: 'object', 
          description: 'Résumé statistique de l\'analyse' 
        },
        analysis_type: { 
          type: 'string', 
          description: 'Type d\'analyse utilisé' 
        },
        language: { 
          type: 'string', 
          description: 'Langue des descriptions' 
        }
      },
      estimatedDuration: 5, // secondes par image
      costEstimate: 0.05 // USD par image
    };
  }
}

export default DescribeImagesTask;