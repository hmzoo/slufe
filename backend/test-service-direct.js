#!/usr/bin/env node

// Test direct du service resizeCropImage avec nom de fichier

import { resizeCropImage } from './services/imageResizeCrop.js';

// Mock global.logWorkflow 
global.logWorkflow = (message, data) => {
  console.log(`📝 [LOG] ${message}`, data ? JSON.stringify(data, null, 2) : '');
};

async function testServiceDirect() {
  try {
    console.log('🧪 Test direct du service resizeCropImage...\n');
    
    const params = {
      image: "1762276820453-f1blo6..jpg", // Nom de fichier simple
      h_max: 800,
      v_max: 600,
      ratio: "16:9",
      crop_center: "center"
    };
    
    console.log('📋 Params:', JSON.stringify(params, null, 2));
    
    const result = await resizeCropImage(params);
    
    console.log('\n✅ Résultat:');
    console.log('📊 Structure:', {
      success: result.success,
      hasImageUrl: !!result.image_url,
      finalDimensions: result.final_dimensions
    });
    
    console.log('🌐 URL générée:', result.image_url);
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error('🔍 Stack:', error.stack);
  }
}

testServiceDirect();