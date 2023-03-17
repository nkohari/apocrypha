import path from 'path';

type ConfigParams = {
  paths: {
    components: string;
    content: string;
  };
};

export class Config {
  readonly paths: {
    readonly base: string;
    readonly components: string;
    readonly content: string;
  };

  constructor({paths}: ConfigParams) {
    this.paths = {
      base: process.cwd(),
      components: path.resolve(process.cwd(), paths.components) + '/',
      content: path.resolve(process.cwd(), paths.content) + '/',
    };
  }
}
