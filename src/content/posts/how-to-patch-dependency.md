---
date: 2024-12-06T00:00:00.000Z
description: Quick start guide to fixing dependency errors using Pnpm Patch and Pkg.pr.new
title: How to Quickly Fix Dependency Errors
tags:
  - Pnpm
  - Patch
  - Pkg.pr.new
lang: en
---

In development, we may encounter errors in third-party dependencies. Usually, we need to wait for the library maintainers to merge our PR and then release a new version. However, this process can take a long time.

To solve this problem, we can use `pnpm patch` and `pkg.pr.new` to quickly fix errors in dependencies. Let's take a closer look!

## Pnpm Patch

The `pnpm patch` command is a powerful hot fix command under [`pnpm`](https://pnpm.io/), allowing you to apply patches to dependencies in a timely manner without waiting⌛️. This article will explain how to use `pnpm patch` to fix errors in dependencies.

### What is Pnpm Patch?

Pnpm patch is a tool for fixing dependencies. It allows you to fix errors in dependencies without changing the source code of the dependencies. This is very useful for fixing errors in third-party libraries because you don't have to wait for the library maintainers to merge your PR.

### How to Use Pnpm Patch?

For example, suppose there is an error in your dependency `pkg-foo` and you want to fix it.

```json [package.json] {3}
{
  "dependencies": {
    "pkg-foo": "^1.0.0" // Something is wrong with this package
  }
}
```

To use `pnpm patch`, you need to create a file containing the patch to be applied.

```bash [Terminal]
pnpm patch pkg-foo@1.0.0
```

You will get an output like this:

```bash [Terminal]
Patch: You can now edit the package at:

  /Users/xxx/your_project_name/node_modules/.pnpm_patches/pkg-foo@1.0.0

To commit your changes, run:

  pnpm patch-commit '/Users/xxx/your_project_name/node_modules/.pnpm_patches/pkg-foo@1.0.0
```

You will see a new `.pnpm_patches` folder under your `node_modules`, containing your patch file. The output also tells you how to commit your patch.

```bash [Terminal]
your_project_name/
└─ node_modules/
    └─ .pnpm_patches/
        └─ pkg-foo@1.0.0/
             └─ xxx
```

You can start updating your patch file.

(✧∀✧) ～～ (✪▽✪)

A long time later...

٩(•̤̀ᵕ•̤́๑)ᵒᵏᵎᵎᵎᵎ

You have fixed the issue with `pkg-foo`, now you need to commit your patch.

```bash [Terminal]
pnpm patch-commit '/Users/xxx/your_project_name/node_modules/.pnpm_patches/pkg-foo@1.0.0'
```

OK, now your patch is committed, and you can continue using your project. The dependency `pkg-foo` will continue to use your patched version. Meanwhile, you can see the changes of `pnpm patch` in `package.json`.

```json [package.json]
{
  "pnpm": {
    "patchedDependencies": {
      "pkg-foo@1.0.0": "patches/pkg-foo@1.0.0.patch"
    }
  },
}
```

## Pkg.pr.new

With `pkg.pr.new`, each of your commits and pull requests will trigger an instant preview version, **without publishing anything to `npm`**. This allows users to access features and bug fixes using pnpm or pull request merges without waiting for the release cycle.

### How to Use Pkg.pr.new?

First, install the `pkg.pr.new` [Github App](https://github.com/apps/pkg-pr-new) for your repository.

`pkg.pr.new` is very CI-friendly. For example, with `GitHub Actions`, you can add the following steps to your `workflow`:

For example, you can add the following steps to your `workflow`:

```yml [.github/workflows/pkg.pr.new.yml]
name: Publish Any Commit

on:
  pull_request:
  push:
    branches:
      - '**'
    tags:
      - '!**'

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - run: corepack enable

      - name: Set node
        uses: actions/setup-node@v4
        with:
          node-version: lts/*
          cache: pnpm

      - name: Install
        run: pnpm install

      - name: Build
        run: pnpm build

      - name: Release
        run: pnpm dlx pkg-pr-new publish --compact --pnpm './packages/*'
```

Now it's set up! You can see instant preview versions in your pull requests.

For example, you might see an output like this:

```bash [Terminal]
pnpm add https://pkg.pr.new/pkg-foo@d051732
```

Now you can use `pnpm add` to install your instant preview version.

## Summary

This article introduced how to use `pnpm patch` and `pkg.pr.new` to quickly fix errors in dependencies. With `pnpm patch`, we can apply patches to dependencies without changing the source code in `node_modules`, thus solving issues in third-party libraries. `pkg.pr.new` allows us to generate instant preview versions for each commit and pull request, enabling users to access new features and fixes without publishing to `npm`. These tools greatly improve our efficiency in managing and fixing project dependency issues.
