<template>
  <div class="media-gallery">
    <!-- Header avec stats et actions -->
    <div class="gallery-header q-mb-md">
      <div class="row items-center justify-between">
        <div class="col">
          <h6 class="q-my-none">
            {{ useCollections ? 'Collection Images' : 'Galerie Médias' }}
          </h6>
          <div class="text-caption text-grey-6">
            <span v-if="useCollections && currentCollection">
              {{ collectionImages.length }} images • Collection: {{ currentCollection.name }}
            </span>
            <span v-else-if="useCollections">
              {{ collectionImages.length }} images • Collection courante
            </span>
            <span v-else>
              {{ mediaStore.totalCount }} médias • {{ mediaStore.formatFileSize(mediaStore.totalSize) }}
            </span>
          </div>
        </div>
        <div class="col-auto">
          <q-btn-group>
            <q-btn 
              dense 
              icon="refresh" 
              @click="refreshMedias"
              :loading="useCollections ? loadingCollection : mediaStore.loading"
              title="Actualiser"
            />
            <q-btn 
              dense 
              icon="search" 
              @click="showSearchDialog = true"
              title="Rechercher"
            />
            <q-btn 
              dense 
              icon="cloud_upload" 
              @click="showUploadDialog = true"
              title="Upload"
              color="primary"
            />
          </q-btn-group>
        </div>
      </div>
    </div>

    <!-- Filtres rapides -->
    <div class="filter-tabs q-mb-md">
      <q-tabs
        v-model="activeFilter"
        dense
        class="text-grey-6"
        active-color="primary"
        indicator-color="primary"
        align="justify"
        narrow-indicator
      >
        <q-tab name="all" label="Tous" :badge="mediaStore.totalCount" />
        <q-tab name="images" label="Images" :badge="mediaStore.images.length" />
        <q-tab name="videos" label="Vidéos" :badge="mediaStore.videos.length" />
        <q-tab name="recent" label="Récents" />
        <q-tab name="used" label="Utilisés" />
      </q-tabs>
    </div>

    <!-- Grid des médias -->
    <div v-if="filteredMedias.length > 0" class="media-grid">
      <div 
        v-for="media in filteredMedias" 
        :key="media.id"
        class="media-item"
        :class="{ 
          'selected': selectedMedias.includes(media.id),
          'single-select': !multiple && selectedMedias.includes(media.id)
        }"
        @click="toggleSelection(media)"
      >
        <!-- Preview du média -->
        <div class="media-preview">
          <img 
            v-if="media.type === 'image'" 
            :src="media.url" 
            :alt="media.originalName"
            loading="lazy"
          />
          <video 
            v-else-if="media.type === 'video'" 
            :src="media.url"
            muted
            preload="metadata"
          />
          <div v-else class="media-placeholder">
            <q-icon :name="getMediaIcon(media.type)" size="lg" />
          </div>

          <!-- Overlay d'informations -->
          <div class="media-overlay">
            <div class="media-info">
              <div class="media-name text-caption">
                {{ truncateName(media.originalName || media.filename) }}
              </div>
              <div class="media-size text-caption text-grey-4">
                {{ mediaStore.formatFileSize(media.size) }}
              </div>
            </div>
            
            <!-- Badge de sélection -->
            <div v-if="selectedMedias.includes(media.id)" class="selection-badge">
              <q-icon name="check_circle" color="primary" />
            </div>
            
            <!-- Badge d'usage -->
            <div v-if="media.usageCount > 0" class="usage-badge">
              {{ media.usageCount }}×
            </div>
          </div>

          <!-- Actions rapides -->
          <div class="media-actions">
            <q-btn 
              dense 
              round 
              size="sm" 
              icon="visibility" 
              @click.stop="previewMedia(media)"
              title="Aperçu"
            />
            <q-btn 
              dense 
              round 
              size="sm" 
              icon="info" 
              @click.stop="showMediaInfo(media)"
              title="Informations"
            />
            <q-btn 
              dense 
              round 
              size="sm" 
              icon="delete" 
              color="negative"
              @click.stop="deleteMedia(media)"
              title="Supprimer"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- État vide -->
    <div v-else class="empty-state text-center q-pa-lg">
      <q-icon name="image" size="4em" color="grey-4" />
      <div class="text-h6 q-mt-md text-grey-6">
        {{ getEmptyMessage() }}
      </div>
      <q-btn 
        class="q-mt-md"
        color="primary" 
        icon="cloud_upload" 
        label="Upload des médias"
        @click="showUploadDialog = true"
      />
    </div>

    <!-- Actions de sélection -->
    <div v-if="selectedMedias.length > 0" class="selection-actions q-mt-md">
      <q-card class="q-pa-md">
        <div class="row items-center justify-between">
          <div class="col">
            <span class="text-weight-medium">
              {{ selectedMedias.length }} média{{ selectedMedias.length > 1 ? 's' : '' }} sélectionné{{ selectedMedias.length > 1 ? 's' : '' }}
            </span>
          </div>
          <div class="col-auto">
            <q-btn-group>
              <q-btn 
                label="Sélectionner"
                color="primary"
                @click="confirmSelection"
                :disable="!canConfirm"
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

    <!-- Dialog Upload -->
    <q-dialog v-model="showUploadDialog" persistent>
      <MediaUploadDialog 
        @uploaded="onMediaUploaded"
        @close="showUploadDialog = false"
      />
    </q-dialog>

    <!-- Dialog Recherche -->
    <q-dialog v-model="showSearchDialog">
      <MediaSearchDialog 
        @search="onSearch"
        @close="showSearchDialog = false"
      />
    </q-dialog>

    <!-- Dialog Aperçu -->
    <q-dialog v-model="showPreviewDialog" maximized>
      <MediaPreviewDialog 
        :media="previewedMedia"
        @close="showPreviewDialog = false"
      />
    </q-dialog>

    <!-- Dialog Informations -->
    <q-dialog v-model="showInfoDialog">
      <MediaInfoDialog 
        :media="selectedMediaForInfo"
        @close="showInfoDialog = false"
      />
    </q-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useMediaStore } from 'src/stores/useMediaStore'
