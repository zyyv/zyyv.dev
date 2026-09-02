import type { Ref } from 'vue'
import type { Effect, FrameLoopHandle, Gpu, Surface, Texture } from 'vgpu'
import type { BackgroundPhotoSource } from './useBackgroundPhotos'
import { clock, effect, frame, frameLoop, init, sampler, surface } from 'vgpu'

const HOME_BACKGROUND_SHADER = /* wgsl */ `
struct Params {
  resolution: vec2f,
  pointer: vec2f,
  photoAspects: vec4f,
  time: f32,
  darkMode: f32,
  photoMix: f32,
  photoAspectE: f32,
  layoutA: vec4f,
  layoutB: vec4f,
  layoutC: vec4f,
  layoutD: vec4f,
  layoutE: vec4f,
  motionA: vec4f,
  motionB: vec4f,
  motionC: vec4f,
  motionD: vec4f,
  motionE: vec4f,
}

@group(0) @binding(0) var<uniform> params: Params;
@group(0) @binding(1) var photoA: texture_2d<f32>;
@group(0) @binding(2) var photoB: texture_2d<f32>;
@group(0) @binding(3) var photoC: texture_2d<f32>;
@group(0) @binding(4) var photoD: texture_2d<f32>;
@group(0) @binding(5) var photoE: texture_2d<f32>;
@group(0) @binding(6) var photoSampler: sampler;

fn hash22(value: vec2f) -> vec2f {
  let seed = vec2f(
    dot(value, vec2f(127.1, 311.7)),
    dot(value, vec2f(269.5, 183.3)),
  );
  return fract(sin(seed) * 43758.5453);
}

fn particleLayer(
  screen: vec2f,
  pointer: vec2f,
  scale: f32,
  speed: f32,
  size: f32,
  seedOffset: f32,
) -> vec3f {
  let drift = vec2f(params.time * speed, params.time * speed * -0.37);
  let parallax = pointer * (0.055 + seedOffset * 0.0008);
  let gridPosition = (screen + parallax) * scale + drift;
  let baseCell = floor(gridPosition);
  let isDark = clamp(params.darkMode, 0.0, 1.0);
  let neutral = mix(vec3f(0.28, 0.30, 0.29), vec3f(0.72, 0.74, 0.72), isDark);
  var layerColor = vec3f(0.0);

  for (var offsetY = -1; offsetY <= 1; offsetY = offsetY + 1) {
    for (var offsetX = -1; offsetX <= 1; offsetX = offsetX + 1) {
      let cell = baseCell + vec2f(f32(offsetX), f32(offsetY));
      let random = hash22(cell + vec2f(seedOffset));
      let particle = (cell + random - drift) / scale - parallax;
      let distanceToParticle = length(screen - particle);
      let radius = size * mix(0.72, 1.18, random.y);
      let dot = 1.0 - smoothstep(radius, radius * 1.8, distanceToParticle);
      let twinkle = 0.88 + sin(params.time * 0.42 + random.x * 6.283) * 0.12;

      let green = mix(vec3f(0.28, 0.44, 0.35), vec3f(0.36, 0.70, 0.48), isDark);
      let violet = mix(vec3f(0.41, 0.36, 0.52), vec3f(0.58, 0.48, 0.76), isDark);
      let rose = mix(vec3f(0.52, 0.38, 0.41), vec3f(0.76, 0.50, 0.56), isDark);
      let accent = select(select(green, violet, random.x > 0.66), rose, random.y > 0.86);
      let particleColor = mix(neutral, accent, 0.34);
      layerColor = layerColor + particleColor * dot * twinkle;
    }
  }

  return layerColor;
}

fn coverUv(uv: vec2f, planeAspect: f32, imageAspect: f32) -> vec2f {
  var centered = uv - vec2f(0.5);
  if (imageAspect > planeAspect) {
    centered.x = centered.x * planeAspect / imageAspect;
  } else {
    centered.y = centered.y * imageAspect / planeAspect;
  }
  return centered + vec2f(0.5);
}

fn blurredPhoto(texture: texture_2d<f32>, uv: vec2f, blur: f32) -> vec3f {
  let offsetX = vec2f(blur, 0.0);
  let offsetY = vec2f(0.0, blur);
  var color = textureSampleLevel(texture, photoSampler, uv, 0.0).rgb * 0.36;
  color = color + textureSampleLevel(texture, photoSampler, uv + offsetX, 0.0).rgb * 0.16;
  color = color + textureSampleLevel(texture, photoSampler, uv - offsetX, 0.0).rgb * 0.16;
  color = color + textureSampleLevel(texture, photoSampler, uv + offsetY, 0.0).rgb * 0.16;
  color = color + textureSampleLevel(texture, photoSampler, uv - offsetY, 0.0).rgb * 0.16;
  return color;
}

fn photoPlane(
  texture: texture_2d<f32>,
  uv: vec2f,
  pointer: vec2f,
  center: vec2f,
  halfSize: vec2f,
  motion: vec4f,
  imageAspect: f32,
) -> vec4f {
  let angle = motion.x;
  let depth = motion.y;
  let floatOffset = vec2f(
    sin(params.time * (0.055 + depth * 0.012) + angle * 11.0) * motion.z,
    cos(params.time * (0.048 + depth * 0.010) + angle * 13.0) * motion.w,
  );
  let animatedCenter = center + pointer * (0.008 + depth * 0.006) + floatOffset;
  var local = (uv - animatedCenter) / halfSize;
  let c = cos(angle + pointer.x * 0.018 * depth);
  let s = sin(angle + pointer.x * 0.018 * depth);
  local = vec2f(c * local.x - s * local.y, s * local.x + c * local.y);
  local.x = local.x / (1.0 + local.y * 0.045 * depth);

  let edge = max(abs(local.x), abs(local.y));
  if (edge >= 1.0) {
    return vec4f(0.0);
  }
  let mask = 1.0 - smoothstep(0.62, 1.0, edge);
  let planeUv = local * 0.5 + vec2f(0.5);
  let sampled = blurredPhoto(texture, coverUv(planeUv, halfSize.x / halfSize.y, imageAspect), 0.009);
  let luminance = dot(sampled, vec3f(0.2126, 0.7152, 0.0722));
  let muted = mix(vec3f(luminance), sampled, 0.48);
  let toned = mix(muted, muted * 0.72 + vec3f(0.12), clamp(params.darkMode, 0.0, 1.0));
  return vec4f(toned, mask);
}

@fragment fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let safeHeight = max(params.resolution.y, 1.0);
  let aspect = params.resolution.x / safeHeight;
  let screen = vec2f((uv.x * 2.0 - 1.0) * aspect, 1.0 - uv.y * 2.0);
  let pointer = params.pointer * vec2f(aspect, -1.0);
  let isDark = clamp(params.darkMode, 0.0, 1.0);
  let lightBase = vec3f(0.914, 0.914, 0.898);
  let darkBase = vec3f(0.067, 0.067, 0.059);
  var color = mix(lightBase, darkBase, isDark);

  let layerA = photoPlane(
    photoA, uv, params.pointer, params.layoutA.xy, params.layoutA.zw, params.motionA, params.photoAspects.x,
  );
  let layerB = photoPlane(
    photoB, uv, params.pointer, params.layoutB.xy, params.layoutB.zw, params.motionB, params.photoAspects.y,
  );
  let layerC = photoPlane(
    photoC, uv, params.pointer, params.layoutC.xy, params.layoutC.zw, params.motionC, params.photoAspects.z,
  );
  let layerD = photoPlane(
    photoD, uv, params.pointer, params.layoutD.xy, params.layoutD.zw, params.motionD, params.photoAspects.w,
  );
  let layerE = photoPlane(
    photoE, uv, params.pointer, params.layoutE.xy, params.layoutE.zw, params.motionE, params.photoAspectE,
  );
  let photoOpacity = mix(0.15, 0.19, isDark) * params.photoMix;
  color = mix(color, layerA.rgb, layerA.a * photoOpacity);
  color = mix(color, layerB.rgb, layerB.a * photoOpacity * 0.88);
  color = mix(color, layerC.rgb, layerC.a * photoOpacity * 0.76);
  color = mix(color, layerD.rgb, layerD.a * photoOpacity * 0.82);
  color = mix(color, layerE.rgb, layerE.a * photoOpacity * 0.72);

  let farParticles = particleLayer(screen, pointer, 3.5, 0.015, 0.0046, 11.0);
  let nearParticles = particleLayer(screen, pointer, 5.8, -0.009, 0.0031, 37.0);
  let particles = farParticles * 0.22 + nearParticles * 0.13;
  color = color + particles * mix(0.32, 0.48, isDark);

  return vec4f(color, 1.0);
}
`

