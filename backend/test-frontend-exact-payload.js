import WorkflowRunner from './services/WorkflowRunner.js';

// Mock pour global.logWorkflow
global.logWorkflow = (message, data) => {
  console.log(`[LOG] ${message}`, data ? JSON.stringify(data, null, 2) : '');
};

// Payload exact du frontend
const frontendWorkflow = {
  "inputs": [
    {
      "id": "text1",
      "type": "text_input",
      "label": "",
      "placeholder": "",
      "defaultValue": "",
      "multiline": false,
      "required": true,
      "userInput": "la mer"
    }
  ],
  "tasks": [
    {
      "id": "enhance1",
      "type": "enhance_prompt",
      "inputs": {
        "prompt": "{{text1.text}}",
        "targetType": "image",
        "style": "photographic",
        "imageDescription1": "",
        "imageDescription2": ""
      }
    }
  ],
  "outputs": [
    {
      "id": "text2",
      "type": "text_output",
      "inputs": {
        "text": "{{enhance1.enhanced_prompt}}",
        "title": "",
        "format": "plain"
      }
    }
  ],
  "id": "workflow_1762447339709",
  "name": "Workflow personnalisé",
  "description": "Workflow créé avec le Builder"
};

console.log('=== Test du payload EXACT frontend ===');

const runner = new WorkflowRunner();
runner.executeWorkflow(frontendWorkflow, {}).then(result => {
  console.log('\n=== RÉSULTAT FINAL ===');
  console.log(JSON.stringify(result, null, 2));
}).catch(err => {
  console.error('\n=== ERREUR ===');
  console.error('Message:', err.message);
  console.error('Stack:', err.stack);
});