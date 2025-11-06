<template>
  <div class="template-manager q-pa-md">
    <!-- Header -->
    <div class="row items-center q-mb-md">
      <div>
        <div class="text-h5">
          <q-icon name="dashboard" class="q-mr-sm" />
          Gestionnaire de Templates
        </div>
        <div class="text-caption text-grey-6">
          Les templates sont des workflows réutilisables avec des inputs/outputs vierges
        </div>
      </div>
      <q-space />
      <q-btn
        color="grey-7"
        icon="refresh"
        label="Actualiser"
        @click="refreshTemplates"
        flat
        :loading="loading"
        class="q-mr-sm"
      />
      <q-btn
        color="secondary"
        icon="file_upload"
        label="Importer"
        @click="importTemplateDialog"
        unelevated
        class="q-mr-sm"
      />
    </div>

    <!-- Filtres et recherche -->
    <div class="row q-col-gutter-md q-mb-md">
      <div class="col-12 col-md-8">
        <q-input
          v-model="searchQuery"
          placeholder="Rechercher un template..."
          outlined
          dense
        >
          <template #prepend>
            <q-icon name="search" />
          </template>
          <template #append>
            <q-btn
              v-if="searchQuery"
              flat
              round
              dense
              icon="clear"
              @click="searchQuery = ''"
            />
          </template>
        </q-input>
      </div>
      <div class="col-12 col-md-4">
        <q-select
          v-model="selectedCategory"
          :options="categoryOptions"
          label="Catégorie"
          outlined
          dense
        >
          <template #prepend>
            <q-icon name="category" />
          </template>
        </q-select>
      </div>
    </div>

    <!-- Statistiques -->
    <div class="row q-col-gutter-sm q-mb-md">
      <div class="col">
        <q-card flat bordered>
          <q-card-section class="text-center">
            <div class="text-h6 text-primary">{{ templateStore.totalCount }}</div>
            <div class="text-caption text-grey-6">Templates</div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col">
        <q-card flat bordered>
          <q-card-section class="text-center">
            <div class="text-h6 text-secondary">{{ templateStore.categories.length }}</div>
            <div class="text-caption text-grey-6">Catégories</div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Liste des templates -->
    <div v-if="loading && templates.length === 0" class="text-center q-py-xl">
      <q-spinner color="primary" size="3rem" />
      <div class="text-grey-6 q-mt-md">Chargement des templates...</div>
    </div>

    <div v-else-if="filteredTemplates.length === 0" class="text-center q-py-xl">
      <q-icon name="dashboard" size="4rem" color="grey-5" />
      <div class="text-h6 text-grey-6 q-mt-md">
        {{ searchQuery || selectedCategory !== 'all' ? 'Aucun template trouvé' : 'Aucun template disponible' }}
      </div>
      <div class="text-caption text-grey-5">
        {{ searchQuery || selectedCategory !== 'all' ? 'Essayez d\'ajuster les filtres' : 'Créez votre premier template depuis le WorkflowManager' }}
      </div>
    </div>

    <div v-else class="row q-col-gutter-md">
      <div
        v-for="template in filteredTemplates"
        :key="template.id"
        class="col-12 col-sm-6 col-md-4"
      >
        <q-card flat bordered class="template-card cursor-pointer" @click="selectTemplate(template)">
          <q-card-section class="bg-grey-2">
            <div class="row items-center">
              <q-avatar
                size="48px"
                :color="getCategoryColor(template.category)"
                text-color="white"
              >
                <q-icon :name="template.icon || 'dashboard'" size="sm" />
              </q-avatar>
              <div class="q-ml-sm flex-1">
                <div class="text-subtitle1 text-weight-medium">{{ template.name }}</div>
                <q-chip
                  :label="template.category || 'custom'"
                  size="sm"
                  dense
                  :color="getCategoryColor(template.category)"
                  text-color="white"
                />
              </div>
            </div>
          </q-card-section>

          <q-card-section>
            <div class="text-caption text-grey-7" style="min-height: 40px;">
              {{ template.description || 'Aucune description' }}
            </div>
            
            <div class="row items-center q-mt-sm text-caption text-grey-6">
              <q-icon name="schedule" size="xs" class="q-mr-xs" />
              {{ formatDate(template.createdAt) }}
            </div>
            
            <div class="row items-center q-mt-xs text-caption text-grey-6">
              <q-icon name="task" size="xs" class="q-mr-xs" />
              {{ template.workflow?.tasks?.length || 0 }} tâche(s)
            </div>

            <div v-if="template.tags && template.tags.length > 0" class="q-mt-sm">
              <q-chip
                v-for="tag in template.tags.slice(0, 3)"
                :key="tag"
                :label="tag"
                size="xs"
                dense
                outline
                color="primary"
                class="q-mr-xs"
              />
            </div>
          </q-card-section>

          <q-separator />

          <q-card-actions align="right">
            <q-btn
              flat
              dense
              icon="play_arrow"
              color="primary"
              @click.stop="loadTemplateInBuilder(template)"
            >
              <q-tooltip>Charger dans le builder</q-tooltip>
            </q-btn>
            <q-btn
              flat
              dense
              icon="content_copy"
              color="secondary"
              @click.stop="duplicateTemplate(template)"
            >
              <q-tooltip>Dupliquer</q-tooltip>
            </q-btn>
            <q-btn
              flat
              dense
              icon="file_download"
              color="grey-7"
              @click.stop="exportTemplate(template)"
            >
              <q-tooltip>Exporter</q-tooltip>
            </q-btn>
            <q-btn
              flat
              dense
              icon="edit"
              color="orange"
              @click.stop="editTemplate(template)"
            >
              <q-tooltip>Éditer</q-tooltip>
            </q-btn>
            <q-btn
              flat
              dense
              icon="delete"
              color="negative"
              @click.stop="confirmDeleteTemplate(template)"
            >
              <q-tooltip>Supprimer</q-tooltip>
            </q-btn>
          </q-card-actions>
        </q-card>
      </div>
    </div>

    <!-- Dialog Détails Template -->
    <q-dialog v-model="showDetailsDialog" maximized>
      <q-card v-if="selectedTemplate">
        <q-card-section class="row items-center q-pa-md bg-primary text-white">
          <div class="text-h6">
            <q-icon :name="selectedTemplate.icon || 'dashboard'" class="q-mr-sm" />
            {{ selectedTemplate.name }}
          </div>
          <q-space />
          <q-btn
            flat
            round
            icon="close"
            @click="showDetailsDialog = false"
          />
        </q-card-section>

        <q-card-section>
          <div class="text-h6 q-mb-md">Informations</div>
          
          <div class="row q-col-gutter-md">
            <div class="col-6">
              <div class="text-caption text-grey-6">Description</div>
              <div>{{ selectedTemplate.description || 'Aucune description' }}</div>
            </div>
            <div class="col-6">
              <div class="text-caption text-grey-6">Catégorie</div>
              <q-chip
                :label="selectedTemplate.category || 'custom'"
                :color="getCategoryColor(selectedTemplate.category)"
                text-color="white"
                dense
              />
            </div>
            <div class="col-6">
              <div class="text-caption text-grey-6">Créé le</div>
              <div>{{ formatDate(selectedTemplate.createdAt) }}</div>
            </div>
            <div class="col-6">
              <div class="text-caption text-grey-6">Nombre de tâches</div>
              <div>{{ selectedTemplate.workflow?.tasks?.length || 0 }}</div>
            </div>
          </div>

          <div class="text-h6 q-mt-lg q-mb-md">Structure du Workflow</div>
          
          <div class="row q-col-gutter-md">
            <div class="col-12">
              <q-card flat bordered>
                <q-card-section>
                  <div class="text-subtitle2 q-mb-sm">Tâches ({{ selectedTemplate.workflow?.tasks?.length || 0 }})</div>
                  <div
                    v-for="(task, index) in selectedTemplate.workflow?.tasks"
                    :key="index"
                    class="task-item q-mb-sm"
                  >
                    <q-item dense class="bg-grey-1 rounded-borders">
                      <q-item-section avatar>
                        <q-avatar size="sm" color="primary" text-color="white">
                          {{ index + 1 }}
                        </q-avatar>
                      </q-item-section>
                      <q-item-section>
                        <q-item-label class="text-weight-medium">
                          {{ getTaskTypeName(task.type) }}
                        </q-item-label>
                        <q-item-label caption>ID: {{ task.id }}</q-item-label>
                      </q-item-section>
                    </q-item>
                  </div>
                </q-card-section>
              </q-card>
            </div>
          </div>

          <div class="row q-mt-md">
            <q-btn
              color="primary"
              icon="code"
              label="Voir JSON"
              @click="showJsonDialog = true"
              unelevated
            />
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- Dialog Éditer Template -->
    <q-dialog v-model="showEditDialog" persistent>
      <q-card style="min-width: 500px;">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">Modifier le template</div>
          <q-space />
          <q-btn icon="close" flat round dense @click="closeEditDialog" />
        </q-card-section>

        <q-card-section>
          <q-form @submit="saveTemplate">
            <q-input
              v-model="templateForm.name"
              label="Nom du template *"
              outlined
              :rules="[val => !!val || 'Le nom est requis']"
              class="q-mb-md"
            />

            <q-input
              v-model="templateForm.description"
              label="Description"
              type="textarea"
              outlined
              rows="3"
              class="q-mb-md"
            />

            <q-select
              v-model="templateForm.category"
              :options="categorySelectOptions"
              label="Catégorie"
              outlined
              emit-value
              map-options
              class="q-mb-md"
            />

            <q-select
              v-model="templateForm.icon"
              :options="iconOptions"
              label="Icône"
              outlined
              emit-value
              map-options
              class="q-mb-md"
            >
              <template #option="scope">
                <q-item v-bind="scope.itemProps">
                  <q-item-section avatar>
                    <q-icon :name="scope.opt.value" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label>{{ scope.opt.label }}</q-item-label>
                  </q-item-section>
                </q-item>
              </template>
            </q-select>

            <q-input
              v-model="tagsInput"
              label="Tags (séparés par des virgules)"
              outlined
              hint="Ex: image, édition, rapide"
              class="q-mb-md"
            />

            <div class="row justify-end q-gutter-sm">
              <q-btn label="Annuler" flat @click="closeEditDialog" />
              <q-btn
                type="submit"
                label="Enregistrer"
                color="primary"
                unelevated
                :loading="saving"
              />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- Dialog JSON -->
    <q-dialog v-model="showJsonDialog" maximized>
      <q-card v-if="selectedTemplate">
        <q-card-section class="row items-center q-pa-md bg-primary text-white">
          <div class="text-h6">
            <q-icon name="code" class="q-mr-sm" />
            Structure JSON - {{ selectedTemplate.name }}
          </div>
          <q-space />
          <q-btn
            flat
            icon="content_copy"
            @click="copyJsonToClipboard"
            class="q-mr-sm"
          >
            <q-tooltip>Copier dans le presse-papiers</q-tooltip>
          </q-btn>
          <q-btn
            flat
            round
            icon="close"
            @click="showJsonDialog = false"
          />
        </q-card-section>

        <q-card-section class="q-pa-md" style="height: calc(100vh - 80px); overflow: auto;">
          <pre class="json-content"><code>{{ formattedJson }}</code></pre>
        </q-card-section>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { useTemplateStore } from 'src/stores/useTemplateStore'
