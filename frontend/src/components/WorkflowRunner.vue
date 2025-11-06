<template>
  <div class="workflow-runner">
    <!-- HEADER -->
    <div class="row q-col-gutter-md q-mb-lg">
      <div class="col">
        <div class="text-h5 q-mb-sm">
          <q-icon name="account_tree" class="q-mr-sm" />
          Workflow Builder
        </div>
        <div class="text-body2 text-grey-7">
          Créez et exécutez vos workflows personnalisés
        </div>
      </div>
      
      <div class="col-auto">
        <!-- NAVIGATION PRINCIPALE -->
        <q-tabs v-model="mainTab" dense align="left" narrow-indicator class="text-primary">
          <q-tab name="builder" label="Builder" icon="build" />
          <q-tab name="templates" label="Templates" icon="description" />
          <q-tab name="workflows" label="Workflows" icon="account_tree" />
          <q-tab name="collections" label="Collections" icon="collections" />
        </q-tabs>
      </div>
    </div>

    <!-- CONTENU PRINCIPAL -->
    <q-tab-panels v-model="mainTab" animated>
      <!-- PANEL BUILDER -->
      <q-tab-panel name="builder" class="q-pa-none">
        <div class="row q-col-gutter-lg">
          <div class="col-9">
            <!-- MODE BUILDER -->
        <template v-if="mainTab === 'builder'">
          <div class="workflow-builder">
            <q-tabs v-model="currentTab" dense align="left" narrow-indicator class="q-mb-md">
              <q-tab name="inputs" :label="getSectionTitle('inputs')" :icon="getSectionIcon('inputs')" />
              <q-tab name="tasks" :label="getSectionTitle('tasks')" :icon="getSectionIcon('tasks')" />
              <q-tab name="outputs" :label="getSectionTitle('outputs')" :icon="getSectionIcon('outputs')" />
            </q-tabs>

            <q-tab-panels v-model="currentTab" animated>
              <!-- PANEL INPUTS -->
              <q-tab-panel name="inputs" class="q-pa-md">
                <div class="text-h6 q-mb-md">
                  <q-icon name="input" class="q-mr-sm" />
                  Données d'entrée
                </div>

                <div class="text-body2 text-grey-7 q-mb-lg">
                  Configurez les tâches qui vont collecter les données d'entrée pour votre workflow.
                </div>

                <draggable
                  v-model="currentWorkflow.inputs"
                  group="workflow-inputs"
                  @change="onInputsChange"
                  class="inputs-container"
                  :item-key="(item, index) => `input-${item.id}-${index}`"
                >
                  <template #item="{ element: task, index: idx }">
                    <q-card flat bordered class="task-card q-mb-md">
                      <q-card-section class="q-pb-none">
                        <div class="row items-center q-mb-sm">
                          <q-icon
                            :name="getTaskDefinition(task.type)?.icon || 'help'"
                            :color="getTaskDefinition(task.type)?.color || 'grey'"
                            size="sm"
                            class="q-mr-sm"
                          />
                          <div class="text-subtitle2 text-weight-medium">
                            {{ getTaskDefinition(task.type)?.title || task.type }}
                          </div>
                        </div>

                        <div class="text-caption text-grey-7 q-mb-md">
                          {{ getTaskDefinition(task.type)?.description }}
                        </div>
                      </q-card-section>

                      <q-card-section class="q-pt-none">
                        <div v-for="(inputDef, inputKey) in getBasicInputs(task.type)" :key="inputKey" class="q-mb-md">
                          <q-input
                            :model-value="task.input[inputKey]"
                            @update:model-value="(val) => updateTaskInput(task.id, inputKey, val)"
                            :label="inputDef.label"
                            :placeholder="inputDef.placeholder || inputDef.hint || ''"
                            dense
                            filled
                            bg-color="white"
                            :hint="inputDef.hint"
                          />
                        </div>

                        <div class="q-mt-lg text-right">
                          <q-btn
                            flat
                            dense
                            icon="keyboard_arrow_up"
                            @click="moveInputTaskUp(idx)"
                            color="primary"
                            class="q-mr-sm"
                            :disable="idx === 0"
                          >
                            <q-tooltip>Monter</q-tooltip>
                          </q-btn>
                          <q-btn
                            flat
                            dense
                            icon="keyboard_arrow_down"
                            @click="moveInputTaskDown(idx)"
                            color="primary"
                            class="q-mr-sm"
                            :disable="idx === currentWorkflow.inputs.length - 1"
                          >
                            <q-tooltip>Descendre</q-tooltip>
                          </q-btn>
                          <q-btn
                            flat
                            dense
                            icon="content_copy"
                            @click="duplicateTask(task, idx)"
                            color="primary"
                            class="q-mr-sm"
                          >
                            <q-tooltip>Dupliquer</q-tooltip>
                          </q-btn>
                          <q-btn
                            flat
                            dense
                            icon="delete"
                            @click="removeInputTask(idx)"
                            color="negative"
                          >
                            <q-tooltip>Supprimer</q-tooltip>
                          </q-btn>
                        </div>
                      </q-card-section>
                    </q-card>
                  </template>
                </draggable>

                <div class="text-center q-mt-md">
                  <q-btn
                    color="primary"
                    icon="add"
                    label="Ajouter une entrée"
                    @click="addInputTask"
                    unelevated
                  />
                </div>
              </q-tab-panel>

              <!-- PANEL TASKS -->
              <q-tab-panel name="tasks" class="q-pa-md">
                <div class="text-h6 q-mb-md">
                  <q-icon name="settings" class="q-mr-sm" />
                  Tâches de traitement
                </div>

                <div class="text-body2 text-grey-7 q-mb-lg">
                  Configurez les tâches qui vont traiter les données de votre workflow.
                </div>

                <draggable
                  v-model="currentWorkflow.tasks"
                  group="workflow-tasks"
                  @change="onTasksChange"
                  class="tasks-container"
                  :item-key="(item, index) => `task-${item.id}-${index}`"
                >
                  <template #item="{ element: task, index: idx }">
                    <q-card flat bordered class="task-card q-mb-md">
                      <q-card-section class="q-pb-none">
                        <div class="row items-center q-mb-sm">
                          <q-icon
                            :name="getTaskDefinition(task.type)?.icon || 'help'"
                            :color="getTaskDefinition(task.type)?.color || 'grey'"
                            size="sm"
                            class="q-mr-sm"
                          />
                          <div class="text-subtitle2 text-weight-medium">
                            {{ getTaskDefinition(task.type)?.title || task.type }}
                          </div>
                        </div>

                        <div class="text-caption text-grey-7 q-mb-md">
                          {{ getTaskDefinition(task.type)?.description }}
                        </div>
                      </q-card-section>

                      <q-card-section class="q-pt-none">
                        <div v-for="(inputDef, inputKey) in getBasicInputs(task.type)" :key="inputKey" class="q-mb-md">
                          <div class="text-caption text-weight-medium q-mb-xs">
                            {{ inputDef.label }}
                            <q-tooltip v-if="inputDef.hint">{{ inputDef.hint }}</q-tooltip>
                          </div>

                          <q-input
                            :model-value="task.input[inputKey]"
                            @update:model-value="(val) => updateTaskInput(task.id, inputKey, val)"
                            :label="inputDef.label"
                            :placeholder="inputDef.placeholder || inputDef.hint || ''"
                            dense
                            filled
                            bg-color="white"
                            :hint="inputDef.hint"
                          >
                            <template v-slot:prepend>
                              <q-btn
                                dense
                                flat
                                icon="code"
                                color="primary"
                                @click="showVariableSelector(task.id, inputKey, idx)"
                                size="sm"
                              />
                            </template>
                          </q-input>
                        </div>

                        <div class="q-mt-lg text-right">
                          <q-btn
                            flat
                            dense
                            icon="keyboard_arrow_up"
                            @click="moveTaskUp(idx)"
                            color="primary"
                            class="q-mr-sm"
                            :disable="idx === 0"
                          >
                            <q-tooltip>Monter</q-tooltip>
                          </q-btn>
                          <q-btn
                            flat
                            dense
                            icon="keyboard_arrow_down"
                            @click="moveTaskDown(idx)"
                            color="primary"
                            class="q-mr-sm"
                            :disable="idx === currentWorkflow.tasks.length - 1"
                          >
                            <q-tooltip>Descendre</q-tooltip>
                          </q-btn>
                          <q-btn
                            flat
                            dense
                            icon="content_copy"
                            @click="duplicateTask(task, idx)"
                            color="primary"
                            class="q-mr-sm"
                          >
                            <q-tooltip>Dupliquer</q-tooltip>
                          </q-btn>
                          <q-btn
                            flat
                            dense
                            icon="delete"
                            @click="removeTask(idx)"
                            color="negative"
                          >
                            <q-tooltip>Supprimer</q-tooltip>
                          </q-btn>
                        </div>
                      </q-card-section>
                    </q-card>
                  </template>
                </draggable>

                <div class="text-center q-mt-md">
                  <q-btn
                    color="primary"
                    icon="add"
                    label="Ajouter une tâche"
                    @click="addTask"
                    unelevated
                  />
                </div>
              </q-tab-panel>

              <!-- PANEL OUTPUTS -->
              <q-tab-panel name="outputs" class="q-pa-md">
                <div class="text-h6 q-mb-md">
                  <q-icon name="output" class="q-mr-sm" />
                  Données de sortie
                </div>

                <div class="text-body2 text-grey-7 q-mb-lg">
                  Configurez les tâches qui vont traiter et afficher les résultats de votre workflow.
                </div>

                <draggable
                  v-model="currentWorkflow.outputs"
                  group="workflow-outputs"
                  @change="onOutputsChange"
                  class="outputs-container"
                  :item-key="(item, index) => `output-${item.id}-${index}`"
                >
                  <template #item="{ element: task, index: idx }">
                    <q-card flat bordered class="task-card q-mb-md">
                      <q-card-section class="q-pb-none">
                        <div class="row items-center q-mb-sm">
                          <q-icon
                            :name="getTaskDefinition(task.type)?.icon || 'help'"
                            :color="getTaskDefinition(task.type)?.color || 'grey'"
                            size="sm"
                            class="q-mr-sm"
                          />
                          <div class="text-subtitle2 text-weight-medium">
                            {{ getTaskDefinition(task.type)?.title || task.type }}
                          </div>
                        </div>

                        <div class="text-caption text-grey-7 q-mb-md">
                          {{ getTaskDefinition(task.type)?.description }}
                        </div>
                      </q-card-section>

                      <q-card-section class="q-pt-none">
                        <div v-for="(inputDef, inputKey) in getBasicInputs(task.type)" :key="inputKey" class="q-mb-md">
                          <div class="text-caption text-weight-medium q-mb-xs">
                            {{ inputDef.label }}
                            <q-tooltip v-if="inputDef.hint">{{ inputDef.hint }}</q-tooltip>
                          </div>

                          <q-input
                            :model-value="task.input[inputKey]"
                            @update:model-value="(val) => updateTaskInput(task.id, inputKey, val)"
                            :label="inputDef.label"
                            :placeholder="inputDef.placeholder || 'Sélectionner une variable...'"
                            dense
                            filled
                            bg-color="white"
                            :hint="inputDef.hint"
                          >
                            <template v-slot:prepend>
                              <q-btn
                                dense
                                flat
                                icon="code"
                                color="primary"
                                @click="showVariableSelector(task.id, inputKey, idx)"
                                size="sm"
                              />
                            </template>
                          </q-input>
                        </div>

                        <div class="q-mt-lg text-right">
                          <q-btn
                            flat
                            dense
                            icon="keyboard_arrow_up"
                            @click="moveOutputTaskUp(idx)"
                            color="primary"
                            class="q-mr-sm"
                            :disable="idx === 0"
                          >
                            <q-tooltip>Monter</q-tooltip>
                          </q-btn>
                          <q-btn
                            flat
                            dense
                            icon="keyboard_arrow_down"
                            @click="moveOutputTaskDown(idx)"
                            color="primary"
                            class="q-mr-sm"
                            :disable="idx === currentWorkflow.outputs.length - 1"
                          >
                            <q-tooltip>Descendre</q-tooltip>
                          </q-btn>
                          <q-btn
                            flat
                            dense
                            icon="content_copy"
                            @click="duplicateTask(task, idx)"
                            color="primary"
                            class="q-mr-sm"
                          >
                            <q-tooltip>Dupliquer</q-tooltip>
                          </q-btn>
                          <q-btn
                            flat
                            dense
                            icon="delete"
                            @click="removeOutputTask(idx)"
                            color="negative"
                          >
                            <q-tooltip>Supprimer</q-tooltip>
                          </q-btn>
                        </div>
                      </q-card-section>
                    </q-card>
                  </template>
                </draggable>

                <div class="text-center q-mt-md">
                  <q-btn
                    color="primary"
                    icon="add"
                    label="Ajouter une sortie"
                    @click="addOutputTask"
                    unelevated
                  />
                </div>
              </q-tab-panel>
            </q-tab-panels>
            
            <!-- BOUTONS D'EXÉCUTION -->
            <div class="execution-actions text-center q-mt-xl q-pa-lg">
              <q-separator class="q-mb-lg" />
              <div class="text-h6 q-mb-md">
                <q-icon name="play_arrow" class="q-mr-sm" />
                Exécution du workflow
              </div>
              <q-btn
                v-if="!isExecuting"
                color="primary"
                icon="play_arrow"
                label="Exécuter le workflow"
                @click="executeWorkflow"
                unelevated
                size="lg"
                class="q-mr-sm"
              />
              <q-btn
                v-else
                color="negative"
                icon="stop"
                label="Arrêter l'exécution"
                @click="stopExecution"
                unelevated
                size="lg"
                class="q-mr-sm"
              />
              <q-btn
                color="grey-7"
                icon="visibility"
                label="Voir les résultats"
                @click="showResultsDialog = true"
                flat
                :disable="!executionResults || Object.keys(executionResults).length === 0"
              />
            </div>
          </div>
        </template>
      </div>

      <!-- PALETTE DE TÂCHES -->
      <div class="col-3" v-if="mainTab === 'builder'">
        <q-card flat bordered class="full-height">
          <q-card-section class="q-pb-none">
            <div class="text-h6 q-mb-md">
              <q-icon :name="getSectionIcon(currentTab)" class="q-mr-sm" />
              {{ 
                currentTab === 'inputs' ? 'Tâches d\'entrée' :
                currentTab === 'outputs' ? 'Tâches de sortie' :
                'Tâches de traitement'
              }}
            </div>
          </q-card-section>

          <q-separator />

          <q-card-section class="q-pt-md task-palette" style="max-height: calc(100vh - 300px); overflow-y: auto">
            <div class="task-list">
              <q-card
                v-for="taskDef in getFilteredTasks()"
                :key="taskDef.type"
                flat
                bordered
                class="task-palette-item q-mb-sm cursor-pointer"
                @click="addTaskOfType(taskDef.type)"
              >
                <q-card-section class="q-py-sm">
                  <div class="row items-center">
                    <q-icon
                      :name="taskDef.icon"
                      :color="taskDef.color"
                      size="sm"
                      class="q-mr-sm"
                    />
                    <div class="col">
                      <div class="text-subtitle2">{{ taskDef.title }}</div>
                      <div class="text-caption text-grey-6">{{ taskDef.description }}</div>
                    </div>
                    <q-icon name="add_circle" color="primary" size="sm" class="q-ml-sm" />
                  </div>
                </q-card-section>
              </q-card>
            </div>

            <div v-if="getFilteredTasks().length === 0" class="text-center text-grey-6 q-mt-lg">
              <q-icon name="search_off" size="lg" class="q-mb-sm" />
              <div>Aucune tâche trouvée</div>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>
      </q-tab-panel>

      <!-- PANEL TEMPLATES -->
      <q-tab-panel name="templates" class="q-pa-md">
        <div class="row q-col-gutter-md q-mb-lg">
          <div class="col">
            <div class="text-h6 q-mb-sm">
              <q-icon name="description" class="q-mr-sm" />
              Templates de workflow
            </div>
            <div class="text-body2 text-grey-7">
              Utilisez des templates prédéfinis pour créer rapidement des workflows.
            </div>
          </div>
          <div class="col-auto">
            <q-btn color="primary" icon="add" label="Créer un template" @click="showCreateTemplateDialog = true" />
          </div>
        </div>

        <!-- FILTRES ET RECHERCHE -->
        <div class="row q-col-gutter-md q-mb-lg">
          <div class="col-8">
            <q-input 
              v-model="templateSearch"
              placeholder="Rechercher un template..."
              filled
              dense
            >
              <template v-slot:prepend>
                <q-icon name="search" />
              </template>
            </q-input>
          </div>
          <div class="col-4">
            <q-select
              v-model="templateCategory"
              :options="templateCategories"
              label="Catégorie"
              filled
              dense
            />
          </div>
        </div>

        <!-- GALERIE DE TEMPLATES -->
        <div class="row q-col-gutter-md">
          <div 
            v-for="template in filteredTemplates" 
            :key="template.id" 
            class="col-lg-4 col-md-6 col-sm-12"
          >
            <q-card class="template-card full-height cursor-pointer" @click="previewTemplate(template)">
              <q-img
                :src="template.thumbnail || '/default-template.png'"
                height="150px"
                class="template-thumbnail"
              >
                <div class="absolute-bottom-right q-pa-sm">
                  <q-chip
                    :color="getCategoryColor(template.category)"
                    text-color="white"
                    size="sm"
                  >
                    {{ template.category }}
                  </q-chip>
                </div>
              </q-img>
              
              <q-card-section>
                <div class="text-subtitle1 q-mb-xs">{{ template.name }}</div>
                <div class="text-caption text-grey-7 q-mb-sm">{{ template.description }}</div>
                
                <div class="row items-center justify-between">
                  <div class="text-caption text-grey-6">
                    <q-icon name="schedule" size="xs" class="q-mr-xs" />
                    {{ template.estimatedTime || '5 min' }}
                  </div>
                  <div class="text-caption text-grey-6">
                    <q-icon name="star" size="xs" class="q-mr-xs" />
                    {{ template.rating || '4.5' }}
                  </div>
                </div>
              </q-card-section>

              <q-card-actions align="right">
                <q-btn 
                  flat 
                  size="sm" 
                  color="primary" 
                  icon="visibility"
                  @click.stop="previewTemplate(template)"
                >
                  Aperçu
                </q-btn>
                <q-btn 
                  unelevated 
                  size="sm" 
                  color="primary" 
                  icon="download"
                  @click.stop="loadTemplate(template)"
                >
                  Utiliser
                </q-btn>
              </q-card-actions>
            </q-card>
          </div>
        </div>

        <!-- MESSAGE SI AUCUN TEMPLATE -->
        <div v-if="filteredTemplates.length === 0" class="text-center text-grey-6 q-pa-xl">
          <q-icon name="search_off" size="4rem" class="q-mb-md" />
          <div class="text-h6 q-mb-sm">Aucun template trouvé</div>
          <div>Essayez de modifier vos critères de recherche</div>
        </div>
      </q-tab-panel>

      <!-- PANEL WORKFLOWS -->
      <q-tab-panel name="workflows" class="q-pa-md">
        <div class="row q-col-gutter-md q-mb-lg">
          <div class="col">
            <div class="text-h6 q-mb-sm">
              <q-icon name="account_tree" class="q-mr-sm" />
              Workflows sauvegardés
            </div>
            <div class="text-body2 text-grey-7">
              Gérez et chargez vos workflows sauvegardés.
            </div>
          </div>
          <div class="col-auto">
            <q-btn color="primary" icon="save" label="Sauvegarder le workflow actuel" @click="saveCurrentWorkflow" />
          </div>
        </div>

        <!-- FILTRES ET ACTIONS -->
        <div class="row q-col-gutter-md q-mb-lg">
          <div class="col-6">
            <q-input 
              v-model="workflowSearch"
              placeholder="Rechercher un workflow..."
              filled
              dense
            >
              <template v-slot:prepend>
                <q-icon name="search" />
              </template>
            </q-input>
          </div>
          <div class="col-3">
            <q-select
              v-model="workflowSortBy"
              :options="workflowSortOptions"
              label="Trier par"
              filled
              dense
            />
          </div>
          <div class="col-3">
            <q-btn-toggle
              v-model="workflowViewMode"
              :options="[
                { label: 'Grille', value: 'grid', icon: 'grid_view' },
                { label: 'Liste', value: 'list', icon: 'list' }
              ]"
              unelevated
            />
          </div>
        </div>

        <!-- VUE GRILLE -->
        <div v-if="workflowViewMode === 'grid'" class="row q-col-gutter-md">
          <div 
            v-for="workflow in filteredWorkflows" 
            :key="workflow.id" 
            class="col-lg-4 col-md-6 col-sm-12"
          >
            <q-card class="workflow-card full-height">
              <q-card-section class="q-pb-none">
                <div class="row items-start justify-between">
                  <div class="col">
                    <div class="text-subtitle1 q-mb-xs">{{ workflow.name }}</div>
                    <div class="text-caption text-grey-7">{{ workflow.description }}</div>
                  </div>
                  <q-btn-dropdown flat round icon="more_vert" size="sm">
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
              </q-card-section>

              <q-card-section>
                <div class="workflow-stats row q-col-gutter-sm q-mb-sm">
                  <div class="col-4 text-center">
                    <div class="text-h6 text-primary">{{ workflow.inputs?.length || 0 }}</div>
                    <div class="text-caption">Entrées</div>
                  </div>
                  <div class="col-4 text-center">
                    <div class="text-h6 text-secondary">{{ workflow.tasks?.length || 0 }}</div>
                    <div class="text-caption">Tâches</div>
                  </div>
                  <div class="col-4 text-center">
                    <div class="text-h6 text-accent">{{ workflow.outputs?.length || 0 }}</div>
                    <div class="text-caption">Sorties</div>
                  </div>
                </div>

                <div class="text-caption text-grey-6 q-mb-sm">
                  Créé le {{ formatDate(workflow.createdAt) }}
                </div>
                <div class="text-caption text-grey-6">
                  Modifié le {{ formatDate(workflow.updatedAt) }}
                </div>
              </q-card-section>

              <q-card-actions align="right">
                <q-btn flat color="primary" @click="loadWorkflow(workflow)">
                  Charger
                </q-btn>
                <q-btn unelevated color="primary" @click="executeWorkflowDirect(workflow)">
                  Exécuter
                </q-btn>
              </q-card-actions>
            </q-card>
          </div>
        </div>

        <!-- VUE LISTE -->
        <q-table
          v-else
          :rows="filteredWorkflows"
          :columns="workflowColumns"
          row-key="id"
          flat
          bordered
        >
          <template v-slot:body-cell-actions="props">
            <q-td :props="props">
              <q-btn flat round icon="play_arrow" color="primary" @click="loadWorkflow(props.row)" />
              <q-btn flat round icon="edit" color="grey-7" @click="editWorkflow(props.row)" />
              <q-btn flat round icon="delete" color="negative" @click="deleteWorkflow(props.row)" />
            </q-td>
          </template>
        </q-table>

        <!-- MESSAGE SI AUCUN WORKFLOW -->
        <div v-if="filteredWorkflows.length === 0" class="text-center text-grey-6 q-pa-xl">
          <q-icon name="account_tree" size="4rem" class="q-mb-md" />
          <div class="text-h6 q-mb-sm">Aucun workflow sauvegardé</div>
          <div>Créez votre premier workflow dans la section Builder</div>
        </div>
      </q-tab-panel>


    </q-tab-panels>

    <!-- DIALOG DE SELECTION DE VARIABLE -->
    <q-dialog v-model="showVariableDialog">
      <q-card style="min-width: 500px">
        <q-card-section>
          <div class="text-h6">Sélectionner une variable</div>
        </q-card-section>

        <q-separator />

        <q-card-section>
          <div class="q-mb-md">
            <q-input
              v-model="variableSearch"
              placeholder="Rechercher une variable..."
              dense
              filled
            >
              <template v-slot:prepend>
                <q-icon name="search" />
              </template>
            </q-input>
          </div>

          <q-list>
            <q-item
              v-for="variable in getAvailableVariables()"
              :key="variable.path"
              clickable
              @click="selectVariable(variable.path)"
            >
              <q-item-section avatar>
                <q-icon :name="variable.icon" :color="variable.color" />
              </q-item-section>
              <q-item-section>
                <q-item-label>{{ variable.path }}</q-item-label>
                <q-item-label caption>{{ variable.description }}</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card-section>

        <q-separator />

        <q-card-actions align="right">
          <q-btn flat color="grey" @click="showVariableDialog = false">Annuler</q-btn>
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- COLLECTION MANAGER -->
    <CollectionManager 
      v-if="showCollectionManager" 
      v-model="showCollectionManager"
    />

    <!-- DIALOG RÉSULTATS -->
    <q-dialog v-model="showResultsDialog" maximized>
      <q-card>
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">
            <q-icon name="analytics" class="q-mr-sm" />
            Résultats d'exécution
          </div>
          <q-space />
          <q-btn icon="close" flat round dense @click="showResultsDialog = false" />
        </q-card-section>

        <q-card-section>
          <q-linear-progress 
            v-if="isExecuting" 
            :value="executionProgress" 
            color="primary" 
            size="md"
            class="q-mb-md"
          />

          <q-card flat bordered class="execution-logs q-mb-md" style="max-height: 300px; overflow-y: auto">
            <q-card-section>
              <div class="text-subtitle2 q-mb-sm">Logs d'exécution</div>
              <div v-for="(log, index) in executionLogs" :key="index" class="execution-log-item q-mb-xs">
                <div class="text-caption text-grey-6">{{ log.timestamp }}</div>
                <div :class="`text-${log.level === 'error' ? 'negative' : log.level === 'warning' ? 'orange' : 'grey-8'}`">
                  {{ log.message }}
                </div>
              </div>
            </q-card-section>
          </q-card>

          <div v-if="executionResults && Object.keys(executionResults).length > 0" class="execution-results">
            <div class="text-h6 q-mb-md">Résultats</div>
            <div v-for="(result, taskId) in executionResults" :key="taskId" class="result-item q-mb-md">
              <q-card flat bordered>
                <q-card-section>
                  <div class="text-subtitle2 q-mb-sm">{{ result.taskName }}</div>
                  <div v-if="result.type === 'image'" class="result-image">
                    <q-img :src="result.data.url" style="max-width: 300px" />
                  </div>
                  <div v-else-if="result.type === 'text'" class="result-text">
                    <div class="bg-grey-2 q-pa-md rounded-borders">{{ result.data }}</div>
                  </div>
                  <div v-else-if="result.type === 'gallery'" class="result-gallery">
                    <div class="row q-col-gutter-md">
                      <div v-for="(image, idx) in result.data" :key="idx" class="col-4">
                        <q-img :src="image.url" style="height: 150px" fit="cover" />
                      </div>
                    </div>
                  </div>
                </q-card-section>
              </q-card>
            </div>
          </div>
          <div v-else class="text-center text-grey-6 q-pa-xl">
            <q-icon name="search_off" size="4rem" class="q-mb-md" />
            <div class="text-h6 q-mb-sm">Aucun résultat</div>
            <div>Exécutez le workflow pour voir les résultats ici</div>
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useWorkflowStore } from 'src/stores/useWorkflowStore'
import { useQuasar } from 'quasar'
import { api } from 'src/boot/axios'
import { 
  TASK_DEFINITIONS, 
  getTaskDefinition, 
  generateTaskId, 
  getAvailableOutputs,
  ALL_DEFINITIONS,
  getTasksBySection,
  getDefinition,
  isInputTask,
  isOutputTask
} from 'src/config/taskDefinitions'
import { INPUT_DEFINITIONS, OUTPUT_DEFINITIONS } from 'src/config/ioDefinitions'
import { migrateWorkflowToV2, validateWorkflowV2 } from 'src/utils/workflowMigration'
import draggable from 'vuedraggable'
import CollectionManager from './CollectionManager.vue'
import CollectionImageUpload from './CollectionImageUpload.vue'

