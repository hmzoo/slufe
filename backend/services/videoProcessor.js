import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import ffprobeStatic from 'ffprobe-static';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import { getMediaFilePath, getMediaFileUrl, generateUniqueFileName } from '../utils/fileUtils.js';
import { addImageToCurrentCollection } from './collectionManager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration FFmpeg
ffmpeg.setFfmpegPath(ffmpegStatic);
ffmpeg.setFfprobePath(ffprobeStatic.path || ffprobeStatic);

/**
 * Utilitaire pour créer le dossier temp s'il n'existe pas
 */
async function ensureTempDir() {
  const tempDir = path.join(process.cwd(), 'uploads', 'temp');
  try {
    await fs.mkdir(tempDir, { recursive: true });
    return tempDir;
  } catch (error) {
    console.error('Erreur création dossier temp:', error);
    throw error;
  }
}

/**
 * Extraire une frame d'une vidéo
 * @param {Object} params - Paramètres d'extraction
 * @param {string|Buffer} params.video - Chemin vers la vidéo ou Buffer
 * @param {string} [params.frameType='first'] - Type de frame: 'first', 'last', 'middle', 'time'
 * @param {string} [params.timeCode='00:00:01'] - Temps spécifique pour frameType='time'
 * @param {string} [params.outputFormat='jpg'] - Format de sortie: jpg, png, webp
 * @param {number} [params.quality=95] - Qualité de l'image (1-100)
 * @returns {Promise<Object>} Résultat avec le chemin de l'image extraite
 */
export async function extractVideoFrame({
  video,
  frameType = 'first',
  timeCode = '00:00:01',
  outputFormat = 'jpg',
  quality = 95
}) {
  try {
    global.logWorkflow('🎬 Extraction de frame vidéo', {
      frameType,
      timeCode,
      outputFormat,
      quality,
      hasVideo: !!video
    });

    const tempDir = await ensureTempDir();
    const outputFilename = generateUniqueFileName(outputFormat);
    const outputPath = getMediaFilePath(outputFilename);

    // Gérer le cas où video est un Buffer (upload direct)
    let videoPath = video;
    let tempVideoPath = null;
    
    if (Buffer.isBuffer(video)) {
      // Buffer → fichier temporaire
      tempVideoPath = path.join(tempDir, `temp_video_${uuidv4()}.mp4`);
      await fs.writeFile(tempVideoPath, video);
      videoPath = tempVideoPath;
    } else if (typeof video === 'object' && video.url) {
      // Objet avec url → extraire et convertir en chemin absolu si nécessaire
      const url = video.url;
      if (url.startsWith('/medias/')) {
        videoPath = path.join(__dirname, '..', url);
        global.logWorkflow('📁 Lecture vidéo locale depuis objet', { url, videoPath });
      } else {
        videoPath = url;
      }
    } else if (typeof video === 'object' && video.path) {
      // Objet avec path → utiliser le path
      videoPath = video.path;
      global.logWorkflow('📁 Utilisation path direct', { videoPath });
    } else if (typeof video === 'string' && video.startsWith('/medias/')) {
      // Chemin local /medias/... → chemin absolu
      videoPath = path.join(__dirname, '..', video);
      global.logWorkflow('📁 Lecture vidéo locale', { videoPath });
    }

    // Obtenir les métadonnées pour calculer les timestamps
    const metadata = await getVideoMetadata(videoPath);
    const duration = metadata.duration;

    let seekTime = 0;

    switch (frameType) {
      case 'first':
        seekTime = 0;
        break;
      case 'last':
        seekTime = Math.max(0, duration - 0.1);
        break;
      case 'middle':
        seekTime = duration / 2;
        break;
      case 'time':
        // Convertir timeCode en secondes si c'est un format HH:MM:SS
        if (typeof timeCode === 'string' && timeCode.includes(':')) {
          const parts = timeCode.split(':');
          seekTime = parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseFloat(parts[2]);
        } else {
          seekTime = parseFloat(timeCode);
        }
        break;
      default:
        throw new Error(`Type de frame non supporté: ${frameType}`);
    }

    // S'assurer que le temps ne dépasse pas la durée de la vidéo
    seekTime = Math.min(seekTime, duration - 0.1);

    return new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .seekInput(seekTime)
        .frames(1)
        .output(outputPath)
        .outputOptions([
          `-q:v ${Math.round((100 - quality) / 4)}`, // Conversion qualité FFmpeg (2-31, 2=meilleure)
          '-update 1'
        ])
        .on('end', async () => {
          // Nettoyer le fichier vidéo temporaire si c'était un Buffer
          if (tempVideoPath) {
            try {
              await fs.unlink(tempVideoPath);
            } catch (error) {
              console.warn('Impossible de supprimer le fichier vidéo temporaire:', error.message);
            }
          }

          global.logWorkflow('✅ Frame extraite avec succès', {
            outputPath,
            frameType,
            seekTime: `${seekTime.toFixed(2)}s`,
            videoDuration: `${duration.toFixed(2)}s`
          });

          // Ajouter la frame extraite à la collection courante
          try {
            // Extraire le mediaId depuis le filename (format: UUID.ext)
            const mediaId = outputFilename.split('.')[0];
            
            await addImageToCurrentCollection({
              url: `/medias/${outputFilename}`, // URL relative
              mediaId: mediaId, // UUID de l'image
              type: 'image', // Type image
              description: `Frame extraite (${frameType}) à ${formatTime(seekTime)}`,
              metadata: {
                extractedFrom: 'video',
                frameType: frameType,
                timestamp: seekTime.toFixed(2) + 's',
                videoDuration: duration.toFixed(2) + 's',
                format: outputFormat,
                quality: quality
              }
            });
            
            global.logWorkflow('💾 Frame ajoutée à la collection courante', {
              filename: outputFilename,
              frameType,
              timestamp: formatTime(seekTime)
            });
          } catch (collectionError) {
            console.warn('⚠️ Impossible d\'ajouter la frame à la collection:', collectionError.message);
          }

          resolve({
            success: true,
            image_path: outputPath,
            image_url: getMediaFileUrl(outputFilename),
            frame_info: {
              type: frameType,
              timestamp: seekTime,
              timeCode: formatTime(seekTime),
              video_duration: duration,
              format: outputFormat,
              quality: quality
            },
            file_info: {
              filename: outputFilename,
              path: outputPath
            }
          });
        })
        .on('error', (error) => {
          global.logWorkflow('❌ Erreur extraction frame', {
            error: error.message,
            frameType,
            seekTime
          });
          reject(error);
        })
        .run();
    });

  } catch (error) {
    global.logWorkflow('❌ Erreur dans extractVideoFrame', {
      error: error.message,
      frameType,
      timeCode
    });
    throw error;
  }
}

