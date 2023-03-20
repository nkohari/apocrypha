import type {Article, Catalog} from './src/framework';

export function useArticle<TMeta extends object>(path: string): Article<TMeta>;

type ArticleContentProps<TVariables> = {
  variables?: TVariables;
};

export function useArticleContent<TVariables = Record<string, any>>(
  path: string,
): React.LazyExoticComponent<
  React.FunctionComponent<ArticleContentProps<TVariables>>
>;

export function useCatalog<TMeta extends object>(): Catalog<TMeta>;
