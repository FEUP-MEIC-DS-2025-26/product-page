// apps/mips_product_page/module-federation.config.ts
import { createModuleFederationConfig } from "@module-federation/rsbuild-plugin";

const baseUrl = "https://t2-web-1063861730054.europe-west1.run.app/";
// If you test locally (serve on localhost:3001) you can switch to:
// const baseUrl = process.env.MF_PUBLIC_PATH || "http://localhost:3001/";

export default createModuleFederationConfig({
  name: "mips_product_page",

  // <-- IMPORTANT: publicPath MUST be absolute so the generated mf-manifest.json
  // contains absolute URLs for remoteEntry and all assets.
  publicPath: baseUrl,

  // Exposes remain the same
  exposes: {
    "./ProductPage": "./src/components/ProductPage.tsx",
  },

  shared: {
    react: {
      singleton: true,
      requiredVersion: "^18.0.0",
    },
    "react-dom": {
      singleton: true,
      requiredVersion: "^18.0.0",
    },
    "@emotion/react": {
      singleton: true,
      requiredVersion: "^11.0.0",
    },
  },
  dts: false,
});
