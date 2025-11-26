import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { pluginModuleFederation } from '@module-federation/rsbuild-plugin';
import moduleFederationConfig from './module-federation.config';

// Define a URL num único sítio para não haver erros
const PUBLIC_URL = 'https://t2-web-1063861730054.europe-west1.run.app/';

// Força a deteção
const isProd = process.env.NODE_ENV === 'production';

// 👇 ISTO VAI APARECER NO TEU TERMINAL
console.log(`\n🚨 --- MODE: ${isProd ? 'PRODUCTION (CLOUD)' : 'DEV (LOCAL)'} ---`);
console.log(`🚨 --- URL: ${isProd ? PUBLIC_URL : 'auto'} ---\n`);

export default defineConfig({
  plugins: [
    pluginReact(),
    pluginModuleFederation(moduleFederationConfig),
  ],

  output: {
    // 1. Configuração padrão do Rsbuild
    publicPath: isProd ? PUBLIC_URL : 'auto',
    // 2. Prefixo de assets (força links de CSS/JS)
    assetPrefix: isProd ? PUBLIC_URL : undefined,
  },

  tools: {
    rspack: {
      output: {
        // 3. Injeção direta no motor Rspack (ignora abstrações)
        publicPath: isProd ? PUBLIC_URL : 'auto',
      },
    },
  },

  server: {
    port: 3001,
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
  },
});