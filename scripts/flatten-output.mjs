/**
 * NoteCleaner Cloudflare Workers + Assets 输出扁平化补丁
 * 
 * 把 .vercel/output/static/_worker.js 和 __next-on-pages-dist__/functions/
 * 提到 .vercel/output 根目录，并清理 Vercel 格式标记文件。
 * 同时复制到项目根目录，适配 Workers + Assets 统一平台。
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const outputDir = path.join(root, '.vercel', 'output')
const staticDir = path.join(outputDir, 'static')

const log = (msg) => console.log(`[flatten] ${msg}`)

function copyDir(src, dst) {
  if (!fs.existsSync(src)) return false
  if (fs.existsSync(dst)) {
    fs.rmSync(dst, { recursive: true, force: true })
  }
  fs.cpSync(src, dst, { recursive: true })
  return true
}

function main() {
  // 1. 把 static/_worker.js 移到 output 根目录
  const srcWorker = path.join(staticDir, '_worker.js')
  const dstWorker = path.join(outputDir, '_worker.js')
  if (fs.existsSync(srcWorker)) {
    fs.renameSync(srcWorker, dstWorker)
    log('moved _worker.js to output root')
  } else {
    log('_worker.js not found in static/, skipping')
  }

  // 2. 把 static/__next-on-pages-dist__/functions/ 移到 output 根目录
  const srcDist = path.join(staticDir, '__next-on-pages-dist__')
  const dstDist = path.join(outputDir, '__next-on-pages-dist__')
  if (fs.existsSync(srcDist)) {
    if (fs.existsSync(dstDist)) {
      fs.rmSync(dstDist, { recursive: true, force: true })
    }
    fs.renameSync(srcDist, dstDist)
    log('moved __next-on-pages-dist__ to output root')
  } else {
    log('__next-on-pages-dist__ not found in static/, skipping')
  }

  // 3. 删除 Vercel 格式标记文件
  const configFile = path.join(outputDir, 'config.json')
  if (fs.existsSync(configFile)) {
    fs.rmSync(configFile)
    log('removed config.json')
  }

  const buildsFile = path.join(outputDir, 'builds.json')
  if (fs.existsSync(buildsFile)) {
    fs.rmSync(buildsFile)
    log('removed builds.json')
  }

  // 4. 复制 _worker.js 到项目根目录（适配 Workers + Assets 统一平台）
  const workerAtRoot = path.join(root, '_worker.js')
  if (fs.existsSync(dstWorker)) {
    copyDir(dstWorker, workerAtRoot)
    log('copied _worker.js to project root')
  }

  // 5. 复制静态文件到项目根目录
  const staticAtRoot = path.join(root, 'static')
  if (fs.existsSync(staticDir)) {
    copyDir(staticDir, staticAtRoot)
    log('copied static/ to project root')
  }

  log('flatten complete')
}

main()