// Composants
const components = {
  draggable
}

// Stores et composables
const workflowStore = useWorkflowStore()
const $q = useQuasar()

// Reactive variables
const mainTab = ref('builder')
const currentTab = ref('inputs')
// Variables supprimées : searchQuery et selectedCategory car plus nécessaires
const showVariableDialog = ref(false)
const showResultsDialog = ref(false)
const variableSearch = ref('')
const showAdvanced = ref({})
const currentWorkflow = ref({
  inputs: [],
  tasks: [],
  outputs: []
})

// Reactive state
const isExecuting = ref(false)
const executionProgress = ref(0)
const executionLogs = ref([])
const executionResults = ref({})
const currentTaskSelector = ref(null)
const currentInputKey = ref(null)

// Variables pour Templates
const templateSearch = ref('')
const templateCategory = ref('all')
const showCreateTemplateDialog = ref(false)
const templates = ref([])

// Variables pour Workflows
const workflowSearch = ref('')
const workflowSortBy = ref('updatedAt')
const workflowViewMode = ref('grid')
const savedWorkflows = ref([])

// Variables pour Collections
const showCollectionManager = ref(false)

// Watcher pour ouvrir CollectionManager directement
const previousMainTab = ref('builder')
watch(mainTab, (newValue, oldValue) => {
  if (newValue === 'collections') {
    // Ouvrir le CollectionManager et revenir à l'onglet précédent
    showCollectionManager.value = true
    mainTab.value = oldValue || 'builder'
  } else {
    previousMainTab.value = newValue
  }
})

