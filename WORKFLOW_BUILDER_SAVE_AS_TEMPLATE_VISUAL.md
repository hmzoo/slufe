# 🖼️ Guide Visuel - Sauvegarder Workflow comme Template

## 📋 Avant / Après

### AVANT (Sans le bouton)

```
┌─────────────────────────────────────────┐
│  Panneau latéral                        │
│  [Palette des tâches...]                │
│                                         │
│  ─────────────────────────────────────  │
│                                         │
│  🎬 Actions                              │
│  ┌───────────────────────────────────┐  │
│  │ 🏷️ Nom du workflow              │  │
│  │ [Mon Workflow]                    │  │
│  │                                   │  │
│  │ [▶️ Exécuter    ]                 │  │
│  │ [💾 Sauvegarder ]                │  │
│  │ [🗑️ Vider       ]                │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘

PROBLÈME:
- Dois aller dans "Gestionnaire de Workflows"
- Puis clic droit → "Sauvegarder comme template"
- Process long et peu intuitif
```

### APRÈS (Avec le bouton)

```
┌─────────────────────────────────────────┐
│  Panneau latéral                        │
│  [Palette des tâches...]                │
│                                         │
│  ─────────────────────────────────────  │
│                                         │
│  🎬 Actions                              │
│  ┌───────────────────────────────────┐  │
│  │ 🏷️ Nom du workflow              │  │
│  │ [Mon Workflow]                    │  │
│  │                                   │  │
│  │ [▶️ Exécuter              ]       │  │
│  │ [💾 Sauvegarder          ]       │  │
│  │ [📦 Sauvegarder comme template]  │  │ ← NOUVEAU!
│  │ [🗑️ Vider                ]       │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘

SOLUTION:
✅ Bouton directement accessible
✅ Une action = un template
✅ Dialog pour nommer le template
✅ Nettoyage automatique
```

## 🔘 Détails du Bouton

### Position

```
Actions
├─ 🏷️ Nom du workflow
│  [Mon Workflow]
├─ ▶️ Exécuter
├─ 💾 Sauvegarder
├─ 📦 Sauvegarder comme template  ← NOUVEAU (Position 3/4)
└─ 🗑️ Vider
```

### Apparence

```
Couleur: Info (Bleu ciel / Cyan)
Icône: save_as (Disquette avec flèche)
Label: "Sauvegarder comme template"
Type: Outline
Largeur: Full-width (100% du conteneur)

État Actif:
┌────────────────────────────────────┐
│ 📦 Sauvegarder comme template      │
└────────────────────────────────────┘

État Désactivé:
┌────────────────────────────────────┐
│ 📦 Sauvegarder comme template      │  (grisé)
└────────────────────────────────────┘
```

### Codes Couleurs

```
Bleu (Primary)  : Exécuter      ▶️
Orange (Secondary): Sauvegarder  💾
Cyan (Info)     : Template      📦  ← NOUVEAU
Gris (Grey-7)   : Vider         🗑️
```

## 🔄 Flux Utilisateur Visuel

### Étape 1: Clic sur le Bouton

```
User dans le builder
    ↓
Voit le bouton "Sauvegarder comme template"
    ↓
Clic sur le bouton
```

### Étape 2: Dialog de Confirmation

```
┌──────────────────────────────────────────────┐
│ 📦 Sauvegarder comme template                │
├──────────────────────────────────────────────┤
│                                              │
│ Créer un template réutilisable à partir      │
│ de ce workflow                               │
│                                              │
│ 🏷️ Nom du template *                         │
│ ┌────────────────────────────────────────┐   │
│ │ Mon Workflow (Template)                │   │
│ └────────────────────────────────────────┘   │
│                                              │
│                    [Annuler] [Créer template]│
└──────────────────────────────────────────────┘

Elements:
✅ Titre clair
✅ Message explicatif
✅ Champ pré-rempli
✅ Validation (nom requis)
✅ Boutons clairs
```

### Étape 3: Validation

```
User modifie le nom (optionnel)
    ↓
Clic "Créer template"
    ↓
Validation:
  - Nom non-vide? ✅
  - Si ❌ → Erreur "Nom requis"
  - Si ✅ → Créer le template
```

### Étape 4: Création

```
Processus en arrière-plan:

1. Valider le nom
2. Migrer au format v2
3. Nettoyer les données d'entrée
4. Créer l'objet template
5. Sauvegarder dans le store
6. Afficher notification
```

### Étape 5: Notification de Succès

```
┌────────────────────────────────────────────┐
│ ✅ Template "Mon Workflow (Template)" créé   │
│    avec succès                              │
│                                            │
│    Les inputs et outputs ont été vidés     │
│    pour réutilisation                      │
└────────────────────────────────────────────┘

Propriétés:
✅ Type: Positive (vert)
✅ Message: Template créé
✅ Caption: Inputs vidés
✅ Position: Top
✅ Durée: 3 secondes
```

### Étape 6: Erreur (optionnel)

```
┌────────────────────────────────────────────┐
│ ❌ Erreur lors de la création du template    │
│                                            │
│    Message d'erreur détaillé               │
└────────────────────────────────────────────┘

Propriétés:
❌ Type: Negative (rouge)
❌ Message: Erreur d'exécution
❌ Caption: Détails de l'erreur
```

## 📊 États du Bouton

### 1. Désactivé (Workflow Vide)

