// The hero's styles, for the home page that prerenders it. Its code is a chunk of its own
// (islands/island-loaders.ts), but its markup must be styled before, and without, JavaScript, so
// the page imports its CSS modules for the page stylesheet.
import './HeroCompare.module.css';
import './HeroShop.module.css';
