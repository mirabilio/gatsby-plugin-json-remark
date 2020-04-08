<p align="center">
  <a href="https://www.gatsbyjs.org">
    <img alt="Gatsby" src="https://www.gatsbyjs.org/monogram.svg" width="60" />
  </a>
</p>
<h1 align="center">
  gatsby-plugin-json-remark
</h1>

[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)

`gatsby-plugin-json-remark` is a [GatsbyJs](https://www.gatsbyjs.org) plugin that transforms markdown content from JSON files. The new MarkdownRemark nodes are placed inside the original `gatsby-transformer-json` node tree. Transformed HTML is also populated in new node properties as the original JSON key names appended with "Html".

This plugin piggybacks off of the existing `gatsby-transformer-remark` plugin configuration in `gatsby-config.json` and honors all additional parsing provided by its sub-plugins (e.g. `gatsby-remark-prismjs`). This is accomplished on the *Html fields by retrieving the HTML from the MarkdownRemark nodes' own `html` resolvers.

The ability to place markdown in structured JSON files comes in handy for CMS software that stores its content inside JSON files. In [TinaCMS](https://tinacms.org/) for example, `gatsby-plugin-json-remark` can be used to embed markdown in the structured page content using [TinaCMS' markdown blocks feature](https://tinacms.org/docs/fields/blocks).

> Please create an issue for question, bug, idea, etc. If this plugin doesn't fit your particular use case but you feel that it should, please open an issue to request the new feature. PRs welcome 👍.

**Note**: It is recommended to use `gatsby-remark-remove-root-p-tag` in tandem with this plugin. `gatsby-transformer-remark` will often automatically wrap a paragraph node around markdown snippets, resulting in an unintended `<p>` tag wrapping the transformed HTML. `gatsby-remark-remove-root-p-tag` will remove the paragraph parent from the markdown AST. 

## Install

Add `gatsby-plugin-json-remark` package to your gatsby project:

npm

```shell
npm i gatsby-plugin-json-remark
```

yarn

```shell
yarn add gatsby-plugin-json-remark
```

## Configure

Add plugin to the `gatsby-plugin-json-remark` plugins array in your `gatsby-config.js`:

```javascript
module.exports = {
  plugins: [
    // ...
    {
      resolve: `gatsby-plugin-json-remark`,
      options: {
        paths: [`${__dirname}/content/pages`, `${__dirname}/content/json-markdown`], // Process all JSON files in these directories.
        pathsExclude: [`${__dirname}/content/pages/contact.json`], // Process all files in the directories above, except `pages/contact.json`.
        fieldNameBlacklist: ['id', 'children', 'parent', 'fields', 'internal', 'path', 'template'],
      },
    },
    // ...
  ]
}
```

Optional: add `gatsby-remark-remove-root-p-tag` as a sub-plugin to `gatsby-transformer-remark' to remove unwanted HTML paragraph tags from the generaged HTML.

```javascript
module.exports = {
  plugins: [
    // ...
    {
      resolve: `gatsby-transformer-remark`,
      options: {
        plugins: [
          {
            resolve: `gatsby-remark-remove-root-p-tag`,
            options: {
              parents: ["gatsby-plugin-json-remark", "default-site-plugin"] // Required: will process only the MarkdownRemark nodes created by these plugins
            }
          },
        ]
      }
    }
    // ...
  ]
}
```

## Options

### `paths` (required)
Values can be JSON file paths or directory paths. The plugin will only process these files and directories. **Note:** see requirements below.

### `pathsExclude` (optional)
Values can be JSON file paths or directory paths which serve as exceptions to the `paths` option. The plugin will ignore the files and directories provided here, even if they are configured with the `paths` option. This option is handy when a directory is configured with the `paths` option but certain files in that directory should be ignored.

### `fieldNameBlacklist` (optional / recommended)
A list of JSON keys that will be ignored in the source JSON files. This is useful for preventing conflicts with the reserved property names of the [Gatsby node data structure](https://www.gatsbyjs.org/docs/node-interface/).

## Requirements

### `gatsby-config.js` Dependencies

+ `gatsby-transformer-remark` 
+ `gatsby-source-filesystem` *Configured with at least one directory containing JSON files. The `gatsby-plugin-json-remark` `paths` option must contain at least a directory or a file that is also configured with `gatsby-source-filesystem`.* Otherwise, there will be no JSON nodes to process.

### Environment
+ Node >=12.16.1
+ Gatsby v2