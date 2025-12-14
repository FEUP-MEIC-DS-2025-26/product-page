import { createModuleFederationConfig } from '@module-federation/rsbuild-plugin';

export default createModuleFederationConfig({
  name: 'mips_product_page',
  
  // MUDANÇA: Usa o nome padrão para o ficheiro de entrada JS.
  // O ficheiro mf-manifest.json será gerado automaticamente ao lado deste.
  filename: 'remoteEntry.js', 
  
  exposes: {
    './ProductPage': './src/components/ProductPage.tsx',
  },
  remotes: {
     mips_reviews: "mips_reviews@https://reviews-frontend-bk4zrk5bua-ew.a.run.app/mf-manifest.json",
     mips_bundle_suggestions: "mips_bundle_suggestions@https://bundle-microfrontend-pf6fio53fa-ew.a.run.app/mf-manifest.json",
     mips_product_report: "mips_product_report@https://product-report-front-1028448199115.europe-west1.run.app/mf-manifest.json",
     mips_product_customization: "mips_product_customization@https://product-customization-frontend-1026518556627.europe-southwest1.run.app/mf-manifest.json",
  },
  shareStrategy: "loaded-first",
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