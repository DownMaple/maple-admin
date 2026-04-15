<script setup lang="ts">
import { computed, nextTick, ref, shallowRef, watch } from 'vue';
import type { TreeInstance } from 'element-plus';
import { fetchGetButtonOptions, fetchGetRoleButtonIds, updateRoleButtonIds } from '@/service/api';
import { $t } from '@/locales';

defineOptions({ name: 'ButtonAuthModal' });

interface Props {
  roleId: string;
  roleName?: string;
}

interface Emits {
  (e: 'closed'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const visible = defineModel<boolean>('visible', {
  default: false
});

const treeRef = ref<TreeInstance | null>(null);
const tree = shallowRef<Api.SystemManage.ButtonOption[]>([]);
const keyword = ref('');
const loading = ref(false);
const submitting = ref(false);
const selectedKeys = shallowRef<string[]>([]);
const pendingCheckedKeys = shallowRef<string[]>([]);

const treeProps = {
  label: 'label',
  children: 'children'
} as const;

const title = computed(() => {
  const suffix = props.roleName ? `(${props.roleName})` : '';
  return `${$t('page.manage.role.buttonAuth')}${suffix}`;
});
const totalCount = computed(() => tree.value.length);
const selectedCount = computed(() => selectedKeys.value.length);
const summaryText = computed(() => $t('page.manage.role.buttonAuthTip'));

function closeModal() {
  visible.value = false;
}

function getCheckedKeys() {
  return treeRef.value?.getCheckedKeys(false).map(String) ?? selectedKeys.value;
}

function getNormalizedKeys(keys: string[]) {
  return Array.from(new Set(keys.map(String)));
}

async function syncTreeCheckedState() {
  if (!treeRef.value) {
    return;
  }

  await nextTick();
  treeRef.value.setCheckedKeys([]);
  treeRef.value.setCheckedKeys(pendingCheckedKeys.value);
  selectedKeys.value = getCheckedKeys();
}

function filterNode(value: string, data: Record<string, any>) {
  if (!value) {
    return true;
  }

  return String(data.label ?? '')
    .toLowerCase()
    .includes(value.toLowerCase());
}

function handleKeywordChange(value: string) {
  treeRef.value?.filter(value);
}

function handleCheck() {
  selectedKeys.value = getCheckedKeys();
  pendingCheckedKeys.value = selectedKeys.value;
}

function getButtonTitle(label: string) {
  const parts = label
    .split('/')
    .map(item => item.trim())
    .filter(Boolean);

  return parts.at(-1) ?? label;
}

function getButtonPath(label: string) {
  const parts = label
    .split('/')
    .map(item => item.trim())
    .filter(Boolean);

  return parts.slice(0, -1).join(' / ') || '-';
}

async function handleSelectAll() {
  pendingCheckedKeys.value = getNormalizedKeys(tree.value.map(item => item.id));
  await syncTreeCheckedState();
}

async function handleClear() {
  selectedKeys.value = [];
  pendingCheckedKeys.value = [];
  await syncTreeCheckedState();
}

async function init() {
  if (!props.roleId) {
    tree.value = [];
    selectedKeys.value = [];
    pendingCheckedKeys.value = [];
    return;
  }

  keyword.value = '';
  loading.value = true;

  try {
    const [buttons, roleButtonIds] = await Promise.all([
      fetchGetButtonOptions(),
      fetchGetRoleButtonIds(props.roleId)
    ]);

    tree.value = buttons;
    pendingCheckedKeys.value = getNormalizedKeys(roleButtonIds.ids);
    await syncTreeCheckedState();
  } catch {
    tree.value = [];
    selectedKeys.value = [];
    pendingCheckedKeys.value = [];
  } finally {
    loading.value = false;
  }
}

async function handleOpened() {
  await syncTreeCheckedState();
  handleKeywordChange(keyword.value);
}

async function handleSubmit() {
  if (!props.roleId) {
    return;
  }

  submitting.value = true;
  try {
    await updateRoleButtonIds(props.roleId, getCheckedKeys());
    window.$message?.success?.($t('common.modifySuccess'));
    closeModal();
  } finally {
    submitting.value = false;
  }
}

watch(visible, value => {
  if (value) {
    void init();
    return;
  }

  keyword.value = '';
});
</script>

<template>
  <ElDialog
    v-model="visible"
    :title="title"
    width="min(760px, calc(100vw - 24px))"
    @opened="handleOpened"
    @closed="emit('closed')"
  >
    <div v-loading="loading" class="flex-col-stretch gap-14px">
      <div class="auth-summary">
        <div class="flex items-start justify-between gap-12px">
          <div class="min-w-0 flex-1">
            <div class="flex flex-wrap items-center gap-8px">
              <span class="text-16px font-600 text-[var(--el-text-color-primary)]">
                {{ roleName || '-' }}
              </span>
              <ElTag type="warning" effect="dark" round>
                {{ $t('page.manage.role.buttonAuth') }}
              </ElTag>
            </div>
            <p class="mt-8px text-13px leading-20px text-[var(--el-text-color-secondary)]">
              {{ summaryText }}
            </p>
          </div>
          <div class="flex shrink-0 flex-wrap items-center justify-end gap-8px">
            <ElTag type="info" effect="plain" round>
              {{ $t('page.manage.role.selectedCount') }} {{ selectedCount }}
            </ElTag>
            <ElTag type="success" effect="plain" round>
              {{ $t('page.manage.role.totalCount') }} {{ totalCount }}
            </ElTag>
          </div>
        </div>
      </div>
      <ElInput
        v-model="keyword"
        clearable
        :placeholder="$t('common.keywordSearch')"
        @input="handleKeywordChange"
      />
      <div class="auth-toolbar">
        <div class="flex flex-wrap items-center gap-12px">
          <ElButton text @click="handleSelectAll">{{ $t('page.manage.role.selectAll') }}</ElButton>
          <ElButton text @click="handleClear">{{ $t('page.manage.role.clearSelected') }}</ElButton>
        </div>
        <div class="text-12px text-[var(--el-text-color-secondary)]">{{ roleName || '-' }}</div>
      </div>
      <div class="auth-tree-panel">
        <ElTree
          ref="treeRef"
          :data="tree"
          :props="treeProps"
          node-key="id"
          show-checkbox
          default-expand-all
          :filter-node-method="filterNode"
          class="auth-tree h-360px overflow-y-auto"
          @check="handleCheck"
        >
          <template #default="{ data }">
            <div class="auth-node">
              <div class="min-w-0 flex-1">
                <div class="flex flex-wrap items-center gap-8px">
                  <span class="truncate text-14px font-500 text-[var(--el-text-color-primary)]">
                    {{ getButtonTitle(data.label) }}
                  </span>
                  <ElTag type="warning" effect="plain" size="small" round>
                    {{ $t('page.manage.menu.permission') }}
                  </ElTag>
                </div>
                <div class="mt-4px truncate text-12px text-[var(--el-text-color-secondary)]">
                  {{ getButtonPath(data.label) }}
                </div>
              </div>
              <code class="auth-code">{{ data.code }}</code>
            </div>
          </template>
        </ElTree>
        <ElEmpty v-if="!loading && !tree.length" :description="$t('common.noData')" :image-size="72" />
      </div>
    </div>
    <template #footer>
      <ElSpace class="w-full justify-end">
        <ElButton @click="closeModal">{{ $t('common.cancel') }}</ElButton>
        <ElButton type="primary" :loading="submitting" @click="handleSubmit">
          {{ $t('common.confirm') }}
        </ElButton>
      </ElSpace>
    </template>
  </ElDialog>
</template>

<style scoped lang="scss">
.auth-summary {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 14px;
  padding: 16px;
  background: linear-gradient(135deg, var(--el-color-warning-light-9), var(--el-fill-color-blank));
}

.auth-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border-radius: 12px;
  padding: 12px 14px;
  background: var(--el-fill-color-light);
  border: 1px solid var(--el-border-color-lighter);
}

.auth-tree-panel {
  border: 1px solid var(--el-border-color-light);
  border-radius: 14px;
  padding: 12px;
  background: var(--el-fill-color-blank);
}

.auth-tree {
  :deep(.el-tree-node__content) {
    height: auto;
    min-height: 42px;
    padding-block: 6px;
    border-radius: 10px;
  }

  :deep(.el-tree-node__content:hover) {
    background-color: var(--el-fill-color-light);
  }
}

.auth-node {
  width: 100%;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 12px;
  padding-right: 12px;
}

.auth-code {
  max-width: 240px;
  flex-shrink: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  border-radius: 999px;
  padding: 4px 10px;
  background: var(--el-fill-color-light);
  color: var(--el-text-color-regular);
  font-size: 12px;
}
</style>
