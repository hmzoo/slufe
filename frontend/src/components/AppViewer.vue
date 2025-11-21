<template>
  <div class="app-viewer q-pa-md">
    <!-- HEADER -->
    <div class="row items-center q-mb-lg">
      <div>
        <div class="text-h5">
          <q-icon name="play_circle" class="q-mr-sm" />
          AppViewer - Exécuteur de Templates
        </div>
        <div class="text-caption text-grey-6">
          Sélectionnez un template et exécutez-le avec vos données
        </div>
      </div>
      <q-space />
      <q-btn
        color="primary"
        icon="refresh"
        label="Actualiser"
        @click="loadTemplates"
        flat
        :loading="loadingTemplates"
      />
    </div>

    <!-- CONTENU PRINCIPAL -->
    <div class="row q-col-gutter-lg">
      <!-- COLONNE GAUCHE: SÉLECTION, DÉTAILS ET RÉSULTATS -->
      <div class="col-12 col-lg-5">
        <!-- SÉLECTION DU TEMPLATE -->
        <q-card class="q-mb-lg">
          <q-card-section class="bg-light-blue-1">
            <div class="text-subtitle2 q-mb-md">
              <q-icon name="description" class="q-mr-sm" />
              Sélectionner un Template
            </div>
            
            <q-select
              v-model="selectedTemplate"
              :options="filteredTemplates"
              option-value="id"
              option-label="name"
              outlined
              dense
              emit-value
              map-options
              @update:model-value="onTemplateChange"
              :loading="loadingTemplates"
            >
              <template #prepend>
                <q-icon name="dashboard" />
              </template>
              <template #no-option>
                <q-item>
                  <q-item-section class="text-grey-6">
                    Aucun template disponible
                  </q-item-section>
                </q-item>
              </template>
            </q-select>

            <!-- Recherche et filtre -->
            <div class="row q-col-gutter-sm q-mt-md">
              <div class="col-grow">
                <q-input
                  v-model="searchQuery"
                  placeholder="Rechercher un template..."
                  outlined
                  dense
                  @update:model-value="searchQuery = $event"
                >
                  <template #prepend>
                    <q-icon name="search" />
                  </template>
                </q-input>
              </div>
              <div class="col-auto">
                <q-btn
                  v-if="searchQuery"
                  flat
                  round
                  dense
                  icon="clear"
                  @click="searchQuery = ''"
                />
              </div>
            </div>
          </q-card-section>
        </q-card>

        <!-- DÉTAILS DU TEMPLATE SÉLECTIONNÉ -->
        <q-card v-if="currentTemplateData" class="q-mb-lg">
          <q-card-section class="bg-blue-1">
            <div class="text-subtitle2 q-mb-md">
              <q-icon name="info" class="q-mr-sm" />
              Détails du Template
            </div>
            <div class="text-h6">{{ currentTemplateData.name }}</div>
            <div class="text-caption text-grey-7 q-mt-xs">
              {{ currentTemplateData.description || 'Pas de description' }}
            </div>
            <div class="text-caption q-mt-md">
              <q-chip
                v-if="currentTemplateData.category"
                size="sm"
                :label="currentTemplateData.category"
                color="primary"
                text-color="white"
              />
            </div>

            <!-- DEBUG INFO - À SUPPRIMER -->
            <div class="q-mt-md q-pa-sm bg-white rounded-borders text-caption" style="display: none;">
              <div class="text-weight-bold q-mb-sm">🔍 DEBUG:</div>
              <div>Inputs détectés: {{ Object.keys(currentTemplateData.inputs || {}).length }}</div>
              <div v-if="Object.keys(currentTemplateData.inputs || {}).length > 0" class="q-mt-xs">
                <div v-for="(input, key) in currentTemplateData.inputs" :key="key" class="q-my-xs">
                  • <strong>{{ key }}</strong> ({{ input.type }}) - "{{ input.label }}"
                </div>
              </div>
              <div v-else class="text-orange">
                ⚠️ Aucun input détecté. Vérifiez la structure du workflow.
              </div>
            </div>
          </q-card-section>
        </q-card>

        <!-- FORMULAIRE DES INPUTS -->
        <q-card v-if="currentTemplateData && currentTemplateData.inputs && Object.keys(currentTemplateData.inputs).length > 0" class="q-mb-lg">
          <q-card-section class="bg-green-1">
            <div class="text-subtitle2 q-mb-md" style="display: none;">
              <q-icon name="input" class="q-mr-sm" />
              Paramètres d'entrée ({{ Object.keys(currentTemplateData.inputs).length }})
            </div>
          </q-card-section>

          <q-separator />

          <q-card-section>
            <div class="row q-col-gutter-md">
              <div
                v-for="(inputConfig, inputId) in currentTemplateData.inputs"
                :key="inputId"
                class="col-12"
              >
                <!-- TEXT INPUT -->
                <div v-if="inputConfig.type === 'text_input' || inputConfig.type === 'text'">
                  <q-input
                    v-model="formInputs[inputId]"
                    :label="inputConfig.label"
                    :placeholder="inputConfig.placeholder"
                    :hint="inputConfig.hint"
                    :required="inputConfig.required"
                    outlined
                    dense
                    :type="inputConfig.password ? 'password' : 'text'"
                    :rules="inputConfig.required ? [val => val && val.trim() !== '' || 'Ce champ est obligatoire'] : []"
                  />
                </div>

                <!-- NUMBER INPUT -->
                <div v-else-if="inputConfig.type === 'number'">
                  <q-input
                    v-model.number="formInputs[inputId]"
                    :label="inputConfig.label"
                    :placeholder="inputConfig.placeholder"
                    :hint="inputConfig.hint"
                    :required="inputConfig.required"
                    type="number"
                    outlined
                    dense
                    :min="inputConfig.min"
                    :max="inputConfig.max"
                    :step="inputConfig.step"
                  />
                </div>

                <!-- SELECT INPUT -->
                <div v-else-if="inputConfig.type === 'select'">
                  <q-select
                    v-model="formInputs[inputId]"
                    :options="inputConfig.options || []"
                    :label="inputConfig.label"
                    :hint="inputConfig.hint"
                    :required="inputConfig.required"
                    outlined
                    dense
                    emit-value
                    map-options
                    option-value="value"
                    option-label="label"
                  />
                </div>

                <!-- CHECKBOX -->
                <div v-else-if="inputConfig.type === 'checkbox'">
                  <q-checkbox
                    v-model="formInputs[inputId]"
                    :label="inputConfig.label"
                    :hint="inputConfig.hint"
                  />
                </div>

                <!-- TOGGLE -->
                <div v-else-if="inputConfig.type === 'toggle'">
                  <q-toggle
                    v-model="formInputs[inputId]"
                    :label="inputConfig.label"
                    :hint="inputConfig.hint"
                  />
                </div>

                <!-- IMAGE INPUT -->
                <div v-else-if="inputConfig.type === 'image_input' || inputConfig.type === 'image'">
                  <div class="q-mb-sm">
                    <div class="text-subtitle2">{{ inputConfig.label }}</div>
                    <div class="text-caption text-grey-6">{{ inputConfig.hint }}</div>
                  </div>
                  
                  <q-file
                    v-model="formInputs[inputId]"
                    :label="inputConfig.placeholder || 'Sélectionner une image'"
                    accept="image/*"
                    outlined
                    dense
                    :multiple="inputConfig.multiple"
                    :max-files="inputConfig.maxFiles"
                    @rejected="onFileRejected"
                  >
                    <template #prepend>
                      <q-icon name="image" />
                    </template>
                  </q-file>

                  <!-- Aperçu de l'image sélectionnée -->
                  <div v-if="formInputs[inputId]" class="q-mt-md">
                    <div class="text-caption text-grey-7 q-mb-sm">Aperçu:</div>
                    <div class="row q-col-gutter-sm">
                      <div
                        v-for="(file, index) in (Array.isArray(formInputs[inputId]) ? formInputs[inputId] : [formInputs[inputId]])"
                        :key="index"
                        class="col-auto"
                      >
                        <q-img
                          :src="getImagePreview(file)"
                          style="width: 100px; height: 100px"
                          fit="cover"
                          class="rounded-borders"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <!-- TEXTAREA INPUT -->
                <div v-else-if="inputConfig.type === 'textarea'">
                  <q-input
                    v-model="formInputs[inputId]"
                    :label="inputConfig.label"
                    :placeholder="inputConfig.placeholder"
                    :hint="inputConfig.hint"
                    :required="inputConfig.required"
                    outlined
                    type="textarea"
                    :rows="inputConfig.rows || 4"
                  />
                </div>
              </div>
            </div>
          </q-card-section>
        </q-card>

        <!-- RÉSULTATS DE LA COLONNE GAUCHE -->
        <div v-if="executionResult && showResultsInLeftColumn" class="q-mb-lg">
          <q-card v-if="executionResult.results" class="q-mb-lg">
            <q-card-section>
              <div
                v-for="(item, key) in executionResult.results"
                :key="`result-${key}`"
                class="q-mb-md"
              >
                <div v-if="item.type && item.result">
                  <div class="text-caption text-weight-bold text-primary q-mb-sm">
                    {{ item.id }}
                  </div>

                  <div v-if="item.type === 'image_output'" class="bg-blue-1 q-pa-sm rounded-borders">
                    <q-img
                      v-if="item.result.image_url || item.result.image"
                      :src="item.result.image_url || item.result.image"
                      fit="scale-down"
                      class="rounded-borders"
                      style="max-height: 150px"
                    />
                  </div>

                  <div v-else-if="item.type === 'text_output'" class="bg-amber-1 q-pa-sm rounded-borders text-caption">
                    {{ item.result.text || JSON.stringify(item.result) }}
                  </div>
                </div>
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>

      <!-- COLONNE DROITE: APPLICATION INDÉPENDANTE -->
      <div class="col-12 col-lg-7">
        <div v-if="currentTemplateData" class="app-wrapper">
          <!-- HEADER AVEC GRADIENT -->
          <div class="app-hero">
            <div class="hero-overlay"></div>
            <div class="hero-content">
              <h1 class="hero-title">{{ currentTemplateData.name }}</h1>
            </div>
          </div>

          <!-- SCROLL CONTAINER PRINCIPAL -->
          <div class="app-main">
            <!-- SECTION INPUTS - Formulaire attractif -->
            <div v-if="currentTemplateData.inputs && Object.keys(currentTemplateData.inputs).length > 0" class="form-section">
              <div class="form-grid">
                <div
                  v-for="(inputConfig, inputId) in currentTemplateData.inputs"
                  :key="inputId"
                  class="form-item"
                >
                  <!-- TEXT INPUT -->
                  <div v-if="inputConfig.type === 'text_input' || inputConfig.type === 'text'" class="form-field">
                    <label class="field-label">
                      {{ inputConfig.label }}
                      <span v-if="inputConfig.required" class="required">*</span>
                    </label>
                    <div class="field-input-wrapper">
                      <q-icon name="text_fields" class="field-icon" />
                      <q-input
                        v-model="formInputs[inputId]"
                        :placeholder="inputConfig.placeholder"
                        outlined
                        dense
                        class="field-input"
                        :type="inputConfig.password ? 'password' : 'text'"
                      />
                    </div>
                    <div v-if="inputConfig.hint" class="field-hint">{{ inputConfig.hint }}</div>
                  </div>

                  <!-- NUMBER INPUT -->
                  <div v-else-if="inputConfig.type === 'number'" class="form-field">
                    <label class="field-label">
                      {{ inputConfig.label }}
                      <span v-if="inputConfig.required" class="required">*</span>
                    </label>
                    <div class="field-input-wrapper">
                      <q-icon name="numbers" class="field-icon" />
                      <q-input
                        v-model.number="formInputs[inputId]"
                        :placeholder="inputConfig.placeholder"
                        type="number"
                        outlined
                        dense
                        class="field-input"
                      />
                    </div>
                    <div v-if="inputConfig.hint" class="field-hint">{{ inputConfig.hint }}</div>
                  </div>

                  <!-- IMAGE INPUT - Drag-Drop et Camera -->
                  <div v-else-if="inputConfig.type === 'image_input' || inputConfig.type === 'image'" class="form-field">
                    <label class="field-label">
                      {{ inputConfig.label }}
                      <span v-if="inputConfig.required" class="required">*</span>
                    </label>

                    <!-- Zone d'upload vide -->
                    <div v-if="!formInputs[inputId]" class="image-upload-zone">
                      <!-- Q-file avec drag-drop natif -->
                      <q-file
                        v-model="formInputs[inputId]"
                        accept="image/*"
                        outlined
                        class="custom-file-input"
                        @rejected="onFileRejected"
                      >
                        <template #prepend>
                          <q-icon name="image" size="36px" />
                        </template>
                        <template #default>
                          <div class="file-input-content">
                            <div class="file-input-title">Ajouter une image</div>
                            <div class="file-input-subtitle">Glissez-déposez ou cliquez ici</div>
                            <div class="file-input-formats">JPG • PNG • WebP • GIF</div>
                          </div>
                        </template>
                      </q-file>

                      <!-- Boutons caméra avec choix -->
                      <div class="camera-buttons">
                        <q-btn
                          color="primary"
                          icon="camera_alt"
                          label="Prendre une photo"
                          outline
                          class="full-width q-mb-sm"
                          @click="openCameraDialog(inputId, 'environment')"
                        />
                        <q-btn
                          v-if="isMobile"
                          color="secondary"
                          icon="camera_front"
                          label="Caméra frontale"
                          outline
                          class="full-width"
                          @click="openCameraDialog(inputId, 'user')"
                        />
                      </div>
                    </div>

                    <!-- Aperçu avec actions -->
                    <div v-else class="image-preview-container">
                      <div class="preview-image">
                        <q-img
                          :src="getImagePreview(formInputs[inputId])"
                          fit="cover"
                          class="preview-img"
                        />
                      </div>
                      <div class="preview-actions">
                        <div class="preview-filename">{{ formInputs[inputId].name }}</div>
                        <div class="action-buttons-row">
                          <q-btn
                            flat
                            dense
                            icon="edit"
                            size="sm"
                            color="primary"
                            @click="triggerFileInput(inputId)"
                            title="Changer l'image"
                          />
                          <q-btn
                            flat
                            dense
                            icon="close"
                            size="sm"
                            color="negative"
                            @click="formInputs[inputId] = null"
                            title="Supprimer l'image"
                          />
                        </div>
                      </div>
                    </div>

                    <div v-if="inputConfig.hint" class="field-hint">{{ inputConfig.hint }}</div>
                  </div>

                  <!-- TEXTAREA INPUT -->
                  <div v-else-if="inputConfig.type === 'textarea'" class="form-field">
                    <label class="field-label">
                      {{ inputConfig.label }}
                      <span v-if="inputConfig.required" class="required">*</span>
                    </label>
                    <div class="field-input-wrapper textarea-wrapper">
                      <q-icon name="description" class="field-icon" />
                      <q-input
                        v-model="formInputs[inputId]"
                        :placeholder="inputConfig.placeholder"
                        outlined
                        type="textarea"
                        class="field-input textarea-input"
                        :rows="inputConfig.rows || 4"
                      />
                    </div>
                    <div v-if="inputConfig.hint" class="field-hint">{{ inputConfig.hint }}</div>
                  </div>

                  <!-- SELECT INPUT -->
                  <div v-else-if="inputConfig.type === 'select'" class="form-field">
                    <label class="field-label">
                      {{ inputConfig.label }}
                      <span v-if="inputConfig.required" class="required">*</span>
                    </label>
                    <div class="field-input-wrapper">
                      <q-icon name="category" class="field-icon" />
                      <q-select
                        v-model="formInputs[inputId]"
                        :options="inputConfig.options || []"
                        outlined
                        dense
                        class="field-input"
                        emit-value
                        map-options
                        option-value="value"
                        option-label="label"
                      />
                    </div>
                    <div v-if="inputConfig.hint" class="field-hint">{{ inputConfig.hint }}</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- BOUTONS D'ACTION - Sticky -->
            <div class="action-buttons">
              <q-btn
                color="primary"
                label="Exécuter"
                icon="play_arrow"
                size="lg"
                class="full-width"
                @click="executeTemplate"
                :loading="executing"
                :disable="!selectedTemplate || !isFormValid"
                unelevated
              />
            </div>

            <!-- RÉSULTATS - Section élégante -->
            <div v-if="executing" class="execution-status">
              <div class="status-container executing">
                <q-spinner color="primary" size="2.5rem" />
                <div class="status-text">
                  <div class="status-title">Exécution en cours...</div>
                  <div class="status-subtitle">Veuillez patienter</div>
                </div>
              </div>
            </div>

            <div v-if="executionError" class="execution-status">
              <div class="status-container error">
                <q-icon name="error_outline" size="2.5rem" />
                <div class="status-text">
                  <div class="status-title">Erreur d'exécution</div>
                  <div class="status-subtitle">{{ executionError }}</div>
                </div>
                <q-btn
                  flat
                  icon="close"
                  @click="clearResults"
                  class="close-status"
                />
              </div>
            </div>

            <div v-if="executionResult && !executing" class="results-section">
              <div class="results-header">
                <div class="results-meta">{{ executionTime }}ms</div>
              </div>

              <!-- Résultats organisés -->
              <div v-if="normalizeResults(executionResult.results) && normalizeResults(executionResult.results).length > 0" class="results-content">
                <div
                  v-for="(item, idx) in normalizeResults(executionResult.results)"
                  :key="`result-${idx}`"
                  class="result-card"
                >
                  <!-- IMAGE OUTPUT - Carrousel/Galerie -->
                  <div v-if="item.type === 'image' || item.type === 'image_output'">
                    <div v-if="item.title" class="result-card-title">
                      {{ item.title }}
                    </div>

                    <div v-if="item.image_url || item.image || item.url" class="result-image-container">
                      <q-img
                        :src="item.image_url || item.image || item.url"
                        fit="scale-down"
                        class="result-image"
                        style="max-height: 500px"
                      />
                    </div>

                    <div v-if="item.caption" class="result-caption">
                      {{ item.caption }}
                    </div>

                    <!-- Boutons de téléchargement -->
                    <div class="result-actions">
                      <q-btn
                        flat
                        icon="download"
                        label="Télécharger"
                        size="sm"
                        @click="downloadImage(item.image_url || item.image || item.url)"
                      />
                    </div>
                  </div>

                  <!-- TEXT OUTPUT -->
                  <div v-else-if="item.type === 'text_output' || (item.text && !item.type)">
                    <div v-if="item.title" class="result-card-title">
                      {{ item.title }}
                    </div>
                    <div class="text-output-box">
                      {{ item.text || JSON.stringify(item) }}
                    </div>
                  </div>

                  <!-- AUTRES OUTPUTS -->
                  <div v-else class="json-output">
                    <pre>{{ JSON.stringify(item, null, 2) }}</pre>
                  </div>
                </div>
              </div>

              <!-- MESSAGE SI AUCUN RÉSULTAT -->
              <div v-else class="empty-state" style="padding: 2rem;">
                <q-icon name="info" size="3rem" color="amber" class="q-mb-md" />
                <div class="text-h6">Aucun résultat à afficher</div>
                <div class="text-caption text-grey-7 q-mt-sm">
                  Le workflow s'est exécuté mais n'a pas retourné de résultat.
                </div>
                <div class="text-caption text-grey-6 q-mt-md">
                  DEBUG: {{ executionResult?.results ? 'Résultats présents' : 'Pas de résultats' }}
                </div>
              </div>

              <!-- Footer des résultats avec actions -->
              <div class="results-footer">
                <q-btn
                  flat
                  icon="download"
                  label="Télécharger tout"
                  @click="downloadResults"
                  class="action-btn"
                />
                <q-space />
                <q-btn
                  flat
                  icon="refresh"
                  label="Nouveau"
                  @click="clearResults"
                  class="action-btn"
                />
              </div>
            </div>

            <!-- EMPTY STATE -->
            <div v-if="!currentTemplateData || (!executionResult && !executing && !executionError)" class="empty-state">
              <div class="empty-icon">
                <q-icon name="explore" size="4rem" color="grey-4" />
              </div>
              <div class="empty-title">Prêt à commencer</div>
              <div class="empty-text">Remplissez les paramètres et cliquez sur "Exécuter"</div>
            </div>
          </div>
        </div>

        <!-- PLACEHOLDER SI AUCUN TEMPLATE -->
        <div v-else class="no-template-state">
          <q-icon name="dashboard" size="5rem" color="grey-3" />
          <div class="empty-title q-mt-lg">Sélectionnez un template</div>
          <div class="empty-text">Choisissez un template à gauche pour commencer</div>
        </div>
      </div>
    </div>

    <!-- DIALOGUE CAMERA WEBCAM -->
    <q-dialog v-model="showCameraDialog" persistent>
      <q-card style="width: 90vw; max-width: 800px;">
        <q-card-section class="bg-primary text-white">
          <div class="text-h6">
            <q-icon name="camera_alt" class="q-mr-sm" />
            Capture Photo
          </div>
        </q-card-section>

        <q-card-section class="q-pa-none">
          <!-- Zone vidéo -->
          <div class="camera-container">
            <video
              ref="videoElement"
              autoplay
              playsinline
              class="camera-video"
            ></video>
            
            <!-- Canvas caché pour capturer l'image -->
            <canvas
              ref="canvasElement"
              class="camera-canvas"
              style="display: none;"
            ></canvas>
            
            <!-- Preview de la photo capturée -->
            <div v-if="capturedPhoto" class="photo-preview">
              <img :src="capturedPhoto" alt="Photo capturée" />
            </div>
          </div>
        </q-card-section>

        <q-card-section v-if="cameraError" class="bg-negative text-white">
          <div class="text-center">
            <q-icon name="error" size="2rem" class="q-mb-sm" />
            <div class="text-subtitle2">{{ cameraError }}</div>
            <div class="text-caption q-mt-sm">
              Vérifiez que vous avez autorisé l'accès à la caméra
            </div>
          </div>
        </q-card-section>

        <q-card-actions align="center" class="q-pa-md camera-actions">
          <template v-if="!capturedPhoto">
            <!-- Bouton capturer -->
            <q-btn
              color="primary"
              icon="camera"
              label="Capturer"
              size="lg"
              rounded
              unelevated
              class="full-width"
              @click="capturePhoto"
              :disable="!!cameraError"
            />
          </template>
          
          <template v-else>
            <!-- Boutons après capture - empilés verticalement sur mobile -->
            <div class="capture-actions">
              <q-btn
                color="positive"
                icon="check"
                label="Utiliser"
                unelevated
                class="full-width q-mb-sm"
                @click="usePhoto"
              />
              <q-btn
                color="grey-7"
                icon="refresh"
                label="Recommencer"
                outline
                class="full-width q-mb-sm"
                @click="retakePhoto"
              />
              <q-btn
                flat
                icon="close"
                label="Annuler"
                class="full-width"
                @click="closeCameraDialog"
              />
            </div>
          </template>
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useTemplateStore } from 'src/stores/useTemplateStore'
import { useNotify } from 'src/composables/useNotify'
import { useWorkflowExecution } from 'src/composables/useWorkflowExecution'

