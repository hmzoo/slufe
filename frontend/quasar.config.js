/* eslint-env node */

const { configure } = require('quasar/wrappers');

module.exports = configure(function (ctx) {
  return {
    boot: ['axios'],
    
    css: ['app.scss'],
    
    extras: [
      'roboto-font',
      'material-icons',
    ],
    
    build: {
      target: {
        browser: ['es2019', 'edge88', 'firefox78', 'chrome87', 'safari13.1'],
        node: 'node16',
      },
      
      vueRouterMode: 'hash',
      
      vitePlugins: [
        ['@intlify/vite-plugin-vue-i18n', {
          include: [
            './src/i18n/**'
          ]
        }]
      ]
    },
    
    devServer: {
      open: true,
      proxy: {
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true,
        },
      },
    },
    
    framework: {
      config: {},
      
      plugins: ['Notify', 'Dialog', 'Loading'],
    },
    
    animations: [],
    
    ssr: {
      pwa: false,
      prodPort: 3000,
      middlewares: [
        'render',
      ],
    },
    
    pwa: {
      workboxMode: 'generateSW',
      injectPwaMetaTags: true,
      swFilename: 'sw.js',
      manifestFilename: 'manifest.json',
      useCredentialsForManifestTag: false,
    },
    
    cordova: {},
    
    capacitor: {
      hideSplashscreen: true,
    },
    
    electron: {
      inspectPort: 5858,
      
      bundler: 'packager',
      
      packager: {},
      
      builder: {
        appId: 'slufe-frontend',
      },
    },
    
    bex: {
      contentScripts: ['my-content-script'],
    },
  };
});
