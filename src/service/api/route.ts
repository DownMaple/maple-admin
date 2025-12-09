import { alova } from '../request';

/** get user routes */
export function fetchGetUserRoutes() {
  return alova.Get<Api.Route.UserRoute>('/route/getUserRoutes');
}

/**
 * whether the route is exist
 *
 * @param routeName route name
 */
export function fetchIsRouteExist(routeName: string) {
  return alova.Get<boolean>('/route/isRouteExist', { params: { routeName } });
}
