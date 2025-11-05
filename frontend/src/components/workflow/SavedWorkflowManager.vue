<template>
  <q-dialog v-model="visible" persistent>
    <q-card style="min-width: 700px; max-width: 900px;">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">Mes Workflows Sauvegardés</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section>
        <!-- Actions globales -->
        <div class="row q-gutter-sm q-mb-md">
          <q-btn 
            icon="add"
            label="Sauvegarder le workflow actuel"
            color="primary"
            @click="showSaveDialog = true"
            :disable="!workflowStore.currentWorkflow"
          />
          <q-btn 
            icon="file_download"
            label="Importer"
            color="secondary"
            @click="importWorkflow"
          />
          <q-space />
          <q-input
            v-model="searchText"
            placeholder="Rechercher..."
            outlined
            dense
            class="search-input"
          >
            <template v-slot:prepend>
              <q-icon name="search" />
            </template>
          </q-input>
        </div>

        <!-- Liste des workflows -->
        <q-list separator class="workflow-list">
          <template v-if="filteredWorkflows.length === 0">
            <q-item>
              <q-item-section>
                <q-item-label class="text-grey-6 text-center">
                  Aucun workflow sauvegardé
                </q-item-label>
              </q-item-section>
            </q-item>
          </template>
          
          <q-item
            v-for="workflow in filteredWorkflows"
            :key="workflow.id"
            clickable
            v-ripple
            class="workflow-item"
          >
            <q-item-section avatar>
              <q-avatar color="primary" text-color="white" :icon="workflow.icon || 'save'" />
            </q-item-section>

            <q-item-section>
              <q-item-label class="text-weight-medium">{{ workflow.name }}</q-item-label>
              <q-item-label caption lines="2">{{ workflow.description }}</q-item-label>
              <q-item-label caption class="text-grey-6">
                <q-icon name="schedule" size="xs" /> 
                {{ formatDate(workflow.createdAt) }}
                <span v-if="workflow.version > 1" class="q-ml-sm">
                  <q-icon name="update" size="xs" /> v{{ workflow.version }}
                </span>
              </q-item-label>
            </q-item-section>

            <q-item-section side>
              <div class="row q-gutter-xs">
                <!-- Charger dans builder -->
                <q-btn
                  icon="play_arrow"
                  color="primary"
                  flat
                  round
                  size="sm"
                  @click="loadWorkflow(workflow)"
                >
                  <q-tooltip>Charger ce workflow</q-tooltip>
                </q-btn>

                <!-- Menu actions -->
                <q-btn icon="more_vert" flat round size="sm">
                  <q-menu>
                    <q-list dense>
                      <q-item clickable @click="editWorkflow(workflow)">
                        <q-item-section avatar>
                          <q-icon name="edit" size="xs" />
                        </q-item-section>
                        <q-item-section>Renommer</q-item-section>
                      </q-item>
                      
                      <q-item clickable @click="duplicateWorkflow(workflow)">
                        <q-item-section avatar>
                          <q-icon name="content_copy" size="xs" />
                        </q-item-section>
                        <q-item-section>Dupliquer</q-item-section>
                      </q-item>
                      
                      <q-item clickable @click="exportWorkflow(workflow)">
                        <q-item-section avatar>
                          <q-icon name="file_upload" size="xs" />
                        </q-item-section>
                        <q-item-section>Exporter</q-item-section>
                      </q-item>
                      
                      <q-separator />
                      
                      <q-item clickable @click="deleteWorkflow(workflow)" class="text-negative">
                        <q-item-section avatar>
                          <q-icon name="delete" size="xs" />
                        </q-item-section>
                        <q-item-section>Supprimer</q-item-section>
                      </q-item>
                    </q-list>
                  </q-menu>
                </q-btn>
              </div>
            </q-item-section>
          </q-item>
        </q-list>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Fermer" v-close-popup />
      </q-card-actions>
    </q-card>
  </q-dialog>

  <!-- Dialog de sauvegarde -->
  <q-dialog v-model="showSaveDialog">
    <q-card style="min-width: 400px;">
      <q-card-section>
        <div class="text-h6">Sauvegarder le workflow</div>
      </q-card-section>

      <q-card-section class="q-pt-none">
        <q-input
          v-model="newWorkflowName"
          label="Nom du workflow"
          outlined
          autofocus
          @keyup.enter="saveCurrentWorkflow"
        />
        <q-input
          v-model="newWorkflowDescription"
          label="Description (optionnelle)"
          type="textarea"
          outlined
          rows="3"
          class="q-mt-md"
        />
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Annuler" v-close-popup />
        <q-btn 
          color="primary" 
          label="Sauvegarder" 
          @click="saveCurrentWorkflow"
          :disable="!newWorkflowName.trim()"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>

  <!-- Dialog d'édition -->
  <q-dialog v-model="showEditDialog">
    <q-card style="min-width: 400px;">
      <q-card-section>
        <div class="text-h6">Renommer le workflow</div>
      </q-card-section>

      <q-card-section class="q-pt-none">
        <q-input
          v-model="editWorkflowName"
          label="Nom du workflow"
          outlined
          autofocus
          @keyup.enter="confirmEdit"
        />
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Annuler" v-close-popup />
        <q-btn 
          color="primary" 
          label="Renommer" 
          @click="confirmEdit"
          :disable="!editWorkflowName.trim()"
        />
      </q-card-actions>
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
const showSaveDialog = ref(false)
const showEditDialog = ref(false)
const editingWorkflow = ref(null)

