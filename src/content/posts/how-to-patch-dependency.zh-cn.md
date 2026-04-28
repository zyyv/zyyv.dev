---
date: 2024-12-06T00:00:00.000Z
description: 快速上手使用 Pnpm Patch 和 Pkg.pr.new 修复依赖项错误
title: 如何快速修复依赖项错误
tags:
  - Pnpm
  - Patch
  - Pkg.pr.new
lang: zh-cn
---

在开发中，我们可能会遇到第三方依赖项中的错误。通常情况下，我们需要等待库的维护者合并我们的 PR，然后发布新版本。但是，这个过程可能需要很长时间。

为了解决这个问题，我们可以使用 `pnpm patch` 和 `pkg.pr.new` 来快速修复依赖项中的错误。让我们来一探究竟吧！

## Pnpm Patch

`pnpm patch` 命令 是一个 [`pnpm`](https://pnpm.io/) 下强大的 hot fix 指令，允许您对依赖项及时应用补丁，而不需要等待⌛️。本文将解释如何使用 `pnpm patch` 来修复依赖项中的错误。

### 什么是 Pnpm Patch？

Pnpm patch 是一个用于修复依赖项的工具。它允许您在不更改依赖项源代码的情况下修复依赖项中的错误。这对于修复第三方库中的错误非常有用，因为您不需要等待库的维护者合并您的 PR。

### 如何使用 Pnpm Patch？

例如，假设您的依赖项`pkg-foo`中有一个错误，您想要修复它。

```json [package.json] {3}
{
  "dependencies": {
    "pkg-foo": "^1.0.0" // Something is wrong with this package
  }
}
```

那我们需要使用 `pnpm patch`，您需要创建一个包含要应用的补丁的文件。

```bash [Terminal]
pnpm patch pkg-foo@1.0.0
```

你将会得到一个类似这样的输出：

```bash [Terminal]
Patch: You can now edit the package at:

  /Users/xxx/your_project_name/node_modules/.pnpm_patches/pkg-foo@1.0.0

To commit your changes, run:

  pnpm patch-commit '/Users/xxx/your_project_name/node_modules/.pnpm_patches/pkg-foo@1.0.0
```

于是你可以在你的 `node_modules` 下看到一个新的 `.pnpm_patches` 文件夹，里面包含了你的补丁文件。并且这份输出还告诉你如何提交你的补丁。

```bash [Terminal]
your_project_name/
└─ node_modules/
    └─ .pnpm_patches/
        └─ pkg-foo@1.0.0/
             └─ xxx
```

于是你可以开始更新你的补丁文件了。

(✧∀✧) ～～ (✪▽✪)

A long time later...

 ٩(•̤̀ᵕ•̤́๑)ᵒᵏᵎᵎᵎᵎ

你解决了`pkg-foo`的问题，现在你需要提交你的补丁。

```bash [Terminal]
pnpm patch-commit '/Users/xxx/your_project_name/node_modules/.pnpm_patches/pkg-foo@1.0.0'
```

OK，现在你的补丁已经提交了，您可以继续使用您的项目了。`pkg-foo`的依赖将会持续使用您的补丁的版本。与此同时，你可以在 `package.json` 中看到 `pnpm patch`的更改。

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

使用 `pkg.pr.new`，您的每个提交和拉取请求都将触发即时预览版本，**而无需向 `npm` 发布任何内容**。这使用户能够使用 pnpm 或拉取请求合并来访问功能和错误修复，而无需等待发布周期。

### 如何使用 Pkg.pr.new？

首先为你的仓库安装 `pkg.pr.new` 的 [Github App](https://github.com/apps/pkg-pr-new)。

`pkg.pr.new` 对 `CI` 集成非常友好。例如 `GitHub Actions`，您可以在 `workflow` 中添加以下步骤：

举例来说，你可以在你的 `workflow` 中添加以下步骤：

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

这样便设置成功啦！现在您可以在您的拉取/请求中看到即时预览版本。

例如，你可能会看到这样的输出：
  
```bash [Terminal]
pnpm add https://pkg.pr.new/pkg-foo@d051732
```

现在您可以使用 `pnpm add` 来安装您的即时预览版本。

## 总结

本文介绍了如何使用 `pnpm patch` 和 `pkg.pr.new` 来快速修复依赖项中的错误。通过 `pnpm patch`，我们可以在`node_modules`中更改依赖项源代码的情况下应用补丁，从而解决第三方库中的问题。`pkg.pr.new` 则允许我们在每次提交和拉取请求时生成即时预览版本，使用户能够在不发布到 `npm` 的情况下访问新功能和修复。这些工具大大提高了我们管理和修复项目依赖项问题的效率。
