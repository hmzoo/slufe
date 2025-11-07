/**
 * Définitions des types de tâches disponibles pour le workflow builder
 * Chaque tâche définit ses inputs requis et ses outputs produits
 */

import { INPUT_DEFINITIONS, OUTPUT_DEFINITIONS } from './ioDefinitions.js'

export const TASK_DEFINITIONS = {
  generate_image: {
    type: 'generate_image',
    name: 'Générer une image',
    icon: 'image',
    color: 'purple',
    category: 'image',
    description: 'Génère une image à partir d\'un prompt textuel',
    model: 'Qwen-Image',
    inputs: {
      prompt: {
        type: 'text',
        label: 'Prompt',
        placeholder: 'Décrivez l\'image à générer...',
        required: true,
        multiline: true,
        acceptsVariable: true
      },
      aspectRatio: {
        type: 'select',
        label: 'Format',
        required: false,
        options: [
          { label: 'Carré (1:1)', value: '1:1' },
          { label: 'Portrait (9:16)', value: '9:16' },
          { label: 'Paysage (16:9)', value: '16:9' },
          { label: 'Portrait large (3:4)', value: '3:4' },
          { label: 'Paysage large (4:3)', value: '4:3' }
        ],
        default: '1:1',
        acceptsVariable: false
      }
    },
    outputs: {
      image: {
        type: 'image',
        description: 'URL de l\'image générée'
      }
    }
  },

  edit_image: {
    type: 'edit_image',
    name: 'Éditer une image',
    icon: 'edit',
    color: 'orange',
    category: 'image',
    description: 'Modifie des images selon un prompt d\'édition',
    model: 'Qwen-Image-Edit-Plus',
    inputs: {
      image1: {
        type: 'image',
        label: 'Image 1',
        required: true,
        acceptsVariable: true
      },
      image2: {
        type: 'image',
        label: 'Image 2 (optionnelle)',
        required: false,
        acceptsVariable: true
      },
      image3: {
        type: 'image',
        label: 'Image 3 (optionnelle)',
        required: false,
        acceptsVariable: true
      },
      editPrompt: {
        type: 'text',
        label: 'Instructions d\'édition',
        placeholder: 'Décrivez les modifications...',
        required: true,
        multiline: true,
        acceptsVariable: true
      },
      aspectRatio: {
        type: 'select',
        label: 'Format',
        required: false,
        options: [
          { label: 'Conserver original', value: 'original' },
          { label: 'Carré (1:1)', value: '1:1' },
          { label: 'Portrait (9:16)', value: '9:16' },
          { label: 'Paysage (16:9)', value: '16:9' }
        ],
        default: 'original',
        acceptsVariable: false
      }
    },
    outputs: {
      edited_images: {
        type: 'images',
        description: 'URLs des images modifiées'
      }
    }
  },

  image_resize_crop: {
    type: 'image_resize_crop',
    name: 'Redimensionner/Recadrer',
    icon: 'crop',
    color: 'purple',
    category: 'image',
    description: 'Redimensionne et recadre des images selon des paramètres spécifiques',
    model: 'Sharp',
    inputs: {
      image: {
        type: 'image',
        label: 'Image à traiter',
        required: true,
        acceptsVariable: true,
        multiple: false
      },
      h_max: {
        type: 'number',
        label: 'Largeur maximale',
        required: false,
        default: 1024,
        min: 1,
        max: 4096,
        hint: 'Largeur maximale en pixels (1-4096)',
        acceptsVariable: true
      },
      v_max: {
        type: 'number',
        label: 'Hauteur maximale',
        required: false,
        default: 1024,
        min: 1,
        max: 4096,
        hint: 'Hauteur maximale en pixels (1-4096)',
        acceptsVariable: true
      },
      ratio: {
        type: 'select',
        label: 'Ratio d\'aspect',
        required: false,
        options: [
          { label: 'Conserver le ratio original', value: 'keep' },
          { label: 'Carré (1:1)', value: '1:1' },
          { label: 'Paysage large (16:9)', value: '16:9' },
          { label: 'Portrait (9:16)', value: '9:16' },
          { label: 'Photo classique (4:3)', value: '4:3' },
          { label: 'Portrait classique (3:4)', value: '3:4' },
          { label: 'Format film (3:2)', value: '3:2' },
          { label: 'Portrait film (2:3)', value: '2:3' }
        ],
        default: 'keep',
        acceptsVariable: false
      },
      crop_center: {
        type: 'select',
        label: 'Position de recadrage',
        required: false,
        options: [
          { label: 'Centre', value: 'center' },
          { label: 'Haut', value: 'top' },
          { label: 'Bas', value: 'bottom' },
          { label: 'Tête (portrait)', value: 'head' }
        ],
        default: 'center',
        hint: 'Position du recadrage si changement de ratio nécessaire',
        acceptsVariable: false
      }
    },
    outputs: {
      image_url: {
        type: 'image',
        description: 'URL de l\'image redimensionnée/recadrée'
      },
      original_dimensions: {
        type: 'object',
        description: 'Dimensions originales (largeur x hauteur)'
      },
      final_dimensions: {
        type: 'object',
        description: 'Dimensions finales (largeur x hauteur)'
      },
      applied_operations: {
        type: 'object',
        description: 'Opérations appliquées (redimensionnement, recadrage, etc.)'
      }
    }
  },

  describe_images: {
    type: 'describe_images',
    name: 'Analyser des images',
    icon: 'visibility',
    color: 'blue',
    category: 'image',
    description: 'Analyse et décrit le contenu d\'images',
    model: 'LLaVA-13B',
    inputs: {
      images: {
        type: 'images',
        label: 'Images à analyser',
        required: true,
        acceptsVariable: true,
        multiple: true
      },
      question: {
        type: 'text',
        label: 'Question (optionnel)',
        placeholder: 'Posez une question sur l\'image...',
        required: false,
        multiline: false,
        acceptsVariable: true
      },
      language: {
        type: 'select',
        label: 'Langue des descriptions',
        required: false,
        options: [
          { label: 'Anglais (recommandé pour vidéo)', value: 'en' },
          { label: 'Français', value: 'fr' }
        ],
        default: 'en',
        acceptsVariable: false
      }
    },
    outputs: {
      descriptions: {
        type: 'array',
        description: 'Descriptions textuelles des images'
      }
    }
  },

  enhance_prompt: {
    type: 'enhance_prompt',
    name: 'Améliorer un prompt',
    icon: 'auto_fix_high',
    color: 'green',
    category: 'text',
    description: 'Améliore un prompt pour une meilleure génération',
    model: 'Gemini 2.5 Flash',
    inputs: {
      prompt: {
        type: 'text',
        label: 'Prompt à améliorer',
        placeholder: 'Entrez votre prompt...',
        required: true,
        multiline: true,
        acceptsVariable: true
      },
      targetType: {
        type: 'select',
        label: 'Type de génération',
        required: false,
        options: [
          { label: 'Génération d\'image', value: 'image' },
          { label: 'Édition d\'image', value: 'edit' },
          { label: 'Génération de vidéo', value: 'video' }
        ],
        default: 'image',
        acceptsVariable: false
      },
      style: {
        type: 'select',
        label: 'Style',
        required: false,
        options: [
          { label: 'Photographique', value: 'photographic' },
          { label: 'Artistique', value: 'artistic' },
          { label: 'Cinématique', value: 'cinematic' },
          { label: 'Réaliste', value: 'realistic' },
          { label: 'Fantastique', value: 'fantasy' }
        ],
        default: 'photographic',
        acceptsVariable: false
      },
      imageDescription1: {
        type: 'text',
        label: 'Description image 1 (optionnel)',
        placeholder: 'Description de la première image pour contexte...',
        required: false,
        multiline: true,
        acceptsVariable: true
      },
      imageDescription2: {
        type: 'text',
        label: 'Description image 2 (optionnel)',
        placeholder: 'Description de la seconde image pour contexte...',
        required: false,
        multiline: true,
        acceptsVariable: true
      }
    },
    outputs: {
      enhanced_prompt: {
        type: 'text',
        description: 'Prompt amélioré'
      },
      original_prompt: {
        type: 'text',
        description: 'Prompt original'
      }
    }
  },

  generate_video_t2v: {
    type: 'generate_video_t2v',
    name: 'Générer vidéo (texte)',
    icon: 'videocam',
    color: 'red',
    category: 'video',
    description: 'Génère une vidéo à partir d\'un prompt textuel',
    model: 'Wan 2.2 T2V',
    inputs: {
      prompt: {
        type: 'text',
        label: 'Description de la vidéo',
        placeholder: 'Décrivez la scène vidéo...',
        required: true,
        multiline: true,
        acceptsVariable: true
      },
      numFrames: {
        type: 'select',
        label: 'Nombre d\'images',
        required: false,
        options: [
          { label: '81 frames (rapide, ~3-5s)', value: 81 },
          { label: '121 frames (long, ~5-8s)', value: 121 }
        ],
        default: 81,
        acceptsVariable: false
      },
      aspectRatio: {
        type: 'select',
        label: 'Format vidéo',
        required: false,
        options: [
          { label: '16:9 (paysage)', value: '16:9' },
          { label: '9:16 (portrait)', value: '9:16' }
        ],
        default: '16:9',
        acceptsVariable: false
      },
      loraWeightsTransformer: {
        type: 'text',
        label: 'URL LoRA 1 (optionnel)',
        placeholder: 'https://replicate.delivery/pbxt/...',
        required: false,
        multiline: false,
        acceptsVariable: true,
        validation: {
          pattern: /^https:\/\/replicate\.delivery\/pbxt\/.+$/,
          message: 'URL LoRA invalide (doit commencer par https://replicate.delivery/pbxt/)'
        }
      },
      loraScaleTransformer: {
        type: 'number',
        label: 'Poids LoRA 1',
        required: false,
        min: 0,
        max: 2,
        step: 0.1,
        default: 1.0,
        acceptsVariable: false
      },
      loraWeightsTransformer2: {
        type: 'text',
        label: 'URL LoRA 2 (optionnel)',
        placeholder: 'https://replicate.delivery/pbxt/...',
        required: false,
        multiline: false,
        acceptsVariable: true,
        validation: {
          pattern: /^https:\/\/replicate\.delivery\/pbxt\/.+$/,
          message: 'URL LoRA invalide (doit commencer par https://replicate.delivery/pbxt/)'
        }
      },
      loraScaleTransformer2: {
        type: 'number',
        label: 'Poids LoRA 2',
        required: false,
        min: 0,
        max: 2,
        step: 0.1,
        default: 1.0,
        acceptsVariable: false
      },
      // Paramètres avancés (masqués par défaut)
      resolution: {
        type: 'select',
        label: 'Résolution',
        required: false,
        hidden: true,
        options: [
          { label: '480p (rapide)', value: '480p' },
          { label: '720p (qualité)', value: '720p' }
        ],
        default: '480p',
        acceptsVariable: false,
        hint: 'Résolution de sortie de la vidéo'
      },
      framesPerSecond: {
        type: 'number',
        label: 'FPS',
        required: false,
        hidden: true,
        min: 5,
        max: 30,
        default: 16,
        acceptsVariable: false,
        hint: 'Images par seconde (5-30, défaut: 16)'
      },
      interpolateOutput: {
        type: 'select',
        label: 'Interpoler à 30 FPS',
        required: false,
        hidden: true,
        options: [
          { label: 'Oui (plus fluide)', value: true },
          { label: 'Non (original)', value: false }
        ],
        default: true,
        acceptsVariable: false,
        hint: 'Interpole les frames pour une vidéo plus fluide'
      },
      goFast: {
        type: 'select',
        label: 'Mode rapide',
        required: false,
        hidden: true,
        options: [
          { label: 'Activé (recommandé)', value: true },
          { label: 'Désactivé', value: false }
        ],
        default: true,
        acceptsVariable: false,
        hint: 'Active le mode génération rapide'
      },
      sampleShift: {
        type: 'number',
        label: 'Intensité du mouvement',
        required: false,
        hidden: true,
        min: 1,
        max: 20,
        default: 12,
        acceptsVariable: false,
        hint: '1-20, plus élevé = mouvement plus intense (défaut: 12)'
      },
      seed: {
        type: 'number',
        label: 'Seed (reproductibilité)',
        required: false,
        hidden: true,
        min: 0,
        max: 2147483647,
        acceptsVariable: false,
        hint: 'Laisser vide pour génération aléatoire'
      },
      disable_safety_checker: {
        type: 'select',
        label: 'Désactiver filtre contenu',
        required: false,
        hidden: true,
        options: [
          { label: 'Non (recommandé)', value: false },
          { label: 'Oui', value: true }
        ],
        default: false,
        acceptsVariable: false,
        hint: 'Désactive le filtre de sécurité du contenu'
      }
    },
    outputs: {
      video: {
        type: 'video',
        description: 'URL de la vidéo générée'
      }
    }
  },

  generate_video_i2v: {
    type: 'generate_video_i2v',
    name: 'Générer vidéo (image)',
    icon: 'movie',
    color: 'pink',
    category: 'video',
    description: 'Anime une image pour créer une vidéo',
    model: 'Wan 2.2 I2V',
    inputs: {
      image: {
        type: 'image',
        label: 'Image de départ',
        required: true,
        acceptsVariable: true,
        multiple: false
      },
      lastImage: {
        type: 'image',
        label: 'Image de fin (optionnel)',
        required: false,
        acceptsVariable: true,
        multiple: false,
        hint: 'Image de destination pour créer une transition fluide'
      },
      prompt: {
        type: 'text',
        label: 'Description du mouvement',
        placeholder: 'Décrivez l\'animation souhaitée...',
        required: true,
        multiline: true,
        acceptsVariable: true
      },
      numFrames: {
        type: 'select',
        label: 'Nombre d\'images',
        required: false,
        options: [
          { label: '81 frames (rapide, ~3-5s)', value: 81 },
          { label: '121 frames (long, ~5-8s)', value: 121 }
        ],
        default: 81,
        acceptsVariable: false
      },
      aspectRatio: {
        type: 'select',
        label: 'Format vidéo',
        required: false,
        options: [
          { label: '16:9 (paysage)', value: '16:9' },
          { label: '9:16 (portrait)', value: '9:16' }
        ],
        default: '16:9',
        acceptsVariable: false
      },
      loraWeightsTransformer: {
        type: 'text',
        label: 'URL LoRA 1 (optionnel)',
        placeholder: 'https://replicate.delivery/pbxt/...',
        required: false,
        multiline: false,
        acceptsVariable: true,
        validation: {
          pattern: /^https:\/\/replicate\.delivery\/pbxt\/.+$/,
          message: 'URL LoRA invalide (doit commencer par https://replicate.delivery/pbxt/)'
        }
      },
      loraScaleTransformer: {
        type: 'number',
        label: 'Poids LoRA 1',
        required: false,
        min: 0,
        max: 2,
        step: 0.1,
        default: 1.0,
        acceptsVariable: false
      },
      loraWeightsTransformer2: {
        type: 'text',
        label: 'URL LoRA 2 (optionnel)',
        placeholder: 'https://replicate.delivery/pbxt/...',
        required: false,
        multiline: false,
        acceptsVariable: true,
        validation: {
          pattern: /^https:\/\/replicate\.delivery\/pbxt\/.+$/,
          message: 'URL LoRA invalide (doit commencer par https://replicate.delivery/pbxt/)'
        }
      },
      loraScaleTransformer2: {
        type: 'number',
        label: 'Poids LoRA 2',
        required: false,
        min: 0,
        max: 2,
        step: 0.1,
        default: 1.0,
        acceptsVariable: false
      },
      // Paramètres avancés (masqués par défaut)
      resolution: {
        type: 'select',
        label: 'Résolution',
        required: false,
        hidden: true,
        options: [
          { label: '480p (rapide)', value: '480p' },
          { label: '720p (qualité)', value: '720p' }
        ],
        default: '480p',
        acceptsVariable: false,
        hint: 'Résolution de sortie de la vidéo'
      },
      framesPerSecond: {
        type: 'number',
        label: 'FPS',
        required: false,
        hidden: true,
        min: 5,
        max: 30,
        default: 16,
        acceptsVariable: false,
        hint: 'Images par seconde (5-30, défaut: 16)'
      },
      interpolateOutput: {
        type: 'select',
        label: 'Interpoler à 30 FPS',
        required: false,
        hidden: true,
        options: [
          { label: 'Oui (plus fluide)', value: true },
          { label: 'Non (original)', value: false }
        ],
        default: true,
        acceptsVariable: false,
        hint: 'Interpole les frames pour une vidéo plus fluide'
      },
      goFast: {
        type: 'select',
        label: 'Mode rapide',
        required: false,
        hidden: true,
        options: [
          { label: 'Activé (recommandé)', value: true },
          { label: 'Désactivé', value: false }
        ],
        default: true,
        acceptsVariable: false,
        hint: 'Active le mode génération rapide'
      },
      sampleShift: {
        type: 'number',
        label: 'Intensité du mouvement',
        required: false,
        hidden: true,
        min: 1,
        max: 20,
        default: 12,
        acceptsVariable: false,
        hint: '1-20, plus élevé = mouvement plus intense (défaut: 12)'
      },
      seed: {
        type: 'number',
        label: 'Seed (reproductibilité)',
        required: false,
        hidden: true,
        min: 0,
        max: 2147483647,
        acceptsVariable: false,
        hint: 'Laisser vide pour génération aléatoire'
      },
      disable_safety_checker: {
        type: 'select',
        label: 'Désactiver filtre contenu',
        required: false,
        hidden: true,
        options: [
          { label: 'Non (recommandé)', value: false },
          { label: 'Oui', value: true }
        ],
        default: false,
        acceptsVariable: false,
        hint: 'Désactive le filtre de sécurité du contenu'
      }
    },
    outputs: {
      video: {
        type: 'video',
        description: 'URL de la vidéo générée'
      }
    }
  },

  // ========== TÂCHES DE TRAITEMENT VIDÉO ==========

  video_extract_frame: {
    type: 'video_extract_frame',
    name: 'Extraire une frame',
    icon: 'video_call',
    color: 'purple',
    category: 'video',
    description: 'Extrait une frame (image) d\'une vidéo',
    model: 'FFmpeg',
    inputs: {
      video: {
        type: 'video',
        label: 'Vidéo source',
        required: true,
        acceptsVariable: true
      },
      frameType: {
        type: 'select',
        label: 'Type de frame',
        required: false,
        options: [
          { label: 'Première frame', value: 'first' },
          { label: 'Dernière frame', value: 'last' },
          { label: 'Frame du milieu', value: 'middle' },
          { label: 'Temps spécifique', value: 'time' }
        ],
        default: 'first',
        acceptsVariable: false
      },
      timeCode: {
        type: 'text',
        label: 'Temps spécifique',
        placeholder: '00:00:05.50 ou 5.5',
        required: false,
        multiline: false,
        acceptsVariable: true,
        hint: 'Utilisé uniquement si "Type de frame" = "Temps spécifique"'
      },
      outputFormat: {
        type: 'select',
        label: 'Format de sortie',
        required: false,
        options: [
          { label: 'JPEG (recommandé)', value: 'jpg' },
          { label: 'PNG (avec transparence)', value: 'png' },
          { label: 'WebP (moderne)', value: 'webp' }
        ],
        default: 'jpg',
        acceptsVariable: false
      },
      quality: {
        type: 'number',
        label: 'Qualité',
        required: false,
        min: 1,
        max: 100,
        default: 95,
        acceptsVariable: false,
        hint: '1-100, 100=meilleure qualité'
      }
    },
    outputs: {
      image_url: {
        type: 'image',
        description: 'Image extraite de la vidéo'
      },
      frame_info: {
        type: 'object',
        description: 'Informations sur la frame extraite'
      }
    }
  },

  video_concatenate: {
    type: 'video_concatenate',
    name: 'Concaténer des vidéos',
    icon: 'video_library',
    color: 'deep-purple',
    category: 'video',
    description: 'Assemble deux vidéos en une seule',
    model: 'FFmpeg',
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
      outputFormat: {
        type: 'select',
        label: 'Format de sortie',
        required: false,
        hidden: true, // Masqué pour interface simple
        options: [
          { label: 'MP4 (recommandé)', value: 'mp4' },
          { label: 'MOV', value: 'mov' },
          { label: 'AVI', value: 'avi' },
          { label: 'MKV', value: 'mkv' },
          { label: 'WebM', value: 'webm' }
        ],
        default: 'mp4',
        acceptsVariable: false
      },
      resolution: {
        type: 'select',
        label: 'Résolution',
        required: false,
        hidden: true, // Masqué pour interface simple
        options: [
          { label: 'Automatique (résolution commune)', value: null },
          { label: 'HD 720p (1280x720)', value: '1280x720' },
          { label: 'Full HD 1080p (1920x1080)', value: '1920x1080' },
          { label: '2K (2560x1440)', value: '2560x1440' },
          { label: '4K (3840x2160)', value: '3840x2160' },
          { label: 'Instagram Stories (1080x1920)', value: '1080x1920' },
          { label: 'YouTube Shorts (1080x1920)', value: '1080x1920' }
        ],
        default: null,
        acceptsVariable: false
      },
      fps: {
        type: 'select',
        label: 'Fréquence d\'images',
        required: false,
        hidden: true, // Masqué pour interface simple
        options: [
          { label: 'Automatique', value: null },
          { label: '24 fps (cinéma)', value: 24 },
          { label: '25 fps (PAL)', value: 25 },
          { label: '30 fps (standard)', value: 30 },
          { label: '60 fps (fluide)', value: 60 }
        ],
        default: null,
        acceptsVariable: false
      },
      quality: {
        type: 'select',
        label: 'Qualité',
        required: false,
        hidden: true, // Masqué pour interface simple
        options: [
          { label: 'Basse (rapide, petit fichier)', value: 'low' },
          { label: 'Moyenne (équilibré)', value: 'medium' },
          { label: 'Haute (lent, gros fichier)', value: 'high' }
        ],
        default: 'medium',
        acceptsVariable: false
      }
    },
    outputs: {
      video_url: {
        type: 'video',
        description: 'Vidéo concaténée'
      },
      concat_info: {
        type: 'object',
        description: 'Informations sur la concaténation'
      }
    }
  },

  // ========== TÂCHES GÉNÉRIQUES (SANS API) ==========

  input_text: {
    type: 'input_text',
    name: 'Saisie de texte',
    icon: 'text_fields',
    color: 'grey',
    category: 'input',
    description: 'Capture un texte saisi par l\'utilisateur',
    model: 'Local',
    noExecution: true, // Pas d'appel API, juste stockage
    inputs: {
      label: {
        type: 'text',
        label: 'Libellé du champ',
        placeholder: 'Ex: Entrez votre prompt...',
        required: true,
        multiline: false,
        acceptsVariable: false
      },
      placeholder: {
        type: 'text',
        label: 'Texte d\'aide (placeholder)',
        placeholder: 'Texte affiché dans le champ vide',
        required: false,
        multiline: false,
        acceptsVariable: false
      },
      defaultValue: {
        type: 'text',
        label: 'Valeur par défaut',
        placeholder: 'Valeur initiale...',
        required: false,
        multiline: true,
        acceptsVariable: true
      },
      userInput: {
        type: 'text',
        label: 'Texte saisi (à l\'exécution)',
        placeholder: 'Sera rempli par l\'utilisateur lors de l\'exécution',
        required: false,
        multiline: true,
        acceptsVariable: false,
        executionTime: true // Indique que ce champ est rempli lors de l'exécution
      }
    },
    outputs: {
      text: {
        type: 'text',
        description: 'Texte saisi par l\'utilisateur'
      },
      label: {
        type: 'text',
        description: 'Libellé du champ de saisie'
      },
      timestamp: {
        type: 'text',
        description: 'Horodatage de la saisie'
      }
    }
  },

  input_images: {
    type: 'input_images',
    name: 'Upload d\'images',
    icon: 'upload_file',
    color: 'grey',
    category: 'input',
    description: 'Upload d\'une ou plusieurs images',
    model: 'Local',
    noExecution: true,
    inputs: {
      label: {
        type: 'text',
        label: 'Libellé',
        placeholder: 'Ex: Sélectionnez vos images',
        required: true,
        multiline: false,
        acceptsVariable: false
      },
      multiple: {
        type: 'select',
        label: 'Multiple',
        required: false,
        options: [
          { label: 'Une seule image', value: false },
          { label: 'Plusieurs images', value: true }
        ],
        default: true,
        acceptsVariable: false
      }
    },
    outputs: {
      images: {
        type: 'images',
        description: 'Images uploadées'
      }
    }
  },

  camera_capture: {
    type: 'camera_capture',
    name: 'Capture caméra',
    icon: 'photo_camera',
    color: 'grey',
    category: 'input',
    description: 'Capture une photo depuis la caméra',
    model: 'Local',
    noExecution: true,
    inputs: {
      label: {
        type: 'text',
        label: 'Libellé',
        placeholder: 'Ex: Prenez une photo',
        required: true,
        multiline: false,
        acceptsVariable: false
      },
      facingMode: {
        type: 'select',
        label: 'Caméra',
        required: false,
        options: [
          { label: 'Avant (selfie)', value: 'user' },
          { label: 'Arrière', value: 'environment' }
        ],
        default: 'environment',
        acceptsVariable: false
      }
    },
    outputs: {
      image: {
        type: 'image',
        description: 'Image capturée'
      }
    }
  }
};

