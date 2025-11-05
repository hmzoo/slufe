<template>
  <q-dialog v-model="showDialog" maximized class="collection-manager-dialog">
    <q-card class="collection-manager">
      <q-card-section class="row items-center q-pa-md bg-primary text-white">
        <div class="text-h6">
          <q-icon name="collections" class="q-mr-sm" />
          Gestionnaire de Collections
        </div>
        <q-space />
        <q-btn
          flat
          round
          icon="close"
          @click="closeDialog"
        />
      </q-card-section>

      <q-card-section class="q-pa-none" style="height: calc(100vh - 80px)">
        <q-splitter
          v-model="splitterModel"
          style="height: 100%"
        >
          <!-- Liste des collections -->
          <template v-slot:before>
            <div class="q-pa-md">
              <div class="row items-center q-mb-md">
                <div class="text-h6">Collections</div>
                <q-space />
                <q-btn
                  color="grey-7"
                  icon="refresh"
                  @click="refreshCollections"
                  round
                  flat
                  size="md"
                  class="q-mr-sm"
                >
                  <q-tooltip>Rafraîchir la liste</q-tooltip>
                </q-btn>
                <q-btn
                  color="primary"
                  icon="add"
                  label="Nouvelle Collection"
                  @click="showCreateCollectionDialog"
                  unelevated
                />
              </div>

              <!-- Collection courante -->
              <q-card v-if="currentCollection" flat bordered class="q-mb-md bg-blue-1">
                <q-card-section class="q-pa-sm">
                  <div class="row items-center">
                    <q-icon name="star" color="orange" class="q-mr-sm" />
                    <div class="text-subtitle2">Collection courante</div>
                  </div>
                  <div class="text-body2 text-weight-medium q-mt-xs">
                    {{ currentCollection.name }}
                  </div>
                  <div class="text-caption text-grey-6">
                    {{ currentCollection.images.length }} image(s)
                  </div>
                </q-card-section>
              </q-card>

              <!-- Liste des collections -->
              <q-list separator>
                <q-item
                  v-for="collection in collections"
                  :key="collection.id"
                  clickable
                  :active="selectedCollection?.id === collection.id"
                  @click="selectCollection(collection)"
                  class="collection-item"
                >
                  <q-item-section avatar>
                    <q-avatar 
                      :color="collection.id === currentCollection?.id ? 'orange' : 'primary'" 
                      text-color="white"
                    >
                      <q-icon :name="collection.id === currentCollection?.id ? 'star' : 'collections'" />
                    </q-avatar>
                  </q-item-section>
                  
                  <q-item-section>
                    <q-item-label class="text-weight-medium">
                      {{ collection.name }}
                    </q-item-label>
                    <q-item-label caption>
                      {{ collection.images.length }} image(s)
                      <span v-if="collection.description"> • {{ collection.description }}</span>
                    </q-item-label>
                    <q-item-label caption class="text-grey-5">
                      {{ formatDate(collection.createdAt) }}
                    </q-item-label>
                  </q-item-section>

                  <q-item-section side>
                    <div class="row q-gutter-xs">
                      <q-btn
                        v-if="collection.id !== currentCollection?.id"
                        size="sm"
                        flat
                        round
                        icon="star_border"
                        color="orange"
                        @click.stop="setCurrentCollection(collection.id)"
                      >
                        <q-tooltip>Définir comme courante</q-tooltip>
                      </q-btn>
                      
                      <q-btn
                        size="sm"
                        flat
                        round
                        icon="edit"
                        color="primary"
                        @click.stop="editCollection(collection)"
                      >
                        <q-tooltip>Modifier</q-tooltip>
                      </q-btn>
                      
                      <q-btn
                        size="sm"
                        flat
                        round
                        icon="delete"
                        color="negative"
                        @click.stop="confirmDeleteCollection(collection)"
                      >
                        <q-tooltip>Supprimer</q-tooltip>
                      </q-btn>
                    </div>
                  </q-item-section>
                </q-item>
                
                <q-item v-if="!collections.length" class="text-center text-grey-6">
                  <q-item-section>
                    <q-icon name="collections" size="3rem" class="q-mb-md" />
                    <div>Aucune collection trouvée</div>
                    <div class="text-caption">Créez votre première collection</div>
                  </q-item-section>
                </q-item>
              </q-list>
            </div>
          </template>

          <!-- Détails et galerie de la collection sélectionnée -->
          <template v-slot:after>
            <div v-if="selectedCollection" class="q-pa-md">
              <!-- Informations de la collection -->
              <q-card flat bordered class="q-mb-md">
                <q-card-section>
                  <div class="row items-start">
                    <div class="col">
                      <div class="text-h6 q-mb-xs">{{ selectedCollection.name }}</div>
                      <div v-if="selectedCollection.description" class="text-body2 text-grey-7 q-mb-sm">
                        {{ selectedCollection.description }}
                      </div>
                      <div class="text-caption text-grey-6">
                        <q-icon name="image" class="q-mr-xs" />
                        {{ selectedCollection.images.length }} image(s)
                        <q-icon name="schedule" class="q-ml-md q-mr-xs" />
                        Créée le {{ formatDate(selectedCollection.createdAt) }}
                      </div>
                    </div>
                    
                    <div class="col-auto">
                      <div class="row q-gutter-sm">
                        <q-btn
                          v-if="selectedCollection.id !== currentCollection?.id"
                          size="sm"
                          icon="star"
                          label="Définir comme courante"
                          color="orange"
                          @click="setCurrentCollection(selectedCollection.id)"
                          unelevated
                        />
                        <q-btn
                          size="sm"
                          icon="edit"
                          label="Modifier"
                          color="primary"
                          @click="editCollection(selectedCollection)"
                          flat
                        />
                      </div>
                    </div>
                  </div>
                </q-card-section>
              </q-card>

              <!-- Galerie des images -->
              <q-card flat bordered>
                <q-card-section>
                  <div class="row items-center q-mb-md">
                    <div class="text-subtitle2">Galerie</div>
                    <q-space />
                    <q-btn
                      size="sm"
                      icon="add_photo_alternate"
                      label="Ajouter Image"
                      color="primary"
                      @click="openAddImageDialog"
                      flat
                    />
                  </div>

                  <!-- Grille des médias (images et vidéos) -->
                  <div v-if="selectedCollection.images.length" class="row q-col-gutter-md">
                    <div 
                      v-for="(media, index) in selectedCollection.images" 
                      :key="index"
                      class="col-12 col-sm-6 col-md-4 col-lg-3"
                    >
                      <q-card class="image-card cursor-pointer" @click="viewImageDetails(media)">
                        <div class="image-container">
                          <!-- Vidéo -->
                          <div v-if="media.type === 'video'" class="video-container" style="height: 200px; position: relative; background: #000;">
                            <video
                              :src="media.url"
                              style="width: 100%; height: 100%; object-fit: cover;"
                              muted
                              loop
                              @mouseenter="$event.target.play()"
                              @mouseleave="$event.target.pause(); $event.target.currentTime = 0"
                            />
                            <div class="absolute-top-left q-pa-xs">
                              <q-chip dense color="red" text-color="white" size="sm">
                                <q-icon name="videocam" size="xs" class="q-mr-xs" />
                                Vidéo
                              </q-chip>
                            </div>
                            <div class="absolute-bottom bg-black-50 text-white q-pa-xs">
                              <div v-if="media.description" class="text-caption text-truncate">
                                {{ media.description }}
                              </div>
                              <div class="text-caption text-grey-4">
                                <span v-if="media.metadata?.duration">{{ media.metadata.duration }} • </span>
                                <span v-if="media.metadata?.fps">{{ media.metadata.fps }} fps • </span>
                                {{ formatDate(media.addedAt) }}
                              </div>
                            </div>
                            
                            <!-- Actions sur la vidéo -->
                            <div class="absolute-top-right q-pa-xs">
                              <q-btn
                                size="sm"
                                round
                                flat
                                icon="edit"
                                color="white"
                                @click.stop="editImageDescription(media)"
                              >
                                <q-tooltip>Modifier la description</q-tooltip>
                              </q-btn>
                              <q-btn
                                size="sm"
                                round
                                flat
                                icon="delete"
                                color="white"
                                @click.stop="confirmRemoveImage(media)"
                              >
                                <q-tooltip>Supprimer de la collection</q-tooltip>
                              </q-btn>
                            </div>
                          </div>
                          
                          <!-- Image -->
                          <q-img
                            v-else
                            :src="media.url"
                            :alt="media.description || 'Image'"
                            spinner-color="primary"
                            class="rounded-borders"
                            style="height: 200px"
                            fit="cover"
                          >
                            <div class="absolute-bottom bg-black-50 text-white q-pa-xs">
                              <div v-if="media.description" class="text-caption text-truncate">
                                {{ media.description }}
                              </div>
                              <div class="text-caption text-grey-4">
                                {{ formatDate(media.addedAt) }}
                              </div>
                            </div>
                            
                            <!-- Actions sur l'image -->
                            <div class="absolute-top-right q-pa-xs">
                              <q-btn
                                size="sm"
                                round
                                flat
                                icon="edit"
                                color="white"
                                @click.stop="editImageDescription(media)"
                              >
                                <q-tooltip>Modifier la description</q-tooltip>
                              </q-btn>
                              <q-btn
                                size="sm"
                                round
                                flat
                                icon="delete"
                                color="white"
                                @click.stop="confirmRemoveImage(media)"
                              >
                                <q-tooltip>Supprimer de la collection</q-tooltip>
                              </q-btn>
                            </div>
                          </q-img>
                        </div>
                      </q-card>
                    </div>
                  </div>
                  
                  <div v-else class="text-center text-grey-6 q-py-xl">
                    <q-icon name="perm_media" size="4rem" class="q-mb-md" />
                    <div>Aucun média dans cette collection</div>
                    <div class="text-caption">Ajoutez des images ou vidéos pour commencer</div>
                  </div>
                </q-card-section>
              </q-card>
            </div>
            
            <div v-else class="q-pa-md text-center text-grey-6">
              <q-icon name="touch_app" size="3rem" class="q-mb-md" />
              <div>Sélectionnez une collection pour voir les détails</div>
            </div>
          </template>
        </q-splitter>
      </q-card-section>
    </q-card>
  </q-dialog>

  <!-- Dialog de création/édition de collection -->
  <q-dialog v-model="showCollectionEditDialog">
    <q-card style="min-width: 500px">
      <q-card-section class="row items-center">
        <div class="text-h6">{{ editingCollection ? 'Modifier la collection' : 'Créer une collection' }}</div>
        <q-space />
        <q-btn flat round icon="close" @click="closeEditDialog" />
      </q-card-section>

      <q-card-section>
        <q-form @submit="saveCollection">
          <q-input
            v-model="collectionForm.name"
            label="Nom de la collection *"
            filled
            :rules="[val => !!val || 'Le nom est requis']"
            class="q-mb-md"
          />
          
          <q-input
            v-model="collectionForm.description"
            label="Description (optionnelle)"
            filled
            type="textarea"
            rows="3"
            class="q-mb-md"
          />

          <div class="row justify-end q-gutter-sm">
            <q-btn flat label="Annuler" @click="closeEditDialog" />
            <q-btn
              type="submit"
              color="primary"
              :label="editingCollection ? 'Mettre à jour' : 'Créer'"
              :loading="saving"
            />
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </q-dialog>

  <!-- Dialog d'ajout d'image amélioré -->
      <!-- Dialog d'upload d'images -->
    <q-dialog v-model="showUploadDialog" persistent>
      <CollectionImageUpload
        :target-collection="selectedCollection"
        @uploaded="onImagesUploaded"
        @collection-updated="loadCollections"
        @close="showUploadDialog = false"
      />
    </q-dialog>

  <!-- Dialog de modification de description d'image -->
  <q-dialog v-model="showImageEditDialog">
    <q-card style="min-width: 400px">
      <q-card-section class="row items-center">
        <div class="text-h6">Modifier la description</div>
        <q-space />
        <q-btn flat round icon="close" @click="showImageEditDialog = false" />
      </q-card-section>

      <q-card-section>
        <q-form @submit="updateImageDescription">
          <q-input
            v-model="editingImageDescription"
            label="Description"
            filled
            type="textarea"
            rows="3"
            class="q-mb-md"
          />

          <div class="row justify-end q-gutter-sm">
            <q-btn flat label="Annuler" @click="showImageEditDialog = false" />
            <q-btn
              type="submit"
              color="primary"
              label="Sauvegarder"
              :loading="updatingImage"
            />
          </div>
        </q-form>
      </q-card-section>
    </q-card>
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
              {{ currentViewedImage?.description || (currentViewedImage?.type === 'video' ? 'Vidéo sans nom' : 'Image sans nom') }}
            </div>
            <div class="text-caption text-grey-4">
              {{ currentViewedImage?.type === 'video' ? 'Vidéo' : 'Image' }} {{ currentImageIndex + 1 }} sur {{ selectedCollection?.images?.length || 0 }}
              <span v-if="currentViewedImage?.addedAt">
                • {{ formatDate(currentViewedImage.addedAt) }}
              </span>
              <span v-if="currentViewedImage?.metadata?.duration">
                • {{ currentViewedImage.metadata.duration }}
              </span>
              <span v-if="currentViewedImage?.metadata?.fps">
                • {{ currentViewedImage.metadata.fps }} fps
              </span>
              <span v-if="currentViewedImage?.metadata?.resolution">
                • {{ currentViewedImage.metadata.resolution }}
              </span>
            </div>
          </div>
          <div class="col-auto">
            <q-btn-group>
              <q-btn 
                icon="edit"
                label="Modifier"
                color="primary"
                @click="editImageDescription(currentViewedImage)"
              />
              <q-btn 
                icon="delete"
                label="Supprimer"
                color="negative"
                @click="confirmRemoveImage(currentViewedImage)"
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

      <!-- Image ou Vidéo principale -->
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
          :alt="currentViewedImage.description"
          class="full-width full-height"
          style="object-fit: contain; max-height: 100vh; max-width: 100vw;"
          @click="closeImageViewer"
        />
      </q-card-section>

      <!-- Boutons de navigation flottants - centrés verticalement -->
      <div 
        v-if="selectedCollection?.images?.length > 1" 
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
        v-if="selectedCollection?.images?.length > 1"
        class="absolute-right q-mr-lg navigation-button-right"
      >
        <q-btn 
          icon="chevron_right"
          round
          size="xl"
          color="white"
          text-color="black"
          :disable="currentImageIndex === (selectedCollection?.images?.length || 0) - 1"
          @click="nextImage"
          class="shadow-5"
          style="opacity: 0.9;"
        />
      </div>

      <!-- Footer avec miniatures -->
      <q-card-section 
        v-if="selectedCollection?.images?.length > 1"
        class="q-pa-md bg-black/80 absolute-bottom z-top"
      >
        <div class="row justify-center q-gutter-xs">
          <div 
            v-for="(media, index) in selectedCollection.images"
            :key="index"
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
              :alt="media.description"
              class="thumbnail-image"
            />
          </div>
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { api } from 'src/boot/axios'
import CollectionImageUpload from './CollectionImageUpload.vue'

