<template>
  <q-card style="min-width: 500px">
    <q-card-section>
      <div class="row items-center">
        <div class="col">
          <div class="text-h6">Upload d'images</div>
          <div v-if="targetCollection" class="text-caption text-grey-6">
            Destination: {{ targetCollection.name }}
          </div>
        </div>
        <div class="col-auto">
          <q-btn flat round icon="close" @click="$emit('close')" />
        </div>
      </div>
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
            Glissez vos images ici
          </div>
          <div class="text-body2 text-grey-5 q-mb-md">
            ou cliquez pour choisir
          </div>
          <q-btn 
            color="primary" 
            label="Choisir des images"
            icon="image"
            @click.stop="triggerFileInput"
          />
        </div>
      </div>

      <!-- Input file caché -->
      <input
        ref="fileInput"
        type="file"
        accept="image/*"
        :multiple="multiple"
        @change="onFileSelected"
        style="display: none"
      />

      <!-- Preview des fichiers sélectionnés -->
      <div v-if="selectedFiles.length > 0" class="q-mt-md">
        <div class="text-subtitle2 q-mb-sm">
          Images sélectionnées ({{ selectedFiles.length }})
        </div>
        
        <div class="selected-files">
          <div 
            v-for="(file, index) in selectedFiles" 
            :key="index"
            class="file-preview q-mb-sm"
          >
            <q-card flat bordered class="q-pa-sm">
              <div class="row items-center no-wrap">
                <!-- Preview de l'image -->
                <div class="col-auto q-mr-md">
                  <q-img
                    :src="file.preview"
                    width="60px"
                    height="60px"
                    fit="cover"
                    class="rounded-borders"
                  />
                </div>
                
                <!-- Infos du fichier -->
                <div class="col">
                  <div class="text-body2 text-weight-medium">{{ file.name }}</div>
                  <div class="text-caption text-grey-6">
                    {{ formatFileSize(file.size) }}
                  </div>
                  
                  <!-- Description -->
                  <q-input
                    v-model="file.description"
                    placeholder="Description (optionnelle)"
                    dense
                    outlined
                    class="q-mt-xs"
                    style="max-width: 300px;"
                  />
                </div>
                
                <!-- Actions -->
                <div class="col-auto">
                  <q-btn
                    flat
                    round
                    icon="delete"
                    color="negative"
                    size="sm"
                    @click="removeFile(index)"
                  />
                </div>
              </div>
            </q-card>
          </div>
        </div>
      </div>

      <!-- Description globale -->
      <div v-if="selectedFiles.length > 1" class="q-mt-md">
        <q-input
          v-model="globalDescription"
          label="Description pour toutes les images"
          filled
          type="textarea"
          rows="2"
          hint="Cette description sera appliquée aux images sans description individuelle"
        />
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

    <!-- Actions -->
    <q-card-actions align="right">
      <q-btn 
        flat 
        label="Annuler" 
        @click="$emit('close')"
        :disable="uploading"
      />
      <q-btn 
        color="primary" 
        label="Uploader" 
        icon="cloud_upload"
        @click="startUpload"
        :loading="uploading"
        :disable="!canUpload"
      />
    </q-card-actions>
  </q-card>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useQuasar } from 'quasar'
import { api } from 'src/boot/axios'

// Props
const props = defineProps({
  // Collection cible (peut être un ID string ou un objet collection)
  targetCollection: {
    type: [String, Object],
    default: null
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
    default: 10 * 1024 * 1024 // 10MB par image
  }
})

// Émissions
const emit = defineEmits(['uploaded', 'close', 'collection-updated'])

// Stores et utilitaires
const $q = useQuasar()

// État local
const dragOver = ref(false)
const selectedFiles = ref([])
const uploading = ref(false)
const uploadProgress = ref(0)
const uploadStatus = ref('')
const fileInput = ref()
const globalDescription = ref('')

// Computed
const canUpload = computed(() => {
  return selectedFiles.value.length > 0 && !uploading.value && props.targetCollection
})

