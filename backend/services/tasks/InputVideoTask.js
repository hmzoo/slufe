/**
 * Service de tâche pour les inputs de vidéo
 * Gère la validation et le passage des vidéos d'entrée
 */
export class InputVideoTask {
  constructor() {
    this.taskType = 'video_input';
  }

  /**
   * Exécute la tâche d'input de vidéo
   * @param {Object} inputs - Entrées de la tâche
   * @returns {Object} Résultats avec la vidéo d'entrée
   */
  async execute(inputs) {
    try {
      console.log('🎬 InputVideoTask - inputs:', inputs);
      
      // Récupérer la vidéo principale ou la vidéo sélectionnée
      let videoUrl = inputs.selectedVideo || inputs.video || inputs.defaultVideo;
      
      // Si aucune vidéo n'est fournie, vérifier les autres champs possibles
      if (!videoUrl) {
        // Chercher dans les autres propriétés possibles
        for (const key of Object.keys(inputs)) {
          if (key.includes('video') || key.includes('Video')) {
            videoUrl = inputs[key];
            if (videoUrl) break;
          }
        }
      }
      
      // Validation
      if (!videoUrl) {
        throw new Error('Aucune vidéo fournie pour la tâche video_input');
      }
      
      // Vérifier que l'URL est valide
      if (typeof videoUrl !== 'string' || videoUrl.trim() === '') {
        throw new Error('URL de vidéo invalide');
      }
      
      console.log('🎬 Vidéo d\'entrée validée:', videoUrl);
      
      // Retourner la vidéo pour utilisation par d'autres tâches
      return {
        video: videoUrl,
        video_url: videoUrl, // Alias pour compatibilité
        status: 'success',
        message: 'Vidéo d\'entrée traitée avec succès'
      };
      
    } catch (error) {
      console.error('❌ Erreur InputVideoTask:', error);
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
      inputs.selectedVideo || 
      inputs.video || 
      inputs.defaultVideo ||
      Object.keys(inputs).some(key => 
        key.includes('video') && inputs[key]
      )
    );
  }
}

export default InputVideoTask;
