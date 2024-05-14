export type Article<TMeta extends object> = {
  id: string;
  metadata: TMeta;
  path: string;
};
