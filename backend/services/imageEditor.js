import Replicate from 'replicate';
import { DEFAULT_REPLICATE_OPTIONS } from '../config/replicate.js';
import { EDIT_DEFAULTS, IMAGE_DEFAULTS } from '../config/defaults.js';

/**
 * Service d'édition d'images avec Qwen Image Edit Plus
 * Permet d'éditer des images avec des instructions textuelles
 * Supporte une ou plusieurs images en entrée
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
 * Valide les paramètres d'édition d'image
 */
export function validateEditParams(params) {
  const errors = [];

  // Validation du prompt
  if (!params.prompt || typeof params.prompt !== 'string' || !params.prompt.trim()) {
    errors.push('Le prompt est requis et doit être une chaîne non vide');
  }

  // Validation des images
  if (!params.images || !Array.isArray(params.images) || params.images.length === 0) {
    errors.push('Au moins une image est requise');
  } else {
    // Vérifier que toutes les images sont des URLs valides ou des buffers
    params.images.forEach((img, index) => {
      if (typeof img !== 'string' && !Buffer.isBuffer(img)) {
        errors.push(`Image ${index + 1} doit être une URL string ou un Buffer`);
      }
      if (typeof img === 'string' && !img.startsWith('http://') && !img.startsWith('https://') && !img.startsWith('data:')) {
        errors.push(`Image ${index + 1} doit être une URL valide (http/https) ou une data URI`);
      }
    });
  }

  // Validation de aspect_ratio
  const validAspectRatios = ['1:1', '16:9', '9:16', '4:3', '3:4', 'match_input_image'];
  if (params.aspectRatio && !validAspectRatios.includes(params.aspectRatio)) {
    errors.push(`aspectRatio doit être l'un de: ${validAspectRatios.join(', ')}`);
  }

  // Validation de output_format
  const validFormats = ['webp', 'jpg', 'png'];
  if (params.outputFormat && !validFormats.includes(params.outputFormat)) {
    errors.push(`outputFormat doit être l'un de: ${validFormats.join(', ')}`);
  }

  // Validation de output_quality
  if (params.outputQuality !== undefined) {
    const quality = parseInt(params.outputQuality);
    if (isNaN(quality) || quality < 0 || quality > 100) {
      errors.push('outputQuality doit être un nombre entre 0 et 100');
    }
  }

  // Validation de seed
  if (params.seed !== undefined && params.seed !== null) {
    const seed = parseInt(params.seed);
    if (isNaN(seed) || seed < 0) {
      errors.push('seed doit être un nombre entier positif ou null');
    }
  }

  return {
    valid: errors.length === 0,
    errors: errors
  };
}

/**
 * Édite une ou plusieurs images avec des instructions textuelles
 * 
 * @param {Object} params - Paramètres d'édition
 * @param {string} params.prompt - Instructions textuelles pour l'édition
 * @param {Array<string>} params.images - URLs ou data URIs des images à éditer
 * @param {string} [params.aspectRatio='16:9'] - Ratio de l'image de sortie
 * @param {boolean} [params.goFast=true] - Mode rapide (sacrifie un peu de qualité)
 * @param {number|null} [params.seed=null] - Graine aléatoire pour reproductibilité
 * @param {string} [params.outputFormat='webp'] - Format de sortie (webp, jpg, png)
 * @param {number} [params.outputQuality=95] - Qualité de sortie (0-100)
 * @param {boolean} [params.disableSafetyChecker=true] - Désactiver le safety checker
 * @returns {Promise<Object>} - Résultat avec URLs des images éditées
 */
