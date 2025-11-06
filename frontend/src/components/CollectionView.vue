<template>
  <div class="collection-view">
    <!-- HEADER -->
    <div class="row q-col-gutter-md q-mb-lg items-center">
      <div class="col">
        <div class="text-h5 q-mb-sm">
          <q-icon name="collections" class="q-mr-sm" />
          Gestionnaire de Collections
        </div>
        <div class="text-body2 text-grey-7">
          Organisez et gérez vos images, vidéos et autres ressources multimédias
        </div>
      </div>
      
      <div class="col-auto">
        <q-btn 
          color="primary" 
          icon="add" 
          label="Nouvelle Collection"
          @click="showCreateCollectionDialog"
          unelevated
        />
      </div>
    </div>

    <!-- CONTENU PRINCIPAL -->
    <div class="row q-col-gutter-lg" style="min-height: 70vh;">
      <!-- PANNEAU GAUCHE: Liste des collections -->
      <div class="col-4">
        <q-card flat bordered class="full-height">
          <q-card-section>
            <div class="row items-center q-mb-md">
              <div class="text-h6">Mes Collections</div>
              <q-space />
              <q-btn
                color="grey-7"
                icon="refresh"
                @click="refreshCollections"
                round
                flat
                size="md"
              >
                <q-tooltip>Rafraîchir</q-tooltip>
              </q-btn>
            </div>

            <!-- Collection courante -->
            <q-card v-if="currentCollection" flat bordered class="q-mb-md bg-blue-1">
              <q-card-section>
                <div class="row items-center">
                  <q-icon name="star" color="amber" class="q-mr-sm" />
                  <div>
                    <div class="text-subtitle2">Collection active</div>
                    <div class="text-body2">{{ currentCollection.name }}</div>
                  </div>
                </div>
              </q-card-section>
            </q-card>

            <!-- Loading indicator -->
            <div v-if="loading" class="text-center q-py-md">
              <q-spinner color="primary" size="3em" />
              <div class="text-body2 q-mt-sm">Chargement des collections...</div>
            </div>

            <!-- Message si aucune collection -->
            <div v-else-if="collectionStore.collections.length === 0" class="text-center q-py-xl">
              <q-icon name="collections" size="3em" color="grey-5" />
              <div class="text-h6 q-mt-sm text-grey-6">Aucune collection</div>
              <div class="text-body2 text-grey-5 q-mb-md">
                Créez votre première collection pour organiser vos médias
              </div>
              <q-btn 
                color="primary" 
                icon="add" 
                label="Créer une collection"
                @click="showCreateCollectionDialog"
                unelevated
              />
            </div>

            <!-- Liste des collections -->
            <div v-else class="collections-list">
              <q-list separator>
                <q-item
                  v-for="collection in collectionStore.collections"
                  :key="collection.id"
                  clickable
                  @click="selectCollection(collection)"
                  :class="{ 'bg-blue-1': collectionStore.currentCollection?.id === collection.id }"
                >
                  <q-item-section avatar>
                    <q-icon name="collections" />
                  </q-item-section>
                  
                  <q-item-section>
                    <q-item-label>{{ collection.name }}</q-item-label>
                    <q-item-label caption>
                      {{ collection.images?.length || 0 }} éléments
                    </q-item-label>
                    <q-item-label caption>
                      {{ formatDate(collection.updatedAt) }}
                    </q-item-label>
                  </q-item-section>
                  
                  <q-item-section side>
                    <q-btn-dropdown 
                      flat 
                      round 
                      icon="more_vert"
                      @click.stop
                    >
                      <q-list>
                        <q-item clickable @click="setCurrentCollection(collection.id)">
                          <q-item-section avatar>
                            <q-icon name="star" />
                          </q-item-section>
                          <q-item-section>Définir comme active</q-item-section>
                        </q-item>
                        
                        <q-item clickable @click="editCollection(collection)">
                          <q-item-section avatar>
                            <q-icon name="edit" />
                          </q-item-section>
                          <q-item-section>Éditer</q-item-section>
                        </q-item>
                        
                        <q-separator />
                        
                        <q-item clickable @click="deleteCollection(collection)" class="text-negative">
                          <q-item-section avatar>
                            <q-icon name="delete" />
                          </q-item-section>
                          <q-item-section>Supprimer</q-item-section>
                        </q-item>
                      </q-list>
                    </q-btn-dropdown>
                  </q-item-section>
                </q-item>
              </q-list>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- PANNEAU DROIT: Contenu de la collection -->
      <div class="col-8">
        <q-card flat bordered class="full-height">
          <q-card-section>
            <div v-if="collectionStore.currentCollection">
              <!-- Header de la collection -->
              <div class="row items-center q-mb-lg">
                <div class="col">
                  <div class="text-h6">{{ collectionStore.currentCollection.name }}</div>
                  <div class="text-body2 text-grey-7">{{ collectionStore.currentCollection.description }}</div>
                </div>
                
                <div class="col-auto">
                  <q-btn 
                    flat
                    round
                    icon="refresh" 
                    @click="refreshCurrentCollection"
                    :loading="loading"
                    class="q-mr-sm"
                  >
                    <q-tooltip>Rafraîchir la collection</q-tooltip>
                  </q-btn>

                  <q-chip 
                    v-if="collectionStore.serverCurrentCollection?.id === collectionStore.currentCollection?.id"
                    icon="star" 
                    color="orange" 
                    text-color="white"
                    class="q-mr-sm"
                  >
                    Collection active
                  </q-chip>
                  
                  <q-btn 
                    v-if="collectionStore.serverCurrentCollection?.id !== collectionStore.currentCollection?.id"
                    color="orange" 
                    icon="star" 
                    label="Définir comme active"
                    @click="setAsActiveCollection"
                    class="q-mr-sm"
                    unelevated
                  />
                  
                  <q-btn 
                    color="primary" 
                    icon="add" 
                    label="Ajouter des médias"
                    @click="showUploadDialog = true"
                    class="q-mr-sm"
                    unelevated
                  />
                  
                  <q-btn 
                    :color="selectionMode ? 'negative' : 'grey-6'"
                    :icon="selectionMode ? 'cancel' : 'checklist'"
                    :label="selectionMode ? 'Annuler' : 'Sélectionner'"
                    @click="toggleSelectionMode"
                    flat
                  />
                </div>
                
                <!-- Barre d'actions pour la sélection multiple -->
                <div v-if="selectionMode" class="q-mt-md q-pa-md bg-grey-1 rounded-borders">
                  <div class="row items-center q-gutter-md">
                    <div class="text-body2">
                      {{ selectedMedias.length }} média(s) sélectionné(s)
                    </div>
                    
                    <q-btn
                      color="primary"
                      icon="select_all"
                      label="Tout sélectionner"
                      @click="selectAllMedias"
                      size="sm"
                      flat
                    />
                    
                    <q-space />
                    
                    <q-btn
                      v-if="selectedMedias.length > 0"
                      color="orange"
                      icon="drive_file_move"
                      label="Déplacer"
                      @click="moveSelectedMedias"
                      size="sm"
                    />
                    
                    <q-btn
                      v-if="selectedMedias.length > 0"
                      color="negative"
                      icon="delete"
                      label="Supprimer"
                      @click="deleteSelectedMedias"
                      size="sm"
                    />
                  </div>
                </div>
              </div>

              <!-- Galerie des médias -->
              <div class="media-gallery">
                <!-- Statistiques discrètes -->
                <div class="q-mb-md text-caption text-grey-6" v-if="collectionStore.currentCollection">
                  {{ collectionStore.currentCollectionStats.total }} médias
                  <span class="q-mx-sm">•</span>
                  {{ collectionStore.currentCollectionStats.images }} images
                  <span class="q-mx-sm">•</span>  
                  {{ collectionStore.currentCollectionStats.videos }} vidéos
                </div>
                
                <div v-if="validMedias && validMedias.length > 0">
                  <div class="row q-col-gutter-md">
                    <div 
                      v-for="(media, index) in validMedias" 
                      :key="media.mediaId || index"
                      class="col-6 col-md-4 col-lg-3"
                    >
                      <q-card 
                        flat 
                        bordered 
                        class="media-item cursor-pointer"
                        :class="{ 'selected': selectionMode && isMediaSelected(media) }" 
                        @click="selectionMode ? toggleMediaSelection(media) : previewMedia(media)"
                      >
                        <div class="media-preview relative-position">
                          <!-- Checkbox de sélection -->
                          <q-checkbox
                            v-if="selectionMode"
                            :model-value="isMediaSelected(media)"
                            @update:model-value="toggleMediaSelection(media)"
                            class="absolute-top-left q-ma-xs"
                            style="z-index: 2;"
                            color="primary"
                            @click.stop
                          />
                          
                          <q-img
                            v-if="media.type === 'image'"
                            :src="getMediaUrl(media)"
                            :ratio="1"
                            spinner-color="primary"
                            class="rounded-borders"
                            fit="cover"
                          >
                            <template v-slot:error>
                              <div class="absolute-full flex flex-center bg-grey-3">
                                <q-icon name="broken_image" size="2rem" color="grey-6" />
                              </div>
                            </template>
                          </q-img>
                          
                          <div v-else-if="media.type === 'video'" class="video-preview">
                            <video 
                              :src="getMediaUrl(media)" 
                              class="full-width rounded-borders"
                              style="height: 150px; object-fit: cover;"
                            />
                            <div class="absolute-center">
                              <q-icon name="play_circle_filled" size="3rem" color="white" />
                            </div>
                          </div>
                        </div>
                        
                        <q-card-section>
                          <div class="text-caption">
                            {{ media.description || 'Sans description' }}
                          </div>
                          <div class="text-caption text-grey-6">
                            {{ formatDate(media.addedAt) }}
                          </div>
                        </q-card-section>
                        
                        <!-- Actions rapides -->
                        <q-card-actions align="right" class="q-pa-xs">
                          <q-btn 
                            flat 
                            round 
                            icon="download" 
                            size="sm"
                            @click.stop="downloadMedia(media)"
                          >
                            <q-tooltip>Télécharger</q-tooltip>
                          </q-btn>
                          
                          <q-btn 
                            flat 
                            round 
                            icon="delete" 
                            size="sm"
                            color="negative"
                            @click.stop="removeMediaFromCollection(media)"
                          >
                            <q-tooltip>Supprimer</q-tooltip>
                          </q-btn>
                        </q-card-actions>
                      </q-card>
                    </div>
                  </div>
                </div>
                
                <!-- Message si collection vide -->
                <div v-else class="text-center q-py-xl">
                  <q-icon name="collections" size="4rem" color="grey-4" class="q-mb-md" />
                  <div class="text-h6 text-grey-6 q-mb-sm">Collection vide</div>
                  <div class="text-body2 text-grey-5 q-mb-lg">
                    Commencez par ajouter des images ou vidéos à cette collection
                  </div>
                  <q-btn 
                    color="primary" 
                    icon="add" 
                    label="Ajouter des médias"
                    @click="showUploadDialog = true"
                    unelevated
                  />
                </div>
              </div>
            </div>
            
            <!-- Message si aucune collection sélectionnée -->
            <div v-else class="text-center q-py-xl">
              <q-icon name="collections" size="6rem" color="grey-4" class="q-mb-lg" />
              <div class="text-h5 text-grey-6 q-mb-sm">Sélectionnez une collection</div>
              <div class="text-body1 text-grey-5">
                Choisissez une collection dans la liste de gauche pour voir son contenu
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- DIALOG DE CRÉATION/ÉDITION DE COLLECTION -->
    <q-dialog v-model="showCollectionEditDialog" persistent>
      <q-card style="min-width: 400px">
        <q-card-section>
          <div class="text-h6">{{ editingCollection ? 'Éditer' : 'Créer' }} une collection</div>
        </q-card-section>
        
        <q-card-section class="q-pt-none">
          <q-input
            v-model="collectionForm.name"
            label="Nom de la collection"
            outlined
            autofocus
            :rules="[val => !!val || 'Le nom est requis']"
          />
          
          <q-input
            v-model="collectionForm.description"
            label="Description (optionnel)"
            outlined
            type="textarea"
            rows="3"
            class="q-mt-md"
          />
        </q-card-section>
        
        <q-card-actions align="right">
          <q-btn flat label="Annuler" @click="closeEditDialog" />
          <q-btn 
            color="primary" 
            label="Sauvegarder"
            @click="saveCollection"
            :loading="saving"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- DIALOG D'UPLOAD -->
    <q-dialog v-model="showUploadDialog">
      <CollectionImageUpload 
        v-if="collectionStore.currentCollection"
        :target-collection="collectionStore.currentCollection"
        @upload-complete="onUploadComplete"
        @close="showUploadDialog = false"
      />
    </q-dialog>

    <!-- DIALOG DE DÉPLACEMENT -->
    <q-dialog v-model="showMoveDialog">
      <q-card style="min-width: 400px">
        <q-card-section>
          <div class="text-h6">Déplacer les médias sélectionnés</div>
          <div class="text-caption">{{ selectedMedias.length }} média(s) sélectionné(s)</div>
        </q-card-section>
        
        <q-card-section>
          <q-select
            v-model="targetCollection"
            :options="availableCollections"
            option-label="name"
            option-value="id"
            label="Collection de destination"
            emit-value
            map-options
          />
        </q-card-section>
        
        <q-card-actions align="right">
          <q-btn flat label="Annuler" @click="showMoveDialog = false" />
          <q-btn 
            color="primary" 
            label="Déplacer"
            @click="confirmMoveMedias"
            :disable="!targetCollection"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- DIALOG DE PRÉVISUALISATION MÉDIA -->
    <q-dialog v-model="showMediaPreview" maximized class="media-preview-dialog">
      <q-card class="bg-black text-white">
        <!-- Header avec infos et contrôles -->
        <q-card-section class="row items-center q-pa-md bg-dark" style="position: absolute; top: 0; left: 0; right: 0; z-index: 1000;">
          <div class="col">
            <div class="text-h6" v-if="previewedMedia">{{ previewedMedia.description || 'Média sans description' }}</div>
            <div class="text-caption text-grey-4" v-if="validMedias.length > 1">
              {{ currentMediaIndex + 1 }} / {{ validMedias.length }}
            </div>
          </div>
          <div class="col-auto">
            <q-btn flat round icon="close" @click="showMediaPreview = false" />
          </div>
        </q-card-section>
        
        <!-- Contenu principal -->
        <q-card-section class="q-pa-none flex flex-center full-height" style="background: black;" v-if="previewedMedia">
          <div class="relative-position full-width full-height flex flex-center">
            <!-- Image ou vidéo -->
            <q-img
              v-if="previewedMedia.type === 'image'"
              :src="getMediaUrl(previewedMedia)"
              fit="contain"
              class="full-width full-height"
              style="max-height: 100vh;"
            >
              <template v-slot:error>
                <div class="absolute-full flex flex-center bg-grey-8">
                  <div class="text-center">
                    <q-icon name="broken_image" size="4rem" color="grey-4" />
                    <div class="text-h6 q-mt-md">Image non disponible</div>
                  </div>
                </div>
              </template>
            </q-img>
            
            <video 
              v-else-if="previewedMedia.type === 'video'"
              :src="getMediaUrl(previewedMedia)"
              controls
              class="full-width full-height"
              style="max-height: 100vh; object-fit: contain;"
            />
            
            <!-- Flèches de navigation -->
            <div v-if="validMedias.length > 1" class="navigation-arrows">
              <!-- Flèche gauche -->
              <q-btn
                v-if="currentMediaIndex > 0"
                fab
                color="white"
                text-color="black"
                icon="chevron_left"
                @click="navigateMedia(-1)"
                class="absolute-left q-ml-lg"
                style="top: 50%; transform: translateY(-50%); opacity: 0.8; width: 56px; height: 56px;"
              >
                <q-tooltip>Image précédente</q-tooltip>
              </q-btn>
              
              <!-- Flèche droite -->
              <q-btn
                v-if="currentMediaIndex < validMedias.length - 1"
                fab
                color="white"
                text-color="black"
                icon="chevron_right"
                @click="navigateMedia(1)"
                class="absolute-right q-mr-lg"
                style="top: 50%; transform: translateY(-50%); opacity: 0.8; width: 56px; height: 56px;"
              >
                <q-tooltip>Image suivante</q-tooltip>
              </q-btn>
            </div>
          </div>
        </q-card-section>
        
        <!-- Footer avec actions -->
        <q-card-actions class="bg-dark" style="position: absolute; bottom: 0; left: 0; right: 0;">
          <q-space />
          <q-btn 
            flat 
            icon="download" 
            label="Télécharger"
            @click="downloadMedia(previewedMedia)"
          />
          <q-btn 
            flat 
            icon="delete" 
            label="Supprimer"
            color="negative"
            @click="confirmDeleteMedia(previewedMedia)"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useQuasar } from 'quasar'
