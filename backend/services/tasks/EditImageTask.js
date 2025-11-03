import { editImage, editSingleImage } from '../imageEditor.js';

/**
 * Service de tâche pour l'édition d'images
 * Modèle: qwen-image-edit-plus
 */
export class EditImageTask {
  constructor() {
    this.taskType = 'edit_image';
    this.modelName = 'qwen-image-edit-plus';
  }

  /**
   * Exécute la tâche d'édition d'image
   * @param {Object} inputs - Entrées de la tâche
   * @param {string} inputs.prompt - Description de l'édition à effectuer
   * @param {Array} inputs.images - Liste des images à éditer
   * @param {Object} [inputs.parameters] - Paramètres du modèle
   * @returns {Object} Résultats avec l'image éditée
   */
  async execute(inputs) {
    try {
      global.logWorkflow(`✂️ Édition d'image`, {
        model: this.modelName,
        prompt: inputs.prompt?.substring(0, 100) + '...',
        imageCount: inputs.images?.length || 0,
        parameters: inputs.parameters
      });

      // Validation des entrées
      const validation = this.validateInputs(inputs);
      if (!validation.isValid) {
        throw new Error(`Entrées invalides: ${validation.errors.join(', ')}`);
      }

      // Préparation des paramètres
      const editParams = {
        prompt: inputs.prompt,
        images: inputs.images,
        ...this.getDefaultParameters(),
        ...inputs.parameters
      };

      global.logWorkflow(`⚙️ Paramètres d'édition`, editParams);

      // Préparation des images pour l'API
      const processedImages = inputs.images.map(img => {
        if (typeof img === 'string') {
          return img; // URL ou data URI
        } else if (img && typeof img === 'object') {
          return img.url || img.buffer; // Objet avec URL ou buffer
        }
        return img;
      });

      // Appel du service d'édition d'images existant
      let result;
      
      if (processedImages.length === 1) {
        // Édition d'une seule image
        result = await editSingleImage({
          prompt: inputs.prompt,
          imageUrl: processedImages[0],
          aspectRatio: this.getAspectRatioFromStrength(editParams.strength),
          outputFormat: 'jpg'
        });
      } else {
        // Édition multiple
        result = await editImage({
          prompt: inputs.prompt,
          images: processedImages,
          aspectRatio: this.getAspectRatioFromStrength(editParams.strength),
          outputFormat: 'jpg'
        });
      }

      const editedImageUrl = result.imageUrls?.[0] || result.imageUrl || result;

      global.logWorkflow(`✅ Image(s) éditée(s) avec succès`, {
        editedImageUrl: typeof editedImageUrl === 'string' ? editedImageUrl.substring(0, 100) + '...' : 'Multiple images'
      });

      return {
        edited_image: editedImageUrl,
        edited_images: result.imageUrls || [editedImageUrl],
        prompt_used: inputs.prompt,
        original_images: inputs.images,
        parameters_used: editParams,
        metadata: {
          edit_type: this.determineEditType(inputs.prompt),
          strength: editParams.strength,
          guidance_scale: editParams.guidance_scale,
          model: this.modelName,
          image_count: inputs.images.length
        },
        processing_time: 0,
        edit_id: `edit_${Date.now()}`
      };

    } catch (error) {
      global.logWorkflow(`❌ Erreur lors de l'édition d'image`, {
        error: error.message,
        prompt: inputs.prompt,
        imageCount: inputs.images?.length || 0
      });

      throw error;
    }
  }

  /**
   * Détermine le type d'édition basé sur le prompt
   * @param {string} prompt - Prompt d'édition
   * @returns {string} Type d'édition détecté
   */
  determineEditType(prompt) {
    const lowerPrompt = prompt.toLowerCase();
    
    if (lowerPrompt.includes('couleur') || lowerPrompt.includes('color')) {
      return 'color_adjustment';
    } else if (lowerPrompt.includes('style') || lowerPrompt.includes('artistique')) {
      return 'style_transfer';
    } else if (lowerPrompt.includes('ajouter') || lowerPrompt.includes('add')) {
      return 'object_addition';
    } else if (lowerPrompt.includes('supprimer') || lowerPrompt.includes('remove')) {
      return 'object_removal';
    } else if (lowerPrompt.includes('améliorer') || lowerPrompt.includes('enhance')) {
      return 'enhancement';
    } else if (lowerPrompt.includes('transformer') || lowerPrompt.includes('transform')) {
      return 'transformation';
    } else {
      return 'general_edit';
    }
  }

  /**
   * Retourne les paramètres par défaut pour l'édition
   * @returns {Object} Paramètres par défaut
   */
  getDefaultParameters() {
    return {
      strength: 0.7,
      guidance_scale: 7.5,
      steps: 30,
      preserve_original: true,
      safety_check: true
    };
  }

