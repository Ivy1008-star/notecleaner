// Flatten next-on-pages Vercel-format output into the flat layout that
// Cloudflare Pages (Git integration) detects as Functions-enabled.
//
// Why: @cloudflare/next-on-pages 1.x emits a Vercel Build Output v3 layout:
//   .vercel/output/
//     config.json
//     static/
//       index.html
//       _next/
//       _worker.js/__next-on-pages-dist__/functions/...
// Cloudflare's Git build does NOT auto-convert this nested layout, so the
// worker is never picked up -> uses_functions: false -> every route 404s.
//
// This script moves everything from .vercel/output/static/* up to
// .vercel/output/ (root), so the worker + function files sit at the output
// root (exactly like the deployments that got uses_functions: true), and
// removes the Vercel-format markers (config.json / builds.json) so Cloudflare
// treats it as a plain static + _worker.js Pages project.

import { existsSync, readdirSync, renameSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const outDir = join(process.cwd(), '.vercel', 'output');
const staticDir = join(outDir, 'static');

if (!existsSync(staticDir)) {
  console.log('[flatten] no .vercel/output/static found, nothing to do');
  process.exit(0);
}

for (const name of readdirSync(staticDir)) {
  const src = join(staticDir, name);
  const dest = join(outDir, name);
  if (existsSync(dest)) rmSync(dest, { recursive: true, force: true });
  renameSync(src, dest);
  console.log('[flatten] moved', name);
}

rmSync(staticDir, { recursive: true, force: true });

// Drop Vercel-format markers so Cloudflare doesn't try (and fail) to convert.
for (const marker of ['config.json', 'builds.json']) {
  const p = join(outDir, marker);
  if (existsSync(p)) {
    rmSync(p, { force: true });
    console.log('[flatten] removed', marker);
  }
}

console.log('[flatten] done -> worker + functions now at .vercel/output root');
