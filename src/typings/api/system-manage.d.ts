declare namespace Api {
  namespace SystemManage {
    type CommonSearchParams = Pick<Common.PaginatingCommonParams, 'current' | 'size'>;

    type Role = {
      id: string;
      roleName: string;
      roleCode: string;
      roleDesc: string;
      status: Common.EnableStatus | undefined;
      createTime: string;
      updateTime: string;
    };

    type RoleSearchParams = CommonType.RecordNullable<
      Pick<Role, 'roleName' | 'roleCode' | 'status'> & CommonSearchParams
    >;

    type RoleList = Common.PaginatingQueryRecord<Role>;

    type AllRole = Pick<Role, 'id' | 'roleName' | 'roleCode'>;

    type RolePermissionIdsResponse = {
      ids: string[];
    };

    type UserGender = '1' | '2';

    type User = {
      id: string;
      userName: string;
      userGender: UserGender | null | undefined;
      nickName: string;
      userPhone: string;
      userEmail: string;
      userRoles: string[];
      status: Common.EnableStatus | undefined;
      createTime: string;
      updateTime: string;
    };

    type UserSearchParams = CommonType.RecordNullable<
      Pick<User, 'userName' | 'userGender' | 'nickName' | 'userPhone' | 'userEmail' | 'status'> & CommonSearchParams
    >;

    type UserList = Common.PaginatingQueryRecord<User>;

    type MenuType = 'catalog' | 'menu' | 'button';

    type IconType = '1' | '2';

    type Menu = {
      id: string;
      parentId: string | null;
      menuType: MenuType;
      name: string;
      path: string | null;
      component: string | null;
      icon: string | null;
      permission: string | null;
      sort: number;
      isShow: boolean;
      isCache: boolean;
      isExternal: boolean;
      status: Common.EnableStatus | number | undefined;
      children?: Menu[] | null;
    };

    type MenuList = Menu[];

    type MenuTree = {
      id: string;
      name: string;
      menuType: MenuType;
      path: string | null;
      component: string | null;
      icon: string | null;
      sort: number;
      children?: MenuTree[] | null;
    };

    type ButtonOption = {
      id: string;
      label: string;
      code: string;
    };
  }
}
