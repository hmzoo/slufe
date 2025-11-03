<template>
  <q-layout view="hHh lpR fFf">
    <q-header elevated class="bg-primary text-white">
      <q-toolbar>
        <q-toolbar-title>
          <q-icon name="auto_awesome" size="sm" class="q-mr-sm" />
          SLUFE IA - Générateur d'Images
        </q-toolbar-title>

        <q-btn flat round dense icon="help_outline" @click="showHelp">
          <q-tooltip>Aide</q-tooltip>
        </q-btn>
      </q-toolbar>
    </q-header>

    <q-page-container>
      <router-view />
    </q-page-container>

    <q-footer elevated class="bg-grey-8 text-white">
      <q-toolbar>
        <q-toolbar-title class="text-center text-caption">
          © 2025 SLUFE IA - Application de génération par IA
        </q-toolbar-title>
      </q-toolbar>
    </q-footer>
  </q-layout>
</template>

<script setup>
import { useQuasar } from 'quasar';

const $q = useQuasar();

function showHelp() {
  $q.dialog({
    title: 'Aide',
    message: `
      <p><strong>Comment utiliser l'application :</strong></p>
      <ol>
        <li>Ajoutez une ou plusieurs images (drag & drop ou parcourir)</li>
        <li>Écrivez votre prompt décrivant ce que vous voulez générer</li>
        <li>Cliquez sur "Envoyer" pour lancer la génération</li>
        <li>Téléchargez ou réutilisez le résultat</li>
      </ol>
    `,
    html: true,
    ok: 'Compris',
  });
}
</script>
