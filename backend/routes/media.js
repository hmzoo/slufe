import express from 'express';
import path from 'path';
import fs from 'fs/promises';
import { 
  generateUniqueFileName, 
  getFileExtension,
  getMediasDir 
} from '../utils/fileUtils.js';
import { 
  addImageToCollection,
  getCollectionById 
} from '../services/collectionManager.js';

const router = express.Router();

/**
 * Copie un média (fichier physique + référence) vers une autre collection
 * POST /api/media/copy
 * 
 * Body:
 * {
 *   sourceUrl: string,        // URL du média source (ex: /medias/123.jpg)
 *   targetCollectionId: string, // ID de la collection de destination
 *   description: string        // Description du média (optionnel)
 * }
 */
router.post('/copy', async (req, res) => {
  try {
    const { sourceUrl, targetCollectionId, description } = req.body;
    
    console.log('📋 Copie de média:', {
      sourceUrl,
      targetCollectionId,
      description
    });
    
    // Validation
    if (!sourceUrl || !targetCollectionId) {
      return res.status(400).json({
        success: false,
        message: 'sourceUrl et targetCollectionId sont requis'
      });
    }
    
    // Vérifier que la collection de destination existe
    const targetCollection = await getCollectionById(targetCollectionId);
    if (!targetCollection) {
      return res.status(404).json({
        success: false,
        message: 'Collection de destination non trouvée'
      });
    }
    
    // Extraire le nom du fichier source depuis l'URL
    // sourceUrl peut être: /medias/123.jpg ou http://localhost:3000/medias/123.jpg
    const sourceFileName = sourceUrl.split('/').pop();
    const mediasDir = getMediasDir();
    const sourceFilePath = path.join(mediasDir, sourceFileName);
    
    console.log('📁 Chemin source:', sourceFilePath);
    
    // Vérifier que le fichier source existe
    try {
      await fs.access(sourceFilePath);
    } catch (error) {
      console.error('❌ Fichier source introuvable:', sourceFilePath);
      return res.status(404).json({
        success: false,
        message: 'Fichier source introuvable',
        sourceFile: sourceFileName
      });
    }
    
    // Lire le fichier source
    const fileBuffer = await fs.readFile(sourceFilePath);
    
    // Générer un nouveau nom de fichier unique
    const fileExtension = getFileExtension(sourceFileName);
    const newFileName = generateUniqueFileName(fileExtension);
    const newFilePath = path.join(mediasDir, newFileName);
    
    console.log('📝 Nouveau fichier:', newFileName);
    
    // Copier le fichier physiquement
    await fs.writeFile(newFilePath, fileBuffer);
    
    console.log('✅ Fichier copié:', newFilePath);
    
    // Construire l'URL du nouveau média
    const newMediaUrl = `/medias/${newFileName}`;
    
    // Déterminer le type de média
    const mediaType = ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(fileExtension.toLowerCase()) 
      ? 'image' 
      : 'video';
    
    // Ajouter le média à la collection de destination
    await addImageToCollection(targetCollectionId, {
      url: newMediaUrl,
      description: description || '',
      type: mediaType
    });
    
    console.log('✅ Média ajouté à la collection:', targetCollectionId);
    
    res.json({
      success: true,
      message: 'Média copié avec succès',
      media: {
        url: newMediaUrl,
        fileName: newFileName,
        type: mediaType,
        description: description || '',
        originalUrl: sourceUrl
      }
    });
    
  } catch (error) {
    console.error('❌ Erreur copie média:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la copie du média',
      error: error.message
    });
  }
});

/**
 * Copie plusieurs médias en une seule requête
 * POST /api/media/copy-batch
 * 
 * Body:
 * {
 *   medias: [
 *     { sourceUrl: string, description: string },
 *     ...
 *   ],
 *   targetCollectionId: string
 * }
 */
router.post('/copy-batch', async (req, res) => {
  try {
    const { medias, targetCollectionId } = req.body;
    
    console.log('📋 Copie batch de', medias?.length, 'médias');
    
    // Validation
    if (!medias || !Array.isArray(medias) || medias.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Un tableau de médias est requis'
      });
    }
    
    if (!targetCollectionId) {
      return res.status(400).json({
        success: false,
        message: 'targetCollectionId est requis'
      });
    }
    
    // Vérifier que la collection existe
    const targetCollection = await getCollectionById(targetCollectionId);
    if (!targetCollection) {
      return res.status(404).json({
        success: false,
        message: 'Collection de destination non trouvée'
      });
    }
    
    const results = [];
    const errors = [];
    
    for (const media of medias) {
      try {
        const sourceFileName = media.sourceUrl.split('/').pop();
        const mediasDir = getMediasDir();
        const sourceFilePath = path.join(mediasDir, sourceFileName);
        
        // Vérifier existence
        await fs.access(sourceFilePath);
        
        // Lire et copier
        const fileBuffer = await fs.readFile(sourceFilePath);
        const fileExtension = getFileExtension(sourceFileName);
        const newFileName = generateUniqueFileName(fileExtension);
        const newFilePath = path.join(mediasDir, newFileName);
        
        await fs.writeFile(newFilePath, fileBuffer);
        
        const newMediaUrl = `/medias/${newFileName}`;
        const mediaType = ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(fileExtension.toLowerCase()) 
          ? 'image' 
          : 'video';
        
        await addImageToCollection(targetCollectionId, {
          url: newMediaUrl,
          description: media.description || '',
          type: mediaType
        });
        
        results.push({
          success: true,
          originalUrl: media.sourceUrl,
          newUrl: newMediaUrl,
          fileName: newFileName
        });
        
      } catch (error) {
        console.error('❌ Erreur copie média individuel:', error);
        errors.push({
          success: false,
          originalUrl: media.sourceUrl,
          error: error.message
        });
      }
    }
    
    res.json({
      success: true,
      message: `${results.length}/${medias.length} médias copiés`,
      results,
      errors,
      successCount: results.length,
      errorCount: errors.length
    });
    
  } catch (error) {
    console.error('❌ Erreur copie batch:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la copie des médias',
      error: error.message
    });
  }
});

export default router;
