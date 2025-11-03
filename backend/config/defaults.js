/**
 * Paramètres par défaut pour la génération de contenu
 * Ces valeurs doivent être synchronisées avec le frontend
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
  aspectRatio: ['16:9', '9:16', '1:1', '4:3', '3:4', '21:9', '9:21'],
  resolution: ['480p', '720p'],
  outputFormat: ['jpg', 'png', 'webp'],
  imageSize: ['optimize_for_quality', 'optimize_for_speed']
};

/**
 * Valeurs min/max pour les paramètres numériques
 */
export const CONSTRAINTS = {
  guidance: { min: 1, max: 20, recommended: [2, 4] },
  numInferenceSteps: { min: 1, max: 100, recommended: [28, 50] },
  outputQuality: { min: 0, max: 100, recommended: [80, 95] },
  numFrames: { min: 81, max: 121 },
  framesPerSecond: { min: 5, max: 30 },
  sampleShift: { min: 1, max: 20 }
};
