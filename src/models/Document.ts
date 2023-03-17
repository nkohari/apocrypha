import type {Node} from '@markdoc/markdoc';

export type Document<TMeta extends object> = {
  ast: Node;
  chunkId: string;
  filename: string;
  hash: string;
  metadata: TMeta;
  path: string;
};
