<template>
  <q-card flat bordered class="variable-helper">
    <q-card-section class="bg-primary text-white q-py-sm">
      <div class="text-subtitle2">
        <q-icon name="code" class="q-mr-sm" />
        Variables disponibles
      </div>
    </q-card-section>

    <q-card-section class="q-pa-none">
      <!-- Filtre par type -->
      <q-tabs
        v-model="filterType"
        dense
        class="text-grey-7"
        active-color="primary"
        indicator-color="primary"
        align="justify"
      >
        <q-tab name="all" label="Toutes" />
        <q-tab name="image" label="Images" icon="image" />
        <q-tab name="video" label="Vidéos" icon="videocam" />
        <q-tab name="text" label="Texte" icon="text_fields" />
      </q-tabs>

      <!-- Liste des variables -->
      <q-list separator dense>
        <q-item
          v-for="variable in filteredVariables"
          :key="variable.variable"
          clickable
          v-ripple
          @click="copyVariable(variable.variable)"
          class="variable-item"
        >
          <q-item-section avatar>
            <q-avatar 
              :color="getTypeColor(variable.outputType)" 
              text-color="white" 
              size="md"
            >
              <q-icon :name="getTypeIcon(variable.outputType)" size="xs" />
            </q-avatar>
          </q-item-section>

          <q-item-section>
            <q-item-label class="text-weight-medium">
              <code class="variable-code">{{ variable.variable }}</code>
            </q-item-label>
            <q-item-label caption lines="2">
              {{ variable.taskName }} → {{ variable.description }}
            </q-item-label>
          </q-item-section>

          <q-item-section side>
            <q-btn 
              flat 
              dense 
              round 
              icon="content_copy" 
              size="sm"
              @click.stop="copyVariable(variable.variable)"
            >
              <q-tooltip>Copier</q-tooltip>
            </q-btn>
          </q-item-section>
        </q-item>

        <q-item v-if="filteredVariables.length === 0">
          <q-item-section class="text-center text-grey-6">
            <div class="q-pa-md">
              <q-icon name="info" size="md" class="q-mb-sm" />
              <div class="text-caption">
                Aucune variable disponible
                <template v-if="filterType !== 'all'">
                  pour le type "{{ filterType }}"
                </template>
              </div>
            </div>
          </q-item-section>
        </q-item>
      </q-list>
    </q-card-section>

    <!-- Footer avec conseils -->
    <q-separator />
    <q-card-section class="bg-grey-1 q-py-sm">
      <div class="text-caption text-grey-7">
        <q-icon name="lightbulb" size="xs" class="q-mr-xs" />
        Cliquez pour copier une variable
      </div>
    </q-card-section>
  </q-card>
</template>

<script>
import { ref, computed } from 'vue'
import { useQuasar } from 'quasar'
import { getAvailableVariables, filterVariablesByType } from '../utils/variableHelper.js'

export default {
  name: 'VariableHelper',

  props: {
    tasks: {
      type: Array,
      required: true,
      default: () => []
    },
    currentTaskId: {
      type: String,
      default: null
    }
  },

  emits: ['select'],

  setup(props, { emit }) {
    const $q = useQuasar()
    const filterType = ref('all')

    // Variables disponibles
    const availableVariables = computed(() => {
      return getAvailableVariables(props.tasks, props.currentTaskId)
    })

    // Variables filtrées par type
    const filteredVariables = computed(() => {
      if (filterType.value === 'all') {
        return availableVariables.value
      }
      return filterVariablesByType(availableVariables.value, filterType.value)
    })

    // Copier une variable
    function copyVariable(variable) {
      navigator.clipboard.writeText(variable)
        .then(() => {
          $q.notify({
            type: 'positive',
            message: `Variable copiée: ${variable}`,
            position: 'top',
            timeout: 1000
          })
          emit('select', variable)
        })
        .catch(err => {
          console.error('Erreur copie:', err)
          $q.notify({
            type: 'negative',
            message: 'Erreur lors de la copie',
            position: 'top'
          })
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

    // Icône selon type
    function getTypeIcon(type) {
      const icons = {
        image: 'image',
        images: 'collections',
        video: 'videocam',
        text: 'text_fields',
        array: 'list',
        object: 'code'
      }
      return icons[type] || 'help'
    }

    return {
      filterType,
      filteredVariables,
      copyVariable,
      getTypeColor,
      getTypeIcon
    }
  }
}
</script>

<style scoped>
.variable-helper {
  max-height: 600px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.variable-item {
  transition: background-color 0.2s;
}

.variable-item:hover {
  background-color: rgba(0, 0, 0, 0.03);
}

.variable-code {
  background-color: rgba(0, 0, 0, 0.05);
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 0.85em;
  font-family: 'Courier New', monospace;
  color: #1976d2;
}

.q-list {
  max-height: 400px;
  overflow-y: auto;
}
</style>
