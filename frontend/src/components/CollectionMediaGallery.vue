<template>
  <div class="simple-media-gallery">
    <!-- Header sur une seule ligne -->
    <div class="gallery-header q-mb-md">
      <div class="row items-center justify-between no-wrap">
        <div class="col-auto">
          <div class="text-h6 q-my-none">
            Sélectionner un média
            <span class="text-caption text-grey-6 q-ml-sm">
              <span v-if="currentCollection">
                ({{ collectionImages.length }} dans {{ currentCollection.name }})
              </span>
              <span v-else>
                ({{ collectionImages.length }} dans collection courante)
              </span>
            </span>
          </div>
        </div>
        
        <div class="col-auto">
          <q-btn 
            dense 
            flat
            icon="cloud_upload" 
            label="Upload"
            color="primary"
            @click="handleUploadClick"
            title="Upload nouveaux fichiers"
            class="q-mr-sm"
          />
          <q-btn 
            dense 
            flat
            icon="refresh" 
            @click="refreshMedias"
            :loading="loadingCollection"
            title="Actualiser"
            class="q-mr-sm"
          />
          <q-btn 
            dense 
            flat
            icon="close" 
            @click="$emit('close')"
            title="Fermer"
          />
        </div>
      </div>
    </div>

    <!-- Grid des médias -->
    <div v-if="displayedMedias.length > 0" class="media-grid">
      <div 
        v-for="media in displayedMedias" 
        :key="media.id"
        class="media-item"
        :class="{ 'selected': isSelected(media.id) }"
        @click="toggleSelection(media)"
      >
        <!-- Preview du média -->
        <div class="media-preview">
          <!-- Image -->
          <img 
            v-if="media.type === 'image' || !media.type" 
            :src="media.url" 
            :alt="media.originalName || media.description"
            loading="lazy"
          />
          
          <!-- Vidéo -->
          <div v-else-if="media.type === 'video'" class="video-preview">
            <video 
              :src="media.url" 
              style="width: 100%; height: 100%; object-fit: cover;"
              muted
              loop
              @mouseenter="$event.target.play()"
              @mouseleave="$event.target.pause(); $event.target.currentTime = 0"
            />
            <div class="video-badge">
              <q-chip dense color="red" text-color="white" size="sm">
                <q-icon name="videocam" size="xs" class="q-mr-xs" />
                Vidéo
              </q-chip>
            </div>
          </div>
          
          <!-- Autre type de média -->
          <div v-else class="media-placeholder">
            <q-icon :name="getMediaIcon(media.type)" size="lg" />
          </div>

          <!-- Overlay avec actions -->
          <div class="media-overlay">
            <q-btn 
              v-if="media.type === 'image' || media.type === 'video' || !media.type"
              icon="zoom_in"
              round
              size="sm"
              color="white"
              text-color="black"
              @click.stop="openImageViewer(media)"
              class="q-ma-xs"
            />
            <q-btn 
              :icon="isSelected(media.id) ? 'check_circle' : 'add_circle'"
              round
              size="sm"
              :color="isSelected(media.id) ? 'positive' : 'primary'"
              @click.stop="toggleSelection(media)"
              class="q-ma-xs"
            />
          </div>

          <!-- Badge de sélection -->
          <div v-if="isSelected(media.id)" class="selection-badge">
            <q-icon name="check_circle" color="positive" />
          </div>
        </div>

        <!-- Nom du média -->
        <div class="media-name q-pa-xs text-center">
          <div class="text-caption">{{ truncateName(media.description || media.originalName || media.filename) }}</div>
          <div class="text-caption text-grey-6">
            <span v-if="media.metadata?.duration">{{ media.metadata.duration }}</span>
            <span v-else-if="media.size">{{ formatFileSize(media.size) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- État vide -->
    <div v-else class="empty-state text-center q-pa-lg">
      <q-icon name="image" size="4em" color="grey-4" />
      <div class="text-h6 q-mt-md text-grey-6">Aucun média disponible</div>
      <q-btn 
        class="q-mt-md"
        color="primary" 
        icon="cloud_upload" 
        label="Upload des médias"
        @click="$emit('upload')"
      />
    </div>

    <!-- Actions de sélection -->
    <div v-if="selectedIds.length > 0" class="selection-actions q-mt-md">
      <q-card class="q-pa-md">
        <div class="row items-center justify-between">
          <div class="col">
            <span class="text-weight-medium">
              {{ selectedIds.length }} média{{ selectedIds.length > 1 ? 's' : '' }} sélectionné{{ selectedIds.length > 1 ? 's' : '' }}
            </span>
          </div>
          <div class="col-auto">
            <q-btn-group>
              <q-btn 
                label="Sélectionner"
                color="primary"
                @click="confirmSelection"
              />
              <q-btn 
                label="Annuler"
                outline
                @click="clearSelection"
              />
            </q-btn-group>
          </div>
        </div>
      </q-card>
    </div>

    <!-- Dialog d'upload pour les collections -->
    <q-dialog v-model="showUploadDialog" persistent>
      <CollectionImageUpload
        :target-collection="currentCollection"
        @uploaded="onImagesUploaded"
        @collection-updated="loadCollectionImages"
        @close="showUploadDialog = false"
      />
    </q-dialog>

    <!-- Dialog de vue en grand avec navigation -->
    <q-dialog 
      v-model="showImageViewer" 
      maximized
      @keyup.left="previousImage"
      @keyup.right="nextImage"
      @keyup.escape="closeImageViewer"
    >
      <q-card class="bg-black text-white full-height full-width">
        <!-- Header avec titre et actions -->
        <q-card-section class="q-pa-md bg-black/80 absolute-top z-top">
          <div class="row items-center no-wrap">
            <div class="col">
              <div class="text-h6">
                <q-icon v-if="currentViewedImage?.type === 'video'" name="videocam" class="q-mr-xs" />
                {{ currentViewedImage?.description || currentViewedImage?.originalName || currentViewedImage?.filename || (currentViewedImage?.type === 'video' ? 'Vidéo sans nom' : 'Image sans nom') }}
              </div>
              <div class="text-caption text-grey-4">
                {{ currentViewedImage?.type === 'video' ? 'Vidéo' : 'Image' }} {{ currentImageIndex + 1 }} sur {{ displayedMedias.length }}
                <span v-if="currentViewedImage?.metadata?.duration">
                  • {{ currentViewedImage.metadata.duration }}
                </span>
                <span v-else-if="currentViewedImage?.size">
                  • {{ formatFileSize(currentViewedImage.size) }}
                </span>
                <span v-if="currentViewedImage?.createdAt">
                  • {{ formatDate(currentViewedImage.createdAt) }}
                </span>
                <span v-if="currentViewedImage?.metadata?.fps">
                  • {{ currentViewedImage.metadata.fps }} fps
                </span>
              </div>
            </div>
            <div class="col-auto">
              <q-btn-group>
                <q-btn 
                  icon="link"
                  label="Copier le lien"
                  color="blue-grey"
                  @click="copyMediaLink(currentViewedImage)"
                  :title="'Copier le lien de cette ' + (currentViewedImage?.type === 'video' ? 'vidéo' : 'image')"
                />
                <q-btn 
                  v-if="!isSelected(currentViewedImage?.id)"
                  icon="add" 
                  label="Sélectionner"
                  color="primary"
                  @click="toggleSelection(currentViewedImage)"
                />
                <q-btn 
                  v-else
                  icon="check"
                  label="Sélectionnée"
                  color="positive"
                  @click="toggleSelection(currentViewedImage)"
                />
                <q-btn 
                  icon="close" 
                  flat
                  @click="closeImageViewer"
                />
              </q-btn-group>
            </div>
          </div>
        </q-card-section>

        <!-- Média principal (Image ou Vidéo) -->
        <q-card-section class="full-height flex flex-center q-pa-none relative-position">
          <!-- Vidéo -->
          <video 
            v-if="currentViewedImage && currentViewedImage.type === 'video'"
            :src="currentViewedImage.url"
            class="full-width full-height"
            style="object-fit: contain; max-height: 100vh; max-width: 100vw;"
            controls
            autoplay
            loop
          />
          
          <!-- Image -->
          <img 
            v-else-if="currentViewedImage"
            :src="currentViewedImage.url"
            :alt="currentViewedImage.description || currentViewedImage.originalName"
            class="full-width full-height"
            style="object-fit: contain; max-height: 100vh; max-width: 100vw;"
            @click="closeImageViewer"
          />
        </q-card-section>

        <!-- Boutons de navigation flottants - centrés verticalement -->
        <div 
          v-if="displayedMedias.length > 1" 
          class="absolute-left q-ml-lg navigation-button-left"
        >
          <q-btn 
            icon="chevron_left"
            round
            size="xl"
            color="white"
            text-color="black"
            :disable="currentImageIndex === 0"
            @click="previousImage"
            class="shadow-5"
            style="opacity: 0.9;"
          />
        </div>

        <div 
          v-if="displayedMedias.length > 1"
          class="absolute-right q-mr-lg navigation-button-right"
        >
          <q-btn 
            icon="chevron_right"
            round
            size="xl"
            color="white"
            text-color="black"
            :disable="currentImageIndex === displayedMedias.length - 1"
            @click="nextImage"
            class="shadow-5"
            style="opacity: 0.9;"
          />
        </div>

        <!-- Footer avec miniatures -->
        <q-card-section 
          v-if="displayedMedias.length > 1"
          class="q-pa-md bg-black/80 absolute-bottom z-top"
        >
          <div class="row justify-center q-gutter-xs">
            <div 
              v-for="(media, index) in displayedMedias"
              :key="media.id"
              class="thumbnail-item"
              :class="{ 'active': index === currentImageIndex }"
              @click="goToImage(index)"
            >
              <!-- Miniature vidéo -->
              <div v-if="media.type === 'video'" class="thumbnail-image" style="position: relative;">
                <video 
                  :src="media.url"
                  style="width: 100%; height: 100%; object-fit: cover;"
                  muted
                />
                <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);">
                  <q-icon name="play_circle_outline" size="sm" color="white" />
                </div>
              </div>
              
              <!-- Miniature image -->
              <img 
                v-else
                :src="media.url"
                :alt="media.description || media.originalName"
                class="thumbnail-image"
              />
            </div>
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useCollectionStore } from 'src/stores/useCollectionStore'
import { useQuasar } from 'quasar'
import { api } from 'src/boot/axios'
import CollectionImageUpload from './CollectionImageUpload.vue'

