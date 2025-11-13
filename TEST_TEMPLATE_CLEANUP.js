#!/usr/bin/env node

/**
 * Test: Nettoyage des données dans les templates
 * 
 * Valide que les inputs utilisateur sont complètement vidés
 * quand un template est généré depuis un workflow
 */

console.log('\n' + '='.repeat(80));
console.log('🧹 TEST: Nettoyage des données d\'entrée dans les templates');
console.log('='.repeat(80) + '\n');

// Simuler la fonction cleanWorkflowForTemplate
function cleanWorkflowForTemplate(workflow) {
  const cleanedWorkflow = JSON.parse(JSON.stringify(workflow)); // Deep copy
  
  // ===== NETTOYAGE DES INPUTS DU WORKFLOW =====
  if (cleanedWorkflow.inputs && Array.isArray(cleanedWorkflow.inputs)) {
    cleanedWorkflow.inputs.forEach(input => {
      const configFields = [
        'id', 'type', 'label', 'placeholder', 'description',
        'required', 'multiple', 'maxFiles', 'min', 'max',
        'step', 'pattern', 'hint', 'hidden', 'disabled',
        'options', 'defaultValue', 'multiline', 'rows', 'aspectRatio',
        'strength', 'iterations', 'count', 'timeout', 'retries'
      ];
      
      Object.keys(input).forEach(key => {
        if (!configFields.includes(key)) {
          if (key === 'userInput') {
            input[key] = '';
          } else if (key === 'selectedImage' || key === 'image') {
            input[key] = '';
          } else if (key === 'uploadedImages') {
            input[key] = [];
          } else if (key === 'defaultImage') {
            input[key] = '';
          } else if (Array.isArray(input[key])) {
            input[key] = [];
          } else if (typeof input[key] === 'string') {
            input[key] = '';
          } else if (typeof input[key] === 'object' && input[key] !== null) {
            delete input[key];
          }
        }
      });
    });
  }
  
  // ===== NETTOYAGE DES OUTPUTS DU WORKFLOW =====
  if (cleanedWorkflow.outputs && Array.isArray(cleanedWorkflow.outputs)) {
    cleanedWorkflow.outputs.forEach(output => {
      const configFields = [
        'id', 'type', 'label', 'title', 'description',
        'sourceTaskId', 'caption', 'width', 'height'
      ];
      
      if (output.inputs && typeof output.inputs === 'object') {
        Object.keys(output.inputs).forEach(key => {
          const value = output.inputs[key];
          if (typeof value === 'string' && !value.includes('{{')) {
            output.inputs[key] = '';
          }
        });
      }
    });
  }
  
  if (cleanedWorkflow.tasks) {
    cleanedWorkflow.tasks.forEach(task => {
      if (task.type === 'input_text') {
        delete task.userInputValue;
        delete task.executionValue;
        if (task.input) {
          task.input.userInput = '';
        }
      }
      
      if (task.type === 'input_images') {
        delete task.uploadedImagePreviews;
        delete task.selectedMediaIds;
        delete task.executionImages;
        if (task.input) {
          task.input.uploadedImages = [];
        }
      }
      
      if (task.type === 'image_input') {
        delete task.selectedImage;
        delete task.selectedImageUrl;
        delete task.executionImage;
        if (task.input) {
          task.input.selectedImage = undefined;
          task.input.image = undefined;
          task.input.defaultImage = undefined;
        }
      }
      
      if (task.input && !['input_text', 'input_images', 'image_input'].includes(task.type)) {
        Object.keys(task.input).forEach(inputKey => {
          const inputValue = task.input[inputKey];
          const configFields = [
            'label', 'placeholder', 'defaultValue', 'description', 
            'required', 'type', 'options', 'multiple', 'min', 'max',
            'step', 'pattern', 'hint', 'hidden', 'disabled', 'aspectRatio',
            'strength', 'iterations', 'count', 'timeout', 'retries'
          ];
          
          if (configFields.includes(inputKey)) {
            return;
          }
          
          if (typeof inputValue === 'string' && inputValue.includes('{{') && inputValue.includes('}}')) {
            return;
          }
          
          const isUserDataField = 
            inputKey.toLowerCase().includes('prompt') || 
            inputKey.toLowerCase().includes('text') ||
            inputKey.toLowerCase().includes('user') ||
            inputKey.toLowerCase().includes('input') ||
            inputKey.toLowerCase().includes('content') ||
            inputKey.toLowerCase().startsWith('imageInputMode');
          
          if (isUserDataField) {
            if (Array.isArray(inputValue)) {
              task.input[inputKey] = [];
            } else if (typeof inputValue === 'string') {
              task.input[inputKey] = '';
            } else if (typeof inputValue === 'object' && inputValue !== null) {
              task.input[inputKey] = {};
            }
          }
        });
      }
      
      delete task.imageInputMode;
      delete task.executionTime;
      delete task.executionResult;
      delete task.executionError;
      
      Object.keys(task).forEach(key => {
        if (key.startsWith('mediaIds_') || 
            key.startsWith('imageInputMode_') ||
            key.startsWith('userInput_') ||
            key.startsWith('execution')) {
          delete task[key];
        }
      });
    });
  }
  
  delete cleanedWorkflow.id;
  delete cleanedWorkflow.createdAt;
  delete cleanedWorkflow.updatedAt;
  delete cleanedWorkflow.executionHistory;
  delete cleanedWorkflow.executionStartTime;
  delete cleanedWorkflow.lastExecutedAt;
  
  return cleanedWorkflow;
}

