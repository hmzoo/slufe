<template>
  <q-dialog v-model="isOpen" @hide="closeCamera">
    <q-card style="min-width: 350px; max-width: 90vw;">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">
          <q-icon name="camera_alt" class="q-mr-sm" />
          Prendre une photo
        </div>
        <q-space />
        <q-btn icon="close" flat round dense @click="closeCamera" />
      </q-card-section>

      <q-card-section class="q-pt-md">
        <!-- Prévisualisation vidéo -->
        <div class="camera-container" v-show="!capturedImage">
          <video
            ref="videoElement"
            autoplay
            playsinline
            class="camera-video"
          ></video>
          
          <!-- Message si pas de caméra -->
          <div v-if="!isCameraActive && !loading" class="no-camera-message">
            <q-icon name="videocam_off" size="3rem" color="grey-6" />
            <div class="text-subtitle1 text-grey-7 q-mt-sm">
              Aucune caméra détectée
            </div>
          </div>
          
          <!-- Chargement -->
          <div v-if="loading" class="camera-loading">
            <q-spinner-dots color="primary" size="3rem" />
            <div class="text-subtitle2 q-mt-sm">Initialisation de la caméra...</div>
          </div>
        </div>

        <!-- Image capturée -->
        <div v-if="capturedImage" class="captured-image-container">
          <img :src="capturedImage" class="captured-image" />
        </div>

        <!-- Canvas caché pour la capture -->
        <canvas ref="canvasElement" style="display: none"></canvas>
      </q-card-section>

      <q-card-section v-if="error" class="q-pt-none">
        <q-banner class="bg-negative text-white" dense rounded>
          <template v-slot:avatar>
            <q-icon name="error" />
          </template>
          {{ error }}
        </q-banner>
      </q-card-section>

      <q-card-actions align="center" class="q-pa-md">
        <!-- Boutons avant capture -->
        <template v-if="!capturedImage">
          <q-btn
            v-if="isCameraActive"
            color="primary"
            icon="camera"
            label="Capturer"
            size="lg"
            @click="capturePhoto"
            unelevated
            round
          />
          
          <!-- Toggle caméra avant/arrière sur mobile -->
          <q-btn
            v-if="isCameraActive && isMobile"
            flat
            round
            color="primary"
            icon="flip_camera_android"
            @click="switchCamera"
            class="q-ml-sm"
          >
            <q-tooltip>Changer de caméra</q-tooltip>
          </q-btn>
        </template>

        <!-- Boutons après capture -->
        <template v-else>
          <q-btn
            color="positive"
            icon="check"
            label="Utiliser cette photo"
            @click="usePhoto"
            unelevated
          />
          <q-btn
            flat
            color="primary"
            icon="replay"
            label="Reprendre"
            @click="retakePhoto"
            class="q-ml-sm"
          />
        </template>
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import { useQuasar } from 'quasar';

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:modelValue', 'photo-captured']);

const $q = useQuasar();

const videoElement = ref(null);
const canvasElement = ref(null);
const isOpen = ref(props.modelValue);
const isCameraActive = ref(false);
const loading = ref(false);
const error = ref(null);
const capturedImage = ref(null);
const currentStream = ref(null);
const facingMode = ref('user'); // 'user' = avant, 'environment' = arrière
const isMobile = ref(false);

// Détecter si on est sur mobile
onMounted(() => {
  isMobile.value = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
});

watch(() => props.modelValue, (newVal) => {
  isOpen.value = newVal;
  if (newVal) {
    initCamera();
  } else {
    stopCamera();
  }
});

watch(isOpen, (newVal) => {
  emit('update:modelValue', newVal);
});