const collectionId = computed(() => {
  if (!props.targetCollection) return null
  return typeof props.targetCollection === 'string' 
    ? props.targetCollection 
    : props.targetCollection.id
})

// Méthodes
function triggerFileInput() {
  fileInput.value?.click()
}

function onDrop(event) {
  dragOver.value = false
  const files = Array.from(event.dataTransfer.files)
  handleFiles(files)
}

function onFileSelected(event) {
  const files = Array.from(event.target.files)
  handleFiles(files)
  // Reset input
  event.target.value = ''
}

function handleFiles(files) {
  // Filtrer les images uniquement
  const imageFiles = files.filter(file => file.type.startsWith('image/'))
  
  if (imageFiles.length !== files.length) {
    $q.notify({
      type: 'warning',
      message: 'Seules les images sont acceptées'
    })
  }
  
  // Vérifier la limite de fichiers
  if (selectedFiles.value.length + imageFiles.length > props.maxFiles) {
    $q.notify({
      type: 'warning',
      message: `Maximum ${props.maxFiles} fichiers autorisés`
    })
    return
  }
  
  // Traiter chaque fichier
  imageFiles.forEach(file => {
    if (file.size > props.maxSize) {
      $q.notify({
        type: 'warning',
        message: `${file.name} est trop volumineux (max ${formatFileSize(props.maxSize)})`
      })
      return
    }
    
    // Créer un preview
    const reader = new FileReader()
    reader.onload = (e) => {
      selectedFiles.value.push({
        file,
        name: file.name,
        size: file.size,
        preview: e.target.result,
        description: ''
      })
    }
    reader.readAsDataURL(file)
  })
}

function removeFile(index) {
  selectedFiles.value.splice(index, 1)
}

async function startUpload() {
  if (!canUpload.value) return
  
  try {
    uploading.value = true
    uploadProgress.value = 0
    uploadStatus.value = 'Préparation...'
    
    // Créer FormData pour tous les fichiers
    const formData = new FormData()
    
    // Ajouter tous les fichiers
    selectedFiles.value.forEach(fileData => {
      formData.append('files', fileData.file)
    })
    
    // Ajouter la description globale
    if (globalDescription.value?.trim()) {
      formData.append('description', globalDescription.value.trim())
    }
    
    // Upload direct vers la collection
    const uploadUrl = collectionId.value === 'current' 
      ? '/collections/current/upload' 
      : `/collections/${collectionId.value}/upload`
    
    const uploadResponse = await api.post(uploadUrl, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: (progressEvent) => {
        uploadProgress.value = Math.round((progressEvent.loaded / progressEvent.total) * 100)
      }
    })
    
    if (!uploadResponse.data.success) {
      throw new Error(uploadResponse.data.message || 'Erreur upload')
    }
    
    uploadStatus.value = 'Terminé !'
    
    const resultsCount = uploadResponse.data.results?.length || 0
    
    $q.notify({
      type: 'positive',
      message: `${resultsCount} image(s) ajoutée(s) à la collection`,
      timeout: 3000
    })
    
    // Émettre les événements
    emit('uploaded', uploadResponse.data.results || [])
    emit('collection-updated')
    emit('close')
    
  } catch (error) {
    console.error('Erreur lors de l\'upload:', error)
    $q.notify({
      type: 'negative',
      message: 'Erreur lors de l\'upload des images'
    })
  } finally {
    uploading.value = false
    uploadProgress.value = 0
    uploadStatus.value = ''
  }
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}
</script>

<style scoped>
.upload-drop-zone {
  border: 2px dashed #ccc;
  border-radius: 8px;
  padding: 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background-color: #fafafa;
}

.upload-drop-zone:hover,
.upload-drop-zone.drag-over {
  border-color: #1976d2;
  background-color: #e3f2fd;
}

.upload-content {
  pointer-events: none;
}

.file-preview {
  transition: all 0.2s ease;
}

.file-preview:hover {
  transform: translateX(4px);
}
</style>