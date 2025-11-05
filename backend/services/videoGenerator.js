import Replicate from 'replicate';
import fetch from 'node-fetch';
import { DEFAULT_REPLICATE_OPTIONS } from '../config/replicate.js';
import { VIDEO_DEFAULTS } from '../config/defaults.js';
import { addImageToCurrentCollection } from './collectionManager.js';
import { saveMediaFile, getFileExtension, generateUniqueFileName } from '../utils/fileUtils.js';

/**
 * Service de génération de vidéos avec WAN 2.2 T2V Fast
 * Permet de générer des vidéos à partir de prompts textuels (text-to-video)
 */

// Initialiser Replicate
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

/**
 * Vérifie si Replicate est configuré
 */
export function isReplicateConfigured() {
  return !!process.env.REPLICATE_API_TOKEN;
}

/**
 * Valide les paramètres de génération de vidéo
 */
export function validateVideoParams(params) {
  const errors = [];

  // Validation du prompt
  if (!params.prompt || typeof params.prompt !== 'string' || !params.prompt.trim()) {
    errors.push('Le prompt est requis et doit être une chaîne non vide');
  }

  // Validation num_frames
  if (params.numFrames !== undefined && params.numFrames !== null) {
    const numFrames = parseInt(params.numFrames);
    if (isNaN(numFrames) || numFrames < 81 || numFrames > 121) {
      errors.push('num_frames doit être entre 81 et 121');
    }
  }

  // Validation aspect_ratio
  if (params.aspectRatio) {
    const validRatios = ['16:9', '9:16'];
    if (!validRatios.includes(params.aspectRatio)) {
      errors.push('aspect_ratio doit être "16:9" ou "9:16"');
    }
  }

  // Validation resolution
  if (params.resolution) {
    const validResolutions = ['480p', '720p'];
    if (!validResolutions.includes(params.resolution)) {
      errors.push('resolution doit être "480p" ou "720p"');
    }
  }

  // Validation frames_per_second
  if (params.framesPerSecond !== undefined && params.framesPerSecond !== null) {
    const fps = parseInt(params.framesPerSecond);
    if (isNaN(fps) || fps < 5 || fps > 30) {
      errors.push('frames_per_second doit être entre 5 et 30');
    }
  }

  // Validation sample_shift
  if (params.sampleShift !== undefined && params.sampleShift !== null) {
    const shift = parseFloat(params.sampleShift);
    if (isNaN(shift) || shift < 1 || shift > 20) {
      errors.push('sample_shift doit être entre 1 et 20');
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Génère une vidéo à partir d'un prompt (text-to-video)
 * 
 * @param {Object} params - Paramètres de génération
 * @param {string} params.prompt - Description de la vidéo à générer
 * @param {boolean} [params.optimizePrompt=false] - Traduire en chinois pour optimisation
 * @param {number} [params.numFrames=81] - Nombre de frames (81-121)
 * @param {string} [params.aspectRatio='16:9'] - Ratio d'aspect ('16:9' ou '9:16')
 * @param {string} [params.resolution='480p'] - Résolution ('480p' ou '720p')
 * @param {number} [params.framesPerSecond=16] - FPS (5-30)
 * @param {boolean} [params.interpolateOutput=true] - Interpoler à 30 FPS
 * @param {boolean} [params.goFast=true] - Mode rapide
 * @param {number} [params.sampleShift=12] - Intensité du mouvement (1-20)
 * @param {number} [params.seed] - Seed pour reproductibilité
 * @param {boolean} [params.disableSafetyChecker=false] - Désactiver safety checker
 * @param {string} [params.loraWeightsTransformer] - URL LoRA transformer
 * @param {number} [params.loraScaleTransformer=1] - Scale LoRA transformer
 * @param {string} [params.loraWeightsTransformer2] - URL LoRA transformer 2
 * @param {number} [params.loraScaleTransformer2=1] - Scale LoRA transformer 2
 * 
 * @returns {Promise<Object>} Résultat avec URL de la vidéo
 */
export async function generateVideo(params) {
  try {
    const {
      prompt,
      optimizePrompt = VIDEO_DEFAULTS.optimizePrompt,
      numFrames = VIDEO_DEFAULTS.numFrames,
      aspectRatio = VIDEO_DEFAULTS.aspectRatio,
      resolution = VIDEO_DEFAULTS.resolution,
      framesPerSecond = VIDEO_DEFAULTS.framesPerSecond,
      interpolateOutput = VIDEO_DEFAULTS.interpolateOutput,
      goFast = VIDEO_DEFAULTS.goFast,
      sampleShift = VIDEO_DEFAULTS.sampleShift,
      seed = null,
      disableSafetyChecker = VIDEO_DEFAULTS.disableSafetyChecker,
      loraWeightsTransformer = null,
      loraScaleTransformer = 1,
      loraWeightsTransformer2 = null,
      loraScaleTransformer2 = 1
    } = params;

    // Validation
    const validation = validateVideoParams(params);
    if (!validation.valid) {
      throw new Error(`Paramètres invalides: ${validation.errors.join(', ')}`);
    }

    // Mode mock si pas de token
    if (!process.env.REPLICATE_API_TOKEN) {
      console.log('⚠️  Mode MOCK - REPLICATE_API_TOKEN non configuré');
      console.log('📹 Génération vidéo simulée:', {
        prompt: prompt.substring(0, 100),
        numFrames,
        aspectRatio,
        resolution,
        fps: framesPerSecond
      });

      // Calculer durée
      const duration = Math.round(numFrames / framesPerSecond * 10) / 10;
      
      return {
        success: true,
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        mock: true,
        params: {
          prompt,
          numFrames,
          aspectRatio,
          resolution,
          framesPerSecond,
          duration: `${duration}s`,
          interpolated: interpolateOutput
        }
      };
    }

    console.log('🎬 Génération de vidéo avec WAN 2.2 T2V Fast...');
    console.log('Prompt:', prompt);
    console.log('Paramètres:', {
      numFrames,
      aspectRatio,
      resolution,
      fps: framesPerSecond,
      sampleShift
    });

    // Préparer l'input pour Replicate
    const input = {
      prompt: prompt,
      optimize_prompt: optimizePrompt,
      num_frames: numFrames,
      aspect_ratio: aspectRatio,
      resolution: resolution,
      frames_per_second: framesPerSecond,
      interpolate_output: interpolateOutput,
      go_fast: goFast,
      sample_shift: sampleShift,
      disable_safety_checker: disableSafetyChecker,
      lora_scale_transformer: loraScaleTransformer,
      lora_scale_transformer_2: loraScaleTransformer2
    };

    // Ajouter seed si spécifié
    if (seed !== null && seed !== undefined) {
      input.seed = parseInt(seed);
    }

    // Ajouter LoRA weights si spécifiés
    if (loraWeightsTransformer) {
      input.lora_weights_transformer = loraWeightsTransformer;
    }
    if (loraWeightsTransformer2) {
      input.lora_weights_transformer_2 = loraWeightsTransformer2;
    }

    // Appel au modèle WAN 2.2 T2V Fast via Replicate
    console.log('⏱️  Timeout: 10 minutes maximum');
    const output = await replicate.run(
      'wan-video/wan-2.2-t2v-fast',
      { 
        input,
        ...DEFAULT_REPLICATE_OPTIONS
      }
    );

    console.log('✅ Génération terminée');

    // Traiter la sortie
    let videoUrl = '';
    
    if (typeof output === 'string') {
      videoUrl = output;
    } else if (output && typeof output.url === 'function') {
      videoUrl = output.url();
    } else if (output && output.url) {
      videoUrl = output.url;
    } else if (Array.isArray(output) && output.length > 0) {
      const firstItem = output[0];
      if (typeof firstItem === 'string') {
        videoUrl = firstItem;
      } else if (firstItem && typeof firstItem.url === 'function') {
        videoUrl = firstItem.url();
      } else if (firstItem && firstItem.url) {
        videoUrl = firstItem.url;
      }
    }

    if (!videoUrl) {
      console.error('❌ Format de sortie inattendu:', output);
      throw new Error('Impossible d\'extraire l\'URL de la vidéo');
    }

    console.log('🎥 Vidéo URL:', videoUrl);

    // Télécharger et sauvegarder la vidéo localement + ajouter à la collection courante
    try {
      console.log('📥 Téléchargement de la vidéo générée...');
      const response = await fetch(videoUrl);
      if (!response.ok) {
        throw new Error(`Erreur téléchargement: ${response.status} ${response.statusText}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const extension = getFileExtension(response.headers.get('content-type') || 'video/mp4');
      const filename = generateUniqueFileName(extension);
      
      // Sauvegarder localement
      const savedFile = saveMediaFile(filename, buffer);
      
      // Extraire l'UUID depuis le nom de fichier pour le mediaId
      const mediaId = filename.replace(/\.[^.]+$/, '');
      
      // Calculer durée
      const duration = Math.round(numFrames / framesPerSecond * 10) / 10;
      const finalFps = interpolateOutput ? 30 : framesPerSecond;
      
      // Ajouter la vidéo sauvegardée à la collection (URL relative)
      await addImageToCurrentCollection({
        url: `/medias/${filename}`, // URL relative
        mediaId: mediaId, // UUID de la vidéo
        type: 'video', // Marquer comme vidéo
        description: `Vidéo T2V générée : "${prompt.substring(0, 100)}${prompt.length > 100 ? '...' : ''}"`,
        metadata: {
          duration: `${duration}s`,
          numFrames,
          fps: finalFps,
          aspectRatio,
          resolution
        }
      });
      
      console.log(`💾 Vidéo générée sauvegardée et ajoutée à la collection: ${filename}`);
      
      // Mettre à jour videoUrl pour pointer vers le fichier local
      videoUrl = `/medias/${filename}`;
    } catch (error) {
      console.warn('⚠️ Impossible de sauvegarder la vidéo générée à la collection courante:', error.message);
    }

    // Calculer durée
    const duration = Math.round(numFrames / framesPerSecond * 10) / 10;
    const finalFps = interpolateOutput ? 30 : framesPerSecond;

    return {
      success: true,
      videoUrl: videoUrl,
      mock: false,
      params: {
        prompt,
        numFrames,
        aspectRatio,
        resolution,
        framesPerSecond,
        finalFps,
        duration: `${duration}s`,
        sampleShift,
        interpolated: interpolateOutput,
        optimized: optimizePrompt,
        seed: seed
      }
    };

  } catch (error) {
    console.error('❌ Erreur lors de la génération de vidéo:', error);
    throw error;
  }
}

/**
 * Alias pour generateVideo (pour compatibilité avec GenerateVideoT2VTask)
 */
export const generateVideoT2V = generateVideo;

/**
 * Workflows prédéfinis pour différents cas d'usage
 */
export const VIDEO_WORKFLOWS = {
  youtube: {
    name: 'YouTube Content',
    settings: {
      aspectRatio: '16:9',
      resolution: '720p',
      numFrames: 81,
      framesPerSecond: 24,
      interpolateOutput: true,
      sampleShift: 12
    }
  },
  social_vertical: {
    name: 'Social Media Vertical',
    settings: {
      aspectRatio: '9:16',
      resolution: '480p',
      numFrames: 81,
      framesPerSecond: 16,
      interpolateOutput: true,
      goFast: true
    }
  },
  cinematic: {
    name: 'Cinematic Shot',
    settings: {
      aspectRatio: '16:9',
      resolution: '720p',
      numFrames: 81,
      framesPerSecond: 24,
      sampleShift: 12,
      goFast: false,
      interpolateOutput: true
    }
  },
  action: {
    name: 'Dynamic Action',
    settings: {
      numFrames: 121,
      sampleShift: 18,
      framesPerSecond: 30,
      resolution: '720p',
      interpolateOutput: false
    }
  },
  preview: {
    name: 'Quick Preview',
    settings: {
      aspectRatio: '16:9',
      resolution: '480p',
      numFrames: 81,
      framesPerSecond: 16,
      goFast: true,
      interpolateOutput: false
    }
  }
};
