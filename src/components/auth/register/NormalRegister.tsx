import { useState } from 'react';
import type { RegisterData } from '~/types/auth';

interface Props {
  onRegister: (type: 'normal', data: RegisterData) => { success: boolean; error?: string };
  onComplete: (withGuide: boolean) => void;
}

export function NormalRegister({ onRegister, onComplete }: Props) {
  const [step, setStep] = useState<'form' | 'verify' | 'done'>('form');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [useEmail, setUseEmail] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState('');
  const [verifyCode, setVerifyCode] = useState('');

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!username.trim()) errs.username = '请输入用户名';
    else if (username.trim().length < 3) errs.username = '用户名至少 3 个字符';
    if (useEmail && !email.trim()) errs.email = '请输入邮箱';
    else if (useEmail && !email.includes('@')) errs.email = '请输入有效的邮箱地址';
    if (!useEmail && !phone.trim()) errs.phone = '请输入手机号';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitError('');
    if (!validate()) return;
    setStep('verify');
  }

  function handleVerify(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    if (verifyCode !== '000000') {
      setSubmitError('验证码错误（模拟码：000000）');
      return;
    }
    const result = onRegister('normal', {
      username: username.trim(),
      email: useEmail ? email.trim() : undefined,
      phone: !useEmail ? phone.trim() : undefined,
    });
    if (!result.success) {
      setSubmitError(result.error || '注册失败');
      return;
    }
    setStep('done');
  }

  if (step === 'verify') {
    return (
      <form onSubmit={handleVerify} className="space-y-4">
        <p className="text-sm text-neutral text-center">验证码已发送至 {useEmail ? email : phone}（模拟码：000000）</p>
        <input
          id="reg-verify"
          type="text"
          className="input input-bordered w-full"
          value={verifyCode}
          onInput={(e) => setVerifyCode(e.currentTarget.value)}
          placeholder="请输入 6 位验证码"
          maxLength={6}
        />
        {submitError && <div className="alert alert-error text-sm">{submitError}</div>}
        <button type="submit" className="btn btn-primary w-full">
          验证并完成注册
        </button>
        <button type="button" className="btn btn-ghost w-full btn-sm" onClick={() => setStep('form')}>
          返回修改
        </button>
      </form>
    );
  }

  if (step === 'done') {
    return (
      <div className="text-center space-y-4">
        <div className="text-5xl">✅</div>
        <p className="font-semibold text-lg">普通账户注册成功</p>
        <p className="text-sm text-neutral">现在可以设置 2FA 和通行密钥增强安全性</p>
        <div className="flex gap-3 justify-center">
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => onComplete(false)}>
            跳过
          </button>
          <button type="button" className="btn btn-primary btn-sm" onClick={() => onComplete(true)}>
            去设置 2FA
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-neutral text-center">仅需用户名 + {useEmail ? '邮箱' : '手机号'}，验证后即可注册</p>
      <div>
        <label className="label pb-1" htmlFor="reg-normal-user">
          <span className="label-text font-medium">用户名</span>
        </label>
        <input
          id="reg-normal-user"
          type="text"
          className={`input input-bordered w-full ${errors.username ? 'input-error' : ''}`}
          value={username}
          onInput={(e) => {
            setUsername(e.currentTarget.value);
            setErrors((p) => ({ ...p, username: '' }));
          }}
          placeholder="请输入用户名（至少3位）"
        />
        {errors.username && <span className="label-text-alt text-error">{errors.username}</span>}
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          className={`btn btn-xs ${useEmail ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setUseEmail(true)}
        >
          使用邮箱
        </button>
        <button
          type="button"
          className={`btn btn-xs ${!useEmail ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setUseEmail(false)}
        >
          使用手机号
        </button>
      </div>
      {useEmail ? (
        <div>
          <label className="label pb-1" htmlFor="reg-normal-email">
            <span className="label-text font-medium">邮箱</span>
          </label>
          <input
            id="reg-normal-email"
            type="email"
            className={`input input-bordered w-full ${errors.email ? 'input-error' : ''}`}
            value={email}
            onInput={(e) => {
              setEmail(e.currentTarget.value);
              setErrors((p) => ({ ...p, email: '' }));
            }}
            placeholder="请输入邮箱地址"
          />
          {errors.email && <span className="label-text-alt text-error">{errors.email}</span>}
        </div>
      ) : (
        <div>
          <label className="label pb-1" htmlFor="reg-normal-phone">
            <span className="label-text font-medium">手机号</span>
          </label>
          <input
            id="reg-normal-phone"
            type="tel"
            className={`input input-bordered w-full ${errors.phone ? 'input-error' : ''}`}
            value={phone}
            onInput={(e) => {
              setPhone(e.currentTarget.value);
              setErrors((p) => ({ ...p, phone: '' }));
            }}
            placeholder="请输入手机号"
          />
          {errors.phone && <span className="label-text-alt text-error">{errors.phone}</span>}
        </div>
      )}
      {submitError && <div className="alert alert-error text-sm">{submitError}</div>}
      <button type="submit" className="btn btn-primary w-full">
        发送验证码
      </button>
    </form>
  );
}
