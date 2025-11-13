# 🖼️ Aperçu Visuel - Affichage du Titre du Workflow

## Avant/Après

### AVANT (Sans affichage du titre)
```
┌──────────────────────────────────────────────────────────────────────┐
│ 🔨 Workflow Builder                    [📚 Collection Active] →       │
│                                                                      │
│ Créez et configurez vos workflows personnalisés                     │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘

┌─ Données d'entrée ─ Tâches ─ Données de sortie ─ Résultats ──────────┐
│                                                                      │
│  [Zones de configuration des tâches...]                             │
│                                                                      │
│                          │  Panneau latéral                         │
│                          │  [Palette des tâches]                    │
│                          │  ┌─────────────────┐                     │
│                          │  │ Tâches...       │                     │
│                          │  │ [...]           │                     │
│                          │  ├─────────────────┤                     │
│                          │  │ 🎬 Actions      │                     │
│                          │  │ [▶️ Exécuter  ] │                     │
│                          │  │ [💾 Sauvegarder]│                     │
│                          │  │ [🗑️ Vider    ]  │                     │
│                          │  └─────────────────┘                     │
└──────────────────────────────────────────────────────────────────────┘

PROBLÈME: L'utilisateur ne sait pas quel workflow il édite!
```

### APRÈS (Avec affichage du titre)
```
┌──────────────────────────────────────────────────────────────────────┐
│ 🔨 Workflow Builder  [💾 Génération d'images]   [📚 Collection] →    │
│                                                                      │
│ Créez et configurez vos workflows personnalisés                     │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘

┌─ Données d'entrée ─ Tâches ─ Données de sortie ─ Résultats ──────────┐
│                                                                      │
│  [Zones de configuration des tâches...]                             │
│                                                                      │
│                          │  Panneau latéral                         │
│                          │  [Palette des tâches]                    │
│                          │  ┌─────────────────────────┐             │
│                          │  │ Tâches disponibles      │             │
│                          │  │ [...]                   │             │
│                          │  ├─────────────────────────┤             │
│                          │  │ 🎬 Actions              │             │
│                          │  │ 🏷️ Nom du workflow      │             │
│                          │  │ [Génération d'images] [X] │         │
│                          │  │                         │             │
│                          │  │ [▶️ Exécuter       ]     │             │
│                          │  │ [💾 Sauvegarder    ]    │             │
│                          │  │ [🗑️ Vider          ]    │             │
│                          │  └─────────────────────────┘             │
└──────────────────────────────────────────────────────────────────────┘

SOLUTION: 
✅ Titre visible dans le header (badge bleu)
✅ Éditable dans le panneau Actions
✅ Toujours synchronisé
✅ Claire et professionnelle
```

## Détails des Changements

### 1️⃣ Badge dans le Header

```vue
<!-- NOUVEAU -->
<div class="text-h5 q-mb-sm">
    <q-icon name="build" class="q-mr-sm" />
    Workflow Builder
    
    ✨ NOUVEAU:
    <q-chip 
        v-if="currentWorkflow.name" 
        color="primary" 
        text-color="white"
        icon="label"
        class="q-ml-md"
    >
        {{ currentWorkflow.name }}
    </q-chip>
</div>
```

**Résultat visuel:**
```
🔨 Workflow Builder  [💾 Mon Workflow]
```

### 2️⃣ Champ d'Édition dans le Panneau Actions

```vue
<!-- NOUVEAU -->
<q-card flat bordered>
    <q-card-section>
        <div class="text-subtitle1 q-mb-sm">
            <q-icon name="play_arrow" class="q-mr-sm" />
            Actions
        </div>

        ✨ NOUVEAU:
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

        <div class="q-gutter-sm">
            <!-- Boutons existants... -->
        </div>
    </q-card-section>
</q-card>
```

**Résultat visuel:**
```
🎬 Actions

┌──────────────────────────┐
│ 🏷️ Nom du workflow       │ [X]
│                          │
│ Donnez un nom à votre... │
└──────────────────────────┘

[▶️ Exécuter      ]
[💾 Sauvegarder   ]
[🗑️ Vider         ]
```

## États Visuels

### État 1: Workflow Sans Nom (Nouveau)

```
🔨 Workflow Builder          ← Pas de badge
Créez et configurez...

Actions
┌──────────────────────────┐
│ 🏷️ Nom du workflow       │ [X]
│                          │
│ Donnez un nom à votre... │  ← Placeholder visible
└──────────────────────────┘
```

### État 2: Workflow Avec Nom

```
🔨 Workflow Builder  [💾 Mon Projet]    ← Badge visible
Créez et configurez...

Actions
┌──────────────────────────┐
│ 🏷️ Nom du workflow       │ [X]
│ Mon Projet               │
└──────────────────────────┘
```

### État 3: Édition du Nom

