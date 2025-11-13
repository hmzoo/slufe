# 🎬 Ajout Sélecteurs Vidéo - Tâche Concaténation

## 📅 Date
5 novembre 2025

## 🎯 Objectif

Ajouter des **sélecteurs de vidéos** (Gallery/Variable) pour la tâche "Concaténer des vidéos" afin de permettre la sélection de **2 vidéos distinctes** depuis la galerie.

## 🔄 Architecture Modifiée

### Avant
```javascript
// Backend
inputs: {
  videos: Array<video>  // Array de vidéos (min: 2, max: 20)
}

// Frontend
- Pas de sélecteur UI disponible
- Input de type 'videos' (multiple) non géré dans l'UI
```

### Après
```javascript
// Backend
inputs: {
  video1: string|Buffer|Object,  // Première vidéo
  video2: string|Buffer|Object   // Deuxième vidéo
}

// Frontend
- 2 sélecteurs distincts (video1, video2)
- Chaque sélecteur: Mode Gallery ou Variable
- Sélection depuis la galerie de médias
```

---

## 📝 Modifications Backend

### 1. VideoConcatenateTask.js - Signature execute()

**Fichier** : `/backend/services/tasks/VideoConcatenateTask.js`

**Avant** :
```javascript
async execute(inputs) {
  inputs.videos  // Array de vidéos
}
```

**Après** :
```javascript
async execute(inputs) {
  // Normaliser les vidéos (extraire URL/path depuis objets)
  const normalizedVideo1 = this.normalizeVideoInput(inputs.video1);
  const normalizedVideo2 = this.normalizeVideoInput(inputs.video2);
  
  const params = {
    videos: [normalizedVideo1, normalizedVideo2], // Convertir en array
    outputFormat: inputs.outputFormat || 'mp4',
    resolution: inputs.resolution || null,
    fps: inputs.fps || null,
    quality: inputs.quality || 'medium'
  };
}
```

### 2. Validation des Entrées

**Avant** :
```javascript
validateInputs(inputs) {
  if (!inputs.videos || !Array.isArray(inputs.videos)) {
    errors.push('Liste de vidéos requise (Array)');
  } else if (inputs.videos.length < 2) {
    errors.push('Au moins 2 vidéos sont requises');
  }
}
```

**Après** :
```javascript
validateInputs(inputs) {
  if (!inputs.video1) {
    errors.push('Première vidéo requise');
  }
  
  if (!inputs.video2) {
    errors.push('Deuxième vidéo requise');
  }
}
```

### 3. Fonction de Normalisation Ajoutée

```javascript
normalizeVideoInput(video) {
  // Si c'est déjà une string ou un Buffer, retourner tel quel
  if (typeof video === 'string' || Buffer.isBuffer(video)) {
    return video;
  }

  // Si c'est un objet avec url
  if (video && typeof video === 'object' && video.url) {
    return video.url;
  }

  // Si c'est un objet avec path
  if (video && typeof video === 'object' && video.path) {
    return video.path;
  }

  // Si c'est un objet avec filename
  if (video && typeof video === 'object' && video.filename) {
    return video.filename;
  }

  // Sinon retourner tel quel
  return video;
}
```

### 4. Schéma d'Entrée Mis à Jour

**Avant** :
```javascript
getInputSchema() {
  return {
    videos: {
      type: 'videos',
      required: true,
      multiple: true,
      min: 2,
      max: 20
    }
  }
}
```

**Après** :
```javascript
getInputSchema() {
  return {
    video1: {
      type: 'video',
      required: true,
      description: 'Première vidéo à concaténer'
    },
    video2: {
      type: 'video',
      required: true,
      description: 'Deuxième vidéo à concaténer'
    },
    // ... autres paramètres (outputFormat, resolution, fps, quality)
  }
}
```

---

## 🎨 Modifications Frontend

### 1. taskDefinitions.js - Définition de la Tâche

**Fichier** : `/frontend/src/config/taskDefinitions.js`

**Avant** :
```javascript
video_concatenate: {
  inputs: {
    videos: {
      type: 'videos',
      label: 'Vidéos à concaténer',
      multiple: true,
      min: 2,
      max: 20
    }
  }
}
```

