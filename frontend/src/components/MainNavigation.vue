<template>
  <q-layout view="hHh lpR fFf">
    <!-- HEADER AVEC NAVIGATION -->
    <q-header elevated class="bg-primary text-white">
      <q-toolbar>
        <q-toolbar-title class="row items-center">
          <q-icon name="account_tree" class="q-mr-sm" />
          SLUFE - Workflow Studio
        </q-toolbar-title>
        
        <q-space />
        
        <!-- NAVIGATION PRINCIPALE -->
        <q-tabs v-model="currentSection" align="right" class="text-white">
          <q-tab name="builder" label="Builder" icon="build" />
          <q-tab name="templates" label="Templates" icon="description" />
          <q-tab name="workflows" label="Workflows" icon="account_tree" />
          <q-tab name="collections" label="Collections" icon="collections" />
        </q-tabs>
      </q-toolbar>
    </q-header>

    <!-- CONTENU PRINCIPAL -->
    <q-page-container>
      <q-page class="q-pa-md">
        <!-- Composants dynamiques selon la section -->
        <component 
          :is="currentComponent" 
          @open-builder="openBuilder"
          @load-workflow="loadWorkflow"
          @open-collections="openCollections"
        />
      </q-page>
    </q-page-container>


  </q-layout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useCollectionStore } from 'src/stores/useCollectionStore'
import WorkflowBuilder from './WorkflowBuilder.vue'
import WorkflowTemplateManager from './WorkflowTemplateManager.vue' 
import WorkflowManager from './WorkflowManager.vue'
import CollectionView from './CollectionView.vue'

// Store
const collectionStore = useCollectionStore()

// Reactive variables
const currentSection = ref('builder')

// Computed component basé sur la section courante
const currentComponent = computed(() => {
  switch (currentSection.value) {
    case 'builder':
      return WorkflowBuilder
    case 'templates':
      return TemplateManager
    case 'workflows':
      return WorkflowManager
    case 'collections':
      return CollectionView
    default:
      return WorkflowBuilder
  }
})

// Fonctions de navigation
const openBuilder = () => {
  currentSection.value = 'builder'
}

const loadWorkflow = (workflow) => {
  // TODO: Passer le workflow au WorkflowBuilder
  console.log('Charger workflow:', workflow)
  openBuilder()
}

const openCollections = () => {
  currentSection.value = 'collections'
}

// Initialisation
onMounted(async () => {
  await collectionStore.initialize()
})
</script>

<style scoped>
.q-layout {
  min-height: 100vh;
}
</style>