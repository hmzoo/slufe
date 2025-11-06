<template>
  <q-card flat bordered class="task-card q-mb-md">
    <q-card-section class="q-pa-sm">
      <div class="row items-center">
        <!-- Handle de drag -->
        <div class="drag-handle cursor-grab q-mr-sm">
          <q-icon name="drag_indicator" size="sm" color="grey-6" />
        </div>
        
        <!-- Icône de la tâche -->
        <q-icon :name="taskDefinition?.icon || 'task'" size="md" class="q-mr-sm" :color="getTaskColor()" />
        
        <!-- Contenu principal -->
        <div class="col">
          <div class="text-subtitle2">{{ taskDefinition?.name || task.type }}</div>
          <div class="text-caption text-grey-6">{{ taskDefinition?.description || 'Tâche personnalisée' }}</div>
        </div>
        
        <!-- Actions -->
        <div class="task-actions row items-center q-gutter-xs">
          <!-- Boutons de déplacement -->
          <q-btn 
            size="sm" 
            round 
            flat 
            icon="keyboard_arrow_up" 
            @click="$emit('move-up', task.id, section)"
            :disabled="index === 0"
          >
            <q-tooltip>Monter</q-tooltip>
          </q-btn>
          
          <q-btn 
            size="sm" 
            round 
            flat 
            icon="keyboard_arrow_down" 
            @click="$emit('move-down', task.id, section)"
            :disabled="isLast"
          >
            <q-tooltip>Descendre</q-tooltip>
          </q-btn>
          
          <!-- Éditer -->
          <q-btn 
            size="sm" 
            round 
            flat 
            icon="edit" 
            @click="$emit('edit', task)"
          >
            <q-tooltip>Éditer</q-tooltip>
          </q-btn>
          
          <!-- Supprimer -->
          <q-btn 
            size="sm" 
            round 
            flat 
            icon="delete" 
            color="negative"
            @click="$emit('delete', task.id, section)"
          >
            <q-tooltip>Supprimer</q-tooltip>
          </q-btn>
        </div>
      </div>
      
      <!-- Configuration de la tâche (si il y a des paramètres) -->
      <div v-if="hasInputs" class="q-mt-sm q-pl-md">
        <div class="text-caption text-grey-7 q-mb-xs">Configuration:</div>
        <div class="task-config">
          <div v-for="(value, key) in taskConfigValues" :key="key" class="config-item q-mb-xs">
            <div class="text-caption">
              <strong>{{ key }}:</strong> 
              <!-- Aperçu d'image pour les URLs d'images -->
              <div v-if="isImageUrl(value)" class="q-mt-xs">
                <q-img
                  :src="value"
                  style="max-width: 80px; max-height: 60px"
                  fit="cover"
                  class="rounded-borders"
                />
                <div class="text-caption text-grey-6 q-mt-xs">{{ formatValue(value) }}</div>
              </div>
              <!-- Valeur normale -->
              <span v-else>{{ formatValue(value) }}</span>
            </div>
          </div>
        </div>
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup>
import { computed } from 'vue'
import { getTaskDefinition } from 'src/config/taskDefinitions'
import { INPUT_DEFINITIONS, OUTPUT_DEFINITIONS } from 'src/config/ioDefinitions'

// Props
const props = defineProps({
  task: {
    type: Object,
    required: true
  },
  index: {
    type: Number,
    required: true
  },
  section: {
    type: String,
    required: true
  },
  isLast: {
    type: Boolean,
    default: false
  }
})

// Emits
defineEmits(['edit', 'delete', 'move-up', 'move-down'])

// Computed
const taskDefinition = computed(() => {
  return getTaskDefinition(props.task.type) || 
         INPUT_DEFINITIONS[props.task.type] || 
         OUTPUT_DEFINITIONS[props.task.type]
})

const taskConfigValues = computed(() => {
  // Pour les tâches d'input, les valeurs sont directement sur la tâche
  if (props.task.type === 'text_input' || props.task.type === 'input_text') {
    const values = {}
    const relevantKeys = ['label', 'placeholder', 'defaultValue', 'userInput']
    
    relevantKeys.forEach(key => {
      if (props.task[key] !== undefined && props.task[key] !== '') {
        values[key] = props.task[key]
      }
    })
    
    return values
  }
  
  // Pour les tâches image_input, les valeurs sont directement sur la tâche
  if (props.task.type === 'image_input') {
    const values = {}
    const relevantKeys = ['label', 'multiple', 'required', 'maxFiles', 'selectedImage', 'defaultImage']
    
    relevantKeys.forEach(key => {
      if (props.task[key] !== undefined && props.task[key] !== '') {
        values[key] = props.task[key]
      }
    })
    
    return values
  }
  
  // Pour les autres tâches, utiliser inputs ou input (compatibilité)
  return props.task.inputs || props.task.input || {}
})

const hasInputs = computed(() => {
  return Object.keys(taskConfigValues.value).length > 0
})

// Functions
const getTaskColor = () => {
  const colors = {
    inputs: 'blue',
    tasks: 'green',
    outputs: 'orange'
  }
  return colors[props.section] || 'grey'
}

const formatValue = (value) => {
  if (typeof value === 'string' && value.length > 50) {
    return value.substring(0, 50) + '...'
  }
  if (typeof value === 'object') {
    return JSON.stringify(value).substring(0, 50) + '...'
  }
  return String(value)
}

const isImageUrl = (value) => {
  if (typeof value !== 'string') return false
  
  // Ne pas traiter les variables comme des images
  if (value.startsWith('{{') && value.endsWith('}}')) return false
  
  // Vérifier si c'est une URL d'image (extension ou contient /media/ ou /upload/)
  const imageExtensions = /\.(jpg|jpeg|png|gif|webp|svg)$/i
  const imagePathPatterns = /\/(media|upload|images?)\//i
  
  return imageExtensions.test(value) || imagePathPatterns.test(value) || value.startsWith('data:image/')
}
</script>

<style scoped>
.task-card {
  transition: all 0.3s ease;
}

.task-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.drag-handle {
  opacity: 0.6;
}

.drag-handle:hover {
  opacity: 1;
}

.task-actions {
  opacity: 0.7;
  transition: opacity 0.2s ease;
}

.task-card:hover .task-actions {
  opacity: 1;
}

.task-config {
  background-color: #f8f9fa;
  border-radius: 4px;
  padding: 8px;
  font-size: 11px;
}

.config-item:last-child {
  margin-bottom: 0;
}
</style>