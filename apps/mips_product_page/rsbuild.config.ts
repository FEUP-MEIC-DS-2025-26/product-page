import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { pluginModuleFederation } from '@module-federation/rsbuild-plugin';
import moduleFederationConfig from './module-federation.config';

// Deteta se estamos a correr em produção (build) ou desenvolvimento
const isProd = process.env.NODE_ENV === 'production';

export default defineConfig({
  plugins: [
    pluginReact(),
    pluginModuleFederation(moduleFederationConfig),
  ],

  output: {
    // Lógica condicional:
    // Em PROD (Cloud) usa o URL completo.
    // Em DEV (Local) usa 'auto' para usar o localhost:3001.
    publicPath: isProd 
      ? 'https://t2-web-1063861730054.europe-west1.run.app/' 
      : 'auto',
  },

  server: {
    port: 3001,
    // Permite CORS localmente para evitar chatices
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
  },
});