**Après** :
```javascript
video_concatenate: {
  description: 'Assemble deux vidéos en une seule',
  inputs: {
    video1: {
      type: 'video',
      label: 'Première vidéo',
      required: true,
      acceptsVariable: true,
      hint: 'Sélectionnez la première vidéo à concaténer'
    },
    video2: {
      type: 'video',
      label: 'Deuxième vidéo',
      required: true,
      acceptsVariable: true,
      hint: 'Sélectionnez la deuxième vidéo à concaténer'
    },
    // ... outputFormat, resolution, fps, quality
  }
}
```

### 2. WorkflowRunner.vue - Affichage des Résultats

**Fichier** : `/frontend/src/components/WorkflowRunner.vue`

Ajout du support de `video_url` et affichage des métadonnées de concaténation :

```vue
<!-- Vidéo -->
<div v-if="taskResult.outputs?.video || taskResult.outputs?.video_url" class="q-mb-sm">
  <div class="text-caption text-grey-6 q-mb-xs">Vidéo générée :</div>
  
  <!-- Affichage des infos de concaténation si disponibles -->
  <div v-if="taskResult.outputs.concat_info" class="q-mb-xs">
    <q-chip size="sm" color="deep-purple" text-color="white">
      {{ taskResult.outputs.concat_info.input_count }} vidéos
    </q-chip>
    <q-chip size="sm" color="grey-6" text-color="white">
      Durée: {{ taskResult.outputs.concat_info.total_duration.toFixed(1) }}s
    </q-chip>
    <q-chip size="sm" color="grey-6" text-color="white">
      {{ taskResult.outputs.concat_info.resolution }}
    </q-chip>
  </div>
  
  <video controls style="max-width: 100%; max-height: 400px">
    <source :src="taskResult.outputs.video || taskResult.outputs.video_url" type="video/mp4">
  </video>
  <q-btn @click="downloadVideo(taskResult.outputs.video || taskResult.outputs.video_url)" />
</div>
```

---

## 🔄 Flux Complet

### 1. Interface Utilisateur

```
Utilisateur crée workflow "Concaténer des vidéos"
  ↓
Affichage de 2 inputs vidéo:
  - Première vidéo (video1)
  - Deuxième vidéo (video2)
  ↓
Chaque input a 2 modes:
  - Variable: Saisir UUID ou référence
  - Gallery: Sélectionner depuis galerie
  ↓
Sélection vidéo1 depuis galerie → UUID stocké
Sélection vidéo2 depuis galerie → UUID stocké
```

### 2. Backend - Résolution et Exécution

```
Frontend envoie:
{
  video1: "uuid-video-1",
  video2: "uuid-video-2",
  outputFormat: "mp4",
  quality: "medium"
}
  ↓
resolveMediaIds() résout UUIDs:
  video1 → {url: "/medias/...", type: "video"}
  video2 → {url: "/medias/...", type: "video"}
  ↓
VideoConcatenateTask.execute():
  normalizeVideoInput(video1) → "/medias/..."
  normalizeVideoInput(video2) → "/medias/..."
  ↓
concatenateVideos([video1, video2])
  ↓
FFmpeg concatène les vidéos
  ↓
Résultat sauvegardé avec UUID
  ↓
Ajout à collection courante
```

### 3. Affichage des Résultats

```
Backend retourne:
{
  video_url: "/medias/concat-uuid.mp4",
  concat_info: {
    input_count: 2,
    total_duration: 10.5,
    resolution: "1920x1080"
  }
}
  ↓
Frontend affiche:
  - Vidéo player avec controls
  - Badges: "2 vidéos", "Durée: 10.5s", "1920x1080"
  - Bouton télécharger
```

---

## 🎨 Interface Utilisateur

### Sélecteurs Vidéo

Chaque vidéo a un sélecteur avec **2 modes** :

#### Mode Variable
```
┌─────────────────────────────────┐
│ Première vidéo               [=]│
│ ┌─────────────────────────────┐ │
│ │ Variable │ Galerie          │ │
│ └─────────────────────────────┘ │
│ UUID ou référence:             │
│ ┌─────────────────────────────┐ │
│ │ task1.video                 │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

#### Mode Galerie
```
┌─────────────────────────────────┐
│ Première vidéo               [=]│
│ ┌─────────────────────────────┐ │
│ │ Variable │ Galerie          │ │
│ └─────────────────────────────┘ │
│ ┌─────────────────────────────┐ │
│ │ [Sélectionner vidéo]        │ │
│ │   📹 video.mp4              │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

### Résultats de Concaténation

