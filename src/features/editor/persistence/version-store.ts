import type { DocumentData, VersionEntry } from "../engine/types";
import { ok, err } from "neverthrow";
import type { Result } from "neverthrow";
import { AppError } from "./document-store";
import { t } from "~/lib/i18n";

const MAX_VERSIONS = 50;

function getKey(docId: string): string {
  return `lkm-editor-versions-${docId}`;
}

type VersionsRead = { ok: true; versions: VersionEntry[] } | { ok: false };

/**
 * 读取版本历史。必须能区分「确实没有历史」与「读不出来」：
 * 把读取失败当成空历史，saveVersion 就会只写入新条目、静默抹掉整段历史。
 */
function readVersions(docId: string): VersionsRead {
  try {
    const raw = localStorage.getItem(getKey(docId));
    if (!raw) return { ok: true, versions: [] };
    const parsed: unknown = JSON.parse(raw);
    // 非数组（被外部写坏）同样视为读取失败，顺带避免 getVersion 里 .find 抛 TypeError
    if (!Array.isArray(parsed)) return { ok: false };
    return { ok: true, versions: parsed as VersionEntry[] };
  } catch (err) {
    console.warn("[version-store] 读取版本失败:", err);
    return { ok: false };
  }
}

export function getVersions(docId: string): VersionEntry[] {
  const read = readVersions(docId);
  return read.ok ? read.versions : [];
}

export function saveVersion(
  docId: string,
  doc: DocumentData,
  message = "",
): Result<void, AppError> {
  const read = readVersions(docId);
  if (!read.ok) {
    // 读不出旧历史时中止写入，否则会以「只有一条」覆盖掉整段历史
    return err(
      new AppError(
        "VERSION_READ_FAILED",
        t("editor.persistence.saveVersionFailed"),
      ),
    );
  }
  try {
    const versions = read.versions;
    const entry: VersionEntry = {
      version: doc.version,
      contentMdx: doc.contentMdx,
      editorJson: doc.editorJson ?? {},
      message:
        message ||
        t("editor.persistence.versionMessage", { version: doc.version }),
      createdAt: new Date().toISOString(),
    };

    // 同一 doc.version 重复保存（写失败后重试、或版本号没被推进）必须先删旧条目：
    // getVersion 只取第一个匹配项，留着旧条目会让「恢复版本」拿到过期的那份内容
    const existingIndex = versions.findIndex((v) => v.version === doc.version);
    if (existingIndex !== -1) versions.splice(existingIndex, 1);

    versions.unshift(entry);

    if (versions.length > MAX_VERSIONS) {
      // 截断会丢历史：留一条痕迹，否则用户与排查者都无从得知更早的版本已被丢弃
      console.warn(
        `[version-store] 版本数超过上限 ${MAX_VERSIONS}，丢弃最旧版本`,
      );
      versions.length = MAX_VERSIONS;
    }

    localStorage.setItem(getKey(docId), JSON.stringify(versions));
    return ok(undefined);
  } catch (e) {
    console.warn("[version-store] 保存版本失败:", e);
    return err(
      new AppError(
        "VERSION_SAVE_FAILED",
        t("editor.persistence.saveVersionFailed"),
        e,
      ),
    );
  }
}

export function getVersion(
  docId: string,
  version: number,
): VersionEntry | undefined {
  return getVersions(docId).find((v) => v.version === version);
}

export function clearVersions(docId: string): void {
  localStorage.removeItem(getKey(docId));
}
