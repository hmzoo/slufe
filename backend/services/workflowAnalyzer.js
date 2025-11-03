import Replicate from 'replicate';
import { DEFAULT_REPLICATE_OPTIONS } from '../config/replicate.js';

/**
 * Service d'analyse de workflow intelligent
 * Détermine automatiquement le meilleur workflow à utiliser en fonction du prompt et des images
 */

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

/**
 * Liste des workflows disponibles
 */
export const AVAILABLE_WORKFLOWS = {
  TEXT_TO_IMAGE: {
    id: 'text_to_image',
    name: 'Génération d\'image simple',
    description: 'Créer une image à partir d\'un prompt texte',
    requires: { prompt: true, images: 0 },
    service: 'imageGenerator',
    method: 'generateImage'
  },
  TEXT_TO_VIDEO: {
    id: 'text_to_video',
    name: 'Génération de vidéo simple',
    description: 'Créer une vidéo à partir d\'un prompt texte',
    requires: { prompt: true, images: 0 },
    service: 'videoGenerator',
    method: 'generateVideo'
  },
  IMAGE_EDIT_SINGLE: {
    id: 'image_edit_single',
    name: 'Édition d\'image unique',
    description: 'Modifier une image selon les instructions',
    requires: { prompt: true, images: 1 },
    service: 'imageEditor',
    method: 'editSingleImage'
  },
  IMAGE_EDIT_MULTIPLE: {
    id: 'image_edit_multiple',
    name: 'Édition d\'images multiples',
    description: 'Combiner ou fusionner plusieurs images',
    requires: { prompt: true, images: 2 },
    service: 'imageEditor',
    method: 'editImage'
  },
  IMAGE_TO_VIDEO_SINGLE: {
    id: 'image_to_video_single',
    name: 'Vidéo depuis image de départ',
    description: 'Animer une image de départ',
    requires: { prompt: true, images: 1 },
    service: 'videoImageGenerator',
    method: 'generateVideoFromImage'
  },
  IMAGE_TO_VIDEO_TRANSITION: {
    id: 'image_to_video_transition',
    name: 'Vidéo transition entre deux images',
    description: 'Créer une transition/morphing entre deux images',
    requires: { prompt: true, images: 2 },
    service: 'videoImageGenerator',
    method: 'generateVideoFromImage'
  },
  EDIT_THEN_VIDEO: {
    id: 'edit_then_video',
    name: 'Édition puis vidéo',
    description: 'Éditer l\'image puis créer une vidéo avec transition',
    requires: { prompt: true, images: [1, 2] }, // Accepte 1 ou 2 images
    service: 'composite',
    steps: ['imageEditor', 'videoImageGenerator']
  }
};

/**
 * Analyse le contexte pour déterminer le workflow approprié
 * 
 * @param {Object} context - Contexte de la requête
 * @param {string} context.prompt - Prompt de l'utilisateur
 * @param {number} context.imageCount - Nombre d'images fournies
 * @param {string[]} context.imageDescriptions - Descriptions des images (optionnel)
 * @returns {Promise<Object>} - Résultat de l'analyse avec workflow et prompts optimisés
 */
export async function analyzeWorkflow(context) {
  const { prompt, imageCount = 0, imageDescriptions = [] } = context;

  if (!prompt || !prompt.trim()) {
    throw new Error('Le prompt est requis pour l\'analyse');
  }

  console.log('🔍 Analyse du workflow...');
  console.log('📝 Prompt:', prompt);
  console.log('🖼️  Images:', imageCount);
  console.log('📋 imageDescriptions reçues:', imageDescriptions);
  console.log('📊 Nombre de descriptions:', imageDescriptions.length);
  if (imageDescriptions.length > 0) {
    console.log('📋 Descriptions disponibles:', imageDescriptions.length);
    console.log('📝 Première description (aperçu):', imageDescriptions[0]?.substring(0, 100) + '...');
  }

  // Utiliser Gemini via Replicate pour l'analyse
  return performReplicateAnalysis(prompt, imageCount, imageDescriptions);
}

/**
 * Analyse avec Gemini via Replicate
 */
