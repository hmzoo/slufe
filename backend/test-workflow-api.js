#!/usr/bin/env node

// Test de l'API workflow avec redimensionnement d'image

async function testWorkflowAPI() {
  try {
    console.log('🧪 Test du workflow de redimensionnement via API...\n');
    
    // Préparer les données du workflow  
    const workflowData = {
      workflow: {
        name: "Test Image Resize",
        description: "Test de redimensionnement d'image",
        tasks: [{
          id: "task1",
          type: "image_resize_crop",
          inputs: {
            image: "1762276820453-f1blo6..jpg", // Image existante dans medias/
            h_max: 800,
            v_max: 600,
            ratio: "16:9",
            crop_center: true
          }
        }]
      }
    };
    
    console.log('📋 Workflow à exécuter:', JSON.stringify(workflowData, null, 2));
    
    // Envoyer la requête
    const response = await fetch('http://localhost:3000/api/workflow/execute', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(workflowData)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    
    console.log('\n✅ Résultat de l\'API:');
    console.log('📊 Structure:', {
      success: result.success,
      hasTaskResults: !!result.task_results,
      taskCount: result.task_results?.length || 0
    });
    
    if (result.task_results && result.task_results.length > 0) {
      const taskResult = result.task_results[0];
      console.log('\n🎯 Résultat de la tâche:');
      console.log('📋 Type:', taskResult.type);
      console.log('✅ Succès:', taskResult.success);
      
      if (taskResult.outputs) {
        console.log('📊 Outputs disponibles:', Object.keys(taskResult.outputs));
        console.log('🖼️ Image URL:', taskResult.outputs.image);
        console.log('🔗 Image URL (alt):', taskResult.outputs.image_url);
        
        // Test d'accès à l'image
        if (taskResult.outputs.image) {
          try {
            const imageResponse = await fetch(taskResult.outputs.image);
            console.log(`🌐 Accès image: ${imageResponse.ok ? '✅' : '❌'} (${imageResponse.status})`);
          } catch (e) {
            console.log(`🌐 Erreur accès image: ${e.message}`);
          }
        }
      }
    }
    
    if (!result.success && result.error) {
      console.log('❌ Erreur:', result.error);
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

testWorkflowAPI();