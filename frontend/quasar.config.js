/* eslint-env node */

const { configure } = require('quasar/wrappers');

module.exports = configure(function (ctx) {
  return {
    // Boot files (app initialization code)
    boot: ['axios', 'pinia'],
    
    // CSS files
    css: ['app.scss'],
    
    // Quasar plugins
    extras: [
      'roboto-font',
      'material-icons',
    ],
    
    build: {
      target: {
        browser: ['es2019', 'edge88', 'firefox78', 'chrome87', 'safari13.1'],
        node: 'node16',
      },
      
      vueRouterMode: 'hash', // 'hash' pour compatibilité SPA sur Vercel
      
      // Configuration Vite
      vitePlugins: [],
      
      // Variables d'environnement pour le build
      env: ctx.dev 
        ? { 
            API_URL: 'http://localhost:3000/api'
          }
        : {
            // TODO: Remplacer par l'URL de votre futur VPS/backend
            API_URL: 'https://your-backend-server.com/api'
          }
    },
    
    devServer: {
      open: true,
      port: 9000,
      proxy: {
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true,
          pathRewrite: {
            '^/api': '/api'
          }
        },
        '/medias': {
          target: 'http://localhost:3000',
          changeOrigin: true,
          pathRewrite: {
            '^/medias': '/medias'
          }
        },
        '/workflows': {
          target: 'http://localhost:3000',
          changeOrigin: true,
          pathRewrite: {
            '^/workflows': '/workflows'
          }
        },
      },
    },
    
    framework: {
      config: {
        // Configuration globale Quasar
        notify: {
          position: 'top-right'
        },
        loading: {
          delay: 400
        }
      },
      
      // Plugins Quasar à utiliser
      plugins: [
        'Notify',
        'Dialog', 
        'Loading',
        'LocalStorage',
        'SessionStorage'
      ],
    },
    
    // Animations Quasar
    animations: [
      'fadeIn',
      'fadeOut',
      'slideInUp',
      'slideOutDown'
    ],
    
    // Configuration SSR (pas utilisée mais gardée pour référence)
    ssr: {
      pwa: false,
      prodPort: 3000,
      middlewares: [
        'render',
      ],
    },
    
    // Configuration PWA (pas utilisée mais gardée pour référence)  
    pwa: {
      workboxMode: 'generateSW',
      injectPwaMetaTags: true,
      swFilename: 'sw.js',
      manifestFilename: 'manifest.json',
      useCredentialsForManifestTag: false,
    },
    
    // Autres plateformes (non utilisées)
    cordova: {},
    capacitor: {},
    electron: {},
    bex: {},
  };
});