export function useVgpuBackground(
  canvas: Readonly<Ref<HTMLCanvasElement | null>>,
  isDark: Ref<boolean>,
  photoSources: Readonly<Ref<readonly BackgroundPhotoSource[]>>,
) {
  const isReady = shallowRef(false)
  const isUnavailable = shallowRef(false)

  let gpu: Gpu | undefined
  let canvasSurface: Surface | undefined
  let background: Effect | undefined
  let loop: FrameLoopHandle | undefined
  let unsubscribeResize: (() => void) | undefined
  let reducedMotion: MediaQueryList | undefined
  let placeholderTexture: Texture | undefined
  let photoTextures: Texture[] = []
  let photoLoadVersion = 0
  let disposed = false
  let pointerX = 0
  let pointerY = 0
  let targetPointerX = 0
  let targetPointerY = 0

  function updateTheme() {
    background?.set({ params: { darkMode: isDark.value ? 1 : 0 } })
    if (!loop && gpu && canvasSurface && background) {
      frame(gpu, (currentFrame) => currentFrame.pass(canvasSurface!, background!))
    }
  }

  function renderStatic() {
    if (!gpu || !canvasSurface || !background) return
    background.set({
      params: {
        time: 0.8,
        pointer: [0, 0],
      },
    })
    frame(gpu, (currentFrame) => currentFrame.pass(canvasSurface!, background!))
  }

  function startLoop() {
    if (!gpu || !canvasSurface || !background || loop) return
    const gpuClock = clock(gpu)
    loop = frameLoop(
      gpu,
      (currentFrame) => {
        pointerX += (targetPointerX - pointerX) * 0.025
        pointerY += (targetPointerY - pointerY) * 0.025
        background!.set({
          params: {
            time: gpuClock.time,
            pointer: [pointerX, pointerY],
          },
        })
        currentFrame.pass(canvasSurface!, background!)
      },
      { fps: 30 },
    )
  }

  function syncMotionPreference() {
    loop?.stop()
    loop = undefined
    if (reducedMotion?.matches) renderStatic()
    else startLoop()
  }

  function handlePointerMove(event: PointerEvent) {
    targetPointerX = (event.clientX / window.innerWidth) * 2 - 1
    targetPointerY = (event.clientY / window.innerHeight) * 2 - 1
  }

  function createPlaceholderTexture(activeGpu: Gpu) {
    const texture = activeGpu.device.createTexture({
      size: [1, 1],
      format: 'rgba8unorm',
      usage: ['copy_dst', 'texture_binding'],
      label: 'site-background-placeholder',
    })
    activeGpu.gpu.queue.writeTexture(
      { texture: texture.gpu },
      new Uint8Array([128, 128, 128, 255]),
      { bytesPerRow: 4 },
      { width: 1, height: 1 },
    )
    return texture
  }

  async function createPhotoTexture(activeGpu: Gpu, source: BackgroundPhotoSource) {
    const response = await fetch(source.url)
    if (!response.ok) throw new Error(`Photo texture request failed: ${response.status}`)

    const bitmap = await createImageBitmap(await response.blob())
    try {
      const texture = activeGpu.device.createTexture({
        size: [bitmap.width, bitmap.height],
        format: 'rgba8unorm',
        usage: ['copy_dst', 'texture_binding', 'render_attachment'],
        label: 'site-background-photo',
      })
      activeGpu.gpu.queue.copyExternalImageToTexture(
        { source: bitmap },
        { texture: texture.gpu },
        { width: bitmap.width, height: bitmap.height },
      )
      return texture
    } finally {
      bitmap.close()
    }
  }

  async function updatePhotoTextures(sources: readonly BackgroundPhotoSource[]) {
    if (!gpu || !background || !sources.length) return

    const activeGpu = gpu
    const activeBackground = background
    const version = ++photoLoadVersion
    const selected = Array.from({ length: 5 }, (_, index) => sources[index % sources.length]!) as [
      BackgroundPhotoSource,
      BackgroundPhotoSource,
      BackgroundPhotoSource,
      BackgroundPhotoSource,
      BackgroundPhotoSource,
    ]

    try {
      const textures = (await Promise.all(
        selected.map((source) => createPhotoTexture(activeGpu, source)),
      )) as [Texture, Texture, Texture, Texture, Texture]
      if (disposed || version !== photoLoadVersion || activeGpu !== gpu) {
        textures.forEach((texture) => texture.destroy())
        return
      }

      activeBackground.set({
        photoA: textures[0],
        photoB: textures[1],
        photoC: textures[2],
        photoD: textures[3],
        photoE: textures[4],
        params: {
          photoAspects: [
            selected[0].aspect,
            selected[1].aspect,
            selected[2].aspect,
            selected[3].aspect,
          ],
          photoAspectE: selected[4].aspect,
          layoutA: [...selected[0].center, ...selected[0].halfSize],
          layoutB: [...selected[1].center, ...selected[1].halfSize],
          layoutC: [...selected[2].center, ...selected[2].halfSize],
          layoutD: [...selected[3].center, ...selected[3].halfSize],
          layoutE: [...selected[4].center, ...selected[4].halfSize],
          motionA: [selected[0].angle, selected[0].depth, ...selected[0].drift],
          motionB: [selected[1].angle, selected[1].depth, ...selected[1].drift],
          motionC: [selected[2].angle, selected[2].depth, ...selected[2].drift],
          motionD: [selected[3].angle, selected[3].depth, ...selected[3].drift],
          motionE: [selected[4].angle, selected[4].depth, ...selected[4].drift],
          photoMix: 1,
        },
      })
      photoTextures.forEach((texture) => texture.destroy())
      photoTextures = textures
      if (!loop) renderStatic()
    } catch (error) {
      console.warn('[site-background] Photo textures unavailable', error)
    }
  }

  function disposeGpuResources() {
    const activeLoop = loop
    const activeUnsubscribeResize = unsubscribeResize
    const activeSurface = canvasSurface
    const activeGpu = gpu
    const activePlaceholderTexture = placeholderTexture
    const activePhotoTextures = photoTextures

    photoLoadVersion++
    loop = undefined
    unsubscribeResize = undefined
    background = undefined
    canvasSurface = undefined
    gpu = undefined
    placeholderTexture = undefined
    photoTextures = []

    activeLoop?.stop()
    activeUnsubscribeResize?.()
    activeSurface?.dispose()
    activePlaceholderTexture?.destroy()
    activePhotoTextures.forEach((texture) => texture.destroy())
    activeGpu?.dispose()
  }

  watch(isDark, updateTheme)
  watch(photoSources, (sources) => void updatePhotoTextures(sources))

  onMounted(() => {
    const canvasElement = canvas.value
    if (!canvasElement) return

    reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    reducedMotion.addEventListener('change', syncMotionPreference)
    window.addEventListener('pointermove', handlePointerMove, { passive: true })

    void (async () => {
      try {
        gpu = await init({ powerPreference: 'high-performance' })
        if (disposed) {
          disposeGpuResources()
          return
        }

        canvasSurface = surface(gpu, canvasElement, {
          alphaMode: 'premultiplied',
          dpr: [1, 1.5],
          label: 'site-particle-background',
        })
        placeholderTexture = createPlaceholderTexture(gpu)
        background = effect(gpu, HOME_BACKGROUND_SHADER, {
          label: 'site-particle-field',
          set: {
            params: {
              resolution: canvasSurface.size,
              pointer: [0, 0],
              photoAspects: [1, 1, 1, 1],
              photoAspectE: 1,
              time: 0,
              darkMode: isDark.value ? 1 : 0,
              photoMix: 0,
              layoutA: [0, 0, 0, 0],
              layoutB: [0, 0, 0, 0],
              layoutC: [0, 0, 0, 0],
              layoutD: [0, 0, 0, 0],
              layoutE: [0, 0, 0, 0],
              motionA: [0, 0, 0, 0],
              motionB: [0, 0, 0, 0],
              motionC: [0, 0, 0, 0],
              motionD: [0, 0, 0, 0],
              motionE: [0, 0, 0, 0],
            },
            photoA: placeholderTexture,
            photoB: placeholderTexture,
            photoC: placeholderTexture,
            photoD: placeholderTexture,
            photoE: placeholderTexture,
            photoSampler: sampler(gpu, {
              minFilter: 'linear',
              magFilter: 'linear',
              addressModeU: 'clamp-to-edge',
              addressModeV: 'clamp-to-edge',
            }),
          },
        })
        unsubscribeResize = canvasSurface.onResize(() => {
          background?.set({ params: { resolution: canvasSurface!.size } })
        })
        syncMotionPreference()
        isReady.value = true
        void updatePhotoTextures(photoSources.value)
      } catch (error) {
        console.error('[site-vgpu-background] WebGPU initialization failed', error)
        isUnavailable.value = true
        disposeGpuResources()
      }
    })()
  })

  onBeforeUnmount(() => {
    disposed = true
    reducedMotion?.removeEventListener('change', syncMotionPreference)
    window.removeEventListener('pointermove', handlePointerMove)
    disposeGpuResources()
  })

  return {
    isReady: readonly(isReady),
    isUnavailable: readonly(isUnavailable),
  }
}