async function performReplicateAnalysis(prompt, imageCount, imageDescriptions = []) {
  try {
    console.log('🔄 Utilisation de Gemini 2.5 Flash via Replicate...');

    // Construire le contexte des images si disponible
    let imageContext = '';
    if (imageDescriptions.length > 0) {
      imageContext = '\n\nImage descriptions:\n' + 
        imageDescriptions.map((desc, i) => `Image ${i + 1}: ${desc}`).join('\n');
      console.log('📋 Descriptions d\'images ajoutées au contexte:', imageDescriptions.length);
    }

    const systemInstruction = `You are an AI workflow analyzer for a creative content generation platform. Your role is to analyze user requests and determine the best workflow to use.

Available workflows:
1. TEXT_TO_IMAGE - Generate image from text prompt (requires 0 images)
2. TEXT_TO_VIDEO - Generate video from text prompt (requires 0 images)
3. IMAGE_EDIT_SINGLE - Edit a single image based on instructions (requires 1 image)
4. IMAGE_EDIT_MULTIPLE - Combine or merge multiple images (requires 2+ images)
5. IMAGE_TO_VIDEO_SINGLE - Animate a single image (requires 1 image)
6. IMAGE_TO_VIDEO_TRANSITION - Create transition between images (requires 2 images)
7. EDIT_THEN_VIDEO - Edit image(s) then create video (requires 1-2 images) - REQUIRES STEP SPLITTING

CRITICAL: For EDIT_THEN_VIDEO workflow, you MUST provide separate prompts for each step:
- step1Prompt: Instructions ONLY for editing the image (what to add/modify/change)
- step2Prompt: Instructions ONLY for animating the video (camera movements, motion, animation style)

Example for "édite cette image pour ajouter un coucher de soleil puis anime-la avec des mouvements de caméra":
{
  "workflow": "EDIT_THEN_VIDEO",
  "step1Prompt": "Add a vibrant sunset with warm hues, dramatic orange and pink sky, golden light",
  "step2Prompt": "Animate with smooth camera movements: slow pan left to right, gentle zoom emphasizing the sunset"
}

CRITICAL DETECTION RULES FOR EDIT_THEN_VIDEO:
- Use EDIT_THEN_VIDEO when the prompt mentions BOTH editing AND creating video/animation
- Keywords that indicate EDIT_THEN_VIDEO: "et genere un film", "et cree une video", "puis anime", "puis video", "then create video", "then animate"
- Examples:
  * "place les deux personnages dans un café et genere un film" → EDIT_THEN_VIDEO
  * "Change background to beach then create video" → EDIT_THEN_VIDEO
  * "édite pour ajouter un coucher de soleil puis anime" → EDIT_THEN_VIDEO

IMPORTANT: 
- When image descriptions are provided, USE THEM to understand context
- Keep the optimizedPrompt CONCISE (max 150 words) while incorporating key details from image descriptions
- Focus on the most important visual elements

Based on the user prompt and number of images provided, determine the most appropriate workflow.

Respond ONLY with a JSON object in this exact format (NO markdown code blocks, just raw JSON):
{
  "workflow": "WORKFLOW_ID",
  "confidence": 0.0-1.0,
  "reasoning": "brief explanation (max 50 words)",
  "optimizedPrompt": "improved prompt incorporating image details (max 150 words)",
  "step1Prompt": "REQUIRED for EDIT_THEN_VIDEO: editing instructions only",
  "step2Prompt": "REQUIRED for EDIT_THEN_VIDEO: animation instructions only",
  "suggestions": ["suggestion 1", "suggestion 2"]
}`;

    const userPrompt = `User prompt: "${prompt}"
Number of images provided: ${imageCount}${imageContext}

Analyze and respond with the JSON workflow recommendation:`;

    console.log('📤 Prompt envoyé à Gemini (Replicate):', userPrompt);

    // Appel à Gemini via Replicate
    const output = await replicate.run(
      'google/gemini-2.5-flash',
      {
        input: {
          system_instruction: systemInstruction,
          prompt: userPrompt,
          max_output_tokens: 1024,
          temperature: 0.3,
          top_p: 0.95,
          dynamic_thinking: false,
        },
        ...DEFAULT_REPLICATE_OPTIONS
      }
    );

    console.log('🔍 Type de output:', typeof output);
    console.log('🔍 Output brut:', JSON.stringify(output).substring(0, 200));

    // Extraire le texte de la réponse
    let responseText = '';
    if (Array.isArray(output)) {
      console.log('📋 Output est un array de longueur:', output.length);
      responseText = output.join('');
    } else if (typeof output === 'string') {
      console.log('📋 Output est une string');
      responseText = output;
    } else {
      console.log('📋 Output est un objet:', Object.keys(output || {}));
      responseText = String(output);
    }

    console.log('📄 Replicate Gemini response:', responseText);

    // Parser la réponse JSON
    let analysis;
    try {
      // Nettoyer la réponse des backticks markdown
      let cleanedText = responseText.trim();
      
      // Retirer les blocs markdown ```json ... ```
      cleanedText = cleanedText.replace(/```json\s*/g, '').replace(/```\s*/g, '');
      
      console.log('🧹 Texte nettoyé (premiers 300 chars):', cleanedText.substring(0, 300));
      
      // Extraire le JSON
      const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        console.log('✅ JSON trouvé, tentative de parsing...');
        analysis = JSON.parse(jsonMatch[0]);
        console.log('✅ JSON parsé avec succès:', analysis.workflow);
      } else {
        throw new Error('No JSON found in response after cleaning');
      }
    } catch (parseError) {
      console.error('❌ Erreur parsing JSON:', parseError);
      console.error('📄 Réponse brute de Gemini:', responseText.substring(0, 500));
      console.log('⚠️  FALLBACK: Utilisation de l\'analyse basique (règles heuristiques)');
      return performBasicAnalysis(prompt, imageCount, imageDescriptions);
    }

    // Valider et enrichir l'analyse
    const workflow = AVAILABLE_WORKFLOWS[analysis.workflow];
    if (!workflow) {
      console.warn('⚠️  Workflow invalide détecté, fallback to basic analysis');
      return performBasicAnalysis(prompt, imageCount, imageDescriptions);
    }

    // Vérifier la compatibilité avec le nombre d'images
    const imagesRequired = workflow.requires.images;
    const isValidImageCount = Array.isArray(imagesRequired)
      ? imagesRequired.includes(imageCount) // Accepte une liste de valeurs [1, 2]
      : imagesRequired === imageCount;       // Accepte une valeur exacte
    
    if (!isValidImageCount) {
      const expectedText = Array.isArray(imagesRequired)
        ? `${imagesRequired.join(' ou ')} image(s)`
        : `${imagesRequired} image(s)`;
      
      console.warn(`⚠️  Workflow nécessite ${expectedText} mais ${imageCount} fournie(s)`);
      return {
        success: false,
        error: `Ce workflow nécessite ${expectedText}, mais vous en avez fourni ${imageCount}`,
        suggestedWorkflow: getSuggestedWorkflow(imageCount)
      };
    }

    console.log('✅ Workflow déterminé (via Replicate):', workflow.name);
    console.log('💡 Confiance:', analysis.confidence);

    // Pour les workflows multi-étapes, générer les prompts séparés si Gemini ne les a pas fournis
    let step1Prompt = analysis.step1Prompt || null;
    let step2Prompt = analysis.step2Prompt || null;

    if (workflow.id === 'edit_then_video' && (!step1Prompt || !step2Prompt)) {
      console.log('🔄 Gemini (Replicate) n\'a pas fourni les prompts séparés, génération automatique...');
      const splitPrompts = splitMultiStepPrompt(prompt, analysis.optimizedPrompt || prompt);
      step1Prompt = step1Prompt || splitPrompts.step1;
      step2Prompt = step2Prompt || splitPrompts.step2;
      console.log(`  📝 Step 1: "${step1Prompt}"`);
      console.log(`  📝 Step 2: "${step2Prompt}"`);
    }

    return {
      success: true,
      workflow: {
        id: workflow.id,
        name: workflow.name,
        description: workflow.description,
        service: workflow.service,
        method: workflow.method,
        steps: workflow.steps
      },
      analysis: {
        confidence: analysis.confidence,
        reasoning: analysis.reasoning,
        suggestions: analysis.suggestions || []
      },
      prompts: {
        original: prompt,
        optimized: analysis.optimizedPrompt || prompt,
        // Pour les workflows multi-étapes, inclure les prompts séparés
        step1: step1Prompt,
        step2: step2Prompt
      },
      requirements: {
        imagesNeeded: Array.isArray(workflow.requires.images) 
          ? workflow.requires.images.join(' ou ')
          : workflow.requires.images,
        imagesProvided: imageCount,
        satisfied: Array.isArray(workflow.requires.images)
          ? workflow.requires.images.includes(imageCount)
          : workflow.requires.images <= imageCount
      },
      imageDescriptions: imageDescriptions || []
    };

  } catch (error) {
    console.error('❌ Erreur lors de l\'analyse via Replicate:', error);
    console.error('📊 Détails:', {
      message: error.message,
      stack: error.stack?.substring(0, 200)
    });
    console.log('⚠️  FALLBACK: Utilisation de l\'analyse basique (règles heuristiques)');
    return performBasicAnalysis(prompt, imageCount, imageDescriptions);
  }
}

