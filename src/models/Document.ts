import type { Node } from '@markdoc/markdoc';

export type Document<TMeta extends object> = {
  ast: Node;
  filename: string;
  hash: string;
  id: string;
  metadata: TMeta;
  moduleReferenceId?: string;
  path: string;
};
