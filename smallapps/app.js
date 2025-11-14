/**
 * SmallApp - Standalone Template Executor
 * Version inspirée de AppViewer du frontend principal
 */

// Configuration
const CONFIG = {
  apiBaseUrl: window.location.hostname === 'localhost' 
    ? 'http://localhost:3000' 
    : `${window.location.protocol}//${window.location.host}`,
  templateFile: 'template.json'
}

// État global de l'application
const state = {
  template: null,
  formInputs: {},
  executing: false,
  results: null,
  cameraStream: null,
  capturedPhoto: null,
  currentInputId: null
}

// Détection mobile
const isMobile = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
}

/**
 * Initialisation de l'application
 */
async function init() {
  try {
    // Charger le template
    const response = await fetch(CONFIG.templateFile)
    if (!response.ok) {
      throw new Error('Impossible de charger le template')
    }
    
    state.template = await response.json()
    
    // Initialiser l'interface
    renderApp()
    setupEventListeners()
    
    console.log('✅ Application initialisée', state.template)
  } catch (error) {
    console.error('❌ Erreur d\'initialisation:', error)
    showError('Erreur lors du chargement du template')
  }
}

/**
 * Rendu de l'application
 */
function renderApp() {
  const template = state.template
  
  // Mettre à jour le header
  document.getElementById('app-title').textContent = template.name || 'Application'
  
  // Générer le formulaire
  const formContainer = document.getElementById('form-container')
  formContainer.innerHTML = ''
  
  if (template.workflow && template.workflow.inputs) {
    template.workflow.inputs.forEach(input => {
      const inputElement = createInputElement(input)
      formContainer.appendChild(inputElement)
    })
  }
  
  // Activer le bouton si pas d'inputs requis
  updateExecuteButtonState()
}

/**
 * Créer un élément d'input selon son type
 */
function createInputElement(inputConfig) {
  const section = document.createElement('div')
  section.className = 'form-section'
  section.dataset.inputId = inputConfig.id
  
  // Label
  const label = document.createElement('label')
  label.className = 'input-label'
  label.innerHTML = `
    ${inputConfig.label || inputConfig.id}
    ${inputConfig.required ? '<span class="required">*</span>' : ''}
  `
  section.appendChild(label)
  
  // Créer l'input selon le type
  switch (inputConfig.type) {
    case 'text_input':
      section.appendChild(createTextInput(inputConfig))
      break
    case 'image_input':
      section.appendChild(createImageInput(inputConfig))
      break
    case 'select_input':
      section.appendChild(createSelectInput(inputConfig))
      break
    case 'number_input':
      section.appendChild(createNumberInput(inputConfig))
      break
    default:
      section.appendChild(createTextInput(inputConfig))
  }
  
  return section
}

/**
 * Créer un input texte
 */
function createTextInput(config) {
  const container = document.createElement('div')
  
  if (config.multiline) {
    const textarea = document.createElement('textarea')
    textarea.className = 'q-textarea q-field__native'
    textarea.placeholder = config.placeholder || ''
    textarea.value = config.defaultValue || ''
    textarea.rows = 4
    textarea.style.width = '100%'
    textarea.style.padding = '0.75rem'
    textarea.style.border = '1px solid #ddd'
    textarea.style.borderRadius = '4px'
    textarea.style.fontSize = '1rem'
    textarea.style.fontFamily = 'inherit'
    textarea.style.resize = 'vertical'
    
    textarea.addEventListener('input', (e) => {
      state.formInputs[config.id] = e.target.value
      updateExecuteButtonState()
    })
    
    container.appendChild(textarea)
  } else {
    const input = document.createElement('input')
    input.type = 'text'
    input.className = 'q-input q-field__native'
    input.placeholder = config.placeholder || ''
    input.value = config.defaultValue || ''
    input.style.width = '100%'
    input.style.padding = '0.75rem'
    input.style.border = '1px solid #ddd'
    input.style.borderRadius = '4px'
    input.style.fontSize = '1rem'
    
    input.addEventListener('input', (e) => {
      state.formInputs[config.id] = e.target.value
      updateExecuteButtonState()
    })
    
    container.appendChild(input)
  }
  
  return container
}

/**
 * Créer un input nombre
 */
