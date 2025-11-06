<template>
    <div class="workflow-builder">
        <!-- HEADER DE LA SECTION -->
        <div class="row q-col-gutter-md q-mb-lg">
            <div class="col">
                <div class="text-h5 q-mb-sm">
                    <q-icon name="build" class="q-mr-sm" />
                    Workflow Builder
                </div>
                <div class="text-body2 text-grey-7">
                    Créez et configurez vos workflows personnalisés
                </div>
            </div>

            <div class="col-auto">
                <!-- Info collection active -->
                <div v-if="collectionStore.hasCurrentCollection" class="q-pa-sm bg-blue-1 rounded-borders">
                    <div class="row items-center q-gutter-sm">
                        <q-icon name="collections" color="primary" />
                        <div>
                            <div class="text-body2 text-weight-medium">{{ collectionStore.currentCollection.name }}
                            </div>
                            <div class="text-caption text-grey-6">
                                {{ collectionStore.currentCollectionStats.total }} médias disponibles
                            </div>
                        </div>
                        <q-btn flat round size="sm" icon="open_in_new" @click="$emit('openCollections')">
                            <q-tooltip>Gérer les collections</q-tooltip>
                        </q-btn>
                    </div>
                </div>

                <div v-else class="q-pa-sm bg-orange-1 rounded-borders">
                    <div class="row items-center q-gutter-sm">
                        <q-icon name="warning" color="orange" />
                        <div>
                            <div class="text-body2">Aucune collection active</div>
                            <div class="text-caption text-grey-6">
                                Définissez une collection pour utiliser des médias
                            </div>
                        </div>
                        <q-btn flat round size="sm" icon="add" color="orange" @click="$emit('openCollections')">
                            <q-tooltip>Créer/sélectionner une collection</q-tooltip>
                        </q-btn>
                    </div>
                </div>
            </div>
        </div>

        <!-- CONTENU BUILDER -->
        <div class="row q-col-gutter-lg">
            <div class="col-9">
                <!-- NAVIGATION DES SECTIONS -->
                <q-tabs v-model="currentTab" dense align="left" narrow-indicator class="q-mb-md">
                    <q-tab name="inputs" :label="getSectionTitle('inputs')" :icon="getSectionIcon('inputs')" />
                    <q-tab name="tasks" :label="getSectionTitle('tasks')" :icon="getSectionIcon('tasks')" />
                    <q-tab name="outputs" :label="getSectionTitle('outputs')" :icon="getSectionIcon('outputs')" />
                    <q-tab name="results" label="Résultats" icon="check_circle" />
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

                        <!-- Mini-galerie pour sélection d'images -->
                        <div v-if="collectionStore.currentCollectionMedias.length > 0" class="q-mb-lg">
                            <div class="row items-center justify-between q-mb-sm">
                                <div class="text-subtitle2">
                                    <q-icon name="photo_library" class="q-mr-xs" />
                                    Médias disponibles dans "{{ collectionStore.currentCollection.name }}"
                                </div>
                                <div class="row items-center q-gutter-sm">
                                    <q-chip v-if="collectionStore.selectedMediasForWorkflow.length > 0" color="primary"
                                        text-color="white" icon="check_circle">
                                        {{ collectionStore.selectedMediasForWorkflow.length }} sélectionné(s)
                                    </q-chip>

                                    <q-btn :color="collectionStore.workflowSelectionMode ? 'negative' : 'primary'"
                                        :icon="collectionStore.workflowSelectionMode ? 'cancel' : 'checklist'"
                                        :label="collectionStore.workflowSelectionMode ? 'Annuler' : 'Sélectionner'"
                                        @click="collectionStore.toggleWorkflowSelectionMode()" size="sm" flat />

                                    <q-btn v-if="collectionStore.workflowSelectionMode" color="primary"
                                        icon="select_all" label="Tout"
                                        @click="collectionStore.selectAllMediasForWorkflow()" size="sm" flat />
                                </div>
                            </div>
                            <div class="media-selector row q-col-gutter-sm">
                                <div v-for="media in collectionStore.currentCollectionMedias.slice(0, 8)"
                                    :key="media.mediaId" class="col-auto">
                                    <q-card flat bordered class="media-thumb cursor-pointer relative-position"
                                        :class="{ 'selected': collectionStore.selectedMediasForWorkflow.some(m => m.mediaId === media.mediaId) }"
                                        @click="collectionStore.workflowSelectionMode ? collectionStore.toggleMediaForWorkflow(media) : null">
                                        <!-- Checkbox de sélection -->
                                        <q-checkbox v-if="collectionStore.workflowSelectionMode"
                                            :model-value="collectionStore.selectedMediasForWorkflow.some(m => m.mediaId === media.mediaId)"
                                            @update:model-value="collectionStore.toggleMediaForWorkflow(media)"
                                            class="absolute-top-left q-ma-xs" style="z-index: 2;" color="primary"
                                            @click.stop />

                                        <q-img v-if="media.type === 'image'" :src="media.url"
                                            style="width: 60px; height: 60px;" fit="cover" class="rounded-borders" />

                                        <div v-else class="video-thumb flex flex-center bg-grey-3"
                                            style="width: 60px; height: 60px;">
                                            <q-icon name="videocam" size="sm" />
                                        </div>
                                        <q-tooltip>{{ media.description || 'Média sans description' }}</q-tooltip>
                                    </q-card>
                                </div>

                                <div v-if="collectionStore.currentCollectionMedias.length > 8" class="col-auto">
                                    <q-card flat bordered class="media-thumb flex flex-center cursor-pointer"
                                        style="width: 60px; height: 60px;" @click="$emit('openCollections')">
                                        <div class="text-center">
                                            <q-icon name="more_horiz" />
                                            <div class="text-caption">+{{ collectionStore.currentCollectionMedias.length
                                                - 8 }}</div>
                                        </div>
                                    </q-card>
                                </div>
                            </div>

                        </div>

                        <!-- Actions pour les médias sélectionnés -->
                        <div v-if="collectionStore.selectedMediasForWorkflow.length > 0"
                            class="q-mt-md q-pa-sm bg-blue-1 rounded-borders">
                            <div class="row items-center justify-between">
                                <div class="text-body2 text-weight-medium">
                                    {{ collectionStore.selectedMediasForWorkflow.length }} média(s) sélectionné(s)
                                </div>
                                <div class="row items-center q-gutter-sm">
                                    <q-btn color="primary" icon="input" label="Utiliser comme entrée unique"
                                        @click="useSelectedAsInput('single')" size="sm"
                                        :disable="collectionStore.selectedMediasForWorkflow.length !== 1" />
                                    <q-btn color="primary" icon="view_list" label="Utiliser comme entrées multiples"
                                        @click="useSelectedAsInput('multiple')" size="sm"
                                        :disable="collectionStore.selectedMediasForWorkflow.length === 0" />
                                </div>
                            </div>
                        </div>


        <!-- Zone des tâches d'entrée -->
        <draggable v-model="currentWorkflow.inputs" group="workflow-tasks" :animation="200" handle=".drag-handle"
            @change="onTaskOrderChanged" item-key="id" class="task-container">
            <template #item="{ element: task, index }">
                <TaskCard :task="task" :index="index" :section="'inputs'" @edit="editTask" @delete="deleteTask"
                    @move-up="moveTaskUp" @move-down="moveTaskDown" />
            </template>
        </draggable>

        <!-- Bouton d'ajout -->
        <q-btn color="primary" icon="add" label="Ajouter une entrée" @click="showTaskPalette('inputs')" class="q-mt-md"
            outline />

        </q-tab-panel>

        <!-- PANEL TASKS -->
        <q-tab-panel name="tasks" class="q-pa-md">
            <div class="text-h6 q-mb-md">
                <q-icon name="settings" class="q-mr-sm" />
                Tâches de traitement
            </div>
            <div class="text-body2 text-grey-7 q-mb-lg">
                Configurez les tâches qui vont traiter et transformer vos données.
            </div>

            <!-- Zone des tâches de traitement -->
            <draggable v-model="currentWorkflow.tasks" group="workflow-tasks" :animation="200" handle=".drag-handle"
                @change="onTaskOrderChanged" item-key="id" class="task-container">
                <template #item="{ element: task, index }">
                    <TaskCard :task="task" :index="index" :section="'tasks'" @edit="editTask" @delete="deleteTask"
                        @move-up="moveTaskUp" @move-down="moveTaskDown" />
                </template>
            </draggable>

            <!-- Bouton d'ajout -->
            <q-btn color="primary" icon="add" label="Ajouter une tâche" @click="showTaskPalette('tasks')"
                class="q-mt-md" outline />
        </q-tab-panel>

        <!-- PANEL OUTPUTS -->
        <q-tab-panel name="outputs" class="q-pa-md">
            <div class="text-h6 q-mb-md">
                <q-icon name="output" class="q-mr-sm" />
                Données de sortie
            </div>
            <div class="text-body2 text-grey-7 q-mb-lg">
                Configurez comment les résultats de votre workflow seront présentés.
            </div>

            <!-- Zone des tâches de sortie -->
            <draggable v-model="currentWorkflow.outputs" group="workflow-tasks" :animation="200" handle=".drag-handle"
                @change="onTaskOrderChanged" item-key="id" class="task-container">
                <template #item="{ element: task, index }">
                    <TaskCard :task="task" :index="index" :section="'outputs'" @edit="editTask" @delete="deleteTask"
                        @move-up="moveTaskUp" @move-down="moveTaskDown" />
                </template>
            </draggable>

            <!-- Bouton d'ajout -->
            <q-btn color="primary" icon="add" label="Ajouter une sortie" @click="showTaskPalette('outputs')"
                class="q-mt-md" outline />
        </q-tab-panel>

        <!-- PANEL RESULTS -->
        <q-tab-panel name="results" class="q-pa-md">
            <div class="text-h6 q-mb-md">
                <q-icon name="check_circle" class="q-mr-sm" />
                Résultats d'exécution
            </div>

            <div v-if="!workflowStore.lastResult" class="text-center q-py-xl text-grey-6">
                <q-icon name="play_circle_outline" size="3em" class="q-mb-md" />
                <div class="text-h6">Aucun résultat</div>
                <div class="text-body2">
                    Exécutez votre workflow pour voir les résultats ici
                </div>
            </div>

            <div v-else-if="workflowStore.lastResult.success" class="q-gutter-md">
                <!-- Informations générales du workflow -->
                <q-card flat bordered>
                    <q-card-section>
                        <div class="text-subtitle1 q-mb-sm">
                            <q-icon name="info" class="q-mr-xs" />
                            Informations d'exécution
                        </div>
                        
                        <div class="row q-col-gutter-md text-body2">
                            <div class="col-6">
                                <div><strong>ID:</strong> {{ workflowStore.lastResult.workflow_id }}</div>
                                <div><strong>Statut:</strong> <q-chip size="sm" color="positive">{{ workflowStore.lastResult.execution.status }}</q-chip></div>
                            </div>
                            <div class="col-6">
                                <div><strong>Durée:</strong> {{ Math.round(workflowStore.lastResult.execution.execution_time / 1000) }}s</div>
                                <div><strong>Tâches:</strong> {{ workflowStore.lastResult.execution.progress.completed_tasks }} complétées</div>
                            </div>
                        </div>
                    </q-card-section>
                </q-card>

                <!-- Résultats détaillés de chaque tâche -->
                <q-card flat bordered>
                    <q-card-section>
                        <div class="text-subtitle1 q-mb-md">
                            <q-icon name="timeline" class="q-mr-xs" />
                            Résultats détaillés des tâches
                        </div>

                        <q-timeline color="primary" class="q-mt-md">
                            <q-timeline-entry 
                                v-for="(taskResult, index) in workflowStore.lastResult.task_results" 
                                :key="index"
                                :color="taskResult.status === 'completed' ? 'positive' : 'negative'"
                                :icon="getTaskIcon(taskResult.type)"
                                :title="getTaskTitle(taskResult.type)"
                                :subtitle="`${taskResult.execution_time}ms`"
                            >
                                <div>
                                    <div class="text-body2 q-mb-sm">
                                        <q-chip size="sm" :color="taskResult.status === 'completed' ? 'positive' : 'negative'">
                                            {{ taskResult.status }}
                                        </q-chip>
                                    </div>
                                    
                                    <!-- Affichage des outputs -->
                                    <div v-if="taskResult.outputs" class="task-outputs q-mt-sm">
                                        <div class="text-caption text-grey-7 q-mb-xs">Résultats:</div>
                                        
                                        <!-- Texte -->
                                        <div v-if="taskResult.outputs.text" class="q-mb-sm">
                                            <q-card flat bordered class="bg-grey-1">
                                                <q-card-section class="q-pa-sm">
                                                    <div class="text-caption text-grey-7">Texte généré:</div>
                                                    <div class="text-body2">{{ taskResult.outputs.text }}</div>
                                                </q-card-section>
                                            </q-card>
                                        </div>
                                        
                                        <!-- Prompt amélioré -->
                                        <div v-if="taskResult.outputs.enhanced_prompt" class="q-mb-sm">
                                            <q-card flat bordered class="bg-green-1">
                                                <q-card-section class="q-pa-sm">
                                                    <div class="text-caption text-grey-7">Prompt amélioré:</div>
                                                    <div class="text-body2">{{ taskResult.outputs.enhanced_prompt }}</div>
                                                    <div v-if="taskResult.outputs.original_prompt" class="text-caption text-grey-6 q-mt-xs">
                                                        Original: "{{ taskResult.outputs.original_prompt }}"
                                                    </div>
                                                </q-card-section>
                                            </q-card>
                                        </div>
                                        
                                        <!-- Image -->
                                        <div v-if="taskResult.outputs.image_url" class="q-mb-sm">
                                            <q-img :src="taskResult.outputs.image_url" :ratio="16/9" class="rounded-borders" />
                                        </div>
                                        
                                        <!-- Autres métadonnées -->
                                        <div class="text-caption text-grey-6">
                                            <div v-if="taskResult.outputs.confidence">Confiance: {{ (taskResult.outputs.confidence * 100).toFixed(1) }}%</div>
                                            <div v-if="taskResult.outputs.timestamp">Horodatage: {{ new Date(taskResult.outputs.timestamp).toLocaleTimeString() }}</div>
                                        </div>
                                    </div>
                                </div>
                            </q-timeline-entry>
                        </q-timeline>
                    </q-card-section>
                </q-card>

                <!-- Résultats finaux -->
                <q-card v-if="workflowStore.lastResult.results && Object.keys(workflowStore.lastResult.results).length > 0" flat bordered>
                    <q-card-section>
                        <div class="text-subtitle1 q-mb-md">
                            <q-icon name="emoji_events" class="q-mr-xs" />
                            Résultats finaux
                        </div>

                        <div v-for="(result, key) in workflowStore.lastResult.results" :key="key" class="q-mb-md">
                            <q-card flat bordered class="bg-amber-1">
                                <q-card-section>
                                    <div class="text-subtitle2">{{ result.id || `Résultat ${key}` }}</div>
                                    <div class="text-caption text-grey-7 q-mb-sm">Type: {{ result.type }}</div>
                                    
                                    <div v-if="result.result?.text" class="text-body1">
                                        "{{ result.result.text }}"
                                    </div>
                                    
                                    <div v-if="result.result?.image_url" class="q-mt-sm">
                                        <q-img :src="result.result.image_url" :ratio="16/9" class="rounded-borders" />
                                    </div>
                                </q-card-section>
                                
                                <q-card-actions v-if="collectionStore.hasCurrentCollection">
                                    <q-btn size="sm" color="primary" icon="save_alt" label="Ajouter à la collection" 
                                        @click="saveResultToCollection(result)" />
                                </q-card-actions>
                            </q-card>
                        </div>
                    </q-card-section>
                </q-card>
            </div>

            <div v-else class="text-center q-py-xl text-negative">
                <q-icon name="error" size="3em" class="q-mb-md" />
                <div class="text-h6">Erreur d'exécution</div>
                <div class="text-body2">
                    {{ workflowStore.error || 'Une erreur est survenue' }}
                </div>
            </div>
        </q-tab-panel>
        </q-tab-panels>
    </div>

    <!-- PANNEAU LATERAL -->
    <div class="col-3">
        <!-- Palette des tâches disponibles -->
        <q-card flat bordered class="q-mb-md">
            <q-card-section>
                <div class="text-subtitle1 q-mb-sm">
                    <q-icon name="palette" class="q-mr-sm" />
                    {{ getSectionTitle(currentTab) }}
                </div>

                <div class="task-palette">
                    <div v-for="task in getFilteredTasks()" :key="task.type"
                        class="task-palette-item q-pa-sm cursor-pointer"
                        @click="addTaskToWorkflow(task.type, currentTab)">
                        <div class="row items-center">
                            <q-icon :name="task.icon || 'task'" class="q-mr-sm" />
                            <div class="col">
                                <div class="text-body2">{{ task.name }}</div>
                                <div class="text-caption text-grey-6">{{ task.description }}</div>
                            </div>
                            <q-icon name="add" />
                        </div>
                    </div>
                </div>
            </q-card-section>
        </q-card>

        <!-- Actions du workflow -->
        <q-card flat bordered>
            <q-card-section>
                <div class="text-subtitle1 q-mb-sm">
                    <q-icon name="play_arrow" class="q-mr-sm" />
                    Actions
                </div>

                <div class="q-gutter-sm">
                    <q-btn color="primary" icon="play_arrow" label="Exécuter" @click="executeWorkflow"
                        :loading="isExecuting" :disable="!canExecuteWorkflow" class="full-width" />

                    <q-btn color="secondary" icon="save" label="Sauvegarder" @click="saveWorkflow" outline
                        class="full-width" />

                    <q-btn color="grey-7" icon="clear" label="Vider" @click="clearWorkflow" outline
                        class="full-width" />
                </div>
            </q-card-section>
        </q-card>
    </div>
    </div>
    </div>

    <!-- DIALOG D'ÉDITION DE TÂCHE -->
    <q-dialog v-model="showTaskEditDialog" persistent>
        <q-card style="min-width: 500px;">
            <q-card-section class="row items-center q-pb-none">
                <div class="text-h6">
                    <q-icon :name="getDefinition(editingTask?.type)?.icon || 'edit'" class="q-mr-sm" />
                    Éditer : {{ getDefinition(editingTask?.type)?.name || editingTask?.type }}
                </div>
                <q-space />
                <q-btn icon="close" flat round dense @click="closeTaskEditDialog" />
            </q-card-section>

            <q-card-section>
                <div class="text-body2 text-grey-6 q-mb-md">
                    {{ getDefinition(editingTask?.type)?.description }}
                </div>

                <!-- Debug info -->
                <div class="text-caption text-grey-5 q-mb-md" v-if="$q.debug">
                    TaskForm: {{ JSON.stringify(taskForm, null, 2) }}
                </div>

                <!-- Formulaire d'édition des inputs -->
                <div v-if="editingTask">
                    <div v-for="(inputDef, inputKey) in getDefinition(editingTask.type)?.inputs" :key="inputKey" class="q-mb-md">
                        <!-- Label pour tous les types sauf boolean (checkbox a déjà son label) -->
                        <div v-if="inputDef.type !== 'boolean'" class="text-caption text-weight-medium q-mb-xs">
                            {{ inputDef.label }}
                            <span v-if="inputDef.required" class="text-negative">*</span>
                        </div>

                        <!-- Input texte -->
                        <q-input
                            v-if="inputDef.type === 'text'"
                            v-model="taskForm[inputKey]"
                            :placeholder="inputDef.placeholder"
                            :hint="inputDef.hint"
                            :type="inputDef.multiline ? 'textarea' : 'text'"
                            :rows="inputDef.multiline ? 3 : 1"
                            outlined
                            dense
                        >
                            <template v-slot:prepend v-if="inputDef.acceptsVariable !== false">
                                <q-btn
                                    dense
                                    flat
                                    icon="code"
                                    color="primary"
                                    @click="showVariableSelector(editingTask.id, inputKey)"
                                    size="sm"
                                >
                                    <q-tooltip>Sélectionner une variable</q-tooltip>
                                </q-btn>
                            </template>
                        </q-input>

                        <!-- Input select -->
                        <q-select
                            v-else-if="inputDef.type === 'select'"
                            v-model="taskForm[inputKey]"
                            :options="inputDef.options"
                            :hint="inputDef.hint"
                            outlined
                            dense
                            emit-value
                            map-options
                        />

                        <!-- Input number -->
                        <q-input
                            v-else-if="inputDef.type === 'number'"
                            v-model.number="taskForm[inputKey]"
                            :min="inputDef.min"
                            :max="inputDef.max"
                            :step="inputDef.step || 0.1"
                            :hint="inputDef.hint"
                            type="number"
                            outlined
                            dense
                        />

                        <!-- Input boolean (checkbox) -->
                        <q-checkbox
                            v-else-if="inputDef.type === 'boolean'"
                            v-model="taskForm[inputKey]"
                            :label="inputDef.label"
                            :hint="inputDef.hint"
                        />

                        <!-- Input image (sélection depuis les collections) -->
                        <div v-else-if="inputDef.type === 'image'">
                            <q-input
                                :model-value="getImageInputDisplayValue(taskForm[inputKey])"
                                :label="inputDef.label"
                                :hint="inputDef.hint || 'Sélectionnez ou ajoutez une image'"
                                readonly
                                outlined
                                dense
                            >
                                <template v-slot:prepend v-if="inputDef.acceptsVariable !== false">
                                    <q-btn
                                        dense
                                        flat
                                        icon="code"
                                        color="primary"
                                        @click="showVariableSelector(editingTask.id, inputKey)"
                                        size="sm"
                                    >
                                        <q-tooltip>Sélectionner une variable</q-tooltip>
                                    </q-btn>
                                </template>
                                
                                <template v-slot:append>
                                    <q-btn-group>
                                        <q-btn
                                            icon="photo_library"
                                            flat
                                            dense
                                            @click="selectImageFromCollection(inputKey)"
                                            title="Choisir une image existante"
                                        />
                                        <q-btn
                                            icon="add_photo_alternate"
                                            flat
                                            dense
                                            @click="uploadImageForInput(inputKey)"
                                            title="Ajouter une nouvelle image"
                                        />
                                        <q-btn
                                            v-if="taskForm[inputKey]"
                                            icon="clear"
                                            flat
                                            dense
                                            @click="taskForm[inputKey] = ''"
                                            title="Supprimer la sélection"
                                        />
                                    </q-btn-group>
                                </template>
                            </q-input>
                            
                            <!-- Preview de l'image sélectionnée -->
                            <div v-if="taskForm[inputKey]" class="q-mt-sm">
                                <!-- Aperçu pour une URL normale -->
                                <q-img
                                    v-if="!taskForm[inputKey].startsWith('{{')"
                                    :src="taskForm[inputKey]"
                                    style="max-width: 200px; max-height: 150px"
                                    fit="contain"
                                    class="rounded-borders"
                                />
                                <!-- Indicateur pour une variable -->
                                <div v-else class="variable-indicator q-pa-md text-center">
                                    <q-icon name="code" size="2rem" color="primary" />
                                    <div class="text-body2 q-mt-xs">Variable utilisée</div>
                                    <div class="text-caption text-grey-6">{{ taskForm[inputKey] }}</div>
                                </div>
                            </div>
                        </div>

                        <!-- Autres types d'inputs peuvent être ajoutés ici -->
                    </div>
                </div>
            </q-card-section>

            <q-card-actions align="right">
                <q-btn flat label="Annuler" @click="closeTaskEditDialog" />
                <q-btn unelevated color="primary" label="Sauvegarder" @click="saveTaskEdit" />
            </q-card-actions>
        </q-card>
    </q-dialog>

    <!-- DIALOG DE SÉLECTION DE VARIABLES -->
    <q-dialog v-model="showVariableDialog">
        <q-card style="min-width: 500px">
            <q-card-section>
                <div class="text-h6">
                    <q-icon name="code" class="q-mr-sm" />
                    Sélectionner une variable
                </div>
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

                <q-list v-if="getAvailableVariables().length > 0">
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
                
                <div v-else class="text-center q-pa-md text-grey-6">
                    <q-icon name="info" size="md" class="q-mb-sm" />
                    <div>Aucune variable disponible</div>
                    <div class="text-caption">
                        Ajoutez des tâches pour créer des variables utilisables
                    </div>
                </div>
            </q-card-section>

            <q-separator />

            <q-card-actions align="right">
                <q-btn flat color="grey" @click="showVariableDialog = false">Annuler</q-btn>
            </q-card-actions>
        </q-card>
    </q-dialog>
