import type {Schema} from '@markdoc/markdoc';
import {MarkdocConfigWithMetadata} from './MarkdocConfigWithMetadata';

export type MarkdocTagDeclaration<TMeta extends object = object> = Schema<
  MarkdocConfigWithMetadata<TMeta>
> & {
  tag: string;
};
