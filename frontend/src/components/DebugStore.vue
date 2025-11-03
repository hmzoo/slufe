<template>
  <q-card v-if="isDevelopment" flat bordered class="q-mt-md bg-purple-1">
    <q-card-section>
      <div class="row items-center">
        <q-icon name="bug_report" color="purple" class="q-mr-sm" />
        <div class="text-subtitle2 text-purple-8">
          État du Store (Debug)
        </div>
        <q-space />
        <q-btn
          flat
          dense
          round
          icon="refresh"
          color="purple"
          size="sm"
          @click="forceUpdate"
        >
          <q-tooltip>Rafraîchir</q-tooltip>
        </q-btn>
      </div>
    </q-card-section>
    
    <q-separator />
    
    <q-card-section class="q-pa-sm">
      <div class="text-caption">
        <div class="row q-gutter-xs q-mb-xs">
          <q-chip 
            dense 
            :color="prompt ? 'positive' : 'grey'" 
            text-color="white"
            size="sm"
          >
            <q-icon name="edit_note" size="xs" class="q-mr-xs" />
            Prompt: {{ prompt ? '✓' : '✗' }}
          </q-chip>
          
          <q-chip 
            dense 
            :color="enhancedPrompt ? 'positive' : 'grey'" 
            text-color="white"
            size="sm"
          >
            <q-icon name="auto_awesome" size="xs" class="q-mr-xs" />
            Amélioré: {{ enhancedPrompt ? '✓' : '✗' }}
          </q-chip>
          
          <q-chip 
            dense 
            :color="imageDescriptions.length > 0 ? 'positive' : 'grey'" 
            text-color="white"
            size="sm"
          >
            <q-icon name="image_search" size="xs" class="q-mr-xs" />
            Descriptions: {{ imageDescriptions.length }}
          </q-chip>
          
          <q-chip 
            dense 
            :color="result ? 'positive' : 'grey'" 
            text-color="white"
            size="sm"
          >
            <q-icon name="image" size="xs" class="q-mr-xs" />
            Résultat: {{ result ? '✓' : '✗' }}
          </q-chip>
        </div>
        
        <div class="text-grey-7 q-mt-xs" style="font-size: 10px;">
          <div v-if="!result">
            ❌ Pas de résultat → Cliquez sur "Générer" pour voir le bloc d'infos
          </div>
          <div v-else-if="!enhancedPrompt && imageDescriptions.length === 0">
            ⚠️ Résultat OK mais données enrichies manquantes
          </div>
          <div v-else>
            ✅ Tout est OK ! Le bloc d'infos devrait s'afficher.
          </div>
        </div>
        
        <!-- Détails expandables -->
        <q-expansion-item
          dense
          label="Voir les détails"
          header-class="text-purple-8"
          class="q-mt-xs"
        >
          <q-card flat bordered class="q-pa-sm bg-white">
            <div class="text-caption">
              <div><strong>Prompt:</strong></div>
              <div class="q-pl-sm text-grey-8">{{ prompt || '(vide)' }}</div>
              
              <div class="q-mt-xs"><strong>Prompt amélioré:</strong></div>
              <div class="q-pl-sm text-grey-8">
                {{ enhancedPrompt ? enhancedPrompt.substring(0, 100) + (enhancedPrompt.length > 100 ? '...' : '') : '(vide)' }}
              </div>
              
              <div class="q-mt-xs"><strong>Descriptions ({{ imageDescriptions.length }}):</strong></div>
              <div v-if="imageDescriptions.length === 0" class="q-pl-sm text-grey-8">(aucune)</div>
              <div v-else class="q-pl-sm">
                <div 
                  v-for="(desc, index) in imageDescriptions" 
                  :key="index"
                  class="text-grey-8"
                  style="font-size: 10px;"
                >
                  {{ index + 1 }}. {{ desc ? desc.substring(0, 50) + '...' : '(vide)' }}
                </div>
              </div>
              
              <div class="q-mt-xs"><strong>Résultat:</strong></div>
              <div class="q-pl-sm text-grey-8">
                {{ result ? `Type: ${result.type}, URL: ${result.resultUrl ? '✓' : '✗'}` : '(null)' }}
              </div>
            </div>
          </q-card>
        </q-expansion-item>
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useMainStore } from 'src/stores/useMainStore';

const store = useMainStore();
const isDevelopment = process.env.DEV;
const updateKey = ref(0);

const prompt = computed(() => {
  updateKey.value; // Force reactivity
  return store.prompt;
});

const enhancedPrompt = computed(() => {
  updateKey.value;
  return store.enhancedPrompt;
});

const imageDescriptions = computed(() => {
  updateKey.value;
  return store.imageDescriptions || [];
});

const result = computed(() => {
  updateKey.value;
  return store.result;
});

function forceUpdate() {
  updateKey.value++;
}
</script>

<style scoped>
</style>
