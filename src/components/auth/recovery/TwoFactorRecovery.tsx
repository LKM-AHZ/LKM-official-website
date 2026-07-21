import { useState } from 'react';

const DUMMY_RECOVERY_CODES = ['AAAA-BBBB-CCCC', 'DDDD-EEEE-FFFF'];

interface Props {
  level: 'normal' | 'admin';
  onSuccess: () => void;
  onBack: () => void;
}

export function TwoFactorRecovery({ level, onSuccess, onBack }: Props) {
  const [step, setStep] = useState<'verify' | 'recovery' | 'done'>('verify');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [recoveryCode, setRecoveryCode] = useState('');
  const [error, setError] = useState('');

  function handleVerify(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email.trim()) {
      setError('请输入邮箱');
      return;
    }
    if (code !== '000000') {
      setError('验证码错误（模拟码：000000）');
      return;
    }
    setError('');
    setStep('recovery');
  }

  function handleRecovery(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    if (DUMMY_RECOVERY_CODES.some((c) => c === recoveryCode.toUpperCase().trim())) {
      setStep('done');
    } else {
      setError('恢复码无效');
    }
  }

  return (
    <div className="rounded-2xl bg-base-100 shadow-2xl border border-base-300 p-6 sm:p-8">
      <h2 className="text-xl font-semibold text-center mb-4">2FA 恢复</h2>

      {step === 'verify' && (
        <form onSubmit={handleVerify} className="space-y-4">
          <p className="text-sm text-neutral text-center">请通过邮箱验证身份</p>
          <div>
            <label className="label pb-1">
              <span className="label-text font-medium">邮箱</span>
            </label>
            <input
              type="email"
              className="input input-bordered w-full"
              value={email}
              onInput={(e) => setEmail(e.currentTarget.value)}
              placeholder="请输入绑定邮箱"
            />
          </div>
          <div>
            <label className="label pb-1">
              <span className="label-text font-medium">验证码</span>
            </label>
            <input
              type="text"
              className="input input-bordered w-full"
              value={code}
              onInput={(e) => setCode(e.currentTarget.value)}
              placeholder="输入验证码（模拟：000000）"
              maxLength={6}
            />
          </div>
          <p className="text-xs text-success text-center">模拟验证码：000000</p>
          {error && <div className="alert alert-error text-sm">{error}</div>}
          <button type="submit" className="btn btn-primary w-full">
            验证
          </button>
          <button type="button" className="btn btn-ghost w-full btn-sm" onClick={onBack}>
            返回
          </button>
        </form>
      )}

      {step === 'recovery' && (
        <form onSubmit={handleRecovery} className="space-y-4">
          <p className="text-sm text-neutral text-center">请输入备用恢复码</p>
          <div>
            <label className="label pb-1">
              <span className="label-text font-medium">恢复码</span>
            </label>
            <input
              type="text"
              className="input input-bordered w-full"
              value={recoveryCode}
              onInput={(e) => setRecoveryCode(e.currentTarget.value)}
              placeholder="格式：AAAA-BBBB-CCCC"
            />
          </div>
          {error && <div className="alert alert-error text-sm">{error}</div>}
          <button type="submit" className="btn btn-primary w-full">
            验证
          </button>
          {level === 'admin' && (
            <button type="button" className="btn btn-ghost w-full btn-sm" onClick={() => onSuccess()}>
              联系其他管理员协助（模拟）
            </button>
          )}
        </form>
      )}

      {step === 'done' && (
        <div className="text-center space-y-4">
          <div className="text-5xl">✅</div>
          <p className="font-semibold">恢复成功</p>
          <p className="text-sm text-neutral">请重新设置 2FA</p>
          <button type="button" className="btn btn-primary btn-sm" onClick={onSuccess}>
            完成
          </button>
        </div>
      )}
    </div>
  );
}
