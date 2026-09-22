import { reactive, getCurrentScope, onScopeDispose } from "vue";

interface VerificationCountdownState {
  countdown: number;
  running: boolean;
  start: () => void;
  stop: () => void;
}

/**
 * 验证码发送倒计时（reactive 状态，模板/测试直接取值即响应式）。
 * start() 重置为初始 seconds 并每秒递减；归零后 running=false。
 * onBeforeUnmount 自动清 interval，避免组件卸载后泄漏。
 */
export function useVerificationCountdown(
  seconds = 60,
): VerificationCountdownState {
  const state = reactive<VerificationCountdownState>({
    countdown: seconds,
    running: false,
    start,
    stop,
  });

  let timer: ReturnType<typeof setInterval> | null = null;

  function stop(): void {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
    state.running = false;
  }

  function start(): void {
    stop();
    state.countdown = Math.max(0, seconds);
    // 倒计时为 0/负数时不进入 running：否则按钮会先被禁用整整一秒，直到首个 tick 才复位
    state.running = state.countdown > 0;
    if (!state.running) return;
    // 用绝对截止时间推算剩余秒数：按 tick 次数递减的话，后台标签页被节流或事件循环被阻塞时
    // tick 会被延迟/丢弃，用户实际等待会明显长于 seconds
    const endAt = Date.now() + state.countdown * 1000;
    timer = setInterval(() => {
      state.countdown = Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
      if (state.countdown === 0) stop();
    }, 1000);
  }

  // 组件外用（单测 / 纯模块 / effectScope）时没有活动实例，onBeforeUnmount 会打警告且清理不生效；
  // onScopeDispose 在组件和 effectScope 下都能挂上
  if (getCurrentScope()) onScopeDispose(stop);

  return state;
}
