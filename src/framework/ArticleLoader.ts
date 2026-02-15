import type { ArticleModule } from './ArticleModule';

export type ArticleLoader<TMeta extends object> = () => Promise<ArticleModule<TMeta>>;