const $q = useQuasar()

// Props
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
})

// Emits
const emit = defineEmits(['update:modelValue', 'collection-changed'])

// Data
const collections = ref([])
const selectedCollection = ref(null)
const currentCollection = ref(null)
const splitterModel = ref(30)
const loading = ref(false)
const saving = ref(false)
const addingImage = ref(false)
const updatingImage = ref(false)

// Dialogs
const showCollectionEditDialog = ref(false)
const showAddImageDialog = ref(false)
const showImageEditDialog = ref(false)
const editingCollection = ref(null)
const editingImage = ref(null)

// Forms
const collectionForm = ref({
  name: '',
  description: ''
})

const imageForm = ref({
  url: '',
  description: ''
})

const editingImageDescription = ref('')

// Variables pour l'upload unifié
const showUploadDialog = ref(false)

// Vue agrandie
const showImageViewer = ref(false)
const currentImageIndex = ref(0)
const currentViewedImage = ref(null)

// Computed
const showDialog = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

// Methods
async function loadCollections() {
  try {
    loading.value = true
    const response = await api.get('/collections')
    
    if (response.data.success) {
      collections.value = response.data.collections
      console.log(`📚 ${collections.value.length} collections chargées`)
    }
  } catch (error) {
    console.error('Erreur chargement collections:', error)
    $q.notify({
      type: 'negative',
      message: 'Erreur lors du chargement des collections'
    })
  } finally {
    loading.value = false
  }
}

