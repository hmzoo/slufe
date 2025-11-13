# Fix: Support complet de video_input (sélection vidéo depuis collection)

## Problème initial

1. Le dialog "Éditer : Upload de vidéo" n'affichait pas de champ pour sélectionner une vidéo
2. Lors de l'exécution d'un workflow avec `video_input`, erreur backend : `Type de tâche non supporté: video_input`

## Cause

La tâche `video_input` était partiellement implémentée :
- ✅ Frontend : Le composant `WorkflowBuilder.vue` gérait déjà les inputs de type `video` (lignes 677-721)
- ❌ Frontend : La définition de `video_input` dans `ioDefinitions.js` n'avait **pas** d'input `video`
- ❌ Backend : Le type de tâche `video_input` n'était **pas déclaré** comme supporté
- ❌ Backend : Aucun service `InputVideoTask.js` n'existait

## Solutions appliquées

### 1. Frontend : Ajout du champ vidéo dans la définition

**Fichier** : `frontend/src/config/ioDefinitions.js`

Ajout de l'input `video` dans la tâche `video_input` :

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
    label: { ... },
    multiple: { ... },
    required: { ... },
    maxFiles: { ... }
  },
  outputs: {
    video: {
      type: 'video',
      description: 'Vidéo(s) uploadée(s) ou sélectionnée(s)'
    }
  }
}
```

### 2. Backend : Déclaration du type de tâche

**Fichier** : `backend/services/WorkflowRunner.js`

#### a) Ajout dans initializeTaskServices() (ligne ~37)
```javascript
this.taskServices.set('video_input', null); // Support pour les inputs de vidéo
```

#### b) Ajout de la gestion spéciale (ligne ~161)
```javascript
} else if (task.type === 'video_input' || task.type === 'video_output') {
  taskInputs = {
    ...taskInputs,
    label: task.label || task.id,
    video: task.video || task.selectedVideo || taskInputs.video,
    selectedVideo: task.selectedVideo,
    defaultVideo: task.defaultVideo,
    title: task.title,
    width: task.width,
    autoplay: task.autoplay,
    controls: task.controls,
    loop: task.loop
  };
}
```

#### c) Ajout du mapping de service (ligne ~457)
```javascript
'video_input': './tasks/InputVideoTask.js', // Support pour les inputs de vidéo
```

### 3. Backend : Création du service InputVideoTask

**Fichier créé** : `backend/services/tasks/InputVideoTask.js`

Service inspiré de `InputImageTask.js` qui :
- Valide la présence d'une vidéo
- Normalise les différents formats possibles (`video`, `selectedVideo`, `defaultVideo`)
- Retourne la vidéo sous forme d'output utilisable par les tâches suivantes

```javascript
export class InputVideoTask {
  async execute(inputs) {
    let videoUrl = inputs.selectedVideo || inputs.video || inputs.defaultVideo;
    
    if (!videoUrl) {
      throw new Error('Aucune vidéo fournie pour la tâche video_input');
    }
    
    return {
      video: videoUrl,
      video_url: videoUrl,
      status: 'success',
      message: 'Vidéo d\'entrée traitée avec succès'
    };
  }
}
```

## Résultat final

Maintenant, l'utilisateur peut :

1. **Ajouter une tâche "Upload de vidéo"** dans un workflow
2. **Éditer la tâche** et voir :
   - ✅ Champ "Vidéo" avec `CollectionMediaSelector`
   - ✅ Possibilité de sélectionner depuis la collection
   - ✅ Possibilité d'uploader une nouvelle vidéo
   - ✅ Bouton "code" pour utiliser une variable
3. **Exécuter le workflow** sans erreur backend
4. **Référencer la vidéo** dans les tâches suivantes : `{{video1.video}}`

## Exemple d'utilisation

```javascript
// Workflow complet
{
  tasks: [
    {
      id: "video1",
      type: "video_input",
      inputs: {
        video: "/medias/ma-video.mp4",  // Vidéo sélectionnée depuis la collection
        label: "Vidéo source"
      }
    },
    {
      id: "frame1",
      type: "video_extract_frame",
      inputs: {
        video: "{{video1.video}}",       // Référence à la vidéo du video_input
        frameType: "last",
        outputFormat: "jpg"
      }
    }
  ]
}
```

## Fichiers modifiés

### Frontend
- `frontend/src/config/ioDefinitions.js` - Ajout de l'input `video`

### Backend
- `backend/services/WorkflowRunner.js` - Déclaration et gestion de `video_input`
- `backend/services/tasks/InputVideoTask.js` - Nouveau service créé

## Fichiers utilisés sans modification

- `frontend/src/components/WorkflowBuilder.vue` - Gérait déjà les inputs de type `video`
- `frontend/src/components/CollectionMediaSelector.vue` - Support déjà `accept: ['video']`

## Test effectué

✅ Workflow avec `video_input` → `video_extract_frame` fonctionne correctement

---

**Date** : 7 novembre 2025  
**Statut** : ✅ Terminé et testé
