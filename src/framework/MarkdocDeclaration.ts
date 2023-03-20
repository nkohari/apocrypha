import type {NodeType, Schema} from '@markdoc/markdoc';
import {MarkdocConfigWithMetadata} from './MarkdocConfigWithMetadata';

export type MarkdocDeclaration<TMeta extends object = object> =
  | MarkdocNodeDeclaration<TMeta>
  | MarkdocTagDeclaration<TMeta>;

export type MarkdocNodeDeclaration<TMeta extends object = object> = Schema<
  MarkdocConfigWithMetadata<TMeta>
> & {
  node: NodeType;
};

export type MarkdocTagDeclaration<TMeta extends object = object> = Schema<
  MarkdocConfigWithMetadata<TMeta>
> & {
  tag: string;
};
