// TEST DEBUG - À coller dans la console du navigateur (F12)
// Ce script vérifie l'état du store Pinia

console.log('🔍 DEBUG - État du Store');
console.log('========================');

// Méthode 1 : Via window.__PINIA__
if (window.__PINIA__) {
  const stores = window.__PINIA__.state.value;
  const mainStore = stores.main;
  
  if (mainStore) {
    console.log('✅ Store trouvé !');
    console.log('');
    console.log('📝 Prompt:', mainStore.prompt);
    console.log('✨ Enhanced Prompt:', mainStore.enhancedPrompt || '(vide)');
    console.log('🖼️ Image Descriptions:', mainStore.imageDescriptions?.length || 0, 'items');
    if (mainStore.imageDescriptions?.length > 0) {
      mainStore.imageDescriptions.forEach((desc, i) => {
        console.log(`   ${i + 1}.`, desc?.substring(0, 50) + '...');
      });
    }
    console.log('🎨 Result:', mainStore.result ? '✓ Existe' : '✗ Null');
    console.log('⏳ Loading:', mainStore.loading);
    console.log('');
    
    // Diagnostic
    console.log('📊 Diagnostic:');
    if (!mainStore.result) {
      console.log('❌ Pas de résultat → Le bloc d\'infos ne peut pas s\'afficher');
      console.log('💡 Solution : Cliquez sur "Générer" pour créer un résultat');
    } else {
      console.log('✅ Résultat existe → Le bloc d\'infos devrait s\'afficher');
      
      if (!mainStore.enhancedPrompt && mainStore.imageDescriptions?.length === 0) {
        console.log('⚠️ Mais aucune donnée enrichie trouvée');
        console.log('💡 Solution : Utilisez "Améliorer le prompt" et "Analyser les images"');
      } else if (!mainStore.enhancedPrompt) {
        console.log('⚠️ Prompt amélioré manquant');
        console.log('💡 Solution : Cliquez sur "Améliorer le prompt"');
      } else if (mainStore.imageDescriptions?.length === 0) {
        console.log('⚠️ Descriptions d\'images manquantes');
        console.log('💡 Solution : Uploadez des images et cliquez sur "Analyser les images"');
      } else {
        console.log('✅ Toutes les données sont présentes !');
        console.log('   Le bloc d\'infos devrait afficher toutes les sections');
      }
    }
  } else {
    console.log('❌ Store "main" non trouvé');
  }
} else {
  console.log('❌ Pinia non trouvé');
  console.log('💡 Vérifiez que l\'app est bien démarrée');
}

console.log('');
console.log('========================');
console.log('Pour tester manuellement :');
console.log('1. Uploadez des images');
console.log('2. Cliquez "Analyser les images"');
console.log('3. Écrivez un prompt');
console.log('4. Cliquez "Améliorer le prompt"');
console.log('5. Cliquez "Générer"');
console.log('6. Le bloc d\'infos apparaît !');
