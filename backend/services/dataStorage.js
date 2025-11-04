import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { saveWorkflowFile, getMediaPath } from '../utils/mediaUtils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Dossier racine pour stocker les données (backend/data/)
const DATA_ROOT = path.join(__dirname, '../data');

/**
 * Structure des dossiers :
 * data/
 *   operations/
 *     {operationId}_in.jpg (ou _in_1.jpg, _in_2.jpg pour plusieurs images)
 *     {operationId}_out.jpg (ou .mp4 pour vidéos)
 *     {operationId}.json (métadonnées de l'opération)
 */

/**
 * Génère un ID unique pour une opération
 * Format: timestamp_random (ex: 20251103_abc123)
 */
export function generateOperationId() {
  const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);
  const random = crypto.randomBytes(4).toString('hex');
  return `${timestamp}_${random}`;
}

/**
 * Initialise les dossiers de stockage
 */
export async function initializeStorage() {
  const operationsDir = path.join(DATA_ROOT, 'operations');
  const workflowsDir = path.join(DATA_ROOT, 'workflows');
  const mediasDir = path.join(process.cwd(), 'medias');
  const publicWorkflowsDir = path.join(process.cwd(), 'workflows');
  
  try {
    await fs.mkdir(DATA_ROOT, { recursive: true });
    await fs.mkdir(operationsDir, { recursive: true });
    await fs.mkdir(workflowsDir, { recursive: true });
    await fs.mkdir(mediasDir, { recursive: true });
    await fs.mkdir(publicWorkflowsDir, { recursive: true });
    console.log('✅ Dossiers de stockage initialisés:', DATA_ROOT);
  } catch (error) {
    console.error('❌ Erreur initialisation stockage:', error);
    throw error;
  }
}

/**
 * Détermine l'extension du fichier selon le type d'opération
 */
function getFileExtension(operationType, isOutput = false) {
  const videoOperations = [
    'text_to_video',
    'image_to_video_single',
    'image_to_video_transition'
  ];
  
  // Gérer les workflows multi-étapes
  if (operationType.includes('_video_step_') || operationType.includes('_then_video_step_')) {
    // Extraire le numéro d'étape
    const stepMatch = operationType.match(/step_(\d+)/);
    if (stepMatch) {
      const stepNumber = parseInt(stepMatch[1]);
      // Étape 1 = édition d'image -> jpg/webp
      // Étape 2+ = vidéo -> mp4
      if (isOutput) {
        return stepNumber === 1 ? 'jpg' : 'mp4';
      }
    }
  }
  
  if (isOutput && videoOperations.includes(operationType)) {
    return 'mp4';
  }
  
  return 'jpg';
}

/**
 * Sauvegarde une image d'entrée
 * @param {string} operationId - ID unique de l'opération
 * @param {Buffer} imageBuffer - Buffer de l'image
 * @param {number} index - Index de l'image (pour plusieurs images)
 * @returns {Promise<string>} - Chemin du fichier sauvegardé
 */
export async function saveInputImage(operationId, imageBuffer, index = 0) {
  const operationsDir = path.join(DATA_ROOT, 'operations');
  const suffix = index > 0 ? `_in_${index}` : '_in';
  const filename = `${operationId}${suffix}.jpg`;
  const filepath = path.join(operationsDir, filename);
  
  try {
    await fs.writeFile(filepath, imageBuffer);
    console.log(`✅ Image d'entrée sauvegardée: ${filename}`);
    return filepath;
  } catch (error) {
    console.error('❌ Erreur sauvegarde image entrée:', error);
    throw error;
  }
}

/**
 * Sauvegarde le résultat (image ou vidéo)
 * @param {string} operationId - ID unique de l'opération
 * @param {Buffer} resultBuffer - Buffer du résultat
 * @param {string} operationType - Type d'opération
 * @returns {Promise<string>} - Chemin du fichier sauvegardé
 */