// Props
const props = defineProps({
  multiple: {
    type: Boolean,
    default: false
  },
  accept: {
    type: Array,
    default: () => ['image', 'video', 'audio']
  },
  modelValue: {
    type: [String, Array],
    default: null
  },
  // Note: useCollections prop supprimée - on utilise toujours les collections maintenant
})

// Émissions
const emit = defineEmits(['update:modelValue', 'selected', 'upload', 'close'])

// Stores
const collectionStore = useCollectionStore()
const $q = useQuasar()

// Collections
const collectionImages = ref([])
const currentCollection = ref(null)
const loadingCollection = ref(false)

// État local
const selectedIds = ref([])
const showUploadDialog = ref(false)

// Vue agrandie
const showImageViewer = ref(false)
const currentImageIndex = ref(0)
const currentViewedImage = ref(null)

// Computed
const displayedMedias = computed(() => {
  // Toujours utiliser les images de la collection courante
  const allMedias = collectionImages.value
  
  // Filtrer par types acceptés
  return allMedias.filter(media => props.accept.includes(media.type))
})

// Méthodes
function isSelected(id) {
  return selectedIds.value.includes(id)
}

function toggleSelection(media) {
  const index = selectedIds.value.indexOf(media.id)
  
  if (props.multiple) {
    if (index === -1) {
      selectedIds.value.push(media.id)
    } else {
      selectedIds.value.splice(index, 1)
    }
  } else {
    selectedIds.value = index === -1 ? [media.id] : []
  }
  
  updateModelValue()
}

