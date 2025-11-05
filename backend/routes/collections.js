import express from 'express';
import multer from 'multer';
import { saveMediaFile, generateUniqueFileName, getFileExtension } from '../utils/fileUtils.js';
import { 
  initializeCollections,
  getAllCollections, 
  getCollectionById, 
  createCollection, 
  updateCollection, 
  deleteCollection,
  getCurrentCollection,
  setCurrentCollection,
  addImageToCollection,
  addImageToCurrentCollection,
  removeImageFromCollection,
  updateImageInCollection
} from '../services/collectionManager.js';

const router = express.Router();

// Configuration Multer pour les uploads en mémoire
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max
  }
});

/**
 * Initialise les collections au démarrage
 */
router.get('/init', async (req, res) => {
  try {
    await initializeCollections();
    
    res.json({
      success: true,
      message: 'Collections initialisées'
    });
  } catch (error) {
    console.error('❌ Erreur initialisation collections:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'initialisation des collections',
      error: error.message
    });
  }
});

/**
 * Récupère toutes les collections
 */
router.get('/', async (req, res) => {
  try {
    const collections = await getAllCollections();
    
    res.json({
      success: true,
      collections,
      count: collections.length
    });
  } catch (error) {
    console.error('❌ Erreur récupération collections:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des collections',
      error: error.message
    });
  }
});

/**
 * Récupère une collection par ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const collection = await getCollectionById(id);
    
    if (!collection) {
      return res.status(404).json({
        success: false,
        message: 'Collection non trouvée'
      });
    }
    
    res.json({
      success: true,
      collection
    });
  } catch (error) {
    console.error('❌ Erreur récupération collection:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de la collection',
      error: error.message
    });
  }
});

/**
 * Crée une nouvelle collection
 */
router.post('/', async (req, res) => {
  try {
    const { name, description } = req.body;
    
    if (!name || name.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Le nom de la collection est requis'
      });
    }
    
    const collection = await createCollection({ 
      name: name.trim(), 
      description: description?.trim() || '' 
    });
    
    res.status(201).json({
      success: true,
      collection,
      message: `Collection "${collection.name}" créée avec succès`
    });
  } catch (error) {
    console.error('❌ Erreur création collection:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de la collection',
      error: error.message
    });
  }
});

/**
 * Met à jour une collection
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    
    const updates = {};
    if (name !== undefined) updates.name = name.trim();
    if (description !== undefined) updates.description = description.trim();
    
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Aucune donnée à mettre à jour'
      });
    }
    
    const collection = await updateCollection(id, updates);
    
    res.json({
      success: true,
      collection,
      message: `Collection "${collection.name}" mise à jour avec succès`
    });
  } catch (error) {
    console.error('❌ Erreur mise à jour collection:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour de la collection',
      error: error.message
    });
  }
});

/**
 * Supprime une collection
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    await deleteCollection(id);
    
    res.json({
      success: true,
      message: 'Collection supprimée avec succès'
    });
  } catch (error) {
    console.error('❌ Erreur suppression collection:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de la collection',
      error: error.message
    });
  }
});

/**
 * Récupère la collection courante
 */
router.get('/current/info', async (req, res) => {
  try {
    const currentCollection = await getCurrentCollection();
    
    if (!currentCollection) {
      return res.json({
        success: true,
        currentCollection: null,
        message: 'Aucune collection courante définie'
      });
    }
    
    res.json({
      success: true,
      currentCollection
    });
  } catch (error) {
    console.error('❌ Erreur récupération collection courante:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de la collection courante',
      error: error.message
    });
  }
});

/**
 * Définit la collection courante
 */
router.post('/current/set', async (req, res) => {
  try {
    const { collectionId } = req.body;
    
    if (!collectionId) {
      return res.status(400).json({
        success: false,
        message: 'L\'ID de la collection est requis'
      });
    }
    
    const collection = await setCurrentCollection(collectionId);
    
    res.json({
      success: true,
      currentCollection: collection,
      message: `Collection "${collection.name}" définie comme courante`
    });
  } catch (error) {
    console.error('❌ Erreur définition collection courante:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la définition de la collection courante',
      error: error.message
    });
  }
});