export async function saveOutputFile(operationId, resultBuffer, operationType) {
  const operationsDir = path.join(DATA_ROOT, 'operations');
  const extension = getFileExtension(operationType, true);
  const filename = `${operationId}_out.${extension}`;
  const filepath = path.join(operationsDir, filename);
  
  try {
    await fs.writeFile(filepath, resultBuffer);
    console.log(`✅ Résultat sauvegardé: ${filename}`);
    return filepath;
  } catch (error) {
    console.error('❌ Erreur sauvegarde résultat:', error);
    throw error;
  }
}

/**
 * Sauvegarde les métadonnées de l'opération
 * @param {string} operationId - ID unique de l'opération
 * @param {Object} metadata - Métadonnées à sauvegarder
 * @returns {Promise<string>} - Chemin du fichier JSON sauvegardé
 */
export async function saveOperationMetadata(operationId, metadata) {
  const operationsDir = path.join(DATA_ROOT, 'operations');
  const filename = `${operationId}.json`;
  const filepath = path.join(operationsDir, filename);
  
  const fullMetadata = {
    operationId,
    timestamp: new Date().toISOString(),
    ...metadata
  };
  
  try {
    await fs.writeFile(filepath, JSON.stringify(fullMetadata, null, 2));
    console.log(`✅ Métadonnées sauvegardées: ${filename}`);
    return filepath;
  } catch (error) {
    console.error('❌ Erreur sauvegarde métadonnées:', error);
    throw error;
  }
}

/**
 * Récupère les métadonnées d'une opération
 * @param {string} operationId - ID de l'opération
 * @returns {Promise<Object>} - Métadonnées de l'opération
 */