/**
 * Divise un prompt multi-étapes en prompts séparés pour chaque étape
 * Utilisé quand Gemini ne fournit pas step1Prompt et step2Prompt
 */
function splitMultiStepPrompt(originalPrompt, optimizedPrompt) {
  const lowerPrompt = originalPrompt.toLowerCase();
  
  // Mots-clés qui séparent les étapes
  const separators = ['puis', 'ensuite', 'après', 'then', 'after', 'followed by'];
  
  // Trouver le séparateur dans le prompt
  let separatorIndex = -1;
  let usedSeparator = '';
  for (const sep of separators) {
    const index = lowerPrompt.indexOf(sep);
    if (index !== -1 && (separatorIndex === -1 || index < separatorIndex)) {
      separatorIndex = index;
      usedSeparator = sep;
    }
  }
  
  if (separatorIndex === -1) {
    // Pas de séparateur trouvé, diviser le prompt optimisé en deux
    const words = optimizedPrompt.split(' ');
    const midpoint = Math.floor(words.length / 2);
    return {
      step1: words.slice(0, midpoint).join(' '),
      step2: words.slice(midpoint).join(' ')
    };
  }
  
  // Extraire les deux parties
  const part1 = originalPrompt.substring(0, separatorIndex).trim();
  const part2 = originalPrompt.substring(separatorIndex + usedSeparator.length).trim();
  
  // Nettoyer les parties pour enlever les références à "cette image" etc.
  let step1 = part1
    .replace(/édite\s+cette\s+image\s+(pour\s+)?/i, '')
    .replace(/modifie\s+cette\s+image\s+(pour\s+)?/i, '')
    .replace(/edit\s+this\s+image\s+(to\s+)?/i, '')
    .replace(/modify\s+this\s+image\s+(to\s+)?/i, '')
    .trim();
    
  let step2 = part2
    .replace(/anime[-\s]la/i, 'animate the image')
    .replace(/créer?\s+une?\s+vidéo/i, 'create a video')
    .replace(/^et\s+/i, '')
    .trim();
  
  // Si step1 ou step2 sont trop courts, utiliser le prompt optimisé comme base
  if (step1.length < 10) {
    step1 = optimizedPrompt.split('.')[0] || optimizedPrompt.substring(0, optimizedPrompt.length / 2);
  }
  
  if (step2.length < 10) {
    step2 = 'Animate the edited image with smooth movements';
  }
  
  return {
    step1: step1,
    step2: step2
  };
}

