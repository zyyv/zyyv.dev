---
date: 2024-12-02T00:00:00.000Z
description: UnoCSS@0.65.0 版本带来了异步引擎，增强了可扩展性，支持异步预设。此次更新包括了 bug 修复、新特性和优化。加入 unocss-community，分享和推广预设和转换器。
title: UnoCSS@0.65.0 升级指南
tags:
  - UnoCSS
---

Hi, 各位 Unoer，你们好！

## UnoCSS 0.65.0 发布

我们发布了 UnoCSS\@0.65.0 版本，这个版本在 bug 修复的基础上，增加了一些新特性，以及对一些特性进行了优化。下面是本次更新的详细内容：

### Async UnoCSS Engine

从 0.65.0 版本开始，UnoCSS 引擎从创建到解析过程中，都是异步的，这极大的增强了 UnoCSS 的扩展性。

<https://github.com/unocss/unocss/pull/4268>

`new UnoGenerator` 已弃用，将不再作为推荐的使用方式，强行使用会抛出错误 ❌

```bash
`new UnoGenerator()` is deprecated, please use `createGenerator()` instead
```

而是推荐使用 `createGenerator` 创建你的 UnoCSS 引擎。

```ts
const uno = await createGenerator(userConfig) // ✅
```

> 如果你是预设或者转换器的开发者，你可能会在测试文件更改你的代码，以适应新的异步引擎。

```ts
{
  uno: import('@unocss/preset-uno').then(m => m.presetUno),
  attributify: import('@unocss/preset-attributify').then(m => m.presetAttributify),
  // icons: import('@unocss/preset-icons').then(m => m.presetIcons),
}
```

得益于异步的引擎，我们在 <https://github.com/unocss/unocss/pull/4294> 支持了异步预设，这是一项壮举 🚀，你现在可以在预设中使用异步函数。

例如：

```ts [uno.config.ts] {3-4}
const uno = await createGenerator({
  presets: [
    async () => {
      await new Promise((r) => setTimeout(r, 100))
      return {
        name: 'foo',
        rules: [
          ['foo', { name: 'bar1' }],
          ['foo', { name: 'bar2' }],
        ],
      }
    },
  ],
})
```

如果你想集成一个多合一的预设，那么此异步预设将会是你的最佳选择。

```ts [uno.config.ts]
{
  uno: import('@unocss/preset-uno').then(m => m.presetUno),
  attributify: import('@unocss/preset-attributify').then(m => m.presetAttributify),
  icons: import('@unocss/preset-icons').then(m => m.presetIcons),
}
```

你可以在使用时按需使用你使用到的预设，参考社区预设[unocss-preset-zyyv](https://github.com/unpreset/unocss-preset-zyyv/blob/6cf6a41a222b223e9f5f708cf99c00cf026bf8a4/packages/core/src/resolve.ts#L53-L63)

### mutiple result variant

起初只是为了解决 `marker`、`selection` varaint 问题，但由于现阶段的 variant 的设计，我们需要对 variant 进行多结果的支持。

于是在 <https://github.com/unocss/unocss/pull/4291> 进行了改进，现在你可以在 variant 中返回多个结果。

```ts [uno.config.ts]
const uno = await createGenerator({
  rules: [
    ['text-red', { color: 'red' }],
    ['text-green', { color: 'green' }],
  ],
  variants: [
    {
      name: 'foo',
      multiPass: false,
      match: (matcher) => {
        if (matcher.startsWith('v-')) {
          return [
            {
              matcher: matcher.slice(2), // variant result 1
            },
            {
              matcher: matcher.slice(2).replace('red', 'green'), // variant result 2
            },
            // ... and more results
          ]
        }
      },
    },
  ],
})
```

将会生成：

```css [__uno.css]
/* uno.generate('v-text-red') */
.v-text-red {
  color: red;
}
.v-text-red {
  color: green;
}
```

一般情况下，utilities 伴随着多个 variant, 但对于多结果的 variant，它的解析是成指数级增长的，这非常耗费性能。

因此我们决定在使用 mutiple result variant 时，请确保改 variant 关闭了 `multiPass`, 防止进行下一轮的解析。

惊喜，我们发现它额外的支持了一个 UnoCSS 长久的问题，这是一个意外的收获 🎉

```html [index.html]
<!-- 在 0.65.0 之前 -->
<div border="red:10" />
❌

<!-- 在 0.65.0 之后 -->
<div border="red:10" />
✅
```

之前我们在属性模式下，就像支持 `text="hover:blue"` 会被解析为 `hover:text-blue` 一样 解析变体时，`border="red:10"` 会被解析为 `red:border-10`，因为我们不确定 variant 的载体是什么。

由于支持多变体结果，我们会尽可能的解析这种情况，并生成正确的结果。

<https://github.com/unocss/unocss/pull/4295>

### On-demand Preflights

在 UnoCSS 的岁月中，我们听到用户的反馈和困惑，这段 css 到底有什么用？即使我没有使用其中任何的 css变量，它也会生成。

<details>

<summary>Preflights by default</summary>

```css
/* layer: preflights */
*,
::before,
::after {
  --un-rotate: 0;
  --un-rotate-x: 0;
  --un-rotate-y: 0;
  --un-rotate-z: 0;
  --un-scale-x: 1;
  --un-scale-y: 1;
  --un-scale-z: 1;
  --un-skew-x: 0;
  --un-skew-y: 0;
  --un-translate-x: 0;
  --un-translate-y: 0;
  --un-translate-z: 0;
  /* ... */
}
```

</details>

这是由于在 `preset-uno` 中的规则，它们依赖这些 css 变量，为了能够正确的应用你的样式，我们需要提前生成这些 css 变量。

但是，现在！

在 0.65.0 版本中，我们支持了 on-demand preflights，我们在规则上提前添加了对 preflights 的依赖，它只会按需生成有所依赖的 preflights。

```ts [uno.config.ts]
;[
  presetUno({
    preflights: 'on-demand', // enable on-demand preflights
  }),
]
```

<https://github.com/unocss/unocss/pull/4252>

### 预解析 icon-set

`preset-icons` 会自动检测的 icon-set，并自动为你安装对应的 icon-set 集合

但对于自定义的 icon-set，在此之前也会自动检测，这是不必要的，因此我们在 0.65.0 版本中增加了对自动检测的 icon-set 集合进行过滤，筛选掉用户自定义的 icon 集合。

<https://github.com/unocss/unocss/pull/4278>

### Layer css order

如果你开启了 `outputCssLayers` 选项，生成的 css 将会按照 layer 的顺序进行排序。

```ts [uno.config.ts]
{
  outputCssLayers: true,
}
```

在 0.65.0 版本中，我们会在顶部生成layer 的排序结果，以便于你查看。

```css
@layer shortcuts, default;
```

<https://github.com/unocss/unocss/pull/4299>

以上是一些主要的更新，更多的更新请查看 [CHANGELOG](https://github.com/unocss/unocss/releases)。

感谢您对 UnoCSS 的关注，玩的开心！🎉