import { useWorkflowStore } from 'src/stores/useWorkflowStore'

const $q = useQuasar()
const templateStore = useTemplateStore()
const workflowStore = useWorkflowStore()

// ==================== STATE ====================

const selectedTemplate = ref(null)
const searchQuery = ref('')
const selectedCategory = ref('all')
const showDetailsDialog = ref(false)
const showEditDialog = ref(false)
const showJsonDialog = ref(false)
const editingTemplate = ref(null)
const saving = ref(false)
const tagsInput = ref('')

const templateForm = ref({
  name: '',
  description: '',
  category: 'custom',
  icon: 'dashboard',
  tags: []
})

// ==================== COMPUTED ====================

const templates = computed(() => templateStore.sortedTemplates)
const loading = computed(() => templateStore.loading)

const filteredTemplates = computed(() => {
  let result = templates.value
  
  // Filtre par catégorie
  if (selectedCategory.value && selectedCategory.value !== 'all') {
    result = templateStore.filterByCategory(selectedCategory.value)
  }
  
  // Filtre par recherche
  if (searchQuery.value.trim()) {
    result = templateStore.searchTemplates(searchQuery.value)
  }
  
  return result
})

const categoryOptions = computed(() => {
  return [
    { label: 'Toutes les catégories', value: 'all' },
    ...templateStore.categories.map(cat => ({ label: cat, value: cat }))
  ]
})

