/* Test runner:  node tests/run.mjs [--quick] [--only=<suite>] [--no-build]
   Suites live in tests/suites/*.mjs and export `tests = [{ name, slow?, browser?, run(ctx) }]`.
   A test passes when run() resolves and the page logged no errors. */
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { ROOT, launch, close } from './harness.mjs';

const argv = process.argv.slice(2);
const quick = argv.includes('--quick');
const only = (argv.find(a => a.startsWith('--only=')) || '').slice(7);
if (!argv.includes('--no-build')) execSync('npx vite build --mode single --logLevel warn', { cwd: ROOT, stdio: 'inherit' });

const dir = path.join(ROOT, 'tests', 'suites');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.mjs')).sort().filter(f => !only || f.startsWith(only));
const results = [];
let needBrowser = false;
const suites = [];
for (const f of files) { const m = await import(path.join(dir, f)); suites.push([f.replace('.mjs', ''), m.tests]); if (m.tests.some(t => t.browser !== false)) needBrowser = true; }
if (needBrowser) await launch();

for (const [suite, tests] of suites) for (const t of tests) {
  if (quick && t.slow) { results.push({ suite, name: t.name, status: 'skip' }); continue; }
  const t0 = Date.now(); const ctx = { log: [], clients: [] };
  try {
    await Promise.race([t.run(ctx), new Promise((_, rej) => setTimeout(() => rej(new Error('timeout ' + (t.timeout || 180) + ' s')), (t.timeout || 180) * 1000))]);
    const errs = ctx.clients.flatMap(c => c.errors.map(e => `[${c.name}] ${e}`));
    if (errs.length) throw new Error('page errors:\n    ' + errs.slice(0, 6).join('\n    '));
    results.push({ suite, name: t.name, status: 'pass', ms: Date.now() - t0 });
  } catch (e) {
    for (const c of ctx.clients) await c.shot(`FAIL-${suite}-${t.name.replace(/\W+/g, '_')}`).catch(() => {});
    results.push({ suite, name: t.name, status: 'FAIL', ms: Date.now() - t0, err: e.message });
  } finally { for (const c of ctx.clients) await c.close().catch(() => {}); }
  const r = results.at(-1); console.log(`${r.status === 'pass' ? '✓' : r.status === 'skip' ? '·' : '✗'} ${suite} › ${t.name}${r.ms ? ` (${(r.ms / 1000).toFixed(1)} s)` : ''}${r.err ? '\n    ' + r.err : ''}`);
}
await close();
const fail = results.filter(r => r.status === 'FAIL').length, pass = results.filter(r => r.status === 'pass').length;
console.log(`\n${pass} passed, ${fail} failed, ${results.length - pass - fail} skipped`);
fs.writeFileSync(path.join(ROOT, 'test-results', 'summary.json'), JSON.stringify(results, null, 1));
process.exit(fail ? 1 : 0);
