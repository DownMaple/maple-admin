<script setup lang="tsx">
import { computed, reactive, ref } from 'vue';
import { ElButton, ElPopconfirm, ElTag } from 'element-plus';
import { enableStatusRecord } from '@/constants/business';
import { batchDeleteRole, deleteRole, fetchGetRoleList } from '@/service/api';
import { useAuth } from '@/hooks/business/auth';
import { defaultTransform, useTableOperate, useUIPaginatedTable } from '@/hooks/common/table';
import { $t } from '@/locales';
import ButtonAuthModal from './modules/button-auth-modal.vue';
import MenuAuthModal from './modules/menu-auth-modal.vue';
import RoleOperateDrawer from './modules/role-operate-drawer.vue';
import RoleSearch from './modules/role-search.vue';

defineOptions({ name: 'RoleManage' });

const SUPER_ADMIN_ROLE_ID = 'a0000000-0000-0000-0000-000000000001';
const SUPER_ADMIN_ROLE_CODE = 'superAdmin';

const searchParams = reactive(getInitSearchParams());
const menuAuthVisible = ref(false);
const buttonAuthVisible = ref(false);
const permissionRole = ref<Api.SystemManage.Role | null>(null);
const { hasAuth } = useAuth();
const canAddRole = computed(() => hasAuth('system:role:add'));
const canEditRole = computed(() => hasAuth('system:role:edit'));
const canDeleteRole = computed(() => hasAuth('system:role:delete'));
const canMenuAuthRole = computed(() => hasAuth('system:role:menu'));
const canButtonAuthRole = computed(() => hasAuth('system:role:button'));

function isProtectedRole(row: Api.SystemManage.Role) {
  return row.id === SUPER_ADMIN_ROLE_ID || row.roleCode === SUPER_ADMIN_ROLE_CODE;
}

function getInitSearchParams(): Api.SystemManage.RoleSearchParams {
  return {
    current: 1,
    size: 10,
    status: undefined,
    roleName: undefined,
    roleCode: undefined
  };
}

const { columns, columnChecks, data, loading, getData, getDataByPage, pagination, mobilePagination } = useUIPaginatedTable({
  paginationProps: {
    currentPage: searchParams.current,
    pageSize: searchParams.size
  },
  api: () => fetchGetRoleList(searchParams),
  transform: response => defaultTransform(response),
  onPaginationParamsChange: params => {
    searchParams.current = params.currentPage;
    searchParams.size = params.pageSize;
  },
  columns: () => [
    { prop: 'selection', type: 'selection', width: 48, selectable: row => canDeleteRole.value && !isProtectedRole(row) },
    { prop: 'index', type: 'index', label: $t('common.index'), width: 64 },
    { prop: 'roleName', label: $t('page.manage.role.roleName'), minWidth: 120 },
    { prop: 'roleCode', label: $t('page.manage.role.roleCode'), minWidth: 120 },
    { prop: 'roleDesc', label: $t('page.manage.role.roleDesc'), minWidth: 120 },
    {
      prop: 'status',
      label: $t('page.manage.role.roleStatus'),
      width: 100,
      formatter: row => {
        if (row.status === undefined) {
          return '';
        }

        const tagMap: Record<Api.Common.EnableStatus, UI.ThemeColor> = {
          1: 'success',
          2: 'warning'
        };

        const label = $t(enableStatusRecord[row.status]);

        return <ElTag type={tagMap[row.status]}>{label}</ElTag>;
      }
    },
    {
      prop: 'permission',
      label: $t('page.manage.role.permissionConfig'),
      width: 220,
      formatter: row => {
        const protectedRole = isProtectedRole(row);

        return (
          <div class="flex-center justify-center gap-8px">
            <ElButton
              type="primary"
              plain
              size="small"
              disabled={protectedRole || !canMenuAuthRole.value}
              onClick={() => !protectedRole && canMenuAuthRole.value && openMenuAuth(row)}
            >
              {$t('page.manage.role.menuAuth')}
            </ElButton>
            <ElButton
              type="warning"
              plain
              size="small"
              disabled={protectedRole || !canButtonAuthRole.value}
              onClick={() => !protectedRole && canButtonAuthRole.value && openButtonAuth(row)}
            >
              {$t('page.manage.role.buttonAuth')}
            </ElButton>
          </div>
        );
      }
    },
    {
      prop: 'operate',
      label: $t('common.operate'),
      width: 170,
      formatter: row => {
        const protectedRole = isProtectedRole(row);

        return (
          <div class="flex-center gap-8px">
            <ElButton
              type="primary"
              plain
              size="small"
              disabled={protectedRole || !canEditRole.value}
              onClick={() => !protectedRole && canEditRole.value && edit(row.id)}
            >
              {$t('common.edit')}
            </ElButton>
            {protectedRole || !canDeleteRole.value ? (
              <ElButton type="danger" plain size="small" disabled>
                {$t('common.delete')}
              </ElButton>
            ) : (
              <ElPopconfirm title={$t('common.confirmDelete')} onConfirm={() => handleDelete(row.id)}>
                {{
                  reference: () => (
                    <ElButton type="danger" plain size="small">
                      {$t('common.delete')}
                    </ElButton>
                  )
                }}
              </ElPopconfirm>
            )}
          </div>
        );
      }
    }
  ]
});

