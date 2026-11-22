import { execSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { tsImport } from 'tsx/esm/api';
import { defineConfig, type Plugin } from 'vite';
import { halls } from './src/data/halls';
import recorded from './src/data/tour-audio.json';
import { staticPages } from './scripts/static-pages';
import { inHall } from './src/data/pieces';
import type { Locale } from './src/i18n/types';

/**
 * The stylesheet is small, and every page needs all of it before it can paint anything.
 * Put it in the HTML so that a first visit costs one request less. Font files stay as files.
 */
function inlineCss(): Plugin {
  return {
    name: 'inline-css',
    apply: 'build',
    enforce: 'post',
    generateBundle(_, bundle) {
      const html = bundle['index.html'];
      if (!html || html.type !== 'asset') return;
      let page = String(html.source);
      for (const [name, file] of Object.entries(bundle)) {
        if (file.type !== 'asset' || !name.endsWith('.css')) continue;
        const link = new RegExp(`<link rel="stylesheet"[^>]*${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[^>]*>`);
        if (!link.test(page)) continue;
        // inside the stylesheet, fonts are addressed from the assets folder. From the page they are one level down
        const css = String(file.source).replace(/url\(\.\//g, 'url(./assets/').trim();
        page = page.replace(link, () => `<style>${css}</style>`);
        // The file stays in the build although no page links to it. A part of the site that loads later from a part
        // that itself loaded later (the hall of the walk, from the walk's page) is told to fetch the stylesheet of
        // the opening script first, and gives up if that fetch fails.
      }
      html.source = page;
    },
  };
}

/**
 * The page's opening script asks early for the first picture of a hall. It needs to know which piece that is.
 * While the site is being written, one page answers for every address, at whatever depth: its `base` then names
 * the top of the server, where the build writes the way back out of each folder.
 */
function firstInHall(): Plugin {
  const first = Object.fromEntries(halls.map((h) => [h.id, inHall(h.id)[0]?.id ?? '']));
  return { name: 'first-in-hall', transformIndexHtml: (html, ctx) => html.replace('__FIRST_IN_HALL__', JSON.stringify(first)).replace('<base href="./">', ctx.server ? '<base href="/">' : '<base href="./">') };
}

/**
 * The page's opening script asks early for the words of the visitor's language, so it needs the name the build gave
 * to each language's file. While the site is being written there are no such files, and it asks for nothing.
 */
function langFiles(): Plugin {
  return {
    name: 'lang-files',
    enforce: 'post',
    transformIndexHtml: (html, ctx) => (ctx.server ? html.replace('__LANG_FILES__', '{}') : html),
    generateBundle(_, bundle) {
      const html = bundle['index.html'];
      if (!html || html.type !== 'asset') return;
      const files: Record<string, string> = {};
      for (const [name, file] of Object.entries(bundle)) {
        const code = file.type === 'chunk' ? /\/src\/i18n\/locales\/([a-z-]+)\.ts$/.exec(file.facadeModuleId ?? '')?.[1] : undefined;
        if (code) files[code] = name;
      }
      html.source = String(html.source).replace('__LANG_FILES__', () => JSON.stringify(files));
    },
  };
}

/**
 * The worker that keeps the museum on a visitor's device (`src/sw.ts`) is built into `sw.js`, beside the page: a
 * worker serves the folder it lies in. It has to name the files of the build, and their names change with their
 * contents, so the names are written into it here, once they are known. With them goes a mark for the build, made
 * from the page and those names, and the same mark is written into the page. By it a page and a worker tell
 * whether they are of one build. A build that changes nothing keeps its mark.
 * It comes last in the list of plugins, to read the page as it leaves the build.
 */
function keeper(): Plugin {
  return {
    name: 'keeper',
    apply: 'build',
    enforce: 'post',
    buildStart() { this.emitFile({ type: 'chunk', id: fileURLToPath(new URL('./src/sw.ts', import.meta.url)), fileName: 'sw.js' }); },
    async generateBundle(_, bundle) {
      const page = bundle['index.html'], worker = bundle['sw.js'];
      if (page?.type !== 'asset' || worker?.type !== 'chunk') return this.error('the page or its worker is missing from the build');
      const built = Object.values(bundle).filter((file) => file.fileName.startsWith('assets/') && !file.fileName.endsWith('.map'));
      // a language is fetched when a visitor chooses it, and is listed apart from the building
      const spoken = (file: (typeof built)[number]) => file.type === 'chunk' && !!file.facadeModuleId?.includes('/src/i18n/locales/');
      const names = (list: typeof built) => list.map((file) => file.fileName).sort();
      const shell = names(built.filter((file) => !spoken(file))), languages = names(built.filter(spoken));
      // what a page needs before anything is asked of it: its opening script, whatever that brings along, and the stylesheet
      const opening = built.find((file) => file.type === 'chunk' && file.isEntry);
      const core = shell.filter((name) => name.endsWith('.css') || (opening?.type === 'chunk' && (name === opening.fileName || opening.imports.includes(name))));
      const build = createHash('sha256').update(String(page.source)).update([...shell, ...languages].join()).digest('hex').slice(0, 12);
      page.source = String(page.source).replace('__BUILD__', build);
      const write: Record<string, unknown> = { __BUILD__: build, __SHELL__: shell, __CORE__: core, __LANGUAGES__: languages };
      worker.code = worker.code.replace(/__(?:BUILD|SHELL|CORE|LANGUAGES)__/g, (name) => JSON.stringify(write[name]));
      // What a visitor can ask to keep on the device (`src/keep.ts`): every picture, and the recordings of each tour
      // in each language, with what they weigh. Only the recordings the list of them names: an older one may still lie in the folder.
      const pub = fileURLToPath(new URL('./public/', import.meta.url));
      const under = (dir: string): string[] => readdirSync(pub + dir, { withFileTypes: true }).flatMap((f) => (f.isDirectory() ? under(`${dir}${f.name}/`) : [`${dir}${f.name}`]));
      const weight = (paths: string[]) => paths.reduce((sum, path) => sum + statSync(pub + path).size, 0);
      const pictures = under('').filter((path) => /\.(?:webp|png|jpe?g|svg|avif)$/i.test(path) && !path.startsWith('icons/') && !path.startsWith('og/') && path !== 'og.jpg').sort();
      const sound: Record<string, Record<string, { files: string[]; bytes: number }>> = {};
      for (const [tour, langs] of Object.entries(recorded as Record<string, Record<string, Record<string, { file: string }>>>)) {
        for (const [lang, parts] of Object.entries(langs)) {
          const files = Object.values(parts).map((part) => `tour/${tour}/${lang}/${part.file}`).sort();
          ((sound[tour] ??= {})[lang] = { files, bytes: weight(files) });
        }
      }
      this.emitFile({ type: 'asset', fileName: 'offline.json', source: JSON.stringify({ pictures, bytes: weight(pictures), sound }) });
      // A page for every place that has words, in every language, made from the page as it now is, and the sitemap.
      // The languages are the files `scripts/i18n.ts` has written from the translations.
      const tongues = fileURLToPath(new URL('./src/i18n/locales/', import.meta.url));
      const locales: Record<string, Locale> = {};
      for (const file of readdirSync(tongues).filter((f) => f.endsWith('.ts')).sort()) {
        const loaded = (await tsImport(tongues + file, import.meta.url)) as { default: Locale | { default: Locale } };
        locales[file.slice(0, -3)] = 'ui' in loaded.default ? loaded.default : loaded.default.default;
      }
      const pages = staticPages(String(page.source), locales, changed);
      page.source = pages.root;
      for (const file of pages.files) this.emitFile({ type: 'asset', ...file });
    },
  };
}

/** The day of the last change, as the repository records it. Empty where the files are not in a repository. */
const changed = ((): string => {
  try { return execSync('git log -1 --format=%cs', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); } catch { return ''; }
})();

// Relative base so the same build works at any GitHub Pages path.
export default defineConfig({
  base: './',
  define: { __CHANGED__: JSON.stringify(changed) },
  build: { target: 'es2022', chunkSizeWarningLimit: 900 },
  plugins: [firstInHall(), inlineCss(), langFiles(), keeper()],
});
