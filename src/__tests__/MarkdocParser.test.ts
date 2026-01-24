import dedent from 'dedent';
import { describe, expect, it } from 'vitest';
import { MarkdocParser } from '../services/MarkdocParser';

describe('MarkdocParser', () => {
  it('should parse basic markdown text', () => {
    const parser = new MarkdocParser({});
    const text = '# Hello World\n\nThis is a paragraph.';

    const ast = parser.parse(text);

    expect(ast).toBeDefined();
    expect(ast.type).toBe('document');
    expect(ast.children.length).toBeGreaterThan(0);
  });

  it('should parse markdown with frontmatter', () => {
    const parser = new MarkdocParser({});
    const text = dedent`---
      title: My Article
      date: 2024-01-01
      ---

      # Content

      This is the body.
    `;

    const ast = parser.parse(text);

    expect(ast).toBeDefined();
    expect(ast.attributes.frontmatter).toBeDefined();
    expect(ast.attributes.frontmatter).toContain('title: My Article');
  });

  it('should parse headings correctly', () => {
    const parser = new MarkdocParser({});
    const text = '# Heading 1\n## Heading 2\n### Heading 3';

    const ast = parser.parse(text);

    const headings = ast.children.filter((child) => child.type === 'heading');
    expect(headings.length).toBe(3);
    expect(headings[0].attributes.level).toBe(1);
    expect(headings[1].attributes.level).toBe(2);
    expect(headings[2].attributes.level).toBe(3);
  });

  it('should parse paragraphs and inline content', () => {
    const parser = new MarkdocParser({});
    const text = 'This is **bold** and *italic* text.';

    const ast = parser.parse(text);

    const paragraph = ast.children.find((child) => child.type === 'paragraph');
    expect(paragraph).toBeDefined();
    expect(paragraph?.children.length).toBeGreaterThan(0);
  });

  it('should parse lists', () => {
    const parser = new MarkdocParser({});
    const text = dedent`
      - Item 1
      - Item 2
      - Item 3
    `;

    const ast = parser.parse(text);

    const list = ast.children.find((child) => child.type === 'list');
    expect(list).toBeDefined();
    expect(list?.children.length).toBe(3);
  });

  it('should parse code blocks', () => {
    const parser = new MarkdocParser({});
    const text = '```javascript\nconst x = 1;\n```';

    const ast = parser.parse(text);

    const fence = ast.children.find((child) => child.type === 'fence');
    expect(fence).toBeDefined();
    expect(fence?.attributes.language).toBe('javascript');
  });

  it('should handle empty text', () => {
    const parser = new MarkdocParser({});
    const ast = parser.parse('');

    expect(ast).toBeDefined();
    expect(ast.type).toBe('document');
    expect(ast.children.length).toBe(0);
  });

  it('should use custom tokenizer when provided', () => {
    const { Tokenizer } = require('@markdoc/markdoc');
    const customTokenizer = new Tokenizer({
      allowComments: false,
      allowIndentation: false,
      typographer: false,
    });

    const parser = new MarkdocParser({ tokenizer: customTokenizer });
    expect(parser.tokenizer).toBe(customTokenizer);
  });
});
