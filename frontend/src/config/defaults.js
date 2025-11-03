/**
 * Paramètres par défaut pour la génération de contenu
 * Ces valeurs sont synchronisées avec le backend
 */

export const IMAGE_DEFAULTS = {
  aspectRatio: '16:9',
  guidance: 3,
  numInferenceSteps: 30,
  imageSize: 'optimize_for_quality',
  outputFormat: 'jpg',
  outputQuality: 90,
  enhancePrompt: false,
  disableSafetyChecker: true,
  negativePrompt: 'blurry, low quality, distorted, ugly, deformed'
};

export const VIDEO_DEFAULTS = {
  aspectRatio: '16:9',
  numFrames: 81,
  resolution: '480p',
  framesPerSecond: 16,
  interpolateOutput: true,
  goFast: true,
  sampleShift: 12,
  disableSafetyChecker: true,
  optimizePrompt: false
};

export const EDIT_DEFAULTS = {
  outputFormat: 'webp',
  outputQuality: 95
};

/**
 * Options valides pour chaque paramètre
 */
export const VALID_OPTIONS = {
  aspectRatio: [
    { value: '16:9', label: '16:9 (Paysage)', icon: 'landscape' },
    { value: '9:16', label: '9:16 (Portrait)', icon: 'portrait' },
    { value: '1:1', label: '1:1 (Carré)', icon: 'crop_square' },
    { value: '4:3', label: '4:3 (Standard)', icon: 'crop_3_2' },
    { value: '3:4', label: '3:4 (Portrait)', icon: 'crop_portrait' },
    { value: '21:9', label: '21:9 (Ultra-large)', icon: 'panorama' },
    { value: '9:21', label: '9:21 (Stories)', icon: 'smartphone' }
  ],
  resolution: [
    { value: '480p', label: '480p (Standard)' },
    { value: '720p', label: '720p (HD)' }
  ],
  outputFormat: [
    { value: 'jpg', label: 'JPG (Compact)' },
    { value: 'png', label: 'PNG (Qualité)' },
    { value: 'webp', label: 'WebP (Optimal)' }
  ],
  imageSize: [
    { value: 'optimize_for_quality', label: 'Optimisé qualité' },
    { value: 'optimize_for_speed', label: 'Optimisé vitesse' }
  ]
};

/**
 * Valeurs min/max pour les paramètres numériques
 */
export const CONSTRAINTS = {
  guidance: { min: 1, max: 20, recommended: [2, 4], step: 0.5 },
  numInferenceSteps: { min: 1, max: 100, recommended: [28, 50], step: 1 },
  outputQuality: { min: 0, max: 100, recommended: [80, 95], step: 5 },
  numFrames: { min: 81, max: 121, step: 1 },
  framesPerSecond: { min: 5, max: 30, step: 1 },
  sampleShift: { min: 1, max: 20, step: 1 }
};
