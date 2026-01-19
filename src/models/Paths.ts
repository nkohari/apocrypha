import { resolve } from 'node:path';

type PathsParams = {
  assets?: string;
  components?: string;
  content?: string;
  declarations?: string;
};

export class Paths {
  assets: string;
  base: string;
  components: string;
  content: string;
  declarations: string;

  constructor({ assets, components, content, declarations }: PathsParams = {}) {
    this.base = process.cwd();
    this.assets = this.normalizePath(assets ?? 'assets');
    this.components = this.normalizePath(components ?? 'src/components');
    this.content = this.normalizePath(content ?? 'content');
    this.declarations = this.normalizePath(declarations ?? 'src/markdoc');
  }

  private normalizePath(path: string) {
    return `${resolve(process.cwd(), path)}/`;
  }
}
