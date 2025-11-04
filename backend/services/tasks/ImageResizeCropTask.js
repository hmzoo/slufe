import { resizeCropImage } from '../imageResizeCrop.js';

/**
 * Service de tâche pour le redimensionnement et recadrage d'images
 * Modèle: Local (Sharp)
 */
export class ImageResizeCropTask {
  constructor() {
    this.taskType = 'image_resize_crop';
    this.modelName = 'Sharp';
  }

  /**
   * Exécute la tâche de redimensionnement/recadrage
   * @param {Object} inputs - Entrées de la tâche
   * @param {string|Buffer} inputs.image - Image à traiter
   * @param {number} [inputs.h_max=1024] - Largeur maximale
   * @param {number} [inputs.v_max=1024] - Hauteur maximale
   * @param {string} [inputs.ratio="keep"] - Ratio cible
   * @param {string} [inputs.crop_center="center"] - Position de recadrage
   * @returns {Object} Résultats avec l'image traitée
   */
  async execute(inputs) {
    try {
      global.logWorkflow(`🔧 Redimensionnement/recadrage d'image`, {
        h_max: inputs.h_max || 1024,
        v_max: inputs.v_max || 1024,
        ratio: inputs.ratio || 'keep',
        crop_center: inputs.crop_center || 'center',
        hasImage: !!inputs.image
      });

      // Validation des entrées
      const validation = this.validateInputs(inputs);
      if (!validation.isValid) {
        throw new Error(`Entrées invalides: ${validation.errors.join(', ')}`);
      }

      // Gérer les références aux fichiers de la galerie
      let processedImage = inputs.image;
      
      // Si c'est un nom de fichier (string), le convertir en URL complète
      if (typeof inputs.image === 'string' && !inputs.image.startsWith('http')) {
        // Construire l'URL complète du fichier
        const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
        const host = process.env.HOST || 'localhost';
        const port = process.env.PORT || 3000;
        const baseUrl = process.env.NODE_ENV === 'production' 
          ? `${protocol}://${host}` 
          : `${protocol}://${host}:${port}`;
        
        processedImage = `${baseUrl}/medias/${inputs.image}`;
        
        global.logWorkflow(`🔗 Conversion nom de fichier en URL`, {
          filename: inputs.image,
          url: processedImage
        });
      }
      
      // Si c'est un objet indiquant un fichier de galerie, le convertir en URL
      else if (inputs.image && typeof inputs.image === 'object' && inputs.image.type === 'gallery_file') {
        // Construire l'URL complète du fichier
        const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
        const host = process.env.HOST || 'localhost';
        const port = process.env.PORT || 3000;
        const baseUrl = process.env.NODE_ENV === 'production' 
          ? `${protocol}://${host}` 
          : `${protocol}://${host}:${port}`;
        
        processedImage = `${baseUrl}/medias/${inputs.image.filename}`;
        
        global.logWorkflow(`🔗 Conversion objet galerie en URL`, {
          filename: inputs.image.filename,
          url: processedImage
        });
      }

      // Préparation des paramètres avec valeurs par défaut
      const params = {
        image: processedImage,
        h_max: inputs.h_max || 1024,
        v_max: inputs.v_max || 1024,
        ratio: inputs.ratio || 'keep',
        crop_center: inputs.crop_center || 'center'
      };

      // Exécution du redimensionnement/recadrage
      const result = await resizeCropImage(params);

      global.logWorkflow(`✅ Redimensionnement/recadrage terminé`, {
        originalSize: `${result.original_dimensions.width}x${result.original_dimensions.height}`,
        finalSize: `${result.final_dimensions.width}x${result.final_dimensions.height}`,
        operations: result.applied_operations,
        outputFile: result.file_info.filename
      });

      // Debug: Log exact return format
      global.logWorkflow(`🔍 Format de retour exact`, {
        hasImage: !!result.image,
        hasEditedImage: !!result.edited_image,
        hasImageUrl: !!result.image_url,
        imageValue: result.image,
        editedImageValue: result.edited_image,
        imageUrlValue: result.image_url
      });

      return {
        // Format attendu par le frontend pour l'affichage
        image: result.image_url,           // Image générée/modifiée
        edited_image: result.image_url,    // Fallback pour compatibilité
        
        // Métadonnées détaillées
        image_url: result.image_url,
        image_path: result.image_path,
        original_dimensions: result.original_dimensions,
        final_dimensions: result.final_dimensions,
        applied_operations: result.applied_operations,
        file_info: result.file_info,
        success: true
      };

    } catch (error) {
      global.logWorkflow(`❌ Erreur lors du redimensionnement/recadrage`, {
        error: error.message,
        inputs: {
          h_max: inputs.h_max,
          v_max: inputs.v_max,
          ratio: inputs.ratio,
          crop_center: inputs.crop_center
        }
      });

      throw error;
    }
  }

