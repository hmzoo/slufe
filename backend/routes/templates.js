import express from 'express';
import { 
  saveTemplate, 
  loadAllTemplates, 
  loadTemplate, 
  deleteTemplate, 
  updateTemplate 
} from '../services/templateManager.js';

const router = express.Router();

/**
 * GET /api/templates
 * Récupère tous les templates disponibles
 */
router.get('/', async (req, res) => {
  try {
    console.log('📋 GET /templates - Récupération des templates');
    
    const templates = await loadAllTemplates();
    
    res.json({
      success: true,
      templates,
      count: templates.length
    });
    
  } catch (error) {
    console.error('❌ Erreur récupération templates:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/templates/:id
 * Récupère un template spécifique
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`📋 GET /templates/${id} - Récupération du template`);
    
    const template = await loadTemplate(id);
    
    res.json({
      success: true,
      template
    });
    
  } catch (error) {
    console.error(`❌ Erreur récupération template ${req.params.id}:`, error);
    res.status(404).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/templates
 * Crée un nouveau template à partir d'un workflow
 */
router.post('/', async (req, res) => {
  try {
    console.log('💾 POST /templates - Création d\'un template');
    console.log('📊 Données reçues:', {
      name: req.body.name,
      hasWorkflow: !!req.body.workflow,
      workflowTasks: req.body.workflow?.tasks?.length || 0
    });
    
    const { name, description, category, icon, workflow, originalWorkflowId, tags } = req.body;
    
    // Validation des données requises
    if (!name || !workflow) {
      return res.status(400).json({
        success: false,
        error: 'Le nom et le workflow sont requis'
      });
    }
    
    const templateData = {
      name,
      description,
      category,
      icon,
      workflow,
      originalWorkflowId,
      tags
    };
    
    const template = await saveTemplate(templateData);
    
    res.status(201).json({
      success: true,
      template,
      message: `Template "${name}" créé avec succès`
    });
    
  } catch (error) {
    console.error('❌ Erreur création template:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PUT /api/templates/:id
 * Met à jour un template existant
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🔄 PUT /templates/${id} - Mise à jour du template`);
    
    const updates = req.body;
    const template = await updateTemplate(id, updates);
    
    res.json({
      success: true,
      template,
      message: `Template "${template.name}" mis à jour avec succès`
    });
    
  } catch (error) {
    console.error(`❌ Erreur mise à jour template ${req.params.id}:`, error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /api/templates/:id
 * Supprime un template
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🗑️ DELETE /templates/${id} - Suppression du template`);
    
    await deleteTemplate(id);
    
    res.json({
      success: true,
      message: `Template supprimé avec succès`
    });
    
  } catch (error) {
    console.error(`❌ Erreur suppression template ${req.params.id}:`, error);
    res.status(404).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/templates/from-workflow
 * Crée un template à partir d'un workflow existant (raccourci)
 */
router.post('/from-workflow', async (req, res) => {
  try {
    console.log('🔄 POST /templates/from-workflow - Création template depuis workflow');
    
    const { workflowId, templateName, templateDescription, category, icon } = req.body;
    
    if (!workflowId || !templateName) {
      return res.status(400).json({
        success: false,
        error: 'L\'ID du workflow et le nom du template sont requis'
      });
    }
    
    // Ici, on devrait récupérer le workflow depuis le store ou la base de données
    // Pour l'instant, on attend que le workflow soit fourni directement
    if (!req.body.workflow) {
      return res.status(400).json({
        success: false,
        error: 'Le workflow source doit être fourni'
      });
    }
    
    const templateData = {
      name: templateName,
      description: templateDescription || `Template créé à partir du workflow ${workflowId}`,
      category: category || 'custom',
      icon: icon || 'dashboard',
      workflow: req.body.workflow,
      originalWorkflowId: workflowId
    };
    
    const template = await saveTemplate(templateData);
    
    res.status(201).json({
      success: true,
      template,
      message: `Template "${templateName}" créé à partir du workflow avec succès`
    });
    
  } catch (error) {
    console.error('❌ Erreur création template depuis workflow:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;