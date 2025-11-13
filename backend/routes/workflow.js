import express from 'express';
import multer from 'multer';
import crypto from 'crypto';

// Import du nouveau système de workflows uniquement
import WorkflowRunner from '../services/WorkflowRunner.js';
import uploadMediaService from '../services/uploadMedia.js';
import { getMediasDir } from '../utils/fileUtils.js';
import fs from 'fs/promises';
import path from 'path';

const router = express.Router();

// Instance du runner de workflows
const workflowRunner = new WorkflowRunner();

/**
 * Résout les IDs de médias dans le workflow vers les fichiers locaux
 * Convertit les string IDs en objets de fichiers compatibles avec l'ancien système
 */
async function resolveMediaIds(workflow, inputs) {
  try {
    const filesByField = {};
    const mediaFiles = {}; // Mapping direct UUID -> fichier
    
    global.logWorkflow('🔍 Début résolution médias', {
      tasks: workflow.tasks?.length || 0
    });
    
    // Parcourir toutes les tâches pour trouver les IDs de médias
    for (const task of workflow.tasks) {
      global.logWorkflow(`🔍 Analyse tâche: ${task.id}`, {
        type: task.type,
        inputs: Object.keys(task.inputs || {})
      });
      
      if (task.inputs) {
        // Analyser chaque input de la tâche
        for (const [inputKey, inputValue] of Object.entries(task.inputs)) {
          // Vérifier si c'est une référence à un input global
          if (typeof inputValue === 'string' && inputValue.startsWith('{{input.')) {
            const inputRef = inputValue.replace(/{{input\.(.+)}}/, '$1');
            const inputData = inputs[inputRef];
            
            global.logWorkflow(`🔍 Référence input détectée: ${inputRef}`, {
              inputValue,
              hasInputData: !!inputData,
              inputDataType: typeof inputData
            });
            
            if (inputData && Array.isArray(inputData)) {
              // C'est un array d'IDs de médias
              const resolvedFiles = [];
              
              for (const mediaId of inputData) {
                if (typeof mediaId === 'string') {
                  const filePath = path.join(getMediasDir(), mediaId);
                  
                  try {
                    await fs.access(filePath);
                    const buffer = await fs.readFile(filePath);
                    
                    resolvedFiles.push({
                      buffer: buffer,
                      originalname: mediaId,
                      mimetype: mediaId.toLowerCase().includes('.jpg') || mediaId.toLowerCase().includes('.jpeg') 
                        ? 'image/jpeg' 
                        : mediaId.toLowerCase().includes('.png') 
                          ? 'image/png' 
                          : 'image/jpeg'
                    });
                    
                    // Garder aussi un mapping direct UUID -> fichier
                    mediaFiles[mediaId] = {
                      buffer: buffer,
                      originalname: mediaId,
                      mimetype: mediaId.toLowerCase().includes('.jpg') || mediaId.toLowerCase().includes('.jpeg') 
                        ? 'image/jpeg' 
                        : mediaId.toLowerCase().includes('.png') 
                          ? 'image/png' 
                          : 'image/jpeg'
                    };
                    
                    global.logWorkflow(`✅ Fichier résolu: ${mediaId}`, {
                      path: filePath,
                      size: buffer.length
                    });
                  } catch (error) {
                    global.logWorkflow(`❌ Erreur lecture fichier ${mediaId}:`, error.message);
                  }
                }
              }
              
              // Assigner à ce champ (ex: edit1_images)
              const fieldName = `${task.id}_${inputKey}`;
              filesByField[fieldName] = resolvedFiles;
              
              global.logWorkflow(`📁 Champ résolu: ${fieldName}`, {
                filesCount: resolvedFiles.length
              });
            }
          }
        }
      }
    }
    
    global.logWorkflow('🎯 Résolution médias terminée', {
      fieldsCount: Object.keys(filesByField).length,
      mediaFilesCount: Object.keys(mediaFiles).length
    });
    
    return { filesByField, mediaFiles };
    
  } catch (error) {
    global.logWorkflow('❌ Erreur résolution médias:', error);
    throw error;
  }
}

// Configuration multer pour les uploads conditionnels
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Middleware conditionnel: utilise multer seulement si c'est multipart
const conditionalMulter = (req, res, next) => {
  const contentType = req.get('Content-Type');
  
  if (contentType && contentType.includes('multipart/form-data')) {
    // Utiliser multer pour les requêtes multipart
    upload.any()(req, res, next);
  } else {
    // Passer directement pour les requêtes JSON
    next();
  }
};

function generateImageHash(imageBuffer) {
  return crypto.createHash('md5').update(imageBuffer).digest('hex').substring(0, 8);
}

