import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';

// =============================================
// CHEMINS CENTRALISÉS - Tous dans /data/
// =============================================

/**
 * Retourne le dossier de base pour tous les données
 */
export function getDataDir() {
  return path.join(process.cwd(), 'data');
}

/**
 * Retourne le dossier des médias
 */
export function getMediasDir() {
  return path.join(getDataDir(), 'medias');
}

/**
 * Retourne le dossier des collections
 */
export function getCollectionsDir() {
  return path.join(getDataDir(), 'collections');
}

/**
 * Retourne le dossier des templates
 */
export function getTemplatesDir() {
  return path.join(getDataDir(), 'templates');
}

/**
 * Retourne le dossier des workflows
 */
export function getWorkflowsDir() {
  return path.join(getDataDir(), 'workflows');
}

/**
 * Génère un nom de fichier unique basé sur UUID
 * @param {string} originalExtension - Extension du fichier (avec ou sans point)
 * @returns {string} Nom de fichier unique
 */
export function generateUniqueFileName(originalExtension) {
  // Nettoyer l'extension (s'assurer qu'elle commence par un point)
  const ext = originalExtension.startsWith('.') ? originalExtension : `.${originalExtension}`;
  
  // Générer UUID et ajouter l'extension
  return `${uuidv4()}${ext}`;
}

/**
 * Extrait l'extension d'un nom de fichier ou d'un type MIME
 * @param {string} filename - Nom de fichier ou type MIME
 * @returns {string} Extension avec le point
 */
export function getFileExtension(filename) {
  if (filename.includes('/')) {
    // C'est un type MIME
    const mimeToExt = {
      'image/jpeg': '.jpg',
      'image/jpg': '.jpg',
      'image/png': '.png',
      'image/gif': '.gif',
      'image/webp': '.webp',
      'image/bmp': '.bmp',
      'image/svg+xml': '.svg',
      'video/mp4': '.mp4',
      'video/webm': '.webm',
      'video/ogg': '.ogg',
      'video/avi': '.avi',
      'video/mov': '.mov'
    };
    return mimeToExt[filename] || '.bin';
  } else {
    // C'est un nom de fichier
    const ext = path.extname(filename);
    return ext || '.bin';
  }
}

/**
 * Vérifie si un fichier existe dans le dossier medias
 * @param {string} filename - Nom du fichier
 * @returns {boolean} True si le fichier existe
 */
export function mediaFileExists(filename) {
  const filePath = path.join(getMediasDir(), filename);
  return fs.existsSync(filePath);
}

/**
 * Retourne le chemin complet vers un fichier dans le dossier medias
 * @param {string} filename - Nom du fichier
 * @returns {string} Chemin complet
 */
export function getMediaFilePath(filename) {
  return path.join(getMediasDir(), filename);
}

/**
 * Retourne l'URL relative vers un fichier média
 * @param {string} filename - Nom du fichier
 * @returns {string} URL relative
 */
export function getMediaFileUrl(filename) {
  return `/medias/${filename}`;
}

/**
 * Sauvegarde un buffer dans le dossier medias avec un nom spécifique
 * @param {string} filename - Nom du fichier (avec extension)
 * @param {Buffer} buffer - Données du fichier
 * @returns {string} Chemin complet du fichier sauvegardé
 */
export function saveMediaFile(filename, buffer) {
  const filePath = getMediaFilePath(filename);
  
  // S'assurer que le dossier medias existe
  const mediaDir = path.dirname(filePath);
  if (!fs.existsSync(mediaDir)) {
    fs.mkdirSync(mediaDir, { recursive: true });
  }
  
  // Écrire le fichier
  fs.writeFileSync(filePath, buffer);
  
  return {
    filename: filename,
    filePath: filePath,
    url: `/medias/${filename}`  // URL relative cohérente avec le reste du système
  };
}