import toSource from 'tosource';
import type {RenderableTreeNode} from '@markdoc/markdoc';
import type {Article} from '../framework';
import type {Config, Document} from '../models';

type CodeGeneratorParams = {
  config: Config;
};

export class CodeGenerator<TMeta extends object> {
  config: Config;

  constructor({config}: CodeGeneratorParams) {
    this.config = config;
  }

  renderArticleModule(content: RenderableTreeNode) {
    return `import React from 'react';
    import Markdoc from '@markdoc/markdoc';
    import * as components from '${this.config.paths.components}';
  
    let content = ${toSource(content)};
    export default function ArticleComponent() {
      return Markdoc.renderers.react(content, React, { components });
    }
  
    if (import.meta.hot) {
      import.meta.hot.accept((newModule) => {
        content = newModule.content;
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

    return `import { lazy, useReducer } from 'react';
  
    export let __articles__ = ${toSource(articles)};
    export let __modules__ = {
      ${imports.join('\n')}
    };
    export let useArticles = () => __articles__;
  
    export const useArticle = (path) => {
      const articles = useArticles();
      return articles[path];
    };
  
    export const getArticleContent = (path) => {
      return lazy(__modules__[path]);
    };
  
    if (import.meta.hot) {
      useArticles = () => {
        const [, forceUpdate] = useReducer((x) => x + 1, 0);
        if (import.meta.hot) {
          import.meta.hot.accept((newModule) => {
            __articles__ = newModule.__articles__;
            __modules__ = newModule.__modules__;
            forceUpdate();
          });
        }
        return __articles__;
      };
    }`;
  }
}
