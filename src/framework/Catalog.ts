import {Article} from './Article';

export type Catalog<TMeta extends object> = {
  articles: Record<string, Article<TMeta>>;
};
