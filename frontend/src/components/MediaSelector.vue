<template>
  <div class="media-selector">
    <!-- Input simple avec boutons galerie -->
    <q-input
      :model-value="displayValue"
      readonly
      :label="label"
      :placeholder="placeholder"
      :error="hasError"
      :error-message="errorMessage"
      filled
      class="media-input"
    >
      <template #append>
        <q-btn-group>
          <q-btn
            icon="photo_library"
            flat
            dense
            @click="showGallery = true"
            :disable="disabled"
            title="Choisir depuis la galerie"
          />
          <q-btn
            v-if="modelValue"
            icon="clear"
            flat
            dense
            @click="clearSelection"
            :disable="disabled"
            title="Supprimer la sélection"
          />
        </q-btn-group>
      </template>
    </q-input>

    <!-- Preview rapide -->
    <div v-if="selectedMedia && !hidePreview" class="media-preview-compact q-mt-sm">
      <q-card flat class="q-pa-sm">
        <div class="row items-center no-wrap">
          <div class="col-auto q-mr-sm">
            <q-img
              v-if="selectedMedia.type === 'image'"
              :src="selectedMedia.url"
              width="40px"
              height="40px"
              fit="cover"
              class="rounded-borders"
            />
            <q-avatar
              v-else
              size="40px"
              :icon="getMediaIcon(selectedMedia.type)"
              :color="getMediaColor(selectedMedia.type)"
              text-color="white"
            />
          </div>
          <div class="col">
            <div class="text-body2 text-weight-medium">
              {{ selectedMedia.originalName || selectedMedia.filename }}
            </div>
            <div class="text-caption text-grey-6">
              {{ selectedMedia.type }} • {{ mediaStore.formatFileSize(selectedMedia.size) }}
              <span v-if="selectedMedia.usageCount > 0">
                • Utilisé {{ selectedMedia.usageCount }}×
              </span>
            </div>
          </div>
          <div class="col-auto">
            <q-btn
              icon="visibility"
              size="sm"
              flat
              round
              @click="previewMedia"
              title="Aperçu"
            />
          </div>
        </div>
      </q-card>
    </div>

    <!-- Input file caché -->
    <input
      ref="fileInput"
      type="file"
      :accept="acceptString"
      :multiple="multiple"
      @change="onFileSelected"
      style="display: none"
    />

    <!-- Dialog Galerie -->
    <q-dialog v-model="showGallery" maximized>
      <q-card>
        <q-card-section class="q-pa-md">
          <SimpleMediaGallery
            v-model="gallerySelection"
            :multiple="multiple"
            :accept="acceptTypes"
            @selected="onGallerySelection"
            @upload="showUploadDialog = true"
            @close="showGallery = false"
          />
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- Dialog Upload -->
    <q-dialog v-model="showUploadDialog">
      <MediaUploadDialog
        :accept="acceptTypes"
        :multiple="true"
        @uploaded="onUploadComplete"
        @close="showUploadDialog = false"
      />
    </q-dialog>

    <!-- Dialog Preview -->
    <q-dialog v-model="showPreviewDialog" maximized>
      <MediaPreviewDialog
        :media="selectedMedia"
        @close="showPreviewDialog = false"
      />
    </q-dialog>


  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useMediaStore } from 'src/stores/useMediaStore'
import { useQuasar } from 'quasar'
import { api } from 'src/boot/axios'
import SimpleMediaGallery from './SimpleMediaGallery.vue'
import MediaUploadDialog from './MediaUploadDialog.vue'
import MediaPreviewDialog from './MediaPreviewDialog.vue'

// Props
const props = defineProps({
  modelValue: {
    type: [String, Array],
    default: null
  },
  multiple: {
    type: Boolean,
    default: false
  },
  accept: {
    type: Array,
    default: () => ['image', 'video']
  },
  label: {
    type: String,
    default: 'Média'
  },
  placeholder: {
    type: String,
    default: 'Aucun média sélectionné'
  },
  disabled: {
    type: Boolean,
    default: false
  },
  required: {
    type: Boolean,
    default: false
  },
  error: {
    type: Boolean,
    default: false
  },
  errorMessage: {
    type: String,
    default: ''
  },
  hidePreview: {
    type: Boolean,
    default: false
  }
})

