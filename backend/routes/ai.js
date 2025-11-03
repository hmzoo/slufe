import express from 'express';
import multer from 'multer';

const router = express.Router();

// Configuration de multer pour l'upload d'images
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // Limite de 10MB par fichier
  },
  fileFilter: (req, file, cb) => {
    // Accepter uniquement les images
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Le fichier doit être une image'), false);
    }
  },
});

// Route de statut
router.get('/status', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// Route principale pour traiter le prompt avec images
router.post('/prompt', upload.array('images', 10), async (req, res) => {
  try {
    const { prompt } = req.body;
    const images = req.files;

    // Validation
    if (!prompt) {
      return res.status(400).json({
        success: false,
        error: 'Le prompt est requis',
      });
    }

    console.log(`📝 Prompt reçu: ${prompt}`);
    console.log(`🖼️  Nombre d'images: ${images ? images.length : 0}`);

    // Réponse mock - simuler un délai de traitement
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Réponse simulée avec une image ou vidéo
    const mockResponse = {
      success: true,
      type: 'image', // ou 'video'
      resultUrl: 'https://picsum.photos/800/600', // URL mock d'image
      message: `Résultat généré pour: "${prompt}"`,
      processedImages: images ? images.length : 0,
      timestamp: new Date().toISOString(),
    };

    // Alternative pour une réponse vidéo (commentée)
    // const mockResponse = {
    //   success: true,
    //   type: 'video',
    //   resultUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
    //   message: `Vidéo générée pour: "${prompt}"`,
    //   processedImages: images ? images.length : 0,
    //   timestamp: new Date().toISOString(),
    // };

    res.json(mockResponse);
  } catch (error) {
    console.error('❌ Erreur lors du traitement:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors du traitement de la requête',
      details: error.message,
    });
  }
});

export default router;
