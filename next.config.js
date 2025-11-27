/** @type {import('next').NextConfig} */
const nextConfig = {
  // Webpack config (used when running without --turbopack)
  webpack: (config) => {
    // Add support for importing .geojson files
    config.module.rules.push({
      test: /\.geojson$/,
      type: 'json',
    });

    return config;
  },
  // Turbopack config (used when running with --turbopack)
  turbopack: {
    rules: {
      '*.geojson': {
        loaders: ['json-loader'],
        as: '*.json',
      },
    },
  },
  experimental: {
    // Don't optimize next-auth as it causes issues with SSR
    // optimizePackageImports: ['next-auth'],
  },
};

module.exports = nextConfig;