function createNumberInput(config) {
  const input = document.createElement('input')
  input.type = 'number'
  input.className = 'q-input q-field__native'
  input.placeholder = config.placeholder || ''
  input.value = config.defaultValue || ''
  input.min = config.min || ''
  input.max = config.max || ''
  input.step = config.step || '1'
  input.style.width = '100%'
  input.style.padding = '0.75rem'
  input.style.border = '1px solid #ddd'
  input.style.borderRadius = '4px'
  input.style.fontSize = '1rem'
  
  input.addEventListener('input', (e) => {
    state.formInputs[config.id] = parseFloat(e.target.value) || 0
    updateExecuteButtonState()
  })
  
  return input
}

/**
 * Créer un input select
 */
function createSelectInput(config) {
  const select = document.createElement('select')
  select.className = 'q-select q-field__native'
  select.style.width = '100%'
  select.style.padding = '0.75rem'
  select.style.border = '1px solid #ddd'
  select.style.borderRadius = '4px'
  select.style.fontSize = '1rem'
  
  // Options
  if (config.options) {
    config.options.forEach(option => {
      const opt = document.createElement('option')
      opt.value = option.value || option
      opt.textContent = option.label || option
      select.appendChild(opt)
    })
  }
  
  select.value = config.defaultValue || ''
  
  select.addEventListener('change', (e) => {
    state.formInputs[config.id] = e.target.value
    updateExecuteButtonState()
  })
  
  return select
}

/**
 * Créer un input image avec caméra
 */
function createImageInput(config) {
  const container = document.createElement('div')
  container.className = 'image-input-container'
  container.id = `image-container-${config.id}`
  
  // Zone d'upload
  const uploadZone = document.createElement('div')
  uploadZone.className = 'image-upload-zone'
  uploadZone.innerHTML = `
    <div class="upload-icon">
      <i class="material-icons">image</i>
    </div>
    <div class="upload-text">
      <strong>Glissez-déposez une image ici</strong><br>
      ou cliquez pour sélectionner<br>
      <small>JPG, PNG, WebP, GIF</small>
    </div>
  `
  
  // Input file caché
  const fileInput = document.createElement('input')
  fileInput.type = 'file'
  fileInput.accept = 'image/*'
  fileInput.style.display = 'none'
  
  fileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
      handleImageFile(config.id, e.target.files[0])
    }
  })
  
  uploadZone.addEventListener('click', () => fileInput.click())
  
  // Drag & Drop
  uploadZone.addEventListener('dragover', (e) => {
    e.preventDefault()
    uploadZone.classList.add('dragover')
  })
  
  uploadZone.addEventListener('dragleave', () => {
    uploadZone.classList.remove('dragover')
  })
  
  uploadZone.addEventListener('drop', (e) => {
    e.preventDefault()
    uploadZone.classList.remove('dragover')
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageFile(config.id, e.dataTransfer.files[0])
    }
  })
  
  container.appendChild(uploadZone)
  container.appendChild(fileInput)
  
  // Boutons caméra
  const cameraButtons = document.createElement('div')
  cameraButtons.className = 'camera-buttons'
  
  const cameraBtn = document.createElement('button')
  cameraBtn.className = 'q-btn q-btn--outline q-btn--actionable q-btn--rectangle'
  cameraBtn.innerHTML = `
    <span class="q-btn__content">
      <i class="material-icons">camera_alt</i>
      <span>Prendre une photo</span>
    </span>
  `
  cameraBtn.addEventListener('click', () => openCamera(config.id, 'environment'))
  cameraButtons.appendChild(cameraBtn)
  
  // Bouton caméra frontale (mobile seulement)
  if (isMobile()) {
    const frontCameraBtn = document.createElement('button')
    frontCameraBtn.className = 'q-btn q-btn--outline q-btn--actionable q-btn--rectangle'
    frontCameraBtn.innerHTML = `
      <span class="q-btn__content">
        <i class="material-icons">camera_front</i>
        <span>Caméra frontale</span>
      </span>
    `
    frontCameraBtn.addEventListener('click', () => openCamera(config.id, 'user'))
    cameraButtons.appendChild(frontCameraBtn)
  }
  
  container.appendChild(cameraButtons)
  
  return container
}

/**
 * Gérer un fichier image
 */
