<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { addMenu, updateMenu } from '@/service/api';
import { enableStatusOptions, menuTypeOptions } from '@/constants/business';
import { useForm, useFormRules } from '@/hooks/common/form';
import { $t } from '@/locales';
import SvgIcon from '@/components/custom/svg-icon.vue';

defineOptions({ name: 'MenuOperateModal' });

export type OperateType = UI.TableOperateType | 'addChild';

interface Props {
  operateType: OperateType;
  rowData?: Api.SystemManage.Menu | null;
  allPages: string[];
  menuTree: Api.SystemManage.Menu[];
}

const props = defineProps<Props>();

interface Emits {
  (e: 'submitted'): void;
}

const emit = defineEmits<Emits>();

const visible = defineModel<boolean>('visible', { default: false });

const { formRef, validate, restoreValidation } = useForm();
const { defaultRequiredRule } = useFormRules();

const title = computed(() => {
  const titles: Record<OperateType, string> = {
    add: $t('page.manage.menu.addMenu'),
    addChild: $t('page.manage.menu.addChildMenu'),
    edit: $t('page.manage.menu.editMenu')
  };
  return titles[props.operateType];
});

type Model = {
  menuType: Api.SystemManage.MenuType;
  name: string;
  path: string;
  component: string;
  icon: string;
  permission: string;
  sort: number;
  isShow: boolean;
  isCache: boolean;
  isExternal: boolean;
  status: Api.Common.EnableStatus;
  parentId: string | null;
};

const model = ref<Model>(createDefaultModel());

function createDefaultModel(): Model {
  return {
    menuType: 'catalog',
    name: '',
    path: '',
    component: '',
    icon: '',
    permission: '',
    sort: 0,
    isShow: true,
    isCache: false,
    isExternal: false,
    status: '1',
    parentId: null
  };
}

type RuleKey = 'name' | 'path' | 'component' | 'permission';

const rules = computed<Record<RuleKey, App.Global.FormRule[]>>(() => ({
  name: [defaultRequiredRule],
  path: [
    {
      validator: (_rule, value, callback) => {
        if (showPath.value && !value?.trim?.()) {
          callback(new Error($t('page.manage.menu.form.routePath')));
          return;
        }
        callback();
      },
      trigger: 'blur'
    }
  ],
  component: [
    {
      validator: (_rule, value, callback) => {
        if (showComponent.value && !value?.trim?.()) {
          callback(new Error($t('page.manage.menu.form.page')));
          return;
        }
        callback();
      },
      trigger: 'change'
    }
  ],
  permission: [
    {
      validator: (_rule, value, callback) => {
        if (showPermission.value && !value?.trim?.()) {
          callback(new Error($t('page.manage.menu.form.permission')));
          return;
        }
        callback();
      },
      trigger: 'blur'
    }
  ]
}));

const disabledMenuType = computed(() => props.operateType === 'edit');
const showComponent = computed(() => model.value.menuType === 'menu');
const showPath = computed(() => model.value.menuType !== 'button');
const showPermission = computed(() => model.value.menuType !== 'catalog');
const showStatus = computed(() => props.operateType === 'edit');

const pageOptions = computed(() =>
  props.allPages.map(page => ({
    label: page,
    value: page
  }))
);
const parentMenuOptions = computed(() => {
  const excludedIds = new Set<string>();

  if (props.operateType === 'edit' && props.rowData) {
    collectExcludedIds(props.menuTree, props.rowData.id, excludedIds);
  }

  return filterParentMenuTree(props.menuTree, excludedIds);
});

