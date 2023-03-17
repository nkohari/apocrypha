import {Config} from '@markdoc/markdoc';

export type MarkdocConfig<TMeta extends object> = Config & {
  metadata: TMeta;
};