// Store
const templateStore = useTemplateStore()
const { showNotification } = useNotify()
const {
  executing,
  executionResult,
  executionError,
  executionTime,
  executeWorkflow,
  clearResults: clearExecutionResults,
  getImagePreview,
  isImageOutput,
  downloadResults: downloadExecutionResults
} = useWorkflowExecution()

// State
const selectedTemplate = ref(null)
const currentTemplateData = ref(null)
const searchQuery = ref('')
const loadingTemplates = ref(false)
const templates = ref([])

// Form state
const formInputs = ref({})
const showResultsInLeftColumn = ref(false)
const dragOverZone = ref(null)

// Camera state
const showCameraDialog = ref(false)
const videoElement = ref(null)
const canvasElement = ref(null)
const cameraStream = ref(null)
const capturedPhoto = ref(null)
const cameraError = ref(null)
const currentInputId = ref(null)
const currentCameraType = ref('environment')

// Détection mobile
const isMobile = computed(() => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
})

// Computed
const filteredTemplates = computed(() => {
  if (!searchQuery.value) {
    return templates.value
  }

  const query = searchQuery.value.toLowerCase()
  return templates.value.filter(t =>
    t.name.toLowerCase().includes(query) ||
    (t.description && t.description.toLowerCase().includes(query)) ||
    (t.category && t.category.toLowerCase().includes(query))
  )
})

