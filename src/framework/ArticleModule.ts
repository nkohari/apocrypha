export type ArticleModule<TMeta extends object> = {
  article: {
    ast: Node;
    metadata: TMeta;
  };
};