const categorySelectOptions = [
  { label: 'Personnalisé', value: 'custom' },
  { label: 'Image', value: 'image' },
  { label: 'Vidéo', value: 'video' },
  { label: 'Édition', value: 'editing' },
  { label: 'Génération', value: 'generation' },
  { label: 'Analyse', value: 'analysis' }
]

const iconOptions = [
  { label: 'Dashboard', value: 'dashboard' },
  { label: 'Image', value: 'image' },
  { label: 'Vidéo', value: 'videocam' },
  { label: 'Édition', value: 'edit' },
  { label: 'Étoile', value: 'star' },
  { label: 'Favori', value: 'favorite' },
  { label: 'Build', value: 'build' },
  { label: 'Analytics', value: 'analytics' }
]

const formattedJson = computed(() => {
  if (!selectedTemplate.value) return '{}'
  return JSON.stringify(selectedTemplate.value, null, 2)
})

// ==================== METHODS ====================

async function refreshTemplates() {
  try {
    await templateStore.loadTemplates()
    $q.notify({
      type: 'positive',
      message: 'Templates actualisés',
      timeout: 1000
    })
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: 'Erreur lors de l\'actualisation'
    })
  }
}

function selectTemplate(template) {
  selectedTemplate.value = template
  showDetailsDialog.value = true
}

