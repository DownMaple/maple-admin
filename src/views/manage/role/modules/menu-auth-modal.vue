<script setup lang="ts">
import { computed, nextTick, ref, shallowRef, watch } from 'vue';
import type { TreeInstance } from 'element-plus';
import { menuTypeRecord } from '@/constants/business';
import { fetchGetMenuTree, fetchGetRoleMenuIds, updateRoleMenuIds } from '@/service/api';
import { $t } from '@/locales';

defineOptions({ name: 'MenuAuthModal' });

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

const treeProps = {
  label: 'name',
  children: 'children'
} as const;

const treeRef = ref<TreeInstance | null>(null);
const tree = shallowRef<Api.SystemManage.MenuTree[]>([]);
const keyword = ref('');
const loading = ref(false);
const submitting = ref(false);
const linkageEnabled = ref(true);
const selectedKeys = shallowRef<string[]>([]);
const pendingCheckedKeys = shallowRef<string[]>([]);

const title = computed(() => {
  const suffix = props.roleName ? `(${props.roleName})` : '';
  return `${$t('page.manage.role.menuAuth')}${suffix}`;
});
const totalCount = computed(() => collectTreeKeys(tree.value).length);
const selectedCount = computed(() => selectedKeys.value.length);
const summaryText = computed(() => $t('page.manage.role.menuAuthTip'));

function closeModal() {
  visible.value = false;
}

function filterMenuTree(nodes: Api.SystemManage.MenuTree[]): Api.SystemManage.MenuTree[] {
  return nodes
    .filter(item => item.menuType !== 'button')
    .map(item => ({
      ...item,
      children: item.children ? filterMenuTree(item.children) : null
    }));
}

function collectTreeKeys(nodes: Api.SystemManage.MenuTree[]): string[] {
  return nodes.flatMap(item => [item.id, ...(item.children ? collectTreeKeys(item.children) : [])]);
}

function getAllSelectedKeys() {
  const treeInstance = treeRef.value;
  if (!treeInstance) {
    return selectedKeys.value;
  }

  const checkedKeys = treeInstance.getCheckedKeys(false).map(String);
  const halfCheckedKeys = treeInstance.getHalfCheckedKeys().map(String);
  return Array.from(new Set([...checkedKeys, ...halfCheckedKeys]));
}

function syncSelectedKeys() {
  selectedKeys.value = getAllSelectedKeys();
}

function getNormalizedKeys(keys: string[]) {
  return Array.from(new Set(keys.map(String)));
}

function buildLinkedDisplayKeys(nodes: Api.SystemManage.MenuTree[], storedKeys: string[]) {
  const selectedSet = new Set(storedKeys);

  function walk(node: Api.SystemManage.MenuTree): { fullySelected: boolean; keys: string[] } {
    const children = node.children ?? [];

    if (!children.length) {
      const selected = selectedSet.has(node.id);
      return {
        fullySelected: selected,
        keys: selected ? [node.id] : []
      };
    }

    const childStates = children.map(walk);
    const allChildrenFullySelected = childStates.every(item => item.fullySelected);
    const nodeSelected = selectedSet.has(node.id);

    if (nodeSelected && allChildrenFullySelected) {
      return {
        fullySelected: true,
        keys: [node.id]
      };
    }

    return {
      fullySelected: false,
      keys: childStates.flatMap(item => item.keys)
    };
  }

  return nodes.flatMap(item => walk(item).keys);
}

function getDisplayCheckedKeys(keys: string[]) {
  const normalized = getNormalizedKeys(keys);

  if (!linkageEnabled.value) {
    return normalized;
  }

  return buildLinkedDisplayKeys(tree.value, normalized);
}

async function syncTreeCheckedState() {
  if (!treeRef.value) {
    return;
  }

  const displayKeys = getDisplayCheckedKeys(pendingCheckedKeys.value);
  await nextTick();
  treeRef.value.setCheckedKeys([]);
  treeRef.value.setCheckedKeys(displayKeys);
  syncSelectedKeys();
}

function handleKeywordChange(value: string) {
  treeRef.value?.filter(value);
}

function filterNode(value: string, data: Record<string, any>) {
  if (!value) {
    return true;
  }

  return String(data.name ?? '')
    .toLowerCase()
    .includes(value.toLowerCase());
}

function getMenuNodeTagType(menuType: Api.SystemManage.MenuType): UI.ThemeColor {
  return menuType === 'catalog' ? 'info' : 'primary';
}

function getMenuTypeLabel(menuType: Api.SystemManage.MenuType) {
  return $t(menuTypeRecord[menuType]);
}

function getMenuNodeMeta(data: Api.SystemManage.MenuTree) {
  if (data.menuType === 'catalog') {
    return data.path || '/';
  }

  return data.component || data.path || '-';
}

function handleCheck() {
  syncSelectedKeys();
  pendingCheckedKeys.value = selectedKeys.value;
}

function toggleExpand(expanded: boolean) {
  const nodesMap = ((treeRef.value as any)?.store?.nodesMap ?? {}) as Record<string, { expanded: boolean }>;
  Object.values(nodesMap).forEach(node => {
    node.expanded = expanded;
  });
}

async function handleLinkageChange() {
  const currentKeys = getAllSelectedKeys();
  pendingCheckedKeys.value = getNormalizedKeys(currentKeys);
  await syncTreeCheckedState();
}

async function handleSelectAll() {
  pendingCheckedKeys.value = getNormalizedKeys(collectTreeKeys(tree.value));
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
  linkageEnabled.value = true;
  loading.value = true;

  try {
    const [menuTree, roleMenuIds] = await Promise.all([fetchGetMenuTree(), fetchGetRoleMenuIds(props.roleId)]);
    tree.value = filterMenuTree(menuTree);
    pendingCheckedKeys.value = getNormalizedKeys(roleMenuIds.ids);
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
    const ids = getAllSelectedKeys();
    await updateRoleMenuIds(props.roleId, ids);
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
              <ElTag type="primary" effect="dark" round>
                {{ $t('page.manage.role.menuAuth') }}
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
          <ElCheckbox v-model="linkageEnabled" @change="handleLinkageChange">
            {{ $t('page.manage.role.checkStrictly') }}
          </ElCheckbox>
          <ElButton text @click="toggleExpand(true)">{{ $t('page.manage.role.expandAll') }}</ElButton>
          <ElButton text @click="toggleExpand(false)">{{ $t('page.manage.role.collapseAll') }}</ElButton>
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
          :check-strictly="!linkageEnabled"
          :filter-node-method="filterNode"
          class="auth-tree h-360px overflow-y-auto"
          @check="handleCheck"
        >
          <template #default="{ data }">
            <div class="auth-node">
              <div class="min-w-0 flex-1">
                <div class="flex flex-wrap items-center gap-8px">
                  <span class="truncate text-14px font-500 text-[var(--el-text-color-primary)]">
                    {{ data.name }}
                  </span>
                  <ElTag :type="getMenuNodeTagType(data.menuType)" effect="plain" size="small" round>
                    {{ getMenuTypeLabel(data.menuType) }}
                  </ElTag>
                </div>
                <div class="mt-4px truncate text-12px text-[var(--el-text-color-secondary)]">
                  {{ getMenuNodeMeta(data) }}
                </div>
              </div>
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
  background: linear-gradient(135deg, var(--el-color-primary-light-9), var(--el-fill-color-blank));
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
</style>
