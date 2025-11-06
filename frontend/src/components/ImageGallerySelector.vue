<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide" maximized>
    <q-card class="q-dialog-plugin">
      <!-- Header -->
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">{{ title }}</div>
        <q-space />
        <q-btn icon="close" flat round dense @click="onCancelClick" />
      </q-card-section>

      <!-- Barre de recherche et filtres -->
      <q-card-section>
        <div class="row q-col-gutter-md items-center">
          <div class="col-md-6">
            <q-input
              v-model="searchText"
              placeholder="Rechercher une image..."
              outlined
              dense
              clearable
            >
              <template v-slot:prepend>
                <q-icon name="search" />
              </template>
            </q-input>
          </div>
          <div class="col-auto">
            <q-chip outline>
              {{ filteredImages.length }} image{{ filteredImages.length > 1 ? 's' : '' }}
            </q-chip>
          </div>
        </div>
      </q-card-section>

      <!-- Galerie d'images -->
      <q-card-section class="q-pt-none" style="max-height: 70vh; overflow-y: auto;">
        <div v-if="filteredImages.length === 0" class="text-center q-py-xl">
          <q-icon name="image_not_supported" size="4rem" class="text-grey-5 q-mb-md" />
          <div class="text-h6 text-grey-6">Aucune image trouvée</div>
          <div class="text-body2 text-grey-5">
            {{ searchText ? 'Essayez un autre terme de recherche' : 'Aucune image disponible dans cette collection' }}
          </div>
        </div>

        <div v-else class="row q-col-gutter-md">
          <div
            v-for="image in filteredImages"
            :key="image.mediaId"
            class="col-12 col-sm-6 col-md-4 col-lg-3"
          >
            <q-card
              flat
              bordered
              class="image-card cursor-pointer relative-position"
              :class="{ 'selected': selectedImageId === image.mediaId }"
              @click="selectImage(image)"
            >
              <!-- Image -->
              <q-img
                :src="image.url"
                :ratio="1"
                fit="cover"
                class="rounded-borders"
                spinner-color="primary"
              >
                <!-- Indicateur de sélection -->
                <div v-if="selectedImageId === image.mediaId" class="absolute-full bg-primary-alpha flex flex-center">
                  <q-icon name="check_circle" size="3rem" color="white" />
                </div>
                
                <!-- Overlay avec info -->
                <div class="absolute-bottom bg-black-alpha text-white q-pa-sm">
                  <div class="text-body2 text-weight-medium ellipsis">
                    {{ image.description || `Image ${image.mediaId.slice(0, 8)}` }}
                  </div>
                  <div class="text-caption">
                    {{ formatFileSize(image.size) }}
                    <span v-if="image.usageCount > 0"> • {{ image.usageCount }} utilisations</span>
                  </div>
                </div>
              </q-img>
            </q-card>
          </div>
        </div>
      </q-card-section>

      <!-- Actions -->
      <q-card-actions align="right" class="q-pa-md">
        <q-btn flat label="Annuler" @click="onCancelClick" />
        <q-btn 
          unelevated 
          color="primary" 
          label="Sélectionner" 
          @click="onOKClick"
          :disable="!selectedImageId"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useDialogPluginComponent } from 'quasar'

// Props
const props = defineProps({
  images: {
    type: Array,
    required: true
  },
  selectedImage: {
    type: String,
    default: null
  },
  title: {
    type: String,
    default: 'Sélectionner une image'
  }
})

// Dialog plugin setup
defineEmits([
  ...useDialogPluginComponent.emits
])

const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } = useDialogPluginComponent()

// Reactive variables
const searchText = ref('')
const selectedImageId = ref(null)

// Trouver l'image initialement sélectionnée
if (props.selectedImage) {
  const initialImage = props.images.find(img => img.url === props.selectedImage)
  if (initialImage) {
    selectedImageId.value = initialImage.mediaId
  }
}

// Computed
const filteredImages = computed(() => {
  if (!searchText.value) return props.images
  
  const search = searchText.value.toLowerCase()
  return props.images.filter(image => {
    return (image.description || '').toLowerCase().includes(search) ||
           image.mediaId.toLowerCase().includes(search)
  })
})

// Methods
const selectImage = (image) => {
  selectedImageId.value = image.mediaId
}

const onOKClick = () => {
  const selectedImage = props.images.find(img => img.mediaId === selectedImageId.value)
  onDialogOK(selectedImage)
}

const onCancelClick = onDialogCancel

const formatFileSize = (bytes) => {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}
</script>

<style scoped>
.image-card {
  transition: all 0.2s ease;
}

.image-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.image-card.selected {
  border-color: var(--q-primary);
  border-width: 2px;
}

.bg-primary-alpha {
  background: rgba(25, 118, 210, 0.7);
}

.bg-black-alpha {
  background: rgba(0, 0, 0, 0.6);
}

.ellipsis {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>