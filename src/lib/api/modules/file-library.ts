// 文件库 API 客户端 — 对接后端 /api/v1/files/*
//
// 后端 FileInfo 为 snake_case 字段，这里在客户端层映射为前端 UI 使用的 camelCase 形状。

import { get, getHttpAccessToken } from "../../http/client";
import { apiFetch } from "../fetch";
import type { PaginatedResponse } from "../types";

export type { PaginatedResponse } from "../types";

/** 文件展示形状（camelCase，由后端 FileInfo 映射而来）。 */
export interface FileEntry {
  id: string;
  originalName: string;
  uploaderName: string;
  mimeType: string;
  size: number;
  categoryId: string;
  categoryName: string;
  description: string;
  tags: string[];
  status: string;
  reviewComment: string | null;
  downloadCount: number;
  viewCount: number;
  createdAt: string;
}

interface BackendFile {
  id: string;
  original_name: string;
  uploader_id: string;
  uploader_name: string;
  mime_type: string;
  size: number;
  category_id: string;
  category_name: string;
  description: string;
  tags: string[];
  status: string;
  review_comment: string | null;
  download_count: number;
  view_count: number;
  created_at: string;
}

/** 上传初始化响应（camelCase，由后端 UploadInitResp 映射而来）。 */
export interface UploadInitResp {
  mode: "direct" | "sync";
  uploadId?: string | null;
  presignedUrl?: string | null;
  file?: FileEntry | null;
}

/** 后端 upload-init 响应的 snake_case 形状。 */
interface BackendUploadInitResp {
  mode: "direct" | "sync";
  upload_id?: string | null;
  presigned_url?: string | null;
  file?: BackendFile | null;
}

/** 下载地址信息（camelCase，由后端 BackendDownloadUrl 映射而来）。 */
export interface DownloadUrlInfo {
  kind: "backend" | "presigned";
  url: string;
  expiresIn?: number | null;
}

/** 后端下载地址响应的 snake_case 形状。 */
interface BackendDownloadUrl {
  kind: "backend" | "presigned";
  url: string;
  expires_in?: number | null;
}

function mapFile(f: BackendFile): FileEntry {
  return {
    id: f.id,
    originalName: f.original_name,
    uploaderName: f.uploader_name,
    mimeType: f.mime_type,
    size: f.size,
    categoryId: f.category_id,
    categoryName: f.category_name,
    description: f.description,
    tags: f.tags ?? [],
    status: f.status,
    reviewComment: f.review_comment,
    downloadCount: f.download_count,
    viewCount: f.view_count,
    createdAt: f.created_at,
  };
}

