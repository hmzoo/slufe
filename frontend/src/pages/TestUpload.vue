<template>
  <q-page class="q-pa-md">
    <div class="row q-gutter-md">
      <div class="col-12">
        <h4>Test du système de médias complet</h4>
        
        <!-- Store Stats -->
        <q-card class="q-mb-md">
          <q-card-section>
            <h6>Stats du Store de Médias</h6>
            <div class="row q-gutter-md">
              <div class="col-auto">
                <q-chip color="primary" text-color="white">
                  {{ mediaStore.totalCount }} médias
                </q-chip>
              </div>
              <div class="col-auto">
                <q-chip color="secondary" text-color="white">
                  {{ mediaStore.images.length }} images
                </q-chip>
              </div>
              <div class="col-auto">
                <q-chip color="accent" text-color="white">
                  {{ mediaStore.videos.length }} vidéos
                </q-chip>
              </div>
              <div class="col-auto">
                <q-chip color="warning" text-color="white">
                  {{ mediaStore.formatFileSize(mediaStore.totalSize) }}
                </q-chip>
              </div>
            </div>
            
            <div class="q-mt-md">
              <q-btn 
                label="Charger médias du serveur"
                icon="refresh"
                @click="loadAllMedias"
                :loading="mediaStore.loading"
                color="primary"
                class="q-mr-sm"
              />
              <q-btn 
                label="Vider le store"
                icon="clear"
                @click="clearMediaStore"
                outline
                class="q-mr-sm"
              />
              <q-btn 
                label="Ouvrir Galerie"
                icon="photo_library"
                @click="showGallery = true"
                color="secondary"
              />
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Test MediaSelector -->
      <div class="col-12">
        <q-card>
          <q-card-section>
            <h6>Test MediaSelector Component</h6>
          </q-card-section>
          
          <q-card-section>
            <div class="row q-gutter-md">
              <div class="col-md-6">
                <MediaSelector
                  v-model="selectedSingle"
                  label="Sélection simple (image)"
                  :accept="['image']"
                  placeholder="Choisir une image depuis la galerie..."
                  @selected="onSingleSelected"
                  @uploaded="onUploaded"
                />
                
                <div v-if="selectedSingle" class="q-mt-sm">
                  <q-badge color="green">ID sélectionné: {{ selectedSingle }}</q-badge>
                </div>
              </div>
              
              <div class="col-md-6">
                <MediaSelector
                  v-model="selectedMultiple"
                  label="Sélection multiple"
                  :accept="['image', 'video']"
                  :multiple="true"
                  placeholder="Choisir plusieurs médias..."
                  @selected="onMultipleSelected"
                  @uploaded="onUploaded"
                />
                
                <div v-if="selectedMultiple && selectedMultiple.length > 0" class="q-mt-sm">
                  <q-badge 
                    v-for="id in selectedMultiple" 
                    :key="id" 
                    color="blue" 
                    class="q-mr-xs"
                  >
                    {{ id }}
                  </q-badge>
                </div>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Upload simple -->
      <div class="col-12 col-md-6">
        <q-card>
          <q-card-section>
            <div class="text-h6">Upload simple</div>
          </q-card-section>
          
          <q-card-section>
            <q-file 
              v-model="singleFile"
              label="Choisir un fichier"
              outlined
              accept="image/*,video/*,audio/*"
              @update:model-value="validateSingleFile"
            >
              <template v-slot:prepend>
                <q-icon name="attach_file" />
              </template>
            </q-file>
            
            <div v-if="singleFileValidation && !singleFileValidation.valid" class="text-negative q-mt-sm">
              {{ singleFileValidation.error }}
            </div>
            
            <div v-if="singleFileValidation && singleFileValidation.valid" class="text-positive q-mt-sm">
              Type: {{ singleFileValidation.type }} | Taille: {{ singleFileValidation.sizeFormatted }}
            </div>
          </q-card-section>

          <q-card-actions>
            <q-btn 
              color="primary" 
              label="Upload"
              :loading="uploading.single"
              :disable="!singleFile || (singleFileValidation && !singleFileValidation.valid)"
              @click="uploadSingle"
            />
          </q-card-actions>
        </q-card>
      </div>

      <!-- Upload multiple -->
      <div class="col-12 col-md-6">
        <q-card>
          <q-card-section>
            <div class="text-h6">Upload multiple</div>
          </q-card-section>
          
          <q-card-section>
            <q-file 
              v-model="multipleFiles"
              label="Choisir plusieurs fichiers"
              outlined
              multiple
              accept="image/*,video/*,audio/*"
              @update:model-value="validateMultipleFiles"
            >
              <template v-slot:prepend>
                <q-icon name="attach_file" />
              </template>
            </q-file>
            
            <div v-if="multipleFiles && multipleFiles.length > 0" class="q-mt-sm">
              <div v-for="(file, index) in multipleFiles" :key="index" class="q-mb-xs">
                <q-chip :color="multipleFilesValidation[index] && multipleFilesValidation[index].valid ? 'positive' : 'negative'">
                  {{ file.name }} ({{ formatFileSize(file.size) }})
                </q-chip>
              </div>
            </div>
          </q-card-section>

          <q-card-actions>
            <q-btn 
              color="primary" 
              label="Upload Multiple"
              :loading="uploading.multiple"
              :disable="!multipleFiles || multipleFiles.length === 0 || hasInvalidFiles"
              @click="uploadMultiple"
            />
          </q-card-actions>
        </q-card>
      </div>

      <!-- Résultats -->
      <div class="col-12">
        <q-card v-if="results.length > 0">
          <q-card-section>
            <div class="text-h6">Résultats des uploads</div>
          </q-card-section>
          
          <q-card-section>
            <div v-for="(result, index) in results" :key="index" class="q-mb-md">
              <q-expansion-item 
                :label="result.type + ' - ' + (result.success ? 'Succès' : 'Erreur')"
                :icon="result.success ? 'check_circle' : 'error'"
                :header-class="result.success ? 'text-positive' : 'text-negative'"
              >
                <q-card>
                  <q-card-section>
                    <pre class="text-caption">{{ JSON.stringify(result.data, null, 2) }}</pre>
                  </q-card-section>
                </q-card>
              </q-expansion-item>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Liste des médias -->
      <div class="col-12">
        <q-card>
          <q-card-section>
            <div class="text-h6">Médias stockés</div>
          </q-card-section>
          
          <q-card-section>
            <q-btn 
              color="secondary" 
              label="Rafraîchir la liste"
              :loading="loading.list"
              @click="loadMediaList"
            />
          </q-card-section>

          <q-card-section v-if="mediaList.length > 0">
            <div class="row q-gutter-md">
              <div v-for="media in mediaList" :key="media.id" class="col-12 col-sm-6 col-md-4">
                <q-card>
                  <q-card-section>
                    <div class="text-subtitle2">{{ media.originalName || media.filename }}</div>
                    <div class="text-caption">ID: {{ media.id }}</div>
                    <div class="text-caption">Type: {{ media.type }}</div>
                    <div class="text-caption">Taille: {{ formatFileSize(media.size) }}</div>
                  </q-card-section>

                  <q-card-section v-if="media.type === 'image'">
                    <img :src="media.url" :alt="media.filename" style="max-width: 100%; height: auto;" />
                  </q-card-section>

                  <q-card-actions>
                    <q-btn flat color="primary" :href="media.url" target="_blank">Voir</q-btn>
                    <q-btn flat color="negative" @click="deleteMedia(media.id)">Supprimer</q-btn>
                  </q-card-actions>
                </q-card>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Dialog Galerie -->
    <q-dialog v-model="showGallery" maximized>
      <q-card>
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">Galerie de Médias</div>
          <q-space />
          <q-btn icon="close" flat round dense @click="showGallery = false" />
        </q-card-section>

        <q-card-section class="q-pt-none">
          <SimpleMediaGallery
            :multiple="true"
            @selected="onGallerySelection"
            @upload="showUploadDialog = true"
          />
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { uploadMediaService } from 'src/services/uploadMedia'
import { useMediaStore } from 'src/stores/useMediaStore'
import { Notify } from 'quasar'
import MediaSelector from 'src/components/MediaSelector.vue'
import SimpleMediaGallery from 'src/components/SimpleMediaGallery.vue'

