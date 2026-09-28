// The playground's styles, for the pages that prerender it. Its code is a chunk of its own that
// only those pages load (islands/island-loaders.ts), but its markup must be styled before, and
// without, JavaScript, so these pages import its CSS modules for the page stylesheet. The
// prerender build test fails when a class in a page has no style.
import '@/ui/components/Field.module.css';
import '@/ui/components/MarkPreview.module.css';
import './Playground.module.css';
