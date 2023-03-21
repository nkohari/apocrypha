import type {Article, Catalog} from './src/framework';

export function useArticle<TMeta extends object>(path: string): Article<TMeta>;
export function useCatalog<TMeta extends object>(): Catalog<TMeta>;

type ArticleContentProps<TVariables> = {
  path: string;
  variables?: TVariables;
};

export function ArticleContent<TVariables = Record<string, any>>(
  props: ArticleContentProps<TVariables>,
): JSX.Element;