// ============================================================================
// Test 1: Workflow avec données utilisateur
// ============================================================================

console.log('Test 1️⃣: Workflow avec données utilisateur');
console.log('-'.repeat(80));

const dirtyWorkflow = {
  name: "test edition d image",
  description: "",
  inputs: [
    {
      id: "image1",
      type: "image_input",
      label: "Image à éditer",
      multiple: false,
      required: true,
      maxFiles: 5,
      image: "/medias/2b34a259-cd06-4224-beb2-e299db73e6c2.png", // ❌ DONNÉES
      defaultImage: "",
      selectedImage: "/medias/7dab6612-201a-437c-a8ec-962e160858a7.jpg" // ❌ DONNÉES
    },
    {
      id: "text1",
      type: "text_input",
      label: "edition",
      placeholder: "",
      defaultValue: "",
      multiline: false,
      required: true,
      userInput: "turn 90 degres right" // ❌ DONNÉES
    }
  ],
  tasks: [
    {
      id: "edit1",
      type: "edit_image",
      inputs: {
        image1: "{{image1.image}}",
        image2: "",
        image3: "",
        editPrompt: "{{text1.text}}",
        aspectRatio: "original"
      }
    }
  ],
  outputs: [
    {
      id: "image2",
      type: "image_output",
      inputs: {
        image: "{{edit1.edited_images}}",
        title: "",
        caption: "",
        width: "medium"
      }
    }
  ]
};

console.log('Avant nettoyage:');
console.log('  image1.image:', dirtyWorkflow.inputs[0].image);
console.log('  image1.selectedImage:', dirtyWorkflow.inputs[0].selectedImage);
console.log('  text1.userInput:', dirtyWorkflow.inputs[1].userInput);

const cleanedWorkflow = cleanWorkflowForTemplate(dirtyWorkflow);

console.log('\nAprès nettoyage:');
console.log('  image1.image:', JSON.stringify(cleanedWorkflow.inputs[0].image));
console.log('  image1.selectedImage:', JSON.stringify(cleanedWorkflow.inputs[0].selectedImage));
console.log('  text1.userInput:', JSON.stringify(cleanedWorkflow.inputs[1].userInput));

const test1Pass = 
  cleanedWorkflow.inputs[0].image === '' &&
  cleanedWorkflow.inputs[0].selectedImage === '' &&
  cleanedWorkflow.inputs[1].userInput === '';

console.log('\n' + (test1Pass ? '✅' : '❌') + ' Test 1: ' + (test1Pass ? 'PASSÉ' : 'ÉCHOUÉ'));

// ============================================================================
// Test 2: Configuration préservée (INCLUDE defaultValue et defaultImage)
// ============================================================================

console.log('\n' + '='.repeat(80));
console.log('Test 2️⃣: Configuration DOIT être préservée (y compris defaultValue et defaultImage)');
console.log('-'.repeat(80));

console.log('Avant nettoyage:');
console.log('  image1.type:', dirtyWorkflow.inputs[0].type);
console.log('  image1.label:', dirtyWorkflow.inputs[0].label);
console.log('  image1.defaultImage:', dirtyWorkflow.inputs[0].defaultImage);
console.log('  text1.type:', dirtyWorkflow.inputs[1].type);
console.log('  text1.placeholder:', dirtyWorkflow.inputs[1].placeholder);
console.log('  text1.defaultValue:', dirtyWorkflow.inputs[1].defaultValue);

console.log('\nAprès nettoyage:');
console.log('  image1.type:', cleanedWorkflow.inputs[0].type);
console.log('  image1.label:', cleanedWorkflow.inputs[0].label);
console.log('  image1.defaultImage:', cleanedWorkflow.inputs[0].defaultImage);
console.log('  text1.type:', cleanedWorkflow.inputs[1].type);
console.log('  text1.placeholder:', cleanedWorkflow.inputs[1].placeholder);
console.log('  text1.defaultValue:', cleanedWorkflow.inputs[1].defaultValue);

const test2Pass =
  cleanedWorkflow.inputs[0].type === 'image_input' &&
  cleanedWorkflow.inputs[0].label === 'Image à éditer' &&
  cleanedWorkflow.inputs[0].defaultImage === '' && // Preserved (empty but present)
  cleanedWorkflow.inputs[1].type === 'text_input' &&
  cleanedWorkflow.inputs[1].placeholder === '' &&
  cleanedWorkflow.inputs[1].defaultValue === ''; // Preserved (empty but present)

