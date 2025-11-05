#!/bin/bash

# Script de test pour le système de workflows unifié

echo "🧪 Test du système de workflows unifié"
echo "=====================================

# Nettoyage localStorage (optionnel)
# localStorage.removeItem('customWorkflows')
# localStorage.removeItem('slufe_saved_workflows')

console.log('✅ Système prêt pour les tests')
console.log('📝 Pour tester:')
console.log('1. Créez un workflow dans le builder')
console.log('2. Cliquez sur Sauvegarder')
console.log('3. Ouvrez Mes Workflows')
console.log('4. Testez renommer, dupliquer, supprimer')
console.log('5. Vérifiez que les sauvegardes ne s écrasent plus')
"

# Pour injecter dans la console du navigateur
echo "📋 Copiez ceci dans la console du navigateur pour nettoyer les anciens données:"
echo "localStorage.removeItem('customWorkflows'); console.log('Anciens workflows nettoyés');"