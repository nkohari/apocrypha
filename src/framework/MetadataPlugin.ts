import type {Node} from '@markdoc/markdoc';

export type MetadataPluginParams = {
  ast: Node;
  frontmatter: Record<string, any>;
};

export type MetadataPlugin<TMeta extends object> = (
  params: MetadataPluginParams,
) => Promise<Partial<TMeta>>;
