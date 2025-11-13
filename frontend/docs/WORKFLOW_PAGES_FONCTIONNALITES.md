# 📋 Fonctionnalités des Pages Workflow

## 📅 Date: 6 novembre 2025

---

## 🎯 Vue d'Ensemble

Le système Workflow de SLUFE comprend **3 composants principaux** qui gèrent l'ensemble du cycle de vie des workflows d'automatisation multimédia.

---

## 1️⃣ WorkflowBuilder.vue (WorkflowBuilderView.vue)

### 🎨 **Rôle**: Interface de création/édition de workflows

### 📊 **Fonctionnalités Principales**

#### **A. Gestion de la Structure Workflow**
```
Workflow v2 Structure:
{
  inputs: [],    // Tâches de collecte de données
  tasks: [],     // Tâches de traitement
  outputs: []    // Tâches de sauvegarde/export
}
```

**Actions**:
- ✅ Créer un nouveau workflow vierge
- ✅ Navigation par onglets (Inputs → Tasks → Outputs → Results)
- ✅ Glisser-déposer (drag & drop) pour réorganiser les tâches
- ✅ Ajout de tâches depuis la bibliothèque (panneau latéral)
- ✅ Édition de tâches (paramètres, entrées/sorties)
- ✅ Suppression de tâches
- ✅ Déplacement up/down dans la séquence

#### **B. Intégration Collection de Médias**
- ✅ Affichage de la collection active (en-tête)
- ✅ Mini-galerie médias (8 premiers médias)
- ✅ Mode sélection batch (sélectionner plusieurs médias)
- ✅ Sélection simple via `CollectionMediaSelector`
- ✅ Avertissement si aucune collection active

#### **C. Configuration des Tâches**

**Types de paramètres supportés**:
- `text` - Champs texte simples
- `number` - Valeurs numériques
- `image_url` - Sélection d'image depuis collection
- `select` - Menu déroulant d'options
- `slider` - Curseur de valeurs
- `boolean` - Cases à cocher
- `lora` - Configuration LoRA (pour vidéo)

**Fonctionnalités avancées**:
- 📝 Variables workflow (`${inputs.task_id.output_key}`)
- 🔍 Explorateur de variables (dialog)
- 📸 Sélection image depuis collection
- ⬆️ Upload image directement
- 🎬 Configuration LoRA pour génération vidéo

#### **D. Exécution & Résultats**

**Exécution**:
- ✅ Validation du workflow (vérifier inputs/tasks/outputs)
- ✅ Exécution séquentielle des tâches
- ✅ Affichage progression en temps réel
- ✅ Gestion des erreurs par tâche
- ✅ Rollback en cas d'échec

**Résultats**:
- ✅ Affichage des outputs par tâche
- ✅ Preview images générées
- ✅ Preview vidéos générées (player intégré)
- ✅ Métadonnées de génération
- ✅ Sauvegarde automatique dans collection
- ✅ Téléchargement manuel des résultats

#### **E. Sauvegarde & Templates**

- ✅ **Sauvegarder workflow** (nom + description)
- ✅ **Sauvegarder comme template** (réutilisable)
- ✅ **Charger workflow existant**
- ✅ **Réinitialiser workflow**
- ✅ **Auto-save** (brouillon local)

---

## 2️⃣ WorkflowManager.vue (WorkflowManagerView.vue)

### 🎨 **Rôle**: Gestion et organisation des workflows sauvegardés

### 📊 **Fonctionnalités Principales**

#### **A. Affichage des Workflows**

**Modes d'affichage**:
- 📊 **Vue Grille** (cartes workflows)
- 📋 **Vue Liste** (tableau compact)

**Informations affichées**:
- Nom du workflow
- Description
- Date de création
- Dernière modification
- Nombre de tâches (inputs + tasks + outputs)
- Statut (draft, ready, error)
- Tags/catégories

#### **B. Recherche & Filtrage**

**Recherche**:
- 🔍 Recherche par nom
- 🔍 Recherche par description
- 🔍 Recherche par tags

**Tri**:
- ⏰ Plus récent
- ⏰ Plus ancien
- 🔤 Alphabétique (A-Z)
- 🔤 Alphabétique (Z-A)
- 📊 Par nombre de tâches
- ⭐ Par favoris