  /**
   * Valide les entrées de la tâche
   * @param {Object} inputs - Entrées à valider
   * @returns {Object} { isValid, errors }
   */
  validateInputs(inputs) {
    const errors = [];

    // Validation de l'image
    if (!inputs.image) {
      errors.push('Image requise');
    }

    // Validation h_max
    if (inputs.h_max !== undefined) {
      if (typeof inputs.h_max !== 'number' || inputs.h_max <= 0 || inputs.h_max > 4096) {
        errors.push('h_max doit être un nombre entre 1 et 4096');
      }
    }

    // Validation v_max
    if (inputs.v_max !== undefined) {
      if (typeof inputs.v_max !== 'number' || inputs.v_max <= 0 || inputs.v_max > 4096) {
        errors.push('v_max doit être un nombre entre 1 et 4096');
      }
    }

    // Validation ratio
    const validRatios = ['keep', '1:1', '16:9', '9:16', '4:3', '3:4', '3:2', '2:3'];
    if (inputs.ratio && !validRatios.includes(inputs.ratio)) {
      errors.push(`Ratio invalide. Valeurs acceptées: ${validRatios.join(', ')}`);
    }

    // Validation crop_center
    const validCropPositions = ['center', 'top', 'bottom', 'head'];
    if (inputs.crop_center && !validCropPositions.includes(inputs.crop_center)) {
      errors.push(`Position de recadrage invalide. Valeurs acceptées: ${validCropPositions.join(', ')}`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Retourne les paramètres par défaut pour cette tâche
   * @returns {Object} Paramètres par défaut
   */
  getDefaultParameters() {
    return {
      h_max: 1024,
      v_max: 1024,
      ratio: 'keep',
      crop_center: 'center'
    };
  }

  /**
   * Retourne les paramètres d'entrée supportés
   * @returns {Object} Description des paramètres d'entrée
   */
  getInputSchema() {
    return {
      image: {
        type: 'image',
        required: true,
        description: 'Image à redimensionner et/ou recadrer'
      },
      h_max: {
        type: 'number',
        required: false,
        default: 1024,
        min: 1,
        max: 4096,
        description: 'Largeur maximale en pixels'
      },
      v_max: {
        type: 'number',
        required: false,
        default: 1024,
        min: 1,
        max: 4096,
        description: 'Hauteur maximale en pixels'
      },
      ratio: {
        type: 'select',
        required: false,
        default: 'keep',
        options: ['keep', '1:1', '16:9', '9:16', '4:3', '3:4', '3:2', '2:3'],
        description: 'Ratio d\'aspect cible (keep = conserver le ratio original)'
      },
      crop_center: {
        type: 'select',
        required: false,
        default: 'center',
        options: ['center', 'top', 'bottom', 'head'],
        description: 'Position du recadrage si nécessaire'
      }
    };
  }

  /**
   * Retourne la description de la sortie
   * @returns {Object} Description de la sortie
   */
  getOutputSchema() {
    return {
      image_url: {
        type: 'image_url',
        description: 'URL de l\'image redimensionnée/recadrée'
      },
      original_dimensions: {
        type: 'object',
        description: 'Dimensions originales (width, height)'
      },
      final_dimensions: {
        type: 'object',
        description: 'Dimensions finales (width, height)'
      },
      applied_operations: {
        type: 'object',
        description: 'Opérations appliquées (resized, cropped, etc.)'
      }
    };
  }
}