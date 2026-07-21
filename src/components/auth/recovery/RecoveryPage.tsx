import { useState } from 'react';
import { useAuth } from '../AuthProvider';
import { findAccount, VALIDATE_CODE } from '~/data/demo-accounts';
import { TwoFactorRecovery } from './TwoFactorRecovery';
import type { DemoUser } from '~/types/auth';

type Method = 'sms' | 'email-code' | 'magic-link';
type Step = 'input' | 'verify' | 'reset' | '2fa' | 'done';

export function RecoveryPage() {
  const { baseUrl } = useAuth();
  const [input, setInput] = useState('');
  const [method, setMethod] = useState<Method>('email-code');
  const [step, setStep] = useState<Step>('input');
  const [account, setAccount] = useState<DemoUser | null>(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  function handleFind(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    const found = findAccount(input);
    if (!found) {
      setError('未找到关联账号');
      return;
    }
    setAccount(found);

    if (found.level === 'local') {
      setError('本地账户不支持密码找回，忘记密码即账号不可恢复');
      return;
    }
    if (method === 'magic-link' && found.level === 'admin') {
      setError('管理员账户不支持 Magic Link 找回，请使用邮箱验证码方式');
      return;
    }
    setStep('verify');
  }

  function handleVerify(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    if (code !== VALIDATE_CODE) {
      setError('验证码错误（模拟码：000000）');
      return;
    }
    setError('');
    if (account?.level === 'admin') {
      setStep('2fa');
    } else {
      setStep('reset');
    }
  }

  function handleMagicLinkClick() {
    if (account?.level === 'admin') {
      setStep('2fa');
    } else {
      setStep('reset');
    }
  }

  function handleReset(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setError('密码长度不能少于 6 位');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }
    setStep('done');
  }

  if (step === 'done') {
    return (
      <div className="relative min-h-[calc(100vh-12rem)] flex items-center justify-center px-4">
        <div className="absolute inset-0 bg-base-100/70 backdrop-blur-sm"></div>
        <div className="relative w-full max-w-md text-center">
          <div className="rounded-2xl bg-base-100 shadow-2xl border border-base-300 p-6 sm:p-8">
            <div className="text-5xl mb-4">✅</div>
            <h2 className="text-xl font-semibold mb-2">密码重置成功</h2>
            <p className="text-sm text-neutral">所有设备已强制下线，请使用新密码重新登录</p>
            <a href={baseUrl + 'login'} className="btn btn-primary btn-sm mt-4">
              去登录
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (step === '2fa' && account) {
    return (
      <div className="relative min-h-[calc(100vh-12rem)] flex items-center justify-center px-4">
        <div className="absolute inset-0 bg-base-100/70 backdrop-blur-sm"></div>
        <div className="relative w-full max-w-md">
          <TwoFactorRecovery
            level={account.level as 'normal' | 'admin'}
            onSuccess={() => setStep('reset')}
            onBack={() => setStep('verify')}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-[calc(100vh-12rem)] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-base-100/70 backdrop-blur-sm"></div>
      <div className="relative w-full max-w-md">
        <div className="rounded-2xl bg-base-100 shadow-2xl border border-base-300 p-6 sm:p-8">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-semibold mb-2">密码找回</h1>
            <p className="text-sm text-neutral">重置您的登录密码</p>
          </div>

          {error && <div className="alert alert-error text-sm mb-4">{error}</div>}

          {step === 'input' && (
            <form onSubmit={handleFind} className="space-y-4">
              <div className="tabs tabs-bordered mb-4">
                {[
                  { key: 'email-code' as Method, label: '邮箱验证码' },
                  { key: 'sms' as Method, label: '手机验证码' },
                  { key: 'magic-link' as Method, label: 'Magic Link' },
                ].map((t) => (
                  <a
                    key={t.key}
                    className={`tab tab-bordered${method === t.key ? ' tab-active' : ''}`}
                    onClick={(e) => {
                      e.preventDefault();
                      setMethod(t.key);
                    }}
                  >
                    {t.label}
                  </a>
                ))}
              </div>
              <div>
                <label className="label pb-1">
                  <span className="label-text font-medium">{method === 'sms' ? '手机号' : '邮箱'}</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered w-full"
                  value={input}
                  onInput={(e) => setInput(e.currentTarget.value)}
                  placeholder={method === 'sms' ? '请输入绑定的手机号' : '请输入绑定的邮箱'}
                />
              </div>
              <button type="submit" className="btn btn-primary w-full">
                下一步
              </button>
            </form>
          )}

          {step === 'verify' && method === 'magic-link' && (
            <div className="space-y-4 text-center">
              <p className="text-sm text-neutral">重置链接已发送至 {account?.email}（模拟）</p>
              <button type="button" className="btn btn-primary" onClick={handleMagicLinkClick}>
                模拟点击重置链接
              </button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setStep('input')}>
                返回
              </button>
            </div>
          )}

          {step === 'verify' && method !== 'magic-link' && (
            <form onSubmit={handleVerify} className="space-y-4">
              <p className="text-sm text-neutral">验证码已发送（模拟码：000000）</p>
              <div>
                <label className="label pb-1">
                  <span className="label-text font-medium">验证码</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered w-full"
                  value={code}
                  onInput={(e) => setCode(e.currentTarget.value)}
                  placeholder="请输入 6 位验证码"
                  maxLength={6}
                />
              </div>
              <button type="submit" className="btn btn-primary w-full">
                验证
              </button>
              <button type="button" className="btn btn-ghost w-full btn-sm" onClick={() => setStep('input')}>
                返回
              </button>
            </form>
          )}

          {step === 'reset' && (
            <form onSubmit={handleReset} className="space-y-4">
              <p className="text-sm text-neutral">为 {account?.username} 设置新密码</p>
              <div>
                <label className="label pb-1">
                  <span className="label-text font-medium">新密码</span>
                </label>
                <input
                  type="password"
                  className="input input-bordered w-full"
                  value={newPassword}
                  onInput={(e) => setNewPassword(e.currentTarget.value)}
                  placeholder="至少 6 位"
                />
              </div>
              <div>
                <label className="label pb-1">
                  <span className="label-text font-medium">确认密码</span>
                </label>
                <input
                  type="password"
                  className="input input-bordered w-full"
                  value={confirmPassword}
                  onInput={(e) => setConfirmPassword(e.currentTarget.value)}
                  placeholder="再次输入新密码"
                />
              </div>
              <button type="submit" className="btn btn-primary w-full">
                重置密码
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