const isFormValid = computed(() => {
  if (!currentTemplateData.value?.inputs) {
    return true
  }

  return Object.entries(currentTemplateData.value.inputs).every(([inputId, inputConfig]) => {
    if (!inputConfig.required) {
      return true
    }

    const value = formInputs.value[inputId]

    // Vérifier les valeurs requises selon le type
    if (inputConfig.type === 'image_input' || inputConfig.type === 'image') {
      return value && (Array.isArray(value) ? value.length > 0 : !!value)
    }

    // Pour text, number, select, etc.
    return value !== undefined && value !== null && value !== ''
  })
})

// Methods
const loadTemplates = async () => {
  loadingTemplates.value = true
  try {
    await templateStore.loadTemplates()
    templates.value = templateStore.sortedTemplates
    console.log('✅ Templates chargés:', templates.value.length)
  } catch (error) {
    console.error('❌ Erreur lors du chargement des templates:', error)
    showNotification('Erreur lors du chargement des templates', 'negative')
  } finally {
    loadingTemplates.value = false
  }
}

const onTemplateChange = (templateId) => {
  if (!templateId) {
    currentTemplateData.value = null
    formInputs.value = {}
    return
  }

  const template = templates.value.find(t => t.id === templateId)
  
  if (!template) return

  // Extraire les définitions d'inputs depuis les tâches de type input
  const extractedInputs = extractInputsFromWorkflow(template.workflow)

  // Assigner les inputs extraits ou utiliser les inputs du template
  const finalInputs = Object.keys(extractedInputs).length > 0 ? extractedInputs : (template.inputs || {})

  currentTemplateData.value = {
    ...template,
    inputs: finalInputs
  }

  resetForm()

  if (currentTemplateData.value) {
    console.log('📋 Template sélectionné:', currentTemplateData.value.name)
    console.log('📝 Inputs disponibles:', Object.keys(finalInputs).length)
    Object.keys(finalInputs).forEach(key => {
      console.log(`    ✓ ${key}: ${finalInputs[key].type}`)
    })
    showNotification(`Template "${currentTemplateData.value.name}" chargé`, 'positive')
  }
}

