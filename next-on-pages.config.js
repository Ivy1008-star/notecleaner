/**
 * @type {import('@cloudflare/next-on-pages').NextOnPagesConfig}
 */
module.exports = {
  experimental: {
    edgeRuntime: true,
  },
  build: {
    copyFiles: [
      { from: 'public', to: '' },
    ],
  },
}
