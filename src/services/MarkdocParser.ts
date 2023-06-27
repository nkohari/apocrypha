import Markdoc, {Tokenizer} from '@markdoc/markdoc';

type MarkdocParserParams = {
  tokenizer?: Tokenizer;
};

export class MarkdocParser {
  tokenizer: Tokenizer;

  constructor({tokenizer}: MarkdocParserParams) {
    this.tokenizer =
      tokenizer ??
      new Tokenizer({
        allowComments: true,
        allowIndentation: true,
        typographer: true,
      });
  }

  parse(text: string) {
    return Markdoc.parse(this.tokenizer.tokenize(text));
  }
}
