import type {Node} from '@markdoc/markdoc';

export type MetadataPluginParams<
  TFrontmatter extends object = Record<string, any>,
> = {
  ast: Node;
  frontmatter: TFrontmatter;
};

export type MetadataPlugin<
  TMeta extends object,
  TFrontmatter extends object = Record<string, any>,
> = (params: MetadataPluginParams<TFrontmatter>) => Promise<Partial<TMeta>>;
