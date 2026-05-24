<script setup lang="tsx">
import { computed, onMounted, reactive, ref } from 'vue';
import { ElButton, ElPopconfirm, ElTag } from 'element-plus';
import { enableStatusRecord, userGenderRecord } from '@/constants/business';
import { batchDeleteUser, deleteUser, fetchGetAllRoles, fetchGetUserList } from '@/service/api';
import { useAuth } from '@/hooks/business/auth';
import { defaultTransform, useTableOperate, useUIPaginatedTable } from '@/hooks/common/table';
import { $t } from '@/locales';
import UserOperateDrawer from './modules/user-operate-drawer.vue';
import UserSearch from './modules/user-search.vue';

defineOptions({ name: 'UserManage' });

const SUPER_ADMIN_USER_ID = 'b0000000-0000-0000-0000-000000000001';
const SUPER_ADMIN_USER_NAME = 'superAdmin';

const searchParams = reactive(getInitSearchParams());
const roleNameMap = ref(new Map<string, string>());
const { hasAuth } = useAuth();
const canAddUser = computed(() => hasAuth('system:user:add'));
const canEditUser = computed(() => hasAuth('system:user:edit'));
const canDeleteUser = computed(() => hasAuth('system:user:delete'));

function getInitSearchParams(): Api.SystemManage.UserSearchParams {
  return {
    current: 1,
    size: 10,
    status: undefined,
    userName: undefined,
    userGender: undefined,
    nickName: undefined,
    userPhone: undefined,
    userEmail: undefined
  };
}

function isProtectedUser(row: Api.SystemManage.User) {
  return row.id === SUPER_ADMIN_USER_ID || row.userName === SUPER_ADMIN_USER_NAME;
}

const {
  columns,
  columnChecks,
  data,
  loading,
  getData,
  getDataByPage,
  safeRefreshAfterDelete,
  pagination,
  mobilePagination
} = useUIPaginatedTable({
  paginationProps: {
    currentPage: searchParams.current ?? 1,
    pageSize: searchParams.size ?? 10
  },
  api: () => fetchGetUserList(searchParams),
  transform: response => defaultTransform(response),
  onPaginationParamsChange: params => {
    searchParams.current = params.currentPage;
    searchParams.size = params.pageSize;
  },
  columns: () => [
    { prop: 'selection', type: 'selection', width: 48, selectable: row => canDeleteUser.value && !isProtectedUser(row) },
    { prop: 'index', type: 'index', label: $t('common.index'), width: 64 },
    { prop: 'userName', label: $t('page.manage.user.userName'), minWidth: 100 },
    {
      prop: 'userGender',
      label: $t('page.manage.user.userGender'),
      width: 100,
      formatter: row => {
        const userGender = row.userGender;

        if (!userGender) {
          return '';
        }

        const tagMap: Record<Api.SystemManage.UserGender, UI.ThemeColor> = {
          1: 'primary',
          2: 'danger'
        };

        const labelKey = userGenderRecord[userGender];

        if (!labelKey) {
          return '';
        }

        return <ElTag type={tagMap[userGender]}>{$t(labelKey)}</ElTag>;
      }
    },
    { prop: 'nickName', label: $t('page.manage.user.nickName'), minWidth: 100 },
    { prop: 'userPhone', label: $t('page.manage.user.userPhone'), width: 120 },
    { prop: 'userEmail', label: $t('page.manage.user.userEmail'), minWidth: 200 },
    {
      prop: 'userRoles',
      label: $t('page.manage.user.userRole'),
      minWidth: 180,
      formatter: row => {
        if (!row.userRoles?.length) {
          return '-';
        }

        return (
          <div class="flex flex-wrap gap-6px">
            {row.userRoles.map(roleCode => (
              <ElTag key={roleCode} type="info">
                {roleNameMap.value.get(roleCode) ?? roleCode}
              </ElTag>
            ))}
          </div>
        );
      }
    },
    {
      prop: 'status',
      label: $t('page.manage.user.userStatus'),
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
      prop: 'operate',
      label: $t('common.operate'),
      width: 130,
      formatter: row => {
        const protectedUser = isProtectedUser(row);

        return (
          <div class="flex-center gap-8px">
            <ElButton
              type="primary"
              plain
              size="small"
              disabled={protectedUser || !canEditUser.value}
              onClick={() => !protectedUser && canEditUser.value && edit(row.id)}
            >
              {$t('common.edit')}
            </ElButton>
            {protectedUser || !canDeleteUser.value ? (
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

  const deletedCount = checkedRowKeys.value.length;
  await batchDeleteUser(checkedRowKeys.value);
  window.$message?.success($t('common.deleteSuccess'));
  checkedRowKeys.value = [];
  await safeRefreshAfterDelete(deletedCount);
}

async function handleDelete(id: string) {
  await deleteUser(id);
  window.$message?.success($t('common.deleteSuccess'));
  await safeRefreshAfterDelete(1);
}

function resetSearchParams() {
  Object.assign(searchParams, getInitSearchParams());
  void getDataByPage(1);
}

function updateSearchParams(params: Api.SystemManage.UserSearchParams) {
  Object.assign(searchParams, params);
}

function edit(id: string) {
  handleEdit(id);
}

function handleSelectionChange(rows: Api.SystemManage.User[]) {
  checkedRowKeys.value = rows.map(item => item.id);
}

async function getRoleNameMap() {
  try {
    const roles = await fetchGetAllRoles();
    roleNameMap.value = new Map(roles.map(item => [item.roleCode, item.roleName]));
  } catch {
    roleNameMap.value = new Map();
  }
}

async function handleSubmitted(submittedOperateType: UI.TableOperateType) {
  await getRoleNameMap();

  if (submittedOperateType === 'add' && pagination.currentPage !== 1) {
    pagination.currentPage = 1;
    return;
  }

  await getData();
}

async function handleRefresh() {
  await Promise.all([getData(), getRoleNameMap()]);
}

onMounted(() => {
  void getRoleNameMap();
});
</script>

<template>
  <div class="min-h-500px flex-col-stretch gap-16px overflow-hidden lt-sm:overflow-auto">
    <UserSearch
      :model="searchParams"
      @update:model="updateSearchParams"
      @reset="resetSearchParams"
      @search="getDataByPage"
    />
    <ElCard class="card-wrapper sm:flex-1-hidden" body-class="ht50">
      <template #header>
        <div class="flex items-center justify-between">
          <p>{{ $t('page.manage.user.title') }}</p>
          <TableHeaderOperation
            v-model:columns="columnChecks"
            :disabled-add="!canAddUser"
            :disabled-delete="checkedRowKeys.length === 0 || !canDeleteUser"
            :loading="loading"
            @add="handleAdd"
            @delete="handleBatchDelete"
            @refresh="handleRefresh"
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
      <UserOperateDrawer
        v-model:visible="drawerVisible"
        :operate-type="operateType"
        :row-data="editingData"
        @submitted="handleSubmitted"
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
