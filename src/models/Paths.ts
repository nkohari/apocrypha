import path from 'path';

type PathsParams = {
  components: string;
  content: string;
  declarations: string;
};

export class Paths {
  base: string;
  components: string;
  content: string;
  declarations: string;

  constructor({components, content, declarations}: PathsParams) {
    this.base = process.cwd();
    this.components = path.resolve(process.cwd(), components) + '/';
    this.content = path.resolve(process.cwd(), content) + '/';
    this.declarations = path.resolve(process.cwd(), declarations) + '/';
  }
}
