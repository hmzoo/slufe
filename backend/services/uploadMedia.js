import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { generateUniqueFileName, saveMediaFile, getMediaFileUrl, getMediasDir } from '../utils/fileUtils.js';

// Pour les imports ES6, équivalent de __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Service générique pour l'upload de médias
 * Reçoit un ou plusieurs fichiers, les sauvegarde avec des noms UUID
 * et retourne les identifiants pour utilisation dans les workflows
 */
class UploadMediaService {
  constructor() {
    // Configuration multer pour stocker les fichiers temporairement
    this.upload = multer({
      storage: multer.memoryStorage(),
      limits: {
        fileSize: 100 * 1024 * 1024, // 100MB max par fichier
        files: 10 // Max 10 fichiers simultanés
      },
      fileFilter: this.fileFilter.bind(this)
    });
  }

  /**
   * Filtre pour valider les types de fichiers
   */
  fileFilter(req, file, cb) {
    const allowedMimeTypes = {
      // Images
      'image/jpeg': '.jpg',
      'image/jpg': '.jpg',
      'image/png': '.png',
      'image/gif': '.gif',
      'image/webp': '.webp',
      'image/bmp': '.bmp',
      'image/tiff': '.tiff',
      // Vidéos
      'video/mp4': '.mp4',
      'video/avi': '.avi',
      'video/mov': '.mov',
      'video/wmv': '.wmv',
      'video/flv': '.flv',
      'video/webm': '.webm',
      'video/mkv': '.mkv',
      // Audio (pour les workflows futurs)
      'audio/mp3': '.mp3',
      'audio/wav': '.wav',
      'audio/ogg': '.ogg',
      'audio/aac': '.aac'
    };

    if (allowedMimeTypes[file.mimetype]) {
      cb(null, true);
    } else {
      cb(new Error(`Type de fichier non supporté: ${file.mimetype}`), false);
    }
  }

  /**
   * Détermine le type de média basé sur le MIME type
   */
  getMediaType(mimetype) {
    if (mimetype.startsWith('image/')) return 'image';
    if (mimetype.startsWith('video/')) return 'video';
    if (mimetype.startsWith('audio/')) return 'audio';
    return 'unknown';
  }

  /**
   * Détermine l'extension de fichier basée sur le MIME type
   */
  getFileExtension(mimetype) {
    const extensions = {
      'image/jpeg': '.jpg',
      'image/jpg': '.jpg',
      'image/png': '.png',
      'image/gif': '.gif',
      'image/webp': '.webp',
      'image/bmp': '.bmp',
      'image/tiff': '.tiff',
      'video/mp4': '.mp4',
      'video/avi': '.avi',
      'video/mov': '.mov',
      'video/wmv': '.wmv',
      'video/flv': '.flv',
      'video/webm': '.webm',
      'video/mkv': '.mkv',
      'audio/mp3': '.mp3',
      'audio/wav': '.wav',
      'audio/ogg': '.ogg',
      'audio/aac': '.aac'
    };
    return extensions[mimetype] || '.bin';
  }

  /**
   * Upload un seul fichier
   */
  async uploadSingleFile(fileBuffer, originalName, mimetype) {
    try {
      const mediaType = this.getMediaType(mimetype);
      const extension = this.getFileExtension(mimetype);
      
      // Génère un nom unique avec la bonne extension
      const uniqueFileName = generateUniqueFileName(extension);
      
      // Sauvegarde le fichier
      const savedPath = await saveMediaFile(uniqueFileName, fileBuffer);
      
      // Génère l'URL publique
      const publicUrl = getMediaFileUrl(uniqueFileName);
      
      // Retourne les métadonnées du média
      return {
        id: uniqueFileName.replace(extension, ''), // UUID sans extension
        filename: uniqueFileName,
        originalName: originalName,
        url: publicUrl,
        path: savedPath,
        type: mediaType,
        mimetype: mimetype,
        size: fileBuffer.length,
        uploadedAt: new Date().toISOString()
      };
      
    } catch (error) {
      throw new Error(`Erreur lors de l'upload du fichier ${originalName}: ${error.message}`);
    }
  }

