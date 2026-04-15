<script setup lang="tsx">
import { computed, reactive, ref } from 'vue';
import type { Ref } from 'vue';
import { ElButton, ElPopconfirm, ElTag } from 'element-plus';
import { useBoolean } from '@sa/hooks';
import { yesOrNoRecord } from '@/constants/common';
import { enableStatusOptions, enableStatusRecord, menuTypeOptions, menuTypeRecord } from '@/constants/business';
import { batchDeleteMenu, deleteMenu, fetchGetMenuList } from '@/service/api';
import { useAuth } from '@/hooks/business/auth';
import { useTableOperate, useUITable } from '@/hooks/common/table';
import { $t } from '@/locales';
import SvgIcon from '@/components/custom/svg-icon.vue';
import MenuOperateModal, { type OperateType } from './modules/menu-operate-modal.vue';

defineOptions({ name: 'MenuManage' });

type MenuSearchModel = {
  keyword: string;
  menuType?: Api.SystemManage.MenuType;
  status?: Api.Common.EnableStatus;
};

const pageModules = import.meta.glob('/src/views/**/*.vue');

function getAllPages() {
  return Object.keys(pageModules)
    .filter(path => !path.includes('/modules/'))
    .filter(path => !path.includes('/_builtin/'))
    .map(path => path.replace(/^\/src/, '').replace(/\.vue$/, ''))
    .map(path => {
      if (path.startsWith('/views/manage/')) {
        return path.replace('/views/manage/', '/views/system/');
      }
      return path;
    })
    .sort((a, b) => a.localeCompare(b));
}

const { bool: visible, setTrue: openModal } = useBoolean();
const searchModel = reactive<MenuSearchModel>({
  keyword: '',
  menuType: undefined,
  status: undefined
});
const appliedSearchModel = ref<MenuSearchModel>({ ...searchModel });
const { hasAuth } = useAuth();
const canAddMenu = computed(() => hasAuth('system:menu:add'));
const canEditMenu = computed(() => hasAuth('system:menu:edit'));
const canDeleteMenu = computed(() => hasAuth('system:menu:delete'));

const { columns, columnChecks, data, loading, getData } = useUITable<Api.SystemManage.MenuList, Api.SystemManage.Menu>({
  api: fetchGetMenuList,
  transform: response => response ?? [],
  columns: () => [
    { prop: 'selection', type: 'selection', width: 48, selectable: () => canDeleteMenu.value },
    {
      prop: 'name',
      label: $t('page.manage.menu.menuName'),
      minWidth: 120
    },
    {
      prop: 'parentName',
      label: $t('page.manage.menu.parentName'),
      minWidth: 120,
      formatter: row => parentNameMap.value.get(row.id) ?? '-'
    },
    {
      prop: 'menuType',
      label: $t('page.manage.menu.menuType'),
      width: 90,
      formatter: row => {
        const tagMap: Record<Api.SystemManage.MenuType, UI.ThemeColor> = {
          catalog: 'info',
          menu: 'primary',
          button: 'warning'
        };

        const label = $t(menuTypeRecord[row.menuType]);

        return <ElTag type={tagMap[row.menuType]}>{label}</ElTag>;
      }
    },
    {
      prop: 'icon',
      label: $t('page.manage.menu.icon'),
      width: 100,
      formatter: row => (
        <div class="flex-center">
          <SvgIcon icon={row.icon || ''} class="text-icon" />
        </div>
      )
    },
    { prop: 'path', label: $t('page.manage.menu.routePath'), minWidth: 120 },
    { prop: 'component', label: $t('page.manage.menu.page'), minWidth: 160 },
    {
      prop: 'permission',
      label: $t('page.manage.menu.permission'),
      minWidth: 150,
      formatter: row => row.permission || '-'
    },
    {
      prop: 'status',
      label: $t('page.manage.menu.menuStatus'),
      width: 80,
      formatter: row => {
        if (row.status === undefined) {
          return '';
        }

        const status = String(row.status) as Api.Common.EnableStatus;
        const tagMap: Record<Api.Common.EnableStatus, UI.ThemeColor> = {
          1: 'success',
          2: 'warning'
        };

        const label = $t(enableStatusRecord[status]);

        return <ElTag type={tagMap[status]}>{label}</ElTag>;
      }
    },
    {
      prop: 'isShow',
      label: $t('page.manage.menu.hideInMenu'),
      width: 100,
      formatter: row => {
        const hide: CommonType.YesOrNo = row.isShow ? 'N' : 'Y';

        const tagMap: Record<CommonType.YesOrNo, UI.ThemeColor> = {
          Y: 'danger',
          N: 'info'
        };

        const label = $t(yesOrNoRecord[hide]);

        return <ElTag type={tagMap[hide]}>{label}</ElTag>;
      }
    },
    { prop: 'sort', label: $t('page.manage.menu.order'), width: 60 },
    {
      prop: 'operate',
      label: $t('common.operate'),
      width: 270,
      formatter: row => (
        <div class="flex-center justify-center pr-10px">
          {row.menuType !== 'button' && (
            <ElButton
              type="primary"
              plain
              size="small"
              disabled={!canAddMenu.value}
              onClick={() => canAddMenu.value && handleAddChildMenu(row)}
            >
              {$t('page.manage.menu.addChildMenu')}
            </ElButton>
          )}
          <ElButton
            type="primary"
            plain
            size="small"
            disabled={!canEditMenu.value}
            onClick={() => canEditMenu.value && handleEdit(row)}
          >
            {$t('common.edit')}
          </ElButton>
          {canDeleteMenu.value ? (
            <ElPopconfirm title={$t('common.confirmDelete')} onConfirm={() => handleDelete(row.id)}>
              {{
                reference: () => (
                  <ElButton type="danger" plain size="small">
                    {$t('common.delete')}
                  </ElButton>
                )
              }}
            </ElPopconfirm>
          ) : (
            <ElButton type="danger" plain size="small" disabled>
              {$t('common.delete')}
            </ElButton>
          )}
        </div>
      )
    }
  ]
});

