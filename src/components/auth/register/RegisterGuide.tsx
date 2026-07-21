import { useState } from 'react';

interface Props {
  onComplete: () => void;
  onSkip: () => void;
}

export function RegisterGuide({ onComplete, onSkip }: Props) {
  const [step, setStep] = useState<'2fa' | 'passkey'>('2fa');

  if (step === '2fa') {
    return (
      <div className="space-y-4 text-center">
        <h3 className="text-xl font-semibold">设置双因素认证（可选）</h3>
        <div className="bg-base-200 rounded-xl p-6 mx-auto w-40 h-40 flex items-center justify-center">
          <div className="text-4xl">📱</div>
        </div>
        <p className="text-sm text-neutral">使用 Google Authenticator 扫码绑定 2FA</p>
        <div className="flex gap-3 justify-center">
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setStep('passkey')}>
            跳过
          </button>
          <button type="button" className="btn btn-primary btn-sm" onClick={() => setStep('passkey')}>
            设置 2FA（模拟）
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 text-center">
      <h3 className="text-xl font-semibold">创建通行密钥（可选）</h3>
      <div className="bg-base-200 rounded-xl p-6 mx-auto w-40 h-40 flex items-center justify-center">
        <div className="text-4xl">🔑</div>
      </div>
      <p className="text-sm text-neutral">通过指纹/面容/设备 PIN 实现免密登录</p>
      <div className="flex gap-3 justify-center">
        <button type="button" className="btn btn-ghost btn-sm" onClick={onSkip}>
          跳过
        </button>
        <button type="button" className="btn btn-primary btn-sm" onClick={onComplete}>
          创建（模拟）
        </button>
      </div>
    </div>
  );
}
