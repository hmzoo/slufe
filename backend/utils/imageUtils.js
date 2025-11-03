// import sharp from 'sharp';
let sharp = null;
try {
  sharp = (await import('sharp')).default;
} catch (error) {
  console.warn('⚠️ Sharp module not available, image processing features will be limited:', error.message);
}

/**
 * Utilitaires pour le traitement des images
 */

/**
 * Détecte l'orientation d'une image
 * @param {Buffer} imageBuffer - Buffer de l'image
 * @returns {Promise<Object>} - { width, height, orientation: 'horizontal'|'vertical'|'square', ratio }
 */
export async function detectImageOrientation(imageBuffer) {
  if (!sharp) {
    console.warn('⚠️ Sharp not available, returning default orientation');
    return {
      width: 512,
      height: 512,
      orientation: 'square',
      ratio: 1
    };
  }
  
  const metadata = await sharp(imageBuffer).metadata();
  const { width, height } = metadata;
  
  const ratio = width / height;
  let orientation;
  
  if (ratio > 1.1) {
    orientation = 'horizontal'; // Paysage
  } else if (ratio < 0.9) {
    orientation = 'vertical'; // Portrait
  } else {
    orientation = 'square'; // Carré
  }
  
  return {
    width,
    height,
    orientation,
    ratio
  };
}

/**
 * Détermine le format vidéo optimal selon l'orientation de l'image
 * @param {string} orientation - 'horizontal', 'vertical', ou 'square'
 * @returns {string} - '16:9' ou '9:16'
 */
export function getOptimalVideoFormat(orientation) {
  if (orientation === 'horizontal') {
    return '16:9';
  } else if (orientation === 'vertical') {
    return '9:16';
  } else {
    // Pour les images carrées, préférer le format portrait (mobile-friendly)
    return '9:16';
  }
}

/**
 * Recadre une image selon un ratio cible (16:9 ou 9:16)
 * Utilise un crop centré pour garder la partie la plus importante
 * 
 * @param {Buffer} imageBuffer - Buffer de l'image source
 * @param {string} targetRatio - '16:9' ou '9:16'
 * @returns {Promise<Buffer>} - Buffer de l'image recadrée
 */
export async function cropImageToRatio(imageBuffer, targetRatio) {
  if (!sharp) {
    console.warn('⚠️ Sharp not available, returning original image buffer');
    return imageBuffer;
  }
  
  const metadata = await sharp(imageBuffer).metadata();
  const { width, height } = metadata;
  
  // Calculer le ratio cible
  let targetWidth, targetHeight;
  
  if (targetRatio === '16:9') {
    // Format paysage
    const targetRatioValue = 16 / 9;
    const currentRatio = width / height;
    
    if (currentRatio > targetRatioValue) {
      // Image trop large, crop horizontal
      targetHeight = height;
      targetWidth = Math.round(height * targetRatioValue);
    } else {
      // Image trop haute, crop vertical
      targetWidth = width;
      targetHeight = Math.round(width / targetRatioValue);
    }
  } else if (targetRatio === '9:16') {
    // Format portrait
    const targetRatioValue = 9 / 16;
    const currentRatio = width / height;
    
    if (currentRatio > targetRatioValue) {
      // Image trop large, crop horizontal
      targetHeight = height;
      targetWidth = Math.round(height * targetRatioValue);
    } else {
      // Image trop haute, crop vertical
      targetWidth = width;
      targetHeight = Math.round(width / targetRatioValue);
    }
  } else {
    throw new Error(`Ratio non supporté: ${targetRatio}. Utilisez '16:9' ou '9:16'`);
  }
  
  // Calculer la position du crop (centré)
  const left = Math.round((width - targetWidth) / 2);
  const top = Math.round((height - targetHeight) / 2);
  
  console.log(`🔲 Recadrage: ${width}x${height} → ${targetWidth}x${targetHeight} (ratio ${targetRatio})`);
  console.log(`   Position: left=${left}, top=${top}`);
  
  // Effectuer le crop
  const croppedBuffer = await sharp(imageBuffer)
    .extract({
      left: Math.max(0, left),
      top: Math.max(0, top),
      width: targetWidth,
      height: targetHeight
    })
    .toBuffer();
  
  return croppedBuffer;
}

/**
 * Prépare une image pour la génération de vidéo
 * - Détecte l'orientation
 * - Choisit le format optimal (16:9 ou 9:16)
 * - Recadre l'image au bon ratio
 * 
 * @param {Buffer} imageBuffer - Buffer de l'image source
 * @param {string} [forcedRatio] - Forcer un ratio spécifique ('16:9' ou '9:16')
 * @returns {Promise<Object>} - { buffer, aspectRatio, originalSize, croppedSize, orientation }
 */
export async function prepareImageForVideo(imageBuffer, forcedRatio = null) {
  // Détecter l'orientation
  const { width, height, orientation, ratio } = await detectImageOrientation(imageBuffer);
  
  console.log(`📐 Image détectée: ${width}x${height} (${orientation}, ratio ${ratio.toFixed(2)})`);
  
  // Choisir le format optimal
  const aspectRatio = forcedRatio || getOptimalVideoFormat(orientation);
  
  console.log(`🎬 Format vidéo choisi: ${aspectRatio}`);
  
  // Recadrer l'image
  const croppedBuffer = await cropImageToRatio(imageBuffer, aspectRatio);
  
  let croppedSize;
  if (sharp) {
    const croppedMetadata = await sharp(croppedBuffer).metadata();
    croppedSize = { width: croppedMetadata.width, height: croppedMetadata.height };
  } else {
    croppedSize = { width, height }; // Utiliser les dimensions originales si sharp n'est pas disponible
  }
  
  return {
    buffer: croppedBuffer,
    aspectRatio,
    originalSize: { width, height },
    croppedSize,
    orientation,
    originalRatio: ratio
  };
}

/**
 * Prépare plusieurs images pour la génération de vidéo
 * Toutes les images sont recadrées au même format (basé sur la première image)
 * 
 * @param {Buffer[]} imageBuffers - Tableaux de buffers d'images
 * @param {string} [forcedRatio] - Forcer un ratio spécifique
 * @returns {Promise<Object>} - { buffers, aspectRatio, info }
 */
export async function prepareMultipleImagesForVideo(imageBuffers, forcedRatio = null) {
  if (!imageBuffers || imageBuffers.length === 0) {
    throw new Error('Aucune image fournie');
  }
  
  // Analyser la première image pour déterminer le format
  const firstImageInfo = await detectImageOrientation(imageBuffers[0]);
  const aspectRatio = forcedRatio || getOptimalVideoFormat(firstImageInfo.orientation);
  
  console.log(`🎬 Format vidéo commun: ${aspectRatio} (basé sur première image: ${firstImageInfo.orientation})`);
  
  // Recadrer toutes les images au même format
  const processedBuffers = [];
  const info = [];
  
  for (let i = 0; i < imageBuffers.length; i++) {
    console.log(`\n📷 Traitement image ${i + 1}/${imageBuffers.length}...`);
    const processed = await prepareImageForVideo(imageBuffers[i], aspectRatio);
    processedBuffers.push(processed.buffer);
    info.push({
      index: i,
      originalSize: processed.originalSize,
      croppedSize: processed.croppedSize,
      orientation: processed.orientation
    });
  }
  
  return {
    buffers: processedBuffers,
    aspectRatio,
    info
  };
}