import { useCollectionStore } from 'src/stores/useCollectionStore'
import CollectionImageUpload from './CollectionImageUpload.vue'

// Composables
const $q = useQuasar()
const collectionStore = useCollectionStore()

// Reactive variables locales
const loading = ref(false)
const showCollectionEditDialog = ref(false)
const showUploadDialog = ref(false)
const showMediaPreview = ref(false)
const previewedMedia = ref(null)
const currentMediaIndex = ref(0)
const editingCollection = ref(null)
const saving = ref(false)

// Sélection multiple des médias
const selectedMedias = ref([])
const selectionMode = ref(false)
const showMoveDialog = ref(false)
const targetCollection = ref(null)

const collectionForm = ref({
  name: '',
  description: ''
})

// Functions
const formatDate = (date) => {
  return new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit', 
    year: 'numeric'
  })
}

const getMediaUrl = (media) => {
  if (!media.url) return ''
  
  // En développement avec proxy, utiliser directement l'URL relative
  // Le proxy Quasar redirigera automatiquement vers le backend
  return media.url
}

// Computed property pour filtrer les médias valides
const validMedias = computed(() => {
  if (!collectionStore.currentCollection?.images) return []
  
  // Pour l'instant, on retourne tous les médias
  // Plus tard on pourra ajouter une validation côté client
  return collectionStore.currentCollection.images
})

