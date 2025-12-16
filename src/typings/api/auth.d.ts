declare namespace Api {
  /**
   * namespace Auth
   *
   * backend api module: "auth"
   */
  namespace Auth {
    /** 用户角色信息 */
    interface UserRole {
      roleId: string;
      roleCode: string;
      roleName: string;
    }

    /** 登录返回的 token 信息 */
    interface LoginToken {
      id: string;
      username: string;
      realName: string;
      roles: UserRole[];
      accessToken: string;
      refreshToken: string;
    }

    interface UserInfo {
      userId: string;
      userName: string;
      roles: string[];
      buttons: string[];
    }
  }
}