function clearSelection() {
  selectedIds.value = []
  updateModelValue()
}

function confirmSelection() {
  // Récupérer les objets médias sélectionnés depuis les collections
  const selectedMediaObjects = selectedIds.value.map(id => {
    // Toujours chercher dans les images de collection
    const media = collectionImages.value.find(img => img.id === id)
    return media ? { ...media } : null // Cloner pour éviter la réactivité
  }).filter(Boolean)
  
  console.log('📤 Sélection confirmée:', selectedIds.value, selectedMediaObjects)
  emit('selected', selectedMediaObjects)
  
  $q.notify({
    type: 'positive',
    message: `${selectedIds.value.length} média(s) sélectionné(s)`,
    timeout: 2000
  })
}

function updateModelValue() {
  const value = props.multiple ? [...selectedIds.value] : selectedIds.value[0] || null
  emit('update:modelValue', value)
}

async function loadCollectionImages() {
  // Toujours charger les images de collection
  
  try {
    loadingCollection.value = true
    const response = await api.get('/api/collections/current/gallery')
    
    if (response.data.success) {
      // Convertir le format des images de collection vers le format attendu par le composant
      collectionImages.value = response.data.images.map((img, index) => {
        // Extraire l'UUID depuis l'URL si disponible
        let imageId = img.mediaId
        
        if (!imageId && img.url) {
          // Extraire l'UUID depuis l'URL: /medias/uuid.extension
          const urlMatch = img.url.match(/\/medias\/([^\/]+)$/)
          if (urlMatch) {
            const filename = urlMatch[1]
            // Enlever l'extension pour avoir l'UUID
            imageId = filename.replace(/\.[^.]+$/, '')
          }
        }
        
        // Fallback sur collection_index si pas d'UUID trouvé
        if (!imageId) {
          imageId = `collection_${index}`
        }
        
        return {
          id: imageId,
          url: img.url,
          type: img.type || 'image',  // Utiliser le vrai type (image/video)
          originalName: img.description || `${img.type === 'video' ? 'Vidéo' : 'Image'} ${index + 1}`,
          filename: imageId.includes('.') ? imageId : `${imageId}.${img.type === 'video' ? 'mp4' : 'jpg'}`,
          size: 0,
          createdAt: img.addedAt,
          fromCollection: true
        }
      })
      
      currentCollection.value = response.data.collection
      console.log(`📚 ${collectionImages.value.length} images chargées depuis la collection courante pour la galerie`)
    }
  } catch (error) {
    console.error('Erreur chargement collection pour galerie:', error)
    $q.notify({
      type: 'negative',
      message: 'Erreur lors du chargement de la collection'
    })
  } finally {
    loadingCollection.value = false
  }
}

