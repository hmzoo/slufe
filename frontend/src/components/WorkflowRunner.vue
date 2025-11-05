<template>
  <q-card flat bordered class="workflow-runner">
    <q-card-section>
      <div class="row items-center q-mb-md">
        <div class="col">
          <div class="row items-center q-gutter-md no-wrap">
            <div class="text-h6 text-primary">🔧 Workflow Builder</div>
            
            <!-- Indicateur de collection courante -->
            <div v-if="currentCollection" class="row items-center q-gutter-xs no-wrap">
              <q-icon name="collections" color="purple" size="18px" />
              <span class="text-body2 text-purple">
                {{ currentCollection.name }}
              </span>
              <q-chip 
                size="sm" 
                color="purple" 
                text-color="white" 
                :label="`${currentCollection.images?.length || 0} images`"
              />
            </div>
            <div v-else class="row items-center q-gutter-xs text-caption text-grey-5 no-wrap">
              <q-icon name="collections_bookmark" size="16px" />
              <span>Aucune collection</span>
              <q-btn 
                size="xs" 
                flat 
                dense 
                label="Gérer" 
                color="grey-6"
                @click="showCollectionManager = true"
              />
            </div>
          </div>
          <div class="text-caption text-grey-6">Créez votre workflow personnalisé</div>
        </div>
        <div class="col-auto">
          <!-- Actions Builder -->
          <div class="row q-gutter-sm">
            <q-btn
              flat
              icon="folder"
              label="Mes Workflows"
              color="primary"
              @click="showSavedWorkflowManager = true"
            />
            <q-btn
              flat
              icon="dashboard"
              label="Templates"
              color="secondary"
              @click="showTemplateManager = true"
            />
            <q-btn
              flat
              icon="collections"
              label="Collections"
              color="purple"
              @click="showCollectionManager = true"
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
                <!-- En-tête du workflow avec titre -->
                <div class="row items-center q-mb-sm">
                  <div class="col">
                    <div class="text-subtitle2">📋 Workflow ({{ customWorkflow.tasks.length }} tâche{{ customWorkflow.tasks.length > 1 ? 's' : '' }})</div>
                    <div v-if="customWorkflow.name" class="text-caption text-grey-6 q-mt-xs">
                      <q-icon name="title" size="14px" class="q-mr-xs" />
                      {{ customWorkflow.name }}
                    </div>
                  </div>
                </div>

                <!-- Actions du workflow -->
                <div class="row q-gutter-xs q-mb-md">
                  <q-btn
                    size="sm"
                    flat
                    icon="upload"
                    label="Importer"
                    color="primary"
                    @click="importWorkflow"
                  />
                  <q-btn
                    size="sm"
                    flat
                    icon="download"
                    label="Exporter"
                    color="primary"
                    :disable="!customWorkflow.tasks.length"
                    @click="exportWorkflow"
                  />
                  <q-btn
                    size="sm"
                    flat
                    icon="save"
                    label="Sauvegarder"
                    color="positive"
                    :disable="!customWorkflow.tasks.length"
                    @click="openSaveDialog"
                  />
                  <q-btn
                    size="sm"
                    flat
                    icon="dashboard"
                    label="Créer Template"
                    color="secondary"
                    :disable="!customWorkflow.tasks.length"
                    @click="createTemplateFromWorkflow"
                  />
                  <q-space />
                  <q-btn
                    v-if="customWorkflow.tasks.length"
                    size="sm"
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
                        <div 
                          v-for="(inputDef, inputKey) in getTaskDefinition(task.type).inputs" 
                          :key="inputKey" 
                          v-show="!inputDef.hidden"
                          class="q-mb-sm"
                        >
                          
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

                          <!-- Input video -->
                          <div v-else-if="inputDef.type === 'video'" class="video-input-builder">
                            <div class="text-caption text-weight-medium q-mb-xs">{{ inputDef.label }}</div>
                            
                            <!-- Choix: Variable ou Galerie -->
                            <q-btn-toggle
                              :model-value="task[`videoInputMode_${inputKey}`] || 'variable'"
                              @update:model-value="(val) => { task[`videoInputMode_${inputKey}`] = val; console.log('Video input mode changed:', val, 'for input:', inputKey, 'task:', task.id); }"
                              :options="[
                                { label: 'Variable', value: 'variable', icon: 'code' },
                                { label: 'Galerie', value: 'gallery', icon: 'video_library' }
                              ]"
                              dense
                              unelevated
                              size="sm"
                              class="q-mb-sm"
                            />

                            <!-- Mode Variable -->
                            <div v-if="!task[`videoInputMode_${inputKey}`] || task[`videoInputMode_${inputKey}`] === 'variable'">
                              <q-btn
                                dense
                                flat
                                icon="code"
                                label="Sélectionner une variable"
                                color="primary"
                                @click="showVariableSelector(task.id, inputKey, idx)"
                                class="q-mb-sm full-width"
                              />
                              <q-input
                                :model-value="task.input[inputKey]"
                                @update:model-value="(val) => updateTaskInput(task.id, inputKey, val)"
                                :label="inputDef.label"
                                dense
                                filled
                                bg-color="white"
                                :hint="inputDef.hint"
                              />
                            </div>

                            <!-- Mode Galerie -->
                            <div v-else-if="task[`videoInputMode_${inputKey}`] === 'gallery'">
                              <MediaSelector
                                v-model="task[`mediaIds_${inputKey}`]"
                                :label="inputDef.label"
                                :placeholder="'Sélectionner une vidéo depuis la galerie...'"
                                :multiple="false"
                                :accept="['video']"
                                @selected="(medias) => onTaskMediaSelected(task, inputKey, medias)"
                                @uploaded="(medias) => onTaskMediaUploaded(task, inputKey, medias)"
                              />
                            </div>
                          </div>

                          <!-- Input images -->
                          <div v-else-if="inputDef.type === 'images' || inputDef.type === 'image'" class="image-input-builder">
                            <div class="text-caption text-weight-medium q-mb-xs">{{ inputDef.label }}</div>
                            
                            <!-- Choix: Variable, Galerie ou Upload -->
                            <q-btn-toggle
                              :model-value="task[`imageInputMode_${inputKey}`] || 'variable'"
                              @update:model-value="(val) => { task[`imageInputMode_${inputKey}`] = val; console.log('Image input mode changed:', val, 'for input:', inputKey, 'task:', task.id); }"
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
                            <div v-if="!task[`imageInputMode_${inputKey}`] || task[`imageInputMode_${inputKey}`] === 'variable'">
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
                              
                              <!-- Aperçu des images référencées par la variable -->
                              <div v-if="task.input[inputKey] && typeof task.input[inputKey] === 'string' && getReferencedImages(task.input[inputKey]).length > 0" class="q-mt-sm">
                                <div class="text-caption text-grey-6 q-mb-xs">
                                  Images référencées ({{ getReferencedImages(task.input[inputKey]).length }}) :
                                </div>
                                <div class="row q-col-gutter-xs">
                                  <div v-for="image in getReferencedImages(task.input[inputKey]).slice(0, 4)" :key="image.id" class="col-auto">
                                    <q-img
                                      :src="image.url"
                                      width="40px"
                                      height="40px"
                                      fit="cover"
                                      class="rounded-borders shadow-2"
                                    >
                                      <q-tooltip>{{ image.name || 'Image' }}</q-tooltip>
                                    </q-img>
                                  </div>
                                  <div v-if="getReferencedImages(task.input[inputKey]).length > 4" class="col-auto flex flex-center">
                                    <div class="text-caption text-grey-6">+{{ getReferencedImages(task.input[inputKey]).length - 4 }}</div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <!-- Mode Galerie -->
                            <div v-else-if="task[`imageInputMode_${inputKey}`] === 'gallery'">
                              <MediaSelector
                                v-model="task[`mediaIds_${inputKey}`]"
                                :label="inputDef.label"
                                :placeholder="inputDef.type === 'images' ? 'Sélectionner des images depuis la galerie...' : 'Sélectionner une image depuis la galerie...'"
                                :multiple="inputDef.type === 'images'"
                                :accept="['image']"
                                @selected="(medias) => onTaskMediaSelected(task, inputKey, medias)"
                                @uploaded="(medias) => onTaskMediaUploaded(task, inputKey, medias)"
                              />
                              
                              <!-- Info des médias sélectionnés -->
                              <div v-if="task[`mediaIds_${inputKey}`] && getSelectedMediasInfo(task[`mediaIds_${inputKey}`]).length" class="q-mt-xs">
                                <div class="text-caption text-grey-6 q-mb-xs">
                                  {{ getSelectedMediasInfo(task[`mediaIds_${inputKey}`]).length }} média(s) sélectionné(s) :
                                </div>
                                <div class="row q-col-gutter-xs">
                                  <div v-for="media in getSelectedMediasInfo(task[`mediaIds_${inputKey}`])" :key="media.id" class="col-auto">
                                    <q-chip 
                                      dense 
                                      color="primary" 
                                      text-color="white"
                                      :label="media.originalName || media.filename"
                                      removable
                                      @remove="removeTaskMediaId(task, inputKey, media.id)"
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>

                            <!-- Mode Upload -->
                            <div v-else-if="task[`imageInputMode_${inputKey}`] === 'upload'">
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
                          
                          <!-- MediaSelector avec fallback -->
                          <template v-if="true">
                            <MediaSelector
                              v-model="task.selectedMediaIds"
                              :label="task.input.multiple !== false ? 'Sélectionner des images' : 'Sélectionner une image'"
                              :accept="['image']"
                              :multiple="task.input.multiple !== false"
                              :hide-preview="true"
                              @update:model-value="(mediaIds) => handleTaskMediaSelection(task, mediaIds)"
                            />
                          </template>
                          
                          <!-- Fallback avec q-file en cas d'erreur -->
                          <template v-else>
                            <q-file
                              v-model="task.uploadedFiles"
                              :multiple="task.input.multiple !== false"
                              accept="image/*"
                              dense
                              filled
                              bg-color="white"
                              @update:model-value="(files) => handleTaskImageUpload(task, 'uploadedImages', files)"
                              label="Sélectionner des images (fallback)"
                            >
                              <template v-slot:prepend>
                                <q-icon name="attach_file" />
                              </template>
                            </q-file>
                          </template>
                          
                          <!-- Aperçu des images sélectionnées -->
                          <div v-if="task.uploadedImagePreviews && task.uploadedImagePreviews.length > 0" class="q-mt-md">
                            <div class="text-caption text-grey-6 q-mb-sm">
                              {{ task.uploadedImagePreviews.length }} image{{ task.uploadedImagePreviews.length > 1 ? 's' : '' }} sélectionnée{{ task.uploadedImagePreviews.length > 1 ? 's' : '' }} :
                            </div>
                            
                            <q-list bordered separator class="rounded-borders">
                              <q-item 
                                v-for="(preview, pIdx) in task.uploadedImagePreviews" 
                                :key="pIdx"
                                class="image-list-item"
                              >
                                <q-item-section avatar>
                                  <q-avatar size="60px" class="image-thumbnail">
                                    <q-img 
                                      :src="preview.url" 
                                      fit="cover"
                                      class="rounded-borders"
                                    >
                                      <template v-slot:error>
                                        <div class="absolute-full flex flex-center bg-grey-3">
                                          <q-icon name="broken_image" color="grey-6" size="md" />
                                        </div>
                                      </template>
                                    </q-img>
                                  </q-avatar>
                                </q-item-section>

                                <q-item-section>
                                  <q-item-label class="text-weight-medium">{{ preview.name }}</q-item-label>
                                  <q-item-label caption>
                                    <q-icon name="image" size="xs" class="q-mr-xs" />
                                    Image {{ pIdx + 1 }}
                                  </q-item-label>
                                </q-item-section>

                                <q-item-section side>
                                  <div class="row items-center no-wrap">
                                    <!-- Bouton aperçu -->
                                    <q-btn
                                      flat
                                      round
                                      dense
                                      icon="visibility"
                                      color="primary"
                                      size="sm"
                                      @click="showImagePreview(preview.url, preview.name)"
                                      class="q-mr-xs"
                                    >
                                      <q-tooltip>Aperçu</q-tooltip>
                                    </q-btn>
                                    
                                    <!-- Bouton suppression -->
                                    <q-btn
                                      flat
                                      round
                                      dense
                                      icon="delete"
                                      color="negative"
                                      size="sm"
                                      @click="removeTaskImage(task, pIdx)"
                                    >
                                      <q-tooltip>Supprimer</q-tooltip>
                                    </q-btn>
                                  </div>
                                </q-item-section>
                              </q-item>
                            </q-list>
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
                        {{ getWorkflowTaskCount(workflow) }} tâche{{ getWorkflowTaskCount(workflow) > 1 ? 's' : '' }}
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
                          @click="loadWorkflowInBuilder(workflow)"
                        >
                          <q-tooltip>Charger et modifier</q-tooltip>
                        </q-btn>
                        
                        <!-- Gérer -->
                        <q-btn
                          flat
                          dense
                          round
                          icon="settings"
                          color="info"
                          size="xs"
                          @click="showSavedWorkflowManager = true"
                        >
                          <q-tooltip>Gérer tous les workflows</q-tooltip>
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
            
            <!-- Frame extraite de vidéo -->
            <div v-else-if="taskResult.type === 'video_extract_frame' && taskResult.outputs?.image_url" class="q-mb-sm">
              <div class="text-caption text-grey-6 q-mb-xs">Frame extraite :</div>
              
              <!-- Affichage des infos de la frame -->
              <div v-if="taskResult.outputs.frame_info" class="q-mb-xs">
                <q-chip size="sm" color="primary" text-color="white">
                  Type: {{ taskResult.outputs.frame_info.type }}
                </q-chip>
                <q-chip 
                  size="sm" 
                  color="grey-6" 
                  text-color="white"
                  class="q-ml-xs"
                >
                  Timestamp: {{ taskResult.outputs.frame_info.timeCode || taskResult.outputs.frame_info.timestamp }}
                </q-chip>
                <q-chip 
                  v-if="taskResult.outputs.frame_info.format"
                  size="sm" 
                  color="grey-6" 
                  text-color="white"
                  class="q-ml-xs"
                >
                  Format: {{ taskResult.outputs.frame_info.format }}
                </q-chip>
              </div>
              
              <q-img
                :src="taskResult.outputs.image_url"
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
                @click="downloadImage(taskResult.outputs.image_url)"
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
                  <div class="image-container">
                    <q-img
                      :src="imgUrl"
                      style="max-height: 300px; cursor: pointer"
                      class="rounded-borders result-image"
                      fit="contain"
                      @click="openImageModal(imgUrl, `Image éditée ${imgIdx + 1}`)"
                    >
                      <template v-slot:error>
                        <div class="absolute-full flex flex-center bg-negative text-white">
                          Erreur de chargement
                        </div>
                      </template>
                      
                      <!-- Overlay d'indication au survol -->
                      <div class="image-overlay" style="pointer-events: none;">
                        <q-icon name="zoom_in" size="1.5rem" color="white" />
                        <div class="text-white q-ml-sm text-caption">Cliquer pour agrandir</div>
                      </div>
                    </q-img>
                    
                    <!-- Boutons flottants -->
                    <div class="image-actions">
                      <q-btn
                        round
                        color="primary"
                        icon="download"
                        size="sm"
                        @click.stop="downloadImageDirectly(imgUrl, `image-editee-${imgIdx + 1}`)"
                        class="q-mr-xs"
                      >
                        <q-tooltip>Télécharger l'image</q-tooltip>
                      </q-btn>
                      
                      <q-btn
                        round
                        color="secondary"
                        icon="zoom_in"
                        size="sm"
                        @click.stop="openImageModal(imgUrl, `Image éditée ${imgIdx + 1}`)"
                      >
                        <q-tooltip>Voir en grand</q-tooltip>
                      </q-btn>
                    </div>
                  </div>
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
            <div v-if="taskResult.outputs?.video || taskResult.outputs?.video_url" class="q-mb-sm">
              <div class="text-caption text-grey-6 q-mb-xs">Vidéo générée :</div>
              
              <!-- Affichage des infos de concaténation si disponibles -->
              <div v-if="taskResult.outputs.concat_info" class="q-mb-xs">
                <q-chip size="sm" color="deep-purple" text-color="white">
                  {{ taskResult.outputs.concat_info.input_count }} vidéos
                </q-chip>
                <q-chip 
                  size="sm" 
                  color="grey-6" 
                  text-color="white"
                  class="q-ml-xs"
                >
                  Durée: {{ taskResult.outputs.concat_info.total_duration.toFixed(1) }}s
                </q-chip>
                <q-chip 
                  v-if="taskResult.outputs.concat_info.resolution"
                  size="sm" 
                  color="grey-6" 
                  text-color="white"
                  class="q-ml-xs"
                >
                  {{ taskResult.outputs.concat_info.resolution }}
                </q-chip>
              </div>
              
              <video controls style="max-width: 100%; max-height: 400px" class="rounded-borders">
                <source :src="taskResult.outputs.video || taskResult.outputs.video_url" type="video/mp4">
              </video>
              <q-btn
                flat
                dense
                color="primary"
                icon="download"
                label="Télécharger"
                @click="downloadVideo(taskResult.outputs.video || taskResult.outputs.video_url)"
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

  <!-- Modal de preview d'image -->
  <q-dialog 
    v-model="showImagePreviewModal" 
    maximized
    @keyup.escape="showImagePreviewModal = false"
  >
    <q-card class="column no-wrap" style="height: 100vh;">
      <!-- Header avec titre et bouton fermer -->
      <q-card-section class="row items-center no-wrap bg-primary text-white q-pa-md">
        <q-avatar icon="image" color="white" text-color="primary" />
        <div class="text-h6 q-ml-sm text-truncate">{{ previewImage.name }}</div>
        <q-space />
        <q-btn
          icon="fullscreen_exit"
          flat
          round
          dense
          @click="showImagePreviewModal = false"
          class="q-mr-xs"
        >
          <q-tooltip>Fermer (Échap)</q-tooltip>
        </q-btn>
      </q-card-section>

      <!-- Zone d'affichage de l'image -->
      <q-card-section class="col flex flex-center bg-grey-1 q-pa-md">
        <q-img
          :src="previewImage.url"
          :alt="previewImage.name"
          fit="contain"
          style="max-width: 100%; max-height: calc(100vh - 120px);"
          class="shadow-2"
        >
          <template v-slot:loading>
            <div class="absolute-full flex flex-center bg-grey-2">
              <q-spinner-dots color="primary" size="2rem" />
            </div>
          </template>
          <template v-slot:error>
            <div class="absolute-full flex flex-center bg-grey-3">
              <div class="text-center">
                <q-icon name="broken_image" color="grey-6" size="4rem" />
                <div class="text-grey-6 q-mt-sm">Impossible de charger l'image</div>
                <div class="text-caption q-mt-xs">URL: {{ previewImage.url }}</div>
              </div>
            </div>
          </template>
        </q-img>

        <!-- Actions en bas à droite -->
        <div class="absolute-bottom-right q-ma-md">
          <q-btn
            round
            color="white"
            text-color="dark"
            icon="open_in_new"
            size="sm"
            @click="openImageInNewTab"
            class="shadow-4"
          >
            <q-tooltip>Ouvrir dans un nouvel onglet</q-tooltip>
          </q-btn>
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>

  <!-- Gestionnaire de workflows sauvegardés -->
  <SavedWorkflowManager 
    v-model="showSavedWorkflowManager"
    @workflow-loaded="loadWorkflowInBuilder"
  />

  <!-- Gestionnaire de templates -->
  <TemplateManager 
    v-model="showTemplateManager"
    @template-loaded="onTemplateLoaded"
  />

  <!-- Gestionnaire de collections -->
  <CollectionManager 
    v-model="showCollectionManager"
    @collection-changed="onCollectionChanged"
  />

  <!-- Modal de visualisation d'image en grand -->
  <q-dialog v-model="showImageModal" maximized>
    <q-card class="bg-black text-white">
      <!-- Header du modal -->
      <q-card-section class="row items-center q-pa-md bg-grey-9">
        <div class="text-h6">{{ modalImageTitle }}</div>
        <q-space />
        
        <!-- Boutons d'actions -->
        <q-btn
          flat
          color="white"
          icon="download"
          label="Télécharger"
          @click="downloadImageDirectly(modalImageUrl, modalImageTitle.toLowerCase().replace(/[^a-z0-9]/g, '-'))"
          class="q-mr-sm"
        />
        
        <q-btn
          flat
          color="white"
          icon="close"
          label="Fermer"
          @click="closeImageModal"
        />
      </q-card-section>
      
      <!-- Image en plein écran -->
      <q-card-section class="flex flex-center q-pa-none" style="height: calc(100vh - 80px)">
        <q-img
          :src="modalImageUrl"
          fit="contain"
          style="max-width: 100%; max-height: 100%"
          spinner-color="white"
        >
          <template v-slot:error>
            <div class="absolute-full flex flex-center bg-grey-8">
              <q-icon name="broken_image" size="4rem" color="grey-4" />
              <div class="text-grey-4 q-ml-md">Erreur de chargement</div>
            </div>
          </template>
        </q-img>
      </q-card-section>
    </q-card>
  </q-dialog>
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
import SavedWorkflowManager from './workflow/SavedWorkflowManager.vue'
import TemplateManager from './TemplateManager.vue'
import CollectionManager from './CollectionManager.vue'

