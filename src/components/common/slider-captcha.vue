<script setup lang="ts">
/**
 * 滑动验证组件
 * 参考 vben-admin 实现，拆分子组件
 */
import type { CSSProperties } from 'vue';

import { reactive, ref, unref, watch, watchEffect } from 'vue';

import SliderCaptchaAction from './slider-captcha/slider-captcha-action.vue';
import SliderCaptchaBar from './slider-captcha/slider-captcha-bar.vue';
import SliderCaptchaContent from './slider-captcha/slider-captcha-content.vue';

defineOptions({ name: 'SliderCaptcha' });

export interface SliderCaptchaProps {
  /** 滑块样式 */
  actionStyle?: CSSProperties;
  /** 进度条样式 */
  barStyle?: CSSProperties;
  /** 内容区样式 */
  contentStyle?: CSSProperties;
  /** 容器样式 */
  wrapperStyle?: CSSProperties;
  /** 成功文字 */
  successText?: string;
  /** 提示文字 */
  text?: string;
  /** 自定义类名 */
  class?: string;
}

export interface CaptchaVerifyPassingData {
  isPassing: boolean;
  time: string;
}

export interface SliderMoveData {
  event: MouseEvent | TouchEvent;
  moveDistance: number;
  moveX: number;
}

const props = withDefaults(defineProps<SliderCaptchaProps>(), {
  actionStyle: () => ({}),
  barStyle: () => ({}),
  contentStyle: () => ({}),
  wrapperStyle: () => ({}),
  successText: '验证通过',
  text: '请按住滑块拖动'
});

const emit = defineEmits<{
  end: [MouseEvent | TouchEvent];
  move: [SliderMoveData];
  start: [MouseEvent | TouchEvent];
  success: [CaptchaVerifyPassingData];
}>();

// v-model:isSuccess 双向绑定
const isSuccess = defineModel<boolean>('isSuccess', { default: false });

const state = reactive({
  endTime: 0,
  isMoving: false,
  isPassing: false,
  moveDistance: 0,
  startTime: 0,
  toLeft: false
});

const wrapperRef = ref<HTMLDivElement>();
const barRef = ref<InstanceType<typeof SliderCaptchaBar>>();
const contentRef = ref<InstanceType<typeof SliderCaptchaContent>>();
const actionRef = ref<InstanceType<typeof SliderCaptchaAction>>();

// 监听验证通过状态
watch(
  () => state.isPassing,
  isPassing => {
    if (isPassing) {
      const { endTime, startTime } = state;
      const time = (endTime - startTime) / 1000;
      emit('success', { isPassing, time: time.toFixed(1) });
      isSuccess.value = isPassing;
    }
  }
);

// 同步外部状态
watchEffect(() => {
  state.isPassing = !!isSuccess.value;
});

/** 获取事件的 pageX */
function getEventPageX(e: MouseEvent | TouchEvent): number {
  if ('pageX' in e) {
    return e.pageX;
  } else if ('touches' in e && e.touches[0]) {
    return e.touches[0].pageX;
  }
  return 0;
}

/** 获取偏移量信息 */
function getOffset(actionEl: HTMLDivElement) {
  const wrapperWidth = wrapperRef.value?.offsetWidth ?? 220;
  const actionWidth = actionEl?.offsetWidth ?? 40;
  const offset = wrapperWidth - actionWidth - 6;
  return { actionWidth, offset, wrapperWidth };
}

/** 开始拖拽 */
function handleDragStart(e: MouseEvent | TouchEvent) {
  if (state.isPassing) return;
  if (!actionRef.value) return;

  emit('start', e);

  state.moveDistance =
    getEventPageX(e) - Number.parseInt(actionRef.value.getStyle()?.left?.replace('px', '') || '0', 10);
  state.startTime = Date.now();
  state.isMoving = true;
}