async function refreshMedias() {
  try {
    await loadCollectionImages()
    $q.notify({
      type: 'positive',
      message: 'Collection actualisée',
      timeout: 1500
    })
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: 'Erreur lors de l\'actualisation: ' + error.message,
      timeout: 3000
    })
  }
}

// Méthodes d'upload
function handleUploadClick() {
  // Toujours ouvrir le dialog d'upload pour les collections
  showUploadDialog.value = true
}

function onImagesUploaded(uploadedImages) {
  console.log('Images uploadées dans galerie:', uploadedImages)
  
  // Recharger les images de la collection
  loadCollectionImages()
  
  $q.notify({
    type: 'positive',
    message: `${uploadedImages.length} image(s) ajoutée(s)`,
    timeout: 3000
  })
}

// Utilitaires
function getMediaIcon(type) {
  switch (type) {
    case 'image': return 'image'
    case 'video': return 'videocam'
    case 'audio': return 'audiotrack'
    default: return 'insert_drive_file'
  }
}

function truncateName(name, maxLength = 15) {
  if (!name || name.length <= maxLength) return name
  return name.substring(0, maxLength - 3) + '...'
}

function formatFileSize(bytes) {
  return collectionStore.formatFileSize(bytes)
}

function formatDate(date) {
  if (!date) return ''
  return new Date(date).toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Fonctions de la vue agrandie
function openImageViewer(media) {
  const index = displayedMedias.value.findIndex(m => m.id === media.id)
  currentImageIndex.value = index
  currentViewedImage.value = media
  showImageViewer.value = true
}

function closeImageViewer() {
  showImageViewer.value = false
  currentViewedImage.value = null
}

function previousImage() {
  if (currentImageIndex.value > 0) {
    currentImageIndex.value--
    currentViewedImage.value = displayedMedias.value[currentImageIndex.value]
  }
}

function nextImage() {
  if (currentImageIndex.value < displayedMedias.value.length - 1) {
    currentImageIndex.value++
    currentViewedImage.value = displayedMedias.value[currentImageIndex.value]
  }
}

function goToImage(index) {
  currentImageIndex.value = index
  currentViewedImage.value = displayedMedias.value[index]
}

// Copier le lien du média
function copyMediaLink(media) {
  if (!media || !media.url) {
    $q.notify({
      type: 'warning',
      message: 'Aucun lien à copier',
      timeout: 2000
    })
    return
  }
  
  // Construire l'URL complète si c'est un chemin relatif
  let fullUrl = media.url
  if (media.url.startsWith('/')) {
    // URL relative - ajouter l'origine du site
    fullUrl = window.location.origin + media.url
  }
  
  // Copier dans le presse-papiers
  navigator.clipboard.writeText(fullUrl)
    .then(() => {
      $q.notify({
        type: 'positive',
        message: 'Lien copié dans le presse-papiers !',
        caption: fullUrl,
        timeout: 3000,
        icon: 'link'
      })
    })
    .catch((err) => {
      console.error('Erreur copie lien:', err)
      $q.notify({
        type: 'negative',
        message: 'Impossible de copier le lien',
        timeout: 2000
      })
    })
}

// Watchers - Initialiser la sélection
function initializeSelection() {
  if (props.modelValue) {
    selectedIds.value = Array.isArray(props.modelValue) ? [...props.modelValue] : [props.modelValue]
  }
}

// Lifecycle
onMounted(async () => {
  // Toujours charger depuis les collections
  await loadCollectionImages()
  
  // Initialiser la sélection
  initializeSelection()
})
</script>

<style scoped>
.simple-media-gallery {
  max-width: 100%;
}

.media-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 12px;
}