// Collections disponibles pour le déplacement (exclut la collection courante)
const availableCollections = computed(() => {
  if (!collectionStore.collections) return []
  return collectionStore.collections.filter(c => c.id !== collectionStore.currentCollection?.id)
})



const refreshCollections = async () => {
  await collectionStore.fetchCollections()
}



const selectCollection = async (collection) => {
  console.log('🎯 Collection sélectionnée pour visualisation:', collection.name, 'ID:', collection.id)
  await collectionStore.viewCollection(collection.id)
}

const setAsActiveCollection = async () => {
  if (collectionStore.currentCollection) {
    try {
      await collectionStore.setCurrentCollection(collectionStore.currentCollection.id)
      $q.notify({
        type: 'positive',
        message: `"${collectionStore.currentCollection.name}" définie comme collection active`,
        position: 'top'
      })
    } catch (error) {
      console.error('Erreur définition collection active:', error)
      $q.notify({
        type: 'negative',
        message: 'Erreur lors de la définition comme collection active',
        position: 'top'
      })
    }
  }
}

// Fonctions de sélection multiple
const toggleSelectionMode = () => {
  selectionMode.value = !selectionMode.value
  if (!selectionMode.value) {
    selectedMedias.value = []
  }
}

const toggleMediaSelection = (media) => {
  const index = selectedMedias.value.findIndex(m => m.mediaId === media.mediaId)
  if (index === -1) {
    selectedMedias.value.push(media)
  } else {
    selectedMedias.value.splice(index, 1)
  }
}

