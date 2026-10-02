import { fileLibraryApi } from "~/lib/api";

/** Download an approved file through the backend's signed URL or authenticated body. */
export async function downloadFileContent(
  fileId: string,
  originalName: string,
): Promise<void> {
  const info = await fileLibraryApi.getDownloadUrl(fileId);
  if (info.kind === "presigned") {
    window.location.assign(info.url);
    return;
  }

  const blob = await fileLibraryApi.getContentBlob(fileId);
  const blobUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = originalName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Some browsers have not started reading the blob immediately after click.
  window.setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
}