/**
 * Analyse basique sans IA (fallback)
 */
function performBasicAnalysis(prompt, imageCount, imageDescriptions = []) {
  const lowerPrompt = prompt.toLowerCase();
  
  // Détection de mots-clés vidéo
  const videoKeywords = ['video', 'vidéo', 'animate', 'animer', 'animation', 'moving', 'motion', 'mouvement'];
  const hasVideoKeyword = videoKeywords.some(kw => lowerPrompt.includes(kw));
  
  // Détection de mots-clés édition
  const editKeywords = ['edit', 'éditer', 'modify', 'modifier', 'change', 'changer', 'transform', 'transformer', 'combine', 'fusionner', 'merge'];
  const hasEditKeyword = editKeywords.some(kw => lowerPrompt.includes(kw));

  let selectedWorkflow;

  // Logique de sélection
  if (imageCount === 0) {
    selectedWorkflow = hasVideoKeyword ? AVAILABLE_WORKFLOWS.TEXT_TO_VIDEO : AVAILABLE_WORKFLOWS.TEXT_TO_IMAGE;
  } else if (imageCount === 1) {
    if (hasVideoKeyword && hasEditKeyword) {
      selectedWorkflow = AVAILABLE_WORKFLOWS.EDIT_THEN_VIDEO;
    } else if (hasVideoKeyword) {
      selectedWorkflow = AVAILABLE_WORKFLOWS.IMAGE_TO_VIDEO_SINGLE;
    } else {
      selectedWorkflow = AVAILABLE_WORKFLOWS.IMAGE_EDIT_SINGLE;
    }
  } else {
    if (hasVideoKeyword) {
      selectedWorkflow = AVAILABLE_WORKFLOWS.IMAGE_TO_VIDEO_TRANSITION;
    } else {
      selectedWorkflow = AVAILABLE_WORKFLOWS.IMAGE_EDIT_MULTIPLE;
    }
  }

  return {
    success: true,
    workflow: {
      id: selectedWorkflow.id,
      name: selectedWorkflow.name,
      description: selectedWorkflow.description,
      service: selectedWorkflow.service,
      method: selectedWorkflow.method,
      steps: selectedWorkflow.steps
    },
    analysis: {
      confidence: 0.7,
      reasoning: 'Analyse basée sur des mots-clés (mode fallback - Gemini n\'a pas pu générer une réponse valide)',
      suggestions: [
        'L\'analyse IA a échoué, utilisation des règles heuristiques de base',
        'Vérifiez que REPLICATE_API_TOKEN est correctement configuré dans le fichier .env'
      ]
    },
    prompts: {
      original: prompt,
      optimized: prompt // Pas d'optimisation en mode fallback
    },
    requirements: {
      imagesNeeded: Array.isArray(selectedWorkflow.requires.images) 
        ? selectedWorkflow.requires.images.join(' ou ')
        : selectedWorkflow.requires.images,
      imagesProvided: imageCount,
      satisfied: Array.isArray(selectedWorkflow.requires.images)
        ? selectedWorkflow.requires.images.includes(imageCount)
        : selectedWorkflow.requires.images <= imageCount
    },
    imageDescriptions: imageDescriptions || [],
    mock: true,
    fallback: true,
    warning: 'Analyse basique utilisée - L\'IA n\'a pas pu analyser correctement votre demande'
  };
}

