import crypto from 'crypto';
import fs from 'fs';
import yaml from 'js-yaml';
import type {Node} from '@markdoc/markdoc';
import type {Config, Document} from '../models';
import type {MetadataPlugin} from '../framework';
import type {MarkdocParser} from './MarkdocParser';

type DocumentFactoryParams<TMeta extends object> = {
  config: Config;
  parser: MarkdocParser<TMeta>;
  metadataPlugins: MetadataPlugin<TMeta>[];
};

export class DocumentFactory<TMeta extends object> {
  config: Config;
  parser: MarkdocParser<TMeta>;
  metadataPlugins: MetadataPlugin<TMeta>[];

  constructor({config, parser, metadataPlugins}: DocumentFactoryParams<TMeta>) {
    this.config = config;
    this.parser = parser;
    this.metadataPlugins = metadataPlugins;
  }

  async create(filename: string): Promise<Document<TMeta>> {
    const text = await fs.promises.readFile(filename, {encoding: 'utf8'});
    const ast = this.parser.parse(text);

    let frontmatter: Record<string, any> = {};
    if (ast.attributes.frontmatter) {
      const parsedFrontmatter = yaml.load(ast.attributes.frontmatter);
      if (parsedFrontmatter && typeof parsedFrontmatter === 'object') {
        frontmatter = parsedFrontmatter;
      }
    }

    const chunkId = this.getChunkId(filename);
    const metadata = await this.getMetadata(ast, frontmatter);
    const hash = this.getHash(ast, metadata);
    const path = this.getPath(filename);

    return {
      ast,
      chunkId,
      filename,
      hash,
      metadata,
      path,
    };
  }

  private getChunkId(filename: string) {
    return filename.replace(`${this.config.paths.base}/`, '');
  }

  private getHash(ast: Node, metadata: any) {
    const text = JSON.stringify({ast, metadata});
    return crypto
      .createHash('sha256')
      .update(text)
      .digest('hex')
      .substring(0, 8);
  }

  private async getMetadata(ast: Node, frontmatter: Record<string, any>) {
    let metadata: any = {};

    for (const plugin of this.metadataPlugins) {
      const values = await plugin({ast, frontmatter});
      if (values) {
        metadata = {...metadata, ...values};
      }
    }

    return metadata;
  }

  private getPath(filename: string) {
    const tokens = filename
      .replace(this.config.paths.content, '')
      .replace('.md', '')
      .split('/');

    const isIndex = tokens[tokens.length - 1] === 'index';
    const pathTokens = isIndex ? tokens.slice(0, -1) : tokens;

    return '/' + pathTokens.join('/');
  }
}
