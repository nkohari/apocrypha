import type { Article, ArticleLoader } from './src/framework';

export function getArticle<TMeta extends object>(path: string): Article<TMeta> | undefined;
export function getCatalog<TMeta extends object>(): Record<string, Article<TMeta>> | undefined;
export function getArticleLoader<TMeta extends object>(
  path: string,
): ArticleLoader<TMeta> | undefined;