</template>

<script setup>
import { ref, computed, onMounted, defineAsyncComponent } from 'vue'
import { useWorkflowStore } from 'src/stores/useWorkflowStore'
import { useCollectionStore } from 'src/stores/useCollectionStore'
import { useQuasar } from 'quasar'
import { api } from 'src/boot/axios'

// Stores
const collectionStore = useCollectionStore()

// Émissions
const emit = defineEmits(['openCollections', 'openBuilder', 'loadWorkflow'])
import {
    TASK_DEFINITIONS,
    getTaskDefinition,
    getDefinition,
    generateTaskId,
    isInputTask,
    isOutputTask
} from 'src/config/taskDefinitions'
import { INPUT_DEFINITIONS, OUTPUT_DEFINITIONS } from 'src/config/ioDefinitions'
import { migrateWorkflowToV2, validateWorkflowV2 } from 'src/utils/workflowMigration'
import draggable from 'vuedraggable'
import TaskCard from './TaskCard.vue'

// Stores et composables
const workflowStore = useWorkflowStore()
const $q = useQuasar()

// Reactive variables
const currentTab = ref('inputs')
const isExecuting = ref(false)
const savingToCollection = ref(false)
const currentWorkflow = ref({
    name: 'Nouveau workflow',
    inputs: [],
    tasks: [],
    outputs: []
})

