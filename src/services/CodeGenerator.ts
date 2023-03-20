import type {Node} from '@markdoc/markdoc';
import {CONFIG_MODULE_ID} from '../constants';
import type {Article} from '../framework';
import type {Document, Paths} from '../models';

type CodeGeneratorParams = {
  paths: Paths;
};

export class CodeGenerator<TMeta extends object> {
  paths: Paths;

  constructor({paths}: CodeGeneratorParams) {
    this.paths = paths;
  }

  renderArticleModule(ast: Node, metadata: TMeta) {
    return `
    import React from 'react';
    import Markdoc, {Ast} from '@markdoc/markdoc';
    import {config} from '${CONFIG_MODULE_ID}';
    import * as components from '${this.paths.components}';
  
    let ast = ${JSON.stringify(ast)};
    let metadata = ${JSON.stringify(metadata)};

    export default function ArticleComponent({variables}) {
      const tree = Ast.fromJSON(JSON.stringify(ast));
      const content = Markdoc.transform(tree, {
        ...config,
        variables,
        metadata
      });
      return Markdoc.renderers.react(content, React, {components});
    }
  
    if (import.meta.hot) {
      import.meta.hot.accept((newModule) => {
        ast = newModule.ast;
        metadata = newModule.metadata;
      });
    }`;
  }

  renderCatalogModule(documents: Document<TMeta>[]) {
    const articles = documents.reduce((hash, document) => {
      const {chunkId, metadata, path} = document;
      hash[path] = {chunkId, metadata, path};
      return hash;
    }, {} as Record<string, Article<TMeta>>);

    const imports = documents.map(
      (document) => `'${document.path}': () => import('${document.filename}'),`,
    );

    return `
    import {lazy, useReducer} from 'react';
  
    export let __articles__ = ${JSON.stringify(articles)};
    export let __modules__ = {
      ${imports.join('\n')}
    };

    export let useCatalog = () => {articles: __articles__};
  
    export const useArticle = (path) => {
      const {articles} = useCatalog();
      return articles[path];
    };
  
    export const useArticleContent = (path) => {
      return lazy(__modules__[path]);
    };
  
    if (import.meta.hot) {
      useCatalog = () => {
        const [, forceUpdate] = useReducer((x) => x + 1, 0);
        if (import.meta.hot) {
          import.meta.hot.accept((newModule) => {
            __articles__ = newModule.__articles__;
            __modules__ = newModule.__modules__;
            forceUpdate();
          });
        }
        return {articles: __articles__};
      };
    }`;
  }

  renderConfigModule() {
    return `
    import * as declarations from '${this.paths.declarations}';

    export let config = {
      nodes: {},
      tags: {},
      variables: {},
      functions: {},
      partials: {},
    };

    for (const [name, declaration] of Object.entries(declarations)) {
      if (declaration.node) {
        const {node, ...schema} = declaration;
        config.nodes[node] = schema;
      } else {
        const {tag, ...schema} = declaration;
        config.tags[tag] = schema;
      }
    }

    if (import.meta.hot) {
      import.meta.hot.accept((newModule) => {
        config = newModule.config;
      });
    }
    `;
  }
}
