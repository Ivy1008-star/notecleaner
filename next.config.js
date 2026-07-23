/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // pdfjs-dist 的 CJS 入口会 require('canvas')（Node 原生模块），浏览器构建里不需要也解析不到。
    // 置为 false 让 webpack 用空模块替身，构建才能过。
    config.resolve.alias.canvas = false
    return config
  },
}
module.exports = nextConfig
