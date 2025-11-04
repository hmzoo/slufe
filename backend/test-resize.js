#!/usr/bin/env node

import { resizeCropImage } from './services/imageResizeCrop.js';

// Mock global.logWorkflow pour le test
global.logWorkflow = (message, data) => {
  console.log(`📝 [LOG] ${message}`, data ? JSON.stringify(data, null, 2) : '');
};
import fs from 'fs';
import path from 'path';

async function testImageResize() {
  try {
    console.log('🧪 Test du redimensionnement d\'image...\n');
    
    // Prendre une image existante
    const mediaFiles = fs.readdirSync('./medias/').filter(f => f.endsWith('.jpg') || f.endsWith('.png'));
    
    if (mediaFiles.length === 0) {
      console.log('❌ Aucune image trouvée dans ./medias/');
      return;
    }
    
    const testFile = mediaFiles[0];
    console.log(`📄 Utilisation de l'image: ${testFile}`);
    
    const imagePath = path.join('./medias/', testFile);
    const imageBuffer = fs.readFileSync(imagePath);
    
    console.log(`📏 Taille du buffer: ${imageBuffer.length} bytes`);
    
    // Test du redimensionnement
    const result = await resizeCropImage({
      image: imageBuffer,
      h_max: 800,
      v_max: 600,
      ratio: '16:9',
      crop_center: true,
      format: 'jpg'
    });
    
    console.log('\n✅ Résultat du redimensionnement:');
    console.log('📊 Structure:', {
      success: result.success,
      hasImageUrl: !!result.image_url,
      hasImagePath: !!result.image_path,
      hasImageFilename: !!result.image_filename,
      dimensions: result.final_dimensions,
      operations: result.applied_operations
    });
    
    if (result.image_url) {
      console.log(`🌐 URL générée: ${result.image_url}`);
      
      // Vérifier que le fichier existe
      const fileExists = fs.existsSync(result.image_path);
      console.log(`📁 Fichier créé: ${fileExists ? '✅' : '❌'}`);
      
      if (fileExists) {
        const stats = fs.statSync(result.image_path);
        console.log(`📏 Taille du fichier: ${stats.size} bytes`);
      }
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error('🔍 Stack:', error.stack);
  }
}

testImageResize();