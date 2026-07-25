/**
 * NoteCleaner 一键部署脚本
 * 运行 npm run build:pages 然后使用 wrangler 部署到 Cloudflare Pages
 */
import { execSync } from 'child_process'
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')

function run(cmd) {
  console.log(`\n> ${cmd}\n`)
  execSync(cmd, { cwd: root, stdio: 'inherit' })
}

async function main() {
  console.log('=== NoteCleaner Deploy ===')
  run('npm run pages:build')
  run('npx wrangler pages deploy .vercel/output --project-name=notecleaner')
  console.log('\n=== Deploy Complete ===')
}

main().catch((e) => {
  console.error('Deploy failed:', e.message)
  process.exit(1)
})