/**
 * Ajoute une image à une collection spécifique
 */
router.post('/:id/images', async (req, res) => {
  try {
    const { id } = req.params;
    const { url, description, mediaId } = req.body;
    
    if (!url) {
      return res.status(400).json({
        success: false,
        message: 'L\'URL de l\'image est requise'
      });
    }
    
    // Extraire le mediaId depuis l'URL si pas fourni explicitement
    let extractedMediaId = mediaId;
    if (!extractedMediaId && url) {
      const urlMatch = url.match(/\/medias\/([^\/]+)$/);
      if (urlMatch) {
        const filename = urlMatch[1];
        extractedMediaId = filename.replace(/\.[^.]+$/, ''); // Enlever l'extension pour avoir l'UUID
      }
    }
    
    const collection = await addImageToCollection(id, { 
      url, 
      mediaId: extractedMediaId,
      description: description?.trim() || '' 
    });
    
    res.json({
      success: true,
      collection,
      message: 'Image ajoutée à la collection'
    });
  } catch (error) {
    console.error('❌ Erreur ajout image à collection:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'ajout de l\'image à la collection',
      error: error.message
    });
  }
});

/**
 * Ajoute une image à la collection courante
 */
router.post('/current/images', async (req, res) => {
  try {
    const { url, description, mediaId } = req.body;
    
    if (!url) {
      return res.status(400).json({
        success: false,
        message: 'L\'URL de l\'image est requise'
      });
    }
    
    // Extraire le mediaId depuis l'URL si pas fourni explicitement
    let extractedMediaId = mediaId;
    if (!extractedMediaId && url) {
      const urlMatch = url.match(/\/medias\/([^\/]+)$/);
      if (urlMatch) {
        const filename = urlMatch[1];
        extractedMediaId = filename.replace(/\.[^.]+$/, ''); // Enlever l'extension pour avoir l'UUID
      }
    }
    
    const collection = await addImageToCurrentCollection({ 
      url, 
      mediaId: extractedMediaId,
      description: description?.trim() || '' 
    });
    
    if (!collection) {
      return res.status(404).json({
        success: false,
        message: 'Aucune collection courante définie'
      });
    }
    
    res.json({
      success: true,
      collection,
      message: 'Image ajoutée à la collection courante'
    });
  } catch (error) {
    console.error('❌ Erreur ajout image à collection courante:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'ajout de l\'image à la collection courante',
      error: error.message
    });
  }
});

/**
 * Supprime une image d'une collection
 */
router.delete('/:id/images/:imageUrl(*)', async (req, res) => {
  try {
    const { id, imageUrl } = req.params;
    
    const collection = await removeImageFromCollection(id, decodeURIComponent(imageUrl));
    
    res.json({
      success: true,
      collection,
      message: 'Image supprimée de la collection'
    });
  } catch (error) {
    console.error('❌ Erreur suppression image de collection:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de l\'image de la collection',
      error: error.message
    });
  }
});

/**
 * Met à jour une image dans une collection
 */
router.put('/:id/images/:imageUrl(*)', async (req, res) => {
  try {
    const { id, imageUrl } = req.params;
    const { description } = req.body;
    
    const collection = await updateImageInCollection(
      id, 
      decodeURIComponent(imageUrl), 
      { description: description?.trim() || '' }
    );
    
    res.json({
      success: true,
      collection,
      message: 'Description de l\'image mise à jour'
    });
  } catch (error) {
    console.error('❌ Erreur mise à jour image dans collection:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour de l\'image dans la collection',
      error: error.message
    });
  }
});

/**
 * Récupère les images de la collection courante (pour la galerie)
 */
