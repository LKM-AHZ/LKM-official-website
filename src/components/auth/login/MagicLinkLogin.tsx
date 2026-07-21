import { useState } from 'react';
import type { LoginMethod, DemoUser } from '~/types/auth';

interface Props {
  onLogin: (method: LoginMethod, credentials: Record<string, string>) => Promise<void>;
  identifiedAccount: DemoUser;
}

type Stage = 'input' | 'sent' | 'expired' | 'used';

export function MagicLinkLogin({ onLogin, identifiedAccount }: Props) {
  const email = identifiedAccount.email || '';
  const [stage, setStage] = useState<Stage>('input');
  const [loading, setLoading] = useState(false);

  function handleSend(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setStage('sent');
  }

  async function handleSimulateClick() {
    setLoading(true);
    await onLogin('magic-link', { email });
    setLoading(false);
  }

  if (stage === 'sent') {
    return (
      <div className="space-y-4 text-center">
        <div className="rounded-xl border border-base-300 bg-base-200 p-6 space-y-4">
          <div className="text-4xl">📧</div>
          <p className="font-semibold text-base-content">魔法链接已发送</p>
          <p className="text-sm text-neutral">
            模拟已向 <span className="font-semibold">{email}</span> 发送登录链接
          </p>
          <div className="flex flex-col gap-2">
            <button type="button" className="btn btn-primary btn-sm" onClick={handleSimulateClick} disabled={loading}>
              {loading ? <span className="loading loading-spinner loading-xs"></span> : '模拟点击邮件链接'}
            </button>
            <div className="flex gap-2 justify-center">
              <button type="button" className="btn btn-ghost btn-xs" onClick={() => setStage('expired')}>
                模拟链接已过期
              </button>
              <button type="button" className="btn btn-ghost btn-xs" onClick={() => setStage('used')}>
                模拟链接已使用
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (stage === 'expired') {
    return (
      <div className="space-y-4 text-center">
        <div className="alert alert-warning">
          <span>链接已过期，请重新获取</span>
        </div>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setStage('input')}>
          返回重新发送
        </button>
      </div>
    );
  }

  if (stage === 'used') {
    return (
      <div className="space-y-4 text-center">
        <div className="alert alert-warning">
          <span>链接已失效（已使用），请重新获取</span>
        </div>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setStage('input')}>
          返回重新发送
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSend} className="space-y-4">
      <p className="text-sm text-neutral text-center">
        我们将向 <span className="font-semibold">{email}</span> 发送包含登录链接的邮件
      </p>
      <button type="submit" className="btn btn-primary w-full">
        发送魔法链接
      </button>
    </form>
  );
}