  /**
   * Upload multiple fichiers
   */
  async uploadMultipleFiles(files) {
    try {
      const uploadedFiles = [];
      const errors = [];
      
      for (const file of files) {
        try {
          const result = await this.uploadSingleFile(
            file.buffer, 
            file.originalname, 
            file.mimetype
          );
          uploadedFiles.push(result);
        } catch (error) {
          errors.push({
            filename: file.originalname,
            error: error.message
          });
        }
      }
      
      return {
        success: true,
        uploaded: uploadedFiles,
        errors: errors,
        total: files.length,
        successful: uploadedFiles.length,
        failed: errors.length
      };
      
    } catch (error) {
      throw new Error(`Erreur lors de l'upload multiple: ${error.message}`);
    }
  }

  /**
   * Middleware multer pour un seul fichier
   */
  single(fieldName = 'file') {
    return this.upload.single(fieldName);
  }

  /**
   * Middleware multer pour plusieurs fichiers
   */
  multiple(fieldName = 'files', maxCount = 10) {
    return this.upload.array(fieldName, maxCount);
  }

  /**
   * Middleware multer pour plusieurs champs différents
   */
  fields(fieldsConfig) {
    return this.upload.fields(fieldsConfig);
  }

  /**
   * Récupère les informations d'un média par son ID
   */
  async getMediaInfo(mediaId) {
    try {
      // Cherche le fichier dans le répertoire medias
      const mediasDir = getMediasDir();
      const files = await fs.readdir(mediasDir);
      
      // Trouve le fichier correspondant à l'ID (UUID)
      const matchingFile = files.find(file => file.startsWith(mediaId));
      
      if (!matchingFile) {
        throw new Error(`Média non trouvé: ${mediaId}`);
      }
      
      const filePath = path.join(mediasDir, matchingFile);
      const stats = await fs.stat(filePath);
      const extension = path.extname(matchingFile);
      
      // Détermine le type MIME basé sur l'extension
      const mimeTypes = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.webp': 'image/webp',
        '.mp4': 'video/mp4',
        '.avi': 'video/avi',
        '.mov': 'video/mov',
        '.webm': 'video/webm'
      };
      
      const mimetype = mimeTypes[extension] || 'application/octet-stream';
      const mediaType = this.getMediaType(mimetype);
      
      return {
        id: mediaId,
        filename: matchingFile,
        url: getMediaFileUrl(matchingFile),
        path: filePath,
        type: mediaType,
        mimetype: mimetype,
        size: stats.size,
        createdAt: stats.birthtime.toISOString(),
        modifiedAt: stats.mtime.toISOString()
      };
      
    } catch (error) {
      throw new Error(`Erreur lors de la récupération du média ${mediaId}: ${error.message}`);
    }
  }

  /**
   * Supprime un média par son ID
   */
  async deleteMedia(mediaId) {
    try {
      const mediaInfo = await this.getMediaInfo(mediaId);
      await fs.unlink(mediaInfo.path);
      
      return {
        success: true,
        message: `Média ${mediaId} supprimé avec succès`
      };
      
    } catch (error) {
      throw new Error(`Erreur lors de la suppression du média ${mediaId}: ${error.message}`);
    }
  }

  /**
   * Liste tous les médias
   */
  async listAllMedias() {
    try {
      const mediasDir = getMediasDir();
      const files = await fs.readdir(mediasDir);
      
      const medias = [];
      
      for (const file of files) {
        try {
          const mediaId = path.parse(file).name;
          const mediaInfo = await this.getMediaInfo(mediaId);
          medias.push(mediaInfo);
        } catch (error) {
          // Ignore les fichiers qui ne peuvent pas être traités
        }
      }
      
      return medias.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
    } catch (error) {
      throw new Error(`Erreur lors du listage des médias: ${error.message}`);
    }
  }
}

export default new UploadMediaService();