// Functions for new architecture
const getSectionIcon = (section) => {
  const icons = {
    inputs: 'input',
    tasks: 'settings',
    outputs: 'output'
  }
  return icons[section] || 'help'
}

const getSectionTitle = (section) => {
  const titles = {
    inputs: 'Données d\'entrée',
    tasks: 'Tâches',
    outputs: 'Données de sortie'
  }
  return titles[section] || section
}

const getTasksForSection = (section) => {
  if (section === 'inputs') {
    return Object.entries(INPUT_DEFINITIONS).map(([type, def]) => ({
      type,
      ...def
    }))
  } else if (section === 'outputs') {
    return Object.entries(OUTPUT_DEFINITIONS).map(([type, def]) => ({
      type,
      ...def
    }))
  } else {
    return Object.entries(TASK_DEFINITIONS)
      .filter(([type, def]) => !isInputTask(type) && !isOutputTask(type))
      .map(([type, def]) => ({
        type,
        ...def
      }))
  }
}

// Fonction getTaskCategories supprimée car plus nécessaire

const getFilteredTasks = () => {
  if (currentTab.value === 'inputs') {
    // Montrer seulement les tâches d'entrée
    return Object.entries(INPUT_DEFINITIONS)
      .map(([type, def]) => ({ type, ...def, category: 'input' }))
  } else if (currentTab.value === 'outputs') {
    // Montrer seulement les tâches de sortie
    return Object.entries(OUTPUT_DEFINITIONS)
      .map(([type, def]) => ({ type, ...def, category: 'output' }))
  } else {
    // Montrer seulement les tâches de traitement
    return Object.entries(TASK_DEFINITIONS)
      .filter(([type, def]) => !isInputTask(type) && !isOutputTask(type))
      .map(([type, def]) => ({ type, ...def, category: 'processing' }))
  }
}

