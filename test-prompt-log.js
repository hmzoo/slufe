#!/usr/bin/env node

/**
 * Test pour vérifier que le prompt final est bien logué
 */

import { analyzeImage } from './backend/services/imageAnalyzer.js';

async function testPromptLogging() {
  console.log('🧪 Test: Vérification du log du prompt final\n');
  
  // Image de test (petit carré rouge en base64)
  const redSquareBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
  
  // Test 1: Prompt par défaut
  console.log('--- Test 1: Prompt par défaut ---');
  try {
    await analyzeImage(redSquareBase64);
  } catch (error) {
    console.log('Erreur attendue:', error.message);
  }
  
  console.log('\n--- Test 2: Prompt personnalisé ---');
  try {
    await analyzeImage(redSquareBase64, 'Quelle est la couleur dominante de cette image ?');
  } catch (error) {
    console.log('Erreur attendue:', error.message);
  }
  
  console.log('\n--- Test 3: Prompt long ---');
  const longPrompt = 'Analyse cette image en détail et décris précisément tous les éléments visibles, les couleurs, la composition, l\'éclairage, l\'ambiance et tout autre aspect significatif de l\'image.';
  try {
    await analyzeImage(redSquareBase64, longPrompt);
  } catch (error) {
    console.log('Erreur attendue:', error.message);
  }
}

testPromptLogging().catch(console.error);