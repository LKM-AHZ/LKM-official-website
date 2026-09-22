/**
 * Astro preview server 辅助：确保产物就绪后启动 preview（或复用已运行的实例）。
 * server 模式下页面 HTML 为运行时渲染，无法对 dist 静态文件做 HTML 检查，
 * 因此 SEO / 链接检查脚本通过本 helper 走 HTTP。
 *
 * 使用随机空闲端口避免连续调用（脚本串行/CI 并行）时的端口冲突，
 * 并在结束时向 preview 子进程发信号清理。
 */
import { spawn } from "node:child_process";
import net from "node:net";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const READY_TIMEOUT_MS = 60_000;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/** 获取一个空闲的本地端口（避免与残留服务冲突）。 */
function getFreePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.listen(0, "127.0.0.1", () => {
      const { port } = srv.address();
      srv.close(() => resolve(port));
    });
    srv.on("error", reject);
  });
}

async function isReady(url) {
  try {
    // 必须带超时：TCP 已建立但对端不响应时，无超时的 fetch 会悬挂，
    // 让 60s 的就绪等待实际无限延长
    const res = await fetch(url, { signal: AbortSignal.timeout(5_000) });
    // 这里刻意保留 <500 的宽松判定：站点可能配置了 base 子路径（PUBLIC_BASE_PATH），
    // 此时根路径 / 返回 404，若收紧到 2xx/3xx 会把正常服务判成「未就绪」
    return res.status < 500;
  } catch {
    return false;
  }
}

function killTree(child) {
  // child 是 detached:false 启动的、与父进程同属一个进程组，
  // 因此 process.kill(-pid) 只会拿到 ESRCH（被静默吞掉），
  // 若恰好存在同号的无关进程组反而会误杀，故只终止 child 本身。
  try {
    child.kill("SIGTERM");
  } catch {
    // 进程可能已退出
  }
  child.stdout?.destroy();
  child.stderr?.destroy();
}

/**
 * 在 preview 服务存活期间执行 callback。
 * @param {(base: string) => Promise<void>} callback
 * @param {number} [preferredPort] 指定端口；该端口上若已有可响应的服务则直接复用，
 *   否则在此端口上启动新实例（不传则随机取一个空闲端口）
 */
export async function withPreview(callback, preferredPort) {
  const port = preferredPort ?? (await getFreePort());
  const base = `http://127.0.0.1:${port}`;

  // 已有实例在跑则直接复用
  if (await isReady(base)) {
    return callback(base);
  }

  // 直接用 node 运行 node adapter 的 standalone 产物 dist/server/entry.mjs。
  // 原因：`astro preview` 的 wrapper 子进程在部分 Windows 环境下
  // 不稳定（"Preview server process exited before becoming ready"），
  // 而 standalone entry 是同构的生产启动方式（`output: server` + node
  // standalone），本机实测正常服务 200。与 CI/生产更一致。
  //
  // 不用 spawn pnpm：Windows 上 pnpm 是 .cmd shim、spawn 需 shell:true，
  // 而 shell+detached 的进程组/信号行为在 win32 dev 下不稳。直接
  // spawn node + entry.mjs 全程无 shell，Linux/Windows 行为一致。
  const entry = resolve(
    dirname(fileURLToPath(import.meta.url)),
    "..",
    "..",
    "dist",
    "server",
    "entry.mjs",
  );
  const child = spawn(process.execPath, [entry], {
    // stdout 必须丢弃：旧实现 pipe 但无人读取，standalone 服务日志一旦写满
    // 管道缓冲区（~64KiB）子进程就会卡在写 stdout 上，表现为「服务起不来」
    stdio: ["ignore", "ignore", "pipe"],
    detached: false,
    env: { ...process.env, PORT: String(port), HOST: "127.0.0.1" },
  });

  const deadline = Date.now() + READY_TIMEOUT_MS;
  let ready = false;
  let stderrBuf = "";
  let spawnError = null;
  child.stderr?.on("data", (d) => {
    stderrBuf += String(d);
    if (stderrBuf.length > 4000) stderrBuf = stderrBuf.slice(-4000);
  });
  // spawn 失败（entry 不存在/EACCES）时 child.pid 为 undefined 且 exitCode 永远是 null，
  // 不监听 error 就会白等满 60s 并报出误导性的「未就绪」。
  child.on("error", (err) => {
    spawnError = err;
  });

  while (Date.now() < deadline) {
    if (spawnError || child.exitCode !== null) break;
    if (await isReady(base)) {
      ready = true;
      break;
    }
    await sleep(500);
  }

  if (!ready) {
    killTree(child);
    if (spawnError) {
      throw new Error(`Astro preview 启动失败: ${spawnError.message}`);
    }
    throw new Error(
      `Astro preview 未就绪（端口 ${port}）: ${stderrBuf.trim().split("\n").pop()}`,
    );
  }

  try {
    return await callback(base);
  } finally {
    killTree(child);
  }
}