async function loadCurrentCollection() {
  try {
    const response = await api.get('/collections/current/info')
    
    if (response.data.success && response.data.currentCollection) {
      currentCollection.value = response.data.currentCollection
    }
  } catch (error) {
    console.error('Erreur chargement collection courante:', error)
  }
}

async function refreshCollections() {
  $q.notify({
    type: 'info',
    message: 'Actualisation des collections...',
    timeout: 1000
  })
  
  await Promise.all([
    loadCollections(),
    loadCurrentCollection()
  ])
  
  $q.notify({
    type: 'positive',
    message: 'Collections actualisées',
    timeout: 2000
  })
}

function selectCollection(collection) {
  selectedCollection.value = collection
}

async function setCurrentCollection(collectionId) {
  try {
    const response = await api.post('/collections/current/set', { collectionId })
    
    if (response.data.success) {
      currentCollection.value = response.data.currentCollection
      
      $q.notify({
        type: 'positive',
        message: `"${response.data.currentCollection.name}" définie comme collection courante`
      })
      
      emit('collection-changed', response.data.currentCollection)
    }
  } catch (error) {
    console.error('Erreur définition collection courante:', error)
    $q.notify({
      type: 'negative',
      message: 'Erreur lors de la définition de la collection courante'
    })
  }
}

