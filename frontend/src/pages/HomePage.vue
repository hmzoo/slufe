<template>
  <q-page class="page-container q-pa-md">
    <div class="row q-col-gutter-lg">
      <!-- Workflow Runner Principal -->
      <div class="col-12">
        <WorkflowRunner />
      </div>
    </div>

    <!-- Historique des workflows -->
    <div v-if="workflowStore.workflowHistory.length > 0" class="q-mt-xl">
      <q-separator class="q-mb-md" />
      <div class="text-h6 q-mb-md">📚 Historique des exécutions</div>
      
      <div class="row q-col-gutter-md">
        <div 
          v-for="entry in workflowStore.workflowHistory.slice(0, 6)" 
          :key="entry.id"
          class="col-12 col-md-6 col-lg-4"
        >
          <q-card flat bordered class="history-card">
            <q-card-section>
              <div class="text-subtitle2 q-mb-xs">{{ entry.workflow.name }}</div>
              <div class="text-caption text-grey-6 q-mb-sm">
                {{ new Date(entry.timestamp).toLocaleString() }}
              </div>
              
              <!-- Aperçu des résultats -->
              <div v-if="entry.result?.task_outputs" class="result-preview">
                <div v-for="(output, taskId) in entry.result.task_outputs" :key="taskId">
                  <q-img
                    v-if="output.image"
                    :src="output.image"
                    style="max-height: 80px; width: 100%"
                    class="rounded-borders q-mb-xs"
                    fit="cover"
                  />
                  <div
                    v-else-if="output.edited_images && output.edited_images[0]"
                    class="row q-col-gutter-xs"
                  >
                    <div class="col-6" v-for="(img, idx) in output.edited_images.slice(0, 2)" :key="idx">
                      <q-img
                        :src="img.editedImageUrl"
                        style="height: 60px"
                        class="rounded-borders"
                        fit="cover"
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              <div class="row justify-end q-mt-sm">
                <q-btn
                  flat
                  size="sm"
                  color="primary"
                  icon="replay"
                  label="Réexécuter"
                  @click="rerunWorkflow(entry)"
                />
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>
      
      <div v-if="workflowStore.workflowHistory.length > 6" class="text-center q-mt-md">
        <q-btn
          flat
          color="primary"
          icon="history"
          label="Voir tout l'historique"
          @click="showFullHistory = true"
        />
      </div>
    </div>

    <!-- Dialog historique complet -->
    <q-dialog v-model="showFullHistory" maximized>
      <q-card>
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">Historique complet des workflows</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>

        <q-card-section class="q-pt-none">
          <q-list separator>
            <q-item v-for="entry in workflowStore.workflowHistory" :key="entry.id">
              <q-item-section avatar>
                <q-icon name="account_tree" />
              </q-item-section>
              
              <q-item-section>
                <q-item-label>{{ entry.workflow.name }}</q-item-label>
                <q-item-label caption>
                  {{ new Date(entry.timestamp).toLocaleString() }}
                </q-item-label>
                <q-item-label caption>
                  Exécution: {{ entry.result?.execution_id }}
                </q-item-label>
              </q-item-section>

              <q-item-section side>
                <q-badge
                  :color="entry.result?.success ? 'positive' : 'negative'"
                  :label="entry.result?.success ? 'Succès' : 'Erreur'"
                />
              </q-item-section>

              <q-item-section side>
                <div class="row q-gutter-xs">
                  <q-btn
                    flat
                    round
                    icon="replay"
                    color="primary"
                    size="sm"
                    @click="rerunWorkflow(entry)"
                  />
                  <q-btn
                    flat
                    round
                    icon="delete"
                    color="negative"
                    size="sm"
                    @click="deleteHistoryEntry(entry.id)"
                  />
                </div>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref } from 'vue'
import { useWorkflowStore } from 'src/stores/useWorkflowStore'
import { useQuasar } from 'quasar'
import WorkflowRunner from 'src/components/WorkflowRunner.vue'

const workflowStore = useWorkflowStore()
const $q = useQuasar()

const showFullHistory = ref(false)

function rerunWorkflow(historyEntry) {
  // Créer un template temporaire à partir de l'historique
  const template = {
    id: 'rerun-' + historyEntry.id,
    name: historyEntry.workflow.name + ' (Re-run)',
    description: historyEntry.workflow.description,
    icon: 'replay',
    category: 'history',
    workflow: historyEntry.workflow,
    inputs: extractInputsFromHistory(historyEntry)
  }
  
  workflowStore.setCurrentWorkflow(template)
  
  // Restaurer les valeurs d'entrée
  Object.keys(historyEntry.inputs).forEach(key => {
    workflowStore.updateInputValue(key, historyEntry.inputs[key])
  })
  
  $q.notify({
    type: 'positive',
    message: 'Workflow rechargé depuis l\'historique',
    position: 'top'
  })
}

function extractInputsFromHistory(historyEntry) {
  // Reconstruit la définition des inputs à partir des valeurs utilisées
  const inputs = {}
  
  Object.keys(historyEntry.inputs).forEach(key => {
    const value = historyEntry.inputs[key]
    
    if (Array.isArray(value) && value.length > 0 && value[0].startsWith && value[0].startsWith('data:image')) {
      inputs[key] = {
        type: 'images',
        label: key.charAt(0).toUpperCase() + key.slice(1),
        hint: 'Images utilisées dans l\'exécution précédente',
        required: true
      }
    } else if (typeof value === 'string') {
      inputs[key] = {
        type: 'text',
        label: key.charAt(0).toUpperCase() + key.slice(1),
        placeholder: value,
        hint: 'Valeur précédente: ' + (value.length > 50 ? value.substring(0, 50) + '...' : value),
        required: true
      }
    } else if (typeof value === 'number') {
      inputs[key] = {
        type: 'number',
        label: key.charAt(0).toUpperCase() + key.slice(1),
        hint: 'Valeur précédente: ' + value,
        required: true
      }
    } else {
      inputs[key] = {
        type: 'text',
        label: key.charAt(0).toUpperCase() + key.slice(1),
        hint: 'Valeur: ' + JSON.stringify(value),
        required: false
      }
    }
  })
  
  return inputs
}

function deleteHistoryEntry(entryId) {
  const index = workflowStore.workflowHistory.findIndex(entry => entry.id === entryId)
  if (index > -1) {
    workflowStore.workflowHistory.splice(index, 1)
    $q.notify({
      type: 'positive',
      message: 'Entrée supprimée de l\'historique',
      position: 'top'
    })
  }
}
</script>

<style scoped lang="scss">
.page-container {
  max-width: 1400px;
  margin: 0 auto;
}

.history-card {
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  }
  
  .result-preview {
    min-height: 60px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
}
</style>
