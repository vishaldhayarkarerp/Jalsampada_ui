/** @type {import('next').NextConfig} */

module.exports = {
  outputFileTracingRoot: __dirname,
  output: 'standalone',
  // In Docker, we want to bind to 0.0.0.0
  hostname: process.env.HOSTNAME || 'localhost',
  port: parseInt(process.env.PORT || '4000', 10),
  assetPrefix: process.env.NODE_ENV === 'production' ? 'http://103.219.1.138:4000' : undefined,
};

