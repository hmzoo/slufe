# 📦 Fonctionnalité - Sauvegarder le Workflow comme Template

## 📋 Vue d'ensemble

Ajout d'une fonctionnalité pour **sauvegarder le workflow en cours comme template** directement depuis le **Workflow Builder**, permettant aux utilisateurs de créer des templates réutilisables à partir de leurs workflows.

## 🎯 Objectif

- Transformer un workflow complet en template réutilisable
- Automatiser le nettoyage des données (vidage des inputs)
- Offrir une meilleure UX en gardant le contexte du builder
- Éviter le besoin de naviguer vers le gestionnaire de workflows

## 📍 Localisation

**Interface:** Panneau latéral droit - Section "Actions" du Workflow Builder

**Position:** Entre le bouton "Sauvegarder" et le bouton "Vider"

**Affichage:**
```
🎬 Actions

🏷️ Nom du workflow
[Mon Workflow] [X]

[▶️ Exécuter                ]
[💾 Sauvegarder            ]
[📦 Sauvegarder comme template]  ← NOUVEAU
[🗑️ Vider                 ]
```

## 🔘 Bouton

**Libellé:** "Sauvegarder comme template"

**Icône:** `save_as` (disquette avec flèche)

**Couleur:** Info (bleu ciel)

**État:**
- ✅ Actif si le workflow contient au moins une tâche
- ❌ Désactivé si le workflow est vide

**Binding:** `:disable="!canExecuteWorkflow"`

## 🔄 Flux de Fonctionnement

### Étape 1: Cliquer sur le Bouton

```
User → Clic "Sauvegarder comme template"
```

### Étape 2: Dialog de Confirmation

```
┌───────────────────────────────────────────┐
│ 📦 Sauvegarder comme template             │
│                                           │
│ Créer un template réutilisable à partir   │
│ de ce workflow                            │
│                                           │
│ 🏷️ Nom du template *                      │
│ [Mon Workflow (Template)] [Annuler] [OK]  │
└───────────────────────────────────────────┘
```

**Paramètres:**
- **Title:** "Sauvegarder comme template"
- **Message:** Description du processus
- **Input:** Nom du template (pré-rempli avec `currentWorkflow.name + " (Template)"`)
- **Validation:** Le nom est requis (non-vide)

### Étape 3: Traitement

```javascript
1. Valider le nom du template
   ❌ Si vide → Notification d'erreur et arrêt
   
2. Migrer le workflow au format v2
   const migratedWorkflow = migrateWorkflowToV2(currentWorkflow.value)
   
3. Créer l'objet templateData:
   {
     name: "Nom saisi",
     description: "Template créé à partir du workflow...",
     category: "custom",
     icon: "dashboard",
     workflow: migratedWorkflow,  // Nettoyé automatiquement
     originalWorkflowId: currentWorkflow.value.id,
     tags: []
   }
   
4. Sauvegarder le template via le store
   await templateStore.createTemplate(templateData)
   
5. Afficher notification de succès
```

### Étape 4: Succès

```
✅ Notification positive:
   "Template 'Mon Workflow (Template)' créé avec succès"
   "Les inputs et outputs ont été vidés pour réutilisation"
```

### Étape 5: Erreur (optionnel)

```
❌ Si erreur lors de la création:
   "Erreur lors de la création du template"
   "[Message d'erreur détaillé]"
```

## 🔧 Implémentation Technique

### Fichier Modifié

**`frontend/src/components/WorkflowBuilder.vue`**

### 1. Import du Store Template

**Ligne ~790:**
```javascript
import { useTemplateStore } from 'src/stores/useTemplateStore'

const templateStore = useTemplateStore()
```

### 2. Ajout du Bouton

**Ligne ~415-420:**
```vue
<q-btn 
  color="info" 
  icon="save_as" 
  label="Sauvegarder comme template" 
  @click="saveAsTemplate" 
  outline
  class="full-width" 
  :disable="!canExecuteWorkflow" 
/>
```

### 3. Fonction saveAsTemplate()

