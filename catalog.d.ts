import type { Node } from '@markdoc/markdoc';
import type { Article } from './src/framework';

export function getArticle<TMeta extends object>(path: string): Article<TMeta>;
export function getCatalog<TMeta extends object>(): Record<string, Article<TMeta>>;
export function getArticleLoader<TMeta extends object>(
  path: string,
): () => Promise<{ ast: Node; metadata: TMeta }>;
