// 🔍 Inspecteur localStorage Slufe - Script Console
// À exécuter dans la console du navigateur (F12)

(function() {
    console.log('🔍 === INSPECTEUR LOCALSTORAGE SLUFE ===');
    console.log('📅 Analyse effectuée le:', new Date().toLocaleString());
    
    // Clés localStorage spécifiques à Slufe connues
    const knownSlufeKeys = [
        'slufe_current_workflow',
        'slufe_saved_workflows', 
        'saved-workflows',
        'workflows-migrated-v2',
        'customWorkflows'
    ];
    
    // Analyser toutes les données localStorage
    const allData = {};
    const slufeData = {};
    let totalSize = 0;
    let slufeSize = 0;
    
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const value = localStorage.getItem(key);
        const size = new Blob([value]).size;
        
        totalSize += size;
        
        let parsedValue;
        let isJSON = false;
        
        try {
            parsedValue = JSON.parse(value);
            isJSON = true;
        } catch (e) {
            parsedValue = value;
        }
        
        const itemData = {
            key,
            value,
            parsedValue,
            size,
            isJSON,
            type: typeof parsedValue,
            isSlufeKey: knownSlufeKeys.includes(key) || key.startsWith('slufe_')
        };
        
        allData[key] = itemData;
        
        if (itemData.isSlufeKey) {
            slufeData[key] = itemData;
            slufeSize += size;
        }
    }
    
    // Fonction utilitaire pour formater les tailles
    function formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    // STATISTIQUES GÉNÉRALES
    console.log('\n📊 === STATISTIQUES GÉNÉRALES ===');
    console.log(`📦 Total des clés: ${Object.keys(allData).length}`);
    console.log(`🎯 Clés Slufe: ${Object.keys(slufeData).length}`);
    console.log(`📏 Taille totale: ${formatBytes(totalSize)}`);
    console.log(`🎯 Taille Slufe: ${formatBytes(slufeSize)}`);
    
    const workflowKeys = Object.keys(allData).filter(key => key.includes('workflow'));
    console.log(`⚡ Clés contenant "workflow": ${workflowKeys.length}`);
    
    // ANALYSE DES DONNÉES SLUFE
    console.log('\n🎯 === DONNÉES SLUFE DÉTAILLÉES ===');
    
    Object.keys(slufeData).forEach(key => {
        const item = slufeData[key];
        console.log(`\n🔑 ${key}:`);
        console.log(`   📏 Taille: ${formatBytes(item.size)}`);
        console.log(`   📦 Type: ${item.type} ${item.isJSON ? '(JSON)' : '(Texte)'}`);
        
        // Analyse spécifique selon la clé
        if (key === 'slufe_current_workflow' && item.parsedValue) {
            console.log(`   🏷️  ID: ${item.parsedValue.id || 'N/A'}`);
            console.log(`   📝 Nom: ${item.parsedValue.name || 'N/A'}`);
            console.log(`   🔧 Tâches: ${item.parsedValue.tasks?.length || 0}`);
            console.log(`   📋 Version: ${item.parsedValue.version || 'N/A'}`);
            if (item.parsedValue.inputs) {
                console.log(`   🔧 Inputs: ${Object.keys(item.parsedValue.inputs).length}`);
            }
        }
        
        if (key === 'slufe_saved_workflows' && Array.isArray(item.parsedValue)) {
            console.log(`   📚 Nombre de workflows: ${item.parsedValue.length}`);
            if (item.parsedValue.length > 0) {
                const categories = [...new Set(item.parsedValue.map(w => w.category).filter(Boolean))];
                console.log(`   🏷️  Catégories: ${categories.join(', ') || 'Aucune'}`);
                
                const versions = [...new Set(item.parsedValue.map(w => w.version).filter(Boolean))];
                console.log(`   📋 Versions: ${versions.join(', ') || 'Aucune'}`);
            }
        }
        
        if (key === 'workflows-migrated-v2') {
            console.log(`   🔄 Migration V2: ${item.parsedValue ? '✅ Effectuée' : '❌ Non effectuée'}`);
        }
        
        if (key === 'customWorkflows' && item.parsedValue) {
            if (Array.isArray(item.parsedValue)) {
                console.log(`   🛠️  Workflows custom: ${item.parsedValue.length}`);
            } else if (typeof item.parsedValue === 'object') {
                console.log(`   🛠️  Workflows custom: ${Object.keys(item.parsedValue).length}`);
            }
        }
        
        // Afficher un échantillon des données si c'est du JSON
        if (item.isJSON && item.size < 1000) {
            console.log(`   📄 Contenu:`, item.parsedValue);
        } else if (item.isJSON) {
            console.log(`   📄 Contenu (trop volumineux - utilisez localStorage.getItem('${key}'))`);
        }
    });
    
    // TOUTES LES AUTRES CLÉS
    const otherKeys = Object.keys(allData).filter(key => !slufeData[key]);
    if (otherKeys.length > 0) {
        console.log('\n🗂️ === AUTRES CLÉS LOCALSTORAGE ===');
        otherKeys.forEach(key => {
            const item = allData[key];
            console.log(`🔑 ${key}: ${formatBytes(item.size)} (${item.type})`);
        });
    }
    
    // COMMANDES UTILES
    console.log('\n🛠️ === COMMANDES UTILES ===');
    console.log('Pour voir une clé spécifique:');
    console.log('  localStorage.getItem("slufe_current_workflow")');
    console.log('  JSON.parse(localStorage.getItem("slufe_saved_workflows"))');
    
    console.log('\nPour modifier une clé:');
    console.log('  localStorage.setItem("key", "value")');
    
    console.log('\nPour supprimer une clé:');
    console.log('  localStorage.removeItem("key")');
    
    console.log('\nPour vider tout le localStorage:');
    console.log('  localStorage.clear()');
    
    // FONCTIONS HELPER GLOBALES
    window.slufeInspector = {
        // Obtenir toutes les données Slufe
        getSlufeData: () => slufeData,
        
        // Obtenir le workflow actuel
        getCurrentWorkflow: () => {
            const current = localStorage.getItem('slufe_current_workflow');
            return current ? JSON.parse(current) : null;
        },
        
        // Obtenir les workflows sauvegardés
        getSavedWorkflows: () => {
            const saved = localStorage.getItem('slufe_saved_workflows');
            return saved ? JSON.parse(saved) : [];
        },
        
        // Exporter toutes les données Slufe
        exportSlufeData: () => {
            const exportData = {};
            Object.keys(slufeData).forEach(key => {
                exportData[key] = slufeData[key].parsedValue;
            });
            return exportData;
        },
        
        // Formater les tailles
        formatBytes,
        
        // Statistiques
        getStats: () => ({
            totalKeys: Object.keys(allData).length,
            slufeKeys: Object.keys(slufeData).length,
            totalSize: formatBytes(totalSize),
            slufeSize: formatBytes(slufeSize),
            workflowKeys: workflowKeys.length
        })
    };
    
    console.log('\n✨ Fonctions helper disponibles dans window.slufeInspector:');
    console.log('  - getSlufeData()');
    console.log('  - getCurrentWorkflow()');
    console.log('  - getSavedWorkflows()');
    console.log('  - exportSlufeData()');
    console.log('  - getStats()');
    
    console.log('\n🔍 === ANALYSE TERMINÉE ===');
    
    return {
        allData,
        slufeData,
        stats: {
            totalKeys: Object.keys(allData).length,
            slufeKeys: Object.keys(slufeData).length,
            totalSize: formatBytes(totalSize),
            slufeSize: formatBytes(slufeSize)
        }
    };
})();