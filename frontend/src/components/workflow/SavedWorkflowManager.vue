<template>
  <q-dialog v-model="visible" maximized class="saved-workflow-manager-dialog">
    <q-card class="saved-workflow-manager">
      <q-card-section class="row items-center q-pa-md bg-primary text-white">
        <div class="text-h6">
          <q-icon name="save" class="q-mr-sm" />
          Mes Workflows Sauvegardés
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
          <!-- Liste des workflows -->
          <template v-slot:before>
            <div class="q-pa-md">
              <div class="row items-center q-mb-md">
                <div class="text-h6">Workflows disponibles</div>
                <q-space />
                <q-btn
                  color="grey-7"
                  icon="refresh"
                  @click="refreshWorkflows"
                  round
                  flat
                  size="md"
                  class="q-mr-sm"
                >
                  <q-tooltip>Rafraîchir la liste</q-tooltip>
                </q-btn>
                <q-btn
                  color="secondary"
                  icon="file_download"
                  label="Importer"
                  @click="importWorkflow"
                  unelevated
                  class="q-mr-sm"
                />
                <q-btn
                  color="primary"
                  icon="add"
                  label="Nouveau Workflow"
                  @click="showSaveDialog = true"
                  unelevated
                  :disable="!workflowStore.currentWorkflow"
                />
              </div>

              <!-- Barre de recherche -->
              <q-input
                v-model="searchText"
                placeholder="Rechercher un workflow..."
                outlined
                dense
                class="q-mb-md"
              >
                <template v-slot:prepend>
                  <q-icon name="search" />
                </template>
                <template v-slot:append>
                  <q-btn
                    v-if="searchText"
                    flat
                    round
                    dense
                    icon="clear"
                    @click="searchText = ''"
                  />
                </template>
              </q-input>

              <!-- Liste des workflows -->
              <q-list separator>
                <q-item
                  v-for="workflow in filteredWorkflows"
                  :key="workflow.id"
                  clickable
                  :active="selectedWorkflow?.id === workflow.id"
                  @click="selectWorkflow(workflow)"
                  class="workflow-item"
                >
                  <q-item-section avatar>
                    <q-avatar color="primary" text-color="white">
                      <q-icon :name="workflow.icon || 'save'" />
                    </q-avatar>
                  </q-item-section>

                  <q-item-section>
                    <q-item-label class="text-weight-medium">{{ workflow.name }}</q-item-label>
                    <q-item-label caption lines="2">{{ workflow.description || 'Aucune description' }}</q-item-label>
                    <q-item-label caption class="text-grey-6">
                      <q-icon name="schedule" size="xs" />
                      {{ formatDate(workflow.createdAt) }} • {{ workflow.tasks?.length || 0 }} tâches
                      <span v-if="workflow.version > 1" class="q-ml-sm">
                        • v{{ workflow.version }}
                      </span>
                    </q-item-label>
                  </q-item-section>

                  <q-item-section side>
                    <div class="row q-gutter-xs">
                      <q-btn
                        size="sm"
                        flat
                        round
                        icon="play_arrow"
                        @click.stop="loadWorkflow(workflow)"
                        color="primary"
                      >
                        <q-tooltip>Charger dans le builder</q-tooltip>
                      </q-btn>
                      <q-btn
                        size="sm"
                        flat
                        round
                        icon="edit"
                        @click.stop="editWorkflow(workflow)"
                        color="secondary"
                      >
                        <q-tooltip>Renommer</q-tooltip>
                      </q-btn>
                      <q-btn
                        size="sm"
                        flat
                        round
                        icon="content_copy"
                        @click.stop="duplicateWorkflow(workflow)"
                        color="info"
                      >
                        <q-tooltip>Dupliquer</q-tooltip>
                      </q-btn>
                      <q-btn
                        size="sm"
                        flat
                        round
                        icon="delete"
                        @click.stop="deleteWorkflow(workflow)"
                        color="negative"
                      >
                        <q-tooltip>Supprimer</q-tooltip>
                      </q-btn>
                    </div>
                  </q-item-section>
                </q-item>

                <q-item v-if="filteredWorkflows.length === 0">
                  <q-item-section class="text-center text-grey-6">
                    <q-icon name="save" size="3rem" class="q-mb-md" />
                    <div v-if="!searchText">Aucun workflow sauvegardé</div>
                    <div v-else>Aucun workflow trouvé</div>
                    <div class="text-caption" v-if="!searchText">Créez et sauvegardez un workflow pour le retrouver ici</div>
                  </q-item-section>
                </q-item>
              </q-list>
            </div>
          </template>

          <!-- Détails du workflow sélectionné -->
          <template v-slot:after>
            <div class="q-pa-md" v-if="selectedWorkflow">
              <div class="text-h6 q-mb-md">{{ selectedWorkflow.name }}</div>
              
              <!-- Informations du workflow -->
              <q-card flat bordered class="q-mb-md">
                <q-card-section>
                  <div class="text-subtitle2 q-mb-sm">Informations</div>
                  <div class="row q-col-gutter-md">
                    <div class="col-6">
                      <div class="text-caption text-grey-6">Description</div>
                      <div>{{ selectedWorkflow.description || 'Aucune description' }}</div>
                    </div>
                    <div class="col-6">
                      <div class="text-caption text-grey-6">Version</div>
                      <q-chip color="primary" text-color="white" dense>
                        v{{ selectedWorkflow.version || 1 }}
                      </q-chip>
                    </div>
                    <div class="col-6">
                      <div class="text-caption text-grey-6">Créé le</div>
                      <div>{{ formatDate(selectedWorkflow.createdAt) }}</div>
                    </div>
                    <div class="col-6">
                      <div class="text-caption text-grey-6">Tâches</div>
                      <div>{{ selectedWorkflow.tasks?.length || 0 }} tâche(s)</div>
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
                      v-for="(task, index) in selectedWorkflow.tasks"
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
                            {{ getTaskName(task.type) }}
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
              <div>Sélectionnez un workflow pour voir les détails</div>
            </div>
          </template>
        </q-splitter>
      </q-card-section>
    </q-card>
  </q-dialog>

  <!-- Dialog JSON du workflow -->
  <q-dialog v-model="showJsonDialog" maximized>
    <q-card class="json-dialog">
      <q-card-section class="row items-center q-pa-md bg-primary text-white">
        <div class="text-h6">
          <q-icon name="code" class="q-mr-sm" />
          Structure JSON - {{ selectedWorkflow?.name }}
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

  <!-- Dialog de sauvegarde/édition -->
  <q-dialog v-model="showSaveDialog">
    <q-card style="min-width: 400px">
      <q-card-section class="row items-center">
        <div class="text-h6">{{ editingWorkflow ? 'Modifier le workflow' : 'Sauvegarder le workflow' }}</div>
        <q-space />
        <q-btn flat round icon="close" @click="closeSaveDialog" />
      </q-card-section>

      <q-card-section>
        <q-form @submit="saveWorkflow" class="q-gutter-md">
          <q-input
            v-model="workflowForm.name"
            label="Nom du workflow *"
            :rules="[val => !!val || 'Le nom est requis']"
            outlined
          />
          
          <q-input
            v-model="workflowForm.description"
            label="Description"
            type="textarea"
            rows="3"
            outlined
          />
          
          <div class="row justify-end q-gutter-sm">
            <q-btn flat color="grey" @click="closeSaveDialog">Annuler</q-btn>
            <q-btn
              type="submit"
              color="primary"
              :label="editingWorkflow ? 'Mettre à jour' : 'Sauvegarder'"
              :loading="saving"
            />
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </q-dialog>


