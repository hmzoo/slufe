import Replicate from 'replicate';
import fetch from 'node-fetch';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { DEFAULT_REPLICATE_OPTIONS } from '../config/replicate.js';
import { prepareImageForVideo, prepareMultipleImagesForVideo } from '../utils/imageUtils.js';
import { addImageToCurrentCollection } from './collectionManager.js';
import { saveMediaFile, getFileExtension, generateUniqueFileName } from '../utils/fileUtils.js';

// Calculer __dirname pour les modules ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
 * Valide les paramètres pour la génération de vidéo image-to-video
 */
export function validateVideoImageParams(params) {
  const errors = [];

  // Image de départ requise
  if (!params.startImage) {
    errors.push('startImage est requis (URL ou data URI)');
  }

  // Prompt requis
  if (!params.prompt || !params.prompt.trim()) {
    errors.push('prompt est requis');
  }

  // Validation numFrames (81-121)
  if (params.numFrames !== undefined) {
    const frames = parseInt(params.numFrames);
    if (isNaN(frames) || frames < 81 || frames > 121) {
      errors.push('numFrames doit être entre 81 et 121');
    }
  }

  // Validation aspectRatio
  if (params.aspectRatio && !['16:9', '9:16'].includes(params.aspectRatio)) {
    errors.push('aspectRatio doit être "16:9" ou "9:16"');
  }

  // Validation resolution
  if (params.resolution && !['480p', '720p'].includes(params.resolution)) {
    errors.push('resolution doit être "480p" ou "720p"');
  }

  // Validation framesPerSecond (5-30)
  if (params.framesPerSecond !== undefined) {
    const fps = parseInt(params.framesPerSecond);
    if (isNaN(fps) || fps < 5 || fps > 30) {
      errors.push('framesPerSecond doit être entre 5 et 30');
    }
  }

  // Validation sampleShift (1-20)
  if (params.sampleShift !== undefined) {
    const shift = parseFloat(params.sampleShift);
    if (isNaN(shift) || shift < 1 || shift > 20) {
      errors.push('sampleShift doit être entre 1 et 20');
    }
  }

  if (errors.length > 0) {
    throw new Error(`Paramètres invalides: ${errors.join(', ')}`);
  }

  return true;
}

/**
 * Génère une vidéo à partir d'une ou deux images (image-to-video)
 * Les images sont automatiquement recadrées au bon format selon leur orientation
 * 
 * @param {Object} params - Paramètres de génération
 * @param {Buffer|string} params.image - Buffer ou URL de l'image de départ (REQUIS)
 * @param {string} params.prompt - Description de l'animation souhaitée (REQUIS)
 * @param {Buffer|string} [params.lastImage] - Buffer ou URL de l'image de fin (optionnel)
 * @param {boolean} [params.optimizePrompt=false] - Optimiser le prompt en chinois
 * @param {number} [params.numFrames=81] - Nombre de frames (81-121)
 * @param {string} [params.aspectRatio] - Ratio (16:9 ou 9:16) - Auto-détecté si non fourni
 * @param {string} [params.resolution='480p'] - Résolution (480p ou 720p)
 * @param {number} [params.framesPerSecond=16] - FPS (5-30)
 * @param {boolean} [params.interpolateOutput=true] - Interpoler vers 30 FPS
 * @param {boolean} [params.goFast=true] - Mode rapide
 * @param {number} [params.sampleShift=12] - Contrôle de mouvement (1-20)
 * @param {number} [params.seed] - Seed pour reproductibilité
 * @param {boolean} [params.disableSafetyChecker=true] - Désactiver le safety checker
 * @param {string} [params.loraWeightsTransformer] - URL LoRA transformer
 * @param {number} [params.loraScaleTransformer=1] - Scale LoRA transformer (0-1)
 * @param {string} [params.loraWeightsTransformer2] - URL LoRA transformer 2
 * @param {number} [params.loraScaleTransformer2=1] - Scale LoRA transformer 2 (0-1)
 * 
 * @returns {Promise<Object>} - Résultat avec videoUrl et paramètres
 */
