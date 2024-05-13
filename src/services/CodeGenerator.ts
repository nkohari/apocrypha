import type {Node} from '@markdoc/markdoc';
import toSource from 'tosource';
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
    export let ast = ${JSON.stringify(ast)};
    export let metadata = ${toSource(metadata)};
  
    if (import.meta.hot) {
      import.meta.hot.accept((newModule) => {
        ast = newModule.ast;
        metadata = newModule.metadata;
      });
    }`;
  }

  async renderAssetsModule() {
    // Vite's import.meta.glob() expects absolute paths to be relative to the project root,
    // not the filesystem root.
    const relativePath = this.paths.assets.replace(this.paths.base, '');

    return `
    export let __modules__ = import.meta.glob('${relativePath}/**', {
      import: 'default',
      eager: true
    });

    export function getAssetUrl(path) {
      return __modules__['${relativePath}' + path];
    }

    export function getAllAssetUrlsForFolder(folderPath) {
      return Object.keys(__modules__)
        .filter((path) => path.indexOf('${relativePath}' + folderPath) === 0);
    }

    if (import.meta.hot) {
      import.meta.hot.accept((newModule) => {
        __modules__ = import.meta.glob('${relativePath}/**', {
          import: 'default',
          eager: true
        });
      });
    }`;
  }

  async renderCatalogModule(catalog: DocumentCatalog<TMeta>) {
    const documents = await catalog.getAllDocuments();

    const articles = documents.reduce((hash, document) => {
      const {manifestId, metadata, path} = document;
      hash[path] = {manifestId, metadata, path};
      return hash;
    }, {} as Record<string, Article<TMeta>>);

    return `
    import React, {useReducer} from 'react';
    import Markdoc, {Ast} from '@markdoc/markdoc';
    import {useConfig} from '${CONFIG_MODULE_NAME}';
    import {useComponents} from '${COMPONENTS_MODULE_NAME}';

    class Loader {
      constructor(callback) {
        this.callback = callback;
        this.status = 'waiting';
      }
      load() {
        if (!this.promise) {
          this.status = 'loading';
          this.promise = this.callback().then((result) => {
            this.status = 'resolved';
            this.result = result;
          })
          .catch((error) => {
            this.status = 'error';
            this.error = error;
          });
        }

        if (this.status === 'resolved') return this.result;
        if (this.status === 'loading') throw this.promise;
        if (this.status === 'error') throw this.error;
      }
    }

    export let __articles__ = ${toSource(articles)};
    export let __loaders__ = {
      ${documents
        .map(
          (document) =>
            `'${document.path}': new Loader(() => import('${document.filename}')),`,
        )
        .join('\n')}
    };
    
    export function ArticleContent({path, variables}) {
      const components = useComponents();
      const config = useConfig();
      const {ast, metadata} = __loaders__[path].load();

      const tree = Ast.fromJSON(JSON.stringify(ast));
      const content = Markdoc.transform(tree, {
        ...config,
        variables,
        metadata
      });
      
      return Markdoc.renderers.react(content, React, {components});
    }

    export const useArticle = (path) => {
      const articles = useCatalog();
      return articles[path];
    };
    
    export let useCatalog = () => __articles__;
  
    if (import.meta.hot) {
      useCatalog = () => {
        const [, forceUpdate] = useReducer((x) => x + 1, 0);

        import.meta.hot.accept((newModule) => {
          __articles__ = newModule.__articles__;
          __loaders__ = newModule.__loaders__;
          forceUpdate();
        });

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
      }
      if (declaration.tag) {
        const {tag, ...schema} = declaration;
        __config__.tags[tag] = schema;
      }
    }

    if (import.meta.hot) {
      useConfig = () => {
        const [, forceUpdate] = useReducer((x) => x + 1, 0);

        import.meta.hot.accept((newModule) => {
          __config__ = newModule.__config__;
          forceUpdate();
        });

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

        import.meta.hot.accept((newModule) => {
          __components__ = newModule.__components__;
          forceUpdate();
        });

        return __components__;
      };
    }
    `;
  }
}
