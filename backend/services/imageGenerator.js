import Replicate from 'replicate';
import fetch from 'node-fetch';
import { DEFAULT_REPLICATE_OPTIONS } from '../config/replicate.js';
import { IMAGE_DEFAULTS } from '../config/defaults.js';
import { addImageToCurrentCollection } from './collectionManager.js';
import { saveMediaFile, getFileExtension, generateUniqueFileName } from '../utils/fileUtils.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Service de génération d'images avec Qwen Image
 * Permet de générer des images à partir de prompts textuels
 * Supporte text-to-image et image-to-image
 */

// Initialiser Replicate
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

/**
 * Génère une image à partir d'un prompt textuel avec le modèle Qwen-Image
 * @param {Object} params - Paramètres de génération
 * @param {string} params.prompt - Prompt pour la génération
 * @param {string} [params.negativePrompt] - Prompt négatif (ce qu'on ne veut pas)
 * @param {number} [params.guidance=3] - Guidance scale (2-4 recommandé)
 * @param {number} [params.numInferenceSteps=30] - Nombre d'étapes (28-50)
 * @param {string} [params.aspectRatio='16:9'] - Ratio d'aspect (16:9, 9:16, 1:1, etc.)
 * @param {string} [params.imageSize='optimize_for_quality'] - Optimisation
 * @param {string} [params.outputFormat='jpg'] - Format de sortie
 * @param {number} [params.outputQuality=90] - Qualité (0-100)
 * @param {boolean} [params.enhancePrompt=false] - Améliorer le prompt automatiquement
 * @param {boolean} [params.disableSafetyChecker=true] - Désactiver le safety checker
 * @param {number} [params.seed] - Seed pour reproductibilité
 * @returns {Promise<string>} - URL de l'image générée
 */
