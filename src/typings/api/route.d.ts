declare namespace Api {
  /**
   * namespace Route
   *
   * backend api module: "route"
   */
  namespace Route {
    type ElegantConstRoute = import('@elegant-router/types').ElegantConstRoute;

    interface MenuRoute extends ElegantConstRoute {
      id: string;
    }

    interface UserRoute {
      routes: MenuRoute[];
      home: import('@elegant-router/types').LastLevelRouteKey;
    }

    /** 后端返回的菜单类型 */
    type BackendMenuType = 'catalog' | 'menu';

    /** 后端返回的菜单项 */
    interface BackendMenu {
      id: string;
      name: string;
      menuType: BackendMenuType;
      path: string;
      component: string | null;
      icon: string;
      sort: number;
      children?: BackendMenu[];
    }
  }
}
