<template>
  <q-card flat bordered class="workflow-runner">
    <q-card-section>
      <div class="row items-center q-mb-md">
        <div class="col">
          <div class="text-h6 text-primary">🔧 Workflow Engine</div>
          <div class="text-caption text-grey-6">Interface unifiée basée sur les workflows</div>
        </div>
        <div class="col-auto">
          <q-btn-dropdown
            flat
            icon="playlist_add"
            label="Templates"
            color="primary"
            class="q-mr-sm"
          >
            <q-list>
              <q-item
                v-for="template in workflowTemplates"
                :key="template.id"
                clickable
                v-close-popup
                @click="loadTemplate(template)"
              >
                <q-item-section avatar>
                  <q-icon :name="template.icon" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>{{ template.name }}</q-item-label>
                  <q-item-label caption>{{ template.description }}</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-btn-dropdown>
        </div>
      </div>

      <!-- Inputs du workflow -->
      <div class="workflow-inputs q-mb-lg">
        <div class="text-subtitle2 q-mb-sm">📥 Paramètres d'entrée</div>
        
        <div v-for="(input, key) in workflowInputs" :key="key" class="q-mb-md">
          <!-- Input texte -->
          <q-input
            v-if="input.type === 'text'"
            :model-value="inputValues[key]"
            @update:model-value="(val) => workflowStore.updateInputValue(key, val)"
            :label="input.label"
            :placeholder="input.placeholder"
            :hint="input.hint"
            filled
            clearable
          />
          
          <!-- Input images -->
          <div v-else-if="input.type === 'images'" class="image-input-section">
            <div class="text-body2 q-mb-sm">{{ input.label }}</div>
            <div class="image-uploader">
              <q-file
                v-model="imageFiles"
                multiple
                accept="image/*"
                @update:model-value="handleImageUpload"
                filled
                :hint="input.hint"
              >
                <template v-slot:prepend>
                  <q-icon name="attach_file" />
                </template>
              </q-file>
              
              <!-- Prévisualisation des images -->
              <div v-if="uploadedImages.length" class="image-preview q-mt-sm">
                <div class="row q-col-gutter-sm">
                  <div v-for="(image, idx) in uploadedImages" :key="idx" class="col-3">
                    <q-card flat bordered class="image-card">
                      <img :src="image.url" :alt="image.name" class="image-thumb" />
                      <q-card-section class="q-pa-xs">
                        <div class="text-caption">{{ image.name }}</div>
                        <q-btn
                          size="xs"
                          flat
                          round
                          color="negative"
                          icon="close"
                          @click="removeImage(idx)"
                          class="absolute-top-right q-ma-xs"
                        />
                      </q-card-section>
                    </q-card>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Input nombre -->
          <q-input
            v-else-if="input.type === 'number'"
            :model-value="inputValues[key]"
            @update:model-value="(val) => workflowStore.updateInputValue(key, Number(val))"
            :label="input.label"
            :hint="input.hint"
            type="number"
            :min="input.min"
            :max="input.max"
            filled
          />

          <!-- Input sélection -->
          <q-select
            v-else-if="input.type === 'select'"
            :model-value="inputValues[key]"
            @update:model-value="(val) => workflowStore.updateInputValue(key, val)"
            :options="input.options"
            :label="input.label"
            :hint="input.hint"
            filled
          />
        </div>
      </div>

      <!-- Workflow Definition (éditable) -->
      <q-expansion-item
        v-model="showWorkflowDetails"
        icon="settings"
        label="Configuration du workflow"
        caption="Voir/modifier la définition du workflow"
        class="q-mb-lg"
      >
        <q-card flat bordered class="q-pa-md">
          <q-input
            v-model="workflowDefinitionText"
            type="textarea"
            label="Définition JSON du workflow"
            hint="Configuration avancée - modifiez avec précaution"
            filled
            :rows="10"
          />
        </q-card>
      </q-expansion-item>

      <!-- Boutons d'action -->
      <div class="row q-col-gutter-md">
        <div class="col">
          <q-btn
            @click="executeWorkflow"
            color="primary"
            icon="play_arrow"
            label="Exécuter le workflow"
            :loading="executing"
            :disable="!canExecute"
            class="full-width"
            size="lg"
          />
        </div>
        <div class="col-auto">
          <q-btn
            @click="resetWorkflow"
            flat
            color="grey-7"
            icon="refresh"
            label="Reset"
            :disable="executing"
          />
        </div>
      </div>

      <!-- Messages d'erreur -->
      <q-banner v-if="error" class="bg-negative text-white q-mt-md" rounded>
        <template v-slot:avatar>
          <q-icon name="error" />
        </template>
        {{ error }}
        <template v-slot:action>
          <q-btn flat label="Fermer" @click="error = null" />
        </template>
      </q-banner>
    </q-card-section>

    <!-- Résultats -->
    <q-card-section v-if="result" class="bg-grey-1">
      <div class="text-h6 q-mb-md">📊 Résultats</div>
      
      <!-- Exécution Summary -->
      <q-card flat bordered class="q-mb-md">
        <q-card-section>
          <div class="row q-col-gutter-md">
            <div class="col">
              <div class="text-caption text-grey-6">Workflow ID</div>
              <div class="text-body2">{{ result.workflow_id }}</div>
            </div>
            <div class="col">
              <div class="text-caption text-grey-6">Exécution ID</div>
              <div class="text-body2">{{ result.execution_id }}</div>
            </div>
            <div class="col">
              <div class="text-caption text-grey-6">Statut</div>
              <q-badge
                :color="result.success ? 'positive' : 'negative'"
                :label="result.success ? 'Succès' : 'Erreur'"
              />
            </div>
          </div>
        </q-card-section>
      </q-card>

      <!-- Résultats de chaque tâche -->
      <div v-for="(taskResult, taskId) in result.task_outputs" :key="taskId" class="q-mb-md">
        <q-card flat bordered>
          <q-card-section>
            <div class="text-subtitle2 q-mb-sm">🔧 {{ taskId }}</div>
            
            <!-- Images générées -->
            <div v-if="taskResult.image" class="q-mb-sm">
              <div class="text-caption text-grey-6 q-mb-xs">Image générée :</div>
              <q-img
                :src="taskResult.image"
                style="max-width: 300px; max-height: 200px"
                class="rounded-borders"
                fit="contain"
              />
            </div>

            <!-- Images éditées -->
            <div v-if="taskResult.edited_images && taskResult.edited_images.length" class="q-mb-sm">
              <div class="text-caption text-grey-6 q-mb-xs">Images éditées :</div>
              <div class="row q-col-gutter-xs">
                <div v-for="(img, idx) in taskResult.edited_images" :key="idx" class="col-6">
                  <q-img
                    :src="img.editedImageUrl"
                    style="max-height: 150px"
                    class="rounded-borders"
                    fit="contain"
                  />
                </div>
              </div>
            </div>

            <!-- Prompt amélioré -->
            <div v-if="taskResult.enhanced_prompt" class="q-mb-sm">
              <div class="text-caption text-grey-6 q-mb-xs">Prompt amélioré :</div>
              <q-input
                :model-value="taskResult.enhanced_prompt"
                readonly
                filled
                type="textarea"
                :rows="3"
              />
            </div>

            <!-- Vidéo -->
            <div v-if="taskResult.video" class="q-mb-sm">
              <div class="text-caption text-grey-6 q-mb-xs">Vidéo générée :</div>
              <video controls style="max-width: 300px; max-height: 200px">
                <source :src="taskResult.video" type="video/mp4">
              </video>
            </div>

            <!-- Autres données -->
            <div v-if="hasOtherData(taskResult)" class="text-caption">
              <pre class="text-grey-7">{{ JSON.stringify(getOtherData(taskResult), null, 2) }}</pre>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useWorkflowStore } from 'src/stores/useWorkflowStore'