export async function generateVideoFromImage(params) {
  console.log('🎬 Début de la génération de vidéo image-to-video...');

  // Préparer les images si ce sont des buffers
  let startImageUrl = params.image;
  let lastImageUrl = params.lastImage;
  let detectedAspectRatio = params.aspectRatio;
  let imageProcessingInfo = null;

  // Extraire le buffer si l'image est un objet {buffer, mimeType, ...}
  let imageBuffer = params.image;
  if (params.image && typeof params.image === 'object' && params.image.buffer) {
    imageBuffer = params.image.buffer;
  }

  let lastImageBuffer = params.lastImage;
  if (params.lastImage && typeof params.lastImage === 'object' && params.lastImage.buffer) {
    lastImageBuffer = params.lastImage.buffer;
  }

  // Si c'est un chemin local /medias/..., le lire et le convertir en buffer
  if (typeof params.image === 'string' && params.image.startsWith('/medias/')) {
    console.log('📁 Lecture du fichier image local:', params.image);
    try {
      const fullPath = path.join(__dirname, '..', params.image);
      imageBuffer = await fs.readFile(fullPath);
      console.log(`✅ Fichier image lu (${Math.round(imageBuffer.length / 1024)}KB)`);
    } catch (error) {
      console.error('❌ Erreur lecture image:', error.message);
      throw new Error(`Impossible de lire l'image locale: ${error.message}`);
    }
  }

  if (typeof params.lastImage === 'string' && params.lastImage.startsWith('/medias/')) {
    console.log('📁 Lecture du fichier lastImage local:', params.lastImage);
    try {
      const fullPath = path.join(__dirname, '..', params.lastImage);
      lastImageBuffer = await fs.readFile(fullPath);
      console.log(`✅ Fichier lastImage lu (${Math.round(lastImageBuffer.length / 1024)}KB)`);
    } catch (error) {
      console.error('❌ Erreur lecture lastImage:', error.message);
      throw new Error(`Impossible de lire la lastImage locale: ${error.message}`);
    }
  }

  // Si image est un Buffer, la préparer pour la vidéo
  if (Buffer.isBuffer(imageBuffer)) {
    console.log('🖼️  Préparation de l\'image de départ...');
    
    const images = [imageBuffer];
    if (lastImageBuffer && Buffer.isBuffer(lastImageBuffer)) {
      images.push(lastImageBuffer);
    }
    
    // Préparer les images avec auto-détection du format
    const prepared = await prepareMultipleImagesForVideo(images, params.aspectRatio);
    detectedAspectRatio = prepared.aspectRatio;
    imageProcessingInfo = prepared.info;
    
    // Convertir les buffers en data URI pour Replicate
    startImageUrl = `data:image/jpeg;base64,${prepared.buffers[0].toString('base64')}`;
    if (prepared.buffers.length > 1) {
      lastImageUrl = `data:image/jpeg;base64,${prepared.buffers[1].toString('base64')}`;
    }
    
    console.log('✅ Images préparées et recadrées au format', detectedAspectRatio);
  } else if (typeof params.image === 'string' && !params.aspectRatio) {
    // Si c'est une URL et pas de ratio spécifié, utiliser le défaut
    detectedAspectRatio = '16:9';
    console.log('ℹ️  URL fournie, utilisation du ratio par défaut:', detectedAspectRatio);
  }

  // Utiliser le ratio détecté ou fourni
  const finalAspectRatio = detectedAspectRatio || params.aspectRatio || '16:9';

  // Créer les nouveaux paramètres avec les images préparées
  const preparedParams = {
    ...params,
    image: undefined, // On supprime l'ancien paramètre
    startImage: startImageUrl,
    lastImage: lastImageUrl,
    aspectRatio: finalAspectRatio
  };

  // Valider les paramètres
  validateVideoImageParams(preparedParams);

  // Si Replicate n'est pas configuré, retourner une vidéo mock
  if (!isReplicateConfigured()) {
    console.log('⚠️  Mode MOCK: REPLICATE_API_TOKEN non configuré');
    return {
      success: true,
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      mock: true,
      params: {
        prompt: preparedParams.prompt,
        numFrames: preparedParams.numFrames || 81,
        aspectRatio: finalAspectRatio,
        resolution: preparedParams.resolution || '480p',
        framesPerSecond: preparedParams.framesPerSecond || 16,
        finalFps: preparedParams.interpolateOutput !== false ? 30 : (preparedParams.framesPerSecond || 16),
        duration: `${((preparedParams.numFrames || 81) / (preparedParams.framesPerSecond || 16)).toFixed(1)}s`,
        hasLastImage: !!preparedParams.lastImage,
        imageProcessing: imageProcessingInfo
      }
    };
  }

  // Préparer les paramètres pour Replicate
  const input = {
    image: preparedParams.startImage,
    prompt: preparedParams.prompt.trim(),
    num_frames: preparedParams.numFrames || 81,
    resolution: preparedParams.resolution || '480p',
    frames_per_second: preparedParams.framesPerSecond || 16,
    interpolate_output: preparedParams.interpolateOutput !== undefined ? preparedParams.interpolateOutput : true,
    go_fast: preparedParams.goFast !== undefined ? preparedParams.goFast : true,
    sample_shift: preparedParams.sampleShift || 12,
    disable_safety_checker: preparedParams.disableSafetyChecker !== undefined ? preparedParams.disableSafetyChecker : true,
  };

  // Ajouter l'image de fin si fournie (le paramètre s'appelle last_image)
  if (preparedParams.lastImage) {
    input.last_image = preparedParams.lastImage;
  }

  // Ajouter le seed si fourni
  if (preparedParams.seed !== undefined && preparedParams.seed !== null) {
    input.seed = preparedParams.seed;
  }

  // Ajouter les LoRA si fournis
  if (preparedParams.loraWeightsTransformer) {
    input.lora_weights_transformer = preparedParams.loraWeightsTransformer;
    input.lora_scale_transformer = preparedParams.loraScaleTransformer || 1;
  }
  
  if (preparedParams.loraWeightsTransformer2) {
    input.lora_weights_transformer_2 = preparedParams.loraWeightsTransformer2;
    input.lora_scale_transformer_2 = preparedParams.loraScaleTransformer2 || 1;
  }

  console.log('📝 Paramètres de génération:', {
    prompt: input.prompt,
    numFrames: input.num_frames,
    resolution: input.resolution,
    fps: input.frames_per_second,
    hasLastImage: !!input.last_image,
    loraWeightsTransformer: input.lora_weights_transformer || 'none',
    loraScaleTransformer: input.lora_scale_transformer,
    loraWeightsTransformer2: input.lora_weights_transformer_2 || 'none',
    loraScaleTransformer2: input.lora_scale_transformer_2,
  });

  console.log('⏱️  Timeout: 10 minutes maximum (modèle de génération de vidéo)');

  try {
    // Appeler l'API Replicate avec timeout étendu
    const output = await replicate.run(
      'wan-video/wan-2.2-i2v-fast',
      {
        input,
        ...DEFAULT_REPLICATE_OPTIONS
      }
    );

    console.log('✅ Vidéo générée avec succès');

    // Extraire l'URL de la vidéo selon le format de sortie
    let videoUrl;
    if (typeof output === 'string') {
      videoUrl = output;
    } else if (output && typeof output.url === 'function') {
      videoUrl = output.url();
    } else if (output && output.url) {
      videoUrl = output.url;
    } else if (Array.isArray(output) && output.length > 0) {
      const firstOutput = output[0];
      if (typeof firstOutput === 'string') {
        videoUrl = firstOutput;
      } else if (firstOutput && typeof firstOutput.url === 'function') {
        videoUrl = firstOutput.url();
      } else if (firstOutput && firstOutput.url) {
        videoUrl = firstOutput.url;
      }
    }

    if (!videoUrl) {
      throw new Error('URL de vidéo non trouvée dans la sortie');
    }

    console.log('🎥 Vidéo I2V URL:', videoUrl);

    // Télécharger et sauvegarder la vidéo localement + ajouter à la collection courante
    try {
      console.log('📥 Téléchargement de la vidéo I2V générée...');
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
      
      // Calculer la durée de la vidéo
      const duration = input.num_frames / input.frames_per_second;
      const finalFps = input.interpolate_output ? 30 : input.frames_per_second;
      
      // Ajouter la vidéo sauvegardée à la collection (URL relative)
      await addImageToCurrentCollection({
        url: `/medias/${filename}`, // URL relative
        mediaId: mediaId, // UUID de la vidéo
        type: 'video', // Marquer comme vidéo
        description: `Vidéo I2V générée : "${input.prompt.substring(0, 100)}${input.prompt.length > 100 ? '...' : ''}"`,
        metadata: {
          duration: `${duration.toFixed(1)}s`,
          numFrames: input.num_frames,
          fps: finalFps,
          aspectRatio: finalAspectRatio,
          resolution: input.resolution,
          hasLastImage: !!input.last_image
        }
      });
      
      console.log(`💾 Vidéo I2V générée sauvegardée et ajoutée à la collection: ${filename}`);
      
      // Mettre à jour videoUrl pour pointer vers le fichier local
      videoUrl = `/medias/${filename}`;
    } catch (error) {
      console.warn('⚠️ Impossible de sauvegarder la vidéo I2V générée à la collection courante:', error.message);
    }

    // Calculer la durée de la vidéo
    const duration = input.num_frames / input.frames_per_second;
    const finalFps = input.interpolate_output ? 30 : input.frames_per_second;

    return {
      success: true,
      videoUrl,
      mock: false,
      params: {
        prompt: input.prompt,
        numFrames: input.num_frames,
        aspectRatio: finalAspectRatio,
        resolution: input.resolution,
        framesPerSecond: input.frames_per_second,
        finalFps,
        duration: `${duration.toFixed(1)}s`,
        sampleShift: input.sample_shift,
        interpolated: input.interpolate_output,
        hasLastImage: !!input.last_image,
        seed: input.seed || null,
      },
      imageProcessing: imageProcessingInfo
    };

  } catch (error) {
    console.error('❌ Erreur lors de la génération de vidéo:', error);
    throw error;
  }
}

