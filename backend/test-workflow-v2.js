import WorkflowRunner from './services/WorkflowRunner.js';

// Mock pour global.logWorkflow
global.logWorkflow = (message, data) => {
  console.log(`[LOG] ${message}`, data ? JSON.stringify(data, null, 2) : '');
};

const workflow = {
  id: 'test-workflow-v2',
  version: '2.0',
  inputs: [
    {
      id: 'text1',
      type: 'text_input',
      userInput: 'un paysage de mer'
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
};

console.log('=== Test du workflow v2 ===');
console.log('Structure du workflow:', JSON.stringify(workflow, null, 2));

const runner = new WorkflowRunner();
runner.executeWorkflow(workflow).then(result => {
  console.log('\n=== RÉSULTAT FINAL ===');
  console.log(JSON.stringify(result, null, 2));
}).catch(err => {
  console.error('\n=== ERREUR ===');
  console.error('Message:', err.message);
  console.error('Stack:', err.stack);
});