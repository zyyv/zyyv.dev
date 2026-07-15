<script setup lang="ts">
defineProps<{ loading: boolean; error?: string | null }>()
const emit = defineEmits<{ submit: [password: string] }>()
const password = ref('')

function submit() {
  if (password.value) emit('submit', password.value)
}
</script>

<template>
  <section class="login-shell" aria-labelledby="admin-login-title">
    <div class="login-copy">
      <span class="login-index">/ ADMIN</span>
      <h1 id="admin-login-title">Photo<br />archive.</h1>
      <p>登录后管理 D1 中的图片记录与 R2 中的原图、压缩图和缩略图。</p>
    </div>
    <form class="login-form" @submit.prevent="submit">
      <label for="admin-password">管理密码</label>
      <div class="login-control">
        <input
          id="admin-password"
          v-model="password"
          type="password"
          autocomplete="current-password"
          autofocus
          placeholder="输入 NUXT_ADMIN_PASSWORD"
        />
        <button type="submit" :disabled="loading || !password">
          <span>{{ loading ? '验证中' : '进入' }}</span>
          <i class="i-hugeicons:arrow-up-right-01" aria-hidden="true" />
        </button>
      </div>
      <p v-if="error" class="login-error" role="alert">{{ error }}</p>
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
  padding: 8rem 0 5rem;
  box-sizing: border-box;
}

.login-index {
  display: block;
  margin-bottom: 2rem;
  font-size: 0.66rem;
  letter-spacing: 0.12em;
  opacity: 0.45;
}

.login-copy h1 {
  margin: 0;
  font-size: clamp(4.5rem, 10vw, 8.5rem);
  font-weight: 500;
  line-height: 0.78;
  letter-spacing: -0.085em;
}

.login-copy p {
  max-width: 27rem;
  margin: 2.5rem 0 0;
  font-size: 0.86rem;
  line-height: 1.7;
  opacity: 0.5;
}

.login-form {
  padding-bottom: 0.75rem;
}

.login-form label {
  display: block;
  margin-bottom: 0.75rem;
  font-size: 0.7rem;
  opacity: 0.55;
}

.login-control {
  display: grid;
  grid-template-columns: 1fr auto;
  border-bottom: 1px solid color-mix(in srgb, currentColor 28%, transparent);
}

.login-control input {
  min-width: 0;
  padding: 1rem 0;
  border: 0;
  outline: 0;
  background: transparent;
  color: inherit;
  font: inherit;
}

.login-control input::placeholder {
  color: currentColor;
  opacity: 0.38;
}

.login-control:focus-within {
  border-color: currentColor;
}

.login-control button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0 0 0 1.5rem;
  border: 0;
  background: transparent;
  color: inherit;
  cursor: pointer;
  font: inherit;
}

.login-control button:disabled {
  cursor: not-allowed;
  opacity: 0.35;
}

.login-control button:active:not(:disabled) {
  transform: translateY(1px);
}

.login-error {
  margin: 0.75rem 0 0;
  color: #a13d32;
  font-size: 0.74rem;
}

@media (max-width: 767.9px) {
  .login-shell {
    grid-template-columns: 1fr;
    align-content: space-between;
    width: min(calc(100% - 2rem), 36rem);
    padding: 6.5rem 0 2.5rem;
  }

  .login-copy h1 {
    font-size: clamp(4.2rem, 23vw, 6.5rem);
  }
}
</style>