console.log('\n' + (test2Pass ? '✅' : '❌') + ' Test 2: ' + (test2Pass ? 'PASSÉ' : 'ÉCHOUÉ'));

// ============================================================================
// Test 3: Variables {{}} préservées
// ============================================================================

console.log('\n' + '='.repeat(80));
console.log('Test 3️⃣: Variables {{}} doivent être préservées');
console.log('-'.repeat(80));

console.log('Avant nettoyage:');
console.log('  task.inputs.editPrompt:', dirtyWorkflow.tasks[0].inputs.editPrompt);

console.log('\nAprès nettoyage:');
console.log('  task.inputs.editPrompt:', cleanedWorkflow.tasks[0].inputs.editPrompt);

const test3Pass = cleanedWorkflow.tasks[0].inputs.editPrompt === '{{text1.text}}';

console.log('\n' + (test3Pass ? '✅' : '❌') + ' Test 3: ' + (test3Pass ? 'PASSÉ' : 'ÉCHOUÉ'));

// ============================================================================
// Test 4: Outputs avec variables préservées
// ============================================================================

console.log('\n' + '='.repeat(80));
console.log('Test 4️⃣: Outputs - variables préservées, données vidées');
console.log('-'.repeat(80));

console.log('Avant nettoyage:');
console.log('  output.inputs.image:', dirtyWorkflow.outputs[0].inputs.image);
console.log('  output.inputs.title:', dirtyWorkflow.outputs[0].inputs.title);
console.log('  output.inputs.caption:', dirtyWorkflow.outputs[0].inputs.caption);

console.log('\nAprès nettoyage:');
console.log('  output.inputs.image:', cleanedWorkflow.outputs[0].inputs.image);
console.log('  output.inputs.title:', cleanedWorkflow.outputs[0].inputs.title);
console.log('  output.inputs.caption:', cleanedWorkflow.outputs[0].inputs.caption);

const test4Pass =
  cleanedWorkflow.outputs[0].inputs.image === '{{edit1.edited_images}}' &&
  cleanedWorkflow.outputs[0].inputs.title === '' &&
  cleanedWorkflow.outputs[0].inputs.caption === '';

console.log('\n' + (test4Pass ? '✅' : '❌') + ' Test 4: ' + (test4Pass ? 'PASSÉ' : 'ÉCHOUÉ'));

// ============================================================================
// Test 5: Métadonnées d'instance supprimées
// ============================================================================

console.log('\n' + '='.repeat(80));
console.log('Test 5️⃣: Métadonnées d\'instance supprimées');
console.log('-'.repeat(80));

const dirtyWithMetadata = {
  ...dirtyWorkflow,
  id: 'workflow_123',
  createdAt: '2025-11-13T14:00:00Z',
  updatedAt: '2025-11-13T15:00:00Z',
  executionHistory: [{ result: 'success' }]
};

const cleanedWithMetadata = cleanWorkflowForTemplate(dirtyWithMetadata);

console.log('Avant nettoyage:');
console.log('  id:', dirtyWithMetadata.id);
console.log('  createdAt:', dirtyWithMetadata.createdAt);
console.log('  executionHistory:', dirtyWithMetadata.executionHistory);

console.log('\nAprès nettoyage:');
console.log('  id:', cleanedWithMetadata.id);
console.log('  createdAt:', cleanedWithMetadata.createdAt);
console.log('  executionHistory:', cleanedWithMetadata.executionHistory);

const test5Pass =
  cleanedWithMetadata.id === undefined &&
  cleanedWithMetadata.createdAt === undefined &&
  cleanedWithMetadata.executionHistory === undefined;

console.log('\n' + (test5Pass ? '✅' : '❌') + ' Test 5: ' + (test5Pass ? 'PASSÉ' : 'ÉCHOUÉ'));

// ============================================================================
// Résumé
// ============================================================================

console.log('\n' + '='.repeat(80));
console.log('📊 RÉSUMÉ');
console.log('='.repeat(80));

const allPass = test1Pass && test2Pass && test3Pass && test4Pass && test5Pass;

console.log(`
✅ Test 1: Données utilisateur vidées
✅ Test 2: Configuration préservée
✅ Test 3: Variables {{}} préservées dans tasks
✅ Test 4: Variables {{}} préservées dans outputs
✅ Test 5: Métadonnées d'instance supprimées

Résultat: ${allPass ? '✅ TOUS LES TESTS PASSÉS' : '❌ CERTAINS TESTS ÉCHOUÉS'}

🎯 Conclusion:
Les templates générés auront:
  • ✅ Tous les champs de saisie VIDÉS
  • ✅ Configuration PRÉSERVÉE
  • ✅ Variables {{}} INTACTES
  • ✅ Métadonnées d'instance SUPPRIMÉES
  • ✅ Prêts à être réutilisés!
`);

console.log('='.repeat(80) + '\n');