function handleImageFile(inputId, file) {
  if (!file.type.startsWith('image/')) {
    alert('Veuillez sélectionner une image valide')
    return
  }
  
  // Stocker le fichier
  state.formInputs[inputId] = file
  
  // Créer un aperçu
  const reader = new FileReader()
  reader.onload = (e) => {
    showImagePreview(inputId, e.target.result, file.name)
  }
  reader.readAsDataURL(file)
  
  updateExecuteButtonState()
}

/**
 * Afficher l'aperçu de l'image
 */
function showImagePreview(inputId, imageSrc, filename) {
  const container = document.getElementById(`image-container-${inputId}`)
  
  // Supprimer l'ancienne zone d'upload
  const oldZone = container.querySelector('.image-upload-zone')
  const oldButtons = container.querySelector('.camera-buttons')
  if (oldZone) oldZone.remove()
  if (oldButtons) oldButtons.remove()
  
  // Créer l'aperçu
  const preview = document.createElement('div')
  preview.className = 'image-preview'
  preview.innerHTML = `
    <img src="${imageSrc}" alt="Aperçu">
    <div class="image-actions">
      <span class="filename">${filename}</span>
      <button class="q-btn q-btn--flat q-btn--actionable" onclick="removeImage('${inputId}')">
        <span class="q-btn__content">
          <i class="material-icons">delete</i>
        </span>
      </button>
    </div>
  `
  
  container.insertBefore(preview, container.firstChild)
}

/**
 * Supprimer une image
 */
window.removeImage = function(inputId) {
  console.log('🗑️ Suppression image:', inputId)
  
  // Supprimer du state
  delete state.formInputs[inputId]
  
  // Trouver la config de l'input
  const config = state.template.workflow.inputs.find(i => i.id === inputId)
  if (!config) {
    console.error('❌ Config introuvable pour:', inputId)
    return
  }
  
  // Trouver le container
  const container = document.getElementById(`image-container-${inputId}`)
  if (!container) {
    console.error('❌ Container introuvable pour:', inputId)
    return
  }
  
  // Vider complètement le container
  container.innerHTML = ''
  
  // Recréer le contenu de l'input (zone upload + file input + boutons)
  const newInputElement = createImageInput(config)
  
  // Copier le contenu du nouveau container dans le container existant
  while (newInputElement.firstChild) {
    container.appendChild(newInputElement.firstChild)
  }
  
  console.log('✅ Input recréé pour:', inputId)
  
  // Mettre à jour le bouton d'exécution
  updateExecuteButtonState()
}

/**
 * Ouvrir la caméra
 */
async function openCamera(inputId, cameraType = 'environment') {
  state.currentInputId = inputId
  state.capturedPhoto = null
  
  const modal = document.getElementById('camera-modal')
  const video = document.getElementById('camera-video')
  const errorDiv = document.getElementById('camera-error')
  const preview = document.getElementById('photo-preview')
  
  modal.classList.add('active')
  preview.classList.remove('active')
  errorDiv.style.display = 'none'
  
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: cameraType,
        width: { ideal: 1920 },
        height: { ideal: 1080 }
      }
    })
    
    state.cameraStream = stream
    video.srcObject = stream
    video.style.display = 'block'
    
    renderCameraButtons(false)
  } catch (error) {
    console.error('❌ Erreur caméra:', error)
    errorDiv.textContent = 'Impossible d\'accéder à la caméra. Vérifiez les permissions.'
    errorDiv.style.display = 'block'
    video.style.display = 'none'
  }
}

/**
 * Capturer une photo
 */
function capturePhoto() {
  const video = document.getElementById('camera-video')
  const canvas = document.getElementById('camera-canvas')
  const preview = document.getElementById('photo-preview')
  const previewImg = document.getElementById('preview-image')
  
  // Configurer le canvas
  canvas.width = video.videoWidth
  canvas.height = video.videoHeight
  
  // Dessiner l'image
  const ctx = canvas.getContext('2d')
  ctx.drawImage(video, 0, 0)
  
  // Obtenir le data URL
  state.capturedPhoto = canvas.toDataURL('image/jpeg', 0.9)
  
  // Afficher l'aperçu
  previewImg.src = state.capturedPhoto
  preview.classList.add('active')
  video.style.display = 'none'
  
  renderCameraButtons(true)
}

/**
 * Recommencer la capture
 */
