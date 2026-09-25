import { type ReactNode, StrictMode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { applyDocumentLocale } from '@/lib/i18n';

/** Renders an extension page into #root with the document locale applied. */
export function mount(app: ReactNode, doc: Document = document): Root {
  const container = doc.getElementById('root');
  if (!container) throw new Error('[SiteMark] missing #root element');
  applyDocumentLocale(doc);
  const root = createRoot(container);
  root.render(<StrictMode>{app}</StrictMode>);
  return root;
}
