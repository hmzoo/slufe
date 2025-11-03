// ============================================
// 🧪 SCRIPT DE TEST POUR LE BLOC D'INFORMATIONS
// ============================================
// 
// Ce fichier montre comment remplir manuellement le store
// pour tester l'affichage du bloc d'informations
//
// À utiliser dans la console du navigateur (F12)
// ============================================

// 1. Accéder au store depuis la console
// Dans la console du navigateur, tapez :
window.testInfoDisplay = function() {
  // Obtenir le store Pinia
  const store = window.$nuxt?.$pinia?.state?.value?.main || 
                 window.app?.$pinia?.state?.value?.main;
  
  if (!store) {
    console.error('❌ Store non trouvé. Assurez-vous que l\'app est lancée.');
    return;
  }

  console.log('✅ Store trouvé !');

  // 2. Simuler un prompt original
  store.prompt = "Un chat qui joue du piano dans un salon moderne";
  console.log('✅ Prompt défini');

  // 3. Simuler un prompt amélioré
  store.enhancedPrompt = "A majestic Persian cat with fluffy white fur, elegantly playing a grand black piano in a luxurious modern living room with floor-to-ceiling windows, soft natural lighting, photorealistic, highly detailed, 8K resolution, cinematic composition";
  console.log('✅ Prompt amélioré défini');

  // 4. Simuler des descriptions d'images
  store.imageDescriptions = [
    "The image shows a modern grand piano in black lacquer finish, positioned near large windows with natural light streaming in. The piano has elegant curved legs and a polished surface that reflects the ambient light.",
    "A beautiful Persian cat with long white fur and bright blue eyes, sitting on a velvet cushion. The cat has a regal posture and appears well-groomed with fluffy fur around its neck."
  ];
  console.log('✅ Descriptions d\'images définies');

  // 5. Simuler un résultat de génération
  store.result = {
    type: 'image',
    resultUrl: 'https://picsum.photos/seed/catpiano/800/600',
    message: 'Image générée avec succès',
    timestamp: Date.now()
  };
  console.log('✅ Résultat défini');

  console.log('');
  console.log('🎉 DONNÉES DE TEST CHARGÉES !');
  console.log('');
  console.log('📊 État actuel du store :');
  console.log('  - Prompt:', store.prompt);
  console.log('  - Prompt amélioré:', store.enhancedPrompt?.substring(0, 50) + '...');
  console.log('  - Nombre de descriptions:', store.imageDescriptions?.length || 0);
  console.log('  - Résultat:', store.result ? '✓' : '✗');
  console.log('');
  console.log('👉 Le bloc d\'informations devrait maintenant être visible !');
};

// Auto-exécution si dans un module
if (typeof window !== 'undefined') {
  console.log('');
  console.log('🧪 Test du bloc d\'informations chargé !');
  console.log('');
  console.log('Pour tester, tapez dans la console :');
  console.log('  testInfoDisplay()');
  console.log('');
}

// ============================================
// ALTERNATIVE : Utilisation directe dans HomePage.vue
// ============================================
/*

Dans frontend/src/pages/HomePage.vue, ajoutez un bouton de test :

<template>
  <q-page class="q-pa-md">
    <!-- ... contenu existant ... -->
    
    <!-- BOUTON DE TEST (à retirer en production) -->
    <q-btn
      v-if="isDevelopment"
      color="orange"
      label="🧪 Test Bloc Info"
      @click="testInfoDisplay"
      class="q-mt-md"
      outline
    />
  </q-page>
</template>

<script setup>
import { useMainStore } from 'src/stores/useMainStore';

const store = useMainStore();
const isDevelopment = process.env.DEV;

function testInfoDisplay() {
  // Remplir les données de test
  store.setPrompt("Un chat qui joue du piano dans un salon moderne");
  
  store.setEnhancedPrompt(
    "A majestic Persian cat with fluffy white fur, elegantly playing a grand black piano in a luxurious modern living room with floor-to-ceiling windows, soft natural lighting, photorealistic, highly detailed, 8K resolution, cinematic composition"
  );
  
  store.setImageDescriptions([
    "The image shows a modern grand piano in black lacquer finish, positioned near large windows with natural light streaming in. The piano has elegant curved legs and a polished surface that reflects the ambient light.",
    "A beautiful Persian cat with long white fur and bright blue eyes, sitting on a velvet cushion. The cat has a regal posture and appears well-groomed with fluffy fur around its neck."
  ]);
  
  store.result = {
    type: 'image',
    resultUrl: 'https://picsum.photos/seed/catpiano/800/600',
    message: 'Image générée avec succès',
    timestamp: Date.now()
  };
  
  $q.notify({
    type: 'positive',
    message: 'Données de test chargées !',
    caption: 'Le bloc d\'informations est maintenant visible',
  });
}
</script>

*/

// ============================================
// MÉTHODE DIRECTE DANS LA CONSOLE
// ============================================
/*

Si vous avez accès à Vue Devtools :

1. Ouvrez Vue Devtools (F12 > Vue)
2. Trouvez le composant "MainStore" 
3. Modifiez directement les valeurs :
   - prompt: "Un chat qui joue du piano..."
   - enhancedPrompt: "A majestic Persian cat..."
   - imageDescriptions: ["Description 1", "Description 2"]
   - result: { type: 'image', resultUrl: '...', ... }

*/