// Émissions
const emit = defineEmits(['update:modelValue', 'selected', 'uploaded', 'cleared'])

// Stores
const mediaStore = useMediaStore()
const $q = useQuasar()

// État local
const showGallery = ref(false)
const showUploadDialog = ref(false)
const showPreviewDialog = ref(false)
const gallerySelection = ref(null)
const fileInput = ref(null)
const resolvedCollectionMedia = ref(null)

// Computed
const acceptTypes = computed(() => props.accept)

const acceptString = computed(() => {
  const mimeTypes = {
    image: 'image/*',
    video: 'video/*',
    audio: 'audio/*'
  }
  
  return props.accept.map(type => mimeTypes[type] || type).join(',')
})

const selectedMedia = computed(() => {
  if (!props.modelValue) return null
  
  if (props.multiple) {
    // Pour le mode multiple, on affiche le premier média ou un résumé
    const ids = Array.isArray(props.modelValue) ? props.modelValue : [props.modelValue]
    if (ids.length === 0) return null
    
    const mediaId = ids[0]
    const media = mediaStore.getMedia(mediaId)
    
    // Si pas trouvé et c'est un ID de collection, utiliser le média résolu
    if (!media && mediaId && mediaId.startsWith('collection_') && resolvedCollectionMedia.value) {
      return resolvedCollectionMedia.value
    }
    
    return media
  } else {
    // Mode single
    const media = mediaStore.getMedia(props.modelValue)
    
    // Si pas trouvé et c'est un ID de collection, utiliser le média résolu
    if (!media && props.modelValue && props.modelValue.startsWith('collection_') && resolvedCollectionMedia.value) {
      return resolvedCollectionMedia.value
    }
    
    return media
  }
})

const displayValue = computed(() => {
  if (!props.modelValue) return ''
  
  if (props.multiple) {
    const ids = Array.isArray(props.modelValue) ? props.modelValue : [props.modelValue]
    if (ids.length === 0) return ''
    if (ids.length === 1) {
      const media = selectedMedia.value
      return media ? media.originalName || media.filename : 'Média introuvable'
    }
    return `${ids.length} médias sélectionnés`
  } else {
    const media = selectedMedia.value
    return media ? media.originalName || media.filename : 'Média introuvable'
  }
})

const hasError = computed(() => {
  return props.error || (props.required && !props.modelValue)
})

// Watchers
watch(() => props.modelValue, (newValue) => {
  gallerySelection.value = newValue
}, { immediate: true })

// Watcher pour résoudre les médias de collection ou récupérer depuis l'API
watch(() => props.modelValue, async (newValue) => {
  if (!newValue) {
    resolvedCollectionMedia.value = null
    return
  }
  
  // Identifier le premier ID (pour mode multiple ou single)
  let mediaId = newValue
  if (Array.isArray(newValue)) {
    mediaId = newValue[0]
  }
  
  // Si c'est un ID de collection, le résoudre
  if (mediaId && mediaId.startsWith('collection_')) {
    try {
      const response = await api.get('/collections/current/gallery')
      if (response.data.success) {
        const indexMatch = mediaId.match(/collection_(\d+)/)
        if (indexMatch) {
          const index = parseInt(indexMatch[1])
          const img = response.data.images[index]
          
          if (img) {
            resolvedCollectionMedia.value = {
              id: mediaId,
              url: img.url,
              type: img.type || 'image',
              filename: img.description || `${img.type || 'image'}_${index}.jpg`,
              originalName: img.description || `${img.type === 'video' ? 'Vidéo' : 'Image'} ${index + 1}`,
              size: 0
            }
          }
        }
      }
    } catch (error) {
      console.error('Erreur résolution média collection:', error)
      resolvedCollectionMedia.value = null
    }
  }
  // Si c'est un UUID, vérifier s'il est dans le store, sinon le récupérer de l'API
  else if (mediaId && mediaId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
    // Vérifier si déjà dans le store
    const existingMedia = mediaStore.getMedia(mediaId)
    if (!existingMedia) {
      // Récupérer depuis l'API
      try {
        const response = await api.get(`/upload/media/${mediaId}`)
        if (response.data.success && response.data.media) {
          const media = response.data.media
          // Ajouter au store pour usage futur
          mediaStore.medias.set(mediaId, {
            id: media.id,
            url: media.url,
            type: media.type,
            filename: media.filename,
            originalName: media.originalName || media.filename,
            mimetype: media.mimetype,
            size: media.size,
            createdAt: media.createdAt,
            usageCount: 0
          })
          
          resolvedCollectionMedia.value = {
            id: media.id,
            url: media.url,
            type: media.type,
            filename: media.filename,
            originalName: media.originalName || media.filename,
            size: media.size
          }
        }
      } catch (error) {
        console.error('Erreur récupération média:', error)
        resolvedCollectionMedia.value = null
      }
    } else {
      resolvedCollectionMedia.value = null // Le média est dans le store
    }
  } else {
    resolvedCollectionMedia.value = null
  }
}, { immediate: true })

