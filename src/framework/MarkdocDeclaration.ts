import type {NodeType, Schema} from '@markdoc/markdoc';
import {MarkdocConfig} from './MarkdocConfig';

export type MarkdocDeclaration<TMeta extends object = object> =
  | MarkdocNodeDeclaration<TMeta>
  | MarkdocTagDeclaration<TMeta>;

export type MarkdocNodeDeclaration<TMeta extends object = object> = Schema<
  MarkdocConfig<TMeta>
> & {
  node: NodeType;
};

export type MarkdocTagDeclaration<TMeta extends object = object> = Schema<
  MarkdocConfig<TMeta>
> & {
  tag: string;
};
