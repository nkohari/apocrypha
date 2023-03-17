import type {Article} from './src/framework';

export function getArticleContent(
  path: string,
): React.LazyExoticComponent<React.FunctionComponent>;

export function useArticle<TMeta extends object>(path: string): Article<TMeta>;

export function useArticles<TMeta extends object>(): Record<
  string,
  Article<TMeta>
>;