export const fileLibraryApi = {
  getFiles: async (page = 1, limit = 20): Promise<FileEntry[]> => {
    const res = await get<PaginatedResponse<BackendFile>>("/api/v1/files", {
      page,
      limit,
    });
    if (res.isErr()) return [];
    return (res.value.items ?? []).map(mapFile);
  },

  getFile: async (id: string): Promise<FileEntry | null> => {
    const res = await get<BackendFile>(`/api/v1/files/${id}`);
    if (res.isErr()) return null;
    return mapFile(res.value);
  },

  getDownloadUrl: async (id: string): Promise<DownloadUrlInfo> => {
    // 后端该端点由 get_current_user 保护，只认 Bearer 头；generic get() 的
    // needsAuth 白名单未含 /api/v1/files/，这里手动附加 token 经 apiFetch 发起，
    // 与 getContentBlob 保持一致，避免依赖会随白名单变化而失效。
    const token = getHttpAccessToken();
    const result = await apiFetch(`/api/v1/files/${id}/download/url`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (result.isErr()) {
      throw new Error(`获取下载地址失败 ${result.error.message}`);
    }
    const res = result.value;
    if (!res.ok) {
      throw new Error(`获取下载地址失败 ${res.status}`);
    }
    // 后端该端点走 ApiResp 包络（response_model=ApiResp[DownloadUrlInfo]），
    // 必须取 data，否则 kind/url 恒为 undefined（下载地址失效）
    const data = (await res.json())["data"] as BackendDownloadUrl | undefined;
    if (!data?.url) throw new Error("获取下载地址失败：响应格式异常");
    return {
      kind: data.kind,
      url: data.url,
      expiresIn: data.expires_in,
    };
  },

  getContentBlob: async (id: string): Promise<Blob> => {
    const token = getHttpAccessToken();
    const result = await apiFetch(`/api/v1/files/${id}/content`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (result.isErr()) throw new Error(`下载失败 ${result.error.message}`);
    const res = result.value;
    if (!res.ok) throw new Error(`下载失败 ${res.status}`);
    return res.blob();
  },

  // 原 getPreviewUrl 返回裸 URL 供 <img src> 直接用，但 /api/v1/files/* 只认 Bearer 头
  //（needsAuth 白名单不含该前缀），以 img/iframe 加载必然 401；且全仓库无人调用。
  // 预览场景请走 getContentBlob + URL.createObjectURL（已鉴权），故删除这个误导性入口。

  // ── 上传（Phase 2-B）──
  // 该链路由 /files 相关端点保护，只认 Bearer 头；generic get() 的
  // needsAuth 白名单未含 /api/v1/files/，故此处全部手动带 token 发起请求。
  // upload-init 只回元数据，不发文件字节：

  /** 初始化上传：后端判定 S3→direct（返 presigned_url, 需后续 confirm）或 Local→sync（无 presign, 走 multipart 回退）。 */
  uploadInit: async (info: {
    originalName: string;
    mimeType: string;
    categoryId: string;
    description: string;
    tags: string[];
  }): Promise<UploadInitResp> => {
    const token = getHttpAccessToken();
    const result = await apiFetch("/api/v1/files/upload-init", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        original_name: info.originalName,
        mime_type: info.mimeType,
        category_id: info.categoryId,
        description: info.description,
        tags: info.tags,
      }),
    });
    if (result.isErr()) {
      throw new Error(`初始化上传失败 ${result.error.message}`);
    }
    const res = result.value;
    if (!res.ok) throw new Error(`初始化上传失败 ${res.status}`);
    const b = (await res.json())["data"] as BackendUploadInitResp;
    return {
      mode: b.mode,
      uploadId: b.upload_id ?? null,
      presignedUrl: b.presigned_url ?? null,
      file: b.file ? mapFile(b.file) : null,
    };
  },

  /** 直传后确认：S3 direct 上传的 upload_id 确认落库，返回 PENDING 的 FileEntry。 */
  confirmUpload: async (uploadId: string): Promise<FileEntry> => {
    const token = getHttpAccessToken();
    const result = await apiFetch(`/api/v1/files/${uploadId}/confirm`, {
      method: "POST",
      ...(token ? { headers: { Authorization: `Bearer ${token}` } } : {}),
    });
    if (result.isErr()) {
      throw new Error(`确认上传失败 ${result.error.message}`);
    }
    const res = result.value;
    if (!res.ok) throw new Error(`确认上传失败 ${res.status}`);
    const b = (await res.json())["data"] as BackendFile;
    return mapFile(b);
  },

  /** L-b：Local（无 presign）回退同步 multipart POST /files（既有后端端点）。 */
  uploadSyncFromFile: async (
    file: File,
    meta: { categoryId: string; description: string; tags: string[] },
  ): Promise<FileEntry> => {
    const token = getHttpAccessToken();
    const fd = new FormData();
    fd.append("file", file);
    fd.append("category_id", meta.categoryId);
    fd.append("description", meta.description);
    fd.append("tags", JSON.stringify(meta.tags));
    const result = await apiFetch("/api/v1/files", {
      method: "POST",
      ...(token ? { headers: { Authorization: `Bearer ${token}` } } : {}),
      body: fd,
    });
    if (result.isErr()) {
      throw new Error(`上传失败 ${result.error.message}`);
    }
    const res = result.value;
    if (!res.ok) throw new Error(`上传失败 ${res.status}`);
    const b = (await res.json())["data"] as BackendFile;
    return mapFile(b);
  },
};
