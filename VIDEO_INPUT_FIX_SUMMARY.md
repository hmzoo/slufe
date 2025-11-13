# Résumé : Support video_input corrigé

## ✅ Problème résolu

Vous aviez raison ! Le backend supportait déjà les vidéos en input via les tâches de traitement vidéo comme `video_extract_frame`. 

Cependant, la tâche `video_input` (qui permet de **sélectionner** une vidéo depuis la collection) n'était pas complète.

## 🔧 Corrections appliquées

### Frontend (1 fichier)
- **`frontend/src/config/ioDefinitions.js`** : Ajout d'un input `video` dans la tâche `video_input`

### Backend (2 fichiers)
- **`backend/services/WorkflowRunner.js`** : Déclaration de `video_input` comme type de tâche supporté
- **`backend/services/tasks/InputVideoTask.js`** : Nouveau service créé (similaire à `InputImageTask.js`)

## 📝 Utilisation

Maintenant vous pouvez :

1. **Ajouter** une tâche "Upload de vidéo" dans un workflow
2. **Éditer** la tâche et **sélectionner une vidéo** depuis la collection (ou uploader)
3. **Référencer** cette vidéo dans les tâches suivantes avec : `{{video1.video}}`

### Exemple de workflow fonctionnel

```javascript
[
  {
    id: "video1",
    type: "video_input",
    inputs: {
      video: "/medias/ma-video.mp4"  // ← Sélection depuis collection
    }
  },
  {
    id: "frame1",
    type: "video_extract_frame",
    inputs: {
      video: "{{video1.video}}",      // ← Référence à la vidéo
      frameType: "last"
    }
  }
]
```

## ✨ Fonctionnalités disponibles

Dans le dialog d'édition "Upload de vidéo" :
- ✅ Champ "Vidéo" avec sélecteur
- ✅ Sélection depuis la collection
- ✅ Upload de nouvelle vidéo
- ✅ Bouton "code" pour variables (ex: `{{task1.outputs.video}}`)
- ✅ Champs de configuration (label, multiple, obligatoire, etc.)

---

**L'erreur "Type de tâche non supporté: video_input" est maintenant corrigée !**
