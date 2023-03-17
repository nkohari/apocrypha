import type {MarkdocDeclaration, MarkdocNodeDeclaration} from '../framework';

export function isNodeDeclaration<TMeta extends object>(
  declaration: MarkdocDeclaration<TMeta>,
): declaration is MarkdocNodeDeclaration<TMeta> {
  return (declaration as MarkdocNodeDeclaration<TMeta>).node !== undefined;
}
