/**
 * Nouvelles définitions pour les tâches d'entrée (inputs) et de sortie (outputs)
 * Ces tâches permettent une meilleure organisation des workflows
 */

// ==========================================
// TÂCHES D'ENTRÉE (INPUTS)
// ==========================================

export const INPUT_DEFINITIONS = {
  text_input: {
    type: 'text_input',
    name: 'Saisie de texte',
    icon: 'text_fields',
    color: 'blue',
    category: 'input',
    description: 'Permet de saisir du texte libre',
    inputs: {
      label: {
        type: 'text',
        label: 'Libellé du champ',
        placeholder: 'Nom du champ de saisie...',
        required: true,
        acceptsVariable: false
      },
      placeholder: {
        type: 'text',
        label: 'Texte d\'aide',
        placeholder: 'Texte affiché dans le champ vide...',
        required: false,
        acceptsVariable: false
      },
      defaultValue: {
        type: 'text',
        label: 'Valeur par défaut',
        placeholder: 'Valeur initiale...',
        required: false,
        acceptsVariable: false
      },
      multiline: {
        type: 'boolean',
        label: 'Texte multiligne',
        default: false,
        acceptsVariable: false
      },
      required: {
        type: 'boolean',
        label: 'Obligatoire',
        default: true,
        acceptsVariable: false
      },
      userInput: {
        type: 'text',
        label: 'Texte principal à saisir',
        placeholder: 'Le texte que l\'utilisateur va saisir...',
        required: false,
        multiline: true,
        acceptsVariable: false
      }
    },
    outputs: {
      text: {
        type: 'text',
        description: 'Texte saisi par l\'utilisateur'
      }
    }
  },

  image_input: {
    type: 'image_input',
    name: 'Upload d\'image',
    icon: 'add_photo_alternate',
    color: 'teal',
    category: 'input',
    description: 'Permet d\'uploader une image',
    inputs: {
      label: {
        type: 'text',
        label: 'Libellé du champ',
        placeholder: 'Nom du champ d\'upload...',
        required: true,
        acceptsVariable: false
      },
      multiple: {
        type: 'boolean',
        label: 'Images multiples',
        default: false,
        acceptsVariable: false
      },
      required: {
        type: 'boolean',
        label: 'Obligatoire',
        default: true,
        acceptsVariable: false
      },
      maxFiles: {
        type: 'number',
        label: 'Nombre maximum d\'images',
        default: 5,
        min: 1,
        max: 20,
        acceptsVariable: false,
        condition: 'multiple === true'
      },
      selectedImage: {
        type: 'image',
        label: 'Image principale',
        required: false,
        acceptsVariable: true,
        hint: 'Sélectionnez l\'image à utiliser pour cette tâche'
      },
      defaultImage: {
        type: 'image',
        label: 'Image par défaut (optionnelle)',
        required: false,
        acceptsVariable: true,
        hint: 'Sélectionnez une image qui sera pré-chargée'
      }
    },
    outputs: {
      image: {
        type: 'image',
        description: 'Image(s) uploadée(s)'
      }
    }
  },

  select_input: {
    type: 'select_input',
    name: 'Liste déroulante',
    icon: 'arrow_drop_down_circle',
    color: 'indigo',
    category: 'input',
    description: 'Permet de choisir dans une liste d\'options',
    inputs: {
      label: {
        type: 'text',
        label: 'Libellé du champ',
        placeholder: 'Nom de la liste...',
        required: true,
        acceptsVariable: false
      },
      options: {
        type: 'textarea',
        label: 'Options (une par ligne)',
        placeholder: 'Option 1\nOption 2\nOption 3',
        required: true,
        acceptsVariable: false
      },
      defaultValue: {
        type: 'text',
        label: 'Valeur par défaut',
        required: false,
        acceptsVariable: false
      },
      multiple: {
        type: 'boolean',
        label: 'Sélection multiple',
        default: false,
        acceptsVariable: false
      }
    },
    outputs: {
      selected: {
        type: 'text',
        description: 'Valeur(s) sélectionnée(s)'
      }
    }
  },

  number_input: {
    type: 'number_input',
    name: 'Saisie numérique',
    icon: 'pin',
    color: 'cyan',
    category: 'input',
    description: 'Permet de saisir un nombre',
    inputs: {
      label: {
        type: 'text',
        label: 'Libellé du champ',
        placeholder: 'Nom du champ numérique...',
        required: true,
        acceptsVariable: false
      },
      min: {
        type: 'number',
        label: 'Valeur minimale',
        required: false,
        acceptsVariable: false
      },
      max: {
        type: 'number',
        label: 'Valeur maximale',
        required: false,
        acceptsVariable: false
      },
      step: {
        type: 'number',
        label: 'Pas d\'incrémentation',
        default: 1,
        acceptsVariable: false
      },
      defaultValue: {
        type: 'number',
        label: 'Valeur par défaut',
        required: false,
        acceptsVariable: false
      }
    },
    outputs: {
      number: {
        type: 'number',
        description: 'Nombre saisi'
      }
    }
  },

  video_input: {
    type: 'video_input',
    name: 'Upload de vidéo',
    icon: 'video_file',
    color: 'purple',
    category: 'input',
    description: 'Permet d\'uploader une vidéo',
    inputs: {
      label: {
        type: 'text',
        label: 'Libellé du champ',
        placeholder: 'Nom du champ vidéo...',
        required: true,
        acceptsVariable: false
      },
      multiple: {
        type: 'boolean',
        label: 'Vidéos multiples',
        default: false,
        acceptsVariable: false
      },
      required: {
        type: 'boolean',
        label: 'Obligatoire',
        default: true,
        acceptsVariable: false
      },
      maxFiles: {
        type: 'number',
        label: 'Nombre maximum de vidéos',
        default: 3,
        min: 1,
        max: 10,
        acceptsVariable: false,
        condition: 'multiple === true'
      }
    },
    outputs: {
      video: {
        type: 'video',
        description: 'Vidéo(s) uploadée(s)'
      }
    }
  }
}