function handleInitModel() {
  model.value = createDefaultModel();

  if (!props.rowData) {
    return;
  }

  if (props.operateType === 'addChild') {
    model.value.parentId = props.rowData.id;
    model.value.menuType = 'menu';
    return;
  }

  if (props.operateType === 'edit') {
    Object.assign(model.value, {
      menuType: props.rowData.menuType,
      name: props.rowData.name,
      path: props.rowData.path ?? '',
      component: props.rowData.component ?? '',
      icon: props.rowData.icon ?? '',
      permission: props.rowData.permission ?? '',
      sort: props.rowData.sort,
      isShow: props.rowData.isShow,
      isCache: props.rowData.isCache,
      isExternal: props.rowData.isExternal,
      status: String(props.rowData.status) as Api.Common.EnableStatus,
      parentId: props.rowData.parentId
    });
  }
}

function normalizeNullable(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function collectExcludedIds(nodes: Api.SystemManage.Menu[], targetId: string, result: Set<string>) {
  nodes.forEach(node => {
    if (node.id === targetId) {
      collectNodeIds(node, result);
      return;
    }

    if (node.children?.length) {
      collectExcludedIds(node.children, targetId, result);
    }
  });
}

function collectNodeIds(node: Api.SystemManage.Menu, result: Set<string>) {
  result.add(node.id);
  node.children?.forEach(child => collectNodeIds(child, result));
}

function filterParentMenuTree(nodes: Api.SystemManage.Menu[], excludedIds: Set<string>): Api.SystemManage.Menu[] {
  return nodes.reduce<Api.SystemManage.Menu[]>((result, node) => {
    if (excludedIds.has(node.id) || node.menuType === 'button') {
      return result;
    }

    const children = node.children ? filterParentMenuTree(node.children, excludedIds) : [];
    result.push({
      ...node,
      children: children.length ? children : null
    });
    return result;
  }, []);
}

function closeDrawer() {
  visible.value = false;
}

async function handleSubmit() {
  await validate();

  const payload = {
    parentId: model.value.parentId,
    name: model.value.name.trim(),
    menuType: model.value.menuType,
    path: showPath.value ? normalizeNullable(model.value.path) : null,
    component: showComponent.value ? normalizeNullable(model.value.component) : null,
    icon: showPath.value ? normalizeNullable(model.value.icon) : null,
    permission: showPermission.value ? normalizeNullable(model.value.permission) : null,
    sort: model.value.sort,
    isShow: model.value.isShow,
    isCache: showComponent.value ? model.value.isCache : false,
    isExternal: showPath.value ? model.value.isExternal : false
  };

  try {
    if (props.operateType === 'edit' && props.rowData?.id) {
      await updateMenu(props.rowData.id, {
        ...payload,
        status: Number(model.value.status)
      });
      window.$message?.success($t('common.updateSuccess'));
    } else {
      await addMenu(payload);
      window.$message?.success($t('common.addSuccess'));
    }

    closeDrawer();
    emit('submitted');
  } catch {
    // error is already handled by alova
  }
}

watch(visible, value => {
  if (value) {
    handleInitModel();
    restoreValidation();
  }
});
</script>

<template>
  <ElDialog v-model="visible" :title="title" width="600px">
    <ElForm ref="formRef" :model="model" :rules="rules" label-position="right" :label-width="100">
      <ElRow :gutter="16">
        <ElCol :span="24">
          <ElFormItem :label="$t('page.manage.menu.parentMenu')" prop="parentId">
            <ElTreeSelect
              v-model="model.parentId"
              clearable
              check-strictly
              :data="parentMenuOptions"
              :props="{ label: 'name', children: 'children', value: 'id' }"
              node-key="id"
              :render-after-expand="false"
              :placeholder="$t('page.manage.menu.form.parentMenu')"
            />
          </ElFormItem>
        </ElCol>
        <ElCol :span="24">
          <ElFormItem :label="$t('page.manage.menu.menuType')" prop="menuType">
            <ElRadioGroup v-model="model.menuType" :disabled="disabledMenuType">
              <ElRadio
                v-for="item in menuTypeOptions"
                :key="item.value"
                :value="item.value"
                :label="$t(item.label)"
              />
            </ElRadioGroup>
          </ElFormItem>
        </ElCol>

        <ElCol :span="12">
          <ElFormItem :label="$t('page.manage.menu.menuName')" prop="name">
            <ElInput v-model="model.name" :placeholder="$t('page.manage.menu.form.menuName')" />
          </ElFormItem>
        </ElCol>

        <ElCol v-if="showPath" :span="12">
          <ElFormItem :label="$t('page.manage.menu.routePath')" prop="path">
            <ElInput v-model="model.path" :placeholder="$t('page.manage.menu.form.routePath')" />
          </ElFormItem>
        </ElCol>

        <ElCol v-if="showComponent" :span="12">
          <ElFormItem :label="$t('page.manage.menu.page')" prop="component">
            <ElSelect v-model="model.component" clearable :placeholder="$t('page.manage.menu.form.page')">
              <ElOption v-for="{ label, value } in pageOptions" :key="value" :label="label" :value="value" />
            </ElSelect>
          </ElFormItem>
        </ElCol>

        <ElCol v-if="showPath" :span="12">
          <ElFormItem :label="$t('page.manage.menu.icon')" prop="icon">
            <ElInput v-model="model.icon" :placeholder="$t('page.manage.menu.form.icon')">
              <template #suffix>
                <SvgIcon v-if="model.icon" :icon="model.icon" class="text-icon" />
              </template>
            </ElInput>
          </ElFormItem>
        </ElCol>

        <ElCol v-if="showPermission" :span="12">
          <ElFormItem :label="$t('page.manage.menu.permission')" prop="permission">
            <ElInput v-model="model.permission" :placeholder="$t('page.manage.menu.form.permission')" />
          </ElFormItem>
        </ElCol>

        <ElCol :span="12">
          <ElFormItem :label="$t('page.manage.menu.order')" prop="sort">
            <ElInputNumber v-model="model.sort" class="w-full" :min="0" :placeholder="$t('page.manage.menu.form.order')" />
          </ElFormItem>
        </ElCol>

        <ElCol :span="12">
          <ElFormItem :label="$t('page.manage.menu.showInMenu')" prop="isShow">
            <ElRadioGroup v-model="model.isShow">
              <ElRadio :value="true" :label="$t('common.yesOrNo.yes')" />
              <ElRadio :value="false" :label="$t('common.yesOrNo.no')" />
            </ElRadioGroup>
          </ElFormItem>
        </ElCol>

        <ElCol v-if="showComponent" :span="12">
          <ElFormItem :label="$t('page.manage.menu.keepAlive')" prop="isCache">
            <ElRadioGroup v-model="model.isCache">
              <ElRadio :value="true" :label="$t('common.yesOrNo.yes')" />
              <ElRadio :value="false" :label="$t('common.yesOrNo.no')" />
            </ElRadioGroup>
          </ElFormItem>
        </ElCol>

        <ElCol v-if="showPath" :span="12">
          <ElFormItem :label="$t('page.manage.menu.externalLink')" prop="isExternal">
            <ElRadioGroup v-model="model.isExternal">
              <ElRadio :value="true" :label="$t('common.yesOrNo.yes')" />
              <ElRadio :value="false" :label="$t('common.yesOrNo.no')" />
            </ElRadioGroup>
          </ElFormItem>
        </ElCol>

        <ElCol v-if="showStatus" :span="12">
          <ElFormItem :label="$t('page.manage.menu.menuStatus')" prop="status">
            <ElRadioGroup v-model="model.status">
              <ElRadio v-for="item in enableStatusOptions" :key="item.value" :value="item.value" :label="$t(item.label)" />
            </ElRadioGroup>
          </ElFormItem>
        </ElCol>
      </ElRow>
    </ElForm>

    <template #footer>
      <ElSpace :size="16">
        <ElButton @click="closeDrawer">{{ $t('common.cancel') }}</ElButton>
        <ElButton type="primary" @click="handleSubmit">{{ $t('common.confirm') }}</ElButton>
      </ElSpace>
    </template>
  </ElDialog>
</template>
