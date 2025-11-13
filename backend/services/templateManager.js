import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import { getTemplatesDir } from '../utils/fileUtils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Dossier des templates (maintenant dans /data/)
const TEMPLATES_DIR = getTemplatesDir();

/**
 * Service de gestion des templates de workflows
 * Les templates sont des workflows sans les données d'entrée spécifiques
 */

/**
 * Nettoie un workflow pour en faire un template
 * Supprime les données utilisateur mais garde les propriétés de configuration
 * 
 * IMPORTANT: Les champs à nettoyer sont réinitialisés à zéro:
 * - input_text: userInput = '' (garder defaultValue)
 * - input_images: uploadedImages = [] (garder defaultImage)
 * - image_input: selectedImage, image = '' (garder defaultImage)
 * - Les champs de CONFIGURATION sont CONSERVÉS: label, placeholder, defaultValue, defaultImage, etc.
 */
export function cleanWorkflowForTemplate(workflow) {
  const cleanedWorkflow = JSON.parse(JSON.stringify(workflow)); // Deep copy
  
  // ===== NETTOYAGE DES INPUTS DU WORKFLOW =====
  // Nettoyer les données d'entrée au niveau du workflow
  if (cleanedWorkflow.inputs && Array.isArray(cleanedWorkflow.inputs)) {
    cleanedWorkflow.inputs.forEach(input => {
      // Champs de configuration à PRÉSERVER absolument
      const configFields = [
        'id', 'type', 'label', 'placeholder', 'description',
        'required', 'multiple', 'maxFiles', 'min', 'max',
        'step', 'pattern', 'hint', 'hidden', 'disabled',
        'options', 'defaultValue', 'defaultImage', 'multiline', 'rows', 'aspectRatio',
        'strength', 'iterations', 'count', 'timeout', 'retries'
      ];
      
      // Vider UNIQUEMENT les champs de données utilisateur (pas de configuration)
      Object.keys(input).forEach(key => {
        // Garder tous les champs de configuration
        if (configFields.includes(key)) {
          return; // Préserver ce champ
        }
        
        // Vider les champs de données utilisateur
        if (key === 'userInput') {
          input[key] = '';
        } else if (key === 'selectedImage' || key === 'image') {
          input[key] = '';
        } else if (key === 'uploadedImages') {
          input[key] = [];
        } else if (Array.isArray(input[key])) {
          input[key] = [];
        } else if (typeof input[key] === 'string') {
          input[key] = '';
        } else if (typeof input[key] === 'object' && input[key] !== null) {
          delete input[key];
        }
      });
    });
  }
  
  // ===== NETTOYAGE DES OUTPUTS DU WORKFLOW =====
  // Les outputs ne doivent pas contenir de données, seulement la configuration
  if (cleanedWorkflow.outputs && Array.isArray(cleanedWorkflow.outputs)) {
    cleanedWorkflow.outputs.forEach(output => {
      // Garder la configuration mais pas les données
      const configFields = [
        'id', 'type', 'label', 'title', 'description',
        'sourceTaskId', 'caption', 'width', 'height'
      ];
      
      // Pour les inputs des outputs, garder seulement les références {{}}
      if (output.inputs && typeof output.inputs === 'object') {
        Object.keys(output.inputs).forEach(key => {
          const value = output.inputs[key];
          // Garder les références {{}} mais nettoyer les autres valeurs
          if (typeof value === 'string' && !value.includes('{{')) {
            output.inputs[key] = '';
          }
        });
      }
    });
  }
  
  if (cleanedWorkflow.tasks) {
    cleanedWorkflow.tasks.forEach(task => {
      
      // ===== TÂCHES INPUT_TEXT =====
      // Pour les composants input_text
      if (task.type === 'input_text') {
        // Supprimer les propriétés de niveau tâche liées à l'utilisateur
        delete task.userInputValue;
        delete task.executionValue;
        
        // Réinitialiser TOUS les champs de saisie
        if (task.input) {
          // Vider le champ principal de saisie utilisateur
          task.input.userInput = '';
          
          // Garder les propriétés de configuration
          // Conservé: label, placeholder, defaultValue, description, required, etc.
        }
      }
      
      // ===== TÂCHES INPUT_IMAGES =====
      // Pour les composants input_images
      if (task.type === 'input_images') {
        // Supprimer les propriétés de niveau tâche
        delete task.uploadedImagePreviews;
        delete task.selectedMediaIds;
        delete task.executionImages;
        
        // Réinitialiser TOUS les champs d'images
        if (task.input) {
          // Vider le champ principal d'images uploadées
          task.input.uploadedImages = [];
          
          // Garder les propriétés de configuration
          // Conservé: label, multiple, required, etc.
        }
      }
      
      // ===== TÂCHES IMAGE_INPUT (entrée d'image simple) =====
      if (task.type === 'image_input') {
        delete task.selectedImage;
        delete task.selectedImageUrl;
        delete task.executionImage;
        
        if (task.input) {
          // Vider tous les champs image principaux
          task.input.selectedImage = undefined;
          task.input.image = undefined;
          task.input.defaultImage = undefined;
          
          // Garder les propriétés de configuration
        }
      }
      
      // ===== AUTRES TÂCHES D'ENTRÉE =====
      // Pour les autres types de tâches, nettoyer les valeurs dynamiques
      if (task.input && !['input_text', 'input_images', 'image_input'].includes(task.type)) {
        Object.keys(task.input).forEach(inputKey => {
          const inputValue = task.input[inputKey];
          
          // Ne nettoyer que les champs qui ne sont pas des propriétés de configuration
          const configFields = [
            'label', 'placeholder', 'defaultValue', 'description', 
            'required', 'type', 'options', 'multiple', 'min', 'max',
            'step', 'pattern', 'hint', 'hidden', 'disabled', 'aspectRatio',
            'strength', 'iterations', 'count', 'timeout', 'retries'
          ];
          
          // Ne pas nettoyer les champs de configuration
          if (configFields.includes(inputKey)) {
            return;
          }
          
          // Ne pas nettoyer les références de variables {{}}
          if (typeof inputValue === 'string' && inputValue.includes('{{') && inputValue.includes('}}')) {
            return;
          }
          
          // Nettoyer les champs de données utilisateur
          const isUserDataField = 
            inputKey.toLowerCase().includes('prompt') || 
            inputKey.toLowerCase().includes('text') ||
            inputKey.toLowerCase().includes('user') ||
            inputKey.toLowerCase().includes('input') ||
            inputKey.toLowerCase().includes('content') ||
            inputKey.toLowerCase().startsWith('imageInputMode');
          
          if (isUserDataField) {
            // Vider selon le type
            if (Array.isArray(inputValue)) {
              task.input[inputKey] = [];
            } else if (typeof inputValue === 'string') {
              task.input[inputKey] = '';
            } else if (typeof inputValue === 'object' && inputValue !== null) {
              task.input[inputKey] = {};
            }
          }
        });
      }
      
      // ===== NETTOYAGE GLOBAL =====
      // Nettoyer les propriétés spécifiques aux instances (données utilisateur)
      delete task.imageInputMode;
      delete task.executionTime;
      delete task.executionResult;
      delete task.executionError;
      
      // Nettoyer les propriétés de médias dynamiques
      Object.keys(task).forEach(key => {
        if (key.startsWith('mediaIds_') || 
            key.startsWith('imageInputMode_') ||
            key.startsWith('userInput_') ||
            key.startsWith('execution')) {
          delete task[key];
        }
      });
    });
  }
  
  // Nettoyer les métadonnées spécifiques à l'instance
  delete cleanedWorkflow.id;
  delete cleanedWorkflow.createdAt;
  delete cleanedWorkflow.updatedAt;
  delete cleanedWorkflow.executionHistory;
  delete cleanedWorkflow.executionStartTime;
  delete cleanedWorkflow.lastExecutedAt;
  
  return cleanedWorkflow;
}

