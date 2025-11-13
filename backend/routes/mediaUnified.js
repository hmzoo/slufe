import express from 'express';
import path from 'path';
import fs from 'fs';
import uploadMediaService from '../services/uploadMedia.js';
import { 
  generateUniqueFileName, 
  getFileExtension, 
  mediaFileExists, 
  getMediaFilePath, 
  getMediaFileUrl, 
  saveMediaFile,
  getMediasDir 
} from '../utils/fileUtils.js'
import { 
  addImageToCollection,
  getCollectionById 
} from '../services/collectionManager.js';

const router = express.Router();

/**
 * API MEDIA UNIFIÉE - Gestion complète des médias
 * 
 * Endpoints disponibles:
 * - POST /upload        - Upload fichier(s) 
 * - GET /:id           - Récupérer info d'un média
 * - GET /              - Lister tous les médias
 * - DELETE /:id        - Supprimer un média
 * - POST /copy         - Copier un média
 * - POST /copy-batch   - Copier plusieurs médias
 */

// ==========================================
// UPLOAD - Ajout de nouveaux médias
// ==========================================

/**
 * Upload de médias - Endpoint unique et flexible
 * POST /api/media/upload
 * 
 * Supporte:
 * - Upload single: FormData avec 'file'
 * - Upload multiple: FormData avec 'files[]' 
 * - Upload champs: FormData avec 'image', 'video', etc.
 */
router.post('/upload', (req, res) => {
  // Détection automatique du type d'upload basé sur les champs FormData
  const handleUpload = (req, res, uploadType) => {
    uploadType(req, res, async (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          error: err.message,
          code: 'UPLOAD_ERROR'
        });
      }

      try {
        let result;

        if (req.file) {
          // Upload single
          result = await uploadMediaService.uploadSingleFile(
            req.file.buffer,
            req.file.originalname,
            req.file.mimetype
          );
          
          res.json({
            success: true,
            type: 'single',
            media: result
          });

        } else if (req.files && Array.isArray(req.files)) {
          // Upload multiple (champ files[])
          result = await uploadMediaService.uploadMultipleFiles(req.files);
          
          res.json({
            success: true,
            type: 'multiple',
            ...result
          });

        } else if (req.files && typeof req.files === 'object') {
          // Upload champs multiples (image, video, etc.)
          const results = {};
          const allUploaded = [];
          const allErrors = [];

          for (const [fieldName, files] of Object.entries(req.files)) {
            try {
              const fieldFiles = Array.isArray(files) ? files : [files];
              const fieldResult = await uploadMediaService.uploadMultipleFiles(fieldFiles);
              
              results[fieldName] = fieldResult;
              allUploaded.push(...fieldResult.uploaded);
              allErrors.push(...(fieldResult.errors || []));
            } catch (error) {
              results[fieldName] = {
                success: false,
                error: error.message
              };
              allErrors.push({
                field: fieldName,
                error: error.message
              });
            }
          }

          res.json({
            success: true,
            type: 'fields',
            results: results,
            summary: {
              total_uploaded: allUploaded.length,
              total_errors: allErrors.length,
              uploaded_medias: allUploaded,
              errors: allErrors
            }
          });

        } else {
          return res.status(400).json({
            success: false,
            error: 'Aucun fichier fourni',
            code: 'NO_FILES'
          });
        }

      } catch (error) {
        res.status(500).json({
          success: false,
          error: error.message,
          code: 'PROCESSING_ERROR'
        });
      }
    });
  };

  // Détection automatique et routage
  if (req.is('multipart/form-data')) {
    // Configuration flexible pour tous types d'upload
    const fieldsConfig = [
      { name: 'file', maxCount: 1 },      // Single upload
      { name: 'files', maxCount: 20 },    // Multiple upload
      { name: 'image', maxCount: 10 },    // Images
      { name: 'video', maxCount: 5 },     // Videos
      { name: 'audio', maxCount: 10 },    // Audio
      { name: 'media', maxCount: 15 }     // Générique
    ];

    handleUpload(req, res, uploadMediaService.fields(fieldsConfig));
  } else {
    res.status(400).json({
      success: false,
      error: 'Content-Type doit être multipart/form-data',
      code: 'INVALID_CONTENT_TYPE'
    });
  }
});

// ==========================================
// CRUD - Gestion des médias existants
// ==========================================

/**
 * Lister tous les médias avec filtres optionnels
 * GET /api/media?type=image&limit=50&offset=0
 */
