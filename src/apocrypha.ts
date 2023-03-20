import {Plugin, ViteDevServer} from 'vite';
import {Tokenizer} from '@markdoc/markdoc';
import {
  ARTICLE_FILENAME_PATTERN,
  CATALOG_MODULE_NAME,
  COMPONENTS_MODULE_NAME,
  CONFIG_MODULE_NAME,
} from './constants';
import type {MetadataPlugin} from './framework';
import {Paths} from './models';
import {
  DocumentCatalog,
  DocumentFactory,
  CodeGenerator,
  MarkdocParser,
} from './services';
import {ArrayOrHash, arrayifyParameter} from './util';

const mangleModuleName = (name: string) => `\0${name}`;

export type ApocryphaParams<TMeta extends object> = {
  paths: {
    components: string;
    content: string;
    declarations: string;
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

  const parser = new MarkdocParser({tokenizer: params.tokenizer});
  const codeGenerator = new CodeGenerator({paths});

  const documentFactory = new DocumentFactory({
    metadataPlugins: arrayifyParameter(params.plugins?.metadata),
    parser,
    paths,
  });

  const catalog = new DocumentCatalog({
    documentFactory,
    paths,
  });

  return {
    name: 'vite-plugin-apocrypha',

    async buildEnd() {
      return catalog.stopWatching();
    },

    configureServer(server: ViteDevServer) {
      const {moduleGraph, watcher} = server;

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
        id === CATALOG_MODULE_NAME ||
        id === COMPONENTS_MODULE_NAME ||
        id === CONFIG_MODULE_NAME
      ) {
        return mangleModuleName(id);
      }
    },

    async load(id: string) {
      if (id === mangleModuleName(CATALOG_MODULE_NAME)) {
        return codeGenerator.renderCatalogModule(catalog);
      }
      if (id === mangleModuleName(COMPONENTS_MODULE_NAME)) {
        return codeGenerator.renderComponentsModule();
      }
      if (id === mangleModuleName(CONFIG_MODULE_NAME)) {
        return codeGenerator.renderConfigModule();
      }
    },

    async transform(text: string, id: string) {
      if (!ARTICLE_FILENAME_PATTERN.test(id)) return;

      const ast = parser.parse(text);
      const document = await catalog.getDocument(id);
      const code = codeGenerator.renderArticleModule(ast, document.metadata);

      return {code};
    },
  };
}
