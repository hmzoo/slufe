<template>
  <div v-if="metadata" class="task-variable-info q-pa-sm bg-grey-1 rounded-borders">
    <div class="row items-center q-gutter-sm">
      <!-- Préfixe suggéré -->
      <div class="col-auto">
        <q-chip 
          dense 
          square 
          color="primary" 
          text-color="white"
          icon="label"
          size="sm"
        >
          Préfixe: {{ metadata.variablePrefix }}
        </q-chip>
      </div>

      <!-- Exemple de variable -->
      <div class="col">
        <div class="text-caption text-grey-7">
          Exemple: <code class="variable-code">{{ metadata.variableExample }}</code>
        </div>
      </div>

      <!-- Bouton documentation -->
      <div class="col-auto">
        <q-btn 
          flat 
          dense 
          round 
          icon="help" 
          size="sm"
          @click="showDocumentation = true"
        >
          <q-tooltip>Voir la documentation</q-tooltip>
        </q-btn>
      </div>
    </div>

    <!-- Outputs disponibles (condensé) -->
    <div v-if="outputs.length > 0" class="q-mt-xs">
      <div class="text-caption text-weight-medium text-grey-7 q-mb-xs">
        Outputs disponibles:
      </div>
      <div class="row q-gutter-xs">
        <q-chip
          v-for="output in outputs"
          :key="output.key"
          dense
          square
          :color="getTypeColor(output.type)"
          text-color="white"
          size="sm"
          clickable
          @click="copyOutput(output)"
        >
          <code style="color: white;">{{ output.key }}</code>
          <q-tooltip>
            {{ output.description }}<br>
            Cliquer pour copier: {{ output.variablePath }}
          </q-tooltip>
        </q-chip>
      </div>
    </div>

    <!-- Dialog documentation complète -->
    <q-dialog v-model="showDocumentation">
      <q-card style="min-width: 500px; max-width: 700px;">
        <q-card-section class="bg-primary text-white">
          <div class="text-h6">
            <q-icon name="description" class="q-mr-sm" />
            Documentation: {{ metadata.name }}
          </div>
        </q-card-section>

        <q-card-section class="q-pa-md">
          <div v-html="renderedDocumentation" class="documentation-content"></div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Fermer" color="primary" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import { useQuasar } from 'quasar'
import { 
  getTaskMetadata, 
  getTaskOutputs, 
  generateTaskDocumentation 
} from '../utils/variableHelper.js'
import { marked } from 'marked'

export default {
  name: 'TaskVariableInfo',

  props: {
    taskType: {
      type: String,
      required: true
    },
    taskId: {
      type: String,
      default: null
    }
  },

  setup(props) {
    const $q = useQuasar()
    const showDocumentation = ref(false)

    // Métadonnées de la tâche
    const metadata = computed(() => {
      return getTaskMetadata(props.taskType)
    })

    // Outputs disponibles
    const outputs = computed(() => {
      return getTaskOutputs(props.taskType)
    })

    // Documentation formatée en HTML
    const renderedDocumentation = computed(() => {
      const doc = generateTaskDocumentation(props.taskType)
      return marked(doc)
    })

    // Copier un output
    function copyOutput(output) {
      const variable = props.taskId 
        ? output.variablePath.replace('taskId', props.taskId)
        : output.variablePath
      
      navigator.clipboard.writeText(variable)
        .then(() => {
          $q.notify({
            type: 'positive',
            message: `Variable copiée: ${variable}`,
            position: 'top',
            timeout: 1000
          })
        })
        .catch(err => {
          console.error('Erreur copie:', err)
        })
    }

    // Couleur selon type
    function getTypeColor(type) {
      const colors = {
        image: 'blue',
        images: 'blue-7',
        video: 'red',
        text: 'green',
        array: 'purple',
        object: 'orange'
      }
      return colors[type] || 'grey'
    }

    return {
      metadata,
      outputs,
      showDocumentation,
      renderedDocumentation,
      copyOutput,
      getTypeColor
    }
  }
}
</script>

<style scoped>
.task-variable-info {
  border: 1px solid rgba(0, 0, 0, 0.1);
}

.variable-code {
  background-color: rgba(0, 0, 0, 0.1);
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 0.85em;
  font-family: 'Courier New', monospace;
  color: #1976d2;
}

.documentation-content {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  line-height: 1.6;
}

.documentation-content :deep(h3) {
  margin-top: 0;
  color: #1976d2;
}

.documentation-content :deep(code) {
  background-color: rgba(0, 0, 0, 0.05);
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 0.9em;
}

.documentation-content :deep(pre) {
  background-color: #f5f5f5;
  padding: 12px;
  border-radius: 4px;
  overflow-x: auto;
}

.documentation-content :deep(ul) {
  padding-left: 20px;
}
</style>
