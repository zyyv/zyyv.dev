import type { ComputedRef, ShallowRef } from 'vue'
import type { Draw, Effect, Gpu, StorageBuffer, Surface, Texture } from 'vgpu'
import type { Photo } from '~/types'
import { draw, effect, frame, init, sampler, storage, surface } from 'vgpu'
import { hashFraction } from '~/utils/shuffle'

const MAX_PHOTOS = 24
const TEXTURE_SIZE = 512
const ITEM_FLOATS = 8

const TUNNEL_BACKGROUND_SHADER = /* wgsl */ `
struct Params {
  resolution: vec2f,
  progress: f32,
  darkMode: f32,
}

@group(0) @binding(0) var<uniform> params: Params;

fn hash21(value: vec2f) -> f32 {
  return fract(sin(dot(value, vec2f(127.1, 311.7))) * 43758.5453);
}

@fragment fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let centered = uv - vec2f(0.5);
  let aspect = params.resolution.x / max(params.resolution.y, 1.0);
  let point = vec2f(centered.x * aspect, centered.y);
  let radius = length(point);
  let angle = atan2(point.y, point.x);
  let expansion = mix(0.55, 2.8, params.progress);
  let ray = 1.0 - smoothstep(0.0, 0.028, abs(fract(angle * 8.8 / 6.28318 + 0.5) - 0.5));
  let rayMask = smoothstep(0.06, 0.24, radius) * (1.0 - smoothstep(0.72, 1.1, radius));

  let dustCell = floor((point / max(0.32 + params.progress * 0.7, 0.01) + vec2f(2.0)) * 34.0);
  let dustRandom = hash21(dustCell);
  let dustPoint = (fract((point / max(0.32 + params.progress * 0.7, 0.01) + vec2f(2.0)) * 34.0) - 0.5);
  let dust = (1.0 - smoothstep(0.018, 0.085, length(dustPoint))) * step(0.89, dustRandom);

  let core = (1.0 - smoothstep(0.055 * expansion, 0.17 * expansion, radius))
    * smoothstep(0.018 * expansion, 0.07 * expansion, radius);
  let alpha = ray * rayMask * 0.075 + dust * 0.16 + core * 0.09;
  let tone = mix(vec3f(0.08, 0.085, 0.08), vec3f(0.82, 0.83, 0.80), params.darkMode);
  return vec4f(tone * alpha, alpha);
}
`

const PHOTO_TUNNEL_SHADER = /* wgsl */ `
struct Params {
  resolution: vec2f,
  progress: f32,
  darkMode: f32,
}

struct PhotoItem {
  placement: vec4f,
  motion: vec4f,
}

@group(0) @binding(0) var<uniform> params: Params;
@group(0) @binding(1) var<storage, read> items: array<PhotoItem>;
@group(0) @binding(2) var photos: texture_2d_array<f32>;
@group(0) @binding(3) var photoSampler: sampler;

struct VertexOutput {
  @builtin(position) position: vec4f,
  @location(0) photoUv: vec2f,
  @location(1) opacity: f32,
  @location(2) blur: f32,
  @location(3) @interpolate(flat) layer: u32,
}

@vertex fn vs_main(
  @builtin(vertex_index) vertexIndex: u32,
  @builtin(instance_index) instanceIndex: u32,
) -> VertexOutput {
  let corners = array<vec2f, 6>(
    vec2f(-1.0, -1.0), vec2f(1.0, -1.0), vec2f(-1.0, 1.0),
    vec2f(-1.0, 1.0), vec2f(1.0, -1.0), vec2f(1.0, 1.0),
  );
  let textureUvs = array<vec2f, 6>(
    vec2f(0.0, 0.0), vec2f(1.0, 0.0), vec2f(0.0, 1.0),
    vec2f(0.0, 1.0), vec2f(1.0, 0.0), vec2f(1.0, 1.0),
  );
  let item = items[instanceIndex];
  let arrival = item.motion.y + 0.085;
  let holdUntil = arrival + 0.045;
  let departure = min(holdUntil + 0.13, 1.0);
  let enterRaw = clamp((params.progress - item.motion.y) / max(arrival - item.motion.y, 0.001), 0.0, 1.0);
  let enter = smoothstep(0.0, 1.0, enterRaw);
  let exit = smoothstep(holdUntil, departure, params.progress);
  let targetCenter = item.placement.xy;
  let outwardCenter = targetCenter + (targetCenter - vec2f(0.5)) * 0.42;
  var center = mix(vec2f(0.5), targetCenter, enter);
  center = mix(center, outwardCenter, exit);
  let settle = smoothstep(arrival, holdUntil, params.progress);
  var scale = mix(0.035, 1.0 + settle * 0.04, enter);
  scale = mix(scale, 1.62, exit);
  let angle = item.motion.x * enter;
  let c = cos(angle);
  let s = sin(angle);
  let corner = corners[vertexIndex] * item.placement.zw * scale;
  let rotated = vec2f(c * corner.x - s * corner.y, s * corner.x + c * corner.y);
  let screen = center + rotated;

  var output: VertexOutput;
  output.position = vec4f(screen.x * 2.0 - 1.0, 1.0 - screen.y * 2.0, 0.0, 1.0);
  output.photoUv = textureUvs[vertexIndex];
  output.opacity = smoothstep(0.18, 1.0, enterRaw) * (1.0 - exit);
  output.blur = (1.0 - enter) * 0.014 + exit * 0.009;
  output.layer = u32(item.motion.z);
  return output;
}

@fragment fn fs_main(input: VertexOutput) -> @location(0) vec4f {
  if (input.opacity <= 0.002) { discard; }
  let layer = i32(input.layer);
  let offsetX = vec2f(input.blur, 0.0);
  let offsetY = vec2f(0.0, input.blur);
  var color = textureSampleLevel(photos, photoSampler, input.photoUv, layer, 0.0).rgb * 0.44;
  color += textureSampleLevel(photos, photoSampler, input.photoUv + offsetX, layer, 0.0).rgb * 0.14;
  color += textureSampleLevel(photos, photoSampler, input.photoUv - offsetX, layer, 0.0).rgb * 0.14;
  color += textureSampleLevel(photos, photoSampler, input.photoUv + offsetY, layer, 0.0).rgb * 0.14;
  color += textureSampleLevel(photos, photoSampler, input.photoUv - offsetY, layer, 0.0).rgb * 0.14;
  let luminance = dot(color, vec3f(0.2126, 0.7152, 0.0722));
  let grayscale = mix(vec3f(luminance), color, 0.08);
  let edge = max(abs(input.photoUv.x - 0.5), abs(input.photoUv.y - 0.5)) * 2.0;
  let edgeFade = 1.0 - smoothstep(0.985, 1.0, edge);
  let alpha = input.opacity * edgeFade;
  return vec4f(grayscale * alpha, alpha);
}
`

