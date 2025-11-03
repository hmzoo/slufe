// Test rapide de saveCompleteOperation
import { saveCompleteOperation } from './services/dataStorage.js';

console.log('🧪 Test de sauvegarde d\'opération...\n');

const testOperation = {
  operationType: 'text_to_image',
  prompt: 'un magnifique paysage de montagne au coucher du soleil',
  parameters: {
    aspectRatio: '16:9',
    guidance: 3,
    numInferenceSteps: 30
  },
  inputImages: [], // Pas d'images pour text-to-image
  resultUrl: 'https://replicate.delivery/pbxt/test-image-url.jpg',
  workflowAnalysis: null,
  error: null
};

try {
  const result = await saveCompleteOperation(testOperation);
  
  console.log('✅ Opération sauvegardée avec succès !');
  console.log('📋 Résultat:', JSON.stringify(result, null, 2));
  
  console.log('\n📁 Fichiers créés:');
  console.log(`  - ${result.outputFile || 'pas de fichier output (URL externe)'}`);
  console.log(`  - ${result.metadataFile}`);
  
} catch (error) {
  console.error('❌ Erreur:', error.message);
  console.error(error.stack);
}
