<template>
  <q-card flat bordered class="workflow-runner">
    <q-card-section>
      <div class="row items-center q-mb-md">
        <div class="col">
          <div class="text-h6 text-primary">🔧 Workflow Builder</div>
          <div class="text-caption text-grey-6">Créez votre workflow personnalisé</div>
        </div>
        <div class="col-auto">
          <!-- Actions Builder -->
          <div class="row q-gutter-sm">
            <q-btn
              flat
              icon="upload"
              label="Importer"
              color="primary"
              @click="importWorkflow"
            />
            <q-btn
              flat
              icon="download"
              label="Exporter"
              color="primary"
              :disable="!customWorkflow.tasks.length"
              @click="exportWorkflow"
            />
            <q-btn
              flat
              icon="save"
              label="Sauvegarder"
              color="positive"
              :disable="!customWorkflow.tasks.length"
              @click="saveCustomWorkflow"
            />
          </div>
        </div>
      </div>

      <!-- MODE BUILDER: Construction de workflow personnalisé -->
      <div v-if="builderMode" class="workflow-builder q-mb-lg">
        <div class="row q-col-gutter-md">
          <!-- Palette de tâches -->
          <div class="col-12 col-md-3">
            <q-card flat bordered>
              <q-card-section>
                <div class="text-subtitle2 q-mb-sm">🧩 Tâches disponibles</div>
                <q-list separator dense>
                  <q-item
                    v-for="(taskDef, taskType) in availableTasks"
                    :key="taskType"
                    clickable
                    @click="addTask(taskType)"
                    class="task-palette-item"
                  >
                    <q-item-section avatar>
                      <q-avatar :color="taskDef.color" text-color="white" :icon="taskDef.icon" size="sm" />
                    </q-item-section>
                    <q-item-section>
                      <q-item-label class="text-caption">{{ taskDef.name }}</q-item-label>
                    </q-item-section>
                    <q-item-section side>
                      <q-icon name="add_circle_outline" color="primary" size="xs" />
                    </q-item-section>
                  </q-item>
                </q-list>
              </q-card-section>
            </q-card>
          </div>

          <!-- Zone de construction du workflow -->
          <div class="col-12 col-md-6">
            <q-card flat bordered>
              <q-card-section>
                <div class="row items-center q-mb-sm">
                  <div class="text-subtitle2 col">📋 Workflow ({{ customWorkflow.tasks.length }} tâche{{ customWorkflow.tasks.length > 1 ? 's' : '' }})</div>
                  <q-btn
                    v-if="customWorkflow.tasks.length"
                    flat
                    dense
                    icon="delete_outline"
                    color="negative"
                    label="Tout effacer"
                    @click="clearWorkflow"
                  />
                </div>

                <!-- Liste des tâches dans le workflow -->
                <div v-if="!customWorkflow.tasks.length" class="text-center text-grey-6 q-pa-xl">
                  <q-icon name="playlist_add" size="64px" color="grey-4" />
                  <div class="q-mt-md">Ajoutez des tâches depuis la palette</div>
                </div>

                <q-list v-else separator class="workflow-tasks-list">
                  <q-item
                    v-for="(task, idx) in customWorkflow.tasks"
                    :key="task.id"
                    class="workflow-task-item"
                  >
                    <q-item-section avatar>
                      <q-avatar
                        :color="getTaskDefinition(task.type).color"
                        text-color="white"
                        size="md"
                      >
                        {{ idx + 1 }}
                      </q-avatar>
                    </q-item-section>

                    <q-item-section>
                      <q-item-label class="text-weight-medium">
                        <q-icon :name="getTaskDefinition(task.type).icon" size="sm" class="q-mr-xs" />
                        {{ getTaskDefinition(task.type).name }}
                      </q-item-label>
                      <q-item-label caption>ID: {{ task.id }}</q-item-label>

                      <!-- Formulaire de configuration de la tâche -->
                      <div class="task-config q-mt-sm q-pa-sm bg-grey-2 rounded-borders">
                        <div v-for="(inputDef, inputKey) in getTaskDefinition(task.type).inputs" :key="inputKey" class="q-mb-sm">
                          <!-- Input texte -->
                          <q-input
                            v-if="inputDef.type === 'text'"
                            v-model="task.input[inputKey]"
                            :label="inputDef.label"
                            :placeholder="inputDef.placeholder"
                            :type="inputDef.multiline ? 'textarea' : 'text'"
                            :rows="inputDef.multiline ? 2 : 1"
                            dense
                            filled
                            bg-color="white"
                          >
                            <template v-slot:append v-if="inputDef.acceptsVariable">
                              <q-btn
                                flat
                                dense
                                round
                                icon="code"
                                size="sm"
                                color="primary"
                                @click="showVariableSelector(task.id, inputKey, idx)"
                              >
                                <q-tooltip>Insérer une variable</q-tooltip>
                              </q-btn>
                            </template>
                          </q-input>

                          <!-- Input select -->
                          <q-select
                            v-else-if="inputDef.type === 'select'"
                            v-model="task.input[inputKey]"
                            :options="inputDef.options"
                            :label="inputDef.label"
                            dense
                            filled
                            bg-color="white"
                            emit-value
                            map-options
                          />

                          <!-- Input number -->
                          <div v-else-if="inputDef.type === 'number'" class="number-input-builder">
                            <q-input
                              v-model.number="task.input[inputKey]"
                              :label="inputDef.label"
                              type="number"
                              :min="inputDef.min"
                              :max="inputDef.max"
                              :step="inputDef.step || 0.1"
                              dense
                              filled
                              bg-color="white"
                            >
                              <template v-slot:append>
                                <q-icon name="tag" size="xs" />
                              </template>
                            </q-input>
                            <!-- Slider visuel pour meilleure UX -->
                            <q-slider
                              v-model="task.input[inputKey]"
                              :min="inputDef.min || 0"
                              :max="inputDef.max || 100"
                              :step="inputDef.step || 0.1"
                              :label-value="`${task.input[inputKey] ?? inputDef.default ?? 1}`"
                              label-always
                              color="primary"
                              class="q-mt-sm"
                            />
                          </div>

                          <!-- Input images -->
                          <div v-else-if="inputDef.type === 'images' || inputDef.type === 'image'" class="image-input-builder">
                            <div class="text-caption text-weight-medium q-mb-xs">{{ inputDef.label }}</div>
                            
                            <!-- Choix: Variable, Galerie ou Upload -->
                            <q-btn-toggle
                              :model-value="task.imageInputMode || 'variable'"
                              @update:model-value="(val) => { task.imageInputMode = val; console.log('Image input mode changed:', val, 'for task:', task.id); }"
                              :options="[
                                { label: 'Variable', value: 'variable', icon: 'code' },
                                { label: 'Galerie', value: 'gallery', icon: 'photo_library' },
                                { label: 'Upload', value: 'upload', icon: 'upload_file' }
                              ]"
                              dense
                              unelevated
                              size="sm"
                              class="q-mb-sm"
                            />

                            <!-- Mode Variable -->
                            <div v-if="!task.imageInputMode || task.imageInputMode === 'variable'">
                              <q-btn
                                dense
                                flat
                                icon="code"
                                label="Sélectionner une variable"
                                color="primary"
                                @click="showVariableSelector(task.id, inputKey, idx)"
                                size="sm"
                                class="q-mb-xs"
                              />
                              <div v-if="task.input[inputKey] && typeof task.input[inputKey] === 'string'" class="text-caption text-grey-7 bg-grey-3 q-pa-xs rounded-borders">
                                <q-icon name="link" size="xs" /> {{ task.input[inputKey] }}
                              </div>
                            </div>

                            <!-- Mode Galerie -->
                            <div v-else-if="task.imageInputMode === 'gallery'">
                              <MediaSelector
                                v-model="task.mediaIds"
                                :label="inputDef.label"
                                :placeholder="inputDef.type === 'images' ? 'Sélectionner des images depuis la galerie...' : 'Sélectionner une image depuis la galerie...'"
                                :multiple="inputDef.type === 'images'"
                                :accept="['image']"
                                @selected="(medias) => onTaskMediaSelected(task, inputKey, medias)"
                                @uploaded="(medias) => onTaskMediaUploaded(task, inputKey, medias)"
                              />
                              
                              <!-- Info des médias sélectionnés -->
                              <div v-if="task.mediaIds && getSelectedMediasInfo(task.mediaIds).length" class="q-mt-xs">
                                <div class="text-caption text-grey-6 q-mb-xs">
                                  {{ getSelectedMediasInfo(task.mediaIds).length }} média(s) sélectionné(s) :
                                </div>
                                <div class="row q-col-gutter-xs">
                                  <div v-for="media in getSelectedMediasInfo(task.mediaIds)" :key="media.id" class="col-auto">
                                    <q-chip 
                                      dense 
                                      color="primary" 
                                      text-color="white"
                                      :label="media.originalName || media.filename"
                                      removable
                                      @remove="removeTaskMediaId(task, media.id)"
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>

                            <!-- Mode Upload -->
                            <div v-else-if="task.imageInputMode === 'upload'">
                              <q-file
                                :multiple="inputDef.type === 'images'"
                                accept="image/*"
                                dense
                                filled
                                bg-color="white"
                                @update:model-value="(files) => handleTaskImageUpload(task, inputKey, files)"
                                :label="inputDef.type === 'images' ? 'Sélectionner des images' : 'Sélectionner une image'"
                                clearable
                              >
                                <template v-slot:prepend>
                                  <q-icon name="attach_file" />
                                </template>
                              </q-file>
                              
                              <!-- Aperçu des images uploadées -->
                              <div v-if="task.uploadedImagePreviews && task.uploadedImagePreviews.length" class="row q-col-gutter-xs q-mt-xs">
                                <div v-for="(preview, pIdx) in task.uploadedImagePreviews" :key="pIdx" class="col-4">
                                  <q-card flat bordered class="task-image-preview">
                                    <img :src="preview.url" class="task-image-thumb" />
                                    <q-btn
                                      flat
                                      dense
                                      round
                                      icon="close"
                                      size="xs"
                                      color="negative"
                                      @click="removeTaskImage(task, pIdx)"
                                      class="absolute-top-right q-ma-xs"
                                    />
                                  </q-card>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <!-- Section spéciale pour les tâches génériques input_images -->
                        <div v-if="task.type === 'input_images'" class="q-mt-md">
                          <div class="text-caption text-weight-medium q-mb-xs">Images à uploader</div>
                          <q-file
                            v-model="task.uploadedFiles"
                            :multiple="task.input.multiple !== false"
                            accept="image/*"
                            dense
                            filled
                            bg-color="white"
                            @update:model-value="(files) => handleTaskImageUpload(task, 'uploadedImages', files)"
                            label="Sélectionner des images"
                          >
                            <template v-slot:prepend>
                              <q-icon name="attach_file" />
                            </template>
                          </q-file>
                          
                          <!-- Aperçu des images uploadées -->
                          <div v-if="task.uploadedImagePreviews && task.uploadedImagePreviews.length" class="row q-col-gutter-xs q-mt-xs">
                            <div v-for="(preview, pIdx) in task.uploadedImagePreviews" :key="pIdx" class="col-4">
                              <q-card flat bordered class="task-image-preview">
                                <img :src="preview.url" class="task-image-thumb" />
                                <q-btn
                                  flat
                                  dense
                                  round
                                  icon="close"
                                  size="xs"
                                  color="negative"
                                  @click="removeTaskImage(task, pIdx)"
                                  class="absolute-top-right q-ma-xs"
                                />
                              </q-card>
                            </div>
                          </div>
                        </div>

                        <!-- Section spéciale pour les tâches génériques input_text -->
                        <div v-if="task.type === 'input_text'" class="q-mt-md">
                          <q-input
                            v-model="task.userInputValue"
                            :label="task.input.label || 'Votre texte'"
                            :placeholder="task.input.placeholder || 'Entrez votre texte ici'"
                            type="textarea"
                            rows="3"
                            dense
                            filled
                            bg-color="white"
                          />
                        </div>
                      </div>
                    </q-item-section>

                    <q-item-section side>
                      <div class="column q-gutter-xs">
                        <q-btn
                          flat
                          dense
                          round
                          icon="arrow_upward"
                          size="sm"
                          :disable="idx === 0"
                          @click="moveTaskUp(idx)"
                        />
                        <q-btn
                          flat
                          dense
                          round
                          icon="arrow_downward"
                          size="sm"
                          :disable="idx === customWorkflow.tasks.length - 1"
                          @click="moveTaskDown(idx)"
                        />
                        <q-btn
                          flat
                          dense
                          round
                          icon="delete"
                          color="negative"
                          size="sm"
                          @click="removeTask(idx)"
                        />
                      </div>
                    </q-item-section>
                  </q-item>
                </q-list>
              </q-card-section>
            </q-card>
          </div>

          <!-- Panneau des workflows sauvegardés -->
          <div class="col-12 col-md-3">
            <q-card flat bordered>
              <q-card-section>
                <div class="text-subtitle2 q-mb-sm">
                  💾 Workflows sauvegardés
                  <q-badge v-if="savedWorkflows.length" color="primary" :label="savedWorkflows.length" class="q-ml-xs" />
                </div>
                
                <!-- Message si aucun workflow -->
                <div v-if="!savedWorkflows.length" class="text-center text-grey-6 q-pa-md">
                  <q-icon name="folder_open" size="lg" class="q-mb-sm" />
                  <div class="text-caption">Aucun workflow sauvegardé</div>
                  <div class="text-caption">Créez et sauvegardez un workflow pour le retrouver ici</div>
                </div>

                <!-- Liste des workflows -->
                <q-list v-else separator dense>
                  <q-item
                    v-for="workflow in savedWorkflows"
                    :key="workflow.id"
                    class="saved-workflow-item"
                  >
                    <q-item-section>
                      <q-item-label class="text-weight-medium text-caption">
                        {{ workflow.name }}
                      </q-item-label>
                      <q-item-label caption>
                        {{ workflow.tasks.length }} tâche{{ workflow.tasks.length > 1 ? 's' : '' }}
                      </q-item-label>
                    </q-item-section>
                    
                    <q-item-section side>
                      <div class="row q-gutter-xs">
                        <!-- Charger -->
                        <q-btn
                          flat
                          dense
                          round
                          icon="edit"
                          color="primary"
                          size="xs"
                          @click="loadSavedWorkflow(workflow)"
                        >
                          <q-tooltip>Charger et modifier</q-tooltip>
                        </q-btn>
                        
                        <!-- Dupliquer -->
                        <q-btn
                          flat
                          dense
                          round
                          icon="content_copy"
                          color="info"
                          size="xs"
                          @click="duplicateSavedWorkflow(workflow)"
                        >
                          <q-tooltip>Dupliquer</q-tooltip>
                        </q-btn>
                        
                        <!-- Supprimer -->
                        <q-btn
                          flat
                          dense
                          round
                          icon="delete"
                          color="negative"
                          size="xs"
                          @click="deleteSavedWorkflow(workflow)"
                        >
                          <q-tooltip>Supprimer</q-tooltip>
                        </q-btn>
                      </div>
                    </q-item-section>
                  </q-item>
                </q-list>
              </q-card-section>
            </q-card>
          </div>
        </div>
      </div>

      <!-- MODE TEMPLATE: Inputs du workflow -->
      <div v-if="!builderMode" class="workflow-inputs q-mb-lg">
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
          
          <!-- Input images (plural et singular) -->
          <div v-else-if="input.type === 'images' || input.type === 'image'" class="image-input-section">
            <MediaSelector
              :model-value="inputValues[key]"
              @update:model-value="(val) => workflowStore.updateInputValue(key, val)"
              :label="input.label"
              :placeholder="input.hint || (input.type === 'images' ? 'Sélectionner des images...' : 'Sélectionner une image...')"
              :multiple="input.type === 'images'"
              :accept="['image']"
              @selected="(medias) => onTemplateMediaSelected(key, medias)"
              @uploaded="(medias) => onTemplateMediaUploaded(key, medias)"
            />
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
            @click="builderMode ? executeBuilderWorkflow() : executeWorkflow()"
            color="primary"
            icon="play_arrow"
            :label="builderMode ? 'Exécuter le workflow personnalisé' : 'Exécuter le workflow'"
            :loading="executing"
            :disable="builderMode ? customWorkflow.tasks.length === 0 : !canExecute"
            class="full-width"
            size="lg"
          />
        </div>
        <div class="col-auto">
          <q-btn
            @click="builderMode ? clearWorkflow() : resetWorkflow()"
            flat
            color="grey-7"
            :icon="builderMode ? 'delete_outline' : 'refresh'"
            :label="builderMode ? 'Effacer' : 'Reset'"
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
      <div v-for="(taskResult, idx) in result.task_results" :key="idx" class="q-mb-md">
        <q-card flat bordered>
          <q-card-section>
            <div class="row items-center q-mb-sm">
              <div class="col">
                <div class="text-subtitle2">🔧 Tâche {{ idx + 1 }}</div>
                <div class="text-caption text-grey-6">Type: {{ taskResult.type }}</div>
              </div>
              <div class="col-auto">
                <q-badge
                  :color="taskResult.status === 'completed' ? 'positive' : 'negative'"
                  :label="taskResult.status"
                />
              </div>
            </div>
            
            <!-- Images redimensionnées/recadrées -->
            <div v-if="taskResult.type === 'image_resize_crop' && taskResult.outputs?.image" class="q-mb-sm">
              <div class="text-caption text-grey-6 q-mb-xs">Image redimensionnée/recadrée :</div>
              
              <!-- Affichage des dimensions et opérations -->
              <div v-if="taskResult.outputs.original_dimensions && taskResult.outputs.final_dimensions" class="q-mb-xs">
                <q-chip size="sm" color="grey-6" text-color="white">
                  {{ taskResult.outputs.original_dimensions.width }}×{{ taskResult.outputs.original_dimensions.height }} 
                  → {{ taskResult.outputs.final_dimensions.width }}×{{ taskResult.outputs.final_dimensions.height }}
                </q-chip>
                <q-chip 
                  v-if="taskResult.outputs.applied_operations && taskResult.outputs.applied_operations.length" 
                  size="sm" 
                  color="primary" 
                  text-color="white"
                  class="q-ml-xs"
                >
                  {{ taskResult.outputs.applied_operations.join(', ') }}
                </q-chip>
              </div>
              
              <q-img
                :src="taskResult.outputs.image"
                style="max-width: 100%; max-height: 400px"
                class="rounded-borders"
                fit="contain"
              >
                <template v-slot:error>
                  <div class="absolute-full flex flex-center bg-negative text-white">
                    Erreur de chargement
                  </div>
                </template>
              </q-img>
              <q-btn
                flat
                dense
                color="primary"
                icon="download"
                label="Télécharger"
                @click="downloadImage(taskResult.outputs.image)"
                class="q-mt-xs"
              />
            </div>
            
            <!-- Images générées -->
            <div v-else-if="taskResult.outputs?.image" class="q-mb-sm">
              <div class="text-caption text-grey-6 q-mb-xs">Image générée :</div>
              <q-img
                :src="taskResult.outputs.image"
                style="max-width: 100%; max-height: 400px"
                class="rounded-borders"
                fit="contain"
              >
                <template v-slot:error>
                  <div class="absolute-full flex flex-center bg-negative text-white">
                    Erreur de chargement
                  </div>
                </template>
              </q-img>
              <q-btn
                flat
                dense
                color="primary"
                icon="download"
                label="Télécharger"
                @click="downloadImage(taskResult.outputs.image)"
                class="q-mt-xs"
              />
            </div>

            <!-- Images éditées -->
            <div v-if="taskResult.outputs?.edited_images && taskResult.outputs.edited_images.length" class="q-mb-sm">
              <div class="text-caption text-grey-6 q-mb-xs">Images éditées :</div>
              <div class="row q-col-gutter-sm">
                <div v-for="(imgUrl, imgIdx) in taskResult.outputs.edited_images" :key="imgIdx" class="col-12 col-md-6">
                  <q-img
                    :src="imgUrl"
                    style="max-height: 300px"
                    class="rounded-borders"
                    fit="contain"
                  >
                    <template v-slot:error>
                      <div class="absolute-full flex flex-center bg-negative text-white">
                        Erreur de chargement
                      </div>
                    </template>
                  </q-img>
                  <q-btn
                    flat
                    dense
                    color="primary"
                    icon="download"
                    size="sm"
                    @click="downloadImage(imgUrl)"
                    class="q-mt-xs"
                  />
                </div>
              </div>
            </div>

            <!-- Image éditée unique (fallback) -->
            <div v-else-if="taskResult.outputs?.edited_image" class="q-mb-sm">
              <div class="text-caption text-grey-6 q-mb-xs">Image éditée :</div>
              <q-img
                :src="taskResult.outputs.edited_image"
                style="max-width: 100%; max-height: 400px"
                class="rounded-borders"
                fit="contain"
              >
                <template v-slot:error>
                  <div class="absolute-full flex flex-center bg-negative text-white">
                    Erreur de chargement
                  </div>
                </template>
              </q-img>
              <q-btn
                flat
                dense
                color="primary"
                icon="download"
                label="Télécharger"
                @click="downloadImage(taskResult.outputs.edited_image)"
                class="q-mt-xs"
              />
            </div>

            <!-- Prompt amélioré -->
            <div v-if="taskResult.outputs?.enhanced_prompt" class="q-mb-sm">
              <div class="text-caption text-grey-6 q-mb-xs">Prompt amélioré :</div>
              <q-input
                :model-value="taskResult.outputs.enhanced_prompt"
                readonly
                filled
                type="textarea"
                :rows="3"
              />
            </div>

            <!-- Vidéo -->
            <div v-if="taskResult.outputs?.video" class="q-mb-sm">
              <div class="text-caption text-grey-6 q-mb-xs">Vidéo générée :</div>
              <video controls style="max-width: 100%; max-height: 400px" class="rounded-borders">
                <source :src="taskResult.outputs.video" type="video/mp4">
              </video>
              <q-btn
                flat
                dense
                color="primary"
                icon="download"
                label="Télécharger"
                @click="downloadVideo(taskResult.outputs.video)"
                class="q-mt-xs"
              />
            </div>

            <!-- Descriptions -->
            <div v-if="taskResult.outputs?.descriptions && taskResult.outputs.descriptions.length" class="q-mb-sm">
              <div class="text-caption text-grey-6 q-mb-xs">Descriptions :</div>
              <q-list bordered separator>
                <q-item v-for="(desc, descIdx) in taskResult.outputs.descriptions" :key="descIdx">
                  <q-item-section>
                    <q-item-label caption>Image {{ descIdx + 1 }}</q-item-label>
                    <q-item-label>{{ typeof desc === 'string' ? desc : desc.description }}</q-item-label>
                  </q-item-section>
                </q-item>
              </q-list>
            </div>

            <!-- Erreur -->
            <div v-if="taskResult.error" class="q-mb-sm">
              <q-banner class="bg-negative text-white" rounded dense>
                <template v-slot:avatar>
                  <q-icon name="error" />
                </template>
                {{ taskResult.error }}
              </q-banner>
            </div>

            <!-- Temps d'exécution -->
            <div class="text-caption text-grey-6 q-mt-sm">
              ⏱️ Durée: {{ formatExecutionTime(taskResult.execution_time) }}
            </div>

            <!-- Autres données (debug) -->
            <div v-if="hasOtherOutputs(taskResult.outputs)" class="q-mt-sm">
              <q-expansion-item
                dense
                label="Données brutes"
                icon="data_object"
                caption="Informations détaillées"
              >
                <q-card flat bordered class="q-pa-sm">
                  <pre class="text-caption">{{ JSON.stringify(taskResult.outputs, null, 2) }}</pre>
                </q-card>
              </q-expansion-item>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useWorkflowStore } from 'src/stores/useWorkflowStore'
