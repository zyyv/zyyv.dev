---
date: 2024-12-02T00:00:00.000Z
description: UnoCSS@0.65.0 brings an asynchronous engine, enhancing extensibility and supporting asynchronous presets. The update includes bug fixes, new features, and optimizations. Join the unocss-community to share and promote presets and transformers.
title: UnoCSS@0.65.0 Upgrade Guide
tags:
  - UnoCSS
lang: en
---

Hi, Unoers!

We have released UnoCSS\@0.65.0. This version includes bug fixes, new features, and optimizations. Here are the details of this update:

### Async UnoCSS Engine

Starting from version 0.65.0, the UnoCSS engine is asynchronous from creation to parsing, greatly enhancing its extensibility.

<https://github.com/unocss/unocss/pull/4268>

`new UnoGenerator` is deprecated and will throw an error if used ❌

```bash
`new UnoGenerator()` is deprecated, please use `createGenerator()` instead
```

It is recommended to use `createGenerator` to create your UnoCSS engine.

```ts
const uno = await createGenerator(userConfig) // ✅
```

> If you are a unocss `preset` or `transformer` developer, you may need to update your test files to adapt to the new asynchronous engine.

Thanks to the asynchronous engine, we now support asynchronous presets, which is a significant achievement 🚀. You can now use asynchronous functions in presets.

For example:

```ts [uno.config.ts] {3-4}
const uno = await createGenerator({
  presets: [
    async () => {
      await new Promise(r => setTimeout(r, 100))
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

If you want to integrate an all-in-one preset, this asynchronous preset will be your best choice.

```ts [uno.config.ts]
{
  uno: import('@unocss/preset-uno').then(m => m.presetUno),
  attributify: import('@unocss/preset-attributify').then(m => m.presetAttributify),
  icons: import('@unocss/preset-icons').then(m => m.presetIcons),
}
```

You can use the presets you need on demand, refer to the community preset [unocss-preset-zyyv](https://github.com/unocss-community/unocss-preset-zyyv/blob/6cf6a41a222b223e9f5f708cf99c00cf026bf8a4/packages/core/src/resolve.ts#L53-L63)

### Multiple Result Variant

Initially, this was to solve the `marker` and `selection` variant issues, but due to the current design of variants, we needed to support multiple results for variants.

So, in <https://github.com/unocss/unocss/pull/4291>, we made improvements, and now you can return multiple results in a variant.

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

This will generate:

```css [__uno.css]
/* uno.generate('v-text-red') */
.v-text-red{color:red;}
.v-text-red{color:green;}
```

In general, utilities come with multiple variants, but for multiple result variants, their parsing grows exponentially, which is very performance-consuming.

Therefore, we decided to ensure that the variant has `multiPass` disabled when using multiple result variants to prevent further parsing.

Surprisingly, we found that it additionally supports a long-standing UnoCSS issue, which is an unexpected gain 🎉

```html [index.html]
<!-- Before 0.65.0 -->
<div border="red:10" /> ❌

<!-- After 0.65.0 -->
<div border="red:10" /> ✅
```

Previously, in attribute mode, just like supporting `text="hover:blue"` being parsed as `hover:text-blue`, when parsing variants, `border="red:10"` would be parsed as `red:border-10` because we were unsure of the variant's carrier.

With support for multiple variant results, we will try to parse such cases and generate the correct results.

<https://github.com/unocss/unocss/pull/4295>

### On-demand Preflights

During the years of UnoCSS, we heard user feedback and confusion about what this CSS is for. Even if I didn't use any of the CSS variables, it would still generate.

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

This is due to the rules in `preset-uno`, which rely on these CSS variables. To correctly apply your styles, we need to generate these CSS variables in advance.

But now!

In version 0.65.0, we support on-demand preflights. We have added dependencies on preflights to the rules in advance, and it will only generate the preflights that are needed.

```ts [uno.config.ts]
[
  presetUno({
    preflights: 'on-demand', // enable on-demand preflights
  })
]
```

<https://github.com/unocss/unocss/pull/4252>

### Pre-parsing icon-set

`preset-icons` will automatically detect the icon-set and automatically install the corresponding icon-set collection for you.

But for custom icon-sets, it would also automatically detect them before, which was unnecessary. Therefore, in version 0.65.0, we added filtering for automatically detected icon-sets to exclude user-defined icon sets.

<https://github.com/unocss/unocss/pull/4278>

### Layer CSS Order

If you enable the `outputCssLayers` option, the generated CSS will be sorted according to the order of the layers.

```ts [uno.config.ts]
{
  outputCssLayers: true,
}
```

In version 0.65.0, we will generate the layer sorting results at the top for you to view.

```css
@layer shortcuts, default;
```

<https://github.com/unocss/unocss/pull/4299>

---

These are some of the main updates. For more updates, please check the [CHANGELOG](https://github.com/unocss/unocss/releases).

Thanks to antfu for providing endless possibilities for the upgrade and transformation of the engine, and to all the contributors to UnoCSS, thank you for your contributions!

Thank you for your attention to UnoCSS, have fun! 🎉

### One more thing !

We plan to make [unocss-community](https://github.com/unocss-community) the official community of UnoCSS, where you can find more community presets and transformers.

Feel free to submit your presets and transformers to unocss-community organization, and we will help you promote them. Welcome to join us! 🚀
