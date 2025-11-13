<template>
  <q-page class="q-pa-lg">
    <div class="q-mb-xl">
      <h3 class="q-mb-md">
        <q-icon name="bug_report" class="q-mr-sm" />
        Debug Collections & localStorage
      </h3>
      <q-separator />
    </div>

    <!-- État des collections -->
    <div class="row q-col-gutter-md q-mb-xl">
      <div class="col-md-6 col-12">
        <q-card class="full-height">
          <q-card-section>
            <h4 class="q-mb-sm">
              <q-icon name="folder" class="q-mr-sm" />
              État Collections
            </h4>
            
            <div class="q-mb-sm">
              <strong>Toutes les collections ({{ collections.length }}) :</strong>
              <q-list dense v-if="collections.length">
                <q-item v-for="collection in collections" :key="collection.id" dense>
                  <q-item-section>
                    <q-item-label>{{ collection.name }}</q-item-label>
                    <q-item-label caption>{{ collection.id }}</q-item-label>
                  </q-item-section>
                  <q-item-section side>
                    <q-btn 
                      size="sm" 
                      flat 
                      icon="radio_button_unchecked" 
                      @click="setCurrentCollection(collection.id)"
                      v-if="activeCollectionId !== collection.id"
                    />
                    <q-icon 
                      name="radio_button_checked" 
                      color="primary" 
                      v-else
                    />
                  </q-item-section>
                </q-item>
              </q-list>
              <p v-else class="text-grey-6">Aucune collection trouvée</p>
            </div>

            <q-separator class="q-my-md" />

            <div class="q-mb-sm">
              <strong>Collection active :</strong>
              <div v-if="activeCollection" class="q-mt-xs">
                <q-chip color="primary" text-color="white">
                  {{ activeCollection.name }}
                </q-chip>
                <br>
                <span class="text-caption">{{ activeCollection.id }}</span>
              </div>
              <p v-else class="text-grey-6">Aucune collection active</p>
            </div>

            <div class="q-mb-sm">
              <strong>Collection serveur :</strong>
              <div v-if="serverCurrentCollection" class="q-mt-xs">
                <q-chip color="secondary" text-color="white">
                  {{ serverCurrentCollection.name }}
                </q-chip>
                <br>
                <span class="text-caption">{{ serverCurrentCollection.id }}</span>
              </div>
              <p v-else class="text-grey-6">Aucune collection sur le serveur</p>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-md-6 col-12">
        <q-card class="full-height">
          <q-card-section>
            <h4 class="q-mb-sm">
              <q-icon name="storage" class="q-mr-sm" />
              localStorage
            </h4>
            
            <div class="q-mb-sm">
              <strong>Collection actuelle :</strong>
              <div class="q-mt-xs">
                <q-chip v-if="localStorageCurrentCollection" color="green" text-color="white">
                  {{ localStorageCurrentCollection }}
                </q-chip>
                <span v-else class="text-grey-6">Non définie</span>
              </div>
            </div>

            <div class="q-mb-sm">
              <strong>Collection par défaut :</strong>
              <div class="q-mt-xs">
                <q-chip v-if="localStorageDefaultCollection" color="orange" text-color="white">
                  {{ localStorageDefaultCollection }}
                </q-chip>
                <span v-else class="text-grey-6">Non définie</span>
              </div>
            </div>

            <q-separator class="q-my-md" />

            <div class="q-mb-sm">
              <strong>Autres clés Slufe :</strong>
              <q-list dense v-if="otherSlufeKeys.length">
                <q-item v-for="key in otherSlufeKeys" :key="key.name" dense>
                  <q-item-section>
                    <q-item-label>{{ key.name }}</q-item-label>
                    <q-item-label caption>{{ key.size }}</q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>
              <p v-else class="text-grey-6">Aucune autre clé</p>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Actions de test -->
    <q-card class="q-mb-xl">
      <q-card-section>
        <h4 class="q-mb-md">
          <q-icon name="play_arrow" class="q-mr-sm" />
          Actions de test
        </h4>

        <div class="row q-col-gutter-md">
          <div class="col-auto">
            <q-btn 
              color="primary" 
              icon="refresh" 
              label="Actualiser collections"
              @click="refreshCollections"
              :loading="loading"
            />
          </div>
          
          <div class="col-auto">
            <q-btn 
              color="secondary" 
              icon="refresh" 
              label="Actualiser localStorage"
              @click="refreshLocalStorage"
            />
          </div>
          
          <div class="col-auto">
            <q-btn 
              color="warning" 
              icon="clear_all" 
              label="Vider localStorage Collections"
              @click="clearCollectionStorage"
            />
          </div>

          <div class="col-auto">
            <q-btn 
              color="info" 
              icon="sync" 
              label="Réinitialiser collections"
              @click="reinitializeCollections"
              :loading="initializing"
            />
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- Logs -->
    <q-card>
      <q-card-section>
        <h4 class="q-mb-md">
          <q-icon name="terminal" class="q-mr-sm" />
          Logs de debug
          <q-btn 
            flat 
            round 
            dense 
            icon="clear" 
            size="sm" 
            @click="logs = []"
            class="q-ml-sm"
          />
        </h4>

        <div class="debug-logs" style="max-height: 300px; overflow-y: auto;">
          <div 
            v-for="(log, index) in logs" 
            :key="index"
            :class="`log-${log.type}`"
            class="q-mb-xs q-pa-sm rounded-borders"
            style="font-family: monospace; font-size: 12px;"
          >
            <span class="text-grey-7">[{{ log.time }}]</span>
            <span :class="`text-${log.color || 'black'}`">{{ log.message }}</span>
          </div>
          <div v-if="!logs.length" class="text-grey-6 text-center q-pa-md">
            Aucun log pour le moment
          </div>
        </div>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useCollectionStore } from 'src/stores/useCollectionStore'
