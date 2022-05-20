import { defineNuxtPlugin } from '#app';
import ElementPlus, { ElLoadingService } from 'element-plus';
import 'element-plus/theme-chalk/index.css';

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(ElementPlus);
  nuxtApp.provide('loading', ElLoadingService);
});

declare module '#app' {
  interface NuxtApp {
    $loading: typeof ElLoadingService;
  }
}

declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $loading: typeof ElLoadingService;
  }
}