**Filtres**:
- ✅ Workflows actifs
- ✅ Drafts (brouillons)
- ✅ Templates
- ✅ Favoris

#### **C. Actions sur Workflows**

**Actions individuelles**:
- ✏️ **Éditer** - Ouvrir dans WorkflowBuilder
- ▶️ **Exécuter** - Lancer l'exécution
- 📋 **Dupliquer** - Créer une copie
- 🔖 **Template** - Convertir en template
- ⭐ **Favori** - Marquer comme favori
- 🗑️ **Supprimer** - Suppression avec confirmation
- 📤 **Exporter** - Export JSON du workflow
- 📊 **Statistiques** - Historique d'exécution

**Actions groupées**:
- ✅ Sélection multiple
- 🗑️ Suppression en masse
- 📤 Export multiple
- 🏷️ Ajout tags en masse

#### **D. Création & Import**

- ➕ **Nouveau workflow** - Ouvre WorkflowBuilder vierge
- 📥 **Importer workflow** - Import depuis JSON
- 📝 **Depuis template** - Créer depuis template existant

#### **E. Organisation**

**Catégories**:
- 📁 Tous les workflows
- 📁 Mes workflows
- 📁 Templates
- 📁 Favoris
- 📁 Récents

**Tags**:
- 🏷️ Ajout/suppression tags
- 🏷️ Filtrage par tags
- 🏷️ Gestion des tags globaux

---

## 3️⃣ WorkflowRunner.vue

### 🎨 **Rôle**: Exécution et monitoring de workflows

**⚠️ Note**: Ce composant semble être une **version obsolète** ou **prototype** contenant un builder complet intégré.

### 📊 **Fonctionnalités Détectées**

#### **A. Navigation Multi-Onglets**
```
Tabs principaux:
- builder   (Création workflow)
- templates (Gestion templates)
- workflows (Liste workflows sauvegardés)
- collections (Gestion collections médias)
```

**Analyse**: Ce composant **duplique** les fonctionnalités de:
- `WorkflowBuilder.vue` (onglet builder)
- `TemplateManager.vue` (onglet templates)
- `WorkflowManager.vue` (onglet workflows)
- `CollectionView.vue` (onglet collections)

#### **B. Builder Intégré**

**Fonctionnalités builder**:
- ✅ Même structure que WorkflowBuilder
- ✅ Inputs / Tasks / Outputs tabs
- ✅ Drag & drop
- ✅ Édition tâches
- ✅ Variables workflow
- ✅ Exécution

#### **C. Exécution Workflow**

**Monitoring**:
- 📊 Progression par tâche
- ⏱️ Temps d'exécution
- 📈 Statut en temps réel
- ❌ Gestion erreurs

**Résultats**:
- 🖼️ Preview outputs
- 📊 Métadonnées
- 💾 Sauvegarde automatique
- 📥 Téléchargement

---

## 🔄 Architecture Actuelle vs. Recommandée

### ❌ **Problème Identifié**

**WorkflowRunner.vue** = **Monolithe** qui fait tout:
- Builder complet (doublon de WorkflowBuilder)
- Gestion templates (doublon de TemplateManager)
- Gestion workflows (doublon de WorkflowManager)
- Gestion collections (doublon de CollectionView)

**Conséquences**:
- 🔴 Code dupliqué (~1630 lignes)
- 🔴 Maintenance difficile (3 endroits pour modifier le builder)
- 🔴 Confusion architecturale
- 🔴 Bugs potentiels (incohérences entre versions)

### ✅ **Architecture Recommandée**

#### **Option 1: Supprimer WorkflowRunner** (Recommandé)
```
❌ WorkflowRunner.vue (1630L)

✅ WorkflowBuilder.vue (création/édition)
✅ WorkflowManager.vue (gestion/liste)
✅ Exécution dans WorkflowBuilder (déjà présent)
```

**Justification**:
- WorkflowBuilder gère déjà l'exécution
- WorkflowManager gère déjà la liste
- Pas besoin d'un composant séparé

#### **Option 2: Refactorer WorkflowRunner** (Si besoin spécifique)
```
WorkflowRunner.vue (léger)
└── Composant dédié UNIQUEMENT à l'exécution
    ├── Affichage workflow readonly
    ├── Monitoring progression
    ├── Affichage résultats
    └── Contrôles exécution (play/pause/stop)
```

