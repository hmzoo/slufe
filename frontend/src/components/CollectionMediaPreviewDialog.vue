<template>
  <q-card>
    <q-card-section class="row items-center q-pb-none">
      <div class="text-h6">{{ media?.originalName || media?.filename }}</div>
      <q-space />
      <q-btn icon="close" flat round dense @click="$emit('close')" />
    </q-card-section>

    <q-card-section v-if="media" class="q-pt-none">
      <!-- Preview du média -->
      <div class="media-preview-container">
        <div v-if="media.type === 'image'" class="image-preview">
          <q-img
            :src="media.url"
            :alt="media.originalName"
            fit="contain"
            style="max-height: 70vh"
            @error="onImageError"
          >
            <template v-slot:error>
              <div class="absolute-full flex flex-center bg-negative text-white">
                <div class="text-center">
                  <q-icon name="broken_image" size="4em" />
                  <div class="q-mt-sm">Impossible de charger l'image</div>
                </div>
              </div>
            </template>
          </q-img>
        </div>

        <div v-else-if="media.type === 'video'" class="video-preview">
          <video
            :src="media.url"
            controls
            style="max-width: 100%; max-height: 70vh"
            @error="onVideoError"
          >
            Votre navigateur ne supporte pas la lecture vidéo.
          </video>
        </div>

        <div v-else-if="media.type === 'audio'" class="audio-preview text-center q-pa-xl">
          <q-icon name="audiotrack" size="8em" color="purple" class="q-mb-md" />
          <div class="text-h5 q-mb-md">{{ media.originalName || media.filename }}</div>
          <audio
            :src="media.url"
            controls
            style="width: 100%; max-width: 400px"
            @error="onAudioError"
          >
            Votre navigateur ne supporte pas la lecture audio.
          </audio>
        </div>

        <div v-else class="unknown-preview text-center q-pa-xl">
          <q-icon name="insert_drive_file" size="8em" color="grey" class="q-mb-md" />
          <div class="text-h5">{{ media.originalName || media.filename }}</div>
          <div class="text-caption text-grey-6">Type de fichier non supporté pour la prévisualisation</div>
        </div>
      </div>
    </q-card-section>

    <!-- Actions et contrôles -->
    <q-card-actions v-if="media" class="justify-between">
      <div class="row q-gutter-sm">
        <!-- Zoom pour les images -->
        <q-btn-group v-if="media.type === 'image'">
          <q-btn 
            icon="zoom_in" 
            flat 
            @click="zoomIn"
            :disable="zoom >= maxZoom"
            title="Zoom avant"
          />
          <q-btn 
            icon="zoom_out" 
            flat 
            @click="zoomOut"
            :disable="zoom <= minZoom"
            title="Zoom arrière"
          />
          <q-btn 
            icon="zoom_out_map" 
            flat 
            @click="resetZoom"
            title="Taille originale"
          />
        </q-btn-group>

        <!-- Contrôles pour vidéos -->
        <q-btn-group v-if="media.type === 'video'">
          <q-btn 
            icon="fullscreen" 
            flat 
            @click="toggleFullscreen"
            title="Plein écran"
          />
        </q-btn-group>
      </div>

      <div class="row q-gutter-sm">
        <q-btn 
          icon="download" 
          flat 
          @click="downloadMedia"
          title="Télécharger"
        />
        <q-btn 
          icon="open_in_new" 
          flat 
          @click="openInNewTab"
          title="Ouvrir dans un nouvel onglet"
        />
        <q-btn 
          icon="info" 
          flat 
          @click="showInfo"
          title="Informations détaillées"
        />
      </div>
    </q-card-actions>

    <!-- Informations compactes -->
    <q-card-section v-if="media && showDetails" class="q-pt-none">
      <q-separator class="q-mb-md" />
      
      <div class="row q-gutter-md text-caption">
        <div class="col-auto">
          <strong>Type:</strong> {{ media.type }}
        </div>
        <div class="col-auto">
          <strong>Taille:</strong> {{ formatFileSize(media.size) }}
        </div>
        <div class="col-auto" v-if="media.dimensions">
          <strong>Dimensions:</strong> {{ media.dimensions.width }}×{{ media.dimensions.height }}
        </div>
        <div class="col-auto" v-if="media.usageCount">
          <strong>Utilisé:</strong> {{ media.usageCount }}×
        </div>
      </div>

      <div class="row q-gutter-md text-caption q-mt-sm">
        <div class="col-auto">
          <strong>ID:</strong> {{ media.id }}
        </div>
        <div class="col-auto" v-if="media.uploadedAt">
          <strong>Uploadé:</strong> {{ formatDate(media.uploadedAt) }}
        </div>
        <div class="col-auto" v-if="media.lastUsed">
          <strong>Dernière utilisation:</strong> {{ formatDate(media.lastUsed) }}
        </div>
      </div>
    </q-card-section>

    <!-- Dialog d'informations détaillées -->
    <q-dialog v-model="showInfoDialog">
      <CollectionMediaInfoDialog :media="media" @close="showInfoDialog = false" />
    </q-dialog>
  </q-card>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useQuasar } from 'quasar'
