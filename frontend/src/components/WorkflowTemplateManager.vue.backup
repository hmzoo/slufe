<template>
  <q-dialog v-model="showDialog" maximized class="template-manager-dialog">
    <q-card class="template-manager">
      <q-card-section class="row items-center q-pa-md bg-primary text-white">
        <div class="text-h6">
          <q-icon name="dashboard" class="q-mr-sm" />
          Gestionnaire de Templates
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
          <!-- Liste des templates -->
          <template v-slot:before>
            <div class="q-pa-md">
              <div class="row items-center q-mb-md">
                <div class="text-h6">Templates disponibles</div>
                <q-space />
                <q-btn
                  color="grey-7"
                  icon="refresh"
                  @click="refreshTemplates"
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
                  label="Nouveau Template"
                  @click="showCreateTemplateDialog"
                  unelevated
                />
              </div>

              <!-- Liste des templates -->
              <q-list separator>
                <q-item
                  v-for="template in templates"
                  :key="template.id"
                  clickable
                  :active="selectedTemplate?.id === template.id"
                  @click="selectTemplate(template)"
                  class="template-item"
                >
                  <q-item-section avatar>
                    <q-avatar :color="template.category === 'custom' ? 'secondary' : 'primary'" text-color="white">
                      <q-icon :name="template.icon || 'dashboard'" />
                    </q-avatar>
                  </q-item-section>

                  <q-item-section>
                    <q-item-label class="text-weight-medium">{{ template.name }}</q-item-label>
                    <q-item-label caption lines="2">{{ template.description }}</q-item-label>
                    <q-item-label caption class="text-grey-6">
                      <q-icon name="schedule" size="xs" />
                      {{ formatDate(template.createdAt) }} • {{ template.workflow.tasks?.length || 0 }} tâches
                    </q-item-label>
                  </q-item-section>

                  <q-item-section side>
                    <div class="row q-gutter-xs">
                      <q-btn
                        size="sm"
                        flat
                        round
                        icon="play_arrow"
                        @click.stop="loadTemplateInBuilder(template)"
                        color="primary"
                      >
                        <q-tooltip>Charger dans le builder</q-tooltip>
                      </q-btn>
                      <q-btn
                        size="sm"
                        flat
                        round
                        icon="edit"
                        @click.stop="editTemplate(template)"
                        color="secondary"
                      >
                        <q-tooltip>Modifier</q-tooltip>
                      </q-btn>
                      <q-btn
                        size="sm"
                        flat
                        round
                        icon="delete"
                        @click.stop="confirmDeleteTemplate(template)"
                        color="negative"
                      >
                        <q-tooltip>Supprimer</q-tooltip>
                      </q-btn>
                    </div>
                  </q-item-section>
                </q-item>

                <q-item v-if="templates.length === 0">
                  <q-item-section class="text-center text-grey-6">
                    <q-icon name="dashboard" size="3rem" class="q-mb-md" />
                    <div>Aucun template disponible</div>
                    <div class="text-caption">Créez votre premier template à partir d'un workflow</div>
                  </q-item-section>
                </q-item>
              </q-list>
            </div>
          </template>

          <!-- Détails du template sélectionné -->
          <template v-slot:after>
            <div class="q-pa-md" v-if="selectedTemplate">
              <div class="text-h6 q-mb-md">{{ selectedTemplate.name }}</div>
              
              <!-- Informations du template -->
              <q-card flat bordered class="q-mb-md">
                <q-card-section>
                  <div class="text-subtitle2 q-mb-sm">Informations</div>
                  <div class="row q-col-gutter-md">
                    <div class="col-6">
                      <div class="text-caption text-grey-6">Description</div>
                      <div>{{ selectedTemplate.description || 'Aucune description' }}</div>
                    </div>
                    <div class="col-6">
                      <div class="text-caption text-grey-6">Catégorie</div>
                      <q-chip :color="selectedTemplate.category === 'custom' ? 'secondary' : 'primary'" text-color="white" dense>
                        {{ selectedTemplate.category }}
                      </q-chip>
                    </div>
                    <div class="col-6">
                      <div class="text-caption text-grey-6">Créé le</div>
                      <div>{{ formatDate(selectedTemplate.createdAt) }}</div>
                    </div>
                    <div class="col-6">
                      <div class="text-caption text-grey-6">Tâches</div>
                      <div>{{ selectedTemplate.workflow.tasks?.length || 0 }} tâche(s)</div>
                    </div>
                  </div>
                </q-card-section>
              </q-card>

              <!-- Structure du workflow -->
              <q-card flat bordered>
                <q-card-section>
                  <div class="row items-center q-mb-sm">
                    <div class="text-subtitle2">Structure du workflow</div>
                    <q-space />
                    <q-btn
                      size="sm"
                      flat
                      icon="code"
                      label="Voir JSON"
                      @click="showJsonDialog = true"
                      color="primary"
                    >
                      <q-tooltip>Voir la structure JSON complète</q-tooltip>
                    </q-btn>
                  </div>
                  <div class="workflow-preview">
                    <div
                      v-for="(task, index) in selectedTemplate.workflow.tasks"
                      :key="task.id"
                      class="task-preview-item q-mb-sm"
                    >
                      <q-item dense class="bg-grey-1 rounded-borders">
                        <q-item-section avatar>
                          <q-avatar size="sm" color="primary" text-color="white">
                            {{ index + 1 }}
                          </q-avatar>
                        </q-item-section>
                        <q-item-section>
                          <q-item-label class="text-weight-medium">
                            {{ getTaskDefinition(task.type)?.name || task.type }}
                          </q-item-label>
                          <q-item-label caption>ID: {{ task.id }}</q-item-label>
                        </q-item-section>
                      </q-item>
                    </div>
                  </div>
                </q-card-section>
              </q-card>
            </div>
            
            <div v-else class="q-pa-md text-center text-grey-6">
              <q-icon name="touch_app" size="3rem" class="q-mb-md" />
              <div>Sélectionnez un template pour voir les détails</div>
            </div>
          </template>
        </q-splitter>
      </q-card-section>
    </q-card>
  </q-dialog>

  <!-- Dialog de création/édition de template -->
  <q-dialog v-model="showTemplateEditDialog">
    <q-card style="min-width: 500px">
      <q-card-section class="row items-center">
        <div class="text-h6">{{ editingTemplate ? 'Modifier le template' : 'Créer un template' }}</div>
        <q-space />
        <q-btn flat round icon="close" @click="closeEditDialog" />
      </q-card-section>

      <q-card-section>
        <q-form @submit="saveTemplate" class="q-gutter-md">
          <q-input
            v-model="templateForm.name"
            label="Nom du template *"
            outlined
            :rules="[val => !!val || 'Le nom est requis']"
          />

          <q-input
            v-model="templateForm.description"
            label="Description"
            outlined
            type="textarea"
            rows="3"
          />

          <q-select
            v-model="templateForm.category"
            label="Catégorie"
            outlined
            :options="categoryOptions"
          />

          <q-select
            v-model="templateForm.icon"
            label="Icône"
            outlined
            :options="iconOptions"
          />

          <div class="row justify-end q-gutter-sm">
            <q-btn flat label="Annuler" @click="closeEditDialog" />
            <q-btn
              type="submit"
              color="primary"
              :label="editingTemplate ? 'Mettre à jour' : 'Créer'"
              :loading="saving"
            />
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </q-dialog>

  <!-- Dialog JSON du template -->
  <q-dialog v-model="showJsonDialog" maximized>
    <q-card class="json-dialog">
      <q-card-section class="row items-center q-pa-md bg-primary text-white">
        <div class="text-h6">
          <q-icon name="code" class="q-mr-sm" />
          Structure JSON - {{ selectedTemplate?.name }}
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

      <q-card-section class="q-pa-none" style="height: calc(100vh - 80px)">
        <div class="json-container q-pa-md" style="height: 100%; overflow: auto;">
          <pre class="json-content"><code>{{ formattedJson }}</code></pre>
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useQuasar } from 'quasar'
import { api } from 'src/boot/axios'
import { getTaskDefinition } from 'src/config/taskDefinitions'

