import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { pluginModuleFederation } from '@module-federation/rsbuild-plugin';
import moduleFederationConfig from './module-federation.config';

export default defineConfig({
  plugins: [pluginReact(), pluginModuleFederation(moduleFederationConfig)],
  server: {
    port: 3001,
  },
  // --- A ALTERAÇÃO IMPORTANTE ESTÁ AQUI EM BAIXO ---
  output: {
    // 'auto' faz com que o Rsbuild detete automaticamente o domínio onde está a correr.
    // Isto resolve problemas de caminhos errados (404) ao carregar scripts na Cloud.
    assetPrefix: 'auto',
  },
});