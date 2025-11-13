/**
 * Service de tâche pour les outputs de vidéo
 * Gère l'affichage et le formatage des vidéos de sortie
 */
export class VideoOutputTask {
  constructor() {
    this.taskType = 'video_output';
  }

  /**
   * Exécute la tâche d'output de vidéo
   * @param {Object} inputs - Entrées de la tâche
   * @returns {Object} Résultats formatés pour l'affichage
   */
  async execute(inputs) {
    try {
      console.log('🎬 VideoOutputTask - inputs:', inputs);
      
      // Récupérer la vidéo à afficher
      let videoUrl = inputs.video || inputs.video_url;
      
      // Validation
      if (!videoUrl) {
        throw new Error('Aucune vidéo fournie pour l\'affichage');
      }
      
      // Si c'est un array de vidéos, prendre la première
      if (Array.isArray(videoUrl)) {
        videoUrl = videoUrl[0];
      }
      
      // Vérifier que l'URL est valide
      if (typeof videoUrl !== 'string' || videoUrl.trim() === '') {
        throw new Error('URL de vidéo invalide pour l\'affichage');
      }
      
      console.log('🎬 Vidéo de sortie:', videoUrl);
      
      // Formater le résultat pour l'affichage
      const result = {
        video_url: videoUrl,
        video: videoUrl, // Alias pour compatibilité
        title: inputs.title || 'Vidéo générée',
        width: inputs.width || 'medium',
        autoplay: inputs.autoplay !== undefined ? inputs.autoplay : false,
        controls: inputs.controls !== undefined ? inputs.controls : true,
        loop: inputs.loop !== undefined ? inputs.loop : false,
        status: 'success',
        type: 'video' // Type pour le frontend
      };
      
      console.log('🎬 Résultat formaté:', result);
      
      return result;
      
    } catch (error) {
      console.error('❌ Erreur VideoOutputTask:', error);
      throw error;
    }
  }
  
  /**
   * Valide les paramètres d'entrée
   * @param {Object} inputs - Entrées à valider
   * @returns {boolean} True si valide
   */
  validate(inputs) {
    return inputs && (inputs.video || inputs.video_url);
  }
}

export default VideoOutputTask;
