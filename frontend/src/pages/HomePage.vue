<template>
  <q-page class="page-container q-pa-md">
    <div class="row q-col-gutter-lg">
      <!-- Colonne gauche - Upload et Prompt -->
      <div class="col-12 col-md-6">
        <!-- Upload d'images -->
        <ImageUploader class="q-mb-lg" />

        <!-- Input du prompt -->
        <PromptInput class="q-mb-lg" />
      </div>

      <!-- Colonne droite - Résultats -->
      <div class="col-12 col-md-6">
        <ResultDisplay />

        <!-- Analyse intelligente du workflow -->
        <WorkflowAnalysis
          v-if="workflowAnalysis"
          :analysis="workflowAnalysis"
          @close="workflowAnalysis = null"
          @use-optimized-prompt="useOptimizedPrompt"
          @execute-workflow="executeRecommendedWorkflow"
          @request-images="handleRequestImages"
          class="q-mt-lg"
        />

        <!-- Placeholder si pas de résultat -->
        <q-card v-if="!result && !workflowAnalysis" flat bordered class="text-center q-pa-xl">
          <q-icon name="image_search" size="6rem" color="grey-4" />
          <div class="text-h6 text-grey-6 q-mt-md">
            Aucun résultat pour le moment
          </div>
          <div class="text-caption text-grey-5 q-mt-sm">
            Ajoutez des images et un prompt, puis utilisez les boutons de génération
          </div>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { computed } from 'vue';
import { useMainStore } from 'src/stores/useMainStore';
import { useQuasar } from 'quasar';
import { api } from 'src/boot/axios';
import ImageUploader from 'src/components/ImageUploader.vue';
import PromptInput from 'src/components/PromptInput.vue';
import ResultDisplay from 'src/components/ResultDisplay.vue';
import WorkflowAnalysis from 'src/components/WorkflowAnalysis.vue';

const store = useMainStore();
const $q = useQuasar();

const result = computed(() => store.result);
const workflowAnalysis = computed({
  get: () => store.workflowAnalysis,
  set: (value) => { store.workflowAnalysis = value; }
});

// Méthodes pour WorkflowAnalysis
function useOptimizedPrompt(optimizedPrompt) {
  store.setPrompt(optimizedPrompt);
  $q.notify({
    type: 'positive',
    message: 'Prompt optimisé appliqué',
    position: 'top',
    timeout: 2000,
  });
}

async function executeRecommendedWorkflow(analysisData, keepAnalysisOpen = false) {
  // Rediriger vers PromptInput pour l'exécution
  // Cette fonction sera gérée par PromptInput
  console.log('executeRecommendedWorkflow appelé depuis HomePage');
}

function handleRequestImages(imagesNeeded) {
  $q.notify({
    type: 'info',
    message: `Ce workflow nécessite ${imagesNeeded} image(s)`,
    caption: 'Veuillez uploader les images requises',
    position: 'top',
    icon: 'info',
    timeout: 5000,
  });
}

</script>

<style scoped lang="scss">
.page-container {
  max-width: 1400px;
  margin: 0 auto;
}
</style>
