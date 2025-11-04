<template>
  <div class="simple-media-gallery">
    <!-- Header -->
    <div class="gallery-header q-mb-md">
      <div class="row items-center justify-between">
        <div class="col">
          <h6 class="q-my-none">Sélectionner un média</h6>
          <div class="text-caption text-grey-6">
            {{ mediaStore.totalCount }} médias disponibles
          </div>
        </div>
        <div class="col-auto">
          <q-btn 
            dense 
            icon="refresh" 
            @click="refreshMedias"
            :loading="mediaStore.loading"
            title="Actualiser"
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
          <img 
            v-if="media.type === 'image'" 
            :src="media.url" 
            :alt="media.originalName"
            loading="lazy"
          />
          <div v-else class="media-placeholder">
            <q-icon :name="getMediaIcon(media.type)" size="lg" />
          </div>

          <!-- Badge de sélection -->
          <div v-if="isSelected(media.id)" class="selection-badge">
            <q-icon name="check_circle" color="primary" />
          </div>
        </div>

        <!-- Nom du média -->
        <div class="media-name q-pa-xs text-center">
          <div class="text-caption">{{ truncateName(media.originalName || media.filename) }}</div>
          <div class="text-caption text-grey-6">{{ formatFileSize(media.size) }}</div>
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
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useMediaStore } from 'src/stores/useMediaStore'
import { useQuasar } from 'quasar'

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
  }
})

// Émissions
const emit = defineEmits(['update:modelValue', 'selected', 'upload'])

// Stores
const mediaStore = useMediaStore()
const $q = useQuasar()

// État local
const selectedIds = ref([])

// Computed
const displayedMedias = computed(() => {
  // Utilisation d'un array statique pour éviter la réactivité en boucle
  const allMedias = Array.from(mediaStore.medias.values())
  
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
  // Récupérer les objets médias sélectionnés (sans les marquer comme utilisés)
  const selectedMediaObjects = selectedIds.value.map(id => {
    const media = mediaStore.medias.get(id)
    return media ? { ...media } : null // Cloner pour éviter la réactivité
  }).filter(Boolean)
  
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

async function refreshMedias() {
  try {
    await mediaStore.loadAllMedias()
    $q.notify({
      type: 'positive',
      message: 'Médias actualisés',
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
  return mediaStore.formatFileSize(bytes)
}

// Watchers - Initialiser la sélection
function initializeSelection() {
  if (props.modelValue) {
    selectedIds.value = Array.isArray(props.modelValue) ? [...props.modelValue] : [props.modelValue]
  }
}

// Lifecycle
onMounted(async () => {
  // Charger les médias si nécessaire
  if (mediaStore.totalCount === 0) {
    await refreshMedias()
  }
  
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
</style>