# 📚 Guide: Transformer un Template en Workflow

## 🎯 Objectif

Créer un nouveau workflow **personnalisé** à partir d'un template existant avec une structure pré-configurée, mais avec des données vierges pour l'édition.

---

## 🚀 Démarche Rapide

### Étape 1: Accéder aux Templates
1. Cliquez sur l'onglet **"Templates"** dans la navigation principale
2. La liste des templates disponibles s'affiche

### Étape 2: Sélectionner un Template
3 options:

**Option A** - Via le bouton "Créer un workflow" sur la carte:
   - Survolez une carte de template
   - Cliquez sur l'icône `+` (Créer un nouveau workflow)

**Option B** - Via le dialog des détails:
   - Cliquez sur la carte du template pour ouvrir le dialog
   - Cliquez sur le bouton **"Créer un workflow"**

**Option C** - Depuis le TemplateManager en bas à droite:
   - Ouvrez le dialog des détails (Option B)
   - Cliquez **"Créer un workflow"** dans les actions

### Étape 3: Nommer le Workflow
1. Un dialog apparaît: **"Créer un workflow depuis le template"**
2. Le champ est pré-rempli avec le nom du template
3. **Modifiez le nom** si vous le souhaitez (ex: "Mon premier workflow")
4. Cliquez **"Créer"** ou **"Créer template"**

### Étape 4: Utiliser le Workflow dans le Builder
✅ Le workflow est créé et **chargé automatiquement** dans le Workflow Builder!

- Le nom que vous avez entré s'affiche en haut du builder
- Tous les inputs sont **vierges** et prêts à être remplis
- Les tâches (tasks) du template sont **prêtes à être exécutées**
- Les outputs sont **configurés** pour recevoir les résultats

---

## 📋 Structure du Workflow Créé

Chaque workflow créé depuis un template a la structure suivante:

```javascript
{
  id: "workflow_1763043699342_w4d5un7...",  // Unique
  name: "Mon Workflow Custom",                // Votre nom personnalisé
  description: "",                            // À remplir si souhaité
  
  inputs: [],     // Champs à remplir
  tasks: [],      // Tâches du template
  outputs: [],    // Sorties configurées
  
  createdAt: "2025-11-13T14:30:00Z",
  updatedAt: "2025-11-13T14:30:00Z",
  
  fromTemplate: {                             // Traçabilité
    templateId: "template_abc123",
    templateName: "Image Génération",
    createdFrom: "2025-11-13T14:30:00Z"
  }
}
```

---

## 🔄 Flux Complet Détaillé

```
┌─ TemplateManager ────────────────────────────────────────┐
│                                                            │
│  ┌─ Grille de Templates ────────────────────────────────┐ │
│  │                                                       │ │
│  │  📦 Template 1              📦 Template 2            │ │
│  │  "Image Génération"         "Video Édition"         │ │
│  │  [+ Créer]                  [+ Créer]               │ │
│  │                                                       │ │
│  └─────────────────────────────────────────────────────┘ │
│                          │                                 │
│                          └─→ Clic sur [+ Créer]           │
│                                                            │
│  ┌─ Dialog de Nommage ──────────────────────────────────┐ │
│  │                                                       │ │
│  │  Donner un nom au nouveau workflow:                 │ │
│  │  ┌──────────────────────────────────────────────┐  │ │
│  │  │ "Image Génération (1)"                       │  │ │
│  │  │ "Mon premier workflow" ← Éditable            │  │ │
│  │  └──────────────────────────────────────────────┘  │ │
│  │                                                       │ │
│  │  [Annuler]                      [Créer]              │ │
│  │                                                       │ │
│  └─────────────────────────────────────────────────────┘ │
│                          │                                 │
│                          └─→ Clic [Créer]                 │
│                                                            │
└────────────────────────────────────────────────────────────┘
                            │
                            │ 1. Copie profonde du workflow
                            │ 2. Normalisation structure
                            │ 3. Génération nouvel ID
                            │ 4. Ajout métadonnées
                            │ 5. Stockage localStorage
                            │
                            ▼
┌─ WorkflowBuilder ────────────────────────────────────────┐
│                                                            │
│  ┌─ Header ──────────────────────────────────────────┐   │
│  │ 🔨 Workflow Builder                             │   │
│  │ 🏷️  Mon premier workflow                         │   │
│  │ (Nom pré-rempli avec votre personnalisation)    │   │
│  └────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─ Actions Panel ────────────────────────────────┐   │
│  │ [Charger depuis saved]                          │   │
│  │ [Exécuter] (Grayed out si vide)                │   │
│  │ [Sauvegarder] [Sauvegarder comme template]     │   │
│  │ [Vider]                                         │   │
│  └────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─ Sections ─────────────────────────────────────┐   │
│  │                                                 │   │
│  │ 📥 Données d'entrée (Inputs)                  │   │
│  │    • (Vide) Prêt à être configuré             │   │
│  │                                                 │   │
│  │ ⚙️  Tâches (Tasks)                            │   │
│  │    • Task 1: generate_image (du template)     │   │
│  │    • Task 2: [si présente dans le template]   │   │
│  │                                                 │   │
│  │ 📤 Données de sortie (Outputs)                │   │
│  │    • Output 1: image (prêt à recevoir)        │   │
│  │                                                 │   │
│  └────────────────────────────────────────────────┘   │
│                                                         │
│  🎉 WORKFLOW PRÊT À ÊTRE UTILISÉ!                     │
│                                                         │
└────────────────────────────────────────────────────────┘
```

