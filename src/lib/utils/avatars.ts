/**
 * 成员头像 URL 构建。
 *
 * 头像图片存于后端 storage 后端，经 `/api/v1/avatars/{name}.webp` 代理端点提供
 * （读 MinIO/S3/Local，公开 + immutable 长缓存）。前端不再打包任何头像图，
 * 这里只负责把后端的 `avatarKey`（如 `七月花.jpg`）映射成 API 相对 URL。
 *
 * avatarKey 使用原始扩展名（.jpg/.jpeg/.png），后端已统一转为 .webp，
 * 映射规则与旧 getAvatar 一致。
 */
export function avatarUrl(avatarKey?: string): string | undefined {
  if (!avatarKey) return undefined;
  // 后缀剥离要覆盖后端可能给回的各种图片扩展名，否则 xxx.webp 会变成 xxx.webp.webp（404）
  const base = avatarKey.replace(/\.(jpe?g|png|webp|gif|bmp|avif)$/i, "");
  return `/api/v1/avatars/${encodeURIComponent(base)}.webp`;
}
