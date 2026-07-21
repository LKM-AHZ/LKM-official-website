/**
 * 成员头像批量优化脚本
 * 将 src/assets/images/member/ 下所有 jpg/jpeg/png 缩放到 192px（2x DPR），
 * 转换为 WebP 格式，输出到 src/assets/images/member-optimized/ 目录。
 *
 * 用法: node scripts/optimize-avatars.mjs
 */

import { readdir, mkdir } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const INPUT_DIR = join(__dirname, '..', 'src', 'assets', 'images', 'member');
const OUTPUT_DIR = join(__dirname, '..', 'src', 'assets', 'images', 'member-optimized');

const MAX_SIZE = 192; // 2x DPR for 96px max display
const QUALITY = 80;

async function main() {
  const files = (await readdir(INPUT_DIR)).filter((f) => {
    const ext = extname(f).toLowerCase();
    return ext === '.jpg' || ext === '.jpeg' || ext === '.png';
  });

  console.log(`Found ${files.length} images to optimize\n`);

  await mkdir(OUTPUT_DIR, { recursive: true });

  let totalInput = 0;
  let totalOutput = 0;

  for (const file of files) {
    const inputPath = join(INPUT_DIR, file);
    const outputFile = file.replace(/\.(jpe?g|png)$/i, '.webp');
    const outputPath = join(OUTPUT_DIR, outputFile);

    try {
      await sharp(inputPath)
        .resize(MAX_SIZE, MAX_SIZE, { fit: 'cover', position: 'center' })
        .webp({ quality: QUALITY })
        .toFile(outputPath);

      const { size: inSize } = await sharp(inputPath).metadata().then((m) => ({ size: m.size ?? 0 }));
      const { size: outSize } = await sharp(outputPath).metadata().then((m) => ({ size: m.size ?? 0 }));

      totalInput += inSize;
      totalOutput += outSize;

      const reduction = inSize > 0 ? ((1 - outSize / inSize) * 100).toFixed(1) : '0';
      console.log(`  ${file}  →  ${outputFile}  (${(outSize / 1024).toFixed(1)}KB, -${reduction}%)`);
    } catch (err) {
      console.error(`  FAILED: ${file} — ${err.message}`);
    }
  }

  console.log(`\nTotal: ${(totalInput / 1024 / 1024).toFixed(1)}MB → ${(totalOutput / 1024 / 1024).toFixed(1)}MB (${((1 - totalOutput / totalInput) * 100).toFixed(1)}% reduction)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