export async function generateImage({
  prompt,
  negativePrompt = IMAGE_DEFAULTS.negativePrompt,
  guidance = IMAGE_DEFAULTS.guidance,
  numInferenceSteps = IMAGE_DEFAULTS.numInferenceSteps,
  aspectRatio = IMAGE_DEFAULTS.aspectRatio,
  imageSize = IMAGE_DEFAULTS.imageSize,
  outputFormat = IMAGE_DEFAULTS.outputFormat,
  outputQuality = IMAGE_DEFAULTS.outputQuality,
  enhancePrompt = IMAGE_DEFAULTS.enhancePrompt,
  disableSafetyChecker = IMAGE_DEFAULTS.disableSafetyChecker,
  seed = null,
}) {
  try {
    if (!prompt || prompt.trim() === '') {
      throw new Error('Le prompt ne peut pas être vide');
    }

    if (!process.env.REPLICATE_API_TOKEN) {
      throw new Error('REPLICATE_API_TOKEN non configuré dans les variables d\'environnement');
    }

    console.log('🎨 Génération d\'image avec Qwen-Image...');
    console.log('Prompt:', prompt);

    const input = {
      prompt: prompt,
      negative_prompt: negativePrompt,
      guidance: guidance,
      num_inference_steps: numInferenceSteps,
      aspect_ratio: aspectRatio,
      image_size: imageSize,
      output_format: outputFormat,
      output_quality: outputQuality,
      enhance_prompt: enhancePrompt,
      disable_safety_checker: disableSafetyChecker,
      go_fast: true,
    };

    // Ajouter seed si spécifié
    if (seed !== null) {
      input.seed = seed;
    }

    // Appel au modèle Qwen-Image via Replicate
    console.log('⏱️  Timeout: 10 minutes maximum');
    const output = await replicate.run(
      'qwen/qwen-image',
      { 
        input,
        ...DEFAULT_REPLICATE_OPTIONS
      }
    );

    console.log('🔍 Output type:', typeof output);
    console.log('🔍 Output:', output);

    // Le modèle retourne un array d'URLs
    let imageUrl = '';
    if (Array.isArray(output) && output.length > 0) {
      // Récupérer l'URL du premier élément
      const firstItem = output[0];
      if (typeof firstItem === 'object' && firstItem.url) {
        imageUrl = firstItem.url();
      } else if (typeof firstItem === 'string') {
        imageUrl = firstItem;
      } else {
        imageUrl = String(firstItem);
      }
    } else if (typeof output === 'string') {
      imageUrl = output;
    } else {
      throw new Error('Format de sortie inattendu du modèle');
    }

    console.log('✅ Image générée:', imageUrl);

    // Télécharger et ajouter l'image à la collection courante
    try {
      console.log('📥 Téléchargement et sauvegarde de l\'image générée...');
      
      // Télécharger l'image
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`Erreur téléchargement: ${response.status} ${response.statusText}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const extension = getFileExtension(response.headers.get('content-type') || 'image/png');
      const filename = generateUniqueFileName(extension);
      
      // Sauvegarder localement
      const savedFile = saveMediaFile(filename, buffer);
      
      // Extraire l'UUID depuis le nom de fichier pour le mediaId
      const mediaId = filename.replace(/\.[^.]+$/, '');
      
      // Ajouter l'image sauvegardée à la collection (URL relative)
      await addImageToCurrentCollection({
        url: `/medias/${filename}`, // URL relative
        mediaId: mediaId, // UUID de l'image
        description: `Image générée : "${prompt.substring(0, 100)}${prompt.length > 100 ? '...' : ''}"`
      });
      
      console.log(`💾 Image générée sauvegardée et ajoutée à la collection: ${filename}`);
    } catch (error) {
      console.warn('⚠️ Impossible de sauvegarder l\'image générée à la collection courante:', error.message);
    }

    return imageUrl;
  } catch (error) {
    console.error('❌ Erreur lors de la génération de l\'image:', error.message);
    throw error;
  }
}

/**
 * Transforme une image existante avec le pipeline img2img
 * @param {Object} params - Paramètres de transformation
 * @param {string} params.imageUrl - URL de l'image source
 * @param {string} params.prompt - Prompt de transformation
 * @param {number} [params.strength=0.7] - Force de transformation (0-1)
 * @param {string} [params.negativePrompt] - Prompt négatif
 * @param {number} [params.guidance=3.5] - Guidance scale
 * @param {number} [params.numInferenceSteps=35] - Nombre d'étapes
 * @param {string} [params.outputFormat='jpg'] - Format de sortie
 * @param {boolean} [params.disableSafetyChecker=true] - Désactiver le safety checker
 * @returns {Promise<string>} - URL de l'image transformée
 */
export async function transformImage({
  imageUrl,
  prompt,
  strength = 0.7,
  negativePrompt = 'blurry, low quality, distorted',
  guidance = 3.5,
  numInferenceSteps = 35,
  outputFormat = 'jpg',
  disableSafetyChecker = true,
}) {
  try {
    if (!imageUrl || !prompt) {
      throw new Error('Image URL et prompt sont requis');
    }

    if (!process.env.REPLICATE_API_TOKEN) {
      throw new Error('REPLICATE_API_TOKEN non configuré');
    }

    console.log('🔄 Transformation d\'image avec Qwen-Image (img2img)...');
    console.log('Image source:', imageUrl);
    console.log('Transformation:', prompt);

    const input = {
      image: imageUrl,
      prompt: prompt,
      strength: strength,
      negative_prompt: negativePrompt,
      guidance: guidance,
      num_inference_steps: numInferenceSteps,
      output_format: outputFormat,
      disable_safety_checker: disableSafetyChecker,
      go_fast: true,
    };

    console.log('⏱️  Timeout: 10 minutes maximum');
    const output = await replicate.run(
      'qwen/qwen-image',
      { 
        input,
        ...DEFAULT_REPLICATE_OPTIONS
      }
    );

    // Traiter la sortie
    let imageUrl_result = '';
    if (Array.isArray(output) && output.length > 0) {
      const firstItem = output[0];
      if (typeof firstItem === 'object' && firstItem.url) {
        imageUrl_result = firstItem.url();
      } else if (typeof firstItem === 'string') {
        imageUrl_result = firstItem;
      } else {
        imageUrl_result = String(firstItem);
      }
    } else if (typeof output === 'string') {
      imageUrl_result = output;
    } else {
      throw new Error('Format de sortie inattendu du modèle');
    }

    console.log('✅ Image transformée:', imageUrl_result);

    // Télécharger et ajouter l'image transformée à la collection courante
    try {
      console.log('📥 Téléchargement et sauvegarde de l\'image transformée...');
      
      // Télécharger l'image
      const response = await fetch(imageUrl_result);
      if (!response.ok) {
        throw new Error(`Erreur téléchargement: ${response.status} ${response.statusText}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const extension = getFileExtension(response.headers.get('content-type') || 'image/png');
      const filename = generateUniqueFileName(extension);
      
      // Sauvegarder localement
      const savedFile = saveMediaFile(filename, buffer);
      
      // Extraire l'UUID depuis le nom de fichier pour le mediaId
      const mediaId = filename.replace(/\.[^.]+$/, '');
      
      // Ajouter l'image sauvegardée à la collection (URL relative)
      await addImageToCurrentCollection({
        url: `/medias/${filename}`, // URL relative
        mediaId: mediaId, // UUID de l'image
        description: `Image transformée : "${prompt.substring(0, 100)}${prompt.length > 100 ? '...' : ''}"`
      });
      
      console.log(`💾 Image transformée sauvegardée et ajoutée à la collection: ${filename}`);
    } catch (error) {
      console.warn('⚠️ Impossible de sauvegarder l\'image transformée à la collection courante:', error.message);
    }

    return imageUrl_result;
  } catch (error) {
    console.error('❌ Erreur lors de la transformation de l\'image:', error.message);
    throw error;
  }
}

/**
 * Vérifie si le service Replicate est configuré
 * @returns {boolean}
 */
export function isReplicateConfigured() {
  return !!process.env.REPLICATE_API_TOKEN && 
         process.env.REPLICATE_API_TOKEN !== 'your_replicate_api_token_here';
}

/**
 * Valide les paramètres de génération
 * @param {Object} params - Paramètres à valider
 * @returns {Object} - Objet avec isValid et errors
 */
export function validateGenerationParams(params) {
  const errors = [];

  if (!params.prompt || params.prompt.trim() === '') {
    errors.push('Le prompt est requis');
  }

  if (params.guidance !== undefined) {
    if (params.guidance < 0 || params.guidance > 10) {
      errors.push('guidance doit être entre 0 et 10');
    }
  }

  if (params.numInferenceSteps !== undefined) {
    if (params.numInferenceSteps < 1 || params.numInferenceSteps > 50) {
      errors.push('numInferenceSteps doit être entre 1 et 50');
    }
  }

  if (params.aspectRatio !== undefined) {
    const validRatios = ['1:1', '16:9', '9:16', '4:3', '3:4', '3:2', '2:3'];
    if (!validRatios.includes(params.aspectRatio)) {
      errors.push(`aspectRatio doit être l'un de: ${validRatios.join(', ')}`);
    }
  }

  if (params.outputQuality !== undefined) {
    if (params.outputQuality < 0 || params.outputQuality > 100) {
      errors.push('outputQuality doit être entre 0 et 100');
    }
  }

  if (params.strength !== undefined) {
    if (params.strength < 0 || params.strength > 1) {
      errors.push('strength doit être entre 0 et 1');
    }
  }

  return {
    isValid: errors.length === 0,
    errors: errors,
  };
}