export async function getOperationMetadata(operationId) {
  const operationsDir = path.join(DATA_ROOT, 'operations');
  const filepath = path.join(operationsDir, `${operationId}.json`);
  
  try {
    const data = await fs.readFile(filepath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('❌ Erreur lecture métadonnées:', error);
    throw error;
  }
}

/**
 * Liste toutes les opérations
 * @param {number} limit - Nombre maximum d'opérations à retourner
 * @returns {Promise<Array>} - Liste des opérations
 */
export async function listOperations(limit = 50) {
  const operationsDir = path.join(DATA_ROOT, 'operations');
  
  try {
    const files = await fs.readdir(operationsDir);
    const jsonFiles = files.filter(f => f.endsWith('.json'));
    
    // Trier par date (plus récent en premier)
    jsonFiles.sort().reverse();
    
    const operations = [];
    for (const file of jsonFiles.slice(0, limit)) {
      const operationId = file.replace('.json', '');
      const metadata = await getOperationMetadata(operationId);
      operations.push(metadata);
    }
    
    return operations;
  } catch (error) {
    console.error('❌ Erreur liste opérations:', error);
    return [];
  }
}

/**
 * Télécharge une image depuis une URL et la sauvegarde à un chemin spécifique
 * @param {string} url - URL de l'image à télécharger
 * @param {string} targetPath - Chemin complet où sauvegarder l'image
 * @returns {Promise<void>}
 */
export async function downloadImageToPath(url, targetPath) {
  try {
    console.log(`📥 Téléchargement de l'image depuis: ${url.substring(0, 80)}...`);
    
    // Si c'est une URL relative locale (/medias/...), copier directement le fichier
    if (url.startsWith('/medias/')) {
      const sourceFile = path.join(process.cwd(), url);
      await fs.copyFile(sourceFile, targetPath);
      console.log(`📁 Fichier copié localement: ${path.basename(sourceFile)} -> ${path.basename(targetPath)}`);
      return;
    }
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const buffer = Buffer.from(await response.arrayBuffer());
    await fs.writeFile(targetPath, buffer);
    
    const filename = path.basename(targetPath);
    console.log(`✅ Image téléchargée et sauvegardée: ${filename} (${Math.round(buffer.length / 1024)}KB)`);
  } catch (error) {
    console.error(`❌ Erreur téléchargement image vers ${targetPath}:`, error);
    throw error;
  }
}

/**
 * Télécharge un fichier depuis une URL et le sauvegarde
 * @param {string} url - URL du fichier à télécharger
 * @param {string} operationId - ID de l'opération
 * @param {string} operationType - Type d'opération
 * @returns {Promise<string>} - Chemin du fichier sauvegardé
 */
export async function downloadAndSaveResult(url, operationId, operationType) {
  try {
    console.log(`📥 Téléchargement du résultat depuis: ${url.substring(0, 80)}...`);
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const buffer = Buffer.from(await response.arrayBuffer());
    
    // Détecter l'extension réelle depuis l'URL ou le Content-Type
    let extension = getFileExtension(operationType, true);
    
    // Vérifier si l'URL contient une extension spécifique
    const urlExtMatch = url.match(/\.(\w+)(\?|$)/);
    if (urlExtMatch) {
      const urlExt = urlExtMatch[1].toLowerCase();
      if (['jpg', 'jpeg', 'png', 'webp', 'mp4', 'gif'].includes(urlExt)) {
        extension = urlExt === 'jpeg' ? 'jpg' : urlExt;
        console.log(`  📄 Extension détectée depuis URL: .${extension}`);
      }
    }
    
    // Sauvegarder avec l'extension correcte
    const operationsDir = path.join(DATA_ROOT, 'operations');
    const filename = `${operationId}_out.${extension}`;
    const filepath = path.join(operationsDir, filename);
    
    await fs.writeFile(filepath, buffer);
    console.log(`✅ Résultat téléchargé et sauvegardé: ${filename}`);
    
    return filepath;
  } catch (error) {
    console.error('❌ Erreur téléchargement résultat:', error);
    throw error;
  }
}

/**
 * Sauvegarde une opération complète
 * @param {Object} operation - Données de l'opération
 * @returns {Promise<Object>} - Résumé de la sauvegarde
 */
export async function saveCompleteOperation(operation) {
  const {
    operationType,
    prompt,
    parameters,
    inputImages = [],
    resultUrl,
    resultBuffer,
    workflowAnalysis = null,
    error = null
  } = operation;
  
  const operationId = generateOperationId();
  
  try {
    // 1. Sauvegarder les images d'entrée
    const savedInputs = [];
    for (let i = 0; i < inputImages.length; i++) {
      const imagePath = await saveInputImage(operationId, inputImages[i], i + 1);
      savedInputs.push(imagePath);
    }
    
    // 2. Sauvegarder le résultat
    let savedOutput = null;
    if (resultBuffer) {
      savedOutput = await saveOutputFile(operationId, resultBuffer, operationType);
    } else if (resultUrl) {
      try {
        savedOutput = await downloadAndSaveResult(resultUrl, operationId, operationType);
      } catch (downloadError) {
        console.warn('⚠️ Impossible de télécharger le résultat, seule l\'URL sera sauvegardée:', downloadError.message);
        // Continue quand même - on sauvegarde l'URL dans les métadonnées
      }
    }
    
    // 3. Sauvegarder les métadonnées
    const metadata = {
      operationType,
      prompt,
      parameters,
      inputCount: inputImages.length,
      inputFiles: savedInputs.map(p => path.basename(p)),
      outputFile: savedOutput ? path.basename(savedOutput) : null,
      resultUrl: resultUrl || null,
      workflowAnalysis,
      error,
      success: !error,
      duration: parameters.duration || null
    };
    
    await saveOperationMetadata(operationId, metadata);
    
    console.log(`✅ Opération complète sauvegardée: ${operationId}`);
    
    return {
      operationId,
      success: true,
      inputFiles: metadata.inputFiles,
      outputFile: metadata.outputFile,
      metadataFile: `${operationId}.json`
    };
    
  } catch (error) {
    console.error('❌ Erreur sauvegarde opération complète:', error);
    throw error;
  }
}

/**
 * Sauvegarde spécialisée pour l'exécution complète d'un workflow
 * @param {Object} workflowExecution - Données complètes du workflow
 * @returns {Promise<Object>} - Résumé de la sauvegarde
 */
export async function saveWorkflowExecution(workflowExecution) {
  const {
    operationId,
    type = 'workflow_execution',
    prompt,
    workflow,
    inputs,
    results,
    taskResults,
    executionTime,
    status
  } = workflowExecution;

  try {
    // Créer un dossier spécifique pour ce workflow
    const workflowDir = path.join(DATA_ROOT, 'workflows', operationId);
    await fs.mkdir(workflowDir, { recursive: true });

    // 1. Sauvegarder le workflow JSON avec ID unique en préfixe
    const workflowFilename = `${operationId}_workflow.json`;
    const workflowPath = path.join(workflowDir, workflowFilename);
    await fs.writeFile(workflowPath, JSON.stringify(workflow, null, 2));

    // 2. Sauvegarder les entrées (inputs) du workflow
    const inputsFilename = `${operationId}_inputs.json`;
    const inputsPath = path.join(workflowDir, inputsFilename);
    
    // Traiter les inputs avec images
    const processedInputs = { ...inputs };
    const savedImagePaths = [];
    
    if (inputs.images && Array.isArray(inputs.images)) {
      for (let i = 0; i < inputs.images.length; i++) {
        const imageData = inputs.images[i];
        if (imageData.buffer) {
          // Sauvegarder l'image physiquement
          const imageFilename = `${operationId}_input_${i + 1}.jpg`;
          const imagePath = path.join(workflowDir, imageFilename);
          await fs.writeFile(imagePath, imageData.buffer);
          savedImagePaths.push(imageFilename);
          
          // Remplacer le buffer par le chemin du fichier
          processedInputs.images[i] = {
            ...imageData,
            buffer: null,
            savedPath: imageFilename,
            size: imageData.size
          };
        }
      }
    }
    
    await fs.writeFile(inputsPath, JSON.stringify(processedInputs, null, 2));

    // 3. Sauvegarder les sorties (outputs) détaillées de chaque tâche
    const outputsFilename = `${operationId}_outputs.json`;
    const outputsPath = path.join(workflowDir, outputsFilename);
    
    // Traiter les résultats avec URLs/images générées
    const processedResults = {
      task_results: taskResults,
      global_results: results,
      execution_summary: {
        total_tasks: workflow.tasks.length,
        completed_tasks: taskResults.filter(t => t.status === 'completed').length,
        failed_tasks: taskResults.filter(t => t.status === 'failed').length,
        execution_time: executionTime,
        status: status
      }
    };

    // Télécharger et sauvegarder les images/vidéos générées
    const downloadedAssets = [];
    for (let i = 0; i < taskResults.length; i++) {
      const taskResult = taskResults[i];
      if (taskResult.outputs) {
        // Images générées
        if (taskResult.outputs.image && typeof taskResult.outputs.image === 'string') {
          try {
            const assetFilename = `${operationId}_task_${taskResult.type}_${i + 1}.jpg`;
            const assetPath = path.join(workflowDir, assetFilename);
            await downloadImageToPath(taskResult.outputs.image, assetPath);
            downloadedAssets.push({
              taskId: taskResult.type,
              type: 'image',
              originalUrl: taskResult.outputs.image,
              savedPath: assetFilename
            });
            
            // Mettre à jour avec le chemin local
            taskResult.outputs.savedImagePath = assetFilename;
          } catch (error) {
            console.warn(`⚠️ Impossible de télécharger l'image de ${taskResult.type}:`, error.message);
          }
        }
        
        // Images éditées (multiples)
        if (taskResult.outputs.edited_images && Array.isArray(taskResult.outputs.edited_images)) {
          for (let j = 0; j < taskResult.outputs.edited_images.length; j++) {
            const editedImageUrl = taskResult.outputs.edited_images[j];
            if (typeof editedImageUrl === 'string') {
              try {
                const assetFilename = `${operationId}_task_${taskResult.type}_edited_${i + 1}_${j + 1}.jpg`;
                const assetPath = path.join(workflowDir, assetFilename);
                await downloadImageToPath(editedImageUrl, assetPath);
                downloadedAssets.push({
                  taskId: taskResult.type,
                  type: 'edited_image',
                  originalUrl: editedImageUrl,
                  savedPath: assetFilename
                });
                
                // Ajouter le chemin local
                if (!taskResult.outputs.savedEditedImagePaths) {
                  taskResult.outputs.savedEditedImagePaths = [];
                }
                taskResult.outputs.savedEditedImagePaths.push(assetFilename);
              } catch (error) {
                console.warn(`⚠️ Impossible de télécharger l'image éditée ${j + 1} de ${taskResult.type}:`, error.message);
              }
            }
          }
        }
        
        // Image éditée principale
        if (taskResult.outputs.edited_image && typeof taskResult.outputs.edited_image === 'string') {
          try {
            const assetFilename = `${operationId}_task_${taskResult.type}_edited_${i + 1}.jpg`;
            const assetPath = path.join(workflowDir, assetFilename);
            await downloadImageToPath(taskResult.outputs.edited_image, assetPath);
            downloadedAssets.push({
              taskId: taskResult.type,
              type: 'edited_image',
              originalUrl: taskResult.outputs.edited_image,
              savedPath: assetFilename
            });
            
            // Mettre à jour avec le chemin local
            taskResult.outputs.savedEditedImagePath = assetFilename;
          } catch (error) {
            console.warn(`⚠️ Impossible de télécharger l'image éditée de ${taskResult.type}:`, error.message);
          }
        }
        
        // Vidéos générées
        if (taskResult.outputs.video && typeof taskResult.outputs.video === 'string') {
          try {
            const assetFilename = `${operationId}_task_${taskResult.type}_${i + 1}.mp4`;
            const assetPath = path.join(workflowDir, assetFilename);
            await downloadImageToPath(taskResult.outputs.video, assetPath);
            downloadedAssets.push({
              taskId: taskResult.type,
              type: 'video',
              originalUrl: taskResult.outputs.video,
              savedPath: assetFilename
            });
            
            // Mettre à jour avec le chemin local
            taskResult.outputs.savedVideoPath = assetFilename;
          } catch (error) {
            console.warn(`⚠️ Impossible de télécharger la vidéo de ${taskResult.type}:`, error.message);
          }
        }
      }
    }
    
    processedResults.downloaded_assets = downloadedAssets;
    await fs.writeFile(outputsPath, JSON.stringify(processedResults, null, 2));

    // 4. Sauvegarder un résumé d'exécution général
    const summaryFilename = `${operationId}_summary.json`;
    const summaryPath = path.join(workflowDir, summaryFilename);
    
    const executionSummary = {
      operation_id: operationId,
      workflow_id: workflow.id,
      workflow_name: workflow.name,
      timestamp: new Date().toISOString(),
      execution_time_seconds: executionTime / 1000,
      status: status,
      prompt: prompt,
      task_count: workflow.tasks.length,
      completed_tasks: taskResults.filter(t => t.status === 'completed').length,
      failed_tasks: taskResults.filter(t => t.status === 'failed').length,
      input_images_count: savedImagePaths.length,
      output_assets_count: downloadedAssets.length,
      files_saved: {
        workflow: workflowFilename,
        inputs: inputsFilename,
        outputs: outputsFilename,
        summary: summaryFilename,
        input_images: savedImagePaths,
        output_assets: downloadedAssets.map(a => a.savedPath)
      }
    };
    
    await fs.writeFile(summaryPath, JSON.stringify(executionSummary, null, 2));

    console.log(`✅ Workflow complet sauvegardé: ${workflowDir}`);
    console.log(`📁 Fichiers créés: workflow, inputs, outputs, summary + ${savedImagePaths.length} images + ${downloadedAssets.length} assets`);

    return {
      success: true,
      operationId: operationId,
      workflowDir: workflowDir,
      filesCount: 4 + savedImagePaths.length + downloadedAssets.length,
      summary: executionSummary
    };

  } catch (error) {
    console.error('❌ Erreur sauvegarde workflow:', error);
    throw error;
  }
}

// Fonction helper pour télécharger avec nom personnalisé
async function downloadAndSaveResultCustom(url, operationId, filename) {
  const workflowDir = path.join(DATA_ROOT, 'workflows', operationId);
  const filepath = path.join(workflowDir, filename);
  
  try {
    const fetch = (await import('node-fetch')).default;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await fs.writeFile(filepath, buffer);
    
    console.log(`✅ Asset téléchargé: ${filename}`);
    return filepath;
  } catch (error) {
    console.error(`❌ Erreur téléchargement ${filename}:`, error);
    throw error;
  }
}

// Toutes les fonctions sont exportées individuellement avec 'export function/async function'
