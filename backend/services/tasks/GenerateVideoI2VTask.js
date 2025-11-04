import { generateVideoI2V } from '../videoImageGenerator.js';
import { saveMediaFile, getFileExtension } from '../../utils/fileUtils.js';

/**
 * Service de tâche pour la génération de vidéo à partir d'image
 * Modèle: wan-2.2-i2v-fast
 */
export class GenerateVideoI2VTask {
  constructor() {
    this.taskType = 'generate_video_i2v';
    this.modelName = 'wan-2.2-i2v-fast';
  }

  /**
   * Exécute la tâche de génération de vidéo image-to-video
   * @param {Object} inputs - Entrées de la tâche
   * @param {string} inputs.prompt - Description du mouvement/animation souhaitée
   * @param {string} inputs.image - Image source pour la génération vidéo
   * @param {Object} [inputs.parameters] - Paramètres du modèle
   * @returns {Object} Résultats avec la vidéo générée
   */
  async execute(inputs) {
    try {
      // Normaliser l'image : si c'est un array, prendre le premier élément
      if (Array.isArray(inputs.image) && inputs.image.length > 0) {
        global.logWorkflow(`📎 Normalisation image: array → premier élément`, {
          arrayLength: inputs.image.length
        });
        inputs.image = inputs.image[0];
      }

      global.logWorkflow(`🎞️ Génération vidéo I2V`, {
        model: this.modelName,
        prompt: inputs.prompt?.substring(0, 100) + '...',
        hasSourceImage: !!inputs.image,
        hasLastImage: !!inputs.lastImage,
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
        firstFrame: inputs.image,
        ...this.getDefaultParameters(),
        ...inputs.parameters,
        // Paramètres LoRA venant directement des inputs
        loraWeightsTransformer: inputs.loraWeightsTransformer || inputs.parameters?.loraWeightsTransformer,
        loraScaleTransformer: inputs.loraScaleTransformer ?? inputs.parameters?.loraScaleTransformer ?? 1.0,
        loraWeightsTransformer2: inputs.loraWeightsTransformer2 || inputs.parameters?.loraWeightsTransformer2,
        loraScaleTransformer2: inputs.loraScaleTransformer2 ?? inputs.parameters?.loraScaleTransformer2 ?? 1.0,
      };

      global.logWorkflow(`⚙️ Paramètres de génération vidéo`, generationParams);

      // Appel du service de génération vidéo existant
      // Note: Le service attend "image" (sera converti en buffer si nécessaire)
      // puis utilisé comme "startImage" pour Replicate
      
      // numFrames: 81 (rapide) ou 121 (long) - défaut 81
      const numFrames = generationParams.numFrames || 81;
      const aspectRatio = inputs.aspectRatio || generationParams.aspectRatio || '16:9';
      
      const result = await generateVideoFromImage({
        image: inputs.image, // Buffer ou URL - sera converti automatiquement
        lastImage: inputs.lastImage, // Image de fin optionnelle pour transition fluide
        prompt: inputs.prompt,
        numFrames: numFrames,
        aspectRatio: aspectRatio,
        framesPerSecond: generationParams.fps,
        // Paramètres LoRA (optionnels)
        loraWeightsTransformer: generationParams.loraWeightsTransformer,
        loraScaleTransformer: generationParams.loraScaleTransformer,
        loraWeightsTransformer2: generationParams.loraWeightsTransformer2,
        loraScaleTransformer2: generationParams.loraScaleTransformer2,
      });

      const videoUrl = result.videoUrl || result;

      global.logWorkflow(`✅ Vidéo générée avec succès`, {
        videoUrl: typeof videoUrl === 'string' ? videoUrl.substring(0, 100) + '...' : 'Video generated',
        duration: generationParams.duration,
        resolution: `${generationParams.width}x${generationParams.height}`
      });

      // Télécharger et sauvegarder la vidéo localement
      global.logWorkflow(`📥 Téléchargement de la vidéo générée...`);
      
      const response = await fetch(videoUrl);
      if (!response.ok) {
        throw new Error(`Erreur téléchargement vidéo: ${response.status} ${response.statusText}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const extension = getFileExtension(response.headers.get('content-type') || 'video/mp4');
      const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}.${extension}`;
      const savedFile = saveMediaFile(filename, buffer);
      
      global.logWorkflow(`💾 Vidéo sauvegardée localement`, {
        filename: savedFile.filename,
        url: savedFile.url,
        size: `${Math.round(buffer.length / 1024 / 1024)}MB`
      });

      return {
        video: savedFile.url,
        video_filename: savedFile.filename,
        external_url: videoUrl, // Garder l'URL originale pour référence
        prompt_used: inputs.prompt,
        source_image: inputs.image,
        last_image: inputs.lastImage,
        parameters_used: generationParams,
        metadata: {
          duration: generationParams.duration,
          fps: generationParams.fps,
          width: generationParams.width,
          height: generationParams.height,
          resolution: `${generationParams.width}x${generationParams.height}`,
          motion_strength: generationParams.motion_strength,
          model: this.modelName,
          generation_type: 'image_to_video'
        },
        processing_time: 0,
        video_id: `i2v_${Date.now()}`,
        frames_generated: Math.floor(generationParams.duration * generationParams.fps)
      };

    } catch (error) {
      global.logWorkflow(`❌ Erreur lors de la génération vidéo I2V`, {
        error: error.message,
        prompt: inputs.prompt,
        hasImage: !!inputs.image
      });

      throw error;
    }
  }

  /**
   * Retourne les paramètres par défaut pour la génération vidéo I2V
   * @returns {Object} Paramètres par défaut
   */
  getDefaultParameters() {
    return {
      numFrames: 81, // 81 = rapide, 121 = long
      fps: 24,
      width: 1024,
      height: 576,
      motion_strength: 0.7,
      style: 'réaliste',
      quality: 'high',
      loop: false,
      stability: 'medium'
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
      errors.push('Le prompt de mouvement est requis');
    } else if (typeof inputs.prompt !== 'string') {
      errors.push('Le prompt doit être une chaîne de caractères');
    } else if (inputs.prompt.length < 3) {
      errors.push('Le prompt doit contenir au moins 3 caractères');
    } else if (inputs.prompt.length > 1000) {
      errors.push('Le prompt ne peut pas dépasser 1000 caractères');
    }

    // Validation de l'image source
    if (!inputs.image) {
      errors.push('L\'image source est requise pour la génération I2V');
    } else if (Array.isArray(inputs.image)) {
      // Si c'est encore un array à ce stade, c'est qu'il est vide
      errors.push('L\'image source est requise (tableau vide reçu)');
    } else if (typeof inputs.image !== 'string' && (!inputs.image.buffer || !Buffer.isBuffer(inputs.image.buffer))) {
      // Accepter string (URL) OU objet buffer {buffer, mimeType, ...}
      errors.push('L\'image source doit être une URL, un chemin ou un buffer d\'image');
    }

    // Validation du format vidéo (niveau inputs)
    if (inputs.aspectRatio !== undefined && inputs.aspectRatio !== null) {
      const validRatios = ['16:9', '9:16'];
      if (!validRatios.includes(inputs.aspectRatio)) {
        errors.push('aspectRatio doit être "16:9" ou "9:16"');
      }
    }

    // Validation des paramètres optionnels
    if (inputs.parameters) {
      const params = inputs.parameters;

      // Validation du nombre d'images
      if (params.numFrames && params.numFrames !== 81 && params.numFrames !== 121) {
        errors.push('numFrames doit être 81 (rapide) ou 121 (long)');
      }

      // Validation du format vidéo
      if (params.aspectRatio && !['16:9', '9:16'].includes(params.aspectRatio)) {
        errors.push('aspectRatio doit être "16:9" ou "9:16"');
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

      // Validation de la force de mouvement
      if (params.motion_strength && (params.motion_strength < 0.1 || params.motion_strength > 1.0)) {
        errors.push('La force de mouvement doit être entre 0.1 et 1.0');
      }

      // Validation de la qualité
      const validQualities = ['draft', 'normal', 'high', 'ultra'];
      if (params.quality && !validQualities.includes(params.quality)) {
        errors.push(`Qualité invalide. Qualités disponibles: ${validQualities.join(', ')}`);
      }

      // Validation du style
      const validStyles = ['réaliste', 'artistique', 'anime', 'cinématographique', 'documentaire'];
      if (params.style && !validStyles.includes(params.style)) {
        errors.push(`Style invalide. Styles disponibles: ${validStyles.join(', ')}`);
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
      description: 'Génère des vidéos animées à partir d\'images statiques',
      inputSchema: {
        prompt: { 
          type: 'string', 
          required: true, 
          description: 'Description du mouvement/animation souhaité',
          minLength: 3,
          maxLength: 1000
        },
        image: { 
          type: 'string', 
          required: true, 
          description: 'URL ou chemin vers l\'image source' 
        },
        parameters: {
          type: 'object',
          required: false,
          description: 'Paramètres de génération vidéo',
          properties: {
            numFrames: { 
              type: 'integer', 
              default: 81, 
              enum: [81, 121],
              description: 'Nombre d\'images (81 = rapide ~3-5s, 121 = long ~5-8s)' 
            },
            aspectRatio: {
              type: 'string',
              default: '16:9',
              enum: ['16:9', '9:16'],
              description: 'Format de la vidéo (16:9 = paysage, 9:16 = portrait)'
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
            motion_strength: { 
              type: 'number', 
              default: 0.7, 
              minimum: 0.1, 
              maximum: 1.0,
              description: 'Intensité du mouvement (0.1 = léger, 1.0 = intense)' 
            },
            style: { 
              type: 'string', 
              default: 'réaliste',
              enum: ['réaliste', 'artistique', 'anime', 'cinématographique', 'documentaire'],
              description: 'Style visuel de la vidéo' 
            },
            quality: { 
              type: 'string', 
              default: 'high',
              enum: ['draft', 'normal', 'high', 'ultra'],
              description: 'Niveau de qualité de génération' 
            },
            loop: { 
              type: 'boolean', 
              default: false,
              description: 'Créer une vidéo en boucle' 
            },
            stability: { 
              type: 'string', 
              default: 'medium',
              enum: ['low', 'medium', 'high'],
              description: 'Niveau de stabilité temporelle' 
            },
            loraWeightsTransformer: {
              type: 'string',
              required: false,
              description: 'URL du modèle LoRA transformer (ex: https://replicate.delivery/...)'
            },
            loraScaleTransformer: {
              type: 'number',
              default: 1.0,
              minimum: 0.0,
              maximum: 2.0,
              description: 'Poids du LoRA transformer (0.0-2.0, défaut 1.0)'
            },
            loraWeightsTransformer2: {
              type: 'string',
              required: false,
              description: 'URL du second modèle LoRA transformer (optionnel)'
            },
            loraScaleTransformer2: {
              type: 'number',
              default: 1.0,
              minimum: 0.0,
              maximum: 2.0,
              description: 'Poids du second LoRA transformer (0.0-2.0, défaut 1.0)'
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
        source_image: { 
          type: 'string', 
          description: 'Image source utilisée' 
        },
        parameters_used: { 
          type: 'object', 
          description: 'Paramètres effectivement utilisés' 
        },
        metadata: { 
          type: 'object', 
          description: 'Métadonnées de la vidéo générée' 
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
        }
      },
      estimatedDuration: 60, // secondes
      costEstimate: 0.25 // USD
    };
  }
}

export default GenerateVideoI2VTask;