/**
 * Retourne la définition d'une tâche par son type
 */
export function getTaskDefinition(taskType) {
  return TASK_DEFINITIONS[taskType];
}

/**
 * Retourne toutes les tâches disponibles
 */
export function getAllTaskTypes() {
  return Object.keys(TASK_DEFINITIONS);
}

/**
 * Retourne les tâches filtrées par catégorie
 */
export function getTasksByCategory(category) {
  return Object.values(TASK_DEFINITIONS).filter(task => task.category === category);
}

/**
 * Retourne les outputs disponibles d'une tâche précédente
 * @param {string} taskId - ID de la tâche
 * @param {string} taskType - Type de la tâche
 * @returns {Array} Liste des outputs disponibles pour les variables
 */
export function getAvailableOutputs(taskId, taskType) {
  const definition = getTaskDefinition(taskType);
  if (!definition) return [];
  
  return Object.keys(definition.outputs).map(outputKey => ({
    variable: `{{${taskId}.${outputKey}}}`,
    label: `${taskId}.${outputKey}`,
    description: definition.outputs[outputKey].description,
    type: definition.outputs[outputKey].type
  }));
}

/**
 * Génère un ID unique pour une nouvelle tâche
 */
export function generateTaskId(taskType, existingIds = []) {
  if (!taskType || typeof taskType !== 'string') {
    console.error('generateTaskId: taskType is required and must be a string', taskType);
    return 'task1'; // fallback
  }
  
  const baseId = taskType.split('_')[0]; // "generate" from "generate_image"
  let counter = 1;
  let taskId = `${baseId}${counter}`;
  
  while (existingIds.includes(taskId)) {
    counter++;
    taskId = `${baseId}${counter}`;
  }
  
  return taskId;
}

