import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';

/**
 * Génère un nom de fichier unique pour les médias
 * @param {string} originalExtension - Extension originale (ex: '.jpg', '.png', '.mp4')
 * @returns {string} Nom de fichier unique (ex: 'a1b2c3d4-e5f6-7890.jpg')
 */
function generateUniqueMediaName(originalExtension) {
  const uuid = uuidv4();
  const ext = originalExtension.startsWith('.') ? originalExtension : `.${originalExtension}`;
  return `${uuid}${ext}`;
}

/**
 * Obtient le chemin complet d'un fichier média
 * @param {string} filename - Nom du fichier (ex: 'a1b2c3d4.jpg')
 * @returns {string} Chemin complet vers le fichier
 */
function getMediaPath(filename) {
  return path.join(process.cwd(), 'medias', filename);
}

/**
 * Obtient l'URL publique d'un fichier média
 * @param {string} filename - Nom du fichier
 * @returns {string} URL relative (ex: '/medias/filename.jpg')
 */
function getMediaUrl(filename) {
  return `/medias/${filename}`;
}

/**
 * Sauvegarde un buffer dans le dossier medias
 * @param {Buffer} buffer - Buffer du fichier
 * @param {string} extension - Extension (.jpg, .png, etc.)
 * @returns {Promise<{filename: string, path: string, url: string}>}
 */
async function saveMediaFile(buffer, extension) {
  // Générer un nom unique
  const filename = generateUniqueMediaName(extension);
  const filePath = getMediaPath(filename);
  
  // S'assurer que le dossier medias existe
  const mediasDir = path.dirname(filePath);
  if (!fs.existsSync(mediasDir)) {
    fs.mkdirSync(mediasDir, { recursive: true });
  }
  
  // Sauvegarder le fichier
  await fs.promises.writeFile(filePath, buffer);
  
  return {
    filename,
    path: filePath,
    url: getMediaUrl(filename)
  };
}

/**
 * Obtient le chemin complet d'un workflow
 * @param {string} workflowId - ID du workflow
 * @returns {string} Chemin vers le fichier JSON du workflow
 */
function getWorkflowPath(workflowId) {
  return path.join(process.cwd(), 'workflows', `${workflowId}.json`);
}

/**
 * Obtient l'URL publique d'un workflow
 * @param {string} workflowId - ID du workflow
 * @returns {string} URL relative vers le workflow JSON
 */
function getWorkflowUrl(workflowId) {
  return `/workflows/${workflowId}.json`;
}

/**
 * Sauvegarde un workflow dans le dossier workflows
 * @param {string} workflowId - ID unique du workflow
 * @param {Object} workflowData - Données du workflow
 * @returns {Promise<{filename: string, path: string, url: string}>}
 */
async function saveWorkflowFile(workflowId, workflowData) {
  const filename = `${workflowId}.json`;
  const filePath = getWorkflowPath(workflowId);
  
  // S'assurer que le dossier workflows existe
  const workflowsDir = path.dirname(filePath);
  if (!fs.existsSync(workflowsDir)) {
    fs.mkdirSync(workflowsDir, { recursive: true });
  }
  
  // Sauvegarder le workflow
  await fs.promises.writeFile(filePath, JSON.stringify(workflowData, null, 2));
  
  return {
    filename,
    path: filePath,
    url: getWorkflowUrl(workflowId)
  };
}

export {
  generateUniqueMediaName,
  getMediaPath,
  getMediaUrl,
  saveMediaFile,
  getWorkflowPath,
  getWorkflowUrl,
  saveWorkflowFile
};