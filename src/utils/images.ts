import { getImage } from 'astro:assets';
import type { ImageMetadata } from 'astro';
import type { MetaDataOpenGraph } from '~/types';

// 本地图片的延迟加载 glob。glob 只执行一次并缓存。
let _localImages: Record<string, () => Promise<unknown>> | undefined;

const loadLocalImages = () => {
  if (_localImages) return _localImages;
  try {
    _localImages = import.meta.glob(
      '~/assets/images/**/*.{jpeg,jpg,png,tiff,webp,gif,svg,JPEG,JPG,PNG,TIFF,WEBP,GIF,SVG}'
    );
  } catch {
    _localImages = {};
  }
  return _localImages;
};

/**
 * 将图片引用解析为 ImageMetadata（本地）或字符串 URL（远程/public）。
 * 接受的输入：
 *   - `null` / `undefined`         → 原样返回
 *   - `ImageMetadata`              → 原样返回（已导入）
 *   - `"http(s)://…"` 或 `"/path"` → 原样返回（外部或 public/）
 *   - `"~/assets/images/…"`        → 通过 glob 解析为 ImageMetadata
 */
export const findImage = async (
  imagePath?: string | ImageMetadata | null
): Promise<string | ImageMetadata | undefined | null> => {
  if (typeof imagePath !== 'string') return imagePath;
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) return imagePath;
  if (imagePath.startsWith('/')) return `${import.meta.env.BASE_URL}${imagePath.replace(/^\//, '')}`;
  if (!imagePath.startsWith('~/assets/images')) return imagePath;

  const images = loadLocalImages();
  const key = imagePath.replace('~/', '/src/');
  const loader = images[key];

  if (typeof loader !== 'function') return null;
  return ((await loader()) as { default: ImageMetadata }).default;
};

const OG_WIDTH = 1200;
const OG_HEIGHT = 626;

/**
 * 将 OpenGraph 图片转换为绝对、优化后的 URL。
 * 由 Metadata.astro 使用，用于生成社交分享卡片就绪的 URL。
 */
export const adaptOpenGraphImages = async (
  openGraph: MetaDataOpenGraph = {},
  astroSite: URL | undefined = new URL('')
): Promise<MetaDataOpenGraph> => {
  if (!openGraph?.images?.length) return openGraph;

  const adaptedImages = await Promise.all(
    openGraph.images.map(async (image) => {
      if (!image?.url) return { url: '' };

      const resolved = await findImage(image.url);
      if (!resolved) return { url: '' };

      // 通过 Astro 的图片服务（默认 Sharp）生成优化后的 JPG。
      const optimized = await getImage({
        src: resolved,
        width: OG_WIDTH,
        height: OG_HEIGHT,
        format: 'jpg',
      });

      return {
        url: String(new URL(optimized.src, astroSite)),
        width: Number(optimized.attributes.width) || OG_WIDTH,
        height: Number(optimized.attributes.height) || OG_HEIGHT,
      };
    })
  );

  return { ...openGraph, images: adaptedImages };
};
