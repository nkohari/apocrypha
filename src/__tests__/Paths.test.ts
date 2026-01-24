import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { Paths } from '../models/Paths';

describe('Paths', () => {
  const cwd = process.cwd();

  it('given no parameters, should use default paths', () => {
    const paths = new Paths();

    expect(paths.base).toBe(cwd);
    expect(paths.assets).toBe(`${resolve(cwd, 'assets')}/`);
    expect(paths.components).toBe(`${resolve(cwd, 'src/components')}/`);
    expect(paths.content).toBe(`${resolve(cwd, 'content')}/`);
    expect(paths.declarations).toBe(`${resolve(cwd, 'src/markdoc')}/`);
  });

  it('given relative paths, should normalize them to absolute paths', () => {
    const paths = new Paths({
      assets: './media',
      components: './src/ui',
      content: './docs',
      declarations: './src/tags',
    });

    expect(paths.assets).toBe(`${resolve(cwd, 'media')}/`);
    expect(paths.components).toBe(`${resolve(cwd, 'src/ui')}/`);
    expect(paths.content).toBe(`${resolve(cwd, 'docs')}/`);
    expect(paths.declarations).toBe(`${resolve(cwd, 'src/tags')}/`);
  });

  it('given absolute paths, should use them as is', () => {
    const absolutePath = '/absolute/path/to/assets';
    const paths = new Paths({ assets: absolutePath });

    expect(paths.assets).toBe(`${absolutePath}/`);
  });

  it('should add trailing slash to all paths', () => {
    const paths = new Paths({
      assets: 'media',
      components: 'components',
      content: 'content',
      declarations: 'declarations',
    });

    expect(paths.assets.endsWith('/')).toBe(true);
    expect(paths.components.endsWith('/')).toBe(true);
    expect(paths.content.endsWith('/')).toBe(true);
    expect(paths.declarations.endsWith('/')).toBe(true);
  });

  it('should allow partial path configuration', () => {
    const paths = new Paths({
      content: './my-content',
    });

    expect(paths.content).toBe(`${resolve(cwd, 'my-content')}/`);
    expect(paths.assets).toBe(`${resolve(cwd, 'assets')}/`);
    expect(paths.components).toBe(`${resolve(cwd, 'src/components')}/`);
    expect(paths.declarations).toBe(`${resolve(cwd, 'src/markdoc')}/`);
  });
});