**Ligne ~1560-1620:**
```javascript
const saveAsTemplate = () => {
  const currentName = currentWorkflow.value.name || 'Nouveau workflow'
  
  $q.dialog({
    title: 'Sauvegarder comme template',
    message: 'Créer un template réutilisable à partir de ce workflow',
    prompt: {
      model: currentName + ' (Template)',
      isValid: val => val && val.length > 0,
      type: 'text',
      label: 'Nom du template *'
    },
    ok: {
      label: 'Créer template',
      color: 'primary'
    },
    cancel: {
      label: 'Annuler',
      color: 'grey'
    }
  }).onOk(async (templateName) => {
    try {
      if (!templateName.trim()) {
        $q.notify({
          type: 'negative',
          message: 'Le nom du template est requis',
          position: 'top'
        })
        return
      }

      // Migrer au format v2
      const migratedWorkflow = migrateWorkflowToV2(currentWorkflow.value)

      // Créer le template
      const templateData = {
        name: templateName.trim(),
        description: `Template créé à partir du workflow "${currentName}" - ${new Date().toLocaleDateString()}`,
        category: 'custom',
        icon: 'dashboard',
        workflow: migratedWorkflow,
        originalWorkflowId: currentWorkflow.value.id || null,
        tags: []
      }
      
      await templateStore.createTemplate(templateData)
      
      $q.notify({
        type: 'positive',
        message: `Template "${templateName}" créé avec succès`,
        caption: 'Les inputs et outputs ont été vidés pour réutilisation',
        position: 'top',
        timeout: 3000
      })
    } catch (error) {
      console.error('Erreur création template:', error)
      $q.notify({
        type: 'negative',
        message: 'Erreur lors de la création du template',
        caption: error.message,
        position: 'top'
      })
    }
  })
}
```

## 📊 Cas d'Usage

### Cas 1: Créer un Template depuis un Workflow en Cours

```
1. User construit un workflow complet dans le builder
   - Ajoute des tâches (input, traitement, output)
   - Configure chaque tâche
   - Teste le workflow

2. User clique "Sauvegarder comme template"

3. Dialog demande le nom du template
   - Pré-rempli: "Mon Workflow (Template)"
   - User peut modifier

4. User valide

5. Template créé et sauvegardé
   ✅ Les champs d'entrée sont vidés automatiquement
   ✅ Le template est prêt à être réutilisé
   ✅ Notification de succès affichée

6. User peut maintenant:
   - Réutiliser le template plusieurs fois
   - Partager le template avec d'autres
   - Modifier le workflow en cours sans affecter le template
```

### Cas 2: Rapidité de Création

```
AVANT: 
1. Créer le workflow dans le builder
2. Sauvegarder le workflow
3. Aller dans "Gestionnaire de Workflows"
4. Clic droit → "Sauvegarder comme template"
5. Confirmer les paramètres du template
Total: 5 étapes, navigation multiple

APRÈS:
1. Créer le workflow dans le builder
2. Cliquer "Sauvegarder comme template"
3. Confirmer le nom
Total: 3 étapes, sans navigation!
```

### Cas 3: Workflow Existant à Convertir

```
1. User charge un workflow existant
   - Depuis le gestionnaire
   - Apporte des modifications

2. Décide de créer un template
   - Clic "Sauvegarder comme template"
   - Donne un nom: "Édition Pro v1"

3. Template créé avec la version modifiée
   ✅ Sauvegarde le workflow aussi (séparement)
   ✅ Template contient les dernières modifications
```

## ✨ Fonctionnalités Clés

### 1. Nettoyage Automatique

```javascript
// Avant: Workflow avec données
{
  name: "Mon Workflow",
  inputs: [
    {
      type: "input_text",
      input: {
        label: "Entrez un prompt",
        userInput: "ma saisie"  // ❌ DONNÉES
      }
    }
  ]
}

// Après: Template nettoyé
{
  name: "Mon Workflow",
  inputs: [
    {
      type: "input_text",
      input: {
        label: "Entrez un prompt",
        userInput: ""  // ✅ VIDE
      }
    }
  ]
}
```

La fonction `cleanWorkflowForTemplate()` vide automatiquement tous les champs d'entrée.

### 2. Migration v2

```javascript
const migratedWorkflow = migrateWorkflowToV2(currentWorkflow.value)
```

Assure que le workflow est au format v2 avant sauvegarde.

### 3. Métadonnées Automatiques

```javascript
{
  description: `Template créé à partir du workflow "Mon Workflow" - 13/11/2025`
  originalWorkflowId: "workflow_xyz123"
  category: "custom"
  icon: "dashboard"
  tags: []
}
```

### 4. Validation

- ✅ Nom du template requis (non-vide)
- ✅ Workflow doit avoir au moins une tâche
- ✅ Gestion des erreurs avec notifications

## 🎯 Avantages Utilisateur

| Aspect | Bénéfice |
|--------|----------|
| **Rapidité** | Pas besoin de naviguer vers le gestionnaire |
| **Contexte** | Reste dans l'environnement du builder |
| **Efficacité** | Une action = un template créé |
| **Clarté** | Méta-données automatiques |
| **Sécurité** | Nettoyage automatique des données |
| **Productivité** | Facilite la réutilisation |