/**
 * Concaténer plusieurs vidéos
 * @param {Object} params - Paramètres de concaténation
 * @param {Array<string|Buffer>} params.videos - Liste des vidéos à concaténer
 * @param {string} [params.outputFormat='mp4'] - Format de sortie
 * @param {string} [params.resolution=null] - Résolution forcée (ex: '1920x1080')
 * @param {number} [params.fps=null] - FPS forcé
 * @param {string} [params.quality='medium'] - Qualité: 'low', 'medium', 'high'
 * @returns {Promise<Object>} Résultat avec le chemin de la vidéo concaténée
 */
export async function concatenateVideos({
  videos,
  outputFormat = 'mp4',
  resolution = null,
  fps = null,
  quality = 'medium'
}) {
  try {
    global.logWorkflow('🎬 Concaténation de vidéos', {
      videoCount: videos?.length || 0,
      outputFormat,
      resolution,
      fps,
      quality
    });

    if (!videos || videos.length < 2) {
      throw new Error('Au moins 2 vidéos sont requises pour la concaténation');
    }

    const tempDir = await ensureTempDir();
    const outputFilename = generateUniqueFileName(outputFormat);
    const outputPath = getMediaFilePath(outputFilename);

    // Traiter les vidéos (Buffer → fichiers temporaires)
    const tempVideoPaths = [];
    const videoInfos = [];

    for (let i = 0; i < videos.length; i++) {
      const video = videos[i];
      let videoPath;

      if (Buffer.isBuffer(video)) {
        videoPath = path.join(tempDir, `temp_video_${i}_${uuidv4()}.mp4`);
        await fs.writeFile(videoPath, video);
        tempVideoPaths.push(videoPath);
      } else {
        videoPath = video;
      }

      // Obtenir les infos de chaque vidéo
      const metadata = await getVideoMetadata(videoPath);
      videoInfos.push({
        path: videoPath,
        duration: metadata.duration,
        width: metadata.video?.width,
        height: metadata.video?.height,
        fps: metadata.video?.fps,
        hasAudio: !!metadata.audio  // Vérifier si la vidéo a de l'audio
      });
    }

    global.logWorkflow('📊 Infos vidéos à concaténer', {
      videos: videoInfos.map((info, i) => ({
        index: i,
        duration: `${info.duration.toFixed(2)}s`,
        resolution: `${info.width}x${info.height}`,
        fps: info.fps,
        hasAudio: info.hasAudio
      }))
    });

    // Déterminer la résolution cible
    let targetWidth = resolution ? parseInt(resolution.split('x')[0]) : Math.max(...videoInfos.map(v => v.width || 0));
    let targetHeight = resolution ? parseInt(resolution.split('x')[1]) : Math.max(...videoInfos.map(v => v.height || 0));

    // Si pas de résolution spécifiée, utiliser la plus commune
    if (!resolution) {
      const resolutions = videoInfos.map(v => `${v.width}x${v.height}`);
      const mostCommon = resolutions.sort((a, b) =>
        resolutions.filter(v => v === a).length - resolutions.filter(v => v === b).length
      ).pop();
      [targetWidth, targetHeight] = mostCommon.split('x').map(Number);
    }

    // Paramètres de qualité
    const qualitySettings = {
      low: { crf: 28, preset: 'veryfast' },
      medium: { crf: 23, preset: 'medium' },
      high: { crf: 18, preset: 'slow' }
    };
    const { crf, preset } = qualitySettings[quality] || qualitySettings.medium;

    return new Promise((resolve, reject) => {
      let command = ffmpeg();

      // Ajouter toutes les vidéos en input
      videoInfos.forEach(info => {
        command = command.input(info.path);
      });

      // Vérifier si au moins une vidéo a de l'audio
      const hasAnyAudio = videoInfos.some(info => info.hasAudio);

      // Créer le filtre complexe pour normaliser et concaténer
      const videoFilters = videoInfos.map((_, i) => 
        `[${i}:v]scale=${targetWidth}:${targetHeight}:force_original_aspect_ratio=decrease,pad=${targetWidth}:${targetHeight}:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=${fps || 30}[v${i}]`
      );
      
      let filterComplex;
      let outputOptions;

      if (hasAnyAudio) {
        // Si au moins une vidéo a de l'audio, traiter l'audio
        const audioFilters = videoInfos.map((info, i) => {
          if (info.hasAudio) {
            return `[${i}:a]aformat=sample_rates=48000:channel_layouts=stereo[a${i}]`;
          } else {
            // Créer une piste audio silencieuse pour les vidéos sans audio
            return `anullsrc=channel_layout=stereo:sample_rate=48000[a${i}]`;
          }
        });

        const concatFilter = `${videoInfos.map((_, i) => `[v${i}][a${i}]`).join('')}concat=n=${videoInfos.length}:v=1:a=1[outv][outa]`;

        filterComplex = [
          ...videoFilters,
          ...audioFilters,
          concatFilter
        ];

        outputOptions = [
          '-map [outv]',
          '-map [outa]',
          '-c:v libx264',
          '-c:a aac',
          `-crf ${crf}`,
          `-preset ${preset}`,
          '-movflags +faststart'
        ];
      } else {
        // Aucune vidéo n'a d'audio - concaténation vidéo uniquement
        const concatFilter = `${videoInfos.map((_, i) => `[v${i}]`).join('')}concat=n=${videoInfos.length}:v=1:a=0[outv]`;

        filterComplex = [
          ...videoFilters,
          concatFilter
        ];

        outputOptions = [
          '-map [outv]',
          '-c:v libx264',
          `-crf ${crf}`,
          `-preset ${preset}`,
          '-movflags +faststart'
        ];
      }

      command
        .complexFilter(filterComplex)
        .outputOptions(outputOptions)
        .output(outputPath)
        .on('progress', (progress) => {
          const percent = Math.round(progress.percent || 0);
          if (percent % 10 === 0) { // Log tous les 10%
            global.logWorkflow(`🎬 Concaténation: ${percent}%`);
          }
        })
        .on('end', async () => {
          // Nettoyer les fichiers temporaires
          for (const tempPath of tempVideoPaths) {
            try {
              await fs.unlink(tempPath);
            } catch (error) {
              console.warn('Impossible de supprimer le fichier temporaire:', error.message);
            }
          }

          // Obtenir les infos du fichier final
          const finalMetadata = await getVideoMetadata(outputPath);
          const totalDuration = videoInfos.reduce((sum, info) => sum + info.duration, 0);

          global.logWorkflow('✅ Concaténation terminée', {
            inputCount: videos.length,
            totalInputDuration: `${totalDuration.toFixed(2)}s`,
            outputDuration: `${finalMetadata.duration.toFixed(2)}s`,
            outputResolution: `${targetWidth}x${targetHeight}`,
            outputFile: outputFilename
          });

          resolve({
            success: true,
            video_path: outputPath,
            video_url: getMediaFileUrl(outputFilename),
            concat_info: {
              input_count: videos.length,
              total_duration: finalMetadata.duration,
              resolution: `${targetWidth}x${targetHeight}`,
              fps: fps || 30,
              format: outputFormat,
              quality: quality
            },
            input_videos: videoInfos.map((info, i) => ({
              index: i,
              duration: info.duration,
              resolution: `${info.width}x${info.height}`
            })),
            file_info: {
              filename: outputFilename,
              path: outputPath,
              size_mb: Math.round((await fs.stat(outputPath)).size / (1024 * 1024) * 100) / 100
            }
          });
        })
        .on('error', async (error) => {
          // Nettoyer en cas d'erreur
          for (const tempPath of tempVideoPaths) {
            try {
              await fs.unlink(tempPath);
            } catch (e) {
              // Ignorer les erreurs de nettoyage
            }
          }

          global.logWorkflow('❌ Erreur concaténation', {
            error: error.message,
            videoCount: videos.length
          });
          reject(error);
        })
        .run();
    });

  } catch (error) {
    global.logWorkflow('❌ Erreur dans concatenateVideos', {
      error: error.message,
      videoCount: videos?.length || 0
    });
    throw error;
  }
}

