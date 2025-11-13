# Composant CameraCapture

## 📸 Description

Composant Vue pour capturer des photos en utilisant la webcam/caméra de l'appareil avec prévisualisation en direct.

## 🎯 Fonctionnalités

- ✅ **Prévisualisation en direct** - Affiche le flux vidéo de la caméra
- ✅ **Capture d'image** - Prend une photo et permet de la prévisualiser avant utilisation
- ✅ **Support mobile et desktop** - Fonctionne sur tous les appareils
- ✅ **Changement de caméra** - Bascule entre caméra avant/arrière sur mobile
- ✅ **Gestion des erreurs** - Messages clairs en cas de problème d'accès
- ✅ **Permissions** - Demande automatiquement l'accès à la caméra
- ✅ **Haute qualité** - Capture en résolution Full HD (1920x1080)

## 📦 Installation

Le composant est déjà intégré dans `ImageUploader.vue`.

```vue
<CameraCapture 
  v-model="showCamera" 
  @photo-captured="handleCameraPhoto"
/>
```

## 🔧 API du composant

### Props

| Prop | Type | Défaut | Description |
|------|------|--------|-------------|
| `modelValue` | Boolean | `false` | Contrôle l'affichage du dialog caméra |

### Événements

| Événement | Payload | Description |
|-----------|---------|-------------|
| `update:modelValue` | Boolean | Émis quand le dialog se ferme/ouvre |
| `photo-captured` | File | Émis quand une photo est capturée et validée |

### Exemple d'utilisation

```vue
<template>
  <div>
    <q-btn 
      label="Ouvrir caméra" 
      @click="showCamera = true" 
    />
    
    <CameraCapture 
      v-model="showCamera" 
      @photo-captured="handlePhoto"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue';
import CameraCapture from './CameraCapture.vue';

const showCamera = ref(false);

function handlePhoto(file) {
  console.log('Photo capturée:', file);
  // Traiter le fichier (upload, prévisualisation, etc.)
}
</script>
```

## 🎨 Interface utilisateur

### 1. État initial - Prévisualisation
- Flux vidéo en direct de la caméra
- Bouton "Capturer" circulaire au centre
- Bouton flip caméra (mobile uniquement)
- Indicateur de chargement pendant l'initialisation

### 2. État après capture
- Prévisualisation de la photo capturée
- Bouton "Utiliser cette photo" (valider)
- Bouton "Reprendre" (nouvelle capture)

### 3. États d'erreur
- Bannière rouge avec message d'erreur explicite
- Messages contextuels selon le type d'erreur

## 🔐 Permissions et sécurité

### Permissions requises
- **Caméra** : Le navigateur demandera l'autorisation d'accès

### HTTPS requis
⚠️ La plupart des navigateurs modernes requièrent HTTPS pour accéder à la caméra (sauf sur localhost).

### Gestion des erreurs

Le composant gère automatiquement ces erreurs :

| Erreur | Message affiché |
|--------|-----------------|
| `NotAllowedError` | "Accès à la caméra refusé. Veuillez autoriser l'accès dans les paramètres." |
| `NotFoundError` | "Aucune caméra détectée sur cet appareil." |
| `NotReadableError` | "La caméra est peut-être déjà utilisée par une autre application." |
| Autre | "Impossible d'accéder à la caméra" |

## 📱 Support des appareils

### Desktop
- ✅ Webcam USB
- ✅ Caméra intégrée (laptop)
- ⚠️ Nécessite l'autorisation du navigateur

### Mobile
- ✅ Caméra avant (selfie)
- ✅ Caméra arrière (principale)
- ✅ Bouton pour basculer entre les caméras
- ✅ Mode plein écran optimisé

## 🎬 Flux de fonctionnement

```
1. Utilisateur clique sur "Caméra"
   ↓
2. Dialog s'ouvre
   ↓
3. Demande permission caméra
   ↓
4. Affichage flux vidéo en direct
   ↓
5. Utilisateur clique "Capturer"
   ↓
6. Photo capturée et affichée
   ↓
7. Utilisateur valide ou reprend
   ↓
8. Si validé: événement 'photo-captured' émis
   ↓
9. Dialog se ferme automatiquement
```

## 🔧 Paramètres techniques

### Qualité vidéo
```javascript
{
  video: {
    facingMode: 'user', // ou 'environment'
    width: { ideal: 1920 },
    height: { ideal: 1080 }
  }
}
```

### Qualité de capture
- Format: **JPEG**
- Qualité: **95%**
- Résolution: **Native de la caméra** (max 1920x1080)

## 🐛 Débogage

### La caméra ne s'ouvre pas
1. Vérifier que le navigateur supporte `getUserMedia`
2. Vérifier les permissions dans les paramètres du navigateur
3. Vérifier que vous êtes sur HTTPS (ou localhost)
4. Vérifier qu'aucune autre application n'utilise la caméra

### La qualité est mauvaise
- Vérifier la résolution de la caméra
- Ajuster les contraintes `width` et `height` dans le code

### Le changement de caméra ne fonctionne pas
- Vérifier que l'appareil a plusieurs caméras
- Vérifier les permissions pour toutes les caméras

## 🌐 Compatibilité navigateurs

| Navigateur | Desktop | Mobile |
|------------|---------|--------|
| Chrome | ✅ | ✅ |
| Firefox | ✅ | ✅ |
| Safari | ✅ | ✅ |
| Edge | ✅ | ✅ |
| Opera | ✅ | ✅ |

**Versions minimales** :
- Chrome 53+
- Firefox 36+
- Safari 11+
- Edge 12+

## 📝 Notes de développement

### Nettoyage automatique
Le composant arrête automatiquement le flux vidéo quand :
- Le dialog est fermé
- Une photo est capturée
- Le composant est démonté

### Optimisations
- Canvas caché pour la capture (pas de rendu inutile)
- Arrêt du stream après capture (économie de ressources)
- Conversion automatique en File pour compatibilité

## 🎯 Intégration dans ImageUploader

```vue
<!-- ImageUploader.vue -->
<template>
  <q-btn 
    color="secondary"
    label="Caméra"
    icon="camera_alt"
    @click="showCamera = true"
  />
  
  <CameraCapture 
    v-model="showCamera" 
    @photo-captured="handleCameraPhoto"
  />
</template>

<script setup>
const showCamera = ref(false);

function handleCameraPhoto(file) {
  handleFiles([file]); // Réutilise la logique existante
}
</script>
```

## 🚀 Améliorations futures possibles

- [ ] Filtres en temps réel
- [ ] Zoom numérique
- [ ] Flash (si supporté)
- [ ] Mode rafale (plusieurs photos)
- [ ] Effets et stickers
- [ ] Minuteur de capture
- [ ] Sauvegarde locale automatique
- [ ] Historique des captures

---

**Créé le** : 3 novembre 2025  
**Version** : 1.0  
**Status** : ✅ Fonctionnel
