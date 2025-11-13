<template>
  <q-card style="min-width: 500px">
    <q-card-section>
      <div class="text-h6">Upload de médias</div>
    </q-card-section>

    <q-card-section>
      <!-- Zone de drop -->
      <div 
        class="upload-drop-zone"
        :class="{ 'drag-over': dragOver }"
        @drop.prevent="onDrop"
        @dragover.prevent="dragOver = true"
        @dragleave.prevent="dragOver = false"
        @click="triggerFileInput"
      >
        <div class="upload-content text-center">
          <q-icon name="cloud_upload" size="4em" color="grey-5" />
          <div class="text-h6 q-mt-md text-grey-6">
            Glissez vos fichiers ici
          </div>
          <div class="text-body2 text-grey-5 q-mb-md">
            ou cliquez pour choisir
          </div>
          <q-btn 
            color="primary" 
            label="Choisir des fichiers"
            icon="attach_file"
            @click.stop="triggerFileInput"
          />
        </div>
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

      <!-- Preview des fichiers sélectionnés -->
      <div v-if="selectedFiles.length > 0" class="q-mt-md">
        <div class="text-subtitle2 q-mb-sm">
          Fichiers sélectionnés ({{ selectedFiles.length }})
        </div>
        
        <div class="selected-files">
          <div 
            v-for="(fileInfo, index) in selectedFiles" 
            :key="index"
            class="file-preview-item"
          >
            <div class="row items-center no-wrap">
              <div class="col-auto q-mr-sm">
                <q-avatar size="40px">
                  <q-img
                    v-if="fileInfo.previewUrl && fileInfo.type === 'image'"
                    :src="fileInfo.previewUrl"
                    fit="cover"
                  />
                  <q-icon
                    v-else
                    :name="getFileIcon(fileInfo.file.type)"
                    :color="getFileColor(fileInfo.file.type)"
                  />
                </q-avatar>
              </div>
              
              <div class="col">
                <div class="text-body2">{{ fileInfo.file.name }}</div>
                <div class="text-caption text-grey-6">
                  {{ formatFileSize(fileInfo.file.size) }}
                  <span v-if="fileInfo.validation && !fileInfo.validation.valid" class="text-negative">
                    - {{ fileInfo.validation.errors[0] }}
                  </span>
                  <span v-else-if="fileInfo.validation" class="text-positive">
                    - Valide
                  </span>
                </div>
              </div>
              
              <div class="col-auto">
                <q-btn
                  icon="close"
                  size="sm"
                  flat
                  round
                  @click="removeFile(index)"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Progress d'upload -->
      <div v-if="uploading" class="q-mt-md">
        <div class="text-subtitle2 q-mb-sm">Upload en cours...</div>
        <q-linear-progress 
          :value="uploadProgress / 100" 
          color="primary" 
          class="q-mb-sm"
        />
        <div class="text-caption text-center">
          {{ uploadProgress }}% - {{ uploadStatus }}
        </div>
      </div>
    </q-card-section>

    <q-card-actions align="right">
      <q-btn 
        label="Annuler" 
        flat 
        @click="$emit('close')"
        :disable="uploading"
      />
      <q-btn 
        label="Upload" 
        color="primary"
        @click="startUpload"
        :loading="uploading"
        :disable="!canUpload"
      />
    </q-card-actions>
  </q-card>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useCollectionStore } from 'src/stores/useCollectionStore'
import { mediaService } from 'src/services/mediaService'
import { useQuasar } from 'quasar'

// Props
const props = defineProps({
  accept: {
    type: Array,
    default: () => ['image', 'video']
  },
  multiple: {
    type: Boolean,
    default: true
  },
  maxFiles: {
    type: Number,
    default: 10
  },
  maxSize: {
    type: Number,
    default: 50 * 1024 * 1024 // 50MB
  }
})

// Émissions
const emit = defineEmits(['uploaded', 'close'])

// Stores
const collectionStore = useCollectionStore()
const $q = useQuasar()

// État local
const dragOver = ref(false)
const selectedFiles = ref([])
const uploading = ref(false)
const uploadProgress = ref(0)
const uploadStatus = ref('')
const fileInput = ref(null)

// Computed
const acceptString = computed(() => {
  const mimeTypes = {
    image: 'image/*',
    video: 'video/*', 
    audio: 'audio/*'
  }
  
  return props.accept.map(type => mimeTypes[type] || type).join(',')
})

const canUpload = computed(() => {
  return selectedFiles.value.length > 0 && 
         selectedFiles.value.every(fileInfo => fileInfo.validation?.valid) &&
         !uploading.value
})

// Méthodes
function triggerFileInput() {
  fileInput.value?.click()
}

function onFileSelected(event) {
  const files = Array.from(event.target.files)
  addFiles(files)
}

function onDrop(event) {
  dragOver.value = false
  const files = Array.from(event.dataTransfer.files)
  addFiles(files)
}