// Store
const mediaStore = useMediaStore()

// États réactifs
const singleFile = ref(null)
const multipleFiles = ref(null)
const singleFileValidation = ref(null)
const multipleFilesValidation = ref([])
const results = ref([])
const mediaList = ref([])

// États pour les nouveaux composants
const selectedSingle = ref(null)
const selectedMultiple = ref([])
const showGallery = ref(false)

const uploading = ref({
  single: false,
  multiple: false
})

const loading = ref({
  list: false
})

// Computed
const hasInvalidFiles = computed(() => {
  if (!multipleFiles.value) return false
  return multipleFilesValidation.value.some(validation => !validation.valid)
})

// Méthodes de validation
const validateSingleFile = () => {
  if (singleFile.value) {
    singleFileValidation.value = uploadMediaService.validateFile(singleFile.value)
  } else {
    singleFileValidation.value = null
  }
}

const validateMultipleFiles = () => {
  if (multipleFiles.value && multipleFiles.value.length > 0) {
    multipleFilesValidation.value = multipleFiles.value.map(file => 
      uploadMediaService.validateFile(file)
    )
  } else {
    multipleFilesValidation.value = []
  }
}

// Méthodes d'upload
const uploadSingle = async () => {
  try {
    uploading.value.single = true
    
    const result = await uploadMediaService.uploadSingle(singleFile.value)
    
    results.value.unshift({
      type: 'Upload Simple',
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    })
    
    Notify.create({
      type: 'positive',
      message: 'Fichier uploadé avec succès!'
    })
    
    // Reset
    singleFile.value = null
    singleFileValidation.value = null
    
    // Refresh media list
    await loadMediaList()
    
  } catch (error) {
    results.value.unshift({
      type: 'Upload Simple',
      success: false,
      data: { error: error.message },
      timestamp: new Date().toISOString()
    })
    
    Notify.create({
      type: 'negative',
      message: 'Erreur lors de l\'upload: ' + error.message
    })
  } finally {
    uploading.value.single = false
  }
}

