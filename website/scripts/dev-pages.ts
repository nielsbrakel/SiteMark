import type { Plugin, ViteDevServer } from 'vite';
import type { renderPages } from '../src/entry-server.tsx';

/** Renders the page for a `/SiteMark/<…>/` URL with the same entry-server as the build. */
async function render(server: ViteDevServer, url: string): Promise<string | undefined> {
  const { pathname } = new URL(url, 'http://localhost');
  const { base } = server.config;
  if (!(pathname.startsWith(base) && pathname.endsWith('/'))) return undefined;
  const file = `${pathname.slice(base.length)}index.html`;
  const entry = (await server.ssrLoadModule('/src/entry-server.tsx')) as {
    renderPages: typeof renderPages;
  };
  const pages = await entry.renderPages({
    script: 'src/entry-client.ts',
    styles: [],
    devServer: true,
  });
  const page = pages.find((p) => p.file === file);
  // Not transformIndexHtml: it would put the base path in front of the script URL a second time.
  // The entry imports its CSS, and Vite serves that CSS with its client (and so with reloads).
  return page?.html;
}

/** `pnpm web:dev`: server-renders each route on request, like the prerender step does at build. */
export function devPages(): Plugin {
  return {
    name: 'sitemark-website-dev-pages',
    apply: 'serve',
    configureServer: (server) => () => {
      server.middlewares.use((request, response, next) => {
        render(server, request.originalUrl ?? '/').then((html) => {
          if (html === undefined) return next();
          response.setHeader('Content-Type', 'text/html; charset=utf-8');
          response.end(html);
        }, next);
      });
    },
  };
}
