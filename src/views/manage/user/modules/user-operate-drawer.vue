<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { REG_PWD } from '@/constants/reg';
import { enableStatusOptions, userGenderOptions } from '@/constants/business';
import { addUser, fetchGetAllRoles, updateUser } from '@/service/api';
import { useForm, useFormRules } from '@/hooks/common/form';
import { $t } from '@/locales';

defineOptions({ name: 'UserOperateDrawer' });

const SUPER_ADMIN_USER_ID = 'b0000000-0000-0000-0000-000000000001';
const SUPER_ADMIN_USER_NAME = 'superAdmin';

interface Props {
  operateType: UI.TableOperateType;
  rowData?: Api.SystemManage.User | null;
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

const isAdd = computed(() => props.operateType === 'add');
const isProtectedUser = computed(() => {
  return Boolean(
    props.rowData &&
      (props.rowData.id === SUPER_ADMIN_USER_ID || props.rowData.userName === SUPER_ADMIN_USER_NAME)
  );
});

const title = computed(() => {
  const titles: Record<UI.TableOperateType, string> = {
    add: $t('page.manage.user.addUser'),
    edit: $t('page.manage.user.editUser')
  };
  return titles[props.operateType];
});

type Model = Pick<Api.SystemManage.User, 'userName' | 'nickName' | 'userPhone' | 'userEmail' | 'userRoles' | 'status'> & {
  userGender?: Api.SystemManage.UserGender;
  password: string;
};

const model = ref(createDefaultModel());

function createDefaultModel(): Model {
  return {
    userName: '',
    password: '',
    userGender: undefined,
    nickName: '',
    userPhone: '',
    userEmail: '',
    userRoles: [],
    status: '1'
  };
}

type RuleKey = 'userName' | 'password' | 'status' | 'userRoles';

const rules = computed<Record<RuleKey, App.Global.FormRule[]>>(() => ({
  userName: [defaultRequiredRule],
  password: [
    {
      validator: (_rule, value, callback) => {
        const password = value?.trim?.() || '';
        if (isAdd.value && !password) {
          callback(new Error($t('form.pwd.required')));
          return;
        }
        if (password && !REG_PWD.test(password)) {
          callback(new Error($t('form.pwd.invalid')));
          return;
        }
        callback();
      },
      trigger: 'blur'
    }
  ],
  status: [defaultRequiredRule],
  userRoles: [defaultRequiredRule]
}));

const roleOptions = ref<CommonType.Option<string>[]>([]);

async function getRoleOptions() {
  try {
    const data = await fetchGetAllRoles();
    const optionMap = new Map<string, string>();

    model.value.userRoles.forEach(roleCode => {
      optionMap.set(roleCode, roleCode);
    });

    data.forEach(item => {
      optionMap.set(item.roleCode, item.roleName);
    });

    roleOptions.value = Array.from(optionMap.entries())
      .map(([value, label]) => ({
        label,
        value
      }))
      .sort((a, b) => String(a.label).localeCompare(String(b.label)));
  } catch {
    roleOptions.value = [];
  }
}

function handleInitModel() {
  model.value = createDefaultModel();

  if (props.operateType === 'edit' && props.rowData) {
    Object.assign(model.value, props.rowData, {
      userGender: props.rowData.userGender ?? undefined,
      password: ''
    });
  }
}

function closeDrawer() {
  visible.value = false;
}

async function handleSubmit() {
  if (isProtectedUser.value) {
    return;
  }

  await validate();

  const payload = {
    userName: model.value.userName.trim(),
    password: model.value.password.trim() || undefined,
    userGender: model.value.userGender ?? undefined,
    nickName: model.value.nickName,
    userPhone: model.value.userPhone,
    userEmail: model.value.userEmail,
    userRoles: model.value.userRoles,
    status: model.value.status || '1'
  };

  try {
    if (isAdd.value) {
      await addUser(payload);
      window.$message?.success($t('common.addSuccess'));
    } else if (props.rowData?.id) {
      await updateUser(props.rowData.id, payload);
      window.$message?.success($t('common.updateSuccess'));
    }

    const submittedType: UI.TableOperateType = isAdd.value ? 'add' : 'edit';
    closeDrawer();
    emit('submitted', submittedType);
  } catch {
    // error is already handled by alova
  }
}

watch(visible, value => {
  if (value) {
    handleInitModel();
    restoreValidation();
    void getRoleOptions();
  }
});
</script>

<template>
  <ElDrawer v-model="visible" :title="title" :size="640">
    <ElForm ref="formRef" :model="model" :rules="rules" label-position="top">
      <ElFormItem :label="$t('page.manage.user.userName')" prop="userName">
        <ElInput v-model="model.userName" :disabled="isProtectedUser" :placeholder="$t('page.manage.user.form.userName')" />
      </ElFormItem>
      <ElFormItem :label="$t('page.manage.user.password')" prop="password">
        <ElInput
          v-model="model.password"
          :disabled="isProtectedUser"
          show-password
          :placeholder="$t('page.manage.user.form.password')"
        />
      </ElFormItem>
      <ElFormItem :label="$t('page.manage.user.userGender')" prop="userGender">
        <ElRadioGroup v-model="model.userGender" :disabled="isProtectedUser">
          <ElRadio v-for="item in userGenderOptions" :key="item.value" :value="item.value" :label="$t(item.label)" />
        </ElRadioGroup>
      </ElFormItem>
      <ElFormItem :label="$t('page.manage.user.nickName')" prop="nickName">
        <ElInput v-model="model.nickName" :disabled="isProtectedUser" :placeholder="$t('page.manage.user.form.nickName')" />
      </ElFormItem>
      <ElFormItem :label="$t('page.manage.user.userPhone')" prop="userPhone">
        <ElInput v-model="model.userPhone" :disabled="isProtectedUser" :placeholder="$t('page.manage.user.form.userPhone')" />
      </ElFormItem>
      <ElFormItem :label="$t('page.manage.user.userEmail')" prop="userEmail">
        <ElInput v-model="model.userEmail" :disabled="isProtectedUser" :placeholder="$t('page.manage.user.form.userEmail')" />
      </ElFormItem>
      <ElFormItem :label="$t('page.manage.user.userStatus')" prop="status">
        <ElRadioGroup v-model="model.status" :disabled="isProtectedUser">
          <ElRadio v-for="item in enableStatusOptions" :key="item.value" :value="item.value" :label="$t(item.label)" />
        </ElRadioGroup>
      </ElFormItem>
      <ElFormItem :label="$t('page.manage.user.userRole')" prop="userRoles">
        <ElSelect
          v-model="model.userRoles"
          multiple
          clearable
          filterable
          collapse-tags
          collapse-tags-tooltip
          :disabled="isProtectedUser"
          :placeholder="$t('page.manage.user.form.userRole')"
        >
          <ElOption v-for="{ label, value } in roleOptions" :key="value" :label="label" :value="value" />
        </ElSelect>
      </ElFormItem>
    </ElForm>
    <template #footer>
      <ElSpace :size="16">
        <ElButton @click="closeDrawer">{{ $t('common.cancel') }}</ElButton>
        <ElButton type="primary" :disabled="isProtectedUser" @click="handleSubmit">{{ $t('common.confirm') }}</ElButton>
      </ElSpace>
    </template>
  </ElDrawer>
</template>