**Usage**: Exécution workflow **sans édition** (mode lecture seule)

---

## 📊 Matrice des Responsabilités

| Fonctionnalité | WorkflowBuilder | WorkflowManager | WorkflowRunner | Recommandation |
|---|---|---|---|---|
| **Créer workflow** | ✅ Principal | ➕ Bouton "Nouveau" | ✅ Doublon | Garder Builder uniquement |
| **Éditer workflow** | ✅ Principal | ➡️ Redirige vers Builder | ✅ Doublon | Garder Builder uniquement |
| **Lister workflows** | ❌ | ✅ Principal | ✅ Doublon | Garder Manager uniquement |
| **Exécuter workflow** | ✅ Intégré | ▶️ Lance exécution | ✅ Doublon | Garder Builder OU créer Runner léger |
| **Gérer templates** | 💾 Sauver comme template | ❌ | ✅ Doublon | Déplacer vers TemplateManager |
| **Gérer collections** | 🔗 Utilise collection active | ❌ | ✅ Doublon | Garder CollectionView uniquement |
| **Monitoring exécution** | ✅ Temps réel | ❌ | ✅ Doublon | Garder dans Builder OU Runner léger |
| **Afficher résultats** | ✅ Onglet Results | ❌ | ✅ Doublon | Garder dans Builder |

---

## 🎯 Recommandations

### **1. Nettoyage Immédiat**

**Supprimer WorkflowRunner.vue**:
```bash
# Vérifier qu'il n'est pas utilisé
grep -r "WorkflowRunner" frontend/src/

# Si uniquement importé, supprimer
rm frontend/src/components/WorkflowRunner.vue
```

**Justification**:
- ✅ WorkflowBuilder gère création + édition + exécution
- ✅ WorkflowManager gère liste + organisation
- ✅ Pas de valeur ajoutée de WorkflowRunner
- ✅ -1630 lignes de code dupliqué

### **2. Clarification des Rôles**

```
WorkflowBuilder (WorkflowBuilderView)
└── Interface UNIQUE de création/édition/exécution

WorkflowManager (WorkflowManagerView)
└── Interface UNIQUE de gestion/organisation

TemplateManager (TemplateManagerView)
└── Interface UNIQUE de gestion templates
```

### **3. Migration Future (Architecture)**

```
views/
├── WorkflowBuilderView.vue   ← Création/édition
└── WorkflowManagerView.vue    ← Gestion/liste

features/workflow/components/
├── TaskCard.vue               ← Carte de tâche
├── WorkflowExecutor.vue       ← Logique exécution (extracté)
├── WorkflowResults.vue        ← Affichage résultats (extracté)
└── WorkflowProgressBar.vue    ← Barre progression (nouveau)
```

---

## 📝 Résumé Exécutif

### **Composants Actuels**

1. **WorkflowBuilder.vue** ✅ (1487L)
   - Rôle: Créer/éditer/exécuter workflows
   - État: **GARDER** - Composant principal

2. **WorkflowManager.vue** ✅ (558L)
   - Rôle: Gérer/organiser workflows sauvegardés
   - État: **GARDER** - Composant gestionnaire

3. **WorkflowRunner.vue** ❌ (1630L)
   - Rôle: Tout faire (builder + manager + templates + collections)
   - État: **SUPPRIMER** - Doublon monolithique

### **Actions Recommandées**

```bash
# 1. Vérifier utilisation WorkflowRunner
grep -r "WorkflowRunner" frontend/src/ --include="*.vue"

# 2. Si non utilisé, supprimer
rm frontend/src/components/WorkflowRunner.vue

# 3. Commit
git add -A
git commit -m "🗑️ Suppression WorkflowRunner - doublon monolithique

- WorkflowRunner.vue (1630L) dupliquait Builder + Manager + Templates
- Fonctionnalités déjà présentes dans composants spécialisés
- -1630 lignes de code dupliqué
- Architecture clarifiée"
```

---

## 🎉 Conclusion

**WorkflowBuilder** et **WorkflowManager** sont les **2 seuls composants nécessaires** pour gérer tout le cycle de vie des workflows. **WorkflowRunner** est un artifact historique qui devrait être supprimé pour clarifier l'architecture.

**Gain attendu**: -1630 lignes + architecture clarifiée ✨
