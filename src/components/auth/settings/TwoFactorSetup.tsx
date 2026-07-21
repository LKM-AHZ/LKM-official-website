import { useState } from 'react';
import type { DemoUser } from '~/types/auth';

interface Props {
  user: DemoUser;
  onUpdate: (user: DemoUser) => void;
}

const DUMMY_RECOVERY_CODES = ['AAAA-BBBB-CCCC', 'DDDD-EEEE-FFFF', 'GGGG-HHHH-IIII', 'JJJJ-KKKK-LLLL'];

export function TwoFactorSetup({ user, onUpdate }: Props) {
  const [show, setShow] = useState(false);
  const [step, setStep] = useState<'scan' | 'codes'>('scan');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [savedCodes, setSavedCodes] = useState(false);

  function handleEnable() {
    setShow(true);
    setStep('scan');
    setCode('');
    setError('');
  }

  function handleVerify() {
    if (code !== '000000' && code !== '123456') {
      setError('验证码错误（模拟码：000000）');
      return;
    }
    setError('');
    setStep('codes');
  }

  function handleConfirm() {
    if (!savedCodes) return;
    onUpdate({ ...user, has2FA: true });
    setShow(false);
  }

  function handleDisable() {
    const updated = { ...user, has2FA: false };
    if (user.level === 'admin') {
      updated.level = 'normal';
      alert('关闭 2FA 后，管理员账户已自动降级为普通账户');
    }
    onUpdate(updated);
  }

  if (user.level === 'local') {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">双因素认证</h3>
        <div className="alert alert-info text-sm">本地账户不支持 2FA，请先绑定邮箱或手机号升级为普通账户</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">双因素认证 (2FA)</h3>
      <div className="flex items-center justify-between p-3 bg-base-200 rounded-lg">
        <div>
          <span className="font-medium">TOTP 动态验证码</span>
          <span className={`badge badge-xs ml-2 ${user.has2FA ? 'badge-success' : 'badge-ghost'}`}>
            {user.has2FA ? '已开启' : '未开启'}
          </span>
        </div>
        {user.has2FA ? (
          <button type="button" className="btn btn-ghost btn-xs text-error" onClick={handleDisable}>
            {user.level === 'admin' ? '关闭（将降级）' : '关闭'}
          </button>
        ) : (
          <button type="button" className="btn btn-ghost btn-xs" onClick={handleEnable}>
            开启
          </button>
        )}
      </div>

      {show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShow(false)}>
          <div
            className="bg-base-100 rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            {step === 'scan' ? (
              <div className="space-y-4">
                <h4 className="font-semibold">设置 TOTP 双因素认证</h4>
                <div className="bg-base-200 rounded-xl p-6 mx-auto w-40 h-40 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-4xl mb-2">📱</div>
                    <p className="text-xs text-neutral">模拟二维码</p>
                  </div>
                </div>
                <div>
                  <label className="label pb-1">
                    <span className="label-text">输入验证码确认</span>
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
                  验证
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <h4 className="font-semibold">备用恢复码</h4>
                <p className="text-sm text-neutral">请安全保存以下恢复码（模拟）</p>
                <div className="bg-base-200 rounded-xl p-3 font-mono text-xs space-y-1">
                  {DUMMY_RECOVERY_CODES.map((c) => (
                    <div className="select-all" key={c}>
                      {c}
                    </div>
                  ))}
                </div>
                <label className="label cursor-pointer justify-start gap-2">
                  <input
                    type="checkbox"
                    className="checkbox checkbox-sm"
                    checked={savedCodes}
                    onChange={(e) => setSavedCodes(e.currentTarget.checked)}
                  />
                  <span className="label-text text-sm">我已安全保存备用恢复码</span>
                </label>
                <button
                  type="button"
                  className="btn btn-primary btn-sm w-full"
                  disabled={!savedCodes}
                  onClick={handleConfirm}
                >
                  完成设置
                </button>
              </div>
            )}
            <button type="button" className="btn btn-ghost btn-xs w-full mt-2" onClick={() => setShow(false)}>
              取消
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