export async function editImage({
  prompt,
  images,
  aspectRatio = IMAGE_DEFAULTS.aspectRatio,
  goFast = true,
  seed = null,
  outputFormat = EDIT_DEFAULTS.outputFormat,
  outputQuality = EDIT_DEFAULTS.outputQuality,
  disableSafetyChecker = IMAGE_DEFAULTS.disableSafetyChecker
}) {
  // Validation des paramètres
  const validation = validateEditParams({
    prompt,
    images,
    aspectRatio,
    outputFormat,
    outputQuality,
    seed
  });

  if (!validation.valid) {
    throw new Error(`Paramètres invalides: ${validation.errors.join(', ')}`);
  }

  // Vérifier si Replicate est configuré
  if (!isReplicateConfigured()) {
    console.warn('REPLICATE_API_TOKEN non configuré - mode simulation');
    return {
      success: true,
      imageUrls: ['https://via.placeholder.com/800x600.png?text=Edited+Image+Mock'],
      mock: true,
      params: {
        prompt,
        imagesCount: images.length,
        aspectRatio,
        goFast,
        outputFormat
      }
    };
  }

  try {
    console.log('🎨 Édition d\'images avec Qwen Image Edit Plus...');
    console.log(`📝 Prompt: ${prompt}`);
    console.log(`🖼️  Images: ${images.length}`);
    console.log(`⚙️  Paramètres: aspectRatio=${aspectRatio}, goFast=${goFast}, format=${outputFormat}`);

    // Convertir les Buffers en data URIs si nécessaire
    const processedImages = images.map((img, index) => {
      if (Buffer.isBuffer(img)) {
        console.log(`📦 Conversion de l'image ${index + 1} (Buffer) en data URI...`);
        const base64 = img.toString('base64');
        // Déterminer le mimeType (par défaut webp pour les images modernes)
        return `data:image/webp;base64,${base64}`;
      }
      // Si c'est un objet avec buffer et mimeType
      if (img && typeof img === 'object' && img.buffer) {
        console.log(`📦 Conversion de l'image ${index + 1} (Object) en data URI...`);
        const mimeType = img.mimeType || 'image/jpeg';
        const base64 = img.buffer.toString('base64');
        return `data:${mimeType};base64,${base64}`;
      }
      return img; // Déjà une URL ou data URI
    });

    // Préparer les paramètres pour Replicate
    const input = {
      prompt: prompt,
      image: processedImages, // Array d'URLs ou data URIs
      aspect_ratio: aspectRatio,
      go_fast: goFast,
      output_format: outputFormat,
      output_quality: outputQuality,
      disable_safety_checker: disableSafetyChecker
    };

    // Ajouter le seed s'il est fourni
    if (seed !== null && seed !== undefined) {
      input.seed = parseInt(seed);
    }

    // Appeler Replicate avec timeout étendu
    console.log('⏱️  Timeout: 10 minutes maximum');
    const output = await replicate.run(
      "qwen/qwen-image-edit-plus",
      { 
        input,
        ...DEFAULT_REPLICATE_OPTIONS
      }
    );

    console.log('✅ Édition terminée');

    // Traiter la sortie
    // Le modèle retourne un array d'objets avec méthode .url() ou directement des strings
    let imageUrls;
    
    if (Array.isArray(output)) {
      imageUrls = output.map(item => {
        if (typeof item === 'string') {
          return item;
        } else if (item && typeof item.url === 'function') {
          return item.url();
        } else if (item && item.url) {
          return item.url;
        }
        return item;
      });
    } else if (typeof output === 'string') {
      imageUrls = [output];
    } else if (output && typeof output.url === 'function') {
      imageUrls = [output.url()];
    } else if (output && output.url) {
      imageUrls = [output.url];
    } else {
      throw new Error('Format de sortie inattendu de Replicate');
    }

    return {
      success: true,
      imageUrls: imageUrls,
      mock: false,
      params: {
        prompt,
        imagesCount: images.length,
        aspectRatio,
        goFast,
        seed,
        outputFormat,
        outputQuality
      }
    };

  } catch (error) {
    console.error('❌ Erreur lors de l\'édition d\'image:', error);
    throw new Error(`Échec de l'édition: ${error.message}`);
  }
}

/**
 * Édite une image unique (raccourci)
 */
export async function editSingleImage({
  prompt,
  imageUrl,
  aspectRatio = IMAGE_DEFAULTS.aspectRatio,
  goFast = true,
  seed = null,
  outputFormat = EDIT_DEFAULTS.outputFormat,
  outputQuality = EDIT_DEFAULTS.outputQuality,
  disableSafetyChecker = IMAGE_DEFAULTS.disableSafetyChecker
}) {
  return editImage({
    prompt,
    images: [imageUrl],
    aspectRatio,
    goFast,
    seed,
    outputFormat,
    outputQuality,
    disableSafetyChecker
  });
}

/**
 * Transfère la pose d'une image à une autre (cas d'usage spécialisé)
 */
export async function transferPose({
  poseSourceUrl,
  targetPersonUrl,
  aspectRatio = IMAGE_DEFAULTS.aspectRatio,
  outputFormat = EDIT_DEFAULTS.outputFormat
}) {
  return editImage({
    prompt: 'The person in image 2 adopts the pose from image 1',
    images: [poseSourceUrl, targetPersonUrl],
    aspectRatio,
    goFast: true,
    outputFormat
  });
}

/**
 * Applique le style d'une image à une autre (cas d'usage spécialisé)
 */
export async function transferStyle({
  styleSourceUrl,
  targetImageUrl,
  aspectRatio = IMAGE_DEFAULTS.aspectRatio,
  outputFormat = EDIT_DEFAULTS.outputFormat
}) {
  return editImage({
    prompt: 'Apply the artistic style from image 1 to image 2',
    images: [styleSourceUrl, targetImageUrl],
    aspectRatio,
    goFast: true,
    outputFormat
  });
}

export default {
  editImage,
  editSingleImage,
  transferPose,
  transferStyle,
  validateEditParams,
  isReplicateConfigured
};
