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
};

module.exports = nextConfig;
