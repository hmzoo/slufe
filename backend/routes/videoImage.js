import express from 'express';
import multer from 'multer';
import {
  generateVideoFromImage,
  validateVideoImageParams,
  isReplicateConfigured,
  VIDEO_IMAGE_WORKFLOWS
} from '../services/videoImageGenerator.js';

const router = express.Router();

// Configuration de multer pour accepter les images
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Seules les images sont acceptées'), false);
    }
  },
});

/**
 * POST /api/video-image/generate
 * Génère une vidéo à partir d'une ou deux images (image-to-video)
 * 
 * Multipart form-data:
 * - startImage: File (requis) - Image de départ
 * - endImage: File (optionnel) - Image de fin
 * - prompt: string (requis) - Description de l'animation
 * - optimizePrompt: boolean (optionnel, défaut: false)
 * - numFrames: number (optionnel, défaut: 81, min: 81, max: 121)
 * - aspectRatio: string (optionnel, défaut: '16:9', valeurs: '16:9' ou '9:16')
 * - resolution: string (optionnel, défaut: '480p', valeurs: '480p' ou '720p')
 * - framesPerSecond: number (optionnel, défaut: 16, min: 5, max: 30)
 * - interpolateOutput: boolean (optionnel, défaut: true)
 * - goFast: boolean (optionnel, défaut: true)
 * - sampleShift: number (optionnel, défaut: 12, min: 1, max: 20)
 * - imageStrength: number (optionnel, défaut: 0.5, min: 0, max: 1)
 * - endImageStrength: number (optionnel, défaut: 0.5, min: 0, max: 1)
 * - seed: number (optionnel)
 * - disableSafetyChecker: boolean (optionnel, défaut: false)
 */
