import {Article} from './Article';

export type Catalog<TMeta extends object> = Record<string, Article<TMeta>>;