const uploadMultiple = async () => {
  try {
    uploading.value.multiple = true
    
    const result = await uploadMediaService.uploadMultiple(multipleFiles.value)
    
    results.value.unshift({
      type: 'Upload Multiple',
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    })
    
    Notify.create({
      type: 'positive',
      message: `${result.successful} fichier(s) uploadé(s) avec succès!`
    })
    
    // Reset
    multipleFiles.value = null
    multipleFilesValidation.value = []
    
    // Refresh media list
    await loadMediaList()
    
  } catch (error) {
    results.value.unshift({
      type: 'Upload Multiple',
      success: false,
      data: { error: error.message },
      timestamp: new Date().toISOString()
    })
    
    Notify.create({
      type: 'negative',
      message: 'Erreur lors de l\'upload: ' + error.message
    })
  } finally {
    uploading.value.multiple = false
  }
}

// Méthodes utilitaires
const formatFileSize = (bytes) => {
  return uploadMediaService.formatFileSize(bytes)
}

const loadMediaList = async () => {
  try {
    loading.value.list = true
    const result = await uploadMediaService.listAllMedias()
    mediaList.value = result.medias || []
  } catch (error) {
    Notify.create({
      type: 'negative',
      message: 'Erreur lors du chargement: ' + error.message
    })
  } finally {
    loading.value.list = false
  }
}

const deleteMedia = async (mediaId) => {
  try {
    await uploadMediaService.deleteMedia(mediaId)
    
    Notify.create({
      type: 'positive',
      message: 'Média supprimé avec succès!'
    })
    
    await loadMediaList()
    
  } catch (error) {
    Notify.create({
      type: 'negative',
      message: 'Erreur lors de la suppression: ' + error.message
    })
  }
}

// Méthodes pour le store de médias
const loadAllMedias = async () => {
  try {
    await mediaStore.loadAllMedias()
    Notify.create({
      type: 'positive',
      message: `${mediaStore.totalCount} médias chargés dans le store`
    })
  } catch (error) {
    Notify.create({
      type: 'negative',
      message: 'Erreur de chargement: ' + error.message
    })
  }
}

const clearMediaStore = () => {
  mediaStore.clearStore()
  selectedSingle.value = null
  selectedMultiple.value = []
  
  Notify.create({
    type: 'info',
    message: 'Store de médias vidé'
  })
}

// Méthodes pour MediaSelector
const onSingleSelected = (medias) => {
  console.log('Single media selected:', medias)
  Notify.create({
    type: 'positive',
    message: 'Média sélectionné depuis la galerie'
  })
}

const onMultipleSelected = (medias) => {
  console.log('Multiple medias selected:', medias)
  Notify.create({
    type: 'positive',
    message: `${medias.length} médias sélectionnés depuis la galerie`
  })
}

const onUploaded = (medias) => {
  console.log('Medias uploaded:', medias)
  Notify.create({
    type: 'positive',
    message: `${medias.length} média(s) uploadé(s) et ajouté(s) au store`
  })
}

const onGallerySelection = (medias) => {
  console.log('Gallery selection:', medias)
  showGallery.value = false
  Notify.create({
    type: 'info',
    message: `${medias.length} média(s) sélectionné(s) depuis la galerie`
  })
}

// Lifecycle
onMounted(async () => {
  // Charger les médias existants
  await loadMediaList()
  
  // Charger dans le store si vide
  if (mediaStore.totalCount === 0) {
    await loadAllMedias()
  }
})
</script>

<style scoped>
pre {
  white-space: pre-wrap;
  word-wrap: break-word;
  max-height: 300px;
  overflow-y: auto;
}
</style>