/**
 * Extrait les définitions d'inputs depuis un workflow
 * Cherche d'abord dans workflow.inputs, puis dans les tâches de type input
 * @param {Object} workflow - Structure du workflow
 * @returns {Object} Objet des inputs avec leurs définitions
 */
const extractInputsFromWorkflow = (workflow) => {
  const inputs = {}

  if (!workflow) {
    console.log('⚠️ Workflow vide')
    return inputs
  }

  // ========== MÉTHODE 1: Chercher dans workflow.inputs ==========
  const workflowInputs = workflow.inputs || []
  console.log('📊 Inputs dans workflow.inputs:', workflowInputs.length)

  if (Array.isArray(workflowInputs) && workflowInputs.length > 0) {
    workflowInputs.forEach((input, idx) => {
      if (!input || !input.id || !input.type) {
        console.log(`  ⚠️ Input ${idx} mal formé`)
        return
      }

      console.log(`  ✓ Input trouvé: ${input.id} (${input.type})`)

      const inputType = input.type.toLowerCase()

      if (inputType.includes('text')) {
        // Input texte
        inputs[input.id] = {
          id: input.id,
          type: 'text_input',
          label: input.label || 'Saisie texte',
          placeholder: input.placeholder || '',
          hint: input.hint || '',
          required: input.required !== undefined ? input.required : true,
          defaultValue: input.defaultValue || '',
          multiline: input.multiline || false,
          rows: input.rows || 4,
          password: input.password || false
        }
      } else if (inputType.includes('number')) {
        // Input numérique
        inputs[input.id] = {
          id: input.id,
          type: 'number',
          label: input.label || 'Nombre',
          placeholder: input.placeholder || '',
          hint: input.hint || '',
          required: input.required !== undefined ? input.required : true,
          defaultValue: input.defaultValue !== undefined ? input.defaultValue : 0,
          min: input.min,
          max: input.max,
          step: input.step || 1
        }
      } else if (inputType.includes('select')) {
        // Input sélection
        let options = input.options || []
        if (typeof options === 'string') {
          options = options
            .split('\n')
            .filter(opt => opt.trim())
            .map(opt => ({
              label: opt.trim(),
              value: opt.trim()
            }))
        } else if (Array.isArray(options) && options.length > 0 && typeof options[0] === 'string') {
          options = options.map(opt => ({
            label: opt,
            value: opt
          }))
        }

        inputs[input.id] = {
          id: input.id,
          type: 'select',
          label: input.label || 'Sélection',
          hint: input.hint || '',
          required: input.required !== undefined ? input.required : true,
          options: options,
          defaultValue: input.defaultValue || (options.length > 0 ? options[0].value : '')
        }
      } else if (inputType.includes('image')) {
        // Input image
        inputs[input.id] = {
          id: input.id,
          type: 'image_input',
          label: input.label || 'Image',
          placeholder: input.placeholder || 'Sélectionner une image',
          hint: input.hint || '',
          required: input.required !== undefined ? input.required : true,
          multiple: input.multiple || false,
          maxFiles: input.maxFiles || 1,
          defaultImage: input.defaultImage || ''
        }
      }
    })
  }

  // ========== MÉTHODE 2: TOUJOURS chercher aussi dans les tâches input ==========
  const tasks = workflow.tasks || []
  console.log('📊 Tâches trouvées:', tasks.length)

  tasks.forEach((task) => {
    if (!task || !task.type) return

    const taskType = task.type.toLowerCase()
    const inputId = task.id

    // Chercher les tâches de type "..._input"
    if (taskType.includes('input')) {
      // Ne pas dupliquer si déjà dans workflow.inputs
      if (inputs[inputId]) {
        console.log(`  ℹ️ ${inputId} déjà dans workflow.inputs, ignore la tâche`)
        return
      }

      if (taskType.includes('text')) {
        console.log(`  ✓ TEXT_INPUT trouvé dans tâches: ${inputId}`)

        inputs[inputId] = {
          id: inputId,
          type: 'text_input',
          label: task.label || task.input?.label || 'Saisie texte',
          placeholder: task.placeholder || task.input?.placeholder || '',
          hint: task.hint || task.input?.hint || '',
          required: task.required !== undefined ? task.required : (task.input?.required !== undefined ? task.input.required : true),
          defaultValue: task.defaultValue || task.input?.defaultValue || '',
          multiline: task.multiline || task.input?.multiline || false,
          rows: task.rows || task.input?.rows || 4,
          password: task.password || task.input?.password || false
        }
      } else if (taskType.includes('image')) {
        console.log(`  ✓ IMAGE_INPUT trouvé dans tâches: ${inputId}`)

        inputs[inputId] = {
          id: inputId,
          type: 'image_input',
          label: task.label || task.input?.label || 'Image',
          placeholder: task.placeholder || task.input?.placeholder || 'Sélectionner une image',
          hint: task.hint || task.input?.hint || '',
          required: task.required !== undefined ? task.required : (task.input?.required !== undefined ? task.input.required : true),
          multiple: task.multiple || task.input?.multiple || false,
          maxFiles: task.maxFiles || task.input?.maxFiles || 1,
          defaultImage: task.defaultImage || task.input?.defaultImage || ''
        }
      }
    }
  })

  console.log(`✅ Total inputs extraits: ${Object.keys(inputs).length}`)
  Object.keys(inputs).forEach(key => {
    console.log(`    • ${key}: ${inputs[key].type}`)
  })

  return inputs
}

