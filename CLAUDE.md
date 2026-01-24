# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Apocrypha is a Vite plugin that enables building static websites with Markdoc and React. It compiles Markdoc documents (`.md` files) into JavaScript modules that export the Markdoc AST and article metadata, with full HMR support during development.

## Development Commands

```bash
# Build the library (both library and types)
npm run build

# Build only the library code (uses esbuild via build.js)
npm run build:library

# Build only TypeScript declarations
npm run build:types

# Watch mode for development
npm run dev

# Run all tests (uses Vitest)
npm test

# Run tests in watch mode
npm run test:watch
# or
npm run zen

# Run tests with coverage
npm run test:coverage
```

## Code Architecture

### Core Plugin System (src/apocrypha.ts)

The main export is the `apocrypha()` function, which returns a Vite plugin. The plugin orchestrates several key components:

- **Paths**: Configuration for paths to assets, components, content (Markdoc files), and declarations
- **MarkdocParser**: Parses Markdoc text into AST
- **CodeGenerator**: Generates virtual modules for the catalog, components, config, assets, and manifest
- **DocumentFactory**: Creates Document objects from Markdoc files, including parsing frontmatter and running metadata plugins
- **DocumentCatalog**: Maintains an index of all documents, watches for file changes, emits events for add/remove/change

### Virtual Modules

The plugin creates several virtual modules (prefixed with `\0` in Vite's module graph):

- `@apocrypha/core/catalog`: Exports `useCatalog()`, `useArticle()`, `ArticleContent`, and article metadata
- `@apocrypha/core/components`: Exports `useComponents()` for React components
- `@apocrypha/core/config`: Exports `useConfig()` for Markdoc node/tag declarations
- `@apocrypha/core/assets`: Exports `getAssetUrl()` and `getAllAssetUrlsForFolder()` for asset management
- `article-manifest.js`: Maps article paths to chunk filenames (generated during build)

These modules are generated at runtime by CodeGenerator and injected via the plugin's `load()` hook.

### Hot Module Reload (HMR)

HMR is implemented through a client-side Registry pattern:

1. Each article module registers itself with `window.__apocrypha__` (a Registry instance)
2. The Registry maintains a Set of listener functions and broadcasts changes
3. React components (`ArticleContent`, `useArticle`, `useCatalog`) subscribe to the registry and use `useReducer` to force re-renders when content changes
4. During HMR, article modules detect reload via `import.meta.hot.data.loaded` and trigger a broadcast

The catalog module handles HMR by:
- Preserving existing Loader instances (to maintain promise state)
- Only adding loaders for new articles
- Broadcasting to all subscribed components when the module updates

### Document Processing Flow

1. **Discovery**: DocumentCatalog scans the content directory for `.md` files using fast-glob
2. **Parsing**: DocumentFactory reads each file, parses it with MarkdocParser, extracts frontmatter with js-yaml
3. **Metadata**: Metadata plugins run sequentially, each receiving the AST, frontmatter, and accumulated metadata
4. **Cataloging**: Documents are indexed by filename with computed ID (relative path), path (URL path), and hash (for change detection)
5. **Code Generation**: During Vite's transform hook, Markdoc files are transformed into JS modules that export `{ast, metadata}` and register with the HMR registry

### Build Output

The build uses esbuild (via build.js) to create dual outputs:

- CommonJS (`dist/*.js`) for Node compatibility
- ES modules (`dist/*.mjs`) for modern bundlers
- TypeScript declarations (`dist/*.d.ts`) generated separately via tsc

During production builds, the plugin's `generateBundle()` hook (client environment only) generates a static manifest mapping article IDs to their chunk filenames.

## Testing

This project uses Vitest for unit testing:

- Test files are located in `src/__tests__/` directory
- Test files follow the pattern `*.test.ts`
- Configuration is in `vitest.config.ts`
- When testing components that work with Markdoc AST, use `Markdoc.parse()` to create real AST nodes rather than constructing Node objects directly

## Code Formatting & Linting

This project uses Biome for formatting and linting:

- Line width: 100 characters
- Indent: 2 spaces
- Quote style: single quotes
- Disabled rules: `noExplicitAny`, `noNonNullAssertion`, `noUselessElse`, `useImportType`

Run Biome via `npx biome check` or `npx biome format`.

## Key Design Patterns

**Lazy Loading**: Articles are loaded on-demand using a Loader class that implements a promise-based state machine (waiting → loading → resolved/error). This integrates with React Suspense.

**Event-Driven Catalog**: DocumentCatalog extends EventEmitter and emits 'add', 'remove', and 'change' events, which the Vite plugin listens to for invalidating the catalog module during HMR.

**Metadata Plugin System**: Metadata plugins are async functions that receive `{ast, frontmatter, metadata, paths}` and return partial metadata objects. Results are merged sequentially.

## Important Notes

- The virtual catalog module exports both static article metadata (`__articles__`) and dynamic loaders (`__loaders__`), allowing for efficient static rendering with lazy content loading
- The AstWalker utility (src/framework/AstWalker.ts) provides helpers for traversing Markdoc AST to find nodes, tags, and variables
- Document IDs are the full relative path from project root (e.g., `content/blog/post.md`), while paths are the URL paths (e.g., `/blog/post`)
- The manifest is only generated during client builds (checked via `this.environment?.name !== 'client'`) to avoid duplicate generation in Vite's dual-environment setup