const $q = useQuasar()

// Props
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
})

// Emits
const emit = defineEmits(['update:modelValue', 'template-loaded'])

// Data
const templates = ref([])
const selectedTemplate = ref(null)
const splitterModel = ref(30)
const loading = ref(false)
const saving = ref(false)

// Dialogs
const showTemplateEditDialog = ref(false)
const showJsonDialog = ref(false)
const editingTemplate = ref(null)

// Form
const templateForm = ref({
  name: '',
  description: '',
  category: 'custom',
  icon: 'dashboard'
})

// Options
const categoryOptions = [
  { label: 'Personnalisé', value: 'custom' },
  { label: 'Génération', value: 'generation' },
  { label: 'Édition', value: 'editing' },
  { label: 'Analyse', value: 'analysis' },
  { label: 'Workflow', value: 'workflow' }
]

const iconOptions = [
  { label: 'Dashboard', value: 'dashboard' },
  { label: 'Image', value: 'image' },
  { label: 'Edit', value: 'edit' },
  { label: 'Video', value: 'videocam' },
  { label: 'Analytics', value: 'analytics' },
  { label: 'Build', value: 'build' },
  { label: 'Star', value: 'star' },
  { label: 'Favorite', value: 'favorite' }
]

// Computed
const showDialog = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const formattedJson = computed(() => {
  if (!selectedTemplate.value) return ''
  return JSON.stringify(selectedTemplate.value, null, 2)
})

