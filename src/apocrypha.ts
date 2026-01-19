import { Tokenizer } from '@markdoc/markdoc';
import { NormalizedOutputOptions, OutputBundle } from 'rollup';
import { Plugin, ViteDevServer } from 'vite';
import {
  ARTICLE_FILENAME_PATTERN,
  ASSETS_MODULE_NAME,
  CATALOG_MODULE_NAME,
  COMPONENTS_MODULE_NAME,
  CONFIG_MODULE_NAME,
  MANIFEST_MODULE_NAME,
} from './constants';
import type { MetadataPlugin } from './framework';
import { Paths } from './models';
import { CodeGenerator, DocumentCatalog, DocumentFactory, MarkdocParser } from './services';
import { ArrayOrHash } from './types';
import { arrayifyParameter } from './util';

const mangleModuleName = (name: string) => `\0${name}`;

export type ApocryphaParams<TMeta extends object> = {
  paths?: {
    assets?: string;
    components?: string;
    content?: string;
    declarations?: string;
  };
  plugins?: {
    metadata?: ArrayOrHash<MetadataPlugin<TMeta>>;
  };
  tokenizer?: Tokenizer;
};

export function apocrypha<TMeta extends object = Record<string, any>>(
  params: ApocryphaParams<TMeta>,
): Plugin {
  const paths = new Paths(params.paths);

  const parser = new MarkdocParser({ tokenizer: params.tokenizer });
  const codeGenerator = new CodeGenerator<TMeta>({ paths });

  const documentFactory = new DocumentFactory<TMeta>({
    metadataPlugins: arrayifyParameter(params.plugins?.metadata),
    parser,
    paths,
  });

  const catalog = new DocumentCatalog<TMeta>({
    documentFactory,
    paths,
  });

  return {
    name: 'vite-plugin-apocrypha',

    async buildEnd() {
      return catalog.stopWatching();
    },

    configureServer(server: ViteDevServer) {
      const { moduleGraph, watcher } = server;

      const invalidateCatalogModule = () => {
        const moduleId = mangleModuleName(CATALOG_MODULE_NAME);
        const moduleNode = moduleGraph.getModuleById(moduleId);

        if (moduleNode) {
          moduleGraph.invalidateModule(moduleNode);
          watcher.emit('change', moduleId);
        }
      };

      catalog.on('add', invalidateCatalogModule);
      catalog.on('change', invalidateCatalogModule);
      catalog.on('remove', invalidateCatalogModule);
      catalog.startWatching();
    },

    resolveId(id: string) {
      if (
        id === ASSETS_MODULE_NAME ||
        id === CATALOG_MODULE_NAME ||
        id === COMPONENTS_MODULE_NAME ||
        id === CONFIG_MODULE_NAME ||
        id === MANIFEST_MODULE_NAME
      ) {
        return mangleModuleName(id);
      }
    },

    async load(id: string) {
      if (id === mangleModuleName(ASSETS_MODULE_NAME)) {
        return codeGenerator.renderAssetsModule();
      }
      if (id === mangleModuleName(CATALOG_MODULE_NAME)) {
        return codeGenerator.renderCatalogModule(catalog);
      }
      if (id === mangleModuleName(COMPONENTS_MODULE_NAME)) {
        return codeGenerator.renderComponentsModule();
      }
      if (id === mangleModuleName(CONFIG_MODULE_NAME)) {
        return codeGenerator.renderConfigModule();
      }
      if (id === mangleModuleName(MANIFEST_MODULE_NAME)) {
        const documents = await catalog.getAllDocuments();
        return codeGenerator.renderManifest(documents);
      }
    },

    async transform(text: string, id: string) {
      if (!ARTICLE_FILENAME_PATTERN.test(id)) return;

      const ast = parser.parse(text);
      const document = await catalog.getDocument(id);
      const code = codeGenerator.renderArticleModule(ast, document.metadata);

      return { code };
    },

    async generateBundle(_options: NormalizedOutputOptions, bundle: OutputBundle) {
      if (this.environment?.name !== 'client') return;

      const documents = await catalog.getAllDocuments();
      const source = codeGenerator.renderManifest(documents, bundle);

      this.emitFile({
        type: 'asset',
        name: MANIFEST_MODULE_NAME,
        source,
      });
    },
  };
}
