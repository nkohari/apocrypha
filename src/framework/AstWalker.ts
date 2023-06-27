import {Ast} from '@markdoc/markdoc';
import type {Node, Function, Variable} from '@markdoc/markdoc';
import type {Predicate} from '../types';
import type {MarkdocNodeDeclaration, MarkdocTagDeclaration} from './types';

export abstract class AstWalker {
  /**
   * Recursively walks the Markdoc AST until it finds a matching node.
   * @param ast The AST to examine
   * @param match The type of the node, the node's declaration, or a predicate function to call
   * @returns The first matching node, or null if no matches are found
   */
  static findNode(
    ast: Node,
    match: string | MarkdocNodeDeclaration | Predicate<Node>,
  ): Node | null {
    const predicate = this.createNodePredicate(match);

    for (const node of ast.walk()) {
      if (predicate(node)) {
        return node;
      }
    }

    return null;
  }

  /**
   * Walks the Markdoc AST and finds all matching nodes.
   * @param ast The AST to examine
   * @param match The type of the node, the node's declaration, or a predicate function to call
   * @returns An array of matching nodes
   */
  static findNodes(
    ast: Node,
    match: string | MarkdocNodeDeclaration | Predicate<Node>,
  ) {
    return Array.from(this.filterNodes(ast, match));
  }

  /**
   * Recursively walks the Markdoc AST until it finds a matching node.
   * @param ast The AST to examine
   * @param match The name of the tag, the tag's declaration, or a predicate function to call
   * @returns The first matching node, or null if no matches are found
   */
  static findTag(
    ast: Node,
    match: string | MarkdocTagDeclaration | Predicate<Node>,
  ): Node | null {
    const predicate = this.createTagPredicate(match);

    for (const node of ast.walk()) {
      if (predicate(node)) {
        return node;
      }
    }

    return null;
  }

  /**
   * Walks the Markdoc AST and finds all tags of the specified name.
   * @param ast The AST to examine
   * @param match The name of the tag, the tag's declaration, or a predicate function to call
   * @returns An array of matching nodes
   */
  static findTags(
    ast: Node,
    match: string | MarkdocTagDeclaration | Predicate<Node>,
  ) {
    return Array.from(this.filterNodes(ast, this.createTagPredicate(match)));
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
   * Recursively visits each node of the Markdoc AST and calls the specified reducer
   * function, to reduce the tree to a single value.
   * @param ast The root of the tree to reduce
   * @param reducer The reducer function to call on the nodes of the tree
   * @param input The starting value for the reduction
   * @returns The reduced value
   */
  static reduce<T>(ast: Node, reducer: (state: T, node: Node) => T, input: T) {
    let current = reducer(input, ast);

    for (const child of ast.walk()) {
      current = this.reduce(child, reducer, current);
    }

    return current;
  }

  private static *filterNodes(
    ast: Node,
    match: string | MarkdocNodeDeclaration | Predicate<Node>,
  ): Iterable<Node> {
    const predicate = this.createNodePredicate(match);

    for (const node of ast.walk()) {
      if (predicate(node)) {
        yield node;
      }
    }
  }

  private static createNodePredicate(
    match: string | MarkdocNodeDeclaration | Predicate<Node>,
  ): Predicate<Node> {
    if (typeof match === 'function') {
      return match;
    } else if (typeof match === 'string') {
      return (node) => node.type === match;
    } else {
      return (node) => node.type === match.node;
    }
  }

  private static createTagPredicate(
    match: string | MarkdocTagDeclaration | Predicate<Node>,
  ): Predicate<Node> {
    if (typeof match === 'function') {
      return (node) => node.type === 'tag' && match(node);
    } else if (typeof match === 'string') {
      return (node) => node.type === 'tag' && node.tag === match;
    } else {
      return (node) => node.type === 'tag' && node.tag === match.tag;
    }
  }
}
