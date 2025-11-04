import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { initializeStorage } from './services/dataStorage.js';
import aiRoutes from './routes/ai.js';
import promptRoutes from './routes/prompt.js';
import imagesRoutes from './routes/images.js';
import generateRoutes from './routes/generate.js';
import editRoutes from './routes/edit.js';
import videoRoutes from './routes/video.js';
import videoImageRoutes from './routes/videoImage.js';
import workflowRoutes from './routes/workflow.js';
import historyRoutes from './routes/history.js';
import uploadRoutes from './routes/upload.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Créer un fichier de log pour les erreurs
const logDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}
const logFile = path.join(logDir, 'workflow-debug.log');

// Logger personnalisé
global.logWorkflow = (message, data = null) => {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}${data ? '\n' + JSON.stringify(data, null, 2) : ''}\n`;
  console.log(message, data || '');
  fs.appendFileSync(logFile, logMessage);
};

console.log(`📝 Logs détaillés du workflow enregistrés dans: ${logFile}`);

const app = express();
const PORT = process.env.PORT || 3000;

// Initialiser le stockage des données
await initializeStorage();

// Middleware
app.use(cors());
// Augmenter la limite pour supporter les images en base64
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// API Routes
app.use('/api', aiRoutes);
app.use('/api/prompt', promptRoutes);
app.use('/api/images', imagesRoutes);
app.use('/api/generate', generateRoutes);
app.use('/api/edit', editRoutes);
app.use('/api/video', videoRoutes);
app.use('/api/video-image', videoImageRoutes);
app.use('/api/workflow', workflowRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/upload', uploadRoutes);

// Servir les fichiers médias (images, vidéos)
const mediasPath = path.join(__dirname, 'medias');
app.use('/medias', express.static(mediasPath));

// Servir les workflows JSON
const workflowsPath = path.join(__dirname, 'workflows');
app.use('/workflows', express.static(workflowsPath));

// Servir les fichiers statiques du frontend (après build)
const frontendPath = path.join(__dirname, '../frontend/dist/spa');
app.use(express.static(frontendPath));

// Fallback pour SPA routing
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(frontendPath, 'index.html'));
  }
});

// Démarrage du serveur
const server = app.listen(PORT, () => {
  console.log(`🚀 Serveur backend démarré sur http://localhost:${PORT}`);
  console.log(`📊 Environnement: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔑 Replicate API: ${process.env.REPLICATE_API_TOKEN ? '✅ Configuré' : '⚠️  Non configuré (mode mock)'}`);
});

// Augmenter le timeout du serveur pour les requêtes longues (modèles AI)
server.timeout = 600000; // 10 minutes (600 secondes)
server.keepAliveTimeout = 610000; // 10 minutes + 10 secondes
server.headersTimeout = 620000; // 10 minutes + 20 secondes

console.log(`⏱️  Timeout serveur: ${server.timeout / 1000}s`);