async function processImagesForDescriptions(images) {
  const processedImages = [];
  
  for (const image of images) {
    const imageHash = generateImageHash(image.buffer);
    global.logWorkflow(`📷 Image ${imageHash}`, {
      size: image.buffer.length,
      mimetype: image.mimetype,
      originalname: image.originalname
    });
    
    processedImages.push({
      buffer: image.buffer,
      hash: imageHash,
      mimetype: image.mimetype,
      originalname: image.originalname
    });
  }
  
  return processedImages;
}

/**
 * POST /api/workflow/run
 * Exécuter un workflow complet basé sur des tâches séquentielles
 * 
 * Formats acceptés:
 * 1. multipart/form-data (avec fichiers) :
 * - workflow: object (requis) - Objet workflow avec tâches
 * - images[]: File[] (optionnel) - Images uploadées groupées par champ
 * - user_prompt: string (optionnel) - Prompt utilisateur
 * - taskId_inputKey: File[] (optionnel) - Fichiers spécifiques à une tâche
 * 
 * 2. application/json (sans fichiers) :
 * - workflow: object (requis) - Objet workflow avec tâches
 * - inputs: object (optionnel) - Données d'entrée du workflow
 */
router.post('/run', conditionalMulter, async (req, res) => {
  try {
    global.logWorkflow('🚀 POST /workflow/run - Démarrage exécution workflow', {
      contentType: req.get('Content-Type'),
      hasFiles: !!req.files,
      bodyKeys: Object.keys(req.body)
    });

    let workflow;
    let inputs = {};

    // Parse du workflow selon le format de la requête
    if (req.get('Content-Type')?.includes('multipart/form-data')) {
      // Format multipart avec fichiers
      if (!req.body.workflow) {
        return res.status(400).json({
          success: false,
          error: 'Le workflow JSON est requis dans le champ "workflow"'
        });
      }

      try {
        workflow = JSON.parse(req.body.workflow);
      } catch (error) {
        return res.status(400).json({
          success: false,
          error: 'Le workflow JSON est invalide: ' + error.message
        });
      }

      // Préparation des inputs avec fichiers uploadés
      if (req.files && req.files.length > 0) {
        // Gérer les fichiers groupés par champ
        // Format: taskId_inputKey (ex: "edit1_images")
        const filesByField = {};
        
        req.files.forEach(file => {
          const fieldName = file.fieldname;
          
          if (!filesByField[fieldName]) {
            filesByField[fieldName] = [];
          }
          filesByField[fieldName].push(file);
        });

        global.logWorkflow('📁 Fichiers reçus par champ:', Object.keys(filesByField));

        // Convertir en format attendu par le WorkflowRunner
        inputs.files = filesByField;
      }

      // Ajouter autres inputs du body
      Object.keys(req.body).forEach(key => {
        if (key !== 'workflow') {
          try {
            // Essayer de parser en JSON si c'est une string
            inputs[key] = typeof req.body[key] === 'string' ? 
              (req.body[key].startsWith('{') || req.body[key].startsWith('[') ? 
                JSON.parse(req.body[key]) : req.body[key]) : 
              req.body[key];
          } catch (e) {
            inputs[key] = req.body[key];
          }
        }
      });

    } else {
      // Format JSON simple
      workflow = req.body.workflow;
      inputs = req.body.inputs || {};

      if (!workflow) {
        return res.status(400).json({
          success: false,
          error: 'Le workflow est requis'
        });
      }
    }

    global.logWorkflow('📋 Workflow reçu', {
      workflowId: workflow.workflow?.id || workflow.id,
      tasksCount: workflow.workflow?.tasks?.length || workflow.tasks?.length,
      inputKeys: Object.keys(inputs)
    });

    // Normaliser le format du workflow (gérer les cas où workflow.workflow existe)
    const actualWorkflow = workflow.workflow || workflow;

    // Résoudre les IDs de médias si nécessaire
    if (inputs && Object.keys(inputs).length > 0) {
      const { filesByField, mediaFiles } = await resolveMediaIds(actualWorkflow, inputs);
      
      // Ajouter les fichiers résolus aux inputs
      if (Object.keys(filesByField).length > 0) {
        if (!inputs.files) inputs.files = {};
        Object.assign(inputs.files, filesByField);
      }
      
      // Ajouter le mapping direct des médias
      if (Object.keys(mediaFiles).length > 0) {
        inputs.mediaFiles = mediaFiles;
      }
    }

    // Exécuter le workflow
    const result = await workflowRunner.executeWorkflow(actualWorkflow, inputs);

    global.logWorkflow('✅ Workflow terminé avec succès', {
      success: result.success,
      resultKeys: Object.keys(result.results || {})
    });

    res.json(result);

  } catch (error) {
    global.logWorkflow('❌ Erreur lors de l\'exécution du workflow:', error.message);
    
    res.status(500).json({
      success: false,
      error: error.message || 'Erreur lors de l\'exécution du workflow',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

export default router;