import { alova } from '../request';
import { API_VERSION } from '../request/constants';

/**
 * 用户登陆
 *
 * @param userName User name
 * @param password Password
 */
export function fetchLogin(userName: string, password: string) {
  return alova.Post<Api.Auth.LoginToken>(`${API_VERSION.V1}/auth/login`, { username: userName, password });
}

function normalizeUserInfo(
  info: Api.Auth.UserInfoRaw,
  buttons: string[]
): Api.Auth.UserInfo {
  return {
    userId: info.id,
    userName: info.userName,
    roles: info.roles.map(item => item.roleCode),
    buttons: Array.from(new Set(buttons.filter(Boolean))),
    currentRoleId: info.currentRoleId,
    currentRoleCode: info.currentRoleCode,
    roleOptions: info.roles
  };
}

function fetchGetUserInfoRaw() {
  return alova.Get<Api.Auth.UserInfoRaw>(`${API_VERSION.V1}/auth/getUserInfo`, {
    cacheFor: 0,
    shareRequest: false
  });
}

export function fetchGetUserPermissions() {
  return alova.Get<string[]>(`${API_VERSION.V1}/menu/permissions`, {
    cacheFor: 0,
    shareRequest: false
  });
}

/** Get user info */
export async function fetchGetUserInfo() {
  const [info, buttons] = await Promise.all([fetchGetUserInfoRaw(), fetchGetUserPermissions()]);
  return normalizeUserInfo(info, buttons ?? []);
}

/** Send captcha to target phone */
export function sendCaptcha(phone: string) {
  return alova.Post<null>('/auth/sendCaptcha', { phone });
}

/** Verify captcha */
export function verifyCaptcha(phone: string, code: string) {
  return alova.Post<null>('/auth/verifyCaptcha', { phone, code });
}

/**
 * Refresh token
 *
 * @param refreshToken Refresh token
 */
export function fetchRefreshToken(refreshToken: string) {
  return alova.Post<Api.Auth.LoginToken>(
    '/auth/refreshToken',
    { refreshToken },
    {
      meta: {
        authRole: 'refreshToken'
      }
    }
  );
}

/**
 * return custom backend error
 *
 * @param code error code
 * @param msg error message
 */
export function fetchCustomBackendError(code: string, msg: string) {
  return alova.Get('/auth/error', {
    params: { code, msg },
    shareRequest: false
  });
}