function showCreateCollectionDialog() {
  editingCollection.value = null
  collectionForm.value = { name: '', description: '' }
  showCollectionEditDialog.value = true
}

function editCollection(collection) {
  editingCollection.value = collection
  collectionForm.value = {
    name: collection.name,
    description: collection.description || ''
  }
  showCollectionEditDialog.value = true
}

async function saveCollection() {
  try {
    saving.value = true
    
    let response
    if (editingCollection.value) {
      // Mise à jour
      response = await api.put(`/collections/${editingCollection.value.id}`, collectionForm.value)
    } else {
      // Création
      response = await api.post('/collections', collectionForm.value)
    }
    
    if (response.data.success) {
      $q.notify({
        type: 'positive',
        message: response.data.message
      })
      
      closeEditDialog()
      await loadCollections()
      
      // Si c'était une création et que c'est la première collection, la définir comme courante
      if (!editingCollection.value && collections.value.length === 1) {
        await setCurrentCollection(response.data.collection.id)
      }
    }
  } catch (error) {
    console.error('Erreur sauvegarde collection:', error)
    $q.notify({
      type: 'negative',
      message: 'Erreur lors de la sauvegarde'
    })
  } finally {
    saving.value = false
  }
}

async function confirmDeleteCollection(collection) {
  $q.dialog({
    title: 'Confirmer la suppression',
    message: `Êtes-vous sûr de vouloir supprimer la collection "${collection.name}" ? Cette action est irréversible.`,
    cancel: true,
    persistent: true
  }).onOk(async () => {
    await deleteCollection(collection.id)
  })
}

