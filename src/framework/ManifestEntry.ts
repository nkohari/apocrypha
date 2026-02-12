export type ManifestEntry<TMeta extends object> = {
  metadata: TMeta;
  moduleFilename: string;
  path: string;
};
