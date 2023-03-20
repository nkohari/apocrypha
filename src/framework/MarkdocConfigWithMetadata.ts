import {Config} from '@markdoc/markdoc';

export type MarkdocConfigWithMetadata<TMeta extends object> = Config & {
  metadata: TMeta;
};
