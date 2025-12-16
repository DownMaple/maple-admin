import type { RouteRecordRaw } from 'vue-router';
import type { CustomRoute, ElegantConstRoute, ElegantRoute } from '@elegant-router/types';
import { generatedRoutes } from '../elegant/routes';
import { layouts, views } from '../elegant/imports';
import { transformElegantRoutesToVueRoutes } from '../elegant/transform';

/**
 * custom routes
 *
 * @link https://github.com/soybeanjs/elegant-router?tab=readme-ov-file#custom-route
 */
const customRoutes: CustomRoute[] = [
  {
    name: 'exception',
    path: '/exception',
    component: 'layout.base',
    meta: {
      title: 'exception',
      i18nKey: 'route.exception',
      icon: 'ant-design:exception-outlined',
      order: 7
    },
    children: [
      {
        name: 'exception_403',
        path: '/exception/403',
        component: 'view.403',
        meta: {
          title: 'exception_403',
          i18nKey: 'route.exception_403',
          icon: 'ic:baseline-block'
        }
      },
      {
        name: 'exception_404',
        path: '/exception/404',
        component: 'view.404',
        meta: {
          title: 'exception_404',
          i18nKey: 'route.exception_404',
          icon: 'ic:baseline-web-asset-off'
        }
      },
      {
        name: 'exception_500',
        path: '/exception/500',
        component: 'view.500',
        meta: {
          title: 'exception_500',
          i18nKey: 'route.exception_500',
          icon: 'ic:baseline-wifi-off'
        }
      }
    ]
  },
  {
    name: 'document',
    path: '/document',
    component: 'layout.base',
    meta: {
      title: 'document',
      i18nKey: 'route.document',
      order: 2,
      icon: 'mdi:file-document-multiple-outline'
    },
    children: [
      {
        name: 'document_antd',
        path: '/document/antd',
        component: 'view.iframe-page',
        props: {
          url: 'https://antdv.com/components/overview-cn'
        },
        meta: {
          title: 'document_antd',
          i18nKey: 'route.document_antd',
          order: 7,
          icon: 'logos:ant-design'
        }
      },
      {
        name: 'document_naive',
        path: '/document/naive',
        component: 'view.iframe-page',
        props: {
          url: 'https://www.UI.com/zh-CN/os-theme/docs/introduction'
        },
        meta: {
          title: 'document_naive',
          i18nKey: 'route.document_naive',
          order: 6,
          icon: 'logos:naiveui'
        }
      },
      {
        name: 'document_element-plus',
        path: '/document/element-plus',
        component: 'view.iframe-page',
        props: {
          url: 'https://element-plus.org/zh-CN/'
        },
        meta: {
          title: 'document_element-plus',
          i18nKey: 'route.document_element-plus',
          order: 7,
          icon: 'ep:element-plus'
        }
      },
      {
        name: 'document_project',
        path: '/document/project',
        component: 'view.iframe-page',
        props: {
          url: 'https://docs.soybeanjs.cn/zh'
        },
        meta: {
          title: 'document_project',
          i18nKey: 'route.document_project',
          order: 1,
          localIcon: 'logo'
        }
      },
      {
        name: 'document_project-link',
        path: '/document/project-link',
        component: 'view.iframe-page',
        meta: {
          title: 'document_project-link',
          i18nKey: 'route.document_project-link',
          order: 2,
          localIcon: 'logo',
          // use href to open the page, the routeName must be ends with '-link'
          href: 'https://docs.soybeanjs.cn/zh'
        }
      },
      {
        name: 'document_unocss',
        path: '/document/unocss',
        component: 'view.iframe-page',
        props: {
          url: 'https://unocss.dev/'
        },
        meta: {
          title: 'document_unocss',
          i18nKey: 'route.document_unocss',
          order: 5,
          icon: 'logos:unocss'
        }
      },
      {
        name: 'document_vite',
        path: '/document/vite',
        component: 'view.iframe-page',
        props: {
          url: 'https://cn.vitejs.dev/'
        },
        meta: {
          title: 'document_vite',
          i18nKey: 'route.document_vite',
          order: 4,
          icon: 'logos:vitejs'
        }
      },
      {
        name: 'document_vue',
        path: '/document/vue',
        component: 'view.iframe-page',
        props: {
          url: 'https://cn.vuejs.org/'
        },
        meta: {
          title: 'document_vue',
          i18nKey: 'route.document_vue',
          order: 3,
          icon: 'logos:vue'
        }
      }
    ]
  }
];

/** create routes when the auth route mode is static */
export function createStaticRoutes() {
  const constantRoutes: ElegantRoute[] = [];

  const authRoutes: ElegantRoute[] = [];

  [...customRoutes, ...generatedRoutes].forEach(item => {
    if (item.meta?.constant) {
      constantRoutes.push(item);
    } else {
      authRoutes.push(item);
    }
  });

  return {
    constantRoutes,
    authRoutes
  };
}

