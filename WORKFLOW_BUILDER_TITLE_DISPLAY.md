# 🏷️ Affichage du Titre du Workflow dans le Builder

## 📋 Vue d'ensemble

Ajout de l'affichage du titre du workflow en cours d'édition dans l'interface du **Workflow Builder**, avec la possibilité d'éditer le titre directement.

## 🎯 Objectifs

- **Afficher clairement** le nom du workflow en cours d'édition
- **Éditer le titre** en temps réel dans le formulaire d'actions
- **Persistance automatique** du nom lors de la sauvegarde
- **Améliorer la visibilité** du contexte de travail utilisateur

## 📍 Emplacements d'Affichage

### 1. **Header Principal** ✅ (Implémenté)

**Localisation:** Haut de la page, à côté du titre "Workflow Builder"

**Présentation:**
```
Build  Workflow Builder  [💾 Nom du workflow]
        Créez et configurez vos workflows personnalisés
```

**Détails:**
- Badge/Chip avec icône `label`
- Couleur primary (bleu)
- Apparition conditionnelle si un nom existe
- Format: `{{ currentWorkflow.name }}`

**Code implémenté:**
```vue
<q-chip 
    v-if="currentWorkflow.name" 
    color="primary" 
    text-color="white"
    icon="label"
    class="q-ml-md"
>
    {{ currentWorkflow.name }}
</q-chip>
```

### 2. **Panneau Latéral - Champ d'Édition** ✅ (Implémenté)

**Localisation:** Dans la section "Actions" du panneau droit

**Présentation:**
```
🎬 Actions
┌─────────────────────────────┐
│ 🏷️ Nom du workflow         │ [X]
│ Donnez un nom à votre...    │
│                             │
│ ▶️ Exécuter                  │
│ 💾 Sauvegarder             │
│ 🗑️ Vider                    │
└─────────────────────────────┘
```

**Détails:**
- Champ d'input avec icône `label`
- Placeholder informatif si vide
- Bouton clear pour effacer le nom
- Binding bidirectionnel avec `currentWorkflow.name`
- Synchronisation automatique avec le header

**Code implémenté:**
```vue
<q-input
    v-model="currentWorkflow.name"
    label="Nom du workflow"
    outlined
    dense
    class="q-mb-md"
    :hint="currentWorkflow.name ? '' : 'Donnez un nom à votre workflow'"
>
    <template #prepend>
        <q-icon name="label" />
    </template>
    <template #append>
        <q-icon 
            v-if="currentWorkflow.name"
            name="clear"
            class="cursor-pointer"
            @click="currentWorkflow.name = ''"
        />
    </template>
</q-input>
```

## 🔄 Flux de Fonctionnement

### Cas 1: Nouveau Workflow

```
1. Utilisateur ouvre le Workflow Builder
2. currentWorkflow.name = 'Nouveau workflow' (par défaut)
3. Badge "Nouveau workflow" s'affiche dans le header
4. Champ d'édition dans Actions affiche "Nouveau workflow"

5. Utilisateur change le nom → 'Mon premier workflow'
6. Badge se met à jour automatiquement
7. Champ se met à jour automatiquement

8. Utilisateur clique "Sauvegarder"
9. Dialog demande confirmation du nom
10. Workflow sauvegardé avec le nouveau nom
```

### Cas 2: Chargement d'un Workflow Existant

```
1. Utilisateur clique sur un workflow dans le gestionnaire
2. onMounted() charge le workflow du store
3. currentWorkflow.name = workflow.name (ex: "Génération d'images")
4. Badge affiche "Génération d'images" dans le header
5. Champ d'édition affiche "Génération d'images"

6. Utilisateur peut modifier le nom si souhaité
7. Clic "Mettre à jour" → sauvegarde la nouvelle version
```

### Cas 3: Plusieurs Onglets/Workflows

```
User 1 → Builder → "Workflow A" (visible dans header)
User 2 → Builder → "Workflow B" (visible dans leur header)
Chaque contexte maintient son propre nom
```

## 🎨 Design et Positionnement

### Header Principal
```
┌─────────────────────────────────────────────────────┐
│ 🔨 Workflow Builder  [💾 Nom du workflow]           │
│                                                     │
│ Créez et configurez vos workflows personnalisés     │
│                        [Collection info] →          │
└─────────────────────────────────────────────────────┘
```

### Panneau Latéral
```
┌─────────────────────────────────────────┐
│ Palette des tâches disponibles          │
│ [Liste des tâches...]                   │
│                                         │
│ ─────────────────────────────────────── │
│                                         │
│ 🎬 Actions                               │
│ ┌───────────────────────────────────┐  │
│ │ 🏷️ Nom du workflow              │  │
│ │ [Donnez un nom...]               │  │
│ │                                   │  │
│ │ [▶️ Exécuter    ]                 │  │
│ │ [💾 Sauvegarder ]                │  │
│ │ [🗑️ Vider       ]                │  │
│ └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

## 🔌 Réactivité et Synchronisation

### Binding Bidirectionnel
```javascript
// Champ d'entrée
<q-input v-model="currentWorkflow.name" />

// Affichage automatique dans le header
{{ currentWorkflow.name }}

// Les deux sont synchronisés en temps réel (deux-sens)
// Modification du champ → mise à jour du header
// Modification du badge → mise à jour du champ (indirectement)
```

### Persistance Automatique
```javascript
// Dans saveWorkflow()
currentWorkflow.value.name = name.trim()
currentWorkflow.value.id = savedWorkflow.id

