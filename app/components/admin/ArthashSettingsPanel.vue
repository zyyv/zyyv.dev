<script setup lang="ts">
import { computed } from 'vue'
import { codec } from 'arthash'
import type { ArthashConfig } from '#shared/constants/arthash'
import { DEFAULT_ARTHASH_CONFIG } from '#shared/constants/arthash'
import { createArthashCodec, getArthashRenderOptions } from '~/utils/arthash'

const props = defineProps<{
  hash?: string | null
  generating?: boolean
  aspectRatio?: number | string
}>()

const settings = defineModel<ArthashConfig>('settings', { required: true })

const codecValue = computed(() => createArthashCodec(settings.value))
const renderOptions = computed(() => getArthashRenderOptions(settings.value))
const codecBytes = computed(() => codec.bytesTotal(codecValue.value))
const codecLabel = computed(() => {
  if (settings.value.shape === 'dct') return 'DCT'
  return `${settings.value.shape} · n=${settings.value.n}`
})
const previewAspectRatio = computed(() => settings.value.overrideAspect ?? props.aspectRatio)
const supportsCornerRadius = computed(() => ['rect', 'square'].includes(settings.value.shape))

type NumericSetting =
  | 'n'
  | 'seed'
  | 'nRandom'
  | 'nTopk'
  | 'hillClimbSteps'
  | 'hillClimbMaxAge'
  | 'nAttempts'
  | 'baseSize'
  | 'aa'
  | 'blur'
  | 'cornerRadius'

function updateValue<K extends keyof ArthashConfig>(key: K, value: ArthashConfig[K]) {
  settings.value = { ...settings.value, [key]: value }
}

function updateNumber(key: NumericSetting, event: Event) {
  const rawValue = (event.target as HTMLInputElement).value.trim()
  if (key === 'hillClimbMaxAge' && !rawValue) {
    updateValue('hillClimbMaxAge', null)
    return
  }
  const value = Number(rawValue)
  updateValue(key, Number.isFinite(value) ? value : DEFAULT_ARTHASH_CONFIG[key])
}

function updateAspect(event: Event) {
  const rawValue = (event.target as HTMLInputElement).value.trim()
  updateValue('overrideAspect', rawValue ? Number(rawValue) : null)
}

function resetSettings() {
  settings.value = { ...DEFAULT_ARTHASH_CONFIG }
}
</script>