const resetForm = () => {
  formInputs.value = {}

  // Initialiser avec les valeurs par défaut si disponibles
  if (currentTemplateData.value?.inputs) {
    Object.entries(currentTemplateData.value.inputs).forEach(([inputId, inputConfig]) => {
      if (inputConfig.defaultValue !== undefined) {
        formInputs.value[inputId] = inputConfig.defaultValue
      } else if (inputConfig.type === 'checkbox' || inputConfig.type === 'toggle') {
        formInputs.value[inputId] = false
      } else if (inputConfig.type === 'image_input' || inputConfig.type === 'image') {
        formInputs.value[inputId] = inputConfig.multiple ? [] : null
      } else {
        formInputs.value[inputId] = ''
      }
    })
  }

  clearResults()
}

const normalizeResults = (results) => {
  // Convertir les résultats en format array uniforme
  if (!results) return []
  
  // Si c'est déjà un array, le retourner
  if (Array.isArray(results)) {
    console.log('✅ Résultats en format array:', results.length, 'items')
    return results
  }
  
  // Si c'est un objet, le convertir en array
  if (typeof results === 'object') {
    const resultsArray = Object.entries(results).map(([key, value]) => {
      // Chaque item doit avoir au moins un type
      if (value && typeof value === 'object' && value.type) {
        return value
      }
      // Sinon, créer un item formaté
      return {
        id: key,
        type: typeof value === 'string' && (value.startsWith('/medias/') || value.startsWith('data:image/')) ? 'image' : 'text',
        result: value,
        ...value  // Flatten les propriétés
      }
    })
    console.log('✅ Résultats convertis en format array:', resultsArray.length, 'items')
    return resultsArray
  }
  
  return []
}

