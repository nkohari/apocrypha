import type {Node} from '@markdoc/markdoc';

export type Document<TMeta extends object> = {
  ast: Node;
  filename: string;
  hash: string;
  manifestId: string;
  metadata: TMeta;
  path: string;
};