const workflowStore = useWorkflowStore()
const mediaStore = useMediaStore()
const $q = useQuasar()

// État local
const showWorkflowDetails = ref(false)
const imageFiles = ref(null)
const uploadedImages = ref([])

// Variables pour le modal d'image
const showImageModal = ref(false)
const modalImageUrl = ref('')
const modalImageTitle = ref('')

// Variables pour les templates
const showTemplateManager = ref(false)

// Variables pour les collections
const showCollectionManager = ref(false)
const currentCollection = ref(null)

// État du Builder
const builderMode = ref(true) // Démarrer directement en mode Builder
const customWorkflow = ref({
  id: 'custom-workflow',
  name: 'Workflow personnalisé',
  description: 'Workflow créé avec le builder',
  tasks: []
})

// État du gestionnaire de workflows
const showSavedWorkflowManager = ref(false)

// État du modal de preview d'image
const showImagePreviewModal = ref(false)
const previewImage = ref({
  url: '',
  name: ''
})

// Tâches disponibles pour le Builder
const availableTasks = computed(() => TASK_DEFINITIONS)

// Helper functions
function getWorkflowTaskCount(workflow) {
  // Pour workflows du builder (avec tasks directement)
  if (workflow.tasks && Array.isArray(workflow.tasks)) {
    return workflow.tasks.length
  }
  
  // Pour workflows du store (avec workflow.tasks)
  if (workflow.workflow?.tasks && Array.isArray(workflow.workflow.tasks)) {
    return workflow.workflow.tasks.length
  }
  
  // Pour workflows du store (avec workflow direct)
  if (workflow.workflow && Array.isArray(workflow.workflow)) {
    return workflow.workflow.length
  }
  
  return 0
}