/**
 * Obtenir les métadonnées d'une vidéo
 * @param {string} videoPath - Chemin vers la vidéo
 * @returns {Promise<Object>} Métadonnées de la vidéo
 */
export async function getVideoMetadata(videoPath) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) return reject(err);

      const videoStream = metadata.streams.find(stream => stream.codec_type === 'video');
      const audioStream = metadata.streams.find(stream => stream.codec_type === 'audio');

      resolve({
        success: true,
        duration: metadata.format.duration,
        size: metadata.format.size,
        bitRate: metadata.format.bit_rate,
        format: metadata.format.format_name,
        video: videoStream ? {
          codec: videoStream.codec_name,
          width: videoStream.width,
          height: videoStream.height,
          fps: videoStream.r_frame_rate ? eval(videoStream.r_frame_rate) : null,
          pixelFormat: videoStream.pix_fmt,
          bitRate: videoStream.bit_rate
        } : null,
        audio: audioStream ? {
          codec: audioStream.codec_name,
          sampleRate: audioStream.sample_rate,
          channels: audioStream.channels,
          bitRate: audioStream.bit_rate
        } : null
      });
    });
  });
}

/**
 * Formater un temps en secondes vers HH:MM:SS
 * @param {number} seconds - Temps en secondes
 * @returns {string} Temps formaté
 */
function formatTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
}

/**
 * Valider les paramètres d'extraction de frame
 * @param {Object} params - Paramètres à valider
 * @returns {Object} { isValid, errors }
 */
export function validateExtractFrameParams(params) {
  const errors = [];

  if (!params.video) {
    errors.push('Vidéo requise');
  }

  const validFrameTypes = ['first', 'last', 'middle', 'time'];
  if (params.frameType && !validFrameTypes.includes(params.frameType)) {
    errors.push(`Type de frame invalide. Valeurs acceptées: ${validFrameTypes.join(', ')}`);
  }

  const validFormats = ['jpg', 'png', 'webp'];
  if (params.outputFormat && !validFormats.includes(params.outputFormat)) {
    errors.push(`Format de sortie invalide. Valeurs acceptées: ${validFormats.join(', ')}`);
  }

  if (params.quality && (typeof params.quality !== 'number' || params.quality < 1 || params.quality > 100)) {
    errors.push('La qualité doit être un nombre entre 1 et 100');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Valider les paramètres de concaténation
 * @param {Object} params - Paramètres à valider
 * @returns {Object} { isValid, errors }
 */
export function validateConcatenateParams(params) {
  const errors = [];

  if (!params.videos || !Array.isArray(params.videos) || params.videos.length < 2) {
    errors.push('Au moins 2 vidéos sont requises');
  }

  const validFormats = ['mp4', 'mov', 'avi', 'mkv'];
  if (params.outputFormat && !validFormats.includes(params.outputFormat)) {
    errors.push(`Format de sortie invalide. Valeurs acceptées: ${validFormats.join(', ')}`);
  }

  const validQualities = ['low', 'medium', 'high'];
  if (params.quality && !validQualities.includes(params.quality)) {
    errors.push(`Qualité invalide. Valeurs acceptées: ${validQualities.join(', ')}`);
  }

  if (params.fps && (typeof params.fps !== 'number' || params.fps < 1 || params.fps > 120)) {
    errors.push('Le FPS doit être un nombre entre 1 et 120');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

export default {
  extractVideoFrame,
  concatenateVideos,
  getVideoMetadata,
  validateExtractFrameParams,
  validateConcatenateParams
};