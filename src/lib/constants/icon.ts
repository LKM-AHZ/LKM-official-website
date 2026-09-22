import type { Favicon } from "~/types/config";

/** 两套主题 × 四种尺寸：文件名与 sizes 由同一组基准推导，新增尺寸不会漏改某一条 */
const FAVICON_THEMES = ["light", "dark"] as const;
const FAVICON_SIZES = [32, 128, 180, 192] as const;

export const defaultFavicons: Favicon[] = FAVICON_THEMES.flatMap((theme) =>
  FAVICON_SIZES.map((size) => ({
    src: `/favicon/favicon-${theme}-${size}.png`,
    theme,
    sizes: `${size}x${size}`,
  })),
);
