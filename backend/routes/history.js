import express from 'express';
import {
  listOperations,
  getOperationMetadata
} from '../services/dataStorage.js';

const router = express.Router();

/**
 * GET /api/history
 * Liste toutes les opérations sauvegardées
 */
router.get('/', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const operations = await listOperations(limit);
    
    res.json({
      success: true,
      count: operations.length,
      operations: operations
    });
  } catch (error) {
    console.error('❌ Erreur récupération historique:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération de l\'historique',
      details: error.message
    });
  }
});

/**
 * GET /api/history/:operationId
 * Récupère les détails d'une opération spécifique
 */
router.get('/:operationId', async (req, res) => {
  try {
    const { operationId } = req.params;
    const metadata = await getOperationMetadata(operationId);
    
    res.json({
      success: true,
      operation: metadata
    });
  } catch (error) {
    console.error('❌ Erreur récupération opération:', error);
    res.status(404).json({
      success: false,
      error: 'Opération non trouvée',
      details: error.message
    });
  }
});

export default router;