// ============================================
// EXEMPLE DE DONNÉES DE TEST VARIÉES
// ============================================

const TEST_SCENARIOS = {
  // Scénario 1 : Complet (prompt + amélioration + images)
  complete: {
    prompt: "Un paysage de montagne au coucher du soleil",
    enhancedPrompt: "A breathtaking mountain landscape at golden hour sunset, with snow-capped peaks reflecting warm orange and pink light, dramatic clouds, alpine meadows in the foreground, cinematic wide-angle shot, ultra HD, professional photography",
    imageDescriptions: [
      "A stunning mountain range with jagged peaks covered in fresh snow, captured during the late afternoon with dramatic lighting and deep shadows in the valleys.",
      "A golden sunset with vibrant orange and purple hues spreading across the sky, silhouetting the mountain peaks in the distance."
    ],
    result: {
      type: 'image',
      resultUrl: 'https://picsum.photos/seed/mountain/800/600',
      message: 'Image générée avec succès',
      timestamp: Date.now()
    }
  },

  // Scénario 2 : Prompt amélioré uniquement
  promptOnly: {
    prompt: "Un robot futuriste",
    enhancedPrompt: "A sleek humanoid robot with chrome metallic finish and glowing blue LED accents, standing in a high-tech laboratory, cyberpunk aesthetic, detailed mechanical joints, 8K render, octane render, sci-fi concept art",
    imageDescriptions: [],
    result: {
      type: 'image',
      resultUrl: 'https://picsum.photos/seed/robot/800/600',
      message: 'Image générée avec succès',
      timestamp: Date.now()
    }
  },

  // Scénario 3 : Images analysées uniquement
  imagesOnly: {
    prompt: "Créer une scène basée sur ces images",
    enhancedPrompt: "",
    imageDescriptions: [
      "A cozy coffee shop interior with wooden furniture, warm lighting from pendant lamps, and plants on shelves. Several customers are working on laptops.",
      "A close-up of a latte art coffee cup with a heart pattern in the foam, placed on a rustic wooden table next to an open book.",
      "An espresso machine with chrome finish and steam wands, positioned behind a counter with various coffee bags displayed."
    ],
    result: {
      type: 'image',
      resultUrl: 'https://picsum.photos/seed/coffee/800/600',
      message: 'Image générée avec succès',
      timestamp: Date.now()
    }
  },

  // Scénario 4 : Prompt simple (sans amélioration ni images)
  simple: {
    prompt: "Un arbre dans un champ",
    enhancedPrompt: "",
    imageDescriptions: [],
    result: {
      type: 'image',
      resultUrl: 'https://picsum.photos/seed/tree/800/600',
      message: 'Image générée avec succès',
      timestamp: Date.now()
    }
  },

  // Scénario 5 : Génération vidéo
  video: {
    prompt: "Une animation de vagues océaniques",
    enhancedPrompt: "A mesmerizing animation of ocean waves rolling towards a pristine beach, turquoise water with white foam, aerial view, slow motion, 4K quality, looping video, peaceful atmosphere",
    imageDescriptions: [
      "An aerial photograph of ocean waves with beautiful turquoise and deep blue gradient colors, white foam patterns visible on the surface."
    ],
    result: {
      type: 'video',
      resultUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      message: 'Vidéo générée avec succès',
      timestamp: Date.now()
    }
  }
};

// Fonction pour charger un scénario de test
window.loadTestScenario = function(scenarioName = 'complete') {
  const scenario = TEST_SCENARIOS[scenarioName];
  
  if (!scenario) {
    console.error('❌ Scénario inconnu:', scenarioName);
    console.log('📋 Scénarios disponibles:', Object.keys(TEST_SCENARIOS).join(', '));
    return;
  }

  const store = window.$nuxt?.$pinia?.state?.value?.main || 
                 window.app?.$pinia?.state?.value?.main;
  
  if (!store) {
    console.error('❌ Store non trouvé');
    return;
  }

  // Appliquer le scénario
  store.prompt = scenario.prompt;
  store.enhancedPrompt = scenario.enhancedPrompt;
  store.imageDescriptions = scenario.imageDescriptions;
  store.result = scenario.result;

  console.log('✅ Scénario "' + scenarioName + '" chargé !');
  console.log('📊 Contenu :');
  console.log('  - Prompt amélioré:', scenario.enhancedPrompt ? '✓' : '✗');
  console.log('  - Images analysées:', scenario.imageDescriptions.length);
  console.log('  - Type de résultat:', scenario.result.type);
};

if (typeof window !== 'undefined') {
  console.log('');
  console.log('📋 Scénarios de test disponibles :');
  console.log('  loadTestScenario("complete")   - Complet avec tout');
  console.log('  loadTestScenario("promptOnly") - Prompt amélioré uniquement');
  console.log('  loadTestScenario("imagesOnly") - Images analysées uniquement');
  console.log('  loadTestScenario("simple")     - Prompt simple');
  console.log('  loadTestScenario("video")      - Génération vidéo');
  console.log('');
}