interface TunnelItem {
  data: readonly [number, number, number, number, number, number, number, number]
  zIndex: number
}

async function validateShader(activeGpu: Gpu, code: string, label: string) {
  if (!import.meta.dev) return
  const module = activeGpu.gpu.createShaderModule({ code, label: `${label}.validation` })
  const info = await module.getCompilationInfo()
  const errors = info.messages.filter((message) => message.type === 'error')
  if (!errors.length) return
  throw new Error(
    errors
      .map((message) => `${label}:${message.lineNum}:${message.linePos} ${message.message}`)
      .join('\n'),
  )
}

export function useVgpuPhotoTunnel(
  canvas: Readonly<ShallowRef<HTMLCanvasElement | null>>,
  section: Readonly<ShallowRef<HTMLElement | null>>,
  photos: ComputedRef<readonly Photo[]>,
  isDark: ComputedRef<boolean>,
) {
  const isReady = shallowRef(false)
  const isUnavailable = shallowRef(false)
  const isReducedMotion = shallowRef(false)

  let gpu: Gpu | undefined
  let canvasSurface: Surface | undefined
  let background: Effect | undefined
  let photoDraw: Draw | undefined
  let itemBuffer: StorageBuffer | undefined
  let photoTexture: Texture | undefined
  let placeholderTexture: Texture | undefined
  let unsubscribeResize: (() => void) | undefined
  let motionPreference: MediaQueryList | undefined
  let frameId = 0
  let progress = 0
  let photoCount = 0
  let loadVersion = 0
  let disposed = false

  function visiblePhotos() {
    return photos.value.slice(0, MAX_PHOTOS)
  }

  function createItemData(activePhotos: readonly Photo[]) {
    const width = Math.max(canvasSurface?.size[0] ?? window.innerWidth, 1)
    const height = Math.max(canvasSurface?.size[1] ?? window.innerHeight, 1)
    const viewportAspect = width / height
    const mobile = window.innerWidth < 768
    const lastIndex = Math.max(activePhotos.length - 1, 1)

    const items = activePhotos.map<TunnelItem>((photo, index) => {
      const desktopWidth = 14 + hashFraction(photo.id, 11) * 13
      const desktopLeft = 3 + hashFraction(photo.id, 23) * (94 - desktopWidth)
      const mobileWidth = 34 + hashFraction(photo.id, 37) * 22
      const mobileLeft = 3 + hashFraction(photo.id, 41) * (94 - mobileWidth)
      const top = mobile ? 8 + hashFraction(photo.id, 71) * 68 : 7 + hashFraction(photo.id, 67) * 66
      const widthRatio = (mobile ? mobileWidth : desktopWidth) / 100
      const leftRatio = (mobile ? mobileLeft : desktopLeft) / 100
      const aspect = Math.max(photo.width / Math.max(photo.height, 1), 0.1)
      const heightRatio = (widthRatio * viewportAspect) / aspect
      const angle = ((-6.5 + hashFraction(photo.id, 53) * 13) * Math.PI) / 180
      const delay = (index / lastIndex) * 0.74
      const zIndex = 2 + Math.floor(hashFraction(photo.id, 79) * 8)

      return {
        data: [
          leftRatio + widthRatio * 0.5,
          top / 100 + heightRatio * 0.5,
          widthRatio * 0.5,
          heightRatio * 0.5,
          angle,
          delay,
          index,
          hashFraction(photo.id, 97),
        ],
        zIndex,
      }
    })

    items.sort((a, b) => a.zIndex - b.zIndex)
    const values = new Float32Array(MAX_PHOTOS * ITEM_FLOATS)
    items.forEach((item, index) => values.set(item.data, index * ITEM_FLOATS))
    return values
  }

  function updateProgress() {
    const element = section.value
    if (!element) return
    const rect = element.getBoundingClientRect()
    const distance = Math.max(element.offsetHeight - window.innerHeight, 1)
    progress = Math.min(Math.max(-rect.top / distance, 0), 1)
  }

  function render() {
    frameId = 0
    if (!gpu || !canvasSurface || !background || !photoDraw || !photoCount) return
    updateProgress()
    const params = {
      resolution: canvasSurface.size,
      progress,
      darkMode: isDark.value ? 1 : 0,
    }
    background.set({ params })
    photoDraw.set({ params })
    frame(gpu, (currentFrame) => {
      currentFrame.pass({ target: canvasSurface!, clear: [0, 0, 0, 0] }, (pass) => {
        pass.draw(background!)
        pass.draw(photoDraw!, { instances: photoCount })
      })
    })
  }

  function requestRender() {
    if (!frameId) frameId = window.requestAnimationFrame(render)
  }

  function writeItemData() {
    if (!itemBuffer) return
    itemBuffer.write(createItemData(visiblePhotos()))
  }

  function createPlaceholder(activeGpu: Gpu) {
    const texture = activeGpu.device.createTexture({
      size: [1, 1, 1],
      format: 'rgba8unorm-srgb',
      usage: ['copy_dst', 'texture_binding'],
      label: 'home-photo-tunnel-placeholder',
    })
    activeGpu.gpu.queue.writeTexture(
      { texture: texture.gpu },
      new Uint8Array([128, 128, 128, 255]),
      { bytesPerRow: 4 },
      { width: 1, height: 1, depthOrArrayLayers: 1 },
    )
    return texture
  }

  async function loadPhotoTexture(activeGpu: Gpu, activePhotos: readonly Photo[]) {
    const texture = activeGpu.device.createTexture({
      size: [TEXTURE_SIZE, TEXTURE_SIZE, activePhotos.length],
      format: 'rgba8unorm-srgb',
      usage: ['copy_dst', 'texture_binding'],
      label: 'home-photo-tunnel-array',
    })

    try {
      await Promise.all(
        activePhotos.map(async (photo, layer) => {
          const response = await fetch(
            `/api/photo-assets/${encodeURIComponent(photo.id)}/thumbnail`,
          )
          if (!response.ok) throw new Error(`Photo ${photo.id} failed with ${response.status}`)
          const bitmap = await createImageBitmap(await response.blob())
          try {
            const stagingCanvas = document.createElement('canvas')
            stagingCanvas.width = TEXTURE_SIZE
            stagingCanvas.height = TEXTURE_SIZE
            const context = stagingCanvas.getContext('2d')
            if (!context) throw new Error('2D staging canvas is unavailable')
            context.drawImage(bitmap, 0, 0, TEXTURE_SIZE, TEXTURE_SIZE)
            const imageData = context.getImageData(0, 0, TEXTURE_SIZE, TEXTURE_SIZE)
            activeGpu.gpu.queue.writeTexture(
              { texture: texture.gpu, origin: [0, 0, layer] },
              imageData.data,
              { bytesPerRow: TEXTURE_SIZE * 4, rowsPerImage: TEXTURE_SIZE },
              { width: TEXTURE_SIZE, height: TEXTURE_SIZE, depthOrArrayLayers: 1 },
            )
          } finally {
            bitmap.close()
          }
        }),
      )
      return texture
    } catch (error) {
      texture.destroy()
      throw error
    }
  }

  async function updatePhotos() {
    if (!gpu || !photoDraw) return
    const activeGpu = gpu
    const activeDraw = photoDraw
    const activePhotos = visiblePhotos()
    const version = ++loadVersion
    if (!activePhotos.length) return

    try {
      const texture = await loadPhotoTexture(activeGpu, activePhotos)
      if (disposed || version !== loadVersion || activeGpu !== gpu) {
        texture.destroy()
        return
      }
      activeDraw.set({ photos: texture })
      photoTexture?.destroy()
      photoTexture = texture
      photoCount = activePhotos.length
      writeItemData()
      render()
      isReady.value = true
    } catch (error) {
      console.error('[home-photo-tunnel] Photo textures unavailable', error)
      isUnavailable.value = true
      disposeGpuResources()
    }
  }

  function disposeGpuResources() {
    loadVersion++
    if (frameId) window.cancelAnimationFrame(frameId)
    frameId = 0
    unsubscribeResize?.()
    canvasSurface?.dispose()
    photoTexture?.destroy()
    placeholderTexture?.destroy()
    gpu?.dispose()
    unsubscribeResize = undefined
    canvasSurface = undefined
    itemBuffer = undefined
    photoTexture = undefined
    placeholderTexture = undefined
    photoDraw = undefined
    background = undefined
    gpu = undefined
    photoCount = 0
    isReady.value = false
  }

  async function initialize() {
    const canvasElement = canvas.value
    if (!canvasElement || gpu || isReducedMotion.value) return
    isUnavailable.value = false

    try {
      const activeGpu = await init({ powerPreference: 'high-performance' })
      if (disposed || isReducedMotion.value) {
        activeGpu.dispose()
        return
      }
      gpu = activeGpu
      await Promise.all([
        validateShader(activeGpu, TUNNEL_BACKGROUND_SHADER, 'home-photo-tunnel-space'),
        validateShader(activeGpu, PHOTO_TUNNEL_SHADER, 'home-photo-tunnel-photos'),
      ])
      canvasSurface = surface(activeGpu, canvasElement, {
        alphaMode: 'premultiplied',
        dpr: [1, 1.5],
        label: 'home-photo-tunnel',
      })
      itemBuffer = storage(
        activeGpu,
        MAX_PHOTOS * ITEM_FLOATS * Float32Array.BYTES_PER_ELEMENT,
        'read',
      )
      placeholderTexture = createPlaceholder(activeGpu)
      background = effect(activeGpu, TUNNEL_BACKGROUND_SHADER, {
        label: 'home-photo-tunnel-space',
        set: {
          params: { resolution: canvasSurface.size, progress: 0, darkMode: isDark.value ? 1 : 0 },
        },
      })
      photoDraw = draw(activeGpu, {
        shader: PHOTO_TUNNEL_SHADER,
        label: 'home-photo-tunnel-photos',
        vertices: 6,
        blend: 'premultiplied',
        set: {
          params: { resolution: canvasSurface.size, progress: 0, darkMode: isDark.value ? 1 : 0 },
          items: itemBuffer,
          photos: placeholderTexture,
          photoSampler: sampler(activeGpu, {
            minFilter: 'linear',
            magFilter: 'linear',
            addressModeU: 'clamp-to-edge',
            addressModeV: 'clamp-to-edge',
          }),
        },
      })
      writeItemData()
      const surfaceSignature = {
        colors: [canvasSurface.format],
        sampleCount: canvasSurface.sampleCount,
      } as const
      await Promise.all([background.compile(surfaceSignature), photoDraw.compile(surfaceSignature)])
      unsubscribeResize = canvasSurface.onResize(() => {
        writeItemData()
        requestRender()
      })
      await updatePhotos()
    } catch (error) {
      console.error(
        '[home-photo-tunnel] WebGPU initialization failed',
        error,
        error instanceof Error ? error.cause : undefined,
      )
      isUnavailable.value = true
      disposeGpuResources()
    }
  }

  function syncMotionPreference() {
    isReducedMotion.value = motionPreference?.matches ?? false
    if (isReducedMotion.value) disposeGpuResources()
    else void initialize()
  }

  watch(isDark, requestRender)
  watch(photos, () => {
    if (gpu) void updatePhotos()
  })

  onMounted(async () => {
    await nextTick()
    motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)')
    motionPreference.addEventListener('change', syncMotionPreference)
    isReducedMotion.value = motionPreference.matches
    window.addEventListener('scroll', requestRender, { passive: true })
    window.addEventListener('resize', requestRender, { passive: true })
    if (!isReducedMotion.value) await initialize()
  })

  onBeforeUnmount(() => {
    disposed = true
    motionPreference?.removeEventListener('change', syncMotionPreference)
    window.removeEventListener('scroll', requestRender)
    window.removeEventListener('resize', requestRender)
    disposeGpuResources()
  })

  return {
    isReady: readonly(isReady),
    isReducedMotion: readonly(isReducedMotion),
    isUnavailable: readonly(isUnavailable),
  }
}