router.get('/', async (req, res) => {
  try {
    const { type, search, limit = 20, offset = 0 } = req.query
    
    const mediasDir = getMediasDir()
    if (!fs.existsSync(mediasDir)) {
      return res.json({ success: true, medias: [], total: 0 })
    }

    let files = fs.readdirSync(mediasDir)    // Filtrage par type
    if (type) {
      const imageExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg']
      const videoExts = ['.mp4', '.webm', '.ogg', '.avi', '.mov']
      const audioExts = ['.mp3', '.wav', '.ogg', '.m4a']
      
      files = files.filter(file => {
        const ext = path.extname(file).toLowerCase()
        switch(type) {
          case 'image': return imageExts.includes(ext)
          case 'video': return videoExts.includes(ext)
          case 'audio': return audioExts.includes(ext)
          default: return true
        }
      })
    }
    
    // Recherche par nom
    if (search) {
      const searchLower = search.toLowerCase()
      files = files.filter(file => file.toLowerCase().includes(searchLower))
    }
    
    const total = files.length
    
    // Pagination
    const offsetNum = parseInt(offset)
    const limitNum = parseInt(limit)
    const paginatedFiles = files.slice(offsetNum, offsetNum + limitNum)
    
    // Créer les objects medias avec metadata
    const medias = paginatedFiles.map(filename => {
      const filePath = path.join(mediasDir, filename)
      const stats = fs.statSync(filePath)
      const ext = path.extname(filename).toLowerCase()
      
      let mediaType = 'other'
      if (['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'].includes(ext)) {
        mediaType = 'image'
      } else if (['.mp4', '.webm', '.ogg', '.avi', '.mov'].includes(ext)) {
        mediaType = 'video'  
      } else if (['.mp3', '.wav', '.ogg', '.m4a'].includes(ext)) {
        mediaType = 'audio'
      }
      
      return {
        id: path.parse(filename).name,
        filename: filename,
        url: getMediaFileUrl(filename),
        type: mediaType,
        size: stats.size,
        createdAt: stats.birthtime,
        modifiedAt: stats.mtime
      }
    })
    
    res.json({
      success: true,
      medias: medias,
      total: total,
      limit: limitNum,
      offset: offsetNum,
      hasMore: offsetNum + limitNum < total
    })
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      code: 'LIST_ERROR'
    })
  }
})

/**
 * Récupérer les informations d'un média
 * GET /api/media/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const mediaInfo = await uploadMediaService.getMediaInfo(req.params.id);
    res.json({
      success: true,
      media: mediaInfo
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      error: error.message,
      code: 'MEDIA_NOT_FOUND'
    });
  }
});

/**
 * Supprimer un média
 * DELETE /api/media/:id
 */
router.delete('/:id', async (req, res) => {
  try {
    const result = await uploadMediaService.deleteMedia(req.params.id);
    res.json({
      success: true,
      message: 'Média supprimé avec succès',
      ...result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      code: 'DELETE_ERROR'
    });
  }
});

// ==========================================
// COPY - Duplication de médias
// ==========================================

/**
 * Copier un média vers une collection
 * POST /api/media/copy
 * 
 * Body:
 * {
 *   sourceUrl: string,           // URL du média source
 *   targetCollectionId?: string, // Collection destination (optionnel)
 *   description?: string,        // Description du nouveau média
 *   preserveOriginal?: boolean   // Garder l'original (défaut: true)
 * }
 */
router.post('/copy', async (req, res) => {
  try {
    const { 
      sourceUrl, 
      targetCollectionId, 
      description, 
      preserveOriginal = true 
    } = req.body;
    
    console.log('📋 Copie de média:', {
      sourceUrl,
      targetCollectionId,
      description,
      preserveOriginal
    });
    
    // Validation
    if (!sourceUrl) {
      return res.status(400).json({
        success: false,
        error: 'sourceUrl est requis',
        code: 'MISSING_SOURCE_URL'
      });
    }
    
    // Vérifier collection destination si fournie
    if (targetCollectionId) {
      const targetCollection = await getCollectionById(targetCollectionId);
      if (!targetCollection) {
        return res.status(404).json({
          success: false,
          error: 'Collection de destination non trouvée',
          code: 'COLLECTION_NOT_FOUND'
        });
      }
    }
    
    // Extraire nom fichier et vérifier existence
    const sourceFileName = sourceUrl.split('/').pop();
    const mediasDir = getMediasDir();
    const sourceFilePath = path.join(mediasDir, sourceFileName);
    
    if (!fs.existsSync(sourceFilePath)) {
      return res.status(404).json({
        success: false,
        error: 'Fichier source introuvable',
        code: 'SOURCE_FILE_NOT_FOUND',
        sourceFile: sourceFileName
      });
    }

    // Lire et copier le fichier
    const fileBuffer = fs.readFileSync(sourceFilePath);
    const fileExtension = getFileExtension(sourceFileName);
    const newFileName = generateUniqueFileName(fileExtension);
    const newFilePath = path.join(mediasDir, newFileName);

    fs.writeFileSync(newFilePath, fileBuffer);    const newMediaUrl = `/medias/${newFileName}`;
    
    // Déterminer type de média
    const mediaType = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp'].includes(fileExtension.toLowerCase()) 
      ? 'image' 
      : ['.mp4', '.webm', '.avi', '.mov', '.mkv'].includes(fileExtension.toLowerCase())
        ? 'video'
        : 'other';
    
    // Ajouter à la collection si spécifiée
    if (targetCollectionId) {
      await addImageToCollection(targetCollectionId, {
        url: newMediaUrl,
        description: description || '',
        type: mediaType
      });
    }
    
    const result = {
      success: true,
      message: 'Média copié avec succès',
      copied_media: {
        url: newMediaUrl,
        filename: newFileName,
        type: mediaType,
        description: description || '',
        size: fileBuffer.length
      },
      original_media: {
        url: sourceUrl,
        filename: sourceFileName,
        preserved: preserveOriginal
      }
    };
    
    if (targetCollectionId) {
      result.collection_id = targetCollectionId;
    }
    
    res.json(result);
    
  } catch (error) {
    console.error('❌ Erreur copie média:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      code: 'COPY_ERROR'
    });
  }
});