## 🧪 Tests de Vérification

### Test 1: Bouton Visible

1. Ouvrir le Workflow Builder
2. Regarder le panneau Actions
3. Expected: Bouton "Sauvegarder comme template" visible
4. ✅ Icône `save_as` visible
5. ✅ Couleur info (bleu ciel)
6. ✅ Positionné entre "Sauvegarder" et "Vider"

### Test 2: État du Bouton

**Désactivé:**
1. Builder vide (pas de tâches)
2. Expected: Bouton grisé et désactivé
3. Click: Pas de réaction

**Activé:**
1. Ajouter une tâche (ex: input_text)
2. Expected: Bouton devient actif
3. Click: Dialog s'ouvre

### Test 3: Dialog

1. Cliquer "Sauvegarder comme template"
2. Expected:
   - ✅ Dialog s'ouvre
   - ✅ Titre: "Sauvegarder comme template"
   - ✅ Message explicatif
   - ✅ Champ de saisie du nom pré-rempli
   - ✅ Boutons: "Annuler" et "Créer template"

### Test 4: Création Simple

1. Ajouter tâche: input_text + generate_image
2. Nommer le workflow: "Test Workflow"
3. Cliquer "Sauvegarder comme template"
4. Dialog: Accepter le nom proposé
5. Expected:
   - ✅ Notification: "Template créé avec succès"
   - ✅ Champ d'entrée vidé dans le template
   - ✅ Template visible dans "Gestionnaire de Templates"

### Test 5: Nom Personnalisé

1. Cliquer "Sauvegarder comme template"
2. Dialog: Modifier le nom → "Mon Template Personnalisé"
3. Confirmer
4. Expected:
   - ✅ Template créé avec le nouveau nom
   - ✅ Notification affiche le bon nom

### Test 6: Validation

1. Cliquer "Sauvegarder comme template"
2. Effacer le nom du champ
3. Cliquer "Créer template"
4. Expected:
   - ❌ Aucune action
   - ❌ Notification d'erreur: "Le nom du template est requis"
   - Dialog reste ouverte

### Test 7: Erreur

1. Si problème de connexion/stockage
2. Expected:
   - ❌ Notification d'erreur
   - Message détaillé fourni
   - Dialog se ferme

### Test 8: Workflow Existant

1. Charger un workflow du gestionnaire
2. Cliquer "Sauvegarder comme template"
3. Modifier le nom
4. Confirmer
5. Expected:
   - ✅ Template créé
   - ✅ Workflow original non modifié
   - ✅ Les deux coexistent

## 📝 Changelogs

```markdown
### Nouvelle Fonctionnalité

**Sauvegarder le Workflow comme Template**

- Ajout d'un bouton "Sauvegarder comme template" dans le panneau Actions
- Permet de convertir un workflow en template directement depuis le builder
- Nettoyage automatique des champs d'entrée
- Migration v2 et métadonnées automatiques
- Dialog de confirmation avec nom pré-rempli
- Notifications de succès/erreur
- Bouton désactivé si workflow vide

**Fichiers modifiés:**
- `frontend/src/components/WorkflowBuilder.vue`
  - Import du templateStore
  - Ajout du bouton "Sauvegarder comme template"
  - Implémentation de la fonction saveAsTemplate()
```

## 🚀 Prochaines Améliorations Possibles

1. **Catégories de Template**
   - Ajouter un select pour choisir la catégorie (custom, image, video, etc.)

2. **Tags**
   - Ajouter un champ pour entrer des tags

3. **Description Personnalisée**
   - Ajouter un textarea pour une description détaillée

4. **Aperçu du Template**
   - Afficher un aperçu du template avant confirmation

5. **Gestion des Versions**
   - Système de versioning pour les templates

6. **Historique de Templates**
   - Tracker les templates créés depuis le builder

## ✅ Checklist Implémentation

- ✅ Import du templateStore
- ✅ Bouton "Sauvegarder comme template" ajouté
- ✅ Icône et couleur correctes
- ✅ État du bouton (enable/disable) basé sur canExecuteWorkflow
- ✅ Dialog de confirmation
- ✅ Validation du nom
- ✅ Migration v2
- ✅ Création du templateData avec métadonnées
- ✅ Appel à templateStore.createTemplate()
- ✅ Gestion des erreurs
- ✅ Notifications (succès et erreur)
- ✅ Pas d'erreurs de compilation
- ✅ Documentation complète

**Status: ✨ IMPLÉMENTATION COMPLÈTE**
