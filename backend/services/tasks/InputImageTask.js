/**
 * Service de tâche pour les inputs d'image
 * Gère la validation et le passage des images d'entrée
 */
export class InputImageTask {
  constructor() {
    this.taskType = 'image_input';
  }

  /**
   * Exécute la tâche d'input d'image
   * @param {Object} inputs - Entrées de la tâche
   * @returns {Object} Résultats avec l'image d'entrée
   */
  async execute(inputs) {
    try {
      console.log('📸 InputImageTask - inputs:', inputs);
      
      // Récupérer l'image principale ou l'image sélectionnée
      let imageUrl = inputs.selectedImage || inputs.image || inputs.defaultImage;
      
      // Si aucune image n'est fournie, vérifier les autres champs possibles
      if (!imageUrl) {
        // Chercher dans les autres propriétés possibles
        for (const key of Object.keys(inputs)) {
          if (key.includes('image') || key.includes('Image')) {
            imageUrl = inputs[key];
            if (imageUrl) break;
          }
        }
      }
      
      // Validation
      if (!imageUrl) {
        throw new Error('Aucune image fournie pour la tâche image_input');
      }
      
      // Vérifier que l'URL est valide
      if (typeof imageUrl !== 'string' || imageUrl.trim() === '') {
        throw new Error('URL d\'image invalide');
      }
      
      console.log('📸 Image d\'entrée validée:', imageUrl);
      
      // Retourner l'image pour utilisation par d'autres tâches
      return {
        image: imageUrl,
        image_url: imageUrl, // Alias pour compatibilité
        status: 'success',
        message: 'Image d\'entrée traitée avec succès'
      };
      
    } catch (error) {
      console.error('❌ Erreur InputImageTask:', error);
      throw error;
    }
  }
  
  /**
   * Valide les paramètres d'entrée
   * @param {Object} inputs - Entrées à valider
   * @returns {boolean} True si valide
   */
  validate(inputs) {
    return inputs && (
      inputs.selectedImage || 
      inputs.image || 
      inputs.defaultImage ||
      Object.keys(inputs).some(key => 
        key.includes('image') && inputs[key]
      )
    );
  }
}

export default InputImageTask;