async function deleteCollection(collectionId) {
  try {
    const response = await api.delete(`/collections/${collectionId}`)
    
    if (response.data.success) {
      $q.notify({
        type: 'positive',
        message: response.data.message
      })
      
      // Actualiser les données
      await Promise.all([
        loadCollections(),
        loadCurrentCollection()
      ])
      
      // Désélectionner si c'était la collection sélectionnée
      if (selectedCollection.value?.id === collectionId) {
        selectedCollection.value = null
      }
    }
  } catch (error) {
    console.error('Erreur suppression collection:', error)
    $q.notify({
      type: 'negative',
      message: 'Erreur lors de la suppression'
    })
  }
}

function openAddImageDialog() {
  showUploadDialog.value = true
}

// Callback pour les images uploadées
function onImagesUploaded(uploadedImages) {
  console.log('Images uploadées:', uploadedImages)
  
  // Recharger la collection sélectionnée pour voir les nouvelles images
  if (selectedCollection.value) {
    selectCollection(selectedCollection.value)
  }
}









// Validation URL d'image
function isValidImageUrl(url) {
  if (!url) return false
  return /\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i.test(url) || 
         url.includes('replicate') || 
         url.includes('amazonaws') ||
         url.startsWith('data:image/')
}

function onImagePreviewError() {
  console.warn('Impossible de charger l\'aperçu de l\'image')
}

// Ajouter image depuis URL
async function addImageFromUrl() {
  if (!imageForm.value.url) return
  
  try {
    addingImage.value = true
    
    const response = await api.post(`/collections/${selectedCollection.value.id}/images`, imageForm.value)
    
    if (response.data.success) {
      $q.notify({
        type: 'positive',
        message: 'Image ajoutée à la collection'
      })
      
      // Mettre à jour la collection sélectionnée
      selectedCollection.value = response.data.collection
      
      // Mettre à jour la liste des collections
      const collectionIndex = collections.value.findIndex(c => c.id === selectedCollection.value.id)
      if (collectionIndex !== -1) {
        collections.value[collectionIndex] = response.data.collection
      }
      
      closeAddImageDialog()
    }
  } catch (error) {
    console.error('Erreur ajout image URL:', error)
    $q.notify({
      type: 'negative',
      message: 'Erreur lors de l\'ajout de l\'image'
    })
  } finally {
    addingImage.value = false
  }
}

