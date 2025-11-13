<template>
  <q-layout view="hHh lpR fFf">
    <q-header elevated class="bg-primary text-white">
      <q-toolbar>
        <q-toolbar-title>
          <q-icon name="account_tree" size="sm" class="q-mr-sm" />
          SLUFE - Workflow Engine IA
        </q-toolbar-title>

        <q-space />

        <q-btn flat round dense icon="history" @click="showHistory">
          <q-tooltip>Historique des workflows</q-tooltip>
        </q-btn>

        <q-btn flat round dense icon="bug_report" to="/debug-collections">
          <q-tooltip>Debug Collections</q-tooltip>
        </q-btn>

        <q-btn flat round dense icon="help_outline" @click="showHelp">
          <q-tooltip>Guide des workflows</q-tooltip>
        </q-btn>
      </q-toolbar>
    </q-header>

    <q-page-container>
      <router-view />
    </q-page-container>

    <q-footer elevated class="bg-grey-8 text-white">
      <q-toolbar>
        <q-toolbar-title class="text-center text-caption">
          © 2025 SLUFE - Workflow Engine IA | Système unifié de traitement par workflows
        </q-toolbar-title>
      </q-toolbar>
    </q-footer>
  </q-layout>
</template>

<script setup>
import { useQuasar } from 'quasar'
import { useWorkflowStore } from 'src/stores/useWorkflowStore'
import { useCollectionStore } from 'src/stores/useCollectionStore'
import { onMounted } from 'vue'

const $q = useQuasar()
const workflowStore = useWorkflowStore()
const collectionStore = useCollectionStore()

// Initialisation des stores au démarrage
onMounted(async () => {
  try {
    console.log('🚀 Initialisation de l\'application...')
    
    // Initialiser le store des collections (qui gère la persistance localStorage)
    await collectionStore.initialize()
    
    console.log('✅ Application initialisée')
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation:', error)
    $q.notify({
      type: 'warning',
      message: 'Erreur lors du chargement des collections',
      caption: 'Certaines fonctionnalités peuvent être indisponibles'
    })
  }
})

function showHistory() {
  $q.dialog({
    title: 'Historique des Workflows',
    message: workflowStore.workflowHistory.length > 0 
      ? `Vous avez ${workflowStore.workflowHistory.length} exécution(s) dans l'historique.`
      : 'Aucune exécution dans l\'historique pour le moment.',
    ok: 'Fermer',
  })
}

function showHelp() {
  $q.dialog({
    title: '🔧 Guide du Workflow Engine',
    message: `
      <div style="text-align: left;">
        <p><strong>🚀 Nouveau système unifié basé sur les workflows !</strong></p>
        
        <h3>📋 Templates disponibles :</h3>
        <ul>
          <li><strong>Génération simple</strong> - Créer une image depuis un prompt</li>
          <li><strong>Génération améliorée</strong> - L'IA améliore votre prompt automatiquement</li>
          <li><strong>Édition d'image</strong> - Modifier une image existante</li>
          <li><strong>Analyse d'images</strong> - Décrire le contenu d'images</li>
          <li><strong>Génération vidéo</strong> - Créer des vidéos courtes</li>
          <li><strong>Pipeline complet</strong> - Enchaîner plusieurs opérations</li>
        </ul>
        
        <h3>⚡ Comment utiliser :</h3>
        <ol>
          <li>Choisissez un template dans le menu "Templates"</li>
          <li>Remplissez les paramètres d'entrée requis</li>
          <li>Cliquez sur "Exécuter le workflow"</li>
          <li>Consultez les résultats de chaque étape</li>
        </ol>
        
        <h3>🔧 Fonctions avancées :</h3>
        <ul>
          <li>Modifiez la configuration JSON pour personnaliser</li>
          <li>Réexécutez des workflows depuis l'historique</li>
          <li>Enchaînez plusieurs tâches dans un seul workflow</li>
        </ul>
      </div>
    `,
    html: true,
    ok: 'Compris',
  })
}
</script>
