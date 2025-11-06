<template>
  <q-card style="min-width: 400px">
    <q-card-section>
      <div class="text-h6">Rechercher des médias</div>
    </q-card-section>

    <q-card-section>
      <!-- Barre de recherche -->
      <q-input
        v-model="searchQuery"
        label="Rechercher..."
        placeholder="Nom de fichier, type, ID..."
        filled
        clearable
        @keyup.enter="performSearch"
      >
        <template #prepend>
          <q-icon name="search" />
        </template>
        
        <template #append>
          <q-btn 
            icon="search" 
            flat 
            round 
            dense
            @click="performSearch"
          />
        </template>
      </q-input>

      <!-- Filtres avancés -->
      <q-expansion-item 
        label="Filtres avancés"
        icon="filter_list"
        class="q-mt-md"
      >
        <q-card flat>
          <q-card-section>
            <div class="row q-gutter-md">
              <!-- Type de média -->
              <div class="col-12 col-md-6">
                <q-select
                  v-model="filters.type"
                  label="Type de média"
                  :options="typeOptions"
                  clearable
                  filled
                  emit-value
                  map-options
                />
              </div>

              <!-- Taille -->
              <div class="col-12 col-md-6">
                <q-select
                  v-model="filters.sizeRange"
                  label="Taille"
                  :options="sizeOptions"
                  clearable
                  filled
                  emit-value
                  map-options
                />
              </div>

              <!-- Date -->
              <div class="col-12">
                <q-input
                  v-model="filters.dateRange"
                  label="Période"
                  filled
                  clearable
                >
                  <template #append>
                    <q-icon name="event" class="cursor-pointer">
                      <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                        <q-date v-model="filters.dateRange" range>
                          <div class="row items-center justify-end">
                            <q-btn v-close-popup label="Fermer" color="primary" flat />
                          </div>
                        </q-date>
                      </q-popup-proxy>
                    </q-icon>
                  </template>
                </q-input>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </q-expansion-item>

      <!-- Résultats de recherche rapide -->
      <div v-if="quickResults.length > 0" class="q-mt-md">
        <div class="text-subtitle2 q-mb-sm">Correspondances rapides:</div>
        <div class="quick-results">
          <q-chip
            v-for="result in quickResults.slice(0, 5)"
            :key="result.id"
            :label="result.originalName || result.filename"
            clickable
            @click="selectQuickResult(result)"
            class="q-mr-xs q-mb-xs"
          >
            <q-avatar>
              <q-icon :name="getMediaIcon(result.type)" />
            </q-avatar>
          </q-chip>
        </div>
      </div>
    </q-card-section>

    <q-card-actions align="right">
      <q-btn 
        label="Annuler" 
        flat 
        @click="$emit('close')"
      />
      <q-btn 
        label="Rechercher" 
        color="primary"
        @click="performSearch"
        :disable="!searchQuery && !hasFilters"
      />
      <q-btn 
        label="Réinitialiser" 
        outline
        @click="resetSearch"
      />
    </q-card-actions>
  </q-card>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useCollectionStore } from 'src/stores/useCollectionStore'

// Émissions
const emit = defineEmits(['search', 'close'])

// Store
const collectionStore = useCollectionStore()

// État local
const searchQuery = ref('')
const filters = ref({
  type: null,
  sizeRange: null,
  dateRange: null
})

// Options pour les selects
const typeOptions = [
  { label: 'Images', value: 'image' },
  { label: 'Vidéos', value: 'video' },
  { label: 'Audio', value: 'audio' }
]

const sizeOptions = [
  { label: 'Moins de 1 MB', value: 'small' },
  { label: '1 MB - 10 MB', value: 'medium' },
  { label: '10 MB - 50 MB', value: 'large' },
  { label: 'Plus de 50 MB', value: 'xlarge' }
]

// Computed
const hasFilters = computed(() => {
  return filters.value.type || 
         filters.value.sizeRange || 
         filters.value.dateRange
})

const quickResults = computed(() => {
  if (!searchQuery.value || searchQuery.value.length < 2) return []
  return collectionStore.searchMedias(searchQuery.value)
})

// Watchers - Recherche en temps réel
watch(searchQuery, (newQuery) => {
  if (newQuery && newQuery.length >= 2) {
    // Recherche automatique après 500ms
    clearTimeout(searchTimeout.value)
    searchTimeout.value = setTimeout(() => {
      performQuickSearch()
    }, 500)
  }
})

const searchTimeout = ref(null)

// Méthodes
function performQuickSearch() {
  // La recherche rapide se fait via le computed quickResults
  // Rien à faire ici, juste pour l'interface
}

function performSearch() {
  const searchParams = {
    query: searchQuery.value,
    ...buildFilters()
  }
  
  emit('search', searchParams.query || '')
  emit('close')
}

function buildFilters() {
  const filterParams = {}
  
  if (filters.value.type) {
    filterParams.type = filters.value.type
  }
  
  if (filters.value.sizeRange) {
    const sizeRanges = {
      small: { maxSize: 1024 * 1024 },
      medium: { minSize: 1024 * 1024, maxSize: 10 * 1024 * 1024 },
      large: { minSize: 10 * 1024 * 1024, maxSize: 50 * 1024 * 1024 },
      xlarge: { minSize: 50 * 1024 * 1024 }
    }
    
    Object.assign(filterParams, sizeRanges[filters.value.sizeRange] || {})
  }
  
  if (filters.value.dateRange) {
    // Gérer les plages de dates
    if (typeof filters.value.dateRange === 'object' && filters.value.dateRange.from) {
      filterParams.dateFrom = filters.value.dateRange.from
      filterParams.dateTo = filters.value.dateRange.to
    }
  }
  
  return filterParams
}

function selectQuickResult(media) {
  searchQuery.value = media.originalName || media.filename
}

function resetSearch() {
  searchQuery.value = ''
  filters.value = {
    type: null,
    sizeRange: null,
    dateRange: null
  }
  
  emit('search', '')
}

function getMediaIcon(type) {
  switch (type) {
    case 'image': return 'image'
    case 'video': return 'videocam'
    case 'audio': return 'audiotrack'
    default: return 'insert_drive_file'
  }
}
</script>

<style scoped>
.quick-results {
  max-height: 120px;
  overflow-y: auto;
}
</style>