// Variables pour l'édition de tâches
const showTaskEditDialog = ref(false)
const editingTask = ref(null)
const editingTaskSection = ref('')
const taskForm = ref({})

// Variables pour la sélection de variables
const showVariableDialog = ref(false)
const currentTaskSelector = ref(null)
const variableSearch = ref('')

// Computed
const canExecuteWorkflow = computed(() => {
    return currentWorkflow.value.inputs.length > 0 ||
        currentWorkflow.value.tasks.length > 0 ||
        currentWorkflow.value.outputs.length > 0
})



// Functions pour les sections
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

const getFilteredTasks = () => {
    if (currentTab.value === 'inputs') {
        return Object.entries(INPUT_DEFINITIONS)
            .map(([type, def]) => ({ type, ...def, category: 'input' }))
    } else if (currentTab.value === 'outputs') {
        return Object.entries(OUTPUT_DEFINITIONS)
            .map(([type, def]) => ({ type, ...def, category: 'output' }))
    } else {
        return Object.entries(TASK_DEFINITIONS)
            .filter(([type, def]) => !isInputTask(type) && !isOutputTask(type))
            .map(([type, def]) => ({ type, ...def, category: 'processing' }))
    }
}

// Functions pour la gestion des tâches
const addTaskToWorkflow = (taskType, section) => {
    const taskDefinition = getTaskDefinition(taskType) ||
        INPUT_DEFINITIONS[taskType] ||
        OUTPUT_DEFINITIONS[taskType]

    if (!taskDefinition) {
        console.error('Définition de tâche introuvable:', taskType)
        return
    }

    // Obtenir tous les IDs existants pour éviter les doublons
    const existingIds = [
        ...currentWorkflow.value.inputs.map(t => t.id),
        ...currentWorkflow.value.tasks.map(t => t.id),
        ...currentWorkflow.value.outputs.map(t => t.id)
    ].filter(Boolean)

    const newTask = {
        id: generateTaskId(taskType, existingIds),
        type: taskType,
        inputs: {}
    }

    if (section === 'inputs') {
        currentWorkflow.value.inputs.push(newTask)
    } else if (section === 'outputs') {
        currentWorkflow.value.outputs.push(newTask)
    } else {
        currentWorkflow.value.tasks.push(newTask)
    }

    syncWorkflowWithStore() // Synchroniser avec le store
    
    $q.notify({
        type: 'positive',
        message: `Tâche "${taskDefinition.name}" ajoutée`,
        position: 'top'
    })
}

