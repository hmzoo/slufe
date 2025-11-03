<template>
  <div class="image-editor">
    <q-card flat bordered>
      <q-card-section>
        <div class="text-h6 text-accent">
          <q-icon name="edit" size="sm" class="q-mr-sm" />
          Édition d'Images
        </div>
        <div class="text-caption text-grey-6">
          Modifiez vos images avec des instructions textuelles
        </div>
      </q-card-section>

      <q-separator />

      <q-card-section>
        <!-- Sélection du mode d'édition -->
        <div class="q-mb-md">
          <q-select
            v-model="editMode"
            :options="editModes"
            label="Mode d'édition"
            outlined
            dense
            emit-value
            map-options
          >
            <template v-slot:prepend>
              <q-icon name="tune" />
            </template>
          </q-select>
        </div>

        <!-- Info : utilise le prompt commun -->
        <q-banner dense class="bg-info text-white q-mb-md" rounded>
          <template v-slot:avatar>
            <q-icon name="info" color="white" />
          </template>
          Le prompt principal ci-dessus sera utilisé pour l'édition.
          <template v-if="editMode === 'transfer-pose' || editMode === 'transfer-style'">
            <br /><strong>Note :</strong> Un prompt automatique sera appliqué pour ce mode.
          </template>
        </q-banner>

        <!-- Options avancées (collapsible) -->
        <q-expansion-item
          icon="settings"
          label="Options avancées"
          dense
          class="q-mt-sm"
        >
          <q-card flat class="bg-grey-1 q-pa-md">
            <!-- Aspect Ratio -->
            <q-select
              v-model="aspectRatio"
              :options="aspectRatioOptions"
              label="Format de sortie"
              outlined
              dense
              emit-value
              map-options
              class="q-mb-sm"
            />

            <!-- Output Format -->
            <q-select
              v-model="outputFormat"
              :options="formatOptions"
              label="Format de fichier"
              outlined
              dense
              emit-value
              map-options
              class="q-mb-sm"
            />

            <!-- Go Fast -->
            <q-toggle
              v-model="goFast"
              label="Mode rapide (sacrifie un peu de qualité)"
              color="primary"
              class="q-mb-sm"
            />

            <!-- Quality (si pas PNG) -->
            <div v-if="outputFormat !== 'png'" class="q-mb-sm">
              <div class="text-caption text-grey-7 q-mb-xs">
                Qualité de sortie: {{ outputQuality }}%
              </div>
              <q-slider
                v-model="outputQuality"
                :min="50"
                :max="100"
                :step="5"
                label
                color="secondary"
              />
            </div>
          </q-card>
        </q-expansion-item>

        <!-- Boutons d'action -->
        <div class="row q-mt-md q-gutter-sm">
          <q-btn
            color="accent"
            label="Éditer l'image"
            icon="auto_fix_high"
            unelevated
            @click="editImages"
            :disable="!canEdit"
            :loading="editing"
          />

          <q-btn
            flat
            color="grey"
            label="Exemples de modes"
            icon="lightbulb"
            @click="showModeExamples"
          />
        </div>

        <!-- Message d'aide -->
        <q-banner v-if="!hasImages" dense class="bg-blue-1 text-blue-9 q-mt-md" rounded>
          <template v-slot:avatar>
            <q-icon name="info" color="blue" />
          </template>
          Ajoutez d'abord des images pour pouvoir les éditer.
          <template v-if="imageCount > 0">
            <br />Vous avez {{ imageCount }} image(s) chargée(s).
          </template>
        </q-banner>

        <!-- Info sur le mode multi-images -->
        <q-banner v-if="imageCount >= 2" dense class="bg-purple-1 text-purple-9 q-mt-md" rounded>
          <template v-slot:avatar>
            <q-icon name="tips_and_updates" color="purple" />
          </template>
          <strong>Astuce :</strong> Avec plusieurs images, référencez-les par numéro dans votre prompt.
          <br />
          Exemple : "La personne dans image 2 adopte la pose de image 1"
        </q-banner>
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useMainStore } from 'src/stores/useMainStore';
import { useQuasar } from 'quasar';
import { api } from 'src/boot/axios';

const store = useMainStore();
const $q = useQuasar();

const editMode = ref('single');
const aspectRatio = ref('match_input_image');
const outputFormat = ref('webp');
const outputQuality = ref(95);
const goFast = ref(true);
const editing = ref(false);

const editModes = [
  { label: 'Édition simple', value: 'single', icon: 'edit' },
  { label: 'Édition multiple', value: 'multiple', icon: 'collections' },
  { label: 'Transfert de pose', value: 'transfer-pose', icon: 'accessibility_new' },
  { label: 'Transfert de style', value: 'transfer-style', icon: 'palette' }
];

const aspectRatioOptions = [
  { label: 'Conserver proportions', value: 'match_input_image' },
  { label: 'Carré (1:1)', value: '1:1' },
  { label: 'Paysage (16:9)', value: '16:9' },
  { label: 'Portrait (9:16)', value: '9:16' },
  { label: 'Photo (4:3)', value: '4:3' },
  { label: 'Portrait (3:4)', value: '3:4' }
];

const formatOptions = [
  { label: 'WebP (recommandé)', value: 'webp' },
  { label: 'PNG (qualité max)', value: 'png' },
  { label: 'JPEG (compatible)', value: 'jpg' }
];

const hasImages = computed(() => store.hasImages);
const imageCount = computed(() => store.imageCount);
const promptFromStore = computed(() => store.prompt);

