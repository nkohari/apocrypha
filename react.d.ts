import type { Article } from './src/framework';

export function useArticle<TMeta extends object>(path: string): Article<TMeta>;
export function useCatalog<TMeta extends object>(): Record<string, Article<TMeta>>;

type ArticleContentProps<TVariables> = {
  path: string;
  variables?: TVariables;
};

export function ArticleContent<TVariables = Record<string, any>>(
  props: ArticleContentProps<TVariables>,
): React.ReactNode;
