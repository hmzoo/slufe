import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import { saveMediaFile, getFileExtension } from '../utils/fileUtils.js';

/**
 * Service de redimensionnement et recadrage d'images
 * Utilise Sharp pour des opérations d'images performantes
 */

/**
 * Convertit un ratio string en dimensions
 * @param {string} ratio - Format "width:height" ou "keep"
 * @param {number} originalWidth - Largeur originale
 * @param {number} originalHeight - Hauteur originale
 * @returns {Object} { width, height } ou null si "keep"
 */
function parseRatio(ratio, originalWidth, originalHeight) {
  if (ratio === 'keep') {
    return null; // Garder le ratio original
  }

  const ratioMap = {
    '1:1': { w: 1, h: 1 },
    '16:9': { w: 16, h: 9 },
    '9:16': { w: 9, h: 16 },
    '4:3': { w: 4, h: 3 },
    '3:4': { w: 3, h: 4 },
    '3:2': { w: 3, h: 2 },
    '2:3': { w: 2, h: 3 }
  };

  if (!ratioMap[ratio]) {
    throw new Error(`Ratio non supporté: ${ratio}`);
  }

  return ratioMap[ratio];
}

/**
 * Calcule les nouvelles dimensions basées sur les contraintes
 * @param {Object} params - Paramètres de calcul
 * @param {number} params.originalWidth - Largeur originale
 * @param {number} params.originalHeight - Hauteur originale
 * @param {number} params.hMax - Largeur maximale
 * @param {number} params.vMax - Hauteur maximale
 * @param {string} params.targetRatio - Ratio cible
 * @returns {Object} Nouvelles dimensions { width, height, needsCrop }
 */
function calculateDimensions({ originalWidth, originalHeight, hMax, vMax, targetRatio }) {
  let targetWidth = originalWidth;
  let targetHeight = originalHeight;
  let needsCrop = false;

  // Si un ratio spécifique est demandé
  if (targetRatio && targetRatio !== 'keep') {
    const ratio = parseRatio(targetRatio, originalWidth, originalHeight);
    if (ratio) {
      const aspectRatio = ratio.w / ratio.h;
      
      // Forcer le recadrage pour respecter le ratio exact
      needsCrop = true;
      
      // Calculer les dimensions finales en respectant les contraintes
      if (hMax / vMax > aspectRatio) {
        // Contrainte par la hauteur
        targetHeight = vMax;
        targetWidth = Math.round(vMax * aspectRatio);
      } else {
        // Contrainte par la largeur
        targetWidth = hMax;
        targetHeight = Math.round(hMax / aspectRatio);
      }
    }
  } else {
    // Mode "keep" - redimensionnement proportionnel simple
    const scaleH = hMax / originalWidth;
    const scaleV = vMax / originalHeight;
    const scale = Math.min(scaleH, scaleV, 1); // Ne pas agrandir si l'image est plus petite
    
    targetWidth = Math.round(originalWidth * scale);
    targetHeight = Math.round(originalHeight * scale);
    needsCrop = false;
  }

  return {
    width: targetWidth,
    height: targetHeight,
    needsCrop
  };
}

/**
 * Détermine la position de recadrage
 * @param {string} cropCenter - Position du recadrage
 * @param {Object} dimensions - Dimensions actuelles et cibles
 * @returns {Object} Position { left, top }
 */
function getCropPosition(cropCenter, { originalWidth, originalHeight, targetWidth, targetHeight }) {
  // Calculer les dimensions de recadrage nécessaires pour obtenir le ratio cible
  const ratio = targetWidth / targetHeight;
  
  let cropWidth, cropHeight, left, top;
  
  // Déterminer quelle dimension utiliser comme base
  if (originalWidth / originalHeight > ratio) {
    // Image plus large - recadrer la largeur
    cropHeight = originalHeight;
    cropWidth = Math.round(originalHeight * ratio);
  } else {
    // Image plus haute - recadrer la hauteur  
    cropWidth = originalWidth;
    cropHeight = Math.round(originalWidth / ratio);
  }
  
  // Calculer la position du recadrage
  const cropX = Math.max(0, (originalWidth - cropWidth) / 2);
  const cropY = Math.max(0, (originalHeight - cropHeight) / 2);

  switch (cropCenter) {
    case 'top':
      left = Math.round(cropX);
      top = 0;
      break;
    
    case 'bottom':
      left = Math.round(cropX);
      top = Math.max(0, originalHeight - cropHeight);
      break;
    
    case 'head':
      // Pour les portraits, recadrer vers le haut (25% du haut)
      left = Math.round(cropX);
      top = Math.round(cropY * 0.5); // Plus vers le haut
      break;
    
    case 'center':
    default:
      left = Math.round(cropX);
      top = Math.round(cropY);
      break;
  }

  return { 
    left, 
    top, 
    width: cropWidth, 
    height: cropHeight 
  };
}

