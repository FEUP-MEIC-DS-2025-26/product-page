import { createModuleFederationConfig } from '@module-federation/rsbuild-plugin';

export default createModuleFederationConfig({
  name: 'mips_product_page', // 1. O nome único do teu microfrontend
  filename: 'mf-manifest.json', // 2. O manifesto que o Host vai ler
  exposes: {
    // 3. A "porta de entrada".
    // Quem consumir este MF vai importar 'mips_product_page/ProductPage'
    './ProductPage': './src/App.tsx', 
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
    // Opcional: partilhar MUI se o Host também usar, para reduzir tamanho
    '@mui/material': { singleton: true },
    '@emotion/react': { singleton: true },
    '@emotion/styled': { singleton: true },
  },
});