const getBasicInputs = (taskType) => {
  const definition = getTaskDefinition(taskType)
  if (!definition?.inputs) return {}
  
  return Object.fromEntries(
    Object.entries(definition.inputs).filter(([key, input]) => !input.advanced)
  )
}

const getAdvancedInputs = (taskType) => {
  const definition = getTaskDefinition(taskType)
  if (!definition?.inputs) return {}
  
  return Object.fromEntries(
    Object.entries(definition.inputs).filter(([key, input]) => input.advanced)
  )
}

// Computed properties pour Templates
const templateCategories = computed(() => [
  { label: 'Toutes', value: 'all' },
  { label: 'IA Générative', value: 'ai' },
  { label: 'Traitement d\'images', value: 'image' },
  { label: 'Vidéo', value: 'video' },
  { label: 'Texte', value: 'text' },
  { label: 'Analyse', value: 'analysis' }
])

const filteredTemplates = computed(() => {
  let filtered = templates.value
  
  if (templateCategory.value !== 'all') {
    filtered = filtered.filter(t => t.category === templateCategory.value)
  }
  
  if (templateSearch.value) {
    const search = templateSearch.value.toLowerCase()
    filtered = filtered.filter(t => 
      t.name.toLowerCase().includes(search) ||
      t.description.toLowerCase().includes(search)
    )
  }
  
  return filtered
})

