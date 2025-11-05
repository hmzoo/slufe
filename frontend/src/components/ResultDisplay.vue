<template>
  <div class="result-display">
    <q-card flat bordered v-if="result || loading">
      <q-card-section>
        <div class="text-h6 text-primary">
          <q-icon name="image" size="sm" class="q-mr-sm" />
          Résultat
        </div>
      </q-card-section>

      <q-separator />

      <!-- Zone de chargement -->
      <q-card-section v-if="loading" class="text-center q-pa-xl">
        <q-spinner-dots color="primary" size="4rem" />
        <div class="text-subtitle1 text-grey-7 q-mt-md">
          Génération en cours...
        </div>
        <q-linear-progress indeterminate color="primary" class="q-mt-md" />
      </q-card-section>

      <!-- Résultat image -->
      <q-card-section v-else-if="result && result.type === 'image'" class="q-pa-none">
        <div class="image-container">
          <q-img
            :src="result.resultUrl"
            spinner-color="primary"
            fit="contain"
            style="max-height: 600px; cursor: pointer"
            class="result-image"
            @click="testModal"
          >
            <template v-slot:error>
              <div class="absolute-full flex flex-center bg-grey-3">
                <q-icon name="broken_image" size="4rem" color="grey-6" />
              </div>
            </template>
            
            <!-- Overlay d'indication au survol -->
            <div class="image-overlay" style="pointer-events: none;">
              <q-icon name="zoom_in" size="2rem" color="white" />
              <div class="text-white q-ml-sm">Cliquer pour agrandir</div>
            </div>
          </q-img>
          
          <!-- Boutons flottants -->
          <div class="image-actions">
            <q-btn
              round
              color="primary"
              icon="download"
              size="md"
              @click.stop="testDownload"
              class="q-mr-sm"
            >
              <q-tooltip>Télécharger l'image</q-tooltip>
            </q-btn>
            
            <q-btn
              round
              color="secondary"
              icon="zoom_in"
              size="md"
              @click.stop="testModal"
            >
              <q-tooltip>Voir en grand</q-tooltip>
            </q-btn>
          </div>
        </div>
        
        <div class="q-pa-md bg-grey-2">
          <div class="text-caption text-grey-7">
            <q-icon name="schedule" size="xs" />
            {{ formatDate(result.timestamp) }}
          </div>
          <div class="text-body2 q-mt-xs">
            {{ result.message }}
          </div>
        </div>
      </q-card-section>

      <!-- Résultat vidéo -->
      <q-card-section v-else-if="result && result.type === 'video'" class="q-pa-none">
        <div class="video-container">
          <video
            :src="result.resultUrl"
            controls
            playsinline
            preload="metadata"
            class="result-video"
          >
            Votre navigateur ne supporte pas la lecture de vidéos.
          </video>
        </div>
        
        <div class="q-pa-md bg-grey-2">
          <div class="text-caption text-grey-7">
            <q-icon name="schedule" size="xs" />
            {{ formatDate(result.timestamp) }}
          </div>
          <div class="text-body2 q-mt-xs">
            {{ result.message }}
          </div>
          <div v-if="result.params" class="text-caption text-grey-6 q-mt-xs">
            {{ result.params.aspectRatio }} • {{ result.params.resolution }} • {{ result.params.duration }}
          </div>
        </div>
      </q-card-section>

      <!-- Résultat multi-étapes (workflow) -->
      <q-card-section v-else-if="result && result.type === 'multi_step'" class="q-pa-none">
        <div class="multi-step-result">
          <!-- Bannière workflow -->
          <div class="q-pa-md bg-blue-1">
            <div class="text-subtitle1 text-primary">
              <q-icon name="account_tree" size="sm" />
              Workflow: {{ result.workflowName || 'Multi-étapes' }}
            </div>
            <div class="text-caption text-grey-7">
              {{ result.steps?.length || 0 }} étapes exécutées
            </div>
          </div>

          <!-- Étape 1: Image éditée -->
          <div v-if="result.imageUrl" class="step-result">
            <div class="q-pa-sm bg-orange-1">
              <div class="text-caption text-weight-bold">
                <q-icon name="edit" size="xs" />
                Étape 1: Image éditée
              </div>
            </div>
            <div class="image-container">
              <q-img
                :src="result.imageUrl"
                spinner-color="primary"
                fit="contain"
                style="max-height: 400px; cursor: pointer"
                class="result-image"
                @click="openImageModal(result.imageUrl, 'Image éditée')"
              >
                <template v-slot:error>
                  <div class="absolute-full flex flex-center bg-grey-3">
                    <q-icon name="broken_image" size="3rem" color="grey-6" />
                  </div>
                </template>
                
              <!-- Overlay d'indication au survol -->
              <div class="image-overlay" style="pointer-events: none;">
                <q-icon name="zoom_in" size="1.5rem" color="white" />
                <div class="text-white q-ml-sm text-caption">Cliquer pour agrandir</div>
              </div>
              </q-img>
              
              <!-- Boutons flottants -->
              <div class="image-actions">
                <q-btn
                  round
                  color="primary"
                  icon="download"
                  size="sm"
                  @click.stop="downloadImageDirectly(result.imageUrl, 'image-editee')"
                  class="q-mr-xs"
                >
                  <q-tooltip>Télécharger l'image</q-tooltip>
                </q-btn>
                
                <q-btn
                  round
                  color="secondary"
                  icon="zoom_in"
                  size="sm"
                  @click.stop="openImageModal(result.imageUrl, 'Image éditée')"
                >
                  <q-tooltip>Voir en grand</q-tooltip>
                </q-btn>
              </div>
            </div>
          </div>

          <!-- Étape 2: Vidéo animée -->
          <div v-if="result.videoUrl" class="step-result q-mt-md">
            <div class="q-pa-sm bg-purple-1">
              <div class="text-caption text-weight-bold">
                <q-icon name="videocam" size="xs" />
                Étape 2: Vidéo animée
              </div>
            </div>
            <div class="video-container">
              <video
                :src="result.videoUrl"
                controls
                playsinline
                preload="metadata"
                class="result-video"
              >
                Votre navigateur ne supporte pas la lecture de vidéos.
              </video>
            </div>
          </div>

          <!-- Informations du workflow -->
          <div class="q-pa-md bg-grey-2">
            <div class="text-caption text-grey-7">
              <q-icon name="schedule" size="xs" />
              {{ formatDate(result.timestamp) }}
            </div>
            <div class="text-body2 q-mt-xs">
              {{ result.message }}
            </div>
          </div>
        </div>
      </q-card-section>

      <!-- Actions -->
      <q-card-actions v-if="result && !loading" align="center" class="q-pa-md">
        <!-- Actions pour multi-étapes -->
        <template v-if="result.type === 'multi_step'">
          <q-btn
            v-if="result.imageUrl"
            color="orange"
            label="Télécharger l'image"
            icon="download"
            @click="downloadMultiStepResult('image')"
            unelevated
          />
          <q-btn
            v-if="result.videoUrl"
            color="purple"
            label="Télécharger la vidéo"
            icon="download"
            @click="downloadMultiStepResult('video')"
            unelevated
          />
        </template>
        
        <!-- Actions normales -->
        <template v-else>
          <q-btn
            color="primary"
            label="Télécharger"
            icon="download"
            @click="downloadResult"
            unelevated
          />
          
          <q-btn
            v-if="result.type === 'image'"
            color="secondary"
            label="Réutiliser l'image"
            icon="replay"
            @click="reuseImage"
            outline
          />
        </template>
        
        <q-btn
          flat
          color="grey"
          label="Nouvelle génération"
          icon="refresh"
          @click="clearResult"
        />
      </q-card-actions>
    </q-card>

    <!-- Message d'erreur -->
    <q-banner v-if="error" class="bg-negative text-white q-mt-md" rounded>
      <template v-slot:avatar>
        <q-icon name="error" color="white" />
      </template>
      {{ error }}
      <template v-slot:action>
        <q-btn flat color="white" label="Fermer" @click="clearError" />
      </template>
    </q-banner>
    
    <!-- Modal de visualisation d'image en grand -->
    <q-dialog v-model="showImageModal" maximized>
      <q-card class="bg-black text-white">
        <!-- Header du modal -->
        <q-card-section class="row items-center q-pa-md bg-grey-9">
          <div class="text-h6">{{ modalImageTitle }}</div>
          <q-space />
          
          <!-- Boutons d'actions -->
          <q-btn
            flat
            color="white"
            icon="download"
            label="Télécharger"
            @click="downloadModalImage"
            class="q-mr-sm"
          />
          
          <q-btn
            flat
            color="white"
            icon="close"
            label="Fermer"
            @click="closeImageModal"
          />
        </q-card-section>
        
        <!-- Image en plein écran -->
        <q-card-section class="flex flex-center q-pa-none" style="height: calc(100vh - 80px)">
          <q-img
            :src="modalImageUrl"
            fit="contain"
            style="max-width: 100%; max-height: 100%"
            spinner-color="white"
          >
            <template v-slot:error>
              <div class="absolute-full flex flex-center bg-grey-8">
                <q-icon name="broken_image" size="4rem" color="grey-4" />
                <div class="text-grey-4 q-ml-md">Erreur de chargement</div>
              </div>
            </template>
          </q-img>
        </q-card-section>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useMainStore } from 'src/stores/useMainStore';
