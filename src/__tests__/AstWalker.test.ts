import Markdoc from '@markdoc/markdoc';
import { describe, expect, it } from 'vitest';
import { AstWalker } from '../framework/AstWalker';

describe('AstWalker', () => {
  describe('findNode', () => {
    it('should find a node by type', () => {
      const markdown = '# Title\n\nThis is a paragraph.';
      const ast = Markdoc.parse(markdown);

      const result = AstWalker.findNode(ast, 'heading');
      expect(result).not.toBeNull();
      expect(result?.type).toBe('heading');
    });

    it('should return null when no matching node is found', () => {
      const markdown = 'Just a paragraph.';
      const ast = Markdoc.parse(markdown);

      const result = AstWalker.findNode(ast, 'heading');
      expect(result).toBeNull();
    });

    it('should find a node using a predicate function', () => {
      const markdown = '# Heading 1\n## Heading 2\n### Heading 3';
      const ast = Markdoc.parse(markdown);

      const result = AstWalker.findNode(ast, (node) => {
        return node.type === 'heading' && node.attributes.level === 2;
      });

      expect(result).not.toBeNull();
      expect(result?.attributes.level).toBe(2);
    });
  });

  describe('findNodes', () => {
    it('should find all nodes of a given type', () => {
      const markdown = 'Paragraph 1\n\n# Heading\n\nParagraph 2';
      const ast = Markdoc.parse(markdown);

      const results = AstWalker.findNodes(ast, 'paragraph');
      expect(results.length).toBeGreaterThanOrEqual(2);
      expect(results.every((node) => node.type === 'paragraph')).toBe(true);
    });

    it('should return empty array when no matches are found', () => {
      const markdown = 'Just a paragraph.';
      const ast = Markdoc.parse(markdown);

      const results = AstWalker.findNodes(ast, 'heading');
      expect(results).toEqual([]);
    });

    it('should find all nodes matching a predicate', () => {
      const markdown = '# Heading 1\n## Heading 2\n# Another H1';
      const ast = Markdoc.parse(markdown);

      const results = AstWalker.findNodes(ast, (node) => {
        return node.type === 'heading' && node.attributes.level === 1;
      });

      expect(results).toHaveLength(2);
      expect(results.every((node) => node.attributes.level === 1)).toBe(true);
    });
  });

  describe('findTag', () => {
    it('should find a tag by name', () => {
      const markdown = 'Paragraph\n\n{% callout %}Note{% /callout %}';
      const ast = Markdoc.parse(markdown);

      const result = AstWalker.findTag(ast, 'callout');
      expect(result).not.toBeNull();
      expect(result?.type).toBe('tag');
      expect(result?.tag).toBe('callout');
    });

    it('should return null when tag is not found', () => {
      const markdown = 'Just a paragraph.';
      const ast = Markdoc.parse(markdown);

      const result = AstWalker.findTag(ast, 'callout');
      expect(result).toBeNull();
    });

    it('should only match tag nodes', () => {
      const markdown = 'Paragraph\n\n# Heading';
      const ast = Markdoc.parse(markdown);

      const result = AstWalker.findTag(ast, 'paragraph');
      expect(result).toBeNull();
    });
  });

  describe('findTags', () => {
    it('should find all tags with a given name', () => {
      const markdown =
        '{% callout %}First{% /callout %}\n\nText\n\n{% callout %}Second{% /callout %}';
      const ast = Markdoc.parse(markdown);

      const results = AstWalker.findTags(ast, 'callout');
      expect(results).toHaveLength(2);
      expect(results.every((node) => node.tag === 'callout')).toBe(true);
    });

    it('should return empty array when no tags match', () => {
      const markdown = 'Paragraph\n\n{% note %}Note{% /note %}';
      const ast = Markdoc.parse(markdown);

      const results = AstWalker.findTags(ast, 'callout');
      expect(results).toEqual([]);
    });
  });

  describe('reduce', () => {
    it('should reduce the AST to a single value', () => {
      const markdown = 'Paragraph 1\n\n# Heading\n\nParagraph 2';
      const ast = Markdoc.parse(markdown);

      const count = AstWalker.reduce(
        ast,
        (total, node) => (node.type === 'paragraph' ? total + 1 : total),
        0,
      );

      expect(count).toBeGreaterThanOrEqual(2);
    });

    it('should pass the accumulated value through each iteration', () => {
      const markdown = 'Hello World';
      const ast = Markdoc.parse(markdown);

      const types = AstWalker.reduce(
        ast,
        (acc, node) => {
          if (node.type && !acc.includes(node.type)) {
            return [...acc, node.type];
          }
          return acc;
        },
        [] as string[],
      );

      expect(types).toContain('document');
      expect(types.length).toBeGreaterThan(0);
    });
  });
});
