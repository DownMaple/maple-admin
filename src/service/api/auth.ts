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

/** Get user info */
export function fetchGetUserInfo() {
  return alova.Get<Api.Auth.UserInfo>(`${API_VERSION.V1}/auth/getUserInfo`);
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
