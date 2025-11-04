#!/usr/bin/env node

// Test direct de la tâche de redimensionnement

import { ImageResizeCropTask } from './services/tasks/ImageResizeCropTask.js';

// Mock global.logWorkflow 
global.logWorkflow = (message, data) => {
  console.log(`📝 [LOG] ${message}`, data ? JSON.stringify(data, null, 2) : '');
};

async function testTask() {
  try {
    console.log('🧪 Test direct de ImageResizeCropTask...\n');
    
    const task = new ImageResizeCropTask();
    
    const inputs = {
      image: "1762276820453-f1blo6..jpg",
      h_max: 800,
      v_max: 600,
      ratio: "16:9",
      crop_center: "center"
    };
    
    console.log('📋 Inputs:', JSON.stringify(inputs, null, 2));
    
    const result = await task.execute(inputs);
    
    console.log('\n✅ Résultat:');
    console.log('📊 Structure:', {
      success: result.success,
      hasImage: !!result.image,
      hasImageUrl: !!result.image_url,
      finalDimensions: result.final_dimensions
    });
    
    console.log('🌐 URL:', result.image_url);
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error('🔍 Stack:', error.stack);
  }
}

testTask();