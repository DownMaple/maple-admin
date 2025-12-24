<script setup lang="ts">
/**
 * 滑动验证 - 进度条组件
 */
import type { CSSProperties } from 'vue';

import { computed, ref } from 'vue';

const props = defineProps<{
  barStyle?: CSSProperties;
  toLeft: boolean;
}>();

const barRef = ref<HTMLDivElement>();
const width = ref('0');

const style = computed(() => ({
  ...props.barStyle,
  width: width.value
}));

defineExpose({
  getEl: () => barRef.value,
  setWidth: (val: string) => {
    width.value = val;
  }
});
</script>

<template>
  <div
    ref="barRef"
    :class="toLeft && 'transition-width'"
    :style="style"
    class="slider-captcha-bar"
  />
</template>

<style scoped>
.slider-captcha-bar {
  position: absolute;
  height: 100%;
  background: linear-gradient(135deg, #52c41a 0%, #73d13d 100%);
  border-radius: var(--captcha-radius) 0 0 var(--captcha-radius);
}

.transition-width {
  width: 0 !important;
  transition: width 0.3s ease-out;
}
</style>
