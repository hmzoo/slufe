<template>
  <div class="prompt-input">
    <q-card flat bordered>
      <q-card-section>
        <div class="text-h6 text-primary">
          <q-icon name="edit_note" size="sm" class="q-mr-sm" />
          Prompt
        </div>
      </q-card-section>

      <q-separator />

      <q-card-section>
        <q-input
          v-model="localPrompt"
          type="textarea"
          outlined
          placeholder="Décrivez ce que vous souhaitez générer..."
          rows="5"
          :rules="[val => !!val || 'Le prompt est requis']"
          @update:model-value="updatePrompt"
        >
          <template v-slot:prepend>
            <q-icon name="description" />
          </template>
        </q-input>

        <!-- Bouton Smart Generate (pleine largeur) -->
        <div class="q-mt-md">
          <q-btn
            color="primary"
            label="Générer (Smart)"
            icon="auto_fix_high"
            unelevated
            size="lg"
            @click="smartGenerate"
            :disable="!localPrompt"
            :loading="smartGenerating"
            class="full-width"
          >
            <q-tooltip>
              Analyse automatiquement le prompt, optimise et exécute la tâche recommandée
            </q-tooltip>
          </q-btn>
        </div>

        <!-- Boutons Images (2 par ligne) -->
        <div class="row q-mt-md q-col-gutter-sm">
          <div class="col-6">
            <q-btn
              color="secondary"
              label="Générer l'image"
              icon="image"
              outline
              @click="generateImage"
              :disable="!localPrompt"
              :loading="generating"
              class="full-width"
            />
          </div>
          
          <div class="col-6">
            <q-btn
              color="accent"
              label="Éditer l'image"
              icon="edit"
              outline
              @click="editImages"
              :disable="!canEdit"
              :loading="editing"
              class="full-width"
            />
          </div>
        </div>

        <!-- Boutons Vidéos (2 par ligne) -->
        <div class="row q-mt-sm q-col-gutter-sm">
          <div class="col-6">
            <q-btn
              color="deep-purple"
              label="Générer la vidéo"
              icon="videocam"
              outline
              @click="generateVideo"
              :disable="!localPrompt"
              :loading="generatingVideo"
              class="full-width"
            />
          </div>
          
          <div class="col-6">
            <q-btn
              color="deep-purple-10"
              label="Vidéo depuis images"
              icon="video_library"
              outline
              @click="generateVideoFromImages"
              :disable="!canGenerateVideoFromImages"
              :loading="generatingVideoFromImages"
              class="full-width"
            />
          </div>
        </div>

        <!-- Boutons d'outils (analyse, amélioration, etc.) -->
        <div class="row q-mt-md q-gutter-sm items-center">
          <q-btn
            color="purple"
            label="Analyser (Mode intelligent)"
            icon="psychology"
            outline
            @click="analyzeWorkflow"
            :disable="!localPrompt"
            :loading="analyzing"
          />
          
          <q-btn
            color="primary"
            label="Améliorer le prompt"
            icon="auto_awesome"
            outline
            @click="improvePrompt"
            :disable="!localPrompt"
            :loading="enhancing"
          />
          
          <q-btn
            flat
            color="grey"
            label="Exemples"
            icon="lightbulb"
            @click="showExamples"
          />
          
          <q-space />
          
          <q-btn
            flat
            color="negative"
            icon="clear"
            label="Effacer"
            @click="clearPrompt"
            :disable="!localPrompt"
          />
        </div>
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useMainStore } from '../stores/useMainStore';
import { useQuasar } from 'quasar';
import { api } from 'src/boot/axios';
import ResultDisplay from './ResultDisplay.vue';
import { IMAGE_DEFAULTS, VIDEO_DEFAULTS, EDIT_DEFAULTS } from '../config/defaults.js';

const $q = useQuasar();
const store = useMainStore();

const localPrompt = ref(store.prompt);
const enhancing = ref(false);
const generating = ref(false);
const generatingVideo = ref(false);
const generatingVideoFromImages = ref(false);
const editing = ref(false);
const analyzing = ref(false);
const smartGenerating = ref(false);

