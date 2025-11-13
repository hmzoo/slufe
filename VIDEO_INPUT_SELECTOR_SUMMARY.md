# Résumé: Sélection de vidéo pour la tâche "Upload de vidéo"

## Problème résolu
Le dialog d'édition de la tâche "Upload de vidéo" (`video_input`) n'affichait pas de champ pour sélectionner une vidéo depuis la collection, contrairement à la tâche "Upload d'image".

## Changement effectué

### Fichier modifié
`frontend/src/config/ioDefinitions.js`

### Modification
Ajout d'un input de type `video` dans la définition de la tâche `video_input` :

```javascript
video_input: {
  inputs: {
    video: {                    // ← AJOUTÉ
      type: 'video',
      label: 'Vidéo',
      hint: 'Sélectionnez une vidéo depuis la collection ou uploadez-en une nouvelle',
      required: false,
      acceptsVariable: true
    },
    label: { ... },            // Existant
    multiple: { ... },         // Existant
    required: { ... },         // Existant
    maxFiles: { ... }          // Existant
  }
}
```

## Résultat

Maintenant, dans le dialog "Éditer : Upload de vidéo", l'utilisateur voit :

1. ✅ **Champ "Vidéo"** avec `CollectionMediaSelector`
2. ✅ Possibilité de **sélectionner** une vidéo depuis la collection
3. ✅ Possibilité d'**uploader** une nouvelle vidéo
4. ✅ Bouton **code** pour utiliser une **variable** (référence à une vidéo d'une tâche précédente)
5. ✅ Champ "Libellé du champ" (pour le nom affiché à l'utilisateur final)
6. ✅ Checkbox "Vidéos multiples"
7. ✅ Checkbox "Obligatoire"
8. ✅ Champ "Nombre maximum de vidéos" (si multiples activé)

## Référencement dans les tâches suivantes

La vidéo sélectionnée est accessible via :
```javascript
{{task_video_input.outputs.video}}
```

Et peut être utilisée comme input dans d'autres tâches de traitement vidéo.

## Aucune autre modification nécessaire

Le code existant dans `WorkflowBuilder.vue` gère déjà automatiquement les inputs de type `video` grâce au bloc conditionnel aux lignes 677-721.

---

**Date**: 7 novembre 2025  
**Statut**: ✅ Terminé et testé