import { useQuasar } from 'quasar'
import { api } from 'src/boot/axios'
import { TASK_DEFINITIONS, getTaskDefinition, generateTaskId, getAvailableOutputs } from 'src/config/taskDefinitions'
import { uploadMediaService } from 'src/services/uploadMedia'
import { useMediaStore } from 'src/stores/useMediaStore'
import MediaSelector from './MediaSelector.vue'

const workflowStore = useWorkflowStore()
const mediaStore = useMediaStore()
const $q = useQuasar()

// État local
const showWorkflowDetails = ref(false)
const imageFiles = ref(null)
const uploadedImages = ref([])

// État du Builder
const builderMode = ref(true) // Démarrer directement en mode Builder
const customWorkflow = ref({
  id: 'custom-workflow',
  name: 'Workflow personnalisé',
  description: 'Workflow créé avec le builder',
  tasks: []
})

// Workflows sauvegardés en localStorage
const savedWorkflows = ref([])

// Tâches disponibles pour le Builder
const availableTasks = computed(() => TASK_DEFINITIONS)

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
  if (executing.value) return false
  
  // Vérifier que tous les inputs requis sont remplis
  return Object.keys(workflowInputs.value).every(key => {
    const input = workflowInputs.value[key]
    const value = inputValues.value[key]
    
    if (input.type === 'images') {
      return Array.isArray(value) && value.length > 0
    }
    
    if (input.type === 'image') {
      return value instanceof File
    }
    
    if (input.required === false) {
      return true
    }
    
    // Pour les selects, la valeur peut être un objet {label, value}
    let checkValue = value
    if (value && typeof value === 'object' && 'value' in value) {
      checkValue = value.value
    }
    
    return checkValue !== null && 
           checkValue !== undefined && 
           checkValue.toString().trim().length > 0
  })
})

