<script setup lang="ts">
const { mutating, logout } = useAdminSession()

const destinations = [
  {
    index: '01',
    title: 'Photo archive',
    description: '上传、整理并设置照片的公开状态。',
    to: '/admin/photos',
    icon: 'i-hugeicons:image-03',
  },
  {
    index: '02',
    title: 'Bookmarks',
    description: '在公开页面直接维护书签与文件夹。',
    to: '/bookmarks',
    icon: 'i-hugeicons:book-open-02',
  },
] as const

async function handleLogout() {
  await logout()
}
</script>

<template>
  <section class="portal-shell" aria-labelledby="admin-portal-title">
    <header class="portal-header">
      <div>
        <span class="portal-index">PRIVATE / ACTIVE</span>
        <h1 id="admin-portal-title">Control<br />room.</h1>
      </div>
      <div class="portal-session">
        <span><i aria-hidden="true" /> 私密会话已启用</span>
        <button type="button" :disabled="mutating" @click="handleLogout">
          {{ mutating ? '正在退出' : '结束会话' }}
        </button>
      </div>
    </header>

    <div class="portal-grid">
      <NuxtLink v-for="item in destinations" :key="item.to" :to="item.to" class="portal-card">
        <div class="portal-card__top">
          <span>{{ item.index }}</span>
          <i :class="item.icon" aria-hidden="true" />
        </div>
        <div>
          <h2>{{ item.title }}</h2>
          <p>{{ item.description }}</p>
        </div>
        <i class="i-hugeicons:arrow-up-right-01 portal-card__arrow" aria-hidden="true" />
      </NuxtLink>
    </div>

    <footer class="portal-footer">
      <p>私密会话同时作用于站点内容页；维护工具不会对普通访客显示。</p>
      <NuxtLink to="/">返回站点</NuxtLink>
    </footer>
  </section>
</template>

<style scoped>
.portal-shell {
  width: min(calc(100% - 3rem), 76rem);
  min-height: 100dvh;
  margin: 0 auto;
  padding: 7rem 0 4rem;
  box-sizing: border-box;
}
.portal-header {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 2rem;
}
.portal-index {
  display: block;
  margin-bottom: 1.5rem;
  font-size: 0.62rem;
  letter-spacing: 0.14em;
  opacity: 0.44;
}
.portal-header h1 {
  margin: 0;
  font-size: clamp(4.5rem, 10vw, 8.5rem);
  font-weight: 500;
  line-height: 0.78;
  letter-spacing: -0.085em;
}
.portal-session {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding-bottom: 0.4rem;
}
.portal-session span {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  font-size: 0.62rem;
  opacity: 0.5;
}
.portal-session span i {
  width: 0.35rem;
  height: 0.35rem;
  border-radius: 50%;
  background: #568c68;
}
.portal-session button {
  min-height: 2.2rem;
  padding: 0 0.75rem;
  border: 1px solid color-mix(in srgb, currentColor 16%, transparent);
  border-radius: 0.55rem;
  background: transparent;
  color: inherit;
  cursor: pointer;
  font: inherit;
  font-size: 0.65rem;
}
.portal-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
  margin-top: clamp(4rem, 8vw, 7rem);
}
.portal-card {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 16rem;
  padding: 1.25rem;
  overflow: hidden;
  border: 1px solid color-mix(in srgb, currentColor 14%, transparent);
  border-radius: 0.9rem;
  background: color-mix(in srgb, currentColor 3%, transparent);
  color: inherit;
  text-decoration: none;
  transition:
    transform 240ms cubic-bezier(0.16, 1, 0.3, 1),
    background-color 240ms ease;
}
.portal-card:hover {
  background: color-mix(in srgb, currentColor 6%, transparent);
  transform: translateY(-0.2rem);
}
.portal-card:active {
  transform: translateY(0);
}
.portal-card__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.62rem;
  opacity: 0.48;
}
.portal-card__top > i {
  font-size: 1.2rem;
}
.portal-card h2 {
  margin: 0;
  font-size: clamp(1.75rem, 4vw, 3rem);
  font-weight: 500;
  letter-spacing: -0.055em;
}
.portal-card p {
  margin: 0.6rem 0 0;
  font-size: 0.72rem;
  line-height: 1.6;
  opacity: 0.48;
}
.portal-card__arrow {
  position: absolute;
  right: 1.25rem;
  bottom: 1.25rem;
  font-size: 1.2rem;
  opacity: 0.45;
}
.portal-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2rem;
  margin-top: 1.25rem;
  padding-top: 1.25rem;
  border-top: 1px solid color-mix(in srgb, currentColor 12%, transparent);
}
.portal-footer p {
  max-width: 35rem;
  margin: 0;
  font-size: 0.65rem;
  line-height: 1.65;
  opacity: 0.45;
}
.portal-footer a {
  color: inherit;
  font-size: 0.68rem;
  text-underline-offset: 0.2rem;
}
@media (max-width: 767.9px) {
  .portal-shell {
    width: min(calc(100% - 2rem), 40rem);
    padding: 5.75rem 0 6rem;
  }
  .portal-header {
    align-items: flex-start;
    flex-direction: column;
  }
  .portal-header h1 {
    font-size: clamp(4.2rem, 23vw, 6.5rem);
  }
  .portal-grid {
    grid-template-columns: 1fr;
    margin-top: 3.5rem;
  }
  .portal-card {
    min-height: 13rem;
  }
  .portal-footer {
    align-items: flex-start;
    flex-direction: column;
  }
}
@media (prefers-reduced-motion: reduce) {
  .portal-card {
    transition: none;
  }
}
</style>
