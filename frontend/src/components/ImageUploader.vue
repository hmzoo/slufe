<template>
  <div class="image-uploader">
    <q-card flat bordered class="upload-area">
      <q-card-section>
        <div class="row items-center">
          <div class="col">
            <div class="text-h6 text-primary">
              <q-icon name="add_photo_alternate" size="sm" class="q-mr-sm" />
              Images ({{ imageCount }})
            </div>
          </div>
          <div class="col-auto">
            <!-- Bouton caméra dans le header -->
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

      <!-- Zone de drag & drop -->
      <q-card-section
        class="drop-zone"
        :class="{ 'drag-over': isDragging }"
        @dragover.prevent="isDragging = true"
        @dragleave.prevent="isDragging = false"
        @drop.prevent="onDrop"
      >
        <div class="text-center q-pa-md">
          <q-icon name="cloud_upload" size="4rem" color="grey-6" />
          <div class="text-subtitle1 text-grey-7 q-mt-sm">
            Glissez-déposez vos images ici
          </div>
          <div class="text-caption text-grey-6">ou</div>
          
          <q-btn
            color="primary"
            label="Parcourir"
            icon="folder_open"
            class="q-mt-md"
            @click="triggerFileInput"
          />
          
          <input
            ref="fileInput"
            type="file"
            accept="image/*"
            multiple
            style="display: none"
            @change="onFileSelect"
          />
        </div>
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
import { ref, computed } from 'vue';
import { useMainStore } from 'src/stores/useMainStore';
import { useQuasar } from 'quasar';
import { api } from 'src/boot/axios';
import CameraCapture from './CameraCapture.vue';

const store = useMainStore();
const $q = useQuasar();

const fileInput = ref(null);
const cameraInput = ref(null);
const isDragging = ref(false);
const showCamera = ref(false);

const images = computed(() => store.images);
const imageCount = computed(() => store.imageCount);

function triggerFileInput() {
  fileInput.value.click();
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

function onFileSelect(event) {
  const files = Array.from(event.target.files);
  handleFiles(files);
  event.target.value = ''; // Reset input
}

function onDrop(event) {
  isDragging.value = false;
  const files = Array.from(event.dataTransfer.files).filter((file) =>
    file.type.startsWith('image/')
  );
  handleFiles(files);
}

function handleFiles(files) {
  console.log('📥 handleFiles appelé avec:', files.length, 'fichier(s)');
  console.log('Fichiers détails:', files.map(f => ({ name: f.name, type: f.type, size: f.size })));
  
  if (files.length === 0) {
    $q.notify({
      type: 'warning',
      message: 'Veuillez sélectionner des fichiers image',
      position: 'top',
    });
    return;
  }

  const validFiles = files.filter((file) => {
    // Vérifier la taille (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      console.warn('⚠️ Fichier trop volumineux:', file.name, file.size);
      $q.notify({
        type: 'warning',
        message: `${file.name} est trop volumineux (max 10MB)`,
        position: 'top',
      });
      return false;
    }
    return true;
  });

  console.log('✅ Fichiers valides:', validFiles.length);

  if (validFiles.length > 0) {
    console.log('➕ Ajout au store...');
    // Les images seront automatiquement analysées par le store
    store.addImages(validFiles);
    $q.notify({
      type: 'positive',
      message: `${validFiles.length} image(s) ajoutée(s) - Analyse en cours...`,
      position: 'top',
      timeout: 1500,
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