// ========== MÉTHODES DU BUILDER ==========

/**
 * Ajoute une tâche au workflow personnalisé
 */
function addTask(taskType) {
  const taskDef = getTaskDefinition(taskType)
  const existingIds = customWorkflow.value.tasks.map(t => t.id)
  const newTaskId = generateTaskId(taskType, existingIds)
  
  const newTask = {
    id: newTaskId,
    type: taskType,
    input: {}
  }
  
  // Initialiser les inputs avec valeurs par défaut
  Object.keys(taskDef.inputs).forEach(inputKey => {
    const inputDef = taskDef.inputs[inputKey]
    if (inputDef.default !== undefined) {
      newTask.input[inputKey] = inputDef.default
    } else if (inputDef.type === 'number') {
      // Pour les nombres, utiliser 1 par défaut (sauf si min est défini et différent de 0)
      // Ceci assure que les poids LoRA sont à 1 par défaut
      if (inputDef.min !== undefined && inputDef.min > 0) {
        newTask.input[inputKey] = inputDef.min
      } else {
        newTask.input[inputKey] = 1
      }
    } else if (inputDef.type === 'images') {
      newTask.input[inputKey] = []
    } else if (inputDef.type === 'image') {
      newTask.input[inputKey] = null
    } else {
      newTask.input[inputKey] = ''
    }
  })
  
  // Initialiser les propriétés pour l'upload d'images
  newTask.uploadedImagePreviews = []
  newTask.imageInputMode = 'variable'
  
  customWorkflow.value.tasks.push(newTask)
  
  $q.notify({
    type: 'positive',
    message: `Tâche "${taskDef.name}" ajoutée`,
    position: 'top',
    timeout: 1000
  })
}