const { checkedRowKeys, onBatchDeleted, onDeleted } = useTableOperate(data, 'id', getData);

const operateType = ref<OperateType>('add');
const editingData: Ref<Api.SystemManage.Menu | null> = ref(null);
const allPages = ref<string[]>(getAllPages());
const parentNameMap = computed(() => {
  const map = new Map<string, string>();

  function travel(nodes: Api.SystemManage.Menu[]) {
    nodes.forEach(node => {
      map.set(node.id, node.parentId ? nodeIdMap.value.get(node.parentId)?.name ?? '-' : '-');
      if (node.children?.length) {
        travel(node.children);
      }
    });
  }

  travel(data.value);
  return map;
});
const nodeIdMap = computed(() => {
  const map = new Map<string, Api.SystemManage.Menu>();

  function travel(nodes: Api.SystemManage.Menu[]) {
    nodes.forEach(node => {
      map.set(node.id, node);
      if (node.children?.length) {
        travel(node.children);
      }
    });
  }

  travel(data.value);
  return map;
});
const filteredData = computed(() => filterMenuTree(data.value, appliedSearchModel.value));

function handleAdd() {
  operateType.value = 'add';
  editingData.value = null;
  openModal();
}

async function handleBatchDelete() {
  if (!checkedRowKeys.value.length) {
    return;
  }

  await batchDeleteMenu(checkedRowKeys.value);
  await onBatchDeleted();
}

async function handleDelete(id: string) {
  await deleteMenu(id);
  await onDeleted();
}

function handleEdit(item: Api.SystemManage.Menu) {
  operateType.value = 'edit';
  editingData.value = { ...item };
  openModal();
}

function handleAddChildMenu(item: Api.SystemManage.Menu) {
  operateType.value = 'addChild';
  editingData.value = { ...item };
  openModal();
}

function handleSelectionChange(rows: Api.SystemManage.Menu[]) {
  checkedRowKeys.value = rows.map(item => item.id);
}

function handleSearch() {
  appliedSearchModel.value = { ...searchModel };
}

function handleReset() {
  Object.assign(searchModel, {
    keyword: '',
    menuType: undefined,
    status: undefined
  });
  appliedSearchModel.value = { ...searchModel };
}

