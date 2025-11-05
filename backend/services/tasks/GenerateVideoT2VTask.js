import { generateVideoT2V } from '../videoGenerator.js';

/**
 * Service de tâche pour la génération de vidéo text-to-video
 * Modèle: wan-2.2-t2v-fast
 */
export class GenerateVideoT2VTask {
  constructor() {
    this.taskType = 'generate_video_t2v';
    this.modelName = 'wan-2.2-t2v-fast';
  }

  /**
   * Exécute la tâche de génération de vidéo text-to-video
   * @param {Object} inputs - Entrées de la tâche
   * @param {string} inputs.prompt - Description de la vidéo à générer
   * @param {number} [inputs.numFrames] - Nombre de frames
   * @param {string} [inputs.aspectRatio] - Format vidéo (16:9 ou 9:16)
   * @param {string} [inputs.loraWeightsTransformer] - URL LoRA transformer
   * @param {number} [inputs.loraScaleTransformer] - Scale LoRA transformer
   * @param {string} [inputs.loraWeightsTransformer2] - URL LoRA transformer 2
   * @param {number} [inputs.loraScaleTransformer2] - Scale LoRA transformer 2
   * @param {Object} [inputs.parameters] - Paramètres du modèle
   * @returns {Object} Résultats avec la vidéo générée
   */
  async execute(inputs) {
    try {
      // Récupérer les paramètres LoRA depuis inputs directement (pas depuis inputs.parameters)
      const loraWeightsTransformer = inputs.loraWeightsTransformer || null;
      const loraScaleTransformer = inputs.loraScaleTransformer ?? 1.0;
      const loraWeightsTransformer2 = inputs.loraWeightsTransformer2 || null;
      const loraScaleTransformer2 = inputs.loraScaleTransformer2 ?? 1.0;
      
      global.logWorkflow(`🎬 Génération vidéo T2V`, {
        model: this.modelName,
        prompt: inputs.prompt?.substring(0, 100) + '...',
        numFrames: inputs.numFrames,
        aspectRatio: inputs.aspectRatio || '16:9',
        loraWeightsTransformer: loraWeightsTransformer ? loraWeightsTransformer.substring(0, 60) + '...' : 'none',
        loraScaleTransformer,
        loraWeightsTransformer2: loraWeightsTransformer2 ? loraWeightsTransformer2.substring(0, 60) + '...' : 'none',
        loraScaleTransformer2,
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
        numFrames: inputs.numFrames || 81,
        aspectRatio: inputs.aspectRatio || '16:9',
        loraWeightsTransformer,
        loraScaleTransformer,
        loraWeightsTransformer2,
        loraScaleTransformer2,
        ...this.getDefaultParameters(),
        ...inputs.parameters
      };

      global.logWorkflow(`⚙️ Paramètres de génération vidéo T2V`, {
        ...generationParams,
        loraWeightsTransformer: loraWeightsTransformer ? loraWeightsTransformer.substring(0, 60) + '...' : 'none',
        loraWeightsTransformer2: loraWeightsTransformer2 ? loraWeightsTransformer2.substring(0, 60) + '...' : 'none'
      });

      // Appel du service de génération vidéo existant
      const result = await generateVideoT2V({
        prompt: inputs.prompt,
        numFrames: generationParams.numFrames,
        aspectRatio: generationParams.aspectRatio,
        loraWeightsTransformer,
        loraScaleTransformer,
        loraWeightsTransformer2,
        loraScaleTransformer2
      });

      global.logWorkflow(`✅ Vidéo T2V générée avec succès`, {
        videoUrl: result.videoUrl?.substring(0, 100) + '...',
        numFrames: generationParams.numFrames,
        hasLoRA: !!(loraWeightsTransformer || loraWeightsTransformer2),
        processingTime: result.processingTime
      });

      // La vidéo a déjà été téléchargée et sauvegardée par videoGenerator.js
      // result.videoUrl contient maintenant l'URL locale /medias/...
      
      // Extraire le nom de fichier depuis l'URL locale
      const filename = result.videoUrl.split('/').pop();

      return {
        video: result.videoUrl, // URL locale /medias/...
        video_filename: filename,
        prompt_used: inputs.prompt,
        parameters_used: {
          numFrames: generationParams.numFrames,
          loraWeightsTransformer,
          loraScaleTransformer,
          loraWeightsTransformer2,
          loraScaleTransformer2
        },
        metadata: {
          numFrames: generationParams.numFrames,
          aspectRatio: generationParams.aspectRatio,
          duration: result.params?.duration,
          fps: result.params?.finalFps,
          resolution: result.params?.resolution,
          model: this.modelName,
          generation_type: 'text_to_video',
          lora_applied: !!(loraWeightsTransformer || loraWeightsTransformer2)
        },
        processing_time: result.processingTime || 0,
        video_id: result.id || `t2v_${Date.now()}`,
        frames_generated: generationParams.numFrames
      };

    } catch (error) {
      global.logWorkflow(`❌ Erreur lors de la génération vidéo T2V`, {
        error: error.message,
        prompt: inputs.prompt
      });

      throw error;
    }
  }

  /**
   * Estime la taille du fichier vidéo
   * @param {Object} params - Paramètres de génération
   * @returns {string} Taille estimée formatée
   */
  estimateFileSize(params) {
    // Estimation basique : résolution × fps × durée × facteur de compression
    const pixels = params.width * params.height;
    const totalFrames = params.duration * params.fps;
    const qualityMultiplier = this.getQualityMultiplier(params.quality);
    
    // Estimation en bytes (très approximative)
    const estimatedBytes = pixels * totalFrames * 0.1 * qualityMultiplier;
    
    if (estimatedBytes > 1024 * 1024) {
      return `${Math.round(estimatedBytes / (1024 * 1024))} MB`;
    } else {
      return `${Math.round(estimatedBytes / 1024)} KB`;
    }
  }

  /**
   * Retourne le multiplicateur de qualité pour l'estimation de taille
   * @param {string} quality - Niveau de qualité
   * @returns {number} Multiplicateur
   */
  getQualityMultiplier(quality) {
    const multipliers = {
      'draft': 0.5,
      'normal': 1.0,
      'high': 2.0,
      'ultra': 3.5
    };
    return multipliers[quality] || 1.0;
  }

  /**
   * Retourne les paramètres par défaut pour la génération vidéo T2V
   * @returns {Object} Paramètres par défaut
   */
  getDefaultParameters() {
    return {
      duration: 5,
      fps: 24,
      width: 1024,
      height: 576,
      style: 'réaliste',
      quality: 'high',
      camera_movement: 'stable',
      motion_intensity: 'medium',
      coherence: 'high',
      creativity: 'medium'
    };
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
      errors.push('Le prompt de vidéo est requis');
    } else if (typeof inputs.prompt !== 'string') {
      errors.push('Le prompt doit être une chaîne de caractères');
    } else if (inputs.prompt.length < 5) {
      errors.push('Le prompt doit contenir au moins 5 caractères');
    } else if (inputs.prompt.length > 2000) {
      errors.push('Le prompt ne peut pas dépasser 2000 caractères');
    }

    // Validation du numFrames
    if (inputs.numFrames !== undefined && inputs.numFrames !== null) {
      const validFrames = [81, 121];
      if (!validFrames.includes(inputs.numFrames)) {
        errors.push('numFrames doit être 81 ou 121');
      }
    }

    // Validation de l'aspect ratio
    if (inputs.aspectRatio !== undefined && inputs.aspectRatio !== null) {
      const validRatios = ['16:9', '9:16'];
      if (!validRatios.includes(inputs.aspectRatio)) {
        errors.push('aspectRatio doit être "16:9" ou "9:16"');
      }
    }

    // Validation des paramètres LoRA
    if (inputs.loraWeightsTransformer && typeof inputs.loraWeightsTransformer !== 'string') {
      errors.push('loraWeightsTransformer doit être une URL (chaîne de caractères)');
    }
    
    if (inputs.loraScaleTransformer !== undefined && inputs.loraScaleTransformer !== null) {
      const scale = parseFloat(inputs.loraScaleTransformer);
      if (isNaN(scale) || scale < 0 || scale > 2) {
        errors.push('loraScaleTransformer doit être entre 0 et 2');
      }
    }
    
    if (inputs.loraWeightsTransformer2 && typeof inputs.loraWeightsTransformer2 !== 'string') {
      errors.push('loraWeightsTransformer2 doit être une URL (chaîne de caractères)');
    }
    
    if (inputs.loraScaleTransformer2 !== undefined && inputs.loraScaleTransformer2 !== null) {
      const scale = parseFloat(inputs.loraScaleTransformer2);
      if (isNaN(scale) || scale < 0 || scale > 2) {
        errors.push('loraScaleTransformer2 doit être entre 0 et 2');
      }
    }

    // Validation des paramètres optionnels (anciens paramètres conservés pour compatibilité)
    if (inputs.parameters) {
      const params = inputs.parameters;

      // Validation de la durée
      if (params.duration && (params.duration < 1 || params.duration > 60)) {
        errors.push('La durée doit être entre 1 et 60 secondes');
      }

      // Validation du FPS
      const validFps = [12, 24, 30, 60];
      if (params.fps && !validFps.includes(params.fps)) {
        errors.push(`FPS invalide. Valeurs supportées: ${validFps.join(', ')}`);
      }

      // Validation des dimensions
      if (params.width && (params.width < 256 || params.width > 1920)) {
        errors.push('La largeur doit être entre 256 et 1920 pixels');
      }
      if (params.height && (params.height < 256 || params.height > 1080)) {
        errors.push('La hauteur doit être entre 256 et 1080 pixels');
      }

      // Validation de la qualité
      const validQualities = ['draft', 'normal', 'high', 'ultra'];
      if (params.quality && !validQualities.includes(params.quality)) {
        errors.push(`Qualité invalide. Qualités disponibles: ${validQualities.join(', ')}`);
      }

      // Validation du style
      const validStyles = ['réaliste', 'artistique', 'anime', 'cinématographique', 'documentaire', 'fantastique'];
      if (params.style && !validStyles.includes(params.style)) {
        errors.push(`Style invalide. Styles disponibles: ${validStyles.join(', ')}`);
      }

      // Validation du mouvement de caméra
      const validCameraMovements = ['stable', 'pan_left', 'pan_right', 'zoom_in', 'zoom_out', 'tracking', 'dynamic'];
      if (params.camera_movement && !validCameraMovements.includes(params.camera_movement)) {
        errors.push(`Mouvement de caméra invalide. Options: ${validCameraMovements.join(', ')}`);
      }

      // Validation de l'intensité de mouvement
      const validMotionIntensities = ['low', 'medium', 'high', 'extreme'];
      if (params.motion_intensity && !validMotionIntensities.includes(params.motion_intensity)) {
        errors.push(`Intensité de mouvement invalide. Options: ${validMotionIntensities.join(', ')}`);
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
      description: 'Génère des vidéos complètes à partir de descriptions textuelles',
      inputSchema: {
        prompt: { 
          type: 'string', 
          required: true, 
          description: 'Description détaillée de la vidéo à générer',
          minLength: 5,
          maxLength: 2000
        },
        numFrames: {
          type: 'integer',
          required: false,
          enum: [81, 121],
          default: 81,
          description: 'Nombre de frames à générer (81 = ~3-5s, 121 = ~5-8s)'
        },
        aspectRatio: {
          type: 'string',
          required: false,
          enum: ['16:9', '9:16'],
          default: '16:9',
          description: 'Format de la vidéo (16:9 = paysage, 9:16 = portrait)'
        },
        loraWeightsTransformer: {
          type: 'string',
          required: false,
          description: 'URL du modèle LoRA transformer (premier LoRA)'
        },
        loraScaleTransformer: {
          type: 'number',
          required: false,
          minimum: 0,
          maximum: 2,
          default: 1.0,
          description: 'Poids du premier LoRA (0-2, où 1.0 est l\'intensité normale)'
        },
        loraWeightsTransformer2: {
          type: 'string',
          required: false,
          description: 'URL du modèle LoRA transformer 2 (second LoRA)'
        },
        loraScaleTransformer2: {
          type: 'number',
          required: false,
          minimum: 0,
          maximum: 2,
          default: 1.0,
          description: 'Poids du second LoRA (0-2, où 1.0 est l\'intensité normale)'
        },
        parameters: {
          type: 'object',
          required: false,
          description: 'Paramètres de génération vidéo',
          properties: {
            duration: { 
              type: 'number', 
              default: 5, 
              minimum: 1, 
              maximum: 60,
              description: 'Durée de la vidéo en secondes' 
            },
            fps: { 
              type: 'integer', 
              default: 24, 
              enum: [12, 24, 30, 60],
              description: 'Images par seconde' 
            },
            width: { 
              type: 'integer', 
              default: 1024, 
              minimum: 256, 
              maximum: 1920,
              description: 'Largeur de la vidéo en pixels' 
            },
            height: { 
              type: 'integer', 
              default: 576, 
              minimum: 256, 
              maximum: 1080,
              description: 'Hauteur de la vidéo en pixels' 
            },
            style: { 
              type: 'string', 
              default: 'réaliste',
              enum: ['réaliste', 'artistique', 'anime', 'cinématographique', 'documentaire', 'fantastique'],
              description: 'Style visuel de la vidéo' 
            },
            quality: { 
              type: 'string', 
              default: 'high',
              enum: ['draft', 'normal', 'high', 'ultra'],
              description: 'Niveau de qualité de génération' 
            },
            camera_movement: { 
              type: 'string', 
              default: 'stable',
              enum: ['stable', 'pan_left', 'pan_right', 'zoom_in', 'zoom_out', 'tracking', 'dynamic'],
              description: 'Type de mouvement de caméra' 
            },
            motion_intensity: { 
              type: 'string', 
              default: 'medium',
              enum: ['low', 'medium', 'high', 'extreme'],
              description: 'Intensité générale du mouvement' 
            },
            coherence: { 
              type: 'string', 
              default: 'high',
              enum: ['low', 'medium', 'high'],
              description: 'Cohérence temporelle entre les frames' 
            },
            creativity: { 
              type: 'string', 
              default: 'medium',
              enum: ['low', 'medium', 'high'],
              description: 'Niveau de créativité et d\'innovation' 
            }
          }
        }
      },
      outputSchema: {
        video: { 
          type: 'string', 
          description: 'URL ou chemin vers la vidéo générée' 
        },
        prompt_used: { 
          type: 'string', 
          description: 'Prompt utilisé pour la génération' 
        },
        parameters_used: { 
          type: 'object', 
          description: 'Paramètres effectivement utilisés' 
        },
        metadata: { 
          type: 'object', 
          description: 'Métadonnées détaillées de la vidéo' 
        },
        processing_time: { 
          type: 'number', 
          description: 'Temps de traitement en secondes' 
        },
        video_id: { 
          type: 'string', 
          description: 'Identifiant unique de la génération' 
        },
        frames_generated: { 
          type: 'integer', 
          description: 'Nombre total de frames générées' 
        },
        estimated_file_size: { 
          type: 'string', 
          description: 'Taille estimée du fichier vidéo' 
        }
      },
      estimatedDuration: 90, // secondes
      costEstimate: 0.35 // USD
    };
  }
}

export default GenerateVideoT2VTask;