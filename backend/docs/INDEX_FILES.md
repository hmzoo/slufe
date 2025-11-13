# Index des Fichiers - Système de Variables Workflow

## 📑 Documentation

### 1. TASK_VARIABLES_REFERENCE.md
**Chemin**: `frontend/src/config/TASK_VARIABLES_REFERENCE.md`  
**Type**: Documentation Markdown (350+ lignes)  
**Usage**: Référence complète de toutes les variables disponibles par tâche  
**Public**: Développeurs et utilisateurs avancés

### 2. VARIABLES_USAGE.md
**Chemin**: `frontend/src/config/VARIABLES_USAGE.md`  
**Type**: Guide d'utilisation  
**Usage**: Comment utiliser le système de variables (code + exemples)  
**Public**: Développeurs

### 3. SESSION_SUMMARY.md
**Chemin**: `SESSION_SUMMARY.md`  
**Type**: Récapitulatif session  
**Usage**: Détail de toutes les modifications effectuées  
**Public**: Développeurs et reviewers

### 4. COMMIT_MESSAGE.md
**Chemin**: `COMMIT_MESSAGE.md`  
**Type**: Message de commit  
**Usage**: Template pour commit Git  
**Public**: Git history

### 5. INDEX_FILES.md
**Chemin**: `INDEX_FILES.md` (ce fichier)  
**Type**: Index  
**Usage**: Navigation rapide dans les fichiers  
**Public**: Tous

## 💾 Données

### 6. taskMetadata.json
**Chemin**: `frontend/src/config/taskMetadata.json`  
**Type**: Métadonnées JSON  
**Contenu**: 12 tâches avec préfixes, exemples, descriptions  
**Usage**: Import/export, référence externe  
**Public**: Code (importable)

## 🔧 Code Utilitaire

### 7. variableHelper.js
**Chemin**: `frontend/src/utils/variableHelper.js`  
**Type**: Helper JavaScript (11 fonctions)  
**Exports**:
- `getTaskMetadata(taskType)`
- `getTaskOutputs(taskType)`
- `getTaskVariableInputs(taskType)`
- `formatVariable(taskId, outputKey)`
- `parseVariable(variable)`
- `isVariable(value)`
- `getAvailableVariables(tasks, currentTaskId)`
- `filterVariablesByType(variables, targetType)`
- `suggestTaskId(taskType, existingTasks)`
- `generateTaskDocumentation(taskType)`
- `validateVariableReference(variable, tasks, currentTaskId)`

**Usage**: Manipulation variables, validation, autocomplétion  
**Public**: Code (importable)

## 🎨 Composants UI

### 8. VariableHelper.vue
**Chemin**: `frontend/src/components/VariableHelper.vue`  
**Type**: Composant Vue 3 + Quasar  
**Props**:
- `tasks` (Array): Liste des tâches du workflow
- `currentTaskId` (String): ID de la tâche courante

**Events**:
- `@select`: Émis quand une variable est sélectionnée

**Features**:
- Liste toutes les variables disponibles
- Filtrage par type (Images/Vidéos/Texte/Toutes)
- Copie au clic
- Icônes et couleurs par type

**Usage**: Panneau latéral dans WorkflowBuilder  
**Public**: UI

### 9. TaskVariableInfo.vue
**Chemin**: `frontend/src/components/TaskVariableInfo.vue`  
**Type**: Composant Vue 3 + Quasar  
**Props**:
- `taskType` (String): Type de tâche
- `taskId` (String, optionnel): ID de la tâche

**Features**:
- Affiche préfixe suggéré et exemple
- Liste cliquable des outputs
- Dialog documentation complète
- Copie output au clic

**Usage**: Info compacte dans formulaire tâche  
**Public**: UI

## 📊 Hiérarchie des fichiers

```
slufe/
├── COMMIT_MESSAGE.md (nouveau)
├── SESSION_SUMMARY.md (nouveau)
├── INDEX_FILES.md (nouveau, ce fichier)
│
├── frontend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── taskDefinitions.js (modifié: +métadonnées, +params)
│   │   │   ├── taskMetadata.json (nouveau)
│   │   │   ├── TASK_VARIABLES_REFERENCE.md (nouveau)
│   │   │   └── VARIABLES_USAGE.md (nouveau)
│   │   │
│   │   ├── utils/
│   │   │   └── variableHelper.js (nouveau)
│   │   │
│   │   └── components/
│   │       ├── CollectionMediaGallery.vue (modifié: fix sélection)
│   │       ├── VariableHelper.vue (nouveau)
│   │       └── TaskVariableInfo.vue (nouveau)
│   │
│   └── ...
│
└── backend/
    └── services/
        └── tasks/
            ├── GenerateVideoI2VTask.js (modifié: normalisation)
            └── EditImageTask.js (modifié: +6 params, normalisation)
```

## 🔗 Relations entre fichiers

### Documentation ↔ Code

```
TASK_VARIABLES_REFERENCE.md  ←→  taskDefinitions.js
      (référence)                  (source de vérité)
           ↓
   taskMetadata.json
      (export JSON)
           ↓
   variableHelper.js
   (lecture métadonnées)
           ↓
   VariableHelper.vue + TaskVariableInfo.vue
        (affichage UI)
```

