<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { addRole, updateRole } from '@/service/api';
import { enableStatusOptions } from '@/constants/business';
import { useForm, useFormRules } from '@/hooks/common/form';
import { $t } from '@/locales';

defineOptions({ name: 'RoleOperateDrawer' });

const SUPER_ADMIN_ROLE_ID = 'a0000000-0000-0000-0000-000000000001';
const SUPER_ADMIN_ROLE_CODE = 'superAdmin';

interface Props {
  operateType: UI.TableOperateType;
  rowData?: Api.SystemManage.Role | null;
}

const props = defineProps<Props>();

interface Emits {
  (e: 'submitted', operateType: UI.TableOperateType): void;
}

const emit = defineEmits<Emits>();

const visible = defineModel<boolean>('visible', {
  default: false
});

const { formRef, validate, restoreValidation } = useForm();
const { defaultRequiredRule } = useFormRules();

type Model = Pick<Api.SystemManage.Role, 'roleName' | 'roleCode' | 'roleDesc' | 'status'>;

const model = ref(createDefaultModel());

function createDefaultModel(): Model {
  return {
    roleName: '',
    roleCode: '',
    roleDesc: '',
    status: '1'
  };
}

type RuleKey = Exclude<keyof Model, 'roleDesc'>;

const rules: Record<RuleKey, App.Global.FormRule[]> = {
  roleName: [defaultRequiredRule],
  roleCode: [defaultRequiredRule],
  status: [defaultRequiredRule]
};

const persistedRole = ref<Api.SystemManage.Role | null>(null);
const roleId = computed(() => persistedRole.value?.id ?? (props.operateType === 'edit' ? props.rowData?.id ?? '' : ''));
const isEdit = computed(() => Boolean(roleId.value));
const isProtectedRole = computed(() => {
  const currentRole = persistedRole.value ?? props.rowData;

  return Boolean(
    currentRole && (currentRole.id === SUPER_ADMIN_ROLE_ID || currentRole.roleCode === SUPER_ADMIN_ROLE_CODE)
  );
});
const title = computed(() => {
  const titles: Record<UI.TableOperateType, string> = {
    add: $t('page.manage.role.addRole'),
    edit: $t('page.manage.role.editRole')
  };
  return titles[isEdit.value ? 'edit' : 'add'];
});

function handleInitModel() {
  persistedRole.value = props.operateType === 'edit' && props.rowData ? { ...props.rowData } : null;
  model.value = createDefaultModel();

  if (props.operateType === 'edit' && props.rowData) {
    Object.assign(model.value, props.rowData);
  }
}

function closeDrawer() {
  persistedRole.value = null;
  visible.value = false;
}

async function handleSubmit() {
  if (isProtectedRole.value) {
    return;
  }

  await validate();

  const payload = {
    roleName: model.value.roleName.trim(),
    roleCode: model.value.roleCode.trim(),
    roleDesc: model.value.roleDesc,
    status: model.value.status || '1'
  };

  try {
    const operateType: UI.TableOperateType = isEdit.value ? 'edit' : 'add';

    if (operateType === 'edit' && roleId.value) {
      const updatedRole = await updateRole(roleId.value, payload);
      persistedRole.value = updatedRole;
      window.$message?.success($t('common.updateSuccess'));
      emit('submitted', operateType);
      closeDrawer();
    } else {
      await addRole(payload);
      window.$message?.success($t('common.addSuccess'));
      emit('submitted', operateType);
      closeDrawer();
    }
  } catch {
    // error is already handled by alova
  }
}

watch(visible, value => {
  if (value) {
    handleInitModel();
    restoreValidation();
  } else {
    persistedRole.value = null;
  }
});
</script>

<template>
  <ElDrawer v-model="visible" :title="title" :size="520">
    <ElForm ref="formRef" :model="model" :rules="rules" label-position="top">
      <ElFormItem :label="$t('page.manage.role.roleName')" prop="roleName">
        <ElInput v-model="model.roleName" :disabled="isProtectedRole" :placeholder="$t('page.manage.role.form.roleName')" />
      </ElFormItem>
      <ElFormItem :label="$t('page.manage.role.roleCode')" prop="roleCode">
        <ElInput v-model="model.roleCode" :disabled="isProtectedRole" :placeholder="$t('page.manage.role.form.roleCode')" />
      </ElFormItem>
      <ElFormItem :label="$t('page.manage.role.roleStatus')" prop="status">
        <ElRadioGroup v-model="model.status" :disabled="isProtectedRole">
          <ElRadio v-for="{ label, value } in enableStatusOptions" :key="value" :value="value" :label="$t(label)" />
        </ElRadioGroup>
      </ElFormItem>
      <ElFormItem :label="$t('page.manage.role.roleDesc')" prop="roleDesc">
        <ElInput v-model="model.roleDesc" :disabled="isProtectedRole" :placeholder="$t('page.manage.role.form.roleDesc')" />
      </ElFormItem>
    </ElForm>
    <template #footer>
      <ElSpace :size="16">
        <ElButton @click="closeDrawer">{{ $t('common.cancel') }}</ElButton>
        <ElButton type="primary" :disabled="isProtectedRole" @click="handleSubmit">{{ $t('common.confirm') }}</ElButton>
      </ElSpace>
    </template>
  </ElDrawer>
</template>
