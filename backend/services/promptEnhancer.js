import Replicate from 'replicate';
import { DEFAULT_REPLICATE_OPTIONS } from '../config/replicate.js';
import dotenv from 'dotenv';

dotenv.config();

// Initialiser Replicate
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

/**
 * Améliore un prompt utilisateur en utilisant le modèle Gemini 2.5 Flash
 * @param {string} inputText - Le texte du prompt à améliorer
 * @param {Object} [options] - Options d'amélioration
 * @param {boolean} [options.hasImages=false] - Si true, adapte pour édition d'image
 * @param {number} [options.imageCount=0] - Nombre d'images pour contexte
 * @returns {Promise<string>} - Le prompt amélioré
 */
export async function enhancePrompt(inputText, options = {}) {
  try {
    const { hasImages = false, imageCount = 0, targetType = 'image' } = options;
    
    if (!inputText || inputText.trim() === '') {
      throw new Error('Le prompt ne peut pas être vide');
    }

    if (!process.env.REPLICATE_API_TOKEN) {
      throw new Error('REPLICATE_API_TOKEN non configuré dans les variables d\'environnement');
    }

    console.log('📝 Amélioration du prompt avec Gemini 2.5 Flash...');
    console.log('Original:', inputText);
    console.log('Type cible:', targetType);
    console.log('Has images:', hasImages);
    console.log('Image count:', imageCount);

    // Adapter l'instruction système selon le contexte - TOUJOURS EN ANGLAIS pour Qwen
    let systemInstruction;
    let userPrompt = inputText; // Utiliser directement le prompt utilisateur
    
    // Sélection selon le type cible (priorité au targetType)
    if (targetType === 'video') {
      // Génération de vidéo
      systemInstruction = `You are an expert in AI video generation prompts for the Wan-2 video model.

Your task: Enhance the user's prompt to describe dynamic scenes, movements, and temporal elements for high-quality video generation.

Key guidelines:
- Use clear, descriptive English
- Describe movements and actions explicitly (camera panning, object moving, character walking, etc.)
- Include temporal flow (beginning to end, smooth transition, dynamic motion)
- Mention lighting changes if relevant (sunrise to sunset, flickering lights)
- Specify camera movements (zoom in, pan left, tilt up, steady shot)
- Add quality keywords (smooth motion, cinematic, fluid animation, high frame rate)
- Describe the scene evolution over time
- Be concise but descriptive (aim for 20-40 words)

Return ONLY the enhanced prompt in English, nothing else.`;
      
    } else if (targetType === 'edit' && hasImages && imageCount > 0) {
      // Édition d'image (uniquement si images réellement présentes)
      if (imageCount === 1) {
        systemInstruction = `You are an expert in AI image editing prompts for the Qwen-Image-Edit-Plus model.

Your task: Enhance the user's prompt to be precise and clear for image editing. Focus on transformations, modifications, and desired results.

Key guidelines:
- Use clear, descriptive English
- Mention specific visual elements
- Include lighting and atmosphere details
- Specify composition and framing
- Add quality keywords like "highly detailed", "professional", "cinematic"

Context: The user has uploaded 1 image and wants to edit it.

Return ONLY the enhanced prompt in English, nothing else.`;
      } else {
        systemInstruction = `You are an expert in AI multi-image editing prompts for the Qwen-Image-Edit-Plus model.

Your task: Enhance the user's prompt for combining, merging, or transferring elements between images. Use clear image references (image 1, image 2).

Key guidelines:
- Use clear, descriptive English
- Reference images explicitly (image 1, image 2)
- Describe the desired combination/transfer
- Include style and atmosphere details
- Add quality keywords

Context: The user has uploaded ${imageCount} images.

Return ONLY the enhanced prompt in English, nothing else.`;
      }
    } else {
      // Génération d'image (par défaut)
      systemInstruction = `You are an expert in AI image generation prompts for the Qwen-Image model.

Your task: Enhance the user's prompt to be precise, detailed, and optimized for high-quality results.

Key guidelines:
- Use clear, descriptive English
- Include specific visual elements
- Mention lighting (golden hour, studio lighting, natural light, etc.)
- Specify composition (close-up, wide shot, aerial view, etc.)
- Add style keywords (cinematic, photorealistic, artistic, etc.)
- Include quality modifiers (highly detailed, professional, 4k, sharp focus)
- Describe atmosphere and mood
- Be concise but descriptive (aim for 15-30 words)

Return ONLY the enhanced prompt in English, nothing else.`;
    }

    // Appel au modèle Gemini 2.5 Flash via Replicate
    console.log('⏱️  Timeout: 10 minutes maximum');
    console.log('📝 System instruction length:', systemInstruction.length);
    console.log('📝 User prompt:', userPrompt);
    
    const output = await replicate.run(
      'google/gemini-2.5-flash',
      {
        input: {
          system_instruction: systemInstruction,
          prompt: userPrompt,
          max_output_tokens: 1024,
          temperature: 1,
          top_p: 0.95,
          dynamic_thinking: false,
        },
        ...DEFAULT_REPLICATE_OPTIONS
      }
    );

    console.log('🔍 Output type:', typeof output);
    console.log('🔍 Output:', JSON.stringify(output, null, 2));

    // Le modèle retourne un array de strings ou des fragments
    let enhanced = '';
    if (Array.isArray(output)) {
      enhanced = output.join('');
    } else if (typeof output === 'string') {
      enhanced = output;
    } else if (output && typeof output === 'object') {
      // Peut-être un objet avec une propriété text ou output
      enhanced = output.text || output.output || JSON.stringify(output);
    } else {
      enhanced = String(output);
    }

    // Nettoyer le résultat
    enhanced = enhanced.trim();

    console.log('✅ Prompt amélioré:', enhanced);

    return enhanced;
  } catch (error) {
    console.error('❌ Erreur lors de l\'amélioration du prompt:', error.message);
    throw error;
  }
}

/**
 * Vérifie si le service Replicate est configuré
 * @returns {boolean} - True si le token est configuré
 */
export function isReplicateConfigured() {
  return !!process.env.REPLICATE_API_TOKEN && process.env.REPLICATE_API_TOKEN !== 'your_replicate_api_token_here';
}
