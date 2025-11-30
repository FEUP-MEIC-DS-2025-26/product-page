import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { pluginModuleFederation } from '@module-federation/rsbuild-plugin';
import moduleFederationConfig from './module-federation.config';

export default defineConfig({
  plugins: [
    pluginReact(),
    // ALTERAÇÃO AQUI:
    pluginModuleFederation({
      ...moduleFederationConfig, // Mantém a configuração que vem do outro ficheiro
      dts: false,                // Desativa a geração de tipos para parar o erro
    }),
  ],
  server: {
    port: 3001,
  },
  output: {
    assetPrefix: 'auto',
  },
});