```
┌─────────────────────────────────┐
│ 📊 Résultats                    │
│                                 │
│ Tâche: concat1 ✅               │
│ Concaténer des vidéos           │
│                                 │
│ Vidéo générée:                  │
│ [2 vidéos] [Durée: 10.5s]       │
│ [1920x1080]                     │
│                                 │
│ ┌─────────────────────────────┐ │
│ │                             │ │
│ │     VIDEO PLAYER            │ │
│ │     [▶ Play] [━━━━━━━━━━]  │ │
│ │                             │ │
│ └─────────────────────────────┘ │
│ [📥 Télécharger]                │
└─────────────────────────────────┘
```

---

## 🧪 Test

### Workflow "Concaténer 2 Vidéos"

```bash
1. Créer nouveau workflow personnalisé
2. Ajouter tâche "Concaténer des vidéos"
3. Sélectionner mode "Galerie" pour video1
4. Choisir première vidéo depuis galerie
5. Sélectionner mode "Galerie" pour video2
6. Choisir deuxième vidéo depuis galerie
7. Configurer format/qualité (optionnel)
8. Exécuter workflow

✅ Résultat attendu:
- UUIDs résolus pour les 2 vidéos
- Vidéos concaténées avec succès
- Résultat sauvegardé avec UUID
- Ajouté à collection courante
- Affiché avec métadonnées (durée, résolution, etc.)
```

### Logs Attendus

```javascript
🎬 Concaténation de vidéos {
  hasVideo1: true,
  hasVideo2: true,
  outputFormat: 'mp4',
  quality: 'medium'
}

✅ Concaténation terminée {
  inputCount: 2,
  totalDuration: '10.50s',
  outputResolution: '1920x1080',
  outputFile: 'uuid.mp4',
  outputSize: '15.2MB'
}
```

---

## 📊 Comparaison Avant/Après

| Aspect | Avant | Après |
|--------|-------|-------|
| **Input Backend** | `videos: Array` (min: 2, max: 20) | `video1: video`, `video2: video` |
| **Validation** | Vérifie array et taille | Vérifie présence video1 et video2 |
| **Frontend UI** | ❌ Pas de sélecteur | ✅ 2 sélecteurs Gallery/Variable |
| **Sélection galerie** | ❌ Non supporté | ✅ Sélection depuis galerie |
| **Normalisation** | ❌ Pas de normalisation | ✅ normalizeVideoInput() |
| **Flexibilité** | 2-20 vidéos (complexe) | 2 vidéos (simple, clair) |
| **UX** | ❌ Pas d'interface | ✅ Interface intuitive |

---

## 🎯 Avantages

### Simplicité
- **2 vidéos uniquement** : Cas d'usage le plus courant
- **Interface claire** : 2 sélecteurs au lieu d'un array complexe
- **Sélection visuelle** : Prévisualisation dans la galerie

### Cohérence
- **Même pattern** que VideoExtractFrameTask et GenerateVideoI2VTask
- **Normalisation uniforme** : normalizeVideoInput() réutilisée
- **Resolution UUIDs** : Même système que les autres tâches vidéo

### Flexibilité
- **Mode Variable** : Référence à une tâche précédente (`task1.video_url`)
- **Mode Galerie** : Sélection depuis collection courante
- **Mix possible** : video1 depuis variable, video2 depuis galerie

---

## 📝 Notes

### Extension Future

Si besoin de concaténer **plus de 2 vidéos**, 2 options :

**Option A** : Chaîner les tâches
```
Workflow:
  Task1: Concatener video1 + video2 → result1
  Task2: Concatener result1 + video3 → result2
  Task3: Concatener result2 + video4 → final
```

**Option B** : Créer une nouvelle tâche `video_concatenate_multiple`
```javascript
inputs: {
  videos: {
    type: 'videos',
    multiple: true,
    min: 2,
    max: 20
  }
}

// Avec UI drag-and-drop pour réordonner
```

### Limitations Actuelles

- **2 vidéos maximum** par tâche
- **Ordre fixe** : video1 puis video2 (pas de réordonnement)
- **Pas de transitions** entre vidéos (juste concaténation brute)

Ces limitations peuvent être levées dans une future version si nécessaire.

---

**Date** : 5 novembre 2025  
**Status** : ✅ Implémenté et prêt à tester  
**Impact** : Tâche "Concaténer vidéos" maintenant utilisable depuis l'interface  
**Cohérence** : Architecture alignée avec les autres tâches vidéo

