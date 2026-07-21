import { createContext, useContext, useReducer, useCallback, type ReactNode } from 'react';
import type {
  AuthState,
  AuthAction,
  AuthContextType,
  LoginResult,
  LoginMethod,
  RegisterData,
  RegisterResult,
  DemoUser,
} from '~/types/auth';
import { findAccount, checkPassword, VALIDATE_CODE } from '~/data/demo-accounts';

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

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'LOGIN_START':
      return {
        ...state,
        flow: 'logging_in',
        loginMethod: action.method,
      };

    case 'LOGIN_SUCCESS':
      return {
        ...state,
        isLoggedIn: true,
        user: action.user,
        flow: 'logged_in',
        tempSession: null,
        passwordAttempts: 0,
        lockedUntil: null,
      };

    case 'LOGIN_2FA_REQUIRED':
      return {
        ...state,
        flow: '2fa_required',
        tempSession: { userId: action.userId, method: action.method },
      };

    case 'LOGIN_2FA_SETUP_REQUIRED':
      return {
        ...state,
        flow: '2fa_setup_required',
        tempSession: { userId: action.userId, method: action.method },
      };

    case 'PASSWORD_ATTEMPT_FAILED':
      return {
        ...state,
        flow: 'idle',
        passwordAttempts: state.passwordAttempts + 1,
        lockedUntil: state.passwordAttempts >= 4 ? Date.now() + 15 * 60 * 1000 : null,
      };

    case 'LOGIN_FAILED':
      return {
        ...state,
        flow: 'idle',
      };

    case 'ACCOUNT_LOCKED':
      return {
        ...state,
        lockedUntil: action.until,
        flow: 'idle',
      };

    case 'LOGOUT':
      return {
        ...initialState,
        trustedUntil: state.trustedUntil,
      };

    case 'UPDATE_USER':
      return {
        ...state,
        user: action.user,
      };

    case 'SET_FLOW':
      return {
        ...state,
        flow: action.flow,
      };

    case 'CLEAR_ERROR':
      return {
        ...state,
        flow: 'idle',
      };

    case 'TRUST_DEVICE':
      return {
        ...state,
        trustedUntil: action.until,
      };

    default:
      return state;
  }
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  const login = useCallback(
    (method: LoginMethod, credentials: Record<string, string>, account?: DemoUser): LoginResult => {
      dispatch({ type: 'LOGIN_START', method });

      // 检查账号锁定
      if (state.lockedUntil && Date.now() < state.lockedUntil) {
        const remaining = Math.ceil((state.lockedUntil - Date.now()) / 60000);
        return { success: false, error: `账号已锁定，请 ${remaining} 分钟后重试` };
      }

      if (method === 'password') {
        const account = findAccount(credentials.username || '');
        if (!account) {
          dispatch({ type: 'LOGIN_FAILED', reason: '账号或密码错误' });
          return { success: false, error: '账号或密码错误' };
        }
        if (!checkPassword(account, credentials.password || '')) {
          dispatch({ type: 'PASSWORD_ATTEMPT_FAILED' });
          const attempts = state.passwordAttempts + 1;
          const remaining = 5 - attempts;
          if (remaining <= 0) {
            dispatch({ type: 'ACCOUNT_LOCKED', until: Date.now() + 15 * 60 * 1000 });
            return { success: false, error: '密码错误次数过多，账号已锁定 15 分钟' };
          }
          return { success: false, error: `账号或密码错误，剩余尝试次数：${remaining}` };
        }
        // 登录成功，判断等级
        if (account.level === 'local') {
          dispatch({ type: 'LOGIN_SUCCESS', user: account });
          return { success: true };
        }
        if (account.has2FA) {
          dispatch({ type: 'LOGIN_2FA_REQUIRED', userId: account.id, method });
          return { success: true, requires2FA: true };
        }
        if (account.level === 'admin' && !account.has2FA) {
          dispatch({ type: 'LOGIN_2FA_SETUP_REQUIRED', userId: account.id, method });
          return { success: true, requires2FASetup: true };
        }
        dispatch({ type: 'LOGIN_SUCCESS', user: account });
        return { success: true };
      }

      if (method === 'sms') {
        if (!account || account.level === 'local') {
          return { success: false, error: '本地账户不支持验证码登录' };
        }
        if (credentials.code !== VALIDATE_CODE) {
          return { success: false, error: '验证码错误，请重新输入' };
        }
        if (account.has2FA) {
          dispatch({ type: 'LOGIN_2FA_REQUIRED', userId: account.id, method });
          return { success: true, requires2FA: true };
        }
        if (account.level === 'admin' && !account.has2FA) {
          dispatch({ type: 'LOGIN_2FA_SETUP_REQUIRED', userId: account.id, method });
          return { success: true, requires2FASetup: true };
        }
        dispatch({ type: 'LOGIN_SUCCESS', user: account });
        return { success: true };
      }

      if (method === 'github') {
        if (!account) return { success: false, error: '请先识别账户' };
        if (account.has2FA) {
          dispatch({ type: 'LOGIN_2FA_REQUIRED', userId: account.id, method });
          return { success: true, requires2FA: true };
        }
        dispatch({ type: 'LOGIN_SUCCESS', user: account });
        return { success: true };
      }

      if (method === 'magic-link') {
        if (!account || account.level === 'local') {
          return { success: false, error: '本地账户不支持 Magic Link 登录' };
        }
        if (account.level === 'admin') {
          return { success: false, error: '管理员账户不支持 Magic Link 登录，请使用其他方式' };
        }
        dispatch({ type: 'LOGIN_2FA_REQUIRED', userId: account.id, method });
        return { success: true, requires2FA: true };
      }

      if (method === 'passkey') {
        if (!account || account.level === 'local') {
          return { success: false, error: '本地账户不支持 Passkey 登录' };
        }
        if (account.has2FA) {
          dispatch({ type: 'LOGIN_2FA_REQUIRED', userId: account.id, method });
          return { success: true, requires2FA: true };
        }
        if (account.level === 'admin' && !account.has2FA) {
          dispatch({ type: 'LOGIN_2FA_SETUP_REQUIRED', userId: account.id, method });
          return { success: true, requires2FASetup: true };
        }
        dispatch({ type: 'LOGIN_SUCCESS', user: account });
        return { success: true };
      }

      return { success: false, error: '不支持的登录方式' };
    },
    [state.passwordAttempts, state.lockedUntil]
  );

  const register = useCallback((type: 'local' | 'normal', data: RegisterData): RegisterResult => {
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
    dispatch({ type: 'LOGIN_SUCCESS', user: newUser });
    return { success: true };
  }, []);

  const logout = useCallback(() => {
    dispatch({ type: 'LOGOUT' });
  }, []);

  const updateUser = useCallback((user: DemoUser) => {
    dispatch({ type: 'UPDATE_USER', user });
  }, []);

  const value: AuthContextType = { state, dispatch, login, register, logout, updateUser };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
