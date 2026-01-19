import type { Config, Node, NodeType, Schema } from '@markdoc/markdoc';
import { Paths } from '../models';
import { Maybe, MaybePromise } from '../types';

export type MarkdocConfigWithMetadata<TMeta extends object> = Config & {
  metadata: TMeta;
};

export type MarkdocTagDeclaration<TMeta extends object = object> = Schema<
  MarkdocConfigWithMetadata<TMeta>
> & {
  tag: string;
};

export type MarkdocNodeDeclaration<TMeta extends object = object> = Schema<
  MarkdocConfigWithMetadata<TMeta>
> & {
  node: NodeType;
};

export type MarkdocDeclaration<TMeta extends object = object> =
  | MarkdocNodeDeclaration<TMeta>
  | MarkdocTagDeclaration<TMeta>;

export type MetadataPluginParams<TMeta extends object = Record<string, any>> = {
  ast: Node;
  frontmatter: Record<string, any>;
  metadata: TMeta;
  paths: Paths;
};

export type MetadataPlugin<TMeta extends object = Record<string, any>> = (
  params: MetadataPluginParams<TMeta>,
) => MaybePromise<Maybe<Partial<TMeta>>>;
