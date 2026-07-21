import { useState } from 'react';
import type { LoginMethod } from '~/types/auth';

interface Props {
  onLogin: (method: LoginMethod, credentials: Record<string, string>) => Promise<void>;
}

export function PasskeyLogin({ onLogin }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleClick() {
    setLoading(true);
    setError('');
    await new Promise((r) => setTimeout(r, 1000));
    await onLogin('passkey', {});
    setLoading(false);
  }

  return (
    <div className="space-y-4 text-center">
      <p className="text-sm text-neutral">通行密钥登录（当前为模拟模式）</p>
      <div className="rounded-xl border border-base-300 bg-base-200 p-6 space-y-4">
        <div className="text-5xl">🔑</div>
        <p className="font-semibold text-base-content">使用通行密钥登录</p>
        <p className="text-xs text-neutral">通过设备的指纹、面容或 PIN 码进行认证</p>
        {error && <div className="alert alert-error text-sm">{error}</div>}
        <button type="button" className="btn btn-primary" onClick={handleClick} disabled={loading}>
          {loading ? (
            <>
              <span className="loading loading-spinner loading-xs"></span> 正在验证...
            </>
          ) : (
            '使用通行密钥'
          )}
        </button>
      </div>
    </div>
  );
}