import { useQuasar } from 'quasar';

const store = useMainStore();
const $q = useQuasar();

const result = computed(() => store.result);
const loading = computed(() => store.loading);
const error = computed(() => store.error);
const originalPrompt = computed(() => store.prompt);
const enhancedPrompt = computed(() => store.enhancedPrompt);
const imageDescriptions = computed(() => store.imageDescriptions);

// Variables pour le modal d'image
const showImageModal = ref(false);
const modalImageUrl = ref('');
const modalImageTitle = ref('');

function formatDate(timestamp) {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return date.toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function downloadResult() {
  if (!result.value) return;

  // Afficher une notification de début de téléchargement
  $q.notify({
    type: 'info',
    message: 'Téléchargement en cours...',
    position: 'top',
    timeout: 2000,
  });

  // Télécharger le fichier via fetch pour contourner les CORS
  fetch(result.value.resultUrl)
    .then(response => {
      if (!response.ok) {
        throw new Error('Erreur lors du téléchargement');
      }
      return response.blob();
    })
    .then(blob => {
      // Créer une URL locale pour le blob
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `result-${Date.now()}.${result.value.type === 'video' ? 'mp4' : 'jpg'}`;
      link.target = '_self'; // Empêcher l'ouverture d'une nouvelle fenêtre
      link.style.display = 'none'; // Masquer le lien
      
      document.body.appendChild(link);
      
      // Utiliser setTimeout pour éviter que le navigateur bloque l'action
      setTimeout(() => {
        link.click();
        
        // Nettoyer après un court délai
        setTimeout(() => {
          document.body.removeChild(link);
          URL.revokeObjectURL(blobUrl);
        }, 100);
      }, 0);
      
      $q.notify({
        type: 'positive',
        message: 'Téléchargement terminé !',
        position: 'top',
      });
    })
    .catch(error => {
      console.error('Erreur téléchargement:', error);
      $q.notify({
        type: 'negative',
        message: 'Erreur lors du téléchargement',
        caption: 'Essayez de cliquer droit > Enregistrer sous',
        position: 'top',
        timeout: 5000,
      });
    });
}

function reuseImage() {
  store.reuseResult();
  $q.notify({
    type: 'positive',
    message: 'Image ajoutée à la liste',
    position: 'top',
  });
}

function downloadMultiStepResult(type) {
  if (!result.value) return;
  
  const url = type === 'image' ? result.value.imageUrl : result.value.videoUrl;
  if (!url) return;

  $q.notify({
    type: 'info',
    message: `Téléchargement ${type === 'image' ? 'de l\'image' : 'de la vidéo'} en cours...`,
    position: 'top',
    timeout: 2000,
  });

  fetch(url)
    .then(response => {
      if (!response.ok) {
        throw new Error('Erreur lors du téléchargement');
      }
      return response.blob();
    })
    .then(blob => {
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `${type}-${Date.now()}.${type === 'video' ? 'mp4' : 'jpg'}`;
      link.target = '_self';
      link.style.display = 'none';
      
      document.body.appendChild(link);
      
      setTimeout(() => {
        link.click();
        
        setTimeout(() => {
          document.body.removeChild(link);
          URL.revokeObjectURL(blobUrl);
        }, 100);
      }, 0);
      
      $q.notify({
        type: 'positive',
        message: 'Téléchargement terminé !',
        position: 'top',
      });
    })
    .catch(error => {
      console.error('Erreur téléchargement:', error);
      $q.notify({
        type: 'negative',
        message: 'Erreur lors du téléchargement',
        position: 'top',
      });
    });
}

// Fonctions pour le modal d'image
function openImageModal(imageUrl, title = 'Image') {
  modalImageUrl.value = imageUrl;
  modalImageTitle.value = title;
  showImageModal.value = true;
}

function closeImageModal() {
  showImageModal.value = false;
  modalImageUrl.value = '';
  modalImageTitle.value = '';
}

function downloadModalImage() {
  if (!modalImageUrl.value) return;
  
  $q.notify({
    type: 'info',
    message: 'Téléchargement en cours...',
    position: 'top',
    timeout: 2000,
  });

  // Télécharger l'image depuis le modal
  fetch(modalImageUrl.value)
    .then(response => {
      if (!response.ok) {
        throw new Error('Erreur lors du téléchargement');
      }
      return response.blob();
    })
    .then(blob => {
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      
      // Générer un nom de fichier basé sur le titre et timestamp
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
      const filename = `${modalImageTitle.value.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${timestamp}.jpg`;
      link.download = filename;
      
      document.body.appendChild(link);
      
      setTimeout(() => {
        link.click();
        
        setTimeout(() => {
          document.body.removeChild(link);
          URL.revokeObjectURL(blobUrl);
        }, 100);
      }, 0);
      
      $q.notify({
        type: 'positive',
        message: 'Image téléchargée !',
        position: 'top',
      });
    })
    .catch(error => {
      console.error('Erreur téléchargement:', error);
      $q.notify({
        type: 'negative',
        message: 'Erreur lors du téléchargement',
        position: 'top',
      });
    });
}

// Fonction pour télécharger une image directement (boutons flottants)
function downloadImageDirectly(imageUrl, filename = 'image') {
  if (!imageUrl) return;
  
  $q.notify({
    type: 'info',
    message: 'Téléchargement en cours...',
    position: 'top',
    timeout: 2000,
  });

  // Télécharger l'image
  fetch(imageUrl)
    .then(response => {
      if (!response.ok) {
        throw new Error('Erreur lors du téléchargement');
      }
      return response.blob();
    })
    .then(blob => {
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      
      // Générer un nom de fichier avec timestamp
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
      const finalFilename = `${filename}-${timestamp}.jpg`;
      link.download = finalFilename;
      
      document.body.appendChild(link);
      
      setTimeout(() => {
        link.click();
        
        setTimeout(() => {
          document.body.removeChild(link);
          URL.revokeObjectURL(blobUrl);
        }, 100);
      }, 0);
      
      $q.notify({
        type: 'positive',
        message: 'Image téléchargée !',
        position: 'top',
      });
    })
    .catch(error => {
      console.error('Erreur téléchargement:', error);
      $q.notify({
        type: 'negative',
        message: 'Erreur lors du téléchargement',
        position: 'top',
      });
    });
}

function clearResult() {
  store.clearResult();
}

function clearError() {
  store.error = null;
}

// Fonctions de test
function testModal() {
  console.log('Test modal clicked!');
  alert('Modal test - Cela fonctionne !');
  if (result.value && result.value.resultUrl) {
    openImageModal(result.value.resultUrl, 'Test Image');
  }
}

function testDownload() {
  console.log('Test download clicked!');
  alert('Download test - Cela fonctionne !');
}
</script>

<style scoped lang="scss">
.result-image {
  border-radius: 4px;
}

.video-container {
  position: relative;
  width: 100%;
  background: #000;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.result-video {
  max-width: 100%;
  max-height: 80vh;
  width: auto !important;
  height: auto !important;
  object-fit: contain;
  display: block;
  margin: 0 auto;
}

.info-card {
  background: linear-gradient(to bottom, #fafafa 0%, #ffffff 100%);
}

.prompt-text {
  padding: 12px;
  background: #f5f5f5;
  border-left: 3px solid #9c27b0;
  border-radius: 4px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
  
  &.enhanced {
    background: linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%);
    border-left-color: #1976d2;
    font-weight: 500;
  }
}

.image-description {
  padding: 10px;
  background: #e3f2fd;
  border-left: 3px solid #2196f3;
  border-radius: 4px;
  line-height: 1.5;
  font-style: italic;
  color: #424242;
}

// Styles pour les overlays d'images
.result-image {
  position: relative;
  
  &:hover .image-overlay {
    opacity: 1;
    visibility: visible;
  }
}

.image-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.5);
  opacity: 0;
  visibility: hidden;
  transition: all 0.3s ease-in-out;
  backdrop-filter: blur(2px);
}

// Styles pour les boutons flottants sur les images
.image-container {
  position: relative;
  display: block;
  width: 100%;
}

.image-actions {
  position: absolute;
  top: 10px;
  right: 10px;
  display: flex;
  z-index: 100;
  gap: 8px;
}
</style>
