import { API_VERSION } from '@/service/request/constants';
import { alova } from '../request';

type RolePayload = {
  roleName: string;
  roleCode: string;
  roleDesc?: string;
  status: Api.Common.EnableStatus;
};

type UserPayload = {
  userName: string;
  password?: string;
  userGender?: Api.SystemManage.UserGender;
  nickName?: string;
  userPhone?: string;
  userEmail?: string;
  userRoles: string[];
  status: Api.Common.EnableStatus;
};

type MenuPayload = {
  parentId?: string | null;
  name: string;
  menuType: Api.SystemManage.MenuType;
  path?: string | null;
  component?: string | null;
  icon?: string | null;
  permission?: string | null;
  sort: number;
  isShow: boolean;
  isCache: boolean;
  isExternal: boolean;
};

type MenuUpdatePayload = Partial<MenuPayload> & {
  status?: number;
};

function normalizeMenu(menu: Api.SystemManage.Menu): Api.SystemManage.Menu {
  return {
    ...menu,
    parentId: menu.parentId ?? null,
    path: menu.path ?? null,
    component: menu.component ?? null,
    icon: menu.icon ?? null,
    permission: menu.permission ?? null,
    status: String(menu.status) as Api.Common.EnableStatus,
    children: Array.isArray(menu.children) ? menu.children.map(normalizeMenu) : menu.children ?? null
  };
}

function normalizeMenuTree(menu: Api.SystemManage.MenuTree): Api.SystemManage.MenuTree {
  return {
    ...menu,
    path: menu.path ?? null,
    component: menu.component ?? null,
    icon: menu.icon ?? null,
    children: Array.isArray(menu.children) ? menu.children.map(normalizeMenuTree) : menu.children ?? null
  };
}

/** get role list */
export function fetchGetRoleList(params?: Api.SystemManage.RoleSearchParams) {
  return alova.Get<Api.SystemManage.RoleList>(`${API_VERSION.V1}/role`, { params });
}

/** get all enabled roles */
export function fetchGetAllRoles() {
  return alova.Get<Api.SystemManage.AllRole[]>(`${API_VERSION.V1}/role/enabled`);
}

/** add role */
export function addRole(data: RolePayload) {
  return alova.Post<Api.SystemManage.Role>(`${API_VERSION.V1}/role`, data);
}

/** update role */
export function updateRole(id: string, data: Partial<RolePayload>) {
  return alova.Put<Api.SystemManage.Role>(`${API_VERSION.V1}/role/${id}`, data);
}

/** delete role */
export function deleteRole(id: string) {
  return alova.Delete<null>(`${API_VERSION.V1}/role/${id}`);
}

/** batch delete role */
export function batchDeleteRole(ids: string[]) {
  return alova.Post<null>(`${API_VERSION.V1}/role/batch-delete`, { ids });
}

/** get role menu ids */
export function fetchGetRoleMenuIds(roleId: string) {
  return alova.Get<Api.SystemManage.RolePermissionIdsResponse>(`${API_VERSION.V1}/role/${roleId}/menus`);
}

/** update role menu ids */
export function updateRoleMenuIds(roleId: string, ids: string[]) {
  return alova.Put<null>(`${API_VERSION.V1}/role/${roleId}/menus`, { ids });
}

/** get role button ids */
export function fetchGetRoleButtonIds(roleId: string) {
  return alova.Get<Api.SystemManage.RolePermissionIdsResponse>(`${API_VERSION.V1}/role/${roleId}/buttons`);
}

/** update role button ids */
export function updateRoleButtonIds(roleId: string, ids: string[]) {
  return alova.Put<null>(`${API_VERSION.V1}/role/${roleId}/buttons`, { ids });
}

/** get user list */
export function fetchGetUserList(params?: Api.SystemManage.UserSearchParams) {
  return alova.Get<Api.SystemManage.UserList>(`${API_VERSION.V1}/user`, { params });
}

/** add user */
export function addUser(data: UserPayload) {
  return alova.Post<Api.SystemManage.User>(`${API_VERSION.V1}/user`, data);
}

/** update user */
export function updateUser(id: string, data: Partial<UserPayload>) {
  return alova.Put<Api.SystemManage.User>(`${API_VERSION.V1}/user/${id}`, data);
}

/** delete user */
export function deleteUser(id: string) {
  return alova.Delete<null>(`${API_VERSION.V1}/user/${id}`);
}

/** batch delete user */
export function batchDeleteUser(ids: string[]) {
  return alova.Post<null>(`${API_VERSION.V1}/user/batch-delete`, { ids });
}

/** get menu list tree */
export async function fetchGetMenuList() {
  const data = await alova.Get<Api.SystemManage.MenuList>(`${API_VERSION.V1}/menu/tree`);
  return (data ?? []).map(normalizeMenu);
}

/** get menu tree */
export async function fetchGetMenuTree() {
  const data = await alova.Get<Api.SystemManage.MenuTree[]>(`${API_VERSION.V1}/menu/tree`);
  return (data ?? []).map(normalizeMenuTree);
}

/** get button options */
export function fetchGetButtonOptions() {
  return alova.Get<Api.SystemManage.ButtonOption[]>(`${API_VERSION.V1}/menu/buttons`);
}

/** add menu */
export function addMenu(data: MenuPayload) {
  return alova.Post<Api.SystemManage.Menu>(`${API_VERSION.V1}/menu`, data);
}

/** update menu */
export function updateMenu(id: string, data: MenuUpdatePayload) {
  return alova.Put<Api.SystemManage.Menu>(`${API_VERSION.V1}/menu/${id}`, data);
}

/** delete menu */
export function deleteMenu(id: string) {
  return alova.Delete<null>(`${API_VERSION.V1}/menu/${id}`);
}

/** batch delete menu */
export function batchDeleteMenu(ids: string[]) {
  return alova.Post<null>(`${API_VERSION.V1}/menu/batch-delete`, { ids });
}