// ==========================================
// ORGANISATION PAR SECTIONS
// ==========================================

/**
 * Définitions complètes incluant inputs, tasks et outputs
 */
export const ALL_DEFINITIONS = {
  ...INPUT_DEFINITIONS,
  ...TASK_DEFINITIONS,
  ...OUTPUT_DEFINITIONS
}

/**
 * Catégories de tâches pour l'interface
 */
export const TASK_CATEGORIES = {
  input: {
    name: 'Entrées',
    icon: 'input',
    color: 'blue',
    description: 'Tâches de saisie et d\'upload'
  },
  processing: {
    name: 'Traitement',
    icon: 'settings',
    color: 'orange',
    description: 'Tâches de traitement et transformation'
  },
  output: {
    name: 'Sorties',
    icon: 'output',
    color: 'green',
    description: 'Tâches d\'affichage et de rendu'
  }
}

/**
 * Réorganise les tâches par section pour le nouveau builder
 */
export function getTasksBySection() {
  return {
    inputs: Object.values(INPUT_DEFINITIONS),
    tasks: Object.values(TASK_DEFINITIONS),
    outputs: Object.values(OUTPUT_DEFINITIONS)
  }
}

/**
 * Retourne la définition d'une tâche quelle que soit sa catégorie
 */
export function getDefinition(taskType) {
  return ALL_DEFINITIONS[taskType] || null
}

/**
 * Vérifie si une tâche est de type input
 */
export function isInputTask(taskType) {
  return INPUT_DEFINITIONS.hasOwnProperty(taskType)
}

/**
 * Vérifie si une tâche est de type output
 */
export function isOutputTask(taskType) {
  return OUTPUT_DEFINITIONS.hasOwnProperty(taskType)
}

/**
 * Vérifie si une tâche est de type processing
 */
export function isProcessingTask(taskType) {
  return TASK_DEFINITIONS.hasOwnProperty(taskType)
}