const deleteTask = (taskId, section) => {
    const sectionArray = currentWorkflow.value[section]
    const index = sectionArray.findIndex(t => t.id === taskId)
    if (index > -1) {
        sectionArray.splice(index, 1)
        syncWorkflowWithStore() // Synchroniser avec le store
    }
}

const moveTaskUp = (taskId, section) => {
    const sectionArray = currentWorkflow.value[section]
    const index = sectionArray.findIndex(t => t.id === taskId)
    if (index > 0) {
        [sectionArray[index], sectionArray[index - 1]] = [sectionArray[index - 1], sectionArray[index]]
    }
}

const moveTaskDown = (taskId, section) => {
    const sectionArray = currentWorkflow.value[section]
    const index = sectionArray.findIndex(t => t.id === taskId)
    if (index < sectionArray.length - 1) {
        [sectionArray[index], sectionArray[index + 1]] = [sectionArray[index + 1], sectionArray[index]]
    }
}

const editTask = (task) => {
    console.log('Éditer tâche:', task)
    editingTask.value = { ...task }
    
    // Déterminer la section de la tâche
    if (currentWorkflow.value.inputs.find(t => t.id === task.id)) {
        editingTaskSection.value = 'inputs'
    } else if (currentWorkflow.value.tasks.find(t => t.id === task.id)) {
        editingTaskSection.value = 'tasks'
    } else if (currentWorkflow.value.outputs.find(t => t.id === task.id)) {
        editingTaskSection.value = 'outputs'
    }
    
    // Récupérer la définition de la tâche pour initialiser toutes les propriétés
    const taskDef = getDefinition(task.type)
    const initialForm = {}
    
    // Initialiser chaque input avec sa valeur actuelle ou sa valeur par défaut
    if (taskDef?.inputs) {
        Object.keys(taskDef.inputs).forEach(key => {
            const inputDef = taskDef.inputs[key]
            
            // Pour les tâches d'input, les valeurs sont directement sur la tâche
            let currentValue
            if (task.type === 'text_input' || task.type === 'input_text') {
                currentValue = task[key]
            } else {
                // Pour les autres tâches, les valeurs sont dans inputs ou input (compatibilité)
                currentValue = task.inputs?.[key] || task.input?.[key]
            }
            
            if (currentValue !== undefined) {
                initialForm[key] = currentValue
            } else if (inputDef.default !== undefined) {
                initialForm[key] = inputDef.default
            } else if (inputDef.type === 'text') {
                initialForm[key] = ''
            } else if (inputDef.type === 'number') {
                initialForm[key] = inputDef.min || 0
            } else if (inputDef.type === 'select' && inputDef.options?.[0]) {
                initialForm[key] = inputDef.options[0].value
            } else if (inputDef.type === 'boolean') {
                initialForm[key] = inputDef.default !== undefined ? inputDef.default : false
            } else {
                initialForm[key] = ''
            }
        })
    }
    
    taskForm.value = initialForm
    console.log('TaskForm initialisé avec:', taskForm.value)
    
    showTaskEditDialog.value = true
}

