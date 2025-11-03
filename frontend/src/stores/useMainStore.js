import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { api } from 'src/boot/axios';

export const useMainStore = defineStore('main', () => {
  // State
  const images = ref([]);
  const prompt = ref('');
  const enhancedPrompt = ref('');
  const imageDescriptions = ref([]);
  const result = ref(null);
  const loading = ref(false);
  const error = ref(null);
  const workflowAnalysis = ref(null);

  // Getters
  const hasImages = computed(() => images.value.length > 0);
  const imageCount = computed(() => images.value.length);

  // Actions
  async function addImage(file) {
    const id = Date.now() + Math.random();
    const imageData = {
      id,
      file,
      url: URL.createObjectURL(file),
      name: file.name,
      title: `Image ${images.value.length + 1}`,
      description: null,
      analyzed: false,
      analyzing: false,
    };
    images.value.push(imageData);
    
    // Analyser l'image automatiquement
    await analyzeImage(imageData);
    
    return imageData;
  }

  async function addImages(files) {
    const promises = files.map((file) => addImage(file));
    await Promise.all(promises);
  }

  async function analyzeImage(imageData) {
    // Trouver l'index de l'image dans le store pour la réactivité
    const index = images.value.findIndex(img => img.id === imageData.id);
    if (index === -1) return;
    
    const img = images.value[index];
    
    if (img.analyzed || img.analyzing) {
      return;
    }

    img.analyzing = true;
    console.log(`🔍 Analyse de l'image: ${img.name}...`);

    try {
      const formData = new FormData();
      formData.append('image', img.file);

      const response = await api.post('/images/analyze', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      console.log(`📥 Réponse API pour ${img.name}:`, {
        success: response.data?.success,
        hasDescription: !!response.data?.description,
        descriptionType: typeof response.data?.description
      });

      if (response.data.success && response.data.description) {
        img.description = response.data.description;
        img.analyzed = true;
        console.log(`✅ Image ${img.name} analysée avec succès`);
        if (img.description && typeof img.description === 'string' && img.description.length > 0) {
          console.log(`📝 Description: ${img.description.substring(0, 100)}...`);
        }
      } else {
        img.description = 'Image non analysée';
        img.analyzed = false;
        console.warn(`⚠️  Échec analyse image ${img.name}`, response.data);
      }
    } catch (err) {
      console.error(`❌ Erreur analyse image ${img.name}:`, err);
      img.description = 'Erreur d\'analyse';
      img.analyzed = false;
    } finally {
      img.analyzing = false;
    }
  }

  function getImageDescriptions() {
    console.log('📋 getImageDescriptions appelé');
    console.log('📊 Images dans le store:', images.value.length);
    console.log('📊 Images détails:', images.value.map(img => ({
      name: img.name,
      analyzed: img.analyzed,
      analyzing: img.analyzing,
      hasDescription: !!img.description,
      descriptionLength: img.description?.length || 0
    })));
    
    const descriptions = images.value
      .filter(img => {
        const isValid = img.analyzed && 
                       img.description && 
                       img.description !== 'Image non analysée' &&
                       img.description !== 'Erreur d\'analyse';
        return isValid;
      })
      .map(img => img.description);
    
    console.log('📤 Descriptions extraites:', descriptions.length);
    if (descriptions.length > 0 && descriptions[0] && typeof descriptions[0] === 'string') {
      console.log('📝 Première description:', descriptions[0].substring(0, 100) + '...');
    }
    
    return descriptions;
  }

  function removeImage(imageId) {
    const index = images.value.findIndex((img) => img.id === imageId);
    if (index !== -1) {
      // Libérer l'URL de l'objet
      URL.revokeObjectURL(images.value[index].url);
      images.value.splice(index, 1);
      
      // Renommer les images restantes
      images.value.forEach((img, idx) => {
        img.title = `Image ${idx + 1}`;
      });
    }
  }

  function clearImages() {
    images.value.forEach((img) => URL.revokeObjectURL(img.url));
    images.value = [];
  }

  function setPrompt(value) {
    prompt.value = value;
  }

  function setEnhancedPrompt(value) {
    enhancedPrompt.value = value;
  }

  function setImageDescriptions(descriptions) {
    imageDescriptions.value = descriptions;
  }

  function reuseResult() {
    if (result.value && result.value.type === 'image') {
      // Créer un nouvel objet image à partir du résultat
      fetch(result.value.resultUrl)
        .then(res => res.blob())
        .then(blob => {
          const file = new File([blob], 'result.jpg', { type: 'image/jpeg' });
          addImage(file);
        })
        .catch(err => {
          console.error('Erreur lors de la réutilisation de l\'image:', err);
          error.value = 'Impossible de réutiliser l\'image';
        });
    }
  }

  async function submitPrompt() {
    if (!prompt.value.trim()) {
      error.value = 'Le prompt est requis';
      return;
    }

    loading.value = true;
    error.value = null;
    result.value = null;

    try {
      // Créer FormData pour l'envoi
      const formData = new FormData();
      formData.append('prompt', prompt.value);

      // Ajouter les images
      images.value.forEach((img, index) => {
        formData.append('images', img.file);
      });

      // Envoyer la requête
      const response = await api.post('/prompt', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      result.value = response.data;
    } catch (err) {
      console.error('Erreur lors de l\'envoi:', err);
      error.value = err.response?.data?.error || 'Erreur lors de la communication avec le serveur';
    } finally {
      loading.value = false;
    }
  }

  function clearResult() {
    result.value = null;
    // Ne pas effacer enhancedPrompt et imageDescriptions
    // pour permettre une nouvelle génération avec les mêmes données enrichies
  }

  function setResult(value) {
    result.value = value;
  }

  function reset() {
    clearImages();
    prompt.value = '';
    enhancedPrompt.value = '';
    imageDescriptions.value = [];
    result.value = null;
    error.value = null;
    loading.value = false;
  }

  return {
    // State
    images,
    prompt,
    enhancedPrompt,
    imageDescriptions,
    result,
    loading,
    error,
    workflowAnalysis,
    
    // Getters
    hasImages,
    imageCount,
    
    // Actions
    addImage,
    addImages,
    analyzeImage,
    getImageDescriptions,
    removeImage,
    clearImages,
    setPrompt,
    setEnhancedPrompt,
    setImageDescriptions,
    submitPrompt,
    clearResult,
    setResult,
    reset,
    reuseResult,
  };
});
