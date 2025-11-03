import express from 'express';
import {
  generateVideo,
  validateVideoParams,
  isReplicateConfigured,
  VIDEO_WORKFLOWS
} from '../services/videoGenerator.js';

const router = express.Router();

/**
 * POST /api/video/generate
 * Génère une vidéo à partir d'un prompt (text-to-video)
 * 
 * Body (JSON):
 * - prompt: string (requis) - Description de la vidéo
 * - optimizePrompt: boolean (optionnel, défaut: false)
 * - numFrames: number (optionnel, défaut: 81, min: 81, max: 121)
 * - aspectRatio: string (optionnel, défaut: '16:9', valeurs: '16:9' ou '9:16')
 * - resolution: string (optionnel, défaut: '480p', valeurs: '480p' ou '720p')
 * - framesPerSecond: number (optionnel, défaut: 16, min: 5, max: 30)
 * - interpolateOutput: boolean (optionnel, défaut: true)
 * - goFast: boolean (optionnel, défaut: true)
 * - sampleShift: number (optionnel, défaut: 12, min: 1, max: 20)
 * - seed: number (optionnel)
 * - disableSafetyChecker: boolean (optionnel, défaut: false)
 * - loraWeightsTransformer: string (optionnel) - URL du LoRA
 * - loraScaleTransformer: number (optionnel, défaut: 1)
 * - loraWeightsTransformer2: string (optionnel) - URL du LoRA 2
 * - loraScaleTransformer2: number (optionnel, défaut: 1)
 */
