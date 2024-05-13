import path from 'path';

type PathsParams = {
  assets: string;
  components: string;
  content: string;
  declarations: string;
};

export class Paths {
  assets: string;
  base: string;
  components: string;
  content: string;
  declarations: string;

  constructor({assets, components, content, declarations}: PathsParams) {
    this.base = process.cwd();
    this.assets = path.resolve(process.cwd(), assets) + '/';
    this.components = path.resolve(process.cwd(), components) + '/';
    this.content = path.resolve(process.cwd(), content) + '/';
    this.declarations = path.resolve(process.cwd(), declarations) + '/';
  }
}
