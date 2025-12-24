<script setup lang="ts">
/**
 * 滑动验证 - 滑块组件
 */
import type { CSSProperties } from 'vue';

import { computed, ref } from 'vue';

const props = defineProps<{
  actionStyle?: CSSProperties;
  isPassing: boolean;
  toLeft: boolean;
}>();

const actionRef = ref<HTMLDivElement>();
const left = ref('0');

const style = computed(() => ({
  ...props.actionStyle,
  left: left.value
}));

const isDragging = computed(() => {
  const currentLeft = Number.parseInt(left.value, 10);
  return currentLeft > 10 && !props.isPassing;
});

defineExpose({
  getEl: () => actionRef.value,
  getStyle: () => actionRef.value?.style,
  setLeft: (val: string) => {
    left.value = val;
  }
});
</script>

<template>
  <div
    ref="actionRef"
    :class="{
      'transition-left': toLeft,
      'is-dragging': isDragging
    }"
    :style="style"
    class="slider-captcha-action"
  >
    <slot name="icon">
      <!-- 双箭头图标 -->
      <svg v-if="!isPassing" viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
        <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" />
        <path d="M13.59 16.59L18.17 12 13.59 7.41 15 6l6 6-6 6-1.41-1.41z" opacity="0.6" />
      </svg>
      <!-- 勾选图标 -->
      <svg v-else viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
      </svg>
    </slot>
  </div>
</template>

<style scoped>
.slider-captcha-action {
  position: absolute;
  top: 0;
  left: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 0 14px;
  color: #606266;
  cursor: grab;
  background-color: #fff;
  border-radius: 0 var(--captcha-radius) var(--captcha-radius) 0;
  box-shadow: 0 2px 4px rgb(0 0 0 / 10%);
  transition: background-color 0.2s;
}

.slider-captcha-action:hover {
  background-color: #f5f5f5;
}

.slider-captcha-action:active {
  cursor: grabbing;
}

/* 暗色主题 */
:root.dark .slider-captcha-action {
  color: #a0a0a0;
  background-color: #4a4a4c;
}

:root.dark .slider-captcha-action:hover {
  background-color: #5a5a5c;
}

.is-dragging {
  border-radius: 6px;
}

.transition-left {
  left: 0 !important;
  transition: left 0.3s ease-out;
}
</style>
