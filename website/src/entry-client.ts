import '@/styles/base.css';
import './styles/website-tokens.css';
import { hydratePage } from './hydrate';

// Every page is a prerendered HTML file; this hydrates whichever page it is (no client router).
void hydratePage(document);
