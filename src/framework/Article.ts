export type Article<TMeta extends object> = {
  chunkId: string;
  metadata: TMeta;
  path: string;
};
