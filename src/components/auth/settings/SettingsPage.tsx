import { useState } from 'react';
import { useAuth } from '../AuthProvider';
import { ProtectedRoute } from '../ProtectedRoute';
import { BindMethods } from './BindMethods';
import { TwoFactorSetup } from './TwoFactorSetup';
import { PasskeySetup } from './PasskeySetup';
import type { DemoUser } from '~/types/auth';

export function SettingsPage() {
  const { state, updateUser, logout, baseUrl } = useAuth();
  const [message, setMessage] = useState('');

  function handleUpdate(user: DemoUser) {
    updateUser(user);
    setMessage('设置已更新');
    setTimeout(() => setMessage(''), 3000);
  }

  return (
    <ProtectedRoute>
      <div className="relative min-h-[calc(100vh-12rem)] px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-semibold mb-2">账户设置</h1>
            <p className="text-sm text-neutral">管理你的登录方式和安全设置</p>
          </div>

          {message && <div className="alert alert-success text-sm">{message}</div>}

          {/* 账户信息 */}
          <div className="rounded-2xl bg-base-100 shadow-xl border border-base-300 p-6 space-y-4">
            <h3 className="text-lg font-semibold">账户信息</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-neutral">用户名：</span>
                <span className="font-medium">{state.user?.username}</span>
              </div>
              <div>
                <span className="text-neutral">等级：</span>
                <span
                  className={`badge badge-sm ${state.user?.level === 'admin' ? 'badge-error' : state.user?.level === 'normal' ? 'badge-primary' : 'badge-ghost'}`}
                >
                  {state.user?.level === 'admin' ? '管理员' : state.user?.level === 'normal' ? '普通账户' : '本地账户'}
                </span>
              </div>
              <div>
                <span className="text-neutral">邮箱：</span>
                <span className="font-medium">{state.user?.email || '未绑定'}</span>
              </div>
              <div>
                <span className="text-neutral">手机号：</span>
                <span className="font-medium">{state.user?.phone || '未绑定'}</span>
              </div>
            </div>

            {state.user?.level === 'local' && (
              <div className="alert alert-info text-sm">
                <span>当前为本地账户，绑定邮箱或手机号可自动升级为普通账户，解锁全部功能。</span>
              </div>
            )}

            {state.user?.level === 'normal' && (
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  if (state.user?.has2FA) {
                    handleUpdate({ ...state.user!, level: 'admin' });
                  } else {
                    setMessage('请先开启 2FA 后再升级为管理员');
                    setTimeout(() => setMessage(''), 3000);
                  }
                }}
              >
                升级为管理员
              </button>
            )}
          </div>

          {/* 绑定登录方式 */}
          {state.user && (
            <div className="rounded-2xl bg-base-100 shadow-xl border border-base-300 p-6">
              <BindMethods user={state.user} onUpdate={handleUpdate} />
            </div>
          )}

          {/* 2FA */}
          {state.user && (
            <div className="rounded-2xl bg-base-100 shadow-xl border border-base-300 p-6">
              <TwoFactorSetup user={state.user} onUpdate={handleUpdate} />
            </div>
          )}

          {/* Passkey */}
          {state.user && (
            <div className="rounded-2xl bg-base-100 shadow-xl border border-base-300 p-6">
              <PasskeySetup user={state.user} onUpdate={handleUpdate} />
            </div>
          )}

          <div className="flex gap-3 justify-between">
            <a href={baseUrl + 'account/recovery'} className="btn btn-ghost btn-sm">
              密码找回
            </a>
            <button type="button" className="btn btn-outline btn-sm text-error" onClick={logout}>
              退出登录
            </button>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