// Le nom persiste dans currentWorkflow
// À la prochaine réouverture du builder, le nom est restauré

// onMounted()
currentWorkflow.value = {
    name: persistedWorkflow.workflow.name || 'Workflow en cours',
    inputs: persistedWorkflow.workflow.inputs || [],
    tasks: persistedWorkflow.workflow.tasks || [],
    outputs: persistedWorkflow.workflow.outputs || []
}
```

## 💡 Cas d'Usage

### 1. **Clarté Contextuelle**
- L'utilisateur sait exactement quel workflow il édite
- Utile avec plusieurs onglets/fenêtres ouvertes
- Évite les confusions et les erreurs

### 2. **Nommage Rapide**
- Nom par défaut "Nouveau workflow" 
- Utilisateur peut modifier immédiatement sans dialog
- Meilleure UX que d'attendre la sauvegarde

### 3. **Visibilité Permanente**
- Le titre est toujours visible en haut de page
- Pas besoin de chercher dans les panneaux
- Rappel constant du contexte

### 4. **Édition Flexible**
- Champ disponible pour modifications rapides
- Possibilité de changer d'avis avant sauvegarde
- Séparation claire entre édition (nom) et sauvegarde (persistance)

## ✅ Checklist Implémentation

- ✅ Badge avec titre dans le header principal
- ✅ Champ d'édition du nom dans le panneau Actions
- ✅ Icône label cohérente
- ✅ Synchronisation bidirectionnelle
- ✅ Chargement du nom existant dans onMounted()
- ✅ Persistance lors de la sauvegarde
- ✅ Pas de conflits CSS
- ✅ Vérification d'erreurs

## 🧪 Tests de Vérification

### Test 1: Nouveau Workflow
1. Ouvrir le Workflow Builder
2. Vérifier que "Nouveau workflow" s'affiche dans le header
3. Vérifier que le champ "Nom du workflow" contient "Nouveau workflow"

### Test 2: Édition du Nom
1. Modifier le nom dans le champ → "Mon Workflow"
2. Vérifier que le badge dans le header se met à jour
3. Vérifier qu'il n'y a pas de lag

### Test 3: Effacement du Nom
1. Cliquer sur le X du champ "Nom du workflow"
2. Vérifier que le badge disparaît du header
3. Vérifier que le champ devient vide

### Test 4: Sauvegarde et Rechargement
1. Donner un nom au workflow → "Test Workflow"
2. Cliquer "Sauvegarder"
3. Confirmer le nom dans le dialog
4. Recharger la page
5. Vérifier que "Test Workflow" s'affiche dans le header

### Test 5: Chargement d'un Workflow Existant
1. Aller dans le Gestionnaire de Workflows
2. Cliquer sur un workflow existant
3. Vérifier que son nom s'affiche dans le header du Builder
4. Vérifier que le champ contient le bon nom

## 📝 Notes Techniques

### Propriétés Utilisées
```javascript
currentWorkflow.value.name  // Stockage principal du nom
currentWorkflow.value.id    // ID généré lors de la sauvegarde
currentWorkflow.value.inputs
currentWorkflow.value.tasks
currentWorkflow.value.outputs
```

### Événements Connectés
```javascript
// Sauvegarde
@click="saveWorkflow"
→ Demande le nom en dialog
→ Met à jour currentWorkflow.name
→ Persiste dans le store

// Effacement
@click="clearWorkflow"
→ Vide inputs, tasks, outputs
→ Ne vide PAS le nom (c'est voulu pour continuer à travailler)
```

### Initialisation
```javascript
onMounted(() => {
    // Charge depuis store.getCurrentBuilderWorkflow()
    // Restaure name, inputs, tasks, outputs
})
```

## 🚀 Bénéfices Utilisateur

| Aspect | Avant | Après |
|--------|-------|-------|
| **Contextualisation** | ❌ Nom caché dans le store | ✅ Toujours visible |
| **Nommage Rapide** | ⚠️ Obligé d'attendre la sauvegarde | ✅ Éditable immédiatement |
| **Édition** | ❌ Pas possible sans re-sauvegarder | ✅ Éditable dans le builder |
| **Clarté** | ⚠️ Risque de confusion avec plusieurs onglets | ✅ Contexte très clair |
| **Persistance** | ✅ Sauvegardé en BD | ✅ Restauré au rechargement |

## 📝 Changements Apportés

### Fichier: `frontend/src/components/WorkflowBuilder.vue`

**1. Header Principal (ligne ~5-12)**
- Ajout d'un `<q-chip>` avec le nom du workflow
- Affichage conditionnel si `currentWorkflow.name` existe
- Icône `label` pour cohérence visuelle

**2. Panneau Actions (ligne ~410-430)**
- Ajout d'un `<q-input>` avec v-model pour éditer le nom
- Intégration avant les boutons d'action
- Icône `label` et bouton clear

**Pas de changements au script** - utilise les propriétés réactives existantes

## 🎓 Bonnes Pratiques

- ✅ Séparation du nom (éditeur) et de la sauvegarde (persistance)
- ✅ Binding bidirectionnel pour UX fluide
- ✅ Affichage conditionnel pour propreté visuelle
- ✅ Icône cohérente dans tous les contextes
- ✅ Champ dense pour économiser l'espace
- ✅ Hint informatif pour utilisateurs nouveaux