/**
 * Get auth vue routes
 *
 * @param routes Elegant routes
 */
export function getAuthVueRoutes(routes: ElegantConstRoute[]) {
  // 分离静态路由和动态路由
  const staticRoutes: ElegantConstRoute[] = [];
  const dynamicRoutes: ElegantConstRoute[] = [];

  function separateRoutes(routeList: ElegantConstRoute[], isStatic: boolean = true) {
    routeList.forEach(route => {
      const meta = route.meta as Record<string, unknown>;
      const hasDynamicComponent = !!meta?.dynamicComponent;

      if (hasDynamicComponent || !isStatic) {
        dynamicRoutes.push(route);
      } else {
        // 检查子路由是否有动态组件
        let hasChildDynamic = false;
        if (route.children) {
          route.children.forEach(child => {
            const childMeta = child.meta as Record<string, unknown>;
            if (childMeta?.dynamicComponent) {
              hasChildDynamic = true;
            }
          });
        }

        if (hasChildDynamic) {
          dynamicRoutes.push(route);
        } else {
          staticRoutes.push(route);
        }
      }
    });
  }

  separateRoutes(routes);

  // 转换静态路由（使用原有的转换函数）
  const vueRoutes: RouteRecordRaw[] = transformElegantRoutesToVueRoutes(staticRoutes, layouts, views);

  // 转换动态路由（使用自定义转换函数）
  const dynamicVueRoutes = transformDynamicRoutes(dynamicRoutes);

  return [...vueRoutes, ...dynamicVueRoutes];
}

/**
 * 转换动态路由为 Vue Router 格式
 */
function transformDynamicRoutes(routes: ElegantConstRoute[]): RouteRecordRaw[] {
  return routes.flatMap(route => transformDynamicRoute(route, true));
}

/**
 * 转换单个动态路由
 */
function transformDynamicRoute(route: ElegantConstRoute, isFirstLevel: boolean = true): RouteRecordRaw[] {
  const meta = route.meta as Record<string, unknown>;
  const dynamicComponent = meta?.dynamicComponent as (() => Promise<unknown>) | undefined;

  const { name, path, component, children } = route;

  // 处理一级路由（需要包裹 layout）
  if (isFirstLevel && component?.startsWith('layout.')) {
    const layoutName = component.replace('layout.', '').split('$')[0] as keyof typeof layouts;
    const layout = layouts[layoutName];

    if (!layout) {
      console.warn(`Layout "${layoutName}" not found for route "${name}"`);
      return [];
    }

    // 检查是否是单级路由（layout.base$view.xxx 格式）
    if (component.includes('$view.')) {
      const viewName = component.split('$view.')[1];
      const viewComponent = dynamicComponent || views[viewName as keyof typeof views];

      if (!viewComponent) {
        console.warn(`View component "${viewName}" not found for route "${name}"`);
        return [];
      }

      // 单级路由：外层是 layout，内层是 view
      const singleLevelRoute = {
        path,
        component: layout,
        children: [
          {
            name,
            path: '',
            component: viewComponent,
            meta: {
              title: (meta?.title as string) || name,
              icon: meta?.icon as string | undefined,
              order: meta?.order as number | undefined
            }
          }
        ]
      } as RouteRecordRaw;

      return [singleLevelRoute];
    }

    // 多级路由：有 children
    const parentRoute: RouteRecordRaw = {
      name,
      path,
      component: layout,
      meta: {
        title: (meta?.title as string) || name,
        icon: meta?.icon as string | undefined,
        order: meta?.order as number | undefined
      },
      children: children?.flatMap(child => transformDynamicRoute(child, false)) || []
    };

    // 添加 redirect 到第一个子路由
    if (parentRoute.children?.length && !parentRoute.redirect) {
      parentRoute.redirect = { name: parentRoute.children[0].name };
    }

    return [parentRoute];
  }

  // 子路由或非 layout 路由
  const viewComponent = dynamicComponent || (component ? views[component.replace('view.', '') as keyof typeof views] : undefined);

  if (!viewComponent && component) {
    console.warn(`View component not found for route "${name}", component: "${component}"`);
    return [];
  }

  const vueRoute = {
    name,
    path,
    component: viewComponent,
    meta: {
      title: (meta?.title as string) || name,
      icon: meta?.icon as string | undefined,
      order: meta?.order as number | undefined
    }
  } as RouteRecordRaw;

  const result: RouteRecordRaw[] = [vueRoute];

  // 处理子路由
  if (children?.length) {
    const childRoutes = children.flatMap(child => transformDynamicRoute(child, false));
    result.push(...childRoutes);
  }

  return result;
}
