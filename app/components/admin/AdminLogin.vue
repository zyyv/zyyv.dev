<script setup lang="ts">
defineProps<{ loading: boolean; error?: string | null }>()

const emit = defineEmits<{ submit: [password: string] }>()
const password = shallowRef('')
const showPassword = shallowRef(false)

function submit() {
  if (password.value) emit('submit', password.value)
}
</script>

<template>
  <section class="login-shell" aria-labelledby="admin-login-title">
    <div class="login-copy">
      <span class="login-index">PRIVATE / 01</span>
      <h1 id="admin-login-title">Site<br />control.</h1>
      <p>一个只属于站点维护者的私密空间。验证后，维护操作会出现在对应内容页面。</p>
    </div>

    <form class="login-form" @submit.prevent="submit">
      <div class="login-form__heading">
        <span aria-hidden="true"><i /> SECURE SESSION</span>
        <p>验证访问密钥后继续</p>
      </div>

      <label for="admin-password">访问密钥</label>
      <div class="login-control">
        <input
          id="admin-password"
          v-model="password"
          :type="showPassword ? 'text' : 'password'"
          autocomplete="current-password"
          autofocus
          placeholder="输入密码"
          :aria-invalid="Boolean(error)"
          :aria-describedby="error ? 'admin-login-error' : undefined"
        />
        <button
          class="login-control__reveal"
          type="button"
          :aria-label="showPassword ? '隐藏密码' : '显示密码'"
          :aria-pressed="showPassword"
          @click="showPassword = !showPassword"
        >
          <i
            :class="showPassword ? 'i-hugeicons:view-off-slash' : 'i-hugeicons:view'"
            aria-hidden="true"
          />
        </button>
      </div>

      <p v-if="error" id="admin-login-error" class="login-error" role="alert">
        <i class="i-hugeicons:alert-02" aria-hidden="true" /> {{ error }}
      </p>

      <button class="login-submit" type="submit" :disabled="loading || !password">
        <span>{{ loading ? '正在验证' : '进入私密空间' }}</span>
        <i class="i-hugeicons:arrow-up-right-01" aria-hidden="true" />
      </button>
    </form>
  </section>
</template>

<style scoped>
.login-shell {
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(20rem, 0.85fr);
  align-items: end;
  width: min(calc(100% - 3rem), 76rem);
  min-height: 100dvh;
  margin: 0 auto;
  padding: 7rem 0 5rem;
  box-sizing: border-box;
}
.login-index {
  display: block;
  margin-bottom: 2rem;
  font-size: 0.62rem;
  letter-spacing: 0.14em;
  opacity: 0.44;
}
.login-copy h1 {
  margin: 0;
  font-size: clamp(4.5rem, 10vw, 8.5rem);
  font-weight: 500;
  line-height: 0.78;
  letter-spacing: -0.085em;
}
.login-copy p {
  max-width: 26rem;
  margin: 2.5rem 0 0;
  font-size: 0.8rem;
  line-height: 1.75;
  opacity: 0.52;
}
.login-form {
  padding: 1.4rem;
  border: 1px solid color-mix(in srgb, currentColor 14%, transparent);
  border-radius: 0.9rem;
  background: color-mix(in srgb, currentColor 3%, transparent);
}
.login-form__heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 2.25rem;
}
.login-form__heading span {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  font-size: 0.58rem;
  letter-spacing: 0.1em;
  opacity: 0.56;
}
.login-form__heading span i {
  width: 0.35rem;
  height: 0.35rem;
  border-radius: 50%;
  background: #568c68;
  box-shadow: 0 0 0 0.22rem color-mix(in srgb, #568c68 14%, transparent);
}
.login-form__heading p {
  margin: 0;
  font-size: 0.62rem;
  opacity: 0.4;
}
.login-form > label {
  display: block;
  margin-bottom: 0.65rem;
  font-size: 0.68rem;
  opacity: 0.58;
}
.login-control {
  display: grid;
  grid-template-columns: 1fr auto;
  border-bottom: 1px solid color-mix(in srgb, currentColor 26%, transparent);
}
.login-control:focus-within {
  border-color: currentColor;
}
.login-control input {
  min-width: 0;
  padding: 0.95rem 0;
  border: 0;
  outline: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  font-size: 0.86rem;
}
.login-control input::placeholder {
  color: currentColor;
  opacity: 0.38;
}
.login-control__reveal {
  display: grid;
  width: 2.5rem;
  border: 0;
  background: transparent;
  color: inherit;
  cursor: pointer;
  font-size: 1rem;
  opacity: 0.48;
  place-items: center;
}
.login-control__reveal:hover {
  opacity: 0.9;
}
.login-error {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  margin: 0.75rem 0 0;
  color: #a13d32;
  font-size: 0.7rem;
}
.login-submit {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  min-height: 3rem;
  margin-top: 1.5rem;
  padding: 0 1rem;
  border: 0;
  border-radius: 0.62rem;
  background: #11110f;
  color: #e9e9e5;
  cursor: pointer;
  font: inherit;
  font-size: 0.72rem;
}
.dark .login-submit {
  background: #e9e9e5;
  color: #11110f;
}
.login-submit:disabled {
  cursor: not-allowed;
  opacity: 0.38;
}
.login-submit:active:not(:disabled) {
  transform: translateY(1px);
}
@media (max-width: 767.9px) {
  .login-shell {
    grid-template-columns: 1fr;
    align-content: space-between;
    width: min(calc(100% - 2rem), 36rem);
    padding: 5.75rem 0 1.5rem;
  }
  .login-copy h1 {
    font-size: clamp(4.2rem, 23vw, 6.5rem);
  }
  .login-copy p {
    margin-top: 1.5rem;
  }
  .login-form {
    margin-top: 3rem;
  }
  .login-form__heading p {
    display: none;
  }
}
</style>
