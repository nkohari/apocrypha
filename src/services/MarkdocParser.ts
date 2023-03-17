import Markdoc from '@markdoc/markdoc';
import type {Config, Node, Tokenizer} from '@markdoc/markdoc';
import type {MarkdocDeclaration} from '../framework';
import {isNodeDeclaration} from '../util';

export type MarkdocParserParams<TMeta extends object> = {
  declarations: MarkdocDeclaration<TMeta>[];
};

export class MarkdocParser<TMeta extends object> {
  config: Config;
  tokenizer: Tokenizer;

  constructor({declarations}: MarkdocParserParams<TMeta>) {
    this.tokenizer = new Markdoc.Tokenizer({typographer: true});

    this.config = {
      tags: {},
      nodes: {},
      partials: {},
    };

    for (const declaration of declarations) {
      this.declare(declaration);
    }
  }

  declare(declaration: MarkdocDeclaration<TMeta>) {
    if (isNodeDeclaration(declaration)) {
      const {node, ...schema} = declaration;
      this.config.nodes![node] = schema;
    } else {
      const {tag, ...schema} = declaration;
      this.config.tags![tag] = schema;
    }
  }

  parse(text: string) {
    return Markdoc.parse(this.tokenizer.tokenize(text));
  }

  transform(ast: Node, metadata: TMeta) {
    return Markdoc.transform(ast, {...this.config, metadata});
  }
}