/**
 * Supprime une tâche du workflow
 */
function removeTask(index) {
  const task = customWorkflow.value.tasks[index]
  const taskDef = getTaskDefinition(task.type)
  
  $q.dialog({
    title: 'Confirmer la suppression',
    message: `Supprimer la tâche "${taskDef.name}" (${task.id}) ?`,
    cancel: true,
    persistent: true
  }).onOk(() => {
    customWorkflow.value.tasks.splice(index, 1)
    $q.notify({
      type: 'info',
      message: 'Tâche supprimée',
      position: 'top',
      timeout: 1000
    })
  })
}

/**
 * Monte une tâche dans l'ordre d'exécution
 */
function moveTaskUp(index) {
  if (index === 0) return
  const tasks = customWorkflow.value.tasks
  ;[tasks[index - 1], tasks[index]] = [tasks[index], tasks[index - 1]]
}

/**
 * Descend une tâche dans l'ordre d'exécution
 */
function moveTaskDown(index) {
  if (index === customWorkflow.value.tasks.length - 1) return
  const tasks = customWorkflow.value.tasks
  ;[tasks[index], tasks[index + 1]] = [tasks[index + 1], tasks[index]]
}

/**
 * Efface toutes les tâches du workflow
 */
function clearWorkflow() {
  $q.dialog({
    title: 'Confirmer',
    message: 'Effacer toutes les tâches du workflow ?',
    cancel: true,
    persistent: true
  }).onOk(() => {
    customWorkflow.value.tasks = []
    $q.notify({
      type: 'info',
      message: 'Workflow effacé',
      position: 'top'
    })
  })
}