// Options d'édition - Utilisation des valeurs par défaut synchronisées avec le backend
const aspectRatio = ref(IMAGE_DEFAULTS.aspectRatio);
const outputFormat = ref(EDIT_DEFAULTS.outputFormat);
const outputQuality = ref(EDIT_DEFAULTS.outputQuality);
const goFast = ref(VIDEO_DEFAULTS.goFast);

const hasImages = computed(() => store.imageCount > 0);
const imageCount = computed(() => store.imageCount);

// Mode d'édition auto-détecté selon le nombre d'images
const editMode = computed(() => {
  if (imageCount.value === 1) return 'single';
  return 'multiple'; // 2+ images = édition multiple
});

const canEdit = computed(() => {
  // Besoin d'au moins 1 image + prompt
  return hasImages.value && localPrompt.value.trim().length > 0;
});

const canGenerateVideoFromImages = computed(() => {
  // Besoin d'au moins 1 image + prompt (max 2 images)
  return hasImages.value && imageCount.value <= 2 && localPrompt.value.trim().length > 0;
});

watch(
  () => store.prompt,
  (newValue) => {
    localPrompt.value = newValue;
  }
);

function updatePrompt(value) {
  store.setPrompt(value);
}

async function improvePrompt() {
  if (!localPrompt.value.trim()) {
    $q.notify({
      type: 'warning',
      message: 'Entrez d\'abord un prompt',
      position: 'top',
    });
    return;
  }

  enhancing.value = true;
  
  try {
    const response = await api.post('/prompt/enhance', {
      prompt: localPrompt.value,
      hasImages: hasImages.value,
      imageCount: imageCount.value
    });
    
    if (response.data.success) {
      const enhanced = response.data.enhanced;
      const context = response.data.context || 'generation';
      
      // Sauvegarder le prompt amélioré dans le store
      store.setEnhancedPrompt(enhanced);
      
      // Message adapté selon le contexte
      const contextLabel = context === 'edition' 
        ? `Édition (${imageCount.value} image${imageCount.value > 1 ? 's' : ''})`
        : 'Génération';
      
      // Demander à l'utilisateur s'il veut l'utiliser
      $q.dialog({
        title: `Prompt amélioré - ${contextLabel}`,
        message: 'Voulez-vous utiliser cette version améliorée ?',
        html: true,
        prompt: {
          model: enhanced,
          type: 'textarea',
          rows: 5,
        },
        cancel: true,
        persistent: true,
      }).onOk((data) => {
        localPrompt.value = data;
        store.setPrompt(data);
        // Mettre à jour le prompt amélioré avec la version éditée si modifiée
        if (data !== enhanced) {
          store.setEnhancedPrompt(data);
        }
        $q.notify({
          type: 'positive',
          message: 'Prompt amélioré appliqué !',
          caption: response.data.mock ? 'Mode simulation (configurez REPLICATE_API_TOKEN)' : 'Généré par IA',
          position: 'top',
        });
      });
    } else {
      throw new Error(response.data.error || 'Échec de l\'amélioration');
    }
  } catch (error) {
    console.error('Erreur amélioration:', error);
    $q.notify({
      type: 'negative',
      message: 'Erreur lors de l\'amélioration du prompt',
      caption: error.response?.data?.error || error.message,
      position: 'top',
    });
  } finally {
    enhancing.value = false;
  }
}

async function generateImage() {
  if (!localPrompt.value.trim()) {
    $q.notify({
      type: 'warning',
      message: 'Entrez d\'abord un prompt',
      position: 'top',
    });
    return;
  }

  generating.value = true;
  
  try {
    const response = await api.post('/generate/text-to-image', {
      prompt: localPrompt.value
    });
    
    if (response.data.success) {
      const imageUrl = response.data.imageUrl;
      
      // Sauvegarder l'image générée dans le store au format attendu par ResultDisplay
      store.setResult({
        type: 'image',
        resultUrl: imageUrl,
        message: 'Image générée avec succès',
        prompt: localPrompt.value,
        params: response.data.params,
        mock: response.data.mock || false,
        timestamp: new Date().toISOString()
      });
      
      $q.notify({
        type: 'positive',
        message: 'Image générée avec succès !',
        caption: response.data.mock ? 'Mode simulation' : 'Générée par Qwen-Image',
        position: 'top',
        timeout: 3000,
      });
    } else {
      throw new Error(response.data.error || 'Échec de la génération');
    }
  } catch (error) {
    console.error('Erreur génération:', error);
    $q.notify({
      type: 'negative',
      message: 'Erreur lors de la génération de l\'image',
      caption: error.response?.data?.error || error.message,
      position: 'top',
      timeout: 5000,
    });
  } finally {
    generating.value = false;
  }
}