/** 拖拽中 */
function handleDragMoving(e: MouseEvent | TouchEvent) {
  const { isMoving, moveDistance } = state;
  if (!isMoving) return;

  const actionEl = unref(actionRef);
  const barEl = unref(barRef);
  if (!actionEl || !barEl) return;

  const { actionWidth, offset, wrapperWidth } = getOffset(actionEl.getEl()!);
  const moveX = getEventPageX(e) - moveDistance;

  emit('move', { event: e, moveDistance, moveX });

  if (moveX > 0 && moveX <= offset) {
    actionEl.setLeft(`${moveX}px`);
    barEl.setWidth(`${moveX + actionWidth / 2}px`);
  } else if (moveX > offset) {
    actionEl.setLeft(`${wrapperWidth - actionWidth}px`);
    barEl.setWidth(`${wrapperWidth - actionWidth / 2}px`);
    checkPass();
  }
}

/** 拖拽结束 */
function handleDragOver(e: MouseEvent | TouchEvent) {
  const { isMoving, isPassing, moveDistance } = state;
  if (!isMoving || isPassing) return;

  emit('end', e);

  const actionEl = unref(actionRef);
  const barEl = unref(barRef);
  if (!actionEl || !barEl) return;

  const moveX = getEventPageX(e) - moveDistance;
  const { actionWidth, offset, wrapperWidth } = getOffset(actionEl.getEl()!);

  if (moveX < offset) {
    // 未到达终点，回弹
    resume();
  } else {
    // 到达终点
    actionEl.setLeft(`${wrapperWidth - actionWidth}px`);
    barEl.setWidth(`${wrapperWidth - actionWidth / 2}px`);
    checkPass();
  }

  state.isMoving = false;
}

/** 检查是否通过 */
function checkPass() {
  state.endTime = Date.now();
  state.isPassing = true;
  state.isMoving = false;
}

/** 重置状态 */
function resume() {
  state.isMoving = false;
  state.isPassing = false;
  state.moveDistance = 0;
  state.startTime = 0;
  state.endTime = 0;

  const actionEl = unref(actionRef);
  const barEl = unref(barRef);
  const contentEl = unref(contentRef);
  if (!actionEl || !barEl || !contentEl) return;

  contentEl.getEl()!.style.width = '100%';
  state.toLeft = true;

  setTimeout(() => {
    state.toLeft = false;
    actionEl.setLeft('0');
    barEl.setWidth('0');
  }, 300);

  isSuccess.value = false;
}

// 暴露方法
defineExpose({ resume });
</script>

<template>
  <div
    ref="wrapperRef"
    :class="[
      'slider-captcha-wrapper',
      props.class
    ]"
    :style="wrapperStyle"
    @mouseleave="handleDragOver"
    @mousemove="handleDragMoving"
    @mouseup="handleDragOver"
    @touchend="handleDragOver"
    @touchmove="handleDragMoving"
  >
    <SliderCaptchaBar
      ref="barRef"
      :bar-style="barStyle"
      :to-left="state.toLeft"
    />

    <SliderCaptchaContent
      ref="contentRef"
      :content-style="contentStyle"
      :is-passing="state.isPassing"
      :success-text="successText"
      :text="text"
    >
      <template v-if="$slots.text" #text>
        <slot :is-passing="state.isPassing" name="text" />
      </template>
    </SliderCaptchaContent>

    <SliderCaptchaAction
      ref="actionRef"
      :action-style="actionStyle"
      :is-passing="state.isPassing"
      :to-left="state.toLeft"
      @mousedown="handleDragStart"
      @touchstart="handleDragStart"
    >
      <template v-if="$slots.actionIcon" #icon>
        <slot :is-passing="state.isPassing" name="actionIcon" />
      </template>
    </SliderCaptchaAction>
  </div>
</template>

<style scoped>
.slider-captcha-wrapper {
  --captcha-radius: var(--el-input-border-radius, var(--el-border-radius-base));

  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  height: 40px;
  overflow: hidden;
  text-align: center;
  background-color: #e8e8e8;
  border: 1px solid #dcdfe6;
  border-radius: var(--captcha-radius);
}

:root.dark .slider-captcha-wrapper {
  background-color: #1f1f1f;
  border-color: #4a4a4c;
}
</style>