/**
 * Affiche le sélecteur de variables pour un input
 */
function showVariableSelector(taskId, inputKey, taskIndex) {
  // Récupérer toutes les variables disponibles depuis les tâches précédentes
  const availableVars = []
  
  // Variables d'inputs globaux
  availableVars.push({
    label: 'Inputs globaux',
    children: [
      { label: 'inputs.prompt', value: '{{inputs.prompt}}' },
      { label: 'inputs.images', value: '{{inputs.images}}' },
      { label: 'inputs.style', value: '{{inputs.style}}' },
      { label: 'inputs.aspectRatio', value: '{{inputs.aspectRatio}}' }
    ]
  })
  
  // Variables des tâches précédentes
  for (let i = 0; i < taskIndex; i++) {
    const prevTask = customWorkflow.value.tasks[i]
    const outputs = getAvailableOutputs(prevTask.id, prevTask.type)
    
    if (outputs.length) {
      availableVars.push({
        label: `Tâche ${i + 1} (${prevTask.id})`,
        children: outputs.map(out => ({
          label: out.label,
          value: out.variable,
          description: out.description
        }))
      })
    }
  }
  
  // Créer une dialog avec liste des variables
  $q.dialog({
    title: 'Sélectionner une variable',
    message: 'Choisissez une variable à insérer :',
    options: {
      type: 'radio',
      model: customWorkflow.value.tasks[taskIndex].input[inputKey] || '',
      items: availableVars.flatMap(group => 
        group.children.map(child => ({
          label: `${child.label} - ${child.description || group.label}`,
          value: child.value
        }))
      )
    },
    cancel: true
  }).onOk(selectedVar => {
    customWorkflow.value.tasks[taskIndex].input[inputKey] = selectedVar
  })
}

/**
 * Gère l'upload d'images pour une tâche spécifique
 */
function handleTaskImageUpload(task, inputKey, files) {
  if (!files) return
  
  // Initialiser les propriétés si nécessaire
  if (!task.uploadedImagePreviews) {
    task.uploadedImagePreviews = []
  }
  
  // Réinitialiser
  task.uploadedImagePreviews = []
  
  // Créer les aperçus
  const filesArray = Array.isArray(files) ? files : [files]
  filesArray.forEach(file => {
    const url = URL.createObjectURL(file)
    task.uploadedImagePreviews.push({
      file,
      url,
      name: file.name
    })
  })
  
  // Stocker les fichiers dans l'input de la tâche
  const taskDef = getTaskDefinition(task.type)
  const inputDef = taskDef.inputs[inputKey]
  
  if (inputDef && inputDef.type === 'image') {
    // Pour un input de type 'image' (singulier), stocker le premier fichier seulement
    task.input[inputKey] = filesArray[0] || null
  } else {
    // Pour un input de type 'images' (pluriel), stocker le tableau
    task.input[inputKey] = filesArray
  }
  
  console.log(`📸 ${filesArray.length} image(s) uploadée(s) pour ${task.id}.${inputKey}`, {
    inputType: inputDef?.type,
    storedValue: task.input[inputKey]
  })
}

/**
 * Supprime une image uploadée d'une tâche
 */
function removeTaskImage(task, imageIndex) {
  if (task.uploadedImagePreviews && task.uploadedImagePreviews[imageIndex]) {
    // Révoquer l'URL de l'aperçu
    URL.revokeObjectURL(task.uploadedImagePreviews[imageIndex].url)
    
    // Supprimer de la liste
    task.uploadedImagePreviews.splice(imageIndex, 1)
    
    // Mettre à jour l'input
    const taskDef = getTaskDefinition(task.type)
    const inputKey = Object.keys(taskDef.inputs).find(
      key => taskDef.inputs[key].type === 'images' || 
             taskDef.inputs[key].type === 'image'
    )
    
    if (inputKey) {
      const inputDef = taskDef.inputs[inputKey]
      
      if (inputDef.type === 'image') {
        // Pour un input de type 'image' (singulier)
        task.input[inputKey] = task.uploadedImagePreviews.length > 0 ? 
          task.uploadedImagePreviews[0].file : null
      } else {
        // Pour un input de type 'images' (pluriel)
        task.input[inputKey] = task.uploadedImagePreviews.map(p => p.file)
      }
    }
  }
}

/**
 * Gère la sélection de médias depuis la galerie pour une tâche
 */