const selectAllMedias = () => {
  if (selectedMedias.value.length === validMedias.value.length) {
    selectedMedias.value = []
  } else {
    selectedMedias.value = [...validMedias.value]
  }
}

const isMediaSelected = (media) => {
  return selectedMedias.value.some(m => m.mediaId === media.mediaId)
}

const deleteSelectedMedias = () => {
  $q.dialog({
    title: 'Supprimer les médias sélectionnés',
    message: `Êtes-vous sûr de vouloir supprimer ${selectedMedias.value.length} média(s) de cette collection ?`,
    cancel: true,
    persistent: true
  }).onOk(async () => {
    try {
      console.log('🗑️ Début suppression de', selectedMedias.value.length, 'médias')
      console.log('Collection courante:', collectionStore.currentCollection.id)
      console.log('Médias à supprimer:', selectedMedias.value.map(m => ({ id: m.mediaId, url: m.url })))
      
      let successCount = 0
      for (const media of selectedMedias.value) {
        try {
          console.log(`🗑️ Suppression média ${media.mediaId} (URL: ${media.url})`)
          await collectionStore.removeMediaFromCollection(collectionStore.currentCollection.id, media.mediaId)
          console.log(`✅ Média ${media.mediaId} supprimé avec succès`)
          successCount++
        } catch (mediaError) {
          console.error(`❌ Erreur suppression média ${media.mediaId}:`, mediaError)
        }
      }
      
      // Recharger la collection courante avec ses médias mis à jour
      if (collectionStore.currentCollection) {
        console.log('🔄 Rechargement de la collection...')
        await collectionStore.viewCollection(collectionStore.currentCollection.id)
      }
      
      $q.notify({
        type: successCount === selectedMedias.value.length ? 'positive' : 'warning',
        message: `${successCount}/${selectedMedias.value.length} média(s) supprimé(s) de la collection`,
        position: 'top'
      })
      
      selectedMedias.value = []
      selectionMode.value = false
      
    } catch (error) {
      console.error('❌ Erreur générale suppression médias:', error)
      $q.notify({
        type: 'negative',
        message: 'Erreur lors de la suppression des médias',
        position: 'top'
      })
    }
  })
}