const canEdit = computed(() => {
  // Pour transfer-pose et transfer-style, pas besoin de prompt
  if (editMode.value === 'transfer-pose' || editMode.value === 'transfer-style') {
    return hasImages.value && imageCount.value >= 2;
  }
  // Pour les autres modes, le prompt est requis
  return hasImages.value && promptFromStore.value.trim().length > 0;
});

async function editImages() {
  if (!canEdit.value) {
    $q.notify({
      type: 'warning',
      message: hasImages.value 
        ? 'Ajoutez un prompt pour éditer vos images'
        : 'Ajoutez des images et un prompt',
      position: 'top',
    });
    return;
  }

  editing.value = true;

  try {
    // Préparer FormData
    const formData = new FormData();
    
    // Ajouter les images
    store.images.forEach((img) => {
      formData.append('images', img.file);
    });

    // Utiliser le prompt du store
    const promptToUse = promptFromStore.value.trim();
    formData.append('prompt', promptToUse);
    formData.append('aspectRatio', aspectRatio.value);
    formData.append('outputFormat', outputFormat.value);
    formData.append('outputQuality', outputQuality.value.toString());
    formData.append('goFast', goFast.value.toString());

    console.log('🎨 Édition d\'images:', {
      imagesCount: store.images.length,
      prompt: promptToUse,
      mode: editMode.value
    });

    // Choisir l'endpoint selon le mode
    let endpoint = '/edit/image';
    if (editMode.value === 'transfer-pose') {
      endpoint = '/edit/transfer-pose';
      // Renommer les champs pour l'API
      const images = store.images;
      if (images.length >= 2) {
        formData.delete('images');
        formData.append('poseSource', images[0].file);
        formData.append('targetPerson', images[1].file);
        formData.delete('prompt'); // Le prompt est automatique pour transfer-pose
      }
    } else if (editMode.value === 'transfer-style') {
      endpoint = '/edit/transfer-style';
      const images = store.images;
      if (images.length >= 2) {
        formData.delete('images');
        formData.append('styleSource', images[0].file);
        formData.append('targetImage', images[1].file);
        formData.delete('prompt'); // Le prompt est automatique pour transfer-style
      }
    } else if (editMode.value === 'single' && store.images.length === 1) {
      endpoint = '/edit/single-image';
      formData.delete('images');
      formData.append('image', store.images[0].file);
    }

    // Appeler l'API
    const response = await api.post(endpoint, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (response.data.success) {
      const imageUrls = response.data.imageUrls;
      
      // Sauvegarder le résultat
      store.setResult({
        type: 'image',
        resultUrl: imageUrls[0], // Première image
        message: 'Image éditée avec succès',
        prompt: promptToUse,
        editMode: editMode.value,
        params: response.data.params,
        mock: response.data.mock || false,
        timestamp: new Date().toISOString(),
        allImages: imageUrls // Toutes les images si plusieurs
      });

      $q.notify({
        type: 'positive',
        message: 'Image éditée avec succès !',
        caption: response.data.mock ? 'Mode simulation' : 'Éditée par Qwen Image Edit Plus',
        position: 'top',
        timeout: 3000,
      });

    } else {
      throw new Error(response.data.error || 'Échec de l\'édition');
    }

  } catch (error) {
    console.error('❌ Erreur édition:', error);
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

function showModeExamples() {
  const modeDescriptions = {
    single: {
      title: 'Édition Simple',
      description: 'Modifiez une seule image avec un prompt. Le prompt principal sera utilisé.',
      examples: [
        'Remplacer l\'arrière-plan par une montagne au coucher du soleil',
        'Transformer en peinture à l\'aquarelle',
        'Changer la couleur de la voiture en rouge',
        'Améliorer l\'éclairage pour un effet golden hour'
      ]
    },
    multiple: {
      title: 'Édition Multiple',
      description: 'Combinez plusieurs images. Référencez-les par numéro dans le prompt principal.',
      examples: [
        'La personne dans image 2 adopte la pose de image 1',
        'Fusionner l\'éclairage de image 1 avec le sujet de image 2',
        'Combiner l\'arrière-plan de image 1 avec le premier plan de image 2',
        'Appliquer le style artistique de image 1 à image 2'
      ]
    },
    'transfer-pose': {
      title: 'Transfert de Pose',
      description: 'Transfère automatiquement la pose d\'une image à une personne dans une autre. Uploadez 2 images (image 1 = pose source, image 2 = personne cible). Le prompt est automatique.',
      examples: []
    },
    'transfer-style': {
      title: 'Transfert de Style',
      description: 'Applique automatiquement le style artistique d\'une image à une autre. Uploadez 2 images (image 1 = style source, image 2 = image cible). Le prompt est automatique.',
      examples: []
    }
  };

  const currentMode = modeDescriptions[editMode.value] || modeDescriptions.single;
  
  let message = `<strong>${currentMode.title}</strong><br/><br/>${currentMode.description}`;
  
  if (currentMode.examples.length > 0) {
    message += '<br/><br/><strong>Exemples de prompts :</strong><ul>';
    currentMode.examples.forEach(ex => {
      message += `<li>${ex}</li>`;
    });
    message += '</ul><br/><em>Entrez ces prompts dans le champ principal ci-dessus.</em>';
  }

  $q.dialog({
    title: 'Mode : ' + currentMode.title,
    message: message,
    html: true,
    ok: {
      label: 'Compris',
      color: 'primary'
    }
  });
}
</script>

<style scoped lang="scss">
.image-editor {
  // Styles spécifiques
}
</style>