function onTaskMediaSelected(task, inputKey, medias) {
  console.log(`📸 Médias sélectionnés depuis la galerie pour ${task.id}.${inputKey}:`, medias)
  
  const taskDef = getTaskDefinition(task.type)
  const inputDef = taskDef.inputs[inputKey]
  
  if (inputDef.type === 'image') {
    // Pour un input de type 'image' (singulier)
    const mediaId = medias.length > 0 ? medias[0].id : null
    task.mediaIds = mediaId
    task.input[inputKey] = mediaId
  } else {
    // Pour un input de type 'images' (pluriel)
    const mediaIds = medias.map(media => media.id)
    task.mediaIds = mediaIds
    task.input[inputKey] = mediaIds
  }
}

/**
 * Gère l'upload de nouveaux médias pour une tâche
 */
function onTaskMediaUploaded(task, inputKey, medias) {
  console.log(`📤 Nouveaux médias uploadés pour ${task.id}.${inputKey}:`, medias)
  
  // Les médias sont automatiquement ajoutés au store
  // On les sélectionne pour la tâche
  onTaskMediaSelected(task, inputKey, medias)
  
  $q.notify({
    type: 'positive',
    message: `${medias.length} média(s) uploadé(s) et sélectionné(s)`,
    timeout: 2000
  })
}

/**
 * Obtient les informations des médias sélectionnés
 */
function getSelectedMediasInfo(mediaIds) {
  if (!mediaIds) return []
  
  const ids = Array.isArray(mediaIds) ? mediaIds : [mediaIds]
  return ids.map(id => mediaStore.getMedia(id)).filter(Boolean)
}

/**
 * Supprime un ID de média d'une tâche
 */
function removeTaskMediaId(task, mediaIdToRemove) {
  if (Array.isArray(task.mediaIds)) {
    task.mediaIds = task.mediaIds.filter(id => id !== mediaIdToRemove)
    task.input = { ...task.input }
    
    // Trouver la clé d'input pour les images
    const taskDef = getTaskDefinition(task.type)
    const inputKey = Object.keys(taskDef.inputs).find(
      key => taskDef.inputs[key].type === 'images' || taskDef.inputs[key].type === 'image'
    )
    
    if (inputKey) {
      task.input[inputKey] = task.mediaIds
    }
  } else if (task.mediaIds === mediaIdToRemove) {
    task.mediaIds = null
    
    // Trouver la clé d'input pour l'image
    const taskDef = getTaskDefinition(task.type)
    const inputKey = Object.keys(taskDef.inputs).find(
      key => taskDef.inputs[key].type === 'image'
    )
    
    if (inputKey) {
      task.input[inputKey] = null
    }
  }
}

/**
 * Sauvegarde le workflow personnalisé dans localStorage
```
 */
function saveCustomWorkflow() {
  if (!customWorkflow.value.tasks.length) {
    $q.notify({
      type: 'warning',
      message: 'Le workflow est vide',
      position: 'top'
    })
    return
  }
  
  $q.dialog({
    title: 'Sauvegarder le workflow',
    message: 'Nom du workflow :',
    prompt: {
      model: customWorkflow.value.name,
      type: 'text'
    },
    cancel: true
  }).onOk(name => {
    customWorkflow.value.name = name
    
    // Récupérer les workflows existants
    const saved = JSON.parse(localStorage.getItem('customWorkflows') || '[]')
    
    // Ajouter ou mettre à jour
    const existing = saved.findIndex(w => w.id === customWorkflow.value.id)
    if (existing >= 0) {
      saved[existing] = { ...customWorkflow.value }
    } else {
      saved.push({ ...customWorkflow.value })
    }
    
    localStorage.setItem('customWorkflows', JSON.stringify(saved))
    
    // Rafraîchir la liste des workflows sauvegardés
    savedWorkflows.value = saved
    
    $q.notify({
      type: 'positive',
      message: `Workflow "${name}" sauvegardé !`,
      position: 'top'
    })
  })
}

/**
 * Charge un workflow sauvegardé
 */
function loadSavedWorkflow(workflow) {
  customWorkflow.value = JSON.parse(JSON.stringify(workflow))
  $q.notify({
    type: 'info',
    message: `Workflow "${workflow.name}" chargé`,
    position: 'top',
    timeout: 1000
  })
}

/**
 * Duplique un workflow sauvegardé
 */
function duplicateSavedWorkflow(workflow) {
  const duplicate = JSON.parse(JSON.stringify(workflow))
  duplicate.id = `${workflow.id}-copy-${Date.now()}`
  duplicate.name = `${workflow.name} (copie)`
  
  const saved = JSON.parse(localStorage.getItem('customWorkflows') || '[]')
  saved.push(duplicate)
  localStorage.setItem('customWorkflows', JSON.stringify(saved))
  savedWorkflows.value = saved
  
  $q.notify({
    type: 'positive',
    message: `Workflow "${duplicate.name}" dupliqué !`,
    position: 'top'
  })
}

/**
 * Supprime un workflow sauvegardé
 */
function deleteSavedWorkflow(workflow) {
  $q.dialog({
    title: 'Confirmer la suppression',
    message: `Supprimer définitivement le workflow "${workflow.name}" ?`,
    cancel: true,
    persistent: true
  }).onOk(() => {
    const saved = JSON.parse(localStorage.getItem('customWorkflows') || '[]')
    const filtered = saved.filter(w => w.id !== workflow.id)
    localStorage.setItem('customWorkflows', JSON.stringify(filtered))
    savedWorkflows.value = filtered
    
    $q.notify({
      type: 'info',
      message: `Workflow "${workflow.name}" supprimé`,
      position: 'top'
    })
  })
}

/**
 * Exporte le workflow en JSON
 */
function exportWorkflow() {
  const dataStr = JSON.stringify(customWorkflow.value, null, 2)
  const blob = new Blob([dataStr], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  
  const link = document.createElement('a')
  link.href = url
  link.download = `${customWorkflow.value.name.replace(/\s+/g, '-')}.json`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
  
  $q.notify({
    type: 'positive',
    message: 'Workflow exporté !',
    position: 'top'
  })
}

/**
 * Importe un workflow depuis un fichier JSON
 */
function importWorkflow() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'application/json'
  
  input.onchange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    
    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target.result)
        
        // Validation basique
        if (!imported.tasks || !Array.isArray(imported.tasks)) {
          throw new Error('Format de workflow invalide')
        }
        
        customWorkflow.value = imported
        
        $q.notify({
          type: 'positive',
          message: `Workflow "${imported.name}" importé !`,
          position: 'top'
        })
      } catch (error) {
        $q.notify({
          type: 'negative',
          message: 'Erreur lors de l\'import',
          caption: error.message,
          position: 'top'
        })
      }
    }
    
    reader.readAsText(file)
  }
  
  input.click()
}

/**
 * Exécute le workflow personnalisé du Builder
 */
