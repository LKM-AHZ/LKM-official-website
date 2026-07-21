import { useState } from 'react';
import { useAuth } from '../AuthProvider';
import type { LoginMethod, DemoUser } from '~/types/auth';

interface Props {
  onLogin: (method: LoginMethod, credentials: Record<string, string>) => Promise<void>;
  identifiedAccount: DemoUser;
}

export function PasswordLogin({ onLogin, identifiedAccount }: Props) {
  const { baseUrl } = useAuth();
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!password) {
      setPasswordError('请输入密码');
      return;
    }
    if (password.length < 6) {
      setPasswordError('密码长度不能少于 6 位');
      return;
    }
    setPasswordError('');
    setLoading(true);
    await onLogin('password', { username: identifiedAccount.username, password });
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label pb-1" htmlFor="login-password">
          <span className="label-text font-medium">密码</span>
        </label>
        <input
          id="login-password"
          type="password"
          className={`input input-bordered w-full ${passwordError ? 'input-error' : ''}`}
          value={password}
          onInput={(e) => {
            setPassword(e.currentTarget.value);
            setPasswordError('');
          }}
          placeholder="请输入密码"
          autoComplete="current-password"
        />
        {passwordError && <span className="label-text-alt text-error">{passwordError}</span>}
      </div>
      {identifiedAccount.level !== 'local' && (
        <div className="text-right">
          <a href={baseUrl + 'account/recovery'} className="text-xs text-primary hover:underline">
            忘记密码？
          </a>
        </div>
      )}
      <button type="submit" className="btn btn-primary w-full" disabled={loading}>
        {loading ? <span className="loading loading-spinner loading-xs"></span> : '登录'}
      </button>
    </form>
  );
}