  /**
   * Détermine l'aspect ratio basé sur la strength (pour compatibilité)
   * @param {number} strength - Force d'édition
   * @returns {string} Aspect ratio approprié
   */
  getAspectRatioFromStrength(strength) {
    // Pour l'édition, on préserve généralement l'aspect ratio original
    return 'match_input_image';
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
      errors.push('Le prompt d\'édition est requis');
    } else if (typeof inputs.prompt !== 'string') {
      errors.push('Le prompt doit être une chaîne de caractères');
    } else if (inputs.prompt.length < 3) {
      errors.push('Le prompt doit contenir au moins 3 caractères');
    } else if (inputs.prompt.length > 1000) {
      errors.push('Le prompt ne peut pas dépasser 1000 caractères');
    }

    // Validation des images
    if (!inputs.images) {
      errors.push('Les images à éditer sont requises');
    } else if (!Array.isArray(inputs.images)) {
      errors.push('Les images doivent être fournies sous forme de tableau');
    } else if (inputs.images.length === 0) {
      errors.push('Au moins une image doit être fournie');
    } else if (inputs.images.length > 5) {
      errors.push('Maximum 5 images par édition');
    } else {
      // Validation du format des images (URL, base64, ou objet avec buffer)
      for (let i = 0; i < inputs.images.length; i++) {
        const image = inputs.images[i];
        const isValidUrl = typeof image === 'string' && (image.startsWith('http') || image.startsWith('data:'));
        const isValidObject = image && typeof image === 'object' && (image.buffer || image.url);
        
        if (!isValidUrl && !isValidObject) {
          errors.push(`Image ${i + 1}: format invalide (doit être une URL, data URI, ou objet avec buffer/url)`);
        }
      }
    }

    // Validation des paramètres optionnels
    if (inputs.parameters) {
      const params = inputs.parameters;

      // Validation de la force d'édition
      if (params.strength && (params.strength < 0.1 || params.strength > 1.0)) {
        errors.push('La force d\'édition (strength) doit être entre 0.1 et 1.0');
      }

      // Validation du guidance_scale
      if (params.guidance_scale && (params.guidance_scale < 1 || params.guidance_scale > 20)) {
        errors.push('Le guidance_scale doit être entre 1 et 20');
      }

      // Validation des steps
      if (params.steps && (params.steps < 10 || params.steps > 100)) {
        errors.push('Le nombre de steps doit être entre 10 et 100');
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
      description: 'Édite des images en utilisant des instructions textuelles',
      inputSchema: {
        prompt: { 
          type: 'string', 
          required: true, 
          description: 'Description de l\'édition à effectuer',
          minLength: 3,
          maxLength: 1000
        },
        images: { 
          type: 'array', 
          required: true, 
          description: 'Liste des images à éditer',
          minItems: 1,
          maxItems: 5
        },
        parameters: {
          type: 'object',
          required: false,
          description: 'Paramètres d\'édition',
          properties: {
            strength: { 
              type: 'number', 
              default: 0.7, 
              minimum: 0.1, 
              maximum: 1.0,
              description: 'Force de l\'édition (0.1 = légère, 1.0 = forte)' 
            },
            guidance_scale: { 
              type: 'number', 
              default: 7.5, 
              minimum: 1, 
              maximum: 20,
              description: 'Force de guidance du prompt' 
            },
            steps: { 
              type: 'integer', 
              default: 30, 
              minimum: 10, 
              maximum: 100,
              description: 'Nombre d\'étapes d\'édition' 
            },
            preserve_original: { 
              type: 'boolean', 
              default: true,
              description: 'Préserver les caractéristiques originales' 
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
        edited_image: { 
          type: 'string', 
          description: 'URL de l\'image principale éditée' 
        },
        edited_images: { 
          type: 'array', 
          description: 'Liste de toutes les images éditées' 
        },
        prompt_used: { 
          type: 'string', 
          description: 'Prompt utilisé pour l\'édition' 
        },
        original_images: { 
          type: 'array', 
          description: 'Images originales fournies' 
        },
        parameters_used: { 
          type: 'object', 
          description: 'Paramètres effectivement utilisés' 
        },
        metadata: { 
          type: 'object', 
          description: 'Métadonnées de l\'édition' 
        },
        processing_time: { 
          type: 'number', 
          description: 'Temps de traitement en secondes' 
        },
        edit_id: { 
          type: 'string', 
          description: 'Identifiant unique de l\'édition' 
        }
      },
      estimatedDuration: 25, // secondes
      costEstimate: 0.08 // USD
    };
  }
}

export default EditImageTask;