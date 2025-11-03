import { createApp } from 'vue';
import { Quasar, Notify, Dialog, Loading } from 'quasar';
import iconSet from 'quasar/icon-set/material-icons';
import '@quasar/extras/material-icons/material-icons.css';
import 'quasar/src/css/index.sass';
import App from './App.vue';
import router from './router';
import { createPinia } from 'pinia';

const app = createApp(App);
const pinia = createPinia();

app.use(Quasar, {
  plugins: {
    Notify,
    Dialog,
    Loading,
  },
  iconSet: iconSet,
  config: {
    notify: {},
  },
});

app.use(pinia);
app.use(router);

app.mount('#q-app');
