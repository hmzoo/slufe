<template>
  <div class="workflow-analysis" v-if="analysis">
    <q-card flat bordered class="q-mt-md">
      <q-expansion-item
        expand-separator
        icon="psychology"
        label="Analyse intelligente du workflow"
        :caption="`Confiance: ${(analysis.analysis.confidence * 100).toFixed(0)}%`"
        header-class="bg-purple-1 text-purple-9"
        default-opened
      >
        <q-card-section>
          <!-- Avertissement si fallback -->
          <q-banner 
            v-if="analysis.fallback" 
            class="bg-warning text-white q-mb-md" 
            rounded
            dense
          >
            <template v-slot:avatar>
              <q-icon name="warning" color="white" />
            </template>
            <div class="text-subtitle2">Mode d'analyse basique</div>
            <div class="text-caption">
              {{ analysis.warning || 'L\'analyse IA a échoué, utilisation de règles heuristiques' }}
            </div>
          </q-banner>
          
          <!-- Workflow recommandé -->
          <div class="q-mb-md">
            <div class="text-subtitle1 text-weight-medium q-mb-xs">
              <q-icon 
                :name="getConfidenceIcon(analysis.analysis.confidence)" 
                :color="getConfidenceColor(analysis.analysis.confidence)"
                class="q-mr-sm"
              />
              Workflow recommandé
            </div>
            <q-chip
              :color="getWorkflowColor(analysis.workflow.id)"
              text-color="white"
              icon="auto_fix_high"
              size="md"
            >
              {{ analysis.workflow.name }}
            </q-chip>
            <div class="text-caption text-grey-7 q-mt-xs">
              {{ analysis.workflow.description }}
            </div>
          </div>

          <!-- Barre de confiance -->
          <div class="q-mb-md">
            <div class="text-subtitle2 q-mb-xs">
              Niveau de confiance
            </div>
            <q-linear-progress
              :value="analysis.analysis.confidence"
              :color="getConfidenceColor(analysis.analysis.confidence)"
              size="12px"
              rounded
            >
              <div class="absolute-full flex flex-center">
                <q-badge 
                  color="white" 
                  :text-color="getConfidenceColor(analysis.analysis.confidence)"
                  :label="`${(analysis.analysis.confidence * 100).toFixed(0)}%`"
                />
              </div>
            </q-linear-progress>
          </div>

          <!-- Raisonnement -->
          <div class="q-mb-md">
            <div class="text-subtitle2 q-mb-xs">
              <q-icon name="lightbulb" class="q-mr-sm" />
              Raisonnement
            </div>
            <q-card flat bordered class="bg-grey-1">
              <q-card-section class="text-body2">
                {{ analysis.analysis.reasoning }}
              </q-card-section>
            </q-card>
          </div>

          <!-- Descriptions des images -->
          <div class="q-mb-md" v-if="analysis.imageDescriptions && analysis.imageDescriptions.length > 0">
            <div class="text-subtitle2 q-mb-xs">
              <q-icon name="image_search" class="q-mr-sm" />
              Analyse des images ({{ analysis.imageDescriptions.length }})
            </div>
            <q-list bordered separator class="rounded-borders">
              <q-item v-for="(description, index) in analysis.imageDescriptions" :key="index">
                <q-item-section avatar>
                  <q-avatar color="primary" text-color="white">
                    {{ index + 1 }}
                  </q-avatar>
                </q-item-section>
                <q-item-section>
                  <q-item-label class="text-body2">{{ description }}</q-item-label>
                  <q-item-label caption v-if="description === 'Image non analysée'" class="text-orange">
                    <q-icon name="warning" size="xs" class="q-mr-xs" />
                    L'analyse de cette image a échoué
                  </q-item-label>
                </q-item-section>
                <q-item-section side v-if="description !== 'Image non analysée'">
                  <q-icon name="check_circle" color="positive" />
                </q-item-section>
              </q-item>
            </q-list>
            <div class="text-caption text-grey-6 q-mt-xs q-ml-sm">
              <q-icon name="info" size="xs" class="q-mr-xs" />
              Ces descriptions sont utilisées pour optimiser le prompt et améliorer les résultats
            </div>
          </div>

          <!-- Prompts (original et optimisé) -->
          <div class="q-mb-md">
            <div class="text-subtitle2 q-mb-xs">
              <q-icon name="chat" class="q-mr-sm" />
              Prompts
            </div>
            
            <!-- Workflow multi-étapes : afficher les prompts séparés -->
            <div v-if="analysis.prompts.step1 && analysis.prompts.step2" class="q-mb-md">
              <div class="row q-col-gutter-md q-mb-md">
                <div class="col-12">
                  <q-banner class="bg-blue-1 text-blue-9" rounded>
                    <template v-slot:avatar>
                      <q-icon name="info" color="blue" />
                    </template>
                    <strong>Workflow multi-étapes détecté :</strong> {{ analysis.workflow.name }}
                    <br/>
                    <span class="text-caption">Chaque étape utilisera un prompt spécifique pour de meilleurs résultats</span>
                  </q-banner>
                </div>
              </div>
              
              <!-- Prompt original en premier -->
              <div class="row q-col-gutter-md q-mb-md">
                <div class="col-12">
                  <q-card flat bordered>
                    <q-card-section class="bg-grey-2">
                      <div class="text-caption text-weight-bold text-grey-7">
                        <q-icon name="chat_bubble_outline" class="q-mr-xs" />
                        Prompt original
                      </div>
                    </q-card-section>
                    <q-card-section class="text-body2">
                      {{ analysis.prompts.original }}
                    </q-card-section>
                  </q-card>
                </div>
              </div>
              
              <div class="row q-col-gutter-md">
                <!-- Prompt Étape 1 -->
                <div class="col-12 col-md-6">
                  <q-card flat bordered class="bg-orange-1">
                    <q-card-section class="bg-orange-2">
                      <div class="text-caption text-weight-bold text-orange-9">
                        <q-icon name="edit" class="q-mr-xs" />
                        Étape 1 : Édition
                        <q-badge color="orange" class="q-ml-sm">Prompt dédié</q-badge>
                      </div>
                    </q-card-section>
                    <q-card-section class="text-body2">
                      {{ analysis.prompts.step1 }}
                    </q-card-section>
                  </q-card>
                </div>
                
                <!-- Prompt Étape 2 -->
                <div class="col-12 col-md-6">
                  <q-card flat bordered class="bg-purple-1">
                    <q-card-section class="bg-purple-2">
                      <div class="text-caption text-weight-bold text-purple-9">
                        <q-icon name="movie" class="q-mr-xs" />
                        Étape 2 : Animation
                        <q-badge color="purple" class="q-ml-sm">Prompt dédié</q-badge>
                      </div>
                    </q-card-section>
                    <q-card-section class="text-body2">
                      {{ analysis.prompts.step2 }}
                    </q-card-section>
                  </q-card>
                </div>
              </div>
            </div>
            
            <!-- Workflow simple : afficher original et optimisé -->
            <div v-else class="row q-col-gutter-md">
              <div class="col-12 col-md-6">
                <q-card flat bordered>
                  <q-card-section class="bg-grey-2">
                    <div class="text-caption text-weight-bold text-grey-7">Original</div>
                  </q-card-section>
                  <q-card-section class="text-body2">
                    {{ analysis.prompts.original }}
                  </q-card-section>
                </q-card>
              </div>
              <div class="col-12 col-md-6">
                <q-card flat bordered class="bg-light-green-1">
                  <q-card-section class="bg-light-green-2">
                    <div class="text-caption text-weight-bold text-green-9">
                      Optimisé pour Qwen
                      <q-icon name="check_circle" color="positive" class="q-ml-xs" />
                    </div>
                  </q-card-section>
                  <q-card-section class="text-body2">
                    {{ analysis.prompts.optimized }}
                  </q-card-section>
                </q-card>
              </div>
            </div>
          </div>

          <!-- Suggestions -->
          <div class="q-mb-md" v-if="analysis.analysis.suggestions && analysis.analysis.suggestions.length > 0">
            <div class="text-subtitle2 q-mb-xs">
              <q-icon name="tips_and_updates" class="q-mr-sm" />
              Suggestions d'amélioration
            </div>
            <q-list bordered separator class="rounded-borders">
              <q-item v-for="(suggestion, index) in analysis.analysis.suggestions" :key="index">
                <q-item-section avatar>
                  <q-icon name="arrow_right" color="primary" />
                </q-item-section>
                <q-item-section>
                  <q-item-label class="text-body2">{{ suggestion }}</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </div>

          <!-- Exigences d'images -->
          <div class="q-mb-md">
            <div class="text-subtitle2 q-mb-xs">
              <q-icon name="image" class="q-mr-sm" />
              Exigences d'images
            </div>
            <q-banner
              :class="analysis.requirements.satisfied ? 'bg-green-1' : 'bg-orange-1'"
              class="q-pa-md"
              rounded
            >
              <template v-slot:avatar>
                <q-icon
                  :name="analysis.requirements.satisfied ? 'check_circle' : 'warning'"
                  :color="analysis.requirements.satisfied ? 'positive' : 'warning'"
                  size="md"
                />
              </template>
              <div class="text-body2">
                <strong>Requises:</strong> {{ analysis.requirements.imagesNeeded }} image(s)
                <br />
                <strong>Fournies:</strong> {{ analysis.requirements.imagesProvided }} image(s)
              </div>
            </q-banner>
          </div>

          <!-- Actions -->
          <div class="row q-gutter-sm">
            <q-btn
              color="primary"
              icon="edit"
              label="Utiliser le prompt optimisé"
              unelevated
              @click="useOptimizedPrompt"
            />
            <q-btn
              v-if="analysis.requirements.satisfied"
              color="positive"
              icon="play_arrow"
              :label="`Exécuter: ${analysis.workflow.name}`"
              unelevated
              @click="executeWorkflow"
            />
            <q-btn
              v-else
              color="warning"
              icon="add_photo_alternate"
              label="Ajouter des images"
              outline
              @click="$emit('request-images', analysis.requirements.imagesNeeded)"
            />
            <q-btn
              color="grey"
              icon="close"
              label="Fermer"
              flat
              @click="$emit('close')"
            />
          </div>
        </q-card-section>
      </q-expansion-item>
    </q-card>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue';

const props = defineProps({
  analysis: {
    type: Object,
    default: null
  }
});

const emit = defineEmits(['close', 'use-optimized-prompt', 'execute-workflow', 'request-images']);

function getConfidenceIcon(confidence) {
  if (confidence >= 0.9) return 'verified';
  if (confidence >= 0.7) return 'check_circle';
  return 'help';
}

function getConfidenceColor(confidence) {
  if (confidence >= 0.9) return 'positive';
  if (confidence >= 0.7) return 'orange';
  return 'warning';
}

function getWorkflowColor(workflowId) {
  const colors = {
    'text_to_image': 'secondary',
    'text_to_video': 'deep-purple',
    'image_edit_single': 'accent',
    'image_edit_multiple': 'pink',
    'image_to_video_single': 'indigo',
    'image_to_video_transition': 'purple',
    'edit_then_video': 'teal'
  };
  return colors[workflowId] || 'primary';
}

function useOptimizedPrompt() {
  emit('use-optimized-prompt', props.analysis.prompts.optimized);
}

function executeWorkflow() {
  emit('execute-workflow', props.analysis);
}
</script>

<style scoped>
.workflow-analysis {
  width: 100%;
}
</style>
