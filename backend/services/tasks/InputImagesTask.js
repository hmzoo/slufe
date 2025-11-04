/**
 * Service de tâche pour l'upload d'images
 * Tâche générique sans appel API - capture et stocke les images uploadées
 */
export class InputImagesTask {
  constructor() {
    this.taskType = 'input_images';
    this.modelName = 'Local';
  }

  /**
   * Exécute la tâche d'upload d'images
   * @param {Object} inputs - Entrées de la tâche
   * @param {string} inputs.label - Libellé du champ
   * @param {boolean} [inputs.multiple] - Permettre plusieurs images
   * @param {Array} [inputs.uploadedImages] - Images uploadées par l'utilisateur
   * @returns {Object} Résultats avec les images
   */
  async execute(inputs) {
    try {
      global.logWorkflow(`📸 Capture d'images: "${inputs.label}"`, {
        multiple: inputs.multiple,
        imageCount: inputs.uploadedImages?.length || 0
      });

      // Récupérer les images uploadées
      const images = inputs.uploadedImages || [];

      if (!images.length) {
        global.logWorkflow(`⚠️ Aucune image uploadée pour: ${inputs.label}`);
      }

      return {
        images: images,
        imageCount: images.length,
        label: inputs.label,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      global.logWorkflow(`❌ Erreur lors de la capture d'images`, {
        error: error.message,
        label: inputs.label
      });

      throw error;
    }
  }
}