import { useQuasar } from 'quasar'
import { api } from 'src/boot/axios'

// Composants (à créer)
import MediaUploadDialog from './MediaUploadDialog.vue'
import MediaSearchDialog from './MediaSearchDialog.vue'  
import MediaPreviewDialog from './MediaPreviewDialog.vue'
import MediaInfoDialog from './MediaInfoDialog.vue'

// Props
const props = defineProps({
  // Mode de sélection
  multiple: {
    type: Boolean,
    default: false
  },
  // Types de médias acceptés
  accept: {
    type: Array,
    default: () => ['image', 'video', 'audio']
  },
  // Sélection initiale
  modelValue: {
    type: [String, Array],
    default: null
  },
  // Taille maximale des médias à afficher
  maxItems: {
    type: Number,
    default: 50
  },
  // Utiliser les collections au lieu du media store
  useCollections: {
    type: Boolean,
    default: false
  }
})

// Émissions
const emit = defineEmits(['update:modelValue', 'selected', 'uploaded'])

// Stores et utilitaires
const mediaStore = useMediaStore()
const $q = useQuasar()

// État local
const activeFilter = ref('all')
const selectedMedias = ref([])
const searchQuery = ref('')
const showUploadDialog = ref(false)
const showSearchDialog = ref(false)
const showPreviewDialog = ref(false)
const showInfoDialog = ref(false)
const previewedMedia = ref(null)
const selectedMediaForInfo = ref(null)

// Collections
const collectionImages = ref([])
const currentCollection = ref(null)
const loadingCollection = ref(false)

// Computed - Médias filtrés
const filteredMedias = computed(() => {
  let medias = []
  
  // Utiliser les collections si activé, sinon utiliser mediaStore
  if (props.useCollections) {
    medias = collectionImages.value
  } else {
    switch (activeFilter.value) {
      case 'images':
        medias = mediaStore.images
        break
      case 'videos':
        medias = mediaStore.videos
        break
      case 'recent':
        medias = mediaStore.getRecent(20)
        break
      case 'used':
        medias = mediaStore.getMostUsed(20)
        break
      default:
        medias = mediaStore.allMedias
    }
  }
  
  // Filtrer par types acceptés
  medias = medias.filter(media => props.accept.includes(media.type))
  
  // Appliquer la recherche
  if (searchQuery.value) {
    medias = medias.filter(media => 
      media.originalName?.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      media.filename?.toLowerCase().includes(searchQuery.value.toLowerCase())
    )
  }
  
  // Limiter le nombre
  return medias.slice(0, props.maxItems)
})

// Computed - Validation
const canConfirm = computed(() => {
  return selectedMedias.value.length > 0
})

// Watchers
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    selectedMedias.value = Array.isArray(newValue) ? [...newValue] : [newValue]
  } else {
    selectedMedias.value = []
  }
}, { immediate: true })

// Méthodes - Sélection
function toggleSelection(media) {
  const index = selectedMedias.value.indexOf(media.id)
  
  if (props.multiple) {
    if (index === -1) {
      selectedMedias.value.push(media.id)
    } else {
      selectedMedias.value.splice(index, 1)
    }
  } else {
    selectedMedias.value = index === -1 ? [media.id] : []
  }
  
  updateModelValue()
}

function clearSelection() {
  selectedMedias.value = []
  updateModelValue()
}

function confirmSelection() {
  const selectedMediaObjects = selectedMedias.value.map(id => mediaStore.useMedia(id))
  emit('selected', selectedMediaObjects)
  
  // Notification
  $q.notify({
    type: 'positive',
    message: `${selectedMedias.value.length} média(s) sélectionné(s)`,
    timeout: 2000
  })
}

function updateModelValue() {
  const value = props.multiple ? selectedMedias.value : selectedMedias.value[0] || null
  emit('update:modelValue', value)
}

