/**
 * Ask every source the museum cites whether it is still there.
 *
 *   npx tsx scripts/links.ts            report to the terminal, in Markdown
 *
 * Every address in src/data is asked for once. A source that answers 404 or 410 is gone, and the script ends with
 * an error so that a scheduled run can say so. A source that refuses a script (403, 429), answers with a server
 * error or does not answer in time is listed apart: it may be there for a person and closed to a machine.
 * .github/workflows/links.yml runs this once a week and opens an issue when a source is gone.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';

const ROOT = new URL('../src/data/', import.meta.url).pathname;
const files = (dir: string): string[] => readdirSync(dir).flatMap((f) => (statSync(dir + f).isDirectory() ? files(`${dir}${f}/`) : /\.(?:ts|json)$/.test(f) ? [dir + f] : []));
const where = new Map<string, string>();
for (const file of files(ROOT)) {
  for (const m of readFileSync(file, 'utf8').matchAll(/https?:\/\/[^\s'"`)\\<>]+/g)) {
    const url = m[0].replace(/[.,;]+$/, '');
    if (!where.has(url)) where.set(url, file.slice(ROOT.length));
  }
}

type Answer = { url: string; from: string; says: string };
const gone: Answer[] = [], shut: Answer[] = [];
let fine = 0;
async function ask(url: string): Promise<void> {
  const from = where.get(url)!;
  for (let go = 0; go < 2; go++) {
    try {
      const got = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(25000), headers: { 'User-Agent': 'Mozilla/5.0 (compatible; museum-of-alternative-displays link check)', Accept: 'text/html,application/pdf,*/*' } });
      await got.body?.cancel().catch(() => undefined);
      if (got.status === 404 || got.status === 410) { gone.push({ url, from, says: String(got.status) }); return; }
      if (got.ok) { fine++; return; }
      if (go === 1) shut.push({ url, from, says: String(got.status) });
    } catch (err) {
      if (go === 1) shut.push({ url, from, says: (err as Error).name === 'TimeoutError' ? 'no answer in 25 s' : String((err as Error).cause ?? (err as Error).message).slice(0, 80) });
    }
  }
}
const todo = [...where.keys()];
await Promise.all(Array.from({ length: 8 }, async () => { for (let url = todo.pop(); url; url = todo.pop()) await ask(url); }));

const list = (rows: Answer[]) => rows.sort((a, b) => a.from.localeCompare(b.from)).map((r) => `- ${r.url} (${r.says}, cited in \`src/data/${r.from}\`)`).join('\n');
console.log(`# Source links\n\n${where.size} addresses asked. ${fine} answered, ${gone.length} are gone, ${shut.length} could not be checked.\n`);
if (gone.length) console.log(`## Gone\n\n${list(gone)}\n`);
if (shut.length) console.log(`## Could not be checked\n\nThese refused the script or did not answer. They may still open in a browser.\n\n${list(shut)}\n`);
process.exit(gone.length ? 1 : 0);