// Watcher pour recharger les templates quand le dialog s'ouvre
watch(() => props.isOpen, async (newVal) => {
    if (newVal) {
      await loadTemplates()
    }
  })

// Methods
async function loadTemplates() {
  try {
    loading.value = true
    const response = await api.get('/templates')
    
    if (response.data.success) {
      templates.value = response.data.templates
      console.log(`📋 ${templates.value.length} templates chargés`)
    }
  } catch (error) {
    console.error('Erreur chargement templates:', error)
    $q.notify({
      type: 'negative',
      message: 'Erreur lors du chargement des templates'
    })
  } finally {
    loading.value = false
  }
}

async function refreshTemplates() {
  $q.notify({
    type: 'info',
    message: 'Actualisation de la liste des templates...',
    timeout: 1000
  })
  await loadTemplates()
  $q.notify({
    type: 'positive',
    message: 'Liste des templates actualisée',
    timeout: 2000
  })
}

function selectTemplate(template) {
  selectedTemplate.value = template
}

function loadTemplateInBuilder(template) {
  emit('template-loaded', template)
  closeDialog()
  
  $q.notify({
    type: 'positive',
    message: `Template "${template.name}" chargé dans le builder`
  })
}

function showCreateTemplateDialog() {
  editingTemplate.value = null
  templateForm.value = {
    name: '',
    description: '',
    category: 'custom',
    icon: 'dashboard'
  }
  showTemplateEditDialog.value = true
}

function editTemplate(template) {
  editingTemplate.value = template
  templateForm.value = {
    name: template.name,
    description: template.description || '',
    category: template.category || 'custom',
    icon: template.icon || 'dashboard'
  }
  showTemplateEditDialog.value = true
}

async function saveTemplate() {
  try {
    saving.value = true
    
    if (editingTemplate.value) {
      // Mise à jour
      const response = await api.put(`/templates/${editingTemplate.value.id}`, templateForm.value)
      
      if (response.data.success) {
        const index = templates.value.findIndex(t => t.id === editingTemplate.value.id)
        if (index !== -1) {
          templates.value[index] = response.data.template
        }
        
        $q.notify({
          type: 'positive',
          message: 'Template mis à jour avec succès'
        })
      }
    } else {
      // Création - nécessite un workflow source
      $q.notify({
        type: 'warning',
        message: 'Utilisez "Créer un template" depuis un workflow existant'
      })
    }
    
    closeEditDialog()
    
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
    await deleteTemplate(template.id)
  })
}

async function deleteTemplate(templateId) {
  try {
    const response = await api.delete(`/templates/${templateId}`)
    
    if (response.data.success) {
      templates.value = templates.value.filter(t => t.id !== templateId)
      
      if (selectedTemplate.value?.id === templateId) {
        selectedTemplate.value = null
      }
      
      $q.notify({
        type: 'positive',
        message: 'Template supprimé avec succès'
      })
    }
  } catch (error) {
    console.error('Erreur suppression template:', error)
    $q.notify({
      type: 'negative',
      message: 'Erreur lors de la suppression'
    })
  }
}

async function copyJsonToClipboard() {
  try {
    await navigator.clipboard.writeText(formattedJson.value)
    $q.notify({
      type: 'positive',
      message: 'Structure JSON copiée dans le presse-papiers',
      timeout: 2000
    })
  } catch (error) {
    console.error('Erreur lors de la copie:', error)
    $q.notify({
      type: 'negative',
      message: 'Erreur lors de la copie dans le presse-papiers'
    })
  }
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

function closeDialog() {
  showDialog.value = false
  selectedTemplate.value = null
}

function closeEditDialog() {
  showTemplateEditDialog.value = false
  editingTemplate.value = null
}

// Lifecycle
onMounted(() => {
  loadTemplates()
})
</script>

<style scoped lang="scss">
.template-manager {
  .template-item {
    &:hover {
      background-color: rgba(0, 0, 0, 0.02);
    }
  }
  
  .workflow-preview {
    max-height: 400px;
    overflow-y: auto;
  }
  
  .task-preview-item {
    .q-item {
      border-left: 3px solid var(--q-primary);
    }
  }
}

.json-dialog {
  .json-container {
    background-color: #f8f9fa;
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  }
  
  .json-content {
    background-color: #ffffff;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    padding: 16px;
    margin: 0;
    font-size: 14px;
    line-height: 1.4;
    color: #2d3748;
    white-space: pre-wrap;
    word-wrap: break-word;
    overflow-x: auto;
  }
}
</style>