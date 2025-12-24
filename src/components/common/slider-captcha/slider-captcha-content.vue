<script setup lang="ts">
/**
 * 滑动验证 - 内容区组件
 */
import type { CSSProperties } from 'vue';

import { computed, ref } from 'vue';

const props = defineProps<{
  contentStyle?: CSSProperties;
  isPassing: boolean;
  successText: string;
  text: string;
}>();

const contentRef = ref<HTMLDivElement>();

const style = computed(() => ({
  ...props.contentStyle
}));

defineExpose({
  getEl: () => contentRef.value
});
</script>

<template>
  <div
    ref="contentRef"
    :class="{ 'is-success': isPassing }"
    :style="style"
    class="slider-captcha-content"
  >
    <slot name="text">
      <span class="slider-captcha-text" :class="{ shimmer: !isPassing }">
        {{ isPassing ? successText : text }}
      </span>
    </slot>
  </div>
</template>

<style scoped>
.slider-captcha-content {
  position: absolute;
  top: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  font-size: 14px;
  user-select: none;
}

.slider-captcha-text {
  letter-spacing: 2px;
}

/* 流光文字效果 */
.slider-captcha-text.shimmer {
  color: transparent;
  background: linear-gradient(90deg, #9ca3af 0%, #9ca3af 40%, #374151 50%, #9ca3af 60%, #9ca3af 100%);
  background-size: 200% 100%;
  background-clip: text;
  -webkit-background-clip: text;
  animation: shimmer 2s infinite linear;
}

:root.dark .slider-captcha-text.shimmer {
  background: linear-gradient(90deg, #6b7280 0%, #6b7280 40%, #d1d5db 50%, #6b7280 60%, #6b7280 100%);
  background-size: 200% 100%;
  background-clip: text;
  -webkit-background-clip: text;
}

@keyframes shimmer {
  0% {
    background-position: 100% 0;
  }
  100% {
    background-position: -100% 0;
  }
}

/* 成功状态 - 白色文字 */
.is-success .slider-captcha-text {
  color: #fff;
  background: none;
  -webkit-text-fill-color: #fff;
  animation: none;
}
</style>