import CollectionMediaInfoDialog from './CollectionMediaInfoDialog.vue'

// Props
const props = defineProps({
  media: {
    type: Object,
    required: true
  }
})

// Émissions
const emit = defineEmits(['close'])

// Quasar
const $q = useQuasar()

// État local
const zoom = ref(1)
const minZoom = 0.25
const maxZoom = 4
const showDetails = ref(true)
const showInfoDialog = ref(false)

// Computed
const zoomStyle = computed(() => {
  if (props.media?.type === 'image') {
    return {
      transform: `scale(${zoom.value})`,
      transformOrigin: 'center'
    }
  }
  return {}
})

// Méthodes de zoom
function zoomIn() {
  zoom.value = Math.min(zoom.value * 1.25, maxZoom)
}

function zoomOut() {
  zoom.value = Math.max(zoom.value / 1.25, minZoom)
}

function resetZoom() {
  zoom.value = 1
}

// Méthodes d'actions
function downloadMedia() {
  if (!props.media?.url) return
  
  const link = document.createElement('a')
  link.href = props.media.url
  link.download = props.media.originalName || props.media.filename || 'media'
  link.target = '_blank'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  $q.notify({
    type: 'positive',
    message: 'Téléchargement démarré',
    timeout: 2000
  })
}

function openInNewTab() {
  if (!props.media?.url) return
  
  window.open(props.media.url, '_blank')
}

function showInfo() {
  showInfoDialog.value = true
}

function toggleFullscreen() {
  // Pour les vidéos, tenter le plein écran
  const videoElement = document.querySelector('video')
  if (videoElement) {
    if (videoElement.requestFullscreen) {
      videoElement.requestFullscreen()
    }
  }
}

// Gestionnaires d'erreurs
function onImageError() {
  $q.notify({
    type: 'negative',
    message: 'Impossible de charger l\'image',
    timeout: 3000
  })
}

function onVideoError() {
  $q.notify({
    type: 'negative',
    message: 'Impossible de charger la vidéo',
    timeout: 3000
  })
}

function onAudioError() {
  $q.notify({
    type: 'negative',
    message: 'Impossible de charger l\'audio',
    timeout: 3000
  })
}

// Utilitaires
function formatFileSize(bytes) {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

function formatDate(dateString) {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleString('fr-FR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<style scoped>
.media-preview-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
  max-height: 70vh;
  overflow: auto;
}

.image-preview img {
  transition: transform 0.3s ease;
}

.video-preview,
.audio-preview,
.unknown-preview {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.video-preview video {
  border-radius: 8px;
}

.audio-preview audio {
  margin-top: 16px;
}

/* Responsive */
@media (max-width: 600px) {
  .media-preview-container {
    max-height: 50vh;
  }
  
  .image-preview img,
  .video-preview video {
    max-width: 100%;
    height: auto;
  }
}
</style>