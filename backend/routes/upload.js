import express from 'express';
import uploadMediaService from '../services/uploadMedia.js';

const router = express.Router();

/**
 * Route pour uploader un seul fichier
 * POST /api/upload/single
 */
router.post('/single', (req, res) => {
  // Middleware multer pour un seul fichier
  uploadMediaService.single('file')(req, res, async (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        error: err.message
      });
    }

    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'Aucun fichier fourni'
        });
      }

      // Upload le fichier
      const result = await uploadMediaService.uploadSingleFile(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype
      );

      res.json({
        success: true,
        media: result
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });
});

/**
 * Route pour uploader plusieurs fichiers
 * POST /api/upload/multiple
 */
router.post('/multiple', (req, res) => {
  // Middleware multer pour plusieurs fichiers
  uploadMediaService.multiple('files', 10)(req, res, async (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        error: err.message
      });
    }

    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Aucun fichier fourni'
        });
      }

      // Upload les fichiers
      const result = await uploadMediaService.uploadMultipleFiles(req.files);

      res.json(result);

    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });
});

/**
 * Route pour récupérer les informations d'un média
 * GET /api/upload/media/:id
 */
router.get('/media/:id', async (req, res) => {
  try {
    const mediaInfo = await uploadMediaService.getMediaInfo(req.params.id);
    res.json({
      success: true,
      media: mediaInfo
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Route pour supprimer un média
 * DELETE /api/upload/media/:id
 */
router.delete('/media/:id', async (req, res) => {
  try {
    const result = await uploadMediaService.deleteMedia(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Route pour lister tous les médias
 * GET /api/upload/medias
 */
router.get('/medias', async (req, res) => {
  try {
    const medias = await uploadMediaService.listAllMedias();
    res.json({
      success: true,
      medias: medias,
      total: medias.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Route pour uploader des médias avec champs multiples
 * POST /api/upload/fields
 * Exemple: { image: file1, video: file2, audio: file3 }
 */
router.post('/fields', (req, res) => {
  // Configuration pour différents champs
  const fieldsConfig = [
    { name: 'image', maxCount: 5 },
    { name: 'video', maxCount: 3 },
    { name: 'audio', maxCount: 5 },
    { name: 'files', maxCount: 10 }
  ];

  uploadMediaService.fields(fieldsConfig)(req, res, async (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        error: err.message
      });
    }

    try {
      if (!req.files) {
        return res.status(400).json({
          success: false,
          error: 'Aucun fichier fourni'
        });
      }

      const results = {};
      const allUploaded = [];
      const allErrors = [];

      // Traite chaque champ
      for (const [fieldName, files] of Object.entries(req.files)) {
        try {
          const result = await uploadMediaService.uploadMultipleFiles(files);
          results[fieldName] = result;
          allUploaded.push(...result.uploaded);
          allErrors.push(...result.errors);
        } catch (error) {
          results[fieldName] = {
            success: false,
            error: error.message
          };
        }
      }

      res.json({
        success: true,
        results: results,
        summary: {
          total_uploaded: allUploaded.length,
          total_errors: allErrors.length,
          uploaded_medias: allUploaded,
          errors: allErrors
        }
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });
});

export default router;