function retakePhoto() {
  state.capturedPhoto = null
  const video = document.getElementById('camera-video')
  const preview = document.getElementById('photo-preview')
  
  preview.classList.remove('active')
  video.style.display = 'block'
  
  renderCameraButtons(false)
}

/**
 * Utiliser la photo capturée
 */
function usePhoto() {
  if (!state.capturedPhoto) return
  
  // Convertir data URL en File
  fetch(state.capturedPhoto)
    .then(res => res.blob())
    .then(blob => {
      const file = new File([blob], `camera-${Date.now()}.jpg`, { type: 'image/jpeg' })
      handleImageFile(state.currentInputId, file)
      closeCamera()
    })
}

/**
 * Fermer la caméra
 */
function closeCamera() {
  const modal = document.getElementById('camera-modal')
  modal.classList.remove('active')
  
  // Arrêter le stream
  if (state.cameraStream) {
    state.cameraStream.getTracks().forEach(track => track.stop())
    state.cameraStream = null
  }
  
  state.capturedPhoto = null
  state.currentInputId = null
}

/**
 * Rendu des boutons de la caméra
 */
function renderCameraButtons(photoTaken) {
  const actionsDiv = document.getElementById('camera-actions')
  
  if (photoTaken) {
    actionsDiv.innerHTML = `
      <button id="use-photo-btn" class="q-btn q-btn--unelevated q-btn--actionable q-btn--rectangle" style="background: #4caf50; color: white;">
        <span class="q-btn__content">
          <i class="material-icons">check</i>
          <span>Utiliser</span>
        </span>
      </button>
      <button id="retake-btn" class="q-btn q-btn--outline q-btn--actionable q-btn--rectangle">
        <span class="q-btn__content">
          <i class="material-icons">refresh</i>
          <span>Recommencer</span>
        </span>
      </button>
      <button id="cancel-camera-btn" class="q-btn q-btn--flat q-btn--actionable q-btn--rectangle">
        <span class="q-btn__content">
          <i class="material-icons">close</i>
          <span>Annuler</span>
        </span>
      </button>
    `
    
    document.getElementById('use-photo-btn').addEventListener('click', usePhoto)
    document.getElementById('retake-btn').addEventListener('click', retakePhoto)
    document.getElementById('cancel-camera-btn').addEventListener('click', closeCamera)
  } else {
    actionsDiv.innerHTML = `
      <button id="capture-btn" class="q-btn q-btn--unelevated q-btn--actionable q-btn--rectangle" style="background: #667eea; color: white;">
        <span class="q-btn__content">
          <i class="material-icons">camera</i>
          <span>Capturer</span>
        </span>
      </button>
    `
    
    document.getElementById('capture-btn').addEventListener('click', capturePhoto)
  }
}

/**
 * Mettre à jour l'état du bouton d'exécution
 */
function updateExecuteButtonState() {
  const executeBtn = document.getElementById('execute-btn')
  const inputs = state.template?.workflow?.inputs || []
  
  let isValid = true
  
  // Vérifier que tous les inputs requis sont remplis
  for (const input of inputs) {
    if (input.required) {
      const value = state.formInputs[input.id]
      if (value === undefined || value === null || value === '') {
        isValid = false
        break
      }
    }
  }
  
  executeBtn.disabled = !isValid
  
  if (isValid) {
    executeBtn.style.background = '#667eea'
    executeBtn.style.color = 'white'
    executeBtn.style.opacity = '1'
    executeBtn.style.cursor = 'pointer'
  } else {
    executeBtn.style.background = '#ccc'
    executeBtn.style.color = '#666'
    executeBtn.style.opacity = '0.6'
    executeBtn.style.cursor = 'not-allowed'
  }
}

/**
 * Exécuter le workflow
 */
