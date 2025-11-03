<template>
  <q-card flat bordered class="q-mt-md info-preview-card">
    <q-card-section>
      <div class="text-h6 text-secondary">
        <q-icon name="preview" size="sm" class="q-mr-sm" />
        Aperçu des Informations
      </div>
      <div class="text-caption text-grey-6">
        Les données seront utilisées lors de la génération
      </div>
    </q-card-section>

    <q-separator />

    <!-- Prompt original -->
    <q-card-section v-if="prompt">
      <div class="text-subtitle2 text-weight-bold text-grey-8 q-mb-sm">
        <q-icon name="edit_note" size="sm" class="q-mr-xs" />
        Prompt original :
      </div>
      <div class="text-body2 q-pl-md prompt-text">
        {{ prompt }}
      </div>
    </q-card-section>

    <q-separator inset v-if="prompt && enhancedPrompt" />

    <!-- Prompt amélioré -->
    <q-card-section v-if="enhancedPrompt">
      <div class="text-subtitle2 text-weight-bold text-primary q-mb-sm">
        <q-icon name="auto_awesome" size="sm" class="q-mr-xs" />
        Prompt amélioré :
      </div>
      <div class="text-body2 q-pl-md prompt-text enhanced">
        {{ enhancedPrompt }}
      </div>
      
      <div class="q-mt-sm">
        <q-btn
          flat
          dense
          size="sm"
          color="primary"
          icon="edit"
          label="Modifier"
          @click="editEnhancedPrompt"
        />
        <q-btn
          flat
          dense
          size="sm"
          color="negative"
          icon="close"
          label="Supprimer"
          @click="clearEnhancedPrompt"
        />
      </div>
    </q-card-section>

    <q-separator inset v-if="(prompt || enhancedPrompt) && imageDescriptions.length > 0" />

    <!-- Descriptions des images -->
    <q-card-section v-if="imageDescriptions.length > 0">
      <div class="text-subtitle2 text-weight-bold text-info q-mb-sm">
        <q-icon name="image_search" size="sm" class="q-mr-xs" />
        Analyse des images ({{ imageDescriptions.length }}) :
      </div>
      <div 
        v-for="(desc, index) in imageDescriptions" 
        :key="index"
        class="q-pl-md q-mb-md"
      >
        <div class="text-caption text-weight-bold text-grey-7 q-mb-xs">
          Image {{ index + 1 }} :
        </div>
        <div class="text-body2 image-description">
          {{ desc || 'Aucune description disponible' }}
        </div>
      </div>
      
      <div class="q-mt-sm">
        <q-btn
          flat
          dense
          size="sm"
          color="info"
          icon="refresh"
          label="Réanalyser"
          @click="reanalyze"
        />
        <q-btn
          flat
          dense
          size="sm"
          color="negative"
          icon="close"
          label="Supprimer"
          @click="clearDescriptions"
        />
      </div>
    </q-card-section>

    <!-- Message si vide -->
    <q-card-section v-if="!prompt && !enhancedPrompt && imageDescriptions.length === 0">
      <div class="text-center text-grey-6 q-py-md">
        <q-icon name="info" size="3rem" color="grey-4" />
        <div class="q-mt-md">Aucune information pour le moment</div>
        <div class="text-caption q-mt-sm">
          Utilisez "Améliorer le prompt" ou "Analyser les images" pour enrichir vos données
        </div>
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup>
import { computed } from 'vue';
import { useMainStore } from 'src/stores/useMainStore';
import { useQuasar } from 'quasar';

const store = useMainStore();
const $q = useQuasar();

const prompt = computed(() => store.prompt);
const enhancedPrompt = computed(() => store.enhancedPrompt);
const imageDescriptions = computed(() => store.imageDescriptions || []);

function editEnhancedPrompt() {
  $q.dialog({
    title: 'Modifier le prompt amélioré',
    message: 'Éditez le prompt :',
    prompt: {
      model: enhancedPrompt.value,
      type: 'textarea',
      rows: 5,
    },
    cancel: true,
    persistent: true,
  }).onOk((data) => {
    store.setEnhancedPrompt(data);
    store.setPrompt(data); // Mettre à jour aussi le prompt principal
    $q.notify({
      type: 'positive',
      message: 'Prompt modifié',
      position: 'top',
    });
  });
}

function clearEnhancedPrompt() {
  $q.dialog({
    title: 'Supprimer le prompt amélioré',
    message: 'Voulez-vous vraiment supprimer le prompt amélioré ?',
    cancel: true,
    persistent: true,
  }).onOk(() => {
    store.setEnhancedPrompt('');
    $q.notify({
      type: 'info',
      message: 'Prompt amélioré supprimé',
      position: 'top',
    });
  });
}

function clearDescriptions() {
  $q.dialog({
    title: 'Supprimer les descriptions',
    message: 'Voulez-vous vraiment supprimer les descriptions d\'images ?',
    cancel: true,
    persistent: true,
  }).onOk(() => {
    store.setImageDescriptions([]);
    $q.notify({
      type: 'info',
      message: 'Descriptions supprimées',
      position: 'top',
    });
  });
}

function reanalyze() {
  $q.notify({
    type: 'info',
    message: 'Utilisez le bouton "Analyser les images" pour réanalyser',
    position: 'top',
  });
}
</script>

<style scoped lang="scss">
.info-preview-card {
  background: linear-gradient(to bottom, #fafafa 0%, #ffffff 100%);
}

.prompt-text {
  padding: 12px;
  background: #f5f5f5;
  border-left: 3px solid #9c27b0;
  border-radius: 4px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
  
  &.enhanced {
    background: linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%);
    border-left-color: #1976d2;
    font-weight: 500;
  }
}

.image-description {
  padding: 10px;
  background: #e3f2fd;
  border-left: 3px solid #2196f3;
  border-radius: 4px;
  line-height: 1.5;
  font-style: italic;
  color: #424242;
}
</style>
