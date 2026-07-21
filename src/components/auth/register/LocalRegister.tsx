import { useState } from 'react';
import { useAuth } from '../AuthProvider';
import type { RegisterData } from '~/types/auth';

interface Props {
  onRegister: (type: 'local', data: RegisterData) => { success: boolean; error?: string };
}

export function LocalRegister({ onRegister }: Props) {
  const { baseUrl } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!username.trim()) errs.username = '请输入用户名';
    else if (username.trim().length < 3) errs.username = '用户名至少 3 个字符';
    if (!password) errs.password = '请输入密码';
    else if (password.length < 6) errs.password = '密码长度不能少于 6 位';
    if (password !== confirmPassword) errs.confirmPassword = '两次输入的密码不一致';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitError('');
    if (!validate()) return;
    const result = onRegister('local', { username: username.trim(), password });
    if (!result.success) {
      setSubmitError(result.error || '注册失败');
      return;
    }
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="text-center space-y-4">
        <div className="text-5xl">✅</div>
        <p className="font-semibold text-lg">本地账户注册成功</p>
        <p className="text-sm text-neutral">
          账户等级：<span className="badge badge-sm">本地账户</span>
        </p>
        <div className="alert alert-info text-sm text-left">
          <span>本地账户功能受限：不可找回密码、不支持 2FA。绑定邮箱或手机号可自动升级为普通账户。</span>
        </div>
        <a href={baseUrl + 'login'} className="btn btn-primary btn-sm">
          去登录
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-neutral text-center">仅用户名 + 密码，无需绑定邮箱/手机</p>
      {(['username', 'password', 'confirmPassword'] as const).map((field) => {
        const labels: Record<string, string> = { username: '用户名', password: '密码', confirmPassword: '确认密码' };
        const types: Record<string, string> = { username: 'text', password: 'password', confirmPassword: 'password' };
        const vals = { username, password, confirmPassword };
        const setters: Record<string, (v: string) => void> = {
          username: setUsername,
          password: setPassword,
          confirmPassword: setConfirmPassword,
        };
        return (
          <div key={field}>
            <label className="label pb-1" htmlFor={`reg-local-${field}`}>
              <span className="label-text font-medium">{labels[field]}</span>
            </label>
            <input
              id={`reg-local-${field}`}
              type={types[field]}
              className={`input input-bordered w-full ${errors[field] ? 'input-error' : ''}`}
              value={vals[field]}
              onInput={(e) => {
                setters[field](e.currentTarget.value);
                setErrors((p) => ({ ...p, [field]: '' }));
              }}
              placeholder={`请输入${labels[field]}${field === 'password' || field === 'confirmPassword' ? '（至少6位）' : '(至少3位)'}`}
            />
            {errors[field] && <span className="label-text-alt text-error">{errors[field]}</span>}
          </div>
        );
      })}
      {submitError && <div className="alert alert-error text-sm">{submitError}</div>}
      <button type="submit" className="btn btn-primary w-full">
        注册本地账户
      </button>
    </form>
  );
}