function filterMenuTree(nodes: Api.SystemManage.Menu[], filters: MenuSearchModel): Api.SystemManage.Menu[] {
  return nodes.reduce<Api.SystemManage.Menu[]>((result, item) => {
    const children = item.children ? filterMenuTree(item.children, filters) : [];
    const status = item.status === undefined ? undefined : (String(item.status) as Api.Common.EnableStatus);
    const keyword = filters.keyword.trim().toLowerCase();
    const matchKeyword =
      !keyword ||
      [item.name, item.path, item.component, item.permission]
        .filter(Boolean)
        .some(field => String(field).toLowerCase().includes(keyword));
    const matchMenuType = !filters.menuType || item.menuType === filters.menuType;
    const matchStatus = !filters.status || status === filters.status;

    if ((matchKeyword && matchMenuType && matchStatus) || children.length) {
      result.push({
        ...item,
        children: children.length ? children : null
      });
    }

    return result;
  }, []);
}
</script>

<template>
  <div class="flex-col-stretch gap-16px overflow-hidden lt-sm:overflow-auto">
    <ElCard class="card-wrapper">
      <ElForm :model="searchModel" label-position="right" :label-width="80">
        <ElRow :gutter="16">
          <ElCol :lg="8" :md="12" :sm="24">
            <ElFormItem :label="$t('common.search')">
              <ElInput v-model="searchModel.keyword" clearable :placeholder="$t('common.keywordSearch')" />
            </ElFormItem>
          </ElCol>
          <ElCol :lg="6" :md="6" :sm="12">
            <ElFormItem :label="$t('page.manage.menu.menuType')">
              <ElSelect v-model="searchModel.menuType" clearable>
                <ElOption
                  v-for="item in menuTypeOptions"
                  :key="item.value"
                  :label="$t(item.label)"
                  :value="item.value"
                />
              </ElSelect>
            </ElFormItem>
          </ElCol>
          <ElCol :lg="6" :md="6" :sm="12">
            <ElFormItem :label="$t('page.manage.menu.menuStatus')">
              <ElSelect v-model="searchModel.status" clearable>
                <ElOption
                  v-for="item in enableStatusOptions"
                  :key="item.value"
                  :label="$t(item.label)"
                  :value="item.value"
                />
              </ElSelect>
            </ElFormItem>
          </ElCol>
          <ElCol :lg="4" :md="24" :sm="24">
            <ElSpace class="w-full justify-end">
              <ElButton @click="handleReset">{{ $t('common.reset') }}</ElButton>
              <ElButton type="primary" plain @click="handleSearch">{{ $t('common.search') }}</ElButton>
            </ElSpace>
          </ElCol>
        </ElRow>
      </ElForm>
    </ElCard>
    <ElCard class="card-wrapper sm:flex-1-hidden" body-class="ht50">
      <template #header>
        <div class="flex items-center justify-between">
          <p>{{ $t('page.manage.menu.title') }}</p>
          <TableHeaderOperation
            v-model:columns="columnChecks"
            :disabled-add="!canAddMenu"
            :disabled-delete="checkedRowKeys.length === 0 || !canDeleteMenu"
            :loading="loading"
            @add="handleAdd"
            @delete="handleBatchDelete"
            @refresh="getData"
          />
        </div>
      </template>
      <div class="h-[calc(100%-50px)]">
        <ElTable
          v-loading="loading"
          height="100%"
          border
          class="sm:h-full"
          :data="filteredData"
          row-key="id"
          default-expand-all
          @selection-change="handleSelectionChange"
        >
          <ElTableColumn v-for="col in columns" :key="col.prop" v-bind="col" />
        </ElTable>
      </div>
      <MenuOperateModal
        v-model:visible="visible"
        :operate-type="operateType"
        :row-data="editingData"
        :all-pages="allPages"
        :menu-tree="data"
        @submitted="getData"
      />
    </ElCard>
  </div>
</template>

<style lang="scss" scoped>
:deep(.el-card) {
  .ht50 {
    height: calc(100% - 50px);
  }
}
</style>