import { useQuasar } from 'quasar'

const workflowStore = useWorkflowStore()
const $q = useQuasar()

// État local
const showWorkflowDetails = ref(false)
const imageFiles = ref(null)
const uploadedImages = ref([])

// Computed depuis le store
const currentWorkflow = computed(() => workflowStore.currentWorkflow)
const workflowInputs = computed(() => currentWorkflow.value?.inputs || {})
const inputValues = computed(() => currentWorkflow.value?.inputValues || {})
const workflowTemplates = computed(() => workflowStore.workflowTemplates)
const executing = computed(() => workflowStore.isExecuting)
const error = computed(() => workflowStore.error)
const result = computed(() => workflowStore.lastResult)

// Computed local
const workflowDefinitionText = computed({
  get: () => currentWorkflow.value ? JSON.stringify(currentWorkflow.value.workflow, null, 2) : '',
  set: (value) => {
    try {
      const workflow = JSON.parse(value)
      workflowStore.updateWorkflowDefinition(workflow)
    } catch (e) {
      workflowStore.error = 'Format JSON invalide pour le workflow'
    }
  }
})

const canExecute = computed(() => {
  if (!currentWorkflow.value) return false
  
  // Vérifier que tous les inputs requis sont remplis
  return Object.keys(workflowInputs.value).every(key => {
    const input = workflowInputs.value[key]
    const value = inputValues.value[key]
    
    if (input.type === 'images') {
      return uploadedImages.value.length > 0
    }
    if (input.required === false) return true
    
    return value && value.toString().trim().length > 0
  })
})

