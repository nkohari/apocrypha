import type { Node } from '@markdoc/markdoc';
import type { OutputBundle, OutputChunk } from 'rollup';
import toSource from 'tosource';
import { CATALOG_MODULE_NAME, COMPONENTS_MODULE_NAME, CONFIG_MODULE_NAME } from '../constants';
import type { Article, MetadataEntry } from '../framework';
import type { Document, Paths } from '../models';
import { DocumentCatalog } from './DocumentCatalog';

type CodeGeneratorParams = {
  paths: Paths;
};

export class CodeGenerator<TMeta extends object> {
  paths: Paths;

  constructor({ paths }: CodeGeneratorParams) {
    this.paths = paths;
  }

  renderArticleModule(ast: Node, metadata: TMeta, path: string) {
    return `
      export const article = {
        ast: ${JSON.stringify(ast)},
        metadata: ${toSource(metadata)}
      };

      if (typeof window !== 'undefined' && window.__apocrypha__) {
        window.__apocrypha__.put('${path}', article);

        const isHotReload = import.meta.hot?.data?.loaded;

        if (isHotReload) {
          window.__apocrypha__.broadcast();
        }
      }

      if (import.meta.hot) {
        import.meta.hot.data.loaded = true;
        import.meta.hot.accept();
      }
    `;
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
          .filter((path) => path.indexOf('${relativePath}' + folderPath) === 0)
          .map((key) => __modules__[key]);
      }

      if (import.meta.hot) {
        import.meta.hot.accept((newModule) => {
          __modules__ = import.meta.glob('${relativePath}/**', {
            import: 'default',
            eager: true
          });
        });
      }
    `;
  }

  async renderCatalogModule(catalog: DocumentCatalog<TMeta>) {
    const documents = await catalog.getAllDocuments();

    const articles = documents.reduce(
      (hash, document) => {
        const { id, metadata, path } = document;
        hash[path] = { id, metadata, path };
        return hash;
      },
      {} as Record<string, Article<TMeta>>,
    );

    const loaders = documents
      .map((document) => `'${document.path}': () => import('${document.filename}'),`)
      .join('\n');

    return `
      class Registry {
        constructor() {
          this.entries = new Map();
          this.listeners = new Set();
        }
        get(path) {
          return this.entries.get(path);
        }
        put(path, article) {
          this.entries.set(path, article);
        }
        subscribe(listener) {
          this.listeners.add(listener);
        }
        unsubscribe(listener) {
          this.listeners.delete(listener);
        }
        broadcast() {
          this.listeners.forEach((listener) => listener());
        }
      }

      export let __registry__;

      if (typeof window !== 'undefined') {
        if (!window.__apocrypha__) {
          __registry__ = new Registry();
          window.__apocrypha__ = __registry__;
        } else {
          __registry__ = window.__apocrypha__;
        }
      } else {
        __registry__ = new Registry();
      }

      export let __articles__ = ${toSource(articles)};
      export let __loaders__ = {
        ${loaders}
      };

      export function getCatalog() {
        return __articles__;
      }

      export function getArticle(path) {
        return __articles__[path];
      }

      export function getArticleLoader(path) {
        return __loaders__[path];
      }

      if (import.meta.hot) {
        import.meta.hot.accept((newModule) => {
          __articles__ = newModule.__articles__;
          // Only add loaders for new articles
          for (const path in newModule.__loaders__) {
            if (!__loaders__[path]) {
              __loaders__[path] = newModule.__loaders__[path];
            }
          }
          __registry__.broadcast();
        });
      }
    `;
  }

  renderReactModule() {
    return `
      import React, {useEffect, useReducer} from 'react';
      import Markdoc, {Ast} from '@markdoc/markdoc';
      import {useConfig} from '${CONFIG_MODULE_NAME}';
      import {useComponents} from '${COMPONENTS_MODULE_NAME}';
      import {__registry__, getArticle, getCatalog, getArticleLoader} from '${CATALOG_MODULE_NAME}';

      class SuspendableLoader {
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

      const loaders = new Map();

      function loadArticle(path) {
        if (!loaders.has(path)) {
          const callback = getArticleLoader(path);
          loaders.set(path, new SuspendableLoader(callback));
        }

        loaders.get(path).load();
        return __registry__.get(path);
      }

      export function ArticleContent({path, variables}) {
        const [, forceUpdate] = useReducer((x) => x + 1, 0);

        useEffect(() => {
          __registry__.subscribe(forceUpdate);
          return () => __registry__.unsubscribe(forceUpdate);
        }, []);

        const components = useComponents();
        const config = useConfig();
        const {ast, metadata} = loadArticle(path);

        const tree = Ast.fromJSON(JSON.stringify(ast));
        const content = Markdoc.transform(tree, {
          ...config,
          variables,
          metadata
        });

        return Markdoc.renderers.react(content, React, {components});
      }

      export function useArticle(path) {
        const [, forceUpdate] = useReducer((x) => x + 1, 0);

        useEffect(() => {
          __registry__.subscribe(forceUpdate);
          return () => __registry__.unsubscribe(forceUpdate);
        }, []);

        return getArticle(path);
      };

      export function useCatalog() {
        const [, forceUpdate] = useReducer((x) => x + 1, 0);

        useEffect(() => {
          __registry__.subscribe(forceUpdate);
          return () => __registry__.unsubscribe(forceUpdate);
        }, []);

        return getCatalog();
      }
    `;
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

  renderMetadataModule(documents: Document<TMeta>[]) {
    const metadata: Record<string, MetadataEntry<TMeta>> = {};

    for (const document of documents) {
      metadata[document.id] = {
        path: document.path,
        metadata: document.metadata,
      };
    }

    return `
      export const metadata = ${toSource(metadata)};
    `;
  }

  renderManifestModuleForDevelopment(documents: Document<TMeta>[]) {
    const manifest: Record<string, string> = {};

    for (const document of documents) {
      manifest[document.path] = `${document.id}?import`;
    }

    return JSON.stringify(manifest, null, 2);
  }

  renderManifestModuleForProduction(documents: Document<TMeta>[], bundle: OutputBundle) {
    const chunks = Object.values(bundle).filter((c) => c.type === 'chunk') as OutputChunk[];
    const manifest: Record<string, string> = {};

    for (const document of documents) {
      const chunk = chunks.find((c) => c.facadeModuleId === document.filename);

      if (!chunk) {
        throw new Error(`Chunk not found for document: ${document.filename}`);
      }

      manifest[document.path] = chunk.fileName;
    }

    return JSON.stringify(manifest, null, 2);
  }
}
