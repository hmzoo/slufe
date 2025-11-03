import express from 'express';
import multer from 'multer';
import crypto from 'crypto';
import {
  analyzeWorkflow,
  getWorkflowExamples,
  AVAILABLE_WORKFLOWS
} from '../services/workflowAnalyzer.js';
import {
  executeMultiStepWorkflow,
  isMultiStepWorkflow,
  getMultiStepWorkflow
} from '../services/workflowOrchestrator.js';

// Import des services pour exécution automatique
import { enhancePrompt } from '../services/promptEnhancer.js';
import { generateImage } from '../services/imageGenerator.js';
import { editSingleImage, editImage } from '../services/imageEditor.js';
import { generateVideo } from '../services/videoGenerator.js';
import { generateVideoFromImage } from '../services/videoImageGenerator.js';
import { analyzeImage } from '../services/imageAnalyzer.js';
import { saveCompleteOperation } from '../services/dataStorage.js';

const router = express.Router();

// Cache en mémoire pour les analyses d'images
// Structure: { imageHash: { description, timestamp } }
const imageAnalysisCache = new Map();
const CACHE_DURATION = 60 * 60 * 1000; // 1 heure

/**
 * Génère un hash pour une image (pour le cache)
 */
function generateImageHash(imageBuffer) {
  return crypto.createHash('md5').update(imageBuffer).digest('hex');
}

/**
 * Analyse une image et met en cache le résultat
 */
async function getImageDescription(imageBuffer, forceAnalyze = false) {
  const imageHash = generateImageHash(imageBuffer);
  
  // Vérifier le cache
  if (!forceAnalyze && imageAnalysisCache.has(imageHash)) {
    const cached = imageAnalysisCache.get(imageHash);
    const age = Date.now() - cached.timestamp;
    
    if (age < CACHE_DURATION) {
      console.log('✅ Description trouvée dans le cache');
      return cached.description;
    } else {
      console.log('⏰ Cache expiré, re-analyse nécessaire');
      imageAnalysisCache.delete(imageHash);
    }
  }
  
  // Analyser l'image
  console.log('🔍 Analyse de l\'image...');
  const description = await analyzeImage({ image: imageBuffer });
  
  // Mettre en cache
  imageAnalysisCache.set(imageHash, {
    description,
    timestamp: Date.now()
  });
  
  console.log('💾 Description mise en cache');
  return description;
}

// Configuration de multer pour compter les images
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max par image
  },
});

/**
 * Middleware conditionnel pour multer
 * N'utilise multer que si Content-Type est multipart/form-data
 */
function conditionalMulter(req, res, next) {
  const contentType = req.get('Content-Type') || '';
  if (contentType.includes('multipart/form-data')) {
    return upload.array('images', 10)(req, res, next);
  }
  next();
}

/**
 * POST /api/workflow/analyze
 * Analyse le prompt et les images pour déterminer le workflow optimal
 * 
 * Multipart form-data ou JSON:
 * - prompt: string (requis) - Prompt de l'utilisateur
 * - images: File[] (optionnel) - Images fournies
 * 
 * OU
 * 
 * JSON:
 * - prompt: string (requis)
 * - imageCount: number (optionnel) - Nombre d'images disponibles
 * - imageDescriptions: string[] (optionnel) - Descriptions des images
 */
