import { editSingleImage, editImage } from './imageEditor.js';
import { generateVideo } from './videoGenerator.js';
import { generateVideoFromImage } from './videoImageGenerator.js';
import { saveCompleteOperation } from './dataStorage.js';

/**
 * Orchestrateur de workflows multi-étapes
 * Gère l'exécution séquentielle des étapes et la sauvegarde des résultats intermédiaires
 */

/**
 * Exécute un workflow multi-étapes
 * 
 * @param {Object} workflow - Configuration du workflow
 * @param {Object} context - Contexte d'exécution
 * @param {string} context.prompt - Prompt principal
 * @param {string} context.optimizedPrompt - Prompt optimisé (optionnel)
 * @param {string[]} context.stepPrompts - Prompts spécifiques pour chaque étape (optionnel)
 * @param {Array} context.imageBuffers - Buffers des images
 * @param {Object} context.parameters - Paramètres de génération
 * @returns {Promise<Object>} - Résultat complet du workflow
 */
export async function executeMultiStepWorkflow(workflow, context) {
  console.log(`\n🚀 Démarrage workflow: ${workflow.name}`);
  console.log(`📝 Prompt: ${context.prompt}`);
  console.log(`📋 Nombre d'étapes: ${workflow.steps.length}`);

  const results = {
    workflowId: workflow.id,
    workflowName: workflow.name,
    steps: [],
    finalResult: null,
    success: false,
    error: null
  };

  try {
    const { prompt, optimizedPrompt, stepPrompts = [], imageBuffers, parameters } = context;

    // Préparer l'entrée pour la première étape
    let currentInput = {
      prompt: optimizedPrompt || prompt,
      imageBuffers,
      images: [],
      parameters
    };

    // Exécuter chaque étape séquentiellement
    for (let i = 0; i < workflow.steps.length; i++) {
      const step = workflow.steps[i];
      console.log(`\n📍 Étape ${i + 1}/${workflow.steps.length}: ${step.name}`);

      // Utiliser le prompt spécifique de l'étape si fourni par l'analyseur
      if (stepPrompts[i]) {
        console.log(`  🎯 Utilisation du prompt spécifique pour l'étape ${i + 1}`);
        currentInput.stepPrompt = stepPrompts[i];
      }

      const stepResult = await executeStep(step, currentInput, i + 1, stepPrompts[i]);
      
      results.steps.push(stepResult);

      // Sauvegarder le résultat intermédiaire
      try {
        await saveStepResult(stepResult, workflow, prompt, parameters);
      } catch (saveError) {
        console.warn(`⚠️ Erreur sauvegarde étape ${i + 1}:`, saveError.message);
      }

      // Préparer l'entrée pour l'étape suivante
      if (stepResult.success && stepResult.outputUrl) {
        currentInput = {
          ...currentInput,
          resultFromPreviousStep: stepResult.outputUrl,
          // Pour les étapes vidéo, on peut réutiliser l'image éditée
          images: stepResult.type === 'image' ? [stepResult.outputUrl] : currentInput.images
        };
      } else {
        throw new Error(`Échec de l'étape ${i + 1}: ${stepResult.error}`);
      }
    }

    // Le résultat final est celui de la dernière étape
    results.finalResult = results.steps[results.steps.length - 1];
    results.success = true;

    console.log(`\n✅ Workflow ${workflow.name} terminé avec succès`);
    console.log(`📊 ${results.steps.length} étapes exécutées`);

    return results;

  } catch (error) {
    console.error(`❌ Erreur workflow ${workflow.name}:`, error);
    results.error = error.message;
    results.success = false;
    throw error;
  }
}

/**
 * Exécute une étape individuelle du workflow
 * 
 * @param {Object} step - Configuration de l'étape
 * @param {Object} input - Données d'entrée
 * @param {number} stepNumber - Numéro de l'étape
 * @param {string} specificPrompt - Prompt spécifique pour cette étape (optionnel)
 * @returns {Promise<Object>} - Résultat de l'étape
 */