const { drawerVisible, operateType, editingData, handleAdd, handleEdit, checkedRowKeys, onBatchDeleted, onDeleted } =
  useTableOperate(data, 'id', getData);

async function handleBatchDelete() {
  if (!checkedRowKeys.value.length) {
    return;
  }

  await batchDeleteRole(checkedRowKeys.value);
  await onBatchDeleted();
}

async function handleDelete(id: string) {
  await deleteRole(id);
  await onDeleted();
}

function resetSearchParams() {
  Object.assign(searchParams, getInitSearchParams());
  void getDataByPage(1);
}

function updateSearchParams(params: Api.SystemManage.RoleSearchParams) {
  Object.assign(searchParams, params);
}

function edit(id: string) {
  handleEdit(id);
}

function handleSelectionChange(rows: Api.SystemManage.Role[]) {
  checkedRowKeys.value = rows.map(item => item.id);
}

function openMenuAuth(role: Api.SystemManage.Role) {
  permissionRole.value = role;
  menuAuthVisible.value = true;
}

function openButtonAuth(role: Api.SystemManage.Role) {
  permissionRole.value = role;
  buttonAuthVisible.value = true;
}

function handlePermissionModalClose() {
  permissionRole.value = null;
}

async function handleSubmitted(operateType: UI.TableOperateType) {
  if (operateType === 'add' && pagination.currentPage !== 1) {
    pagination.currentPage = 1;
    return;
  }

  await getData();
}
</script>

<template>
  <div class="min-h-500px flex-col-stretch gap-16px overflow-hidden lt-sm:overflow-auto">
    <RoleSearch :model="searchParams" @update:model="updateSearchParams" @reset="resetSearchParams" @search="getDataByPage" />
    <ElCard class="card-wrapper sm:flex-1-hidden" body-class="ht50">
      <template #header>
        <div class="flex items-center justify-between">
          <p>{{ $t('page.manage.role.title') }}</p>
          <TableHeaderOperation
            v-model:columns="columnChecks"
            :disabled-add="!canAddRole"
            :disabled-delete="checkedRowKeys.length === 0 || !canDeleteRole"
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
          :data="data"
          row-key="id"
          @selection-change="handleSelectionChange"
        >
          <ElTableColumn v-for="col in columns" :key="col.prop" v-bind="col" />
        </ElTable>
        <div class="mt-20px flex justify-end">
          <ElPagination
            v-if="mobilePagination.total"
            layout="total,prev,pager,next,sizes"
            v-bind="mobilePagination"
            @current-change="mobilePagination['current-change']"
            @size-change="mobilePagination['size-change']"
          />
        </div>
      </div>
      <RoleOperateDrawer
        v-model:visible="drawerVisible"
        :operate-type="operateType"
        :row-data="editingData"
        @submitted="handleSubmitted"
      />
      <MenuAuthModal
        v-model:visible="menuAuthVisible"
        :role-id="permissionRole?.id ?? ''"
        :role-name="permissionRole?.roleName ?? ''"
        @closed="handlePermissionModalClose"
      />
      <ButtonAuthModal
        v-model:visible="buttonAuthVisible"
        :role-id="permissionRole?.id ?? ''"
        :role-name="permissionRole?.roleName ?? ''"
        @closed="handlePermissionModalClose"
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
