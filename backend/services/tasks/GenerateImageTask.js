import { generateImage } from '../imageGenerator.js';
import { saveMediaFile, getFileExtension } from '../../utils/fileUtils.js';

/**
 * Service de tâche pour la génération d'images
 * Modèle: qwen-image
 */
export class GenerateImageTask {
  constructor() {
    this.taskType = 'generate_image';
    this.modelName = 'qwen-image';
  }

  /**
   * Exécute la tâche de génération d'image
   * @param {Object} inputs - Entrées de la tâche
   * @param {string} inputs.prompt - Prompt pour la génération
   * @param {string} [inputs.reference_image] - Image de référence (optionnel)
   * @param {Object} [inputs.parameters] - Paramètres du modèle
   * @returns {Object} Résultats avec l'image générée
   */
  async execute(inputs) {
    try {
      global.logWorkflow(`🎨 Génération d'image`, {
        model: this.modelName,
        prompt: inputs.prompt?.substring(0, 100) + '...',
        hasReferenceImage: !!inputs.reference_image,
        parameters: inputs.parameters
      });

      // Validation des entrées
      const validation = this.validateInputs(inputs);
      if (!validation.isValid) {
        throw new Error(`Entrées invalides: ${validation.errors.join(', ')}`);
      }

      // Préparation des paramètres
      const generationParams = {
        prompt: inputs.prompt,
        ...this.getDefaultParameters(),
        ...inputs.parameters
      };

      // Ajouter l'image de référence si fournie
      if (inputs.reference_image) {
        generationParams.reference_image = inputs.reference_image;
        generationParams.mode = 'img2img';
      } else {
        generationParams.mode = 'txt2img';
      }

      global.logWorkflow(`⚙️ Paramètres de génération`, generationParams);

      // Déterminer l'aspect ratio à utiliser
      let aspectRatio;
      if (inputs.aspectRatio) {
        // Si aspectRatio est fourni directement dans les inputs
        aspectRatio = inputs.aspectRatio;
      } else if (generationParams.width && generationParams.height) {
        // Sinon calculer depuis width/height
        aspectRatio = this.getAspectRatioFromDimensions(generationParams.width, generationParams.height);
      } else {
        // Par défaut
        aspectRatio = '1:1';
      }

      // Appel du service de génération d'images existant
      const imageUrl = await generateImage({
        prompt: inputs.prompt,
        guidance: generationParams.guidance_scale,
        numInferenceSteps: generationParams.steps,
        aspectRatio: aspectRatio,
        seed: generationParams.seed
      });

      global.logWorkflow(`✅ Image générée avec succès`, {
        imageUrl: imageUrl?.substring(0, 100) + '...',
        aspectRatio: aspectRatio
      });

      // Télécharger et sauvegarder l'image localement
      global.logWorkflow(`📥 Téléchargement de l'image générée...`);
      
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`Erreur téléchargement: ${response.status} ${response.statusText}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const extension = getFileExtension(response.headers.get('content-type') || 'image/png');
      const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}.${extension}`;
      const savedFile = saveMediaFile(filename, buffer);
      
      global.logWorkflow(`💾 Image sauvegardée localement`, {
        filename: savedFile.filename,
        url: savedFile.url,
        size: `${Math.round(buffer.length / 1024)}KB`
      });

      return {
        image: savedFile.url,
        image_filename: savedFile.filename,
        external_url: imageUrl, // Garder l'URL originale pour référence
        prompt_used: inputs.prompt,
        reference_image: inputs.reference_image || null,
        parameters_used: generationParams,
        metadata: {
          width: generationParams.width,
          height: generationParams.height,
          steps: generationParams.steps,
          guidance_scale: generationParams.guidance_scale,
          seed: generationParams.seed,
          model: this.modelName,
          mode: generationParams.mode
        },
        processing_time: 0,
        generation_id: `img_${Date.now()}`
      };

    } catch (error) {
      global.logWorkflow(`❌ Erreur lors de la génération d'image`, {
        error: error.message,
        prompt: inputs.prompt
      });

      throw error;
    }
  }

  /**
   * Retourne les paramètres par défaut pour la génération
   * @returns {Object} Paramètres par défaut
   */
  getDefaultParameters() {
    return {
      width: 1024,
      height: 1024,
      steps: 50,
      guidance_scale: 7.5,
      seed: Math.floor(Math.random() * 1000000),
      quality: 'high',
      safety_check: true
    };
  }

  /**
   * Convertit les dimensions en aspect ratio supporté
   * @param {number} width - Largeur
   * @param {number} height - Hauteur
   * @returns {string} Aspect ratio le plus proche
   */
  getAspectRatioFromDimensions(width, height) {
    const ratio = width / height;
    
    if (Math.abs(ratio - 1) < 0.1) return '1:1';
    if (Math.abs(ratio - 16/9) < 0.1) return '16:9';
    if (Math.abs(ratio - 9/16) < 0.1) return '9:16';
    if (Math.abs(ratio - 4/3) < 0.1) return '4:3';
    if (Math.abs(ratio - 3/4) < 0.1) return '3:4';
    if (Math.abs(ratio - 3/2) < 0.1) return '3:2';
    if (Math.abs(ratio - 2/3) < 0.1) return '2:3';
    
    // Par défaut, retourner le ratio le plus proche
    return ratio > 1 ? '16:9' : '9:16';
  }

