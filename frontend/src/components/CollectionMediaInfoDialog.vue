<template>
  <q-card style="min-width: 500px; max-width: 700px">
    <q-card-section>
      <div class="text-h6">Informations du média</div>
    </q-card-section>

    <q-card-section v-if="media">
      <!-- Preview miniature -->
      <div class="row q-gutter-md q-mb-md">
        <div class="col-auto">
          <div class="media-thumbnail">
            <q-img
              v-if="media.type === 'image'"
              :src="media.url"
              width="120px"
              height="120px"
              fit="cover"
              class="rounded-borders"
            />
            <div 
              v-else
              class="thumbnail-placeholder flex items-center justify-center rounded-borders"
            >
              <q-icon 
                :name="getMediaIcon(media.type)" 
                :color="getMediaColor(media.type)"
                size="3em"
              />
            </div>
          </div>
        </div>

        <div class="col">
          <div class="text-h6 q-mb-sm">{{ media.originalName || media.filename }}</div>
          <div class="text-caption text-grey-6">
            ID: {{ media.id }}
          </div>
          <div class="text-body2 q-mt-sm">
            <q-chip 
              :color="getMediaColor(media.type)" 
              text-color="white" 
              size="sm"
            >
              {{ media.type.toUpperCase() }}
            </q-chip>
            <q-chip 
              color="grey-6" 
              text-color="white" 
              size="sm"
              class="q-ml-sm"
            >
              {{ formatFileSize(media.size) }}
            </q-chip>
          </div>
        </div>
      </div>

      <!-- Informations détaillées -->
      <q-list>
        <!-- Informations de base -->
        <q-expansion-item 
          default-opened
          icon="info"
          label="Informations de base"
          header-class="text-weight-medium"
        >
          <q-card flat>
            <q-card-section class="q-pt-none">
              <div class="info-grid">
                <div class="info-row">
                  <span class="info-label">Nom original:</span>
                  <span class="info-value">{{ media.originalName || 'N/A' }}</span>
                </div>
                
                <div class="info-row">
                  <span class="info-label">Nom de fichier:</span>
                  <span class="info-value">{{ media.filename || 'N/A' }}</span>
                </div>
                
                <div class="info-row">
                  <span class="info-label">Type MIME:</span>
                  <span class="info-value">{{ media.mimeType || 'N/A' }}</span>
                </div>
                
                <div class="info-row">
                  <span class="info-label">Taille:</span>
                  <span class="info-value">{{ formatFileSize(media.size) }} ({{ media.size?.toLocaleString() }} bytes)</span>
                </div>
                
                <div class="info-row" v-if="media.dimensions">
                  <span class="info-label">Dimensions:</span>
                  <span class="info-value">{{ media.dimensions.width }} × {{ media.dimensions.height }} pixels</span>
                </div>

                <div class="info-row" v-if="media.duration">
                  <span class="info-label">Durée:</span>
                  <span class="info-value">{{ formatDuration(media.duration) }}</span>
                </div>
              </div>
            </q-card-section>
          </q-card>
        </q-expansion-item>

        <!-- Métadonnées techniques -->
        <q-expansion-item 
          icon="settings"
          label="Métadonnées techniques"
          header-class="text-weight-medium"
          v-if="hastechnicalMetadata"
        >
          <q-card flat>
            <q-card-section class="q-pt-none">
              <div class="info-grid">
                <div class="info-row" v-if="media.format">
                  <span class="info-label">Format:</span>
                  <span class="info-value">{{ media.format }}</span>
                </div>
                
                <div class="info-row" v-if="media.quality">
                  <span class="info-label">Qualité:</span>
                  <span class="info-value">{{ media.quality }}</span>
                </div>
                
                <div class="info-row" v-if="media.colorSpace">
                  <span class="info-label">Espace colorimétrique:</span>
                  <span class="info-value">{{ media.colorSpace }}</span>
                </div>
                
                <div class="info-row" v-if="media.bitrate">
                  <span class="info-label">Débit:</span>
                  <span class="info-value">{{ media.bitrate }} kbps</span>
                </div>

                <div class="info-row" v-if="media.compression">
                  <span class="info-label">Compression:</span>
                  <span class="info-value">{{ media.compression }}</span>
                </div>
              </div>
            </q-card-section>
          </q-card>
        </q-expansion-item>

        <!-- Informations d'usage -->
        <q-expansion-item 
          icon="analytics"
          label="Statistiques d'utilisation"
          header-class="text-weight-medium"
        >
          <q-card flat>
            <q-card-section class="q-pt-none">
              <div class="info-grid">
                <div class="info-row">
                  <span class="info-label">Nombre d'utilisations:</span>
                  <span class="info-value">{{ media.usageCount || 0 }}×</span>
                </div>
                
                <div class="info-row">
                  <span class="info-label">Date d'upload:</span>
                  <span class="info-value">{{ formatDate(media.uploadedAt) }}</span>
                </div>
                
                <div class="info-row" v-if="media.lastUsed">
                  <span class="info-label">Dernière utilisation:</span>
                  <span class="info-value">{{ formatDate(media.lastUsed) }}</span>
                </div>
                
                <div class="info-row" v-if="media.addedToStore">
                  <span class="info-label">Ajouté au store:</span>
                  <span class="info-value">{{ formatDate(media.addedToStore) }}</span>
                </div>
              </div>
            </q-card-section>
          </q-card>
        </q-expansion-item>

        <!-- URLs et accès -->
        <q-expansion-item 
          icon="link"
          label="URLs et accès"
          header-class="text-weight-medium"
        >
          <q-card flat>
            <q-card-section class="q-pt-none">
              <div class="info-grid">
                <div class="info-row">
                  <span class="info-label">URL publique:</span>
                  <span class="info-value text-truncate">
                    <q-btn 
                      :label="media.url" 
                      flat 
                      dense 
                      color="primary"
                      @click="copyToClipboard(media.url)"
                      class="q-pa-none"
                      style="text-transform: none; justify-content: flex-start;"
                    />
                  </span>
                </div>
                
                <div class="info-row">
                  <span class="info-label">Chemin serveur:</span>
                  <span class="info-value">{{ media.path || 'N/A' }}</span>
                </div>
              </div>
            </q-card-section>
          </q-card>
        </q-expansion-item>

        <!-- Métadonnées personnalisées -->
        <q-expansion-item 
          icon="extension"
          label="Métadonnées personnalisées"
          header-class="text-weight-medium"
          v-if="hasCustomMetadata"
        >
          <q-card flat>
            <q-card-section class="q-pt-none">
              <div class="info-grid">
                <div 
                  v-for="(value, key) in customMetadata" 
                  :key="key"
                  class="info-row"
                >
                  <span class="info-label">{{ formatLabel(key) }}:</span>
                  <span class="info-value">{{ formatValue(value) }}</span>
                </div>
              </div>
            </q-card-section>
          </q-card>
        </q-expansion-item>
      </q-list>
    </q-card-section>

    <q-card-actions align="right">
      <q-btn 
        label="Copier ID" 
        flat 
        @click="copyToClipboard(media.id)"
        class="q-mr-sm"
      />
      <q-btn 
        label="Télécharger" 
        flat 
        icon="download"
        @click="downloadMedia"
        class="q-mr-sm"
      />
      <q-btn 
        label="Fermer" 
        color="primary"
        @click="$emit('close')"
      />
    </q-card-actions>
  </q-card>
