import {EventEmitter} from 'events';
import chokidar, {FSWatcher} from 'chokidar';
import glob from 'fast-glob';
import type {Config, Document} from '../models';
import type {DocumentFactory} from './DocumentFactory';

type DocumentCatalogParams<TMeta extends object> = {
  config: Config;
  documentFactory: DocumentFactory<TMeta>;
};

export class DocumentCatalog<TMeta extends object> extends EventEmitter {
  articles: Record<string, Document<TMeta>>;
  config: Config;
  documentFactory: DocumentFactory<TMeta>;
  globPattern: string;
  fsWatcher?: FSWatcher;

  private initialScanPromise: Maybe<Promise<void>>;

  constructor({config, documentFactory}: DocumentCatalogParams<TMeta>) {
    super();

    this.config = config;
    this.documentFactory = documentFactory;

    this.globPattern = `${this.config.paths.content}**/*.md`;
    this.articles = {};
  }

  async getDocument(id: string) {
    await this.waitForInitialScan();
    return this.articles[id];
  }

  async getAllDocuments() {
    await this.waitForInitialScan();
    return Object.values(this.articles);
  }

  async startWatching() {
    await this.waitForInitialScan();

    return new Promise<void>((resolve) => {
      this.fsWatcher = chokidar.watch(this.globPattern, {
        persistent: true,
        ignoreInitial: true,
      });

      this.fsWatcher.on('add', (filename) => this.addDocument(filename));
      this.fsWatcher.on('change', (filename) => this.updateDocument(filename));
      this.fsWatcher.on('unlink', (filename) => this.removeDocument(filename));
      this.fsWatcher.on('ready', resolve);
    });
  }

  async stopWatching() {
    return this.fsWatcher?.close();
  }

  private async waitForInitialScan() {
    if (!this.initialScanPromise) {
      this.initialScanPromise = this.performInitialScan();
    }

    return this.initialScanPromise;
  }

  private async performInitialScan() {
    const filenames = await glob(this.globPattern, {absolute: true});
    for (const filename of filenames) {
      this.addDocument(filename, {silent: true});
    }
  }

  private async addDocument(
    filename: string,
    options: {silent?: boolean} = {silent: false},
  ) {
    const article = await this.documentFactory.create(filename);
    this.articles[article.filename] = article;
    if (!options.silent) {
      this.emit('add', article);
    }
  }

  private async updateDocument(filename: string) {
    const article = await this.documentFactory.create(filename);

    const previous = this.articles[article.filename];
    const changed = !previous || previous.hash !== article.hash;

    this.articles[article.filename] = article;

    if (changed) {
      this.emit('change', article);
    }
  }

  private async removeDocument(filename: string) {
    const article = this.articles[filename];
    if (article) {
      delete this.articles[filename];
      this.emit('remove', article);
    }
  }
}