/**
 * Copier plusieurs médias en lot
 * POST /api/media/copy-batch
 * 
 * Body:
 * {
 *   operations: [
 *     {
 *       sourceUrl: string,
 *       targetCollectionId?: string,
 *       description?: string
 *     }
 *   ],
 *   preserveOriginal?: boolean
 * }
 */
router.post('/copy-batch', async (req, res) => {
  try {
    const { operations, preserveOriginal = true } = req.body;
    
    console.log('📋 Copie batch de', operations?.length, 'médias');
    
    // Validation
    if (!operations || !Array.isArray(operations) || operations.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Un tableau d\'opérations est requis',
        code: 'MISSING_OPERATIONS'
      });
    }
    
    const results = [];
    const errors = [];
    
    for (let i = 0; i < operations.length; i++) {
      const operation = operations[i];
      
      try {
        const { sourceUrl, targetCollectionId, description } = operation;
        
        if (!sourceUrl) {
          throw new Error(`sourceUrl manquant pour l'opération ${i + 1}`);
        }
        
        // Vérifier collection si fournie
        if (targetCollectionId) {
          const collection = await getCollectionById(targetCollectionId);
          if (!collection) {
            throw new Error(`Collection ${targetCollectionId} non trouvée`);
          }
        }
        
        // Copier le fichier
        const sourceFileName = sourceUrl.split('/').pop();
        const mediasDir = getMediasDir();
        const sourceFilePath = path.join(mediasDir, sourceFileName);
        
        if (!fs.existsSync(sourceFilePath)) {
          throw new Error('Fichier source introuvable');
        }
        
        const fileBuffer = fs.readFileSync(sourceFilePath);
        const fileExtension = getFileExtension(sourceFileName);
        const newFileName = generateUniqueFileName(fileExtension);
        const newFilePath = path.join(mediasDir, newFileName);
        
        fs.writeFileSync(newFilePath, fileBuffer);
        
        const newMediaUrl = `/medias/${newFileName}`;
        const mediaType = ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(fileExtension.toLowerCase()) 
          ? 'image' 
          : 'video';
        
        // Ajouter à collection si spécifiée
        if (targetCollectionId) {
          await addImageToCollection(targetCollectionId, {
            url: newMediaUrl,
            description: description || '',
            type: mediaType
          });
        }
        
        results.push({
          success: true,
          operation_index: i,
          original_url: sourceUrl,
          copied_media: {
            url: newMediaUrl,
            filename: newFileName,
            type: mediaType,
            size: fileBuffer.length
          },
          collection_id: targetCollectionId || null
        });
        
      } catch (error) {
        console.error(`❌ Erreur copie opération ${i}:`, error);
        errors.push({
          success: false,
          operation_index: i,
          original_url: operation.sourceUrl || 'unknown',
          error: error.message
        });
      }
    }
    
    res.json({
      success: true,
      message: `${results.length}/${operations.length} médias copiés`,
      results,
      errors,
      summary: {
        total_operations: operations.length,
        successful_copies: results.length,
        failed_copies: errors.length,
        success_rate: Math.round((results.length / operations.length) * 100)
      }
    });
    
  } catch (error) {
    console.error('❌ Erreur copie batch:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      code: 'BATCH_COPY_ERROR'
    });
  }
});

export default router;