async function executeBuilderWorkflow() {
  if (!customWorkflow.value.tasks.length) {
    $q.notify({
      type: 'warning',
      message: 'Ajoutez au moins une tâche',
      position: 'top'
    })
    return
  }
  
  // Réinitialiser les résultats précédents
  workflowStore.lastResult = null
  
  // Marquer comme en cours d'exécution
  workflowStore.executing = true
  workflowStore.error = null
  
  try {
    // Préparer les tâches en enrichissant les tâches génériques
    const preparedTasks = customWorkflow.value.tasks.map(task => {
      const taskDef = getTaskDefinition(task.type)
      const taskCopy = { ...task, input: { ...task.input } }
      
      // Pour les tâches génériques, ajouter les données utilisateur
      if (taskDef.noExecution) {
        if (task.type === 'input_text') {
          // Le texte est déjà dans task.input.defaultValue ou task.userInputValue
          taskCopy.input.userInput = task.userInputValue || task.input.defaultValue || ''
        } else if (task.type === 'input_images') {
          // Les images sont dans task.uploadedImagePreviews
          if (task.uploadedImagePreviews && task.uploadedImagePreviews.length) {
            taskCopy.input.uploadedImages = task.uploadedImagePreviews.map(p => p.file)
          }
        } else if (task.type === 'camera_capture') {
          // L'image capturée est dans task.capturedImage
          if (task.capturedImage) {
            taskCopy.input.capturedImage = task.capturedImage
          }
        }
      }
      
      return taskCopy
    })
    
    // NOUVELLE APPROCHE: Upload des médias en premier lieu
    // Collecter tous les fichiers qui nécessitent un upload
    const filesToUpload = []
    const fileMapping = new Map() // Pour mapper file -> media ID
    
    console.log('🔍 Analyse des tâches pour files:', preparedTasks.map(task => ({
      id: task.id,
      type: task.type,
      inputKeys: Object.keys(task.input || {}),
      inputs: task.input
    })))
    
    preparedTasks.forEach(task => {
      Object.keys(task.input || {}).forEach(key => {
        const value = task.input[key]
        console.log(`🔍 Input ${task.id}.${key}:`, {
          type: typeof value,
          isArray: Array.isArray(value),
          isFile: value instanceof File,
          isMediaId: typeof value === 'string' && value.length === 36,
          value: value
        })
        
        // Nouveau: Gérer les IDs de médias de la galerie ET les fichiers uploadés
        if (Array.isArray(value) && value.length > 0) {
          // Vérifier si c'est un array de fichiers ou d'IDs de médias
          if (value[0] instanceof File) {
            // Array de fichiers à uploader
            console.log(`📁 Détecté array de fichiers: ${task.id}.${key}`, value.length)
            value.forEach(file => {
              if (!fileMapping.has(file)) {
                filesToUpload.push(file)
                fileMapping.set(file, null) // Sera rempli après l'upload
              }
            })
          } else if (typeof value[0] === 'string' && value[0].length === 36) {
            // Array d'IDs de médias (UUID format) - déjà prêt, pas d'upload nécessaire
            console.log(`🗂️ Détecté array d'IDs de médias: ${task.id}.${key}`, value.length)
          }
        } else if (value instanceof File) {
          // Fichier unique à uploader
          console.log(`📁 Détecté fichier unique: ${task.id}.${key}`, value.name)
          if (!fileMapping.has(value)) {
            filesToUpload.push(value)
            fileMapping.set(value, null) // Sera rempli après l'upload
          }
        } else if (typeof value === 'string' && value.length === 36) {
          // ID de média unique (UUID format) - déjà prêt, pas d'upload nécessaire  
          console.log(`🗂️ Détecté ID de média unique: ${task.id}.${key}`, value)
        }
      })
    })
    
    // Upload tous les médias si nécessaire
    if (filesToUpload.length > 0) {
      console.log(`📤 Upload de ${filesToUpload.length} média(s) avant exécution du workflow`)
      
      try {
        const uploadResult = await uploadMediaService.uploadMultiple(filesToUpload)
        
        if (!uploadResult.success) {
          throw new Error('Échec de l\'upload des médias')
        }
        
        // Mapper les fichiers uploadés avec leurs IDs
        uploadResult.uploaded.forEach((mediaInfo, index) => {
          const originalFile = filesToUpload[index]
          fileMapping.set(originalFile, mediaInfo.id)
          console.log(`📝 Mapping créé: ${originalFile.name} -> ${mediaInfo.id}`)
        })
        
        console.log('📦 Réponse upload complète:', uploadResult)
        console.log(`✅ ${uploadResult.successful} média(s) uploadé(s) avec succès`)
        
        if (uploadResult.errors && uploadResult.errors.length > 0) {
          console.error('❌ Erreurs d\'upload détaillées:', uploadResult.errors)
          uploadResult.errors.forEach((error, index) => {
            console.error(`❌ Erreur ${index + 1}:`, JSON.stringify(error, null, 2))
          })
        }
        
        console.log(`📋 Mapping final:`, Array.from(fileMapping.entries()).map(([file, id]) => ({
          fileName: file.name,
          id: id
        })))
        
      } catch (uploadError) {
        throw new Error(`Erreur lors de l'upload des médias: ${uploadError.message}`)
      }
    }
    
    // Remplacer les File objects par les IDs des médias
    const workflowForSubmit = {
      id: customWorkflow.value.id,
      name: customWorkflow.value.name,
      description: customWorkflow.value.description,
      tasks: preparedTasks.map(task => {
        const taskCopy = { ...task, input: { ...task.input } }
        
        // Pour chaque input qui contient des Files (remplacer par des IDs de médias)
        Object.keys(taskCopy.input).forEach(key => {
          const value = taskCopy.input[key]
          
          if (Array.isArray(value) && value.length > 0 && value[0] instanceof File) {
            // Remplacer les fichiers par leurs IDs de média
            taskCopy.input[key] = value.map(file => {
              const mediaId = fileMapping.get(file)
              console.log(`🔄 Mapping array file to ID: ${file.name} -> ${mediaId}`)
              if (!mediaId) {
                console.error(`❌ Pas d'ID trouvé pour le fichier: ${file.name}`)
                throw new Error(`Mapping manquant pour le fichier: ${file.name}`)
              }
              return mediaId
            })
          } else if (value instanceof File) {
            // Remplacer le fichier par son ID de média
            const mediaId = fileMapping.get(value)
            console.log(`🔄 Mapping single file to ID: ${value.name} -> ${mediaId}`)
            if (!mediaId) {
              console.error(`❌ Pas d'ID trouvé pour le fichier: ${value.name}`)
              throw new Error(`Mapping manquant pour le fichier: ${value.name}`)
            }
            taskCopy.input[key] = mediaId
          }
          // Les IDs de médias restent inchangés (déjà sous la bonne forme)
          // typeof value === 'string' && value.length === 36 -> pas de modification nécessaire
        })
        
        return taskCopy
      })
    }
    
    console.log('🚀 Exécution workflow Builder avec IDs des médias:', workflowForSubmit)
    
    // Envoi JSON avec les IDs des médias (plus de FormData nécessaire)
    const response = await api.post('/workflow/run', {
      workflow: workflowForSubmit,
      inputs: {}
    })
    
    // Stocker le résultat dans le store
    workflowStore.lastResult = response.data
    
    $q.notify({
      type: 'positive',
      message: 'Workflow exécuté avec succès !',
      position: 'top'
    })
  } catch (error) {
    console.error('❌ Erreur exécution workflow Builder:', error)
    workflowStore.error = error.message
    
    $q.notify({
      type: 'negative',
      message: 'Erreur lors de l\'exécution',
      caption: error.response?.data?.error || error.message,
      position: 'top'
    })
  } finally {
    workflowStore.executing = false
  }
}

