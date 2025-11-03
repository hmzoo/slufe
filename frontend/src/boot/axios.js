import { boot } from 'quasar/wrappers';
import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
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
