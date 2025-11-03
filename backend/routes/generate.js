import express from 'express';
import { 
  generateImage, 
  transformImage, 
  isReplicateConfigured,
  validateGenerationParams 
} from '../services/imageGenerator.js';
import { saveCompleteOperation } from '../services/dataStorage.js';

const router = express.Router();

/**
 * POST /api/generate/text-to-image
 * Génère une image à partir d'un prompt textuel
 */
router.post('/text-to-image', async (req, res) => {
  try {
    const {
      prompt,
      negativePrompt,
      guidance,
      numInferenceSteps,
      aspectRatio,
      imageSize,
      outputFormat,
      outputQuality,
      enhancePrompt,
      seed,
    } = req.body;

    // Validation
    if (!prompt) {
      return res.status(400).json({
        success: false,
        error: 'Le champ "prompt" est requis',
      });
    }

    const validation = validateGenerationParams(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: 'Paramètres invalides',
        details: validation.errors,
      });
    }

    // Vérifier si Replicate est configuré
    if (!isReplicateConfigured()) {
      console.warn('⚠️  REPLICATE_API_TOKEN non configuré');
      
      // Réponse mock pour le développement
      return res.json({
        success: true,
        imageUrl: 'https://via.placeholder.com/1280x720/667EEA/FFFFFF?text=Generated+Image+(Mock)',
        mock: true,
        message: 'Mode mock - configurez REPLICATE_API_TOKEN pour utiliser le vrai modèle',
        params: { prompt, aspectRatio, guidance },
      });
    }

    // Génération de l'image
    const imageUrl = await generateImage({
      prompt,
      negativePrompt,
      guidance,
      numInferenceSteps,
      aspectRatio,
      imageSize,
      outputFormat,
      outputQuality,
      enhancePrompt,
      seed,
    });

    // Sauvegarder l'opération dans le système de stockage
    try {
      const saveResult = await saveCompleteOperation({
        operationType: 'text_to_image',
        prompt,
        parameters: {
          negativePrompt,
          guidance: guidance || 3,
          numInferenceSteps: numInferenceSteps || 30,
          aspectRatio: aspectRatio || '16:9',
          imageSize,
          outputFormat,
          outputQuality,
          enhancePrompt,
          seed
        },
        inputImages: [], // Pas d'images en entrée pour text-to-image
        resultUrl: imageUrl,
        workflowAnalysis: null,
        error: null
      });
      console.log('✅ Opération sauvegardée:', saveResult.operationId);
    } catch (saveError) {
      console.error('⚠️ Erreur sauvegarde opération:', saveError.message);
      // Ne pas bloquer la réponse si la sauvegarde échoue
    }

    res.json({
      success: true,
      imageUrl: imageUrl,
      mock: false,
      params: {
        prompt,
        guidance: guidance || 3,
        numInferenceSteps: numInferenceSteps || 30,
        aspectRatio: aspectRatio || '16:9',
      },
    });
  } catch (error) {
    console.error('Erreur lors de la génération d\'image:', error);
    
    // Sauvegarder l'échec
    try {
      await saveCompleteOperation({
        operationType: 'text_to_image',
        prompt: req.body.prompt,
        parameters: req.body,
        inputImages: [],
        resultUrl: null,
        workflowAnalysis: null,
        error: error.message
      });
    } catch (saveError) {
      console.error('⚠️ Erreur sauvegarde échec:', saveError.message);
    }
    
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la génération de l\'image',
      details: error.message,
    });
  }
});

/**
 * POST /api/generate/img-to-img
 * Transforme une image existante avec un prompt
 */
router.post('/img-to-img', async (req, res) => {
  try {
    const {
      imageUrl,
      prompt,
      strength,
      negativePrompt,
      guidance,
      numInferenceSteps,
      outputFormat,
    } = req.body;

    // Validation
    if (!imageUrl) {
      return res.status(400).json({
        success: false,
        error: 'Le champ "imageUrl" est requis',
      });
    }

    if (!prompt) {
      return res.status(400).json({
        success: false,
        error: 'Le champ "prompt" est requis',
      });
    }

    // Vérifier si Replicate est configuré
    if (!isReplicateConfigured()) {
      console.warn('⚠️  REPLICATE_API_TOKEN non configuré');
      
      return res.json({
        success: true,
        imageUrl: 'https://via.placeholder.com/1280x720/48BB78/FFFFFF?text=Transformed+Image+(Mock)',
        mock: true,
        message: 'Mode mock - configurez REPLICATE_API_TOKEN',
        params: { prompt, strength },
      });
    }

    // Transformation de l'image
    const resultImageUrl = await transformImage({
      imageUrl,
      prompt,
      strength,
      negativePrompt,
      guidance,
      numInferenceSteps,
      outputFormat,
    });

    res.json({
      success: true,
      imageUrl: resultImageUrl,
      originalImageUrl: imageUrl,
      mock: false,
      params: {
        prompt,
        strength: strength || 0.7,
        guidance: guidance || 3.5,
      },
    });
  } catch (error) {
    console.error('Erreur lors de la transformation d\'image:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la transformation de l\'image',
      details: error.message,
    });
  }
});

/**
 * GET /api/generate/status
 * Vérifie si le service est configuré
 */
router.get('/status', (req, res) => {
  const configured = isReplicateConfigured();
  
  res.json({
    success: true,
    configured: configured,
    service: 'qwen-image',
    capabilities: {
      textToImage: true,
      imgToImg: true,
    },
    message: configured 
      ? 'Service de génération d\'images opérationnel' 
      : 'REPLICATE_API_TOKEN non configuré - mode mock actif',
  });
});

/**
 * GET /api/generate/presets
 * Retourne des presets de configuration
 */
router.get('/presets', (req, res) => {
  res.json({
    success: true,
    presets: {
      fast: {
        name: 'Rapide',
        description: 'Génération rapide avec qualité acceptable',
        params: {
          guidance: 3,
          numInferenceSteps: 20,
          imageSize: 'optimize_for_speed',
        },
      },
      balanced: {
        name: 'Équilibré',
        description: 'Bon compromis entre vitesse et qualité',
        params: {
          guidance: 3,
          numInferenceSteps: 30,
          imageSize: 'optimize_for_quality',
        },
      },
      quality: {
        name: 'Haute Qualité',
        description: 'Meilleure qualité, plus lent',
        params: {
          guidance: 4,
          numInferenceSteps: 50,
          imageSize: 'optimize_for_quality',
          outputQuality: 100,
        },
      },
      portrait: {
        name: 'Portrait',
        description: 'Optimisé pour portraits réalistes',
        params: {
          guidance: 2.5,
          numInferenceSteps: 45,
          aspectRatio: '3:4',
          negativePrompt: 'distorted face, extra limbs, blurry, low quality',
        },
      },
      landscape: {
        name: 'Paysage',
        description: 'Optimisé pour paysages',
        params: {
          guidance: 3,
          numInferenceSteps: 40,
          aspectRatio: '16:9',
        },
      },
    },
  });
});

export default router;