/**
 * Suggère un workflow alternatif basé sur le nombre d'images
 */
function getSuggestedWorkflow(imageCount) {
  if (imageCount === 0) {
    return {
      workflow: AVAILABLE_WORKFLOWS.TEXT_TO_IMAGE,
      message: 'Vous pouvez générer une image à partir de votre prompt'
    };
  } else if (imageCount === 1) {
    return {
      workflow: AVAILABLE_WORKFLOWS.IMAGE_EDIT_SINGLE,
      message: 'Vous pouvez éditer votre image ou créer une vidéo à partir d\'elle'
    };
  } else {
    return {
      workflow: AVAILABLE_WORKFLOWS.IMAGE_EDIT_MULTIPLE,
      message: 'Vous pouvez combiner vos images ou créer une transition vidéo'
    };
  }
}

/**
 * Obtenir des exemples de prompts pour chaque workflow
 */
export function getWorkflowExamples() {
  return {
    TEXT_TO_IMAGE: [
      'A serene mountain landscape at golden hour',
      'Professional portrait of a business woman in office',
      'Futuristic cityscape with neon lights'
    ],
    TEXT_TO_VIDEO: [
      'Ocean waves crashing on shore at sunset',
      'Time-lapse of clouds moving across sky',
      'Camera slowly panning across a forest'
    ],
    IMAGE_EDIT_SINGLE: [
      'Change the background to a beach at sunset',
      'Transform into watercolor painting style',
      'Add dramatic lighting and cinematic atmosphere'
    ],
    IMAGE_EDIT_MULTIPLE: [
      'Combine the lighting from image 1 with subject from image 2',
      'The person in image 2 adopts the pose from image 1',
      'Merge the two scenes seamlessly'
    ],
    IMAGE_TO_VIDEO_SINGLE: [
      'Animate this portrait with subtle movements',
      'Make the water flow and clouds move',
      'Create a slow zoom into the subject'
    ],
    IMAGE_TO_VIDEO_TRANSITION: [
      'Smooth transition from day to night',
      'Morph between the two faces',
      'Blend from summer to winter scene'
    ],
    EDIT_THEN_VIDEO: [
      'Change background to beach then create video with transition',
      'Apply sunset lighting and animate with camera movement',
      'Transform style to cinematic and add motion'
    ]
  };
}

export default {
  analyzeWorkflow,
  getWorkflowExamples,
  AVAILABLE_WORKFLOWS
};
