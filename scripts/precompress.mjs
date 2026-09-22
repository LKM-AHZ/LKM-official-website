// Post-build: pre-compress text-based static assets with gzip & brotli.
// The Node standalone server will serve .gz/.br files with proper Content-Encoding.
import { readFile, writeFile } from "node:fs/promises";
import { promisify } from "node:util";
import { glob } from "tinyglobby";
import { gzip, brotliCompress, constants } from "node:zlib";

const gzipAsync = promisify(gzip);
const brotliAsync = promisify(brotliCompress);

const DIST = "dist";

const compressible = /\.(html|css|js|xml|txt|json|svg|ico)$/i;
const MIN_SIZE_BYTES = 2_000; // 小于此大小的文件不压缩（省下的传输量不抵产物体积）
// zlib 的异步 API 在线程池里执行，限流并发才能在真正并行的同时
// 不把整棵 dist 的原始内容一次性读进内存（gzip level 9 / brotli q11 很吃 CPU）
const CONCURRENCY = 4;

const files = await glob(`${DIST}/**/*`, { absolute: false, onlyFiles: true });

async function runWithConcurrency(items, limit, worker) {
  let next = 0;
  const runners = Array.from(
    { length: Math.min(limit, items.length) },
    async () => {
      while (next < items.length) {
        const item = items[next++];
        await worker(item);
      }
    },
  );
  await Promise.all(runners);
}

let count = 0;
let totalSourceBytes = 0;

await runWithConcurrency(
  files.filter((f) => compressible.test(f)),
  CONCURRENCY,
  async (file) => {
    const original = await readFile(file);
    if (original.length < MIN_SIZE_BYTES) return;

    await Promise.all([
      gzipAsync(original, { level: 9 }).then((buf) =>
        writeFile(file + ".gz", buf),
      ),
      brotliAsync(original, {
        params: { [constants.BROTLI_PARAM_QUALITY]: 11 },
      }).then((buf) => writeFile(file + ".br", buf)),
    ]);

    totalSourceBytes += original.length;
    count += 2;
  },
);

console.log(
  `Pre-compressed: ${count} files generated (${(totalSourceBytes / 1024).toFixed(0)} KB total sources)`,
);
