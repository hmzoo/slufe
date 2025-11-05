import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Dossier des templates
const TEMPLATES_DIR = path.join(__dirname, '..', 'templates');

/**
 * Service de gestion des templates de workflows
 * Les templates sont des workflows sans les données d'entrée spécifiques
 */

/**
 * Nettoie un workflow pour en faire un template
 * Supprime les données utilisateur mais garde les propriétés de configuration
 */
export function cleanWorkflowForTemplate(workflow) {
  const cleanedWorkflow = JSON.parse(JSON.stringify(workflow)); // Deep copy
  
  if (cleanedWorkflow.tasks) {
    cleanedWorkflow.tasks.forEach(task => {
      
      // Pour les composants input_text
      if (task.type === 'input_text') {
        // Supprimer la valeur saisie par l'utilisateur mais garder les propriétés de config
        delete task.userInputValue;
        
        // Dans task.input, vider seulement les valeurs utilisateur, pas les configs
        if (task.input) {
          // Vider les valeurs utilisateur mais garder label, placeholder, defaultValue
          if (task.input.userInput) {
            task.input.userInput = '';
          }
          // Garder: label, placeholder, defaultValue (propriétés de configuration)
        }
      }
      
      // Pour les composants input_images
      if (task.type === 'input_images') {
        // Supprimer les images uploadées par l'utilisateur
        delete task.uploadedImagePreviews;
        delete task.selectedMediaIds;
        
        if (task.input) {
          // Vider les images uploadées mais garder le label
          if (task.input.uploadedImages) {
            task.input.uploadedImages = [];
          }
          // Garder: label (propriété de configuration)
        }
      }
      
      // Pour les autres types de tâches, nettoyer uniquement les valeurs dynamiques
      if (task.input) {
        Object.keys(task.input).forEach(inputKey => {
          const inputValue = task.input[inputKey];
          
          // Garder les références de variables {{}} et les propriétés de configuration
          if (typeof inputValue === 'string' && !inputValue.includes('{{') && !inputValue.includes('}}')) {
            // Ne nettoyer que les champs qui ne sont pas des propriétés de configuration
            const configFields = ['label', 'placeholder', 'defaultValue', 'description'];
            if (!configFields.includes(inputKey)) {
              // Si c'est un champ de prompt/texte utilisateur, le vider
              if (inputKey.toLowerCase().includes('prompt') || 
                  inputKey.toLowerCase().includes('text') ||
                  inputKey.toLowerCase().includes('user')) {
                task.input[inputKey] = '';
              }
            }
          }
        });
      }
      
      // Nettoyer les propriétés spécifiques aux instances (données utilisateur)
      delete task.imageInputMode;
      
      // Nettoyer les propriétés de médias dynamiques
      Object.keys(task).forEach(key => {
        if (key.startsWith('mediaIds_') || key.startsWith('imageInputMode_')) {
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