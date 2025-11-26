/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // Add support for importing .geojson files
    config.module.rules.push({
      test: /\.geojson$/,
      type: 'json',
    });

    return config;
  },
  experimental: {
    // Optimize package imports to reduce bundle size
    optimizePackageImports: ['next-auth'],
  },
};

module.exports = nextConfig;