<template>
  <section class="arthash-settings" aria-labelledby="arthash-settings-title">
    <div class="arthash-settings__heading">
      <div>
        <h3 id="arthash-settings-title">生成设置</h3>
      </div>
      <button
        type="button"
        class="reset-button"
        data-cuelume-toggle="toggle"
        @click="resetSettings"
      >
        恢复默认
      </button>
    </div>

    <div class="arthash-preview">
      <div
        class="arthash-preview__stage"
        :class="{ 'arthash-preview__stage--empty': !hash }"
        :style="{ aspectRatio: previewAspectRatio || undefined }"
      >
        <SuperImage
          v-if="hash"
          :resources="{ arthash: hash }"
          :arthash-codec="codecValue"
          :arthash-options="renderOptions"
          :aspect-ratio="previewAspectRatio"
          mode="arthash"
          :progressive="false"
          class="arthash-preview__visual"
          alt=""
        />
        <span v-else class="arthash-preview__empty">等待图片解析</span>
        <span v-if="generating" class="arthash-preview__loading">
          <i class="i-hugeicons:loading-03 animate-spin" aria-hidden="true" /> 重新编码中
        </span>
      </div>
      <div class="arthash-preview__caption">
        <span>实时预览</span>
        <code>{{ codecLabel }} · 约 {{ codecBytes }} B</code>
      </div>
    </div>

    <div class="setting-grid">
      <label class="setting-field">
        <span>图形 codec</span>
        <select
          :value="settings.shape"
          data-cuelume-toggle="toggle"
          @change="
            updateValue(
              'shape',
              ($event.target as HTMLSelectElement).value as ArthashConfig['shape'],
            )
          "
        >
          <option value="rect">Rect · 矩形</option>
          <option value="triangle">Triangle · 三角形</option>
          <option value="circle">Circle · 圆形</option>
          <option value="square">Square · 方形</option>
          <option value="pixel">Pixel · 像素</option>
          <option value="dct">DCT · 频域</option>
        </select>
        <small>决定 hash 的字节格式，保存后会随图片一并记录。</small>
      </label>

      <label class="setting-field">
        <span>细节数量 n</span>
        <select
          :value="settings.n"
          :disabled="settings.shape === 'dct'"
          data-cuelume-toggle="toggle"
          @change="updateNumber('n', $event)"
        >
          <option :value="12">12 · 轻量</option>
          <option :value="24">24 · 平衡</option>
          <option :value="64">64 · 细节</option>
        </select>
      </label>

      <label class="setting-field">
        <span>色彩编码</span>
        <select
          :value="settings.color"
          :disabled="settings.shape === 'dct'"
          data-cuelume-toggle="toggle"
          @change="
            updateValue(
              'color',
              ($event.target as HTMLSelectElement).value as ArthashConfig['color'],
            )
          "
        >
          <option value="rgb565">RGB565 · 体积更小</option>
          <option value="rgb888">RGB888 · 色彩更多</option>
        </select>
      </label>

      <label class="setting-field">
        <span>随机种子</span>
        <input
          :value="settings.seed"
          type="number"
          min="0"
          max="2147483647"
          step="1"
          data-cuelume-toggle="toggle"
          @change="updateNumber('seed', $event)"
        />
      </label>

      <label class="setting-field">
        <span>像素平滑</span>
        <select
          :value="settings.pixelSmooth"
          data-cuelume-toggle="toggle"
          @change="
            updateValue(
              'pixelSmooth',
              ($event.target as HTMLSelectElement).value as ArthashConfig['pixelSmooth'],
            )
          "
        >
          <option value="nearest">Nearest · 清晰</option>
          <option value="bilinear">Bilinear · 柔和</option>
        </select>
      </label>

      <label class="setting-field">
        <span>覆盖宽高比</span>
        <input
          :value="settings.overrideAspect ?? ''"
          type="number"
          min="0.1"
          max="10"
          step="0.01"
          placeholder="原图比例"
          data-cuelume-toggle="toggle"
          @change="updateAspect"
        />
        <small>留空即按原始图片比例。</small>
      </label>

      <label class="setting-field setting-field--range">
        <span
          >预览尺寸 <output>{{ settings.baseSize }} px</output></span
        >
        <input
          :value="settings.baseSize"
          type="range"
          min="128"
          max="768"
          step="32"
          aria-label="Arthash 预览尺寸"
          @input="updateNumber('baseSize', $event)"
        />
      </label>

      <label class="setting-field setting-field--range">
        <span
          >模糊 <output>{{ settings.blur }}</output></span
        >
        <input
          :value="settings.blur"
          type="range"
          min="0"
          max="16"
          step="0.5"
          aria-label="Arthash 模糊"
          @input="updateNumber('blur', $event)"
        />
      </label>

      <label v-if="supportsCornerRadius" class="setting-field setting-field--range">
        <span
          >圆角 <output>{{ settings.cornerRadius }}</output></span
        >
        <input
          :value="settings.cornerRadius"
          type="range"
          min="0"
          max="24"
          step="1"
          aria-label="Arthash 圆角"
          @input="updateNumber('cornerRadius', $event)"
        />
      </label>

      <label class="setting-field setting-field--range">
        <span
          >抗锯齿 <output>{{ settings.aa }}×</output></span
        >
        <input
          :value="settings.aa"
          type="range"
          min="1"
          max="4"
          step="1"
          aria-label="Arthash 抗锯齿"
          @input="updateNumber('aa', $event)"
        />
      </label>
    </div>

    <details class="advanced-settings">
      <summary data-cuelume-toggle="toggle">编码搜索预算</summary>
      <div class="advanced-settings__body">
        <label class="switch-field">
          <span>
            <strong>启用 hill-climb 搜索</strong>
            <small>提高形状拟合质量，但会增加本地解析时间。</small>
          </span>
          <input
            :checked="settings.searchEnabled"
            type="checkbox"
            data-cuelume-toggle="toggle"
            @change="updateValue('searchEnabled', ($event.target as HTMLInputElement).checked)"
          />
        </label>
        <label class="setting-field">
          <span>搜索策略</span>
          <select
            :value="settings.searchStrategy"
            :disabled="!settings.searchEnabled"
            data-cuelume-toggle="toggle"
            @change="
              updateValue(
                'searchStrategy',
                ($event.target as HTMLSelectElement).value as ArthashConfig['searchStrategy'],
              )
            "
          >
            <option value="primitive">Primitive</option>
            <option value="topk_uniform">Top-K uniform</option>
          </select>
        </label>
        <div class="advanced-settings__grid">
          <label class="setting-field">
            <span>随机候选</span>
            <input
              :value="settings.nRandom"
              type="number"
              min="1"
              max="512"
              data-cuelume-toggle="toggle"
              @change="updateNumber('nRandom', $event)"
            />
          </label>
          <label class="setting-field">
            <span>Top-K</span>
            <input
              :value="settings.nTopk"
              type="number"
              min="1"
              max="128"
              data-cuelume-toggle="toggle"
              @change="updateNumber('nTopk', $event)"
            />
          </label>
          <label class="setting-field">
            <span>迭代步数</span>
            <input
              :value="settings.hillClimbSteps"
              type="number"
              min="1"
              max="256"
              data-cuelume-toggle="toggle"
              @change="updateNumber('hillClimbSteps', $event)"
            />
          </label>
          <label class="setting-field">
            <span>停滞寿命</span>
            <input
              :value="settings.hillClimbMaxAge ?? ''"
              type="number"
              min="1"
              max="256"
              placeholder="不限"
              data-cuelume-toggle="toggle"
              @change="updateNumber('hillClimbMaxAge', $event)"
            />
          </label>
          <label class="setting-field">
            <span>尝试次数</span>
            <input
              :value="settings.nAttempts"
              type="number"
              min="1"
              max="8"
              data-cuelume-toggle="toggle"
              @change="updateNumber('nAttempts', $event)"
            />
          </label>
        </div>
      </div>
    </details>
  </section>
