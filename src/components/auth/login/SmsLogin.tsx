import { useState, useRef } from 'react';
import type { LoginMethod, DemoUser } from '~/types/auth';

interface Props {
  onLogin: (method: LoginMethod, credentials: Record<string, string>) => Promise<void>;
  identifiedAccount: DemoUser;
}

export function SmsLogin({ onLogin, identifiedAccount }: Props) {
  const target = identifiedAccount.phone || identifiedAccount.email || '';
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [codeSent, setCodeSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined);

  function handleSendCode() {
    setCodeSent(true);
    setAttempts(0);
    setCountdown(60);
    timerRef.current = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  }

  async function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!code.trim()) {
      setCodeError('请输入验证码');
      return;
    }
    if (attempts >= 3) {
      setCodeError('验证码错误次数过多，请重新获取');
      setCodeSent(false);
      setCode('');
      setAttempts(0);
      return;
    }
    setLoading(true);
    setCodeError('');
    setAttempts((a) => a + 1);
    // 用实际账号标识作为查找凭据
    await onLogin('sms', { phoneOrEmail: identifiedAccount.username, code });
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center justify-between p-3 bg-base-200 rounded-lg">
        <span className="text-sm text-neutral">发送至：</span>
        <span className="text-sm font-medium">{target}</span>
      </div>
      <button type="button" className="btn btn-outline w-full" onClick={handleSendCode} disabled={countdown > 0}>
        {countdown > 0 ? `${countdown}s 后重新获取` : codeSent ? '重新获取验证码' : '获取验证码'}
      </button>
      {codeSent && <p className="text-xs text-success text-center">验证码已发送（模拟码：000000）</p>}
      <div>
        <label className="label pb-1" htmlFor="sms-code">
          <span className="label-text font-medium">验证码</span>
        </label>
        <input
          id="sms-code"
          type="text"
          className={`input input-bordered w-full ${codeError ? 'input-error' : ''}`}
          value={code}
          onInput={(e) => {
            setCode(e.currentTarget.value);
            setCodeError('');
          }}
          placeholder="请输入 6 位验证码"
          maxLength={6}
        />
        {codeError && <span className="label-text-alt text-error">{codeError}</span>}
      </div>
      <button type="submit" className="btn btn-primary w-full" disabled={loading || !codeSent}>
        {loading ? <span className="loading loading-spinner loading-xs"></span> : '登录'}
      </button>
    </form>
  );
}
