import { boot } from 'quasar/wrappers';
import axios from 'axios';

// Déterminer l'URL de base selon l'environnement
const getBaseURL = () => {
  // En développement (localhost:9000), utiliser le proxy
  if (window.location.hostname === 'localhost' && window.location.port === '9000') {
    return '/api';
  }
  // En production, utiliser la même origine que le frontend
  return window.location.origin + '/api';
};

const api = axios.create({
  baseURL: getBaseURL(),
  timeout: 600000, // 10 minutes (600 secondes) pour les requêtes AI
  headers: {
    'Content-Type': 'application/json',
  },
});

export default boot(({ app }) => {
  app.config.globalProperties.$axios = axios;
  app.config.globalProperties.$api = api;
});

export { api };
