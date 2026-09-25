import { createSlugger } from './slug';

/** The parts of a hast node this plugin reads (hast itself isn't a direct dependency). */
type HastNode = {
  type: string;
  tagName?: string;
  value?: string;
  properties?: Record<string, unknown>;
  children?: HastNode[];
};

const HEADING = /^h[1-6]$/;

function textOf(node: HastNode): string {
  return node.type === 'text' ? (node.value ?? '') : (node.children ?? []).map(textOf).join('');
}

function visit(node: HastNode, slug: (text: string) => string): void {
  if (node.type === 'element' && HEADING.test(node.tagName ?? '')) {
    node.properties = { ...node.properties, id: slug(textOf(node)) };
  }
  for (const child of node.children ?? []) visit(child, slug);
}

/**
 * A rehype plugin that gives every heading an anchor id from its text, in document order. It runs
 * on the tree before React renders, so the server and the browser get the same ids.
 */
export function rehypeHeadingIds() {
  return (tree: HastNode) => visit(tree, createSlugger());
}
