import express from 'express';
import multer from 'multer';
import {
  editImage,
  editSingleImage,
  transferPose,
  transferStyle,
  validateEditParams,
  isReplicateConfigured
} from '../services/imageEditor.js';

const router = express.Router();

// Configuration multer pour upload d'images en mémoire
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
    files: 5 // Maximum 5 images
  },
  fileFilter: (req, file, cb) => {
    // Vérifier le type MIME
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Type de fichier non supporté. Utilisez JPEG, PNG, GIF ou WebP.'));
    }
  }
});

/**
 * POST /api/edit/image
 * Édite une ou plusieurs images avec un prompt
 * 
 * Body (JSON):
 * - prompt: string (requis)
 * - imageUrls: array<string> (requis si pas de fichiers uploadés)
 * - aspectRatio: string (optionnel, défaut: 'match_input_image')
 * - goFast: boolean (optionnel, défaut: true)
 * - seed: number (optionnel)
 * - outputFormat: string (optionnel, défaut: 'webp')
 * - outputQuality: number (optionnel, défaut: 95)
 * - disableSafetyChecker: boolean (optionnel, défaut: false)
 * 
 * Files (multipart/form-data):
 * - images: fichiers images (optionnel si imageUrls fourni)
 */
router.post('/image', upload.array('images', 5), async (req, res) => {
  try {
    const {
      prompt,
      imageUrls,
      aspectRatio,
      goFast,
      seed,
      outputFormat,
      outputQuality,
      disableSafetyChecker
    } = req.body;

    // Validation du prompt
    if (!prompt || !prompt.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Le prompt est requis'
      });
    }

    // Récupérer les images (soit depuis les fichiers uploadés, soit depuis les URLs)
    let images = [];
    
    // Si des fichiers sont uploadés, les convertir en data URIs
    if (req.files && req.files.length > 0) {
      images = req.files.map(file => {
        const base64 = file.buffer.toString('base64');
        return `data:${file.mimetype};base64,${base64}`;
      });
      console.log(`📤 ${req.files.length} fichier(s) uploadé(s)`);
    }
    // Sinon utiliser les URLs fournies
    else if (imageUrls) {
      try {
        images = JSON.parse(imageUrls);
        if (!Array.isArray(images)) {
          images = [images];
        }
      } catch (e) {
        // Si ce n'est pas du JSON, c'est peut-être une seule URL
        images = [imageUrls];
      }
      console.log(`🔗 ${images.length} URL(s) fournie(s)`);
    }

    // Vérifier qu'on a au moins une image
    if (images.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Au moins une image est requise (fichier uploadé ou URL)'
      });
    }

    // Parser les paramètres - Ne pas forcer de valeurs par défaut, laisser le service les gérer
    const params = {
      prompt: prompt.trim(),
      images: images,
    };

    // Ajouter les paramètres optionnels seulement s'ils sont fournis
    if (aspectRatio !== undefined) params.aspectRatio = aspectRatio;
    if (goFast !== undefined) params.goFast = goFast === 'true' || goFast === true;
    if (seed !== undefined && seed !== null) params.seed = parseInt(seed);
    if (outputFormat !== undefined) params.outputFormat = outputFormat;
    if (outputQuality !== undefined) params.outputQuality = parseInt(outputQuality);
    if (disableSafetyChecker !== undefined) params.disableSafetyChecker = disableSafetyChecker === 'true' || disableSafetyChecker === true;

    console.log('🎨 Édition d\'images demandée:', {
      prompt: params.prompt,
      imagesCount: params.images.length,
      aspectRatio: params.aspectRatio || 'default'
    });

    // Appeler le service
    const result = await editImage(params);

    res.json(result);

  } catch (error) {
    console.error('❌ Erreur lors de l\'édition d\'images:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erreur lors de l\'édition des images',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * POST /api/edit/single-image
 * Édite une seule image (simplifié)
 */
router.post('/single-image', upload.single('image'), async (req, res) => {
  try {
    const { prompt, imageUrl, aspectRatio, goFast, seed, outputFormat, outputQuality } = req.body;

    if (!prompt || !prompt.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Le prompt est requis'
      });
    }

    let imageSource;
    
    if (req.file) {
      const base64 = req.file.buffer.toString('base64');
      imageSource = `data:${req.file.mimetype};base64,${base64}`;
    } else if (imageUrl) {
      imageSource = imageUrl;
    } else {
      return res.status(400).json({
        success: false,
        error: 'Une image est requise (fichier ou URL)'
      });
    }

    // Préparer les paramètres - Ne pas forcer de valeurs par défaut
    const params = {
      prompt: prompt.trim(),
      imageUrl: imageSource,
    };

    // Ajouter les paramètres optionnels seulement s'ils sont fournis
    if (aspectRatio !== undefined) params.aspectRatio = aspectRatio;
    if (goFast !== undefined) params.goFast = goFast === 'true' || goFast === true;
    if (seed !== undefined && seed !== null) params.seed = parseInt(seed);
    if (outputFormat !== undefined) params.outputFormat = outputFormat;
    if (outputQuality !== undefined) params.outputQuality = parseInt(outputQuality);

    const result = await editSingleImage(params);

    res.json(result);

  } catch (error) {
    console.error('❌ Erreur lors de l\'édition d\'image:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erreur lors de l\'édition de l\'image',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * POST /api/edit/transfer-pose
 * Transfère la pose d'une image à une personne dans une autre image
 * 
 * Body (JSON ou multipart):
 * - poseSourceUrl: URL de l'image source de la pose
 * - targetPersonUrl: URL de l'image de la personne cible
 * Ou fichiers: poseSource et targetPerson
 */
router.post('/transfer-pose', upload.fields([
  { name: 'poseSource', maxCount: 1 },
  { name: 'targetPerson', maxCount: 1 }
]), async (req, res) => {
  try {
    let { poseSourceUrl, targetPersonUrl, aspectRatio, outputFormat } = req.body;

    // Gérer les fichiers uploadés
    if (req.files) {
      if (req.files.poseSource && req.files.poseSource[0]) {
        const file = req.files.poseSource[0];
        const base64 = file.buffer.toString('base64');
        poseSourceUrl = `data:${file.mimetype};base64,${base64}`;
      }
      if (req.files.targetPerson && req.files.targetPerson[0]) {
        const file = req.files.targetPerson[0];
        const base64 = file.buffer.toString('base64');
        targetPersonUrl = `data:${file.mimetype};base64,${base64}`;
      }
    }

    if (!poseSourceUrl || !targetPersonUrl) {
      return res.status(400).json({
        success: false,
        error: 'Deux images sont requises: poseSource et targetPerson'
      });
    }

    const result = await transferPose({
      poseSourceUrl,
      targetPersonUrl,
      aspectRatio: aspectRatio || '16:9',
      outputFormat: outputFormat || 'webp'
    });

    res.json(result);

  } catch (error) {
    console.error('❌ Erreur lors du transfert de pose:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erreur lors du transfert de pose',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * POST /api/edit/transfer-style
 * Applique le style d'une image à une autre
 */
router.post('/transfer-style', upload.fields([
  { name: 'styleSource', maxCount: 1 },
  { name: 'targetImage', maxCount: 1 }
]), async (req, res) => {
  try {
    let { styleSourceUrl, targetImageUrl, aspectRatio, outputFormat } = req.body;

    // Gérer les fichiers uploadés
    if (req.files) {
      if (req.files.styleSource && req.files.styleSource[0]) {
        const file = req.files.styleSource[0];
        const base64 = file.buffer.toString('base64');
        styleSourceUrl = `data:${file.mimetype};base64,${base64}`;
      }
      if (req.files.targetImage && req.files.targetImage[0]) {
        const file = req.files.targetImage[0];
        const base64 = file.buffer.toString('base64');
        targetImageUrl = `data:${file.mimetype};base64,${base64}`;
      }
    }

    if (!styleSourceUrl || !targetImageUrl) {
      return res.status(400).json({
        success: false,
        error: 'Deux images sont requises: styleSource et targetImage'
      });
    }

    const result = await transferStyle({
      styleSourceUrl,
      targetImageUrl,
      aspectRatio: aspectRatio || 'match_input_image',
      outputFormat: outputFormat || 'webp'
    });

    res.json(result);

  } catch (error) {
    console.error('❌ Erreur lors du transfert de style:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erreur lors du transfert de style',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * GET /api/edit/status
 * Vérifie le statut du service d'édition
 */
router.get('/status', (req, res) => {
  const configured = isReplicateConfigured();
  
  res.json({
    success: true,
    configured: configured,
    service: 'qwen-image-edit-plus',
    capabilities: {
      editImage: true,
      editSingleImage: true,
      transferPose: true,
      transferStyle: true,
      multipleImages: true
    },
    message: configured 
      ? 'Service d\'édition d\'images opérationnel'
      : 'Service en mode simulation (configurez REPLICATE_API_TOKEN)'
  });
});

/**
 * GET /api/edit/examples
 * Retourne des exemples de prompts pour l'édition
 */
router.get('/examples', (req, res) => {
  res.json({
    success: true,
    examples: {
      background_replacement: {
        description: 'Remplacer l\'arrière-plan',
        prompt: 'Replace the background with a mountain landscape at sunset',
        imagesNeeded: 1
      },
      object_modification: {
        description: 'Modifier un objet',
        prompt: 'Change the car color to red',
        imagesNeeded: 1
      },
      style_transfer: {
        description: 'Transférer le style artistique',
        prompt: 'Apply the artistic style from image 1 to image 2',
        imagesNeeded: 2
      },
      pose_transfer: {
        description: 'Transférer la pose',
        prompt: 'The person in image 2 adopts the pose from image 1',
        imagesNeeded: 2
      },
      lighting_adjustment: {
        description: 'Ajuster l\'éclairage',
        prompt: 'Improve the lighting to make it look like golden hour',
        imagesNeeded: 1
      },
      artistic_transformation: {
        description: 'Transformation artistique',
        prompt: 'Transform this photo into a watercolor painting',
        imagesNeeded: 1
      },
      image_fusion: {
        description: 'Fusionner des éléments',
        prompt: 'Combine the lighting from image 1 with the subject from image 2',
        imagesNeeded: 2
      }
    }
  });
});

export default router;