// Formulaires
const newWorkflowName = ref('')
const newWorkflowDescription = ref('')
const editWorkflowName = ref('')

// Workflows filtrés
const filteredWorkflows = computed(() => {
  if (!searchText.value.trim()) {
    return [...workflowStore.savedWorkflows].reverse() // Plus récents en premier
  }
  
  const search = searchText.value.toLowerCase()
  return workflowStore.savedWorkflows
    .filter(w => 
      w.name.toLowerCase().includes(search) ||
      w.description.toLowerCase().includes(search)
    )
    .reverse()
})

// Méthodes
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

function saveCurrentWorkflow() {
  if (!newWorkflowName.value.trim()) return
  
  try {
    const saved = workflowStore.saveWorkflow(
      newWorkflowName.value.trim(),
      newWorkflowDescription.value.trim()
    )
    
    if (saved) {
      $q.notify({
        type: 'positive',
        message: `Workflow "${saved.name}" sauvegardé`,
        position: 'top'
      })
      
      // Reset form
      newWorkflowName.value = ''
      newWorkflowDescription.value = ''
      showSaveDialog.value = false
    }
  } catch (e) {
    $q.notify({
      type: 'negative',
      message: 'Erreur lors de la sauvegarde',
      position: 'top'
    })
  }
}

function editWorkflow(workflow) {
  editingWorkflow.value = workflow
  editWorkflowName.value = workflow.name
  showEditDialog.value = true
}

function confirmEdit() {
  if (!editWorkflowName.value.trim() || !editingWorkflow.value) return
  
  try {
    workflowStore.renameWorkflow(editingWorkflow.value.id, editWorkflowName.value.trim())
    
    $q.notify({
      type: 'positive',
      message: 'Workflow renommé',
      position: 'top'
    })
    
    showEditDialog.value = false
    editingWorkflow.value = null
    editWorkflowName.value = ''
  } catch (e) {
    $q.notify({
      type: 'negative',
      message: 'Erreur lors du renommage',
      position: 'top'
    })
  }
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
      
      $q.notify({
        type: 'positive',
        message: 'Workflow supprimé',
        position: 'top'
      })
    } catch (e) {
      $q.notify({
        type: 'negative',
        message: 'Erreur lors de la suppression',
        position: 'top'
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

<style scoped>
.workflow-list {
  max-height: 500px;
  overflow-y: auto;
}

.workflow-item {
  border-left: 3px solid transparent;
  transition: border-color 0.2s;
}

.workflow-item:hover {
  border-left-color: var(--q-primary);
}

.search-input {
  min-width: 200px;
}
</style>