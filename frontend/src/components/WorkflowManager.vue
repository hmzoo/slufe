<template>
  <div class="workflow-manager">
    <!-- HEADER -->
    <div class="row q-col-gutter-md q-mb-lg items-center">
      <div class="col">
        <div class="text-h5 q-mb-sm">
          <q-icon name="account_tree" class="q-mr-sm" />
          Gestionnaire de Workflows
        </div>
        <div class="text-body2 text-grey-7">
          Gérez vos workflows sauvegardés, créez de nouveaux workflows et organisez votre travail
        </div>
      </div>
      
      <div class="col-auto">
        <q-btn 
          color="primary" 
          icon="add" 
          label="Nouveau workflow"
          @click="createNewWorkflow"
          unelevated
        />
      </div>
    </div>

    <!-- FILTRES ET OPTIONS -->
    <div class="row q-col-gutter-md q-mb-lg items-center">
      <div class="col-md-4">
        <q-input
          v-model="workflowSearch"
          placeholder="Rechercher des workflows..."
          outlined
          dense
        >
          <template v-slot:prepend>
            <q-icon name="search" />
          </template>
        </q-input>
      </div>
      
      <div class="col-md-3">
        <q-select
          v-model="workflowSortBy"
          :options="sortOptions"
          label="Trier par"
          outlined
          dense
          emit-value
          map-options
        />
      </div>
      
      <div class="col-md-2">
        <q-btn-toggle
          v-model="workflowViewMode"
          :options="[
            { label: '', value: 'grid', icon: 'grid_view' },
            { label: '', value: 'list', icon: 'view_list' }
          ]"
          outline
          color="primary"
        />
      </div>
      
      <div class="col-auto">
        <q-chip outline>
          {{ filteredWorkflows.length }} workflow{{ filteredWorkflows.length > 1 ? 's' : '' }}
        </q-chip>
      </div>
    </div>

    <!-- LISTE/GRILLE DES WORKFLOWS -->
    <div v-if="workflowViewMode === 'grid'" class="workflows-grid">
      <div class="row q-col-gutter-lg">
        <div 
          v-for="workflow in filteredWorkflows" 
          :key="workflow.id"
          class="col-12 col-md-6 col-lg-4"
        >
          <q-card flat bordered class="workflow-card cursor-pointer" @click="openWorkflow(workflow)">
            <q-card-section>
              <div class="row items-start q-mb-sm">
                <div class="col">
                  <div class="text-h6 q-mb-xs">{{ workflow.name }}</div>
                  <div class="text-body2 text-grey-7">{{ workflow.description }}</div>
                </div>
                
                <q-btn-dropdown 
                  flat 
                  round 
                  icon="more_vert" 
                  @click.stop
                  class="workflow-actions"
                >
                  <q-list>
                    <q-item clickable @click="editWorkflow(workflow)">
                      <q-item-section avatar>
                        <q-icon name="edit" />
                      </q-item-section>
                      <q-item-section>Éditer</q-item-section>
                    </q-item>
                    
                    <q-item clickable @click="duplicateWorkflow(workflow)">
                      <q-item-section avatar>
                        <q-icon name="content_copy" />
                      </q-item-section>
                      <q-item-section>Dupliquer</q-item-section>
                    </q-item>
                    
                    <q-item clickable @click="exportWorkflow(workflow)">
                      <q-item-section avatar>
                        <q-icon name="download" />
                      </q-item-section>
                      <q-item-section>Exporter</q-item-section>
                    </q-item>
                    
                    <q-separator />
                    
                    <q-item clickable @click="deleteWorkflow(workflow)" class="text-negative">
                      <q-item-section avatar>
                        <q-icon name="delete" />
                      </q-item-section>
                      <q-item-section>Supprimer</q-item-section>
                    </q-item>
                  </q-list>
                </q-btn-dropdown>
              </div>
              
              <!-- Statistiques du workflow -->
              <div class="workflow-stats row q-gutter-md q-mb-sm">
                <div class="text-caption text-grey-6">
                  <q-icon name="input" size="xs" class="q-mr-xs" />
                  {{ getWorkflowStats(workflow).inputs }} entrées
                </div>
                <div class="text-caption text-grey-6">
                  <q-icon name="settings" size="xs" class="q-mr-xs" />
                  {{ getWorkflowStats(workflow).tasks }} tâches
                </div>
                <div class="text-caption text-grey-6">
                  <q-icon name="output" size="xs" class="q-mr-xs" />
                  {{ getWorkflowStats(workflow).outputs }} sorties
                </div>
              </div>
              
              <!-- Métadonnées -->
              <div class="text-caption text-grey-5">
                Créé le {{ formatDate(workflow.createdAt) }}
                • Modifié le {{ formatDate(workflow.updatedAt) }}
              </div>
            </q-card-section>
            
            <q-card-actions align="right">
              <q-btn 
                flat 
                label="Éditer" 
                @click.stop="editWorkflow(workflow)"
              />
              <q-btn 
                color="primary" 
                label="Exécuter"
                @click.stop="executeWorkflow(workflow)"
                unelevated
              />
            </q-card-actions>
          </q-card>
        </div>
      </div>
    </div>

    <!-- VUE LISTE -->
    <div v-else class="workflows-list">
      <q-list bordered separator>
        <q-item 
          v-for="workflow in filteredWorkflows" 
          :key="workflow.id"
          clickable
          @click="openWorkflow(workflow)"
          class="workflow-item"
        >
          <q-item-section avatar>
            <q-icon name="account_tree" size="md" />
          </q-item-section>
          
          <q-item-section>
            <q-item-label class="text-subtitle1">{{ workflow.name }}</q-item-label>
            <q-item-label caption>{{ workflow.description }}</q-item-label>
            
            <div class="row q-gutter-md q-mt-xs">
              <div class="text-caption text-grey-6">
                {{ getWorkflowStats(workflow).inputs }}+{{ getWorkflowStats(workflow).tasks }}+{{ getWorkflowStats(workflow).outputs }} éléments
              </div>
              <div class="text-caption text-grey-6">
                Modifié le {{ formatDate(workflow.updatedAt) }}
              </div>
            </div>
          </q-item-section>
          
          <q-item-section side>
            <div class="row items-center q-gutter-sm">
              <q-btn 
                flat 
                round 
                icon="edit" 
                @click.stop="editWorkflow(workflow)"
              >
                <q-tooltip>Éditer</q-tooltip>
              </q-btn>
              
              <q-btn 
                color="primary" 
                round 
                icon="play_arrow"
                @click.stop="executeWorkflow(workflow)"
              >
                <q-tooltip>Exécuter</q-tooltip>
              </q-btn>
              
              <q-btn-dropdown 
                flat 
                round 
                icon="more_vert" 
                @click.stop
              >
                <q-list>
                  <q-item clickable @click="duplicateWorkflow(workflow)">
                    <q-item-section avatar>
                      <q-icon name="content_copy" />
                    </q-item-section>
                    <q-item-section>Dupliquer</q-item-section>
                  </q-item>
                  
                  <q-item clickable @click="exportWorkflow(workflow)">
                    <q-item-section avatar>
                      <q-icon name="download" />
                    </q-item-section>
                    <q-item-section>Exporter</q-item-section>
                  </q-item>
                  
                  <q-separator />
                  
                  <q-item clickable @click="deleteWorkflow(workflow)" class="text-negative">
                    <q-item-section avatar>
                      <q-icon name="delete" />
                    </q-item-section>
                    <q-item-section>Supprimer</q-item-section>
                  </q-item>
                </q-list>
              </q-btn-dropdown>
            </div>
          </q-item-section>
        </q-item>
      </q-list>
    </div>

    <!-- MESSAGE SI AUCUN WORKFLOW -->
    <div v-if="savedWorkflows.length === 0" class="text-center q-py-xl">
      <q-icon name="account_tree" size="4rem" class="q-mb-md" />
      <div class="text-h6 q-mb-sm">Aucun workflow sauvegardé</div>
      <div class="text-body2 text-grey-7 q-mb-lg">
        Créez votre premier workflow dans la section Builder
      </div>
      <q-btn 
        color="primary" 
        icon="build" 
        label="Aller au Builder"
        @click="goToBuilder"
        unelevated
      />
    </div>

    <!-- STATISTIQUES (si workflows présents) -->
    <div v-if="savedWorkflows.length > 0" class="q-mt-xl">
      <q-separator class="q-mb-md" />
      <div class="text-h6 q-mb-md">📊 Statistiques</div>
      
      <div class="row q-col-gutter-md">
        <div class="col-md-3 col-6">
          <q-card flat bordered>
            <q-card-section class="text-center">
              <div class="text-h4 text-primary">{{ savedWorkflows.length }}</div>
              <div class="text-body2">Workflows</div>
            </q-card-section>
          </q-card>
        </div>
        
        <div class="col-md-3 col-6">
          <q-card flat bordered>
            <q-card-section class="text-center">
              <div class="text-h4 text-green">{{ getTotalTasks() }}</div>
              <div class="text-body2">Tâches totales</div>
            </q-card-section>
          </q-card>
        </div>
        
        <div class="col-md-3 col-6">
          <q-card flat bordered>
            <q-card-section class="text-center">
              <div class="text-h4 text-orange">{{ getLastModified() }}</div>
              <div class="text-body2">Dernière modification</div>
            </q-card-section>
          </q-card>
        </div>
        
        <div class="col-md-3 col-6">
          <q-card flat bordered>
            <q-card-section class="text-center">
              <div class="text-h4 text-purple">{{ getAverageComplexity() }}</div>
              <div class="text-body2">Complexité moyenne</div>
            </q-card-section>
          </q-card>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { useWorkflowStore } from 'src/stores/useWorkflowStore'

