import {Plugin, ViteDevServer} from 'vite';
import type {MarkdocDeclaration, MetadataPlugin} from './framework';
import {Config} from './models';
import {
  DocumentCatalog,
  DocumentFactory,
  MarkdocParser,
  CodeGenerator,
} from './services';
import {ArrayOrHash, arrayifyParameter} from './util';

const CATALOG_MODULE_ID = 'apocrypha/catalog';
const ARTICLE_FILENAME_PATTERN = /\.md/;

const mangleModuleName = (name: string) => `\0${name}`;

export type CreateApocryphaParams<TMeta extends object> = {
  paths: {
    components: string;
    content: string;
  };
  declarations: ArrayOrHash<MarkdocDeclaration<TMeta>>;
  plugins?: {
    metadata?: ArrayOrHash<MetadataPlugin<TMeta>>;
  };
};

export function apocrypha<TMeta extends object = Record<string, any>>({
  paths,
  declarations,
  plugins,
}: CreateApocryphaParams<TMeta>): Plugin {
  const config = new Config({paths});

  const parser = new MarkdocParser({
    declarations: arrayifyParameter(declarations),
  });

  const codeGenerator = new CodeGenerator({config});

  const documentFactory = new DocumentFactory({
    config,
    parser,
    metadataPlugins: arrayifyParameter(plugins?.metadata),
  });

  const catalog = new DocumentCatalog({
    config,
    documentFactory,
  });

  return {
    name: 'vite-plugin-apocrypha',

    async buildEnd() {
      return catalog.stopWatching();
    },

    configureServer(server: ViteDevServer) {
      const {moduleGraph, watcher} = server;

      const invalidateCatalogModule = () => {
        const moduleName = mangleModuleName(CATALOG_MODULE_ID);
        const catalogModule = moduleGraph.getModuleById(moduleName);
        if (catalogModule) {
          moduleGraph.invalidateModule(catalogModule);
          watcher.emit('change', moduleName);
        }
      };

      catalog.on('add', invalidateCatalogModule);
      catalog.on('change', invalidateCatalogModule);
      catalog.on('remove', invalidateCatalogModule);

      catalog.startWatching();
    },

    resolveId(id: string) {
      if (id === CATALOG_MODULE_ID) {
        return mangleModuleName(CATALOG_MODULE_ID);
      }
    },

    async load(id: string) {
      if (id === mangleModuleName(CATALOG_MODULE_ID)) {
        const documents = await catalog.getAllDocuments();
        return codeGenerator.renderCatalogModule(documents);
      }
    },

    async transform(text: string, id: string) {
      if (!ARTICLE_FILENAME_PATTERN.test(id)) return;

      const ast = parser.parse(text);
      const document = await catalog.getDocument(id);
      const content = parser.transform(ast, document.metadata);
      const code = codeGenerator.renderArticleModule(content);

      return {code};
    },
  };
}
