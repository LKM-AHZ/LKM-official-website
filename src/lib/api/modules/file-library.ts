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
  uploaderId?: string;
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
  documentCode?: string | null;
  classification?: "public" | "internal" | "confidential";
  projectId?: string | null;
  version?: number;
  rootFileId?: string | null;
  archiveState?: string;
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
  document_code?: string | null;
  classification?: "public" | "internal" | "confidential";
  project_id?: string | null;
  version?: number;
  root_file_id?: string | null;
  archive_state?: string;
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
    uploaderId: f.uploader_id,
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
    documentCode: f.document_code ?? null,
    classification: f.classification ?? "public",
    projectId: f.project_id ?? null,
    version: f.version ?? 1,
    rootFileId: f.root_file_id ?? null,
    archiveState: f.archive_state ?? "active",
  };
}

export const fileLibraryApi = {
  getUploadProjects: async (): Promise<{ id: string; title: string }[]> => {
    const res = await get<{ id: string; title: string }[]>(
      "/api/v1/files/upload-projects",
    );
    return res.isErr() ? [] : res.value;
  },
  searchFiles: async (query: string): Promise<FileEntry[]> => {
    const hits = await get<PaginatedResponse<{ id: string }>>(
      "/api/v1/search",
      {
        q: query,
        content_type: "library_file",
        limit: 100,
      },
    );
    if (hits.isErr()) return [];
    const files = await Promise.all(
      (hits.value.items ?? []).map((hit) => fileLibraryApi.getFile(hit.id)),
    );
    return files.filter((file): file is FileEntry => file !== null);
  },
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

  getVersions: async (id: string): Promise<FileEntry[]> => {
    const res = await get<BackendFile[]>(`/api/v1/files/${id}/versions`);
    if (res.isErr()) return [];
    return (res.value ?? []).map(mapFile);
  },

  getDownloadUrl: async (id: string): Promise<DownloadUrlInfo> => {
    // 下载地址需要 Bearer 权限；显式附加 token 以保持与流式下载一致。
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

  getPreviewBlob: async (id: string): Promise<Blob> => {
    const token = getHttpAccessToken();
    const result = await apiFetch(`/api/v1/files/${id}/preview`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (result.isErr()) throw new Error(`预览失败 ${result.error.message}`);
    if (!result.value.ok) throw new Error(`预览失败 ${result.value.status}`);
    return result.value.blob();
  },

  // 私有文件预览需要 Bearer 头，因此页面用 getPreviewBlob + object URL 展示。

  // ── 上传（Phase 2-B）──
  // 上传链路需要 Bearer 头；此处显式附加 token。
  // upload-init 只回元数据，不发文件字节：

  /** 初始化上传：后端判定 S3→direct（返 presigned_url, 需后续 confirm）或 Local→sync（无 presign, 走 multipart 回退）。 */
  uploadInit: async (info: {
    originalName: string;
    mimeType: string;
    categoryId: string;
    description: string;
    tags: string[];
    classification?: "public" | "internal" | "confidential";
    projectId?: string | null;
    versionOf?: string | null;
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
        classification: info.classification ?? "public",
        project_id: info.projectId || null,
        version_of: info.versionOf || null,
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
    meta: {
      categoryId: string;
      description: string;
      tags: string[];
      classification?: "public" | "internal" | "confidential";
      projectId?: string | null;
    },
  ): Promise<FileEntry> => {
    const token = getHttpAccessToken();
    const fd = new FormData();
    fd.append("file", file);
    fd.append("category_id", meta.categoryId);
    fd.append("description", meta.description);
    fd.append("tags", JSON.stringify(meta.tags));
    fd.append("classification", meta.classification ?? "public");
    if (meta.projectId) fd.append("project_id", meta.projectId);
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

  uploadVersion: async (id: string, file: File): Promise<FileEntry> => {
    const token = getHttpAccessToken();
    const fd = new FormData();
    fd.append("file", file);
    const result = await apiFetch(`/api/v1/files/${id}/versions`, {
      method: "POST",
      ...(token ? { headers: { Authorization: `Bearer ${token}` } } : {}),
      body: fd,
    });
    if (result.isErr()) throw new Error(`上传版本失败 ${result.error.message}`);
    if (!result.value.ok)
      throw new Error(`上传版本失败 ${result.value.status}`);
    return mapFile((await result.value.json())["data"] as BackendFile);
  },
};
