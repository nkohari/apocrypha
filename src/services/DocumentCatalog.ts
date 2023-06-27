import {EventEmitter} from 'events';
import chokidar, {FSWatcher} from 'chokidar';
import glob from 'fast-glob';
import type {Document, Paths} from '../models';
import type {Maybe} from '../types';
import type {DocumentFactory} from './DocumentFactory';

type DocumentCatalogParams<TMeta extends object> = {
  documentFactory: DocumentFactory<TMeta>;
  paths: Paths;
};

export class DocumentCatalog<TMeta extends object> extends EventEmitter {
  documents: Record<string, Document<TMeta>>;
  documentFactory: DocumentFactory<TMeta>;
  fsWatcher?: FSWatcher;
  globPattern: string;
  paths: Paths;

  private initialScanPromise: Maybe<Promise<void>>;

  constructor({documentFactory, paths}: DocumentCatalogParams<TMeta>) {
    super();

    this.documentFactory = documentFactory;
    this.paths = paths;

    this.globPattern = `${this.paths.content}**/*.md`;
    this.documents = {};
  }

  async getDocument(id: string) {
    await this.waitForInitialScan();
    return this.documents[id];
  }

  async getAllDocuments() {
    await this.waitForInitialScan();
    return Object.values(this.documents);
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
    await Promise.all(
      filenames.map((filename) => this.addDocument(filename, {silent: true})),
    );
  }

  private async addDocument(
    filename: string,
    options: {silent?: boolean} = {silent: false},
  ) {
    const document = await this.documentFactory.create(filename);
    this.documents[document.filename] = document;
    if (!options.silent) {
      this.emit('add', document);
    }
  }

  private async updateDocument(filename: string) {
    const document = await this.documentFactory.create(filename);

    const previous = this.documents[document.filename];
    const changed = !previous || previous.hash !== document.hash;

    this.documents[document.filename] = document;

    if (changed) {
      this.emit('change', document);
    }
  }

  private async removeDocument(filename: string) {
    const document = this.documents[filename];
    if (document) {
      delete this.documents[filename];
      this.emit('remove', document);
    }
  }
}