/**
 * Service principal de redimensionnement et recadrage
 * @param {Object} params - Paramètres du service
 * @param {Buffer|string} params.image - Buffer d'image ou chemin vers l'image
 * @param {number} [params.h_max=1024] - Largeur maximale
 * @param {number} [params.v_max=1024] - Hauteur maximale
 * @param {string} [params.ratio="keep"] - Ratio cible
 * @param {string} [params.crop_center="center"] - Position de recadrage
 * @returns {Object} Résultat avec l'image traitée
 */
export async function resizeCropImage({
  image,
  h_max = 1024,
  v_max = 1024,
  ratio = "keep",
  crop_center = "center"
}) {
  try {
    global.logWorkflow('🔧 Début du redimensionnement/recadrage d\'image', {
      h_max,
      v_max,
      ratio,
      crop_center,
      imageType: typeof image
    });

    // Créer l'instance Sharp
    let sharpImage;
    let imageBuffer;
    
    if (Buffer.isBuffer(image)) {
      imageBuffer = image;
    } else if (typeof image === 'string' && image.startsWith('http')) {
      // URL HTTP - télécharger l'image
      global.logWorkflow('🌐 Téléchargement image depuis URL', {
        url: image
      });
      
      try {
        const response = await fetch(image);
        if (!response.ok) {
          throw new Error(`Erreur HTTP ${response.status}: ${response.statusText}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        imageBuffer = Buffer.from(arrayBuffer);
        
        global.logWorkflow('✅ Image téléchargée', {
          size: imageBuffer.length,
          contentType: response.headers.get('content-type')
        });
      } catch (error) {
        throw new Error(`Erreur de téléchargement: ${error.message}`);
      }
    } else if (typeof image === 'string' && !image.includes('/')) {
      // Nom de fichier simple - convertir en URL du serveur local
      const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
      const host = process.env.HOST || 'localhost';
      const port = process.env.PORT || 3000;
      const baseUrl = process.env.NODE_ENV === 'production' 
        ? `${protocol}://${host}` 
        : `${protocol}://${host}:${port}`;
      
      const imageUrl = `${baseUrl}/medias/${image}`;
      
      global.logWorkflow('🔗 Conversion nom fichier en URL serveur', {
        filename: image,
        url: imageUrl
      });
      
      try {
        const response = await fetch(imageUrl);
        if (!response.ok) {
          throw new Error(`Erreur HTTP ${response.status}: ${response.statusText}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        imageBuffer = Buffer.from(arrayBuffer);
        
        global.logWorkflow('✅ Image téléchargée depuis serveur', {
          size: imageBuffer.length,
          contentType: response.headers.get('content-type')
        });
      } catch (error) {
        throw new Error(`Erreur de téléchargement depuis serveur: ${error.message}`);
      }
    } else if (typeof image === 'string') {
      imageBuffer = image; // Chemin de fichier local ou URL complète
    } else if (Array.isArray(image) && image.length > 0) {
      // Si on reçoit un array, prendre le premier élément
      global.logWorkflow('📋 Array d\'images reçu, prise du premier élément', {
        arrayLength: image.length
      });
      const firstImage = image[0];
      global.logWorkflow('🔍 Structure du premier élément', {
        type: typeof firstImage,
        isBuffer: Buffer.isBuffer(firstImage),
        keys: firstImage && typeof firstImage === 'object' ? Object.keys(firstImage) : 'non-object',
        hasBuffer: firstImage && firstImage.buffer !== undefined,
        bufferType: firstImage && firstImage.buffer ? typeof firstImage.buffer : 'undefined'
      });
      if (firstImage && firstImage.buffer && Buffer.isBuffer(firstImage.buffer)) {
        imageBuffer = firstImage.buffer;
        global.logWorkflow('📁 Image extraite du premier élément de l\'array', {
          filename: firstImage.originalName || 'unknown',
          mimetype: firstImage.mimeType || 'unknown',
          size: firstImage.buffer.length
        });
      } else {
        throw new Error('Premier élément de l\'array invalide. Propriété buffer manquante.');
      }
    } else if (image && typeof image === 'object') {
      // Gestion des objets file du WorkflowRunner
      if (image.buffer && Buffer.isBuffer(image.buffer)) {
        imageBuffer = image.buffer;
        global.logWorkflow('📁 Image extraite de l\'objet file', {
          filename: image.originalName || 'unknown',
          mimetype: image.mimeType || 'unknown',
          size: image.buffer.length
        });
      } else if (image.path && typeof image.path === 'string') {
        imageBuffer = image.path;
      } else {
        throw new Error('Objet image invalide. Propriétés buffer ou path manquantes.');
      }
    } else {
      throw new Error('Format d\'image non supporté. Utilisez un Buffer, une URL ou un objet file.');
    }
    
    sharpImage = sharp(imageBuffer);

    // Obtenir les métadonnées de l'image originale
    const metadata = await sharpImage.metadata();
    const { width: originalWidth, height: originalHeight, format } = metadata;

    global.logWorkflow('📊 Métadonnées de l\'image originale', {
      originalWidth,
      originalHeight,
      format,
      size: `${Math.round(metadata.size / 1024)}KB`
    });

    // Calculer les nouvelles dimensions
    const dimensions = calculateDimensions({
      originalWidth,
      originalHeight,
      hMax: h_max,
      vMax: v_max,
      targetRatio: ratio
    });

    global.logWorkflow('📐 Dimensions calculées', dimensions);

    // Traitement de l'image
    let processedImage = sharpImage;

    // Si recadrage nécessaire
    if (dimensions.needsCrop && ratio !== 'keep') {
      const cropPosition = getCropPosition(crop_center, {
        originalWidth,
        originalHeight,
        targetWidth: dimensions.width,
        targetHeight: dimensions.height
      });

      global.logWorkflow('✂️ Recadrage appliqué', {
        position: { left: cropPosition.left, top: cropPosition.top },
        cropSize: `${cropPosition.width}x${cropPosition.height}`,
        finalSize: `${dimensions.width}x${dimensions.height}`
      });

      // D'abord recadrer à la bonne zone
      processedImage = processedImage.extract({
        left: cropPosition.left,
        top: cropPosition.top,
        width: cropPosition.width,
        height: cropPosition.height
      });
      
      // Puis redimensionner au format final si nécessaire
      const finalWidth = Math.round(dimensions.width);
      const finalHeight = Math.round(dimensions.height);
      
      if (cropPosition.width !== finalWidth || cropPosition.height !== finalHeight) {
        processedImage = processedImage.resize(finalWidth, finalHeight, {
          fit: 'fill', // Remplit exactement les dimensions
          withoutEnlargement: false
        });
      }
    } else {
      // Redimensionnement simple sans recadrage
      const finalWidth = Math.round(dimensions.width);
      const finalHeight = Math.round(dimensions.height);
      
      processedImage = processedImage.resize(finalWidth, finalHeight, {
        fit: 'inside', // Préserve le ratio
        withoutEnlargement: false
      });
    }

    // Générer l'image en buffer
    const outputBuffer = await processedImage.toBuffer();
    
    // Sauvegarder dans le dossier medias avec nom unique
    const extension = format || 'jpg';
    const filename = `${uuidv4()}.${extension}`;
    const savedFile = await saveMediaFile(filename, outputBuffer);

    // Obtenir les métadonnées finales
    const finalMetadata = await sharp(outputBuffer).metadata();
    
    // Construire l'URL complète pour la compatibilité production
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
    const host = process.env.HOST || 'localhost';
    const port = process.env.PORT || 3000;
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? `${protocol}://${host}` 
      : `${protocol}://${host}:${port}`;
    
    const result = {
      success: true,
      image_filename: savedFile.filename,
      image_path: savedFile.filePath,
      image_url: savedFile.url,
      image: savedFile.url, // Compatibilité avec frontend
      original_dimensions: {
        width: originalWidth,
        height: originalHeight
      },
      final_dimensions: {
        width: finalMetadata.width,
        height: finalMetadata.height
      },
      applied_operations: {
        resized: dimensions.width !== originalWidth || dimensions.height !== originalHeight,
        cropped: dimensions.needsCrop,
        ratio_changed: ratio !== 'keep',
        crop_position: crop_center
      },
      file_info: {
        filename: savedFile.filename,
        format: finalMetadata.format,
        size_bytes: finalMetadata.size,
        size_kb: Math.round(finalMetadata.size / 1024)
      }
    };

    global.logWorkflow('✅ Redimensionnement/recadrage terminé', {
      originalSize: `${originalWidth}x${originalHeight}`,
      finalSize: `${finalMetadata.width}x${finalMetadata.height}`,
      operations: result.applied_operations,
      outputFile: savedFile.filename,
      url: savedFile.url
    });

    return result;

  } catch (error) {
    global.logWorkflow('❌ Erreur lors du redimensionnement/recadrage', {
      error: error.message,
      stack: error.stack
    });

    throw new Error(`Erreur de traitement d'image: ${error.message}`);
  }
}

/**
 * Valide les paramètres d'entrée
 * @param {Object} params - Paramètres à valider
 * @returns {Object} { isValid, errors }
 */
export function validateResizeCropParams(params) {
  const errors = [];
  
  if (!params.image) {
    errors.push('Image requise');
  }

  if (params.h_max && (typeof params.h_max !== 'number' || params.h_max <= 0)) {
    errors.push('h_max doit être un nombre positif');
  }

  if (params.v_max && (typeof params.v_max !== 'number' || params.v_max <= 0)) {
    errors.push('v_max doit être un nombre positif');
  }

  const validRatios = ['keep', '1:1', '16:9', '9:16', '4:3', '3:4', '3:2', '2:3'];
  if (params.ratio && !validRatios.includes(params.ratio)) {
    errors.push(`Ratio invalide. Valeurs acceptées: ${validRatios.join(', ')}`);
  }

  const validCropPositions = ['center', 'top', 'bottom', 'head'];
  if (params.crop_center && !validCropPositions.includes(params.crop_center)) {
    errors.push(`Position de recadrage invalide. Valeurs acceptées: ${validCropPositions.join(', ')}`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

export default {
  resizeCropImage,
  validateResizeCropParams
};