// Computed depuis le store
const currentWorkflow = computed(() => workflowStore.currentWorkflow)
const workflowInputs = computed(() => currentWorkflow.value?.inputs || {})
const inputValues = computed(() => currentWorkflow.value?.inputValues || {})
const workflowTemplates = computed(() => workflowStore.workflowTemplates)
const savedWorkflows = computed(() => workflowStore.savedWorkflows)
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
  
  // Initialiser les propriétés pour l'upload d'images et sélection média
  newTask.uploadedImagePreviews = []
  newTask.selectedMediaIds = []
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
 * Affiche l'aperçu d'une image dans un modal
 */
function showImagePreview(imageUrl, imageName) {
  console.log('showImagePreview appelé avec:', { imageUrl, imageName })
  previewImage.value = {
    url: imageUrl,
    name: imageName || 'Image'
  }
  console.log('previewImage défini:', previewImage.value)
  showImagePreviewModal.value = true
}

/**
 * Ouvre l'image dans un nouvel onglet
 */
function openImageInNewTab() {
  if (previewImage.value.url) {
    window.open(previewImage.value.url, '_blank')
  }
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
 * Résout un média par son ID (UUID ou collection legacy)
 */
async function resolveMedia(mediaId) {
  // Essayer d'abord le mediaStore
  let media = mediaStore.getMedia(mediaId)
  
  // Si pas trouvé dans mediaStore, chercher dans les collections par UUID
  if (!media) {
    console.log('🔄 Recherche dans les collections:', mediaId)
    
    try {
      const response = await api.get('/collections/current/gallery')
      if (response.data.success) {
        // Chercher l'image par son UUID dans la collection
        const img = response.data.images.find(image => {
          // Extraire l'UUID depuis l'URL si mediaId est fourni
          if (image.mediaId === mediaId) {
            return true
          }
          
          // Fallback: extraire UUID depuis l'URL
          if (image.url) {
            const urlMatch = image.url.match(/\/medias\/([^\/]+)$/)
            if (urlMatch) {
              const filename = urlMatch[1]
              const imageId = filename.replace(/\.[^.]+$/, '')
              return imageId === mediaId
            }
          }
          
          return false
        })
        
        if (img) {
          // Extraire le nom de fichier depuis l'URL
          const urlMatch = img.url.match(/\/medias\/([^\/]+)$/)
          const filename = urlMatch ? urlMatch[1] : `${mediaId}.jpg`
          
          // Créer un objet média temporaire
          media = {
            id: mediaId,
            url: img.url,
            type: 'image',
            filename: filename,
            originalName: img.description || filename,
            size: 0
          }
          console.log('📚 Média collection trouvé:', media.url)
        }
      }
    } catch (error) {
      console.error('❌ Erreur recherche collection:', error)
    }
  }
  
  // Fallback pour les anciennes images de collection sans UUID
  if (!media && mediaId.startsWith('collection_')) {
    console.log('🔄 Fallback: recherche image collection legacy:', mediaId)
    
    try {
      const response = await api.get('/collections/current/gallery')
      if (response.data.success) {
        const indexMatch = mediaId.match(/collection_(\d+)/)
        if (indexMatch) {
          const index = parseInt(indexMatch[1])
          const img = response.data.images[index]
          
          if (img) {
            // Créer un objet média temporaire
            media = {
              id: mediaId,
              url: img.url,
              type: 'image',
              filename: img.description || `image_${index}.jpg`,
              originalName: img.description || `Image ${index + 1}`,
              size: 0
            }
            console.log('📚 Média collection legacy trouvé:', media.url)
          }
        }
      }
    } catch (error) {
      console.error('❌ Erreur fallback collection:', error)
    }
  }
  
  return media
}

/**
 * Gère la sélection de médias depuis la galerie pour une tâche
 */
async function handleTaskMediaSelection(task, mediaIds) {
  console.log('📂 Sélection de médias pour tâche:', task.id, mediaIds);
  
  // Normaliser mediaIds en array
  let mediaIdsArray = []
  if (mediaIds) {
    if (typeof mediaIds === 'string') {
      mediaIdsArray = [mediaIds]
    } else if (Array.isArray(mediaIds)) {
      mediaIdsArray = mediaIds
    }
  }
  
  if (!mediaIdsArray || mediaIdsArray.length === 0) {
    // Réinitialiser si aucune sélection
    task.selectedMediaIds = []
    task.uploadedImagePreviews = []
    
    const taskDef = getTaskDefinition(task.type)
    const inputKey = Object.keys(taskDef.inputs).find(
      key => taskDef.inputs[key].type === 'images' || 
             taskDef.inputs[key].type === 'image'
    )
    
    if (inputKey) {
      task.input[inputKey] = taskDef.inputs[inputKey].type === 'image' ? null : []
    }
    return
  }
  
  // Initialiser les propriétés si nécessaire
  if (!task.uploadedImagePreviews) {
    task.uploadedImagePreviews = []
  }
  
  try {
    // Réinitialiser les aperçus
    task.uploadedImagePreviews = []
    
    // Convertir chaque média en fichier (utilisation des UUIDs)
    for (const mediaId of mediaIdsArray) {
      console.log('🔍 Recherche média:', mediaId)
      
      const media = await resolveMedia(mediaId)
      console.log('� Trouvé dans mediaStore:', !!media, media?.url)
      
      if (!media) {
        console.warn('❌ Média non trouvé:', mediaId)
        continue
      }
      
      try {
        // Créer un fichier à partir de l'URL du média
        const response = await fetch(media.url)
        const blob = await response.blob()
        const file = new File([blob], media.filename, { type: media.type })
        
        // Ajouter à l'aperçu avec le mediaId
        task.uploadedImagePreviews.push({
          file,
          url: media.url, // Utiliser l'URL du média directement
          name: media.filename,
          mediaId: mediaId // Important : stocker l'ID du média
        })
        
      } catch (error) {
        console.error('Erreur conversion média:', mediaId, error)
        // Fallback: utiliser l'URL directement
        task.uploadedImagePreviews.push({
          file: null,
          url: media.url,
          name: media.filename,
          mediaId: mediaId
        })
      }
    }
    
    // Stocker dans l'input de la tâche
    const taskDef = getTaskDefinition(task.type)
    const inputKey = Object.keys(taskDef.inputs).find(
      key => taskDef.inputs[key].type === 'images' || 
             taskDef.inputs[key].type === 'image'
    )
    
    if (inputKey) {
      const inputDef = taskDef.inputs[inputKey]
      const files = task.uploadedImagePreviews.map(p => p.file).filter(f => f !== null)
      
      if (inputDef.type === 'image') {
        // Pour un input de type 'image' (singulier)
        task.input[inputKey] = files[0] || null
      } else {
        // Pour un input de type 'images' (pluriel)
        task.input[inputKey] = files
      }
    }
    
    console.log(`✅ ${task.uploadedImagePreviews.length} image(s) sélectionnée(s) depuis la galerie pour ${task.id}`)
    
  } catch (error) {
    console.error('Erreur lors de la sélection des médias:', error)
    $q.notify({
      type: 'negative',
      message: 'Erreur lors de la sélection des images',
      position: 'top'
    })
  }
}
function onTaskMediaSelected(task, inputKey, medias) {
  console.log(`📸 Médias sélectionnés depuis la galerie pour ${task.id}.${inputKey}:`, medias)
  
  const taskDef = getTaskDefinition(task.type)
  const inputDef = taskDef.inputs[inputKey]
  
  if (inputDef.type === 'image' || inputDef.type === 'video') {
    // Pour un input de type 'image' ou 'video' (singulier)
    const mediaId = medias.length > 0 ? medias[0].id : null
    task[`mediaIds_${inputKey}`] = mediaId
    task.input[inputKey] = mediaId
  } else {
    // Pour un input de type 'images' (pluriel)
    const mediaIds = medias.map(media => media.id)
    task[`mediaIds_${inputKey}`] = mediaIds
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
 * Obtient les images référencées par une variable
 */
function getReferencedImages(variableString) {
  if (!variableString || typeof variableString !== 'string') return []
  
  // Matcher des variables comme {{input1.images}}, {{task2.images}}, etc.
  const variableMatch = variableString.match(/\{\{(\w+)\.images?\}\}/)
  if (!variableMatch) return []
  
  const taskId = variableMatch[1]
  
  // Chercher la tâche référencée dans le workflow
  const referencedTask = customWorkflow.value.tasks.find(t => t.id === taskId)
  if (!referencedTask) return []
  
  // Obtenir les images de cette tâche
  if (referencedTask.uploadedImagePreviews && referencedTask.uploadedImagePreviews.length > 0) {
    return referencedTask.uploadedImagePreviews.map(preview => ({
      id: preview.mediaId || `preview_${Date.now()}`,
      url: preview.url,
      name: preview.name
    }))
  }
  
  // Fallback : chercher dans mediaIds
  if (referencedTask.mediaIds) {
    const ids = Array.isArray(referencedTask.mediaIds) ? referencedTask.mediaIds : [referencedTask.mediaIds]
    return ids.map(id => mediaStore.getMedia(id)).filter(Boolean)
  }
  
  return []
}

/**
 * Supprime un ID de média d'une tâche pour un input spécifique
 */
function removeTaskMediaId(task, inputKey, mediaIdToRemove) {
  const mediaIds = task[`mediaIds_${inputKey}`]
  
  if (Array.isArray(mediaIds)) {
    task[`mediaIds_${inputKey}`] = mediaIds.filter(id => id !== mediaIdToRemove)
    task.input[inputKey] = task[`mediaIds_${inputKey}`]
  } else if (mediaIds === mediaIdToRemove) {
    task[`mediaIds_${inputKey}`] = null
    task.input[inputKey] = null
  }
}

/**
 * Sauvegarde le workflow personnalisé dans localStorage
```
 */
function openSaveDialog() {
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
    if (!name.trim()) return
    
    try {
      // Sauvegarder via le store unifié
      const saved = workflowStore.saveWorkflow(
        name.trim(),
        customWorkflow.value.description || `Workflow personnalisé créé le ${new Date().toLocaleDateString()}`,
        customWorkflow.value
      )
      
      if (saved) {
        $q.notify({
          type: 'positive',
          message: `Workflow "${name}" sauvegardé !`,
          position: 'top'
        })
      }
    } catch (e) {
      $q.notify({
        type: 'negative',
        message: 'Erreur lors de la sauvegarde',
        position: 'top'
      })
    }
  })
}

/**
 * Charge un workflow sauvegardé dans le builder
 */
function loadWorkflowInBuilder(workflow) {
  console.log('🔄 Chargement workflow dans builder:', workflow)
  
  // Si c'est un workflow de builder (avec tasks), on le charge directement
  if (workflow.tasks) {
    console.log('📝 Workflow avec tasks détecté:', workflow.tasks.length, 'tâches')
    customWorkflow.value = JSON.parse(JSON.stringify(workflow))
  } else {
    // Sinon, c'est un workflow du store, on le convertit
    console.log('🏪 Workflow du store détecté, conversion...')
    console.log('Structure workflow:', workflow.workflow)
    
    const tasks = workflow.workflow?.tasks || workflow.workflow || []
    customWorkflow.value = {
      id: workflow.id || 'loaded-workflow',
      name: workflow.name,
      description: workflow.description,
      tasks: Array.isArray(tasks) ? tasks : []
    }
    console.log('✅ Workflow converti:', customWorkflow.value.tasks.length, 'tâches')
  }
  
  $q.notify({
    type: 'info',
    message: `Workflow "${workflow.name}" chargé dans le builder (${customWorkflow.value.tasks.length} tâches)`,
    position: 'top',
    timeout: 2000
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
        const isVariable = typeof value === 'string' && value.includes('{{') && value.includes('}}')
        
        console.log(`🔍 Input ${task.id}.${key}:`, {
          type: typeof value,
          isArray: Array.isArray(value),
          isFile: value instanceof File,
          isMediaId: typeof value === 'string' && value.length === 36,
          isVariable: isVariable,
          value: value
        })
        
        // Ignorer les variables - elles seront résolues côté API
        if (isVariable) {
          console.log(`🔗 Variable détectée: ${task.id}.${key} = ${value} (pas d'upload nécessaire)`)
          return // Passer à l'input suivant
        }
        
        // Nouveau: Gérer les IDs de médias de la galerie ET les fichiers uploadés
        if (Array.isArray(value) && value.length > 0) {
          // Vérifier si c'est un array de fichiers ou d'IDs de médias
          if (value[0] instanceof File) {
            // Array de fichiers - vérifier s'ils ont déjà un mediaId
            console.log(`📁 Détecté array de fichiers: ${task.id}.${key}`, value.length)
            
            value.forEach(file => {
              // Vérifier si ce fichier vient de la galerie (a un mediaId)
              const preview = task.uploadedImagePreviews?.find(p => p.file === file)
              console.log(`🔍 Debug fichier ${file.name}:`, { 
                hasPreview: !!preview, 
                hasMediaId: preview?.mediaId,
                previewData: preview 
              })
              
              if (preview && preview.mediaId) {
                console.log(`🗂️ Fichier ${file.name} a déjà un mediaId: ${preview.mediaId}`)
                fileMapping.set(file, preview.mediaId)
              } else if (!fileMapping.has(file)) {
                console.log(`📤 Fichier ${file.name} sera uploadé`)
                filesToUpload.push(file)
                fileMapping.set(file, null) // Sera rempli après l'upload
              }
            })
          } else if (typeof value[0] === 'string' && value[0].length === 36) {
            // Array d'IDs de médias (UUID format) - déjà prêt, pas d'upload nécessaire
            console.log(`🗂️ Détecté array d'IDs de médias: ${task.id}.${key}`, value.length)
          }
        } else if (value instanceof File) {
          // Fichier unique - vérifier s'il a déjà un mediaId
          console.log(`📁 Détecté fichier unique: ${task.id}.${key}`, value.name)
          
          // Vérifier si ce fichier vient de la galerie (a un mediaId)
          const preview = task.uploadedImagePreviews?.find(p => p.file === value)
          if (preview && preview.mediaId) {
            console.log(`🗂️ Fichier ${value.name} a déjà un mediaId: ${preview.mediaId}`)
            fileMapping.set(value, preview.mediaId)
          } else if (!fileMapping.has(value)) {
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
  console.log('📋 Chargement template dans builder:', template)
  
  // Charger le template dans le builder
  customWorkflow.value = {
    id: template.id || 'template-workflow',
    name: template.name || 'Template chargé',
    description: template.description || 'Template chargé depuis la bibliothèque',
    tasks: JSON.parse(JSON.stringify(template.workflow?.tasks || template.tasks || []))
  }
  
  // Assurer le mode builder
  builderMode.value = true
  
  // Clear uploaded images
  uploadedImages.value = []
  
  $q.notify({
    type: 'positive',
    message: `Template "${template.name}" chargé dans le builder`,
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
onMounted(async () => {
  // Charger le premier template si aucun workflow n'est chargé
  if (!currentWorkflow.value) {
    loadTemplate(workflowTemplates.value[0])
  }
  
  // Charger la collection courante
  await loadCurrentCollection()
  
  // Les workflows sont maintenant gérés par le store unifié
})

// Fonctions pour le modal d'image
function openImageModal(imageUrl, title = 'Image') {
  modalImageUrl.value = imageUrl
  modalImageTitle.value = title
  showImageModal.value = true
}

function closeImageModal() {
  showImageModal.value = false
  modalImageUrl.value = ''
  modalImageTitle.value = ''
}

function downloadImageDirectly(imageUrl, filename = 'image') {
  if (!imageUrl) return
  
  $q.notify({
    type: 'info',
    message: 'Téléchargement en cours...',
    position: 'top',
    timeout: 2000,
  })

  // Télécharger l'image
  fetch(imageUrl)
    .then(response => {
      if (!response.ok) {
        throw new Error('Erreur lors du téléchargement')
      }
      return response.blob()
    })
    .then(blob => {
      const blobUrl = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = blobUrl
      
      // Générer un nom de fichier avec timestamp
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '')
      const finalFilename = `${filename}-${timestamp}.jpg`
      link.download = finalFilename
      
      document.body.appendChild(link)
      
      setTimeout(() => {
        link.click()
        
        setTimeout(() => {
          document.body.removeChild(link)
          URL.revokeObjectURL(blobUrl)
        }, 100)
      }, 0)
      
      $q.notify({
        type: 'positive',
        message: 'Image téléchargée !',
        position: 'top',
      })
    })
    .catch(error => {
      console.error('Erreur téléchargement:', error)
      $q.notify({
        type: 'negative',
        message: 'Erreur lors du téléchargement',
        position: 'top',
      })
    })
}

// Fonctions pour les templates
function createTemplateFromWorkflow() {
  if (!customWorkflow.value.tasks.length) {
    $q.notify({
      type: 'warning',
      message: 'Le workflow est vide',
      position: 'top'
    })
    return
  }
  
  $q.dialog({
    title: 'Créer un template',
    message: 'Nom du template :',
    prompt: {
      model: customWorkflow.value.name || 'Mon Template',
      type: 'text'
    },
    cancel: true
  }).onOk(async (templateName) => {
    if (!templateName.trim()) return
    
    try {
      const templateData = {
        name: templateName.trim(),
        description: `Template créé à partir du workflow "${customWorkflow.value.name || 'Sans nom'}"`,
        category: 'custom',
        icon: 'dashboard',
        workflow: JSON.parse(JSON.stringify(customWorkflow.value)), // Deep copy
        originalWorkflowId: customWorkflow.value.id
      }
      
      const response = await api.post('/templates', templateData)
      
      if (response.data.success) {
        $q.notify({
          type: 'positive',
          message: `Template "${templateName}" créé avec succès`,
          position: 'top'
        })
        
        // Proposer d'ouvrir le gestionnaire de templates
        $q.dialog({
          title: 'Template créé',
          message: `Le template "${templateName}" a été créé avec succès. Voulez-vous ouvrir le gestionnaire de templates ?`,
          cancel: true,
          ok: {
            label: 'Oui, ouvrir',
            color: 'primary'
          },
          cancel: {
            label: 'Plus tard',
            flat: true
          }
        }).onOk(() => {
          showTemplateManager.value = true
        })
      }
    } catch (error) {
      console.error('Erreur création template:', error)
      $q.notify({
        type: 'negative',
        message: 'Erreur lors de la création du template',
        position: 'top'
      })
    }
  })
}

function onTemplateLoaded(template) {
  // Charger le template dans le builder
  if (template.workflow) {
    customWorkflow.value = {
      id: `workflow_${Date.now()}`,
      name: `Nouveau workflow basé sur ${template.name}`,
      description: `Créé à partir du template: ${template.name}`,
      tasks: JSON.parse(JSON.stringify(template.workflow.tasks || [])) // Deep copy
    }
    
    console.log(`📋 Template "${template.name}" chargé dans le builder`)
  }
}

async function loadCurrentCollection() {
  try {
    const response = await api.get('/collections/current/info')
    
    if (response.data.success && response.data.currentCollection) {
      currentCollection.value = response.data.currentCollection
      console.log('📚 Collection courante chargée:', currentCollection.value.name)
    } else {
      currentCollection.value = null
    }
  } catch (error) {
    console.warn('⚠️ Impossible de charger la collection courante:', error.message)
    currentCollection.value = null
  }
}

function onCollectionChanged(collection) {
  console.log('📚 Collection courante changée:', collection.name)
  currentCollection.value = collection
}
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

    // Styles pour la nouvelle liste d'images
    .image-list-item {
      transition: background-color 0.2s;
      
      &:hover {
        background-color: rgba(0, 0, 0, 0.02);
      }
      
      .image-thumbnail {
        border: 2px solid #e0e0e0;
        transition: border-color 0.2s;
        
        &:hover {
          border-color: var(--q-primary);
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
  
  // Styles pour les boutons flottants sur les images
  .image-container {
    position: relative;
    display: block;
    width: 100%;
  }

  .image-actions {
    position: absolute;
    top: 10px;
    right: 10px;
    display: flex;
    z-index: 100;
    gap: 8px;
  }
  
  .result-image {
    position: relative;
    
    &:hover .image-overlay {
      opacity: 1;
      visibility: visible;
    }
  }

  .image-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: rgba(0, 0, 0, 0.5);
    opacity: 0;
    visibility: hidden;
    transition: all 0.3s ease-in-out;
    backdrop-filter: blur(2px);
  }
}
</style>