router.get('/current/gallery', async (req, res) => {
  try {
    const currentCollection = await getCurrentCollection();
    
    if (!currentCollection) {
      return res.json({
        success: true,
        images: [],
        collection: null,
        message: 'Aucune collection courante définie'
      });
    }
    
    res.json({
      success: true,
      images: currentCollection.images,
      collection: {
        id: currentCollection.id,
        name: currentCollection.name,
        description: currentCollection.description
      }
    });
  } catch (error) {
    console.error('❌ Erreur récupération galerie collection courante:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de la galerie',
      error: error.message
    });
  }
});

/**
 * Upload direct d'images dans une collection spécifique
 * POST /collections/:id/upload
 */
router.post('/:id/upload', upload.array('files', 10), async (req, res) => {
  try {
    const { id } = req.params;
    const { description } = req.body;
    const files = req.files;
    
    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Aucun fichier fourni'
      });
    }
    
    const results = [];
    
    // Traiter chaque fichier
    for (const file of files) {
      try {
        // Générer un nom unique et sauvegarder
        const extension = getFileExtension(file.mimetype);
        const filename = generateUniqueFileName(extension);
        const savedFile = saveMediaFile(filename, file.buffer);
        
        // Extraire l'UUID pour le mediaId
        const mediaId = filename.replace(/\.[^.]+$/, '');
        
        // Ajouter à la collection
        await addImageToCollection(id, {
          url: `/medias/${filename}`,
          mediaId: mediaId,
          description: description || `Image uploadée le ${new Date().toLocaleDateString()}`
        });
        
        results.push({
          filename: filename,
          mediaId: mediaId,
          url: `/medias/${filename}`,
          originalName: file.originalname
        });
        
      } catch (fileError) {
        console.error(`❌ Erreur traitement fichier ${file.originalname}:`, fileError);
        results.push({
          filename: file.originalname,
          error: fileError.message
        });
      }
    }
    
    res.json({
      success: true,
      message: `${results.length} fichier(s) traité(s)`,
      results: results
    });
    
  } catch (error) {
    console.error('❌ Erreur upload collection:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'upload',
      error: error.message
    });
  }
});

/**
 * Upload direct d'images dans la collection courante
 * POST /collections/current/upload
 */
router.post('/current/upload', upload.array('files', 10), async (req, res) => {
  try {
    const { description } = req.body;
    const files = req.files;
    
    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Aucun fichier fourni'
      });
    }
    
    const currentCollection = await getCurrentCollection();
    if (!currentCollection) {
      return res.status(404).json({
        success: false,
        message: 'Aucune collection courante définie'
      });
    }
    
    const results = [];
    
    // Traiter chaque fichier
    for (const file of files) {
      try {
        // Générer un nom unique et sauvegarder
        const extension = getFileExtension(file.mimetype);
        const filename = generateUniqueFileName(extension);
        const savedFile = saveMediaFile(filename, file.buffer);
        
        // Extraire l'UUID pour le mediaId
        const mediaId = filename.replace(/\.[^.]+$/, '');
        
        // Ajouter à la collection courante
        await addImageToCurrentCollection({
          url: `/medias/${filename}`,
          mediaId: mediaId,
          description: description || `Image uploadée le ${new Date().toLocaleDateString()}`
        });
        
        results.push({
          filename: filename,
          mediaId: mediaId,
          url: `/medias/${filename}`,
          originalName: file.originalname
        });
        
      } catch (fileError) {
        console.error(`❌ Erreur traitement fichier ${file.originalname}:`, fileError);
        results.push({
          filename: file.originalname,
          error: fileError.message
        });
      }
    }
    
    res.json({
      success: true,
      message: `${results.length} fichier(s) ajouté(s) à la collection courante`,
      results: results,
      collection: {
        id: currentCollection.id,
        name: currentCollection.name
      }
    });
    
  } catch (error) {
    console.error('❌ Erreur upload collection courante:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'upload',
      error: error.message
    });
  }
});

export default router;