router.post('/analyze', conditionalMulter, async (req, res) => {
  try {
    console.log('🔍 POST /analyze - req.body complet:', JSON.stringify(req.body, null, 2));
    
    const { prompt, imageDescriptions: providedDescriptions } = req.body;
    
    console.log('🔍 POST /analyze - Body reçu:', {
      prompt: prompt?.substring(0, 50),
      hasProvidedDescriptions: !!providedDescriptions,
      providedDescriptionsType: typeof providedDescriptions,
      providedDescriptionsLength: providedDescriptions?.length,
      providedDescriptionsIsArray: Array.isArray(providedDescriptions),
      hasFiles: !!req.files?.length,
      filesCount: req.files?.length || 0
    });

    if (!prompt || !prompt.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Le prompt est requis'
      });
    }

    // Compter les images (soit depuis files, soit depuis imageCount)
    let imageCount = 0;
    let imageDescriptions = [];
    
    // Si des descriptions sont fournies directement (depuis le store frontend)
    if (providedDescriptions && Array.isArray(providedDescriptions) && providedDescriptions.length > 0) {
      imageDescriptions = providedDescriptions;
      imageCount = imageDescriptions.length;
      console.log('📋 Descriptions reçues depuis le frontend:', imageDescriptions.length);
    }
    // Sinon, analyser les images uploadées
    else if (req.files && req.files.length > 0) {
      imageCount = req.files.length;
      
      // Analyser chaque image si disponible
      console.log('🖼️  Analyse des images uploadées...');
      for (let i = 0; i < req.files.length; i++) {
        try {
          const description = await getImageDescription(req.files[i].buffer);
          imageDescriptions.push(description);
          console.log(`✅ Image ${i + 1} analysée`);
        } catch (error) {
          console.warn(`⚠️  Erreur analyse image ${i + 1}:`, error.message);
          imageDescriptions.push('Image non analysée');
        }
      }
    } else if (req.body.imageCount !== undefined) {
      imageCount = parseInt(req.body.imageCount);
    }

    console.log('🔍 Analyse de workflow demandée');
    console.log('📝 Prompt:', prompt);
    console.log('🖼️  Images:', imageCount);
    if (imageDescriptions.length > 0) {
      console.log('📋 Descriptions à envoyer à l\'analyseur:', imageDescriptions.length);
      console.log('📝 Aperçu descriptions:', imageDescriptions.map((d, i) => `${i + 1}: ${d.substring(0, 50)}...`));
    }

    // Analyser le workflow avec les descriptions d'images
    const result = await analyzeWorkflow({
      prompt: prompt.trim(),
      imageCount,
      imageDescriptions
    });

    res.json(result);

  } catch (error) {
    console.error('❌ Erreur lors de l\'analyse:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erreur lors de l\'analyse du workflow',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * POST /api/workflow/execute
 * Analyse ET exécute automatiquement le workflow recommandé
 * 
 * Multipart form-data:
 * - prompt: string (requis) - Prompt de l'utilisateur
 * - images: File[] (optionnel) - Images fournies
 * - useOptimizedPrompt: boolean (optionnel, défaut: true) - Utiliser le prompt optimisé
 * 
 * Retourne directement le résultat de l'exécution (image/vidéo)
 */
router.post('/execute', upload.array('images', 10), async (req, res) => {
  try {
    const { prompt, useOptimizedPrompt = 'true' } = req.body;

    if (!prompt || !prompt.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Le prompt est requis'
      });
    }

    // Compter et stocker les images
    const images = req.files || [];
    const imageCount = images.length;
    const imageDescriptions = [];

    console.log('🚀 Exécution automatique de workflow');
    console.log('📝 Prompt:', prompt);
    console.log('🖼️  Images:', imageCount);

    // Analyser les images si disponibles
    if (images.length > 0) {
      console.log('🖼️  Analyse des images pour le contexte...');
      for (let i = 0; i < images.length; i++) {
        try {
          const description = await getImageDescription(images[i].buffer);
          imageDescriptions.push(description);
          console.log(`✅ Image ${i + 1} analysée`);
        } catch (error) {
          console.warn(`⚠️  Erreur analyse image ${i + 1}:`, error.message);
          imageDescriptions.push('Image non analysée');
        }
      }
    }

    // Étape 1: Analyser le workflow avec les descriptions
    const analysis = await analyzeWorkflow({
      prompt: prompt.trim(),
      imageCount,
      imageDescriptions
    });

    if (!analysis.success) {
      return res.status(400).json(analysis);
    }

    console.log('✅ Workflow détecté:', analysis.workflow.name);
    console.log('📊 Confiance:', (analysis.analysis.confidence * 100).toFixed(0) + '%');

    // Vérifier les exigences
    if (!analysis.requirements.satisfied) {
      return res.status(400).json({
        success: false,
        error: `Ce workflow nécessite ${analysis.requirements.imagesNeeded} image(s), mais seulement ${analysis.requirements.imagesProvided} fournie(s)`,
        analysis
      });
    }

    // Déterminer le prompt à utiliser
    const finalPrompt = useOptimizedPrompt === 'true' 
      ? analysis.prompts.optimized 
      : prompt;

    console.log('📝 Prompt utilisé:', finalPrompt);

    // Étape 2: Exécuter le workflow approprié
    let result;
    const workflowId = analysis.workflow.id;

    switch (workflowId) {
      case 'text_to_image':
        console.log('🎨 Génération d\'image...');
        const imageUrl = await generateImage({ prompt: finalPrompt });
        result = {
          success: true,
          type: 'image',
          imageUrl: imageUrl,
          message: 'Image générée avec succès',
          mock: false
        };
        break;

      case 'text_to_video':
        console.log('🎬 Génération de vidéo...');
        const videoResult = await generateVideo({ prompt: finalPrompt });
        result = {
          success: true,
          type: 'video',
          videoUrl: videoResult.videoUrl,
          message: 'Vidéo générée avec succès',
          mock: videoResult.mock || false,
          params: videoResult.params
        };
        break;

      case 'image_edit_single':
        console.log('✏️ Édition d\'image unique...');
        if (images.length === 0) {
          throw new Error('Une image est requise pour l\'édition');
        }
        const editedImageUrl = await editSingleImage({
          prompt: finalPrompt,
          image: images[0].buffer
        });
        result = {
          success: true,
          type: 'image',
          imageUrl: editedImageUrl,
          message: 'Image éditée avec succès',
          mock: false
        };
        break;

      case 'image_edit_multiple':
        console.log('✏️ Édition de plusieurs images...');
        if (images.length < 2) {
          throw new Error('Au moins 2 images sont requises');
        }
        const mergedImageUrl = await editImage({
          prompt: finalPrompt,
          image: images[0].buffer,
          secondImage: images[1].buffer
        });
        result = {
          success: true,
          type: 'image',
          imageUrl: mergedImageUrl,
          message: 'Images fusionnées avec succès',
          mock: false
        };
        break;

      case 'image_to_video_single':
        console.log('🎥 Animation d\'image...');
        if (images.length === 0) {
          throw new Error('Une image est requise');
        }
        const animatedResult = await generateVideoFromImage({
          prompt: finalPrompt,
          image: images[0].buffer
        });
        result = {
          success: true,
          type: 'video',
          videoUrl: animatedResult.videoUrl,
          message: 'Image animée avec succès',
          mock: animatedResult.mock || false,
          params: animatedResult.params
        };
        break;

      case 'image_to_video_transition':
        console.log('🎥 Transition entre images...');
        if (images.length < 2) {
          throw new Error('2 images sont requises pour la transition');
        }
        const transitionResult = await generateVideoFromImage({
          prompt: finalPrompt,
          image: images[0].buffer,
          lastImage: images[1].buffer
        });
        result = {
          success: true,
          type: 'video',
          videoUrl: transitionResult.videoUrl,
          message: 'Transition créée avec succès',
          mock: transitionResult.mock || false,
          params: transitionResult.params
        };
        break;

      case 'edit_then_video':
        console.log('🎨➡️🎥 Workflow multi-étapes: Édition puis vidéo...');
        if (images.length === 0) {
          throw new Error('Une image est requise');
        }
        
        // Utiliser l'orchestrateur de workflows multi-étapes
        const multiStepWorkflow = getMultiStepWorkflow('edit_then_video');
        if (!multiStepWorkflow) {
          throw new Error('Configuration du workflow multi-étapes introuvable');
        }

        // Préparer les prompts pour chaque étape
        const stepPrompts = [];
        if (analysis.prompts.step1) {
          stepPrompts[0] = analysis.prompts.step1;
          console.log(`📝 Prompt étape 1 (Édition): "${analysis.prompts.step1}"`);
        }
        if (analysis.prompts.step2) {
          stepPrompts[1] = analysis.prompts.step2;
          console.log(`📝 Prompt étape 2 (Vidéo): "${analysis.prompts.step2}"`);
        }

        const multiStepResult = await executeMultiStepWorkflow(multiStepWorkflow, {
          prompt: finalPrompt,
          optimizedPrompt: analysis.prompts.optimized,
          stepPrompts: stepPrompts, // Transmettre les prompts séparés
          imageBuffers: images.map(img => img.buffer),
          parameters: {
            aspectRatio: req.body.aspectRatio,
            outputFormat: req.body.outputFormat,
            outputQuality: parseInt(req.body.outputQuality) || 90,
            numFrames: parseInt(req.body.numFrames) || 81,
            resolution: req.body.resolution
          }
        });

        // Construire le résultat pour le frontend
        result = {
          success: true,
          type: 'multi_step',
          workflowId: multiStepResult.workflowId,
          workflowName: multiStepResult.workflowName,
          steps: multiStepResult.steps.map(step => ({
            stepNumber: step.stepNumber,
            name: step.name,
            type: step.type,
            prompt: step.prompt, // Inclure le prompt utilisé pour cette étape
            outputUrl: step.outputUrl,
            duration: step.duration,
            success: step.success
          })),
          // Le résultat final (vidéo)
          finalType: multiStepResult.finalResult.type,
          finalUrl: multiStepResult.finalResult.outputUrl,
          // Pour compatibilité avec le frontend
          resultUrl: multiStepResult.finalResult.outputUrl, // URL principale (vidéo finale)
          videoUrl: multiStepResult.finalResult.type === 'video' 
            ? multiStepResult.finalResult.outputUrl 
            : null,
          imageUrl: multiStepResult.steps[0].outputUrl, // Image éditée (étape 1)
          timestamp: new Date().toISOString(),
          message: `Workflow complété: ${multiStepResult.steps.length} étapes exécutées`,
          mock: false
        };
        break;

      default:
        throw new Error(`Workflow non supporté: ${workflowId}`);
    }

    // Ajouter les métadonnées d'analyse au résultat
    const response = {
      ...result,
      workflow: {
        id: analysis.workflow.id,
        name: analysis.workflow.name,
        confidence: analysis.analysis.confidence
      },
      prompts: {
        original: prompt,
        optimized: analysis.prompts.optimized,
        used: finalPrompt
      }
    };

    // Sauvegarder l'opération complète
    try {
      const resultUrl = result.videoUrl || result.imageUrl || result.finalUrl;
      await saveCompleteOperation({
        operationType: workflowId,
        prompt: finalPrompt,
        parameters: {
          ...req.body,
          workflowName: analysis.workflow.name,
          confidence: analysis.analysis.confidence,
          originalPrompt: prompt,
          optimizedPrompt: analysis.prompts.optimized,
          useOptimizedPrompt: useOptimizedPrompt === 'true'
        },
        inputImages: images.map(img => img.buffer),
        resultUrl: resultUrl,
        workflowAnalysis: {
          workflow: analysis.workflow,
          confidence: analysis.analysis.confidence,
          reasoning: analysis.analysis.reasoning
        },
        error: null
      });
      console.log('💾 Opération workflow sauvegardée');
    } catch (saveError) {
      console.error('⚠️ Erreur sauvegarde workflow:', saveError.message);
      // Ne pas bloquer la réponse
    }

    console.log('✅ Exécution terminée avec succès');
    res.json(response);

  } catch (error) {
    console.error('❌ Erreur lors de l\'exécution:', error);
    
    // Sauvegarder l'échec
    try {
      await saveCompleteOperation({
        operationType: req.body.workflowId || 'unknown',
        prompt: req.body.prompt,
        parameters: req.body,
        inputImages: req.files ? req.files.map(f => f.buffer) : [],
        resultUrl: null,
        workflowAnalysis: null,
        error: error.message
      });
    } catch (saveError) {
      console.error('⚠️ Erreur sauvegarde échec:', saveError.message);
    }
    
    res.status(500).json({
      success: false,
      error: error.message || 'Erreur lors de l\'exécution du workflow',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * GET /api/workflow/list
 * Récupère la liste de tous les workflows disponibles
 */
router.get('/list', (req, res) => {
  try {
    const workflows = Object.values(AVAILABLE_WORKFLOWS).map(wf => ({
      id: wf.id,
      name: wf.name,
      description: wf.description,
      requires: wf.requires
    }));

    res.json({
      success: true,
      workflows,
      count: workflows.length
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
 * GET /api/workflow/examples
 * Récupère des exemples de prompts pour chaque workflow
 */
router.get('/examples', (req, res) => {
  try {
    const examples = getWorkflowExamples();
    
    // Formater avec les noms des workflows
    const formattedExamples = Object.entries(examples).map(([workflowId, prompts]) => {
      const workflow = AVAILABLE_WORKFLOWS[workflowId];
      return {
        workflow: {
          id: workflowId,
          name: workflow.name,
          description: workflow.description
        },
        examples: prompts
      };
    });

    res.json({
      success: true,
      examples: formattedExamples
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
 * GET /api/workflow/:id
 * Récupère les détails d'un workflow spécifique
 */
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const workflowKey = id.toUpperCase();
    
    const workflow = AVAILABLE_WORKFLOWS[workflowKey];
    
    if (!workflow) {
      return res.status(404).json({
        success: false,
        error: `Workflow '${id}' non trouvé`
      });
    }

    // Obtenir les exemples pour ce workflow
    const examples = getWorkflowExamples()[workflowKey] || [];

    res.json({
      success: true,
      workflow: {
        id: workflow.id,
        name: workflow.name,
        description: workflow.description,
        requires: workflow.requires,
        service: workflow.service,
        method: workflow.method,
        steps: workflow.steps
      },
      examples
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
 * GET /api/workflow/cache/stats
 * Récupère les statistiques du cache d'analyse d'images
 */
router.get('/cache/stats', (req, res) => {
  try {
    const now = Date.now();
    let validEntries = 0;
    let expiredEntries = 0;

    imageAnalysisCache.forEach((value) => {
      const age = now - value.timestamp;
      if (age < CACHE_DURATION) {
        validEntries++;
      } else {
        expiredEntries++;
      }
    });

    res.json({
      success: true,
      cache: {
        total: imageAnalysisCache.size,
        valid: validEntries,
        expired: expiredEntries,
        duration: `${CACHE_DURATION / 1000 / 60} minutes`
      }
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
 * DELETE /api/workflow/cache
 * Vide le cache d'analyse d'images
 */
router.delete('/cache', (req, res) => {
  try {
    const size = imageAnalysisCache.size;
    imageAnalysisCache.clear();
    
    res.json({
      success: true,
      message: `Cache vidé (${size} entrées supprimées)`
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
