/** @type {import('next').NextConfig} */
const nextConfig = {
  assetPrefix: "https://t2-web-1063861730054.europe-west1.run.app",
  basePath: "",

  // Se usares images do Next, descomenta:
  // images: {
  //   unoptimized: true,
  // },

  // IMPORTANTE com Module Federation:
  webpack(config) {
    config.output.publicPath = "https://t2-web-1063861730054.europe-west1.run.app/_next/";
    return config;
  },
};

module.exports = nextConfig;
