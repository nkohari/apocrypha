> [Apocrypha](https://elderscrolls.fandom.com/wiki/Apocrypha) is a realm of Oblivion created and ruled over by Hermaeus Mora, the Daedric Prince of Knowledge and Fate. It is an endless library consisting of untitled books with black covers, where all forbidden knowledge can be found, and the crackling towers of learning mingle with archways of despair and confusion.

# Apocrypha

**NOTE!** This documentation is still very much a scribbled work-in-progress -- please bear with me while I improve it. :)

Apocrypha is a plugin for [Vite](https://vite.dev) that lets you build websites with Markdoc and React. Given a collection of Markdoc documents, a set of React components, and a set of Markdoc tags, it will generate a static website. During development, full hot-module reload (HMR) support is available for both content and code.

## Usage

To start using Apocrypha, plug it into your `vite.config.js`. For example:

```ts
import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import {apocrypha} from 'apocrypha';

export default defineConfig({
  plugins: [
    apocrypha({
      paths: {
        components: './src/components',
        content: './content',
        declarations: './src/markdoc',
      },
    }),
    react(),
  ],
});
```

Apocrypha will recursively find all `*.md` files within the `content` path and compile them into JavaScript modules. These modules have a single default export, a React component which represents the content of the article.

You can get the list of articles at runtime using the `useCatalog` hook. For example:

```ts
import {useCatalog} from 'apocrypha/catalog';

export const ArticleList = () => {
  const catalog = useCatalog();
  return (
    <ul>
      {catalog.map((article) => (
        <li key={article.path}>
          <a href={article.path}>{article.metadata.title}</a>
        </li>
      ))}
    </ul>
  );
};
```

(The `apocrypha/catalog` module isn't actually part of the Apocrypha library; it's a _virtual module_ which is generated based on your project.)

To display an article's content, you can use the `ArticleContent` component. This is a React component which, when rendered, asynchronously loads the article's module and renders its content using the Markdoc React renderer. The `ArticleContent` component is designed to work with [`<Suspense>`](https://react.dev/reference/react/Suspense) boundaries, which you can use to show a loading indicator. Here's an example:

```ts
import {ArticleContent} from 'apocrypha/catalog';

type PageProps = {
  path: string;
};

export const Page = ({path}: PageProps) => (
  <Suspense fallback="Loading...">
    <ArticleContent path={path} />
  </Suspense>
);
```

The `ArticleContent` component also supports a `variables` prop, which you can use to pass [variables](https://markdoc.dev/docs/variables) through to your Markdoc content. For example, you could load the currently logged-in user from somewhere:

```ts
import {ArticleContent} from 'apocrypha/catalog';

type PageProps = {
  path: string;
};

export const Page = ({path}: PageProps) => {
  const user = /* get the currently logged-in user from somewhere */

  return (
    <Suspense fallback="Loading...">
      <ArticleContent path={path} variables={{user}} />
    </Suspense>
  );
};
```

Then you can access the variable in your content like this:

```md
Hello, {% $user.name %}! Welcome to my awesome website.
```

## Metadata

You can associate metadata with articles by creating metadata plugins. Metadata can come from anywhere, but the most common use is to define it in document frontmatter.

For example, you can give your articles a `title` property, like this:

```md
## title: Doctors Hate Him! 10 Secrets to Lose Belly Fat Fast

This is a really interesting and insightful article, which is defintely not clickbait.
```

And then read it with a metadata plugin like this:

```ts
import type {MetadataPluginParams} from 'apocrypha';

export async function getTitle({frontmatter}: MetadataPluginParams) {
  return {title: frontmatter.title};
}
```

The return values of all of the metadata plugins are merged to create the article's metadata. One important limitation: metadata must be JSON-serializable.

The metadata is included in the response to the `useArticle` hook. It also supports an optional type parameter, so you can enforce type safety between your metadata plugins and the code that consumes the metadata they generate!

```ts
type Metadata = {
  title: string;
};

type PageProps = {
  path: string;
};

const Page = ({path}: PageProps) => {
  const article = useArticle<Metadata>(path);

  return <title>{article.metadata.title}</title>;
};
```

You can also do more exotic things with metadata plugins. For example, let's say you want to improve your site's performance by adding `<link rel=preload>` tags for all images on each page. You could write a metadata plugin that walks the document's Markdoc AST and extracts the image URLs:

```ts
import {AstWalker, type MetadataPluginparams} from 'apocrypha';

export async function getImages({ast}: MetadataPluginParams) {
  const images = AstWalker.findTags(ast, 'image').map(
    (node) => node.attributes.src,
  );

  if (images.length > 0) {
    return {images};
  }
}
```

Then, you could read the `images` array at runtime and add the necessary `<link>` tags.