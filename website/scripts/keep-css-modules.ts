import type { Plugin } from 'vite';

const CSS_MODULE = /\.module\.css(?:$|\?)/;

/**
 * Keeps the CSS of every CSS module the client entry imports, even when no browser code uses its
 * class names. Page components are imported by the client only for their CSS and assets: the page
 * itself is static HTML and only the islands run (REQ-WEB-002). Vite would otherwise drop CSS
 * modules whose JavaScript is tree-shaken away, and the prerendered pages would lose their styles.
 */
export function keepCssModules(): Plugin {
  return {
    name: 'sitemark-website-keep-css-modules',
    apply: 'build',
    // After Vite's own CSS plugin, which marks CSS modules as free of side effects.
    enforce: 'post',
    transform(code, id) {
      return CSS_MODULE.test(id)
        ? { code, map: null, moduleSideEffects: 'no-treeshake' }
        : undefined;
    },
  };
}
