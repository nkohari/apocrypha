export type Article<TMeta extends object> = {
  manifestId: string;
  metadata: TMeta;
  path: string;
};
