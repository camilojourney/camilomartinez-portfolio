/** @type {import('next').NextConfig} */
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

function loadExternalEnv(envPath) {
  if (!fs.existsSync(envPath)) return;
  for (const raw of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#') || !line.includes('=')) continue;
    const [rawKey, ...rawValue] = line.split('=');
    const key = rawKey.trim().replace(/^export\s+/, '');
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key) || process.env[key] !== undefined) continue;
    process.env[key] = rawValue.join('=').trim().replace(/^(['"])(.*)\1$/, '$2');
  }
}

loadExternalEnv(process.env.FLEET_ENV_PATH || path.join(os.homedir(), '.config', 'secrets', 'fleet.env'));
loadExternalEnv(
  process.env.CAMILO_ENV_PATH
    || path.join(os.homedir(), '.config', 'secrets', 'camilomartinez-portfolio-local.env')
);

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