async function initCamera() {
  loading.value = true;
  error.value = null;
  capturedImage.value = null;

  try {
    // Vérifier si getUserMedia est disponible
    console.log('🔍 Vérification support caméra...');
    console.log('navigator.mediaDevices:', !!navigator.mediaDevices);
    console.log('getUserMedia:', !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia));
    console.log('Protocol:', window.location.protocol);
    console.log('Host:', window.location.host);

    if (!navigator.mediaDevices) {
      // Essayer le polyfill pour les vieux navigateurs
      if (navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia) {
        console.log('⚠️ Utilisation du polyfill getUserMedia');
        navigator.mediaDevices = {};
        navigator.mediaDevices.getUserMedia = function(constraints) {
          const getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
          if (!getUserMedia) {
            return Promise.reject(new Error('getUserMedia non supporté'));
          }
          return new Promise((resolve, reject) => {
            getUserMedia.call(navigator, constraints, resolve, reject);
          });
        };
      } else {
        throw new Error('Votre navigateur ne supporte pas l\'accès à la caméra. Essayez Chrome, Firefox ou Safari récents.');
      }
    }

    if (!navigator.mediaDevices.getUserMedia) {
      throw new Error('getUserMedia n\'est pas disponible. Vérifiez que vous êtes sur HTTPS ou localhost.');
    }

    // Demander l'accès à la caméra
    console.log('📹 Demande d\'accès à la caméra...');
    const constraints = {
      video: {
        facingMode: facingMode.value,
        width: { ideal: 1920 },
        height: { ideal: 1080 }
      },
      audio: false
    };

    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    currentStream.value = stream;

    // Attacher le stream à la vidéo
    if (videoElement.value) {
      videoElement.value.srcObject = stream;
      isCameraActive.value = true;
      
      $q.notify({
        type: 'positive',
        message: 'Caméra activée',
        position: 'top',
        timeout: 2000
      });
    }
  } catch (err) {
    console.error('❌ Erreur accès caméra:', err);
    console.error('Type d\'erreur:', err.name);
    console.error('Message:', err.message);
    
    let errorMessage = 'Impossible d\'accéder à la caméra';
    let caption = '';
    
    if (err.message && err.message.includes('ne supporte pas')) {
      errorMessage = err.message;
      if (window.location.protocol === 'http:' && window.location.hostname !== 'localhost') {
        caption = '⚠️ HTTPS requis pour accéder à la caméra (sauf sur localhost)';
      } else {
        caption = 'Essayez un navigateur récent (Chrome, Firefox, Safari)';
      }
    } else if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
      errorMessage = 'Accès à la caméra refusé';
      caption = 'Veuillez autoriser l\'accès dans les paramètres de votre navigateur';
    } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
      errorMessage = 'Aucune caméra détectée';
      caption = 'Vérifiez qu\'une caméra est connectée à votre appareil';
    } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
      errorMessage = 'Caméra déjà utilisée';
      caption = 'Fermez les autres applications utilisant la caméra';
    } else if (err.message && err.message.includes('HTTPS')) {
      errorMessage = 'HTTPS requis';
      caption = 'L\'accès à la caméra nécessite HTTPS (sauf localhost)';
    }
    
    error.value = errorMessage;
    
    $q.notify({
      type: 'negative',
      message: errorMessage,
      caption: caption,
      position: 'top',
      timeout: 5000
    });
  } finally {
    loading.value = false;
  }
}

function stopCamera() {
  if (currentStream.value) {
    currentStream.value.getTracks().forEach(track => track.stop());
    currentStream.value = null;
  }
  isCameraActive.value = false;
  
  if (videoElement.value) {
    videoElement.value.srcObject = null;
  }
}

function capturePhoto() {
  if (!videoElement.value || !canvasElement.value) return;

  const video = videoElement.value;
  const canvas = canvasElement.value;

  // Définir la taille du canvas selon la vidéo
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  // Dessiner l'image de la vidéo sur le canvas
  const context = canvas.getContext('2d');
  context.drawImage(video, 0, 0, canvas.width, canvas.height);

  // Convertir en data URL
  capturedImage.value = canvas.toDataURL('image/jpeg', 0.95);

  // Arrêter la caméra après capture
  stopCamera();

  $q.notify({
    type: 'positive',
    message: 'Photo capturée !',
    position: 'top',
    timeout: 2000
  });
}

function retakePhoto() {
  capturedImage.value = null;
  initCamera();
}

async function usePhoto() {
  if (!capturedImage.value) {
    console.error('❌ Pas d\'image capturée');
    return;
  }

  try {
    console.log('📸 Conversion de la photo en fichier...');
    console.log('Data URL length:', capturedImage.value.length);
    
    // Convertir data URL en Blob puis en File
    const response = await fetch(capturedImage.value);
    const blob = await response.blob();
    
    console.log('Blob créé:', {
      size: blob.size,
      type: blob.type
    });
    
    const fileName = `camera-${Date.now()}.jpg`;
    const file = new File([blob], fileName, { type: 'image/jpeg' });

    console.log('✅ Fichier créé:', {
      name: file.name,
      type: file.type,
      size: file.size,
      isFile: file instanceof File
    });

    console.log('📤 Émission événement photo-captured');
    emit('photo-captured', file);
    
    $q.notify({
      type: 'positive',
      message: 'Photo ajoutée !',
      position: 'top',
      timeout: 2000
    });

    closeCamera();
  } catch (err) {
    console.error('❌ Erreur conversion photo:', err);
    $q.notify({
      type: 'negative',
      message: 'Erreur lors de l\'ajout de la photo',
      position: 'top'
    });
  }
}

async function switchCamera() {
  // Alterner entre caméra avant et arrière
  facingMode.value = facingMode.value === 'user' ? 'environment' : 'user';
  stopCamera();
  await initCamera();
}

function closeCamera() {
  stopCamera();
  capturedImage.value = null;
  error.value = null;
  isOpen.value = false;
}

onBeforeUnmount(() => {
  stopCamera();
});
</script>

<style scoped lang="scss">
.camera-container {
  position: relative;
  width: 100%;
  background: #000;
  border-radius: 8px;
  overflow: hidden;
  min-height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.camera-video {
  width: 100%;
  height: auto;
  max-height: 70vh;
  display: block;
  border-radius: 8px;
}

.no-camera-message {
  text-align: center;
  padding: 2rem;
}

.camera-loading {
  text-align: center;
  color: white;
}

.captured-image-container {
  width: 100%;
  background: #000;
  border-radius: 8px;
  overflow: hidden;
}

.captured-image {
  width: 100%;
  height: auto;
  display: block;
  border-radius: 8px;
}
</style>
