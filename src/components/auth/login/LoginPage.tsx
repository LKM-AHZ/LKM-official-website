import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../AuthProvider';
import { getAuthPath } from '../auth-paths';
import { findAccount } from '~/data/demo-accounts';
import { PasswordLogin } from './PasswordLogin';
import { SmsLogin } from './SmsLogin';
import { GithubLogin } from './GithubLogin';
import { MagicLinkLogin } from './MagicLinkLogin';
import { PasskeyLogin } from './PasskeyLogin';
import { TwoFactorVerify } from './TwoFactorVerify';
import type { LoginMethod, DemoUser } from '~/types/auth';

interface Tab {
  key: LoginMethod;
  label: string;
}

const ALL_TABS: Tab[] = [
  { key: 'password', label: '密码登录' },
  { key: 'sms', label: '验证码登录' },
  { key: 'github', label: 'Github 登录' },
  { key: 'magic-link', label: 'Magic Link' },
  { key: 'passkey', label: '通行密钥' },
];

function getAvailableTabs(account: DemoUser): Tab[] {
  const tabs: Tab[] = [...ALL_TABS];

  if (account.level === 'local') {
    // local 仅密码
    return tabs.filter((t) => t.key === 'password');
  }

  // normal / admin: 根据绑定情况过滤
  return tabs.filter((t) => {
    switch (t.key) {
      case 'password':
        return true; // 密码始终可用
      case 'sms':
        return account.bindings.includes('email') || account.bindings.includes('phone');
      case 'github':
        return account.hasGithub;
      case 'magic-link':
        return account.level === 'normal' && account.bindings.includes('email');
      case 'passkey':
        return account.hasPasskey;
      default:
        return false;
    }
  });
}

