/**
 * Service de tâche pour les outputs d'image
 * Gère l'affichage et le formatage des images de sortie
 */
export class ImageOutputTask {
  constructor() {
    this.taskType = 'image_output';
  }

  /**
   * Exécute la tâche d'output d'image
   * @param {Object} inputs - Entrées de la tâche
   * @returns {Object} Résultats formatés pour l'affichage
   */
  async execute(inputs) {
    try {
      console.log('🖼️ ImageOutputTask - inputs:', inputs);
      
      // Récupérer l'image à afficher
      let imageUrl = inputs.image || inputs.image_url;
      
      // Validation
      if (!imageUrl) {
        throw new Error('Aucune image fournie pour l\'affichage');
      }
      
      // Si c'est un array d'images, prendre la première
      if (Array.isArray(imageUrl)) {
        imageUrl = imageUrl[0];
      }
      
      // Vérifier que l'URL est valide
      if (typeof imageUrl !== 'string' || imageUrl.trim() === '') {
        throw new Error('URL d\'image invalide pour l\'affichage');
      }
      
      console.log('🖼️ Image de sortie:', imageUrl);
      
      // Formater le résultat pour l'affichage
      const result = {
        image_url: imageUrl,
        image: imageUrl, // Alias pour compatibilité
        title: inputs.title || 'Image générée',
        caption: inputs.caption || '',
        width: inputs.width || 'medium',
        status: 'success',
        type: 'image' // Type pour le frontend
      };
      
      console.log('🖼️ Résultat formaté:', result);
      
      return result;
      
    } catch (error) {
      console.error('❌ Erreur ImageOutputTask:', error);
      throw error;
    }
  }
  
  /**
   * Valide les paramètres d'entrée
   * @param {Object} inputs - Entrées à valider
   * @returns {boolean} True si valide
   */
  validate(inputs) {
    return inputs && (inputs.image || inputs.image_url);
  }
}

export default ImageOutputTask;