const onTaskOrderChanged = () => {
    // Réagir aux changements d'ordre via drag&drop
}

// Fonctions d'édition de tâches
const saveTaskEdit = () => {
    if (!editingTask.value) return
    
    console.log('💾 Sauvegarde tâche:', {
        taskId: editingTask.value.id,
        taskType: editingTask.value.type,
        section: editingTaskSection.value,
        formValues: taskForm.value
    })
    
    // Mettre à jour la tâche avec les nouvelles valeurs
    const updatedTask = {
        ...editingTask.value
    }
    
    // Pour les tâches d'input, mettre les valeurs directement sur la tâche
    if (editingTask.value.type === 'text_input' || editingTask.value.type === 'input_text' || editingTask.value.type === 'image_input') {
        // Mettre userInput directement sur la tâche pour les inputs
        Object.assign(updatedTask, taskForm.value)
        // Nettoyer les anciennes structures si elles existent
        delete updatedTask.input
        delete updatedTask.inputs
        console.log('💾 Tâche input mise à jour:', updatedTask)
    } else {
        // Pour les autres tâches, utiliser la structure inputs (format v2)
        updatedTask.inputs = { ...taskForm.value }
        // Supprimer l'ancienne propriété input si elle existe
        delete updatedTask.input
        console.log('💾 Tâche standard mise à jour:', updatedTask)
    }
    
    // Trouver et remplacer la tâche dans la bonne section
    const section = currentWorkflow.value[editingTaskSection.value]
    const taskIndex = section.findIndex(t => t.id === editingTask.value.id)
    if (taskIndex !== -1) {
        section[taskIndex] = updatedTask
        console.log('💾 Tâche sauvegardée dans le workflow à l\'index:', taskIndex)
        syncWorkflowWithStore() // Synchroniser avec le store
    } else {
        console.error('❌ Impossible de trouver la tâche dans la section:', editingTaskSection.value)
    }
    
    closeTaskEditDialog()
}

