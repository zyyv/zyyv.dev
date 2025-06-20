<script setup>
import { onMounted, ref, watch } from 'vue'

const isDark = ref(false)

// Initialize theme based on user preference or system
onMounted(() => {
  // Check local storage first
  const savedTheme = localStorage.getItem('theme')
  if (savedTheme) {
    isDark.value = savedTheme === 'dark'
  }
  else {
    // Otherwise check system preference
    isDark.value = window.matchMedia('(prefers-color-scheme: dark)').matches
  }
  applyTheme(false) // initial load, no transition

  // Listen for system theme changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (!localStorage.getItem('theme')) {
      isDark.value = e.matches
      applyTheme(true)
    }
  })
})

// Watch for theme changes and apply them
watch(isDark, () => {
  applyTheme(true)
  localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
})

// Apply theme to document
function applyTheme(withTransition = true) {
  if (withTransition && document.startViewTransition) {
    document.startViewTransition(() => {
      if (isDark.value) {
        document.documentElement.classList.add('dark')
      }
      else {
        document.documentElement.classList.remove('dark')
      }
    })
  }
  else {
    if (isDark.value) {
      document.documentElement.classList.add('dark')
    }
    else {
      document.documentElement.classList.remove('dark')
    }
  }
}

function toggleTheme() {
  isDark.value = !isDark.value
}
</script>

<template>
  <button
    class="theme-toggle p-2 rounded-full transition-colors duration-200 hover:bg-gray-200 dark:hover:bg-gray-700 relative"
    aria-label="Toggle theme"
    @click="toggleTheme"
  >
    <div class="w-6 h-6 flex items-center justify-center view-transition-theme-icon">
      <!-- Sun icon (for dark mode) -->
      <svg
        v-if="isDark"
        xmlns="http://www.w3.org/2000/svg"
        class="text-yellow-300 transition-opacity"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        stroke-width="2"
        stroke="currentColor"
        fill="none"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
        <path d="M12 12m-4 0a4 4 0 1 0 8 0a4 4 0 1 0 -8 0" />
        <path d="M3 12h1m8 -9v1m8 8h1m-9 8v1m-6.4 -15.4l.7 .7m12.1 -.7l-.7 .7m0 11.4l.7 .7m-12.1 -.7l-.7 .7" />
      </svg>
      <!-- Moon icon (for light mode) -->
      <svg
        v-else
        xmlns="http://www.w3.org/2000/svg"
        class="text-indigo-700 transition-opacity"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        stroke-width="2"
        stroke="currentColor"
        fill="none"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
        <path d="M12 3c.132 0 .263 0 .393 0a7.5 7.5 0 0 0 7.92 12.446a9 9 0 1 1 -8.313 -12.454z" />
      </svg>
    </div>
  </button>
</template>

<style>
@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.theme-toggle:active .view-transition-theme-icon {
  animation: rotate 0.5s;
}

::view-transition-old(root) {
  animation: 0.3s cubic-bezier(0.4, 0, 0.2, 1) both fade-out;
}

::view-transition-new(root) {
  animation: 0.3s cubic-bezier(0.4, 0, 0.2, 1) both fade-in;
}

@keyframes fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes fade-out {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}

/* Special styles for the theme icon transition */
::view-transition-group(theme-icon) {
  animation-duration: 0.4s;
}

::view-transition-old(theme-icon),
::view-transition-new(theme-icon) {
  animation-duration: 0.4s;
}

.view-transition-theme-icon {
  view-transition-name: theme-icon;
}
</style>
