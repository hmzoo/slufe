import express from 'express';
import { enhancePrompt, isReplicateConfigured } from '../services/promptEnhancer.js';

const router = express.Router();

/**
 * POST /api/prompt/enhance
 * Améliore un prompt utilisateur avec l'IA
 */
router.post('/enhance', async (req, res) => {
  try {
    const { prompt, hasImages, imageCount } = req.body;

    // Validation
    if (!prompt) {
      return res.status(400).json({
        success: false,
        error: 'Le champ "prompt" est requis',
      });
    }

    if (typeof prompt !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Le prompt doit être une chaîne de caractères',
      });
    }

    if (prompt.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Le prompt ne peut pas être vide',
      });
    }

    if (prompt.length > 2000) {
      return res.status(400).json({
        success: false,
        error: 'Le prompt est trop long (maximum 2000 caractères)',
      });
    }

    // Préparer les options
    const options = {
      hasImages: hasImages === true || hasImages === 'true',
      imageCount: imageCount ? parseInt(imageCount) : 0
    };

    console.log('📝 Amélioration de prompt:', {
      prompt: prompt.substring(0, 50) + '...',
      hasImages: options.hasImages,
      imageCount: options.imageCount
    });

    // Vérifier si Replicate est configuré
    if (!isReplicateConfigured()) {
      console.warn('⚠️  REPLICATE_API_TOKEN non configuré, retour d\'un prompt amélioré mock');
      
      // Réponse mock adaptée selon le contexte
      let mockEnhanced;
      if (options.hasImages) {
        if (options.imageCount === 1) {
          mockEnhanced = `Modifiez l'image pour : ${prompt}. Préservez les détails importants de l'image originale tout en appliquant les transformations demandées. Style cohérent, transitions naturelles, rendu professionnel.`;
        } else {
          mockEnhanced = `En utilisant les ${options.imageCount} images fournies : ${prompt}. Image 1 sert de référence principale. Intégrez harmonieusement les éléments des différentes images. Composition équilibrée, style unifié, résultat cohérent.`;
        }
      } else {
        mockEnhanced = `Créez une image détaillée et de haute qualité représentant ${prompt}. Style photographique professionnel, éclairage naturel et doux, composition harmonieuse et équilibrée. Rendu réaliste avec attention aux détails, profondeur de champ cinématographique, couleurs vibrantes et saturées.`;
      }
      
      return res.json({
        success: true,
        enhanced: mockEnhanced,
        original: prompt,
        mock: true,
        context: options.hasImages ? 'edition' : 'generation',
        message: 'Réponse mock - Configurez REPLICATE_API_TOKEN pour utiliser l\'IA réelle',
      });
    }

    // Appeler le service d'amélioration avec les options
    const enhanced = await enhancePrompt(prompt, options);

    res.json({
      success: true,
      enhanced: enhanced,
      original: prompt,
      mock: false,
      context: options.hasImages ? 'edition' : 'generation',
    });
  } catch (error) {
    console.error('❌ Erreur dans /api/prompt/enhance:', error);

    // Gestion des erreurs spécifiques
    if (error.message.includes('REPLICATE_API_TOKEN')) {
      return res.status(500).json({
        success: false,
        error: 'Service d\'amélioration de prompt non configuré',
        details: 'Veuillez configurer REPLICATE_API_TOKEN dans le fichier .env',
      });
    }

    if (error.message.includes('rate limit')) {
      return res.status(429).json({
        success: false,
        error: 'Limite de requêtes atteinte',
        details: 'Veuillez réessayer dans quelques instants',
      });
    }

    res.status(500).json({
      success: false,
      error: 'Erreur lors de l\'amélioration du prompt',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

/**
 * GET /api/prompt/status
 * Vérifie le statut du service d'amélioration
 */
router.get('/status', (req, res) => {
  const configured = isReplicateConfigured();
  
  res.json({
    success: true,
    service: 'promptEnhancer',
    configured: configured,
    model: 'google/gemini-2.0-flash-exp',
    status: configured ? 'ready' : 'not_configured',
    message: configured 
      ? 'Service d\'amélioration de prompt opérationnel'
      : 'Configurez REPLICATE_API_TOKEN pour activer le service',
  });
});

export default router;
