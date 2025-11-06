import WorkflowRunner from './services/WorkflowRunner.js';

// Mock pour global.logWorkflow
global.logWorkflow = (message, data) => {
  console.log(`[LOG] ${message}`, data ? JSON.stringify(data, null, 2) : '');
};

// Simuler le payload que le frontend envoie
const frontendPayload = {
  workflow: {
    id: 'workflow_test_frontend',
    name: 'Test Frontend',
    version: '2.0',
    inputs: [
      {
        id: 'text1',
        type: 'text_input',
        userInput: 'un paysage de montagne'
      }
    ],
    tasks: [
      {
        id: 'enhance1',
        type: 'enhance_prompt',
        inputs: {
          prompt: '{{text1.text}}'
        }
      }
    ],
    outputs: [
      {
        id: 'text2',
        type: 'input_text',
        inputs: {
          text: '{{enhance1.enhanced_prompt}}'
        }
      }
    ]
  },
  inputs: {} // Empty comme le frontend envoie
};

console.log('=== Test du payload frontend ===');
console.log('Workflow:', JSON.stringify(frontendPayload.workflow, null, 2));
console.log('Inputs externes:', JSON.stringify(frontendPayload.inputs, null, 2));

const runner = new WorkflowRunner();
runner.executeWorkflow(frontendPayload.workflow, frontendPayload.inputs).then(result => {
  console.log('\n=== RÉSULTAT FINAL ===');
  console.log(JSON.stringify(result, null, 2));
}).catch(err => {
  console.error('\n=== ERREUR ===');
  console.error('Message:', err.message);
  console.error('Stack:', err.stack);
});