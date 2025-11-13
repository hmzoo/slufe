import Replicate from 'replicate';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import path from 'path';
import { promises as fs } from 'fs';
import { DEFAULT_REPLICATE_OPTIONS } from '../config/replicate.js';
import { getMediasDir } from '../utils/fileUtils.js';

dotenv.config();

// Initialiser le client Replicate
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

/**
 * Convertit une URL d'image en base64
 * @param {string} url - L'URL de l'image
 * @returns {Promise<string>} - Image en format data URI base64
 */
async function urlToBase64(url) {
  try {
    console.log(`📥 Téléchargement de l'image: ${url}`);
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Erreur HTTP ${response.status} lors du téléchargement de l'image`);
    }
    
    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    
    // Déterminer le type MIME depuis les headers ou l'URL
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    
    return `data:${contentType};base64,${base64}`;
  } catch (error) {
    console.error(`❌ Erreur lors de la conversion URL -> base64:`, error.message);
    throw error;
  }
}

/**
 * Analyse une image avec le modèle LLaVA-13B
 * @param {string|Buffer|Object} imageInput - URL de l'image, Buffer, ou objet avec propriété image
 * @param {string} customPrompt - Prompt personnalisé (optionnel)
 * @returns {Promise<string>} - Description de l'image
 */
export async function analyzeImage(imageInput, customPrompt = null) {
  try {
    if (!imageInput) {
      throw new Error('Image manquante');
    }

    // Log du prompt dès le début pour debug
    const prompt = customPrompt || "Give a detailed description of this image.";
    console.log('🤖 Prompt qui sera envoyé au modèle LLaVA-13B:', {
      prompt: prompt,
      promptLength: prompt.length,
      isCustom: !!customPrompt
    });

    if (!process.env.REPLICATE_API_TOKEN) {
      throw new Error('REPLICATE_API_TOKEN non configuré');
    }

    console.log('🔍 Analyse d\'image avec LLaVA-13B...');
    
    // Gérer les différents formats d'entrée
    let imageData;
    
    // Si c'est un objet avec une propriété image (format de l'API)
    if (typeof imageInput === 'object' && imageInput.image) {
      imageInput = imageInput.image;
    }
    
    // Si c'est un Buffer, le convertir en data URI
    if (Buffer.isBuffer(imageInput)) {
      console.log('📦 Conversion du Buffer en data URI...');
      const base64 = imageInput.toString('base64');
      imageData = `data:image/jpeg;base64,${base64}`;
    }
    // Si c'est un chemin local relatif (/medias/...), le charger depuis le système de fichiers
    else if (typeof imageInput === 'string' && imageInput.startsWith('/medias/')) {
      console.log('📂 Chargement de l\'image locale:', imageInput);
      const filename = imageInput.replace('/medias/', '');
      const mediasDir = getMediasDir();
      const filePath = path.join(mediasDir, filename);
      
      try {
        const buffer = await fs.readFile(filePath);
        const base64 = buffer.toString('base64');
        
        // Déterminer le type MIME depuis l'extension
        const ext = path.extname(filename).toLowerCase();
        const mimeTypes = {
          '.jpg': 'image/jpeg',
          '.jpeg': 'image/jpeg',
          '.png': 'image/png',
          '.gif': 'image/gif',
          '.webp': 'image/webp'
        };
        const mimeType = mimeTypes[ext] || 'image/jpeg';
        
        imageData = `data:${mimeType};base64,${base64}`;
        console.log('✅ Image locale chargée et convertie en base64');
      } catch (error) {
        console.error('❌ Erreur lors du chargement de l\'image locale:', error.message);
        throw new Error(`Impossible de charger l'image: ${filePath}`);
      }
    }
    // Si c'est une URL distante, la convertir en base64
    else if (typeof imageInput === 'string' && (imageInput.startsWith('http://') || imageInput.startsWith('https://'))) {
      imageData = await urlToBase64(imageInput);
    }
    // Si c'est déjà une data URI, l'utiliser directement
    else if (typeof imageInput === 'string' && imageInput.startsWith('data:')) {
      imageData = imageInput;
    }
    else {
      throw new Error(`Format d'image non supporté: ${typeof imageInput === 'string' ? imageInput.substring(0, 50) : typeof imageInput}`);
    }

    // Appel au modèle LLaVA-13B via Replicate (avec version spécifique)
    console.log('⏱️  Timeout: 10 minutes maximum');
    const output = await replicate.run(
      'yorickvp/llava-13b:a0fdc44e4f2e1f20f2bb4e27846899953ac8e66c5886c5878fa1d6b73ce009e5',
      {
        input: {
          image: imageData,
          prompt: prompt,
          top_p: 1,
          max_tokens: 1024,
          temperature: 0.2,
        },
        ...DEFAULT_REPLICATE_OPTIONS
      }
    );

    // Le modèle retourne un array de strings
    let description = '';
    if (Array.isArray(output)) {
      description = output.join('');
    } else if (typeof output === 'string') {
      description = output;
    } else {
      description = String(output);
    }

    description = description.trim();
    
    console.log('✅ Analyse terminée');
    console.log('Description:', description.substring(0, 100) + '...');

    return description || 'No description available';
  } catch (error) {
    console.error('❌ Erreur lors de l\'analyse de l\'image:', error.message);
    throw error;
  }
}

/**
 * Analyse plusieurs images en parallèle
 * @param {Array<string>} imageUrls - Tableau d'URLs d'images
 * @param {string} customPrompt - Prompt personnalisé (optionnel)
 * @returns {Promise<Array<{url: string, description: string, success: boolean, error?: string}>>}
 */
export async function analyzeImages(imageUrls, customPrompt = null) {
  try {
    if (!Array.isArray(imageUrls) || imageUrls.length === 0) {
      throw new Error('Tableau d\'images vide ou invalide');
    }

    console.log(`🔍 Analyse de ${imageUrls.length} image(s)...`);

    // Analyser toutes les images en parallèle
    const results = await Promise.allSettled(
      imageUrls.map(async (url) => {
        try {
          const description = await analyzeImage(url, customPrompt);
          return {
            url,
            description,
            success: true,
          };
        } catch (error) {
          return {
            url,
            description: null,
            success: false,
            error: error.message,
          };
        }
      })
    );

    // Traiter les résultats
    return results.map((result) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          url: 'unknown',
          description: null,
          success: false,
          error: result.reason?.message || 'Unknown error',
        };
      }
    });
  } catch (error) {
    console.error('❌ Erreur lors de l\'analyse des images:', error.message);
    throw error;
  }
}

/**
 * Vérifie si le service Replicate est configuré
 * @returns {boolean}
 */
export function isReplicateConfigured() {
  return !!process.env.REPLICATE_API_TOKEN && 
         process.env.REPLICATE_API_TOKEN !== 'your_replicate_api_token_here';
}
