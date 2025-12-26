/** @type {import('next').NextConfig} */

module.exports = {
  outputFileTracingRoot: __dirname,
  output: 'standalone',
  hostname: '103.219.1.138',
  port: 4000,
  assetPrefix: process.env.NODE_ENV === 'production' ? 'http://103.219.1.138:4000' : undefined,
};
