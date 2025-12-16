import { alova } from '../request';
import { API_VERSION } from '@/service/request/constants';
import { transformBackendMenusToRoutes } from '../utils/route-transform';

/** get user routes */
export async function fetchGetUserRoutes(): Promise<Api.Route.UserRoute> {
  const menus = await alova.Get<Api.Route.BackendMenu[]>(`${API_VERSION.V1}/menu/getUserRoutes`);

  // 如果没有菜单数据，抛出错误
  if (!menus || menus.length === 0) {
    throw new Error('没有可用的菜单权限');
  }

  return transformBackendMenusToRoutes(menus);
}

/**
 * whether the route is exist
 *
 * @param routeName route name
 */
export function fetchIsRouteExist(routeName: string) {
  return alova.Get<boolean>('/route/isRouteExist', { params: { routeName } });
}