  /**
   * Valide les paramètres d'entrée pour cette tâche
   * @param {Object} inputs - Entrées à valider
   * @returns {Object} Résultat de la validation
   */
  validateInputs(inputs) {
    const errors = [];

    // Validation du prompt
    if (!inputs.prompt) {
      errors.push('Le prompt est requis');
    } else if (typeof inputs.prompt !== 'string') {
      errors.push('Le prompt doit être une chaîne de caractères');
    } else if (inputs.prompt.length < 3) {
      errors.push('Le prompt doit contenir au moins 3 caractères');
    } else if (inputs.prompt.length > 2000) {
      errors.push('Le prompt ne peut pas dépasser 2000 caractères');
    }

    // Validation des paramètres optionnels
    if (inputs.parameters) {
      const params = inputs.parameters;

      // Validation des dimensions
      if (params.width && (params.width < 256 || params.width > 2048)) {
        errors.push('La largeur doit être entre 256 et 2048 pixels');
      }
      if (params.height && (params.height < 256 || params.height > 2048)) {
        errors.push('La hauteur doit être entre 256 et 2048 pixels');
      }

      // Validation des steps
      if (params.steps && (params.steps < 10 || params.steps > 150)) {
        errors.push('Le nombre de steps doit être entre 10 et 150');
      }

      // Validation du guidance_scale
      if (params.guidance_scale && (params.guidance_scale < 1 || params.guidance_scale > 20)) {
        errors.push('Le guidance_scale doit être entre 1 et 20');
      }

      // Validation du seed
      if (params.seed && (params.seed < 0 || params.seed > 999999999)) {
        errors.push('Le seed doit être entre 0 et 999999999');
      }

      // Validation de la qualité
      const validQualities = ['draft', 'normal', 'high', 'ultra'];
      if (params.quality && !validQualities.includes(params.quality)) {
        errors.push(`Qualité invalide. Qualités disponibles: ${validQualities.join(', ')}`);
      }
    }

    // Validation de l'image de référence
    if (inputs.reference_image) {
      if (typeof inputs.reference_image !== 'string') {
        errors.push('L\'image de référence doit être une URL ou un chemin');
      }
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
      description: 'Génère des images à partir de descriptions textuelles',
      inputSchema: {
        prompt: { 
          type: 'string', 
          required: true, 
          description: 'Description textuelle de l\'image à générer',
          minLength: 3,
          maxLength: 2000
        },
        reference_image: { 
          type: 'string', 
          required: false, 
          description: 'URL ou chemin vers une image de référence pour img2img' 
        },
        parameters: {
          type: 'object',
          required: false,
          description: 'Paramètres de génération',
          properties: {
            width: { 
              type: 'integer', 
              default: 1024, 
              minimum: 256, 
              maximum: 2048,
              description: 'Largeur de l\'image en pixels' 
            },
            height: { 
              type: 'integer', 
              default: 1024, 
              minimum: 256, 
              maximum: 2048,
              description: 'Hauteur de l\'image en pixels' 
            },
            steps: { 
              type: 'integer', 
              default: 50, 
              minimum: 10, 
              maximum: 150,
              description: 'Nombre d\'étapes de diffusion' 
            },
            guidance_scale: { 
              type: 'number', 
              default: 7.5, 
              minimum: 1, 
              maximum: 20,
              description: 'Force de guidance du prompt' 
            },
            seed: { 
              type: 'integer', 
              minimum: 0, 
              maximum: 999999999,
              description: 'Graine pour la génération déterministe' 
            },
            quality: { 
              type: 'string', 
              default: 'high',
              enum: ['draft', 'normal', 'high', 'ultra'],
              description: 'Niveau de qualité de génération' 
            },
            safety_check: { 
              type: 'boolean', 
              default: true,
              description: 'Activer les vérifications de sécurité' 
            }
          }
        }
      },
      outputSchema: {
        image: { 
          type: 'string', 
          description: 'URL ou chemin vers l\'image générée' 
        },
        prompt_used: { 
          type: 'string', 
          description: 'Prompt utilisé pour la génération' 
        },
        reference_image: { 
          type: 'string', 
          description: 'Image de référence utilisée (si applicable)' 
        },
        parameters_used: { 
          type: 'object', 
          description: 'Paramètres effectivement utilisés' 
        },
        metadata: { 
          type: 'object', 
          description: 'Métadonnées de l\'image générée' 
        },
        processing_time: { 
          type: 'number', 
          description: 'Temps de traitement en secondes' 
        },
        generation_id: { 
          type: 'string', 
          description: 'Identifiant unique de la génération' 
        }
      },
      estimatedDuration: 45, // secondes
      costEstimate: 0.10 // USD
    };
  }
}

export default GenerateImageTask;