async function executeStep(step, input, stepNumber, specificPrompt = null) {
  const startTime = Date.now();
  
  // Déterminer le prompt à utiliser pour cette étape
  // Priorité: 1. prompt spécifique de l'analyseur, 2. transformation du prompt, 3. prompt brut
  let promptForStep;
  if (specificPrompt) {
    promptForStep = specificPrompt;
    console.log(`  🎯 Utilisation du prompt fourni par l'analyseur`);
  } else if (step.promptTransform) {
    promptForStep = step.promptTransform(input.prompt);
    console.log(`  🔄 Transformation du prompt par le workflow`);
  } else {
    promptForStep = input.prompt;
    console.log(`  📋 Utilisation du prompt brut`);
  }
  
  const stepResult = {
    stepNumber: stepNumber,
    name: step.name,
    type: step.type, // 'image' ou 'video'
    service: step.service,
    method: step.method,
    prompt: promptForStep,
    outputUrl: null,
    duration: null,
    success: false,
    error: null
  };

  try {
    console.log(`  📝 Prompt pour cette étape: "${stepResult.prompt}"`);
    console.log(`  🔧 Service: ${step.service}, Méthode: ${step.method}`);
    console.log(`  📦 Input imageBuffers: ${input.imageBuffers?.length || 0}, images: ${input.images?.length || 0}`);
    
    global.logWorkflow?.(`STEP ${stepNumber} START`, {
      service: step.service,
      method: step.method,
      prompt: stepResult.prompt,
      hasImageBuffers: !!input.imageBuffers,
      imageBuffersCount: input.imageBuffers?.length || 0,
      hasImages: !!input.images,
      imagesCount: input.images?.length || 0,
      parameters: input.parameters
    });
    
    let result;

    // Exécuter selon le type d'étape
    switch (step.service) {
      case 'imageEditor':
        console.log(`  ✏️ Exécution de l'édition d'image...`);
        result = await executeImageEditStep(step, input, stepResult.prompt);
        console.log(`  ✅ Édition terminée:`, result);
        global.logWorkflow?.(`STEP ${stepNumber} IMAGE EDIT RESULT`, result);
        stepResult.type = 'image';
        break;

      case 'videoGenerator':
        result = await executeVideoGenerationStep(step, input, stepResult.prompt);
        stepResult.type = 'video';
        break;

      case 'videoImageGenerator':
        result = await executeImageToVideoStep(step, input, stepResult.prompt);
        stepResult.type = 'video';
        break;

      default:
        throw new Error(`Service non supporté: ${step.service}`);
    }

    // Extraire l'URL du résultat (format variable selon le service)
    stepResult.outputUrl = result.url || result.imageUrl || result.videoUrl || 
                           (result.imageUrls && result.imageUrls[0]) ||
                           (result.videoUrls && result.videoUrls[0]);
    
    if (!stepResult.outputUrl) {
      console.warn('⚠️  Aucune URL trouvée dans le résultat:', result);
      throw new Error('Le service n\'a retourné aucune URL de résultat');
    }
    
    stepResult.success = true;
    stepResult.duration = Date.now() - startTime;

    console.log(`  ✅ Étape terminée en ${stepResult.duration}ms`);
    console.log(`  🔗 Résultat: ${stepResult.outputUrl}`);
    
    global.logWorkflow?.(`STEP ${stepNumber} SUCCESS`, {
      outputUrl: stepResult.outputUrl,
      duration: stepResult.duration,
      type: stepResult.type
    });

    return stepResult;

  } catch (error) {
    console.error(`  ❌ Erreur étape ${stepNumber}:`, error);
    stepResult.error = error.message;
    stepResult.duration = Date.now() - startTime;
    
    global.logWorkflow?.(`STEP ${stepNumber} ERROR`, {
      error: error.message,
      stack: error.stack,
      duration: stepResult.duration
    });
    
    throw error;
  }
}

/**
 * Exécute une étape d'édition d'image
 */
async function executeImageEditStep(step, input, prompt) {
  const { images, imageBuffers, parameters } = input;

  console.log(`    🔍 executeImageEditStep - imageBuffers: ${imageBuffers?.length || 0}, images: ${images?.length || 0}`);
  
  // Nettoyer et convertir les paramètres en types corrects
  const cleanParams = {
    aspectRatio: parameters?.aspectRatio || '16:9',
    outputFormat: parameters?.outputFormat || 'webp',
    outputQuality: parseInt(parameters?.outputQuality) || 90,
    goFast: parameters?.goFast !== false,
    seed: parameters?.seed ? parseInt(parameters.seed) : null
  };
  
  console.log(`    🧹 Paramètres nettoyés:`, cleanParams);

  if (imageBuffers && imageBuffers.length > 0) {
    // Utiliser les buffers si disponibles
    const imageDataUrls = imageBuffers.map(buffer => {
      const base64 = buffer.toString('base64');
      return `data:image/jpeg;base64,${base64}`;
    });

    console.log(`    📸 Images converties en data URLs (${imageDataUrls.length})`);

    if (imageDataUrls.length === 1) {
      console.log(`    🎯 Édition image unique avec prompt: "${prompt.substring(0, 60)}..."`);
      const result = await editSingleImage({
        prompt,
        imageUrl: imageDataUrls[0],
        ...cleanParams
      });
      console.log(`    ✅ Résultat édition:`, result);
      return result;
    } else {
      return await editImage({
        prompt,
        images: imageDataUrls,
        ...cleanParams
      });
    }
  } else if (images && images.length > 0) {
    // Utiliser les URLs
    if (images.length === 1) {
      return await editSingleImage({
        prompt,
        imageUrl: images[0],
        ...cleanParams
      });
    } else {
      return await editImage({
        prompt,
        images: images,
        ...cleanParams
      });
    }
  }

  throw new Error('Aucune image fournie pour l\'édition');
}