async function generateVideo() {
  if (!localPrompt.value.trim()) {
    $q.notify({
      type: 'warning',
      message: 'Entrez d\'abord un prompt',
      position: 'top',
    });
    return;
  }

  generatingVideo.value = true;
  
  try {
    const response = await api.post('/video/generate', {
      prompt: localPrompt.value,
      aspectRatio: '9:16',
      resolution: '480p',
      framesPerSecond: 16,
      interpolateOutput: true,
      goFast: true,
      disableSafetyChecker: true
    });
    
    if (response.data.success) {
      const videoUrl = response.data.videoUrl;
      
      // Sauvegarder la vidéo générée dans le store
      store.setResult({
        type: 'video',
        resultUrl: videoUrl,
        message: 'Vidéo générée avec succès',
        prompt: localPrompt.value,
        params: response.data.params,
        mock: response.data.mock || false,
        timestamp: new Date().toISOString()
      });
      
      $q.notify({
        type: 'positive',
        message: 'Vidéo générée avec succès !',
        caption: response.data.mock ? 'Mode simulation' : `Durée: ${response.data.params?.duration}s`,
        position: 'top',
        timeout: 3000,
      });
    } else {
      throw new Error(response.data.error || 'Échec de la génération');
    }
  } catch (error) {
    console.error('Erreur génération vidéo:', error);
    $q.notify({
      type: 'negative',
      message: 'Erreur lors de la génération de la vidéo',
      caption: error.response?.data?.error || error.message,
      position: 'top',
      timeout: 5000,
    });
  } finally {
    generatingVideo.value = false;
  }
}