### Flow d'utilisation

```
1. Développeur ouvre WorkflowBuilder
2. Sélectionne une tâche (ex: edit_image)
3. <TaskVariableInfo> affiche:
   - Préfixe: "edit"
   - Exemple: "{{edit1.edited_image}}"
   - Outputs: [edited_image, edited_images]
4. Développeur clique sur bouton "Variables disponibles"
5. <VariableHelper> affiche toutes les variables des tâches précédentes
6. Développeur clique sur "{{img1.image}}"
7. Variable copiée dans presse-papier
8. Développeur colle dans champ "image1"
9. variableHelper.validateVariableReference() valide la référence
10. Workflow sauvegardé et exécuté
```

## 📖 Par usage

### Pour comprendre le système
1. `VARIABLES_USAGE.md` - Guide complet
2. `SESSION_SUMMARY.md` - Détail des changements

### Pour référence rapide
1. `TASK_VARIABLES_REFERENCE.md` - Toutes les variables
2. `taskMetadata.json` - Métadonnées JSON

### Pour développer
1. `variableHelper.js` - Fonctions utilitaires
2. `taskDefinitions.js` - Définitions enrichies
3. `VariableHelper.vue` - Composant liste
4. `TaskVariableInfo.vue` - Composant info

### Pour review code
1. `COMMIT_MESSAGE.md` - Résumé commit
2. `SESSION_SUMMARY.md` - Changements détaillés
3. Git diff des 4 fichiers modifiés

## 🎯 Fichiers principaux par rôle

| Rôle | Fichier principal | Alternative |
|------|------------------|-------------|
| **Documentation utilisateur** | `TASK_VARIABLES_REFERENCE.md` | `VARIABLES_USAGE.md` |
| **Métadonnées structurées** | `taskMetadata.json` | `taskDefinitions.js` |
| **Logique métier** | `variableHelper.js` | - |
| **UI liste variables** | `VariableHelper.vue` | - |
| **UI info tâche** | `TaskVariableInfo.vue` | - |
| **Définitions tâches** | `taskDefinitions.js` | - |

## 🔍 Recherche rapide

### Trouver préfixe d'une tâche
→ `TASK_VARIABLES_REFERENCE.md` section "Préfixes suggérés"  
→ `taskMetadata.json` clé `variablePrefix`

### Trouver outputs disponibles
→ `TASK_VARIABLES_REFERENCE.md` section tâche → "Outputs"  
→ `taskDefinitions.js` tâche → `outputs`

### Comprendre validation
→ `VARIABLES_USAGE.md` section "Validation des variables"  
→ `variableHelper.js` fonction `validateVariableReference()`

### Exemples de workflows
→ `TASK_VARIABLES_REFERENCE.md` section "Exemples de workflows"  
→ `VARIABLES_USAGE.md` section "Exemples de workflows"

## 📏 Tailles des fichiers

| Fichier | Lignes | Taille estimée |
|---------|--------|----------------|
| `TASK_VARIABLES_REFERENCE.md` | 350+ | ~15 KB |
| `VARIABLES_USAGE.md` | 450+ | ~20 KB |
| `SESSION_SUMMARY.md` | 450+ | ~25 KB |
| `taskMetadata.json` | 80+ | ~3 KB |
| `variableHelper.js` | 300+ | ~10 KB |
| `VariableHelper.vue` | 200+ | ~6 KB |
| `TaskVariableInfo.vue` | 200+ | ~6 KB |
| `COMMIT_MESSAGE.md` | 110+ | ~4 KB |
| `INDEX_FILES.md` | 300+ | ~12 KB |
| **Total** | **2440+** | **~100 KB** |

## ✅ Checklist d'intégration

Pour intégrer ce système dans le projet:

- [ ] Importer `variableHelper.js` dans `WorkflowBuilder.vue`
- [ ] Ajouter `<TaskVariableInfo>` dans formulaire tâche
- [ ] Ajouter `<VariableHelper>` dans panneau latéral
- [ ] Implémenter validation au save workflow
- [ ] Tester sélection images (fix CollectionMediaGallery)
- [ ] Tester transmission paramètres (normalisation backend)
- [ ] Créer workflows d'exemple
- [ ] Mettre à jour documentation utilisateur
- [ ] Review code et merge

## 🔗 Liens utiles

### Documentation interne
- [TASK_VARIABLES_REFERENCE.md](frontend/src/config/TASK_VARIABLES_REFERENCE.md)
- [VARIABLES_USAGE.md](frontend/src/config/VARIABLES_USAGE.md)
- [SESSION_SUMMARY.md](SESSION_SUMMARY.md)

### Code
- [variableHelper.js](frontend/src/utils/variableHelper.js)
- [VariableHelper.vue](frontend/src/components/VariableHelper.vue)
- [TaskVariableInfo.vue](frontend/src/components/TaskVariableInfo.vue)
- [taskDefinitions.js](frontend/src/config/taskDefinitions.js)

### Métadonnées
- [taskMetadata.json](frontend/src/config/taskMetadata.json)

---

**Dernière mise à jour**: 2025-01-05  
**Version**: 1.0  
**Status**: ✅ Complet et prêt pour intégration
