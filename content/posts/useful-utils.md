---
date: 2024-12-31T12:12:12.000Z
title: My Useful Utils Collection
description: A collection of useful utils that I use in my daily life.
tags:
  - TypeScript
  - Utils
lang: zh-cn
---

> 一些我在日常开发中使用的实用工具函数的集合。`PR` 欢迎补充更多实用工具函数。

## CreateFilter

创建一个过滤器，代码收集来源于 [UnoCSS](https://github.com/unocss/unocss)。

```ts [types.ts]
export type FilterPattern = Array<string | RegExp> | string | RegExp | null
```

```ts [util.ts]
function createFilter(
  include: FilterPattern,
  exclude: FilterPattern,
): (id: string) => boolean {
  const includePattern = toArray(include || [])
  const excludePattern = toArray(exclude || [])
  return (id: string) => {
    if (excludePattern.some(p => id.match(p)))
      return false
    return includePattern.some(p => id.match(p))
  }
}
```

## Events

```ts [type.ts]
type EventsMap = Record<string, any>

interface DefaultEvents extends EventsMap {
  [event: string]: (...args: any) => void
}

export interface Unsubscribe {
  (): void
}

export declare class Emitter<Events extends EventsMap = DefaultEvents> {
  /**
   * Event names in keys and arrays with listeners in values.
   *
   * ```js
   * emitter1.events = emitter2.events
   * emitter2.events = { }
   * ```
   */
  events: Partial<{ [E in keyof Events]: Events[E][] }>

  /**
   * Add a listener for a given event.
   *
   * ```js
   * const unbind = ee.on('tick', (tickType, tickDuration) => {
   *   count += 1
   * })
   *
   * disable () {
   *   unbind()
   * }
   * ```
   *
   * @param event The event name.
   * @param cb The listener function.
   * @returns Unbind listener from event.
   */
  on<K extends keyof Events>(this: this, event: K, cb: Events[K]): Unsubscribe

  /**
   * Calls each of the listeners registered for a given event.
   *
   * ```js
   * ee.emit('tick', tickType, tickDuration)
   * ```
   *
   * @param event The event name.
   * @param args The arguments for listeners.
   */
  emit<K extends keyof Events>(
    this: this,
    event: K,
    ...args: Parameters<Events[K]>
  ): void
}
```

```ts [util.ts]
export function createNanoEvents<Events extends EventsMap = DefaultEvents>(): Emitter<Events> {
  return {
    events: {},
    emit(event, ...args) {
      (this.events[event] || [] as any).forEach((i: any) => i(...args))
    },
    on(event, cb) {
      (this.events[event] = this.events[event] || [] as any).push(cb)
      return () =>
        (this.events[event] = (this.events[event] || [] as any).filter((i: any) => i !== cb))
    },
  }
}
```

## Object

### Clone

#### Deep Clone

```ts [util.ts]
export function deepClone(origin: unknown): unknown {
  if (isArray(origin))
    return origin.map(child => deepClone(child))

  if (isObject(origin)) {
    return Object.fromEntries(
      Object.entries(origin).map(([k, v]) => [k, deepClone(v)]),
    )
  }

  return origin
}
```

#### Deep Clone with Circular Reference

```ts [util.ts]
export function deepClone(origin: any, map: WeakMap<WeakKey, any> = new WeakMap()): any {
  if (isObject(origin)) {
    if (map.has(origin))
      return map.get(origin)

    const target: any = isArray(origin) ? [] : {}
    map.set(origin, target)

    Object.entries(origin).forEach(([k, v]: [string, any]) => {
      if (isRegExp(v))
        target[k] = new RegExp(v)
      else if (isDate(v))
        target[k] = new Date(v)
      else
        target[k] = deepClone(v, map)
    })
    return target
  }
  return origin
}
```

### Merge

```ts [util.ts]
export function deepMerge<T>(original: T, patch: DeepPartial<T>): T {
  const o = original as any
  const p = patch as any

  if (isArray(o) && isArray(p))
    return [...o, ...p] as any

  if (isArray(o))
    return [...o] as any

  const output = { ...o }
  if (isObject(o) && isObject(p)) {
    Object.keys(p).forEach((key) => {
      if (isObject(p[key])) {
        if (!(key in o))
          Object.assign(output, { [key]: p[key] })
        else
          output[key] = deepMerge(o[key], p[key])
      }
      else {
        Object.assign(output, { [key]: p[key] })
      }
    })
  }
  return output
}
```

## Array

### Chunk

将数组均分多个数组。

```ts [util.ts]
export function chunk<T>(arr: T[], size: number): T[][] {
  const result: T[][] = []
  for (let i = 0; i < arr.length; i += size)
    result.push(arr.slice(i, i + size))

  return result
}
```

### Uniq

```ts [util.ts]
export function uniqueBy<T>(array: readonly T[], equalFn: (a: T, b: T) => boolean): T[] {
  return array.reduce((acc: T[], cur: T) => {
    const index = acc.findIndex((item: T) => equalFn(cur, item))
    if (index === -1)
      acc.push(cur)
    return acc
  }, [])
}
```
