import type { ElegantConstRoute, LastLevelRouteKey } from '@elegant-router/types';
import { views } from '@/router/elegant/imports';

const PATH_MAPPING: Record<string, string> = {
  '/system': '/manage',
  '/system/user': '/manage/user',
  '/system/role': '/manage/role',
  '/system/menu': '/manage/menu'
};

const COMPONENT_PATH_MAPPING: Record<string, string> = {
  '/views/system/': '/views/manage/'
};

function transformPath(backendPath: string): string {
  if (PATH_MAPPING[backendPath]) {
    return PATH_MAPPING[backendPath];
  }

  for (const [backendPrefix, frontendPrefix] of Object.entries(PATH_MAPPING)) {
    if (backendPath.startsWith(`${backendPrefix}/`)) {
      return backendPath.replace(backendPrefix, frontendPrefix);
    }
  }

  return backendPath;
}

function transformComponentPath(componentPath: string | null): string | null {
  if (!componentPath) {
    return null;
  }

  for (const [backendPrefix, frontendPrefix] of Object.entries(COMPONENT_PATH_MAPPING)) {
    if (componentPath.startsWith(backendPrefix)) {
      return componentPath.replace(backendPrefix, frontendPrefix);
    }
  }

  return componentPath;
}

function pathToRouteName(path: string): string {
  const transformedPath = transformPath(path);
  return transformedPath.replace(/^\//, '').replace(/\//g, '_');
}

function getViewComponent(componentPath: string | null) {
  if (!componentPath) {
    return null;
  }

  const transformedPath = transformComponentPath(componentPath) || componentPath;
  const normalizedPath = transformedPath.replace(/^\/views\//, '').replace(/\/$/, '');
  const routeNameKey = normalizedPath.replace(/\/index$/, '').replace(/\//g, '_');

  if (views[routeNameKey as keyof typeof views]) {
    return views[routeNameKey as keyof typeof views];
  }

  const modules = import.meta.glob('@/views/**/*.vue');
  const modulePath = `/src/views/${normalizedPath}.vue`;
  if (modules[modulePath]) {
    return modules[modulePath];
  }

  const indexModulePath = `/src/views/${normalizedPath}/index.vue`;
  if (modules[indexModulePath]) {
    return modules[indexModulePath];
  }

  console.warn(`View component not found: ${componentPath} (transformed: ${transformedPath})`);
  return null;
}

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

  const transformedComponent = transformComponentPath(component) || component;
  const viewPath = transformedComponent
    .replace(/^\/views\//, '')
    .replace(/\/index$/, '')
    .replace(/\//g, '_');

  return isFirstLevel ? `layout.base$view.${viewPath}` : `view.${viewPath}`;
}

function transformMenuItem(menu: Api.Route.BackendMenu, isFirstLevel: boolean = true): ElegantConstRoute {
  const routeName = pathToRouteName(menu.path);
  const componentStr = transformComponentString(menu.component, menu.menuType, isFirstLevel);
  const transformedPath = transformPath(menu.path);

  const route: ElegantConstRoute = {
    name: routeName,
    path: transformedPath,
    meta: {
      title: menu.name,
      icon: menu.icon,
      order: menu.sort,
      hideInMenu: !menu.isShow,
      keepAlive: menu.isCache,
      href: menu.isExternal ? menu.path : undefined
    }
  };

  if (componentStr) {
    route.component = componentStr;
  }

  if (menu.menuType === 'menu' && menu.component) {
    const viewComponent = getViewComponent(menu.component);
    if (viewComponent) {
      (route.meta as Record<string, unknown>).dynamicComponent = viewComponent;
    }
  }

  if (menu.children && menu.children.length > 0) {
    route.children = menu.children.map(child => transformMenuItem(child, false));
  }

  return route;
}

function getFirstMenuRoute(menus: Api.Route.BackendMenu[]): string | null {
  for (const menu of menus) {
    if (menu.menuType === 'menu' && menu.isShow && !menu.isExternal) {
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

export function transformBackendMenusToRoutes(menus: Api.Route.BackendMenu[]): Api.Route.UserRoute {
  const routes = menus.map(menu => transformMenuItem(menu)) as Api.Route.MenuRoute[];
  const home = (getFirstMenuRoute(menus) || '403') as LastLevelRouteKey;

  return {
    routes,
    home
  };
}