// Computed properties pour Workflows
const workflowSortOptions = computed(() => [
  { label: 'Plus récent', value: 'updatedAt' },
  { label: 'Nom', value: 'name' },
  { label: 'Date de création', value: 'createdAt' }
])

const workflowColumns = [
  { name: 'name', label: 'Nom', field: 'name', sortable: true, align: 'left' },
  { name: 'description', label: 'Description', field: 'description', align: 'left' },
  { name: 'tasks', label: 'Tâches', field: row => `${row.inputs?.length || 0}/${row.tasks?.length || 0}/${row.outputs?.length || 0}` },
  { name: 'updatedAt', label: 'Modifié', field: 'updatedAt', sortable: true },
  { name: 'actions', label: 'Actions', field: 'actions', align: 'right' }
]

const filteredWorkflows = computed(() => {
  let filtered = savedWorkflows.value
  
  if (workflowSearch.value) {
    const search = workflowSearch.value.toLowerCase()
    filtered = filtered.filter(w => 
      w.name.toLowerCase().includes(search) ||
      w.description?.toLowerCase().includes(search)
    )
  }
  
  // Trier
  filtered.sort((a, b) => {
    const sortBy = workflowSortBy.value
    if (sortBy === 'name') {
      return a.name.localeCompare(b.name)
    } else if (sortBy === 'createdAt' || sortBy === 'updatedAt') {
      return new Date(b[sortBy]) - new Date(a[sortBy])
    }
    return 0
  })
  
  return filtered
})

