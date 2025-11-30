import { createModuleFederationConfig } from '@module-federation/rsbuild-plugin';

export default createModuleFederationConfig({
  name: 'mips_product_page',
  
  // MUDANÇA: Usa o nome padrão para o ficheiro de entrada JS.
  // O ficheiro mf-manifest.json será gerado automaticamente ao lado deste.
  filename: 'remoteEntry.js', 
  
  exposes: {
    './ProductPage': './src/components/ProductPage.tsx',
  },
  shared: {
    react: {
      singleton: true,
      requiredVersion: '^18.3.1',
    },
    'react-dom': {
      singleton: true,
      requiredVersion: '^18.3.1',
    },
    'react-router-dom': {
      singleton: true,
      requiredVersion: '^7.9.5',
    },
    '@mui/material': { singleton: true },
    '@emotion/react': { singleton: true },
  },
});