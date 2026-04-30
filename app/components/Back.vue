<template>
  <div>
    <slot>
      <button
        op-70
        hover:op-100
        class="group"
        text="#7D7D7D dark:#acbac6"
        bg-transparent
        @click="history.back()"
      >
        <i i-carbon-arrow-left group-hover="mr-2" trans /> cd ··
      </button>
    </slot>
  </div>
</template>