const addTask = () => {
  const newTask = {
    id: generateTaskId('text_generation'),
    type: 'text_generation',
    input: {}
  }
  currentWorkflow.value.tasks.push(newTask)
}

const addInputTask = () => {
  const newTask = {
    id: generateTaskId('text_input'),
    type: 'text_input',
    input: {
      label: 'Nouveau texte'
    }
  }
  currentWorkflow.value.inputs.push(newTask)
}

const addOutputTask = () => {
  const newTask = {
    id: generateTaskId('text_output'),
    type: 'text_output',
    input: {
      source: ''
    }
  }
  currentWorkflow.value.outputs.push(newTask)
}

const addTaskOfType = (taskType) => {
  const newTask = {
    id: generateTaskId(taskType),
    type: taskType,
    input: {}
  }
  
  if (isInputTask(taskType)) {
    currentWorkflow.value.inputs.push(newTask)
    currentTab.value = 'inputs'
  } else if (isOutputTask(taskType)) {
    currentWorkflow.value.outputs.push(newTask)
    currentTab.value = 'outputs'
  } else {
    currentWorkflow.value.tasks.push(newTask)
    currentTab.value = 'tasks'
  }
}

const removeTask = (index) => {
  currentWorkflow.value.tasks.splice(index, 1)
}

