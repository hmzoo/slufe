#!/usr/bin/env node

/**
 * Test de réinitialisation des champs template
 * Vérifie que cleanWorkflowForTemplate() vide correctement les données
 */

import { cleanWorkflowForTemplate } from './backend/services/templateManager.js'

// Workflow de test avec données utilisateur
const testWorkflow = {
  id: 'workflow_test_123',
  name: 'Test Workflow',
  description: 'Workflow pour test',
  createdAt: '2025-11-13T10:00:00Z',
  updatedAt: '2025-11-13T10:30:00Z',
  executionHistory: [],
  tasks: [
    // Tâche input_text avec données
    {
      id: 'task_text_1',
      type: 'input_text',
      userInputValue: 'texte saisi par l\'utilisateur',
      input: {
        label: 'Entrez un prompt',
        placeholder: 'Ex: une belle maison...',
        defaultValue: 'valeur par défaut',
        userInput: 'texte saisi par l\'utilisateur',
        required: true
      }
    },
    // Tâche input_images avec données
    {
      id: 'task_images_1',
      type: 'input_images',
      uploadedImagePreviews: ['data:image/jpeg;...'],
      selectedMediaIds: ['media_1', 'media_2'],
      input: {
        label: 'Uploadez les images',
        multiple: true,
        uploadedImages: [
          { url: '/medias/img1.jpg', name: 'image1.jpg' },
          { url: '/medias/img2.jpg', name: 'image2.jpg' }
        ],
        required: true
      }
    },
    // Tâche image_input avec données
    {
      id: 'task_image_input_1',
      type: 'image_input',
      selectedImage: '/medias/photo.jpg',
      selectedImageUrl: '/medias/photo.jpg',
      input: {
        selectedImage: '/medias/photo.jpg',
        image: '/medias/photo.jpg',
        label: 'Sélectionnez une image'
      }
    },
    // Tâche générique avec données utilisateur
    {
      id: 'task_edit_1',
      type: 'edit_image',
      input: {
        label: 'Décrivez l\'édition',
        prompt: 'changez la couleur en bleu',
        negative_prompt: 'pas de flou',
        imageInputMode_1: 'selected',
        strength: 0.7,
        description: 'configuration'
      }
    }
  ]
}

console.log('\n╔════════════════════════════════════════════════════════╗')
console.log('║   Test: cleanWorkflowForTemplate()                     ║')
console.log('╚════════════════════════════════════════════════════════╝\n')

// Exécuter le nettoyage
const cleanedWorkflow = cleanWorkflowForTemplate(testWorkflow)

console.log('📋 Workflow original:')
console.log(JSON.stringify(testWorkflow, null, 2))

console.log('\n' + '='.repeat(60) + '\n')

console.log('✨ Workflow nettoyé:')
console.log(JSON.stringify(cleanedWorkflow, null, 2))

console.log('\n' + '='.repeat(60) + '\n')

// Vérifications
console.log('🧪 TESTS DE VÉRIFICATION\n')

let testsPassed = 0
let testsFailed = 0

function test(description, assertion) {
  if (assertion) {
    console.log(`✅ ${description}`)
    testsPassed++
  } else {
    console.log(`❌ ${description}`)
    testsFailed++
  }
}

// Tests pour input_text
const inputTextTask = cleanedWorkflow.tasks[0]
test(
  'input_text: userInput est vide',
  inputTextTask.input.userInput === ''
)
test(
  'input_text: label est conservé',
  inputTextTask.input.label === 'Entrez un prompt'
)
test(
  'input_text: placeholder est conservé',
  inputTextTask.input.placeholder === 'Ex: une belle maison...'
)
test(
  'input_text: defaultValue est conservé',
  inputTextTask.input.defaultValue === 'valeur par défaut'
)
test(
  'input_text: userInputValue est supprimé',
  inputTextTask.userInputValue === undefined
)
test(
  'input_text: required est conservé',
  inputTextTask.input.required === true
)

console.log()

// Tests pour input_images
const inputImagesTask = cleanedWorkflow.tasks[1]
test(
  'input_images: uploadedImages est un tableau vide',
  Array.isArray(inputImagesTask.input.uploadedImages) && 
  inputImagesTask.input.uploadedImages.length === 0
)
test(
  'input_images: label est conservé',
  inputImagesTask.input.label === 'Uploadez les images'
)
test(
  'input_images: multiple est conservé',
  inputImagesTask.input.multiple === true
)
test(
  'input_images: uploadedImagePreviews est supprimé',
  inputImagesTask.uploadedImagePreviews === undefined
)
test(
  'input_images: selectedMediaIds est supprimé',
  inputImagesTask.selectedMediaIds === undefined
)

console.log()

// Tests pour image_input
const imageInputTask = cleanedWorkflow.tasks[2]
test(
  'image_input: selectedImage est undefined',
  imageInputTask.input.selectedImage === undefined
)
test(
  'image_input: image est undefined',
  imageInputTask.input.image === undefined
)
test(
  'image_input: label est conservé',
  imageInputTask.input.label === 'Sélectionnez une image'
)
test(
  'image_input: selectedImage de tâche est supprimé',
  imageInputTask.selectedImage === undefined
)

console.log()

// Tests pour tâche générique
const editImageTask = cleanedWorkflow.tasks[3]
test(
  'edit_image: prompt est vide',
  editImageTask.input.prompt === ''
)
test(
  'edit_image: negative_prompt est vide',
  editImageTask.input.negative_prompt === ''
)
test(
  'edit_image: label est conservé',
  editImageTask.input.label === 'Décrivez l\'édition'
)
test(
  'edit_image: strength est conservé (valeur numérique de config)',
  editImageTask.input.strength === 0.7
)
test(
  'edit_image: description est conservé',
  editImageTask.input.description === 'configuration'
)
test(
  'edit_image: imageInputMode_1 est vide (champ de données utilisateur)',
  editImageTask.input.imageInputMode_1 === ''
)

console.log()

// Tests métadonnées globales
test(
  'workflow: id est supprimé',
  cleanedWorkflow.id === undefined
)
test(
  'workflow: createdAt est supprimé',
  cleanedWorkflow.createdAt === undefined
)
test(
  'workflow: updatedAt est supprimé',
  cleanedWorkflow.updatedAt === undefined
)
test(
  'workflow: executionHistory est supprimé',
  cleanedWorkflow.executionHistory === undefined
)
test(
  'workflow: name est conservé',
  cleanedWorkflow.name === 'Test Workflow'
)
test(
  'workflow: description est conservé',
  cleanedWorkflow.description === 'Workflow pour test'
)

console.log('\n' + '='.repeat(60) + '\n')

console.log(`📊 RÉSULTATS: ${testsPassed} ✅ / ${testsFailed} ❌\n`)

if (testsFailed === 0) {
  console.log('🎉 Tous les tests sont passés!\n')
  process.exit(0)
} else {
  console.log(`⚠️ ${testsFailed} test(s) échoué(s)\n`)
  process.exit(1)
}