async function generateVideoFromImages() {
  if (!canGenerateVideoFromImages.value) {
    $q.notify({
      type: 'warning',
      message: 'Ajoutez 1 ou 2 images et un prompt pour générer une vidéo',
      position: 'top',
    });
    return;
  }

  generatingVideoFromImages.value = true;

  try {
    const formData = new FormData();
    
    // Ajouter le prompt
    formData.append('prompt', localPrompt.value.trim());
    
    // Ajouter les images depuis le store (le workflow analyzer détectera automatiquement le format)
    if (store.images && store.images.length > 0) {
      // Ajouter toutes les images
      store.images.forEach(img => {
        formData.append('images', img.file);
      });
      
      console.log(`🎬 Génération vidéo depuis ${store.images.length} image(s) via workflow analyzer`);
    }

    // Utiliser le workflow analyzer qui détectera automatiquement le format optimal
    const response = await api.post('/workflow/execute', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (response.data.success) {
      const videoUrl = response.data.videoUrl;
      
      // Sauvegarder la vidéo générée dans le store
      store.setResult({
        type: 'video',
        resultUrl: videoUrl,
        message: 'Vidéo générée depuis images avec succès',
        prompt: localPrompt.value,
        params: response.data.params,
        workflow: response.data.workflow,
        mock: response.data.mock || false,
        timestamp: new Date().toISOString()
      });
      
      // Message avec le format détecté
      const aspectRatio = response.data.params?.aspectRatio || IMAGE_DEFAULTS.aspectRatio;
      const duration = response.data.params?.duration || '';
      const caption = response.data.mock 
        ? 'Mode simulation' 
        : `Format ${aspectRatio}${duration ? ` • ${duration}` : ''}`;
      
      $q.notify({
        type: 'positive',
        message: 'Vidéo générée depuis images !',
        caption: caption,
        position: 'top',
        timeout: 3000,
      });
    } else {
      throw new Error(response.data.error || 'Échec de la génération');
    }
  } catch (error) {
    console.error('Erreur génération vidéo depuis images:', error);
    $q.notify({
      type: 'negative',
      message: 'Erreur lors de la génération de la vidéo',
      caption: error.response?.data?.error || error.message,
      position: 'top',
      timeout: 5000,
    });
  } finally {
    generatingVideoFromImages.value = false;
  }
}

function showExamples() {
  const exampleCategories = {
    'Génération d\'images': [
      'Un paysage de montagne au coucher du soleil avec des nuages dorés',
      'Un portrait d\'une personne souriante en lumière naturelle',
      'Une architecture moderne avec des lignes épurées et du verre',
      'Une nature morte avec des fruits colorés sur une table en bois',
    ],
    'Édition d\'images': [
      'Remplacer l\'arrière-plan par une montagne au coucher du soleil',
      'Transformer en peinture à l\'aquarelle',
      'Changer la couleur de la voiture en rouge',
      'Améliorer l\'éclairage pour un effet golden hour',
    ],
    'Édition multiple images': [
      'La personne dans image 2 adopte la pose de image 1',
      'Fusionner l\'éclairage de image 1 avec le sujet de image 2',
      'Appliquer le style artistique de image 1 à image 2',
    ]
  };

  // Créer une liste plate avec catégories
  const allExamples = [];
  Object.entries(exampleCategories).forEach(([category, examples]) => {
    examples.forEach(ex => {
      allExamples.push({ 
        label: `${ex} [${category}]`, 
        value: ex 
      });
    });
  });

  $q.dialog({
    title: 'Exemples de prompts',
    message: 'Choisissez un exemple (compatible avec génération et édition) :',
    options: {
      type: 'radio',
      model: '',
      items: allExamples,
    },
    cancel: true,
    persistent: true,
  }).onOk((data) => {
    localPrompt.value = data;
    store.setPrompt(data);
  });
}

function clearPrompt() {
  $q.dialog({
    title: 'Confirmation',
    message: 'Voulez-vous vraiment effacer le prompt ?',
    cancel: true,
    persistent: true,
  }).onOk(() => {
    localPrompt.value = '';
    store.setPrompt('');
    $q.notify({
      type: 'info',
      message: 'Prompt effacé',
      position: 'top',
    });
  });
}

async function editImages() {
  if (!canEdit.value) {
    $q.notify({
      type: 'warning',
      message: 'Ajoutez un prompt et au moins une image pour éditer',
      position: 'top',
    });
    return;
  }

  editing.value = true;

  try {
    const formData = new FormData();
    
    // Ajouter le prompt
    formData.append('prompt', localPrompt.value.trim());
    
    // Ajouter les paramètres
    formData.append('aspectRatio', aspectRatio.value);
    formData.append('outputFormat', outputFormat.value);
    formData.append('outputQuality', outputQuality.value.toString());
    formData.append('goFast', goFast.value.toString());
    
    // Ajouter les images depuis le store
    if (store.images && store.images.length > 0) {
      // Utiliser 'image' (singulier) pour 1 seule image, 'images' (pluriel) pour plusieurs
      const fieldName = editMode.value === 'single' ? 'image' : 'images';
      
      if (editMode.value === 'single') {
        // Pour single mode (1 image), n'envoyer que cette image
        formData.append(fieldName, store.images[0].file);
      } else {
        // Pour multiple mode (2+ images), envoyer toutes les images
        store.images.forEach((image) => {
          formData.append(fieldName, image.file);
        });
      }
      
      console.log(`📤 Mode: ${editMode.value}, Images envoyées: ${store.images.length}`);
    }

    // Choisir l'endpoint selon le mode auto-détecté
    const endpoint = editMode.value === 'single' ? '/edit/single-image' : '/edit/image';
    
    console.log(`🎯 Endpoint: ${endpoint}`);

    const response = await api.post(endpoint, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (response.data.success) {
      const imageUrls = response.data.imageUrls;
      const firstImage = Array.isArray(imageUrls) ? imageUrls[0] : imageUrls;
      
      // Sauvegarder le résultat
      store.setResult({
        type: 'image',
        resultUrl: firstImage,
        message: 'Image éditée avec succès',
        prompt: localPrompt.value,
        params: response.data.params,
        mock: response.data.mock || false,
        timestamp: new Date().toISOString(),
        allImages: imageUrls,
      });

      $q.notify({
        type: 'positive',
        message: 'Image éditée avec succès !',
        caption: response.data.mock ? 'Mode simulation' : `Mode: ${editMode.value}`,
        position: 'top',
        timeout: 3000,
      });
    } else {
      throw new Error(response.data.error || 'Échec de l\'édition');
    }
  } catch (error) {
    console.error('Erreur édition:', error);
    $q.notify({
      type: 'negative',
      message: 'Erreur lors de l\'édition de l\'image',
      caption: error.response?.data?.error || error.message,
      position: 'top',
      timeout: 5000,
    });
  } finally {
    editing.value = false;
  }
}

// ==================== WORKFLOW ANALYZER ====================

/**
 * Génération intelligente automatique
 * 1. Analyse le workflow optimal
 * 2. Applique le prompt optimisé
 * 3. Exécute automatiquement la tâche recommandée
 */
async function smartGenerate() {
  if (!localPrompt.value.trim()) {
    $q.notify({
      type: 'warning',
      message: 'Entrez d\'abord un prompt',
      position: 'top',
    });
    return;
  }

  smartGenerating.value = true;
  
  try {
    console.log('🤖 Génération Smart - Étape 1: Analyse du workflow...');
    
    // Étape 1: Récupérer les descriptions d'images depuis le store
    let imageDescriptions = store.getImageDescriptions();
    
    if (store.images && store.images.length > 0) {
      console.log(`📊 Utilisation de ${imageDescriptions.length} description(s) d'image(s)`);
      
      // Attendre les images en cours d'analyse
      const unanalyzedImages = store.images.filter(img => !img.analyzed && !img.analyzing);
      if (unanalyzedImages.length > 0) {
        console.log(`⏳ Attente de l'analyse de ${unanalyzedImages.length} image(s)...`);
        await Promise.all(
          unanalyzedImages.map(img => store.analyzeImage(img))
        );
        imageDescriptions = store.getImageDescriptions();
      }
    }
    
    const payload = {
      prompt: localPrompt.value,
      imageCount: imageCount.value,
      imageDescriptions: imageDescriptions
    };
    
    // Étape 2: Analyser le workflow
    const analysisResponse = await api.post('/workflow/analyze', payload);
    
    if (!analysisResponse.data.success) {
      throw new Error(analysisResponse.data.error || 'Échec de l\'analyse');
    }
    
    const analysisData = analysisResponse.data;
    const workflowName = analysisData.workflow.name;
    const confidence = (analysisData.analysis.confidence * 100).toFixed(0);
    
    console.log(`✅ Workflow détecté: ${workflowName} (${confidence}%)`);
    
    // Sauvegarder l'analyse pour l'afficher après la génération
    store.workflowAnalysis = analysisData;
    
    // Notification de l'analyse (différente si fallback)
    if (analysisData.fallback) {
      $q.notify({
        type: 'warning',
        message: `⚠️ Analyse basique: ${workflowName}`,
        caption: analysisData.warning || 'L\'IA n\'a pas pu analyser correctement',
        position: 'top',
        timeout: 3000,
      });
    } else {
      $q.notify({
        type: 'info',
        message: `🤖 Workflow détecté: ${workflowName}`,
        caption: `Confiance: ${confidence}% • Application du prompt optimisé...`,
        position: 'top',
        timeout: 2000,
      });
    }
    
    // Étape 3: Appliquer le prompt optimisé
    const optimizedPrompt = analysisData.prompts.optimized;
    localPrompt.value = optimizedPrompt;
    store.setPrompt(optimizedPrompt);
    
    console.log(`📝 Prompt optimisé appliqué: ${optimizedPrompt.substring(0, 100)}...`);
    
    // Attendre un peu pour que l'utilisateur voie le prompt optimisé
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Étape 4: Exécuter automatiquement le workflow recommandé
    console.log(`🚀 Génération Smart - Étape 3: Exécution du workflow ${analysisData.workflow.id}...`);
    
    // Passer true pour garder l'analyse affichée après la génération
    await executeRecommendedWorkflow(analysisData, true);
    
    console.log('✅ Génération Smart terminée avec succès');
    
    // Garder store.workflowAnalysis pour afficher l'analyse après le résultat
    // Ne pas fermer: store.workflowAnalysis = null;
    
  } catch (error) {
    console.error('❌ Erreur génération Smart:', error);
    $q.notify({
      type: 'negative',
      message: 'Erreur lors de la génération intelligente',
      caption: error.response?.data?.error || error.message,
      position: 'top',
      timeout: 5000,
    });
  } finally {
    smartGenerating.value = false;
  }
}

async function analyzeWorkflow() {
  if (!localPrompt.value.trim()) {
    $q.notify({
      type: 'warning',
      message: 'Entrez d\'abord un prompt',
      position: 'top',
    });
    return;
  }

  analyzing.value = true;
  
  try {
    // Récupérer les descriptions depuis le store (déjà analysées à l'upload)
    let imageDescriptions = store.getImageDescriptions();
    
    if (store.images && store.images.length > 0) {
      console.log(`📊 Utilisation de ${imageDescriptions.length} description(s) d'image(s) déjà analysée(s)`);
      
      // Vérifier si certaines images n'ont pas encore été analysées
      const unanalyzedImages = store.images.filter(img => !img.analyzed && !img.analyzing);
      if (unanalyzedImages.length > 0) {
        console.log(`⏳ ${unanalyzedImages.length} image(s) en cours d'analyse...`);
        // Attendre que toutes les analyses soient terminées
        await Promise.all(
          unanalyzedImages.map(img => store.analyzeImage(img))
        );
        // Récupérer à nouveau les descriptions après analyse
        imageDescriptions = store.getImageDescriptions();
      }
      
      console.log(`📤 Envoi de ${imageDescriptions.length} description(s) à l'analyseur`);
      console.log('📝 Descriptions envoyées:', imageDescriptions.map(d => d.substring(0, 80) + '...'));
    }
    
    const payload = {
      prompt: localPrompt.value,
      imageCount: imageCount.value,
      imageDescriptions: imageDescriptions
    };
    
    console.log('📤 Payload envoyé à /workflow/analyze:', {
      prompt: payload.prompt,
      imageCount: payload.imageCount,
      imageDescriptionsCount: payload.imageDescriptions?.length || 0
    });
    
    // Envoyer à l'analyseur de workflow avec les descriptions
    const response = await api.post('/workflow/analyze', payload);
    
    if (response.data.success) {
      store.workflowAnalysis = response.data;
      
      // Notification différente si c'est un fallback
      if (response.data.fallback) {
        $q.notify({
          type: 'warning',
          message: `⚠️ Analyse basique: ${response.data.workflow.name}`,
          caption: response.data.warning || 'L\'IA n\'a pas pu analyser, utilisation de règles simples',
          position: 'top',
          timeout: 5000,
        });
      } else {
        $q.notify({
          type: 'positive',
          message: `Workflow recommandé: ${response.data.workflow.name}`,
          caption: `Confiance: ${(response.data.analysis.confidence * 100).toFixed(0)}%`,
          position: 'top',
        });
      }
    } else {
      throw new Error(response.data.error || 'Échec de l\'analyse');
    }
  } catch (error) {
    console.error('Erreur analyse workflow:', error);
    $q.notify({
      type: 'negative',
      message: 'Erreur lors de l\'analyse du workflow',
      caption: error.response?.data?.error || error.message,
      position: 'top',
    });
  } finally {
    analyzing.value = false;
  }
}

function useOptimizedPrompt(optimizedPrompt) {
  localPrompt.value = optimizedPrompt;
  store.setPrompt(optimizedPrompt);
  
  $q.notify({
    type: 'positive',
    message: 'Prompt optimisé appliqué !',
    caption: 'Optimisé pour le modèle Qwen',
    position: 'top',
  });
}

async function executeRecommendedWorkflow(analysisData, keepAnalysisOpen = false) {
  const workflowId = analysisData.workflow.id;
  const optimizedPrompt = analysisData.prompts.optimized;
  
  // Utiliser le prompt optimisé
  localPrompt.value = optimizedPrompt;
  store.setPrompt(optimizedPrompt);
  
  $q.notify({
    type: 'info',
    message: `Exécution: ${analysisData.workflow.name}`,
    position: 'top',
  });
  
  // Router vers la fonction appropriée selon le workflow
  try {
    switch (workflowId) {
      case 'text_to_image':
        await generateImage();
        break;
      
      case 'text_to_video':
        await generateVideo();
        break;
      
      case 'image_edit_single':
      case 'image_edit_multiple':
        await editImages();
        break;
      
      case 'image_to_video_single':
      case 'image_to_video_transition':
        await generateVideoFromImages();
        break;
      
      case 'edit_then_video':
        // Workflow multi-étapes: appeler directement l'endpoint workflow avec les prompts séparés
        await executeMultiStepWorkflow(analysisData);
        break;
      
      default:
        throw new Error(`Workflow non supporté: ${workflowId}`);
    }
    
    // Fermer l'analyse après exécution seulement si demandé
    if (!keepAnalysisOpen) {
      store.workflowAnalysis = null;
    }
    
  } catch (error) {
    console.error('Erreur exécution workflow:', error);
    $q.notify({
      type: 'negative',
      message: 'Erreur lors de l\'exécution du workflow',
      caption: error.message,
      position: 'top',
    });
  }
}

/**
 * Exécute un workflow multi-étapes (comme edit_then_video)
 * Gère automatiquement l'enchaînement des étapes
 */
async function executeMultiStepWorkflow(analysisData) {
  console.log('🎬 Exécution du workflow multi-étapes:', analysisData.workflow.name);
  
  if (!store.images || store.images.length === 0) {
    $q.notify({
      type: 'warning',
      message: 'Veuillez ajouter au moins une image',
      position: 'top',
    });
    return;
  }
  
  // Créer FormData avec l'image et les paramètres
  const formData = new FormData();
  formData.append('prompt', analysisData.prompts.original); // Prompt original complet
  formData.append('workflowId', analysisData.workflow.id);
  
  // Ajouter les images
  store.images.forEach((imageObj) => {
    formData.append('images', imageObj.file);
  });
  
  // Ajouter les paramètres
  const defaultParams = {
    aspectRatio: '16:9',
    outputFormat: 'webp',
    outputQuality: 90,
    numFrames: 81, // Entre 81 et 121 pour la vidéo
    resolution: '720p',
  };
  
  Object.entries(defaultParams).forEach(([key, value]) => {
    formData.append(key, value);
  });
  
  try {
    store.setResult(null);
    
    // Notification de démarrage avec les 2 étapes
    $q.notify({
      type: 'info',
      message: 'Workflow multi-étapes démarré',
      caption: `Étape 1: "${analysisData.prompts.step1?.substring(0, 50)}..."<br/>Étape 2: "${analysisData.prompts.step2?.substring(0, 50)}..."`,
      html: true,
      position: 'top',
      timeout: 5000,
    });
    
    // Appeler l'endpoint du workflow
    const response = await api.post('/workflow/execute', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    console.log('✅ Workflow multi-étapes terminé:', response.data);
    
    // Afficher les résultats
    store.setResult(response.data);
    
    // Notification de succès avec détails des étapes
    const result = response.data;
    if (result.type === 'multi_step' && result.steps) {
      $q.notify({
        type: 'positive',
        message: `Workflow complété: ${result.steps.length} étapes`,
        caption: `Image éditée et vidéo animée générées avec succès!`,
        position: 'top',
        timeout: 5000,
      });
    } else {
      $q.notify({
        type: 'positive',
        message: 'Génération terminée avec succès !',
        position: 'top',
      });
    }
    
  } catch (error) {
    console.error('❌ Erreur workflow multi-étapes:', error);
    
    const errorMessage = error.response?.data?.error || error.message;
    $q.notify({
      type: 'negative',
      message: 'Erreur lors du workflow multi-étapes',
      caption: errorMessage,
      position: 'top',
      timeout: 5000,
    });
  }
}

function handleRequestImages(imagesNeeded) {
  $q.notify({
    type: 'warning',
    message: `Veuillez ajouter ${imagesNeeded} image(s) pour ce workflow`,
    caption: 'Cliquez sur "Ajouter des images" ci-dessous',
    position: 'top',
    timeout: 5000,
  });
  
  // Scroll vers la section d'upload d'images si elle existe
  // TODO: implémenter le défilement automatique
}

</script>

<style scoped lang="scss">
// Styles spécifiques au composant
</style>
