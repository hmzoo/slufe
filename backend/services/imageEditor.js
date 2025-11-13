import Replicate from 'replicate';
import fetch from 'node-fetch';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { DEFAULT_REPLICATE_OPTIONS } from '../config/replicate.js';
import { EDIT_DEFAULTS, IMAGE_DEFAULTS } from '../config/defaults.js';
import { addImageToCurrentCollection } from './collectionManager.js';
import { saveMediaFile, getFileExtension, generateUniqueFileName, getMediasDir } from '../utils/fileUtils.js';

// Calculer __dirname pour les modules ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

  // Debug: Afficher les paramètres reçus
  console.log('🔍 Validation imageEditor - Paramètres reçus:', {
    hasImage1: !!params.image1,
    hasImage2: !!params.image2,
    hasImage3: !!params.image3,
    image1Type: typeof params.image1,
    image1Value: params.image1,
    allKeys: Object.keys(params)
  });

  // Validation des images - nouveau format avec image1, image2, image3
  const images = [];
  
  // Vérifier image1 (obligatoire)
  if (!params.image1) {
    console.log('❌ image1 manquante dans validation');
    errors.push('image1 est requise');
  } else {
    if (typeof params.image1 !== 'string' && !Buffer.isBuffer(params.image1)) {
      errors.push('image1 doit être une URL string ou un Buffer');
    }
    if (typeof params.image1 === 'string' && 
        !params.image1.startsWith('http://') && 
        !params.image1.startsWith('https://') && 
        !params.image1.startsWith('/medias/') && 
        !params.image1.startsWith('data:')) {
      errors.push('image1 doit être une URL valide (http/https), un chemin local (/medias/), ou une data URI');
    }
    images.push(params.image1);
  }
  
  // Vérifier image2 (optionnelle)
  if (params.image2) {
    if (typeof params.image2 !== 'string' && !Buffer.isBuffer(params.image2)) {
      errors.push('image2 doit être une URL string ou un Buffer');
    }
    if (typeof params.image2 === 'string' && 
        !params.image2.startsWith('http://') && 
        !params.image2.startsWith('https://') && 
        !params.image2.startsWith('/medias/') && 
        !params.image2.startsWith('data:')) {
      errors.push('image2 doit être une URL valide (http/https), un chemin local (/medias/), ou une data URI');
    }
    images.push(params.image2);
  }
  
  // Vérifier image3 (optionnelle)
  if (params.image3) {
    if (typeof params.image3 !== 'string' && !Buffer.isBuffer(params.image3)) {
      errors.push('image3 doit être une URL string ou un Buffer');
    }
    if (typeof params.image3 === 'string' && 
        !params.image3.startsWith('http://') && 
        !params.image3.startsWith('https://') && 
        !params.image3.startsWith('/medias/') && 
        !params.image3.startsWith('data:')) {
      errors.push('image3 doit être une URL valide (http/https), un chemin local (/medias/), ou une data URI');
    }
    images.push(params.image3);
  }
  
  // Mettre à jour params.images pour compatibilité avec le reste du code
  params.images = images;

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
 * @param {string} [params.image1] - URL ou data URI de la première image (requise)
 * @param {string} [params.image2] - URL ou data URI de la deuxième image (optionnelle)
 * @param {string} [params.image3] - URL ou data URI de la troisième image (optionnelle)
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
  image1,
  image2,
  image3,
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
    image1,
    image2,
    image3,
    aspectRatio,
    outputFormat,
    outputQuality,
    seed
  });

  if (!validation.valid) {
    throw new Error(`Paramètres invalides: ${validation.errors.join(', ')}`);
  }

  // Construire le tableau d'images à partir des paramètres individuels
  const images = [];
  if (image1) images.push(image1);
  if (image2) images.push(image2);  
  if (image3) images.push(image3);

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

    // Convertir les Buffers et URLs locales en data URIs si nécessaire
    const processedImages = await Promise.all(images.map(async (img, index) => {
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
      // Si c'est un chemin local /medias/..., le lire et le convertir en data URI
      if (typeof img === 'string' && img.startsWith('/medias/')) {
        console.log(`📁 Lecture du fichier local ${index + 1}: ${img}`);
        try {
          // Construire le chemin absolu vers le fichier en utilisant getMediasDir()
          const mediasDir = getMediasDir();
          const filename = img.replace('/medias/', '');
          const fullPath = path.join(mediasDir, filename);
          console.log(`📂 Chemin complet: ${fullPath}`);
          
          // Lire le fichier
          const buffer = await fs.readFile(fullPath);
          
          // Déterminer le mimeType depuis l'extension
          const ext = path.extname(img).toLowerCase();
          const mimeTypes = {
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.webp': 'image/webp',
            '.gif': 'image/gif'
          };
          const mimeType = mimeTypes[ext] || 'image/jpeg';
          
          const base64 = buffer.toString('base64');
          console.log(`✅ Fichier ${index + 1} lu et converti (${Math.round(buffer.length / 1024)}KB)`);
          return `data:${mimeType};base64,${base64}`;
        } catch (error) {
          console.error(`❌ Erreur lecture fichier ${index + 1}:`, error.message);
          throw new Error(`Impossible de lire le fichier local: ${error.message}`);
        }
      }
      // Si c'est une URL locale, la télécharger et la convertir en data URI
      if (typeof img === 'string' && img.startsWith('http://localhost:')) {
        console.log(`🌐 Téléchargement de l'image locale ${index + 1}: ${img}`);
        try {
          const response = await fetch(img);
          if (!response.ok) {
            throw new Error(`Erreur téléchargement: ${response.status}`);
          }
          
          const arrayBuffer = await response.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          const contentType = response.headers.get('content-type') || 'image/jpeg';
          const base64 = buffer.toString('base64');
          
          console.log(`✅ Image ${index + 1} téléchargée et convertie (${Math.round(buffer.length / 1024)}KB)`);
          return `data:${contentType};base64,${base64}`;
        } catch (error) {
          console.error(`❌ Erreur téléchargement image ${index + 1}:`, error.message);
          throw new Error(`Impossible de télécharger l'image locale: ${error.message}`);
        }
      }
      return img; // Déjà une URL ou data URI
    }));

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

    // Télécharger les images et les ajouter à la collection courante
    try {
      for (const imageUrl of imageUrls) {
        console.log('📥 Téléchargement et sauvegarde de l\'image éditée...');
        
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
          description: `Image éditée : "${prompt.substring(0, 100)}${prompt.length > 100 ? '...' : ''}"`
        });
        
        console.log(`💾 Image éditée sauvegardée et ajoutée à la collection: ${filename}`);
      }
      console.log(`📚 ${imageUrls.length} image(s) éditée(s) sauvegardée(s) et ajoutée(s) à la collection courante`);
    } catch (error) {
      console.warn('⚠️ Impossible de sauvegarder les images éditées à la collection courante:', error.message);
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
    image1: imageUrl,
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
