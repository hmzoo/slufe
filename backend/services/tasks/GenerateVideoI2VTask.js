import { generateVideoI2V } from '../videoImageGenerator.js';

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
      // Normaliser les noms de champs (snake_case → camelCase pour rétro-compatibilité)
      if (inputs.num_frames !== undefined) inputs.numFrames = inputs.num_frames;
      if (inputs.aspect_ratio !== undefined) inputs.aspectRatio = inputs.aspect_ratio;
      if (inputs.last_image !== undefined) inputs.lastImage = inputs.last_image;
      if (inputs.lora_weights_transformer !== undefined) inputs.loraWeightsTransformer = inputs.lora_weights_transformer;
      if (inputs.lora_scale_transformer !== undefined) inputs.loraScaleTransformer = inputs.lora_scale_transformer;
      if (inputs.lora_weights_transformer2 !== undefined) inputs.loraWeightsTransformer2 = inputs.lora_weights_transformer2;
      if (inputs.lora_scale_transformer2 !== undefined) inputs.loraScaleTransformer2 = inputs.lora_scale_transformer2;
      if (inputs.frames_per_second !== undefined) inputs.framesPerSecond = inputs.frames_per_second;
      if (inputs.interpolate_output !== undefined) inputs.interpolateOutput = inputs.interpolate_output;
      if (inputs.go_fast !== undefined) inputs.goFast = inputs.go_fast;
      if (inputs.sample_shift !== undefined) inputs.sampleShift = inputs.sample_shift;
      if (inputs.disable_safety_checker !== undefined) inputs.disableSafetyChecker = inputs.disable_safety_checker;
      
      // Normaliser les images : nouveau format avec image1, image2, image3
      // Pour I2V, on ne prend que la première image
      let sourceImage = null;
      
      // Collecter image1, image2, image3 et prendre la première disponible
      if (inputs.image1) {
        const normalized1 = this.normalizeImageInput(inputs.image1);
        if (normalized1.length > 0) {
          sourceImage = normalized1[0];
        }
      }
      if (!sourceImage && inputs.image2) {
        const normalized2 = this.normalizeImageInput(inputs.image2);
        if (normalized2.length > 0) {
          sourceImage = normalized2[0];
        }
      }
      if (!sourceImage && inputs.image3) {
        const normalized3 = this.normalizeImageInput(inputs.image3);
        if (normalized3.length > 0) {
          sourceImage = normalized3[0];
        }
      }
      
      // Fallback sur inputs.image si présent
      if (!sourceImage && inputs.image) {
        if (Array.isArray(inputs.image) && inputs.image.length > 0) {
          sourceImage = inputs.image[0];
        } else {
          sourceImage = inputs.image;
        }
      }
      
      // Mettre à jour inputs.image avec l'image normalisée
      if (sourceImage) {
        inputs.image = sourceImage;
      }

      global.logWorkflow(`🎞️ Génération vidéo I2V`, {
        model: this.modelName,
        prompt: inputs.prompt?.substring(0, 100) + '...',
        hasSourceImage: !!inputs.image,
        hasLastImage: !!inputs.lastImage,
        sourceImageType: typeof inputs.image,
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
        // Paramètres directs depuis inputs (priorité)
        ...(inputs.numFrames !== undefined && { numFrames: inputs.numFrames }),
        ...(inputs.aspectRatio !== undefined && { aspectRatio: inputs.aspectRatio }),
        ...(inputs.framesPerSecond !== undefined && { fps: inputs.framesPerSecond }),
        ...(inputs.resolution !== undefined && { resolution: inputs.resolution }),
        ...(inputs.interpolateOutput !== undefined && { interpolateOutput: inputs.interpolateOutput }),
        ...(inputs.goFast !== undefined && { goFast: inputs.goFast }),
        ...(inputs.sampleShift !== undefined && { sampleShift: inputs.sampleShift }),
        ...(inputs.seed !== undefined && { seed: inputs.seed }),
        // Spread des paramètres supplémentaires dans inputs.parameters
        ...inputs.parameters,
        // Paramètres LoRA venant directement des inputs (dernière priorité)
        loraWeightsTransformer: inputs.loraWeightsTransformer || inputs.parameters?.loraWeightsTransformer,
        loraScaleTransformer: inputs.loraScaleTransformer ?? inputs.parameters?.loraScaleTransformer ?? 1.0,
        loraWeightsTransformer2: inputs.loraWeightsTransformer2 || inputs.parameters?.loraWeightsTransformer2,
        loraScaleTransformer2: inputs.loraScaleTransformer2 ?? inputs.parameters?.loraScaleTransformer2 ?? 1.0,
      };

      global.logWorkflow(`⚙️ Paramètres de génération vidéo`, generationParams);

      // Normaliser les images avant de les passer au service
      // Le service attend des strings (URLs/chemins) ou des buffers, pas des objets
      const normalizedImage = this.normalizeImageInput(inputs.image);
      const normalizedLastImage = inputs.lastImage ? this.normalizeImageInput(inputs.lastImage) : undefined;
      
      global.logWorkflow(`🖼️ Images normalisées`, {
        image: Array.isArray(normalizedImage) ? normalizedImage[0] : normalizedImage,
        lastImage: normalizedLastImage ? (Array.isArray(normalizedLastImage) ? normalizedLastImage[0] : normalizedLastImage) : 'none'
      });

      // Appel du service de génération vidéo existant
      // Note: Le service attend "image" (string URL/chemin ou buffer)
      
      // numFrames: 81 (rapide) ou 121 (long) - défaut 81
      const numFrames = generationParams.numFrames || 81;
      const aspectRatio = inputs.aspectRatio || generationParams.aspectRatio || '16:9';
      
      const result = await generateVideoI2V({
        image: Array.isArray(normalizedImage) ? normalizedImage[0] : normalizedImage, // String URL/chemin
        lastImage: normalizedLastImage ? (Array.isArray(normalizedLastImage) ? normalizedLastImage[0] : normalizedLastImage) : undefined,
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

      global.logWorkflow(`✅ Vidéo I2V générée avec succès`, {
        videoUrl: typeof videoUrl === 'string' ? videoUrl.substring(0, 100) + '...' : 'Video generated',
        duration: generationParams.duration,
        resolution: `${generationParams.width}x${generationParams.height}`
      });

      // La vidéo a déjà été téléchargée et sauvegardée par videoImageGenerator.js
      // videoUrl contient maintenant l'URL locale /medias/...
      
      // Extraire le nom de fichier depuis l'URL locale
      const filename = videoUrl.split('/').pop();

      return {
        video: videoUrl, // URL locale /medias/...
        video_filename: filename,
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
    } else {
      // Accepter string (URL/chemin) OU objet buffer {buffer, mimeType, ...} OU objet avec url/path
      const isValidString = typeof inputs.image === 'string';
      const isValidBuffer = inputs.image && typeof inputs.image === 'object' && inputs.image.buffer && Buffer.isBuffer(inputs.image.buffer);
      const isValidObject = inputs.image && typeof inputs.image === 'object' && (inputs.image.url || inputs.image.path);
      
      if (!isValidString && !isValidBuffer && !isValidObject) {
        errors.push('L\'image source doit être une URL, un chemin, un objet avec url/path, ou un buffer d\'image');
      }
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

  /**
   * Normalise un input d'image en gérant différents formats
   * @param {*} input - Input à normaliser (peut être une string, array, ou objet)
   * @returns {Array} Array d'URLs d'images
   */
  normalizeImageInput(input) {
    const images = [];
    
    global.logWorkflow(`🔍 Normalisation input image I2V:`, {
      type: typeof input,
      isArray: Array.isArray(input),
      isNull: input === null,
      value: typeof input === 'string' ? input.substring(0, 100) : 'N/A',
      objectKeys: typeof input === 'object' && input !== null && !Array.isArray(input) ? Object.keys(input) : 'N/A'
    });

    // Cas 1: String (URL, chemin ou ID)
    if (typeof input === 'string') {
      // URLs et chemins valides
      if (input.startsWith('http://') || input.startsWith('https://') || 
          input.startsWith('/medias/') || input.startsWith('data:')) {
        images.push(input);
        global.logWorkflow(`✅ URL/chemin détecté: ${input.substring(0, 50)}...`);
      }
      // UUID - devrait être résolu par WorkflowRunner
      else if (input.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        // Le WorkflowRunner devrait avoir résolu cet UUID en URL
        // Si on arrive ici, c'est qu'il n'a pas été résolu - on le garde tel quel
        global.logWorkflow(`⚠️ UUID non résolu: ${input} (sera géré par le service)`);
        images.push(input);
      }
      // ID de collection
      else if (input.startsWith('collection_')) {
        global.logWorkflow(`⚠️ Collection ID non résolu: ${input} (sera géré par le service)`);
        images.push(input);
      }
      else {
        global.logWorkflow(`⚠️ String non reconnue: ${input}`);
        images.push(input);
      }
    }
    // Cas 2: Objet avec url, path ou filename
    else if (typeof input === 'object' && input !== null && !Array.isArray(input)) {
      // Objet média avec url
      if (input.url) {
        images.push(input.url);
        global.logWorkflow(`✅ Objet avec URL: ${input.url}`);
      }
      // Objet média avec path
      else if (input.path) {
        // Convertir le chemin absolu en URL locale
        const filename = input.path.split('/').pop() || input.path.split('\\').pop();
        const url = `/medias/${filename}`;
        images.push(url);
        global.logWorkflow(`✅ Objet avec path converti: ${input.path} -> ${url}`);
      }
      // Objet média avec filename
      else if (input.filename) {
        const url = `/medias/${input.filename}`;
        images.push(url);
        global.logWorkflow(`✅ Objet avec filename converti: ${input.filename} -> ${url}`);
      }
      // Objet avec clés numériques (array-like)
      else {
        const keys = Object.keys(input).filter(key => /^\d+$/.test(key)).sort((a, b) => parseInt(a) - parseInt(b));
        if (keys.length > 0) {
          global.logWorkflow(`🔍 Objet avec clés numériques:`, { keys });
          for (const key of keys) {
            const subImages = this.normalizeImageInput(input[key]);
            images.push(...subImages);
          }
        } else {
          global.logWorkflow(`⚠️ Objet sans url/path/filename:`, { keys: Object.keys(input) });
        }
      }
    }
    // Cas 3: Array
    else if (Array.isArray(input)) {
      global.logWorkflow(`🔍 Array détecté:`, { length: input.length });
      for (const item of input) {
        const subImages = this.normalizeImageInput(item);
        images.push(...subImages);
      }
    }
    else {
      global.logWorkflow(`⚠️ Type non géré:`, { type: typeof input });
    }

    return images;
  }
}

export default GenerateVideoI2VTask;