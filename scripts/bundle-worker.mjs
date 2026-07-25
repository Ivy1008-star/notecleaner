// 把 next-on-pages 生成的 _worker.js（含运行时动态 import(entrypoint)）重新打包成
// 自包含单文件 worker：枚举所有 entrypoint -> 静态 import -> 关闭 splitting 内联。
// 解决 Cloudflare 单文件 _worker.js 不支持动态 import 分包导致的 "No such module"。
import fs from 'fs';
import path from 'path';
import esbuild from 'esbuild';

const OUT = '.vercel/output';
const workerPath = path.join(OUT, '_worker.js');
const prePath = path.join(OUT, '_worker.pre.js');
const bundlePath = path.join(OUT, '_worker.bundle.js');

let src = fs.readFileSync(workerPath, 'utf8');

// 1. 抽取所有 entrypoint 字面量（route map 里的 entrypoint:"..."）
const re = /entrypoint:"([^"]+)"/g;
const entries = [...new Set([...src.matchAll(re)].map(m => m[1]))];
console.log(`[bundle-worker] found ${entries.length} entrypoints`);

// 2. 生成静态加载器：每个 entrypoint 用字面量 import（esbuild 可静态内联）
const cases = entries
  .map(e => `case ${JSON.stringify(e)}: return import(${JSON.stringify(e)});`)
  .join('\n    ');
const loaderFn = `async function __loadEntrypoint(p){switch(p){\n    ${cases}\n    default:throw new Error("No such module "+p)}}`;

// 3. 替换 import(e.entrypoint) -> __loadEntrypoint(e.entrypoint)
if (!src.includes('import(e.entrypoint)')) {
  console.error('[bundle-worker] WARN: import(e.entrypoint) not found, will try import(e?.entrypoint)');
}
src = src.replace(/import\(e\.entrypoint\)/g, '__loadEntrypoint(e.entrypoint)');

// 4. 注入加载器（模块顶层作用域）
src = src.replace('export default', loaderFn + '\nexport default');

fs.writeFileSync(prePath, src);

// 5. esbuild 整包内联
await esbuild.build({
  entryPoints: [prePath],
  bundle: true,
  format: 'esm',
  platform: 'browser',
  target: 'es2022',
  splitting: false,
  minify: false,
  sourcemap: false,
  outfile: bundlePath,
  // 仅 Node 内置标记为 external（Cloudflare 用 nodejs_compat 提供）
  external: ['async_hooks', 'node:*', 'cloudflare:*'],
  conditions: ['worker', 'browser', 'import'],
  logLevel: 'info',
});

const sz = fs.statSync(bundlePath).size;
console.log(`[bundle-worker] bundled -> ${bundlePath} (${(sz/1024).toFixed(1)} KB)`);

// 6. 用打包结果覆盖 _worker.js（wrangler 只认这个名字）
fs.copyFileSync(bundlePath, workerPath);
console.log('[bundle-worker] overwrote _worker.js with self-contained bundle');