```
Utilisateur tape: "Nouveau Projet"

🔨 Workflow Builder  [💾 Nouveau Projet]  ← Mis à jour en temps réel
Créez et configurez...

Actions
┌──────────────────────────┐
│ 🏷️ Nom du workflow       │ [X]
│ Nouveau Projet           │
└──────────────────────────┘
```

### État 4: Après Effacement

```
Utilisateur clique le X

🔨 Workflow Builder               ← Badge disparu
Créez et configurez...

Actions
┌──────────────────────────┐
│ 🏷️ Nom du workflow       │ [X]
│                          │
│ Donnez un nom à votre... │  ← Placeholder réapparu
└──────────────────────────┘
```

## Interactions Utilisateur

### Scénario 1: Créer et Nommer un Nouveau Workflow

```
1️⃣  Ouvrir le Workflow Builder
    → currentWorkflow.name = 'Nouveau workflow' (par défaut)
    → Badge affiche "Nouveau workflow"
    → Champ affiche "Nouveau workflow"

2️⃣  Cliquer dans le champ et modifier
    → Champ: [Nouvelle Génération] (modification en cours)
    → Badge: [💾 Nouvelle Génération] (mis à jour en temps réel)

3️⃣  Ajouter des tâches et configurer

4️⃣  Cliquer "Sauvegarder"
    → Dialog de confirmation avec le nom
    → Workflow sauvegardé en BD
    → Store syncrho avec le nouvel ID

5️⃣  Recharger la page
    → onMounted() charge depuis le store
    → Badge affiche "Nouvelle Génération"
    → Champ affiche "Nouvelle Génération"
    ✅ Succès!
```

### Scénario 2: Modifier un Workflow Existant

```
1️⃣  Aller dans "Gestionnaire de Workflows"
    → Voir la liste des workflows sauvegardés

2️⃣  Cliquer sur "Génération d'images"
    → Charge le workflow
    → onMounted() remplit currentWorkflow avec les données
    → Badge affiche "Génération d'images"
    → Champ affiche "Génération d'images"

3️⃣  Décider de changer le nom
    → Cliquer dans le champ
    → Supprimer et taper "Génération d'images v2"
    → Badge se met à jour: [💾 Génération d'images v2]

4️⃣  Cliquer "Sauvegarder"
    → Dialog: "Mettre à jour le workflow"
    → Sauvegarde la nouvelle version
    ✅ Succès!
```

### Scénario 3: Plusieurs Workflows Ouverts (Tabs)

```
ONGLET 1: Workflow Builder
Header: 🔨 Workflow Builder  [💾 Édition d'images]
Utilisateur édite...

ONGLET 2: Workflow Builder  (autre fenêtre/tab)
Header: 🔨 Workflow Builder  [💾 Génération vidéo]
Utilisateur édite...

ONGLET 1: (Revenir à l'onglet 1)
Header: 🔨 Workflow Builder  [💾 Édition d'images]  ← Correct!

✅ Pas de confusion, chaque contexte maintient son propre nom
```

## Responsivité

### Desktop (Large Screen)
```
┌──────────────────────────────────────────────────────────────┐
│ 🔨 Workflow Builder  [💾 Mon Workflow]  [📚 Collection] →    │
└──────────────────────────────────────────────────────────────┘
```

### Tablet (Medium Screen)
```
┌─────────────────────────────────────────────────────────┐
│ 🔨 Workflow Builder  [💾 Mon Workflow]                  │
│                           [📚 Collection] →             │
└─────────────────────────────────────────────────────────┘
```

### Mobile (Small Screen)
```
┌────────────────────────────────┐
│ 🔨 Workflow Builder             │
│ [💾 Mon Workflow]              │
│ [📚 Collection] →              │
└────────────────────────────────┘
```

## Intégration avec Autres Fonctionnalités

### Avec "Sauvegarder comme Template"

```
User crée un workflow avec le nom "Édition Pro"
↓
Clique sur "Sauvegarder comme template"
↓
Dialog propose: "Édition Pro (Template)"
↓
Template créé avec le nom du workflow comme base
✅ Traçabilité améliorée!
```

### Avec "Créer depuis Template"

```
User clique sur un template
↓
Dialog: "Créer un workflow depuis le template"
↓
Nouveau workflow créé avec le nom du template
↓
Badge affiche le nom du nouveau workflow
↓
User peut le modifier immédiatement
✅ Meilleure UX!
```

## Performance

- ✅ Pas d'appel API supplémentaire
- ✅ Binding réactif natif Vue (v-model)
- ✅ Pas de recalcul complexe
- ✅ Affichage conditionnel léger (v-if)
- ✅ Synchronisation instantanée

## Accessibilité

- ✅ Icônes significatives (label)
- ✅ Labels clairs pour les champs
- ✅ Contraste suffisant du badge
- ✅ Focus visible sur le champ d'entrée
- ✅ Hint informatif pour contexte