</template>

<script setup>
import { ref, computed, defineEmits } from 'vue'
import { useWorkflowStore } from '../../stores/useWorkflowStore'
import { useQuasar } from 'quasar'
// Fonction simple de formatage de date

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'workflow-loaded'])

const $q = useQuasar()
const workflowStore = useWorkflowStore()

// Modèle de visibilité
const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

// État local
const searchText = ref('')
const selectedWorkflow = ref(null)
const splitterModel = ref(30)
const showSaveDialog = ref(false)
const showEditDialog = ref(false)
const showJsonDialog = ref(false)
const editingWorkflow = ref(null)
const saving = ref(false)

// Formulaires
const newWorkflowName = ref('')
const newWorkflowDescription = ref('')
const editWorkflowName = ref('')

const workflowForm = ref({
  name: '',
  description: ''
})

// Workflows filtrés
const filteredWorkflows = computed(() => {
  if (!searchText.value.trim()) {
    return [...workflowStore.savedWorkflows].reverse() // Plus récents en premier
  }
  
  const search = searchText.value.toLowerCase()
  return workflowStore.savedWorkflows
    .filter(w => 
      w.name.toLowerCase().includes(search) ||
      (w.description && w.description.toLowerCase().includes(search))
    )
    .reverse()
})

const formattedJson = computed(() => {
  if (!selectedWorkflow.value) return ''
  return JSON.stringify(selectedWorkflow.value, null, 2)
})

// Méthodes
function closeDialog() {
  visible.value = false
  selectedWorkflow.value = null
}

