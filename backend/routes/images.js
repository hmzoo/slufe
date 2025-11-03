import express from 'express';
import multer from 'multer';
import { analyzeImage, analyzeImages, isReplicateConfigured } from '../services/imageAnalyzer.js';

const router = express.Router();

// Configuration de multer pour l'upload d'images en mémoire
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // Limite de 10MB par fichier
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Le fichier doit être une image'), false);
    }
  },
});

/**
 * POST /api/images/analyze-urls
 * Analyse des images via URLs
 */
router.post('/analyze-urls', async (req, res) => {
  try {
    const { images, prompt } = req.body;

    // Validation
    if (!images || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Le champ "images" doit être un tableau non vide d\'URLs',
      });
    }

    if (images.length > 10) {
      return res.status(400).json({
        success: false,
        error: 'Maximum 10 images par requête',
      });
    }

    // Vérifier si Replicate est configuré
    if (!isReplicateConfigured()) {
      console.warn('⚠️  REPLICATE_API_TOKEN non configuré, retour de descriptions mock');
      
      // Réponses mock pour le développement
      const mockDescriptions = images.map((url, index) => ({
        url,
        description: `Mock description for image ${index + 1}: This is a sample description of the image. The image contains various elements including colors, shapes, and objects arranged in a composition.`,
        success: true,
        mock: true,
      }));
      
      return res.json({
        success: true,
        results: mockDescriptions,
        mock: true,
        message: 'Réponses mock - Configurez REPLICATE_API_TOKEN pour utiliser l\'IA réelle',
      });
    }

    // Analyser les images
    const results = await analyzeImages(images, prompt);

    // Compter les succès et échecs
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.length - successCount;

    res.json({
      success: true,
      results: results,
      stats: {
        total: results.length,
        success: successCount,
        failed: failureCount,
      },
      mock: false,
    });
  } catch (error) {
    console.error('❌ Erreur dans /api/images/analyze:', error);

    if (error.message.includes('REPLICATE_API_TOKEN')) {
      return res.status(500).json({
        success: false,
        error: 'Service d\'analyse d\'images non configuré',
        details: 'Veuillez configurer REPLICATE_API_TOKEN dans le fichier .env',
      });
    }

    res.status(500).json({
      success: false,
      error: 'Erreur lors de l\'analyse des images',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

/**
 * POST /api/images/analyze
 * Analyse d'une seule image uploadée
 */
router.post('/analyze', upload.single('image'), async (req, res) => {
  try {
    const image = req.file;

    if (!image) {
      return res.status(400).json({
        success: false,
        error: 'Aucune image uploadée (champ "image" requis)',
      });
    }

    console.log(`🔍 Analyse de l'image: ${image.originalname}`);

    // Vérifier si Replicate est configuré
    if (!isReplicateConfigured()) {
      return res.json({
        success: true,
        description: `Mock description for ${image.originalname}: This is a sample description of the uploaded image.`,
        mock: true,
        message: 'Réponse mock - Configurez REPLICATE_API_TOKEN',
      });
    }

    // Convertir le fichier en base64
    const base64 = image.buffer.toString('base64');
    const imageDataUrl = `data:${image.mimetype};base64,${base64}`;

    // Analyser l'image (retourne une string directement)
    const description = await analyzeImage({ image: imageDataUrl });

    console.log(`✅ Analyse terminée: ${description.substring(0, 100)}...`);

    res.json({
      success: true,
      description: description,
      filename: image.originalname,
    });
  } catch (error) {
    console.error('❌ Erreur dans /api/images/analyze:', error);
    
    res.status(500).json({
      success: false,
      error: 'Erreur lors de l\'analyse de l\'image',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

/**
 * POST /api/images/analyze-upload
 * Analyse des images uploadées (fichiers)
 */
router.post('/analyze-upload', upload.array('images', 10), async (req, res) => {
  try {
    const images = req.files;
    const { prompt } = req.body;

    if (!images || images.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Aucune image uploadée',
      });
    }

    console.log(`📤 ${images.length} image(s) uploadée(s)`);

    // Vérifier si Replicate est configuré
    if (!isReplicateConfigured()) {
      const mockDescriptions = images.map((img, index) => ({
        filename: img.originalname,
        description: `Mock description for ${img.originalname}: This is a sample description of the uploaded image.`,
        success: true,
        mock: true,
      }));
      
      return res.json({
        success: true,
        results: mockDescriptions,
        mock: true,
        message: 'Réponses mock - Configurez REPLICATE_API_TOKEN',
      });
    }

    // Convertir les fichiers en base64
    const imageDataUrls = images.map((img) => {
      const base64 = img.buffer.toString('base64');
      return `data:${img.mimetype};base64,${base64}`;
    });

    // Analyser les images
    const analysisResults = await analyzeImages(imageDataUrls, prompt);

    // Associer les résultats aux noms de fichiers
    const results = analysisResults.map((result, index) => ({
      filename: images[index].originalname,
      description: result.description,
      success: result.success,
      error: result.error,
    }));

    const successCount = results.filter(r => r.success).length;

    res.json({
      success: true,
      results: results,
      stats: {
        total: results.length,
        success: successCount,
        failed: results.length - successCount,
      },
      mock: false,
    });
  } catch (error) {
    console.error('❌ Erreur dans /api/images/analyze-upload:', error);
    
    res.status(500).json({
      success: false,
      error: 'Erreur lors de l\'analyse des images uploadées',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

/**
 * GET /api/images/status
 * Vérifie le statut du service d'analyse
 */
router.get('/status', (req, res) => {
  const configured = isReplicateConfigured();
  
  res.json({
    success: true,
    service: 'imageAnalyzer',
    configured: configured,
    model: 'yorickvp/llava-13b',
    status: configured ? 'ready' : 'not_configured',
    message: configured 
      ? 'Service d\'analyse d\'images opérationnel'
      : 'Configurez REPLICATE_API_TOKEN pour activer le service',
  });
});

export default router;
