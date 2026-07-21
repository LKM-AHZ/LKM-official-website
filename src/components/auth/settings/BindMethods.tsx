import { useState } from 'react';
import type { DemoUser } from '~/types/auth';

interface Props {
  user: DemoUser;
  onUpdate: (user: DemoUser) => void;
}

export function BindMethods({ user, onUpdate }: Props) {
  const [showBind, setShowBind] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  function handleBind(method: string) {
    setShowBind(method);
    setInput('');
    setCode('');
    setError('');
    setSuccess('');
  }

  function handleVerify() {
    if (!input.trim()) {
      setError(`请输入${showBind === 'phone' ? '手机号' : '邮箱'}`);
      return;
    }
    if (code !== '000000') {
      setError('验证码错误（模拟码：000000）');
      return;
    }

    const updated: DemoUser = { ...user };
    if (showBind === 'email') {
      updated.email = input.trim();
      if (!updated.bindings.includes('email')) updated.bindings.push('email');
    } else if (showBind === 'phone') {
      updated.phone = input.trim();
      if (!updated.bindings.includes('phone')) updated.bindings.push('phone');
    } else if (showBind === 'github') {
      updated.hasGithub = true;
      if (!updated.bindings.includes('github')) updated.bindings.push('github');
    } else if (showBind === 'passkey') {
      updated.hasPasskey = true;
      if (!updated.bindings.includes('passkey')) updated.bindings.push('passkey');
    }

    // local → normal 自动升级
    if (
      user.level === 'local' &&
      showBind &&
      (showBind === 'email' || showBind === 'phone' || showBind === 'github' || showBind === 'passkey')
    ) {
      updated.level = 'normal';
      setSuccess(
        `${showBind === 'email' ? '邮箱' : showBind === 'phone' ? '手机号' : showBind === 'github' ? 'Github' : 'Passkey'} 绑定成功！账户已从本地账户升级为普通账户，刷新后生效。`
      );
    } else {
      setSuccess('绑定成功');
    }
    onUpdate(updated);
    setShowBind(null);
  }

  function handleUnbind(method: string) {
    const updated: DemoUser = { ...user };
    if (method === 'email') {
      updated.email = null;
      updated.bindings = updated.bindings.filter((b) => b !== 'email');
    }
    if (method === 'phone') {
      updated.phone = null;
      updated.bindings = updated.bindings.filter((b) => b !== 'phone');
    }
    if (method === 'github') {
      updated.hasGithub = false;
      updated.bindings = updated.bindings.filter((b) => b !== 'github');
    }
    if (method === 'passkey') {
      updated.hasPasskey = false;
      updated.bindings = updated.bindings.filter((b) => b !== 'passkey');
    }
    onUpdate(updated);
    setSuccess('解绑成功');
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">登录方式管理</h3>
      {success && <div className="alert alert-success text-sm">{success}</div>}

      {(['email', 'phone', 'github', 'passkey'] as const).map((method) => (
        <div key={method} className="flex items-center justify-between p-3 bg-base-200 rounded-lg">
          <div>
            <span className="font-medium">
              {method === 'email'
                ? '邮箱'
                : method === 'phone'
                  ? '手机号'
                  : method === 'github'
                    ? 'Github OAuth'
                    : 'Passkey 通行密钥'}
            </span>
            <span className="text-xs text-neutral ml-2">
              {method === 'email' && user.email ? user.email : method === 'phone' && user.phone ? user.phone : ''}
            </span>
            <span className={`badge badge-xs ml-2 ${user.bindings.includes(method) ? 'badge-success' : 'badge-ghost'}`}>
              {user.bindings.includes(method) ? '已绑定' : '未绑定'}
            </span>
          </div>
          <div className="flex gap-1">
            {user.bindings.includes(method) ? (
              <button type="button" className="btn btn-ghost btn-xs text-error" onClick={() => handleUnbind(method)}>
                解绑
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-ghost btn-xs"
                onClick={() => handleBind(method)}
                disabled={user.level === 'local' && method === 'passkey'}
              >
                绑定
              </button>
            )}
          </div>
        </div>
      ))}

      {showBind && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setShowBind(null)}
        >
          <div
            className="bg-base-100 rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h4 className="font-semibold mb-4">
              绑定{' '}
              {showBind === 'email'
                ? '邮箱'
                : showBind === 'phone'
                  ? '手机号'
                  : showBind === 'github'
                    ? 'Github'
                    : 'Passkey'}
            </h4>
            {showBind === 'github' ? (
              <div className="space-y-4 text-center">
                <p className="text-sm text-neutral">模拟 Github OAuth 授权绑定</p>
                <button type="button" className="btn btn-primary btn-sm" onClick={handleVerify}>
                  模拟授权并绑定
                </button>
              </div>
            ) : showBind === 'passkey' ? (
              <div className="space-y-4 text-center">
                <p className="text-sm text-neutral">模拟 Passkey 创建</p>
                <button type="button" className="btn btn-primary btn-sm" onClick={handleVerify}>
                  模拟创建通行密钥
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="label pb-1">
                    <span className="label-text">{showBind === 'phone' ? '手机号' : '邮箱'}</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered w-full"
                    value={input}
                    onInput={(e) => setInput(e.currentTarget.value)}
                  />
                </div>
                <div>
                  <label className="label pb-1">
                    <span className="label-text">验证码</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered w-full"
                    value={code}
                    onInput={(e) => setCode(e.currentTarget.value)}
                    placeholder="模拟码：000000"
                    maxLength={6}
                  />
                </div>
                {error && <div className="text-error text-xs">{error}</div>}
                <button type="button" className="btn btn-primary btn-sm w-full" onClick={handleVerify}>
                  验证并绑定
                </button>
              </div>
            )}
            <button type="button" className="btn btn-ghost btn-xs w-full mt-2" onClick={() => setShowBind(null)}>
              取消
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
