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

// Relative base so the same build works at any GitHub Pages path.
export default defineConfig({
  base: './',
  build: { target: 'es2022', chunkSizeWarningLimit: 900 },
  plugins: [firstInHall(), inlineCss()],
});