</template>

<script setup>
import { computed } from 'vue'
import { useQuasar } from 'quasar'

// Props
const props = defineProps({
  media: {
    type: Object,
    required: true
  }
})

// Émissions
const emit = defineEmits(['close'])

// Quasar
const $q = useQuasar()

// Computed
const hastechnicalMetadata = computed(() => {
  return props.media?.format || 
         props.media?.quality || 
         props.media?.colorSpace || 
         props.media?.bitrate || 
         props.media?.compression
})

const hasCustomMetadata = computed(() => {
  const standardKeys = [
    'id', 'filename', 'originalName', 'url', 'path', 'size', 'type', 'mimeType',
    'dimensions', 'duration', 'format', 'quality', 'colorSpace', 'bitrate', 
    'compression', 'usageCount', 'uploadedAt', 'lastUsed', 'addedToStore'
  ]
  
  return props.media && Object.keys(props.media).some(key => !standardKeys.includes(key))
})

const customMetadata = computed(() => {
  if (!props.media) return {}
  
  const standardKeys = [
    'id', 'filename', 'originalName', 'url', 'path', 'size', 'type', 'mimeType',
    'dimensions', 'duration', 'format', 'quality', 'colorSpace', 'bitrate',
    'compression', 'usageCount', 'uploadedAt', 'lastUsed', 'addedToStore'
  ]
  
  const custom = {}
  Object.keys(props.media).forEach(key => {
    if (!standardKeys.includes(key)) {
      custom[key] = props.media[key]
    }
  })
  
  return custom
})

// Méthodes
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

function formatFileSize(bytes) {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

function formatDate(dateString) {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

function formatDuration(seconds) {
  if (!seconds) return 'N/A'
  
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  
  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`
  } else {
    return `${secs}s`
  }
}

function formatLabel(key) {
  // Convertit camelCase en format lisible
  return key.replace(/([A-Z])/g, ' $1')
            .replace(/^./, str => str.toUpperCase())
            .trim()
}

function formatValue(value) {
  if (value === null || value === undefined) return 'N/A'
  if (typeof value === 'object') return JSON.stringify(value, null, 2)
  return String(value)
}

async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text)
    $q.notify({
      type: 'positive',
      message: 'Copié dans le presse-papiers',
      timeout: 2000
    })
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: 'Impossible de copier',
      timeout: 2000
    })
  }
}

function downloadMedia() {
  if (!props.media?.url) return
  
  const link = document.createElement('a')
  link.href = props.media.url
  link.download = props.media.originalName || props.media.filename || 'media'
  link.target = '_blank'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  $q.notify({
    type: 'positive',
    message: 'Téléchargement démarré',
    timeout: 2000
  })
}
</script>

<style scoped>
.media-thumbnail {
  width: 120px;
  height: 120px;
}

.thumbnail-placeholder {
  width: 120px;
  height: 120px;
  background: #f5f5f5;
  border: 1px solid #e0e0e0;
}

.info-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-row {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-label {
  font-weight: 500;
  color: #666;
  font-size: 13px;
}

.info-value {
  font-weight: 400;
  color: #333;
  word-break: break-word;
}

.text-truncate {
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Responsive */
@media (min-width: 600px) {
  .info-row {
    flex-direction: row;
    align-items: center;
  }
  
  .info-label {
    min-width: 150px;
    flex-shrink: 0;
  }
}
</style>