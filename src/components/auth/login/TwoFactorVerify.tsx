import { useState, useCallback } from 'react';
import { DEMO_ACCOUNTS } from '~/data/demo-accounts';
import { useAuth } from '../AuthProvider';

interface Props {
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}

const DUMMY_TOTP_SECRET = 'JBSWY3DPEHPK3PXP';
const DUMMY_RECOVERY_CODES = ['AAAA-BBBB-CCCC', 'DDDD-EEEE-FFFF', 'GGGG-HHHH-IIII', 'JJJJ-KKKK-LLLL'];

export function TwoFactorVerify({ onSuccess, onError: _onError }: Props) {
  const { state, dispatch } = useAuth();
  const user = DEMO_ACCOUNTS.find((u) => u.id === state.tempSession?.userId)!;

  const [totpCode, setTotpCode] = useState('');
  const [totpAttempts, setTotpAttempts] = useState(0);
  const [totpError, setTotpError] = useState('');
  const [trustDevice, setTrustDevice] = useState(false);
  const [showRecovery, setShowRecovery] = useState(false);
  const [recoveryCode, setRecoveryCode] = useState('');
  const [recoveryError, setRecoveryError] = useState('');

  // 2FA 设置阶段
  const [setupStep, setSetupStep] = useState<'scan' | 'recovery'>(
    state.flow === '2fa_setup_required' ? 'scan' : 'recovery'
  );
  const [setupCode, setSetupCode] = useState('');
  const [setupError, setSetupError] = useState('');
  const [savedCodes, setSavedCodes] = useState(false);
  const [showSecret, setShowSecret] = useState(false);

  const isSetupFlow = state.flow === '2fa_setup_required';

  const handleTOTPSubmit = useCallback(
    (e: React.SubmitEvent<HTMLFormElement>) => {
      e.preventDefault();
      setTotpError('');
      if (!/^\d{6}$/.test(totpCode)) {
        setTotpError('请输入 6 位数字验证码');
        return;
      }
      const newAttempts = totpAttempts + 1;
      setTotpAttempts(newAttempts);
      if (totpCode === '000000' || totpCode === '123456') {
        dispatch({ type: 'LOGIN_2FA_PASSED' });
        if (trustDevice && user?.level !== 'admin') {
          dispatch({ type: 'TRUST_DEVICE', until: Date.now() + 30 * 24 * 60 * 60 * 1000 });
        }
        dispatch({ type: 'LOGIN_SUCCESS', user: user! });
        onSuccess('验证通过，登录成功');
      } else if (newAttempts >= 3) {
        setTotpError('验证码错误次数过多，请使用备用恢复码');
      } else {
        setTotpError(`验证码错误，剩余重试 ${3 - newAttempts} 次`);
      }
    },
    [totpCode, totpAttempts, trustDevice, user, dispatch, onSuccess]
  );

  const handleRecoverySubmit = useCallback(
    (e: React.SubmitEvent<HTMLFormElement>) => {
      e.preventDefault();
      setRecoveryError('');
      if (DUMMY_RECOVERY_CODES.some((c) => c === recoveryCode.toUpperCase().trim())) {
        dispatch({ type: 'LOGIN_2FA_PASSED' });
        dispatch({ type: 'LOGIN_SUCCESS', user: user! });
        onSuccess('恢复码验证通过，登录成功。请在设置中重新绑定 2FA。');
      } else {
        setRecoveryError('恢复码无效，请重试');
      }
    },
    [recoveryCode, user, dispatch, onSuccess]
  );

  const handleSetupVerify = useCallback(
    (e: React.SubmitEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!/^\d{6}$/.test(setupCode)) {
        setSetupError('请输入 6 位数字验证码');
        return;
      }
      if (setupCode === '000000' || setupCode === '123456') {
        setSetupStep('recovery');
      } else {
        setSetupError('验证码错误，请重试');
      }
    },
    [setupCode]
  );

  function handleRecoveryConfirm() {
    if (!savedCodes) return;
    const updated = { ...user!, has2FA: true };
    dispatch({ type: 'LOGIN_2FA_PASSED' });
    dispatch({ type: 'LOGIN_SUCCESS', user: updated });
    onSuccess('2FA 绑定完成，登录成功');
  }

  // 渲染 2FA 设置流程
  if (isSetupFlow) {
    return (
      <div className="rounded-2xl bg-base-100 shadow-2xl border border-base-300 p-6 sm:p-8">
        <h2 className="text-2xl font-semibold text-center mb-4">绑定双因素认证</h2>

        {setupStep === 'scan' && (
          <div className="space-y-4">
            <div className="alert alert-info text-sm">管理员账户必须绑定 2FA 才能登录</div>
            <div className="text-center space-y-3">
              <div className="bg-base-200 rounded-xl p-6 mx-auto w-48 h-48 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-4xl mb-2">📱</div>
                  <p className="text-xs text-neutral">模拟二维码</p>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium">手动输入密钥</p>
                <div className="flex items-center justify-center gap-2 mt-1">
                  <code className="bg-base-200 px-3 py-1 rounded text-sm select-all">
                    {showSecret ? DUMMY_TOTP_SECRET : '•••• •••• •••• ••••'}
                  </code>
                  <button type="button" className="btn btn-ghost btn-xs" onClick={() => setShowSecret(!showSecret)}>
                    {showSecret ? '隐藏' : '显示'}
                  </button>
                </div>
              </div>
            </div>
            <form onSubmit={handleSetupVerify} className="space-y-3">
              <div>
                <label className="label pb-1" htmlFor="setup-totp">
                  <span className="label-text font-medium">输入验证码确认</span>
                </label>
                <input
                  id="setup-totp"
                  type="text"
                  className={`input input-bordered w-full ${setupError ? 'input-error' : ''}`}
                  value={setupCode}
                  onInput={(e) => {
                    setSetupCode(e.currentTarget.value);
                    setSetupError('');
                  }}
                  placeholder="输入 6 位验证码（模拟：000000）"
                  maxLength={6}
                />
                {setupError && <span className="label-text-alt text-error">{setupError}</span>}
              </div>
              <button type="submit" className="btn btn-primary w-full">
                验证并继续
              </button>
            </form>
          </div>
        )}

        {setupStep === 'recovery' && (
          <div className="space-y-4">
            <div className="alert alert-warning text-sm">
              请安全保存以下备用恢复码，用于在丢失 2FA 设备时恢复账户访问
            </div>
            <div className="bg-base-200 rounded-xl p-4 space-y-1 font-mono text-sm">
              {DUMMY_RECOVERY_CODES.map((code) => (
                <div className="select-all" key={code}>
                  {code}
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
              <span className="label-text">我已安全保存备用恢复码</span>
            </label>
            <button
              type="button"
              className="btn btn-primary w-full"
              disabled={!savedCodes}
              onClick={handleRecoveryConfirm}
            >
              完成绑定
            </button>
          </div>
        )}
      </div>
    );
  }

  // 渲染 2FA 验证 + 备用恢复码
  if (showRecovery) {
    return (
      <div className="rounded-2xl bg-base-100 shadow-2xl border border-base-300 p-6 sm:p-8">
        <h2 className="text-xl font-semibold text-center mb-4">备用恢复码验证</h2>
        <form onSubmit={handleRecoverySubmit} className="space-y-4">
          <div>
            <label className="label pb-1" htmlFor="recovery-code">
              <span className="label-text font-medium">输入备用恢复码</span>
            </label>
            <input
              id="recovery-code"
              type="text"
              className={`input input-bordered w-full ${recoveryError ? 'input-error' : ''}`}
              value={recoveryCode}
              onInput={(e) => {
                setRecoveryCode(e.currentTarget.value);
                setRecoveryError('');
              }}
              placeholder="格式：AAAA-BBBB-CCCC"
            />
            {recoveryError && <span className="label-text-alt text-error">{recoveryError}</span>}
          </div>
          <button type="submit" className="btn btn-primary w-full">
            验证
          </button>
          <button type="button" className="btn btn-ghost w-full btn-sm" onClick={() => setShowRecovery(false)}>
            返回 TOTP 验证
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-base-100 shadow-2xl border border-base-300 p-6 sm:p-8">
      <h2 className="text-xl font-semibold text-center mb-2">双因素认证</h2>
      <p className="text-sm text-neutral text-center mb-4">请输入 Google Authenticator 中的 6 位验证码</p>
      {totpError && <div className="alert alert-error text-sm mb-4">{totpError}</div>}
      <form onSubmit={handleTOTPSubmit} className="space-y-4">
        <div>
          <input
            id="totp-code"
            type="text"
            className="input input-bordered w-full text-center text-2xl tracking-widest"
            value={totpCode}
            onInput={(e) => {
              setTotpCode(e.currentTarget.value);
              setTotpError('');
            }}
            placeholder="000000"
            maxLength={6}
            autoComplete="one-time-code"
          />
          <p className="text-xs text-neutral text-center mt-1">模拟验证码：000000</p>
        </div>
        {user?.level !== 'admin' && (
          <label className="label cursor-pointer justify-center gap-2">
            <input
              type="checkbox"
              className="checkbox checkbox-sm"
              checked={trustDevice}
              onChange={(e) => setTrustDevice(e.currentTarget.checked)}
            />
            <span className="label-text text-sm">信任此设备 30 天</span>
          </label>
        )}
        {user?.level === 'admin' && (
          <p className="text-xs text-neutral text-center">管理员账户每次登录必须进行 2FA 验证</p>
        )}
        <button type="submit" className="btn btn-primary w-full">
          验证
        </button>
      </form>
      <div className="text-center mt-3">
        <button type="button" className="btn btn-ghost btn-sm text-xs" onClick={() => setShowRecovery(true)}>
          无法验证 / 丢失设备？使用备用恢复码
        </button>
      </div>
    </div>
  );
}
