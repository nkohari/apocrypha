import type {Article} from './src/framework';

type ArticleContentProps<TVariables> = {
  variables?: TVariables;
};

export function getArticleContent<TVariables = Record<string, any>>(
  path: string,
): React.LazyExoticComponent<
  React.FunctionComponent<ArticleContentProps<TVariables>>
>;

export function useArticle<TMeta extends object>(path: string): Article<TMeta>;

export function useArticles<TMeta extends object>(): Record<
  string,
  Article<TMeta>
>;