function editImageDescription(image) {
  editingImage.value = image
  editingImageDescription.value = image.description || ''
  showImageEditDialog.value = true
}

async function updateImageDescription() {
  try {
    updatingImage.value = true
    
    const response = await api.put(
      `/collections/${selectedCollection.value.id}/images/${encodeURIComponent(editingImage.value.url)}`,
      { description: editingImageDescription.value }
    )
    
    if (response.data.success) {
      $q.notify({
        type: 'positive',
        message: 'Description mise à jour'
      })
      
      // Mettre à jour la collection sélectionnée
      selectedCollection.value = response.data.collection
      
      // Mettre à jour la liste des collections
      const collectionIndex = collections.value.findIndex(c => c.id === selectedCollection.value.id)
      if (collectionIndex !== -1) {
        collections.value[collectionIndex] = response.data.collection
      }
      
      showImageEditDialog.value = false
    }
  } catch (error) {
    console.error('Erreur mise à jour description:', error)
    $q.notify({
      type: 'negative',
      message: 'Erreur lors de la mise à jour'
    })
  } finally {
    updatingImage.value = false
  }
}

async function confirmRemoveImage(image) {
  $q.dialog({
    title: 'Confirmer la suppression',
    message: 'Êtes-vous sûr de vouloir supprimer cette image de la collection ?',
    cancel: true,
    persistent: true
  }).onOk(async () => {
    await removeImageFromCollection(image.url)
  })
}

async function removeImageFromCollection(imageUrl) {
  try {
    const response = await api.delete(
      `/collections/${selectedCollection.value.id}/images/${encodeURIComponent(imageUrl)}`
    )
    
    if (response.data.success) {
      $q.notify({
        type: 'positive',
        message: 'Image supprimée de la collection'
      })
      
      // Mettre à jour la collection sélectionnée
      selectedCollection.value = response.data.collection
      
      // Mettre à jour la liste des collections
      const collectionIndex = collections.value.findIndex(c => c.id === selectedCollection.value.id)
      if (collectionIndex !== -1) {
        collections.value[collectionIndex] = response.data.collection
      }
    }
  } catch (error) {
    console.error('Erreur suppression image:', error)
    $q.notify({
      type: 'negative',
      message: 'Erreur lors de la suppression'
    })
  }
}

function viewImageDetails(image) {
  const index = selectedCollection.value.images.findIndex(img => 
    img.url === image.url && img.addedAt === image.addedAt
  )
  currentImageIndex.value = index >= 0 ? index : 0
  currentViewedImage.value = image
  showImageViewer.value = true
}

function closeDialog() {
  showDialog.value = false
}

function closeEditDialog() {
  showCollectionEditDialog.value = false
  editingCollection.value = null
}

// Fonctions de la vue agrandie
function closeImageViewer() {
  showImageViewer.value = false
  currentViewedImage.value = null
}

function previousImage() {
  if (currentImageIndex.value > 0) {
    currentImageIndex.value--
    currentViewedImage.value = selectedCollection.value.images[currentImageIndex.value]
  }
}

function nextImage() {
  if (currentImageIndex.value < selectedCollection.value.images.length - 1) {
    currentImageIndex.value++
    currentViewedImage.value = selectedCollection.value.images[currentImageIndex.value]
  }
}

function goToImage(index) {
  currentImageIndex.value = index
  currentViewedImage.value = selectedCollection.value.images[index]
}

function formatDate(dateString) {
  const date = new Date(dateString)
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Lifecycle
onMounted(async () => {
  await Promise.all([
    loadCollections(),
    loadCurrentCollection()
  ])
})
</script>

<style scoped>
.collection-manager-dialog .q-card {
  max-width: none;
}

.collection-item:hover {
  background-color: rgba(25, 118, 210, 0.04);
}

.image-card {
  transition: transform 0.2s ease;
}

.image-card:hover {
  transform: translateY(-2px);
}

.image-container {
  position: relative;
  overflow: hidden;
  border-radius: 8px;
}

/* Vue agrandie */
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
</style>