export function LoginPage() {
  const { state, login } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // 步骤1: 输入标识符
  const [identifier, setIdentifier] = useState('');
  const [identifiedAccount, setIdentifiedAccount] = useState<DemoUser | null>(null);
  const [identifierError, setIdentifierError] = useState('');

  // 步骤2: 选择登录方式
  const [activeTab, setActiveTab] = useState<LoginMethod>('password');
  const [availableTabs, setAvailableTabs] = useState<Tab[]>(ALL_TABS);

  // 重置标识符
  function handleBack() {
    setIdentifiedAccount(null);
    setIdentifier('');
    setActiveTab('password');
    setAvailableTabs(ALL_TABS);
    setError(null);
  }

  // 识别账户
  function handleIdentify(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setIdentifierError('');
    setError(null);

    if (!identifier.trim()) {
      setIdentifierError('请输入用户名、邮箱或手机号');
      return;
    }

    const account = findAccount(identifier);
    if (!account) {
      setIdentifierError('未找到关联账号，请检查输入');
      return;
    }

    setIdentifiedAccount(account);
    const tabs = getAvailableTabs(account);
    setAvailableTabs(tabs);
    setActiveTab(tabs[0].key);
  }

  // Tab 切换
  useEffect(() => {
    setError(null);
  }, [activeTab]);

  // 处理登录
  const handleLogin = useCallback(
    async (method: LoginMethod, credentials: Record<string, string>): Promise<void> => {
      setError(null);
      setSuccess(null);
      const result = login(method, credentials, identifiedAccount ?? undefined);
      if (!result.success) {
        setError(result.error || '登录失败');
      }
    },
    [login, identifiedAccount]
  );

  const handle2FASuccess = useCallback((msg: string) => {
    setSuccess(msg);
  }, []);

  const handle2FAError = useCallback((msg: string) => {
    setError(msg);
  }, []);

  // 2FA 流程
  if (state.flow === '2fa_required' || state.flow === '2fa_setup_required') {
    return (
      <div className="relative min-h-[calc(100vh-12rem)] flex items-center justify-center px-4">
        <div className="absolute inset-0 bg-base-100/70 backdrop-blur-sm"></div>
        <div className="relative w-full max-w-md">
          <TwoFactorVerify onSuccess={handle2FASuccess} onError={handle2FAError} />
        </div>
      </div>
    );
  }

  // 已登录
  if (state.flow === 'logged_in' && state.user) {
    return (
      <div className="relative min-h-[calc(100vh-12rem)] flex items-center justify-center px-4">
        <div className="absolute inset-0 bg-base-100/70 backdrop-blur-sm"></div>
        <div className="relative w-full max-w-md">
          <div className="rounded-2xl bg-base-100 shadow-2xl border border-base-300 p-6 sm:p-8 text-center">
            <div className="text-5xl mb-4">✅</div>
            <h2 className="text-2xl font-semibold mb-2">登录成功</h2>
            <p className="text-neutral mb-1">
              欢迎回来，<span className="font-semibold text-base-content">{state.user.username}</span>
            </p>
            <p className="text-xs text-neutral mb-4">
              账户等级：
              <span
                className={`badge badge-sm ml-1 ${state.user.level === 'admin' ? 'badge-error' : state.user.level === 'normal' ? 'badge-primary' : 'badge-ghost'}`}
              >
                {state.user.level === 'admin' ? '管理员' : state.user.level === 'normal' ? '普通账户' : '本地账户'}
              </span>
            </p>
            {state.user.level === 'local' && (
              <div className="alert alert-info mb-4 text-left text-sm">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="stroke-current shrink-0 h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  ></path>
                </svg>
                <span>
                  绑定邮箱或手机号即可解锁全部功能，
                  <a href={getAuthPath('account')} className="font-semibold underline">
                    前往设置 →
                  </a>
                </span>
              </div>
            )}
            <div className="flex gap-3 justify-center">
              <a href={getAuthPath('account')} className="btn btn-ghost btn-sm">
                账户设置
              </a>
              <a href={getAuthPath('')} className="btn btn-primary btn-sm">
                返回首页
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 登录表单
  return (
    <div className="relative min-h-[calc(100vh-12rem)] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-base-100/70 backdrop-blur-sm"></div>
      <div className="relative w-full max-w-md">
        <div className="rounded-2xl bg-base-100 shadow-2xl border border-base-300 p-6 sm:p-8">
          <div className="text-center mb-6">
            <h1 className="text-3xl md:text-4xl font-semibold leading-tight mb-2 text-base-content">登录</h1>
            <p className="text-sm text-neutral">登录理科迷账号，访问社区资源与文档</p>
          </div>

          {/* 提示区 */}
          {error && <div className="alert alert-error mb-4 text-sm">{error}</div>}
          {success && <div className="alert alert-success mb-4 text-sm">{success}</div>}
          {state.lockedUntil && Date.now() < state.lockedUntil && (
            <div className="alert alert-error mb-4 text-sm">
              账号已锁定 {Math.ceil((state.lockedUntil - Date.now()) / 60000)} 分钟，请稍后再试
            </div>
          )}

          {/* 步骤1: 输入标识符 */}
          {!identifiedAccount && (
            <form onSubmit={handleIdentify} className="space-y-4">
              <div>
                <label className="label pb-1" htmlFor="identify-input">
                  <span className="label-text font-medium">用户名 / 邮箱 / 手机号</span>
                </label>
                <input
                  id="identify-input"
                  type="text"
                  className={`input input-bordered w-full ${identifierError ? 'input-error' : ''}`}
                  value={identifier}
                  onInput={(e) => {
                    setIdentifier(e.currentTarget.value);
                    setIdentifierError('');
                  }}
                  placeholder="请先输入您的账号标识"
                  autoComplete="username"
                />
                {identifierError && <span className="label-text-alt text-error">{identifierError}</span>}
              </div>
              <button type="submit" className="btn btn-primary w-full">
                继续
              </button>
              <p className="text-center text-[13px] text-neutral">
                没有账号？
                <a href={getAuthPath('register')} className="text-primary font-semibold hover:underline">
                  立即注册
                </a>
              </p>
            </form>
          )}

          {/* 步骤2: 选择登录方式 */}
          {identifiedAccount && (
            <>
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm">
                  <span className="text-neutral">登录为 </span>
                  <span className="font-semibold">{identifiedAccount.username}</span>
                  <span
                    className={`badge badge-xs ml-1.5 ${identifiedAccount.level === 'admin' ? 'badge-error' : identifiedAccount.level === 'normal' ? 'badge-primary' : 'badge-ghost'}`}
                  >
                    {identifiedAccount.level === 'admin'
                      ? '管理员'
                      : identifiedAccount.level === 'normal'
                        ? '普通'
                        : '本地'}
                  </span>
                </div>
                <button type="button" className="btn btn-ghost btn-xs" onClick={handleBack}>
                  切换账号
                </button>
              </div>

              {/* Tab 切换 */}
              <div className="tabs tabs-bordered mb-6">
                {availableTabs.map((tab) => (
                  <a
                    key={tab.key}
                    className={`tab tab-bordered${activeTab === tab.key ? ' tab-active' : ''}`}
                    onClick={(e) => {
                      e.preventDefault();
                      setActiveTab(tab.key);
                    }}
                  >
                    {tab.label}
                  </a>
                ))}
              </div>

              {/* 登录表单 */}
              {activeTab === 'password' && (
                <PasswordLogin onLogin={handleLogin} identifiedAccount={identifiedAccount} />
              )}
              {activeTab === 'sms' && <SmsLogin onLogin={handleLogin} identifiedAccount={identifiedAccount} />}
              {activeTab === 'github' && <GithubLogin onLogin={handleLogin} />}
              {activeTab === 'magic-link' && (
                <MagicLinkLogin onLogin={handleLogin} identifiedAccount={identifiedAccount} />
              )}
              {activeTab === 'passkey' && <PasskeyLogin onLogin={handleLogin} />}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
