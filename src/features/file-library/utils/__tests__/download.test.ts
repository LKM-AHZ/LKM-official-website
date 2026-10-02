import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fileLibraryApi } from "~/lib/api";
import { downloadFileContent } from "../download";

vi.mock("~/lib/api", () => ({
  fileLibraryApi: {
    getDownloadUrl: vi.fn(),
    getContentBlob: vi.fn(),
  },
}));

describe("downloadFileContent", () => {
  const getDownloadUrl = vi.mocked(fileLibraryApi.getDownloadUrl);
  const getContentBlob = vi.mocked(fileLibraryApi.getContentBlob);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("uses the signed URL without requesting the file body", async () => {
    const assign = vi.fn();
    vi.stubGlobal("window", { location: { assign } });
    getDownloadUrl.mockResolvedValue({
      kind: "presigned",
      url: "https://files.example.test/signed",
      expiresIn: 60,
    });

    await downloadFileContent("file-1", "paper.pdf");

    expect(assign).toHaveBeenCalledWith("https://files.example.test/signed");
    expect(getContentBlob).not.toHaveBeenCalled();
  });

  it("downloads authenticated file bytes with the original filename", async () => {
    const click = vi.fn();
    const remove = vi.fn();
    const appendChild = vi.fn();
    const createObjectURL = vi.fn(() => "blob:file-2");
    const revokeObjectURL = vi.fn();
    const setTimeout = vi.fn((callback: () => void) => callback());
    const link = { href: "", download: "", click, remove };
    vi.stubGlobal("window", { setTimeout });
    vi.stubGlobal("document", {
      createElement: vi.fn(() => link),
      body: { appendChild },
    });
    vi.stubGlobal("URL", { createObjectURL, revokeObjectURL });
    getDownloadUrl.mockResolvedValue({
      kind: "backend",
      url: "/api/v1/files/file-2/content",
      expiresIn: 0,
    });
    const blob = new Blob(["file bytes"]);
    getContentBlob.mockResolvedValue(blob);

    await downloadFileContent("file-2", "论文.pdf");

    expect(getContentBlob).toHaveBeenCalledWith("file-2");
    expect(createObjectURL).toHaveBeenCalledWith(blob);
    expect(link.href).toBe("blob:file-2");
    expect(link.download).toBe("论文.pdf");
    expect(appendChild).toHaveBeenCalledWith(link);
    expect(click).toHaveBeenCalledOnce();
    expect(remove).toHaveBeenCalledOnce();
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:file-2");
  });
});
