export interface D1Result<T = unknown> {
  results?: T[]
  success: boolean
  meta?: { changes?: number }
}

export interface D1Statement {
  bind(...values: unknown[]): D1Statement
  first<T = Record<string, unknown>>(): Promise<T | null>
  all<T = Record<string, unknown>>(): Promise<D1Result<T>>
  run(): Promise<D1Result>
}

export interface D1DatabaseBinding {
  prepare(query: string): D1Statement
  batch<T = unknown>(statements: D1Statement[]): Promise<D1Result<T>[]>
}

export interface R2ObjectBody {
  body: ReadableStream<Uint8Array>
  httpEtag: string
  httpMetadata?: { contentType?: string; cacheControl?: string }
}

export interface R2BucketBinding {
  get(key: string): Promise<R2ObjectBody | null>
  put(
    key: string,
    value: ArrayBuffer | ArrayBufferView | Blob | ReadableStream,
    options?: {
      httpMetadata?: { contentType?: string; cacheControl?: string }
    },
  ): Promise<unknown>
  delete(keys: string | string[]): Promise<void>
}

export interface ImagesOutput {
  response(): Response
}

export interface ImagesTransformer {
  transform(options: {
    width?: number
    fit?: 'scale-down' | 'contain' | 'cover'
  }): ImagesTransformer
  output(options: { format: string; quality?: number; anim?: boolean }): Promise<ImagesOutput>
}

export interface ImagesBinding {
  input(image: ArrayBuffer | ArrayBufferView | ReadableStream): ImagesTransformer
  info(image: ArrayBuffer | ArrayBufferView | ReadableStream): Promise<{
    width: number
    height: number
    format: string
    fileSize?: number
  }>
}

export interface CloudflareBindings {
  DB: D1DatabaseBinding
  PHOTOS: R2BucketBinding
  IMAGES: ImagesBinding
  NUXT_ADMIN_PASSWORD?: string
  NUXT_SESSION_SECRET?: string
}
