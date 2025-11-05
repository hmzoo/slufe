import { extractVideoFrame } from '../videoProcessor.js';
import path from 'path';

/**
 * Service de tâche pour l'extraction de frames vidéo
 * Modèle: FFmpeg (Local)
 */
export class VideoExtractFrameTask {
  constructor() {
    this.taskType = 'video_extract_frame';
    this.modelName = 'FFmpeg';
  }

  /**
   * Exécute la tâche d'extraction de frame
   * @param {Object} inputs - Entrées de la tâche
   * @param {string|Buffer} inputs.video - Vidéo source
   * @param {string} [inputs.frameType='first'] - Type de frame à extraire
   * @param {string} [inputs.timeCode='00:00:01'] - Temps spécifique pour frameType='time'
   * @param {string} [inputs.outputFormat='jpg'] - Format de sortie
   * @param {number} [inputs.quality=95] - Qualité de l'image
   * @returns {Object} Résultats avec l'image extraite
   */
  async execute(inputs) {
    try {
      global.logWorkflow(`🎬 Extraction de frame vidéo`, {
        frameType: inputs.frameType || 'first',
        timeCode: inputs.timeCode || '00:00:01',
        outputFormat: inputs.outputFormat || 'jpg',
        quality: inputs.quality || 95,
        hasVideo: !!inputs.video,
        videoType: typeof inputs.video
      });

      // Validation des entrées
      const validation = this.validateInputs(inputs);
      if (!validation.isValid) {
        throw new Error(`Entrées invalides: ${validation.errors.join(', ')}`);
      }

      // Normaliser la vidéo (extraire URL/path depuis objets)
      const normalizedVideo = this.normalizeVideoInput(inputs.video);
      
      global.logWorkflow(`🎥 Vidéo normalisée`, {
        original: typeof inputs.video === 'object' ? 'object' : inputs.video,
        normalized: normalizedVideo
      });

      // Préparation des paramètres avec valeurs par défaut
      const params = {
        video: normalizedVideo,
        frameType: inputs.frameType || 'first',
        timeCode: inputs.timeCode || '00:00:01',
        outputFormat: inputs.outputFormat || 'jpg',
        quality: inputs.quality || 95
      };

      // Exécution de l'extraction
      const result = await extractVideoFrame(params);

      global.logWorkflow(`✅ Frame extraite avec succès`, {
        frameType: result.frame_info.type,
        timestamp: result.frame_info.timeCode,
        outputFormat: result.frame_info.format,
        outputFile: result.file_info.filename
      });

      return {
        image_url: result.image_url,
        image_path: result.image_path,
        frame_info: result.frame_info,
        file_info: result.file_info,
        success: true
      };

    } catch (error) {
      global.logWorkflow(`❌ Erreur lors de l'extraction de frame`, {
        error: error.message,
        inputs: {
          frameType: inputs.frameType,
          timeCode: inputs.timeCode,
          outputFormat: inputs.outputFormat
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

    // Validation de la vidéo
    if (!inputs.video) {
      errors.push('Vidéo requise');
    }

    // Validation frameType
    const validFrameTypes = ['first', 'last', 'middle', 'time'];
    if (inputs.frameType && !validFrameTypes.includes(inputs.frameType)) {
      errors.push(`Type de frame invalide. Valeurs acceptées: ${validFrameTypes.join(', ')}`);
    }

    // Validation timeCode pour frameType='time'
    if (inputs.frameType === 'time' && !inputs.timeCode) {
      errors.push('timeCode requis quand frameType="time"');
    }

    // Validation outputFormat
    const validFormats = ['jpg', 'png', 'webp'];
    if (inputs.outputFormat && !validFormats.includes(inputs.outputFormat)) {
      errors.push(`Format de sortie invalide. Valeurs acceptées: ${validFormats.join(', ')}`);
    }

    // Validation quality
    if (inputs.quality !== undefined) {
      if (typeof inputs.quality !== 'number' || inputs.quality < 1 || inputs.quality > 100) {
        errors.push('La qualité doit être un nombre entre 1 et 100');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Normalise l'input vidéo pour extraire l'URL/chemin depuis différents formats
   * @param {string|Buffer|Object} video - Vidéo à normaliser
   * @returns {string|Buffer} URL, chemin ou buffer normalisé
   */
  /**
   * Normalise l'input vidéo pour extraire l'URL/chemin depuis différents formats
   * et convertir les URLs relatives en chemins absolus
   * @param {string|Buffer|Object} video - Vidéo à normaliser
   * @returns {string|Buffer} URL, chemin absolu ou buffer normalisé
   */
  normalizeVideoInput(video) {
    // Si c'est un Buffer, retourner tel quel
    if (Buffer.isBuffer(video)) {
      return video;
    }

    let videoPath;

    // Si c'est déjà une string
    if (typeof video === 'string') {
      videoPath = video;
    }
    // Si c'est un objet avec url
    else if (video && typeof video === 'object' && video.url) {
      videoPath = video.url;
    }
    // Si c'est un objet avec path
    else if (video && typeof video === 'object' && video.path) {
      videoPath = video.path;
    }
    // Si c'est un objet avec filename
    else if (video && typeof video === 'object' && video.filename) {
      videoPath = video.filename;
    }
    // Sinon retourner tel quel
    else {
      return video;
    }

    // Convertir les URLs relatives (/medias/...) en chemins absolus
    if (videoPath.startsWith('/medias/')) {
      const filename = videoPath.replace('/medias/', '');
      videoPath = path.join(process.cwd(), 'medias', filename);
    }

    return videoPath;
  }

  /**
   * Retourne les paramètres par défaut pour cette tâche
   * @returns {Object} Paramètres par défaut
   */
  getDefaultParameters() {
    return {
      frameType: 'first',
      timeCode: '00:00:01',
      outputFormat: 'jpg',
      quality: 95
    };
  }

  /**
   * Retourne les paramètres d'entrée supportés
   * @returns {Object} Description des paramètres d'entrée
   */
  getInputSchema() {
    return {
      video: {
        type: 'video',
        required: true,
        description: 'Vidéo source pour l\'extraction de frame'
      },
      frameType: {
        type: 'select',
        required: false,
        default: 'first',
        options: [
          { label: 'Première frame', value: 'first' },
          { label: 'Dernière frame', value: 'last' },
          { label: 'Frame du milieu', value: 'middle' },
          { label: 'Temps spécifique', value: 'time' }
        ],
        description: 'Type de frame à extraire'
      },
      timeCode: {
        type: 'text',
        required: false,
        default: '00:00:01',
        description: 'Temps spécifique (HH:MM:SS.ms ou secondes) - utilisé si frameType="time"',
        placeholder: '00:00:05.50 ou 5.5'
      },
      outputFormat: {
        type: 'select',
        required: false,
        default: 'jpg',
        options: [
          { label: 'JPEG', value: 'jpg' },
          { label: 'PNG', value: 'png' },
          { label: 'WebP', value: 'webp' }
        ],
        description: 'Format de l\'image extraite'
      },
      quality: {
        type: 'number',
        required: false,
        default: 95,
        min: 1,
        max: 100,
        description: 'Qualité de l\'image (1-100, 100=meilleure)'
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
        description: 'URL de la frame extraite'
      },
      frame_info: {
        type: 'object',
        description: 'Informations sur la frame (type, timestamp, durée vidéo, etc.)'
      },
      file_info: {
        type: 'object',
        description: 'Informations sur le fichier (nom, chemin)'
      }
    };
  }
}