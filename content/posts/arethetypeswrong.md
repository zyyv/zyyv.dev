---
date: 2024-12-12T00:00:00.000Z
description: Analyzing TypeScript types of npm packages
title: Are the types wrong?
tags:
  - Pnpm
  - Attw
lang: en
---

Special thanks to [@userquin](https://github.com/userquin) for his help and his [PR](https://github.com/unocss/unocss/pull/4322) inspired me to write this article.

> Concise and to the point. If there are any inaccuracies, please correct me. Also, refer to the official documentation [arethetypeswrong](https://github.com/arethetypeswrong/arethetypeswrong.github.io)  

## What is `arethetypeswrong`?

`arethetypeswrong` (abbreviated as `attw` below) is a tool for analyzing TypeScript types of npm packages. By analyzing the type definition files of npm packages, `attw` finds problems in them and provides suggestions for fixing them. The goal of `attw` is to help developers better understand the type definitions of npm packages and improve code quality.

It can help you analyze and detect the following problems:

- [💀 Resolution failed](https://github.com/arethetypeswrong/arethetypeswrong.github.io/blob/main/docs/problems/NoResolution.md)
- [❌ No types](https://github.com/arethetypeswrong/arethetypeswrong.github.io/blob/main/docs/problems/UntypedResolution.md)
- [🎭 Masquerading as CJS](https://github.com/arethetypeswrong/arethetypeswrong.github.io/blob/main/docs/problems/FalseCJS.md)
- [👺 Masquerading as ESM](https://github.com/arethetypeswrong/arethetypeswrong.github.io/blob/main/docs/problems/FalseESM.md)
- [⚠️ ESM (dynamic import only)](https://github.com/arethetypeswrong/arethetypeswrong.github.io/blob/main/docs/problems/CJSResolvesToESM.md)
- [🐛 Used fallback condition](https://github.com/arethetypeswrong/arethetypeswrong.github.io/blob/main/docs/problems/FallbackCondition.md)
- [🤨 CJS default export](https://github.com/arethetypeswrong/arethetypeswrong.github.io/blob/main/docs/problems/CJSOnlyExportsDefault.md)
- [❗️ Incorrect default export](https://github.com/arethetypeswrong/arethetypeswrong.github.io/blob/main/docs/problems/FalseExportDefault.md)
- [❓ Missing `export =`](https://github.com/arethetypeswrong/arethetypeswrong.github.io/blob/main/docs/problems/MissingExportEquals.md)
- [🚭 Unexpected module syntax](https://github.com/arethetypeswrong/arethetypeswrong.github.io/blob/main/docs/problems/UnexpectedModuleSyntax.md)
- [🥴 Internal resolution error](https://github.com/arethetypeswrong/arethetypeswrong.github.io/blob/main/docs/problems/InternalResolutionError.md)
- [🕵️‍♂️ Named exports](https://github.com/arethetypeswrong/arethetypeswrong.github.io/blob/main/docs/problems/NamedExports.md)

## How to use `arethetypeswrong`?

You can use it online at https://arethetypeswrong.github.io/ or use the CLI tool in your project.

```bash
pnpm i -D @arethetypeswrong/cli
```

使用 `attw --pack` 检查单个包，在您的`scripts`中添加：

Use `attw --pack` to check a single package, add it to your `scripts`:

```json [package.json]
{
  "scripts": {
    "attw": "attw --pack"
  }
}
```

Or without installing, use `npx` directly:

```bash
npx --yes @arethetypeswrong/cli
```

Check packages from `npm`:

```bash
npx --yes @arethetypeswrong/cli --from-npm @arethetypeswrong/cli
```

## Configuration

`attw` supports a JSON config file (by default named `.attw.json`) which allows you to pre-set the command line arguments. The options are a one-to-one mapping of the command line flags, changed to camelCase, and are all documented in their relevant `Options` section below.

### Options

#### Help

Show help information and exit.

In the CLI: `--help`, `-h`

```bash
attw --help
```

#### Version

Print the current version of `attw` and exit.

In the CLI: `--version`, `-v`

```bash
attw --version
```

### Pack

Specify a directory to run `npm pack` in (instead of specifying a tarball filename), analyze the resulting tarball, and delete it afterwards.

```bash
attw --pack .
```

#### From NPM

Specify the name (and, optionally, version or SemVer range) of a package from the NPM registry instead of a local tarball filename.

In the CLI: `--from-npm`, `-p`

```bash
attw --from-npm <package-name>
```

In the config file, `fromNpm` can be a boolean value.

#### DefinitelyTyped

When a package does not contain types, specifies the version or SemVer range of the DefinitelyTyped `@types` package to use. Defaults to inferring the best version match from the implementation package version.

In the CLI: `--definitely-typed`, `--no-definitely-typed`

```bash
attw -p <package-name> --definitely-typed <version>
attw -p <package-name> --no-definitely-typed
```

#### Format

The format to print the output in. Defaults to `auto`.

The available values are:

- `table`, where columns are entrypoints and rows are resolution kinds
- `table-flipped`, where columns are resolution kinds and rows are entrypoints
- `ascii`, for large tables where the output is clunky
- `auto`, which picks whichever of the above best fits the terminal width
- `json` outputs the raw JSON data (overriding all other rendering options)

In the CLI: `--format`, `-f`

```bash
attw --format <format> <file-name>
```

In the config file, `format` can be a string value.

#### Entrypoints

`attw` automatically discovers package entrypoints by looking at package.json `exports` and subdirectories with additional package.json files. In a package lacking `exports`, providing the `--entrypoints-legacy` option will include all published code files. This automatic discovery process can be overridden with the `--entrypoints` option, or altered with the `--include-entrypoints` and `--exclude-entrypoints` options:

```bash
attw --pack . --entrypoints . one two three    # Just ".", "./one", "./two", "./three"
attw --pack . --include-entrypoints added      # Auto-discovered entrypoints plus "./added"
attw --pack . --exclude-entrypoints styles.css # Auto-discovered entrypoints except "./styles.css"
attw --pack . --entrypoints-legacy             # All published code files
```

#### Profiles

Profiles select a set of resolution modes to require/ignore. All are evaluated but failures outside of those required are ignored.

The available profiles are:

- `strict` - requires all resolutions
- `node16` - ignores node10 resolution failures
- `esm-only` - ignores CJS resolution failures

In the CLI: `--profile`

```bash
attw <file-name> --profile <profile>
```

In the config file, `profile` can be a string value.

#### Ignore Rules

Specifies rules/problems to ignore (i.e. not raise an error for).

The available values are:

- `no-resolution`
- `untyped-resolution`
- `false-cjs`
- `false-esm`
- `cjs-resolves-to-esm`
- `fallback-condition`
- `cjs-only-exports-default`
- `false-export-default`
- `unexpected-module-syntax`
- `missing-export-equals`
- `internal-resolution-error`
- `named-exports`

In the CLI: `--ignore-rules`

```bash
attw <file-name> --ignore-rules <rules...>
```

In the config file, `ignoreRules` can be an array of strings. For example, to ignore `no-resolution` and `untyped-resolution` in config file:

```json [.attw.json]
{
  "ignoreRules": ["no-resolution", "untyped-resolution"]
}
```

#### Summary/No Summary

Whether to display a summary of what the different errors/problems mean. Defaults to showing the summary (`--summary`).

In the CLI: `--summary`/`--no-summary`

```bash
attw --summary/--no-summary <file-name>
```

In the config file, `summary` can be a boolean value.

#### Emoji/No Emoji

Whether to print the information with emojis. Defaults to printing with emojis (`--emoji`).

In the CLI: `--emoji`/`--no-emoji`

```bash
attw --emoji/--no-emoji <file-name>
```

In the config file, `emoji` can be a boolean value.

#### Color/No Color

Whether to print with colors. Defaults to printing with colors (`--color`).

The `FORCE_COLOR` env variable is also available for use (set is to `0` or `1`).

In the CLI: `--color`/`--no-color`

```bash
attw --color/--no-color <file-name>
```

In the config file, `color` can be a boolean value.

#### Quiet

When set, nothing will be printed to STDOUT.

In the CLI: `--quiet`, `-q`

```bash
attw --quiet <file-name>
```

In the config file, `quiet` can be a boolean value.

#### Config Path

The path to the config file. Defaults to `./.attw.json`.

In the CLI: `--config-path <path>`

```bash
attw --config-path <path> <file-name>
```

Cannot be set from within the config file itself.