const closeTaskEditDialog = () => {
    showTaskEditDialog.value = false
    editingTask.value = null
    editingTaskSection.value = ''
    taskForm.value = {}
}

// Synchroniser le workflow avec le store
const syncWorkflowWithStore = () => {
    workflowStore.setCurrentBuilderWorkflow({
        template: null,
        workflow: currentWorkflow.value,
        inputs: {},
        inputValues: {}
    })
}

const updateTaskFormValue = (key, value) => {
    console.log('Updating task form:', key, '=', value)
    taskForm.value = {
        ...taskForm.value,
        [key]: value
    }
}

// Fonctions de gestion des variables
const showVariableSelector = (taskId, inputKey) => {
    currentTaskSelector.value = { taskId, inputKey }
    showVariableDialog.value = true
}

const selectVariable = (variablePath) => {
    if (currentTaskSelector.value) {
        const key = currentTaskSelector.value.inputKey
        taskForm.value = {
            ...taskForm.value,
            [key]: variablePath
        }
    }
    showVariableDialog.value = false
}

const getAvailableVariables = () => {
    const variables = []
    
    // Variables des tâches précédentes (inputs, tasks, outputs)
    const allTasks = [
        ...currentWorkflow.value.inputs.map(t => ({ ...t, section: 'inputs' })),
        ...currentWorkflow.value.tasks.map(t => ({ ...t, section: 'tasks' })),
        ...currentWorkflow.value.outputs.map(t => ({ ...t, section: 'outputs' }))
    ]
    
    allTasks.forEach(task => {
        // Ne pas inclure la tâche en cours d'édition
        if (task.id === editingTask.value?.id) return
        
        const taskDef = getDefinition(task.type)
        if (taskDef?.outputs) {
            Object.keys(taskDef.outputs).forEach(outputKey => {
                const output = taskDef.outputs[outputKey]
                variables.push({
                    path: `{{${task.id}.${outputKey}}}`,
                    icon: getVariableIcon(output.type),
                    color: 'primary',
                    description: `${taskDef.name} - ${output.description || outputKey}`
                })
            })
        }
    })
    
    return variables.filter(v => 
        !variableSearch.value || 
        v.path.toLowerCase().includes(variableSearch.value.toLowerCase()) ||
        v.description.toLowerCase().includes(variableSearch.value.toLowerCase())
    )
}

const getVariableIcon = (type) => {
    const icons = {
        'text': 'text_fields',
        'image': 'image',
        'images': 'collections',
        'video': 'videocam',
        'object': 'data_object'
    }
    return icons[type] || 'help'
}

const showTaskPalette = (section) => {
    // Déjà géré par le panneau latéral
    currentTab.value = section
}

// Utilisation des médias sélectionnés comme entrées de workflow
const useSelectedAsInput = (type) => {
    const selectedMedias = collectionStore.selectedMediasForWorkflow

    if (selectedMedias.length === 0) {
        $q.notify({
            type: 'warning',
            message: 'Aucun média sélectionné',
            position: 'top'
        })
        return
    }

    if (type === 'single' && selectedMedias.length === 1) {
        // Utiliser comme entrée unique (image)
        const media = selectedMedias[0]

        // Créer un input de type image avec l'URL du média
        if (currentWorkflow.value.inputValues) {
            currentWorkflow.value.inputValues.image = media.url
        }

        $q.notify({
            type: 'positive',
            message: `Média "${media.mediaId.slice(0, 8)}" utilisé comme entrée unique`,
            position: 'top'
        })

    } else if (type === 'multiple') {
        // Utiliser comme entrées multiples (images)
        const mediaUrls = selectedMedias.map(m => m.url)

        if (currentWorkflow.value.inputValues) {
            currentWorkflow.value.inputValues.images = mediaUrls
        }

        $q.notify({
            type: 'positive',
            message: `${selectedMedias.length} médias utilisés comme entrées multiples`,
            position: 'top'
        })
    }

    // Nettoyer la sélection
    collectionStore.clearWorkflowSelection()
}

