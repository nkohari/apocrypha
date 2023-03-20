import type {Node} from '@markdoc/markdoc';
import {COMPONENTS_MODULE_NAME, CONFIG_MODULE_NAME} from '../constants';
import type {Article} from '../framework';
import type {Paths} from '../models';
import {DocumentCatalog} from './DocumentCatalog';

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
    import {useConfig} from '${CONFIG_MODULE_NAME}';
    import {useComponents} from '${COMPONENTS_MODULE_NAME}';
  
    let ast = ${JSON.stringify(ast)};
    let metadata = ${JSON.stringify(metadata)};

    export default function ArticleComponent({variables}) {
      const components = useComponents();
      const config = useConfig();

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

  async renderCatalogModule(catalog: DocumentCatalog<TMeta>) {
    const documents = await catalog.getAllDocuments();
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

    export let useCatalog = () => __articles__;
  
    export const useArticle = (path) => {
      const articles = useCatalog();
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
        return __articles__;
      };
    }`;
  }

  renderConfigModule() {
    return `
    import {useReducer} from 'react';
    import * as declarations from '${this.paths.declarations}';

    export let __config__ = {
      nodes: {},
      tags: {},
      variables: {},
      functions: {},
      partials: {},
    };

    export let useConfig = () => __config__;

    for (const [name, declaration] of Object.entries(declarations)) {
      if (declaration.node) {
        const {node, ...schema} = declaration;
        __config__.nodes[node] = schema;
      } else {
        const {tag, ...schema} = declaration;
        __config__.tags[tag] = schema;
      }
    }

    if (import.meta.hot) {
      useConfig = () => {
        const [, forceUpdate] = useReducer((x) => x + 1, 0);
        if (import.meta.hot) {
          import.meta.hot.accept((newModule) => {
            __config__ = newModule.__config__;
            forceUpdate();
          });
        }
        return __config__;
      };
    }
    `;
  }

  renderComponentsModule() {
    return `
    import {useReducer} from 'react';
    import * as components from '${this.paths.components}';

    export let __components__ = components;
    export let useComponents = () => __components__;

    if (import.meta.hot) {
      useComponents = () => {
        const [, forceUpdate] = useReducer((x) => x + 1, 0);
        if (import.meta.hot) {
          import.meta.hot.accept((newModule) => {
            __components__ = newModule.__components__;
            forceUpdate();
          });
        }
        return __components__;
      };
    }
    `;
  }
}
