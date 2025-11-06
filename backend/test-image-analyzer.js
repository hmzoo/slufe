// Test simple du service imageAnalyzer avec logging
import { analyzeImage } from './services/imageAnalyzer.js';

// Mock pour éviter l'erreur de REPLICATE_API_TOKEN
process.env.REPLICATE_API_TOKEN = 'test-token';

// Test avec un prompt personnalisé
async function testLogging() {
  try {
    console.log('Test du logging du prompt...');
    
    // Simuler l'appel avec un prompt personnalisé
    await analyzeImage(
      'https://example.com/test.jpg',
      'Décris cette image en détail en français'
    );
  } catch (error) {
    // On s'attend à une erreur car on n'a pas de vraie API token
    // mais on devrait voir le log du prompt quand même
    console.log('Erreur attendue (pas de vraie API token):', error.message);
  }
}

testLogging();