// ========== MÉTHODES EXISTANTES ==========

/**
 * Gère la sélection de médias pour les inputs de template
 */
function onTemplateMediaSelected(inputKey, medias) {
  console.log(`📸 Médias sélectionnés pour input template ${inputKey}:`, medias)
  
  const inputDef = workflowInputs.value[inputKey]
  
  if (inputDef.type === 'image') {
    // Pour un input de type 'image' (singulier)
    const mediaId = medias.length > 0 ? medias[0].id : null
    workflowStore.updateInputValue(inputKey, mediaId)
  } else {
    // Pour un input de type 'images' (pluriel)
    const mediaIds = medias.map(media => media.id)
    workflowStore.updateInputValue(inputKey, mediaIds)
  }
}

/**
 * Gère l'upload de nouveaux médias pour les inputs de template
 */
function onTemplateMediaUploaded(inputKey, medias) {
  console.log(`📤 Nouveaux médias uploadés pour input template ${inputKey}:`, medias)
  
  // Les médias sont automatiquement ajoutés au store
  // On les sélectionne pour l'input
  onTemplateMediaSelected(inputKey, medias)
  
  $q.notify({
    type: 'positive',
    message: `${medias.length} média(s) uploadé(s) et sélectionné(s)`,
    timeout: 2000
  })
}

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

function handleImageUpload(files, inputKey) {
  if (!files) return
  
  const filesArray = Array.isArray(files) ? files : [files]
  
  // Déterminer le type d'input depuis la définition du workflow
  const inputDef = workflowInputs.value[inputKey]
  
  if (inputDef && inputDef.type === 'image') {
    // Pour un input de type 'image' (singulier), on passe le premier fichier directement
    workflowStore.updateInputValue(inputKey, filesArray[0] || null)
  } else {
    // Pour un input de type 'images' (pluriel), on passe un tableau
    workflowStore.updateInputValue(inputKey, filesArray)
  }
}

function removeImage(index, inputKey = 'images') {
  uploadedImages.value.splice(index, 1)
  
  // Mettre à jour avec les fichiers restants
  if (inputKey === 'image') {
    // Pour un input de type 'image' (singulier)
    if (uploadedImages.value.length > 0) {
      workflowStore.updateInputValue('image', uploadedImages.value[0].file)
    } else {
      workflowStore.updateInputValue('image', null)
    }
  } else {
    // Pour un input de type 'images' (pluriel)
    const fileObjects = uploadedImages.value.map(img => img.file)
    workflowStore.updateInputValue(inputKey, fileObjects)
  }
}

// Fonction pour obtenir les aperçus d'images pour un input spécifique
function getImagePreviews(inputKey) {
  const value = inputValues.value[inputKey]
  if (!value) return []
  
  // Si c'est un tableau de fichiers (images multiples)
  if (Array.isArray(value)) {
    return value.map((file, idx) => ({
      url: URL.createObjectURL(file),
      name: file.name,
      file: file
    }))
  }
  
  // Si c'est un seul fichier (image unique)
  if (value instanceof File) {
    return [{
      url: URL.createObjectURL(value),
      name: value.name,
      file: value
    }]
  }
  
  return []
}

// Fonction pour supprimer une image d'un input spécifique
function removeImageFromInput(index, inputKey) {
  const currentValue = inputValues.value[inputKey]
  
  if (Array.isArray(currentValue)) {
    // Pour les images multiples
    const newValue = [...currentValue]
    newValue.splice(index, 1)
    workflowStore.updateInputValue(inputKey, newValue)
  } else {
    // Pour l'image unique
    workflowStore.updateInputValue(inputKey, null)
  }
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

function hasOtherOutputs(outputs) {
  if (!outputs) return false
  const knownKeys = ['image', 'edited_images', 'enhanced_prompt', 'video', 'error', 'descriptions']
  return Object.keys(outputs).some(key => !knownKeys.includes(key))
}

function formatExecutionTime(ms) {
  if (!ms) return '0ms'
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(2)}s`
}

function downloadImage(url) {
  const link = document.createElement('a')
  link.href = url
  link.download = `image-${Date.now()}.jpg`
  link.target = '_blank'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

function downloadVideo(url) {
  const link = document.createElement('a')
  link.href = url
  link.download = `video-${Date.now()}.mp4`
  link.target = '_blank'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
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
onMounted(() => {
  // Charger le premier template si aucun workflow n'est chargé
  if (!currentWorkflow.value) {
    loadTemplate(workflowTemplates.value[0])
  }
  
  // Charger les workflows personnalisés depuis localStorage
  const saved = localStorage.getItem('customWorkflows')
  if (saved) {
    try {
      savedWorkflows.value = JSON.parse(saved)
      console.log(`✅ ${savedWorkflows.value.length} workflow(s) personnalisé(s) chargé(s) depuis localStorage`)
    } catch (error) {
      console.error('Erreur lors du chargement des workflows personnalisés:', error)
      savedWorkflows.value = []
    }
  }
})
</script>


<style scoped lang="scss">
.workflow-runner {
  .workflow-builder {
    .task-palette-item {
      cursor: pointer;
      transition: background-color 0.2s;
      
      &:hover {
        background-color: rgba(0, 0, 0, 0.03);
      }
    }
    
    .workflow-tasks-list {
      .workflow-task-item {
        border-left: 4px solid transparent;
        transition: border-color 0.2s;
        
        &:hover {
          border-left-color: var(--q-primary);
        }
        
        .task-config {
          max-width: 100%;
          
          .image-input-builder {
            .task-image-preview {
              position: relative;
              height: 60px;
              overflow: hidden;
              
              .task-image-thumb {
                width: 100%;
                height: 100%;
                object-fit: cover;
              }
            }
          }
        }
      }
    }
  }
  
  .saved-workflow-item {
    &:hover {
      background-color: rgba(0, 0, 0, 0.02);
    }
  }
  
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
