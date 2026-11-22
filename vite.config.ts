import { execSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { defineConfig, type Plugin } from 'vite';
import { halls } from './src/data/halls';
import { inHall } from './src/data/pieces';

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

/** The page's opening script asks early for the first picture of a hall. It needs to know which piece that is. */
function firstInHall(): Plugin {
  const first = Object.fromEntries(halls.map((h) => [h.id, inHall(h.id)[0]?.id ?? '']));
  return { name: 'first-in-hall', transformIndexHtml: (html) => html.replace('__FIRST_IN_HALL__', JSON.stringify(first)) };
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
    generateBundle(_, bundle) {
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
  plugins: [firstInHall(), inlineCss(), keeper()],
});
