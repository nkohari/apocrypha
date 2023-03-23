import type {NodeType, Schema} from '@markdoc/markdoc';
import {MarkdocConfigWithMetadata} from './MarkdocConfigWithMetadata';

export type MarkdocNodeDeclaration<TMeta extends object = object> = Schema<
  MarkdocConfigWithMetadata<TMeta>
> & {
  node: NodeType;
};
