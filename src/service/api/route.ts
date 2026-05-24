import { API_VERSION } from '@/service/request/constants';
import { alova } from '../request';
import { transformBackendMenusToRoutes } from '../utils/route-transform';

/** get user routes */
export async function fetchGetUserRoutes(): Promise<Api.Route.UserRoute> {
  const menus = await alova.Get<Api.Route.BackendMenu[]>(`${API_VERSION.V1}/menu/getUserRoutes`, {
    cacheFor: 0,
    shareRequest: false
  });
  return transformBackendMenusToRoutes(menus ?? []);
}

/**
 * whether the route is exist
 *
 * @param routeName route name
 */
export function fetchIsRouteExist(routeName: string) {
  return alova.Get<boolean>('/route/isRouteExist', { params: { routeName } });
}