/**
 * Sauvegarde un template
 */
export async function saveTemplate(templateData) {
  try {
    // Créer le dossier si nécessaire
    await fs.mkdir(TEMPLATES_DIR, { recursive: true });
    
    // Générer un ID unique pour le template
    const templateId = `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const template = {
      id: templateId,
      name: templateData.name,
      description: templateData.description || '',
      category: templateData.category || 'custom',
      icon: templateData.icon || 'dashboard',
      workflow: cleanWorkflowForTemplate(templateData.workflow),
      createdAt: new Date().toISOString(),
      createdFrom: templateData.originalWorkflowId || null,
      tags: templateData.tags || []
    };
    
    const filePath = path.join(TEMPLATES_DIR, `${templateId}.json`);
    await fs.writeFile(filePath, JSON.stringify(template, null, 2), 'utf8');
    
    console.log(`✅ Template sauvegardé: ${template.name} (${templateId})`);
    return template;
    
  } catch (error) {
    console.error('❌ Erreur lors de la sauvegarde du template:', error);
    throw new Error(`Impossible de sauvegarder le template: ${error.message}`);
  }
}

/**
 * Charge tous les templates disponibles
 */
export async function loadAllTemplates() {
  try {
    // Créer le dossier si nécessaire
    await fs.mkdir(TEMPLATES_DIR, { recursive: true });
    
    const files = await fs.readdir(TEMPLATES_DIR);
    const templateFiles = files.filter(file => file.endsWith('.json'));
    
    const templates = [];
    
    for (const file of templateFiles) {
      try {
        const filePath = path.join(TEMPLATES_DIR, file);
        const content = await fs.readFile(filePath, 'utf8');
        const template = JSON.parse(content);
        templates.push(template);
      } catch (error) {
        console.warn(`⚠️ Impossible de charger le template ${file}:`, error.message);
      }
    }
    
    // Trier par date de création (plus récents en premier)
    templates.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    console.log(`📋 ${templates.length} template(s) chargé(s)`);
    return templates;
    
  } catch (error) {
    console.error('❌ Erreur lors du chargement des templates:', error);
    return [];
  }
}

/**
 * Charge un template spécifique
 */
export async function loadTemplate(templateId) {
  try {
    const filePath = path.join(TEMPLATES_DIR, `${templateId}.json`);
    const content = await fs.readFile(filePath, 'utf8');
    const template = JSON.parse(content);
    
    console.log(`📋 Template chargé: ${template.name}`);
    return template;
    
  } catch (error) {
    console.error(`❌ Erreur lors du chargement du template ${templateId}:`, error);
    throw new Error(`Template non trouvé: ${templateId}`);
  }
}

/**
 * Supprime un template
 */
export async function deleteTemplate(templateId) {
  try {
    const filePath = path.join(TEMPLATES_DIR, `${templateId}.json`);
    await fs.unlink(filePath);
    
    console.log(`🗑️ Template supprimé: ${templateId}`);
    return { success: true };
    
  } catch (error) {
    console.error(`❌ Erreur lors de la suppression du template ${templateId}:`, error);
    throw new Error(`Impossible de supprimer le template: ${templateId}`);
  }
}

/**
 * Met à jour un template existant
 */
export async function updateTemplate(templateId, updates) {
  try {
    const template = await loadTemplate(templateId);
    
    const updatedTemplate = {
      ...template,
      ...updates,
      id: templateId, // Garder l'ID original
      updatedAt: new Date().toISOString()
    };
    
    // Si le workflow est mis à jour, le nettoyer
    if (updates.workflow) {
      updatedTemplate.workflow = cleanWorkflowForTemplate(updates.workflow);
    }
    
    const filePath = path.join(TEMPLATES_DIR, `${templateId}.json`);
    await fs.writeFile(filePath, JSON.stringify(updatedTemplate, null, 2), 'utf8');
    
    console.log(`🔄 Template mis à jour: ${updatedTemplate.name}`);
    return updatedTemplate;
    
  } catch (error) {
    console.error(`❌ Erreur lors de la mise à jour du template ${templateId}:`, error);
    throw new Error(`Impossible de mettre à jour le template: ${error.message}`);
  }
}