function loadTemplateInBuilder(template) {
  // Émettre l'événement pour charger le template dans le builder
  // Le workflow du template a déjà les inputs/outputs vierges
  workflowStore.loadTemplate(template.workflow)
  
  $q.notify({
    type: 'positive',
    message: `Template "${template.name}" chargé dans le builder`,
    position: 'top'
  })
}

async function duplicateTemplate(template) {
  try {
    const duplicated = await templateStore.duplicateTemplate(template.id)
    
    $q.notify({
      type: 'positive',
      message: `Template "${duplicated.name}" dupliqué`,
      position: 'top'
    })
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: 'Erreur lors de la duplication'
    })
  }
}

function exportTemplate(template) {
  templateStore.exportTemplate(template)
  
  $q.notify({
    type: 'positive',
    message: 'Template exporté',
    position: 'top'
  })
}

function editTemplate(template) {
  editingTemplate.value = template
  templateForm.value = {
    name: template.name,
    description: template.description || '',
    category: template.category || 'custom',
    icon: template.icon || 'dashboard',
    tags: template.tags || []
  }
  tagsInput.value = (template.tags || []).join(', ')
  showEditDialog.value = true
}

async function saveTemplate() {
  try {
    saving.value = true
    
    // Parser les tags
    const tags = tagsInput.value
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0)
    
    const templateData = {
      ...templateForm.value,
      tags
    }
    
    if (editingTemplate.value) {
      // Mise à jour
      await templateStore.updateTemplate(editingTemplate.value.id, templateData)
      
      $q.notify({
        type: 'positive',
        message: 'Template mis à jour avec succès'
      })
      
      closeEditDialog()
    }
    
  } catch (error) {
    console.error('Erreur sauvegarde template:', error)
    $q.notify({
      type: 'negative',
      message: 'Erreur lors de la sauvegarde'
    })
  } finally {
    saving.value = false
  }
}