router.post('/generate', async (req, res) => {
  try {
    const {
      prompt,
      optimizePrompt,
      numFrames,
      aspectRatio,
      resolution,
      framesPerSecond,
      interpolateOutput,
      goFast,
      sampleShift,
      seed,
      disableSafetyChecker,
      loraWeightsTransformer,
      loraScaleTransformer,
      loraWeightsTransformer2,
      loraScaleTransformer2
    } = req.body;

    // Validation du prompt
    if (!prompt || !prompt.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Le prompt est requis'
      });
    }

    console.log('📹 Génération de vidéo demandée');
    console.log('📝 Prompt:', prompt);
    console.log('⚙️  Paramètres:', {
      numFrames: numFrames || 81,
      aspectRatio: aspectRatio || '16:9',
      resolution: resolution || '480p',
      fps: framesPerSecond || 16
    });

    // Préparer les paramètres
    const params = {
      prompt: prompt.trim(),
      optimizePrompt: optimizePrompt !== undefined ? optimizePrompt : false,
      numFrames: numFrames !== undefined ? parseInt(numFrames) : 81,
      aspectRatio: aspectRatio || '16:9',
      resolution: resolution || '480p',
      framesPerSecond: framesPerSecond !== undefined ? parseInt(framesPerSecond) : 16,
      interpolateOutput: interpolateOutput !== undefined ? interpolateOutput : true,
      goFast: goFast !== undefined ? goFast : true,
      sampleShift: sampleShift !== undefined ? parseFloat(sampleShift) : 12,
      seed: seed !== undefined && seed !== null ? parseInt(seed) : null,
      disableSafetyChecker: disableSafetyChecker || false,
      loraWeightsTransformer: loraWeightsTransformer || null,
      loraScaleTransformer: loraScaleTransformer !== undefined ? parseFloat(loraScaleTransformer) : 1,
      loraWeightsTransformer2: loraWeightsTransformer2 || null,
      loraScaleTransformer2: loraScaleTransformer2 !== undefined ? parseFloat(loraScaleTransformer2) : 1
    };

    // Appeler le service
    const result = await generateVideo(params);

    res.json(result);

  } catch (error) {
    console.error('❌ Erreur lors de la génération de vidéo:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erreur lors de la génération de vidéo',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * POST /api/video/generate-with-workflow
 * Génère une vidéo en utilisant un workflow prédéfini
 * 
 * Body (JSON):
 * - prompt: string (requis)
 * - workflow: string (requis) - Nom du workflow ('youtube', 'social_vertical', 'cinematic', 'action', 'preview')
 * - seed: number (optionnel)
 */
router.post('/generate-with-workflow', async (req, res) => {
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

    const workflowSettings = VIDEO_WORKFLOWS[workflow];
    if (!workflowSettings) {
      return res.status(400).json({
        success: false,
        error: `Workflow inconnu: ${workflow}. Workflows disponibles: ${Object.keys(VIDEO_WORKFLOWS).join(', ')}`
      });
    }

    console.log(`🎬 Génération avec workflow: ${workflowSettings.name}`);
    console.log('📝 Prompt:', prompt);

    // Combiner les paramètres du workflow avec le prompt
    const params = {
      prompt: prompt.trim(),
      ...workflowSettings.settings,
      seed: seed !== undefined && seed !== null ? parseInt(seed) : null
    };

    const result = await generateVideo(params);

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
 * GET /api/video/workflows
 * Récupère la liste des workflows disponibles
 */
router.get('/workflows', (req, res) => {
  try {
    const workflows = Object.entries(VIDEO_WORKFLOWS).map(([key, value]) => ({
      id: key,
      name: value.name,
      settings: value.settings
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
 * GET /api/video/status
 * Vérifie l'état du service de génération de vidéos
 */
router.get('/status', (req, res) => {
  try {
    const configured = isReplicateConfigured();
    
    res.json({
      success: true,
      service: 'Video Generator (WAN 2.2 T2V Fast)',
      configured: configured,
      mode: configured ? 'production' : 'mock',
      model: 'wan-video/wan-2.2-t2v-fast',
      capabilities: [
        'Text-to-video generation',
        'Two aspect ratios (16:9, 9:16)',
        '480p and 720p resolution',
        'Frame interpolation to 30 FPS',
        'LoRA support',
        'Prompt optimization (Chinese)'
      ],
      workflows: Object.keys(VIDEO_WORKFLOWS)
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
 * GET /api/video/examples
 * Retourne des exemples de prompts pour la génération de vidéos
 */
router.get('/examples', (req, res) => {
  try {
    const examples = [
      {
        category: 'Nature',
        prompts: [
          'Ocean waves crashing on rocky shore at sunset, aerial drone shot descending, golden hour, dramatic and peaceful',
          'Serene mountain landscape at dawn, gentle camera pan, mist rolling through valleys, cinematic atmosphere',
          'Forest path with sunlight filtering through trees, slow dolly forward, magical atmosphere, peaceful'
        ]
      },
      {
        category: 'Urban',
        prompts: [
          'Futuristic city skyline at night, slow pan across buildings, neon lights, cyberpunk aesthetic, cinematic',
          'Busy street in Tokyo with pedestrians and neon signs, tracking shot, vibrant colors, urban energy',
          'Modern architecture building exterior, camera orbiting around, clean lines, professional visualization'
        ]
      },
      {
        category: 'Action',
        prompts: [
          'Sports car racing along a coastal highway at sunset, dynamic tracking shot, cinematic lighting',
          'Skateboard trick in slow motion at skatepark, close-up follow cam, dramatic lighting',
          'Mountain biker descending steep trail, POV shot, fast-paced action, dynamic camera'
        ]
      },
      {
        category: 'Product',
        prompts: [
          'Professional product showcase of luxury watch, rotating 360 degrees, studio lighting, clean background',
          'Modern smartphone floating and rotating, clean studio environment, sleek presentation',
          'Perfume bottle on pedestal with dramatic lighting, slow camera orbit, luxury aesthetic'
        ]
      },
      {
        category: 'Artistic',
        prompts: [
          'Abstract flowing colors and patterns, smooth transitions, vibrant and mesmerizing',
          'Watercolor painting coming to life, brush strokes animating, artistic and creative',
          'Geometric shapes morphing and transforming, minimal design, modern aesthetic'
        ]
      },
      {
        category: 'Social Media',
        prompts: [
          'Person walking through busy city street, vertical shot for social media, dynamic and eye-catching',
          'Food being prepared in kitchen, close-up overhead shot, appetizing and colorful',
          'Fashion model walking on runway, vertical format, dramatic lighting, professional'
        ]
      }
    ];

    res.json({
      success: true,
      examples,
      tips: [
        'Décrivez la scène, l\'action et le mouvement de caméra',
        'Spécifiez le style et l\'ambiance (cinematic, dramatic, peaceful, etc.)',
        'Mentionnez l\'éclairage (golden hour, neon lights, studio lighting, etc.)',
        'Incluez le type de plan (aerial, close-up, tracking shot, etc.)',
        'Pour action: utilisez sample_shift élevé (15-18)',
        'Pour scènes calmes: utilisez sample_shift bas (8-10)',
        '16:9 pour YouTube/web, 9:16 pour TikTok/Stories'
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
