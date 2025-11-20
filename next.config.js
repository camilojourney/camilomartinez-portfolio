/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // Add support for importing .geojson files
    config.module.rules.push({
      test: /\.geojson$/,
      type: 'json',
    });

    // Fix next-auth localStorage error during SSR
    if (isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        // Provide a dummy implementation for localStorage on the server
        'next-auth/react': false,
      };
    }

    return config;
  },
  experimental: {
    // Optimize package imports to reduce bundle size
    optimizePackageImports: ['next-auth'],
  },
};

module.exports = nextConfig;