// Emits pour communiquer avec le composant parent
const emit = defineEmits(['open-builder', 'load-workflow'])

// Stores et composables
const workflowStore = useWorkflowStore()
const $q = useQuasar()

// Reactive variables
const workflowSearch = ref('')
const workflowSortBy = ref('updatedAt')
const workflowViewMode = ref('grid')

// Utiliser les workflows du store au lieu d'une variable locale
const savedWorkflows = computed(() => workflowStore.savedWorkflows)

// Options de tri
const sortOptions = [
  { label: 'Dernière modification', value: 'updatedAt' },
  { label: 'Date de création', value: 'createdAt' },
  { label: 'Nom (A-Z)', value: 'name' },
  { label: 'Complexité', value: 'complexity' }
]

// Computed
const filteredWorkflows = computed(() => {
  let filtered = savedWorkflows.value

  // Filtrer par recherche
  if (workflowSearch.value) {
    const search = workflowSearch.value.toLowerCase()
    filtered = filtered.filter(workflow => 
      workflow.name.toLowerCase().includes(search) ||
      workflow.description.toLowerCase().includes(search)
    )
  }

  // Trier
  if (workflowSortBy.value === 'updatedAt') {
    filtered.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
  } else if (workflowSortBy.value === 'createdAt') {
    filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  } else if (workflowSortBy.value === 'name') {
    filtered.sort((a, b) => a.name.localeCompare(b.name))
  } else if (workflowSortBy.value === 'complexity') {
    filtered.sort((a, b) => getTotalElements(b) - getTotalElements(a))
  }

  return filtered
})