</template>

<style scoped>
.arthash-settings {
  display: grid;
  gap: 1rem;
}
.arthash-settings__heading,
.arthash-preview__caption,
.setting-field > span,
.switch-field {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}
.arthash-settings h3 {
  margin: 0;
  font-size: 0.92rem;
  font-weight: 550;
}
.reset-button {
  padding: 0.4rem 0.55rem;
  border: 1px solid color-mix(in srgb, currentColor 14%, transparent);
  border-radius: 0.45rem;
  background: transparent;
  color: inherit;
  cursor: pointer;
  font: inherit;
  font-size: 0.59rem;
}
.arthash-preview {
  overflow: hidden;
  border: 1px solid color-mix(in srgb, currentColor 13%, transparent);
  border-radius: 0.65rem;
  background: color-mix(in srgb, currentColor 5%, transparent);
}
.arthash-preview__stage {
  position: relative;
  overflow: hidden;
  background:
    linear-gradient(45deg, color-mix(in srgb, currentColor 5%, transparent) 25%, transparent 25%),
    linear-gradient(-45deg, color-mix(in srgb, currentColor 5%, transparent) 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, color-mix(in srgb, currentColor 5%, transparent) 75%),
    linear-gradient(-45deg, transparent 75%, color-mix(in srgb, currentColor 5%, transparent) 75%);
  background-position:
    0 0,
    0 0,
    0 0,
    0 0;
  background-size: 1.1rem 1.1rem;
  background-position:
    0 0,
    0.55rem 0,
    0.55rem -0.55rem,
    -0.55rem 0.55rem;
}
.arthash-preview__stage--empty {
  min-height: 10rem;
}
.arthash-preview__visual {
  position: absolute;
  top: 50%;
  left: 50%;
  width: calc(100% - 2.5rem) !important;
  height: auto !important;
  transform: translate(-50%, -50%);
}
.arthash-preview__empty,
.arthash-preview__loading {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  color: currentColor;
  font-size: 0.64rem;
  opacity: 0.45;
}
.arthash-preview__loading {
  place-items: end center;
  padding: 0.7rem;
  box-sizing: border-box;
  background: linear-gradient(transparent, color-mix(in srgb, #11110f 22%, transparent));
  color: #f2f2ee;
  opacity: 1;
}
.arthash-preview__caption {
  padding: 0.65rem 0.75rem;
  font-size: 0.59rem;
  opacity: 0.52;
}
.arthash-preview__caption code {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 0.56rem;
}
.setting-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.8rem;
}
.setting-field {
  display: grid;
  gap: 0.4rem;
  min-width: 0;
}
.setting-field > span,
.switch-field > span {
  font-size: 0.61rem;
  opacity: 0.58;
}
.setting-field small,
.switch-field small {
  display: block;
  font-size: 0.55rem;
  line-height: 1.45;
  opacity: 0.42;
}
.setting-field output {
  font-variant-numeric: tabular-nums;
  opacity: 0.56;
}
.setting-field input:not([type='range']),
.setting-field select {
  width: 100%;
  min-height: 2.15rem;
  padding: 0 0.6rem;
  border: 1px solid color-mix(in srgb, currentColor 14%, transparent);
  border-radius: 0.45rem;
  outline: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  font-size: 0.62rem;
  box-sizing: border-box;
}
.setting-field input:focus,
.setting-field select:focus {
  border-color: color-mix(in srgb, currentColor 55%, transparent);
}
.setting-field input:disabled,
.setting-field select:disabled {
  cursor: not-allowed;
  opacity: 0.35;
}
.setting-field input[type='range'] {
  width: 100%;
  accent-color: currentColor;
}
.setting-field--range {
  grid-column: span 1;
}
.advanced-settings {
  border-top: 1px solid color-mix(in srgb, currentColor 12%, transparent);
  padding-top: 0.85rem;
}
.advanced-settings summary {
  cursor: pointer;
  font-size: 0.62rem;
  opacity: 0.58;
}
.advanced-settings__body {
  display: grid;
  gap: 0.85rem;
  padding-top: 0.9rem;
}
.switch-field {
  align-items: flex-start;
}
.switch-field > span {
  display: grid;
  gap: 0.25rem;
}
.switch-field strong {
  font-size: 0.64rem;
  font-weight: 500;
  opacity: 0.82;
}
.switch-field input {
  width: 1rem;
  height: 1rem;
  margin: 0;
  accent-color: currentColor;
}
.advanced-settings__grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.65rem;
}
@media (max-width: 479.9px) {
  .setting-grid,
  .advanced-settings__grid {
    grid-template-columns: 1fr;
  }
}
</style>
