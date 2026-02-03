/** @type {import('next').NextConfig} */

module.exports = {
  outputFileTracingRoot: __dirname,
  output: 'standalone',
  assetPrefix: process.env.NODE_ENV === 'production' ? 'http://103.219.3.169:2225' : undefined,
};