// Méthodes

function onFileSelected(event) {
  const files = Array.from(event.target.files)
  if (files.length === 0) return
  
  // Upload automatique
  uploadFiles(files)
}

async function uploadFiles(files) {
  try {
    let result
    
    if (props.multiple) {
      result = await mediaStore.uploadMultiple(files)
      const uploadedIds = result.uploaded.map(media => media.id)
      
      // Ajouter aux sélections existantes ou remplacer
      const currentIds = Array.isArray(props.modelValue) ? props.modelValue : []
      const newIds = [...currentIds, ...uploadedIds]
      
      emit('update:modelValue', newIds)
      emit('uploaded', result.uploaded)
    } else {
      result = await mediaStore.uploadSingle(files[0])
      emit('update:modelValue', result.id)
      emit('uploaded', [result])
    }
    
    $q.notify({
      type: 'positive',
      message: `Fichier${files.length > 1 ? 's' : ''} uploadé${files.length > 1 ? 's' : ''}`,
      timeout: 2000
    })
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: 'Erreur upload: ' + error.message,
      timeout: 3000
    })
  }
}

function onGallerySelection(selectedMedias) {
  showGallery.value = false
  
  if (props.multiple) {
    const ids = selectedMedias.map(media => media.id)
    emit('update:modelValue', ids)
  } else {
    const id = selectedMedias.length > 0 ? selectedMedias[0].id : null
    emit('update:modelValue', id)
  }
  
  emit('selected', selectedMedias)
}

function onUploadComplete(uploadedMedias) {
  showUploadDialog.value = false
  
  if (props.multiple) {
    const uploadedIds = uploadedMedias.map(media => media.id)
    const currentIds = Array.isArray(props.modelValue) ? props.modelValue : []
    const newIds = [...currentIds, ...uploadedIds]
    
    emit('update:modelValue', newIds)
  } else {
    const id = uploadedMedias.length > 0 ? uploadedMedias[0].id : null
    emit('update:modelValue', id)
  }
  
  emit('uploaded', uploadedMedias)
}

function clearSelection() {
  emit('update:modelValue', props.multiple ? [] : null)
  emit('cleared')
  
  $q.notify({
    type: 'info',
    message: 'Sélection supprimée',
    timeout: 1500
  })
}

function previewMedia() {
  if (selectedMedia.value) {
    showPreviewDialog.value = true
  }
}

function getMediaIcon(type) {
  switch (type) {
    case 'image': return 'image'
    case 'video': return 'videocam'
    case 'audio': return 'audiotrack'
    default: return 'insert_drive_file'
  }
}

function getMediaColor(type) {
  switch (type) {
    case 'image': return 'green'
    case 'video': return 'blue'
    case 'audio': return 'purple'
    default: return 'grey'
  }
}


</script>

<style scoped>
.media-selector {
  width: 100%;
}

.media-input {
  width: 100%;
}

.media-preview-compact {
  max-width: 100%;
}

.rounded-borders {
  border-radius: 4px;
}
</style>