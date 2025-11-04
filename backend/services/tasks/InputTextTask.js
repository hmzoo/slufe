/**
 * Service de tâche pour la saisie de texte
 * Tâche générique sans appel API - capture et stocke le texte utilisateur
 */
export class InputTextTask {
  constructor() {
    this.taskType = 'input_text';
    this.modelName = 'Local';
  }

  /**
   * Exécute la tâche de saisie de texte
   * @param {Object} inputs - Entrées de la tâche
   * @param {string} inputs.label - Libellé du champ
   * @param {string} [inputs.placeholder] - Placeholder
   * @param {string} [inputs.defaultValue] - Valeur par défaut
   * @param {string} [inputs.userInput] - Texte saisi par l'utilisateur
   * @returns {Object} Résultats avec le texte
   */
  async execute(inputs) {
    try {
      global.logWorkflow(`📝 Capture de texte: "${inputs.label}"`, {
        hasUserInput: !!inputs.userInput,
        hasDefault: !!inputs.defaultValue
      });

      // Utiliser l'input utilisateur ou la valeur par défaut
      const text = inputs.userInput || inputs.defaultValue || '';

      if (!text) {
        global.logWorkflow(`⚠️ Aucun texte saisi pour: ${inputs.label}`);
      }

      return {
        text: text,
        label: inputs.label,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      global.logWorkflow(`❌ Erreur lors de la capture de texte`, {
        error: error.message,
        label: inputs.label
      });

      throw error;
    }
  }
}
