import { useState, useCallback } from 'react';
import { useAuth } from '../AuthProvider';
import { getAuthPath } from '../auth-paths';
import { LocalRegister } from './LocalRegister';
import { NormalRegister } from './NormalRegister';
import { RegisterGuide } from './RegisterGuide';
import type { RegisterData, LoginResult } from '~/types/auth';

type RegType = 'local' | 'normal' | 'github';

export function RegisterPage() {
  const { state, register } = useAuth();
  const [regType, setRegType] = useState<RegType>('normal');
  const [showGuide, setShowGuide] = useState(false);

  const handleRegister = useCallback(
    (type: 'local' | 'normal', data: RegisterData): LoginResult => register(type, data),
    [register]
  );

  if (state.flow === 'logged_in') {
    return (
      <div className="relative min-h-[calc(100vh-12rem)] flex items-center justify-center px-4">
        <div className="absolute inset-0 bg-base-100/70 backdrop-blur-sm"></div>
        <div className="relative w-full max-w-md text-center">
          <div className="rounded-2xl bg-base-100 shadow-2xl border border-base-300 p-6 sm:p-8">
            <div className="text-5xl mb-4">🎉</div>
            <h2 className="text-2xl font-semibold">注册成功，已自动登录</h2>
            <p className="text-neutral text-sm">
              欢迎加入理科迷，<span className="font-semibold">{state.user?.username}</span>
            </p>
            <div className="flex gap-3 justify-center mt-6">
              <a href={getAuthPath('account')} className="btn btn-ghost btn-sm">
                账户设置
              </a>
              <a href={getAuthPath('')} className="btn btn-primary btn-sm">
                返回首页
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (showGuide) {
    return (
      <div className="relative min-h-[calc(100vh-12rem)] flex items-center justify-center px-4">
        <div className="absolute inset-0 bg-base-100/70 backdrop-blur-sm"></div>
        <div className="relative w-full max-w-md">
          <div className="rounded-2xl bg-base-100 shadow-2xl border border-base-300 p-6 sm:p-8">
            <RegisterGuide onComplete={() => setShowGuide(false)} onSkip={() => setShowGuide(false)} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-[calc(100vh-12rem)] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-base-100/70 backdrop-blur-sm"></div>
      <div className="relative w-full max-w-md">
        <div className="rounded-2xl bg-base-100 shadow-2xl border border-base-300 p-6 sm:p-8">
          <div className="text-center mb-6">
            <h1 className="text-3xl md:text-4xl font-semibold leading-tight mb-2 text-base-content">注册</h1>
            <p className="text-sm text-neutral">创建理科迷账号</p>
          </div>

          <div className="tabs tabs-bordered mb-6">
            {[
              { key: 'normal' as RegType, label: '普通账户' },
              { key: 'local' as RegType, label: '本地账户' },
              { key: 'github' as RegType, label: 'GitHub' },
            ].map((tab) => (
              <a
                key={tab.key}
                className={`tab tab-bordered${regType === tab.key ? ' tab-active' : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  setRegType(tab.key);
                }}
              >
                {tab.label}
              </a>
            ))}
          </div>

          {regType === 'local' && <LocalRegister onRegister={handleRegister} />}
          {regType === 'normal' && (
            <NormalRegister onRegister={handleRegister} onComplete={(withGuide) => setShowGuide(withGuide)} />
          )}
          {regType === 'github' && (
            <div className="space-y-4 text-center">
              <p className="text-sm text-neutral">GitHub OAuth 注册（模拟）</p>
              <button
                type="button"
                className="btn btn-outline w-full gap-2"
                onClick={() => {
                  register('normal', {
                    username: 'github_user_' + Date.now().toString(36),
                    password: '123456',
                    email: 'github@likemi.com',
                  });
                }}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
                使用 GitHub 注册
              </button>
            </div>
          )}

          <p className="text-center text-[13px] text-neutral mt-5">
            已有账号？
            <a href={getAuthPath('login')} className="text-primary font-semibold hover:underline">
              立即登录
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
