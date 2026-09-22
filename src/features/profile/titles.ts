export interface TitleInfo {
  name: string;
  color: string;
}

/** 称号 key → 展示名（i18n key）+ 颜色（key 与后端 Profile.title 对齐） */
export const TITLE_MAP: Record<string, TitleInfo> = {
  newbie: { name: "profileTitles.newbie", color: "#9ca3af" },
  active: { name: "profileTitles.active", color: "#22c55e" },
  hardcore: { name: "profileTitles.hardcore", color: "#3b82f6" },
  file_master: { name: "profileTitles.fileMaster", color: "#9333ea" },
  project_pioneer: { name: "profileTitles.projectPioneer", color: "#f97316" },
  columnist: { name: "profileTitles.columnist", color: "var(--color-primary)" },
};

export function titleInfoOf(key: string | undefined): TitleInfo {
  const info = TITLE_MAP[key || ""];
  // 后端新增/拼错称号时会静默落到「新人」，线上无从察觉；开发期显式提示一次
  if (!info && key && import.meta.env.DEV) {
    console.warn(`[profile] 未知称号 key=${key}，已回退为 newbie`);
  }
  return info || TITLE_MAP.newbie;
}