import { useQuasar } from 'quasar'

const $q = useQuasar()
const collectionStore = useCollectionStore()

// État réactif
const localStorageCurrentCollection = ref('')
const localStorageDefaultCollection = ref('')
const otherSlufeKeys = ref([])
const logs = ref([])
const loading = ref(false)
const initializing = ref(false)

// Computed du store
const collections = computed(() => collectionStore.collections)
const activeCollection = computed(() => collectionStore.activeCollection)
const activeCollectionId = computed(() => collectionStore.activeCollectionId)
const serverCurrentCollection = computed(() => collectionStore.serverCurrentCollection)

// Constantes localStorage
const STORAGE_KEYS = {
  CURRENT_COLLECTION_ID: 'slufe_current_collection_id',
  DEFAULT_COLLECTION_ID: 'slufe_default_collection_id'
}

// Fonction de log
const addLog = (message, type = 'info', color = 'black') => {
  logs.value.unshift({
    time: new Date().toLocaleTimeString(),
    message,
    type,
    color
  })
  
  // Limiter à 50 logs
  if (logs.value.length > 50) {
    logs.value = logs.value.slice(0, 50)
  }
}

// Lire le localStorage
const refreshLocalStorage = () => {
  try {
    localStorageCurrentCollection.value = localStorage.getItem(STORAGE_KEYS.CURRENT_COLLECTION_ID) || ''
    localStorageDefaultCollection.value = localStorage.getItem(STORAGE_KEYS.DEFAULT_COLLECTION_ID) || ''
    
    // Autres clés Slufe
    const slufeKeys = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key.startsWith('slufe_') && !Object.values(STORAGE_KEYS).includes(key)) {
        const value = localStorage.getItem(key)
        const size = new Blob([value]).size
        slufeKeys.push({
          name: key,
          size: `${size} bytes`
        })
      }
    }
    otherSlufeKeys.value = slufeKeys
    
    addLog(`localStorage actualisé - Current: ${localStorageCurrentCollection.value || 'vide'}, Default: ${localStorageDefaultCollection.value || 'vide'}`, 'info', 'blue')
  } catch (error) {
    addLog(`Erreur lecture localStorage: ${error.message}`, 'error', 'red')
  }
}

// Actualiser les collections
const refreshCollections = async () => {
  loading.value = true
  try {
    await collectionStore.fetchCollections()
    await collectionStore.fetchCurrentCollection()
    addLog('Collections actualisées depuis le serveur', 'success', 'green')
  } catch (error) {
    addLog(`Erreur actualisation collections: ${error.message}`, 'error', 'red')
  } finally {
    loading.value = false
  }
}

// Définir collection courante
const setCurrentCollection = async (collectionId) => {
  try {
    await collectionStore.setCurrentCollection(collectionId)
    refreshLocalStorage()
    addLog(`Collection définie: ${collectionId}`, 'success', 'green')
  } catch (error) {
    addLog(`Erreur définition collection: ${error.message}`, 'error', 'red')
  }
}

// Vider le localStorage des collections
const clearCollectionStorage = () => {
  try {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_COLLECTION_ID)
    localStorage.removeItem(STORAGE_KEYS.DEFAULT_COLLECTION_ID)
    refreshLocalStorage()
    addLog('localStorage collections vidé', 'warning', 'orange')
    
    $q.notify({
      type: 'warning',
      message: 'localStorage des collections vidé',
      icon: 'cleaning_services'
    })
  } catch (error) {
    addLog(`Erreur nettoyage localStorage: ${error.message}`, 'error', 'red')
  }
}

// Réinitialiser complètement
const reinitializeCollections = async () => {
  initializing.value = true
  try {
    addLog('Début réinitialisation complète...', 'info', 'purple')
    
    // Vider localStorage
    clearCollectionStorage()
    
    // Réinitialiser le store
    await collectionStore.initialize()
    
    refreshLocalStorage()
    addLog('Réinitialisation terminée', 'success', 'green')
    
    $q.notify({
      type: 'positive',
      message: 'Collections réinitialisées',
      icon: 'done'
    })
  } catch (error) {
    addLog(`Erreur réinitialisation: ${error.message}`, 'error', 'red')
  } finally {
    initializing.value = false
  }
}

// Écouter les changements localStorage
let storageListener
const setupStorageListener = () => {
  storageListener = (e) => {
    if (e.key && e.key.startsWith('slufe_')) {
      addLog(`Changement localStorage: ${e.key} = ${e.newValue}`, 'info', 'blue')
      refreshLocalStorage()
    }
  }
  window.addEventListener('storage', storageListener)
}

// Initialisation
onMounted(() => {
  addLog('Page debug collections chargée', 'info', 'black')
  refreshLocalStorage()
  setupStorageListener()
})

onUnmounted(() => {
  if (storageListener) {
    window.removeEventListener('storage', storageListener)
  }
})
</script>

<style scoped>
.log-info {
  background-color: #f8f9fa;
  border-left: 3px solid #007bff;
}

.log-success {
  background-color: #d4edda;
  border-left: 3px solid #28a745;
}

.log-warning {
  background-color: #fff3cd;
  border-left: 3px solid #ffc107;
}

.log-error {
  background-color: #f8d7da;
  border-left: 3px solid #dc3545;
}

.debug-logs {
  background-color: #f8f9fa;
  border-radius: 4px;
  border: 1px solid #dee2e6;
  padding: 8px;
}
</style>