const executeTemplate = async () => {
  if (!selectedTemplate.value || !currentTemplateData.value) {
    showNotification('Veuillez sélectionner un template', 'warning')
    return
  }

  if (!isFormValid.value) {
    showNotification('Veuillez remplir tous les champs obligatoires', 'warning')
    return
  }

  try {
    console.log('🔍 DEBUG - Avant executeWorkflow:')
    console.log('  currentTemplateData.workflow.inputs:', currentTemplateData.value.workflow?.inputs?.map(t => ({
      id: t.id,
      type: t.type,
      selectedImage: t.selectedImage,
      userInput: t.userInput
    })))
    console.log('  formInputs.value:', Object.keys(formInputs.value))
    
    // Construire la structure du workflow à partir du template
    await executeWorkflow(
      currentTemplateData.value.workflow,
      formInputs.value
    )
    showNotification('Exécution réussie!', 'positive')
    console.log('✅ Résultats reçus:', executionResult.value)
  } catch (error) {
    console.error('❌ Erreur lors de l\'exécution:', error)
    showNotification('Erreur lors de l\'exécution du template', 'negative')
  }
}

const downloadResults = () => {
  if (!executionResult.value) return

  try {
    downloadExecutionResults(`template-results-${Date.now()}.json`)
    showNotification('Résultats téléchargés', 'positive')
  } catch (error) {
    console.error('❌ Erreur lors du téléchargement:', error)
    showNotification('Erreur lors du téléchargement des résultats', 'negative')
  }
}

const clearResults = () => {
  clearExecutionResults()
}

const onFileRejected = (rejectedEntries) => {
  const reasons = rejectedEntries.map(entry => entry.failedPropValidation).join(', ')
  showNotification(`Fichier rejeté: ${reasons}`, 'warning')
}

const downloadImage = (imageUrl) => {
  try {
    const link = document.createElement('a')
    link.href = imageUrl
    link.download = `image-${Date.now()}.jpg`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    showNotification('Image téléchargée', 'positive')
  } catch (error) {
    console.error('❌ Erreur lors du téléchargement:', error)
    showNotification('Erreur lors du téléchargement', 'negative')
  }
}

const triggerFileInput = (inputId) => {
  // Créer un input temporaire
  const fileInput = document.createElement('input')
  fileInput.type = 'file'
  fileInput.accept = 'image/*'
  fileInput.style.display = 'none'
  
  fileInput.addEventListener('change', (e) => {
    handleFileChange(e, inputId)
  })
  
  document.body.appendChild(fileInput)
  fileInput.click()
  
  // Nettoyer après
  setTimeout(() => {
    document.body.removeChild(fileInput)
  }, 100)
}

/**
 * Ouvre le dialogue de capture caméra avec getUserMedia API
 * Fonctionne sur mobile ET desktop
 */
const openCameraDialog = async (inputId, cameraType = 'environment') => {
  currentInputId.value = inputId
  currentCameraType.value = cameraType
  showCameraDialog.value = true
  cameraError.value = null
  capturedPhoto.value = null
  
  // Attendre que le dialogue soit monté
  await new Promise(resolve => setTimeout(resolve, 100))
  
  try {
    // Vérifier si getUserMedia est supporté
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('Votre navigateur ne supporte pas l\'accès à la caméra')
    }
    
    // Configuration de la caméra
    const constraints = {
      video: {
        facingMode: cameraType, // 'user' (frontale) ou 'environment' (arrière)
        width: { ideal: 1920 },
        height: { ideal: 1080 }
      },
      audio: false
    }
    
    // Demander l'accès à la caméra
    console.log('📷 Demande d\'accès à la caméra...', cameraType)
    cameraStream.value = await navigator.mediaDevices.getUserMedia(constraints)
    
    // Attacher le stream à la vidéo
    if (videoElement.value) {
      videoElement.value.srcObject = cameraStream.value
      console.log('✅ Caméra activée')
    }
    
  } catch (error) {
    console.error('❌ Erreur accès caméra:', error)
    
    // Messages d'erreur adaptés
    if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
      cameraError.value = 'Permission refusée. Autorisez l\'accès à la caméra dans les paramètres.'
    } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
      cameraError.value = 'Aucune caméra détectée sur cet appareil.'
    } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
      cameraError.value = 'La caméra est déjà utilisée par une autre application.'
    } else {
      cameraError.value = error.message || 'Impossible d\'accéder à la caméra.'
    }
    
    showNotification(cameraError.value, 'negative')
  }
}

/**
 * Capture une photo depuis le stream vidéo
 */
const capturePhoto = () => {
  if (!videoElement.value || !canvasElement.value) {
    showNotification('Erreur: éléments vidéo non disponibles', 'negative')
    return
  }
  
  try {
    const video = videoElement.value
    const canvas = canvasElement.value
    
    // Définir les dimensions du canvas selon la vidéo
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    
    // Dessiner l'image de la vidéo sur le canvas
    const context = canvas.getContext('2d')
    context.drawImage(video, 0, 0, canvas.width, canvas.height)
    
    // Convertir en data URL
    capturedPhoto.value = canvas.toDataURL('image/jpeg', 0.95)
    
    console.log('📸 Photo capturée')
    showNotification('Photo capturée !', 'positive')
    
  } catch (error) {
    console.error('❌ Erreur capture photo:', error)
    showNotification('Erreur lors de la capture', 'negative')
  }
}