const removeInputTask = (index) => {
  currentWorkflow.value.inputs.splice(index, 1)
}

const removeOutputTask = (index) => {
  currentWorkflow.value.outputs.splice(index, 1)
}

// Méthodes de déplacement vertical des tâches
const moveTaskUp = (index) => {
  if (index > 0) {
    const tasks = currentWorkflow.value.tasks
    const temp = tasks[index]
    tasks[index] = tasks[index - 1]
    tasks[index - 1] = temp
  }
}

const moveTaskDown = (index) => {
  const tasks = currentWorkflow.value.tasks
  if (index < tasks.length - 1) {
    const temp = tasks[index]
    tasks[index] = tasks[index + 1]
    tasks[index + 1] = temp
  }
}

const moveInputTaskUp = (index) => {
  if (index > 0) {
    const tasks = currentWorkflow.value.inputs
    const temp = tasks[index]
    tasks[index] = tasks[index - 1]
    tasks[index - 1] = temp
  }
}

const moveInputTaskDown = (index) => {
  const tasks = currentWorkflow.value.inputs
  if (index < tasks.length - 1) {
    const temp = tasks[index]
    tasks[index] = tasks[index + 1]
    tasks[index + 1] = temp
  }
}

const moveOutputTaskUp = (index) => {
  if (index > 0) {
    const tasks = currentWorkflow.value.outputs
    const temp = tasks[index]
    tasks[index] = tasks[index - 1]
    tasks[index - 1] = temp
  }
}

const moveOutputTaskDown = (index) => {
  const tasks = currentWorkflow.value.outputs
  if (index < tasks.length - 1) {
    const temp = tasks[index]
    tasks[index] = tasks[index + 1]
    tasks[index + 1] = temp
  }
}

const duplicateTask = (task, index) => {
  const newTask = {
    ...task,
    id: generateTaskId(task.type)
  }
  
  if (currentTab.value === 'inputs') {
    currentWorkflow.value.inputs.splice(index + 1, 0, newTask)
  } else if (currentTab.value === 'outputs') {
    currentWorkflow.value.outputs.splice(index + 1, 0, newTask)
  } else {
    currentWorkflow.value.tasks.splice(index + 1, 0, newTask)
  }
}

const updateTaskInput = (taskId, inputKey, value) => {
  const allTasks = [
    ...currentWorkflow.value.inputs,
    ...currentWorkflow.value.tasks,
    ...currentWorkflow.value.outputs
  ]
  
  const task = allTasks.find(t => t.id === taskId)
  if (task) {
    if (!task.input) task.input = {}
    task.input[inputKey] = value
  }
}

const cloneTask = (taskDef) => {
  return {
    id: generateTaskId(taskDef.type),
    type: taskDef.type,
    input: {}
  }
}

const onInputsChange = (evt) => {
  console.log('Inputs changed:', evt)
}

const onTasksChange = (evt) => {
  console.log('Tasks changed:', evt)
}

const onOutputsChange = (evt) => {
  console.log('Outputs changed:', evt)
}

const toggleAdvanced = (taskId) => {
  showAdvanced.value[taskId] = !showAdvanced.value[taskId]
}

const showVariableSelector = (taskId, inputKey, index) => {
  currentTaskSelector.value = { taskId, inputKey, index }
  showVariableDialog.value = true
}

const selectVariable = (variablePath) => {
  if (currentTaskSelector.value) {
    updateTaskInput(
      currentTaskSelector.value.taskId,
      currentTaskSelector.value.inputKey,
      variablePath
    )
  }
  showVariableDialog.value = false
}

const getAvailableVariables = () => {
  // Mock variables for now
  return [
    {
      path: 'tasks.1.output.text',
      icon: 'text_fields',
      color: 'primary',
      description: 'Texte généré par la tâche 1'
    },
    {
      path: 'inputs.user_text',
      icon: 'input',
      color: 'secondary',
      description: 'Texte saisi par l\'utilisateur'
    }
  ]
}

// Fonctions pour Templates
const getCategoryColor = (category) => {
  const colors = {
    'ai': 'purple',
    'image': 'blue',
    'video': 'red', 
    'text': 'green',
    'analysis': 'orange'
  }
  return colors[category] || 'grey'
}

