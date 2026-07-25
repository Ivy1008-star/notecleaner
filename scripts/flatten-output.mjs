/**
 * NoteCleaner Cloudflare Workers + Assets 输出扁平化补丁
 * 
 * 把 _worker.js/index.js 复制到项目根目录作为 worker.js（单文件），
 * 同时复制 static/ 到项目根目录。
 * Workers 集成会自动检测根目录的 worker.js 作为入口。
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

  // 2. 删除 Vercel 格式标记文件
  for (const file of ['config.json', 'builds.json']) {
    const fp = path.join(outputDir, file)
    if (fs.existsSync(fp)) {
      fs.rmSync(fp)
      log(`removed ${file}`)
    }
  }

  // 3. 复制 _worker.js/index.js 到项目根目录作为 worker.js
  const workerEntry = path.join(dstWorker, 'index.js')
  const workerAtRoot = path.join(root, 'worker.js')
  if (fs.existsSync(workerEntry)) {
    fs.cpSync(workerEntry, workerAtRoot)
    log('copied _worker.js/index.js -> worker.js at project root')
  }

  // 4. 复制静态文件到项目根目录
  const staticAtRoot = path.join(root, 'static')
  if (fs.existsSync(staticDir)) {
    if (fs.existsSync(staticAtRoot)) {
      fs.rmSync(staticAtRoot, { recursive: true, force: true })
    }
    fs.cpSync(staticDir, staticAtRoot, { recursive: true })
    log('copied static/ to project root')
  }

  log('flatten complete')
}

main()