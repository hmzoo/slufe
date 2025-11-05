<template>
  <div class="image-uploader">
    <q-card flat bordered class="upload-area">
      <q-card-section>
        <div class="row items-center">
          <div class="col">
            <div class="text-h6 text-primary">
              <q-icon name="photo_library" size="sm" class="q-mr-sm" />
              Images ({{ imageCount }})
            </div>
            <div class="text-caption text-grey-6">
              Sélectionnez des images depuis la galerie ou prenez une photo
            </div>
          </div>
          <div class="col-auto">
            <q-btn
              color="secondary"
              label="Caméra"
              icon="camera_alt"
              @click="openCamera"
              unelevated
            />
          </div>
        </div>
      </q-card-section>

      <q-separator />

      <!-- Sélection de médias avec galerie -->
      <q-card-section>
        <MediaSelector
          v-model="selectedMediaIds"
          label="Sélectionner des images"
          accept="image/*"
          multiple
          @update:model-value="onMediaSelection"
        />
      </q-card-section>

      <!-- Liste des images -->
      <q-card-section v-if="images.length > 0" class="q-pt-none">
        <q-separator class="q-mb-md" />
        
        <div class="row q-col-gutter-md">
          <div
            v-for="image in images"
            :key="image.id"
            class="col-6 col-sm-4 col-md-3"
          >
            <q-card flat bordered class="image-card">
              <q-img
                :src="image.url"
                :ratio="1"
                spinner-color="primary"
                class="rounded-borders"
              >
                <!-- Badge d'analyse -->
                <div v-if="image.analyzing" class="absolute-top-left q-pa-xs">
                  <q-badge color="info" floating>
                    <q-spinner-dots size="xs" />
                    Analyse...
                  </q-badge>
                </div>
                <div v-else-if="image.analyzed" class="absolute-top-left q-pa-xs">
                  <q-badge color="positive" floating>
                    <q-icon name="check_circle" size="xs" />
                  </q-badge>
                </div>
                <div v-else class="absolute-top-left q-pa-xs">
                  <q-badge color="warning" floating>
                    <q-icon name="pending" size="xs" />
                  </q-badge>
                </div>
                
                <div class="absolute-top-right q-pa-xs">
                  <q-btn
                    round
                    dense
                    color="negative"
                    icon="close"
                    size="sm"
                    @click="removeImage(image.id)"
                  />
                </div>
                <div class="absolute-bottom text-subtitle2 text-center bg-transparent">
                  {{ image.title }}
                </div>
              </q-img>
              
              <!-- Tooltip avec description si analysée -->
              <q-tooltip v-if="image.analyzed && image.description" max-width="300px">
                {{ image.description }}
              </q-tooltip>
            </q-card>
          </div>
        </div>
        
        <div class="text-center q-mt-md">
          <q-btn
            flat
            color="negative"
            label="Tout supprimer"
            icon="delete"
            size="sm"
            @click="clearAllImages"
          />
        </div>
      </q-card-section>
    </q-card>

    <!-- Composant Caméra -->
    <CameraCapture 
      v-model="showCamera" 
      @photo-captured="handleCameraPhoto"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useMainStore } from 'src/stores/useMainStore';
import { useMediaStore } from 'src/stores/useMediaStore';
import { useQuasar } from 'quasar';
import { api } from 'src/boot/axios';
import CameraCapture from './CameraCapture.vue';
import MediaSelector from './MediaSelector.vue';

const store = useMainStore();
const mediaStore = useMediaStore();
const $q = useQuasar();

// Variables pour MediaSelector
const selectedMediaIds = ref([]);
const showCamera = ref(false);

// Images depuis le store principal et médias sélectionnés
const images = computed(() => store.images);
const imageCount = computed(() => store.imageCount);
const selectedMedias = computed(() => 
  selectedMediaIds.value
    .map(id => mediaStore.getMedia(id))
    .filter(Boolean)
);

// Fonction de gestion de la sélection de médias
async function onMediaSelection(mediaIds) {
  console.log('📂 Médias sélectionnés:', mediaIds);
  
  if (!mediaIds || mediaIds.length === 0) {
    return;
  }
  
  try {
    // Pour chaque média sélectionné, le convertir en image du store principal
    for (const mediaId of mediaIds) {
      const media = mediaStore.getMedia(mediaId);
      if (!media) continue;
      
      // Créer un objet File-like à partir de l'URL du média
      try {
        const response = await fetch(media.url);
        const blob = await response.blob();
        const file = new File([blob], media.filename, { type: media.type });
        
        // Ajouter au store principal
        await store.addImage(file);
        
      } catch (error) {
        console.error('Erreur lors de la conversion du média:', error);
        // Fallback: ajouter directement l'info sans fichier
        store.images.push({
          id: `media-${media.id}`,
          name: media.filename,
          url: media.url,
          file: null,
          analyzed: true,
          analyzing: false,
          description: media.description || `Image depuis galerie: ${media.filename}`
        });
      }
    }
    
    $q.notify({
      type: 'positive',
      message: `${mediaIds.length} image(s) ajoutée(s) depuis la galerie`,
      position: 'top'
    });
    
    // Réinitialiser la sélection
    selectedMediaIds.value = [];
    
  } catch (error) {
    console.error('Erreur lors de l\'ajout des médias:', error);
    $q.notify({
      type: 'negative',
      message: 'Erreur lors de l\'ajout des images',
      position: 'top'
    });
  }
}

function openCamera() {
  showCamera.value = true;
}

function handleCameraPhoto(file) {
  console.log('📸 Photo reçue de la caméra:', {
    name: file.name,
    type: file.type,
    size: file.size,
    isFile: file instanceof File
  });
  
  if (!file || !(file instanceof File)) {
    console.error('❌ Fichier invalide reçu');
    $q.notify({
      type: 'negative',
      message: 'Erreur: fichier invalide',
      position: 'top'
    });
    return;
  }
  
  handleFiles([file]);
}

// Fonction simplifiée pour la caméra uniquement

async function handleFiles(files) {
  console.log('📥 Ajout de fichiers (caméra):', files.length);
  
  if (files.length === 0) return;

  const validFiles = files.filter((file) => {
    if (file.size > 10 * 1024 * 1024) {
      $q.notify({
        type: 'warning',
        message: `${file.name} est trop volumineux (max 10MB)`,
        position: 'top'
      });
      return false;
    }
    return true;
  });

  if (validFiles.length > 0) {
    await store.addImages(validFiles);
    $q.notify({
      type: 'positive',
      message: `${validFiles.length} image(s) ajoutée(s) depuis la caméra`,
      position: 'top'
    });
  }
}

function removeImage(imageId) {
  store.removeImage(imageId);
}

function clearAllImages() {
  $q.dialog({
    title: 'Confirmation',
    message: 'Voulez-vous vraiment supprimer toutes les images ?',
    cancel: true,
    persistent: true,
  }).onOk(() => {
    store.clearImages();
    $q.notify({
      type: 'info',
      message: 'Images supprimées',
      position: 'top',
    });
  });
}
</script>

<style scoped lang="scss">
.upload-area {
  transition: all 0.3s ease;
}

.drop-zone {
  min-height: 200px;
  transition: background-color 0.3s ease;
  
  &.drag-over {
    background-color: rgba(33, 150, 243, 0.1);
    border: 2px dashed #2196f3;
  }
}

.image-card {
  position: relative;
  overflow: hidden;
  transition: transform 0.2s ease;
  
  &:hover {
    transform: scale(1.02);
  }
}
</style>