const previewTemplate = (template) => {
  console.log('Aperçu du template:', template)
  // TODO: Implémenter l'aperçu du template
}

const loadTemplate = (template) => {
  console.log('Charger le template:', template)
  currentWorkflow.value = { ...template.workflow }
  mainTab.value = 'builder'
}

// Fonctions pour Workflows
const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const saveCurrentWorkflow = () => {
  console.log('Sauvegarder le workflow actuel')
  // TODO: Implémenter la sauvegarde
}

const loadWorkflow = (workflow) => {
  console.log('Charger le workflow:', workflow)
  currentWorkflow.value = { ...workflow }
  mainTab.value = 'builder'
}

const editWorkflow = (workflow) => {
  loadWorkflow(workflow)
}

const duplicateWorkflow = (workflow) => {
  console.log('Dupliquer le workflow:', workflow)
  // TODO: Implémenter la duplication
}

const exportWorkflow = (workflow) => {
  console.log('Exporter le workflow:', workflow)
  // TODO: Implémenter l'export
}

const deleteWorkflow = (workflow) => {
  console.log('Supprimer le workflow:', workflow)
  // TODO: Implémenter la suppression avec confirmation
}

const executeWorkflowDirect = (workflow) => {
  loadWorkflow(workflow)
  executeWorkflow()
}



const executeWorkflow = async () => {
  isExecuting.value = true
  executionLogs.value = []
  
  try {
    // Convert to v2 format if needed
    const workflow = migrateWorkflowToV2(currentWorkflow.value)
    
    // Validate workflow
    if (!validateWorkflowV2(workflow)) {
      throw new Error('Workflow invalide')
    }
    
    // Execute workflow
    // Implementation here...
    
    $q.notify({
      type: 'positive',
      message: 'Workflow exécuté avec succès'
    })
    
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: `Erreur: ${error.message}`
    })
  } finally {
    isExecuting.value = false
  }
}

const stopExecution = () => {
  isExecuting.value = false
  executionLogs.value.push({
    timestamp: new Date().toLocaleTimeString(),
    level: 'info',
    message: 'Exécution arrêtée par l\'utilisateur'
  })
}

// Watcher supprimé car la variable mode n'existe plus

// Initialisation des données d'exemple
onMounted(() => {
  // Templates d'exemple
  templates.value = [
    {
      id: 1,
      name: 'Générateur d\'images IA',
      description: 'Créez des images avec DALL-E ou Midjourney',
      category: 'ai',
      thumbnail: '/templates/ai-generator.png',
      estimatedTime: '2 min',
      rating: '4.8',
      workflow: {
        inputs: [
          { id: 'input_1', type: 'text_input', input: { label: 'Description de l\'image' } }
        ],
        tasks: [
          { id: 'task_1', type: 'image_generation', input: { prompt: 'inputs.input_1' } }
        ],
        outputs: [
          { id: 'output_1', type: 'image_output', input: { image: 'task_1.image' } }
        ]
      }
    },
    {
      id: 2,
      name: 'Analyseur de sentiment',
      description: 'Analysez le sentiment d\'un texte',
      category: 'text',
      thumbnail: '/templates/sentiment.png',
      estimatedTime: '1 min',
      rating: '4.5',
      workflow: {
        inputs: [
          { id: 'input_1', type: 'text_input', input: { label: 'Texte à analyser' } }
        ],
        tasks: [
          { id: 'task_1', type: 'sentiment_analysis', input: { text: 'inputs.input_1' } }
        ],
        outputs: [
          { id: 'output_1', type: 'text_output', input: { text: 'task_1.sentiment' } }
        ]
      }
    }
  ]

  // Workflows sauvegardés d'exemple
  savedWorkflows.value = [
    {
      id: 1,
      name: 'Mon workflow IA',
      description: 'Génération d\'images personnalisée',
      inputs: [{ type: 'text_input' }],
      tasks: [{ type: 'image_generation' }],
      outputs: [{ type: 'image_output' }],
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-20')
    }
  ]
})
</script>

<style scoped>
.workflow-runner {
  padding: 20px;
}

.task-card {
  transition: all 0.3s ease;
}

.task-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.task-palette-item {
  cursor: pointer;
  transition: all 0.2s ease;
}

.task-palette-item:hover {
  background-color: #f5f5f5;
  transform: translateX(4px);
}

.task-actions {
  display: flex;
  gap: 4px;
}

.task-actions .q-btn {
  opacity: 0.7;
  transition: opacity 0.2s ease;
}

.task-actions .q-btn:hover {
  opacity: 1;
}

.task-actions .q-btn[disabled] {
  opacity: 0.3;
}

/* Navigation améliorée */
.q-tabs {
  border-radius: 8px;
  background-color: rgba(0, 0, 0, 0.05);
}

.q-btn-toggle {
  border-radius: 8px;
  overflow: hidden;
}

/* Section d'exécution */
.execution-actions {
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  border-radius: 12px;
  margin-top: 2rem;
}

.workflow-execution {
  max-width: 100%;
}

.execution-logs {
  border-left: 4px solid #1976d2;
}

/* Templates */
.template-card {
  transition: all 0.3s ease;
}

.template-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0,0,0,0.15);
}

.template-thumbnail {
  position: relative;
  overflow: hidden;
}

/* Workflows */
.workflow-card {
  transition: all 0.3s ease;
}

.workflow-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.workflow-stats {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 8px;
  background: #fafafa;
}

/* Collections */
.media-card {
  transition: all 0.2s ease;
}

.media-card:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.media-placeholder {
  border: 2px dashed #ccc;
  border-radius: 4px;
}

.inputs-container,
.tasks-container,
.outputs-container {
  min-height: 200px;
}

.execution-log-item {
  border-left: 3px solid #e0e0e0;
  padding-left: 12px;
}
</style>