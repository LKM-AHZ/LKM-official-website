import { reactive, provide, inject } from 'vue';
import type {
  AuthState,
  AuthContextType,
  LoginResult,
  LoginMethod,
  RegisterData,
  RegisterResult,
  DemoUser,
} from '~/types/auth';
import { findAccount, checkPassword, VALIDATE_CODE } from '~/data/demo-accounts';

const AUTH_KEY = Symbol('auth');

const initialState: AuthState = {
  isLoggedIn: false,
  user: null,
  flow: 'idle',
  tempSession: null,
  loginMethod: null,
  passwordAttempts: 0,
  lockedUntil: null,
  trustedUntil: null,
};

export function useAuthProvider() {
  const state = reactive<AuthState>({ ...initialState });

  function login(method: LoginMethod, credentials: Record<string, string>, account?: DemoUser): LoginResult {
    state.flow = 'logging_in';
    state.loginMethod = method;

    // Check lock
    if (state.lockedUntil && Date.now() < state.lockedUntil) {
      const remaining = Math.ceil((state.lockedUntil - Date.now()) / 60000);
      state.flow = 'idle';
      return { success: false, error: `账号已锁定，请 ${remaining} 分钟后重试` };
    }

    if (method === 'password') {
      const acc = findAccount(credentials.username || '');
      if (!acc) {
        state.flow = 'idle';
        return { success: false, error: '账号或密码错误' };
      }
      if (!checkPassword(acc, credentials.password || '')) {
        state.passwordAttempts += 1;
        const attempts = state.passwordAttempts;
        const remaining = 5 - attempts;
        if (remaining <= 0) {
          state.lockedUntil = Date.now() + 15 * 60 * 1000;
          state.flow = 'idle';
          return { success: false, error: '密码错误次数过多，账号已锁定 15 分钟' };
        }
        state.flow = 'idle';
        return { success: false, error: `账号或密码错误，剩余尝试次数：${remaining}` };
      }
      if (acc.level === 'local') {
        state.isLoggedIn = true;
        state.user = acc;
        state.flow = 'logged_in';
        state.tempSession = null;
        state.passwordAttempts = 0;
        state.lockedUntil = null;
        return { success: true };
      }
      if (acc.has2FA) {
        state.flow = '2fa_required';
        state.tempSession = { userId: acc.id, method };
        return { success: true, requires2FA: true };
      }
      if (acc.level === 'admin' && !acc.has2FA) {
        state.flow = '2fa_setup_required';
        state.tempSession = { userId: acc.id, method };
        return { success: true, requires2FASetup: true };
      }
      state.isLoggedIn = true;
      state.user = acc;
      state.flow = 'logged_in';
      state.tempSession = null;
      state.passwordAttempts = 0;
      state.lockedUntil = null;
      return { success: true };
    }

    if (method === 'sms') {
      if (!account || account.level === 'local') {
        state.flow = 'idle';
        return { success: false, error: '本地账户不支持验证码登录' };
      }
      if (credentials.code !== VALIDATE_CODE) {
        state.flow = 'idle';
        return { success: false, error: '验证码错误，请重新输入' };
      }
      if (account.has2FA) {
        state.flow = '2fa_required';
        state.tempSession = { userId: account.id, method };
        return { success: true, requires2FA: true };
      }
      if (account.level === 'admin' && !account.has2FA) {
        state.flow = '2fa_setup_required';
        state.tempSession = { userId: account.id, method };
        return { success: true, requires2FASetup: true };
      }
      state.isLoggedIn = true;
      state.user = account;
      state.flow = 'logged_in';
      state.tempSession = null;
      state.passwordAttempts = 0;
      state.lockedUntil = null;
      return { success: true };
    }

    if (method === 'github') {
      if (!account) {
        state.flow = 'idle';
        return { success: false, error: '请先识别账户' };
      }
      if (account.has2FA) {
        state.flow = '2fa_required';
        state.tempSession = { userId: account.id, method };
        return { success: true, requires2FA: true };
      }
      state.isLoggedIn = true;
      state.user = account;
      state.flow = 'logged_in';
      state.tempSession = null;
      state.passwordAttempts = 0;
      state.lockedUntil = null;
      return { success: true };
    }

    if (method === 'magic-link') {
      if (!account || account.level === 'local') {
        state.flow = 'idle';
        return { success: false, error: '本地账户不支持 Magic Link 登录' };
      }
      if (account.level === 'admin') {
        state.flow = 'idle';
        return { success: false, error: '管理员账户不支持 Magic Link 登录，请使用其他方式' };
      }
      state.flow = '2fa_required';
      state.tempSession = { userId: account.id, method };
      return { success: true, requires2FA: true };
    }

    if (method === 'passkey') {
      if (!account || account.level === 'local') {
        state.flow = 'idle';
        return { success: false, error: '本地账户不支持 Passkey 登录' };
      }
      if (account.has2FA) {
        state.flow = '2fa_required';
        state.tempSession = { userId: account.id, method };
        return { success: true, requires2FA: true };
      }
      if (account.level === 'admin' && !account.has2FA) {
        state.flow = '2fa_setup_required';
        state.tempSession = { userId: account.id, method };
        return { success: true, requires2FASetup: true };
      }
      state.isLoggedIn = true;
      state.user = account;
      state.flow = 'logged_in';
      state.tempSession = null;
      state.passwordAttempts = 0;
      state.lockedUntil = null;
      return { success: true };
    }

    state.flow = 'idle';
    return { success: false, error: '不支持的登录方式' };
  }

  function register(type: 'local' | 'normal', data: RegisterData): RegisterResult {
    const existing = findAccount(data.username);
    if (existing) {
      return { success: false, error: '用户名已存在' };
    }
    const newUser: DemoUser = {
      id: `user-${Date.now()}`,
      username: data.username,
      password: data.password || '',
      level: type,
      email: data.email || null,
      phone: data.phone || null,
      has2FA: false,
      hasPasskey: false,
      hasGithub: false,
      bindings: [],
    };
    if (data.email) newUser.bindings.push('email');
    if (data.phone) newUser.bindings.push('phone');
    state.isLoggedIn = true;
    state.user = newUser;
    state.flow = 'logged_in';
    state.tempSession = null;
    return { success: true };
  }

  function logout() {
    const trusted = state.trustedUntil;
    Object.assign(state, { ...initialState, trustedUntil: trusted });
  }

  function updateUser(user: DemoUser) {
    state.user = user;
  }

  const ctx: AuthContextType = { state, login, register, logout, updateUser };
  provide(AUTH_KEY, ctx);

  return ctx;
}

export function useAuth(): AuthContextType {
  const ctx = inject<AuthContextType>(AUTH_KEY);
  if (!ctx) throw new Error('useAuth must be used within a component that calls useAuthProvider()');
  return ctx;
}