function selectWorkflow(workflow) {
  selectedWorkflow.value = workflow
}

function refreshWorkflows() {
  // Force refresh du store
  workflowStore.loadSavedWorkflows()
  $q.notify({
    type: 'positive',
    message: 'Liste actualisée',
    timeout: 1000
  })
}

function getTaskName(taskType) {
  // Fonction pour obtenir le nom d'une tâche (peut être importée si disponible)
  const taskNames = {
    generate_image: 'Générer une image',
    edit_image: 'Éditer une image',
    analyze_image: 'Analyser une image',
    resize_crop_image: 'Redimensionner une image',
    generate_video: 'Générer une vidéo',
    extract_video_frame: 'Extraire frame vidéo',
    concatenate_videos: 'Concaténer vidéos'
  }
  return taskNames[taskType] || taskType
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

function closeSaveDialog() {
  showSaveDialog.value = false
  editingWorkflow.value = null
  workflowForm.value = { name: '', description: '' }
}

async function saveWorkflow() {
  if (!workflowForm.value.name.trim()) return
  
  try {
    saving.value = true
    
    if (editingWorkflow.value) {
      // Modification d'un workflow existant
      workflowStore.renameWorkflow(editingWorkflow.value.id, workflowForm.value.name.trim())
      // TODO: Ajouter mise à jour description si supportée par le store
      
      $q.notify({
        type: 'positive',
        message: 'Workflow mis à jour'
      })
    } else {
      // Création nouveau workflow
      const saved = workflowStore.saveCurrentWorkflow({
        name: workflowForm.value.name.trim(),
        description: workflowForm.value.description.trim()
      })
      
      if (saved) {
        $q.notify({
          type: 'positive',
          message: `Workflow "${workflowForm.value.name}" sauvegardé !`
        })
      }
    }
    
    closeSaveDialog()
    
  } catch (error) {
    console.error('Erreur sauvegarde workflow:', error)
    $q.notify({
      type: 'negative',
      message: 'Erreur lors de la sauvegarde'
    })
  } finally {
    saving.value = false
  }
}



function editWorkflow(workflow) {
  editingWorkflow.value = workflow
  workflowForm.value = {
    name: workflow.name,
    description: workflow.description || ''
  }
  showSaveDialog.value = true
}



function formatDate(dateStr) {
  try {
    const date = new Date(dateStr)
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch (e) {
    return dateStr
  }
}

function loadWorkflow(workflow) {
  // Émettre l'événement avec l'objet workflow complet pour le builder
  emit('workflow-loaded', workflow)
  visible.value = false
  
  $q.notify({
    type: 'positive',
    message: `Workflow "${workflow.name}" chargé`,
    position: 'top'
  })
}





function duplicateWorkflow(workflow) {
  try {
    const duplicated = workflowStore.duplicateWorkflow(workflow.id)
    
    if (duplicated) {
      $q.notify({
        type: 'positive',
        message: `Workflow dupliqué: "${duplicated.name}"`,
        position: 'top'
      })
    }
  } catch (e) {
    $q.notify({
      type: 'negative',
      message: 'Erreur lors de la duplication',
      position: 'top'
    })
  }
}

function exportWorkflow(workflow) {
  try {
    const exported = workflowStore.exportWorkflow(workflow)
    
    $q.notify({
      type: 'positive',
      message: 'Workflow exporté vers les téléchargements',
      position: 'top'
    })
  } catch (e) {
    $q.notify({
      type: 'negative',
      message: 'Erreur lors de l\'export',
      position: 'top'
    })
  }
}

function deleteWorkflow(workflow) {
  $q.dialog({
    title: 'Confirmer la suppression',
    message: `Êtes-vous sûr de vouloir supprimer le workflow "${workflow.name}" ?`,
    cancel: true,
    persistent: true
  }).onOk(() => {
    try {
      workflowStore.deleteSavedWorkflow(workflow.id)
      
      // Désélectionner le workflow s'il était sélectionné
      if (selectedWorkflow.value?.id === workflow.id) {
        selectedWorkflow.value = null
      }
      
      $q.notify({
        type: 'positive',
        message: 'Workflow supprimé'
      })
    } catch (e) {
      $q.notify({
        type: 'negative',
        message: 'Erreur lors de la suppression'
      })
    }
  })
}

function importWorkflow() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json'
  
  input.onchange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const imported = workflowStore.importWorkflow(e.target.result)
        
        $q.notify({
          type: 'positive',
          message: `Workflow "${imported.name}" importé`,
          position: 'top'
        })
      } catch (e) {
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
</script>

<style scoped lang="scss">
.saved-workflow-manager {
  .workflow-item {
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