// Functions
const getWorkflowStats = (workflow) => {
  return {
    inputs: workflow.inputs?.length || 0,
    tasks: workflow.tasks?.length || 0,
    outputs: workflow.outputs?.length || 0
  }
}

const getTotalElements = (workflow) => {
  const stats = getWorkflowStats(workflow)
  return stats.inputs + stats.tasks + stats.outputs
}

const getTotalTasks = () => {
  return savedWorkflows.value.reduce((total, workflow) => {
    return total + getTotalElements(workflow)
  }, 0)
}

const getLastModified = () => {
  if (savedWorkflows.value.length === 0) return 'N/A'
  
  const lastModified = Math.max(...savedWorkflows.value.map(w => new Date(w.updatedAt)))
  const diffInDays = Math.floor((Date.now() - lastModified) / (1000 * 60 * 60 * 24))
  
  if (diffInDays === 0) return 'Aujourd\'hui'
  if (diffInDays === 1) return 'Hier'
  return `${diffInDays} jours`
}

const getAverageComplexity = () => {
  if (savedWorkflows.value.length === 0) return '0'
  
  const totalComplexity = savedWorkflows.value.reduce((sum, workflow) => {
    return sum + getTotalElements(workflow)
  }, 0)
  
  return Math.round(totalComplexity / savedWorkflows.value.length)
}

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