.media-item {
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 2px solid transparent;
  background: white;
}

.media-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.media-item.selected {
  border-color: var(--q-primary);
}

.media-preview {
  position: relative;
  aspect-ratio: 1;
  background: #f5f5f5;
  overflow: hidden;
}

.media-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.media-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f5f5f5, #eeeeee);
  color: #999;
}

.video-preview {
  position: relative;
  width: 100%;
  height: 100%;
  background: #000;
}

.video-badge {
  position: absolute;
  top: 8px;
  left: 8px;
  z-index: 1;
}

.selection-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  background: white;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.media-name {
  border-top: 1px solid #e0e0e0;
}

.empty-state {
  min-height: 200px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

/* Vue agrandie */
.media-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.media-item:hover .media-overlay {
  opacity: 1;
}

.thumbnail-item {
  width: 60px;
  height: 40px;
  border-radius: 4px;
  overflow: hidden;
  cursor: pointer;
  border: 2px solid transparent;
  transition: border-color 0.2s ease;
}

.thumbnail-item.active {
  border-color: #1976d2;
}

.thumbnail-item:hover {
  border-color: #90caf9;
}

.thumbnail-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Boutons de navigation centrés verticalement */
.navigation-button-left,
.navigation-button-right {
  top: 50%;
  transform: translateY(-50%);
  z-index: 10;
}

.navigation-button-left:hover .q-btn,
.navigation-button-right:hover .q-btn {
  opacity: 1 !important;
  transform: scale(1.1);
  transition: all 0.2s ease;
}
</style>