/**
 * Recommencer la capture (supprime la photo capturée)
 */
const retakePhoto = () => {
  capturedPhoto.value = null
  showNotification('Prêt pour une nouvelle photo', 'info')
}

/**
 * Utilise la photo capturée et ferme le dialogue
 */
const usePhoto = async () => {
  if (!capturedPhoto.value || !currentInputId.value) {
    showNotification('Aucune photo à utiliser', 'warning')
    return
  }
  
  try {
    // Convertir le data URL en Blob puis en File
    const response = await fetch(capturedPhoto.value)
    const blob = await response.blob()
    const file = new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' })
    
    // Assigner au formulaire
    formInputs.value[currentInputId.value] = file
    
    showNotification('Photo ajoutée avec succès', 'positive')
    closeCameraDialog()
    
  } catch (error) {
    console.error('❌ Erreur utilisation photo:', error)
    showNotification('Erreur lors de l\'ajout de la photo', 'negative')
  }
}

/**
 * Ferme le dialogue et arrête la caméra
 */
const closeCameraDialog = () => {
  // Arrêter le stream vidéo
  if (cameraStream.value) {
    cameraStream.value.getTracks().forEach(track => {
      track.stop()
      console.log('📷 Caméra arrêtée')
    })
    cameraStream.value = null
  }
  
  // Nettoyer le video element
  if (videoElement.value) {
    videoElement.value.srcObject = null
  }
  
  // Réinitialiser l'état
  showCameraDialog.value = false
  capturedPhoto.value = null
  cameraError.value = null
  currentInputId.value = null
}

const handleFileChange = (event, inputId) => {
  const files = event.target.files
  if (files && files.length > 0) {
    formInputs.value[inputId] = files[0]
    const cameraCapture = event.target.hasAttribute('capture')
    showNotification(
      cameraCapture ? 'Photo capturée avec succès' : 'Image sélectionnée',
      'positive'
    )
  }
}

// Lifecycle
onMounted(async () => {
  await loadTemplates()
})
</script>

<style scoped lang="scss">
.app-viewer {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);

  :deep(.q-card) {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    transition: transform 0.2s, box-shadow 0.2s;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }
  }

  :deep(.font-monospace) {
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  }

  :deep(.text-pre-wrap) {
    white-space: pre-wrap;
    word-wrap: break-word;
  }
}

.bg-light-blue-1 {
  background-color: rgba(33, 150, 243, 0.08);
}

.bg-blue-1 {
  background-color: rgba(33, 150, 243, 0.12);
}

.bg-green-1 {
  background-color: rgba(76, 175, 80, 0.12);
}

.bg-amber-1 {
  background-color: rgba(255, 152, 0, 0.12);
}

.bg-red-1 {
  background-color: rgba(244, 67, 54, 0.12);
}

.bg-red-2 {
  background-color: rgba(244, 67, 54, 0.08);
}

// ============================================
// STYLES POUR LA COLONNE GAUCHE
// ============================================

// Garder les styles existants pour la gauche...

// ============================================
// STYLES POUR LA COLONNE DROITE - APP ATTRACTIVE
// ============================================

.app-wrapper {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
}

.app-hero {
  position: relative;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 2.5rem 2rem;
  color: white;
  overflow: hidden;

  .hero-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: radial-gradient(circle at top right, rgba(255, 255, 255, 0.1) 0%, transparent 70%);
    pointer-events: none;
  }

  .hero-content {
    position: relative;
    z-index: 1;
  }

  .hero-title {
    font-size: 1.75rem;
    font-weight: 700;
    margin: 0;
    line-height: 1.2;
  }

  .hero-subtitle {
    font-size: 0.95rem;
    opacity: 0.9;
    margin: 0.75rem 0 0 0;
    font-weight: 300;
  }
}

.app-main {
  flex: 1;
  overflow-y: auto;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;

  // Custom scrollbar
  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: #f1f1f1;
  }

  &::-webkit-scrollbar-thumb {
    background: #888;
    border-radius: 3px;

    &:hover {
      background: #555;
    }
  }
}

.section-title {
  display: flex;
  align-items: center;
  font-size: 1.1rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 1.5rem;
  padding-bottom: 0.75rem;
  border-bottom: 2px solid #f0f0f0;
}

.form-grid {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-top: 0;
}