// Méthodes - Actions
async function refreshMedias() {
  try {
    if (props.useCollections) {
      await loadCollectionImages()
      $q.notify({
        type: 'positive',
        message: 'Collection actualisée',
        timeout: 1500
      })
    } else {
      await mediaStore.loadAllMedias()
      $q.notify({
        type: 'positive',
        message: 'Médias actualisés',
        timeout: 1500
      })
    }
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: 'Erreur lors de l\'actualisation: ' + error.message,
      timeout: 3000
    })
  }
}

async function loadCollectionImages() {
  if (!props.useCollections) return
  
  try {
    loadingCollection.value = true
    const response = await api.get('/collections/current/gallery')
    
    if (response.data.success) {
      // Convertir le format des images de collection vers le format attendu par le composant
      collectionImages.value = response.data.images.map((img, index) => ({
        id: `collection_${index}`,
        url: img.url,
        type: 'image', // On assume que ce sont des images
        originalName: img.description || `Image ${index + 1}`,
        filename: `collection_image_${index}.jpg`,
        size: 0, // Taille inconnue
        createdAt: img.addedAt,
        fromCollection: true
      }))
      
      currentCollection.value = response.data.collection
      console.log(`📚 ${collectionImages.value.length} images chargées depuis la collection courante`)
    }
  } catch (error) {
    console.error('Erreur chargement collection:', error)
    $q.notify({
      type: 'negative',
      message: 'Erreur lors du chargement de la collection'
    })
  } finally {
    loadingCollection.value = false
  }
}

async function deleteMedia(media) {
  try {
    await $q.dialog({
      title: 'Supprimer le média',
      message: `Voulez-vous vraiment supprimer "${media.originalName}" ?`,
      cancel: true,
      persistent: true
    })
    
    await mediaStore.deleteMedia(media.id)
    
    // Retirer de la sélection si nécessaire
    const index = selectedMedias.value.indexOf(media.id)
    if (index !== -1) {
      selectedMedias.value.splice(index, 1)
      updateModelValue()
    }
    
    $q.notify({
      type: 'positive',
      message: 'Média supprimé',
      timeout: 2000
    })
  } catch (error) {
    if (error) {
      $q.notify({
        type: 'negative',
        message: 'Erreur lors de la suppression: ' + error.message,
        timeout: 3000
      })
    }
  }
}

function previewMedia(media) {
  previewedMedia.value = media
  showPreviewDialog.value = true
}

function showMediaInfo(media) {
  selectedMediaForInfo.value = media
  showInfoDialog.value = true
}

// Méthodes - Upload
function onMediaUploaded(uploadedMedias) {
  emit('uploaded', uploadedMedias)
  
  $q.notify({
    type: 'positive',
    message: `${uploadedMedias.length} média(s) uploadé(s)`,
    timeout: 2000
  })
}

// Méthodes - Recherche
function onSearch(query) {
  searchQuery.value = query
}

// Méthodes - Utilitaires
function getMediaIcon(type) {
  switch (type) {
    case 'image': return 'image'
    case 'video': return 'videocam'
    case 'audio': return 'audiotrack'
    default: return 'insert_drive_file'
  }
}

function truncateName(name, maxLength = 20) {
  if (!name || name.length <= maxLength) return name
  return name.substring(0, maxLength - 3) + '...'
}

function getEmptyMessage() {
  switch (activeFilter.value) {
    case 'images': return 'Aucune image disponible'
    case 'videos': return 'Aucune vidéo disponible'
    case 'recent': return 'Aucun média récent'
    case 'used': return 'Aucun média utilisé'
    default: return 'Aucun média disponible'
  }
}

// Lifecycle
onMounted(async () => {
  if (props.useCollections) {
    await loadCollectionImages()
  } else if (mediaStore.totalCount === 0) {
    await refreshMedias()
  }
})
</script>

<style scoped>
.media-gallery {
  max-width: 100%;
}

.media-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 16px;
}

.media-item {
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 2px solid transparent;
}

.media-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.media-item.selected {
  border-color: var(--q-primary);
}

.media-item.single-select {
  border-color: var(--q-primary);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.media-preview {
  position: relative;
  aspect-ratio: 1;
  background: #f5f5f5;
  overflow: hidden;
}

.media-preview img,
.media-preview video {
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

.media-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(transparent, rgba(0,0,0,0.8));
  padding: 12px 8px 8px;
  transform: translateY(100%);
  transition: transform 0.2s ease;
}

.media-item:hover .media-overlay {
  transform: translateY(0);
}

.media-info {
  color: white;
}

.media-name {
  font-weight: 500;
  line-height: 1.2;
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

.usage-badge {
  position: absolute;
  top: 8px;
  left: 8px;
  background: rgba(0,0,0,0.7);
  color: white;
  padding: 2px 6px;
  border-radius: 12px;
  font-size: 10px;
  font-weight: 500;
}

.media-actions {
  position: absolute;
  top: 8px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.media-item:hover .media-actions {
  opacity: 1;
}

.media-actions .q-btn {
  background: rgba(255,255,255,0.9);
  backdrop-filter: blur(4px);
}

.empty-state {
  min-height: 200px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.selection-actions {
  position: sticky;
  bottom: 0;
  z-index: 10;
}

.filter-tabs {
  border-bottom: 1px solid #e0e0e0;
}
</style>