// Méthodes
function loadTemplate(template) {
  workflowStore.setCurrentWorkflow(template)
  
  // Clear uploaded images
  uploadedImages.value = []
  
  $q.notify({
    type: 'positive',
    message: `Template "${template.name}" chargé`,
    position: 'top'
  })
}

function handleImageUpload(files) {
  if (!files) return
  
  uploadedImages.value = []
  
  Array.from(files).forEach(file => {
    const url = URL.createObjectURL(file)
    uploadedImages.value.push({
      file,
      url,
      name: file.name
    })
  })
  
  // Convertir les fichiers en base64 pour les inputs
  convertImagesToBase64()
}

async function convertImagesToBase64() {
  const base64Images = await Promise.all(
    uploadedImages.value.map(img => fileToBase64(img.file))
  )
  workflowStore.updateInputValue('images', base64Images)
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result)
    reader.onerror = error => reject(error)
  })
}

function removeImage(index) {
  uploadedImages.value.splice(index, 1)
  convertImagesToBase64()
}

async function executeWorkflow() {
  try {
    await workflowStore.executeCurrentWorkflow()
    $q.notify({
      type: 'positive',
      message: 'Workflow exécuté avec succès !',
      position: 'top'
    })
  } catch (err) {
    $q.notify({
      type: 'negative',
      message: 'Erreur lors de l\'exécution',
      caption: err.message,
      position: 'top'
    })
  }
}

function resetWorkflow() {
  workflowStore.resetCurrentWorkflow()
  uploadedImages.value = []
  
  $q.notify({
    type: 'info',
    message: 'Workflow réinitialisé',
    position: 'top'
  })
}

function hasOtherData(taskResult) {
  const knownKeys = ['image', 'edited_images', 'enhanced_prompt', 'video', 'error']
  return Object.keys(taskResult).some(key => !knownKeys.includes(key))
}

function getOtherData(taskResult) {
  const knownKeys = ['image', 'edited_images', 'enhanced_prompt', 'video', 'error']
  const otherData = {}
  Object.keys(taskResult).forEach(key => {
    if (!knownKeys.includes(key)) {
      otherData[key] = taskResult[key]
    }
  })
  return otherData
}

// Watchers pour synchroniser les inputs
watch(() => inputValues.value, (newValues) => {
  Object.keys(newValues).forEach(key => {
    if (key !== 'images') { // Les images sont gérées séparément
      workflowStore.updateInputValue(key, newValues[key])
    }
  })
}, { deep: true })

// Initialisation
if (!currentWorkflow.value) {
  loadTemplate(workflowTemplates.value[0])
}
</script>

<style scoped lang="scss">
.workflow-runner {
  .image-input-section {
    .image-uploader {
      .image-preview {
        .image-card {
          position: relative;
          
          .image-thumb {
            width: 100%;
            height: 80px;
            object-fit: cover;
          }
        }
      }
    }
  }
  
  pre {
    font-size: 11px;
    max-height: 100px;
    overflow: auto;
    background: rgba(0,0,0,0.05);
    padding: 8px;
    border-radius: 4px;
  }
}
</style>