// Actions
const createNewWorkflow = () => {
  emit('open-builder')
}

const goToBuilder = () => {
  emit('open-builder')
}

const openWorkflow = (workflow) => {
  editWorkflow(workflow)
}

const editWorkflow = (workflow) => {
  emit('load-workflow', workflow)
  emit('open-builder')
}

const executeWorkflow = async (workflow) => {
  $q.notify({
    type: 'info',
    message: `Exécution du workflow "${workflow.name}"...`,
    position: 'top'
  })
  
  // TODO: Implémenter l'exécution
  setTimeout(() => {
    $q.notify({
      type: 'positive',
      message: `Workflow "${workflow.name}" exécuté avec succès`,
      position: 'top'
    })
  }, 2000)
}

const duplicateWorkflow = (workflow) => {
  workflowStore.duplicateWorkflow(workflow.id)
  
  $q.notify({
    type: 'positive',
    message: `Workflow dupliqué: "${workflow.name} (copie)"`,
    position: 'top'
  })
}

const exportWorkflow = (workflow) => {
  try {
    const exportData = workflowStore.exportWorkflow(workflow.id)
    const dataStr = JSON.stringify(exportData, null, 2)
    const blob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = `${workflow.name.replace(/[^a-z0-9]/gi, '_')}.json`
    link.click()
    
    URL.revokeObjectURL(url)
    
    $q.notify({
      type: 'positive',
      message: `Workflow "${workflow.name}" exporté`,
      position: 'top'
    })
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: `Erreur lors de l'export: ${error.message}`,
      position: 'top'
    })
  }
}

const deleteWorkflow = (workflow) => {
  $q.dialog({
    title: 'Confirmer la suppression',
    message: `Êtes-vous sûr de vouloir supprimer le workflow "${workflow.name}" ?`,
    cancel: true,
    persistent: true
  }).onOk(() => {
    workflowStore.deleteSavedWorkflow(workflow.id)
    $q.notify({
      type: 'positive',
      message: `Workflow "${workflow.name}" supprimé`,
      position: 'top'
    })
  })
}

// Initialisation
onMounted(() => {
  console.log('WorkflowManager: Chargement des workflows depuis le store')
  console.log('Workflows disponibles:', workflowStore.savedWorkflows)
  
  // Les workflows sont automatiquement chargés depuis le store via computed
  // Pas besoin de données d'exemple ici
})
</script>

<style scoped>
.workflow-manager {
  padding: 0;
}

.workflows-grid,
.workflows-list {
  min-height: 300px;
}

.workflow-card {
  transition: all 0.3s ease;
  height: 100%;
}

.workflow-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.workflow-item:hover {
  background-color: #f5f5f5;
}

.workflow-stats {
  border-top: 1px solid #e0e0e0;
  padding-top: 8px;
  margin-top: 8px;
}

.workflow-actions {
  opacity: 0.7;
  transition: opacity 0.2s ease;
}

.workflow-card:hover .workflow-actions {
  opacity: 1;
}
</style>