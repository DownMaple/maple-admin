import type { ElegantConstRoute, LastLevelRouteKey } from '@elegant-router/types';
import { views } from '@/router/elegant/imports';

/**
 * 后端路径到前端路径的映射
 * 用于处理后端和前端路径命名不一致的情况
 * 例如: 后端使用 /system/user，前端使用 /manage/user
 */
const PATH_MAPPING: Record<string, string> = {
  '/system': '/manage',
  '/system/user': '/manage/user',
  '/system/role': '/manage/role',
  '/system/menu': '/manage/menu'
};

/**
 * 组件路径映射
 * 将后端的组件路径映射到前端实际的组件路径
 */
const COMPONENT_PATH_MAPPING: Record<string, string> = {
  '/views/system/': '/views/manage/'
};

/**
 * 转换后端路径为前端路径
 */
function transformPath(backendPath: string): string {
  // 精确匹配
  if (PATH_MAPPING[backendPath]) {
    return PATH_MAPPING[backendPath];
  }
  // 前缀匹配
  for (const [backendPrefix, frontendPrefix] of Object.entries(PATH_MAPPING)) {
    if (backendPath.startsWith(backendPrefix + '/')) {
      return backendPath.replace(backendPrefix, frontendPrefix);
    }
  }
  return backendPath;
}

/**
 * 转换后端组件路径为前端组件路径
 */
function transformComponentPath(componentPath: string | null): string | null {
  if (!componentPath) return null;

  for (const [backendPrefix, frontendPrefix] of Object.entries(COMPONENT_PATH_MAPPING)) {
    if (componentPath.startsWith(backendPrefix)) {
      return componentPath.replace(backendPrefix, frontendPrefix);
    }
  }
  return componentPath;
}

/**
 * 将后端菜单路径转换为路由名称
 * 例如: /home -> home, /manage/user -> manage_user
 */
function pathToRouteName(path: string): string {
  // 先转换路径，再生成路由名称
  const transformedPath = transformPath(path);
  return transformedPath
    .replace(/^\//, '') // 移除开头的 /
    .replace(/\//g, '_'); // 将 / 替换为 _
}

/**
 * 根据后端组件路径获取动态导入函数
 * 例如: /views/system/user/index -> () => import('@/views/manage/user/index.vue')
 */
function getViewComponent(componentPath: string | null) {
  if (!componentPath) {
    return null;
  }

  // 先转换组件路径（处理 system -> manage 等映射）
  const transformedPath = transformComponentPath(componentPath) || componentPath;

  // 标准化路径: /views/manage/user/index -> manage/user/index
  const normalizedPath = transformedPath.replace(/^\/views\//, '').replace(/\/$/, '');

  // 首先检查是否在预定义的 views 中存在（使用路由名称格式）
  const routeNameKey = normalizedPath.replace(/\/index$/, '').replace(/\//g, '_');
  if (views[routeNameKey as keyof typeof views]) {
    return views[routeNameKey as keyof typeof views];
  }

  // 动态导入组件
  // 使用 Vite 的 glob import 模式
  const modules = import.meta.glob('@/views/**/*.vue');
  const modulePath = `/src/views/${normalizedPath}.vue`;

  if (modules[modulePath]) {
    return modules[modulePath];
  }

  // 尝试添加 index.vue
  const indexModulePath = `/src/views/${normalizedPath}/index.vue`;
  if (modules[indexModulePath]) {
    return modules[indexModulePath];
  }

  console.warn(`View component not found: ${componentPath} (transformed: ${transformedPath})`);
  return null;
}

/**
 * 将后端组件路径转换为前端组件格式（用于 ElegantConstRoute）
 */
function transformComponentString(
  component: string | null,
  menuType: Api.Route.BackendMenuType,
  isFirstLevel: boolean
): string {
  if (menuType === 'catalog') {
    return isFirstLevel ? 'layout.base' : '';
  }

  if (!component) {
    return '';
  }

  // 先转换组件路径（处理 system -> manage 等映射）
  const transformedComponent = transformComponentPath(component) || component;

  // 移除 /views/ 前缀和 /index 后缀，转换为路由名称格式
  const viewPath = transformedComponent
    .replace(/^\/views\//, '')
    .replace(/\/index$/, '')
    .replace(/\//g, '_');

  // 统一使用 view. 前缀，动态组件会在 getAuthVueRoutes 中被添加到 extendedViews
  return isFirstLevel ? `layout.base$view.${viewPath}` : `view.${viewPath}`;
}

/**
 * 转换单个菜单项为路由
 */
function transformMenuItem(menu: Api.Route.BackendMenu, isFirstLevel: boolean = true): ElegantConstRoute {
  const routeName = pathToRouteName(menu.path);
  const componentStr = transformComponentString(menu.component, menu.menuType, isFirstLevel);
  // 转换路径（处理 /system -> /manage 等映射）
  const transformedPath = transformPath(menu.path);

  const route: ElegantConstRoute = {
    name: routeName,
    path: transformedPath,
    meta: {
      title: menu.name,
      icon: menu.icon,
      order: menu.sort
    }
  };

  // 只有有组件的才添加 component 字段
  if (componentStr) {
    route.component = componentStr;
  }

  // 为动态组件添加实际的组件引用（存储在 meta 中供后续使用）
  if (menu.menuType === 'menu' && menu.component) {
    const viewComponent = getViewComponent(menu.component);
    if (viewComponent) {
      (route.meta as Record<string, unknown>).dynamicComponent = viewComponent;
    }
  }

  // 递归处理子菜单
  if (menu.children && menu.children.length > 0) {
    route.children = menu.children.map(child => transformMenuItem(child, false));
  }

  return route;
}

/**
 * 获取第一个可用的菜单路由作为首页
 */
function getFirstMenuRoute(menus: Api.Route.BackendMenu[]): string | null {
  for (const menu of menus) {
    if (menu.menuType === 'menu') {
      return pathToRouteName(menu.path);
    }
    if (menu.children && menu.children.length > 0) {
      const childRoute = getFirstMenuRoute(menu.children);
      if (childRoute) {
        return childRoute;
      }
    }
  }
  return null;
}

/**
 * 将后端菜单数据转换为前端路由格式
 */
export function transformBackendMenusToRoutes(menus: Api.Route.BackendMenu[]): Api.Route.UserRoute {
  const routes = menus.map(menu => transformMenuItem(menu)) as Api.Route.MenuRoute[];

  // 获取第一个菜单作为首页
  const home = (getFirstMenuRoute(menus) || 'home') as LastLevelRouteKey;

  return {
    routes,
    home
  };
}