function confirmDeleteTemplate(template) {
  $q.dialog({
    title: 'Supprimer le template',
    message: `Êtes-vous sûr de vouloir supprimer le template "${template.name}" ?`,
    cancel: true,
    persistent: true
  }).onOk(async () => {
    try {
      await templateStore.deleteTemplate(template.id)
      
      $q.notify({
        type: 'positive',
        message: 'Template supprimé'
      })
    } catch (error) {
      $q.notify({
        type: 'negative',
        message: 'Erreur lors de la suppression'
      })
    }
  })
}

function importTemplateDialog() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json'
  
  input.onchange = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    
    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const imported = await templateStore.importTemplate(e.target.result)
        
        $q.notify({
          type: 'positive',
          message: `Template "${imported.name}" importé`,
          position: 'top'
        })
      } catch (error) {
        $q.notify({
          type: 'negative',
          message: 'Erreur lors de l\'import',
          position: 'top'
        })
      }
    }
    reader.readAsText(file)
  }
  
  input.click()
}

async function copyJsonToClipboard() {
  try {
    await navigator.clipboard.writeText(formattedJson.value)
    $q.notify({
      type: 'positive',
      message: 'JSON copié dans le presse-papiers',
      timeout: 2000
    })
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: 'Erreur lors de la copie'
    })
  }
}

function closeEditDialog() {
  showEditDialog.value = false
  editingTemplate.value = null
  templateForm.value = {
    name: '',
    description: '',
    category: 'custom',
    icon: 'dashboard',
    tags: []
  }
  tagsInput.value = ''
}

function getCategoryColor(category) {
  const colors = {
    custom: 'secondary',
    image: 'purple',
    video: 'pink',
    editing: 'orange',
    generation: 'green',
    analysis: 'blue'
  }
  return colors[category] || 'primary'
}

function getTaskTypeName(taskType) {
  const taskNames = {
    input_text: 'Saisie de texte',
    input_images: 'Sélection d\'images',
    generate_image: 'Génération d\'image',
    edit_image: 'Édition d\'image',
    analyze_image: 'Analyse d\'image',
    resize_crop_image: 'Redimensionnement',
    generate_video: 'Génération de vidéo',
    extract_video_frame: 'Extraction de frame',
    concatenate_videos: 'Concaténation de vidéos',
    output_text: 'Sortie texte',
    output_images: 'Sortie images',
    output_videos: 'Sortie vidéos'
  }
  return taskNames[taskType] || taskType
}

function formatDate(dateString) {
  if (!dateString) return 'Date inconnue'
  const date = new Date(dateString)
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// ==================== LIFECYCLE ====================

onMounted(async () => {
  await templateStore.loadTemplates()
})
</script>

<style scoped lang="scss">
.template-manager {
  .template-card {
    transition: all 0.3s ease;
    
    &:hover {
      transform: translateY(-4px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
  }
  
  .task-item {
    .q-item {
      border-left: 3px solid var(--q-primary);
    }
  }
  
  .json-content {
    background-color: #f5f5f5;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    padding: 16px;
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    font-size: 14px;
    line-height: 1.4;
    color: #2d3748;
    white-space: pre-wrap;
    word-wrap: break-word;
    overflow-x: auto;
  }
}
</style>
