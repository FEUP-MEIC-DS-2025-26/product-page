import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { pluginModuleFederation } from '@module-federation/rsbuild-plugin';
import moduleFederationConfig from './module-federation.config';

export default defineConfig({
  plugins: [pluginReact(), pluginModuleFederation(moduleFederationConfig)],

  /** 👇 ADICIONA ESTA SECÇÃO output 👇 */
  output: {
    publicPath: 'https://t2-web-1063861730054.europe-west1.run.app/', 
    // tem barra no fim — importante!
  },

  server: {
    port: 3001,
  },
});