router.post('/generate', upload.fields([
  { name: 'startImage', maxCount: 1 },
  { name: 'endImage', maxCount: 1 }
]), async (req, res) => {
  try {
    const { prompt, optimizePrompt, numFrames, aspectRatio, resolution,
            framesPerSecond, interpolateOutput, goFast, sampleShift,
            imageStrength, endImageStrength, seed, disableSafetyChecker } = req.body;

    // Vérifier que l'image de départ est présente
    if (!req.files || !req.files.startImage || req.files.startImage.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'L\'image de départ (startImage) est requise'
      });
    }

    // Validation du prompt
    if (!prompt || !prompt.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Le prompt est requis'
      });
    }

    const startImageFile = req.files.startImage[0];
    const endImageFile = req.files.endImage ? req.files.endImage[0] : null;

    console.log('🎬 Génération de vidéo image-to-video demandée');
    console.log('📝 Prompt:', prompt);
    console.log('🖼️  Images:', {
      startImage: startImageFile.originalname,
      endImage: endImageFile ? endImageFile.originalname : 'Aucune',
    });
    console.log('⚙️  Paramètres:', {
      numFrames: numFrames || 81,
      aspectRatio: aspectRatio || '16:9',
      resolution: resolution || '480p',
      fps: framesPerSecond || 16
    });

    // Convertir les images en data URI
    const startImageDataUri = `data:${startImageFile.mimetype};base64,${startImageFile.buffer.toString('base64')}`;
    const lastImageDataUri = endImageFile 
      ? `data:${endImageFile.mimetype};base64,${endImageFile.buffer.toString('base64')}`
      : null;

    // Préparer les paramètres
    const params = {
      startImage: startImageDataUri,
      prompt: prompt.trim(),
      numFrames: numFrames !== undefined ? parseInt(numFrames) : 81,
      resolution: resolution || '480p',
      framesPerSecond: framesPerSecond !== undefined ? parseInt(framesPerSecond) : 16,
      interpolateOutput: interpolateOutput !== undefined ? interpolateOutput === 'true' : true,
      goFast: goFast !== undefined ? goFast === 'true' : true,
      sampleShift: sampleShift !== undefined ? parseFloat(sampleShift) : 12,
      seed: seed !== undefined && seed !== null ? parseInt(seed) : null,
      disableSafetyChecker: disableSafetyChecker === 'true' || false,
    };

    // Ajouter l'image de fin si présente
    if (lastImageDataUri) {
      params.lastImage = lastImageDataUri;
    }

    // Appeler le service
    const result = await generateVideoFromImage(params);

    res.json(result);

  } catch (error) {
    console.error('❌ Erreur lors de la génération de vidéo image-to-video:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erreur lors de la génération de vidéo',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * POST /api/video-image/generate-with-workflow
 * Génère une vidéo avec un workflow prédéfini
 * 
 * Multipart form-data:
 * - startImage: File (requis)
 * - endImage: File (optionnel, requis pour certains workflows)
 * - prompt: string (requis)
 * - workflow: string (requis) - Nom du workflow
 * - seed: number (optionnel)
 */
router.post('/generate-with-workflow', upload.fields([
  { name: 'startImage', maxCount: 1 },
  { name: 'endImage', maxCount: 1 }
]), async (req, res) => {
  try {
    const { prompt, workflow, seed } = req.body;

    if (!prompt || !prompt.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Le prompt est requis'
      });
    }

    if (!workflow) {
      return res.status(400).json({
        success: false,
        error: 'Le workflow est requis'
      });
    }

    const workflowSettings = VIDEO_IMAGE_WORKFLOWS[workflow];
    if (!workflowSettings) {
      return res.status(400).json({
        success: false,
        error: `Workflow inconnu: ${workflow}. Workflows disponibles: ${Object.keys(VIDEO_IMAGE_WORKFLOWS).join(', ')}`
      });
    }

    // Vérifier que l'image de départ est présente
    if (!req.files || !req.files.startImage || req.files.startImage.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'L\'image de départ (startImage) est requise'
      });
    }

    const startImageFile = req.files.startImage[0];
    const endImageFile = req.files.endImage ? req.files.endImage[0] : null;

    // Vérifier si le workflow nécessite une image de fin
    if (workflowSettings.settings.requiresEndImage && !endImageFile) {
      return res.status(400).json({
        success: false,
        error: `Le workflow "${workflowSettings.name}" nécessite une image de fin (endImage)`
      });
    }

    console.log(`🎬 Génération avec workflow: ${workflowSettings.name}`);
    console.log('📝 Prompt:', prompt);

    // Convertir les images en data URI
    const startImageDataUri = `data:${startImageFile.mimetype};base64,${startImageFile.buffer.toString('base64')}`;
    const lastImageDataUri = endImageFile 
      ? `data:${endImageFile.mimetype};base64,${endImageFile.buffer.toString('base64')}`
      : null;

    // Combiner les paramètres du workflow avec le prompt
    const params = {
      startImage: startImageDataUri,
      prompt: prompt.trim(),
      ...workflowSettings.settings,
      seed: seed !== undefined && seed !== null ? parseInt(seed) : null
    };

    // Ajouter l'image de fin si présente
    if (lastImageDataUri) {
      params.lastImage = lastImageDataUri;
    }

    const result = await generateVideoFromImage(params);

    res.json({
      ...result,
      workflow: workflowSettings.name
    });

  } catch (error) {
    console.error('❌ Erreur lors de la génération avec workflow:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erreur lors de la génération avec workflow',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * GET /api/video-image/workflows
 * Récupère la liste des workflows disponibles
 */
router.get('/workflows', (req, res) => {
  try {
    const workflows = Object.entries(VIDEO_IMAGE_WORKFLOWS).map(([key, value]) => ({
      id: key,
      name: value.name,
      description: value.description,
      settings: value.settings,
      requiresEndImage: value.settings.requiresEndImage || false
    }));

    res.json({
      success: true,
      workflows
    });
  } catch (error) {
    console.error('❌ Erreur:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/video-image/status
 * Vérifie l'état du service de génération de vidéos image-to-video
 */
router.get('/status', (req, res) => {
  try {
    const configured = isReplicateConfigured();
    
    res.json({
      success: true,
      service: 'Video Image Generator (WAN 2.2 I2V Fast)',
      configured: configured,
      mode: configured ? 'production' : 'mock',
      model: 'wan-video/wan-2.2-i2v-fast',
      capabilities: [
        'Image-to-video generation',
        'Single image animation',
        'Two image morphing/transition',
        'Two aspect ratios (16:9, 9:16)',
        '480p and 720p resolution',
        'Frame interpolation to 30 FPS',
        'Image strength control',
        'Seamless loops support'
      ],
      workflows: Object.keys(VIDEO_IMAGE_WORKFLOWS)
    });
  } catch (error) {
    console.error('❌ Erreur:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/video-image/examples
 * Retourne des exemples de prompts pour image-to-video
 */
router.get('/examples', (req, res) => {
  try {
    const examples = [
      {
        category: 'Animation de Portrait',
        prompts: [
          'Person smiling and looking at camera, natural gentle movement, soft lighting',
          'Portrait with hair gently moving in the wind, cinematic style',
          'Close-up of face with subtle expressions changing, professional photography'
        ],
        notes: 'Utilisez imageStrength élevé (0.8-0.9) pour conserver les détails du visage'
      },
      {
        category: 'Animation de Paysage',
        prompts: [
          'Ocean waves moving slowly, clouds drifting across sky, peaceful atmosphere',
          'Trees swaying gently in the breeze, leaves rustling, natural movement',
          'Waterfall flowing smoothly, mist rising, serene nature scene'
        ],
        notes: 'sampleShift 8-12 pour mouvements naturels et fluides'
      },
      {
        category: 'Transition Entre Images',
        prompts: [
          'Smooth morph from day to night scene, gradual lighting change',
          'Transform from summer to winter landscape, seamless transition',
          'Facial expression changing from serious to smiling, natural progression'
        ],
        notes: 'Nécessite 2 images (startImage + endImage). imageStrength et endImageStrength à 0.7-0.8'
      },
      {
        category: 'Mouvement de Caméra',
        prompts: [
          'Slow camera zoom into the subject, smooth and cinematic',
          'Camera slowly panning from left to right, revealing the scene',
          'Dolly shot moving forward through the environment, professional cinematography'
        ],
        notes: 'Bon pour créer l\'illusion de mouvement de caméra à partir d\'une image fixe'
      },
      {
        category: 'Objets et Produits',
        prompts: [
          'Product rotating 360 degrees, studio lighting, professional showcase',
          'Car slowly driving forward, cinematic shot, dynamic movement',
          'Watch hands moving showing time passing, close-up macro shot'
        ],
        notes: 'imageStrength moyen (0.5-0.6) pour permettre plus de mouvement'
      },
      {
        category: 'Effets Artistiques',
        prompts: [
          'Still image coming to life with magical particles and light, fantasy style',
          'Painting transforming from sketch to full color, artistic process',
          'Scene gradually revealing through dissolving fog, mysterious atmosphere'
        ],
        notes: 'Créativité élevée: sampleShift 15-18, imageStrength 0.4-0.6'
      }
    ];

    res.json({
      success: true,
      examples,
      tips: [
        '🖼️ IMAGE UNIQUE: Décrivez le mouvement naturel souhaité (cheveux, vêtements, eau, etc.)',
        '🖼️🖼️ DEUX IMAGES: Décrivez la transition entre les deux états',
        '💪 imageStrength élevé (0.7-0.9): Conserve plus de détails de l\'image originale',
        '💪 imageStrength bas (0.3-0.5): Permet plus de mouvement et créativité',
        '🎬 sampleShift élevé (15-20): Mouvements rapides et dynamiques',
        '🎬 sampleShift bas (6-10): Mouvements subtils et naturels',
        '⏱️ 81 frames = ~3-5s selon FPS, 121 frames = ~4-8s selon FPS',
        '🔄 Pour boucles seamless: utilisez 2 images identiques avec endImage',
        '📐 16:9 pour paysage/YouTube, 9:16 pour portrait/Stories',
        '🎯 interpolateOutput=true pour 30 FPS fluide, false pour FPS original'
      ]
    });
  } catch (error) {
    console.error('❌ Erreur:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