.form-item {
  width: 100%;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.field-label {
  font-weight: 600;
  font-size: 0.9rem;
  color: #333;
  display: flex;
  align-items: center;

  .required {
    color: #f44336;
    margin-left: 0.25rem;
    font-weight: 700;
  }
}

.field-input-wrapper {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  position: relative;

  .field-icon {
    color: #667eea;
    flex-shrink: 0;
    margin-top: 0.75rem;
  }

  .field-input {
    flex: 1;

    :deep(.q-field__control) {
      padding-right: 0;
    }
  }

  &.textarea-wrapper {
    align-items: flex-start;

    .field-icon {
      margin-top: 1rem;
    }

    .textarea-input {
      :deep(.q-field__native) {
        resize: vertical;
        min-height: 100px;
      }
    }
  }
}

.field-hint {
  font-size: 0.8rem;
  color: #999;
  margin-top: 0.25rem;
  margin-left: 2rem;
}

// Image Upload Zone
.image-upload-zone {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  border-radius: 8px;
  padding: 0;

  .custom-file-input {
    margin: 0 !important;

    :deep(.q-field__control) {
      border: 2px dashed #667eea !important;
      border-radius: 8px;
      padding: 3rem 2rem;
      background: linear-gradient(135deg, rgba(102, 126, 234, 0.08) 0%, rgba(118, 75, 162, 0.08) 100%);
      min-height: 200px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s ease;
      cursor: pointer;

      &:hover {
        border-color: #764ba2;
        background: linear-gradient(135deg, rgba(102, 126, 234, 0.15) 0%, rgba(118, 75, 162, 0.15) 100%);
      }
    }

    :deep(.q-field__native) {
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
      width: 100%;
    }

    :deep(.q-icon) {
      font-size: 3rem;
      color: #667eea;
    }

    .file-input-content {
      text-align: center;

      .file-input-title {
        font-size: 1.2rem;
        font-weight: 600;
        color: #333;
        margin-bottom: 0.25rem;
      }

      .file-input-subtitle {
        font-size: 0.95rem;
        color: #666;
        margin-bottom: 0.5rem;
      }

      .file-input-formats {
        font-size: 0.8rem;
        color: #999;
      }
    }
  }

  .camera-buttons {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    width: 100%;
  }

  .hidden-file-input {
    display: none;
  }
}

// Image Preview
.image-preview-container {
  display: flex;
  gap: 1rem;
  align-items: center;
  padding: 1rem;
  background: linear-gradient(135deg, #f9f9f9 0%, #f0f0f0 100%);
  border-radius: 8px;
  border: 1px solid #e0e0e0;

  .preview-image {
    flex-shrink: 0;
    width: 100px;
    height: 100px;
    border-radius: 6px;
    overflow: hidden;
    background: white;
    border: 1px solid #e0e0e0;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

    .preview-img {
      width: 100%;
      height: 100%;
    }
  }

  .preview-actions {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .preview-filename {
    font-size: 0.9rem;
    color: #333;
    font-weight: 500;
    word-break: break-word;
    line-height: 1.4;
  }

  .action-buttons-row {
    display: flex;
    gap: 0.5rem;

    :deep(.q-btn) {
      padding: 0.4rem 0.6rem;
    }
  }

  .remove-btn {
    width: fit-content;
  }
}

// Action Buttons
.action-buttons {
  display: flex;
  gap: 0.75rem;
  padding: 1.5rem;
  background: linear-gradient(135deg, #f9f9f9 0%, #f0f0f0 100%);
  border-top: 1px solid #e0e0e0;
  border-radius: 8px;

  .execute-btn {
    :deep(.q-btn__content) {
      font-weight: 600;
    }
  }

  .reset-btn {
    padding: 0 1rem;
  }
}

// Execution Status
.execution-status {
  margin: 2rem 0;

  .status-container {
    display: flex;
    align-items: center;
    gap: 1.5rem;
    padding: 2rem;
    border-radius: 8px;
    animation: slideIn 0.3s ease;

    &.executing {
      background: linear-gradient(135deg, rgba(33, 150, 243, 0.1) 0%, rgba(33, 150, 243, 0.05) 100%);
      border: 1px solid rgba(33, 150, 243, 0.2);
    }

    &.error {
      background: linear-gradient(135deg, rgba(244, 67, 54, 0.1) 0%, rgba(244, 67, 54, 0.05) 100%);
      border: 1px solid rgba(244, 67, 54, 0.2);

      :deep(.q-icon) {
        color: #f44336;
      }
    }

    .status-text {
      flex: 1;
    }

    .status-title {
      font-weight: 600;
      font-size: 1rem;
      color: #333;
    }

    .status-subtitle {
      font-size: 0.9rem;
      color: #666;
      margin-top: 0.25rem;
    }

    .close-status {
      flex-shrink: 0;
    }
  }
}

// Results Section
.results-section {
  animation: slideIn 0.3s ease;
}

.results-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #f0f0f0;

  .results-title {
    display: flex;
    align-items: center;
    font-size: 1.25rem;
    font-weight: 700;
    color: #333;
  }

  .results-meta {
    font-size: 0.85rem;
    color: #999;
    background: #f5f5f5;
    padding: 0.4rem 0.8rem;
    border-radius: 20px;
  }
}

.results-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  margin-bottom: 2rem;
}

.result-card {
  border-radius: 8px;
  overflow: hidden;
  animation: fadeIn 0.3s ease;
}

.result-card-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 1rem;
}

.result-image-container {
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  border-radius: 8px;
  padding: 1rem;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 1rem;
  max-width: 720px;
  margin-left: auto;
  margin-right: auto;

  .result-image {
    max-width: 720px;
    max-height: 720px;
    width: 100%;
    height: auto;
    object-fit: contain;
    border-radius: 4px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
}

.result-caption {
  font-size: 0.9rem;
  color: #666;
  font-style: italic;
  margin-bottom: 1rem;
  padding: 0.75rem;
  background: #f9f9f9;
  border-left: 3px solid #667eea;
  border-radius: 4px;
}

.result-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 500;
  margin-bottom: 1rem;

  &.success {
    background: rgba(76, 175, 80, 0.1);
    color: #2e7d32;
  }

  &.error {
    background: rgba(244, 67, 54, 0.1);
    color: #c62828;
  }
}

.result-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e0e0e0;

  :deep(.q-btn) {
    font-weight: 500;
  }
}

.text-output-box {
  background: #f5f5f5;
  border-left: 4px solid #667eea;
  padding: 1.5rem;
  border-radius: 6px;
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 0.9rem;
  line-height: 1.6;
  color: #333;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.json-output {
  background: #f5f5f5;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  padding: 1rem;
  overflow-x: auto;

  pre {
    margin: 0;
    font-size: 0.85rem;
    color: #333;
    font-family: 'Monaco', 'Menlo', monospace;
    line-height: 1.5;
  }
}

.results-footer {
  display: flex;
  gap: 1rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e0e0e0;

  .action-btn {
    :deep(.q-btn__content) {
      font-weight: 500;
    }
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 2rem;
  text-align: center;
  color: #999;

  .empty-icon {
    margin-bottom: 1rem;
  }

  .empty-title {
    font-size: 1.1rem;
    font-weight: 600;
    color: #666;
    margin-bottom: 0.5rem;
  }

  .empty-text {
    font-size: 0.9rem;
    color: #999;
  }
}

.no-template-state {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 4rem 2rem;
  text-align: center;
  background: white;
  border-radius: 12px;
  min-height: 400px;

  .empty-title {
    font-size: 1.3rem;
    font-weight: 600;
    color: #333;
  }

  .empty-text {
    font-size: 0.95rem;
    color: #999;
  }
}

// Animations
@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

// ============================================
// STYLES POUR LE DIALOGUE CAMERA
// ============================================

.camera-container {
  position: relative;
  width: 100%;
  height: 60vh;
  max-height: 500px;
  background: #000;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.camera-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.camera-canvas {
  position: absolute;
  top: 0;
  left: 0;
}

.photo-preview {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: #000;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;

  img {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
  }
}

// Actions de la caméra - optimisées pour mobile
.camera-actions {
  width: 100%;
  
  .capture-actions {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
}

// Responsive mobile pour la caméra
@media (max-width: 600px) {
  .camera-container {
    height: 50vh;
  }
  
  .camera-actions {
    padding: 0.75rem !important;
    
    .q-btn {
      font-size: 0.9rem;
      padding: 0.5rem 1rem;
    }
  }
}
</style>

