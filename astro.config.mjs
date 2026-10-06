// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { readdir, readFile, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { site } from './src/config/site.ts';

/**
 * `draft: true` olan oyunların dosyalarını production çıktısından siler:
 * `public/play/<slug>/` kopyası ve `_astro/` içine işlenen kapak görseli.
 */
function stripDraftGames() {
  return {
    name: 'monty:strip-draft-games',
    hooks: {
      /** @param {{ dir: URL, logger: import('astro').AstroIntegrationLogger }} options */
      'astro:build:done': async ({ dir, logger }) => {
        const gamesDir = new URL('./src/content/games/', import.meta.url);
        const files = (await readdir(gamesDir)).filter((f) => f.endsWith('.md'));
        const assetsDir = new URL('_astro/', dir);
        const assets = await readdir(assetsDir).catch(() => []);
        for (const file of files) {
          const text = await readFile(new URL(file, gamesDir), 'utf8');
          const frontmatter = text.split(/^---\s*$/m)[1] ?? '';
          if (!/^draft:\s*true\s*$/m.test(frontmatter)) continue;
          const slug = file.replace(/\.md$/, '');
          const cover = frontmatter.match(/^cover:\s*\.\/covers\/(.+?)\.\w+\s*$/m)?.[1];
          await rm(fileURLToPath(new URL(`play/${slug}/`, dir)), { recursive: true, force: true });
          for (const asset of assets) {
            if (cover && asset.startsWith(`${cover}.`)) await rm(fileURLToPath(new URL(asset, assetsDir)), { force: true });
          }
          logger.info(`taslak oyun dosyaları çıkarıldı: ${slug}`);
        }
        // Hiç yayında oyun yoksa boş kalan play/ klasörünü de kaldır.
        const playDir = fileURLToPath(new URL('play/', dir));
        if ((await readdir(playDir).catch(() => [''])).length === 0) await rm(playDir, { recursive: true });
      },
    },
  };
}

export default defineConfig({
  site: site.url,
  output: 'static',
  trailingSlash: 'ignore',
  prefetch: { prefetchAll: true, defaultStrategy: 'hover' },
  // Sayfa başına CSS küçük (~20 KB); satır içi vermek render-blocking isteği kaldırır.
  build: { inlineStylesheets: 'always' },
  integrations: [
    sitemap({
      // Kök dil yönlendirme sayfası ve 404 sitemap'e girmez.
      filter: (page) => !/\/404\/?$/.test(page) && new URL(page).pathname !== '/',
    }),
    stripDraftGames(),
  ],
});
