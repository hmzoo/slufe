# 🚀 SLUFE Workflow Builder v2 - Nouvelle Version

## 📋 Vue d'ensemble

La nouvelle version du Workflow Builder apporte des améliorations majeures pour créer des workflows d'IA plus puissants et intuitifs. Cette version v2 introduit la gestion complète des images, la persistence des workflows, et une interface utilisateur grandement améliorée.

## ✨ Nouvelles fonctionnalités

### 🖼️ **Gestion complète des images**
- **Sélection d'images** depuis vos collections avec galerie visuelle
- **Upload direct** de nouvelles images depuis l'éditeur de tâches
- **Aperçus en temps réel** des images sélectionnées
- **Support des variables d'images** pour lier les tâches entre elles
- **Tâches d'édition d'image** entièrement fonctionnelles

### 💾 **Persistence des workflows**
- **Sauvegarde automatique** - vos workflows ne sont plus perdus en changeant d'onglet
- **Restauration automatique** du workflow en cours au redémarrage
- **Gestion des versions** - possibilité de mettre à jour ou créer de nouvelles versions
- **Synchronisation** entre le builder et le gestionnaire de workflows

### 🎯 **Interface utilisateur améliorée**
- **Galerie d'images** avec grandes vignettes pour une sélection visuelle optimale
- **Aperçus d'images** directement dans les cartes de tâches
- **Boutons de variables** pour tous les champs compatibles
- **Indicateurs visuels** pour distinguer les URLs d'images des variables

## 🔧 Nouvelles tâches disponibles

### **Tâches d'entrée (Inputs)**
- **📤 Upload d'image** (`image_input`)
  - Sélection depuis les collections existantes
  - Upload de nouvelles images
  - Image principale + image par défaut
  - Support des images multiples

### **Tâches de traitement**
- **✂️ Éditer une image** (`edit_image`) 
  - Jusqu'à 3 images d'entrée simultanées
  - Prompts d'édition avec variables
  - Modèle Qwen Image Edit Plus
  - Paramètres avancés (ratio, format, etc.)

### **Tâches de sortie (Outputs)**
- **🖼️ Affichage d'image** (`image_output`)
  - Affichage optimisé des résultats
  - Support des métadonnées (titre, légende)
  - Largeurs configurables
  - Intégration automatique aux collections

## 🛠️ Améliorations techniques

### **Format de workflow v2**
```json
{
  "name": "Mon Workflow",
  "inputs": [
    {
      "id": "image1",
      "type": "image_input",
      "selectedImage": "/medias/image.jpg"
    }
  ],
  "tasks": [
    {
      "id": "edit1", 
      "type": "edit_image",
      "inputs": {
        "image1": "{{image1.image}}",
        "editPrompt": "turn 90 degrees right"
      }
    }
  ],
  "outputs": [
    {
      "id": "result1",
      "type": "image_output", 
      "inputs": {
        "image": "{{edit1.edited_images}}"
      }
    }
  ]
}
```

### **Système de variables avancé**
- **Résolution automatique** des dépendances entre tâches
- **Support des types complexes** (arrays d'images, objets)
- **Validation en temps réel** des liens entre tâches
- **Aperçu des variables** disponibles par contexte

### **Backend renforcé**
- **Services de tâches spécialisés** pour chaque type d'opération
- **Gestion robuste des erreurs** avec logs détaillés  
- **Optimisation des performances** pour les workflows complexes
- **Sauvegarde automatique** des résultats et assets

## 📚 Guide d'utilisation

### **1. Créer un workflow d'édition d'image**

1. **Ajoutez une tâche d'entrée** :
   - Onglet "Inputs" → "Upload d'image"
   - Configurez le libellé
   - Sélectionnez une image depuis vos collections ou uploadez-en une nouvelle

2. **Ajoutez une tâche d'entrée de texte** :
   - Onglet "Inputs" → "Saisie de texte" 
   - Saisissez le prompt d'édition (ex: "turn 90 degrees right")

3. **Ajoutez la tâche d'édition** :
   - Onglet "Tâches" → "Éditer une image"
   - Liez "Image 1" à votre input d'image (bouton `</>`)
   - Liez "Instructions d'édition" à votre input de texte

4. **Ajoutez la sortie** :
   - Onglet "Outputs" → "Affichage d'image"
   - Liez "Image" au résultat de l'édition

5. **Exécutez le workflow** :
   - Bouton "Exécuter le workflow"
   - Visualisez les résultats dans la section dédiée

### **2. Gérer vos workflows**

- **Sauvegarde** : Bouton "Sauvegarder" avec nom personnalisable
- **Chargement** : Onglet "Manager" → Sélectionner un workflow existant
- **Duplication** : Menu contextuel → "Dupliquer"
- **Export/Import** : Fonctions disponibles dans le gestionnaire

## 🎯 Cas d'usage types

### **Édition d'image simple**
```
Input Image → Edit Image → Output Image
```

### **Édition avec prompt dynamique** 
```
Input Image → Input Text → Edit Image → Output Image
```

### **Traitement multiple**
```
Input Images → Edit Image (batch) → Output Gallery
```

### **Pipeline complexe**
```
Input Image → Analyze → Enhance Prompt → Edit Image → Output Image
```

## 🚨 Notes importantes

### **Compatibilité**
- ✅ **Workflows v1** : Automatiquement migrés vers le format v2
- ✅ **Collections existantes** : Pleine compatibilité maintenue
- ✅ **APIs externes** : Aucun changement côté services IA

### **Performance** 
- **Persistence localStorage** : Workflows sauvegardés localement
- **Chargement optimisé** : Images mises en cache
- **Exécution asynchrone** : Interface non-bloquante

### **Limitations connues**
- **Taille des images** : Limite de 10MB par image uploadée
- **Nombre de tâches** : Recommandé max 20 tâches par workflow
- **Variables circulaires** : Détection et prévention automatique

## 🔜 Évolutions prévues

- **Tâches de génération d'image** (text-to-image)
- **Workflows collaboratifs** (partage entre utilisateurs)  
- **Templates prédéfinis** pour les cas d'usage courants
- **Exécution conditionnelle** (if/then/else)
- **Boucles et itérations** pour le traitement en batch

## 📞 Support

Pour toute question ou problème :
- **Logs détaillés** disponibles dans la console navigateur (F12)
- **Logs backend** dans le terminal de développement
- **Validation automatique** des workflows avant exécution
- **Messages d'erreur contextuels** pour un debugging facilité

---

**Version** : 2.0.0  
**Date** : Novembre 2025  
**Statut** : Production Ready ✅