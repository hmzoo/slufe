/**
 * Configuration des timeouts pour les appels Replicate
 * 
 * Replicate utilise un système de polling pour attendre les résultats.
 * Ces configurations augmentent les timeouts au maximum pour les modèles lents.
 */

export const REPLICATE_CONFIG = {
  // Timeout global pour l'attente du résultat (en millisecondes)
  // 10 minutes = 600 000 ms
  timeout: 600000,
  
  // Options pour replicate.run()
  wait: {
    // Intervalle entre les polls (en ms) - par défaut 500ms
    interval: 1000, // 1 seconde entre chaque vérification
  },
  
  // Options pour les prédictions
  prediction: {
    // Timeout maximum pour attendre une prédiction (en secondes)
    maxWaitTime: 600, // 10 minutes
  }
};

/**
 * Options par défaut pour tous les appels Replicate
 */
export const DEFAULT_REPLICATE_OPTIONS = {
  // Attendre la complétion de la prédiction
  wait: REPLICATE_CONFIG.wait,
};

console.log('⏱️  Configuration Replicate:');
console.log(`   - Timeout global: ${REPLICATE_CONFIG.timeout / 1000}s`);
console.log(`   - Intervalle de polling: ${REPLICATE_CONFIG.wait.interval / 1000}s`);
console.log(`   - Temps d'attente max: ${REPLICATE_CONFIG.prediction.maxWaitTime}s`);