const getMediaById = (mediaId) => {
    return collectionStore.currentCollectionMedias?.find(m => m.mediaId === mediaId)
}

// Fonctions pour les inputs d'image
const getImageInputDisplayValue = (imageUrl) => {
    if (!imageUrl) return 'Aucune image sélectionnée'
    
    // Vérifier si c'est une variable (commence et finit par {{ }})
    if (imageUrl.startsWith('{{') && imageUrl.endsWith('}}')) {
        return `Variable: ${imageUrl}`
    }
    
    // Essayer de trouver le média dans la collection pour afficher son nom
    const media = collectionStore.currentCollectionMedias?.find(m => m.url === imageUrl)
    if (media) {
        return media.description || `Image ${media.mediaId.slice(0, 8)}...`
    }
    
    // Sinon, extraire le nom du fichier de l'URL
    return imageUrl.split('/').pop() || 'Image sélectionnée'
}

const selectImageFromCollection = (inputKey) => {
    if (!collectionStore.currentCollectionMedias || collectionStore.currentCollectionMedias.length === 0) {
        $q.notify({
            type: 'warning',
            message: 'Aucune image disponible dans la collection actuelle',
            position: 'top'
        })
        return
    }
    
    // Utiliser MediaSelector (module collection) pour sélectionner une image
    $q.dialog({
        component: defineAsyncComponent(() => import('./MediaSelector.vue')),
        componentProps: {
            modelValue: taskForm.value[inputKey] || null,
            label: 'Sélectionner une image',
            accept: ['image'],
            multiple: false,
            hidePreview: true
        }
    }).onOk(selectedUrl => {
        if (selectedUrl) {
            taskForm.value[inputKey] = selectedUrl
            
            // Trouver le média sélectionné pour afficher son nom
            const selectedMedia = collectionStore.currentCollectionMedias.find(m => m.url === selectedUrl)
            
            $q.notify({
                type: 'positive',
                message: `Image "${selectedMedia?.description || selectedMedia?.originalName || 'sélectionnée'}" choisie`,
                position: 'top'
            })
        }
    })
}

const uploadImageForInput = (inputKey) => {
    // Créer un input file temporaire
    const fileInput = document.createElement('input')
    fileInput.type = 'file'
    fileInput.accept = 'image/*'
    fileInput.style.display = 'none'
    
    fileInput.onchange = async (event) => {
        const file = event.target.files[0]
        if (!file) return
        
        try {
            $q.loading.show({
                message: 'Upload de l\'image en cours...'
            })
            
            // Vérifier qu'une collection est sélectionnée
            if (!collectionStore.currentCollection) {
                $q.notify({
                    type: 'warning',
                    message: 'Veuillez sélectionner une collection avant d\'uploader',
                    position: 'top'
                })
                return
            }
            
            // Créer un FormData pour l'upload
            const formData = new FormData()
            formData.append('files', file) // Utiliser 'files' comme dans CollectionImageUpload
            formData.append('description', file.name)
            
            // Uploader l'image via l'API
            const uploadUrl = `/collections/${collectionStore.currentCollection.id}/upload`
            const response = await api.post(uploadUrl, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            })
            
            if (!response.data.success) {
                throw new Error(response.data.message || 'Erreur lors de l\'upload')
            }
            
            const result = response.data
            
            // Actualiser les médias de la collection
            await collectionStore.loadCollectionMedias(collectionStore.currentCollection.id)
            
            // Utiliser l'URL de l'image uploadée (premier résultat)
            const uploadedMedia = result.results?.[0]
            if (uploadedMedia) {
                taskForm.value[inputKey] = uploadedMedia.url
            }
            
            $q.notify({
                type: 'positive',
                message: 'Image uploadée et sélectionnée avec succès',
                position: 'top'
            })
            
        } catch (error) {
            console.error('Erreur upload:', error)
            $q.notify({
                type: 'negative',
                message: 'Erreur lors de l\'upload de l\'image',
                position: 'top'
            })
        } finally {
            $q.loading.hide()
            document.body.removeChild(fileInput)
        }
    }
    
    // Ajouter temporairement à la page et cliquer
    document.body.appendChild(fileInput)
    fileInput.click()
}

// Sauvegarde des résultats dans la collection
const saveResultsToCollection = async () => {
    if (!workflowStore.lastResult?.results) {
        $q.notify({
            type: 'warning',
            message: 'Aucun résultat à sauvegarder',
            position: 'top'
        })
        return
    }

    try {
        savingToCollection.value = true

        let savedCount = 0
        for (const result of workflowStore.lastResult.results) {
            if (result.type === 'image' || result.type === 'video') {
                try {
                    await collectionStore.addMediaToCollection(collectionStore.currentCollection.id, {
                        url: result.url || result.path,
                        mediaId: result.mediaId || `workflow-${Date.now()}-${savedCount}`,
                        description: result.description || `Généré par workflow "${currentWorkflow.value.workflow?.name || 'Sans nom'}" le ${new Date().toLocaleDateString()}`
                    })
                    savedCount++
                } catch (error) {
                    console.error('Erreur sauvegarde média individuel:', error)
                }
            }
        }

        if (savedCount > 0) {
            $q.notify({
                type: 'positive',
                message: `${savedCount} résultat(s) ajouté(s) à la collection "${collectionStore.currentCollection.name}"`,
                position: 'top'
            })

            // Recharger la collection pour voir les nouveaux médias
            await collectionStore.viewCollection(collectionStore.currentCollection.id)
        } else {
            $q.notify({
                type: 'warning',
                message: 'Aucun média n\'a pu être sauvegardé',
                position: 'top'
            })
        }

    } catch (error) {
        console.error('Erreur sauvegarde résultats:', error)
        $q.notify({
            type: 'negative',
            message: 'Erreur lors de la sauvegarde des résultats',
            position: 'top'
        })
    } finally {
        savingToCollection.value = false
    }
}