/**
 * Exécute une étape de génération de vidéo
 */
async function executeVideoGenerationStep(step, input, prompt) {
  const { parameters } = input;

  return await generateVideo({
    prompt,
    ...parameters
  });
}

/**
 * Exécute une étape de conversion image vers vidéo
 */
async function executeImageToVideoStep(step, input, prompt) {
  const { images, resultFromPreviousStep, parameters } = input;

  // Utiliser le résultat de l'étape précédente si disponible
  const imageToAnimate = resultFromPreviousStep || (images && images[0]);

  if (!imageToAnimate) {
    throw new Error('Aucune image fournie pour l\'animation');
  }

  console.log(`  🖼️  Image source: ${imageToAnimate.substring(0, 100)}...`);

  // Préparer les paramètres pour la génération de vidéo
  // Note: numFrames doit être entre 81 et 121, resolution doit être "480p" ou "720p"
  const videoParams = {
    prompt,
    image: imageToAnimate, // generateVideoFromImage attend 'image'
    aspectRatio: parameters.aspectRatio || '16:9',
    numFrames: Math.max(81, Math.min(121, parameters.numFrames || 81)), // Clamp entre 81 et 121
    resolution: parameters.resolution === 720 ? '720p' : '480p', // Convertir nombre en string
    seed: parameters.seed || null
  };

  return await generateVideoFromImage(videoParams);
}

/**
 * Sauvegarde le résultat d'une étape
 */
async function saveStepResult(stepResult, workflow, originalPrompt, parameters) {
  if (!stepResult.success || !stepResult.outputUrl) {
    return;
  }

  await saveCompleteOperation({
    operationType: `${workflow.id}_step_${stepResult.stepNumber}`,
    prompt: stepResult.prompt,
    parameters: {
      ...parameters,
      workflowId: workflow.id,
      workflowName: workflow.name,
      stepNumber: stepResult.stepNumber,
      stepName: stepResult.name,
      originalPrompt: originalPrompt
    },
    inputImages: [], // Les images sont déjà dans l'étape précédente
    resultUrl: stepResult.outputUrl,
    workflowAnalysis: {
      workflow: {
        id: workflow.id,
        name: workflow.name
      },
      step: {
        number: stepResult.stepNumber,
        name: stepResult.name,
        type: stepResult.type
      }
    },
    error: null
  });

  console.log(`  💾 Résultat de l'étape ${stepResult.stepNumber} sauvegardé`);
}

/**
 * Workflows prédéfinis multi-étapes
 */
export const MULTI_STEP_WORKFLOWS = {
  EDIT_THEN_VIDEO: {
    id: 'edit_then_video',
    name: 'Édition puis vidéo',
    description: 'Éditer l\'image puis créer une vidéo animée',
    steps: [
      {
        name: 'Édition de l\'image',
        service: 'imageEditor',
        method: 'editSingleImage',
        type: 'image',
        promptTransform: (prompt) => {
          // Extraire la partie édition du prompt
          // Ex: "édite cette image pour ajouter un coucher de soleil puis anime-la"
          // -> "ajouter un coucher de soleil"
          const editKeywords = ['édite', 'modifie', 'change', 'transforme', 'ajoute', 'enlève'];
          for (const keyword of editKeywords) {
            if (prompt.toLowerCase().includes(keyword)) {
              // Prendre tout jusqu'à "puis" ou "ensuite"
              const parts = prompt.toLowerCase().split(/puis|ensuite|après/);
              if (parts.length > 1) {
                return parts[0].trim();
              }
            }
          }
          return prompt;
        }
      },
      {
        name: 'Animation en vidéo',
        service: 'videoImageGenerator',
        method: 'generateVideoFromImage',
        type: 'video',
        promptTransform: (prompt) => {
          // Extraire la partie animation du prompt
          // Ex: "édite cette image pour ajouter un coucher de soleil puis anime-la avec des mouvements de caméra"
          // -> "des mouvements de caméra"
          const parts = prompt.toLowerCase().split(/puis|ensuite|après/);
          if (parts.length > 1) {
            return parts[1].trim();
          }
          // Par défaut, créer un prompt d'animation générique
          return 'anime cette image avec des mouvements fluides';
        }
      }
    ]
  }
};

/**
 * Détermine si un workflow nécessite plusieurs étapes
 */
export function isMultiStepWorkflow(workflowId) {
  return Object.values(MULTI_STEP_WORKFLOWS).some(wf => wf.id === workflowId);
}

/**
 * Récupère la configuration d'un workflow multi-étapes
 */
export function getMultiStepWorkflow(workflowId) {
  return Object.values(MULTI_STEP_WORKFLOWS).find(wf => wf.id === workflowId) || null;
}
