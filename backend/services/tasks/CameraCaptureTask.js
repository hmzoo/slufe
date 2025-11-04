/**
 * Service de tâche pour la capture caméra
 * Tâche générique sans appel API - capture et stocke l'image depuis la caméra
 */
export class CameraCaptureTask {
  constructor() {
    this.taskType = 'camera_capture';
    this.modelName = 'Local';
  }

  /**
   * Exécute la tâche de capture caméra
   * @param {Object} inputs - Entrées de la tâche
   * @param {string} inputs.label - Libellé du champ
   * @param {string} [inputs.facingMode] - Mode caméra: 'user' ou 'environment'
   * @param {Object} [inputs.capturedImage] - Image capturée par l'utilisateur
   * @returns {Object} Résultats avec l'image
   */
  async execute(inputs) {
    try {
      global.logWorkflow(`📷 Capture caméra: "${inputs.label}"`, {
        facingMode: inputs.facingMode,
        hasImage: !!inputs.capturedImage
      });

      // Récupérer l'image capturée
      const image = inputs.capturedImage || null;

      if (!image) {
        global.logWorkflow(`⚠️ Aucune image capturée pour: ${inputs.label}`);
      }

      return {
        image: image,
        facingMode: inputs.facingMode,
        label: inputs.label,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      global.logWorkflow(`❌ Erreur lors de la capture caméra`, {
        error: error.message,
        label: inputs.label
      });

      throw error;
    }
  }
}
