#!/usr/bin/env node

// Test complet du workflow via l'API avec gestion d'erreurs

async function testWorkflowComplete() {
  try {
    console.log('🧪 Test complet du workflow redimensionnement...\n');
    
    const workflowData = {
      workflow: {
        id: "test_resize",
        name: "Test Image Resize",
        description: "Test de redimensionnement d'image",
        tasks: [{
          id: "task1",
          type: "image_resize_crop",
          inputs: {
            image: "1762276820453-f1blo6..jpg",
            h_max: 800,
            v_max: 600,
            ratio: "16:9",
            crop_center: "center"
          }
        }]
      }
    };
    
    console.log('📋 Workflow:', JSON.stringify(workflowData, null, 2));
    
    const response = await fetch('http://localhost:3000/api/workflow/run', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(workflowData)
    });
    
    const text = await response.text();
    console.log('\n🌐 Réponse brute:', text);
    
    let result;
    try {
      result = JSON.parse(text);
    } catch (e) {
      console.log('❌ Erreur parsing JSON:', e.message);
      return;
    }
    
    console.log('\n📋 Résultat parsé:');
    console.log('✅ Success:', result.success);
    console.log('📄 Error:', result.error);
    console.log('📋 Details:', result.details);
    
    if (result.task_results) {
      console.log('🎯 Task Results:', result.task_results.length);
      result.task_results.forEach((task, i) => {
        console.log(`  Task ${i+1}:`, {
          type: task.type,
          status: task.status,
          hasOutputs: !!task.outputs,
          outputKeys: task.outputs ? Object.keys(task.outputs) : []
        });
      });
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error('🔍 Stack:', error.stack);
  }
}

testWorkflowComplete();