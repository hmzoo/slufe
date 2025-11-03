import { executeMultiStepWorkflow, getMultiStepWorkflow } from './services/workflowOrchestrator.js';
import fs from 'fs/promises';
import path from 'path';

async function testWorkflow() {
  console.log('🧪 Test du workflow multi-étapes\n');

  // Charger une image de test (utiliser une petite image)
  const testImagePath = path.join(process.cwd(), 'test-image.jpg');
  
  // Créer une image de test minimale si elle n'existe pas
  let imageBuffer;
  try {
    imageBuffer = await fs.readFile(testImagePath);
  } catch (error) {
    console.log('⚠️  Image de test non trouvée, création d\'un buffer minimal...');
    // Créer un buffer minimal pour le test (1x1 pixel JPEG)
    imageBuffer = Buffer.from([
      0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
      0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43
    ]);
  }

  const workflow = getMultiStepWorkflow('edit_then_video');
  if (!workflow) {
    console.error('❌ Workflow non trouvé');
    return;
  }

  console.log(`✅ Workflow trouvé: ${workflow.name}`);
  console.log(`📋 Étapes: ${workflow.steps.length}`);
  console.log();

  const stepPrompts = [
    "Add a vibrant sunset with warm hues",
    "Animate with smooth camera movements"
  ];

  try {
    const result = await executeMultiStepWorkflow(workflow, {
      prompt: "édite cette image pour ajouter un coucher de soleil puis anime-la",
      optimizedPrompt: "Edit image to add sunset, then animate",
      stepPrompts: stepPrompts,
      imageBuffers: [imageBuffer],
      parameters: {
        aspectRatio: '16:9',
        outputFormat: 'webp',
        outputQuality: 90,
        numFrames: 48,
        resolution: 720
      }
    });

    console.log('\n📊 RÉSULTAT FINAL:');
    console.log('  - Workflow:', result.workflowName);
    console.log('  - Succès:', result.success);
    console.log('  - Étapes exécutées:', result.steps.length);
    
    result.steps.forEach((step, i) => {
      console.log(`\n  Étape ${i + 1}:`);
      console.log(`    - Nom: ${step.name}`);
      console.log(`    - Type: ${step.type}`);
      console.log(`    - Prompt: "${step.prompt}"`);
      console.log(`    - Succès: ${step.success}`);
      console.log(`    - Durée: ${step.duration}ms`);
      if (step.error) {
        console.log(`    - Erreur: ${step.error}`);
      }
    });

  } catch (error) {
    console.error('\n❌ ERREUR:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Exécuter le test
testWorkflow().then(() => {
  console.log('\n✅ Test terminé');
  process.exit(0);
}).catch(error => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});
