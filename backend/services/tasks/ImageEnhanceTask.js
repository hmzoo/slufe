/**
 * Service de tâche pour l'amélioration d'images
 * Utilise le modèle Real-ESRGAN via Replicate
 * Permet l'upscaling et l'amélioration de la qualité des images
 */

import Replicate from 'replicate';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import { saveMediaFile, generateUniqueFileName } from '../../utils/fileUtils.js';
import { addImageToCurrentCollection } from '../collectionManager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);



export class ImageEnhanceTask {
  constructor() {
    this.taskType = 'image_enhance';
    this.replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN,
    });
  }

  /**
   * Exécute la tâche d'amélioration d'image
   * @param {Object} inputs - Entrées de la tâche
   * @param {string} inputs.image - URL ou chemin local de l'image
   * @param {number} inputs.scale - Facteur d'upscaling (2-10, défaut: 4)
   * @param {boolean} inputs.face_enhance - Amélioration des visages (défaut: false)
   * @returns {Object} Image améliorée et métadonnées
   */
  async execute(inputs) {
    try {
      global.logWorkflow(`🖼️ Amélioration d'image`, {
        scale: inputs.scale || 4,
        face_enhance: inputs.face_enhance || false
      });

      // Valider les entrées
      if (!inputs.image) {
        throw new Error('Image requise pour l\'amélioration');
      }

      let imageUrl = inputs.image;

      // Si c'est un chemin local, le convertir en URL
      if (imageUrl.startsWith('/medias/')) {
        // Construire l'URL complète
        const apiBaseUrl = process.env.API_BASE_URL || 'http://localhost:3000';
        imageUrl = `${apiBaseUrl}${imageUrl}`;
      }

      // Si c'est une URL localhost, la convertir en base64 (Replicate ne peut pas accéder à localhost)
      if (imageUrl.startsWith('http://localhost:') || imageUrl.startsWith('http://127.0.0.1:')) {
        global.logWorkflow(`🔄 Conversion image localhost en base64 pour Replicate`, {
          url: imageUrl.substring(0, 60) + '...'
        });
        try {
          const response = await fetch(imageUrl);
          if (!response.ok) {
            throw new Error(`Erreur HTTP ${response.status}: ${response.statusText}`);
          }
          const arrayBuffer = await response.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          const contentType = response.headers.get('content-type') || 'image/jpeg';
          const base64Data = buffer.toString('base64');
          imageUrl = `data:${contentType};base64,${base64Data}`;
          
          global.logWorkflow(`✅ Image convertie en base64`, {
            size: `${Math.round(buffer.length / 1024)}KB`
          });
        } catch (error) {
          throw new Error(`Impossible de télécharger l'image locale: ${error.message}`);
        }
      }

      // Valider et normaliser les paramètres
      const scale = Math.min(Math.max(inputs.scale || 4, 0), 10); // Clamp entre 0 et 10
      const faceEnhance = inputs.face_enhance || false;

      global.logWorkflow(`🚀 Appel Real-ESRGAN avec:`, {
        imageType: imageUrl.startsWith('data:') ? 'base64' : 'URL',
        scale: scale,
        face_enhance: faceEnhance
      });

      // Préparer les inputs pour Replicate
      const replicateInput = {
        image: imageUrl,
        scale: scale,
        face_enhance: faceEnhance
      };

      // Appeler le modèle Real-ESRGAN
      const output = await this.replicate.run('nightmareai/real-esrgan', {
        input: replicateInput
      });

      console.log('✅ Real-ESRGAN output reçu');

      // Convertir le FileURL en string si nécessaire
      let outputUrl = output;
      if (typeof output === 'object' && output.url) {
        outputUrl = output.url();
      } else if (typeof output === 'string') {
        outputUrl = output;
      }

      global.logWorkflow(`🔗 URL Replicate obtenue`, {
        url: outputUrl.substring(0, 100) + '...'
      });

      // Télécharger l'image depuis Replicate et la sauvegarder localement
      const imageResponse = await fetch(outputUrl);
      if (!imageResponse.ok) {
        throw new Error(`Erreur lors du téléchargement de l'image: ${imageResponse.statusText}`);
      }

      const arrayBuffer = await imageResponse.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Générer un nom de fichier unique
      const filename = generateUniqueFileName('.png');
      const savedFile = saveMediaFile(filename, buffer);

      global.logWorkflow(`💾 Image améliorée sauvegardée localement`, {
        filename: savedFile.filename,
        url: savedFile.url,
        size: `${Math.round(buffer.length / 1024)}KB`
      });

      // Ajouter l'image à la collection courante (comme EditImageTask)
      try {
        await addImageToCurrentCollection({
          url: savedFile.url,                   // Chemin relatif `/medias/xxx`
          mediaId: filename.replace(/\.[^/.]+$/, ''),  // UUID-like ID
          description: `Image améliorée ${scale}x${faceEnhance ? ' avec amélioration des visages' : ''}`
        });
        global.logWorkflow(`✅ Image améliorée ajoutée à la collection courante`, {
          filename: savedFile.filename
        });
      } catch (collectionError) {
        global.logWorkflow(`⚠️ Impossible d'ajouter à la collection: ${collectionError.message}`);
        // Ne pas arrêter l'exécution si la sauvegarde collection échoue
      }

      // Retourner le chemin local pour compatibilité avec les autres services
      return {
        image: savedFile.url,                  // Chemin `/medias/xxx` pour chaînage
        image_filename: savedFile.filename,
        external_url: outputUrl,               // Garder l'URL Replicate originale pour référence
        original_image: inputs.image,
        scale: scale,
        face_enhance: faceEnhance,
        title: 'Image améliorée',
        caption: `Image upscalée ${scale}x${faceEnhance ? ' avec amélioration des visages' : ''}`,
        status: 'success',
        type: 'image'
      };

    } catch (error) {
      global.logWorkflow(`❌ Erreur ImageEnhanceTask: ${error.message}`);

      // Gérer les erreurs spécifiques
      if (error.message.includes('API key')) {
        throw new Error('Clé API Replicate non configurée (REPLICATE_API_TOKEN)');
      }

      if (error.message.includes('rate limit')) {
        throw new Error('Limite de requêtes API atteinte. Veuillez réessayer plus tard.');
      }

      if (error.message.includes('timeout')) {
        throw new Error('Traitement de l\'image trop long (timeout)');
      }

      throw new Error(`Erreur amélioration image: ${error.message}`);
    }
  }

  /**
   * Valide les paramètres d'entrée
   * @param {Object} inputs - Paramètres à valider
   * @returns {boolean} True si valide
   */
  validateInputs(inputs) {
    if (!inputs.image) {
      throw new Error('Image requise');
    }

    if (inputs.scale !== undefined) {
      const scale = Number(inputs.scale);
      if (isNaN(scale) || scale < 0 || scale > 10) {
        throw new Error('Scale doit être entre 0 et 10');
      }
    }

    if (inputs.face_enhance !== undefined && typeof inputs.face_enhance !== 'boolean') {
      throw new Error('face_enhance doit être un booléen');
    }

    return true;
  }

  /**
   * Obtient les paramètres par défaut
   * @returns {Object} Paramètres par défaut
   */
  getDefaults() {
    return {
      scale: 4,
      face_enhance: false
    };
  }

  /**
   * Obtient le schéma de configuration
   * @returns {Object} Schéma JSON Schema
   */
  getSchema() {
    return {
      type: 'object',
      title: 'Image Enhancement (Real-ESRGAN)',
      required: ['image'],
      properties: {
        image: {
          type: 'string',
          title: 'Image',
          description: 'URL ou chemin local de l\'image à améliorer'
        },
        scale: {
          type: 'number',
          title: 'Facteur d\'upscaling',
          default: 4,
          minimum: 0,
          maximum: 10,
          description: 'Multiplicateur de résolution (2x, 4x, 8x, etc.)'
        },
        face_enhance: {
          type: 'boolean',
          title: 'Amélioration des visages',
          default: false,
          description: 'Appliquer GFPGAN pour améliorer les visages détectés'
        }
      }
    };
  }
}

export default ImageEnhanceTask;
