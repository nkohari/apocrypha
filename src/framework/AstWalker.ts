import {Ast, Node, Function, Variable} from '@markdoc/markdoc';
import {MarkdocTagDeclaration} from './MarkdocTagDeclaration';

export abstract class AstWalker {
  /**
   * Walks the Markdoc AST and finds all tags of the specified name.
   * @param ast The AST to examine
   * @param tag A declaration representing the tag, or its name
   * @returns An array of matching AST nodes
   */
  static findTags(ast: Node, tag: MarkdocTagDeclaration | string) {
    const tagName = typeof tag === 'object' ? tag.tag : tag;
    return this.findNodes(
      ast,
      (node) => node.type === 'tag' && node.tag === tagName,
    );
  }

  /**
   * Walks the Markdoc AST and finds all nodes matching the predicate.
   * @param ast The AST to examine
   * @param predicate The predicate to use for matching
   * @returns An array of matching AST nodes
   */
  static findNodes(ast: Node, predicate: (node: Node) => boolean) {
    return Array.from(this.filterNodes(ast, predicate));
  }

  /**
   * Walks the Markdoc AST and finds all variables. Optionally, matches the
   * variables to the supplied predicate.
   * @param ast The AST to examine
   * @param predicate The predicate to use for matching
   * @returns An array of matching variable names
   */
  static findVariables(ast: Node, predicate?: (variable: string) => boolean) {
    const variables = new Set<string>();

    const recursivelyFindVariables = (value: Node | Function | Variable) => {
      if (!value || typeof value !== 'object') {
        return;
      }

      // Ignore variables within debug() function calls
      if (Ast.isFunction(value) && value.name === 'debug') {
        return;
      }

      if (Ast.isVariable(value)) {
        const variable = value.path.join('.');
        if (!predicate || predicate(variable)) {
          variables.add(variable);
        }
      }

      for (const child of Object.values(value)) {
        recursivelyFindVariables(child);
      }
    };

    for (const node of ast.walk()) {
      recursivelyFindVariables(node);
    }

    return Array.from(variables);
  }

  /**
   * Recursively walks the Markdoc AST and yields all nodes matching the given predicate.
   * See also findNodes(), which returns an Array<Node> rather than an Iterable<Node>.
   * @param ast The AST to examine
   * @param predicate The predicate to match
   * @returns An Iterable of all matching AST nodes
   */
  static *filterNodes(
    ast: Node,
    predicate: (node: Node) => boolean,
  ): Iterable<Node> {
    for (const node of ast.walk()) {
      if (predicate(node)) {
        yield node;
      }
    }
  }
}
