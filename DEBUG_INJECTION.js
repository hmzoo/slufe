/**
 * Debug: Vérifie ce qui est réellement injecté et envoyé au backend
 */

// Simuler un workflow template
const workflow = {
  id: 'template-123',
  inputs: [
    {
      id: 'image1',
      type: 'image_input',
      label: 'Image à éditer',
      selectedImage: '',
      defaultImage: ''
    },
    {
      id: 'text1',
      type: 'text_input',
      label: 'Prompt',
      userInput: ''
    }
  ],
  tasks: [
    {
      id: 'edit1',
      type: 'edit_image',
      image1: '{{image1.image}}',
      editPrompt: '{{text1.text}}'
    }
  ]
}

// Formulaire rempli
const inputs = {
  image1: { name: 'test.jpg' },  // Simulé File objet
  text1: 'Make it sketch'
}

const imageUrls = {
  image1: 'http://localhost:3000/uploads/abc123.jpg'
}

// Test de l'injection
function injectFormDataIntoWorkflow(workflow, inputs, imageUrls) {
  console.log('🔍 Avant injection:')
  console.log('workflow.inputs[0].selectedImage:', workflow.inputs[0].selectedImage)
  
  // Créer une copie profonde du workflow
  const workflowCopy = JSON.parse(JSON.stringify(workflow))
  
  console.log('\n🔍 Après JSON.parse (copie vide):')
  console.log('workflowCopy.inputs[0].selectedImage:', workflowCopy.inputs[0].selectedImage)
  
  // Injecter les données dans les tâches input
  if (workflowCopy.inputs && Array.isArray(workflowCopy.inputs)) {
    for (const inputTask of workflowCopy.inputs) {
      const inputId = inputTask.id
      
      if (inputTask.type === 'image_input') {
        if (imageUrls[inputId]) {
          inputTask.selectedImage = imageUrls[inputId]
          console.log(`\n✅ Image injectée: ${inputId} = ${imageUrls[inputId]}`)
        }
      } else if (inputTask.type === 'text_input') {
        if (inputs[inputId] !== undefined) {
          inputTask.userInput = inputs[inputId]
          console.log(`✅ Texte injecté: ${inputId} = ${inputs[inputId]}`)
        }
      }
    }
  }
  
  console.log('\n🔍 Après injection:')
  console.log('workflowCopy.inputs[0].selectedImage:', workflowCopy.inputs[0].selectedImage)
  console.log('\n📦 Workflow à envoyer au backend:')
  console.log(JSON.stringify(workflowCopy.inputs, null, 2))
  
  return workflowCopy
}

// Exécuter le test
const workflowToExecute = injectFormDataIntoWorkflow(workflow, inputs, imageUrls)

console.log('\n🚀 Résumé - Données à envoyer:')
console.log({
  workflow: {
    id: workflowToExecute.id,
    inputs: workflowToExecute.inputs.map(t => ({
      id: t.id,
      type: t.type,
      selectedImage: t.selectedImage,
      userInput: t.userInput
    })),
    tasks: workflowToExecute.tasks.length
  }
})
