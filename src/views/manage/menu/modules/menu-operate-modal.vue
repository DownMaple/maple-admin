<script setup lang="ts">
/**
 * 菜单操作弹窗
 * 根据接口字段重写
 */
import { computed, ref, watch } from 'vue';
import { menuTypeOptions } from '@/constants/business';
import { useForm, useFormRules } from '@/hooks/common/form';
import { $t } from '@/locales';
import SvgIcon from '@/components/custom/svg-icon.vue';

defineOptions({ name: 'MenuOperateModal' });

export type OperateType = UI.TableOperateType | 'addChild';

interface Props {
  /** 操作类型 */
  operateType: OperateType;
  /** 编辑的菜单数据或添加子菜单时的父菜单数据 */
  rowData?: Api.SystemManage.Menu | null;
  /** 所有页面 */
  allPages: string[];
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

/** 表单模型，匹配 Menu 类型 */
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
    parentId: null
  };
}

type RuleKey = Extract<keyof Model, 'name' | 'path'>;

const rules: Record<RuleKey, App.Global.FormRule> = {
  name: defaultRequiredRule,
  path: defaultRequiredRule
};

const disabledMenuType = computed(() => props.operateType === 'edit');

/** 是否显示组件选择（仅菜单类型显示） */
const showComponent = computed(() => model.value.menuType === 'menu');

/** 是否显示路径输入（目录和菜单显示，按钮不显示） */
const showPath = computed(() => model.value.menuType !== 'button');

/** 是否显示权限输入（菜单和按钮显示） */
const showPermission = computed(() => model.value.menuType !== 'catalog');

const pageOptions = computed(() => {
  return props.allPages.map(page => ({
    label: page,
    value: page
  }));
});

function handleInitModel() {
  model.value = createDefaultModel();

  if (!props.rowData) return;

  if (props.operateType === 'addChild') {
    const { id } = props.rowData;
    model.value.parentId = String(id);
  }

  if (props.operateType === 'edit') {
    const { id, createBy, createTime, updateBy, updateTime, children, status, ...rest } = props.rowData;
    Object.assign(model.value, {
      ...rest,
      path: rest.path ?? '',
      component: rest.component ?? '',
      icon: rest.icon ?? '',
      permission: rest.permission ?? ''
    });
  }
}

function closeDrawer() {
  visible.value = false;
}

async function handleSubmit() {
  await validate();

  // 构建提交参数
  const params = {
    ...model.value,
    path: model.value.path || null,
    component: model.value.component || null,
    icon: model.value.icon || null,
    permission: model.value.permission || null
  };

  // eslint-disable-next-line no-console
  console.log('submit params:', params);

  // TODO: 调用后端接口
  window.$message?.success($t('common.updateSuccess'));
  closeDrawer();
  emit('submitted');
}

watch(visible, () => {
  if (visible.value) {
    handleInitModel();
    restoreValidation();
  }
});
</script>

<template>
  <ElDialog v-model="visible" :title="title" width="600px">
    <ElForm ref="formRef" :model="model" :rules="rules" label-position="right" :label-width="100">
      <ElRow :gutter="16">
        <!-- 菜单类型 -->
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

        <!-- 菜单名称 -->
        <ElCol :span="12">
          <ElFormItem :label="$t('page.manage.menu.menuName')" prop="name">
            <ElInput v-model="model.name" :placeholder="$t('page.manage.menu.form.menuName')" />
          </ElFormItem>
        </ElCol>

        <!-- 路由路径 -->
        <ElCol v-if="showPath" :span="12">
          <ElFormItem :label="$t('page.manage.menu.routePath')" prop="path">
            <ElInput v-model="model.path" :placeholder="$t('page.manage.menu.form.routePath')" />
          </ElFormItem>
        </ElCol>

        <!-- 组件路径 -->
        <ElCol v-if="showComponent" :span="12">
          <ElFormItem :label="$t('page.manage.menu.page')" prop="component">
            <ElSelect v-model="model.component" clearable :placeholder="$t('page.manage.menu.form.page')">
              <ElOption v-for="{ label, value } in pageOptions" :key="value" :label="label" :value="value" />
            </ElSelect>
          </ElFormItem>
        </ElCol>

        <!-- 图标 -->
        <ElCol v-if="showPath" :span="12">
          <ElFormItem :label="$t('page.manage.menu.icon')" prop="icon">
            <ElInput v-model="model.icon" :placeholder="$t('page.manage.menu.form.icon')">
              <template #suffix>
                <SvgIcon v-if="model.icon" :icon="model.icon" class="text-icon" />
              </template>
            </ElInput>
          </ElFormItem>
        </ElCol>

        <!-- 权限标识 -->
        <ElCol v-if="showPermission" :span="12">
          <ElFormItem label="权限标识" prop="permission">
            <ElInput v-model="model.permission" placeholder="请输入权限标识" />
          </ElFormItem>
        </ElCol>

        <!-- 排序 -->
        <ElCol :span="12">
          <ElFormItem :label="$t('page.manage.menu.order')" prop="sort">
            <ElInputNumber v-model="model.sort" class="w-full" :min="0" :placeholder="$t('page.manage.menu.form.order')" />
          </ElFormItem>
        </ElCol>

        <!-- 是否显示 -->
        <ElCol :span="12">
          <ElFormItem label="是否显示" prop="isShow">
            <ElRadioGroup v-model="model.isShow">
              <ElRadio :value="true" :label="$t('common.yesOrNo.yes')" />
              <ElRadio :value="false" :label="$t('common.yesOrNo.no')" />
            </ElRadioGroup>
          </ElFormItem>
        </ElCol>

        <!-- 是否缓存 -->
        <ElCol v-if="showComponent" :span="12">
          <ElFormItem :label="$t('page.manage.menu.keepAlive')" prop="isCache">
            <ElRadioGroup v-model="model.isCache">
              <ElRadio :value="true" :label="$t('common.yesOrNo.yes')" />
              <ElRadio :value="false" :label="$t('common.yesOrNo.no')" />
            </ElRadioGroup>
          </ElFormItem>
        </ElCol>

        <!-- 是否外链 -->
        <ElCol v-if="showPath" :span="12">
          <ElFormItem label="是否外链" prop="isExternal">
            <ElRadioGroup v-model="model.isExternal">
              <ElRadio :value="true" :label="$t('common.yesOrNo.yes')" />
              <ElRadio :value="false" :label="$t('common.yesOrNo.no')" />
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