async function executeWorkflow() {
  if (state.executing) return
  
  state.executing = true
  const executeBtn = document.getElementById('execute-btn')
  const resultsSection = document.getElementById('results-section')
  const resultsContainer = document.getElementById('results-container')
  
  // Afficher le chargement
  executeBtn.disabled = true
  resultsContainer.innerHTML = `
    <div class="loading-container">
      <div class="spinner"></div>
      <div class="loading-text">Exécution en cours...</div>
    </div>
  `
  resultsSection.style.display = 'block'
  
  try {
    console.log('🚀 Début exécution workflow')
    console.log('📋 state.formInputs:', state.formInputs)
    console.log('📋 state.template.workflow.inputs:', state.template.workflow?.inputs)
    
    // 1️⃣ UPLOAD DES IMAGES et collecte des URLs
    console.log('1️⃣ Upload des images...')
    const imageUrls = {}
    
    for (const [key, value] of Object.entries(state.formInputs)) {
      if (value instanceof File) {
        console.log(`📤 Upload image: ${key}`)
        const imageFormData = new FormData()
        imageFormData.append('image', value)
        
        const uploadResponse = await axios.post(`${CONFIG.apiBaseUrl}/api/media/upload`, imageFormData)
        
        // Extraire l'URL selon la structure de la réponse
        let imageUrl = null
        if (uploadResponse.data.success) {
          // Type 'single': { success, type: 'single', media: { url } }
          if (uploadResponse.data.type === 'single' && uploadResponse.data.media?.url) {
            imageUrl = uploadResponse.data.media.url
          }
          // Type 'fields': { success, type: 'fields', results: { image: { uploaded: [{url}] } } }
          else if (uploadResponse.data.type === 'fields' && uploadResponse.data.results?.image?.uploaded?.[0]?.url) {
            imageUrl = uploadResponse.data.results.image.uploaded[0].url
          }
          // Fallback: URL à la racine
          else if (uploadResponse.data.url) {
            imageUrl = uploadResponse.data.url
          }
        }
        
        if (!imageUrl) {
          throw new Error('Impossible d\'extraire l\'URL de l\'image uploadée')
        }
        
        imageUrls[key] = imageUrl
        console.log(`✅ Image uploadée: ${key} → ${imageUrl}`)
      }
    }
    
    // 2️⃣ INJECTER LES DONNÉES DANS LE WORKFLOW
    console.log('2️⃣ Injection des données dans le workflow...')
    console.log('  imageUrls collectées:', imageUrls)
    console.log('  state.formInputs:', state.formInputs)
    
    const workflow = {
      ...state.template.workflow,
      id: state.template.id || `workflow_${Date.now()}`
    }
    
    console.log('  workflow.inputs AVANT injection:', JSON.stringify(workflow.inputs, null, 2))
    
    // Injecter les données dans les inputs du workflow
    if (workflow.inputs && Array.isArray(workflow.inputs)) {
      for (const input of workflow.inputs) {
        const inputId = input.id
        
        if (input.type === 'image_input') {
          // Injecter l'URL de l'image uploadée
          if (imageUrls[inputId]) {
            input.selectedImage = imageUrls[inputId]
            console.log(`  ✅ Image injectée dans workflow: ${inputId} = ${imageUrls[inputId]}`)
          }
        } else if (input.type === 'text_input') {
          // Injecter le texte saisi
          if (state.formInputs[inputId] !== undefined) {
            input.userInput = state.formInputs[inputId]
            console.log(`  ✅ Texte injecté dans workflow: ${inputId} = ${state.formInputs[inputId]}`)
          }
        } else {
          // Autres types (number, select, etc.)
          if (state.formInputs[inputId] !== undefined) {
            input.userInput = state.formInputs[inputId]
            console.log(`  ✅ Valeur injectée dans workflow: ${inputId} = ${state.formInputs[inputId]}`)
          }
        }
      }
    }
    
    console.log('  workflow.inputs APRÈS injection:', JSON.stringify(workflow.inputs, null, 2))
    
    // 3️⃣ EXÉCUTER LE WORKFLOW
    console.log('3️⃣ Envoi du workflow au backend...')
    console.log('📦 Workflow complet:', JSON.stringify({
      id: workflow.id,
      name: workflow.name,
      inputs: workflow.inputs
    }, null, 2))
    
    const response = await axios.post(`${CONFIG.apiBaseUrl}/api/workflow/run`, {
      workflow: workflow,
      inputs: {}  // Vide mais requis par le backend
    })
    
    state.results = response.data
    
    console.log('✅ Réponse backend reçue:', response.data)
    console.log('📊 Structure:', {
      success: response.data.success,
      hasResults: !!response.data.results,
      hasOutputs: !!response.data.outputs,
      keys: Object.keys(response.data)
    })
    
    // Afficher les résultats
    displayResults(response.data)
    
  } catch (error) {
    console.error('❌ Erreur d\'exécution:', error)
    resultsContainer.innerHTML = `
      <div class="error-message">
        <strong>Erreur lors de l'exécution</strong><br>
        ${error.response?.data?.error || error.message || 'Erreur inconnue'}
      </div>
    `
  } finally {
    state.executing = false
    executeBtn.disabled = false
  }
}