// ==========================================
// TÂCHES DE SORTIE (OUTPUTS)
// ==========================================

export const OUTPUT_DEFINITIONS = {
  text_output: {
    type: 'text_output',
    name: 'Affichage de texte',
    icon: 'text_snippet',
    color: 'green',
    category: 'output',
    description: 'Affiche du texte à l\'utilisateur',
    inputs: {
      text: {
        type: 'text',
        label: 'Texte à afficher',
        placeholder: 'Texte ou variable...',
        required: true,
        multiline: true,
        acceptsVariable: true
      },
      title: {
        type: 'text',
        label: 'Titre (optionnel)',
        placeholder: 'Titre de la section...',
        required: false,
        acceptsVariable: true
      },
      format: {
        type: 'select',
        label: 'Format d\'affichage',
        required: false,
        options: [
          { label: 'Texte simple', value: 'plain' },
          { label: 'Markdown', value: 'markdown' },
          { label: 'Code', value: 'code' }
        ],
        default: 'plain',
        acceptsVariable: false
      }
    },
    outputs: {}
  },

  image_output: {
    type: 'image_output',
    name: 'Affichage d\'image',
    icon: 'image',
    color: 'orange',
    category: 'output',
    description: 'Affiche une image à l\'utilisateur',
    inputs: {
      image: {
        type: 'image',
        label: 'Image à afficher',
        required: true,
        acceptsVariable: true
      },
      title: {
        type: 'text',
        label: 'Titre (optionnel)',
        placeholder: 'Titre de l\'image...',
        required: false,
        acceptsVariable: true
      },
      caption: {
        type: 'text',
        label: 'Légende (optionnelle)',
        placeholder: 'Description de l\'image...',
        required: false,
        multiline: true,
        acceptsVariable: true
      },
      width: {
        type: 'select',
        label: 'Largeur d\'affichage',
        required: false,
        options: [
          { label: 'Petite (300px)', value: 'small' },
          { label: 'Moyenne (500px)', value: 'medium' },
          { label: 'Grande (800px)', value: 'large' },
          { label: 'Pleine largeur', value: 'full' }
        ],
        default: 'medium',
        acceptsVariable: false
      }
    },
    outputs: {}
  },

  gallery_output: {
    type: 'gallery_output',
    name: 'Galerie d\'images',
    icon: 'collections',
    color: 'pink',
    category: 'output',
    description: 'Affiche plusieurs images sous forme de galerie',
    inputs: {
      images: {
        type: 'images',
        label: 'Images à afficher',
        required: true,
        acceptsVariable: true
      },
      title: {
        type: 'text',
        label: 'Titre de la galerie',
        placeholder: 'Titre de la galerie...',
        required: false,
        acceptsVariable: true
      },
      columns: {
        type: 'select',
        label: 'Nombre de colonnes',
        required: false,
        options: [
          { label: '1 colonne', value: 1 },
          { label: '2 colonnes', value: 2 },
          { label: '3 colonnes', value: 3 },
          { label: '4 colonnes', value: 4 },
          { label: '5 colonnes', value: 5 }
        ],
        default: 3,
        acceptsVariable: false
      },
      imageSize: {
        type: 'select',
        label: 'Taille des images',
        required: false,
        options: [
          { label: 'Miniatures (150px)', value: 'thumbnail' },
          { label: 'Petites (250px)', value: 'small' },
          { label: 'Moyennes (350px)', value: 'medium' },
          { label: 'Grandes (500px)', value: 'large' }
        ],
        default: 'medium',
        acceptsVariable: false
      },
      allowDownload: {
        type: 'boolean',
        label: 'Permettre le téléchargement',
        default: true,
        acceptsVariable: false
      }
    },
    outputs: {}
  },

  video_output: {
    type: 'video_output',
    name: 'Affichage de vidéo',
    icon: 'play_circle',
    color: 'red',
    category: 'output',
    description: 'Affiche une vidéo à l\'utilisateur',
    inputs: {
      video: {
        type: 'video',
        label: 'Vidéo à afficher',
        required: true,
        acceptsVariable: true
      },
      title: {
        type: 'text',
        label: 'Titre (optionnel)',
        placeholder: 'Titre de la vidéo...',
        required: false,
        acceptsVariable: true
      },
      width: {
        type: 'select',
        label: 'Largeur d\'affichage',
        required: false,
        options: [
          { label: 'Petite (400px)', value: 'small' },
          { label: 'Moyenne (600px)', value: 'medium' },
          { label: 'Grande (800px)', value: 'large' },
          { label: 'Pleine largeur', value: 'full' }
        ],
        default: 'medium',
        acceptsVariable: false
      },
      autoplay: {
        type: 'boolean',
        label: 'Lecture automatique',
        default: false,
        acceptsVariable: false
      },
      controls: {
        type: 'boolean',
        label: 'Afficher les contrôles',
        default: true,
        acceptsVariable: false
      },
      loop: {
        type: 'boolean',
        label: 'Lecture en boucle',
        default: false,
        acceptsVariable: false
      }
    },
    outputs: {}
  },

  download_output: {
    type: 'download_output',
    name: 'Téléchargement de fichier',
    icon: 'download',
    color: 'brown',
    category: 'output',
    description: 'Propose le téléchargement d\'un fichier',
    inputs: {
      file: {
        type: 'file',
        label: 'Fichier à télécharger',
        required: true,
        acceptsVariable: true
      },
      filename: {
        type: 'text',
        label: 'Nom du fichier',
        placeholder: 'nom-fichier.ext',
        required: false,
        acceptsVariable: true
      },
      title: {
        type: 'text',
        label: 'Titre du bouton',
        placeholder: 'Télécharger le fichier',
        required: false,
        acceptsVariable: true
      },
      description: {
        type: 'text',
        label: 'Description',
        placeholder: 'Description du fichier...',
        required: false,
        multiline: true,
        acceptsVariable: true
      }
    },
    outputs: {}
  }
}