---

## 💾 Données Persistées

Quand vous transformez un template en workflow:

1. **Dans localStorage**:
   - Stocké avec structure `{ name, inputs, tasks, outputs }`
   - Automatiquement rechargé à la prochaine visite
   - Persiste à travers les actualisations de page

2. **Métadonnées de traçabilité** (fromTemplate):
   - ID du template d'origine
   - Nom du template d'origine
   - Date de création depuis template
   - Permet de tracer d'où vient le workflow

3. **ID unique généré**:
   - Format: `workflow_{timestamp}_{random}`
   - Garantit l'unicité même avec plusieurs créations
   - Exemple: `workflow_1763043699342_w4d5un7g2`

---

## ✨ Fonctionnalités Clés

### ✅ Normalisation Automatique
- **Avant**: Les templates peuvent avoir une structure incomplète
- **Après**: Conversion automatique en structure complète v2
- Toujours: `{ name, inputs, tasks, outputs }`

### ✅ Validation des Données
- Tous les champs requis sont pré-initialisés
- Aucune donnée manquante ne peut briser le workflow
- Gestion des cas limites: null, undefined, structures vides

### ✅ Métadonnées de Traçabilité
- Sachez d'où vient chaque workflow
- Retrouvez le template d'origine facilement
- Date de création depuis template

### ✅ Sauvegarde Automatique
- Le workflow est sauvegardé dès sa création
- Récupérable à la prochaine visite
- Aucune action supplémentaire nécessaire

---

## 🔧 Formats Supportés

### Templates Incomplets (Ancienne Structure)
```javascript
{
  workflow: {
    tasks: [...]
    // Pas d'inputs ni outputs
  }
}
```
✅ **Automatiquement normalisé** en:
```javascript
{
  inputs: [],
  tasks: [...],
  outputs: []
}
```

### Templates Complets (Nouvelle Structure)
```javascript
{
  workflow: {
    inputs: [...],
    tasks: [...],
    outputs: [...]
  }
}
```
✅ **Préservé tel quel** (aucune perte de données)

---

## 🐛 Dépannage

### "Le workflow ne s'affiche pas"
1. Vérifiez que le template a au moins une tâche (task)
2. Cliquez sur l'onglet **"Tâches"** pour voir les tasks du template
3. Actualisez la page (F5)

### "Les inputs ne sont pas visibles"
1. Cliquez sur l'onglet **"Données d'entrée"**
2. Les inputs du template doivent s'afficher
3. Si vide, c'est normal - le template n'avait pas d'inputs définis

### "Les outputs manquent"
1. Cliquez sur l'onglet **"Données de sortie"**
2. Les outputs du template doivent s'afficher
3. Si vide, vous devrez configurer les outputs manuellement

### "Le workflow ne persiste pas"
1. Vérifiez que votre navigateur autorise localStorage
2. Ouvrez la console (F12) et vérifiez les erreurs
3. Essayez de recharger la page

---

## 📊 Exemple Concret

### Avant (Template)
```
📦 Template: "Image Génération"
   • 0 inputs (vide)
   • 1 task: generate_image
   • 0 outputs (vide)
```

### Après (Workflow Créé)
```
🔄 Workflow: "Mon premier workflow"
   ID: workflow_1763043699342_w4d5un7g2
   
   ✓ 0 inputs (normalisé en array vide)
   ✓ 1 task: generate_image (copié du template)
   ✓ 0 outputs (normalisé en array vide)
   
   📋 fromTemplate:
      • templateId: template_abc123
      • templateName: "Image Génération"
      • createdFrom: 2025-11-13T14:30:00Z
```

---

## 🎓 Meilleure Pratique

1. **Créer depuis template** pour structure pré-configurée
2. **Éditer dans le builder** pour personnaliser
3. **Sauvegarder comme template** pour réutilisation ultérieure
4. **Sauvegarder comme workflow** pour modification ultérieure

**Cycle recommandé**:
```
Template → Workflow → Exécution → Sauvegarder Résultat
   ↑                                    ↓
   └──────── Sauvegarder comme Template ←┘
```

---

## ✅ Validation

- ✅ Flux complet template → workflow fonctionnel
- ✅ Tous les formats supportés
- ✅ Cas limites gérés
- ✅ Pas d'erreurs de compilation
- ✅ Tests passent

---

**Version**: 1.0  
**Date**: 2025-11-13  
**Status**: ✅ Opérationnel