function addFiles(files) {
  // Limiter le nombre de fichiers
  const remainingSlots = props.maxFiles - selectedFiles.value.length
  const filesToAdd = files.slice(0, remainingSlots)
  
  filesToAdd.forEach(file => {
    // Valider le fichier
    const validation = validateFile(file)
    
    // Créer preview pour les images
    let previewUrl = null
    if (file.type.startsWith('image/')) {
      previewUrl = mediaService.createFilePreviewUrl(file)
    }
    
    selectedFiles.value.push({
      file,
      validation,
      previewUrl,
      type: getFileType(file.type)
    })
  })
  
  if (files.length > filesToAdd.length) {
    $q.notify({
      type: 'warning',
      message: `Seuls ${filesToAdd.length} fichiers ajoutés (limite: ${props.maxFiles})`,
      timeout: 3000
    })
  }
}

function removeFile(index) {
  const fileInfo = selectedFiles.value[index]
  
    // Nettoyer l'URL de preview
    if (fileInfo.previewUrl) {
      mediaService.revokeFilePreviewUrl(fileInfo.previewUrl)
    }  selectedFiles.value.splice(index, 1)
}

function validateFile(file) {
  const errors = []
  
  // Vérifier la taille
  if (file.size > props.maxSize) {
    errors.push(`Fichier trop volumineux (max: ${formatFileSize(props.maxSize)})`)
  }
  
  // Vérifier le type
  const fileType = getFileType(file.type)
  if (!props.accept.includes(fileType)) {
    errors.push(`Type de fichier non autorisé (${fileType})`)
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}

async function startUpload() {
  if (!canUpload.value) return
  
  try {
    uploading.value = true
    uploadProgress.value = 0
    uploadStatus.value = 'Préparation...'
    
    const validFiles = selectedFiles.value
      .filter(fileInfo => fileInfo.validation.valid)
      .map(fileInfo => fileInfo.file)
    
    let uploadedMedias = []
    
    if (props.multiple && validFiles.length > 1) {
      uploadStatus.value = `Upload de ${validFiles.length} fichiers...`
      
      // Upload multiple via le store
      const result = await collectionStore.uploadMultiple(validFiles)
      uploadedMedias = result.uploaded || result
      
    } else if (validFiles.length === 1) {
      uploadStatus.value = 'Upload en cours...'
      
      // Upload simple via le store  
      const media = await collectionStore.uploadSingle(validFiles[0])
      uploadedMedias = [media]
    }
    
    uploadProgress.value = 100
    uploadStatus.value = 'Terminé !'
    
    // Nettoyer les previews
    selectedFiles.value.forEach(fileInfo => {
      if (fileInfo.previewUrl) {
        mediaService.revokeFilePreviewUrl(fileInfo.previewUrl)
      }
    })
    
    // Réinitialiser
    selectedFiles.value = []
    
    // Émettre le résultat
    emit('uploaded', uploadedMedias)
    
    $q.notify({
      type: 'positive',
      message: `${uploadedMedias.length} fichier(s) uploadé(s) avec succès`,
      timeout: 3000
    })
    
    // Fermer le dialog après un délai
    setTimeout(() => {
      emit('close')
    }, 1000)
    
  } catch (error) {
    console.error('Upload error:', error)
    uploadStatus.value = 'Erreur !'
    
    $q.notify({
      type: 'negative',
      message: 'Erreur lors de l\'upload: ' + error.message,
      timeout: 5000
    })
    
  } finally {
    uploading.value = false
  }
}

// Utilitaires
function getFileType(mimeType) {
  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType.startsWith('video/')) return 'video' 
  if (mimeType.startsWith('audio/')) return 'audio'
  return 'unknown'
}

function getFileIcon(mimeType) {
  const type = getFileType(mimeType)
  switch (type) {
    case 'image': return 'image'
    case 'video': return 'videocam'
    case 'audio': return 'audiotrack'
    default: return 'insert_drive_file'
  }
}

function getFileColor(mimeType) {
  const type = getFileType(mimeType)
  switch (type) {
    case 'image': return 'green'
    case 'video': return 'blue'  
    case 'audio': return 'purple'
    default: return 'grey'
  }
}

function formatFileSize(bytes) {
  return mediaService.formatFileSize(bytes)
}
</script>

<style scoped>
.upload-drop-zone {
  border: 2px dashed #ddd;
  border-radius: 8px;
  padding: 40px 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: #fafafa;
}

.upload-drop-zone:hover,
.upload-drop-zone.drag-over {
  border-color: var(--q-primary);
  background: #f0f8ff;
}

.upload-content {
  pointer-events: none;
}

.selected-files {
  max-height: 200px;
  overflow-y: auto;
}

.file-preview-item {
  padding: 8px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  margin-bottom: 8px;
  background: white;
}

.file-preview-item:last-child {
  margin-bottom: 0;
}
</style>