/**
 * Afficher les résultats
 */
function displayResults(results) {
  const resultsContainer = document.getElementById('results-container')
  resultsContainer.innerHTML = ''
  
  console.log('🎨 displayResults appelé avec:', results)
  console.log('  results.outputs:', results.outputs)
  console.log('  results.results:', results.results)
  
  // Le backend renvoie une structure comme:
  // {
  //   success: true,
  //   results: { output1: "/medias/xxx.jpg", output2: "text" },
  //   task_results: {...}
  // }
  
  // Convertir results en tableau d'outputs
  let outputs = []
  
  if (results.results && typeof results.results === 'object') {
    // Parcourir les résultats
    Object.entries(results.results).forEach(([key, value]) => {
      console.log(`  🔍 Analyse résultat ${key}:`, value, typeof value)
      
      // Cas spécial : Si value a déjà les champs id/type/result, c'est un output déjà formaté
      if (typeof value === 'object' && value !== null && 
          'id' in value && 'type' in value && 'result' in value) {
        console.log(`    → Output déjà formaté détecté !`)
        outputs.push(value)
        return
      }
      
      // Sinon, déterminer le type selon la valeur
      let type = 'text_output'
      
      // Cas 1: String path d'image
      if (typeof value === 'string' && value.startsWith('/medias/')) {
        type = 'image_output'
      } 
      // Cas 2: Array d'images
      else if (Array.isArray(value) && value.every(v => typeof v === 'string' && v.startsWith('/medias/'))) {
        type = 'image_output'
      }
      // Cas 3: Objet pseudo-array d'images (ex: {0: "/medias/xxx.jpg"})
      else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        const values = Object.values(value)
        if (values.length > 0 && values.every(v => typeof v === 'string' && v.startsWith('/medias/'))) {
          type = 'image_output'
        }
      }
      
      console.log(`    → Type détecté: ${type}`)
      
      outputs.push({
        id: key,
        type: type,
        result: value
      })
    })
  }
  
  console.log('  outputs finaux:', outputs)
  console.log('  📊 Nombre d\'outputs à afficher:', outputs.length)
  
  // Dédupliquer les outputs si nécessaire (par ID)
  const uniqueOutputs = []
  const seenIds = new Set()
  
  outputs.forEach(output => {
    if (!seenIds.has(output.id)) {
      uniqueOutputs.push(output)
      seenIds.add(output.id)
    } else {
      console.log(`  ⚠️ Output dupliqué ignoré: ${output.id}`)
    }
  })
  
  console.log('  📊 Nombre d\'outputs uniques:', uniqueOutputs.length)
  
  if (uniqueOutputs && uniqueOutputs.length > 0) {
    uniqueOutputs.forEach((output, index) => {
      console.log(`  📌 Affichage output #${index + 1}/${uniqueOutputs.length}:`, output)
      console.log('    Type:', output.type)
      console.log('    Result:', output.result)
      console.log('    Result type:', typeof output.result)
      console.log('    Is array?:', Array.isArray(output.result))
      
      if (output.type === 'image_output' && output.result) {
        let images = []
        
        if (Array.isArray(output.result)) {
          // Array d'URLs directement
          images = output.result
        } else if (typeof output.result === 'object' && output.result !== null) {
          // Objet: extraire l'URL d'image
          // Priorité: image_url > image > first numeric key
          if (output.result.image_url) {
            images = [output.result.image_url]
          } else if (output.result.image) {
            images = [output.result.image]
          } else {
            // Objet avec clés numériques {0: "url", 1: "url"}
            const numericValues = Object.keys(output.result)
              .filter(k => !isNaN(k))
              .map(k => output.result[k])
            images = numericValues.length > 0 ? numericValues : []
          }
        } else if (typeof output.result === 'string') {
          images = [output.result]
        }
        
        console.log('    Images à afficher:', images)
        console.log('    📷 Nombre d\'images dans ce output:', images.length)
        
        images.forEach((imagePath, imgIndex) => {
          console.log(`      → Image ${imgIndex + 1}/${images.length}:`, imagePath)
          const imageUrl = `${CONFIG.apiBaseUrl}${imagePath}`
          
          const resultDiv = document.createElement('div')
          resultDiv.className = 'result-image'
          resultDiv.style.marginBottom = '1rem'
          resultDiv.innerHTML = `
            <img src="${imageUrl}" alt="Résultat">
            <div class="image-actions">
              <a href="${imageUrl}" download class="q-btn q-btn--outline q-btn--actionable">
                <span class="q-btn__content">
                  <i class="material-icons">download</i>
                  <span>Télécharger</span>
                </span>
              </a>
            </div>
          `
          resultsContainer.appendChild(resultDiv)
        })
      } else if (output.type === 'text_output' && output.result) {
        // Extraire le texte du résultat
        let textContent = ''
        
        if (typeof output.result === 'string') {
          // Texte direct
          textContent = output.result
        } else if (typeof output.result === 'object' && output.result !== null) {
          // Objet: extraire la propriété text
          if (output.result.text) {
            textContent = output.result.text
          } else {
            // Fallback: afficher le JSON
            textContent = JSON.stringify(output.result, null, 2)
          }
        }
        
        console.log('    📝 Texte à afficher:', textContent)
        
        const textDiv = document.createElement('div')
        textDiv.style.padding = '1rem'
        textDiv.style.background = '#f9f9f9'
        textDiv.style.borderRadius = '8px'
        textDiv.style.marginBottom = '1rem'
        textDiv.style.lineHeight = '1.6'
        textDiv.style.color = '#333'
        textDiv.innerHTML = `<div style="white-space: pre-wrap;">${textContent}</div>`
        resultsContainer.appendChild(textDiv)
      } else if (output.type === 'video_output' && output.result) {
        // Extraire l'URL de la vidéo
        let videoUrl = ''
        
        if (typeof output.result === 'string') {
          // URL directe
          videoUrl = output.result
        } else if (typeof output.result === 'object' && output.result !== null) {
          // Objet: extraire l'URL de la vidéo
          // Priorité: video_url > video
          if (output.result.video_url) {
            videoUrl = output.result.video_url
          } else if (output.result.video) {
            videoUrl = output.result.video
          }
        }
        
        if (videoUrl) {
          console.log('    🎬 Vidéo à afficher:', videoUrl)
          const fullVideoUrl = `${CONFIG.apiBaseUrl}${videoUrl}`
          
          const videoDiv = document.createElement('div')
          videoDiv.className = 'result-video'
          videoDiv.style.marginBottom = '1rem'
          videoDiv.innerHTML = `
            <video controls style="width: 100%; border-radius: 8px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);">
              <source src="${fullVideoUrl}" type="video/mp4">
              Votre navigateur ne supporte pas la lecture de vidéos.
            </video>
            <div class="video-actions" style="margin-top: 0.5rem;">
              <a href="${fullVideoUrl}" download class="q-btn q-btn--outline q-btn--actionable">
                <span class="q-btn__content">
                  <i class="material-icons">download</i>
                  <span>Télécharger la vidéo</span>
                </span>
              </a>
            </div>
          `
          resultsContainer.appendChild(videoDiv)
        }
      }
    })
  } else {
    console.log('⚠️ Aucun résultat à afficher')
    resultsContainer.innerHTML = `
      <div style="padding: 2rem; text-align: center; color: #666;">
        <i class="material-icons" style="font-size: 3rem; margin-bottom: 1rem;">info</i>
        <p style="margin: 0;">Aucun résultat disponible</p>
        <small style="color: #999;">Le workflow s'est exécuté mais n'a pas produit de résultat.</small>
      </div>
    `
  }
}

/**
 * Afficher une erreur
 */
function showError(message) {
  const formContainer = document.getElementById('form-container')
  formContainer.innerHTML = `
    <div class="error-message">
      <strong>Erreur</strong><br>
      ${message}
    </div>
  `
}

/**
 * Configuration des event listeners
 */
function setupEventListeners() {
  // Bouton exécuter
  document.getElementById('execute-btn').addEventListener('click', executeWorkflow)
  
  // Fermer la caméra
  document.getElementById('close-camera').addEventListener('click', closeCamera)
  
  // Échap pour fermer la caméra
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeCamera()
    }
  })
}

// Initialiser au chargement
window.addEventListener('DOMContentLoaded', init)