```
Builder vide
    ↓
Pas de tâches
    ↓
Bouton grisé
    ↓
canExecuteWorkflow = false
```

**Affichage:**
```
┌────────────────────────────────────────┐
│ 📦 Sauvegarder comme template          │  (grisé/disabled)
└────────────────────────────────────────┘
```

### 2. Activé (Au moins une Tâche)

```
Ajouter une tâche
    ↓
Workflow non-vide
    ↓
Bouton actif
    ↓
canExecuteWorkflow = true
```

**Affichage:**
```
┌────────────────────────────────────────┐
│ 📦 Sauvegarder comme template          │  (bleu ciel/active)
└────────────────────────────────────────┘
```

## 🎯 Cas d'Usage Visuels

### Cas 1: Workflow Simple

```
Builder:
├─ Tâche 1: input_text (Entrez un prompt)
├─ Tâche 2: generate_image (Générer l'image)
└─ Tâche 3: image_output (Afficher l'image)

User clique "Sauvegarder comme template"
    ↓
Dialog: "Génération d'images simple (Template)"
    ↓
Confirmer
    ↓
✅ Template créé!
   - inputs.input_text.userInput = ""  (vidé)
   - Réutilisable plusieurs fois
```

### Cas 2: Workflow Complexe

```
Builder:
├─ Tâche 1: input_text + input_images
├─ Tâche 2: enhance_prompt + generate_image
├─ Tâche 3: edit_image (avec paramètres)
└─ Tâche 4: image_output

User clique "Sauvegarder comme template"
    ↓
Dialog: "Pipeline Pro (Template)"
    ↓
User personnalise le nom
    ↓
✅ Template créé!
   - Tous les champs d'entrée vidés
   - Structure complexe préservée
   - Prêt pour réutilisation
```

### Cas 3: Modification Progressive

```
Jour 1:
- User crée un workflow
- Le teste
- Clic "Sauvegarder comme template" → Template v1

Jour 2:
- User charge le même workflow
- Ajoute une tâche de post-traitement
- Clic "Sauvegarder comme template" → Template v2

Résultat:
✅ Deux templates différents
✅ Version originale préservée
✅ Progression documentée par les templates
```

## 🔄 Intégration avec le Workflow

### Avant: Workflow avec Données

```javascript
{
  name: "Génération d'images",
  inputs: [{
    type: "input_text",
    id: "text1",
    input: {
      label: "Entrez un prompt",
      userInput: "une maison avec jardin"  // ❌ Données
    }
  }],
  tasks: [
    // Tâches de traitement
  ]
}
```

### Après: Template Nettoyé

```javascript
{
  name: "Génération d'images",
  inputs: [{
    type: "input_text",
    id: "text1",
    input: {
      label: "Entrez un prompt",
      userInput: ""  // ✅ Vide
    }
  }],
  tasks: [
    // Tâches identiques
  ]
}
```

**Métadonnées du Template:**
```javascript
{
  description: "Template créé à partir du workflow 'Génération d'images' - 13/11/2025",
  originalWorkflowId: "workflow_abc123",
  category: "custom",
  icon: "dashboard"
}
```

## 📱 Responsive

### Desktop (1920px)

```
┌─────────────────────────────────────────┐
│ [Palette des tâches...]                 │
│                                         │
│ 🎬 Actions                               │
│ ┌───────────────────────────────────┐   │
│ │ [▶️ Exécuter              ]        │   │
│ │ [💾 Sauvegarder          ]        │   │
│ │ [📦 Sauvegarder comme template]   │   │
│ │ [🗑️ Vider                ]        │   │
│ └───────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

### Tablet (768px)

```
┌──────────────────────────────┐
│ [Palette des tâches...]      │
│                              │
│ 🎬 Actions                    │
│ ┌──────────────────────────┐  │
│ │ [▶️ Exécuter       ]      │  │
│ │ [💾 Sauvegarder   ]      │  │
│ │ [📦 Sauveg. template]    │  │
│ │ [🗑️ Vider         ]      │  │
│ └──────────────────────────┘  │
└──────────────────────────────┘
```

## ⌨️ Clavier

```
Tab → Focus sur le bouton
     → Highlight bleu autour du bouton

Enter ou Space → Activation du bouton
                → Dialog s'ouvre

Alt+Tab → Navigation vers d'autres éléments
```

## 🎨 Thème et Couleurs

```
Bouton "Sauvegarder comme template":

Couleur: Info (#17a2b8 / Bleu ciel)
Texte: Blanc
Border: 2px solid #17a2b8

Au survol:
- Background: Léger fond bleu
- Curseur: pointer

Au clic:
- Ripple effect
- Dialog apparaît
```

## 📈 Comparaison UX

| Aspect | Avant | Après |
|--------|-------|-------|
| **Localisation** | Menu contextuel (clic droit) | Bouton visible |
| **Étapes** | 5+ actions | 3 actions |
| **Navigation** | Builder → Workflows → clic droit | Directement depuis builder |
| **Découverte** | Peu visible | Très visible |
| **Efficacité** | Longue | Rapide |
| **Accessibilité** | Menu caché | Bouton explicite |

## 🚀 Performance

- ✅ Pas d'appel API supplémentaire jusqu'à confirmation
- ✅ Nettoyage effectué côté client
- ✅ Notification instantanée
- ✅ Pas de page reload
- ✅ Workflow actuel non modifié