const moveSelectedMedias = () => {
  targetCollection.value = null
  showMoveDialog.value = true
}

const confirmMoveMedias = async () => {
  if (!targetCollection.value) return
  
  try {
    console.log('🔄 Déplacement de', selectedMedias.value.length, 'médias vers collection', targetCollection.value)
    
    let successCount = 0
    for (const media of selectedMedias.value) {
      try {
        console.log('Déplacement média:', media.mediaId, 'URL:', media.url)
        
        // 1. Ajouter à la collection de destination
        await collectionStore.addMediaToCollection(targetCollection.value, {
          url: media.url,
          mediaId: media.mediaId,
          description: media.description || ''
        })
        
        // 2. Supprimer de la collection courante
        await collectionStore.removeMediaFromCollection(collectionStore.currentCollection.id, media.mediaId)
        
        successCount++
      } catch (mediaError) {
        console.error('Erreur déplacement média individuel:', media.mediaId, mediaError)
      }
    }
    
    // Recharger la collection courante
    if (collectionStore.currentCollection) {
      await collectionStore.viewCollection(collectionStore.currentCollection.id)
    }
    
    $q.notify({
      type: successCount === selectedMedias.value.length ? 'positive' : 'warning',
      message: `${successCount}/${selectedMedias.value.length} média(s) déplacé(s)`
    })
    
    selectedMedias.value = []
    selectionMode.value = false
    showMoveDialog.value = false
    
  } catch (error) {
    console.error('Erreur déplacement médias:', error)
    $q.notify({
      type: 'negative',
      message: 'Erreur lors du déplacement des médias'
    })
  }
}