/**
 * Workflows prédéfinis pour différents cas d'usage image-to-video
 */
export const VIDEO_IMAGE_WORKFLOWS = {
  animation_smooth: {
    name: 'Animation Fluide',
    description: 'Animation douce et fluide avec transitions naturelles',
    settings: {
      numFrames: 81,
      framesPerSecond: 24,
      interpolateOutput: true,
      sampleShift: 8,
      goFast: false,
    }
  },
  morph_transition: {
    name: 'Transition Morphing',
    description: 'Morphing entre deux images avec transition progressive',
    settings: {
      numFrames: 101,
      framesPerSecond: 20,
      interpolateOutput: true,
      sampleShift: 10,
      requiresEndImage: true,
    }
  },
  dynamic_motion: {
    name: 'Mouvement Dynamique',
    description: 'Animation avec mouvements rapides et dynamiques',
    settings: {
      numFrames: 121,
      framesPerSecond: 30,
      interpolateOutput: false,
      sampleShift: 18,
      resolution: '720p',
    }
  },
  subtle_animation: {
    name: 'Animation Subtile',
    description: 'Petits mouvements subtils (cheveux, vêtements, etc.)',
    settings: {
      numFrames: 81,
      framesPerSecond: 16,
      interpolateOutput: true,
      sampleShift: 6,
      goFast: true,
    }
  },
  loop_seamless: {
    name: 'Boucle Sans Fin',
    description: 'Animation qui peut boucler de manière fluide',
    settings: {
      numFrames: 81,
      framesPerSecond: 24,
      interpolateOutput: true,
      sampleShift: 10,
      requiresEndImage: true,
    }
  },
  quick_preview: {
    name: 'Aperçu Rapide',
    description: 'Génération rapide pour tests',
    settings: {
      numFrames: 81,
      framesPerSecond: 16,
      interpolateOutput: false,
      sampleShift: 12,
      resolution: '480p',
      goFast: true,
    }
  }
};

/**
 * Alias pour generateVideoFromImage (pour compatibilité avec GenerateVideoI2VTask)
 */
export const generateVideoI2V = generateVideoFromImage;

export default {
  generateVideoFromImage,
  generateVideoI2V,
  validateVideoImageParams,
  isReplicateConfigured,
  VIDEO_IMAGE_WORKFLOWS,
};
