import { concatenateVideos } from '../videoProcessor.js';

/**
 * Service de tâche pour la concaténation de vidéos
 * Modèle: FFmpeg (Local)
 */
export class VideoConcatenateTask {
  constructor() {
    this.taskType = 'video_concatenate';
    this.modelName = 'FFmpeg';
  }

  /**
   * Exécute la tâche de concaténation de vidéos
   * @param {Object} inputs - Entrées de la tâche
   * @param {Array<string|Buffer>} inputs.videos - Liste des vidéos à concaténer
   * @param {string} [inputs.outputFormat='mp4'] - Format de sortie
   * @param {string} [inputs.resolution=null] - Résolution forcée (ex: '1920x1080')
   * @param {number} [inputs.fps=null] - FPS forcé
   * @param {string} [inputs.quality='medium'] - Qualité
   * @returns {Object} Résultats avec la vidéo concaténée
   */
  async execute(inputs) {
    try {
      global.logWorkflow(`🎬 Concaténation de vidéos`, {
        videoCount: inputs.videos?.length || 0,
        outputFormat: inputs.outputFormat || 'mp4',
        resolution: inputs.resolution || 'auto',
        fps: inputs.fps || 'auto',
        quality: inputs.quality || 'medium'
      });

      // Validation des entrées
      const validation = this.validateInputs(inputs);
      if (!validation.isValid) {
        throw new Error(`Entrées invalides: ${validation.errors.join(', ')}`);
      }

      // Préparation des paramètres avec valeurs par défaut
      const params = {
        videos: inputs.videos,
        outputFormat: inputs.outputFormat || 'mp4',
        resolution: inputs.resolution || null,
        fps: inputs.fps || null,
        quality: inputs.quality || 'medium'
      };

      // Exécution de la concaténation
      const result = await concatenateVideos(params);

      global.logWorkflow(`✅ Concaténation terminée`, {
        inputCount: result.concat_info.input_count,
        totalDuration: `${result.concat_info.total_duration.toFixed(2)}s`,
        outputResolution: result.concat_info.resolution,
        outputFile: result.file_info.filename,
        outputSize: `${result.file_info.size_mb}MB`
      });

      return {
        video_url: result.video_url,
        video_path: result.video_path,
        concat_info: result.concat_info,
        input_videos: result.input_videos,
        file_info: result.file_info,
        success: true
      };

    } catch (error) {
      global.logWorkflow(`❌ Erreur lors de la concaténation`, {
        error: error.message,
        inputs: {
          videoCount: inputs.videos?.length || 0,
          outputFormat: inputs.outputFormat,
          resolution: inputs.resolution,
          quality: inputs.quality
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

    // Validation des vidéos
    if (!inputs.videos || !Array.isArray(inputs.videos)) {
      errors.push('Liste de vidéos requise (Array)');
    } else if (inputs.videos.length < 2) {
      errors.push('Au moins 2 vidéos sont requises pour la concaténation');
    } else if (inputs.videos.length > 20) {
      errors.push('Maximum 20 vidéos peuvent être concaténées à la fois');
    }

    // Validation outputFormat
    const validFormats = ['mp4', 'mov', 'avi', 'mkv', 'webm'];
    if (inputs.outputFormat && !validFormats.includes(inputs.outputFormat)) {
      errors.push(`Format de sortie invalide. Valeurs acceptées: ${validFormats.join(', ')}`);
    }

    // Validation resolution
    if (inputs.resolution) {
      const resolutionPattern = /^\d+x\d+$/;
      if (!resolutionPattern.test(inputs.resolution)) {
        errors.push('Format de résolution invalide. Utilisez le format WIDTHxHEIGHT (ex: 1920x1080)');
      } else {
        const [width, height] = inputs.resolution.split('x').map(Number);
        if (width > 4096 || height > 4096) {
          errors.push('Résolution maximale: 4096x4096');
        }
        if (width < 64 || height < 64) {
          errors.push('Résolution minimale: 64x64');
        }
      }
    }

    // Validation fps
    if (inputs.fps !== undefined && inputs.fps !== null) {
      if (typeof inputs.fps !== 'number' || inputs.fps < 1 || inputs.fps > 120) {
        errors.push('Le FPS doit être un nombre entre 1 et 120');
      }
    }

    // Validation quality
    const validQualities = ['low', 'medium', 'high'];
    if (inputs.quality && !validQualities.includes(inputs.quality)) {
      errors.push(`Qualité invalide. Valeurs acceptées: ${validQualities.join(', ')}`);
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
      outputFormat: 'mp4',
      resolution: null,
      fps: null,
      quality: 'medium'
    };
  }

  /**
   * Retourne les paramètres d'entrée supportés
   * @returns {Object} Description des paramètres d'entrée
   */
  getInputSchema() {
    return {
      videos: {
        type: 'videos',
        required: true,
        multiple: true,
        min: 2,
        max: 20,
        description: 'Vidéos à concaténer (minimum 2, maximum 20)'
      },
      outputFormat: {
        type: 'select',
        required: false,
        default: 'mp4',
        options: [
          { label: 'MP4 (recommandé)', value: 'mp4' },
          { label: 'MOV', value: 'mov' },
          { label: 'AVI', value: 'avi' },
          { label: 'MKV', value: 'mkv' },
          { label: 'WebM', value: 'webm' }
        ],
        description: 'Format de la vidéo de sortie'
      },
      resolution: {
        type: 'select',
        required: false,
        default: null,
        options: [
          { label: 'Automatique (résolution la plus commune)', value: null },
          { label: 'HD 720p (1280x720)', value: '1280x720' },
          { label: 'Full HD 1080p (1920x1080)', value: '1920x1080' },
          { label: '2K (2560x1440)', value: '2560x1440' },
          { label: '4K (3840x2160)', value: '3840x2160' },
          { label: 'Instagram Stories (1080x1920)', value: '1080x1920' },
          { label: 'YouTube Shorts (1080x1920)', value: '1080x1920' },
          { label: 'TikTok (1080x1920)', value: '1080x1920' }
        ],
        description: 'Résolution de sortie (toutes les vidéos seront redimensionnées)'
      },
      fps: {
        type: 'select',
        required: false,
        default: null,
        options: [
          { label: 'Automatique', value: null },
          { label: '24 fps (cinéma)', value: 24 },
          { label: '25 fps (PAL)', value: 25 },
          { label: '30 fps (standard)', value: 30 },
          { label: '60 fps (fluide)', value: 60 }
        ],
        description: 'Fréquence d\'images de sortie'
      },
      quality: {
        type: 'select',
        required: false,
        default: 'medium',
        options: [
          { label: 'Basse (rapide, petit fichier)', value: 'low' },
          { label: 'Moyenne (équilibré)', value: 'medium' },
          { label: 'Haute (lent, gros fichier)', value: 'high' }
        ],
        description: 'Qualité de compression vidéo'
      }
    };
  }

  /**
   * Retourne la description de la sortie
   * @returns {Object} Description de la sortie
   */
  getOutputSchema() {
    return {
      video_url: {
        type: 'video_url',
        description: 'URL de la vidéo concaténée'
      },
      concat_info: {
        type: 'object',
        description: 'Informations sur la concaténation (durée, résolution, nombre d\'inputs, etc.)'
      },
      input_videos: {
        type: 'array',
        description: 'Informations sur chaque vidéo d\'entrée'
      },
      file_info: {
        type: 'object',
        description: 'Informations sur le fichier de sortie (nom, taille, etc.)'
      }
    };
  }
}