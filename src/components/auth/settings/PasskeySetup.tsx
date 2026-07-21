import { useState } from 'react';
import type { DemoUser } from '~/types/auth';

interface Props {
  user: DemoUser;
  onUpdate: (user: DemoUser) => void;
}

export function PasskeySetup({ user, onUpdate }: Props) {
  const [showCreate, setShowCreate] = useState(false);

  function handleCreate() {
    onUpdate({ ...user, hasPasskey: true, bindings: [...new Set([...user.bindings, 'passkey'])] });
    setShowCreate(false);
  }

  function handleDelete() {
    onUpdate({ ...user, hasPasskey: false, bindings: user.bindings.filter((b) => b !== 'passkey') });
  }

  if (user.level === 'local') {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">通行密钥 (Passkey)</h3>
        <div className="alert alert-info text-sm">本地账户不支持 Passkey，请先升级为普通账户</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">通行密钥 (Passkey)</h3>
      <div className="flex items-center justify-between p-3 bg-base-200 rounded-lg">
        <div>
          <span className="font-medium">生物识别 / PIN 码</span>
          <span className={`badge badge-xs ml-2 ${user.hasPasskey ? 'badge-success' : 'badge-ghost'}`}>
            {user.hasPasskey ? '已创建' : '未创建'}
          </span>
        </div>
        {user.hasPasskey ? (
          <button type="button" className="btn btn-ghost btn-xs text-error" onClick={handleDelete}>
            删除
          </button>
        ) : (
          <button type="button" className="btn btn-ghost btn-xs" onClick={() => setShowCreate(true)}>
            创建
          </button>
        )}
      </div>

      {showCreate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setShowCreate(false)}
        >
          <div
            className="bg-base-100 rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4 text-center space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-5xl">🔑</div>
            <h4 className="font-semibold">创建通行密钥</h4>
            <p className="text-sm text-neutral">系统将调用你设备的指纹、面容或 PIN 码进行验证（模拟）</p>
            <button type="button" className="btn btn-primary btn-sm" onClick={handleCreate}>
              模拟创建
            </button>
            <button type="button" className="btn btn-ghost btn-xs w-full" onClick={() => setShowCreate(false)}>
              取消
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