// Actions du workflow
const executeWorkflow = async () => {
    isExecuting.value = true

    try {
        // Ajouter un ID au workflow si il n'en a pas
        if (!currentWorkflow.value.id) {
            currentWorkflow.value.id = `workflow_${Date.now()}`
            currentWorkflow.value.name = currentWorkflow.value.name || 'Workflow personnalisé'
            currentWorkflow.value.description = 'Workflow créé avec le Builder'
        }

        // Convertir le workflow au format attendu par le store
        const migratedWorkflow = migrateWorkflowToV2(currentWorkflow.value)
        console.log('Workflow migré:', migratedWorkflow)

        if (!validateWorkflowV2(migratedWorkflow)) {
            throw new Error('Workflow invalide')
        }

        const workflowForExecution = {
            template: null, // Pas de template pour un workflow custom
            workflow: migratedWorkflow,
            inputs: {}, // Pas d'inputs définis pour un workflow custom
            inputValues: {} // Pas d'inputs séparés pour un workflow Builder
        }

        console.log('Workflow pour exécution:', workflowForExecution)

        // Définir le workflow directement dans le store
        workflowStore.currentWorkflow = workflowForExecution

        // Exécuter le workflow
        await workflowStore.executeCurrentWorkflow()

        // Basculer vers l'onglet des résultats
        currentTab.value = 'results'

        $q.notify({
            type: 'positive',
            message: 'Workflow exécuté avec succès',
            position: 'top'
        })

        console.log('Résultat:', workflowStore.lastResult)
    } catch (error) {
        console.error('Erreur exécution:', error)
        $q.notify({
            type: 'negative',
            message: `Erreur: ${error.message}`,
            position: 'top'
        })
    } finally {
        isExecuting.value = false
    }
}

// Fonctions helper pour l'affichage des résultats
const getTaskIcon = (taskType) => {
    const iconMap = {
        'text_input': 'text_fields',
        'input_text': 'text_fields', 
        'text_output': 'output',
        'enhance_prompt': 'auto_fix_high',
        'generate_image': 'image',
        'edit_image': 'edit',
        'analyze_image': 'analytics',
        'generate_video': 'videocam',
        'default': 'task'
    }
    return iconMap[taskType] || iconMap.default
}

const getTaskTitle = (taskType) => {
    const titleMap = {
        'text_input': 'Saisie de texte',
        'input_text': 'Saisie de texte',
        'text_output': 'Sortie de texte', 
        'enhance_prompt': 'Amélioration de prompt',
        'generate_image': 'Génération d\'image',
        'edit_image': 'Édition d\'image',
        'analyze_image': 'Analyse d\'image',
        'generate_video': 'Génération vidéo',
        'default': 'Tâche'
    }
    return titleMap[taskType] || titleMap.default
}

const saveWorkflow = () => {
    const currentName = currentWorkflow.value.name || 'Nouveau workflow'
    const isExistingWorkflow = currentWorkflow.value.id && workflowStore.savedWorkflows.find(w => w.id === currentWorkflow.value.id)
    
    $q.dialog({
        title: isExistingWorkflow ? 'Mettre à jour le workflow' : 'Sauvegarder le workflow',
        message: isExistingWorkflow ? 
            `Modifier le nom ou sauvegarder sous "${currentName}"` : 
            'Donnez un nom à votre workflow',
        prompt: {
            model: currentName,
            type: 'text',
            placeholder: 'Nom du workflow'
        },
        ok: {
            label: isExistingWorkflow ? 'Mettre à jour' : 'Sauvegarder',
            color: 'primary'
        },
        cancel: {
            label: 'Annuler',
            color: 'grey'
        }
    }).onOk(name => {
        if (!name.trim()) {
            $q.notify({
                type: 'negative',
                message: 'Le nom est requis',
                position: 'top'
            })
            return
        }

        // Migrer le workflow au format v2 avant sauvegarde
        const migratedWorkflow = migrateWorkflowToV2(currentWorkflow.value)
        
        const savedWorkflow = workflowStore.saveWorkflow(
            name.trim(),
            `Workflow créé avec le Builder - ${new Date().toLocaleDateString()}`,
            {
                workflow: migratedWorkflow,
                inputs: {},
                inputValues: {}
            }
        )

        if (savedWorkflow) {
            // Mettre à jour le nom du workflow en cours
            currentWorkflow.value.name = name.trim()
            currentWorkflow.value.id = savedWorkflow.id
            
            $q.notify({
                type: 'positive',
                message: `Workflow "${name}" sauvegardé`,
                position: 'top'
            })
        }
    })
}

const clearWorkflow = () => {
    currentWorkflow.value = {
        inputs: [],
        tasks: [],
        outputs: []
    }

    $q.notify({
        type: 'info',
        message: 'Workflow vidé',
        position: 'top'
    })
}

// Initialisation du composant
onMounted(() => {
    console.log('WorkflowBuilder: Initialisation')
    
    // Charger le workflow persisté depuis le store
    const persistedWorkflow = workflowStore.getCurrentBuilderWorkflow()
    
    if (persistedWorkflow && persistedWorkflow.workflow) {
        console.log('WorkflowBuilder: Chargement du workflow persisté:', persistedWorkflow)
        currentWorkflow.value = {
            name: persistedWorkflow.workflow.name || persistedWorkflow.name || 'Workflow en cours',
            inputs: persistedWorkflow.workflow.inputs || [],
            tasks: persistedWorkflow.workflow.tasks || [],
            outputs: persistedWorkflow.workflow.outputs || []
        }
        
        $q.notify({
            type: 'info',
            message: 'Workflow restauré',
            position: 'top',
            timeout: 2000
        })
    } else {
        console.log('WorkflowBuilder: Aucun workflow persisté trouvé')
    }
    
    // Charger les workflows sauvegardés
    workflowStore.loadSavedWorkflows()
})
</script>

<style scoped>
.workflow-builder {
    padding: 0;
}

.task-container {
    min-height: 100px;
    border: 2px dashed #e0e0e0;
    border-radius: 8px;
    padding: 16px;
}

.task-palette-item {
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    margin-bottom: 8px;
    transition: all 0.2s ease;
}

.task-palette-item:hover {
    background-color: #f5f5f5;
    border-color: #1976d2;
    transform: translateX(4px);
}

.media-thumb {
    transition: all 0.2s ease;
}

.media-thumb:hover {
    transform: scale(1.05);
}

.media-thumb.selected {
    border-color: #1976d2;
    border-width: 2px;
    transform: scale(0.95);
}

.video-thumb {
    border-radius: 4px;
}

/* Styles pour la sélection de workflow */
.q-checkbox {
    background: rgba(255, 255, 255, 0.9);
    border-radius: 4px;
}
</style>