const showCreateCollectionDialog = () => {
  editingCollection.value = null
  collectionForm.value = {
    name: '',
    description: ''
  }
  showCollectionEditDialog.value = true
}

const editCollection = (collection) => {
  editingCollection.value = collection
  collectionForm.value = {
    name: collection.name,
    description: collection.description || ''
  }
  showCollectionEditDialog.value = true
}

const saveCollection = async () => {
  try {
    saving.value = true
    
    if (editingCollection.value) {
      // Mise à jour
      await collectionStore.updateCollection(editingCollection.value.id, collectionForm.value)
    } else {
      // Création
      const newCollection = await collectionStore.createCollection(collectionForm.value)
      
      // Si c'est la première collection, la définir comme courante
      if (collectionStore.collections.length === 1) {
        await collectionStore.setCurrentCollection(newCollection.id)
      }
    }
    
    closeEditDialog()
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

const closeEditDialog = () => {
  showCollectionEditDialog.value = false
  editingCollection.value = null
  collectionForm.value = { name: '', description: '' }
}

const deleteCollection = async (collection) => {
  $q.dialog({
    title: 'Confirmer la suppression',
    message: `Êtes-vous sûr de vouloir supprimer la collection "${collection.name}" ?`,
    cancel: true,
    persistent: true
  }).onOk(async () => {
    try {
      await collectionStore.deleteCollection(collection.id)
    } catch (error) {
      console.error('Erreur suppression collection:', error)
      $q.notify({
        type: 'negative',
        message: 'Erreur lors de la suppression'
      })
    }
  })
}

const previewMedia = (media) => {
  previewedMedia.value = media
  // Trouver l'index du média dans la liste
  currentMediaIndex.value = validMedias.value.findIndex(m => m.mediaId === media.mediaId)
  showMediaPreview.value = true
}

// Navigation entre les médias
const navigateMedia = (direction) => {
  const newIndex = currentMediaIndex.value + direction
  if (newIndex >= 0 && newIndex < validMedias.value.length) {
    currentMediaIndex.value = newIndex
    previewedMedia.value = validMedias.value[newIndex]
  }
}

// Fonction pour supprimer avec confirmation
const confirmDeleteMedia = (media) => {
  $q.dialog({
    title: 'Confirmer la suppression',
    message: `Êtes-vous sûr de vouloir supprimer ce média de la collection ?`,
    cancel: true,
    persistent: true
  }).onOk(() => {
    removeMediaFromCollection(media)
    // Fermer la prévisualisation si c'était le dernier média
    if (validMedias.value.length <= 1) {
      showMediaPreview.value = false
    } else {
      // Ajuster l'index si nécessaire
      if (currentMediaIndex.value >= validMedias.value.length - 1) {
        navigateMedia(-1)
      }
    }
  })
}

const downloadMedia = (media) => {
  const link = document.createElement('a')
  link.href = media.url
  link.download = media.description || 'media'
  link.click()
}

const removeMediaFromCollection = async (media) => {
  $q.dialog({
    title: 'Supprimer le média',
    message: 'Êtes-vous sûr de vouloir supprimer ce média de la collection ?',
    cancel: true,
    persistent: true
  }).onOk(async () => {
    try {
      await collectionStore.removeMediaFromCollection(collectionStore.currentCollection.id, media.mediaId)
      
      $q.notify({
        type: 'positive',
        message: 'Média supprimé de la collection'
      })
      
      await refreshCollections()
    } catch (error) {
      console.error('Erreur suppression média:', error)
      $q.notify({
        type: 'negative',
        message: 'Erreur lors de la suppression du média'
      })
    }
  })
}

const onUploadComplete = async () => {
  showUploadDialog.value = false
  
  // Recharger les collections ET la collection courante avec ses médias
  await collectionStore.fetchCollections()
  
  // Recharger spécifiquement la collection courante pour avoir les médias à jour
  if (collectionStore.currentCollection) {
    await collectionStore.setCurrentCollection(collectionStore.currentCollection.id)
  }
  
  $q.notify({
    type: 'positive',
    message: 'Médias ajoutés à la collection'
  })
}

// Fonction pour rafraîchir manuellement la collection courante
const refreshCurrentCollection = async () => {
  if (collectionStore.currentCollection) {
    loading.value = true
    
    // Recharger les collections ET la collection courante avec ses médias
    await collectionStore.fetchCollections()
    await collectionStore.setCurrentCollection(collectionStore.currentCollection.id)
    
    loading.value = false
    $q.notify({
      type: 'positive',
      message: 'Collection rafraîchie'
    })
  }
}

// Support clavier pour navigation
const handleKeyboard = (event) => {
  if (showMediaPreview.value) {
    if (event.key === 'ArrowLeft') {
      navigateMedia(-1)
    } else if (event.key === 'ArrowRight') {
      navigateMedia(1)
    } else if (event.key === 'Escape') {
      showMediaPreview.value = false
    }
  }
}

// Initialisation
onMounted(async () => {
  await collectionStore.initialize()
  
  // Ajouter les listeners pour le clavier
  document.addEventListener('keydown', handleKeyboard)
})

// Nettoyage
onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyboard)
})
</script>

<style scoped>
.collection-view {
  padding: 0;
}

.full-height {
  height: 100%;
}

.collections-list {
  max-height: 60vh;
  overflow-y: auto;
}

.media-gallery {
  max-height: 50vh;
  overflow-y: auto;
}

.media-item {
  transition: all 0.3s ease;
}

.media-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.media-preview {
  position: relative;
  overflow: hidden;
}

.video-preview {
  position: relative;
}

.video-preview .absolute-center {
  opacity: 0.8;
  transition: opacity 0.2s ease;
}

.video-preview:hover .absolute-center {
  opacity: 1;
}

.media-preview-dialog .q-dialog__backdrop {
  background: rgba(0, 0, 0, 0.9);
}

.navigation-arrows .q-btn {
  transition: opacity 0.3s ease;
}

.navigation-arrows .q-btn:hover {
  opacity: 1 !important;
}

/* Styles pour la sélection multiple */
.media-item.selected {
  border: 2px solid var(--q-primary);
  transform: scale(0.95);
}

.selection-overlay {
  background: rgba(25, 118, 210, 0.1);
}

.q-checkbox {
  background: rgba(255, 255, 255, 0.9);
  border-radius: 4px;
}
</style>